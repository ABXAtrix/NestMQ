import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);

  publish(
    exchange: string,
    routingKey: string,
    message: unknown,
  ): Promise<void> {
    this.logger.log(
      `Publishing to exchange "${exchange}" with routing key "${routingKey}": ${JSON.stringify(message)}`,
    );
    return Promise.resolve();
  }
}
