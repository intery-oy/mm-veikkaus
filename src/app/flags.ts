// FIFA-koodi -> lippuemoji. Useimmat johdetaan ISO 3166-1 alpha-2 -koodista
// regional indicator -symboleina; Englanti ja Skotlanti käyttävät omia
// alalippujaan (eivät ole ISO-maita).

const ISO2: Record<string, string> = {
  MEX: 'MX', RSA: 'ZA', KOR: 'KR', CZE: 'CZ',
  CAN: 'CA', BIH: 'BA', QAT: 'QA', SUI: 'CH',
  BRA: 'BR', MAR: 'MA', HAI: 'HT',
  USA: 'US', PAR: 'PY', AUS: 'AU', TUR: 'TR',
  GER: 'DE', CUW: 'CW', CIV: 'CI', ECU: 'EC',
  NED: 'NL', JPN: 'JP', SWE: 'SE', TUN: 'TN',
  BEL: 'BE', EGY: 'EG', IRN: 'IR', NZL: 'NZ',
  ESP: 'ES', CPV: 'CV', KSA: 'SA', URU: 'UY',
  FRA: 'FR', SEN: 'SN', IRQ: 'IQ', NOR: 'NO',
  ARG: 'AR', ALG: 'DZ', AUT: 'AT', JOR: 'JO',
  POR: 'PT', COD: 'CD', UZB: 'UZ', COL: 'CO',
  CRO: 'HR', GHA: 'GH', PAN: 'PA',
};

// Alalippuglyfit (regional indicators eivät kata näitä).
const SPECIAL: Record<string, string> = {
  ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
};

function regionalIndicator(iso2: string): string {
  return [...iso2]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

/** Lippuemoji FIFA-koodista; tuntemattomalle neutraali valkoinen lippu. */
export function flagEmoji(fifaId: string): string {
  if (SPECIAL[fifaId]) return SPECIAL[fifaId];
  const iso = ISO2[fifaId];
  return iso ? regionalIndicator(iso) : '🏳️';
}

// Iloiset avatar-emojit kullekin perheenjäsenelle.
const AVATARS: Record<string, string> = {
  kaarlo: '🦁',
  alvar: '🐯',
  aura: '🦊',
  helga: '🐼',
  harri: '🐵',
  leena: '🦄',
  juha: '🐲',
  jossu: '🦅',
  mummo: '👵',
  pappa: '👴',
  ilpo: '🦈',
  meeri: '🐝',
};

export function bettorAvatar(bettorId: string): string {
  return AVATARS[bettorId] ?? '⚽';
}
