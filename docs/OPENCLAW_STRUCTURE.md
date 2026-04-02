# OpenClaw Structure Notes

Research notes based on inspection of the live `~/.openclaw/` installation and `~/clawd/` workspace.

---

## Top-Level `~/.openclaw/` Layout

```
~/.openclaw/
├── openclaw.json           # Main configuration file (versioned with .bak files)
├── openclaw.json.bak       # Auto-backup before each write
├── agents/
│   └── {agentId}/
│       ├── agent/          # Per-agent runtime overrides (auth, models)
│       └── sessions/       # Conversation history (JSONL files + sessions.json index)
├── memory/
│   └── {agentId}.sqlite    # Long-term memory stored as SQLite per agent
├── credentials/            # Channel auth tokens (WhatsApp, Telegram pairing, etc.)
├── identity/               # Device identity (device.json, device-auth.json)
├── cron/
│   └── jobs.json           # Scheduled cron job definitions
├── subagents/
│   └── runs.json           # Subagent run tracking
├── devices/                # Connected device registry
├── delivery-queue/         # Outbound message queue
├── browser/                # Browser automation state
├── media/                  # Media file cache
├── logs/                   # Application logs
├── canvas/                 # Canvas UI state (shared)
├── completions/            # Completion cache
└── workspace-{agentId}/    # Agent workspace directories (see caveat for 'main' below)
```

Observed workspace directories: `workspace-finance`, `workspace-general`, `workspace-max`.
The `main` agent is an exception — see below.

---

## Agent Workspace Layout

Each agent workspace is a **git repository** with markdown files at the root and several
subdirectories. This is the canonical structure (from `~/clawd`, the `main` workspace):

```
{workspace}/
├── SOUL.md             # Core identity and values — "who you are"
├── IDENTITY.md         # Name, role, vibe, emoji, active projects
├── AGENTS.md           # Instructions for the agent: how to start, memory rules, safety
├── USER.md             # About the human: name, timezone, contact notes
├── TOOLS.md            # Environment-specific notes: SSH hosts, devices, preferences
├── HEARTBEAT.md        # Periodic tasks — empty = no heartbeat API calls
├── BOOTSTRAP.md        # First-run onboarding script (deleted after initial setup)
├── MEMORY.md           # Curated long-term memory (only loaded in direct sessions)
├── memory/
│   └── YYYY-MM-DD[-topic].md   # Daily log files for session notes
├── canvas/
│   └── index.html      # Canvas UI (rendered in browser)
├── skills/             # Installed skill definitions (.skill files and subdirs)
└── .openclaw/
    └── workspace-state.json    # Tracks bootstrap seed timestamp
```

### File Purposes

| File | Purpose | Who edits |
|------|---------|-----------|
| `SOUL.md` | Core values and behavioural guidelines | User + Agent |
| `IDENTITY.md` | Name, role, personality, active projects | Agent (after bootstrap) |
| `AGENTS.md` | Operational instructions for the agent | User (framework-seeded) |
| `USER.md` | Context about the human | Agent (built up over time) |
| `TOOLS.md` | Local environment specifics | Agent |
| `HEARTBEAT.md` | Periodic check-in tasks | User |
| `BOOTSTRAP.md` | One-time onboarding — deleted after use | Framework-seeded |
| `MEMORY.md` | Long-term curated memory (private) | Agent |

---

## `openclaw.json` Schema (Relevant Fields)

```jsonc
{
  "agents": {
    "defaults": {
      "workspace": "/Users/andrewsinclair/clawd",  // ← workspace path (can be overridden per-agent)
      "model": { "primary": "..." },
      "contextPruning": { "mode": "cache-ttl", "ttl": "1h" },
      "compaction": { "mode": "safeguard" },
      "heartbeat": { "every": "30m" },
      "maxConcurrent": 4,
      "subagents": { "maxConcurrent": 8 }
    },
    "list": [
      {
        "id": "main",
        // per-agent workspace override would go here as "workspace": "..."
        "groupChat": { "mentionPatterns": ["@handle"] }
      }
    ],
    "entries": []  // appears unused currently
  }
}
```

---

## Critical Finding: The `main` Agent Uses a Custom Workspace Path

The `main` agent's workspace is **`~/clawd`**, not `~/.openclaw/workspace-main`.

This is set via `agents.defaults.workspace` in `openclaw.json`:

```json
"agents": {
  "defaults": {
    "workspace": "/Users/andrewsinclair/clawd"
  }
}
```

The other agents (`finance`, `general`, `max`) appear to follow the default
`~/.openclaw/workspace-{id}` pattern — those directories exist in `~/.openclaw/`.

### Workspace Path Resolution (inferred)

| Agent | Workspace path |
|-------|---------------|
| `main` | `~/clawd` (via `agents.defaults.workspace`) |
| `finance` | `~/.openclaw/workspace-finance` (default pattern) |
| `general` | `~/.openclaw/workspace-general` (default pattern) |
| `max` | `~/.openclaw/workspace-max` (default pattern) |

Per-agent `workspace` overrides (inside an `agents.list` entry) would take precedence
over `agents.defaults.workspace`.

---

## App Implications

### Current Bug in `ConfigService` / `FileService`

The current `ConfigService.getAgents()` hardcodes the workspace path as:
```typescript
workspacePath: join(this.openclawPath, `workspace-${agent.id}`)
```

This is **wrong for `main`** — it would construct `~/.openclaw/workspace-main` which
doesn't exist. The real path is `~/clawd`.

### Fix Required

`ConfigService` needs to resolve the workspace path by reading it from the config:

1. Check for a per-agent `workspace` field on the list entry
2. Fall back to `agents.defaults.workspace`
3. Fall back to `~/.openclaw/workspace-{id}` as a last resort

```typescript
// Pseudo-code for correct resolution
const resolveWorkspace = (agentEntry, defaults, openclawPath) => {
  return agentEntry.workspace
    ?? defaults.workspace
    ?? join(openclawPath, `workspace-${agentEntry.id}`);
};
```

---

## Sessions Storage

Sessions are stored in `~/.openclaw/agents/{id}/sessions/`:

- Individual sessions: `{uuid}.jsonl` — newline-delimited JSON events
- Deleted sessions: `{uuid}.jsonl.deleted.{timestamp}` — soft-deleted
- Index: `sessions.json` — consolidated session index (can grow large; ~20MB for `main`)

The `main` agent has **2,212 session files** as of research date.

---

## Per-Agent Runtime Overrides

`~/.openclaw/agents/{id}/agent/` contains JSON files that override global config:

- `auth.json` — agent-specific auth tokens (e.g. OAuth for openai-codex)
- `auth-profiles.json` — auth profile assignments
- `models.json` — agent-specific model provider configuration

---

## Memory Storage

Long-term memory is stored as SQLite databases:

```
~/.openclaw/memory/main.sqlite   # ~10MB for main agent
~/.openclaw/memory/max.sqlite    # ~70KB for max agent
```

The workspace `MEMORY.md` is the human-readable curated version. The SQLite database
is the machine-managed store.

---

## Known Agents on This System

| ID | Workspace | Notes |
|----|-----------|-------|
| `main` | `~/clawd` | Primary agent; Telegram/Slack/WhatsApp; ~2200 sessions |
| `finance` | `~/.openclaw/workspace-finance` | Listed in `agents/` dir only |
| `general` | `~/.openclaw/workspace-general` | Listed in `agents/` dir only |
| `max` | `~/.openclaw/workspace-max` | iOS/Flutter dev agent; managed by Elysse |

Only `main` is listed in `openclaw.json`'s `agents.list`. The others exist as workspace
directories and agent data dirs but are not in the current config's list — they may be
from a previous config or inactive.
