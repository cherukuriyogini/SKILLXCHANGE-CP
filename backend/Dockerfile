# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Production Image ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .

# Create uploads directory
RUN mkdir -p uploads && chown nodeuser:nodejs uploads

USER nodeuser

EXPOSE 5008

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5008/api/health || exit 1

CMD ["node", "server.js"]
