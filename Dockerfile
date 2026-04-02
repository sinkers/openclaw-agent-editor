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

# Build backend only — frontend is served separately (npm run dev:frontend or static hosting)
RUN npm run build:backend

WORKDIR /app/backend

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
