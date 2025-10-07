# Leadership Training App – AI Session Builder Reboot

This repository is being overhauled so the AI Session Builder becomes the heart of the product. Every supporting workflow (topics, incentives, landing pages, trainer tools, public pages) will orbit the builder and consume its session-centric domain model.

## 🔭 Current Focus
- **Phase 1 – Foundation Reset**: archive legacy scope, document the new blueprint, and prepare skeletons for the rebuild.
- Follow the documentation in `docs/` for detailed phase plans and test expectations.

## 🏗️ Architecture (Target)
- **Frontend**: React 18 + TypeScript + Vite, feature-driven structure under `packages/frontend/src/features`.
- **Backend**: NestJS + TypeScript + PostgreSQL, modularized by feature with a unified session domain.
- **Shared**: `packages/shared` for types, constants, and utilities shared across services.
- **AI Layer**: Central service providing prompt orchestration, provider adapters, and output moderation.

## 🚀 Development Workflow

### Prerequisites
- Docker & Docker Compose
- Node.js 18+

### Quick Start (Recommended: Hybrid Development)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp packages/backend/.env.example packages/backend/.env

# 3. Start database (Docker)
docker-compose up database

# 4. Start backend (Local - new terminal)
cd packages/backend && npm run start:dev

# 5. Start frontend (Local - new terminal)
cd packages/frontend && npm run dev
```

**Access the app:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Alternative: Full Docker

```bash
# Start all services in Docker
npm run dev

# Stop all services
npm run down
```

### Testing & Quality

```bash
# Lint all packages
npm run lint

# Run tests
npm run test

# Type check
npm run typecheck
```

> **📚 For detailed setup, troubleshooting, and workflows, see [DEVELOPMENT.md](./DEVELOPMENT.md)**

> **Tip:** During the reboot many modules are placeholders. Expect tests to be incomplete until later phases.

## 📁 Repository Layout (In Transition)
```
packages/
  backend/            # NestJS API (modules currently being refactored)
  frontend/           # React app (feature directories under reconstruction)
  shared/             # Shared types/utilities
.archive/             # Archived legacy code kept for reference
```

Refer to the inventory in `docs/phase1-inventory.md` to understand what was moved and why.

## 🧭 Roadmap
- [x] Document blueprint and phases (`docs/blueprint-overview.md`)
- [x] Phase 1: Foundation Reset
- [x] Phase 2: Domain & Backend Core
- [x] Phase 3: Frontend Builder Core
- [x] Phase 4: Supporting Modules Integration
- [x] Phase 5: AI Experience & Quality Gates ✨

## ✨ AI Features & Quality Gates

The application now includes advanced AI capabilities with comprehensive quality controls:

### 🤖 AI Session Builder
- **Contextual Content Generation**: AI adapts to session metadata (topic, audience, objectives)
- **Smart Prompt Enhancement**: Automatically enriches user prompts with relevant context
- **Quality Moderation**: Real-time validation for tone, length, structure, and professional appropriateness
- **Multi-format Support**: Generate outlines, openers, activities, and structured content

### 📊 Analytics & Telemetry
- **Real-time Usage Tracking**: Monitor AI interactions, builder usage, and content performance
- **Quality Metrics Dashboard**: Track success rates, processing times, and content quality scores
- **Builder Analytics**: Session creation patterns, AI adoption rates, and user behavior insights

### ✅ Publish Readiness Engine
- **Automated Scoring**: 100-point readiness assessment across content, metadata, assignments, and integrations
- **Quality Gates**: Prevent publishing of incomplete or low-quality sessions (80% minimum threshold)
- **Actionable Feedback**: Specific recommendations for improving session readiness

### 📖 Developer Resources
- **AI Guidelines**: Comprehensive documentation at `docs/ai-guidelines.md`
- **API Documentation**: Full endpoint reference for AI services and analytics
- **Best Practices**: Quality standards, error handling, and performance optimization guides

Each phase includes success criteria and test plans inside `docs/phase-*.md`.

## 🤝 Contributing
1. Review the relevant phase document before starting work.
2. Avoid deleting legacy code; move out-of-scope assets into `.archive/` with an explanatory README.
3. Keep documentation in sync with code changes—especially domain contracts and API definitions.

Questions or issues? Capture them in `docs/phase-issues.md` (create if it does not yet exist) so the next contributor can pick up smoothly. See `docs/contributing.md` for workflow expectations.
