# Changelog

All notable changes to the OpenClaw Agent Editor project.

## [1.0.0] - 2026-04-01

### Initial Release

Complete implementation of the OpenClaw Agent Editor MVP with all planned features.

#### Backend (Node.js + Express + TypeScript)

**Core Services**
- `ConfigService` - Parses `~/.openclaw/openclaw.json` and manages agent configuration
- `FileService` - Handles file CRUD operations with security validation
  - Whitelist enforcement for allowed markdown files
  - Path sanitization to prevent directory traversal
  - Automatic backup creation (`.bak`) before writes
  - Atomic write operations for data safety

**API Endpoints**
- `GET /api/health` - Health check endpoint
- `GET /api/agents` - List all configured agents
- `GET /api/agents/:agentId` - Get agent details with file list
- `GET /api/agents/:agentId/files/:fileName` - Read markdown file
- `PUT /api/agents/:agentId/files/:fileName` - Save markdown file

**Security Features**
- File whitelist validation
- Agent ID sanitization
- Path traversal prevention
- CORS restricted to localhost
- Structured error responses

#### Frontend (React + TypeScript + Vite)

**Core Components**
- `Layout` - Main application layout with sidebar and content area
- `Sidebar` - Navigation with agent list and theme toggle
- `AgentList` - Displays all agents with loading states
- `AgentView` - Shows agent details and file tabs
- `FileTabsView` - Tab navigation for markdown files
- `MarkdownEditor` - Main editor with live preview
- `Toast` - Notification system for success/error messages
- `ThemeToggle` - Dark/light mode switcher

**State Management**
- Zustand store with localStorage persistence
- Current agent/file tracking
- Theme preferences
- Draft management

**Data Fetching**
- TanStack Query integration
- Automatic caching (5-minute stale time)
- Optimistic updates
- Error handling and retry logic

**Editor Features**
- Split-pane markdown editor with live preview (@uiw/react-md-editor)
- Syntax highlighting
- Word and character count
- Last saved timestamp
- Unsaved changes indicator (*)

**Auto-Save System**
- Draft auto-save every 5 seconds to localStorage
- Draft restoration on page load
- "Restore draft?" banner with restore/discard options
- Automatic draft cleanup on successful save

**Keyboard Shortcuts**
- `Cmd+S` / `Ctrl+S` - Save current file

**UI/UX**
- Dark mode by default (slate color palette)
- Responsive design
- Loading skeletons
- Smooth transitions
- Toast notifications
- Error states

#### Documentation

- `README.md` - Complete project documentation
- `QUICKSTART.md` - 5-minute setup guide
- `IMPLEMENTATION_PLAN.md` - Detailed implementation plan
- `TESTING.md` - Comprehensive testing checklist
- `docs/REMOTE_ACCESS.md` - Remote access options analysis
- `CHANGELOG.md` - Project history

#### Configuration

- Monorepo structure with npm workspaces
- TailwindCSS with dark mode support
- TypeScript strict mode
- ESLint configuration
- PostCSS with autoprefixer
- Environment variable support

#### Development Tools

- Hot reload for backend (tsx watch)
- Hot module replacement for frontend (Vite HMR)
- Concurrent dev script (`npm run dev`)
- Type checking scripts
- Build scripts for production

### File Structure

```
openclaw-agent-editor/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── agents.ts
│   │   ├── services/
│   │   │   ├── ConfigService.ts
│   │   │   └── FileService.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── components/
│   │   │   ├── agents/
│   │   │   │   ├── AgentList.tsx
│   │   │   │   └── AgentView.tsx
│   │   │   ├── editor/
│   │   │   │   ├── FileTabsView.tsx
│   │   │   │   ├── MarkdownEditor.tsx
│   │   │   │   └── Toast.tsx
│   │   │   └── layout/
│   │   │       ├── Layout.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── ThemeToggle.tsx
│   │   │       └── HomeView.tsx
│   │   ├── store/
│   │   │   └── appStore.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   └── REMOTE_ACCESS.md
├── .gitignore
├── package.json
├── README.md
├── QUICKSTART.md
├── TESTING.md
├── IMPLEMENTATION_PLAN.md
└── CHANGELOG.md
```

### Supported Markdown Files

Each agent workspace includes 7 markdown files:

1. `SOUL.md` - Agent's core personality and behavior
2. `IDENTITY.md` - Agent identity and characteristics
3. `AGENTS.md` - Agent interactions and relationships
4. `USER.md` - User information and preferences
5. `TOOLS.md` - Available tools and capabilities
6. `HEARTBEAT.md` - Status updates and monitoring
7. `BOOTSTRAP.md` - Initialization and startup configuration

### Performance

- Backend startup: < 2 seconds
- Frontend load: < 2 seconds
- File save operation: < 100ms
- Auto-save interval: 5 seconds
- API cache stale time: 5 minutes

### Security

- File access restricted to whitelist
- Path traversal prevention
- Agent ID validation
- CORS limited to localhost
- Automatic backups prevent data loss

### Known Limitations

- Local access only (remote access requires authentication setup)
- Single-user editing (no conflict resolution)
- No version history (beyond .bak files)
- No git integration (manual commits required)

### Future Enhancements

See [docs/REMOTE_ACCESS.md](docs/REMOTE_ACCESS.md) for planned features:

- JWT authentication for remote access
- HTTPS/TLS support
- Docker deployment
- WebSocket for real-time collaboration
- Conflict resolution for multi-user editing
- Git integration (commit, history, revert)
- Advanced permissions system
- Audit logging

## [Unreleased]

No unreleased changes yet.

---

## Version Schema

- **Major** (1.x.x) - Breaking changes or major new features
- **Minor** (x.1.x) - New features, backwards compatible
- **Patch** (x.x.1) - Bug fixes, minor improvements
