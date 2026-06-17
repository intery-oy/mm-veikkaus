#!/bin/bash
# Paikallinen tuloshaku — luotettavampi kuin GitHub Actions cron.
# Aja Mac-crontabista: */5 * * 6,7 * /Users/harrikiviniemi/projects/mm-veikkaus/scripts/sync-local.sh
# Vaatii: FOOTBALL_DATA_TOKEN tiedostossa ~/.mm-veikkaus-token

set -euo pipefail

# Cron ajaa minimaalisella PATHilla (/usr/bin:/bin) — npm/node ei löydy ilman tätä.
export PATH="/opt/homebrew/bin:$PATH"

REPO="/Users/harrikiviniemi/projects/mm-veikkaus"
TOKEN_FILE="$HOME/.mm-veikkaus-token"
LOG="$HOME/.openclaw/logs/mm-veikkaus-sync.log"

mkdir -p "$(dirname "$LOG")"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

if [[ ! -f "$TOKEN_FILE" ]]; then
  log "VIRHE: Token-tiedosto puuttuu: $TOKEN_FILE"
  exit 1
fi

FOOTBALL_DATA_TOKEN="$(cat "$TOKEN_FILE")"
export FOOTBALL_DATA_TOKEN

cd "$REPO"

# Hae tulokset
if ! output=$(npm run sync:results 2>&1); then
  log "VIRHE: sync:results epäonnistui: $output"
  exit 1
fi

log "$output"

# Commitoi ja pushaa jos muuttui
if [[ -n "$(git status --porcelain src/data/auto-results.generated.json)" ]]; then
  git add src/data/auto-results.generated.json
  git commit -m "Auto: päivitä tulokset (paikallinen cron)"
  git push origin main
  log "Pushattu."
else
  log "Ei muutoksia."
fi
