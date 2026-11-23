import { registerAs } from '@nestjs/config';

export const rabbitmqConfig = registerAs('rabbitmq', () => ({
  url: process.env.RABBITMQ_URL ?? 'amqp://guest:guest@localhost:5672',
  exchange: process.env.RABBITMQ_EXCHANGE ?? 'customer.indication.created',
  routingKey:
    process.env.RABBITMQ_ROUTING_KEY ?? 'customer.indication.created',
  queue: process.env.RABBITMQ_QUEUE ?? 'customers_queue',
}));

export default rabbitmqConfig;
