import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from '../../../common/rabbitmq/rabbitmq.service';
import { ReportsService } from '../reports.service';
import { IndicationEvent } from '../../customers/schemas/customer.schema';

@Injectable()
export class IndicationConsumer implements OnModuleInit {
  private readonly logger = new Logger(IndicationConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly reportsService: ReportsService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const queue =
      this.configService.get<string>('rabbitmq.queue') ?? 'customers_queue';
    const exchange =
      this.configService.get<string>('rabbitmq.exchange') ??
      'customer.indication.created';
    const routingKey =
      this.configService.get<string>('rabbitmq.routingKey') ??
      'customer.indication.created';

    await this.rabbitMQService.consume(
      queue,
      exchange,
      routingKey,
      async (message) => {
        try {
          const content = JSON.parse(
            message.content.toString(),
          ) as IndicationEvent;
          this.logger.log(
            JSON.stringify({
              event: 'indication_message_received',
              customerId: content.customer_id,
              parentCustomerId: content.parent_customer_id,
            }),
          );
          await this.reportsService.registerIndication(content);
        } catch (error) {
          this.logger.error(
            JSON.stringify({
              event: 'indication_message_error',
              error: (error as Error).message,
            }),
          );
          throw error;
        }
      },
    );
  }
}
