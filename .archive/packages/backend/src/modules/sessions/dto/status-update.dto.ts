import { IsEnum, IsOptional, MaxLength } from 'class-validator';
import { SessionStatus } from '../../../entities/session.entity';

export class StatusUpdateDto {
  @IsEnum(SessionStatus)
  status: SessionStatus;

  @IsOptional()
  @MaxLength(1000)
  reason?: string;
}