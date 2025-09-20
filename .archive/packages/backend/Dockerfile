FROM node:18-alpine

WORKDIR /app

# Copy root package.json and workspace configuration
COPY package*.json ./

# Copy shared package
COPY ./packages/shared ./packages/shared

# Copy backend package.json
COPY ./packages/backend/package*.json ./packages/backend/

# Install all workspace dependencies
RUN npm install

# Build shared package
RUN cd packages/shared && npm run build

# Copy backend source code
COPY ./packages/backend ./packages/backend

# Switch to backend directory
WORKDIR /app/packages/backend

# Expose port
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev"]