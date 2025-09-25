import { Controller, Get, Post, Param, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WebhookSyncService } from '../../services/webhook-sync.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration, SyncStatus } from '../../entities/registration.entity';

interface SyncStatusResponse {
  registration_id: string;
  name: string;
  email: string;
  session_title: string;
  sync_status: string;
  sync_attempts: number;
  created_at: string;
  synced_at?: string;
  notes?: string;
}

interface SyncStatisticsResponse {
  statistics: {
    pending: number;
    synced: number;
    failed: number;
    permanentlyFailed: number;
    totalRegistrations: number;
    successRate: number;
    failureRate: number;
  };
  recentFailures: SyncStatusResponse[];
}

@Controller('admin/webhook-sync')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.BROKER)
export class WebhookAdminController {
  constructor(
    private readonly webhookSyncService: WebhookSyncService,
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
  ) {}

  /**
   * Get webhook sync statistics and health information
   */
  @Get('health')
  async getWebhookSyncHealth(): Promise<SyncStatisticsResponse> {
    try {
      const statistics = await this.webhookSyncService.getSyncStatistics();
      const successRate = statistics.totalRegistrations > 0
        ? (statistics.synced / statistics.totalRegistrations) * 100
        : 0;
      const failureRate = statistics.totalRegistrations > 0
        ? (statistics.permanentlyFailed / statistics.totalRegistrations) * 100
        : 0;

      // Get recent failures for troubleshooting
      const recentFailures = await this.registrationRepository.find({
        where: { syncStatus: SyncStatus.FAILED },
        relations: ['session'],
        order: { syncedAt: 'DESC' },
        take: 10,
      });

      const recentFailuresResponse: SyncStatusResponse[] = recentFailures.map(reg => ({
        registration_id: reg.id,
        name: reg.name,
        email: reg.email,
        session_title: reg.session?.title || 'Unknown Session',
        sync_status: reg.syncStatus,
        sync_attempts: reg.syncAttempts,
        created_at: reg.createdAt.toISOString(),
        synced_at: reg.syncedAt?.toISOString(),
        notes: reg.notes,
      }));

      return {
        statistics: {
          ...statistics,
          successRate: Math.round(successRate * 100) / 100,
          failureRate: Math.round(failureRate * 100) / 100,
        },
        recentFailures: recentFailuresResponse,
      };

    } catch (error) {
      throw new HttpException(
        `Failed to get webhook sync health: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get detailed sync status for all registrations with filtering
   */
  @Get('registrations/sync-status')
  async getRegistrationSyncStatus(): Promise<{
    registrations: SyncStatusResponse[];
    summary: {
      total: number;
      pending: number;
      synced: number;
      failed: number;
    };
  }> {
    try {
      const registrations = await this.registrationRepository.find({
        relations: ['session'],
        order: { createdAt: 'DESC' },
        take: 100, // Limit to prevent large responses
      });

      const registrationsResponse: SyncStatusResponse[] = registrations.map(reg => ({
        registration_id: reg.id,
        name: reg.name,
        email: reg.email,
        session_title: reg.session?.title || 'Unknown Session',
        sync_status: reg.syncStatus,
        sync_attempts: reg.syncAttempts,
        created_at: reg.createdAt.toISOString(),
        synced_at: reg.syncedAt?.toISOString(),
        notes: reg.notes,
      }));

      const summary = {
        total: registrations.length,
        pending: registrations.filter(r => r.syncStatus === SyncStatus.PENDING).length,
        synced: registrations.filter(r => r.syncStatus === SyncStatus.SYNCED).length,
        failed: registrations.filter(r => r.syncStatus === SyncStatus.FAILED).length,
      };

      return {
        registrations: registrationsResponse,
        summary,
      };

    } catch (error) {
      throw new HttpException(
        `Failed to get registration sync status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get sync status for a specific registration
   */
  @Get('registrations/:id/sync-status')
  async getRegistrationSyncStatusById(@Param('id') registrationId: string): Promise<SyncStatusResponse> {
    try {
      const registration = await this.registrationRepository.findOne({
        where: { id: registrationId },
        relations: ['session'],
      });

      if (!registration) {
        throw new HttpException('Registration not found', HttpStatus.NOT_FOUND);
      }

      return {
        registration_id: registration.id,
        name: registration.name,
        email: registration.email,
        session_title: registration.session?.title || 'Unknown Session',
        sync_status: registration.syncStatus,
        sync_attempts: registration.syncAttempts,
        created_at: registration.createdAt.toISOString(),
        synced_at: registration.syncedAt?.toISOString(),
        notes: registration.notes,
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to get registration sync status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Manually retry webhook sync for a failed registration
   */
  @Post('registrations/:id/retry')
  async retryRegistrationSync(@Param('id') registrationId: string): Promise<{
    success: boolean;
    message: string;
    registration_id: string;
  }> {
    try {
      const result = await this.webhookSyncService.retryFailedRegistration(registrationId);

      return {
        success: result.success,
        message: result.message,
        registration_id: registrationId,
      };

    } catch (error) {
      throw new HttpException(
        `Failed to retry registration sync: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Manually trigger processing of all pending registrations
   */
  @Post('process-pending')
  async processPendingRegistrations(): Promise<{
    success: boolean;
    message: string;
    processed_count: number;
  }> {
    try {
      const pendingBefore = await this.registrationRepository.count({
        where: { syncStatus: SyncStatus.PENDING }
      });

      await this.webhookSyncService.processPendingRegistrations();

      const pendingAfter = await this.registrationRepository.count({
        where: { syncStatus: SyncStatus.PENDING }
      });

      const processedCount = pendingBefore - pendingAfter;

      return {
        success: true,
        message: `Processed ${processedCount} pending registrations`,
        processed_count: processedCount,
      };

    } catch (error) {
      throw new HttpException(
        `Failed to process pending registrations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get failed registrations that need attention
   */
  @Get('failed-registrations')
  async getFailedRegistrations(): Promise<{
    permanentlyFailed: SyncStatusResponse[];
    retryable: SyncStatusResponse[];
    summary: {
      totalFailed: number;
      permanentlyFailed: number;
      retryable: number;
    };
  }> {
    try {
      const failedRegistrations = await this.registrationRepository.find({
        where: { syncStatus: SyncStatus.FAILED },
        relations: ['session'],
        order: { syncedAt: 'DESC' },
      });

      const maxAttempts = 6; // Should match webhook service config

      const permanentlyFailed = failedRegistrations
        .filter(reg => reg.syncAttempts >= maxAttempts)
        .map(reg => ({
          registration_id: reg.id,
          name: reg.name,
          email: reg.email,
          session_title: reg.session?.title || 'Unknown Session',
          sync_status: reg.syncStatus,
          sync_attempts: reg.syncAttempts,
          created_at: reg.createdAt.toISOString(),
          synced_at: reg.syncedAt?.toISOString(),
          notes: reg.notes,
        }));

      const retryable = failedRegistrations
        .filter(reg => reg.syncAttempts < maxAttempts)
        .map(reg => ({
          registration_id: reg.id,
          name: reg.name,
          email: reg.email,
          session_title: reg.session?.title || 'Unknown Session',
          sync_status: reg.syncStatus,
          sync_attempts: reg.syncAttempts,
          created_at: reg.createdAt.toISOString(),
          synced_at: reg.syncedAt?.toISOString(),
          notes: reg.notes,
        }));

      return {
        permanentlyFailed,
        retryable,
        summary: {
          totalFailed: failedRegistrations.length,
          permanentlyFailed: permanentlyFailed.length,
          retryable: retryable.length,
        },
      };

    } catch (error) {
      throw new HttpException(
        `Failed to get failed registrations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}