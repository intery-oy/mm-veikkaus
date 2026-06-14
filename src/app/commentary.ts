// "Selostaja" — sääntöpohjainen hauska kommentaari tilanteesta. Ei API:a,
// ei salaisuuksia: lukee standingsin ja tulokset ja kokoaa repliikin.
// Deterministinen datasta -> sama tilanne antaa saman repliikin, mutta vaihtuu
// kun tulokset muuttuvat.

import type { BettorView, PortalData } from './viewmodel.js';

// Vakaa valinta: sama avain -> sama lause (ei välkettä joka renderissä).
function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length]!;
}

function nameList(bs: BettorView[], max = 4): string {
  const names = bs.map((b) => `${b.avatar} ${b.name}`);
  if (names.length <= max) {
    if (names.length === 1) return names[0]!;
    return `${names.slice(0, -1).join(', ')} ja ${names[names.length - 1]}`;
  }
  return `${names.slice(0, max).join(', ')} ja ${names.length - max} muuta`;
}

export function buildCommentary(data: PortalData): string {
  const { bettors, playedMatches, totalMatches, results } = data;
  if (bettors.length === 0) return 'Selostaja lämmittelee mikrofonia… 🎙️';

  const topScore = bettors[0]!.total;

  // Ei vielä pisteitä: kisa ei ole oikeasti alkanut.
  if (topScore === 0) {
    return pick(
      [
        'Tuomari ei ole vielä viheltänyt — kaikki nollissa ja kaikki vielä mahdollista! ⚽',
        'Nurmi on leikattu, liput liehuu, eikä yhtään pistettä ole vielä jaettu. Tästä se alkaa! 🏟️',
        'Hiljaista kuin pukukopissa ennen ottelua… 0–0 kaikkialla. Kohta revitään! 🔥',
      ],
      playedMatches + bettors.length,
    );
  }

  const leaders = bettors.filter((b) => b.rank === 1);
  const seed = playedMatches + leaders.length + topScore;

  // 1) Avaus — kisan vaihe.
  const opener =
    playedMatches <= 2
      ? pick(
          [
            `Vasta ${playedMatches}/${totalMatches} ottelua, mutta tunnelma tiivistyy!`,
            `Kisa lähti käyntiin — ${playedMatches} ottelua pelattu ja ensimmäiset pisteet jaossa!`,
          ],
          seed,
        )
      : pick(
          [
            `${playedMatches}/${totalMatches} ottelua takana — taulukko alkaa elää!`,
            `Jo ${playedMatches} ottelua pelattu, ja kärkikahina käy kuumana!`,
          ],
          seed,
        );

  // 2) Kärki — yksi johtaja vai ruuhkaa.
  const leaderLine =
    leaders.length === 1
      ? pick(
          [
            `Kärjessä komeilee ${nameList(leaders)} ${topScore} pisteellä — muut, perään!`,
            `${nameList(leaders)} johtaa ${topScore} pisteellä ja hymyilee leveästi. 😎`,
          ],
          seed,
        )
      : pick(
          [
            `Kärjessä ruuhkaa: ${leaders.length} veikkaajaa tasapisteissä (${topScore} p) — ${nameList(leaders)} kyynärpäät pystyssä! 💪`,
            `Jaettu johto! ${nameList(leaders)} kaikki ${topScore} pisteessä — tiukkaa on. 🤝`,
          ],
          seed,
        );

  // 3) Mauste — pohjasija, tuore tulos tai pisteero.
  const last = bettors[bettors.length - 1]!;
  const trailers = bettors.filter((b) => b.total === last.total);
  const latest = results[results.length - 1];

  const spices: string[] = [];
  if (last.total < topScore) {
    spices.push(
      pick(
        [
          `Pohjalla ${nameList(trailers)} (${last.total} p) — mutta matka on pitkä, ei luovuteta! 🐢`,
          `${nameList(trailers)} aloittaa altavastaajana (${last.total} p). Comeback latautuu? 🔋`,
        ],
        seed,
      ),
    );
  }
  if (latest) {
    spices.push(
      `Viimeksi maaliverkko heilui: ${latest.homeFlag} ${latest.homeGoals}–${latest.awayGoals} ${latest.awayFlag}. ⚽`,
    );
  }
  const spice = spices.length ? ' ' + pick(spices, seed) : '';

  return `${opener} ${leaderLine}${spice}`;
}
