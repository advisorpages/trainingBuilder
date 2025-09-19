import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';

export interface PaginatedCategories {
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Check for duplicate name
    const existingCategory = await this.categoriesRepository.findOne({
      where: { name: createCategoryDto.name }
    });

    if (existingCategory) {
      throw new BadRequestException('A category with this name already exists');
    }

    const category = this.categoriesRepository.create(createCategoryDto);
    return await this.categoriesRepository.save(category);
  }

  async findAll(query: CategoryQueryDto): Promise<PaginatedCategories> {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.categoriesRepository.createQueryBuilder('category');

    if (search) {
      queryBuilder.where(
        'category.name ILIKE :search OR category.description ILIKE :search',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }

    queryBuilder
      .orderBy('category.name', 'ASC')
      .skip(skip)
      .take(limit);

    const [categories, total] = await queryBuilder.getManyAndCount();

    return {
      categories,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActiveCategories(): Promise<Category[]> {
    return await this.categoriesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Check for duplicate name if name is being updated
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoriesRepository.findOne({
        where: { name: updateCategoryDto.name }
      });

      if (existingCategory) {
        throw new BadRequestException('A category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category is in use by sessions
    if (category.sessions && category.sessions.length > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" as it is referenced by ${category.sessions.length} session(s). Please remove it from all sessions first.`
      );
    }

    await this.categoriesRepository.remove(category);
  }

  async checkCategoryInUse(id: number): Promise<{ inUse: boolean; sessionCount: number }> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    const sessionCount = category.sessions ? category.sessions.length : 0;

    return {
      inUse: sessionCount > 0,
      sessionCount
    };
  }
}