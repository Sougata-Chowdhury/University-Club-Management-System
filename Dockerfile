# Build stage
FROM node:18-alpine AS builder

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./
COPY backend/package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY backend/ ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/backend/dist ./dist

# Expose port (Render uses PORT env variable)
EXPOSE ${PORT:-8000}

# Start the application
CMD ["node", "dist/main"]
