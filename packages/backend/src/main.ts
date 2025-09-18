import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// Add crypto polyfill for NestJS schedule module
if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = require('crypto');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration service
  const configService = app.get(ConfigService);

  // Enable CORS for frontend communication
  app.enableCors({
    origin: ['http://localhost:3000', 'http://frontend:3000'],
    credentials: true,
  });

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Set global API prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Backend API server running on port ${port}`);
  console.log(`📚 API endpoints available at http://localhost:${port}/api`);
}

bootstrap();