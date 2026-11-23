import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  DATABASE_URI: string = 'mongodb://localhost:27017/nest-mq';

  @IsString()
  @IsOptional()
  MONGODB_URI?: string;

  @IsString()
  @IsOptional()
  RABBITMQ_URL: string = 'amqp://guest:guest@localhost:5672';

  @IsString()
  @IsOptional()
  RABBITMQ_EXCHANGE: string = 'customer.indication.created';

  @IsString()
  @IsOptional()
  RABBITMQ_ROUTING_KEY: string = 'customer.indication.created';

  @IsString()
  @IsOptional()
  RABBITMQ_QUEUE: string = 'customers_queue';

  @IsString()
  @IsOptional()
  REDIS_URL: string = 'redis://localhost:6379';

  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number = 6379;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation error: ${errors.toString()}`);
  }

  return validatedConfig;
}
