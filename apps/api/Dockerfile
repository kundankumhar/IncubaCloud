
FROM node:20-alpine

WORKDIR /app

# Copy root workspace files
COPY package*.json ./

# Copy workspace package files
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies
RUN npm ci

# Copy backend source files
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/src ./apps/api/src

# Build backend
RUN npm run build --workspace=@incubacloud/api

EXPOSE 4000

# Start backend
CMD ["npm", "run", "start", "--workspace=@incubacloud/api"]

