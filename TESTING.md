# Testing Checklist

This document provides a comprehensive testing checklist for the OpenClaw Agent Editor.

## Pre-Testing Setup

- [ ] Verify OpenClaw is installed: `ls ~/.openclaw/openclaw.json`
- [ ] Verify agents exist: `cat ~/.openclaw/openclaw.json`
- [ ] Verify workspace directories exist: `ls ~/.openclaw/workspace-*/`
- [ ] Install dependencies: `npm install`

## Backend Testing

### 1. Start Backend Server

```bash
npm run dev:backend
```

Expected output:
```
🚀 OpenClaw Agent Editor API running on http://localhost:3001
📁 Serving from ~/.openclaw/
```

### 2. API Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-01T...",
  "service": "openclaw-agent-editor-backend"
}
```

### 3. List Agents

```bash
curl http://localhost:3001/api/agents
```

Expected: JSON array of agents from openclaw.json

### 4. Get Agent Details

```bash
curl http://localhost:3001/api/agents/main
```

Expected: Agent object with file list

### 5. Read File

```bash
curl http://localhost:3001/api/agents/main/files/SOUL.md
```

Expected: File content with metadata

### 6. Save File

```bash
curl -X PUT http://localhost:3001/api/agents/main/files/SOUL.md \
  -H "Content-Type: application/json" \
  -d '{"content": "# Test\nThis is a test."}'
```

Expected: Success message
Verify: Backup created at `~/.openclaw/workspace-main/SOUL.md.bak`

## Frontend Testing

### 1. Start Frontend

```bash
npm run dev:frontend
```

Expected: Opens browser at http://localhost:5173

### 2. UI Components

- [ ] **Sidebar loads**
  - OpenClaw Editor header visible
  - Agent list loads (no errors)
  - Theme toggle present

- [ ] **Agent list**
  - All agents from openclaw.json visible
  - Agent cards show name and ID
  - Loading skeleton shows while fetching

- [ ] **Select agent**
  - Click on an agent
  - Agent becomes highlighted (blue background)
  - Navigates to `/agent/{agentId}`

- [ ] **Agent view**
  - Agent header shows name and workspace path
  - All 7 file tabs visible (SOUL, IDENTITY, AGENTS, USER, TOOLS, HEARTBEAT, BOOTSTRAP)
  - First tab (SOUL) is active by default

### 3. Editor Functionality

- [ ] **Load file**
  - Click on SOUL tab
  - Content loads in editor
  - Preview pane shows rendered markdown
  - Footer shows word/character count

- [ ] **Edit content**
  - Make changes in editor
  - Unsaved indicator (*) appears
  - Preview updates in real-time
  - Word/character count updates

- [ ] **Save file**
  - Click Save button (or Cmd+S)
  - "File saved successfully" toast appears
  - Unsaved indicator disappears
  - Last saved timestamp updates

- [ ] **Keyboard shortcuts**
  - Cmd+S (Mac) / Ctrl+S (Windows) saves file
  - Shortcut works even when editor is focused

### 4. Draft Auto-Save

- [ ] **Create draft**
  - Edit a file
  - Wait 5 seconds
  - Check localStorage: `openclaw-editor-storage` key
  - Verify draft is saved

- [ ] **Restore draft**
  - Make changes without saving
  - Refresh page
  - "Restore draft?" banner appears
  - Click "Restore" - content is restored
  - Click "Discard" - original content loads

- [ ] **Clear draft**
  - Save file after editing
  - Check localStorage - draft should be removed

### 5. Multi-File Navigation

- [ ] **Switch between files**
  - Click IDENTITY tab
  - Content loads
  - Click USER tab
  - Content loads
  - Each file loads independently

- [ ] **Unsaved changes warning**
  - Edit SOUL.md (don't save)
  - Switch to IDENTITY tab
  - Changes in SOUL are saved as draft
  - Return to SOUL tab
  - Draft restore prompt appears

### 6. Error Handling

- [ ] **Agent not found**
  - Navigate to `/agent/invalid`
  - Error message displays

- [ ] **File read error**
  - Delete a workspace file manually
  - Try to load it
  - Empty content loads (creates new file on save)

- [ ] **Backend offline**
  - Stop backend server
  - Try to load agents
  - Connection error displays
  - Restart backend - retry works

- [ ] **Invalid file name**
  - Try to access `/agent/main/files/INVALID.md` directly
  - Should show error (backend validation)

### 7. Theme Toggle

- [ ] **Dark mode** (default)
  - Background is dark (slate-950)
  - Text is light (slate-100)
  - Editor is dark themed

- [ ] **Light mode**
  - Click theme toggle
  - Background becomes light
  - Text becomes dark
  - Editor updates theme

## Integration Testing

### End-to-End Test Flow

1. [ ] Start backend and frontend
2. [ ] Open http://localhost:5173
3. [ ] Click on "finance" agent in sidebar
4. [ ] Click "SOUL" tab
5. [ ] Edit content: Add "# Test Heading"
6. [ ] Press Cmd+S to save
7. [ ] Toast notification appears
8. [ ] Check file: `cat ~/.openclaw/workspace-finance/SOUL.md`
9. [ ] Verify backup exists: `ls ~/.openclaw/workspace-finance/SOUL.md.bak`
10. [ ] Switch to "IDENTITY" tab
11. [ ] Content loads successfully
12. [ ] Refresh page
13. [ ] No draft restore prompt (nothing unsaved)
14. [ ] Success!

### Backup Verification

```bash
# Make an edit and save
# Check backup was created
ls -la ~/.openclaw/workspace-main/*.bak

# Verify backup content
diff ~/.openclaw/workspace-main/SOUL.md ~/.openclaw/workspace-main/SOUL.md.bak
```

### Performance Testing

- [ ] **Startup time**
  - Backend starts in < 2 seconds
  - Frontend loads in < 2 seconds
  - First agent click loads in < 500ms

- [ ] **Save operation**
  - File save completes in < 100ms
  - No lag in UI during save

- [ ] **Large files**
  - Test with 1MB+ markdown file
  - Editor remains responsive
  - Save works without errors

## Browser Compatibility

Test in multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (Mac)

Features to verify:
- [ ] localStorage works
- [ ] Markdown editor renders
- [ ] Keyboard shortcuts work
- [ ] Theme toggle works

## Error Scenarios

### Missing Configuration

```bash
# Temporarily move config
mv ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak

# Start backend
npm run dev:backend

# Expected: Error message about missing config
```

### Invalid JSON

```bash
# Create invalid JSON
echo "invalid json {{{" > ~/.openclaw/openclaw.json

# Start backend
# Expected: Parse error message
```

### Permission Denied

```bash
# Make workspace read-only
chmod 444 ~/.openclaw/workspace-main/SOUL.md

# Try to save file
# Expected: Permission error (check backend logs)
```

## Cleanup

After testing:

```bash
# Restore backups if needed
cp ~/.openclaw/workspace-main/*.bak ./backup/

# Clear localStorage (in browser console)
localStorage.clear()

# Reset workspaces
git restore ~/.openclaw/workspace-*/
```

## Success Criteria

All items checked = ✅ Ready for production

- [ ] All backend API endpoints work
- [ ] All frontend components render
- [ ] File editing works without data loss
- [ ] Drafts save and restore correctly
- [ ] Backups are created on save
- [ ] No console errors during normal use
- [ ] Performance meets targets (< 2s startup, < 100ms save)
- [ ] Works in all major browsers

## Known Issues

Document any known issues here:

1. None yet

## Next Steps

After successful testing:

1. Tag release: `git tag v1.0.0`
2. Build production: `npm run build`
3. Deploy (if needed)
4. Update README with any findings
