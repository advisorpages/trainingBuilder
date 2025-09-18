import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TrainerDashboardService } from './trainer-dashboard.service';
import { TrainerSessionQueryDto, CoachingTipGenerationDto, CoachingTipCurationDto } from './dto/trainer-session.dto';
import { User } from '../../entities/user.entity';
import { EmailService } from '../email/email.service';
import { UserRole } from '../../common/guards/roles.guard';

@Controller('trainer-dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TRAINER)
export class TrainerDashboardController {
  constructor(
    private readonly trainerDashboardService: TrainerDashboardService,
    private readonly emailService: EmailService,
  ) {}

  @Get('summary')
  async getDashboardSummary(@CurrentUser() user: User) {
    return this.trainerDashboardService.getTrainerDashboardSummary(user);
  }

  @Get('sessions/upcoming')
  async getUpcomingSessions(
    @CurrentUser() user: User,
    @Query() queryDto: TrainerSessionQueryDto
  ) {
    return this.trainerDashboardService.getTrainerUpcomingSessions(user, queryDto);
  }

  @Get('sessions/:id')
  async getSessionDetail(
    @Param('id') sessionId: string,
    @CurrentUser() user: User
  ) {
    return this.trainerDashboardService.getTrainerSessionDetail(sessionId, user);
  }

  @Get('sessions/:id/coaching-tips')
  async getSessionCoachingTips(
    @Param('id') sessionId: string,
    @CurrentUser() user: User
  ) {
    return this.trainerDashboardService.getSessionCoachingTips(sessionId, user);
  }

  @Post('sessions/:id/coaching-tips/generate')
  async generateCoachingTips(
    @Param('id') sessionId: string,
    @Body() generationDto: Partial<CoachingTipGenerationDto>,
    @CurrentUser() user: User
  ) {
    const fullDto: CoachingTipGenerationDto = {
      sessionId,
      ...generationDto,
    };
    return this.trainerDashboardService.generateCoachingTips(fullDto, user);
  }

  @Patch('coaching-tips/:id/curate')
  async curateCoachingTip(
    @Param('id') sessionCoachingTipId: string,
    @Body() curationDto: Omit<CoachingTipCurationDto, 'sessionCoachingTipId'>,
    @CurrentUser() user: User
  ) {
    const fullDto: CoachingTipCurationDto = {
      sessionCoachingTipId,
      ...curationDto,
    };
    return this.trainerDashboardService.curateCoachingTip(fullDto, user);
  }

  @Post('sessions/:id/send-trainer-kit')
  async sendTrainerKitEmail(
    @Param('id') sessionId: string,
    @CurrentUser() user: User
  ) {
    const session = await this.trainerDashboardService.getTrainerSessionDetail(sessionId, user);

    if (session.trainer && session.trainer.email) {
      const emailSent = await this.emailService.sendSessionAssignmentNotification(session, session.trainer);
      return { success: emailSent, message: emailSent ? 'Trainer kit email sent successfully' : 'Failed to send trainer kit email' };
    } else {
      return { success: false, message: 'Trainer email not available' };
    }
  }
}