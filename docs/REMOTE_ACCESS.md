# Remote Access Guide

This document explains the options for accessing the OpenClaw Agent Editor remotely over a network.

## Current State: Local Only

The current implementation is designed for **local access only**:
- Backend API: `http://localhost:3001`
- Frontend: `http://localhost:5173`
- File access: Direct access to `~/.openclaw/` on local machine

## Remote Access Options

### Option A: Via OpenClaw Gateway API ❌ Not Viable

**Status:** Not recommended

The OpenClaw Gateway API (port 18789) does NOT expose file access endpoints. It only provides:
- `/v1/chat/completions` - OpenAI-compatible chat endpoint
- Control UI for agent management

**Why this won't work:**
- Would require building a custom OpenClaw plugin to add file endpoints
- High complexity and maintenance burden
- Requires modifying OpenClaw core

**Verdict:** Not suitable for this project's MVP.

---

### Option B: Deploy Custom Backend API ✅ Recommended

**Status:** Recommended approach for remote access

Deploy the backend as a standalone service with authentication.

#### Architecture

```
┌─────────────┐         HTTPS         ┌──────────────┐
│   Browser   │ ◄─────────────────► │   Frontend   │
│  (Remote)   │                       │  (Static)    │
└─────────────┘                       └──────────────┘
                                             │
                                             │ API Calls
                                             ▼
                                      ┌──────────────┐
                                      │   Backend    │
                                      │  Express API │
                                      └──────────────┘
                                             │
                                             │ File Access
                                             ▼
                                      ┌──────────────┐
                                      │ ~/.openclaw/ │
                                      │   (Local)    │
                                      └──────────────┘
```

#### Implementation Steps

##### 1. Add Authentication

Add JWT-based authentication to the backend:

```typescript
// backend/src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

Apply to routes:
```typescript
import { authenticateToken } from './middleware/auth.js';

app.use('/api/agents', authenticateToken, agentsRouter);
```

##### 2. Add User Management

Create a simple user management system:

```typescript
// POST /api/auth/login
// POST /api/auth/logout
// GET /api/auth/me
```

Store user credentials securely (hashed passwords with bcrypt).

##### 3. Enable HTTPS/TLS

Use Let's Encrypt for free SSL certificates:

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d editor.yourdomain.com

# Update backend to use HTTPS
```

```typescript
// backend/src/index.ts
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem'),
};

https.createServer(options, app).listen(3001);
```

##### 4. Dockerize Application

Create `Dockerfile`:

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

# Build frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app

# Copy built files
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/frontend/dist ./frontend/dist

# Install production dependencies
WORKDIR /app/backend
RUN npm ci --production

# Expose port
EXPOSE 3001

CMD ["node", "dist/index.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  openclaw-editor:
    build: .
    ports:
      - "3001:3001"
    volumes:
      - ~/.openclaw:/root/.openclaw:ro  # Read-only access
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    restart: unless-stopped
```

##### 5. Deploy to Server

**Option A: VPS (DigitalOcean, Linode, AWS EC2)**

```bash
# 1. Provision server
# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clone repository
git clone <repo-url>
cd openclaw-agent-editor

# 4. Set environment variables
echo "JWT_SECRET=your-secret-here" > .env

# 5. Build and start
docker-compose up -d

# 6. Set up Nginx reverse proxy
# 7. Configure SSL with certbot
```

**Option B: Cloud Platform (Heroku, Railway, Render)**

These platforms handle SSL and deployment automatically:

```bash
# Deploy to Railway
railway login
railway init
railway up
```

##### 6. Update Frontend Configuration

Update frontend API URL:

```typescript
// frontend/src/api/client.ts
const API_BASE = import.meta.env.VITE_API_URL || 'https://editor.yourdomain.com/api';
```

Create `.env.production`:
```
VITE_API_URL=https://editor.yourdomain.com/api
```

#### Security Considerations

- ✅ Use HTTPS/TLS for all traffic
- ✅ Implement rate limiting (express-rate-limit)
- ✅ Add CSRF protection
- ✅ Validate all inputs
- ✅ Use secure session management
- ✅ Implement audit logging
- ✅ Regular security updates
- ✅ Consider VPN access for extra security

---

### Option C: Hybrid Approach ⚡ Best of Both

**Status:** Flexible option

Keep the application working locally AND remotely by making the backend URL configurable.

#### Implementation

1. **Local Mode** (default)
   - Backend: `http://localhost:3001`
   - Frontend: `http://localhost:5173`
   - Direct file access

2. **Remote Mode**
   - Backend: `https://editor.yourdomain.com/api`
   - Frontend: Deployed static site or local
   - API calls over HTTPS

#### Frontend Configuration

Add mode selection in UI:

```typescript
// frontend/src/components/settings/ConnectionSettings.tsx
export function ConnectionSettings() {
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('apiUrl') || 'http://localhost:3001/api'
  );

  const handleSave = () => {
    localStorage.setItem('apiUrl', apiUrl);
    window.location.reload();
  };

  return (
    <div>
      <label>API URL:</label>
      <input
        value={apiUrl}
        onChange={(e) => setApiUrl(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

Update API client:

```typescript
// frontend/src/api/client.ts
const getApiBase = () => {
  return localStorage.getItem('apiUrl') ||
         import.meta.env.VITE_API_URL ||
         'http://localhost:3001/api';
};

const API_BASE = getApiBase();
```

---

## Future Enhancements

### Real-time Collaboration

Add WebSocket support for multi-user editing:

```typescript
// backend/src/websocket.ts
import { Server } from 'socket.io';

io.on('connection', (socket) => {
  socket.on('file:edit', (data) => {
    // Broadcast changes to other users
    socket.broadcast.emit('file:update', data);
  });
});
```

### Conflict Resolution

Implement operational transformation or CRDTs for concurrent editing:

```typescript
// Handle conflicts when multiple users edit same file
const resolveConflict = (localChanges, remoteChanges) => {
  // Show diff UI
  // Let user choose which version to keep
  // Or merge automatically
};
```

### Version History

Add git integration for version control:

```typescript
// backend/src/services/GitService.ts
export class GitService {
  async commit(message: string) {
    // Auto-commit on save
  }

  async getHistory(filePath: string) {
    // Show file history
  }

  async revert(commitHash: string) {
    // Restore previous version
  }
}
```

---

## Recommended Path Forward

For production remote access, follow **Option B** (Deploy Custom Backend):

1. **Phase 1** (MVP): Local access only ✅ (Current)
2. **Phase 2** (Basic Remote): Add JWT auth + HTTPS
3. **Phase 3** (Docker Deploy): Containerize and deploy
4. **Phase 4** (Multi-user): Add WebSockets and conflict resolution
5. **Phase 5** (Advanced): Version history, audit logs, advanced permissions

---

## Cost Estimation

### Hosting Options

| Provider | Cost | Features |
|----------|------|----------|
| DigitalOcean Droplet | $6-12/mo | Full control, 1-2GB RAM |
| Railway | $5-10/mo | Easy deploy, auto-SSL |
| Heroku | $7/mo | Managed platform |
| AWS EC2 (t2.micro) | Free tier / $8/mo | Scalable |
| Self-hosted | Electricity only | Full control |

### Additional Costs

- Domain name: $10-15/year
- SSL certificate: Free (Let's Encrypt)
- CDN (optional): $0-5/mo
- Monitoring (optional): Free tier available

---

## Conclusion

For the MVP, the current local-only implementation is sufficient. When remote access is needed:

1. **Recommended:** Deploy with JWT auth + HTTPS (Option B)
2. **Alternative:** Hybrid approach for flexibility (Option C)
3. **Not recommended:** Relying on OpenClaw Gateway API (Option A)

The architecture is designed to make adding authentication and remote access straightforward when needed.
