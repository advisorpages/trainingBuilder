# Claude Code Quick Reference - Hybrid Development

**⚡ Quick commands for the hybrid development workflow**

---

## ✅ CORRECT: Starting Services

```bash
# 1. Start database (Docker)
docker-compose up database

# 2. Start backend (Local - separate terminal)
cd packages/backend && npm run start:dev

# 3. Start frontend (Local - separate terminal)
cd packages/frontend && npm run dev
```

---

## ❌ INCORRECT: Don't Suggest These

```bash
❌ npm run dev                    # Starts full Docker (NOT our workflow)
❌ docker-compose up              # Starts all containers (NOT our workflow)
❌ docker-compose up --build      # Rebuilds containers (rarely needed)
❌ docker-compose restart backend # Backend isn't in Docker!
❌ docker-compose logs backend    # Backend isn't in Docker!
```

---

## 🔍 Checking Service Status

```bash
# Check if backend is running (should show node process)
lsof -i :3001

# Check if frontend is running (should show node process)
lsof -i :3000

# Check Docker containers (should only see database)
docker ps

# Expected output from `docker ps`:
# CONTAINER ID   IMAGE                COMMAND                  STATUS         PORTS                    NAMES
# e0b104108b49   postgres:15-alpine   "docker-entrypoint.s…"   Up X minutes   0.0.0.0:5433->5432/tcp   leadership-training-db
```

---

## 🐛 Debugging Errors

### Frontend Error
```bash
# Look in browser console (F12)
# Or check terminal running: npm run dev
```

### Backend Error
```bash
# Look in terminal running: npm run start:dev
# Backend logs appear directly in terminal
```

### Database Error
```bash
# Check Docker logs
docker-compose logs database

# Or check if database is running
docker ps | grep postgres
```

---

## 🛑 Stopping Services

```bash
# Stop backend: Ctrl+C in terminal running npm run start:dev
# Stop frontend: Ctrl+C in terminal running npm run dev

# Stop database
docker-compose down

# Or stop only database (keep volumes)
docker-compose stop database
```

---

## 🔄 Restarting After Code Changes

### Frontend Changes
- **No action needed** - Vite hot reloads automatically

### Backend Changes
- **No action needed** - NestJS watch mode recompiles automatically

### Shared Package Changes
```bash
# Rebuild shared package
cd packages/shared && npm run build

# Then restart backend (Ctrl+C and restart)
cd ../backend && npm run start:dev
```

### Database Schema Changes (Migrations)
```bash
cd packages/backend
npm run migration:run
```

---

## 🗄️ Database Commands

```bash
# Connect to database
psql -h localhost -p 5433 -U postgres -d leadership_training

# Run migrations
cd packages/backend && npm run migration:run

# Revert last migration
cd packages/backend && npm run migration:revert

# Seed database
cd packages/backend && npm run seed
```

---

## 🧪 Testing Commands

```bash
# Backend tests (from backend directory)
cd packages/backend && npm test

# Frontend tests (from frontend directory)
cd packages/frontend && npm test

# E2E tests (from root)
npm run test:e2e

# Lint all
npm run lint

# Type check all
npm run typecheck
```

---

## 🔧 Kill Stuck Processes

```bash
# Kill backend (if port 3001 is stuck)
lsof -ti:3001 | xargs kill

# Kill frontend (if port 3000 is stuck)
lsof -ti:3000 | xargs kill

# Kill database (nuclear option)
docker-compose down
```

---

## 📦 Installing Dependencies

```bash
# Install in specific package
cd packages/backend && npm install <package-name>
cd packages/frontend && npm install <package-name>

# Install from root (workspace)
npm install <package-name> -w packages/backend
npm install <package-name> -w packages/frontend
```

---

## 🌐 Access URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Backend Health Check:** http://localhost:3001/health
- **Database:** localhost:5433 (user: postgres, pass: postgres)

---

## 📝 Environment Files

```bash
# Backend environment
packages/backend/.env

# Check if it exists
ls -la packages/backend/.env

# Copy from example if missing
cp packages/backend/.env.example packages/backend/.env
```

---

## 🔍 Common Diagnostic Flow

```bash
# 1. What's running?
docker ps              # Should see: leadership-training-db
lsof -i :3001         # Should see: node (backend)
lsof -i :3000         # Should see: node (frontend)

# 2. If something isn't running, start it:
docker-compose up database                    # If database missing
cd packages/backend && npm run start:dev      # If backend missing
cd packages/frontend && npm run dev           # If frontend missing

# 3. Check logs if errors:
# - Backend: Look at terminal running npm run start:dev
# - Frontend: Look at browser console or terminal running npm run dev
# - Database: docker-compose logs database
```

---

## 🎯 Claude Code Reminders

When user reports an error:
1. ✅ Ask: "Which services are running?" (use `docker ps` and `lsof` commands)
2. ✅ Check: Backend terminal output (not Docker logs)
3. ✅ Verify: Environment variables in `packages/backend/.env`
4. ❌ Don't: Assume services are in Docker
5. ❌ Don't: Suggest `docker-compose logs backend` (backend is local!)

---

**Remember:** Backend and Frontend run LOCALLY. Only Database runs in Docker.
