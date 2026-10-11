#!/usr/bin/env bash
set -Eeuo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

red='\033[0;31m'; green='\033[0;32m'; muted='\033[0;90m'; reset='\033[0m'
info() { printf '%b\n' "${red}◆${reset} $*"; }
fail() { printf '%b\n' "${red}✖${reset} $*" >&2; exit 1; }

printf '\n'
printf '%b\n' "${red}  ┌─────────────────────────────────────────────┐${reset}"
printf '%b\n' "${red}  │       A R C H N E M E S I S  /  W E B      │${reset}"
printf '%b\n' "${red}  └─────────────────────────────────────────────┘${reset}"
printf '\n'

command -v node >/dev/null 2>&1 || fail 'Node.js is missing. Install Node.js >= 22.13.0.'
command -v npm >/dev/null 2>&1 || fail 'npm is missing. Install npm first.'
node -e 'const [a,b,c]=process.versions.node.split(".").map(Number); if(a<22 || (a===22 && (b<13 || (b===13 && c<0)))) process.exit(1)' \
  || fail "Node.js >= 22.13.0 required; found $(node -v)"
info "Node $(node -v) / npm $(npm -v)"

# Keep user-provided configuration untouched. Never overwrite existing .env.local.
if [[ ! -e .env.local ]]; then
  remote=''
  if command -v git >/dev/null 2>&1 && git -C .. rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    remote="$(git -C .. remote get-url origin 2>/dev/null || true)"
  fi
  case "$remote" in
    git@github.com:*) remote="https://github.com/${remote#git@github.com:}" ;;
    ssh://git@github.com/*) remote="https://github.com/${remote#ssh://git@github.com/}" ;;
  esac
  if [[ "$remote" == https://github.com/* ]]; then
    remote="${remote%.git}"
    printf 'VITE_GITHUB_URL=%s\n' "$remote" > .env.local
    info "Linked GitHub origin: $remote"
  else
    info 'No GitHub origin detected; GitHub links can be configured in .env.local.'
  fi
fi

info 'Installing site dependencies...'
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

info 'Syncing command catalog from ../docs/COMMANDS.md (when present)...'
npm run sync:commands

info 'Checking and building production site...'
npm run build

printf '\n%b\n' "${green}✓ Website is ready!${reset}"
printf '%b\n' "${muted}Press Ctrl+C to stop the development server.${reset}"
printf '\n'

# Forward arguments to Vite, e.g. ./setup.sh --host 0.0.0.0
exec npm run dev -- "$@"
