import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(
    @Optional()
    private readonly configService?: ConfigService,
  ) {}

  onModuleInit() {
    const url =
      this.configService?.get<string>('redis.url') ??
      process.env.REDIS_URL ??
      'redis://localhost:6379';

    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.client
      .connect()
      .then(() => {
        this.logger.log('Connected to Redis');
      })
      .catch((err: Error) => {
        this.logger.warn(`Could not connect to Redis: ${err.message}`);
      });
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
