import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IndicationConsumer } from './indication.consumer';
import { RabbitMQService } from '../../../common/rabbitmq/rabbitmq.service';
import { ReportsService } from '../reports.service';
import { ConsumeMessage } from 'amqplib';

describe('IndicationConsumer', () => {
  let consumer: IndicationConsumer;
  let rabbitMQService: RabbitMQService;
  let reportsService: ReportsService;

  const mockRabbitMQService = {
    consume: jest.fn(),
  };

  const mockReportsService = {
    registerIndication: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const configMap: Record<string, string> = {
        'rabbitmq.queue': 'customers_queue',
        'rabbitmq.exchange': 'customer.indication.created',
        'rabbitmq.routingKey': 'customer.indication.created',
      };
      return configMap[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndicationConsumer,
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
        {
          provide: ReportsService,
          useValue: mockReportsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    consumer = module.get<IndicationConsumer>(IndicationConsumer);
    rabbitMQService = module.get<RabbitMQService>(RabbitMQService);
    reportsService = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should subscribe to rabbitmq queue and process messages', async () => {
      let messageHandler: ((msg: ConsumeMessage) => Promise<void>) | undefined;

      mockRabbitMQService.consume.mockImplementation(
        (
          _queue,
          _exchange,
          _routingKey,
          handler: (msg: ConsumeMessage) => Promise<void>,
        ) => {
          messageHandler = handler;
          return Promise.resolve();
        },
      );

      await consumer.onModuleInit();

      expect(rabbitMQService.consume).toHaveBeenCalledWith(
        'customers_queue',
        'customer.indication.created',
        'customer.indication.created',
        expect.any(Function),
      );

      expect(messageHandler).toBeDefined();

      const eventPayload = {
        customer_id: '64b8f0c2e1f2a3b4c5d6e7f8',
        parent_customer_id: '64b8f0c2e1f2a3b4c5d6e700',
      };
      const mockMsg = {
        content: Buffer.from(JSON.stringify(eventPayload)),
      } as ConsumeMessage;

      mockReportsService.registerIndication.mockResolvedValue(undefined);

      await messageHandler!(mockMsg);

      expect(reportsService.registerIndication).toHaveBeenCalledWith(
        eventPayload,
      );
    });

    it('should rethrow error if message processing fails', async () => {
      let messageHandler: ((msg: ConsumeMessage) => Promise<void>) | undefined;

      mockRabbitMQService.consume.mockImplementation(
        (
          _queue,
          _exchange,
          _routingKey,
          handler: (msg: ConsumeMessage) => Promise<void>,
        ) => {
          messageHandler = handler;
          return Promise.resolve();
        },
      );

      await consumer.onModuleInit();

      const invalidMsg = {
        content: Buffer.from('invalid-json'),
      } as ConsumeMessage;

      await expect(messageHandler!(invalidMsg)).rejects.toThrow();
    });
  });
});
