import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersController } from './customers.controller';
import { CustomerService } from './customer.service';
import { CustomerRepository } from './customer.repository';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { RabbitMQService } from '../../common/rabbitmq/rabbitmq.service';
import { RedisService } from '../../common/redis/redis.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [CustomersController],
  providers: [
    CustomerService,
    CustomerRepository,
    RabbitMQService,
    RedisService,
  ],
  exports: [CustomerService, CustomerRepository],
})
export class CustomerModule {}
