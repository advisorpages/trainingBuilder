# Development Guide - Leadership Training App

This guide explains how to set up and run the Leadership Training App for local development.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Development Workflows](#development-workflows)
4. [Architecture Overview](#architecture-overview)
5. [Working with the Codebase](#working-with-the-codebase)
6. [Database Management](#database-management)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Environment Variables](#environment-variables)

---

## Prerequisites

- **Node.js** 18+ and npm 9+
- **Docker** and **Docker Compose**
- **Git**
- *Optional:* PostgreSQL client (psql) for database management

---

## Quick Start

### Option 1: Hybrid Development (Recommended)

This is the **recommended approach** for active development. It runs the database in Docker while running backend and frontend locally for better debugging and faster iteration.

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd TrainingBuilderv4
npm install

# 2. Set up environment variables
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env with your configuration

# 3. Start the database
docker-compose up database

# 4. Run migrations and seed data (in new terminal)
cd packages/backend
npm run migration:run
npm run seed

# 5. Start backend (in new terminal)
cd packages/backend
npm run start:dev

# 6. Start frontend (in new terminal)
cd packages/frontend
npm run dev
```

**Access the app:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5433

### Option 2: Full Docker

Use this for testing the production-like environment or running integration tests.

```bash
# Start all services in Docker
npm run dev

# Or run in detached mode
npm run dev:detached

# Stop all services
npm run down
```

---

## Development Workflows

### Recommended: Hybrid Development

**What it is:**
- Database runs in Docker container
- Backend runs locally with NestJS watch mode
- Frontend runs locally with Vite hot reload

**Why use it:**
- ✅ See errors directly in terminal
- ✅ Hot reload works perfectly
- ✅ Use VS Code debugger easily
- ✅ Fast iteration cycle
- ✅ Database stays isolated and clean

**How to run:**

```bash
# Terminal 1: Database
docker-compose up database

# Terminal 2: Backend
cd packages/backend && npm run start:dev

# Terminal 3: Frontend
cd packages/frontend && npm run dev
```

**When to use:** Daily development, debugging, feature work

---

### Alternative: Full Docker

**What it is:**
- All services (database, backend, frontend) run in Docker containers

**Why use it:**
- ✅ Production-like environment
- ✅ Consistent across machines
- ✅ Easy onboarding for new developers

**How to run:**

```bash
npm run dev              # Start all containers
npm run dev:detached     # Start in background
npm run down             # Stop all containers
npm run clean            # Stop and remove volumes
```

**When to use:** Integration testing, CI/CD, testing deployment configuration

---

## Architecture Overview

### Monorepo Structure

```
TrainingBuilderv4/
├── packages/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules (auth, sessions, etc.)
│   │   │   ├── entities/ # TypeORM entities
│   │   │   └── services/ # Shared services
│   │   └── test/         # Integration tests
│   ├── frontend/         # React + Vite app
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── pages/        # Page components
│   │   │   ├── services/     # API service layer
│   │   │   └── layouts/      # Layout components
│   │   └── public/       # Static assets
│   └── shared/           # Shared TypeScript types
│       └── src/
│           └── types/    # Type definitions
├── scripts/              # Helper scripts
└── docker-compose.yml    # Docker services configuration
```

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Axios (HTTP client)
- React Router (routing)

**Backend:**
- NestJS (framework)
- TypeORM (ORM)
- PostgreSQL (database)
- JWT (authentication)
- Class Validator (validation)

**Shared:**
- TypeScript types and interfaces
- Shared constants and utilities

---

## Working with the Codebase

### Making Changes

#### Frontend Changes

```bash
# 1. Edit files in packages/frontend/src/
# 2. Changes hot reload automatically (if dev server is running)
# 3. Check browser console for errors
```

#### Backend Changes

```bash
# 1. Edit files in packages/backend/src/
# 2. NestJS watch mode recompiles automatically
# 3. Check terminal for compilation errors
# 4. API changes reflect immediately
```

#### Shared Type Changes

```bash
# 1. Edit files in packages/shared/src/
# 2. Rebuild shared package
cd packages/shared && npm run build

# 3. Restart services that use shared types
# Backend: Ctrl+C and restart npm run start:dev
# Frontend: Usually auto-reloads via Vite
```

### Creating a New Feature

```bash
# 1. Create backend module
cd packages/backend
nest generate module modules/feature-name
nest generate service modules/feature-name
nest generate controller modules/feature-name

# 2. Create entity
# Create file: src/entities/feature-name.entity.ts

# 3. Create DTOs
# Create files in: src/modules/feature-name/dto/

# 4. Generate and run migration
npm run migration:generate src/migrations/AddFeatureName
npm run migration:run

# 5. Create frontend service
# Create file: packages/frontend/src/services/feature-name.service.ts

# 6. Create frontend components
# Create files in: packages/frontend/src/components/feature-name/

# 7. Add types to shared package
# Create/update: packages/shared/src/types/index.ts
cd packages/shared && npm run build
```

---

## Database Management

### Migrations

```bash
# Generate a new migration (after changing entities)
cd packages/backend
npm run migration:generate src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Drop entire schema (⚠️ DESTRUCTIVE)
npm run schema:drop
```

### Seeding Data

```bash
cd packages/backend
npm run seed              # Seed all data
npm run seed:topics       # Seed only topics
```

### Accessing the Database

```bash
# Using psql
psql -h localhost -p 5433 -U postgres -d leadership_training

# Connection details for GUI clients:
Host: localhost
Port: 5433
User: postgres
Password: postgres
Database: leadership_training
```

### Resetting the Database

```bash
# Stop all services
npm run down

# Remove database volume
docker volume rm trainingbuilderv4_postgres_data

# Start database and run migrations
docker-compose up database
cd packages/backend && npm run migration:run && npm run seed
```

---

## Testing

### Unit Tests

```bash
# Backend unit tests
cd packages/backend && npm test

# Frontend unit tests
cd packages/frontend && npm test

# Run tests in watch mode
cd packages/backend && npm run test:watch
cd packages/frontend && npm run test:watch
```

### Integration Tests

```bash
# Backend integration tests
cd packages/backend && npm run test:integration
```

### End-to-End Tests

```bash
# E2E tests (requires full Docker setup)
npm run test:e2e
```

### Coverage Reports

```bash
# Backend coverage
cd packages/backend && npm run test:coverage

# Frontend coverage
cd packages/frontend && npm run test:coverage
```

### Linting and Type Checking

```bash
# Lint all packages
npm run lint

# Type check all packages
npm run typecheck

# Fix linting issues
cd packages/backend && npm run lint
cd packages/frontend && npm run lint
```

---

## Troubleshooting

### "Network Error" or "Failed to connect"

**Symptoms:** Frontend can't connect to backend

**Diagnosis:**
```bash
lsof -i :3001  # Check if backend is running
lsof -i :3000  # Check if frontend is running
docker ps      # Check if database is running
```

**Solutions:**
- Backend not running? → `cd packages/backend && npm run start:dev`
- Frontend not running? → `cd packages/frontend && npm run dev`
- Database not running? → `docker-compose up database`

---

### Backend Won't Start

**Symptoms:** Backend crashes or shows TypeScript errors

**Diagnosis:**
```bash
cd packages/backend
npm run start:dev
# Read the error message
```

**Common causes:**
1. **Missing environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with correct values
   ```

2. **Database connection refused**
   ```bash
   docker ps | grep postgres
   # If not running: docker-compose up database
   ```

3. **TypeScript compilation error**
   - Read error message
   - Fix the code
   - Save and NestJS will auto-recompile

4. **Port 3001 already in use**
   ```bash
   lsof -ti:3001 | xargs kill
   ```

---

### Database Connection Issues

**Symptoms:** Backend can't connect to database

**Check database is running:**
```bash
docker ps | grep postgres
# Should see: leadership-training-db ... Up ... 0.0.0.0:5433->5432/tcp
```

**Verify connection settings in `.env`:**
```env
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=leadership_training
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

**Test connection manually:**
```bash
psql -h localhost -p 5433 -U postgres -d leadership_training
```

---

### Frontend Build Errors

**Symptoms:** Vite compilation errors

**Common causes:**
1. **Missing dependencies**
   ```bash
   cd packages/frontend && npm install
   ```

2. **TypeScript errors**
   ```bash
   npm run typecheck  # See all type errors
   ```

3. **Shared package not built**
   ```bash
   cd packages/shared && npm run build
   ```

---

### Shared Package Changes Not Reflected

**Symptoms:** Backend/frontend don't see updated shared types

**Solution:**
```bash
# 1. Rebuild shared package
cd packages/shared && npm run build

# 2. Restart backend
cd packages/backend
# Ctrl+C then:
npm run start:dev

# 3. Frontend usually auto-reloads, but can restart:
cd packages/frontend
# Ctrl+C then:
npm run dev
```

---

### Port Conflicts

**Symptoms:** "Port already in use" errors

**Find what's using the port:**
```bash
lsof -i :3001  # Backend
lsof -i :3000  # Frontend
lsof -i :5433  # Database
```

**Kill the process:**
```bash
lsof -ti:3001 | xargs kill
```

---

### Docker Issues

**Clean slate reset:**
```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build
```

**Check Docker logs:**
```bash
docker-compose logs database
docker-compose logs -f database  # Follow logs
```

---

## Environment Variables

### Backend Environment Variables

Location: `packages/backend/.env`

**Required variables:**

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=leadership_training
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# JWT
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_EXPIRATION=1d

# Server
PORT=3001
NODE_ENV=development

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2500
OPENAI_TEMPERATURE=0.7

# QR Code Service
QR_CLOUD_API_URL=https://qrcodes.at/api
QR_CLOUD_API_KEY=your_api_key_here
```

See `packages/backend/.env.example` for complete list with descriptions.

---

## Additional Resources

- **Architecture Overview:** `README.md`
- **API Documentation:** Run backend and visit http://localhost:3001/api (if Swagger is enabled)

---

## Getting Help

- Check troubleshooting section above
- Review error messages carefully
- Check relevant logs (browser console, backend terminal, Docker logs)
- Ensure all environment variables are set correctly
- Try the "clean slate reset" if all else fails

---

**Last Updated:** 2025-10-06
