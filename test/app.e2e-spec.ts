import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { RedisService } from '../src/common/redis/redis.service';
import { RabbitMQService } from '../src/common/rabbitmq/rabbitmq.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

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

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/non-existent (GET) should trigger global exception filter and return 404', async () => {
    const response = await request(app.getHttpServer())
      .get('/non-existent-route')
      .expect(404);

    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/non-existent-route',
      method: 'GET',
      message: 'Cannot GET /non-existent-route',
    });
    expect(response.body.timestamp).toBeDefined();
    expect(response.headers['x-request-id']).toBeDefined();
  });
});
