import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('NestMQ API')
    .setDescription('API de clientes e relatórios com RabbitMQ e Redis')
    .setVersion('1.0')
    .addTag('customers', 'Gerenciamento de clientes')
    .addTag('Reports', 'Relatórios de indicações')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;

  await app.listen(port);

  logger.log(
    JSON.stringify({
      event: 'application_started',
      port,
      apiDocs: `http://localhost:${port}/api`,
    }),
  );
}
void bootstrap();
