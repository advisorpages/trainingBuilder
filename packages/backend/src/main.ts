import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLoggerConfig } from './config/logger.config';
import { DevSeederService } from './modules/dev/dev-seeder.service';

// Add crypto polyfill for NestJS schedule module
if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = require('crypto');
}

async function bootstrap() {
  // Create app with custom logger
  const app = await NestFactory.create(AppModule, {
    logger: createLoggerConfig(process.env.NODE_ENV),
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

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

  // Setup Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Leadership Training API')
    .setDescription('API documentation for the Leadership Training platform')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('sessions', 'Training session management')
    .addTag('incentives', 'Incentive management')
    .addTag('analytics', 'Analytics and reporting')
    .addTag('admin', 'Administrative endpoints')
    .addTag('public', 'Public endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT') || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Backend API server running on port ${port}`);
  logger.log(`📚 API endpoints available at http://localhost:${port}/api`);
  logger.log(`📖 API documentation available at http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health checks available at http://localhost:${port}/api/health`);
  logger.log(`📊 Metrics available at http://localhost:${port}/api/health/metrics`);

  // Seed development data
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  const forceSeed = configService.get('SEED_DEMO') === 'true';

  if (isDevelopment || forceSeed) {
    const devSeeder = app.get(DevSeederService);
    await devSeeder.seedDemo();
    logger.log('✅ Development seeding completed');
  }
}

bootstrap();