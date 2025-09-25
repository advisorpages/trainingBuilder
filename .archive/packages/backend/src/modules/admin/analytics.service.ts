import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, SessionStatus } from '../../entities/session.entity';
import { Registration } from '../../entities/registration.entity';
import { Trainer } from '../../entities/trainer.entity';
import { Topic } from '../../entities/topic.entity';

export interface AttendanceData {
  date: string;
  attendanceRate: number;
  registrations: number;
  sessions: number;
}

export interface RegistrationData {
  period: string;
  registrations: number;
  sessions: number;
}

export interface TopicData {
  topic: string;
  sessions: number;
  percentage: number;
}

export interface TrainerData {
  name: string;
  sessionCount: number;
  avgAttendanceRate: number;
  totalRegistrations: number;
}

export interface SessionPerformanceFilters {
  startDate?: Date;
  endDate?: Date;
  trainerId?: number;
  status?: SessionStatus;
  topicId?: number;
  locationId?: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
  ) {}

  async getSessionPerformanceTrends(
    filters: SessionPerformanceFilters,
    timeRange: 'day' | 'week' | 'month' = 'month'
  ): Promise<AttendanceData[]> {
    const query = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoin('session.registrations', 'registration')
      .leftJoin('session.trainer', 'trainer')
      .where('session.status IN (:...statuses)', {
        statuses: [SessionStatus.PUBLISHED, SessionStatus.COMPLETED]
      });

    this.applyFilters(query, filters);

    let dateFormat: string;
    let groupBy: string;

    switch (timeRange) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'DATE(session.createdAt)';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        groupBy = 'YEARWEEK(session.createdAt)';
        break;
      case 'month':
      default:
        dateFormat = 'YYYY-MM';
        groupBy = 'DATE_FORMAT(session.createdAt, "%Y-%m")';
        break;
    }

    const results = await query
      .select([
        `${groupBy} as period`,
        'COUNT(DISTINCT session.id) as sessionCount',
        'COUNT(registration.id) as registrationCount'
      ])
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return results.map(result => ({
      date: result.period,
      sessions: parseInt(result.sessionCount),
      registrations: parseInt(result.registrationCount),
      attendanceRate: result.sessionCount > 0
        ? Math.round((result.registrationCount / result.sessionCount) * 100) / 100
        : 0
    }));
  }

  async getRegistrationTrends(
    filters: SessionPerformanceFilters,
    timeRange: 'day' | 'week' | 'month' = 'month'
  ): Promise<RegistrationData[]> {
    const query = this.registrationRepository
      .createQueryBuilder('registration')
      .leftJoin('registration.session', 'session')
      .where('session.status IN (:...statuses)', {
        statuses: [SessionStatus.PUBLISHED, SessionStatus.COMPLETED]
      });

    this.applySessionFilters(query, filters);

    let dateFormat: string;
    let groupBy: string;

    switch (timeRange) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'DATE(registration.createdAt)';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        groupBy = 'YEARWEEK(registration.createdAt)';
        break;
      case 'month':
      default:
        dateFormat = 'YYYY-MM';
        groupBy = 'DATE_FORMAT(registration.createdAt, "%Y-%m")';
        break;
    }

    const results = await query
      .select([
        `${groupBy} as period`,
        'COUNT(registration.id) as registrationCount',
        'COUNT(DISTINCT session.id) as sessionCount'
      ])
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();

    return results.map(result => ({
      period: result.period,
      registrations: parseInt(result.registrationCount),
      sessions: parseInt(result.sessionCount)
    }));
  }

  async getTopicDistribution(filters: SessionPerformanceFilters): Promise<TopicData[]> {
    const query = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoin('session.topics', 'topic')
      .leftJoin('session.trainer', 'trainer')
      .where('session.status IN (:...statuses)', {
        statuses: [SessionStatus.PUBLISHED, SessionStatus.COMPLETED]
      });

    this.applyFilters(query, filters);

    const results = await query
      .select([
        'topic.name as topicName',
        'COUNT(session.id) as sessionCount'
      ])
      .groupBy('topic.id, topic.name')
      .orderBy('sessionCount', 'DESC')
      .getRawMany();

    const totalSessions = results.reduce((sum, result) => sum + parseInt(result.sessionCount), 0);

    return results.map(result => ({
      topic: result.topicName || 'Uncategorized',
      sessions: parseInt(result.sessionCount),
      percentage: totalSessions > 0
        ? Math.round((parseInt(result.sessionCount) / totalSessions) * 100 * 10) / 10
        : 0
    }));
  }

  async getTrainerPerformance(filters: SessionPerformanceFilters): Promise<TrainerData[]> {
    const query = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoin('session.trainer', 'trainer')
      .leftJoin('session.registrations', 'registration')
      .where('session.status IN (:...statuses)', {
        statuses: [SessionStatus.PUBLISHED, SessionStatus.COMPLETED]
      });

    this.applyFilters(query, filters);

    const results = await query
      .select([
        'trainer.firstName as firstName',
        'trainer.lastName as lastName',
        'COUNT(DISTINCT session.id) as sessionCount',
        'COUNT(registration.id) as totalRegistrations',
        'AVG(CASE WHEN session.id IS NOT NULL THEN (SELECT COUNT(*) FROM registrations r WHERE r.sessionId = session.id) END) as avgRegistrationsPerSession'
      ])
      .groupBy('trainer.id, trainer.firstName, trainer.lastName')
      .orderBy('sessionCount', 'DESC')
      .getRawMany();

    return results.map(result => ({
      name: `${result.firstName} ${result.lastName}`,
      sessionCount: parseInt(result.sessionCount),
      totalRegistrations: parseInt(result.totalRegistrations),
      avgAttendanceRate: result.avgRegistrationsPerSession
        ? Math.round(parseFloat(result.avgRegistrationsPerSession) * 100) / 100
        : 0
    }));
  }

  private applyFilters(query: any, filters: SessionPerformanceFilters) {
    if (filters.startDate) {
      query.andWhere('session.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query.andWhere('session.createdAt <= :endDate', { endDate: filters.endDate });
    }
    if (filters.trainerId) {
      query.andWhere('session.trainerId = :trainerId', { trainerId: filters.trainerId });
    }
    if (filters.status) {
      query.andWhere('session.status = :status', { status: filters.status });
    }
    if (filters.topicId) {
      query.andWhere('topic.id = :topicId', { topicId: filters.topicId });
    }
    if (filters.locationId) {
      query.andWhere('session.locationId = :locationId', { locationId: filters.locationId });
    }
  }

  private applySessionFilters(query: any, filters: SessionPerformanceFilters) {
    if (filters.startDate) {
      query.andWhere('session.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query.andWhere('session.createdAt <= :endDate', { endDate: filters.endDate });
    }
    if (filters.trainerId) {
      query.andWhere('session.trainerId = :trainerId', { trainerId: filters.trainerId });
    }
    if (filters.status) {
      query.andWhere('session.status = :status', { status: filters.status });
    }
    if (filters.locationId) {
      query.andWhere('session.locationId = :locationId', { locationId: filters.locationId });
    }
  }
}