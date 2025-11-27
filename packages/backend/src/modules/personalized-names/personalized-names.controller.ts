import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PersonalizedNamesService } from './personalized-names.service';
import { CreatePersonalizedNameDto, UpdatePersonalizedNameDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PersonalizedName } from '../../entities/personalized-name.entity';

@Controller('personalized-names')
@UseGuards(JwtAuthGuard)
export class PersonalizedNamesController {
  constructor(private readonly personalizedNamesService: PersonalizedNamesService) {}

  @Post()
  async create(
    @Body() createDto: CreatePersonalizedNameDto,
    @Request() req: any,
  ): Promise<PersonalizedName> {
    return this.personalizedNamesService.create(req.user.id, createDto);
  }

  @Get()
  async findAll(@Request() req: any): Promise<PersonalizedName[]> {
    return this.personalizedNamesService.findAll(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any): Promise<PersonalizedName> {
    return this.personalizedNamesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePersonalizedNameDto,
    @Request() req: any,
  ): Promise<PersonalizedName> {
    return this.personalizedNamesService.update(req.user.id, id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.personalizedNamesService.remove(req.user.id, id);
  }

  @Get('type/:type')
  async getByType(@Param('type') type: string, @Request() req: any): Promise<{ name: string | null }> {
    const name = await this.personalizedNamesService.getNameByType(req.user.id, type);
    return { name };
  }
}