import { Injectable, Logger } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { IndicationEvent } from '../customers/schemas/customer.schema';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly redisService: RedisService,
  ) {}

  async registerIndication(event: IndicationEvent) {
    const first = await this.redisService.get(`customer:${event.customer_id}`);
    if (first) {
      this.logger.log(
        JSON.stringify({
          event: 'duplicate_indication',
          customerId: event.customer_id,
        }),
      );
      return;
    }

    await this.redisService.set(`customer:${event.customer_id}`, '1', 86400);

    try {
      await this.reportsRepository.incrementTotal(event.parent_customer_id);
    } catch (error) {
      await this.redisService.del(`customer:${event.customer_id}`);
      throw error;
    }

    this.logger.log(
      JSON.stringify({
        event: 'report_updated',
        customerId: event.parent_customer_id,
      }),
    );
  }

  findAll() {
    return this.reportsRepository.findAll();
  }
}
