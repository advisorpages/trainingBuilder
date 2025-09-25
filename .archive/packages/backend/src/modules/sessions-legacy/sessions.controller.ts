import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SessionsService } from './sessions.service';
import { SessionStatusService } from './services/session-status.service';
import { ContentValidationService } from './services/content-validation.service';
import { PublishingAutomationService } from './services/publishing-automation.service';
import { WorkflowMonitoringService } from './services/workflow-monitoring.service';
import { CreateSessionDto, UpdateSessionDto, SavePromptDto, IntegrateAIContentDto, StatusUpdateDto, CreateRegistrationDto } from './dto';
import { Session } from '../../entities/session.entity';

@ApiTags('sessions')
@ApiBearerAuth('JWT-auth')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly sessionStatusService: SessionStatusService,
    private readonly contentValidationService: ContentValidationService,
    private readonly publishingAutomationService: PublishingAutomationService,
    private readonly workflowMonitoringService: WorkflowMonitoringService,
  ) {}

  @Get('status')
  getSessionsStatus(): object {
    return this.sessionsService.getStatus();
  }

  @Post()
  create(@Body() createSessionDto: CreateSessionDto, @Request() req): Promise<Session> {
    return this.sessionsService.create(createSessionDto, req.user);
  }

  @Get()
  findAll(): Promise<Session[]> {
    return this.sessionsService.findAll();
  }

  @Get('author/:authorId')
  findByAuthor(@Param('authorId') authorId: string, @Request() req): Promise<Session[]> {
    const resolvedAuthorId = authorId === 'me' ? req.user.id : authorId;
    return this.sessionsService.findByAuthor(resolvedAuthorId);
  }

  // Public endpoints (no authentication required) - Must be defined before parameterized routes

  @Public()
  @Get('public')
  findPublishedSessions(): Promise<Session[]> {
    return this.sessionsService.findPublishedSessions();
  }

  @Public()
  @Get('public/:id')
  findPublicSession(@Param('id') id: string): Promise<Session> {
    return this.sessionsService.findPublicSession(id);
  }

  @Public()
  @Post(':id/register')
  registerForSession(
    @Param('id') sessionId: string,
    @Body() createRegistrationDto: CreateRegistrationDto
  ): Promise<{ success: boolean; message: string; registrationId?: string }> {
    return this.sessionsService.registerForSession(sessionId, createRegistrationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Session> {
    return this.sessionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Request() req
  ): Promise<Session> {
    return this.sessionsService.update(id, updateSessionDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req): Promise<{ success: boolean }> {
    return this.sessionsService.remove(id, req.user).then(() => ({ success: true }));
  }

  // Draft-specific endpoints for Story 2.2
  @Patch(':id/draft')
  saveDraft(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Request() req
  ): Promise<Session> {
    return this.sessionsService.saveDraft(id, updateSessionDto, req.user);
  }

  @Get('drafts/my')
  getMyDrafts(@Request() req): Promise<Session[]> {
    return this.sessionsService.getDraftsByAuthor(req.user.id);
  }

  @Post(':id/auto-save')
  autoSaveDraft(
    @Param('id') id: string,
    @Body() partialData: Partial<UpdateSessionDto>,
    @Request() req
  ): Promise<{ success: boolean; lastSaved: Date }> {
    return this.sessionsService.autoSaveDraft(id, partialData, req.user);
  }

  @Get(':id/saveable')
  isDraftSaveable(@Param('id') id: string, @Request() req): Promise<{ saveable: boolean }> {
    return this.sessionsService.isDraftSaveable(id, req.user).then(saveable => ({ saveable }));
  }

  // AI Prompt endpoints for Story 2.3
  @Post(':id/prompt')
  savePrompt(
    @Param('id') id: string,
    @Body() savePromptDto: SavePromptDto,
    @Request() req
  ): Promise<Session> {
    return this.sessionsService.savePrompt(id, savePromptDto, req.user);
  }

  @Get(':id/prompt')
  getPrompt(@Param('id') id: string, @Request() req): Promise<{ prompt: string | null; hasPrompt: boolean }> {
    return this.sessionsService.getPrompt(id, req.user);
  }

  @Delete(':id/prompt')
  clearPrompt(@Param('id') id: string, @Request() req): Promise<Session> {
    return this.sessionsService.clearPrompt(id, req.user);
  }

  @Get('prompts/ready')
  getSessionsWithPrompts(@Request() req): Promise<Session[]> {
    return this.sessionsService.getSessionsWithPrompts(req.user.id);
  }

  // AI Generated Content endpoints for Story 2.4
  @Post(':id/content')
  saveGeneratedContent(
    @Param('id') id: string,
    @Body() contentData: { content: object },
    @Request() req
  ): Promise<Session> {
    return this.sessionsService.saveGeneratedContent(id, contentData.content, req.user);
  }

  @Get(':id/content')
  getGeneratedContent(@Param('id') id: string, @Request() req): Promise<{ content: object | null; hasContent: boolean }> {
    return this.sessionsService.getGeneratedContent(id, req.user);
  }

  @Delete(':id/content')
  clearGeneratedContent(@Param('id') id: string, @Request() req): Promise<Session> {
    return this.sessionsService.clearGeneratedContent(id, req.user);
  }

  @Get('content/ready')
  getSessionsWithGeneratedContent(@Request() req): Promise<Session[]> {
    return this.sessionsService.getSessionsWithGeneratedContent(req.user.id);
  }

  // Content versioning endpoints for Story 2.5
  @Get(':id/content/versions')
  getContentVersions(@Param('id') id: string, @Request() req): Promise<{ versions: any[]; hasVersions: boolean }> {
    return this.sessionsService.getContentVersions(id, req.user);
  }

  @Post(':id/content/restore/:versionIndex')
  restoreContentVersion(
    @Param('id') id: string,
    @Param('versionIndex') versionIndex: string,
    @Request() req
  ): Promise<Session> {
    return this.sessionsService.restoreContentVersion(id, parseInt(versionIndex), req.user);
  }

  // AI Content Integration endpoints for Story 2.6
  @Post(':id/integrate-ai-content')
  integrateAIContentToDraft(
    @Param('id') id: string,
    @Body() integrateDto: IntegrateAIContentDto,
    @Request() req
  ): Promise<Session> {
    return this.sessionsService.integrateAIContentToDraft(id, integrateDto, req.user);
  }

  @Get(':id/preview-with-ai')
  previewSessionWithAIContent(@Param('id') id: string, @Request() req): Promise<{
    session: Session;
    aiContent: any;
    previewData: {
      title: string;
      description: string;
      promotionalHeadline?: string;
      promotionalSummary?: string;
      keyBenefits?: string;
      callToAction?: string;
      socialMediaContent?: string;
      emailMarketingContent?: string;
    };
  }> {
    return this.sessionsService.previewSessionWithAIContent(id, req.user);
  }

  @Post(':id/finalize-draft')
  finalizeSessionDraft(@Param('id') id: string, @Request() req): Promise<Session> {
    return this.sessionsService.finalizeSessionDraft(id, req.user);
  }

  // Publishing Logic endpoints for Story 3.3
  @Patch(':id/status')
  async updateSessionStatus(
    @Param('id') id: string,
    @Body() statusUpdateDto: StatusUpdateDto,
    @Request() req
  ): Promise<Session> {
    return this.sessionStatusService.updateSessionStatus(
      id,
      statusUpdateDto.status,
      req.user.id,
      false, // not automated
      statusUpdateDto.reason
    );
  }

  @Get(':id/status-history')
  async getSessionStatusHistory(@Param('id') id: string) {
    return this.sessionStatusService.getSessionStatusHistory(id);
  }

  @Get(':id/validation')
  async validateSessionContent(@Param('id') id: string) {
    return this.contentValidationService.validateSessionContent(id);
  }

  @Get(':id/publishing-rules')
  async validatePublishingRules(@Param('id') id: string) {
    return this.publishingAutomationService.validatePublishingRules(id);
  }

  @Post(':id/publish')
  async publishSession(@Param('id') id: string, @Request() req): Promise<Session> {
    // Validate publishing rules first
    const validation = await this.publishingAutomationService.validatePublishingRules(id);

    if (!validation.canPublish) {
      throw new Error(`Cannot publish session: ${validation.reason}`);
    }

    return this.sessionStatusService.updateSessionStatus(
      id,
      'published' as any,
      req.user.id,
      false,
      'Session published by user'
    );
  }

  @Post('bulk/validate')
  async validateMultipleSessions(@Body() sessionIds: string[]) {
    const results = await this.publishingAutomationService.validateMultipleSessions(sessionIds);
    return Object.fromEntries(results);
  }

  // Monitoring and alerting endpoints for Story 3.3
  @Get('workflow/health')
  async getWorkflowHealth() {
    return this.workflowMonitoringService.performHealthCheck();
  }

  @Get('workflow/metrics')
  async getWorkflowMetrics() {
    return this.workflowMonitoringService.collectWorkflowMetrics();
  }

}
