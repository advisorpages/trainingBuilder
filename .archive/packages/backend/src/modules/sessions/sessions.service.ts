import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Session, SessionStatus } from '../../entities/session.entity';
import { Registration, SyncStatus } from '../../entities/registration.entity';
import { User } from '../../entities/user.entity';
import { CreateSessionDto, UpdateSessionDto, SavePromptDto, IntegrateAIContentDto, CreateRegistrationDto } from './dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(Registration)
    private registrationRepository: Repository<Registration>,
  ) {}

  getStatus(): object {
    return {
      module: 'Sessions',
      status: 'Active - Session Worksheet Implementation',
      features: [
        'Session management',
        'AI content generation',
        'Publishing workflow',
        'Registration handling',
      ],
    };
  }

  async create(createSessionDto: CreateSessionDto, author: User): Promise<Session> {
    // Validate start and end times
    if (createSessionDto.endTime <= createSessionDto.startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate max registrations
    if (createSessionDto.maxRegistrations < 1) {
      throw new BadRequestException('Maximum registrations must be at least 1');
    }

    const session = this.sessionRepository.create({
      ...createSessionDto,
      authorId: author.id,
      status: SessionStatus.DRAFT,
      isActive: true,
    });

    return this.sessionRepository.save(session);
  }

  async findAll(): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { isActive: true },
      relations: ['author', 'location', 'trainer', 'audience', 'tone', 'category', 'topics'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAuthor(authorId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: { authorId, isActive: true },
      relations: ['author', 'location', 'trainer', 'audience', 'tone', 'category', 'topics'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: { id, isActive: true },
      relations: ['author', 'location', 'trainer', 'audience', 'tone', 'category', 'topics'],
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }

    return session;
  }

  async update(id: string, updateSessionDto: UpdateSessionDto, user: User): Promise<Session> {
    const session = await this.findOne(id);

    // Check if user is authorized to update this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update sessions you created');
    }

    // Validate times if they're being updated
    const startTime = updateSessionDto.startTime || session.startTime;
    const endTime = updateSessionDto.endTime || session.endTime;

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Validate max registrations if being updated
    if (updateSessionDto.maxRegistrations !== undefined && updateSessionDto.maxRegistrations < 1) {
      throw new BadRequestException('Maximum registrations must be at least 1');
    }

    Object.assign(session, updateSessionDto);
    return this.sessionRepository.save(session);
  }

  async remove(id: string, user: User): Promise<void> {
    const session = await this.findOne(id);

    // Check if user is authorized to delete this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only delete sessions you created');
    }

    // Soft delete by setting isActive to false
    session.isActive = false;
    await this.sessionRepository.save(session);
  }

  // Draft-specific operations for Story 2.2
  async saveDraft(id: string, updateSessionDto: UpdateSessionDto, user: User): Promise<Session> {
    const session = await this.findOne(id);

    // Check if user is authorized to update this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update sessions you created');
    }

    // Ensure session remains in draft status
    if (updateSessionDto.hasOwnProperty('status') && updateSessionDto.status !== SessionStatus.DRAFT) {
      delete updateSessionDto.status;
    }

    // For drafts, we're more lenient with validation - allow partial data
    Object.assign(session, updateSessionDto);
    session.status = SessionStatus.DRAFT;

    return this.sessionRepository.save(session);
  }

  async getDraftsByAuthor(authorId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        authorId,
        isActive: true,
        status: SessionStatus.DRAFT
      },
      relations: ['author', 'location', 'trainer', 'audience', 'tone', 'category', 'topics'],
      order: { updatedAt: 'DESC' },
    });
  }

  async autoSaveDraft(id: string, partialData: Partial<UpdateSessionDto>, user: User): Promise<{ success: boolean; lastSaved: Date }> {
    try {
      const session = await this.findOne(id);

      // Check if user is authorized
      if (session.authorId !== user.id && user.role.name !== 'Broker') {
        throw new ForbiddenException('You can only update sessions you created');
      }

      // Only update non-empty fields for auto-save
      const updateData: Partial<UpdateSessionDto> = {};
      Object.keys(partialData).forEach(key => {
        const value = partialData[key as keyof UpdateSessionDto];
        if (value !== undefined && value !== null && value !== '') {
          (updateData as any)[key] = value;
        }
      });

      if (Object.keys(updateData).length > 0) {
        Object.assign(session, updateData);
        session.status = SessionStatus.DRAFT;
        await this.sessionRepository.save(session);
      }

      return {
        success: true,
        lastSaved: new Date()
      };
    } catch (error) {
      return {
        success: false,
        lastSaved: new Date()
      };
    }
  }

  async isDraftSaveable(id: string, user: User): Promise<boolean> {
    try {
      const session = await this.findOne(id);
      return session.authorId === user.id || user.role.name === 'Broker';
    } catch {
      return false;
    }
  }

  // AI Prompt-specific operations for Story 2.3
  async savePrompt(id: string, savePromptDto: SavePromptDto, user: User): Promise<Session> {
    const session = await this.findOne(id);

    // Check if user is authorized to update this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update sessions you created');
    }

    // Save the AI prompt to the session
    session.aiPrompt = savePromptDto.prompt;

    // Keep the session as draft when saving prompts
    session.status = SessionStatus.DRAFT;

    return this.sessionRepository.save(session);
  }

  async getPrompt(id: string, user: User): Promise<{ prompt: string | null; hasPrompt: boolean }> {
    const session = await this.findOne(id);

    // Check if user is authorized to view this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only view sessions you created');
    }

    return {
      prompt: session.aiPrompt,
      hasPrompt: !!session.aiPrompt
    };
  }

  async clearPrompt(id: string, user: User): Promise<Session> {
    const session = await this.findOne(id);

    // Check if user is authorized to update this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update sessions you created');
    }

    // Clear the AI prompt
    session.aiPrompt = null;

    return this.sessionRepository.save(session);
  }

  // Get sessions that have AI prompts (ready for content generation)
  async getSessionsWithPrompts(authorId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        authorId,
        isActive: true,
        aiPrompt: Not(IsNull()) // TypeORM syntax for NOT NULL
      },
      relations: ['author', 'location', 'trainer', 'audience', 'tone', 'category', 'topics'],
      order: { updatedAt: 'DESC' },
    });
  }

  // AI Generated Content methods for Story 2.4
  async saveGeneratedContent(id: string, content: string, user: User): Promise<Session> {
    const session = await this.findOne(id);

    // Check if user is authorized to update this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update sessions you created');
    }

    // Handle content versioning for Story 2.5
    if (session.aiGeneratedContent) {
      const currentContent = JSON.parse(session.aiGeneratedContent);
      const newContent = JSON.parse(content);

      // Store previous version if it exists
      if (!newContent.previousVersions) {
        newContent.previousVersions = [];
      }

      // Add current content as previous version
      newContent.previousVersions.unshift({
        ...currentContent,
        versionTimestamp: new Date()
      });

      // Limit to last 5 versions
      if (newContent.previousVersions.length > 5) {
        newContent.previousVersions = newContent.previousVersions.slice(0, 5);
      }

      session.aiGeneratedContent = JSON.stringify(newContent);
    } else {
      session.aiGeneratedContent = content;
    }

    return this.sessionRepository.save(session);
  }

  async getGeneratedContent(id: string, user: User): Promise<{ content: string | null; hasContent: boolean }> {
    const session = await this.findOne(id);

    // Check if user is authorized to view this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only view sessions you created');
    }

    return {
      content: session.aiGeneratedContent,
      hasContent: !!session.aiGeneratedContent
    };
  }

  async clearGeneratedContent(id: string, user: User): Promise<Session> {
    const session = await this.findOne(id);

    // Check if user is authorized to update this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update sessions you created');
    }

    session.aiGeneratedContent = null;
    return this.sessionRepository.save(session);
  }

  async getSessionsWithGeneratedContent(authorId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        authorId,
        isActive: true,
        aiGeneratedContent: Not(IsNull())
      },
      relations: ['author', 'location', 'trainer', 'audience', 'tone', 'category', 'topics'],
      order: { updatedAt: 'DESC' },
    });
  }

  // Content versioning methods for Story 2.5
  async getContentVersions(id: string, user: User): Promise<{ versions: any[]; hasVersions: boolean }> {
    const session = await this.findOne(id);

    // Check if user is authorized to view this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only view sessions you created');
    }

    if (!session.aiGeneratedContent) {
      return { versions: [], hasVersions: false };
    }

    try {
      const content = JSON.parse(session.aiGeneratedContent);
      const versions = content.previousVersions || [];

      return {
        versions: versions.map((version, index) => ({
          index,
          ...version,
          isSelected: false
        })),
        hasVersions: versions.length > 0
      };
    } catch (error) {
      console.error('Error parsing content versions:', error);
      return { versions: [], hasVersions: false };
    }
  }

  async restoreContentVersion(id: string, versionIndex: number, user: User): Promise<Session> {
    const session = await this.findOne(id);

    // Check if user is authorized to update this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update sessions you created');
    }

    if (!session.aiGeneratedContent) {
      throw new BadRequestException('No content found to restore from');
    }

    try {
      const content = JSON.parse(session.aiGeneratedContent);
      const versions = content.previousVersions || [];

      if (versionIndex < 0 || versionIndex >= versions.length) {
        throw new BadRequestException('Invalid version index');
      }

      const versionToRestore = versions[versionIndex];

      // Move current content to versions and restore selected version
      const updatedVersions = [...versions];
      updatedVersions.splice(versionIndex, 1); // Remove the version we're restoring
      updatedVersions.unshift({
        ...content,
        versionTimestamp: new Date()
      });

      const restoredContent = {
        ...versionToRestore,
        previousVersions: updatedVersions.slice(0, 5), // Keep only last 5 versions
        version: (content.version || 1) + 1,
        generatedAt: new Date()
      };

      session.aiGeneratedContent = JSON.stringify(restoredContent);
      return this.sessionRepository.save(session);
    } catch (error) {
      console.error('Error restoring content version:', error);
      throw new BadRequestException('Failed to restore content version');
    }
  }

  // AI Content Integration methods for Story 2.6
  async integrateAIContentToDraft(id: string, integrateDto: IntegrateAIContentDto, user: User): Promise<Session> {
    const session = await this.findOne(id);

    // Check if user is authorized to update this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update sessions you created');
    }

    if (!session.aiGeneratedContent) {
      throw new BadRequestException('No AI content found to integrate');
    }

    try {
      // Parse the AI generated content
      const aiContent = JSON.parse(session.aiGeneratedContent);
      const updateData: Partial<Session> = {};

      // Map AI content to session fields based on user selections
      if (integrateDto.selectedHeadline) {
        updateData.promotionalHeadline = integrateDto.selectedHeadline;

        // Optionally update the main title if requested
        if (integrateDto.overrideExistingTitle) {
          updateData.title = integrateDto.selectedHeadline;
        }
      }

      if (integrateDto.selectedDescription) {
        updateData.promotionalSummary = integrateDto.selectedDescription;

        // Optionally update the main description if requested
        if (integrateDto.overrideExistingDescription) {
          updateData.description = integrateDto.selectedDescription;
        }
      }

      if (integrateDto.selectedKeyBenefits) {
        updateData.keyBenefits = integrateDto.selectedKeyBenefits;
      }

      if (integrateDto.selectedCallToAction) {
        updateData.callToAction = integrateDto.selectedCallToAction;
      }

      if (integrateDto.selectedSocialMedia) {
        updateData.socialMediaContent = integrateDto.selectedSocialMedia;
      }

      if (integrateDto.selectedEmailCopy) {
        updateData.emailMarketingContent = integrateDto.selectedEmailCopy;
      }

      // If preserveAIContent is false, clear the AI content after integration
      if (!integrateDto.preserveAIContent) {
        updateData.aiGeneratedContent = null;
      }

      // Update the session with integrated content
      Object.assign(session, updateData);
      return this.sessionRepository.save(session);

    } catch (error) {
      console.error('Error integrating AI content:', error);
      throw new BadRequestException('Failed to integrate AI content to session');
    }
  }

  async previewSessionWithAIContent(id: string, user: User): Promise<{
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
    const session = await this.findOne(id);

    // Check if user is authorized to view this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only view sessions you created');
    }

    let aiContent = null;
    let previewData = {
      title: session.title,
      description: session.description || '',
      promotionalHeadline: session.promotionalHeadline,
      promotionalSummary: session.promotionalSummary,
      keyBenefits: session.keyBenefits,
      callToAction: session.callToAction,
      socialMediaContent: session.socialMediaContent,
      emailMarketingContent: session.emailMarketingContent
    };

    if (session.aiGeneratedContent) {
      try {
        aiContent = JSON.parse(session.aiGeneratedContent);

        // If no promotional content exists, suggest AI content as preview
        if (!session.promotionalHeadline && aiContent.contents) {
          const headlineContent = aiContent.contents.find(c => c.type === 'headline');
          if (headlineContent) {
            previewData.promotionalHeadline = headlineContent.content;
          }
        }

        if (!session.promotionalSummary && aiContent.contents) {
          const descriptionContent = aiContent.contents.find(c => c.type === 'description');
          if (descriptionContent) {
            previewData.promotionalSummary = descriptionContent.content;
          }
        }
      } catch (error) {
        console.error('Error parsing AI content for preview:', error);
      }
    }

    return {
      session,
      aiContent,
      previewData
    };
  }

  async finalizeSessionDraft(id: string, user: User): Promise<Session> {
    const session = await this.findOne(id);

    // Check if user is authorized to update this session
    if (session.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update sessions you created');
    }

    // Validate that session has required content for finalization
    if (!session.title || !session.description) {
      throw new BadRequestException('Session must have title and description to finalize');
    }

    // Mark session as ready for publishing workflow
    session.status = SessionStatus.DRAFT; // Keep as draft until publishing workflow

    return this.sessionRepository.save(session);
  }

  // Public session methods for Story 5.1-5.2
  async findPublishedSessions(): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        isActive: true,
        status: SessionStatus.PUBLISHED
      },
      relations: ['location', 'trainer'],
      order: { startTime: 'ASC' },
    });
  }

  async findPublicSession(id: string): Promise<Session> {
    const session = await this.sessionRepository.findOne({
      where: {
        id,
        isActive: true,
        status: SessionStatus.PUBLISHED
      },
      relations: ['location', 'trainer'],
    });

    if (!session) {
      throw new NotFoundException(`Published session with ID ${id} not found`);
    }

    return session;
  }

  // Registration methods for Story 5.3
  async registerForSession(sessionId: string, createRegistrationDto: CreateRegistrationDto): Promise<{
    success: boolean;
    message: string;
    registrationId?: string;
  }> {
    // Find and validate session
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
        isActive: true,
        status: SessionStatus.PUBLISHED
      },
      relations: ['registrations'],
    });

    if (!session) {
      throw new NotFoundException('Session not found or registration is closed');
    }

    // Check if session is accepting registrations
    const currentRegistrations = session.registrations?.length || 0;
    if (currentRegistrations >= session.maxRegistrations) {
      throw new BadRequestException('Registration is full for this session');
    }

    // Check for duplicate registration (same email for same session)
    const existingRegistration = await this.registrationRepository.findOne({
      where: {
        sessionId,
        email: createRegistrationDto.email.toLowerCase(),
      },
    });

    if (existingRegistration) {
      throw new ConflictException('You are already registered for this session');
    }

    try {
      // Create registration with pending sync status
      const registration = this.registrationRepository.create({
        sessionId,
        name: createRegistrationDto.name.trim(),
        email: createRegistrationDto.email.toLowerCase().trim(),
        referredBy: createRegistrationDto.referredBy?.trim() || null,
        syncStatus: SyncStatus.PENDING,
        syncAttempts: 0,
      });

      const savedRegistration = await this.registrationRepository.save(registration);

      return {
        success: true,
        message: 'Registration successful! You will receive a confirmation email shortly.',
        registrationId: savedRegistration.id,
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new BadRequestException('Registration failed. Please try again later.');
    }
  }

  async getRegistrationsBySession(sessionId: string): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
    });
  }

  async getRegistrationCount(sessionId: string): Promise<number> {
    return this.registrationRepository.count({
      where: { sessionId },
    });
  }
}