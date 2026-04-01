# Quick Start Guide

Get the OpenClaw Agent Editor running in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- OpenClaw configured at `~/.openclaw/openclaw.json`
- At least one agent configured in OpenClaw

## Installation & Start

```bash
# 1. Install dependencies
npm install

# 2. Start both backend and frontend
npm run dev
```

That's it! The application will open at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## First Steps

1. **Select an agent** from the sidebar
2. **Click a file tab** (SOUL, IDENTITY, etc.)
3. **Edit the markdown** in the editor
4. **Save** by clicking Save button or pressing `Cmd+S` / `Ctrl+S`

## Common Commands

```bash
# Start everything
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build for production
npm run build

# Type check
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

## Verify Setup

Check that OpenClaw is configured:

```bash
# View configuration
cat ~/.openclaw/openclaw.json

# List agents
ls -la ~/.openclaw/workspace-*/
```

Expected structure:
```
~/.openclaw/
├── openclaw.json           # Main config
├── workspace-main/         # Agent workspace
│   ├── SOUL.md
│   ├── IDENTITY.md
│   ├── AGENTS.md
│   ├── USER.md
│   ├── TOOLS.md
│   ├── HEARTBEAT.md
│   └── BOOTSTRAP.md
├── workspace-general/      # Another agent
└── workspace-finance/      # Another agent
```

## Troubleshooting

### "Cannot find openclaw.json"

Create the file:
```bash
mkdir -p ~/.openclaw
echo '{
  "agents": {
    "list": [
      { "id": "main", "name": "Main Agent" }
    ]
  }
}' > ~/.openclaw/openclaw.json
```

### "Port 3001 already in use"

Change the port:
```bash
cd backend
PORT=3002 npm run dev
```

Then update frontend `.env`:
```
VITE_API_URL=http://localhost:3002/api
```

### "Agents not loading"

1. Check backend is running: `curl http://localhost:3001/api/health`
2. Check browser console for errors (F12)
3. Verify openclaw.json syntax: `cat ~/.openclaw/openclaw.json | jq`

## Features at a Glance

- ✏️ **Markdown Editor** - Live preview with syntax highlighting
- 💾 **Auto-save** - Drafts saved every 5 seconds
- 🔄 **Draft Recovery** - Restore unsaved changes after refresh
- ⚡ **Fast** - Instant saves with optimistic updates
- 🎨 **Dark Mode** - Easy on the eyes (default)
- ⌨️ **Keyboard Shortcuts** - `Cmd+S` to save
- 🔒 **Safe** - Automatic backups before every save

## Next Steps

- Read [README.md](README.md) for full documentation
- Check [TESTING.md](TESTING.md) for testing guide
- See [docs/REMOTE_ACCESS.md](docs/REMOTE_ACCESS.md) for remote setup

## Need Help?

- Check the [README.md](README.md) for detailed information
- Review [TESTING.md](TESTING.md) for troubleshooting
- Open an issue on GitHub

Happy editing! 🚀
