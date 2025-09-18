# Leadership Training App

A mobile-first platform for creating and promoting training sessions, built with React, NestJS, and PostgreSQL.

## Story 1.1: Project & Docker Setup ✅

This repository implements the foundational development environment for the Leadership Training App.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: NestJS + TypeScript + PostgreSQL
- **Database**: PostgreSQL 15
- **Development**: Docker Compose
- **Repository**: Monorepo with shared packages

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd TrainingBuilderv4
```

### 2. Start Development Environment

```bash
# Start all services (database, backend, frontend)
npm run dev

# Or start in detached mode
npm run dev:detached
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health
- **Database**: PostgreSQL on localhost:5432

### 4. Stop Services

```bash
# Stop all services
npm run down

# Stop and remove volumes (clean slate)
npm run clean
```

## 📁 Project Structure

```
/
├── packages/
│   ├── frontend/          # React + TypeScript SPA
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── services/
│   │   └── Dockerfile
│   ├── backend/           # NestJS + TypeScript API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── sessions/
│   │   │   │   └── users/
│   │   │   └── services/
│   │   └── Dockerfile
│   └── shared/            # Common types & utilities
│       └── src/
│           ├── types/
│           ├── constants/
│           └── utils/
├── database/
│   └── init/              # Database initialization scripts
├── docker-compose.yml
└── package.json           # Workspace configuration
```

## 🔧 Development Commands

```bash
# Install all dependencies
npm run install:all

# Build all packages
npm run build

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run tests
npm run test
```

## 🧪 Testing Integration

1. **Database Health**: Check PostgreSQL connection
2. **Backend Health**: GET http://localhost:3001/api/health
3. **Frontend Connection**: Verify frontend can reach backend
4. **Hot Reloading**: Test development workflow

## 📊 Current Implementation Status

### ✅ Completed (Story 1.1)
- [x] Monorepo structure with workspaces
- [x] Docker Compose environment
- [x] PostgreSQL database with initialization
- [x] React frontend with TypeScript
- [x] NestJS backend with TypeScript
- [x] Shared package for types/constants
- [x] Basic routing and pages
- [x] Health check endpoints
- [x] Hot-reloading development setup

### 🔄 Coming Next
- **Story 1.2**: Database Schema & Roles
- **Story 1.3**: User Authentication
- **Story 1.4**: Location Management
- **Story 1.5**: Trainer Resource Management

## 🌟 Epic Progress

**Epic 1: Foundation, Auth, & Resource Management**
- Story 1.1: Project & Docker Setup ✅
- Story 1.2: Database Schema & Roles ⏳
- Story 1.3: User Authentication ⏳
- Story 1.4: Location Management ⏳
- Story 1.5: Trainer Resource Management ⏳
- Story 1.6: System Configuration Management ⏳
- Story 1.7: Attribute Management ⏳

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, and 5432 are available
2. **Docker issues**: Try `npm run clean` to reset containers
3. **Dependencies**: Run `npm run install:all` to reinstall packages
4. **Database**: Check database logs with `docker-compose logs database`

### Useful Commands

```bash
# View service logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs database

# Restart specific service
docker-compose restart backend

# Rebuild containers
docker-compose up --build
```

## 📝 Development Notes

- Database schema is initialized automatically on first run
- Sample data is inserted for development
- Environment variables are configured in `.env`
- Frontend uses Vite for fast development builds
- Backend uses NestJS watch mode for hot reloading

## 🔗 API Endpoints

### Current Endpoints (Story 1.1)
- `GET /api/health` - Application health check
- `GET /api` - Application information
- `GET /api/auth/status` - Auth module status
- `GET /api/users/status` - Users module status
- `GET /api/sessions/status` - Sessions module status

### Coming Soon
- Authentication endpoints (Story 1.3)
- User management (Story 1.3)
- Session management (Epic 2)
- Resource management (Stories 1.4-1.7)

---

**Generated with BMad Master for Story 1.1: Project & Docker Setup**