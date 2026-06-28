#!/bin/bash
# Paikallinen tuloshaku — luotettavampi kuin GitHub Actions cron.
# Aja Mac-crontabista: */10 * * 6,7 * /Users/harrikiviniemi/projects/mm-veikkaus/scripts/sync-local.sh
# Vaatii: FOOTBALL_DATA_TOKEN tiedostossa ~/.mm-veikkaus-token
#         GitHub-token tiedostossa ~/.mm-veikkaus-gh-token (push cronista)

set -euo pipefail

# Cron ajaa minimaalisella PATHilla (/usr/bin:/bin) — npm/node ei löydy ilman tätä.
export PATH="/opt/homebrew/bin:$PATH"

REPO="/Users/harrikiviniemi/projects/mm-veikkaus"
TOKEN_FILE="$HOME/.mm-veikkaus-token"
GH_TOKEN_FILE="$HOME/.mm-veikkaus-gh-token"
LOG="$HOME/.openclaw/logs/mm-veikkaus-sync.log"
STATE_DIR="$HOME/.openclaw/state"
FAIL_STATE="$STATE_DIR/mm-veikkaus-sync.failures"
RECOVERY_STATE="$STATE_DIR/mm-veikkaus-sync.recovery-pending"
FAIL_ALERT_THRESHOLD=3
FAIL_ALERT_REPEAT=6

mkdir -p "$(dirname "$LOG")" "$STATE_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

# Hälytä Telegramiin aidoista hiljaisista virheistä. Yksittäiset API-katkot
# saavat mennä lokiin, mutta peräkkäisistä epäonnistumisista nostetaan häly.
# openclaw-CLI hoitaa reitityksen.
alert() {
  log "HÄLYTYS: $*"
  openclaw message send --channel telegram --target 8785835313 \
    --message "🔴 mm-veikkaus: $*" >/dev/null 2>&1 || log "VIRHE: hälytyksen lähetys epäonnistui."
}

notify_recovered() {
  log "PALAUTUI: $*"
  openclaw message send --channel telegram --target 8785835313 \
    --message "🟢 mm-veikkaus: $*" >/dev/null 2>&1 || log "VIRHE: palautumisviestin lähetys epäonnistui."
}

if [[ ! -f "$TOKEN_FILE" ]]; then
  log "VIRHE: Token-tiedosto puuttuu: $TOKEN_FILE"
  exit 1
fi

FOOTBALL_DATA_TOKEN="$(cat "$TOKEN_FILE")"
export FOOTBALL_DATA_TOKEN

cd "$REPO"

# Hae tulokset. Yksittäinen API-katko (esim. ECONNRESET) ei hälytä, mutta
# peräkkäiset epäonnistumiset eivät saa jäädä hiljaisiksi.
if ! output=$(npm run sync:results 2>&1); then
  log "VIRHE: sync:results epäonnistui: $output"
  failures=1
  if [[ -f "$FAIL_STATE" ]]; then
    prev="$(cat "$FAIL_STATE" 2>/dev/null || echo 0)"
    [[ "$prev" =~ ^[0-9]+$ ]] && failures=$((prev + 1))
  fi
  echo "$failures" > "$FAIL_STATE"
  if (( failures == FAIL_ALERT_THRESHOLD || (failures > FAIL_ALERT_THRESHOLD && failures % FAIL_ALERT_REPEAT == 0) )); then
    alert "sync:results epäonnistunut $failures kertaa peräkkäin — tuloshaku/API ei ehkä palaudu itsestään. Viimeisin virhe: $(echo "$output" | tail -20)"
    echo "$(date '+%Y-%m-%d %H:%M:%S') failures=$failures" > "$RECOVERY_STATE"
  fi
  exit 1
fi

log "$output"

if ! freshness_output=$(npm run check:freshness 2>&1); then
  log "VIRHE: semantic freshness epäonnistui: $freshness_output"
  alert "semantic freshness failed — a started picked-team fixture is missing from the generated feed. $(echo "$freshness_output" | tail -5)"
  exit 1
fi
log "$freshness_output"

if [[ -f "$RECOVERY_STATE" ]]; then
  notify_recovered "tuloshaku/API-yhteys palautui. Viimeisin ajo onnistui: $(echo "$output" | tail -1)"
fi
rm -f "$FAIL_STATE"
rm -f "$RECOVERY_STATE"

# Commitoi ja pushaa jos muuttui.
# HUOM: cronilla ei pääsyä macOS-avainnippuun (osxkeychain) -> HTTPS-push
# epäonnistuisi "could not read Username". Siksi push autentikoidaan
# tiedostoon tallennetulla GitHub-tokenilla (ei avainnippua, ei TTY:tä).
# Pushataan myös kun ollaan origin/main:ia edellä (aiemmin kasaantuneet commitit).
need_push=false
if [[ -n "$(git status --porcelain src/data/auto-results.generated.json)" ]]; then
  # Julkaise versiotunniste (tulosten sha256) -> public/version.json -> live-sivu
  # tarjoaa sen osoitteessa /version.json. Vahti vertaa elävän sivun tunnistetta
  # odotettuun = aito end-to-end-tarkistus (todistaa että deploy meni perille).
  rhash="$(shasum -a 256 src/data/auto-results.generated.json | cut -d' ' -f1)"
  printf '{"resultsHash":"%s","generatedAt":"%s"}\n' \
    "$rhash" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > public/version.json
  git add src/data/auto-results.generated.json public/version.json
  git commit -m "Auto: päivitä tulokset (paikallinen cron)"
  need_push=true
fi
if [[ -n "$(git log origin/main..HEAD --oneline 2>/dev/null)" ]]; then
  need_push=true
fi

if [[ "$need_push" == true ]]; then
  if [[ ! -f "$GH_TOKEN_FILE" ]]; then
    alert "GitHub-token puuttuu ($GH_TOKEN_FILE) — tulokset eivät päivity sivulle. Korjaa: gh auth token > $GH_TOKEN_FILE"
    exit 1
  fi
  if git -c credential.helper= \
       -c credential.helper='!f() { echo username=x-access-token; echo "password=$(cat '"$GH_TOKEN_FILE"')"; }; f' \
       push origin main 2>>"$LOG"; then
    log "Pushattu."
  else
    ahead="$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')"
    alert "git push epäonnistui — $ahead committia jumissa, tulokset eivät päivity sivulle. Tarkista GitHub-token."
    exit 1
  fi
else
  log "Ei muutoksia."
fi
