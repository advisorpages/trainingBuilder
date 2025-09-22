# Simple Security Guide: Leadership Training App

Basic security for a simple internal training app - no overkill, just essentials.

---

## 1. Authentication (Keep It Simple)

### JWT Setup (NestJS)
```typescript
// Just the basics - JWT with bcrypt passwords
@Injectable()
export class AuthService {
  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, role: user.role }
    };
  }
}
```

### Role-Based Routes
```typescript
// Simple role guard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Usage
@Post('admin/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', ['Content Developer'])
createSession() { ... }
```

---

## 2. Input Validation (Class Validator)

```typescript
// Simple DTO validation
export class CreateSessionDto {
  @IsString()
  @Length(5, 200)
  title: string;

  @IsString()
  @Length(10, 1000)
  description: string;

  @IsDateString()
  startTime: string;
}

// Global validation pipe
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  transform: true,
}));
```

---

## 3. Environment Variables

```env
# .env (never commit this file)
DATABASE_URL="postgresql://user:pass@localhost:5432/training_db"
JWT_SECRET="your-super-secret-jwt-key-here"
NODE_ENV="development"
PORT=3001
```

```typescript
// Simple config
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h', // Simple 24h expiry
  },
});
```

---

## 4. Password Security (Just bcrypt)

```typescript
// Hash passwords on save
@Entity()
export class User {
  @Column()
  passwordHash: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2b$')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
    }
  }
}
```

---

## 5. Production Essentials

### Docker Security (Basic)
```dockerfile
# Use non-root user
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
```

### HTTPS (Let's Encrypt or Cloud Provider)
- Use reverse proxy (nginx) with SSL
- Or configure cloud provider SSL (AWS ALB, etc.)

### Basic Error Handling
```typescript
// Hide error details in production
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (process.env.NODE_ENV === 'production') {
      response.status(500).json({ message: 'Internal server error' });
    } else {
      // Show details in development
      response.status(500).json({ error: exception });
    }
  }
}
```

---

## That's It!

For a simple internal training app:
1. **JWT auth** with **bcrypt passwords**
2. **Basic validation** with class-validator
3. **Environment variables** for secrets
4. **HTTPS in production**
5. **Simple error handling**

No need for complex rate limiting, encryption at rest, advanced monitoring, etc. unless you actually need it.