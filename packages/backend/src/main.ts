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

  const staticAllowedOrigins = [
    'http://localhost:3000',      // Local development (hybrid mode)
    'http://localhost:3002',      // Docker frontend
    'http://localhost:3005',      // Alternative local dev port
    'http://localhost:5173',      // Vite dev server default port
    'http://localhost:5174',      // Alternate Vite dev port
    'http://127.0.0.1:3000',      // Loopback alias
    'http://127.0.0.1:3002',      // Loopback alias
    'http://127.0.0.1:3005',      // Loopback alias
    'http://127.0.0.1:5173',      // Loopback alias
    'http://127.0.0.1:5174',      // Loopback alias
    'http://0.0.0.0:3000',        // Host binding alias
    'http://0.0.0.0:5173',        // Host binding alias
    'http://frontend:3000',       // Docker network
  ];

  const envOrigins = configService.get<string>('CORS_ORIGIN');
  const configuredOrigins = envOrigins
    ? envOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];
  const allowedOrigins = Array.from(new Set([...staticAllowedOrigins, ...configuredOrigins]));

  const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }

    const isStaticMatch = allowedOrigins.includes(origin);
    const isLocalhostWildcard =
      process.env.NODE_ENV !== 'production' &&
      /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(origin);

    if (isStaticMatch || isLocalhostWildcard) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  };

  app.enableCors({
    origin: corsOrigin,
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
