import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting, SettingDataType } from '../../entities/system-setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingQueryDto } from './dto/setting-query.dto';

export interface PaginatedSettings {
  settings: SystemSetting[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepository: Repository<SystemSetting>,
  ) {}

  async create(createSettingDto: CreateSettingDto): Promise<SystemSetting> {
    // Check if setting with same key already exists
    const existingSetting = await this.settingRepository.findOne({
      where: { key: createSettingDto.key }
    });

    if (existingSetting) {
      throw new ConflictException('Setting with this key already exists');
    }

    // Validate value format based on data type
    this.validateValueFormat(createSettingDto.value, createSettingDto.dataType);

    const setting = this.settingRepository.create(createSettingDto);
    return await this.settingRepository.save(setting);
  }

  async findAll(query: SettingQueryDto): Promise<PaginatedSettings> {
    const { search, category, dataType, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.settingRepository.createQueryBuilder('setting');

    // Apply filters
    if (search) {
      queryBuilder.where(
        '(setting.key ILIKE :search OR setting.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('setting.category = :category', { category });
    }

    if (dataType) {
      queryBuilder.andWhere('setting.dataType = :dataType', { dataType });
    }

    // Add pagination and ordering
    queryBuilder
      .orderBy('setting.category', 'ASC')
      .addOrderBy('setting.key', 'ASC')
      .skip(skip)
      .take(limit);

    const [settings, total] = await queryBuilder.getManyAndCount();

    return {
      settings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(key: string): Promise<SystemSetting> {
    const setting = await this.settingRepository.findOne({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    return setting;
  }

  async findByKey(key: string): Promise<any> {
    const setting = await this.findOne(key);
    return setting.getParsedValue();
  }

  async findByCategory(category: string): Promise<SystemSetting[]> {
    return await this.settingRepository.find({
      where: { category },
      order: { key: 'ASC' },
    });
  }

  async update(key: string, updateSettingDto: UpdateSettingDto): Promise<SystemSetting> {
    const setting = await this.findOne(key);

    // Validate value format if value or dataType is being updated
    if (updateSettingDto.value !== undefined || updateSettingDto.dataType !== undefined) {
      const newDataType = updateSettingDto.dataType || setting.dataType;
      const newValue = updateSettingDto.value !== undefined ? updateSettingDto.value : setting.value;
      this.validateValueFormat(newValue, newDataType);
    }

    Object.assign(setting, updateSettingDto);
    return await this.settingRepository.save(setting);
  }

  async remove(key: string): Promise<void> {
    const setting = await this.findOne(key);
    await this.settingRepository.remove(setting);
  }

  async getCategories(): Promise<string[]> {
    const result = await this.settingRepository
      .createQueryBuilder('setting')
      .select('DISTINCT setting.category', 'category')
      .where('setting.category IS NOT NULL')
      .getRawMany();

    return result.map(r => r.category).sort();
  }

  async resetToDefault(key: string): Promise<SystemSetting> {
    const setting = await this.findOne(key);

    if (!setting.defaultValue) {
      throw new BadRequestException('No default value defined for this setting');
    }

    setting.value = setting.defaultValue;
    return await this.settingRepository.save(setting);
  }

  async bulkUpdate(updates: Record<string, string>): Promise<SystemSetting[]> {
    const results: SystemSetting[] = [];

    for (const [key, value] of Object.entries(updates)) {
      try {
        const updated = await this.update(key, { value });
        results.push(updated);
      } catch (error) {
        // Continue with other updates even if one fails
        console.error(`Failed to update setting ${key}:`, error.message);
      }
    }

    return results;
  }

  private validateValueFormat(value: string, dataType: SettingDataType): void {
    switch (dataType) {
      case SettingDataType.NUMBER:
        if (isNaN(parseFloat(value))) {
          throw new BadRequestException('Value must be a valid number');
        }
        break;
      case SettingDataType.BOOLEAN:
        if (!['true', 'false'].includes(value.toLowerCase())) {
          throw new BadRequestException('Value must be "true" or "false"');
        }
        break;
      case SettingDataType.JSON:
        try {
          JSON.parse(value);
        } catch {
          throw new BadRequestException('Value must be valid JSON');
        }
        break;
      // STRING type requires no additional validation
    }
  }
}