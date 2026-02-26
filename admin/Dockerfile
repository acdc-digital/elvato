# syntax=docker/dockerfile:1.7
FROM node:20-slim

WORKDIR /app

ENV npm_config_update_notifier=false \
	npm_config_fund=false \
	npm_config_audit=false

COPY package*.json ./
RUN --mount=type=cache,id=admin-npm-cache,target=/root/.npm npm ci --no-audit --no-fund --loglevel=warn

COPY . ./
RUN --mount=type=cache,id=admin-npm-cache,target=/root/.npm npm run build && cd .medusa/server && npm install --omit=dev --no-audit --no-fund --loglevel=warn

WORKDIR /app/.medusa/server

ENV NODE_ENV=production

EXPOSE 9000

CMD ["sh", "-c", "npx medusa db:migrate && npm run start"]
