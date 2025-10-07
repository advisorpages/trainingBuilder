# Project Context for Claude Code

**⚠️ CRITICAL: READ THIS FIRST IN EVERY CONVERSATION**

This file defines the development workflow and preferences for this project. Claude Code should follow these guidelines strictly to avoid confusion.

---

## 🎯 Development Workflow: HYBRID APPROACH

This project uses a **Hybrid Development Setup** for daily development:

### ✅ RECOMMENDED: How to Run Services

**The user runs services this way:**

```bash
# Terminal 1: Database (Docker)
docker-compose up database

# Terminal 2: Backend (Local)
cd packages/backend && npm run start:dev

# Terminal 3: Frontend (Local)
cd packages/frontend && npm run dev
```

### ❌ DO NOT Suggest These Commands (Unless Explicitly Asked):

```bash
❌ npm run dev                    # This starts FULL Docker (not what we use)
❌ docker-compose up              # This starts all containers (not what we use)
❌ docker-compose up --build      # This rebuilds containers (rarely needed)
```

---

## 📍 Where Code Lives and How Changes Work

| Component | Location | How Changes Apply |
|-----------|----------|-------------------|
| **Frontend** | `packages/frontend/src/` | Edit locally → Vite hot reload → See changes instantly |
| **Backend** | `packages/backend/src/` | Edit locally → NestJS watch mode → Recompiles automatically |
| **Shared Types** | `packages/shared/src/` | Edit locally → Need to rebuild shared package |
| **Database** | Docker container | Access at `localhost:5433` (maps to 5432 inside) |

**Key Point:** All code edits happen in the local filesystem. Services run locally and watch for changes. The database is the only thing in Docker.

---

## 🔧 Port Reference

| Service | Host Port | Container Port | Access URL |
|---------|-----------|----------------|------------|
| Frontend | 3000 | - | http://localhost:3000 |
| Backend | 3001 | - | http://localhost:3001 |
| Database | 5433 | 5432 | localhost:5433 (via pg client) |

---

## 🐛 Troubleshooting & Common Issues

### Issue: "Network Error" or "Failed to connect"

**Diagnosis:**
```bash
# Check what's running
lsof -i :3001   # Backend should be running
lsof -i :3000   # Frontend should be running
docker ps       # Only database should be in Docker
```

**Solution:**
- Backend not running? → `cd packages/backend && npm run start:dev`
- Frontend not running? → `cd packages/frontend && npm run dev`
- Database not running? → `docker-compose up database`

### Issue: Backend crashes or won't start

**Diagnosis:**
```bash
cd packages/backend
npm run start:dev
# Read the error message directly in terminal
```

**Common causes:**
- Missing environment variables (check `.env` file)
- Database connection issue (is Docker database running?)
- TypeScript compilation error (read the error, fix the code)
- Port 3001 already in use (kill the process: `lsof -ti:3001 | xargs kill`)

### Issue: Database connection refused

**Check:**
```bash
docker ps | grep postgres
# Should see: leadership-training-db running on 0.0.0.0:5433->5432/tcp
```

**Fix:**
```bash
docker-compose up database
```

---

## 🎓 When to Use Full Docker

Full Docker (`npm run dev`) is ONLY for:
- Running integration tests that need the full stack
- Testing the production-like environment
- CI/CD pipelines
- When explicitly requested by the user

**If the user asks to "start the app" or "run the project," assume they want the HYBRID approach unless they specifically mention Docker.**

---

## 🧪 Testing & Quality

### Running Tests

```bash
# Backend tests (run locally)
cd packages/backend && npm test

# Frontend tests (run locally)
cd packages/frontend && npm test

# E2E tests (uses Docker)
npm run test:e2e
```

### Linting & Type Checking

```bash
# Run from workspace root
npm run lint        # Lints all packages
npm run typecheck   # Type checks all packages
```

---

## 🗄️ Database Management

### Running Migrations

```bash
# With database running in Docker
cd packages/backend
npm run migration:run
```

### Seeding Data

```bash
cd packages/backend
npm run seed
```

### Connecting to Database

```bash
# Using psql
psql -h localhost -p 5433 -U postgres -d leadership_training

# Or use a GUI client with these settings:
# Host: localhost
# Port: 5433
# User: postgres
# Password: postgres
# Database: leadership_training
```

---

## 📦 Monorepo Structure

```
TrainingBuilderv4/
├── packages/
│   ├── backend/      # NestJS API - runs locally on :3001
│   ├── frontend/     # React + Vite - runs locally on :3000
│   └── shared/       # Shared TypeScript types
├── .claude/          # Claude Code configuration (this file!)
├── scripts/          # Helper scripts
└── docker-compose.yml # Database only in hybrid mode
```

---

## 🤖 Claude Code Instructions

### When the user reports an error:

1. **Ask what's running:** "Which services do you have running right now?"
2. **Check the right logs:**
   - Frontend errors → Browser console
   - Backend errors → Terminal running `npm run start:dev`
   - Database errors → `docker-compose logs database`
3. **Don't assume Docker** - The user is running services locally!

### When suggesting commands:

✅ **Good suggestions:**
```bash
cd packages/backend && npm run start:dev
cd packages/frontend && npm run dev
docker-compose up database
lsof -i :3001
```

❌ **Avoid suggesting (unless specifically asked):**
```bash
npm run dev
docker-compose up --build
docker-compose restart backend
docker-compose logs backend
```

### When making code changes:

- ✅ Edit files directly in `packages/backend/src/` or `packages/frontend/src/`
- ✅ Changes will hot-reload automatically if services are running locally
- ✅ If you modify `packages/shared/`, remind user to rebuild: `cd packages/shared && npm run build`
- ❌ Don't suggest rebuilding Docker images unless specifically asked

---

## 📝 Environment Variables

### Backend (.env file location: `packages/backend/.env`)

**Required for local development:**
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=leadership_training
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
JWT_SECRET=your-jwt-secret-key
OPENAI_API_KEY=sk-...
```

See `packages/backend/.env.example` for full list.

---

## 🚀 Quick Start for New Sessions

When starting a new conversation with the user, assume:
- They want to use the **hybrid approach** (local services + Docker database)
- Code changes should be made in local files
- Errors should be debugged by looking at local terminal output
- Full Docker is only for special cases

---

## 📚 Additional Resources

- Full development guide: `DEVELOPMENT.md` (root directory)
- Quick command reference: `.claude/CHEATSHEET.md`
- Architecture overview: `README.md`

---

**Last Updated:** 2025-10-06
**Workflow:** Hybrid (Local Services + Docker Database)
