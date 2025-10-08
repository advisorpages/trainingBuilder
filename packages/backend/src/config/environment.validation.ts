import { plainToClass, Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsNumber, Min, Max, validateSync, IsNotEmpty } from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  PORT = 3001;

  // Database Configuration
  @IsString()
  @IsNotEmpty()
  DATABASE_HOST: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  DATABASE_PORT: number;

  @IsString()
  @IsNotEmpty()
  DATABASE_NAME: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_USER: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_PASSWORD: string;

  // JWT Configuration
  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  // QR Code Configuration
  @IsString()
  @IsOptional()
  QR_CLOUD_API_URL = 'https://qrcodes.at/api';

  @IsString()
  @IsOptional()
  QR_CLOUD_API_KEY: string;

  @IsString()
  @IsOptional()
  QR_CODE_ERROR_CORRECTION = 'M';

  @IsString()
  @IsOptional()
  QR_CODE_SIZE = '300x300';

  @IsString()
  @IsOptional()
  QR_CODE_FORMAT = 'PNG';

  // Optional Email Configuration
  @IsString()
  @IsOptional()
  EMAIL_HOST: string;

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  EMAIL_PORT: number;

  @IsString()
  @IsOptional()
  EMAIL_USER: string;

  @IsString()
  @IsOptional()
  EMAIL_PASSWORD: string;

  // RAG Integration Configuration
  @IsString()
  @IsOptional()
  RAG_API_URL: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  RAG_SIMILARITY_WEIGHT = 0.5;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  RAG_RECENCY_WEIGHT = 0.2;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  RAG_CATEGORY_WEIGHT = 0.2;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Transform(({ value }) => parseFloat(value))
  @IsOptional()
  RAG_SIMILARITY_THRESHOLD = 0.65;

  @IsNumber()
  @Min(1000)
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  RAG_TIMEOUT_MS = 10000;

  @IsNumber()
  @Min(0)
  @Max(5)
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  RAG_RETRY_ATTEMPTS = 1;

  // Feature Flags for Session Builder v2
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  ENABLE_VARIANT_GENERATION_V2 = false;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  LOG_VARIANT_SELECTIONS = true;

  @IsNumber()
  @Min(0)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  VARIANT_GENERATION_ROLLOUT_PERCENTAGE = 0;

  // Analytics configuration
  @IsString()
  @IsOptional()
  GOOGLE_ANALYTICS_ID?: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map(error =>
      `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`
    );
    throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
  }

  // Additional security validations
  if (validatedConfig.NODE_ENV === Environment.Production) {
    if (validatedConfig.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long in production');
    }

    if (validatedConfig.JWT_SECRET.includes('dev') ||
        validatedConfig.JWT_SECRET.includes('test') ||
        validatedConfig.JWT_SECRET.includes('example')) {
      throw new Error('JWT_SECRET appears to be a development placeholder in production');
    }
  }

  return validatedConfig;
}
