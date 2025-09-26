import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createLoggerConfig } from './config/logger.config';

if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = require('crypto');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: createLoggerConfig(process.env.NODE_ENV),
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: ['http://localhost:3002', 'http://frontend:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Leadership Training API')
    .setDescription('Rebooted API centered on the AI Session Builder')
    .setVersion('2.0.0-alpha')
    .addTag('auth', 'Authentication endpoints')
    .addTag('sessions', 'Session management')
    .addTag('topics', 'Topic management')
    .addTag('incentives', 'Incentive management')
    .addTag('landing-pages', 'Landing page preview endpoints')
    .addTag('trainers', 'Trainer management')
    .addTag('ai', 'AI orchestration endpoints')
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
}

bootstrap();
