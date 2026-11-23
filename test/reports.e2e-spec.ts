import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ReportsRepository } from '../src/modules/reports/reports.repository';
import { RedisService } from '../src/common/redis/redis.service';
import { RabbitMQService } from '../src/common/rabbitmq/rabbitmq.service';

describe('ReportsController (e2e)', () => {
  let app: INestApplication;

  const mockReportsRepository = {
    incrementTotal: jest.fn(),
    findAll: jest.fn(),
  };

  const mockRedisService = {
    exists: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  const mockRabbitMQService = {
    publish: jest.fn(),
    consume: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ReportsRepository)
      .useValue(mockReportsRepository)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(RabbitMQService)
      .useValue(mockRabbitMQService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /reports', () => {
    it('should return 200 and list of reports', async () => {
      const mockReports = [
        {
          customer_id: '64b8f0c2e1f2a3b4c5d6e700',
          total_indications: 3,
        },
        {
          customer_id: '64b8f0c2e1f2a3b4c5d6e701',
          total_indications: 1,
        },
      ];
      mockReportsRepository.findAll.mockResolvedValue(mockReports);

      const response = await request(app.getHttpServer())
        .get('/reports')
        .expect(200);

      expect(response.body).toEqual(mockReports);
      expect(response.headers['x-request-id']).toBeDefined();
    });
  });
});
