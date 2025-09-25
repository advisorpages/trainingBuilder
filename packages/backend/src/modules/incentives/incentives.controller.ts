import { Body, Controller, Get, Post } from '@nestjs/common';
import { IncentivesService } from './incentives.service';
import { CreateIncentiveDto } from './dto/create-incentive.dto';

@Controller('incentives')
export class IncentivesController {
  constructor(private readonly incentivesService: IncentivesService) {}

  @Get()
  async list() {
    return this.incentivesService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateIncentiveDto) {
    return this.incentivesService.create(dto);
  }
}
