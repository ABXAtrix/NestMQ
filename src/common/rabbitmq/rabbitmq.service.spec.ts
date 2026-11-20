import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';
import { ConsumeMessage } from 'amqplib';

describe('RabbitMQService', () => {
  let service: RabbitMQService;

  const mockChannel = {
    publish: jest.fn(),
    assertExchange: jest.fn().mockResolvedValue({}),
    assertQueue: jest.fn().mockResolvedValue({}),
    bindQueue: jest.fn().mockResolvedValue({}),
    consume: jest.fn(),
    ack: jest.fn(),
    nack: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const mockConnection = {
    createChannel: jest.fn().mockResolvedValue(mockChannel),
    close: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        'rabbitmq.url': 'amqp://localhost',
        'rabbitmq.exchange': 'test.exchange',
      };
      return map[key];
    }),
  } as unknown as ConfigService;

  beforeEach(() => {
    service = new RabbitMQService(mockConfigService);
    (service as unknown as { channel: typeof mockChannel }).channel =
      mockChannel;
    (service as unknown as { connection: typeof mockConnection }).connection =
      mockConnection;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('should publish JSON message to specified exchange and routingKey', async () => {
      const message = { event: 'test', id: '123' };

      await service.publish('test.exchange', 'test.key', message);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        'test.exchange',
        'test.key',
        Buffer.from(JSON.stringify(message)),
        { persistent: true, contentType: 'application/json' },
      );
    });

    it('should not throw if channel is not ready', async () => {
      (service as unknown as { channel: undefined }).channel = undefined;

      await expect(
        service.publish('test.exchange', 'test.key', {}),
      ).resolves.toBeUndefined();
    });
  });

  describe('consume', () => {
    it('should assert queue, bind queue, and invoke onMessage on delivery', async () => {
      let consumeCallback:
        ((msg: ConsumeMessage | null) => Promise<void>) | undefined;

      mockChannel.consume.mockImplementation((_queue, cb) => {
        consumeCallback = cb;
      });

      const onMessageMock = jest.fn().mockResolvedValue(undefined);

      await service.consume(
        'test-queue',
        'test-exchange',
        'test-routing',
        onMessageMock,
      );

      expect(mockChannel.assertQueue).toHaveBeenCalledWith('test-queue', {
        durable: true,
      });
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'test-queue',
        'test-exchange',
        'test-routing',
      );
      expect(mockChannel.consume).toHaveBeenCalled();

      // Simulate incoming message
      const mockMsg = {
        content: Buffer.from(JSON.stringify({ hello: 'world' })),
      } as ConsumeMessage;

      await consumeCallback!(mockMsg);

      expect(onMessageMock).toHaveBeenCalledWith(mockMsg);
      expect(mockChannel.ack).toHaveBeenCalledWith(mockMsg);
    });

    it('should nack message when onMessage throws an error', async () => {
      let consumeCallback:
        ((msg: ConsumeMessage | null) => Promise<void>) | undefined;

      mockChannel.consume.mockImplementation((_queue, cb) => {
        consumeCallback = cb;
      });

      const onMessageMock = jest.fn().mockRejectedValue(new Error('fail'));

      await service.consume(
        'test-queue',
        'test-exchange',
        'test-routing',
        onMessageMock,
      );

      const mockMsg = { content: Buffer.from('data') } as ConsumeMessage;

      await consumeCallback!(mockMsg);

      expect(mockChannel.nack).toHaveBeenCalledWith(mockMsg, false, false);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close channel and connection', async () => {
      await service.onModuleDestroy();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
});
