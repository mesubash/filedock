# Multi-stage build for React frontend
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application for production
RUN npm run build

# Production stage - serve static files
FROM node:20-alpine

WORKDIR /app

# Install serve to host static files
RUN npm install -g serve

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Serve the built app
CMD ["serve", "-s", "dist", "-l", "3000"]
