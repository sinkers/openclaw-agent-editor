# OpenClaw Gateway API (:18789)

Research notes on the native OpenClaw control gateway running at `http://localhost:18789`.

---

## Overview

The gateway is a local-only HTTP server (bound to loopback). It serves:
- A static SPA control UI (Lit web components)
- One REST endpoint for chat completions (OpenAI-compatible)
- Everything else is **WebSocket RPC** — all management operations go through a persistent WS connection

Auth token (from `openclaw.json`): used as `Authorization: Bearer <token>` for HTTP, and
sent during the WebSocket `connect` handshake.

---

## HTTP Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Serves the SPA control UI |
| GET | `/health` | No | `{"ok":true,"status":"live"}` — liveness check |
| POST | `/v1/chat/completions` | Yes | OpenAI-compatible chat. Routes to configured agents/models. Supports streaming (SSE) and non-streaming. |

All other paths (e.g. `/api/`, `/v1/models`) serve the SPA HTML — they are not REST endpoints.

---

## WebSocket RPC

All management operations are JSON RPC over WebSocket. Client sends `{type:"req", method, params}`,
server responds with `{type:"res"}` or emits `{type:"event"}`.

### File Access (Critical for This Project)

The gateway **already has file access RPC methods** for agent workspace files:

```
agents.files.list   — list agent workspace files (SOUL.md, IDENTITY.md, etc.)
agents.files.get    — read a specific agent file
agents.files.set    — write/save an agent file
```

This means the editor could use the gateway's own RPC instead of direct filesystem access,
which would correctly handle workspace path resolution (including `main` → `~/clawd`).

### Config Management

```
config.get                          — fetch openclaw.json + hash
config.set {raw, baseHash}          — save raw JSON config (hash for optimistic locking)
config.apply {raw, baseHash}        — save AND apply config live (hot reload)
config.schema                       — JSON Schema + UI hints for the config
config.openFile                     — open openclaw.json in editor on host
```

The `config.get` method is useful for reading the real workspace path for each agent
(including `agents.defaults.workspace`).

### Update & Restart

```
update.run {sessionKey}   — trigger openclaw self-update
update.available          — server-push event: new version available
```

### Sessions

```
sessions.list
sessions.patch / reset / delete / compact
sessions.usage / sessions.usage.logs / sessions.usage.timeseries
```

### Chat

```
chat.send       — send message to agent
chat.history    — retrieve chat history
chat.abort      — abort in-progress response
```

### Cron / Scheduler

```
cron.add / list / remove / update / run / runs / status
```

### Skills

```
skills.status   — installed skills report
skills.install  — install skill by ID
skills.update   — update installed skill
```

### Channels

```
channels.status {probe, timeoutMs}    — channel connectivity
channels.logout {channel}
web.login.start / web.login.wait      — WhatsApp QR login flow
```

### Tools & Models

```
tools.catalog   — list available tools
models.list     — list configured models
```

### Agents & Identity

```
agents.list
agent.identity.get
last-heartbeat
system-presence
```

### Device / Auth

```
device.pair.list / approve / reject
device.token.rotate / revoke
```

### Execution Approval

```
exec.approval.resolve {allow-always | allow-once | deny}
```

### Logs & Usage

```
logs.tail       — stream live gateway logs
node.list       — list paired nodes
usage.cost      — API cost summary
```

### Server-Push Events (gateway → client)

```
agent                         — agent state change
chat                          — new chat message
connect.challenge             — device pairing challenge
cron                          — cron job event
device.pair.requested / resolved
exec.approval.requested / resolved
presence                      — instance presence beacon
update.available              — new version available
```

---

## Implication: Alternative Architecture for This Editor

Rather than reading files directly from the filesystem, the editor could proxy through the
gateway's RPC, which has several advantages:

| Approach | Workspace path | Works remotely | Needs file access |
|----------|---------------|----------------|-------------------|
| Current (direct FS) | Hardcoded — **broken for `main`** | No | Yes |
| Via gateway RPC | Resolved correctly | Yes (gateway handles it) | No |

Using `agents.files.get` / `agents.files.set` via the gateway:
- Correctly resolves the workspace path for all agents
- Would work if the editor is deployed remotely (via the existing gateway auth)
- No need for the backend to have direct filesystem access

This is likely the intended integration path for tools that want to access agent files.

---

## Current Config (This Machine)

From `openclaw.json`:

```
Gateway:       localhost:18789, loopback only
Auth token:    96400eab5d22b6b8a48435419828e10930c34e61833f221c
Chat endpoint: enabled (/v1/chat/completions)
Active agents: main (workspace: ~/clawd)
Channels:      WhatsApp, Telegram, Slack (socket mode)
Default model: runpod-devstral / Devstral-Small-2-24B
Alt models:    claude-sonnet-4-6, claude-opus-4-6 (1M ctx), gpt-4o, gpt-4o-mini, o3-mini
```
