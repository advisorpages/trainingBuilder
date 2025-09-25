import { Controller, Get, Param } from '@nestjs/common';
import { LandingPagesService } from './landing-pages.service';

@Controller('landing-pages')
export class LandingPagesController {
  constructor(private readonly landingPagesService: LandingPagesService) {}

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.landingPagesService.findBySlug(slug);
  }
}
