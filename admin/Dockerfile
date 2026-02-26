FROM node:20-slim

WORKDIR /app

# Copy everything including pre-built .medusa/server
COPY . .

# Install production dependencies in the pre-built server
WORKDIR /app/.medusa/server
RUN npm install --production

EXPOSE 9000

# Run migrations then start (per Medusa deployment docs)
CMD ["sh", "-c", "npx medusa db:migrate && npm run start"]
