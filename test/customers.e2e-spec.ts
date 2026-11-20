import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CustomerRepository } from '../src/modules/customers/customer.repository';
import { RedisService } from '../src/common/redis/redis.service';
import { RabbitMQService } from '../src/common/rabbitmq/rabbitmq.service';

describe('CustomersController (e2e)', () => {
  let app: INestApplication;

  const mockCustomerRepository = {
    create: jest.fn(),
    findById: jest.fn(),
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
      .overrideProvider(CustomerRepository)
      .useValue(mockCustomerRepository)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(RabbitMQService)
      .useValue(mockRabbitMQService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /customers', () => {
    it('should return 400 when body is invalid (missing fields)', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('name'),
          expect.stringContaining('email'),
        ]),
      });
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'João Silva',
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'Validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('email must be an email'),
        ]),
      });
    });

    it('should return 201 and created customer without parent', async () => {
      const customerData = {
        name: 'Maria Santos',
        email: 'maria.santos@example.com',
      };
      const savedDoc = {
        _id: '64b8f0c2e1f2a3b4c5d6e7f8',
        ...customerData,
        type: 'NORMAL',
        parent_customer_id: null,
        toJSON: () => ({
          _id: '64b8f0c2e1f2a3b4c5d6e7f8',
          ...customerData,
          type: 'NORMAL',
          parent_customer_id: null,
        }),
      };

      mockCustomerRepository.create.mockResolvedValue(savedDoc);

      const response = await request(app.getHttpServer())
        .post('/customers')
        .send(customerData)
        .expect(201);

      expect(response.body).toEqual({
        _id: '64b8f0c2e1f2a3b4c5d6e7f8',
        name: customerData.name,
        email: customerData.email,
        type: 'NORMAL',
        parent_customer_id: null,
      });
      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should return 400 when parent_customer_id is a valid MongoId but does not exist in DB', async () => {
      const nonExistentParentId = '64b8f0c2e1f2a3b4c5d6e799';
      mockRedisService.exists.mockResolvedValue(false);
      mockCustomerRepository.findById.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Lucas Pereira',
          email: 'lucas@example.com',
          parent_customer_id: nonExistentParentId,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'parent customer not found',
      });
    });

    it('should return 409 when email already exists', async () => {
      mockCustomerRepository.create.mockRejectedValue({
        code: 11000,
        message: 'Duplicate key',
      });

      const response = await request(app.getHttpServer())
        .post('/customers')
        .send({
          name: 'Email Duplicado',
          email: 'duplicado@example.com',
        })
        .expect(409);

      expect(response.body).toMatchObject({
        statusCode: 409,
        message: 'email already exists',
      });
    });
  });
});
