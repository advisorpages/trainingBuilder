import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SettingDataType } from '../../../entities/system-setting.entity';

export class SettingQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(Object.values(SettingDataType))
  dataType?: SettingDataType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}