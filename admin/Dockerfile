FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . ./
RUN npm run build && cd .medusa/server && npm install --omit=dev

WORKDIR /app/.medusa/server

ENV NODE_ENV=production

EXPOSE 9000

CMD ["sh", "-c", "npx medusa db:migrate && npm run start"]
