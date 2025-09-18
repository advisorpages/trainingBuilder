# 5. Incentive System - Technical Specification

## Overview

The Incentive Management System (Epic 6) provides comprehensive functionality for creating, managing, and publishing promotional incentives for training sessions. The system follows the same architectural patterns as the session management system, ensuring consistency and maintainability.

## System Architecture

### High-Level Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Backend API   │    │   Database      │
│                 │    │                 │    │                 │
│ • IncentiveForm │◄──►│ IncentivesCtrl  │◄──►│ incentives      │
│ • Dashboard     │    │ IncentivesServ  │    │ users           │
│ • Public Display│    │ AI Integration  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Frontend**: React with TypeScript
- **Authentication**: JWT-based with role-based access control
- **AI Integration**: OpenAI API for content generation

## Database Schema

### Incentive Entity

```typescript
@Entity('incentives')
export class Incentive {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  rules?: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: IncentiveStatus; // 'draft' | 'published' | 'expired' | 'cancelled'

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ name: 'ai_generated_content', type: 'text', nullable: true })
  aiGeneratedContent?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, user => user.authoredIncentives, { eager: true })
  @JoinColumn({ name: 'author_id' })
  author: User;
}
```

### Database Indexes

```sql
-- Performance indexes for common queries
CREATE INDEX idx_incentives_status ON incentives(status);
CREATE INDEX idx_incentives_author_id ON incentives(author_id);
CREATE INDEX idx_incentives_dates ON incentives(start_date, end_date);
CREATE INDEX idx_incentives_active_published ON incentives(is_active, status)
  WHERE is_active = true AND status = 'published';
```

## API Specification

### Authentication & Authorization

All endpoints require JWT authentication except public endpoints marked with `@Public()`.

**Roles:**
- **Content Developer**: Full CRUD access to all incentives
- **Public**: Read access to published incentives only

### Endpoints

#### Public Endpoints

```typescript
// Get active (published, non-expired) incentives for public display
GET /api/incentives/public/active
Response: Incentive[]
```

#### Content Developer Endpoints

```typescript
// Get system status
GET /api/incentives/status
Response: { module: string, status: string, features: string[] }

// Create new incentive
POST /api/incentives
Body: CreateIncentiveDto
Response: Incentive

// Get all incentives for content developer
GET /api/incentives
Response: Incentive[]

// Get incentives by author
GET /api/incentives/author/:authorId
Response: Incentive[]

// Get specific incentive
GET /api/incentives/:id
Response: Incentive

// Update incentive
PATCH /api/incentives/:id
Body: UpdateIncentiveDto
Response: Incentive

// Delete incentive
DELETE /api/incentives/:id
Response: void

// Draft management
PATCH /api/incentives/:id/draft
Body: UpdateIncentiveDto
Response: Incentive

GET /api/incentives/drafts/my
Response: Incentive[]

POST /api/incentives/:id/auto-save
Body: Partial<UpdateIncentiveDto>
Response: { success: boolean, lastSaved: Date }

GET /api/incentives/:id/saveable
Response: { saveable: boolean }

// Publishing
POST /api/incentives/:id/publish
Response: Incentive

DELETE /api/incentives/:id/unpublish
Response: Incentive

// Clone functionality (Story 6.5)
POST /api/incentives/:id/clone
Response: Incentive
```

### Data Transfer Objects

```typescript
// Create Incentive DTO
export class CreateIncentiveDto {
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @MaxLength(2000)
  rules?: string;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @MaxLength(2000)
  aiGeneratedContent?: string;
}

// Update Incentive DTO
export class UpdateIncentiveDto extends PartialType(CreateIncentiveDto) {}
```

## Business Logic

### Incentive Lifecycle

```
┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│  DRAFT  │───►│ PUBLISHED │───►│  EXPIRED  │    │ CANCELLED │
└─────────┘    └───────────┘    └───────────┘    └───────────┘
     │                │              △               △
     │                │              │               │
     └────────────────┼──────────────┘               │
                      │                              │
                      └──────────────────────────────┘
```

### Status Transitions

1. **DRAFT → PUBLISHED**: Manual action by Content Developer
2. **PUBLISHED → EXPIRED**: Automatic when `endDate` is reached
3. **DRAFT → CANCELLED**: Manual action by Content Developer
4. **PUBLISHED → CANCELLED**: Manual action by Content Developer (unpublish)

### Validation Rules

```typescript
// Business validation in service layer
validateIncentive(incentive: CreateIncentiveDto | UpdateIncentiveDto): void {
  // Date validation
  if (incentive.endDate <= incentive.startDate) {
    throw new BadRequestException('End date must be after start date');
  }

  // Future start date for new incentives
  const now = new Date();
  if (incentive.startDate < now) {
    throw new BadRequestException('Start date must be in the future');
  }

  // Minimum duration (e.g., 1 day)
  const minDuration = 24 * 60 * 60 * 1000; // 1 day in milliseconds
  if (incentive.endDate.getTime() - incentive.startDate.getTime() < minDuration) {
    throw new BadRequestException('Incentive must run for at least 1 day');
  }
}
```

## Service Layer Architecture

### IncentivesService

```typescript
@Injectable()
export class IncentivesService {
  constructor(
    @InjectRepository(Incentive)
    private incentiveRepository: Repository<Incentive>
  ) {}

  // Core CRUD operations
  async create(dto: CreateIncentiveDto, author: User): Promise<Incentive>
  async findAll(): Promise<Incentive[]>
  async findOne(id: string): Promise<Incentive>
  async update(id: string, dto: UpdateIncentiveDto, user: User): Promise<Incentive>
  async remove(id: string, user: User): Promise<void>

  // Draft management
  async saveDraft(id: string, dto: UpdateIncentiveDto, user: User): Promise<Incentive>
  async autoSaveDraft(id: string, partialData: Partial<UpdateIncentiveDto>, user: User): Promise<{success: boolean, lastSaved: Date}>
  async getDraftsByAuthor(authorId: string): Promise<Incentive[]>
  async isDraftSaveable(id: string, user: User): Promise<boolean>

  // Publishing
  async publish(id: string, user: User): Promise<Incentive>
  async unpublish(id: string, user: User): Promise<Incentive>
  async getActiveIncentives(): Promise<Incentive[]>

  // Clone functionality
  async clone(sourceId: string, cloneAuthor: User): Promise<Incentive>

  // Automated lifecycle management
  async expireIncentives(): Promise<{expired: number, errors: string[]}>
}
```

### Error Handling

```typescript
// Standard error responses
export class IncentiveNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Incentive with ID ${id} not found`);
  }
}

export class IncentiveValidationException extends BadRequestException {
  constructor(message: string) {
    super(`Incentive validation failed: ${message}`);
  }
}

export class IncentivePermissionException extends ForbiddenException {
  constructor(action: string) {
    super(`Insufficient permissions to ${action} incentive`);
  }
}
```

## AI Integration

### Content Generation

The incentive system integrates with the AI service for automated content generation:

```typescript
// AI service integration
export class AIService {
  async generateIncentiveContent(params: {
    title: string;
    startDate: Date;
    endDate: Date;
    targetAudience?: string;
  }): Promise<{
    description: string;
    rules: string;
    promotionalMessage: string;
  }> {
    // Validate required parameters
    if (!params.title) {
      throw new BadRequestException('Incentive title is required for content generation');
    }

    if (!params.startDate || !params.endDate) {
      throw new BadRequestException('Start and end dates are required for content generation');
    }

    // Generate content using OpenAI
    const prompt = this.buildIncentivePrompt(params);
    const response = await this.openaiService.generateContent(prompt);

    return this.parseIncentiveContent(response);
  }
}
```

## Frontend Integration

### React Components

```typescript
// Main incentive form component
interface IncentiveFormProps {
  incentive?: Incentive;
  mode: 'create' | 'edit' | 'clone';
  onSave: (incentive: Incentive) => void;
  onCancel: () => void;
}

export const IncentiveForm: React.FC<IncentiveFormProps> = ({
  incentive,
  mode,
  onSave,
  onCancel
}) => {
  // Form state management
  // Validation logic
  // AI integration
  // Auto-save functionality
};

// Dashboard component
export const IncentiveDashboard: React.FC = () => {
  // Incentive list display
  // Status filtering
  // Clone functionality
  // Publishing controls
};

// Public display component
export const PublicIncentiveDisplay: React.FC = () => {
  // Active incentives display
  // Responsive design
  // Integration with homepage
};
```

### API Client

```typescript
// Frontend API client
export class IncentiveAPI {
  static async getActiveIncentives(): Promise<Incentive[]> {
    return api.get('/incentives/public/active');
  }

  static async createIncentive(data: CreateIncentiveDto): Promise<Incentive> {
    return api.post('/incentives', data);
  }

  static async cloneIncentive(id: string): Promise<Incentive> {
    return api.post(`/incentives/${id}/clone`);
  }

  static async publishIncentive(id: string): Promise<Incentive> {
    return api.post(`/incentives/${id}/publish`);
  }
}
```

## Security Considerations

### Access Control

```typescript
// Route-level security
@Controller('incentives')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class IncentivesController {

  @Get('public/active')
  @Public() // Override authentication for public endpoint
  getActiveIncentives() {}

  @Post()
  @Roles('CONTENT_DEVELOPER') // Role-based access
  create() {}
}
```

### Data Validation

```typescript
// Input sanitization and validation
export class CreateIncentiveDto {
  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  @Transform(({ value }) => value?.trim()) // Trim whitespace
  title: string;

  @IsOptional()
  @MaxLength(2000)
  @IsString()
  @Transform(({ value }) => value?.trim())
  description?: string;
}
```

### Rate Limiting

```typescript
// API rate limiting for clone operations
@Post(':id/clone')
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 clones per minute
clone() {}
```

## Performance Considerations

### Database Optimization

1. **Indexes**: Strategic indexes on frequently queried fields
2. **Pagination**: Implement pagination for large result sets
3. **Caching**: Redis caching for active incentives (public endpoint)

### Query Optimization

```typescript
// Optimized query for active incentives
async getActiveIncentives(): Promise<Incentive[]> {
  return this.incentiveRepository
    .createQueryBuilder('incentive')
    .leftJoinAndSelect('incentive.author', 'author')
    .where('incentive.status = :status', { status: IncentiveStatus.PUBLISHED })
    .andWhere('incentive.isActive = :isActive', { isActive: true })
    .andWhere('incentive.startDate <= :now', { now: new Date() })
    .andWhere('incentive.endDate > :now', { now: new Date() })
    .orderBy('incentive.endDate', 'ASC')
    .getMany();
}
```

## Testing Strategy

### Unit Tests

```typescript
// Service layer testing
describe('IncentivesService', () => {
  describe('clone', () => {
    it('should successfully clone an incentive', async () => {
      // Test clone functionality
    });

    it('should append (Copy) to title', async () => {
      // Test title modification
    });

    it('should reset status to DRAFT', async () => {
      // Test status reset
    });
  });
});
```

### Integration Tests

```typescript
// API endpoint testing
describe('IncentivesController (e2e)', () => {
  it('/incentives/:id/clone (POST)', () => {
    return request(app.getHttpServer())
      .post('/incentives/test-id/clone')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201)
      .expect((res) => {
        expect(res.body.title).toContain('(Copy)');
        expect(res.body.status).toBe('draft');
      });
  });
});
```

## Deployment & Operations

### Environment Configuration

```typescript
// Configuration management
export interface IncentiveConfig {
  autoExpiration: boolean;
  defaultDuration: number; // days
  maxDuration: number; // days
  aiGeneration: boolean;
}
```

### Monitoring

```typescript
// Health checks and monitoring
@Get('health')
async getHealth(): Promise<HealthIndicator> {
  return {
    status: 'healthy',
    database: await this.checkDatabaseConnection(),
    activeIncentives: await this.getActiveIncentiveCount(),
    lastExpiration: await this.getLastExpirationRun(),
  };
}
```

### Automated Tasks

```typescript
// Scheduled tasks for incentive management
@Injectable()
export class IncentiveScheduler {
  @Cron('0 0 * * *') // Daily at midnight
  async expireIncentives() {
    const result = await this.incentivesService.expireIncentives();
    this.logger.log(`Expired ${result.expired} incentives`);

    if (result.errors.length > 0) {
      this.logger.error('Expiration errors:', result.errors);
    }
  }
}
```

## Future Enhancements

### Planned Features

1. **Analytics Integration**: Track incentive performance and engagement
2. **Template System**: Pre-defined incentive templates for quick creation
3. **Multi-language Support**: Internationalization for global deployment
4. **Advanced AI**: More sophisticated content generation with personalization
5. **Approval Workflow**: Multi-step approval process for publishing
6. **Integration APIs**: Webhooks and external system integrations

### Technical Debt

1. **Enhanced Error Handling**: More specific error types and user-friendly messages
2. **Performance Optimization**: Query optimization and caching strategies
3. **Security Hardening**: Additional security measures and audit logging
4. **Test Coverage**: Increase test coverage to 95%+

## Conclusion

The Incentive System provides a robust, scalable foundation for managing promotional incentives within the Leadership Training application. Following established architectural patterns ensures maintainability and consistency with the broader system architecture.

The implementation includes comprehensive CRUD operations, automated lifecycle management, AI-powered content generation, and a full clone functionality that enables efficient content creation workflows.