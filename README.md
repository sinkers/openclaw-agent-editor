# OpenClaw Agent Editor

A modern web-based editor for managing OpenClaw agent workspace markdown files. Built with React, TypeScript, and Node.js.

## Features

- 🎨 **Modern UI** - Clean, dark-mode interface with TailwindCSS
- ✏️ **Live Preview** - Split-pane markdown editor with real-time preview
- 💾 **Auto-save** - Automatic draft saving every 5 seconds to localStorage
- ⌨️ **Keyboard Shortcuts** - `Cmd+S` / `Ctrl+S` to save
- 🔄 **Draft Recovery** - Restore unsaved changes after refresh
- 🔒 **Safe Editing** - Creates `.bak` backup before every save
- 📁 **Multi-Agent** - Manage all agents from one interface

## Architecture

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **TailwindCSS** for styling
- **@uiw/react-md-editor** for markdown editing
- **Zustand** for state management
- **TanStack Query** for data fetching and caching
- **React Router** for navigation

### Backend
- **Node.js** + **TypeScript** + **Express**
- **REST API** on port 3001
- **File operations** with atomic writes and backups

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- OpenClaw installed with `~/.openclaw/openclaw.json` configured

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd openclaw-agent-editor
```

2. Install dependencies:
```bash
npm install
```

3. Verify OpenClaw configuration:
```bash
cat ~/.openclaw/openclaw.json
```

The file should contain an `agents.list` array with your agents:
```json
{
  "agents": {
    "list": [
      { "id": "main", "name": "Main Agent" },
      { "id": "general", "name": "General Agent" },
      { "id": "finance", "name": "Finance Agent" }
    ]
  }
}
```

## Development

Start both frontend and backend in development mode:

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend (port 3001)
npm run dev:backend

# Terminal 2 - Frontend (port 5173)
npm run dev:frontend
```

Then open http://localhost:5173 in your browser.

## Usage

1. **Select an Agent** - Click on an agent in the left sidebar
2. **Choose a File** - Click on a file tab (SOUL, IDENTITY, AGENTS, USER, TOOLS, HEARTBEAT, BOOTSTRAP)
3. **Edit Content** - Use the markdown editor with live preview
4. **Save Changes** - Click Save or press `Cmd+S` / `Ctrl+S`
5. **Draft Auto-save** - Drafts are automatically saved every 5 seconds

### Keyboard Shortcuts

- `Cmd+S` / `Ctrl+S` - Save current file
- Standard markdown editor shortcuts (bold, italic, etc.)

### File Management

All markdown files are stored in:
```
~/.openclaw/workspace-{agent-id}/
├── SOUL.md         # Agent's core personality
├── IDENTITY.md     # Agent identity details
├── AGENTS.md       # Agent interactions
├── USER.md         # User information
├── TOOLS.md        # Available tools
├── HEARTBEAT.md    # Status updates
└── BOOTSTRAP.md    # Initialization
```

Backups are created with `.bak` extension before each save.

## API Endpoints

The backend API runs on `http://localhost:3001`:

- `GET /api/health` - Health check
- `GET /api/agents` - List all agents
- `GET /api/agents/:agentId` - Get agent details with file list
- `GET /api/agents/:agentId/files/:fileName` - Read file content
- `PUT /api/agents/:agentId/files/:fileName` - Save file content

## Project Structure

```
openclaw-agent-editor/
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   │   ├── agents/    # Agent-related components
│   │   │   ├── editor/    # Editor components
│   │   │   └── layout/    # Layout components
│   │   ├── store/         # Zustand store
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   │   ├── ConfigService.ts
│   │   │   └── FileService.ts
│   │   ├── types/         # TypeScript types
│   │   └── index.ts       # Express server
│   └── package.json
├── docs/
│   └── REMOTE_ACCESS.md   # Remote access documentation
└── README.md
```

## Security

- **File Whitelist** - Only allowed markdown files can be accessed
- **Path Validation** - Prevents directory traversal attacks
- **CORS** - Restricted to localhost in development
- **Backup Creation** - Automatic backups before writes

## Production Build

Build both frontend and backend:

```bash
npm run build
```

This creates:
- `frontend/dist/` - Static frontend files
- `backend/dist/` - Compiled backend JavaScript

## Remote Access

For information about accessing this editor remotely (over network), see [docs/REMOTE_ACCESS.md](docs/REMOTE_ACCESS.md).

## Troubleshooting

### Backend won't start
- Verify `~/.openclaw/openclaw.json` exists
- Check that `agents.list` is a valid array
- Ensure port 3001 is available

### Agent not showing up
- Check `openclaw.json` has the agent in `agents.list`
- Verify workspace directory exists: `~/.openclaw/workspace-{agent-id}/`

### File changes not saving
- Check workspace directory permissions
- Verify agent ID is correct
- Look for error messages in browser console

### Drafts not auto-saving
- Check browser localStorage is enabled
- Verify you're making changes (isDirty flag)

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for any purpose.

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the implementation plan in `IMPLEMENTATION_PLAN.md`
