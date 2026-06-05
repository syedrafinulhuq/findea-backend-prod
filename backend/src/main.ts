import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(helmet({
    contentSecurityPolicy: false,
    hsts: false,                      // no HSTS over plain HTTP — would cause browsers to upgrade sub-resources to HTTPS
    crossOriginOpenerPolicy: false,   // prevents COOP warning noise on non-HTTPS origins
  }));
  app.use(compression());

  const rawOrigins = process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001';
  const allowedOrigins = rawOrigins.split(',').map(o => o.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });

  app.setGlobalPrefix('api/');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  const config = new DocumentBuilder()
    .setTitle('Findea API')
    .setDescription('Backend API for Findea frontend pages')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  app.enableShutdownHooks();
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
