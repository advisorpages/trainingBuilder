# Simple Operations Guide: Leadership Training App

Basic operational setup for a simple training app - practical and lightweight.

---

## 1. Development Environment

### Docker Compose (Keep It Simple)
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./packages/backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/training_db
      - JWT_SECRET=your-dev-secret-here
    depends_on:
      - db

  frontend:
    build: ./packages/frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_BASE_URL=http://localhost:3001

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=training_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Quick Setup Commands
```bash
# Get everything running
npm install
docker-compose up -d
npm run dev

# Reset database when needed
docker-compose down -v
docker-compose up -d
```

---

## 2. Basic Error Handling

### Simple Error Responses
```typescript
// backend/src/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Apply globally
app.useGlobalFilters(new HttpExceptionFilter());
```

### Frontend Error Handling
```typescript
// Simple error boundary for React
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

// Simple API error handling
const api = axios.create({
  baseURL: 'http://localhost:3001',
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## 3. Simple Logging

### Backend Logging (Built-in NestJS)
```typescript
// Just use the built-in logger
import { Logger } from '@nestjs/common';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  async create(sessionData: CreateSessionDto) {
    this.logger.log(`Creating session: ${sessionData.title}`);
    try {
      const session = await this.sessionsRepository.save(sessionData);
      this.logger.log(`Session created with ID: ${session.id}`);
      return session;
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`);
      throw error;
    }
  }
}
```

### Frontend Logging (Console + Simple Service)
```typescript
// Simple logging service
class LoggerService {
  log(message: string, data?: any) {
    console.log(`[${new Date().toISOString()}] ${message}`, data);
  }

  error(message: string, error?: any) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
  }
}

export const logger = new LoggerService();
```

---

## 4. Basic Monitoring

### Health Check Endpoint
```typescript
// Simple health check
@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>
  ) {}

  @Get()
  async check() {
    try {
      // Simple database check
      await this.usersRepo.findOne({ where: { id: 1 } });
      return { status: 'ok', timestamp: new Date().toISOString() };
    } catch (error) {
      throw new HttpException('Database connection failed', 503);
    }
  }
}
```

### Simple Uptime Monitoring
- Use a free service like [UptimeRobot](https://uptimerobot.com/)
- Ping your `/health` endpoint every 5 minutes
- Get email alerts if it goes down

---

## 5. Deployment (Simple)

### Basic Production Docker
```dockerfile
# packages/backend/Dockerfile.prod
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### Simple Deploy Script
```bash
#!/bin/bash
# deploy.sh
set -e

echo "Building application..."
npm run build

echo "Building Docker images..."
docker build -t training-app-backend:latest ./packages/backend
docker build -t training-app-frontend:latest ./packages/frontend

echo "Deploying to server..."
# Copy to your server and restart containers
# This could be as simple as rsync + docker-compose restart
```

### Environment Variables (Production)
```env
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://user:password@your-db-host:5432/training_db
JWT_SECRET=your-actual-secret-key-here
PORT=3001
```

---

## 6. Backup Strategy (Simple)

### Database Backup (Cron Job)
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql

# Keep last 7 days of backups
find . -name "backup_*.sql" -mtime +7 -delete
```

### Cron job:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-db.sh
```

---

## 7. Testing (Keep It Practical)

### Simple E2E Test
```typescript
// Just test the happy path
describe('Session Creation Flow', () => {
  it('should create and publish a session', async () => {
    // Login
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password' });

    const token = loginResponse.body.access_token;

    // Create session
    const sessionResponse = await request(app)
      .post('/admin/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Session',
        description: 'Test Description',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T11:00:00Z',
      });

    expect(sessionResponse.status).toBe(201);
    expect(sessionResponse.body.title).toBe('Test Session');
  });
});
```

---

## That's It!

For a simple training app:
1. **Docker Compose** for local development
2. **Basic error handling** and logging
3. **Simple health checks**
4. **Basic monitoring** (UptimeRobot)
5. **Simple deployment** with Docker
6. **Daily database backups**
7. **Happy path testing**

No need for complex orchestration, advanced monitoring, or enterprise-grade ops unless you actually scale to that point.