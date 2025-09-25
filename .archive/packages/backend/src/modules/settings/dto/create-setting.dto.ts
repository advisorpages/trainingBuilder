import { IsNotEmpty, IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { SettingDataType } from '../../../entities/system-setting.entity';

export class CreateSettingDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  key: string;

  @IsNotEmpty()
  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsIn(Object.values(SettingDataType))
  dataType: SettingDataType;

  @IsOptional()
  @IsString()
  defaultValue?: string;
}