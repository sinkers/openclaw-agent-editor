#!/usr/bin/env bash
# OpenClaw Agent Editor — Remote Install Script
#
# Usage (one-liner from any machine):
#   curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/openclaw-agent-editor/main/install.sh | bash
#
# Or with options:
#   curl -fsSL .../install.sh | bash -s -- --port 3001 --cors-origins "http://my-laptop:5173"
#
# What this script does:
#   1. Checks prerequisites (Node ≥18, git)
#   2. Clones / pulls the repository into ~/openclaw-agent-editor
#   3. Installs dependencies and builds the backend
#   4. Creates a systemd (Linux) or launchd (macOS) service unit
#   5. Starts the service

set -euo pipefail

# ── Defaults ────────────────────────────────────────────────────────────────
INSTALL_DIR="${INSTALL_DIR:-$HOME/openclaw-agent-editor}"
PORT="${PORT:-3001}"
CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:5173}"
REPO_URL="${REPO_URL:-https://github.com/YOUR_ORG/openclaw-agent-editor.git}"
SERVICE_NAME="openclaw-agent-editor"

# ── Colour helpers ───────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}[install]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}   $*"; }
error() { echo -e "${RED}[error]${NC}  $*" >&2; exit 1; }

# ── Parse flags ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)           PORT="$2";         shift 2 ;;
    --cors-origins)   CORS_ORIGINS="$2"; shift 2 ;;
    --install-dir)    INSTALL_DIR="$2";  shift 2 ;;
    --repo)           REPO_URL="$2";     shift 2 ;;
    *) warn "Unknown flag: $1"; shift ;;
  esac
done

# ── Prerequisites ────────────────────────────────────────────────────────────
info "Checking prerequisites…"

if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Please install Node ≥18 first: https://nodejs.org"
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.version.slice(1).split('.')[0])")
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  error "Node.js ≥18 required (found $(node --version)). Please upgrade."
fi
info "Node.js $(node --version) — OK"

if ! command -v git &>/dev/null; then
  error "git is not installed. Please install git first."
fi
info "git $(git --version | awk '{print $3}') — OK"

if ! command -v npm &>/dev/null; then
  error "npm is not installed (should come with Node)."
fi

# ── Clone or update ──────────────────────────────────────────────────────────
if [[ -d "$INSTALL_DIR/.git" ]]; then
  info "Updating existing installation at $INSTALL_DIR…"
  git -C "$INSTALL_DIR" pull --ff-only
else
  info "Cloning into $INSTALL_DIR…"
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# ── Install & build ──────────────────────────────────────────────────────────
info "Installing dependencies…"
npm ci --workspace=backend --ignore-scripts

info "Building backend…"
npm run build:backend

# ── Detect platform & install service ────────────────────────────────────────
OS="$(uname -s)"

if [[ "$OS" == "Linux" ]] && command -v systemctl &>/dev/null; then
  install_systemd
elif [[ "$OS" == "Darwin" ]]; then
  install_launchd
else
  warn "Unsupported platform for auto-service install ($OS). Start manually:"
  warn "  PORT=$PORT CORS_ORIGINS='$CORS_ORIGINS' node $INSTALL_DIR/backend/dist/index.js"
  exit 0
fi

# ── Systemd installer ────────────────────────────────────────────────────────
install_systemd() {
  local UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
  info "Installing systemd unit to $UNIT_FILE…"

  sudo tee "$UNIT_FILE" > /dev/null <<EOF
[Unit]
Description=OpenClaw Agent Editor Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=$(command -v node) dist/index.js
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=CORS_ORIGINS=$CORS_ORIGINS
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable "$SERVICE_NAME"
  sudo systemctl restart "$SERVICE_NAME"
  info "Service started. Check: sudo systemctl status $SERVICE_NAME"
  info "Logs: journalctl -u $SERVICE_NAME -f"
}

# ── launchd installer (macOS) ─────────────────────────────────────────────────
install_launchd() {
  local PLIST_DIR="$HOME/Library/LaunchAgents"
  local PLIST_FILE="$PLIST_DIR/com.openclaw.agent-editor.plist"
  local LOG_DIR="$HOME/.openclaw/logs"
  mkdir -p "$PLIST_DIR" "$LOG_DIR"

  info "Installing launchd plist to $PLIST_FILE…"
  cat > "$PLIST_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>              <string>com.openclaw.agent-editor</string>
  <key>ProgramArguments</key>
  <array>
    <string>$(command -v node)</string>
    <string>$INSTALL_DIR/backend/dist/index.js</string>
  </array>
  <key>WorkingDirectory</key>   <string>$INSTALL_DIR/backend</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>NODE_ENV</key>         <string>production</string>
    <key>PORT</key>             <string>$PORT</string>
    <key>CORS_ORIGINS</key>     <string>$CORS_ORIGINS</string>
  </dict>
  <key>StandardOutPath</key>    <string>$LOG_DIR/editor.log</string>
  <key>StandardErrorPath</key>  <string>$LOG_DIR/editor-error.log</string>
  <key>RunAtLoad</key>          <true/>
  <key>KeepAlive</key>          <true/>
</dict>
</plist>
EOF

  launchctl unload "$PLIST_FILE" 2>/dev/null || true
  launchctl load "$PLIST_FILE"
  info "Service started."
  info "Logs: tail -f $LOG_DIR/editor.log"
}

info ""
info "✓ OpenClaw Agent Editor backend installed!"
info "  URL:  http://$(hostname):$PORT"
info "  CORS: $CORS_ORIGINS"
info ""
info "To connect from your browser:"
info "  1. Open the frontend (npm run dev:frontend)"
info "  2. Click ⚙ next to the instance selector"
info "  3. Add instance: http://$(hostname):$PORT"
