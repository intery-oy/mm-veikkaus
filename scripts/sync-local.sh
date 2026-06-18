#!/bin/bash
# Paikallinen tuloshaku — luotettavampi kuin GitHub Actions cron.
# Aja Mac-crontabista: */5 * * 6,7 * /Users/harrikiviniemi/projects/mm-veikkaus/scripts/sync-local.sh
# Vaatii: FOOTBALL_DATA_TOKEN tiedostossa ~/.mm-veikkaus-token

set -euo pipefail

# Cron ajaa minimaalisella PATHilla (/usr/bin:/bin) — npm/node ei löydy ilman tätä.
export PATH="/opt/homebrew/bin:$PATH"

REPO="/Users/harrikiviniemi/projects/mm-veikkaus"
TOKEN_FILE="$HOME/.mm-veikkaus-token"
GH_TOKEN_FILE="$HOME/.mm-veikkaus-gh-token"
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

# Commitoi ja pushaa jos muuttui.
# HUOM: cronilla ei pääsyä macOS-avainnippuun (osxkeychain) -> HTTPS-push
# epäonnistuisi "could not read Username". Siksi push autentikoidaan
# tiedostoon tallennetulla GitHub-tokenilla (ei avainnippua, ei TTY:tä).
# Pushataan myös kun ollaan origin/main:ia edellä (aiemmin kasaantuneet commitit).
need_push=false
if [[ -n "$(git status --porcelain src/data/auto-results.generated.json)" ]]; then
  git add src/data/auto-results.generated.json
  git commit -m "Auto: päivitä tulokset (paikallinen cron)"
  need_push=true
fi
if [[ -n "$(git log origin/main..HEAD --oneline 2>/dev/null)" ]]; then
  need_push=true
fi

if [[ "$need_push" == true ]]; then
  if [[ ! -f "$GH_TOKEN_FILE" ]]; then
    log "VIRHE: GitHub-token puuttuu: $GH_TOKEN_FILE — push ohitettu."
    exit 1
  fi
  if git -c credential.helper= \
       -c credential.helper='!f() { echo username=x-access-token; echo "password=$(cat '"$GH_TOKEN_FILE"')"; }; f' \
       push origin main 2>>"$LOG"; then
    log "Pushattu."
  else
    log "VIRHE: git push epäonnistui."
    exit 1
  fi
else
  log "Ei muutoksia."
fi
