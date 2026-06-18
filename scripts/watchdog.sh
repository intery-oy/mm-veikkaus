#!/bin/bash
# Riippumaton vahti mm-veikkauksen tuloshaulle.
# Nappaa HILJAISET virheet, jotka sync-local.sh ei itse ehdi raportoida:
#   1. Pushaamattomat commitit (tulokset jumissa lokaalisti — juuri tämä kaatui 18.6.).
#   2. Cron ei aja lainkaan (sync-loki ei ole päivittynyt).
# Hälyttää Telegramiin, mutta debounce: sama ongelma korkeintaan kerran / 3 h.
#
# Aja Mac-crontabista (esim. */30 kisakuukausina):
#   */30 * * 6,7 * /Users/harrikiviniemi/projects/mm-veikkaus/scripts/watchdog.sh

set -uo pipefail
export PATH="/opt/homebrew/bin:$PATH"

REPO="/Users/harrikiviniemi/projects/mm-veikkaus"
GH_TOKEN_FILE="$HOME/.mm-veikkaus-gh-token"
SYNC_LOG="$HOME/.openclaw/logs/mm-veikkaus-sync.log"
WLOG="$HOME/.openclaw/logs/mm-veikkaus-watchdog.log"
STATE_DIR="$HOME/.openclaw/state"
mkdir -p "$STATE_DIR" "$(dirname "$WLOG")"

DEBOUNCE_SECS=10800   # 3 h — älä toista samaa hälytystä tiuhemmin
STALE_SECS=2700       # 45 min — jos sync-loki vanhempi, cron ei aja

wlog() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$WLOG"; }

# Hälytä korkeintaan kerran / DEBOUNCE_SECS per ongelmatyyppi ($1 = avain).
alert() {
  local key="$1"; shift
  local msg="$*"
  local stamp="$STATE_DIR/wd-$key.alerted"
  local now last
  now="$(date +%s)"
  if [[ -f "$stamp" ]]; then
    last="$(cat "$stamp" 2>/dev/null || echo 0)"
    if (( now - last < DEBOUNCE_SECS )); then
      wlog "Ongelma '$key' yhä päällä (debounce) — ei toisteta."
      return
    fi
  fi
  echo "$now" > "$stamp"
  wlog "HÄLYTYS [$key]: $msg"
  openclaw message send --channel telegram --target 8785835313 \
    --message "🔴 mm-veikkaus vahti: $msg" >/dev/null 2>&1 \
    || wlog "VIRHE: hälytyksen lähetys epäonnistui."
}

# Tyhjennä hälytysmuisti kun ongelma on poissa (jotta seuraava kerta hälyttää heti).
clear_alert() { rm -f "$STATE_DIR/wd-$1.alerted" 2>/dev/null; }

cd "$REPO" || { wlog "VIRHE: repo puuttuu: $REPO"; exit 1; }

problems=0

# --- 1. Pushaamattomat commitit ----------------------------------------------
if [[ -f "$GH_TOKEN_FILE" ]]; then
  git -c credential.helper= \
      -c credential.helper='!f() { echo username=x-access-token; echo "password=$(cat '"$GH_TOKEN_FILE"')"; }; f' \
      fetch origin main -q 2>>"$WLOG" || wlog "VAROITUS: git fetch epäonnistui."
fi
ahead="$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l | tr -d ' ')"
if [[ "${ahead:-0}" -gt 0 ]]; then
  alert "unpushed" "$ahead committia pushaamatta — tulokset eivät päivity sivulle. Aja: cd $REPO && git push origin main"
  problems=1
else
  clear_alert "unpushed"
fi

# --- 2. Cron ei aja (sync-loki vanhentunut) ----------------------------------
if [[ -f "$SYNC_LOG" ]]; then
  now="$(date +%s)"
  mtime="$(stat -f %m "$SYNC_LOG" 2>/dev/null || echo "$now")"
  age=$(( now - mtime ))
  if (( age > STALE_SECS )); then
    alert "stale" "sync-loki ei ole päivittynyt $(( age / 60 )) min — tuloshaku ei ehkä aja. Tarkista crontab."
    problems=1
  else
    clear_alert "stale"
  fi
else
  alert "nolog" "sync-loki puuttuu kokonaan ($SYNC_LOG) — tuloshakua ei ole ajettu."
  problems=1
fi

# --- 3. Live-sivu vastaa uusinta dataa (END-TO-END, tärkein) ------------------
# Push voi onnistua mutta Vercel-build kaatua -> git näyttää vihreää, sivu vanha.
# Verrataan elävän sivun /version.json:ia siihen mitä origin/main:in pitäisi tarjota.
# Hälytetään vain jos viimeisin commit on >10 min vanha (deploy ehtinyt valmistua).
LIVE_URL="https://mm-veikkaus-six.vercel.app/version.json"
expected="$(git show origin/main:public/version.json 2>/dev/null | sed -n 's/.*"resultsHash":"\([a-f0-9]*\)".*/\1/p')"
if [[ -n "$expected" ]]; then
  live="$(curl -s --max-time 20 "$LIVE_URL" | sed -n 's/.*"resultsHash":"\([a-f0-9]*\)".*/\1/p')"
  head_age=$(( $(date +%s) - $(git show -s --format=%ct origin/main 2>/dev/null || date +%s) ))
  if [[ "$live" != "$expected" && $head_age -gt 600 ]]; then
    livedesc="${live:0:8}"; [[ -z "$live" ]] && livedesc="(ei vastausta)"
    alert "live" "Live-sivu ei vastaa uusinta dataa — Vercel-deploy todennäköisesti epäonnistui. live=$livedesc odotettu=${expected:0:8}. Tarkista Vercel."
    problems=1
  else
    clear_alert "live"
  fi
else
  wlog "VAROITUS: origin/main:public/version.json puuttuu — live-tarkistus ohitettu (bootstrap kesken)."
fi

# --- 4. GitHub-tokenin vanheneminen ------------------------------------------
# Fine-grained PAT vanhenee jonakin päivänä -> push lakkaa toimimasta. Varoita
# 7 vrk ennen, jotta ehtii uusia. GitHub palauttaa vanhenemispäivän headerina.
if [[ -f "$GH_TOKEN_FILE" ]]; then
  tok="$(cat "$GH_TOKEN_FILE")"
  exp="$(curl -s -I -H "Authorization: Bearer $tok" https://api.github.com/user 2>/dev/null \
         | sed -n 's/[Gg]it[Hh]ub-[Aa]uthentication-[Tt]oken-[Ee]xpiration: //Ip' | tr -d '\r')"
  if [[ -n "$exp" ]]; then
    exp_epoch="$(date -j -f "%Y-%m-%d %H:%M:%S %Z" "$exp" +%s 2>/dev/null || echo 0)"
    if [[ "$exp_epoch" -gt 0 ]]; then
      days_left=$(( (exp_epoch - $(date +%s)) / 86400 ))
      if (( days_left < 7 )); then
        alert "tokenexp" "GitHub-token vanhenee ${days_left} vrk päästä ($exp) — uusi PAT ja: gh:n sijaan luo uusi fine-grained token (Contents: write), tallenna $GH_TOKEN_FILE."
        problems=1
      else
        clear_alert "tokenexp"
      fi
    fi
  fi
fi

(( problems == 0 )) && wlog "OK (ahead=${ahead:-0}, live=match, token ok)."
exit 0
