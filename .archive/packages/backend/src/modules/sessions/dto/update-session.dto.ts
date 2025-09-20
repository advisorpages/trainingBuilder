import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsIn } from 'class-validator';
import { CreateSessionDto } from './create-session.dto';
import { SessionStatus } from '../../../entities/session.entity';

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
  @IsOptional()
  @IsIn(Object.values(SessionStatus))
  status?: SessionStatus;
}