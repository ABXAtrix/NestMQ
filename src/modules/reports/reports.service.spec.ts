import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { RedisService } from '../../common/redis/redis.service';
import { IndicationEvent } from '../customers/schemas/customer.schema';

describe('ReportsService', () => {
  let service: ReportsService;
  let repository: ReportsRepository;
  let redisService: RedisService;

  const mockReportsRepository = {
    incrementTotal: jest.fn(),
    findAll: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: ReportsRepository,
          useValue: mockReportsRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    repository = module.get<ReportsRepository>(ReportsRepository);
    redisService = module.get<RedisService>(RedisService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerIndication', () => {
    const event: IndicationEvent = {
      customer_id: '64b8f0c2e1f2a3b4c5d6e7f8',
      parent_customer_id: '64b8f0c2e1f2a3b4c5d6e700',
    };

    it('should ignore duplicate indication and not increment total', async () => {
      mockRedisService.get.mockResolvedValue('1');

      await service.registerIndication(event);

      expect(redisService.get).toHaveBeenCalledWith(
        `indication:${event.customer_id}`,
      );
      expect(redisService.set).not.toHaveBeenCalled();
      expect(repository.incrementTotal).not.toHaveBeenCalled();
    });

    it('should register indication when not duplicate, set redis key, and increment total', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockReportsRepository.incrementTotal.mockResolvedValue({
        acknowledged: true,
      });

      await service.registerIndication(event);

      expect(redisService.get).toHaveBeenCalledWith(
        `indication:${event.customer_id}`,
      );
      expect(redisService.set).toHaveBeenCalledWith(
        `indication:${event.customer_id}`,
        '1',
        86400,
      );
      expect(repository.incrementTotal).toHaveBeenCalledWith(
        event.parent_customer_id,
      );
    });

    it('should rollback redis key and rethrow error if incrementTotal fails', async () => {
      mockRedisService.get.mockResolvedValue(null);
      const dbError = new Error('Database write error');
      mockReportsRepository.incrementTotal.mockRejectedValue(dbError);

      await expect(service.registerIndication(event)).rejects.toThrow(dbError);

      expect(redisService.del).toHaveBeenCalledWith(
        `indication:${event.customer_id}`,
      );
    });
  });

  describe('findAll', () => {
    it('should call reportsRepository.findAll and return reports', async () => {
      const mockReports = [
        { customerId: '64b8f0c2e1f2a3b4c5d6e700', totalIndications: 5 },
      ];
      mockReportsRepository.findAll.mockResolvedValue(mockReports);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockReports);
    });
  });
});
