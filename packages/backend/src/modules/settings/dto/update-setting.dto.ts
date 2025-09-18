import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { SettingDataType } from '../../../entities/system-setting.entity';

export class UpdateSettingDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsIn(Object.values(SettingDataType))
  dataType?: SettingDataType;

  @IsOptional()
  @IsString()
  defaultValue?: string;
}