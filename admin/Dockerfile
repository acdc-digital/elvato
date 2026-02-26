FROM node:20-slim

WORKDIR /app

# Copy the pre-built server output only
COPY .medusa/server ./

# Install only production dependencies (skip vite, react, jest, etc.)
RUN npm install --omit=dev

EXPOSE 9000

# Run migrations then start
CMD ["sh", "-c", "npx medusa db:migrate && npm run start"]
