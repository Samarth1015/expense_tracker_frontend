# Use the official Node.js runtime as the base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat musl-dev
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production
RUN npm install -D tailwindcss postcss autoprefixer

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .



ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_dG9wcy1hcGUtOS5jbGVyay5hY2NvdW50cy5kZXYk
ENV NEXT_PUBLIC_BASE_URL=http://103.192.198.15:30008
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 6060

CMD ["node", "server.js"]
