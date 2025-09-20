FROM node:18-alpine

WORKDIR /app

# Copy root package.json and workspace configuration
COPY package*.json ./

# Copy shared package
COPY ./packages/shared ./packages/shared

# Copy frontend package.json
COPY ./packages/frontend/package*.json ./packages/frontend/

# Install all workspace dependencies
RUN npm install

# Build shared package
RUN cd packages/shared && npm run build

# Copy frontend source code
COPY ./packages/frontend ./packages/frontend

# Switch to frontend directory
WORKDIR /app/packages/frontend

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]