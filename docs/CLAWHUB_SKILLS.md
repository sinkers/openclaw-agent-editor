# ClawhHub Skills

Research notes on the ClawhHub skills registry and local skill installation.

---

## ClawhHub Registry Status

**URL:** https://clawhub.ai
**Status:** Early-stage / currently empty

As of research date the public catalog shows:
- "No highlighted skills yet"
- "No skills yet. Be the first."

There are zero published skills in the public registry.

**Installation method** (from the UI):
```bash
npx clawhub@latest install <skill-name>
```

Skills install via npm and are managed by OpenClaw's skill system.

---

## Skill Format

A `.skill` file is a ZIP archive. Contents:

```
{skill-name}.skill (ZIP)
├── SKILL.md                         — skill manifest and instructions
├── references/                      — optional reference docs
│   └── *.md
└── scripts/                         — optional executable scripts
    └── *.py / *.sh / etc.
```

Installed skills appear in the gateway UI under one of four source categories:
- `openclaw-workspace` — workspace-local skills (in `{workspace}/skills/`)
- `openclaw-bundled` — built-in skills shipped with openclaw
- `openclaw-managed` — installed from clawhub/npm
- `openclaw-extra` — extra skills

---

## Locally Installed Skills (`~/clawd/skills/`)

One skill is currently installed:

### `whatsminer-monitor`

- **Type:** Custom/private (not from public catalog)
- **Purpose:** Monitors Whatsminer ASIC miners; scans the local network for miners,
  reports their status, and delivers reports via Microsoft Teams webhooks.
- **Contents:**
  - `SKILL.md` — instructions for the agent on how to use the skill
  - `references/teams-webhook-setup.md` — setup guide for the Teams webhook
  - `scripts/scan_and_report.py` — Python script that performs the scan

---

## Skills RPC (via Gateway)

Skills can be managed programmatically via the gateway WebSocket RPC:

```
skills.status   — get installed skills and their state
skills.install  — install a skill by ID
skills.update   — update an installed skill
```

---

## OpenClaw Self-Maintenance

There are **no public skills** for maintaining openclaw itself. Self-maintenance is handled
by built-in gateway capabilities:

| Task | Method |
|------|--------|
| Self-update | `update.run {sessionKey}` (gateway WS RPC) |
| Config edit | `config.apply {raw, baseHash}` (gateway WS RPC) |
| Restart | `commands.restart: true` in config — `!restart` native command |
| Session management | `sessions.*` RPC methods |
