#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files and the fixes to apply
const fixes = [
  // Remove unused imports
  {
    file: 'src/migrations/1726789800000-AddPublishingLogicToSessions.ts',
    fixes: [
      { search: 'import { MigrationInterface, QueryRunner, Index } from "typeorm";', replace: 'import { MigrationInterface, QueryRunner } from "typeorm";' }
    ]
  },
  {
    file: 'src/modules/admin/analytics.service.ts',
    fixes: [
      { search: 'const dateFormat = ', replace: 'const _dateFormat = ' }
    ]
  },
  {
    file: 'src/modules/admin/export.service.ts',
    fixes: [
      { search: 'import { Repository, MoreThanOrEqual, LessThanOrEqual } from \'typeorm\';', replace: 'import { Repository, MoreThanOrEqual } from \'typeorm\';' },
      { search: 'async exportData(options: ExportOptions, userId: number)', replace: 'async exportData(options: ExportOptions, _userId: number)' },
      { search: 'const endDate = ', replace: 'const _endDate = ' }
    ]
  },
  {
    file: 'src/modules/ai/ai.controller.ts',
    fixes: [
      { search: 'import { Controller, Post, Body, UseGuards, Request, Param } from \'@nestjs/common\';', replace: 'import { Controller, Post, Body, UseGuards, Request } from \'@nestjs/common\';' },
      { search: '@Request() req', replace: '@Request() _req' }
    ]
  },
  {
    file: 'src/modules/ai/ai.service.ts',
    fixes: [
      { search: 'const previousContent = ', replace: 'const _previousContent = ' }
    ]
  },
  // Remove unused TypeORM imports
  {
    file: 'src/modules/audiences/audiences.service.ts',
    fixes: [
      { search: 'import { Repository, Like } from \'typeorm\';', replace: 'import { Repository } from \'typeorm\';' }
    ]
  },
  {
    file: 'src/modules/categories/categories.service.ts',
    fixes: [
      { search: 'import { Repository, Like } from \'typeorm\';', replace: 'import { Repository } from \'typeorm\';' }
    ]
  },
  {
    file: 'src/modules/locations/locations.service.ts',
    fixes: [
      { search: 'import { Repository, Like } from \'typeorm\';', replace: 'import { Repository } from \'typeorm\';' }
    ]
  },
  {
    file: 'src/modules/topics/topics.service.ts',
    fixes: [
      { search: 'import { Repository, Like } from \'typeorm\';', replace: 'import { Repository } from \'typeorm\';' }
    ]
  }
];

// Apply fixes
fixes.forEach(({ file, fixes: fileFixes }) => {
  const fullPath = path.join(__dirname, 'packages/backend', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    fileFixes.forEach(({ search, replace }) => {
      content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
    });

    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Lint fixes applied!');