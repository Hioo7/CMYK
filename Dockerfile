# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Install dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# npm ci installs the linux-x64 Sharp binary automatically on this platform
RUN npm ci

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Build Next.js (produces .next/standalone)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3 — Minimal production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Next.js standalone server + static assets
COPY --from=builder /app/public                          ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# Sharp native binaries — must be copied explicitly for standalone builds
# because native .node files are not auto-traced by Next.js
COPY --from=builder /app/node_modules/sharp              ./node_modules/sharp
COPY --from=builder /app/node_modules/@img               ./node_modules/@img

USER nextjs

EXPOSE 7000
ENV PORT=7000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
