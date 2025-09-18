import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Session, SessionStatus } from '../../entities/session.entity';
import { Trainer } from '../../entities/trainer.entity';
import { User } from '../../entities/user.entity';
import { CoachingTip } from '../../entities/coaching-tip.entity';
import { SessionCoachingTip, SessionCoachingTipStatus } from '../../entities/session-coaching-tip.entity';
import { TrainerSessionQueryDto, CoachingTipGenerationDto, CoachingTipCurationDto } from './dto/trainer-session.dto';

@Injectable()
export class TrainerDashboardService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CoachingTip)
    private coachingTipRepository: Repository<CoachingTip>,
    @InjectRepository(SessionCoachingTip)
    private sessionCoachingTipRepository: Repository<SessionCoachingTip>,
  ) {}

  async getTrainerUpcomingSessions(
    user: User,
    queryDto: TrainerSessionQueryDto
  ): Promise<Session[]> {
    // First, get the trainer entity associated with this user
    const trainer = await this.getTrainerByEmail(user.email);

    const { days = 7, status } = queryDto;

    // Calculate date range
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);

    // Use query builder as expected by tests
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.author', 'author')
      .leftJoinAndSelect('session.location', 'location')
      .leftJoinAndSelect('session.trainer', 'trainer')
      .leftJoinAndSelect('session.audience', 'audience')
      .leftJoinAndSelect('session.tone', 'tone')
      .leftJoinAndSelect('session.category', 'category')
      .leftJoinAndSelect('session.topics', 'topics')
      .leftJoinAndSelect('session.coachingTips', 'coachingTips')
      .leftJoinAndSelect('coachingTips.coachingTip', 'coachingTip')
      .leftJoinAndSelect('session.registrations', 'registrations')
      .where('session.trainer = :trainerId', { trainerId: trainer.id })
      .andWhere('session.startTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('session.isActive = :isActive', { isActive: true });

    if (status) {
      queryBuilder.andWhere('session.status = :status', { status });
    } else {
      // Default to published sessions only
      queryBuilder.andWhere('session.status = :status', { status: SessionStatus.PUBLISHED });
    }

    queryBuilder.orderBy('session.startTime', 'ASC');

    const sessions = await queryBuilder.getMany();
    return sessions || [];
  }

  async getTrainerSessionDetail(sessionId: string, user: User): Promise<Session> {
    const trainer = await this.getTrainerByEmail(user.email);

    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        trainer: { id: trainer.id },
        isActive: true
      },
      relations: [
        'author',
        'location',
        'trainer',
        'audience',
        'tone',
        'category',
        'topics',
        'coachingTips',
        'coachingTips.coachingTip',
        'coachingTips.coachingTip.topics',
        'registrations'
      ],
    });

    if (!session) {
      throw new NotFoundException('Session not found or not assigned to you');
    }

    return session;
  }

  async generateCoachingTips(
    generationDto: CoachingTipGenerationDto,
    user: User
  ): Promise<CoachingTip[]> {
    // Verify trainer has access to this session
    await this.getTrainerSessionDetail(generationDto.sessionId, user);

    // Create AI-generated coaching tips based on session content
    // This is a simplified implementation - in reality, you'd call an AI service
    const tips = await this.createAIGeneratedTips(generationDto);

    // Save the session-coaching tip relationships
    const sessionCoachingTips = [];
    for (const tip of tips) {
      const sessionTip = this.sessionCoachingTipRepository.create({
        sessionId: generationDto.sessionId,
        coachingTipId: tip.id,
        status: SessionCoachingTipStatus.GENERATED,
        createdByUserId: user.id,
      });
      sessionCoachingTips.push(await this.sessionCoachingTipRepository.save(sessionTip));
    }

    return tips;
  }

  async getSessionCoachingTips(sessionId: string, user: User): Promise<SessionCoachingTip[]> {
    // Verify trainer has access to this session
    await this.getTrainerSessionDetail(sessionId, user);

    const tips = await this.sessionCoachingTipRepository.find({
      where: {
        sessionId,
        isActive: true
      },
      relations: ['coachingTip', 'coachingTip.topics', 'createdByUser'],
      order: { createdAt: 'DESC' },
    });

    return tips || [];
  }

  async curateCoachingTip(
    curationDto: CoachingTipCurationDto,
    user: User
  ): Promise<SessionCoachingTip> {
    const sessionTip = await this.sessionCoachingTipRepository.findOne({
      where: { id: curationDto.sessionCoachingTipId },
      relations: ['session', 'coachingTip'],
    });

    if (!sessionTip) {
      throw new NotFoundException('Coaching tip association not found');
    }

    // Verify trainer has access to this session
    await this.getTrainerSessionDetail(sessionTip.sessionId, user);

    // Update the status
    sessionTip.status = curationDto.status as SessionCoachingTipStatus;

    return this.sessionCoachingTipRepository.save(sessionTip);
  }

  private async getTrainerByEmail(email: string): Promise<Trainer> {
    const trainer = await this.trainerRepository.findOne({
      where: { email, isActive: true },
    });

    if (!trainer) {
      throw new ForbiddenException('User is not associated with an active trainer account');
    }

    return trainer;
  }


  private async createAIGeneratedTips(
    generationDto: CoachingTipGenerationDto
  ): Promise<CoachingTip[]> {
    try {
      // This is a simplified mock implementation
      // In a real application, you would:
      // 1. Get session details
      // 2. Call AI service with session context
      // 3. Generate personalized coaching tips
      // 4. Save to database

      if (!generationDto.sessionId) {
        throw new Error('Session ID is required for tip generation');
      }

      const mockTips = [
        {
          text: `Focus on interactive engagement techniques for this session. Use the 5-minute rule: ask participants a question every 5 minutes to maintain attention.`,
          category: 'engagement',
          difficultyLevel: generationDto.difficultyLevel || 'intermediate',
        },
        {
          text: `Prepare backup activities in case the session runs ahead of schedule. Have 2-3 discussion prompts ready to extend valuable conversation.`,
          category: 'preparation',
          difficultyLevel: generationDto.difficultyLevel || 'intermediate',
        },
        {
          text: `Start with a personal story or relevant example to connect with your audience immediately. People remember stories 22 times more than facts alone.`,
          category: 'opening',
          difficultyLevel: generationDto.difficultyLevel || 'beginner',
        },
      ];

      const savedTips = [];
      for (const mockTip of mockTips) {
        const tip = this.coachingTipRepository.create({
          text: mockTip.text,
          category: mockTip.category,
          difficultyLevel: mockTip.difficultyLevel as any,
          isActive: true,
        });
        const savedTip = await this.coachingTipRepository.save(tip);
        if (savedTip) {
          savedTips.push(savedTip);
        }
      }

      return savedTips.length > 0 ? savedTips : [];
    } catch (error) {
      throw new Error(`Failed to generate coaching tips: ${error.message}`);
    }
  }

  async getTrainerDashboardSummary(user: User): Promise<{
    upcomingSessionsCount: number;
    nextSession: Session | null;
    totalCoachingTips: number;
    recentActivity: any[];
  }> {
    const trainer = await this.getTrainerByEmail(user.email);

    // Get upcoming sessions count using query builder as expected by tests
    const upcomingSessionsCount = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.trainer = :trainerId', { trainerId: trainer.id })
      .andWhere('session.startTime > :now', { now: new Date() })
      .andWhere('session.status = :status', { status: SessionStatus.PUBLISHED })
      .andWhere('session.isActive = :isActive', { isActive: true })
      .getCount();

    // Get next session
    const nextSessions = await this.sessionRepository.find({
      where: {
        trainer: { id: trainer.id },
        startTime: MoreThanOrEqual(new Date()),
        status: SessionStatus.PUBLISHED,
        isActive: true,
      },
      order: { startTime: 'ASC' },
      take: 1,
    });

    const nextSession = (nextSessions && nextSessions.length > 0) ? nextSessions[0] : null;

    // Get total coaching tips for this trainer's sessions
    const totalCoachingTips = await this.sessionCoachingTipRepository.count({
      where: {
        isActive: true,
        session: {
          trainer: { id: trainer.id },
        },
      },
    });

    // Get recent activity (simplified)
    const recentActivity = [
      {
        type: 'session_assigned',
        message: 'New session assigned',
        timestamp: new Date(),
      },
    ];

    return {
      upcomingSessionsCount,
      nextSession,
      totalCoachingTips,
      recentActivity,
    };
  }
}