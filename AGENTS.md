# AGENTS_developer.md

**This file defines the mandatory workflow rules for all developer agents working across the ClawTalk codebase.**

All developer agents working in any ClawTalk repository MUST follow these rules without exception.

---

## Repository Assignments

Developer agents are assigned specific repositories. Do not work outside your assigned scope without explicit approval.

| Agent Scope | Repositories |
|-------------|--------------|
| Auth Agent | `auth-gateway` — Python/FastAPI, user auth, secrets, agent management, DynamoDB |
| Voice Agent | `voice-gateway` — Go/Gin, WebSocket hub, LiveKit rooms, Deepgram STT/TTS |
| OpenClaw Agent | `openclaw-agent` — Go/Gin, LLM bridge, one goroutine per agent, WebSocket to voice-gateway |
| E2E Agent | `e2e` — Python/pytest, Docker Compose integration tests |
| Architecture Agent | `architecture` — System design, documentation, cross-repo alignment |

### Agent Responsibilities

Each developer agent MUST:
- Write, test, and maintain code in assigned repositories
- Keep documentation up to date (README.md, API documentation)
- **Maintain the AGENTS.md file** in their assigned repository — update workflow rules, testing standards, architecture notes, and coding practices as the project evolves
- Follow the mandatory workflow without exception
- Enforce code quality and testing standards

### Cross-Repository Work Rules

**CRITICAL:** You MUST NOT make changes to any repository outside your assigned scope without explicit permission.

- Do NOT modify files in other repositories
- Do NOT commit changes to other repositories
- Do NOT create PRs in other repositories
- Do NOT run commands that modify files outside your working directory

**If you need changes in another repository:**
1. STOP immediately
2. Document what changes are needed and why
3. Contact your manager or the agent responsible for that repository
4. Wait for explicit approval before proceeding

**Exception:** Reading files from other repositories for context is permitted, but making any modifications is strictly prohibited.

**Rule:** Developer agents are assigned no more than 2 repos as standard, 3 at absolute maximum only if the third is small and infrequent. If asked to work in a repository not assigned to you, escalate to your manager before proceeding.

---

## Mandatory Workflow

You MUST follow this workflow for every task. No exceptions.

1. **Review the ticket** — If there are ANY questions, ask them on the ticket or to the requestor before starting. Do NOT start work with unresolved ambiguity. This is non-negotiable.

2. **Map out your approach** — Comment on the ticket or in the PR description with your implementation plan. This is not a blocking step but you MUST note your plan before proceeding.

3. **Work in feature branches** — You MUST work in small, focused chunks on a dedicated feature branch. You MUST NOT work directly on main. Push to GitHub and get a PR raised before the change gets too large.

4. **Write tests FIRST** — You MUST write and/or update unit tests for any code written. For new code, define what success looks like BEFORE implementing. This is test-driven development and it is mandatory.

5. **Implement and verify** — Implement the change and run tests to confirm completion. All tests MUST pass.

6. **Run ALL checks** — You MUST run all check commands from the Makefile before pushing. Must be green before pushing. No exceptions.

7. **Maintain coverage** — Test coverage MUST NOT decrease on any merge. This is a hard requirement.

8. **Push and create PR** — Push the branch and open a PR with proper formatting (see Branching & PRs section).

9. **Wait for code review** — PRs are reviewed by a different model. You MUST address ALL comments before merging — not just critical severity.

10. **Merge when green** — When CI is green and all comments are addressed, merge the PR using squash merge.

11. **Update documentation** — You MUST update README.md, AGENTS.md, and any other relevant docs as part of the PR if behavior changed.

---

## Branching & PRs — Hard Requirements

**NEVER commit directly to main/master** — This is absolute. Always use a feature branch.

### Branch Naming Convention
- Format: `feature/issue-{N}-{description}` or `fix/issue-{N}-{description}`
- Example: `feature/issue-42-add-websocket-auth`

### PR Requirements
- **One issue per PR** — Keep PRs focused. Do not bundle multiple issues.
- **Squash merge** — Use squash merge when merging PRs
- **Delete branch** — Delete the feature branch immediately after merge
- **PR title format:** `feat|fix|chore|docs(#N): Brief description`
  - Example: `feat(#12): add user login endpoint`
  - Example: `fix(#23): resolve WebSocket reconnection bug`
- **PR body MUST include:**
  - What changed (clear description)
  - How to test it (explicit steps)
  - `Closes #N` (to link the issue)

---

## Before Pushing — Required Checks

Run ALL of the following before pushing any branch. **No exceptions. No shortcuts.**

```bash
# Linting — MUST be clean
make lint

# Unit tests — MUST be 100% green
make test

# Full CI check (STRONGLY recommended)
make ci
```

### Hard Rules
- Tests MUST pass. If a test fails, fix the code — NEVER skip or comment out the test.
- If you break a test, that is a bug. Stop immediately and fix it before continuing.
- **Test coverage MUST NOT decrease.** This is tracked and enforced.

---

## Testing Standards — Non-Negotiable

### Test Requirements by Language/Repo

#### Python Repos (auth-gateway, e2e)
- MUST have linting tests (enforced via `make lint`)
- MUST have code coverage tests
- MUST have integration tests that run in stubbed mode
- MUST have integration tests with option to test against real endpoints
- Coverage MUST NOT decrease

#### Go Repos (voice-gateway, openclaw-agent)
- MUST have linting tests (enforced via `make lint`)
- MUST have code coverage tests
- MUST have integration tests that run in stubbed mode
- MUST have integration tests with option to test against real endpoints
- Coverage MUST NOT decrease

### General Testing Rules
- Write tests first where possible (TDD approach)
- Every bug fix MUST include a regression test that would have caught the bug
- Every new feature MUST have tests covering:
  - Happy path (primary use case)
  - Key edge cases (boundary conditions, error states)
- Do NOT write tests that pass without asserting meaningful behavior
- Test coverage MUST NOT decrease across the PR (checked automatically)

---

## Code Review — Mandatory Process

PRs are reviewed by a different model than the one that wrote the code:

| Author | Reviewer |
|--------|----------|
| Claude (any) | Gemini |
| Gemini | Claude |
| Codex / GPT | Claude or Gemini |

### Review Response Requirements
- You MUST address ALL review comments before merging
- This includes critical, medium, AND low severity comments
- You may decline a comment with a clear, documented reason
- You MUST NOT silently ignore any comment — every comment requires a response

---

## Codex Review — Required Before PR

You MUST run Codex review on your branch before opening a PR:

```bash
codex "Review the changes I've made in this branch for bugs, edge cases, security issues, and code quality."
```

This is NOT optional. If Codex flags something you disagree with, document your reasoning in the PR body.

---

## Architecture Context — ClawTalk System

All agents MUST understand the ClawTalk system architecture:

```
Flutter App
    │
    ▼ REST (Bearer {api_key})
auth-gateway :8789 (Python/FastAPI + DynamoDB)
    │ POST /calls → voice-gateway
    │ POST /users/{email}/agents → (should forward) → openclaw-agent
    ▼
voice-gateway :8080 (Go/Gin)
    │ WebSocket /ws ← openclaw-agent connects here per agent
    │ LiveKit rooms, Deepgram STT/TTS
    ▼
openclaw-agent :10789 (Go/Gin)
    │ HTTP → OpenClaw LLM (/v1/chat/completions)
    │ WebSocket → voice-gateway (one goroutine + socket per agent)
    ▼
OpenClaw Gateway :18789 (external LLM runtime)
```

### Critical Architecture Facts
- Agent authenticates with hub via device auth flow on startup
- Hub issues JWT; agent uses it to pull config (LiveKit/Deepgram/OpenAI keys) and register
- Hub dispatches agent to LiveKit rooms when callers connect via `/connect`
- `session.start()` handles LiveKit connection internally — do NOT add `ctx.connect()` before it
- Agent token + ID persisted in `.hub-token-*` and `.hub-agent-id-*` files

### Known Lesson from PoC
- The hub migration introduced explicit agent dispatch (`/connect` now calls LiveKit API to dispatch)
- Adding `ctx.connect()` before `session.start()` interferes with audio track subscription in livekit-agents 1.x
- **Lesson:** Changing agent startup code requires a full end-to-end test BEFORE merging

---

## Cross-Service Standards

### Agent ID Convention
- auth-gateway generates `uuid4` as canonical `agent_id`
- openclaw-agent generates its own UUIDs independently — **not currently aligned** (TODO 6.1)
- voice-gateway has no agent ID concept currently

### Port Standards (Target)
| Service | Port |
|---------|------|
| DynamoDB | 8000 |
| auth-gateway | 8001 |
| voice-gateway | 8002 |
| openclaw-agent | 8003 |
| LiveKit | 7880 |

### Docker Naming Standards (Target)
- Images: `clawtalk-<service>:latest`
- Containers: `clawtalk-<service>`
- Network: `clawtalk`

### Makefile Target Standards (Target)
All repos MUST support: `build`, `run`, `test`, `test-integration`, `lint`, `ci`, `docker-build`, `docker-up`, `docker-down`, `docker-logs`, `clean`, `clean-all`, `help`

---

## Background Tasks — Mandatory Tracking

Any time you start a background task (deploy, test run, agent spawn), you MUST:
1. Immediately schedule a follow-up reminder
2. Report back when done
3. Do NOT leave tasks hanging if the session ends

This prevents work from being lost or forgotten.

---

## Pre-commit Checklist

Before EVERY commit, verify:

- [ ] All tests pass (`make test`) — 100% green
- [ ] No linting errors (`make lint`) — Must be clean
- [ ] No debug print statements or console.logs in committed code
- [ ] No hardcoded secrets or credentials anywhere
- [ ] Commit message follows convention (`feat:`, `fix:`, `chore:`, `docs:`)
- [ ] Codex review run and all issues addressed or documented
- [ ] README and docs updated if behavior changed
- [ ] Test coverage has not decreased

---

## Escalation — When to Stop

If you are stuck on the same problem for more than one iteration, STOP.

Do NOT continue looping. Contact your manager immediately. Your manager will either:
- Unblock you with additional context
- Re-scope the task to something achievable
- Bring in outside help or expertise

Spinning on the same issue is not productive and wastes time.

---

## Language and Tone Requirements

When writing:
- Use IMPERATIVE language for commands: "Run the tests", "Fix the bug", "Update the docs"
- Use ACTIVE voice: "The service connects to LiveKit" not "LiveKit is connected to by the service"
- Use FIRM, DIRECTIVE wording: "You MUST", "Do NOT", "This is required"
- Avoid SOFT language: "you might want to", "consider", "it would be good if"
- Be CONCISE: No unnecessary words or filler
- Be PRECISE: Exact commands, exact file paths, exact line numbers

---

## Security Requirements — Non-Negotiable

- Do NOT introduce OWASP Top 10 vulnerabilities (XSS, SQL injection, command injection, etc.)
- Do NOT commit secrets, API keys, passwords, or credentials to the repository
- Do NOT disable security features without explicit approval and documentation
- If you notice insecure code you wrote, fix it IMMEDIATELY before proceeding
- All user input MUST be validated at system boundaries
- All external API calls MUST have proper error handling

---

## Deployment Context

Current deployment state (as of 2026-03-26):
- **auth-gateway**: AWS Lambda + API Gateway — no VPC, cannot communicate privately (TODO 0.2)
- **voice-gateway**: ECS Fargate, VPC `10.10.0.0/16` (dev) / `10.20.0.0/16` (prod), ALB
- **openclaw-agent**: ECS Fargate, VPC `10.30.0.0/16`, EC2 NAT instance, no inbound
- All services in `ap-southeast-2`, `AWS_PROFILE=personal`
- Services currently communicate via public URLs only (private networking TODO 0.1)

---

## Priority Context

Refer to `architecture/TODO.md` for current priorities. As of 2026-03-26:

| Priority | Focus Areas |
|----------|-------------|
| **TOP** | 0.1-0.6: Shared VPC, auth-gateway ECS migration, Makefile ENV pattern, SSM standardization, Terraform structure, ARM64 |
| P0 | 2.0-2.4: OpenClaw stubs, agent registration chain; 6.1: Agent ID consistency |
| P1 | 4.1-4.2: Flutter agent list, TTS greeting; 5.3: e2e assertions |
| P2 | 1.1, 4.3-4.4, 5.1-5.2, 7.1/7.2/7.5/7.7: Various standardization and testing gaps |
| P3 | 3.1-3.2, 5.4, 6.2, 7.3/7.4/7.6: Lower priority improvements |

---

## References

- See `architecture/CLAUDE.md` → `architecture/AGENTS.md` for solution architect context
- See repo-specific `AGENTS.md` for additional repo-specific rules
- See `architecture/TODO.md` for gap analysis and priorities
- See `architecture/sequence-diagrams/` for system flow diagrams
- **OpenClaw source:** https://github.com/openclaw/openclaw — also available locally at `../openclaw`. Check here first when researching gateway protocol, skill/plugin internals, RPC method signatures, or any openclaw behaviour not documented in `docs/`.

---

**Last Updated:** 2026-03-28
**Applies To:** All ClawTalk repositories
**Authority:** Mandatory for all developer agents
