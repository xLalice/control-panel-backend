# Build stage
FROM node:22-slim AS build

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

# Generate Prisma client and build TS
RUN DIRECT_URL="postgresql://dummy:dummy@localhost:5432/dummy" DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run build

# Production stage
FROM node:22-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package*.json ./
COPY --from=build /app/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod && pnpm add -D prisma

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/src/templates ./src/templates

# Set environment variables
ENV NODE_ENV=production

# Run migrations and start the app
CMD npx prisma migrate deploy && node dist/src/server.js
