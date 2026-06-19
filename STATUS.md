# MM-veikkaus — tilannekatsaus

> Päivitetty 19.6.2026. Pikakatsaus: mikä on valmista, mikä on tietoisesti
> kesken, ja mistä jatkaa. Tekninen kuvaus on [README.md](./README.md):ssä.

## 🔗 Tärkeät linkit

| Mikä | Missä |
|---|---|
| Live-sivu (jaa tämä perheelle) | https://mm-veikkaus-six.vercel.app |
| GitHub-repo | https://github.com/intery-oy/mm-veikkaus |
| GitHub Actions (tuloshaku) | repo → **Actions** → "Sync results" |
| Vercel-hallinta | https://vercel.com/intery-oys-projects/mm-veikkaus |
| Tulosrajapinta | https://www.football-data.org (kilpailu `WC`) |

## ✅ Valmista ja tuotannossa

- **Pisteytysmoottori** — puhdas, testattu funktio (`src/domain/`). 63 testiä vihreänä.
- **Read-only-portaali** — tulostaulukko + pelaajakortit + selostaja + tulosfiidi.
- **Bright & playful -teema** — vaalea kaikilla laitteilla, lippuemojit, avatarit.
- **Seed-data** — 48 joukkuetta, 72 lohko-ottelua, 12 perheenjäsentä valintoineen.
- **Auto-deploy** — `git push main` → Vercel deplottaa itse.
- **Automaattinen tuloshaku (malli A)** — Mac-cron hakee football-data.orgista
  10 min välein (kesä/heinäkuu), kirjoittaa tulokset, commitoi, pushaa → Vercel
  deploy. GitHub Action on manuaalinen varalähde.
- **Alustava/LIVE-merkintä** — kesken olevat ottelut näkyvät 🔴, merkki katoaa kun peli päättyy.

## 🟡 Tietoisesti kesken (odottaa tapahtumaa)

- **Pudotuspelit (R32→finaali, 32 ottelua)** — runko valmiina (`KNOCKOUT_MATCHES`
  `src/data/results.ts`:ssä, tyhjä). Lisätään kun lohkovaihe ratkeaa (~27.6.2026)
  ja parit ovat tiedossa. Automaatti hakee myös nämä kun ne ovat olemassa.
- **Mitalit & palkinnot** (mestari/hopea/pronssi/paras pelaaja/maalikuningas) —
  `outcome` `src/data/results.ts`:ssä on toistaiseksi kaikki `null` → bonukset
  näkyvät korteissa "kesken". Täytetään kisojen lopussa (FIFA-koodit / pelaaja-id:t).

## 💡 Jatkokehitysideoita (ei aloitettu)

- **AI-selostaja** — nykyinen selostaja on sääntöpohjainen (`src/app/commentary.ts`).
  Voisi korvata/täydentää Claude-API:lla räväkämmillä repliikeillä (vaatii API-avaimen
  + pienen serverless-funktion; ei enää täysin staattinen).
- **Admin-näkymä + realtime (malli C, Supabase)** — jos joskus halutaan tulosten
  selainsyöttö ja välitön päivitys ilman buildia. Iso remontti; nyt ei tarpeen.
- **Maalikuninkaan live-seuranta** — vaatii pelaajakohtaista maalidataa (enemmän
  kuin ottelutulos). Nyt maalikuningas asetetaan käsin `outcome`:en.
- **Pudotuspelinäkymä / bracket-visualisointi**.

## 🛠️ Mistä mikäkin löytyy (jatkokehitystä varten)

```
src/domain/        # ÄLÄ riko: puhdas pisteytysydin + testit (kontrahti)
  types.ts         # domain-tyypit
  scoring.ts       # computeStandings()
  scoring.test.ts  # invariantit + esimerkit
src/data/          # totuuslähde
  teams.ts         # 48 joukkuetta (FIFA-koodi + suomi)
  players.ts       # pelaajaehdokkaat + nimivariantit
  picks.ts         # 12 perheenjäsenen veikkaukset
  results.ts       # lohkot, otteluohjelma, RESULTS-yhdistely, KNOCKOUT, outcome
  auto-results.generated.json  # AUTOMAATIN kirjoittama (älä muokkaa käsin)
src/app/           # React-näkymät (read-only)
  viewmodel.ts     # yhdistää datan moottorin läpi UI-muotoon
  App / StandingsTable / BettorCards / Confetti / commentary / flags
scripts/
  sync-results.ts  # football-data.org -> auto-results.generated.json
  sync-local.sh    # Mac-cron: fetch -> commit -> push
  watchdog.sh      # riippumaton vahti: push, cron, live hash, token expiry
.github/workflows/
  sync-results.yml # manuaalinen varalähde (Run workflow), ei ajastusta
```

## 📋 Operatiivinen muistilista

- **Tulos käsin (korjaus tai jos API jäljessä):** lisää rivi `OVERRIDES`-objektiin
  `src/data/results.ts`:ssä → `git commit` → `git push`. Käsin voittaa automaatin.
- **Tuloshaku heti paikallisesti:** `cd ~/projects/mm-veikkaus && FOOTBALL_DATA_TOKEN=$(cat ~/.mm-veikkaus-token) npm run sync:results`
- **Tuloshaku heti varalähteestä:** GitHub → Actions → "Sync results" → **Run workflow**.
- **Tarkista, ettei rikkoudu:** `npm test` (oltava vihreä) ja `npm run build`.
- **API-avain:** Macilla `~/.mm-veikkaus-token`; GitHub Action -varalähteessä myös
  GitHub Secret `FOOTBALL_DATA_TOKEN`.
- **GitHub-push-token:** Macilla `~/.mm-veikkaus-gh-token`; watchdog varoittaa
  vanhenemisesta.
- **Deploy:** automaattinen pushista. Käsin tarvittaessa: `npx vercel --prod`.

## ⚠️ Periaatteet (säilytä nämä)

1. **`src/domain` on koskematon kontrahti** — muutokset vain testit päivittäen.
2. **Ei salaisuuksia repoon** — API-avain GitHub Secretsissä.
3. **`npm test` vihreänä** ennen pushia.
4. **Älä arvaa tuloksia** — käytä luotettavaa lähdettä (football-data.org / livescore.com).
