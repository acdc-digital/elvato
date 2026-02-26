FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./

RUN npm install --production=false

COPY . .

RUN npm run build

EXPOSE 9000

CMD ["npm", "run", "start"]
