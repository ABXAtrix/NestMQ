import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report, ReportSchema } from './schemas/report.schema';
import { ReportsRepository } from './reports.repository';
import { RedisService } from '../../common/redis/redis.service';
import { RabbitMQService } from '../../common/rabbitmq/rabbitmq.service';
import { IndicationConsumer } from './consumers/indication.consumer';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsRepository,
    RedisService,
    RabbitMQService,
    IndicationConsumer,
  ],
  exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
