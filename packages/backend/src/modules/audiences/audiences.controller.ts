import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AudiencesService, PaginatedAudiences } from './audiences.service';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { AudienceQueryDto } from './dto/audience-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@shared/types';
import { Audience } from '../../entities/audience.entity';

@Controller('admin/audiences')
@UseGuards(JwtAuthGuard)
export class AudiencesController {
  constructor(private readonly audiencesService: AudiencesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAudienceDto: CreateAudienceDto): Promise<Audience> {
    return await this.audiencesService.create(createAudienceDto);
  }

  @Get()
  async findAll(@Query() query: AudienceQueryDto): Promise<PaginatedAudiences> {
    return await this.audiencesService.findAll(query);
  }

  @Get('active')
  async findActiveAudiences(): Promise<Audience[]> {
    return await this.audiencesService.findActiveAudiences();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Audience> {
    return await this.audiencesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAudienceDto: UpdateAudienceDto,
  ): Promise<Audience> {
    return await this.audiencesService.update(id, updateAudienceDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.audiencesService.remove(id);
  }

  @Get(':id/usage-check')
  async checkUsage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ inUse: boolean; sessionCount: number }> {
    return await this.audiencesService.checkAudienceInUse(id);
  }
}