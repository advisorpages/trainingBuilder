import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Registration, SyncStatus } from '../entities/registration.entity';

interface WebhookPayload {
  session_id: string;
  registration_id: string;
  name: string;
  email: string;
  phone?: string;
  referred_by?: string;
  session_details: {
    title: string;
    date: string;
    location?: string;
  };
  registration_timestamp: string;
}

interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  timeoutMs: number;
}

@Injectable()
export class WebhookSyncService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(WebhookSyncService.name);
  private readonly retryConfig: RetryConfig;
  private isShuttingDown = false;

  constructor(
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
    private configService: ConfigService,
  ) {
    this.retryConfig = {
      maxAttempts: this.configService.get<number>('WEBHOOK_RETRY_MAX_ATTEMPTS', 6),
      baseDelayMs: this.configService.get<number>('WEBHOOK_RETRY_BASE_DELAY_MS', 60000),
      timeoutMs: this.configService.get<number>('WEBHOOK_TIMEOUT_MS', 30000),
    };
  }

  onApplicationBootstrap() {
    this.logger.log('WebhookSyncService started');
    this.logger.log(`Retry config: ${JSON.stringify(this.retryConfig)}`);

    // Process any existing pending registrations on startup
    this.processPendingRegistrations().catch(error => {
      this.logger.error('Error processing pending registrations on startup', error);
    });
  }

  onApplicationShutdown() {
    this.isShuttingDown = true;
    this.logger.log('WebhookSyncService shutting down gracefully');
  }

  /**
   * Scheduled job to process pending webhook syncs
   * Runs every 30 seconds to check for pending registrations
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleScheduledSync() {
    if (this.isShuttingDown) {
      return;
    }

    try {
      await this.processPendingRegistrations();
    } catch (error) {
      this.logger.error('Error in scheduled webhook sync', error);
    }
  }

  /**
   * Process all registrations that need webhook sync
   */
  async processPendingRegistrations(): Promise<void> {
    const webhookUrl = this.configService.get<string>('WEBHOOK_REGISTRATION_URL');

    if (!webhookUrl) {
      this.logger.warn('WEBHOOK_REGISTRATION_URL not configured, skipping webhook sync');
      return;
    }

    try {
      // Find registrations that need syncing (pending status or ready for retry)
      const pendingRegistrations = await this.findRegistrationsForSync();

      if (pendingRegistrations.length === 0) {
        return; // No registrations to process
      }

      this.logger.log(`Processing ${pendingRegistrations.length} pending registrations for webhook sync`);

      // Process each registration independently
      const syncPromises = pendingRegistrations.map(registration =>
        this.syncRegistration(registration, webhookUrl)
      );

      // Wait for all syncs to complete
      const results = await Promise.allSettled(syncPromises);

      // Log summary
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (successful > 0 || failed > 0) {
        this.logger.log(`Webhook sync complete: ${successful} successful, ${failed} failed`);
      }

    } catch (error) {
      this.logger.error('Error processing pending registrations', error);
    }
  }

  /**
   * Find registrations that need webhook synchronization
   */
  private async findRegistrationsForSync(): Promise<Registration[]> {
    const now = new Date();

    return this.registrationRepository.find({
      where: [
        // New pending registrations
        { syncStatus: SyncStatus.PENDING },
        // Failed registrations ready for retry (using exponential backoff)
        {
          syncStatus: SyncStatus.FAILED,
          syncAttempts: 1,
          syncedAt: this.getRetryTimestamp(now, 1) // 1 minute ago
        },
        {
          syncStatus: SyncStatus.FAILED,
          syncAttempts: 2,
          syncedAt: this.getRetryTimestamp(now, 2) // 5 minutes ago
        },
        {
          syncStatus: SyncStatus.FAILED,
          syncAttempts: 3,
          syncedAt: this.getRetryTimestamp(now, 3) // 15 minutes ago
        },
        {
          syncStatus: SyncStatus.FAILED,
          syncAttempts: 4,
          syncedAt: this.getRetryTimestamp(now, 4) // 1 hour ago
        },
        {
          syncStatus: SyncStatus.FAILED,
          syncAttempts: 5,
          syncedAt: this.getRetryTimestamp(now, 5) // 6 hours ago
        },
        {
          syncStatus: SyncStatus.FAILED,
          syncAttempts: 6,
          syncedAt: this.getRetryTimestamp(now, 6) // 24 hours ago
        },
      ],
      relations: ['session'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Calculate timestamp for retry based on exponential backoff
   */
  private getRetryTimestamp(now: Date, attempt: number): Date {
    const delays = [0, 60000, 300000, 900000, 3600000, 21600000, 86400000]; // ms delays
    const delayMs = delays[attempt] || delays[delays.length - 1];
    return new Date(now.getTime() - delayMs);
  }

  /**
   * Sync a single registration via webhook
   */
  private async syncRegistration(registration: Registration, webhookUrl: string): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.debug(`Syncing registration ${registration.id} (attempt ${registration.syncAttempts + 1})`);

      // Build webhook payload
      const payload = this.buildWebhookPayload(registration);

      // Send webhook request
      const response = await this.sendWebhookRequest(webhookUrl, payload);

      // Handle successful response
      await this.handleSuccessfulSync(registration, response);

      const duration = Date.now() - startTime;
      this.logger.log(`Successfully synced registration ${registration.id} in ${duration}ms`);

    } catch (error) {
      // Handle failed sync
      await this.handleFailedSync(registration, error);

      const duration = Date.now() - startTime;
      this.logger.warn(`Failed to sync registration ${registration.id} after ${duration}ms:`, error.message);
    }
  }

  /**
   * Build webhook payload from registration data
   */
  private buildWebhookPayload(registration: Registration): WebhookPayload {
    return {
      session_id: registration.sessionId,
      registration_id: registration.id,
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      referred_by: registration.referredBy,
      session_details: {
        title: registration.session.title,
        date: registration.session.startTime?.toISOString() || '',
        location: registration.session.location?.name,
      },
      registration_timestamp: registration.createdAt.toISOString(),
    };
  }

  /**
   * Send HTTP webhook request
   */
  private async sendWebhookRequest(url: string, payload: WebhookPayload): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.retryConfig.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'TrainingBuilder-Webhook/1.0',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json().catch(() => ({ status: 'success' }));
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Handle successful webhook sync
   */
  private async handleSuccessfulSync(registration: Registration, response: any): Promise<void> {
    await this.registrationRepository.update(registration.id, {
      syncStatus: SyncStatus.SYNCED,
      syncedAt: new Date(),
      syncAttempts: registration.syncAttempts + 1,
      externalId: response?.registration_id || response?.id || null,
    });
  }

  /**
   * Handle failed webhook sync with retry logic
   */
  private async handleFailedSync(registration: Registration, error: any): Promise<void> {
    const newAttemptCount = registration.syncAttempts + 1;
    const maxAttempts = this.retryConfig.maxAttempts;

    if (newAttemptCount >= maxAttempts) {
      // Mark as permanently failed after max attempts
      await this.registrationRepository.update(registration.id, {
        syncStatus: SyncStatus.FAILED,
        syncedAt: new Date(),
        syncAttempts: newAttemptCount,
        notes: `Permanent failure after ${maxAttempts} attempts: ${error.message}`,
      });

      this.logger.error(`Registration ${registration.id} permanently failed after ${maxAttempts} attempts`);
    } else {
      // Schedule for retry
      await this.registrationRepository.update(registration.id, {
        syncStatus: SyncStatus.FAILED,
        syncedAt: new Date(),
        syncAttempts: newAttemptCount,
        notes: `Attempt ${newAttemptCount} failed: ${error.message}`,
      });
    }
  }

  /**
   * Manual retry for failed registration (admin function)
   */
  async retryFailedRegistration(registrationId: string): Promise<{ success: boolean; message: string }> {
    const webhookUrl = this.configService.get<string>('WEBHOOK_REGISTRATION_URL');

    if (!webhookUrl) {
      return { success: false, message: 'Webhook URL not configured' };
    }

    try {
      const registration = await this.registrationRepository.findOne({
        where: { id: registrationId },
        relations: ['session'],
      });

      if (!registration) {
        return { success: false, message: 'Registration not found' };
      }

      if (registration.syncStatus === SyncStatus.SYNCED) {
        return { success: false, message: 'Registration is already synced' };
      }

      await this.syncRegistration(registration, webhookUrl);
      return { success: true, message: 'Retry initiated successfully' };

    } catch (error) {
      this.logger.error(`Manual retry failed for registration ${registrationId}`, error);
      return { success: false, message: `Retry failed: ${error.message}` };
    }
  }

  /**
   * Get sync statistics for monitoring
   */
  async getSyncStatistics(): Promise<{
    pending: number;
    synced: number;
    failed: number;
    permanentlyFailed: number;
    totalRegistrations: number;
  }> {
    const [
      pending,
      synced,
      failed,
      permanentlyFailed,
      totalRegistrations
    ] = await Promise.all([
      this.registrationRepository.count({ where: { syncStatus: SyncStatus.PENDING } }),
      this.registrationRepository.count({ where: { syncStatus: SyncStatus.SYNCED } }),
      this.registrationRepository.count({ where: { syncStatus: SyncStatus.FAILED } }),
      this.registrationRepository.count({
        where: {
          syncStatus: SyncStatus.FAILED,
          syncAttempts: this.retryConfig.maxAttempts
        }
      }),
      this.registrationRepository.count(),
    ]);

    return {
      pending,
      synced,
      failed,
      permanentlyFailed,
      totalRegistrations,
    };
  }
}