# Prisma engines are vendored in ./.engines (server reaches binaries.prisma.sh unreliably).
# Fetch: see INFRA.md. Engine commit must match prisma version (5.22.0).
FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY .engines/ /engines/
ENV PRISMA_SCHEMA_ENGINE_BINARY=/engines/schema-engine PRISMA_QUERY_ENGINE_LIBRARY=/engines/libquery_engine.so.node
WORKDIR /app

FROM base AS build
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build && npm test && npm prune --omit=dev

FROM base
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./
USER node
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
