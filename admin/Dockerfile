FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

EXPOSE 9000

CMD ["npm", "run", "start"]
