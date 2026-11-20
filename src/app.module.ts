import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig, rabbitmqConfig, redisConfig } from './config';
import { CustomerModule } from './modules/customers/customer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, rabbitmqConfig, redisConfig],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('database.uri') ??
          process.env.MONGODB_URI ??
          process.env.DATABASE_URI,
      }),
    }),
    CustomerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
