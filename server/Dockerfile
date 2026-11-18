FROM node:22-alpine AS base
WORKDIR /app

# Dependências de compilação para módulo nativo argon2 em musl/Alpine
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
COPY rules/package.json ./rules/
COPY content/package.json ./content/
COPY server/package.json ./server/
COPY web/package.json ./web/

RUN npm ci --omit=dev

COPY tsconfig.base.json ./
COPY rules ./rules
COPY content ./content
COPY server ./server

ENV NODE_ENV=production
EXPOSE 3001

CMD ["npx", "tsx", "server/src/index.ts"]
