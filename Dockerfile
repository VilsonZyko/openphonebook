# =============================================================================
# Stage 1 — Builder
# Installs build toolchain (python3, make, g++) and compiles the native
# better-sqlite3 addon against the glibc runtime. The toolchain is NOT
# copied to the final image.
# =============================================================================
FROM node:22-bookworm-slim AS builder

# Install build tools required to natively compile better-sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests first to maximise Docker layer cache reuse.
# node_modules is only rebuilt when package*.json actually changes.
COPY package*.json ./

# Install production dependencies only (compiles better-sqlite3 here)
RUN npm install --omit=dev

# =============================================================================
# Stage 2 — Production
# Lean runtime image: no build toolchain, runs as non-root 'node' user.
# =============================================================================
FROM node:22-bookworm-slim AS production

WORKDIR /app

# Copy compiled node_modules from builder (native addon already compiled)
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY . .

# Set environment variables for production and data path
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/phonebook.db

# Ensure the data directory exists and is owned by the non-root 'node' user
RUN mkdir -p /app/data && chown -R node:node /app

# Drop from root to the pre-created 'node' user (principle of least privilege)
USER node

# Expose the application port
EXPOSE 3000

# Health check — Docker marks the container unhealthy if /api/health stops
# responding, enabling automatic restart policies and load balancer drain.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "server.js"]
