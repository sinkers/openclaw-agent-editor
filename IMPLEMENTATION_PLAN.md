# OpenClaw Agent Editor - Implementation Plan

## Overview
Build a React/Vite web application for editing OpenClaw agent workspace markdown files with a Node.js backend API for file operations.

## System Understanding

**OpenClaw Configuration:**
- Main config: `~/.openclaw/openclaw.json`
- Agents in `agents.list` array (currently: main, general, finance)
- Per-agent workspaces: `~/.openclaw/workspace-{agent-id}/`
- 7 markdown files per agent: SOUL.md, IDENTITY.md, AGENTS.md, USER.md, TOOLS.md, HEARTBEAT.md, BOOTSTRAP.md

**Key Finding:** OpenClaw API (port 18789) does NOT expose file access endpoints - it's OpenAI-compatible chat only. Therefore, we need a custom backend API.

## Technology Stack

**Frontend:**
- React 18 + TypeScript + Vite
- TailwindCSS for styling
- @uiw/react-md-editor (markdown editor with split preview)
- Zustand (state management)
- TanStack Query (API caching)
- React Router (navigation)

**Backend:**
- Node.js 18+ + TypeScript
- Express (REST API)
- fs/promises (file operations)

## Architecture

### Component Structure
```
App
├── Layout
│   ├── Sidebar (AgentList + ThemeToggle)
│   └── MainContent
│       ├── AgentView (/:agentId)
│       │   ├── AgentHeader
│       │   └── FileTabsView
│       │       ├── FileTabs
│       │       └── MarkdownEditor (edit + preview)
│       └── HomeView (/)
```

### API Design (Port 3001)

```
GET  /api/agents
     → List all agents with metadata

GET  /api/agents/:agentId
     → Get agent details + file list

GET  /api/agents/:agentId/files/:fileName
     → Read markdown file content

PUT  /api/agents/:agentId/files/:fileName
     → Save markdown file (creates backup first)

GET  /api/health
     → Health check
```

### State Management
- **Zustand Store:** Current agent, open files, UI state
- **TanStack Query:** API caching, automatic refetch, optimistic updates
- **localStorage:** Draft auto-save (every 5s)

## Implementation Steps

### Phase 1: Project Setup
- Initialize monorepo structure
- Set up frontend with Vite + React + TypeScript
- Set up backend with Node.js + Express + TypeScript
- Configure TailwindCSS
- Install all dependencies

### Phase 2: Backend API
- FileService.ts - Core file operations
- ConfigService.ts - Parse openclaw.json
- API routes (agents.ts)
- Security and error handling

### Phase 3: Frontend Core
- API client
- Zustand store
- Layout components
- Agent list
- Agent view with file tabs

### Phase 4: Editor Features
- Markdown editor integration
- Save functionality
- Draft auto-save
- Keyboard shortcuts
- Toast notifications

### Phase 5: UI Polish
- Dark mode styling
- Loading states
- Error handling
- Responsive design

### Phase 6: Documentation & Testing
- README.md
- REMOTE_ACCESS.md
- Manual testing
- End-to-end verification

## Success Criteria
- ✅ All agents from openclaw.json visible
- ✅ All 7 markdown files accessible per agent
- ✅ Markdown editor with live preview works
- ✅ Save creates backup and updates file
- ✅ Draft auto-save every 5s to localStorage
- ✅ Keyboard shortcuts functional
- ✅ Dark mode looks good
- ✅ No data loss during normal operation
- ✅ Startup time < 2 seconds
- ✅ Save operation < 100ms
