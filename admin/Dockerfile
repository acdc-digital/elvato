# syntax=docker/dockerfile:1.7
FROM node:20-slim@sha256:d8a35d586fad3af7abb6fdb9ba972388395405f4d462da9e4a4ddcde67b5e0fb

WORKDIR /app

ENV npm_config_update_notifier=false \
	npm_config_fund=false \
	npm_config_audit=false

COPY package*.json ./
RUN npm ci --no-audit --no-fund --loglevel=warn

COPY . ./
RUN npm run build && cd .medusa/server && npm install --omit=dev --no-audit --no-fund --loglevel=warn

WORKDIR /app/.medusa/server

ENV NODE_ENV=production

EXPOSE 9000

CMD npx medusa db:migrate && (npx medusa exec ./src/scripts/bootstrap-meilisearch.ts 2>&1 || echo "BOOTSTRAP_FAILED: Meilisearch bootstrap failed — guard job will retry at next 30-min mark") && npm run start
