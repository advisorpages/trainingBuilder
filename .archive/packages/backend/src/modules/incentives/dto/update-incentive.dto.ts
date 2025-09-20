import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsIn } from 'class-validator';
import { CreateIncentiveDto } from './create-incentive.dto';
import { IncentiveStatus } from '../../../entities/incentive.entity';

export class UpdateIncentiveDto extends PartialType(CreateIncentiveDto) {
  @IsOptional()
  @IsIn(Object.values(IncentiveStatus))
  status?: IncentiveStatus;
}