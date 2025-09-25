import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandingPage } from '../../entities';

@Injectable()
export class LandingPagesService {
  constructor(
    @InjectRepository(LandingPage)
    private readonly landingPageRepository: Repository<LandingPage>,
  ) {}

  async findBySlug(slug: string): Promise<LandingPage> {
    const landingPage = await this.landingPageRepository.findOne({
      where: { slug },
      relations: ['session'],
    });

    if (!landingPage) {
      throw new NotFoundException(`Landing page ${slug} not found`);
    }

    return landingPage;
  }
}
