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

## Miten lisään ottelutuloksen

1. Avaa **`src/data/results.ts`**.
2. Etsi ottelu `matches`-listasta (tai lisää uusi: `homeTeamId`/`awayTeamId`
   ovat `src/data/teams.ts`:n FIFA-koodeja, esim. `'BRA'`, `'MAR'`).
3. Aseta tulos:
   ```ts
   { id: 'BRA-MAR', homeTeamId: 'BRA', awayTeamId: 'MAR',
     result: { homeGoals: 2, awayGoals: 0 } }   // null = pelaamatta
   ```
4. Committaa ja pushaa:
   ```bash
   git add src/data/results.ts && git commit -m "Tulos: Brasilia–Marokko 2–0" && git push
   ```
5. Vercel auto-deplottaa pushista → taulukko päivittyy kaikilla.

### Mitalit ja palkinnot (kisojen lopussa)

Aseta `src/data/results.ts`:n `outcome`-objektiin oikeat tulokset
(`championTeamId`, `silverTeamId`, `bronzeTeamId` = FIFA-koodeja;
`bestPlayerId`, `topScorerId` = `src/data/players.ts`:n id:itä). Niin kauan
kuin kenttä on `null`, kyseinen bonus näkyy korteissa "kesken".

## Deploy (Vercel)

Ensimmäinen kerta:

1. Pushaa repo GitHubiin.
2. [vercel.com](https://vercel.com) → **Add New… → Project** → valitse repo.
3. Vercel tunnistaa Vite-projektin `vercel.json`:sta automaattisesti
   (build `npm run build`, output `dist`). Paina **Deploy**.

Tämän jälkeen jokainen `git push` päähaaraan deplottaa automaattisesti.
Vaihtoehtoisesti CLI:llä:

```bash
npm i -g vercel
vercel          # esikatselu-deploy
vercel --prod   # tuotanto
```

## Pisteytyssäännöt (lyhyesti)

- **Ottelupisteet:** jokaisesta omistetusta joukkueesta per pelattu ottelu —
  voitto 3, tasapeli 1, tappio 0. Rooli ei vaikuta. Jos omistat ottelun
  molemmat joukkueet, molemmat puolet lasketaan.
- **Mitalibonus:** champion-ruutu = oikea mestari → 15, hopea → 10, pronssi → 6.
  Bonus vain jos joukkue on oikeassa roolissa.
- **Palkintobonus:** paras pelaaja oikein → 10, maalikuningas oikein → 10.
- **Sija:** total laskevasti. Sama total → jaettu sija (seuraava hyppää).
