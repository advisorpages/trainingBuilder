import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsNotEmpty, MaxLength, IsOptional, IsString, IsIn } from 'class-validator';

export enum SettingDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

@Entity('system_settings')
export class SystemSetting {
  @PrimaryColumn({ length: 255 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  key: string;

  @Column({ type: 'text' })
  @IsNotEmpty()
  value: string;

  @Column({ length: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Column({ length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @Column({
    type: 'enum',
    enum: SettingDataType,
    default: SettingDataType.STRING,
  })
  @IsIn(Object.values(SettingDataType))
  dataType: SettingDataType;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  defaultValue?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper method to get parsed value based on data type
  getParsedValue(): any {
    switch (this.dataType) {
      case SettingDataType.NUMBER:
        return parseFloat(this.value);
      case SettingDataType.BOOLEAN:
        return this.value.toLowerCase() === 'true';
      case SettingDataType.JSON:
        try {
          return JSON.parse(this.value);
        } catch {
          return this.value;
        }
      default:
        return this.value;
    }
  }

  // Helper method to set value with proper string conversion
  setParsedValue(value: any): void {
    if (this.dataType === SettingDataType.JSON && typeof value === 'object') {
      this.value = JSON.stringify(value);
    } else {
      this.value = String(value);
    }
  }
}