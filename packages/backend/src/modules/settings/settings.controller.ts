import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService, PaginatedSettings } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingQueryDto } from './dto/setting-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@shared/types';
import { SystemSetting } from '../../entities/system-setting.entity';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSettingDto: CreateSettingDto): Promise<SystemSetting> {
    return await this.settingsService.create(createSettingDto);
  }

  @Get()
  async findAll(@Query() query: SettingQueryDto): Promise<PaginatedSettings> {
    return await this.settingsService.findAll(query);
  }

  @Get('categories')
  async getCategories(): Promise<{ categories: string[] }> {
    const categories = await this.settingsService.getCategories();
    return { categories };
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string): Promise<SystemSetting[]> {
    return await this.settingsService.findByCategory(category);
  }

  @Get(':key')
  async findOne(@Param('key') key: string): Promise<SystemSetting> {
    return await this.settingsService.findOne(key);
  }

  @Get(':key/value')
  async getValue(@Param('key') key: string): Promise<{ key: string; value: any }> {
    const value = await this.settingsService.findByKey(key);
    return { key, value };
  }

  @Patch(':key')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  async update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ): Promise<SystemSetting> {
    return await this.settingsService.update(key, updateSettingDto);
  }

  @Patch(':key/reset')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  async resetToDefault(@Param('key') key: string): Promise<SystemSetting> {
    return await this.settingsService.resetToDefault(key);
  }

  @Post('bulk-update')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  async bulkUpdate(@Body() updates: Record<string, string>): Promise<SystemSetting[]> {
    return await this.settingsService.bulkUpdate(updates);
  }

  @Delete(':key')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('key') key: string): Promise<void> {
    return await this.settingsService.remove(key);
  }
}