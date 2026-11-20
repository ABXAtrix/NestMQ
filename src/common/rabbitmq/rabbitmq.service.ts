import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  constructor(
    @Optional()
    private readonly configService?: ConfigService,
  ) {}

  async onModuleInit() {
    const url =
      this.configService?.get<string>('rabbitmq.url') ??
      process.env.RABBITMQ_URL ??
      'amqp://guest:guest@localhost:5672';

    try {
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      const exchange =
        this.configService?.get<string>('rabbitmq.exchange') ??
        process.env.RABBITMQ_EXCHANGE ??
        'indication.exchange';

      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      this.logger.log('Connected to RabbitMQ and asserted exchange');
    } catch (error) {
      this.logger.warn(
        `Could not connect to RabbitMQ: ${(error as Error).message}`,
      );
    }
  }

  publish(
    exchange: string,
    routingKey: string,
    message: unknown,
  ): Promise<void> {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not ready, message not published');
      return Promise.resolve();
    }

    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true, contentType: 'application/json' },
    );

    this.logger.log(
      `Message published to exchange "${exchange}" with routing key "${routingKey}"`,
    );
    return Promise.resolve();
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {
      // Ignored during shutdown
    }
  }
}
