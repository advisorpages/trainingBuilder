FROM node:18-alpine

WORKDIR /app

# Copy root package.json and workspace configuration
COPY package*.json ./

# Copy shared package
COPY ./packages/shared ./packages/shared

# Copy backend package.json
COPY ./packages/backend/package*.json ./packages/backend/

# Install all workspace dependencies at root level
RUN npm install

# Install backend specific dependencies
WORKDIR /app/packages/backend
RUN npm install

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Copy backend source code
WORKDIR /app
COPY ./packages/backend ./packages/backend

# Switch to backend directory
WORKDIR /app/packages/backend

# Build the project and create symlink to fix path issue
RUN npm run build && ln -sf /app/packages/backend/dist/backend/src/main.js /app/packages/backend/dist/main.js

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "start:dev"]