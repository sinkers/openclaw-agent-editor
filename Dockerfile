FROM node:22-slim

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install all workspace deps (needed for build)
RUN npm ci

# Copy source
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build backend
RUN npm run build:backend

# Build frontend (static assets served separately or via nginx)
RUN npm run build:frontend

# Production: only keep backend runtime deps
WORKDIR /app/backend

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
