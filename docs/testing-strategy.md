# Testing Strategy Document
## Leadership Training App - TrainingBuilderv4

### Document Version: 1.0
### Created: 2025-09-18
### Status: Draft

---

## 1. EXECUTIVE SUMMARY

This document defines the comprehensive testing strategy for TrainingBuilderv4, addressing critical gaps identified in the architecture validation and establishing the foundation for production-ready testing infrastructure.

### Current State
- ✅ Manual QA testing completed for all 6 epics
- ✅ Epic 4 detailed test results available (failed/fixed)
- ❌ **No automated testing infrastructure**
- ❌ **No unit testing framework**
- ❌ **No integration testing strategy**
- ❌ **No CI/CD testing pipeline**

### Goal State
- 🎯 Comprehensive automated testing at all levels
- 🎯 CI/CD integration with test gates
- 🎯 95%+ code coverage for critical paths
- 🎯 Sub-5 minute test execution time
- 🎯 Production monitoring and health checks

---

## 2. TESTING FRAMEWORK SELECTION

### Frontend Testing Stack
```json
{
  "framework": "Vitest",
  "rationale": "Native Vite integration, faster than Jest, TypeScript support",
  "component_testing": "@testing-library/react",
  "e2e_testing": "Playwright",
  "visual_testing": "Chromatic",
  "accessibility_testing": "@axe-core/playwright"
}
```

### Backend Testing Stack
```json
{
  "framework": "Jest",
  "rationale": "Mature NestJS integration, excellent mocking capabilities",
  "integration_testing": "@nestjs/testing",
  "database_testing": "testcontainers",
  "api_testing": "supertest",
  "performance_testing": "autocannon"
}
```

### Infrastructure Testing
```json
{
  "infrastructure": "Docker Compose Test Environment",
  "monitoring": "Prometheus + Grafana",
  "logging": "Winston + ELK Stack",
  "health_checks": "Custom NestJS health module"
}
```

---

## 3. TESTING LEVELS & STRATEGY

### 3.1 Unit Testing (Target: 80% Coverage)

#### Frontend Unit Tests
**Location:** `packages/frontend/src/**/*.test.tsx`

**Testing Patterns:**
```typescript
// Component Testing Example
describe('SessionForm', () => {
  it('should validate required fields', () => {
    render(<SessionForm onSubmit={mockSubmit} />);
    fireEvent.click(screen.getByText('Create Session'));
    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const mockSubmit = jest.fn();
    render(<SessionForm onSubmit={mockSubmit} />);

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: 'Test Session' }
    });
    fireEvent.click(screen.getByText('Create Session'));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        title: 'Test Session',
        // ... other fields
      });
    });
  });
});

// Hook Testing Example
describe('useAuth', () => {
  it('should handle login flow', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      await result.current.login('user@test.com', 'password');
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.token).toBeTruthy();
  });
});
```

#### Backend Unit Tests
**Location:** `packages/backend/src/**/*.spec.ts`

**Testing Patterns:**
```typescript
// Service Testing Example
describe('TrainerService', () => {
  let service: TrainerService;
  let mockRepository: MockRepository<Session>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TrainerService,
        {
          provide: getRepositoryToken(Session),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<TrainerService>(TrainerService);
    mockRepository = module.get(getRepositoryToken(Session));
  });

  it('should return upcoming sessions for trainer', async () => {
    const mockSessions = [
      { id: 1, title: 'Test Session', trainerId: 1 },
    ];
    mockRepository.find.mockResolvedValue(mockSessions);

    const result = await service.getTrainerUpcomingSessions(1);

    expect(result).toEqual(mockSessions);
    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { trainerId: 1, startTime: MoreThan(new Date()) },
      order: { startTime: 'ASC' },
    });
  });
});

// Controller Testing Example
describe('TrainerController', () => {
  let controller: TrainerController;
  let service: TrainerService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TrainerController],
      providers: [
        {
          provide: TrainerService,
          useValue: createMockService(),
        },
      ],
    }).compile();

    controller = module.get<TrainerController>(TrainerController);
    service = module.get<TrainerService>(TrainerService);
  });

  it('should return trainer dashboard data', async () => {
    const mockUser = { id: 1, role: 'trainer' };
    const mockDashboard = { upcomingSessions: [] };

    jest.spyOn(service, 'getTrainerDashboardSummary')
      .mockResolvedValue(mockDashboard);

    const result = await controller.getDashboard({ user: mockUser });

    expect(result).toEqual(mockDashboard);
    expect(service.getTrainerDashboardSummary).toHaveBeenCalledWith(1);
  });
});
```

### 3.2 Integration Testing (Target: 70% Coverage)

#### API Integration Tests
**Location:** `packages/backend/test/integration/`

**Testing Patterns:**
```typescript
// API Integration Test Example
describe('TrainerController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(DatabaseService)
    .useValue(testDatabase)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token for trainer
    authToken = await getAuthToken(app, 'trainer@test.com');
  });

  it('/trainer/dashboard (GET)', () => {
    return request(app.getHttpServer())
      .get('/trainer/dashboard')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('upcomingSessions');
        expect(Array.isArray(res.body.upcomingSessions)).toBe(true);
      });
  });

  it('/trainer/sessions/:id (GET)', async () => {
    // Create test session
    const session = await createTestSession({ trainerId: 1 });

    return request(app.getHttpServer())
      .get(`/trainer/sessions/${session.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(session.id);
        expect(res.body.title).toBe(session.title);
      });
  });
});
```

#### Database Integration Tests
```typescript
// Database Integration Test Example
describe('Session Entity Integration', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDatabase();
  });

  beforeEach(async () => {
    await seedTestData(dataSource);
  });

  afterEach(async () => {
    await cleanupTestData(dataSource);
  });

  it('should create session with trainer assignment', async () => {
    const sessionRepo = dataSource.getRepository(Session);
    const trainerRepo = dataSource.getRepository(Trainer);

    const trainer = await trainerRepo.save({
      name: 'Test Trainer',
      email: 'trainer@test.com',
    });

    const session = await sessionRepo.save({
      title: 'Test Session',
      description: 'Test Description',
      trainerId: trainer.id,
      startTime: new Date(),
      endTime: new Date(),
    });

    const result = await sessionRepo.findOne({
      where: { id: session.id },
      relations: ['trainer'],
    });

    expect(result.trainer.id).toBe(trainer.id);
  });
});
```

### 3.3 End-to-End Testing (Target: Critical User Flows)

#### E2E Test Patterns
**Location:** `tests/e2e/`

```typescript
// Playwright E2E Test Example
import { test, expect } from '@playwright/test';

test.describe('Trainer Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'trainer@test.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/trainer/dashboard');
  });

  test('should display upcoming sessions', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('[data-testid=upcoming-sessions]')).toBeVisible();

    // Check session list
    const sessions = page.locator('[data-testid=session-card]');
    await expect(sessions).toHaveCount.greaterThanOrEqual(1);

    // Verify session data
    const firstSession = sessions.first();
    await expect(firstSession.locator('[data-testid=session-title]')).toBeVisible();
    await expect(firstSession.locator('[data-testid=session-date]')).toBeVisible();
  });

  test('should generate coaching tips for session', async ({ page }) => {
    // Click on first session
    await page.click('[data-testid=session-card]:first-child');
    await expect(page).toHaveURL(/\/trainer\/sessions\/\d+/);

    // Generate coaching tips
    await page.click('[data-testid=generate-tips-button]');
    await expect(page.locator('[data-testid=tips-loading]')).toBeVisible();

    // Wait for tips to generate (max 15 seconds)
    await expect(page.locator('[data-testid=coaching-tips]')).toBeVisible({ timeout: 15000 });

    // Verify tips content
    const tips = page.locator('[data-testid=tip-item]');
    await expect(tips).toHaveCount.greaterThanOrEqual(1);
  });
});

// Complete User Journey Test
test.describe('End-to-End Session Creation to Trainer Assignment', () => {
  test('complete session lifecycle', async ({ page, context }) => {
    // 1. Content Developer creates session
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'contentdev@test.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');

    await page.goto('/sessions/create');
    await page.fill('[data-testid=session-title]', 'E2E Test Session');
    await page.fill('[data-testid=session-description]', 'Test Description');
    await page.selectOption('[data-testid=trainer-select]', '1');
    await page.click('[data-testid=publish-session]');

    // 2. Trainer receives email (mock check)
    // Note: In real tests, use email testing service like MailHog

    // 3. Trainer views session in dashboard
    const trainerPage = await context.newPage();
    await trainerPage.goto('/login');
    await trainerPage.fill('[data-testid=email]', 'trainer@test.com');
    await trainerPage.fill('[data-testid=password]', 'password');
    await trainerPage.click('[data-testid=login-button]');

    await trainerPage.goto('/trainer/dashboard');
    await expect(trainerPage.locator('text=E2E Test Session')).toBeVisible();

    // 4. Public user registers for session
    const publicPage = await context.newPage();
    await publicPage.goto('/');
    await expect(publicPage.locator('text=E2E Test Session')).toBeVisible();
    await publicPage.click('text=E2E Test Session');

    await publicPage.fill('[data-testid=registration-name]', 'John Doe');
    await publicPage.fill('[data-testid=registration-email]', 'john@test.com');
    await publicPage.click('[data-testid=register-button]');

    await expect(publicPage.locator('[data-testid=registration-success]')).toBeVisible();
  });
});
```

---

## 4. TEST DATA MANAGEMENT

### 4.1 Test Data Strategy

```typescript
// Test Data Factory
export class TestDataFactory {
  static createUser(overrides?: Partial<User>): User {
    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      email: faker.internet.email(),
      role: 'trainer',
      name: faker.person.fullName(),
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createSession(overrides?: Partial<Session>): Session {
    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      startTime: faker.date.future(),
      endTime: faker.date.future(),
      status: 'published',
      trainerId: 1,
      locationId: 1,
      ...overrides,
    };
  }

  static createTrainer(overrides?: Partial<Trainer>): Trainer {
    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      bio: faker.lorem.paragraph(),
      ...overrides,
    };
  }
}

// Database Seeding for Tests
export class TestDatabaseSeeder {
  static async seedBasicData(dataSource: DataSource) {
    // Create test users
    const userRepo = dataSource.getRepository(User);
    const trainer = await userRepo.save(TestDataFactory.createUser({
      email: 'trainer@test.com',
      role: 'trainer',
    }));

    const contentDev = await userRepo.save(TestDataFactory.createUser({
      email: 'contentdev@test.com',
      role: 'content_developer',
    }));

    // Create test locations
    const locationRepo = dataSource.getRepository(Location);
    const location = await locationRepo.save({
      name: 'Test Location',
      address: '123 Test St, Test City',
    });

    // Create test sessions
    const sessionRepo = dataSource.getRepository(Session);
    await sessionRepo.save([
      TestDataFactory.createSession({
        trainerId: trainer.id,
        locationId: location.id,
        startTime: new Date(Date.now() + 86400000), // Tomorrow
        status: 'published',
      }),
      TestDataFactory.createSession({
        trainerId: trainer.id,
        locationId: location.id,
        startTime: new Date(Date.now() + 172800000), // Day after tomorrow
        status: 'published',
      }),
    ]);
  }

  static async cleanupTestData(dataSource: DataSource) {
    // Clean in reverse dependency order
    await dataSource.getRepository(Session).delete({});
    await dataSource.getRepository(Location).delete({});
    await dataSource.getRepository(User).delete({});
  }
}
```

### 4.2 Test Database Configuration

```typescript
// test-database.config.ts
export async function createTestDatabase(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5433, // Different port for test DB
    username: 'test_user',
    password: 'test_password',
    database: 'training_builder_test',
    entities: [User, Session, Trainer, Location], // Import all entities
    synchronize: true, // Only for test environment
    logging: false,
    dropSchema: true, // Clean slate for each test run
  });

  await dataSource.initialize();
  return dataSource;
}

// Docker Compose Test Database
// docker-compose.test.yml
services:
  test-database:
    image: postgres:15
    environment:
      POSTGRES_DB: training_builder_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data # In-memory for speed
```

---

## 5. TESTING INFRASTRUCTURE SETUP

### 5.1 CI/CD Testing Pipeline

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_USER: test_user
          POSTGRES_DB: training_builder_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5433:5432

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run backend unit tests
      run: npm run test:backend:unit
      working-directory: packages/backend

    - name: Run backend integration tests
      run: npm run test:backend:integration
      working-directory: packages/backend
      env:
        DATABASE_URL: postgresql://test_user:test_password@localhost:5433/training_builder_test

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3

  test-frontend:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run frontend unit tests
      run: npm run test:frontend:unit
      working-directory: packages/frontend

    - name: Run frontend component tests
      run: npm run test:frontend:components
      working-directory: packages/frontend

  test-e2e:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright
      run: npx playwright install

    - name: Start application
      run: |
        docker-compose -f docker-compose.test.yml up -d
        npm run start:test

    - name: Wait for application
      run: npx wait-on http://localhost:3000

    - name: Run E2E tests
      run: npm run test:e2e

    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

### 5.2 Testing Scripts Configuration

```json
// package.json - Root level scripts
{
  "scripts": {
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd packages/backend && npm run test",
    "test:frontend": "cd packages/frontend && npm run test",
    "test:e2e": "playwright test",
    "test:coverage": "npm run test:backend:coverage && npm run test:frontend:coverage",
    "test:watch": "concurrently \"npm run test:backend:watch\" \"npm run test:frontend:watch\"",
    "test:ci": "npm run test:backend:ci && npm run test:frontend:ci && npm run test:e2e"
  }
}

// packages/backend/package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:unit": "jest --testPathPattern=spec.ts",
    "test:integration": "jest --testPathPattern=e2e-spec.ts",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
  }
}

// packages/frontend/package.json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ci": "vitest --run --coverage",
    "test:unit": "vitest run --reporter=verbose src/**/*.test.{ts,tsx}",
    "test:components": "vitest run --reporter=verbose src/components/**/*.test.{ts,tsx}",
    "test:ui": "vitest --ui"
  }
}
```

---

## 6. MONITORING & HEALTH CHECKS

### 6.1 Application Health Checks

```typescript
// packages/backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.http.pingCheck('ai-service', 'https://api.openai.com/v1/models'),
      () => this.checkEmailService(),
      () => this.checkQRService(),
    ]);
  }

  private async checkEmailService() {
    // Custom health check for email service
    try {
      // Ping email service
      return { emailService: { status: 'up' } };
    } catch (error) {
      return { emailService: { status: 'down', error: error.message } };
    }
  }

  private async checkQRService() {
    try {
      // Ping QR code service
      return { qrService: { status: 'up' } };
    } catch (error) {
      return { qrService: { status: 'down', error: error.message } };
    }
  }
}
```

### 6.2 Test Monitoring Configuration

```typescript
// test-monitoring.config.ts
export const testMonitoringConfig = {
  // Test execution time thresholds
  thresholds: {
    unitTest: 100, // ms
    integrationTest: 5000, // ms
    e2eTest: 30000, // ms
  },

  // Coverage thresholds
  coverage: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    critical: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Test result reporting
  reporting: {
    junit: true,
    coverage: true,
    screenshots: true, // For E2E failures
    videos: true, // For E2E failures
  },
};
```

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)
- ✅ **Day 1-2:** Setup testing frameworks (Jest, Vitest, Playwright)
- ✅ **Day 3-4:** Create test database configuration and Docker setup
- ✅ **Day 5-6:** Implement test data factories and seeding utilities
- ✅ **Day 7-10:** Setup CI/CD pipeline with basic test execution

### Phase 2: Unit Testing (Week 2-3)
- ✅ **Day 1-3:** Implement backend unit tests (services, controllers)
- ✅ **Day 4-6:** Implement frontend unit tests (components, hooks)
- ✅ **Day 7:** Achieve 80% unit test coverage target

### Phase 3: Integration Testing (Week 3-4)
- ✅ **Day 1-3:** Implement API integration tests
- ✅ **Day 4-5:** Implement database integration tests
- ✅ **Day 6-7:** Frontend-backend integration testing

### Phase 4: E2E Testing (Week 4-5)
- ✅ **Day 1-3:** Critical user flow E2E tests
- ✅ **Day 4-5:** Epic 4 specific E2E tests (trainer flows)
- ✅ **Day 6-7:** Cross-browser and mobile E2E testing

### Phase 5: Production Readiness (Week 5-6)
- ✅ **Day 1-2:** Health checks and monitoring setup
- ✅ **Day 3-4:** Performance testing implementation
- ✅ **Day 5-7:** Security testing and production deployment validation

---

## 8. SUCCESS METRICS

### Testing KPIs
- **Unit Test Coverage:** ≥80% overall, ≥95% for critical paths
- **Integration Test Coverage:** ≥70% of API endpoints
- **E2E Test Coverage:** 100% of critical user journeys
- **Test Execution Time:** <5 minutes for full test suite
- **Build Success Rate:** ≥95% for main branch
- **Bug Detection Rate:** ≥90% caught before production

### Quality Gates
- ❌ **Block deployment if:** Unit test coverage <70%
- ❌ **Block deployment if:** Any critical E2E test fails
- ❌ **Block deployment if:** Health checks fail
- ❌ **Block deployment if:** Security tests fail
- ⚠️ **Warning if:** Integration test coverage <60%
- ⚠️ **Warning if:** Test execution time >10 minutes

---

## 9. NEXT STEPS

### Immediate Actions Required
1. **Review and approve this testing strategy document**
2. **Setup testing infrastructure** (frameworks, databases, CI/CD)
3. **Begin with Epic 4 testing implementation** (leverage existing failed tests)
4. **Create comprehensive test suite for Epic 4** (proven most critical)
5. **Extend testing to remaining epics systematically**

### Dependencies
- ✅ Architecture validation completed
- ✅ QA testing results available
- ❌ **REQUIRED:** Development environment standardization
- ❌ **REQUIRED:** CI/CD pipeline setup
- ❌ **REQUIRED:** Test database provisioning

---

*This testing strategy addresses the critical architectural gap identified in the architect checklist validation and provides the foundation for production-ready testing infrastructure.*