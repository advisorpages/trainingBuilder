# Source Tree Structure

## Root Directory

```
TrainingBuilderv4/
├── .bmad-core/          # BMad development methodology files
├── .ai/                 # AI-generated content and logs
├── docs/                # Documentation
├── src/                 # Source code
├── public/              # Static assets
├── prisma/              # Database schema and migrations
├── scripts/             # Build and utility scripts
├── tests/               # Test files
└── docker/              # Docker configuration
```

## Source Code Organization (`src/`)

```
src/
├── components/          # Reusable React components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   ├── forms/          # Form-specific components
│   ├── layout/         # Layout components (header, sidebar, etc.)
│   └── features/       # Feature-specific components
├── pages/              # Page components and routing
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
│   ├── api/           # API client configuration
│   ├── auth/          # Authentication utilities
│   ├── db/            # Database utilities
│   └── utils/         # General utility functions
├── types/              # TypeScript type definitions
├── styles/             # Global styles and theme
└── server/             # Backend API code
    ├── routes/         # API route handlers
    ├── middleware/     # Express middleware
    ├── controllers/    # Business logic controllers
    ├── models/         # Data models and validation
    └── services/       # Business services
```

## Documentation Structure (`docs/`)

```
docs/
├── architecture/       # Sharded architecture documentation
│   ├── index.md       # Architecture overview
│   ├── coding-standards.md
│   ├── tech-stack.md
│   └── source-tree.md
├── prd/               # Sharded product requirements
├── stories/           # User stories and development tasks
├── testing/           # Testing documentation
└── planning/          # Project planning documents
```

## Configuration Files

- **package.json** - Node.js dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **vite.config.ts** - Vite build configuration
- **tailwind.config.js** - Tailwind CSS configuration
- **docker-compose.yml** - Docker services configuration
- **prisma/schema.prisma** - Database schema
- **.env.example** - Environment variable template

## Key Principles

1. **Feature-based organization** - Group related files together
2. **Separation of concerns** - Clear boundaries between frontend/backend
3. **Reusable components** - Shared UI components in dedicated folders
4. **Type safety** - TypeScript definitions in dedicated types folder
5. **Testing proximity** - Tests close to the code they test