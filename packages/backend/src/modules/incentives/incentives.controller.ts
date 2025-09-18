import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { IncentivesService } from './incentives.service';
import { CreateIncentiveDto, UpdateIncentiveDto } from './dto';
import { Incentive } from '../../entities/incentive.entity';

@Controller('incentives')
@UseGuards(JwtAuthGuard)
export class IncentivesController {
  constructor(
    private readonly incentivesService: IncentivesService,
  ) {}

  @Get('status')
  getIncentivesStatus(): object {
    return this.incentivesService.getStatus();
  }

  @Post()
  create(@Body() createIncentiveDto: CreateIncentiveDto, @Request() req): Promise<Incentive> {
    return this.incentivesService.create(createIncentiveDto, req.user);
  }

  @Get()
  findAll(): Promise<Incentive[]> {
    return this.incentivesService.findAll();
  }

  @Get('author/:authorId')
  findByAuthor(@Param('authorId') authorId: string): Promise<Incentive[]> {
    return this.incentivesService.findByAuthor(authorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Incentive> {
    return this.incentivesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIncentiveDto: UpdateIncentiveDto,
    @Request() req
  ): Promise<Incentive> {
    return this.incentivesService.update(id, updateIncentiveDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.incentivesService.remove(id, req.user);
  }

  // Draft-specific endpoints for Story 6.2
  @Patch(':id/draft')
  saveDraft(
    @Param('id') id: string,
    @Body() updateIncentiveDto: UpdateIncentiveDto,
    @Request() req
  ): Promise<Incentive> {
    return this.incentivesService.saveDraft(id, updateIncentiveDto, req.user);
  }

  @Get('drafts/my')
  getMyDrafts(@Request() req): Promise<Incentive[]> {
    return this.incentivesService.getDraftsByAuthor(req.user.id);
  }

  @Post(':id/auto-save')
  autoSaveDraft(
    @Param('id') id: string,
    @Body() partialData: Partial<UpdateIncentiveDto>,
    @Request() req
  ): Promise<{ success: boolean; lastSaved: Date }> {
    return this.incentivesService.autoSaveDraft(id, partialData, req.user);
  }

  @Get(':id/saveable')
  isDraftSaveable(@Param('id') id: string, @Request() req): Promise<{ saveable: boolean }> {
    return this.incentivesService.isDraftSaveable(id, req.user).then(saveable => ({ saveable }));
  }

  // Publishing endpoints for Story 6.4
  @Post(':id/publish')
  publish(@Param('id') id: string, @Request() req): Promise<Incentive> {
    return this.incentivesService.publish(id, req.user);
  }

  @Delete(':id/unpublish')
  unpublish(@Param('id') id: string, @Request() req): Promise<Incentive> {
    return this.incentivesService.unpublish(id, req.user);
  }

  @Get('public/active')
  @Public()
  getActiveIncentives(): Promise<Incentive[]> {
    return this.incentivesService.getActiveIncentives();
  }

  // Clone endpoint for Story 6.5
  @Post(':id/clone')
  clone(@Param('id') id: string, @Request() req): Promise<Incentive> {
    return this.incentivesService.clone(id, req.user);
  }
}