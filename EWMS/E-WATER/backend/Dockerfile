# ── Stage 1: Build ──
# Use a specific Node LTS version for consistency
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first — Docker caches this layer
# so npm install only re-runs when dependencies change
COPY package*.json ./
RUN npm install --omit=dev

# ── Stage 2: Production image ──
FROM node:20-alpine

WORKDIR /app

# Copy installed modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY . .

# Don't run as root inside the container
USER node

EXPOSE 5000

# Health check — Docker will restart the container if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
