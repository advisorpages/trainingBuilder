#!/bin/bash

# Leadership Training App - Local Development Starter
# This script helps start the hybrid development environment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Leadership Training App - Local Development${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if .env exists
if [ ! -f "packages/backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env file not found${NC}"
    echo -e "${BLUE}Creating from .env.example...${NC}"
    cp packages/backend/.env.example packages/backend/.env
    echo -e "${GREEN}✓ Created packages/backend/.env${NC}"
    echo -e "${YELLOW}⚠️  Please edit packages/backend/.env with your configuration${NC}"
    echo ""
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and try again${NC}"
    exit 1
fi

# Check if database is already running
DB_RUNNING=$(docker ps --filter "name=leadership-training-db" --format "{{.Names}}" 2>/dev/null)

if [ -n "$DB_RUNNING" ]; then
    echo -e "${GREEN}✓ Database is already running${NC}"
else
    echo -e "${BLUE}Starting database...${NC}"
    docker-compose up -d database

    # Wait for database to be ready
    echo -e "${BLUE}Waiting for database to be ready...${NC}"
    sleep 5

    # Check if database is healthy
    until docker exec leadership-training-db pg_isready -U postgres > /dev/null 2>&1; do
        echo -e "${YELLOW}Waiting for database...${NC}"
        sleep 2
    done

    echo -e "${GREEN}✓ Database is ready${NC}"
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo -e "  ${BLUE}1.${NC} Start backend (in a new terminal):"
echo -e "     ${GREEN}cd packages/backend && npm run start:dev${NC}"
echo ""
echo -e "  ${BLUE}2.${NC} Start frontend (in another new terminal):"
echo -e "     ${GREEN}cd packages/frontend && npm run dev${NC}"
echo ""
echo -e "${BLUE}Access URLs:${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:3001${NC}"
echo -e "  Database:  ${GREEN}localhost:5433${NC} (user: postgres, pass: postgres)"
echo ""
echo -e "${BLUE}To stop the database:${NC}"
echo -e "  ${GREEN}docker-compose stop database${NC}"
echo ""
