FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ENV DISABLE_MEDUSA_ADMIN=true

RUN npm run build

EXPOSE 9000

CMD ["npm", "run", "start"]
