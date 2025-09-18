import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Session, SessionStatus } from '../../entities/session.entity';
import { Registration } from '../../entities/registration.entity';
import { Trainer } from '../../entities/trainer.entity';

interface AnalyticsOverviewDto {
  totalSessions: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  totalRegistrations: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  averageAttendance: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
  activeTrainers: {
    value: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  };
}

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT_DEVELOPER)
export class AnalyticsController {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
  ) {}

  @Get('overview')
  async getAnalyticsOverview(
    @Query('dateRange') dateRange: string = 'last-30-days'
  ): Promise<AnalyticsOverviewDto> {
    const { currentPeriodStart, previousPeriodStart, previousPeriodEnd } = this.getDateRanges(dateRange);

    // Get current period metrics
    const currentSessions = await this.getSessionsCount(currentPeriodStart, new Date());
    const currentRegistrations = await this.getRegistrationsCount(currentPeriodStart, new Date());
    const currentActiveTrainers = await this.getActiveTrainersCount(currentPeriodStart, new Date());

    // Get previous period metrics for comparison
    const previousSessions = await this.getSessionsCount(previousPeriodStart, previousPeriodEnd);
    const previousRegistrations = await this.getRegistrationsCount(previousPeriodStart, previousPeriodEnd);
    const previousActiveTrainers = await this.getActiveTrainersCount(previousPeriodStart, previousPeriodEnd);

    // Calculate attendance rate (using registrations as proxy since we don't have attendance tracking yet)
    const currentAttendanceRate = currentRegistrations > 0 ? (currentRegistrations / Math.max(currentSessions, 1)) * 100 : 0;
    const previousAttendanceRate = previousRegistrations > 0 ? (previousRegistrations / Math.max(previousSessions, 1)) * 100 : 0;

    return {
      totalSessions: {
        value: currentSessions,
        change: this.calculatePercentageChange(currentSessions, previousSessions),
        trend: this.getTrend(currentSessions, previousSessions)
      },
      totalRegistrations: {
        value: currentRegistrations,
        change: this.calculatePercentageChange(currentRegistrations, previousRegistrations),
        trend: this.getTrend(currentRegistrations, previousRegistrations)
      },
      averageAttendance: {
        value: Math.round(currentAttendanceRate * 10) / 10, // Round to 1 decimal
        change: this.calculatePercentageChange(currentAttendanceRate, previousAttendanceRate),
        trend: this.getTrend(currentAttendanceRate, previousAttendanceRate)
      },
      activeTrainers: {
        value: currentActiveTrainers,
        change: this.calculatePercentageChange(currentActiveTrainers, previousActiveTrainers),
        trend: this.getTrend(currentActiveTrainers, previousActiveTrainers)
      }
    };
  }

  private getDateRanges(dateRange: string) {
    const now = new Date();
    let currentPeriodStart: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (dateRange) {
      case 'last-7-days':
        currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last-90-days':
        currentPeriodStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last-30-days':
      default:
        currentPeriodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        previousPeriodEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return { currentPeriodStart, previousPeriodStart, previousPeriodEnd };
  }

  private async getSessionsCount(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.createdAt >= :startDate', { startDate })
      .andWhere('session.createdAt <= :endDate', { endDate })
      .andWhere('session.status IN (:...statuses)', {
        statuses: [SessionStatus.PUBLISHED, SessionStatus.COMPLETED]
      })
      .getCount();

    return result;
  }

  private async getRegistrationsCount(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.registrationRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.session', 'session')
      .where('registration.createdAt >= :startDate', { startDate })
      .andWhere('registration.createdAt <= :endDate', { endDate })
      .andWhere('session.status IN (:...statuses)', {
        statuses: [SessionStatus.PUBLISHED, SessionStatus.COMPLETED]
      })
      .getCount();

    return result;
  }

  private async getActiveTrainersCount(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.trainerRepository
      .createQueryBuilder('trainer')
      .leftJoin('trainer.sessions', 'session')
      .where('trainer.isActive = :isActive', { isActive: true })
      .andWhere('session.createdAt >= :startDate', { startDate })
      .andWhere('session.createdAt <= :endDate', { endDate })
      .andWhere('session.status IN (:...statuses)', {
        statuses: [SessionStatus.PUBLISHED, SessionStatus.COMPLETED]
      })
      .groupBy('trainer.id')
      .getCount();

    return result;
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return Math.round(((current - previous) / previous) * 100 * 10) / 10; // Round to 1 decimal
  }

  private getTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const change = this.calculatePercentageChange(current, previous);
    if (Math.abs(change) < 1) return 'stable'; // Less than 1% change considered stable
    return change > 0 ? 'up' : 'down';
  }
}