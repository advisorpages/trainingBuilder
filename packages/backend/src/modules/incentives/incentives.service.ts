import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Incentive, IncentiveStatus } from '../../entities/incentive.entity';
import { User } from '../../entities/user.entity';
import { CreateIncentiveDto, UpdateIncentiveDto } from './dto';

@Injectable()
export class IncentivesService {
  constructor(
    @InjectRepository(Incentive)
    private incentiveRepository: Repository<Incentive>,
  ) {}

  getStatus(): object {
    return {
      module: 'Incentives',
      status: 'Active - Incentive Draft Management',
      features: [
        'Incentive creation and management',
        'Draft save and auto-save functionality',
        'AI content integration',
      ],
    };
  }

  async create(createIncentiveDto: CreateIncentiveDto, author: User): Promise<Incentive> {
    // Validate start and end dates
    if (createIncentiveDto.endDate <= createIncentiveDto.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const incentive = this.incentiveRepository.create({
      ...createIncentiveDto,
      authorId: author.id,
      status: IncentiveStatus.DRAFT,
      isActive: true,
    });

    return this.incentiveRepository.save(incentive);
  }

  async findAll(): Promise<Incentive[]> {
    return this.incentiveRepository.find({
      where: { isActive: true },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAuthor(authorId: string): Promise<Incentive[]> {
    return this.incentiveRepository.find({
      where: { authorId, isActive: true },
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Incentive> {
    const incentive = await this.incentiveRepository.findOne({
      where: { id, isActive: true },
      relations: ['author'],
    });

    if (!incentive) {
      throw new NotFoundException(`Incentive with ID ${id} not found`);
    }

    return incentive;
  }

  async update(id: string, updateIncentiveDto: UpdateIncentiveDto, user: User): Promise<Incentive> {
    const incentive = await this.findOne(id);

    // Check if user is authorized to update this incentive
    if (incentive.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update incentives you created');
    }

    // Validate dates if they're being updated
    const startDate = updateIncentiveDto.startDate || incentive.startDate;
    const endDate = updateIncentiveDto.endDate || incentive.endDate;

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    Object.assign(incentive, updateIncentiveDto);
    return this.incentiveRepository.save(incentive);
  }

  async remove(id: string, user: User): Promise<void> {
    const incentive = await this.findOne(id);

    // Check if user is authorized to delete this incentive
    if (incentive.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only delete incentives you created');
    }

    // Soft delete by setting isActive to false
    incentive.isActive = false;
    await this.incentiveRepository.save(incentive);
  }

  // Draft-specific operations following Story 2.2 patterns
  async saveDraft(id: string, updateIncentiveDto: UpdateIncentiveDto, user: User): Promise<Incentive> {
    const incentive = await this.findOne(id);

    // Check if user is authorized to update this incentive
    if (incentive.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only update incentives you created');
    }

    // Ensure incentive remains in draft status
    if (updateIncentiveDto.hasOwnProperty('status') && updateIncentiveDto.status !== IncentiveStatus.DRAFT) {
      delete updateIncentiveDto.status;
    }

    // For drafts, we're more lenient with validation - allow partial data
    Object.assign(incentive, updateIncentiveDto);
    incentive.status = IncentiveStatus.DRAFT;

    return this.incentiveRepository.save(incentive);
  }

  async getDraftsByAuthor(authorId: string): Promise<Incentive[]> {
    return this.incentiveRepository.find({
      where: {
        authorId,
        isActive: true,
        status: IncentiveStatus.DRAFT
      },
      relations: ['author'],
      order: { updatedAt: 'DESC' },
    });
  }

  async autoSaveDraft(id: string, partialData: Partial<UpdateIncentiveDto>, user: User): Promise<{ success: boolean; lastSaved: Date }> {
    try {
      const incentive = await this.findOne(id);

      // Check if user is authorized
      if (incentive.authorId !== user.id && user.role.name !== 'Broker') {
        throw new ForbiddenException('You can only update incentives you created');
      }

      // Only update non-empty fields for auto-save
      const updateData: Partial<UpdateIncentiveDto> = {};
      Object.keys(partialData).forEach(key => {
        const value = partialData[key as keyof UpdateIncentiveDto];
        if (value !== undefined && value !== null && value !== '') {
          (updateData as any)[key] = value;
        }
      });

      if (Object.keys(updateData).length > 0) {
        Object.assign(incentive, updateData);
        incentive.status = IncentiveStatus.DRAFT;
        await this.incentiveRepository.save(incentive);
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
      const incentive = await this.findOne(id);
      return incentive.authorId === user.id || user.role.name === 'Broker';
    } catch {
      return false;
    }
  }

  // Publishing workflow methods for Story 6.4
  async publish(id: string, user: User): Promise<Incentive> {
    const incentive = await this.findOne(id);

    // Check if user is authorized to publish this incentive
    if (incentive.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only publish incentives you created');
    }

    // Validate incentive completeness before publishing
    this.validateIncentiveForPublication(incentive);

    // Update status to published
    incentive.status = IncentiveStatus.PUBLISHED;

    return this.incentiveRepository.save(incentive);
  }

  async unpublish(id: string, user: User): Promise<Incentive> {
    const incentive = await this.findOne(id);

    // Check if user is authorized to unpublish this incentive
    if (incentive.authorId !== user.id && user.role.name !== 'Broker') {
      throw new ForbiddenException('You can only unpublish incentives you created');
    }

    // Only allow unpublishing of published incentives
    if (incentive.status !== IncentiveStatus.PUBLISHED) {
      throw new BadRequestException('Only published incentives can be unpublished');
    }

    // Return to draft status
    incentive.status = IncentiveStatus.DRAFT;

    return this.incentiveRepository.save(incentive);
  }

  async getPublishedIncentives(): Promise<Incentive[]> {
    const now = new Date();

    return this.incentiveRepository.find({
      where: {
        isActive: true,
        status: IncentiveStatus.PUBLISHED,
        endDate: Not(IsNull()) // Ensure end date exists
      },
      relations: ['author'],
      order: { endDate: 'ASC' }, // Sort by end date, expiring soon first
    });
  }

  async getActiveIncentives(): Promise<Incentive[]> {
    const now = new Date();

    return this.incentiveRepository.find({
      where: {
        isActive: true,
        status: IncentiveStatus.PUBLISHED,
        endDate: Not(IsNull()) // Ensure end date exists
      },
      relations: ['author'],
      order: { endDate: 'ASC' },
    });
  }

  private validateIncentiveForPublication(incentive: Incentive): void {
    const errors: string[] = [];

    // Check required fields
    if (!incentive.title?.trim()) {
      errors.push('Title is required');
    }

    if (!incentive.description?.trim()) {
      errors.push('Description is required');
    }

    if (!incentive.rules?.trim()) {
      errors.push('Rules are required');
    }

    if (!incentive.startDate) {
      errors.push('Start date is required');
    }

    if (!incentive.endDate) {
      errors.push('End date is required');
    }

    // Validate dates
    if (incentive.startDate && incentive.endDate) {
      const now = new Date();
      const endDate = new Date(incentive.endDate);

      if (endDate <= now) {
        errors.push('End date must be in the future');
      }

      if (new Date(incentive.endDate) <= new Date(incentive.startDate)) {
        errors.push('End date must be after start date');
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException(`Cannot publish incentive: ${errors.join(', ')}`);
    }
  }

  // Automated lifecycle management
  async expireIncentives(): Promise<{ expired: number; errors: string[] }> {
    const now = new Date();
    const errors: string[] = [];
    let expired = 0;

    try {
      // Find published incentives that are past their end date
      const incentivesToExpire = await this.incentiveRepository.find({
        where: {
          isActive: true,
          status: IncentiveStatus.PUBLISHED,
          endDate: Not(IsNull())
        },
        relations: ['author'],
      });

      const expiredIncentives = incentivesToExpire.filter(incentive => {
        const endDate = new Date(incentive.endDate);
        return endDate < now;
      });

      // Update status to expired
      for (const incentive of expiredIncentives) {
        try {
          incentive.status = IncentiveStatus.EXPIRED;
          await this.incentiveRepository.save(incentive);
          expired++;
        } catch (error) {
          errors.push(`Failed to expire incentive ${incentive.id}: ${error.message}`);
        }
      }

      return { expired, errors };
    } catch (error) {
      errors.push(`Failed to check for expired incentives: ${error.message}`);
      return { expired: 0, errors };
    }
  }

  // Clone incentive functionality for Story 6.5
  async clone(sourceId: string, cloneAuthor: User): Promise<Incentive> {
    // 1. Fetch source incentive with validation
    const sourceIncentive = await this.incentiveRepository.findOne({
      where: { id: sourceId, isActive: true },
      relations: ['author'],
    });

    if (!sourceIncentive) {
      throw new NotFoundException('Source incentive not found');
    }

    // 2. Create new incentive object with copied content
    const clonedIncentive = this.incentiveRepository.create({
      // Copy all content fields
      title: `${sourceIncentive.title} (Copy)`,
      description: sourceIncentive.description,
      rules: sourceIncentive.rules,
      aiGeneratedContent: sourceIncentive.aiGeneratedContent,

      // Reset metadata fields
      authorId: cloneAuthor.id,
      status: IncentiveStatus.DRAFT,
      isActive: true,

      // Clear date fields (to be set by user)
      startDate: new Date(), // Set default start date to today
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
    });

    // 3. Save to database with new UUID (automatically generated)
    const savedClone = await this.incentiveRepository.save(clonedIncentive);

    // 4. Log clone action for audit (basic logging)
    console.log(`Incentive ${sourceId} cloned as ${savedClone.id} by user ${cloneAuthor.id}`);

    // 5. Return new draft incentive with relations
    return this.incentiveRepository.findOne({
      where: { id: savedClone.id },
      relations: ['author'],
    });
  }
}