import { ConfigService } from '@nestjs/config';

export interface WebhookConfig {
  registrationUrl: string;
  timeoutMs: number;
  retryMaxAttempts: number;
  retryBaseDelayMs: number;
  enabled: boolean;
}

export const getWebhookConfig = (configService: ConfigService): WebhookConfig => {
  return {
    registrationUrl: configService.get<string>('WEBHOOK_REGISTRATION_URL', ''),
    timeoutMs: configService.get<number>('WEBHOOK_TIMEOUT_MS', 30000),
    retryMaxAttempts: configService.get<number>('WEBHOOK_RETRY_MAX_ATTEMPTS', 6),
    retryBaseDelayMs: configService.get<number>('WEBHOOK_RETRY_BASE_DELAY_MS', 60000),
    enabled: configService.get<boolean>('WEBHOOK_ENABLED', true),
  };
};

// Default environment variables documentation
export const WEBHOOK_ENV_VARS = {
  WEBHOOK_REGISTRATION_URL: 'https://external-service.com/api/registrations',
  WEBHOOK_TIMEOUT_MS: '30000',
  WEBHOOK_RETRY_MAX_ATTEMPTS: '6',
  WEBHOOK_RETRY_BASE_DELAY_MS: '60000',
  WEBHOOK_ENABLED: 'true',
};