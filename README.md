# MM-veikkaus 2026

Perheen MM-kisaveikkauksen read-only-portaali. Pisteet lasketaan
deterministisellä pisteytysmoottorilla committoidusta datasta — ei
tietokantaa, ei taustapalvelua, ei per-selain-tilaa.

## Arkkitehtuuri

```
src/
  domain/         # MUUTTUMATON ydin — älä koske ilman testien päivitystä
    types.ts      # domain-tyypit
    scoring.ts    # computeStandings(input) -> BettorStanding[]
    scoring.test.ts
  data/           # totuuslähde (committoitu)
    teams.ts      # joukkueet (FIFA-koodi + suomenkielinen nimi)
    players.ts    # paras pelaaja / maalikuningas -ehdokkaat + nimivariantit
    picks.ts      # 12 perheenjäsenen veikkaukset
    results.ts    # OTTELUTULOKSET — tätä päivität kisojen edetessä
  app/            # React-näkymät (read-only)
    viewmodel.ts  # yhdistää datan moottorin läpi UI-muotoon
    App.tsx, StandingsTable.tsx, BettorCards.tsx
```

Pisteytysmoottori on puhdas funktio ilman infrariippuvuuksia. Sama input →
sama output. Testit (`npm test`) ovat suoritettava spesifikaatio.

## Paikallinen kehitys

```bash
npm install
npm run dev        # http://localhost:5173 — tulostaulukko + veikkaajakortit
npm test           # pisteytys + view-model -testit (oltava vihreä)
npm run build      # tsc --noEmit && vite build -> dist/
```

## Miten lisään ottelutuloksen käsin

Automaatti hakee tulokset football-data.orgista. Käsin kosket tähän vain jos
API on väärässä, jäljessä tai tarvitset väliaikaisen korjauksen. Käsin tehty
korjaus voittaa automaatin.

Koko lohkovaiheen ohjelma (72 ottelua) on jo `src/data/results.ts`:ssä,
generoituna virallisesta arvonnasta. Tuloksia varten lisäät vain override-rivin:

1. Avaa **`src/data/results.ts`** ja etsi `OVERRIDES`-objekti.
2. Lisää rivi: ottelun id → tulos. Id on muotoa `${lohko}-${kotiId}-${vierasId}`
   (FIFA-koodit `src/data/teams.ts`:stä), esim:
   ```ts
   const OVERRIDES: Record<string, MatchResult> = {
     'C-BRA-MAR': { homeGoals: 2, awayGoals: 0 },
     'H-ESP-URU': { homeGoals: 1, awayGoals: 1 },
   };
   ```
3. Committaa ja pushaa:
   ```bash
   git commit -am "Tulos: Espanja–Uruguay 1–1" && git push
   ```
4. Vercel auto-deplottaa pushista → taulukko päivittyy kaikilla.

> Pudotuspelit (R32→finaali, 32 ottelua) lisätään ohjelmaan vasta kun
> lohkovaihe on ratkennut ja parit ovat tiedossa — niitä ei voi seedata etukäteen.

### Mitalit ja palkinnot (kisojen lopussa)

Aseta `src/data/results.ts`:n `outcome`-objektiin oikeat tulokset
(`championTeamId`, `silverTeamId`, `bronzeTeamId` = FIFA-koodeja;
`bestPlayerId`, `topScorerId` = `src/data/players.ts`:n id:itä). Niin kauan
kuin kenttä on `null`, kyseinen bonus näkyy korteissa "kesken".

## Deploy (Vercel)

GitHub-repo on kytketty Vercel-projektiin, joten **deploy on automaattinen**:

- `git push` **main**-haaraan → tuotantodeploy (mm-veikkaus-six.vercel.app)
- push muuhun haaraan → oma esikatselu-URL (preview)

Eli tulosten päivitys on vain: muokkaa `src/data/results.ts` → `git commit` → `git push`.

Varakeino (CLI, jos tarvitset manuaalisen deployn):

```bash
npx vercel --prod
```

## Automaattinen tuloshaku (malli A)

Tuotannon tuloshaku ajetaan Macin crontabista. Cron hakee
**football-data.org**:sta, kirjoittaa generoidun tulostiedoston ja
`public/version.json`:n, commitoi, pushaa `main`-haaraan ja Vercel deplottaa
itse. Ei tietokantaa, ei Supabasea.

```cron
*/10 * * 6,7 * /Users/harrikiviniemi/projects/mm-veikkaus/scripts/sync-local.sh >> ~/.openclaw/logs/mm-veikkaus-sync.log 2>&1
*/30 * * 6,7 * /Users/harrikiviniemi/projects/mm-veikkaus/scripts/watchdog.sh >> ~/.openclaw/logs/mm-veikkaus-watchdog.log 2>&1
```

**Miten se toimii:**
- `scripts/sync-results.ts` hakee API:sta, mäppää joukkueet FIFA-koodeihin, ottaa
  mukaan vain veikattuja joukkueita sisältävät ottelut, ja kirjoittaa
  `src/data/auto-results.generated.json`:n. **Älä muokkaa tuota tiedostoa käsin.**
- `scripts/sync-local.sh` ajaa haun, luo `public/version.json`:n tuloshashilla,
  commitoi ja pushaa muutokset. Yksittäiset API-katkot jäävät lokiin; toistuvat
  epäonnistumiset hälyttävät Telegramiin.
- `scripts/watchdog.sh` tarkistaa, ettei paikallisia committeja ole jumissa,
  sync-loki ole vanhentunut, live-sivun `/version.json` vastaa odotettua hashia
  ja GitHub-token ole vanhenemassa.
- Kesken olevat ottelut merkitään alustaviksi (UI: 🔴 LIVE).
- **Käsin korjaus:** lisää rivi `OVERRIDES`-objektiin `src/data/results.ts`:ssä —
  se voittaa automaatin (hyvä jos API on väärässä/jäljessä).
- Turvaa: jos API epäonnistuu tai ei tunnista otteluita, tiedostoa **ei**
  ylikirjoiteta (vanha data säilyy).

GitHub Action `Sync results` on manuaalinen varalähde (**Actions → Sync results
→ Run workflow**). Se päivittää sekä `src/data/auto-results.generated.json`:n
että `public/version.json`:n, jotta watchdogin live-hash pysyy vertailukelpoisena.

Paikallinen ajo ilman committia:

```bash
FOOTBALL_DATA_TOKEN="$(cat ~/.mm-veikkaus-token)" npm run sync:results
```

## Pisteytyssäännöt (lyhyesti)

- **Ottelupisteet:** jokaisesta omistetusta joukkueesta per pelattu ottelu —
  voitto 3, tasapeli 1, tappio 0. Rooli ei vaikuta. Jos omistat ottelun
  molemmat joukkueet, molemmat puolet lasketaan.
- **Mitalibonus:** champion-ruutu = oikea mestari → 15, hopea → 10, pronssi → 6.
  Bonus vain jos joukkue on oikeassa roolissa.
- **Palkintobonus:** paras pelaaja oikein → 10, maalikuningas oikein → 10.
- **Sija:** total laskevasti. Sama total → jaettu sija (seuraava hyppää).
