FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 9000

CMD ["npm", "run", "start"]
