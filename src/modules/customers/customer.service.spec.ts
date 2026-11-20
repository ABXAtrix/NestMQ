import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { CustomerRepository } from './customer.repository';
import { RedisService } from '../../common/redis/redis.service';
import { RabbitMQService } from '../../common/rabbitmq/rabbitmq.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  INDICATION_EXCHANGE,
  INDICATION_ROUTING_KEY,
} from './schemas/customer.schema';

describe('CustomerService', () => {
  let service: CustomerService;
  let repository: CustomerRepository;
  let redisService: RedisService;
  let rabbitMQService: RabbitMQService;

  const mockCustomerRepository = {
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockRedisService = {
    exists: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockRabbitMQService = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: CustomerRepository,
          useValue: mockCustomerRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    repository = module.get<CustomerRepository>(CustomerRepository);
    redisService = module.get<RedisService>(RedisService);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer without parent_customer_id', async () => {
      const dto: CreateCustomerDto = {
        name: 'Carlos Oliveira',
        email: 'carlos@example.com',
      };

      const docMock = {
        _id: '64b8f0c2e1f2a3b4c5d6e7f8',
        name: dto.name,
        email: dto.email,
        toJSON: jest.fn().mockReturnValue({
          _id: '64b8f0c2e1f2a3b4c5d6e7f8',
          name: dto.name,
          email: dto.email,
        }),
      };

      mockCustomerRepository.create.mockResolvedValue(docMock);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(redisService.set).toHaveBeenCalledWith(
        'customer:64b8f0c2e1f2a3b4c5d6e7f8',
        JSON.stringify(docMock.toJSON()),
      );
      expect(rabbitMQService.publish).not.toHaveBeenCalled();
      expect(result).toEqual(docMock.toJSON());
    });

    it('should create a customer with parent_customer_id and publish indication event', async () => {
      const parentId = '64b8f0c2e1f2a3b4c5d6e700';
      const dto: CreateCustomerDto = {
        name: 'Ana Costa',
        email: 'ana@example.com',
        parent_customer_id: parentId,
      };

      // Parent exists in redis cache
      mockRedisService.exists.mockResolvedValue(true);

      const docMock = {
        _id: '64b8f0c2e1f2a3b4c5d6e7f9',
        name: dto.name,
        email: dto.email,
        parent_customer_id: parentId,
        toJSON: jest.fn().mockReturnValue({
          _id: '64b8f0c2e1f2a3b4c5d6e7f9',
          name: dto.name,
          email: dto.email,
          parent_customer_id: parentId,
        }),
      };

      mockCustomerRepository.create.mockResolvedValue(docMock);

      const result = await service.create(dto);

      expect(redisService.exists).toHaveBeenCalledWith(`customer:${parentId}`);
      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(rabbitMQService.publish).toHaveBeenCalledWith(
        INDICATION_EXCHANGE,
        INDICATION_ROUTING_KEY,
        {
          customer_id: '64b8f0c2e1f2a3b4c5d6e7f9',
          parent_customer_id: parentId,
        },
      );
      expect(result).toEqual(docMock.toJSON());
    });

    it('should find parent in repository and cache it when not in redis', async () => {
      const parentId = '64b8f0c2e1f2a3b4c5d6e700';
      const dto: CreateCustomerDto = {
        name: 'Ana Costa',
        email: 'ana@example.com',
        parent_customer_id: parentId,
      };

      // Parent not in redis cache, but found in mongo
      mockRedisService.exists.mockResolvedValue(false);
      const parentDoc = { _id: parentId, name: 'Parent Customer' };
      mockCustomerRepository.findById.mockResolvedValue(parentDoc);

      const docMock = {
        _id: '64b8f0c2e1f2a3b4c5d6e7f9',
        toJSON: jest.fn().mockReturnValue({ _id: '64b8f0c2e1f2a3b4c5d6e7f9' }),
      };
      mockCustomerRepository.create.mockResolvedValue(docMock);

      await service.create(dto);

      expect(repository.findById).toHaveBeenCalledWith(parentId);
      expect(redisService.set).toHaveBeenCalledWith(
        `customer:${parentId}`,
        JSON.stringify(parentDoc),
      );
    });

    it('should throw BadRequestException if parent customer does not exist', async () => {
      const parentId = 'non-existent-parent';
      const dto: CreateCustomerDto = {
        name: 'Ana Costa',
        email: 'ana@example.com',
        parent_customer_id: parentId,
      };

      mockRedisService.exists.mockResolvedValue(false);
      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if duplicate key error code 11000 occurs', async () => {
      const dto: CreateCustomerDto = {
        name: 'Duplicate Email',
        email: 'duplicate@example.com',
      };

      const duplicateError = {
        code: 11000,
        message: 'E11000 duplicate key error',
      };
      mockCustomerRepository.create.mockRejectedValue(duplicateError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should rethrow unknown errors that are not duplicate key', async () => {
      const dto: CreateCustomerDto = {
        name: 'Error Name',
        email: 'error@example.com',
      };

      const genericError = new Error('Database connection failed');
      mockCustomerRepository.create.mockRejectedValue(genericError);

      await expect(service.create(dto)).rejects.toThrow(genericError);
    });
  });
});
