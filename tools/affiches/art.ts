/**
 * The pictograms the street ads are drawn with (tools/affiches/render.ts): flat shapes on a 100 × 100 box, in
 * `currentColor`, with cut-outs in the card's own ground (`var(--bg)`). Bold enough to read at 20 km/h, which is
 * all a poster's picture has to do.
 */
import { ART_PARIS } from './art-paris.ts'
import { ART_SF } from './art-sf.ts'

const S = (w: number): string => `fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`
const BG = 'fill="var(--bg)"'

function gear(cx: number, cy: number, r: number, teeth: number): string {
  let d = ''
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2
    const rr = i % 2 ? r * 0.82 : r
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a0) * rr).toFixed(1)} ${(cy + Math.sin(a0) * rr).toFixed(1)}L${(cx + Math.cos(a1) * rr).toFixed(1)} ${(cy + Math.sin(a1) * rr).toFixed(1)}`
  }
  return `<path d="${d}Z"/><circle cx="${cx}" cy="${cy}" r="${r * 0.35}" ${BG}/>`
}
function star(cx: number, cy: number, r: number): string {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2
    const rr = i % 2 ? r * 0.42 : r
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`
  }
  return `<path d="${d}Z"/>`
}
const bike = (x0 = 0, w = 1): string => `<g ${S(5.5)} transform="translate(${x0} 0) scale(${w} 1)"><circle cx="22" cy="66" r="17"/><circle cx="78" cy="66" r="17"/>
  <path d="M22 66 L40 38 L68 38 L78 66 M40 38 L50 66 L68 38 M50 66 L22 66 M34 29 H47 M40 38 L37 29 M68 38 L64 24 H74"/></g>`

export const ART: Record<string, string> = {
  bike: bike(),
  tandem: `<g ${S(5)}><circle cx="16" cy="66" r="14"/><circle cx="84" cy="66" r="14"/><path d="M16 66 L30 42 H70 L84 66 M30 42 L38 66 L52 42 L60 66 L70 42 M38 66 H60 M24 34 H36 M48 34 H60 M30 42 L28 34 M52 42 L52 34 M70 42 L67 28 H76"/></g>`,
  helmet: `<path d="M8 66 Q10 22 52 20 Q92 22 94 58 L86 66 Z"/><path d="M30 30 Q40 26 48 28 L46 44 L30 46 Z M56 28 Q68 28 76 36 L70 46 L56 44 Z" ${BG}/><path d="M8 66 H86" ${S(4)}/>`,
  lock: `<path d="M30 52 V32 a20 20 0 0 1 40 0 V52" ${S(10)}/><rect x="18" y="48" width="64" height="42" rx="7"/><circle cx="50" cy="66" r="6" ${BG}/><rect x="47" y="68" width="6" height="12" ${BG}/>`,
  tire: `<circle cx="50" cy="50" r="38" ${S(14)}/><circle cx="50" cy="50" r="24" ${S(2)}/>${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30} 50 50)" d="M50 6 V16" stroke="var(--bg)" stroke-width="3"/>`).join('')}`,
  chain: `<g ${S(6)}>${[0, 1, 2, 3].map((i) => `<rect x="${6 + i * 22}" y="${i % 2 ? 40 : 36}" width="32" height="${i % 2 ? 20 : 28}" rx="${i % 2 ? 10 : 14}"/>`).join('')}</g>`,
  gear: gear(50, 50, 42, 14),
  bell: `<path d="M22 70 Q24 30 50 26 Q76 30 78 70 Z"/><rect x="14" y="68" width="72" height="8" rx="4"/><circle cx="50" cy="84" r="6"/><rect x="46" y="16" width="8" height="12" rx="3"/>`,
  scooter: `<g ${S(6)}><circle cx="20" cy="76" r="10"/><circle cx="80" cy="76" r="10"/><path d="M20 76 H70 L80 76 M70 76 L62 18 H52 M62 18 H74"/></g>`,
  coffee: `<path d="M18 40 H74 L68 86 Q66 92 60 92 H32 Q26 92 24 86 Z"/><path d="M72 50 Q90 50 88 64 Q86 76 70 74" ${S(6)}/><path d="M34 30 Q30 22 36 14 M48 30 Q44 22 50 14 M62 30 Q58 22 64 14" ${S(4)}/>`,
  croissant: [[-62, 14, 13], [-32, 17, 17], [0, 19, 21], [32, 17, 17], [62, 14, 13]].map(([a, rx, ry]) => {
    const t = (a as number) * Math.PI / 180
    return `<ellipse cx="${(50 + Math.sin(t) * 34).toFixed(1)}" cy="${(64 - Math.cos(t) * 24).toFixed(1)}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${(50 + Math.sin(t) * 34).toFixed(1)} ${(64 - Math.cos(t) * 24).toFixed(1)})" stroke="var(--bg)" stroke-width="2.5"/>`
  }).join(''),
  baguette: `<g transform="rotate(-30 50 50)"><rect x="2" y="40" width="96" height="20" rx="10"/>${[18, 34, 50, 66, 82].map((x) => `<path d="M${x - 5} 54 L${x + 5} 46" stroke="var(--bg)" stroke-width="3"/>`).join('')}</g>`,
  cheese: `<path d="M8 72 L86 40 L92 72 Z"/><path d="M8 72 H92 V84 H8 Z" opacity=".8"/><circle cx="62" cy="62" r="6" ${BG}/><circle cx="40" cy="74" r="4" ${BG}/><circle cx="78" cy="76" r="4" ${BG}/>`,
  wine: `<path d="M30 10 H70 Q74 44 50 50 Q26 44 30 10 Z"/><path d="M50 50 V84 M34 88 H66" ${S(5)}/><path d="M33 22 H67" stroke="var(--bg)" stroke-width="2"/>`,
  bottle: `<path d="M42 6 H58 V24 Q72 32 72 46 V90 Q72 94 68 94 H32 Q28 94 28 90 V46 Q28 32 42 24 Z"/><rect x="32" y="52" width="36" height="22" ${BG}/>`,
  can: `<rect x="26" y="14" width="48" height="76" rx="8"/><rect x="26" y="40" width="48" height="24" ${BG}/><rect x="36" y="8" width="28" height="6" rx="2"/>`,
  icecream: `<path d="M32 50 L50 96 L68 50 Z"/><circle cx="38" cy="42" r="14"/><circle cx="62" cy="42" r="14"/><circle cx="50" cy="24" r="15"/><path d="M36 58 L64 58 M40 68 L60 68" stroke="var(--bg)" stroke-width="2.5"/>`,
  burrito: `<g transform="rotate(-24 50 50)"><rect x="8" y="30" width="84" height="40" rx="20"/><rect x="50" y="30" width="42" height="40" rx="0" opacity=".55"/><path d="M50 30 V70" stroke="var(--bg)" stroke-width="2"/></g>`,
  bread: `<ellipse cx="50" cy="58" rx="42" ry="28"/>${[30, 46, 62].map((x) => `<path d="M${x} 44 Q${x + 8} 56 ${x + 4} 70" stroke="var(--bg)" stroke-width="4" fill="none"/>`).join('')}`,
  fish: `<ellipse cx="46" cy="50" rx="34" ry="20"/><path d="M76 50 L96 32 V68 Z"/><circle cx="28" cy="46" r="4" ${BG}/>`,
  phone: `<rect x="28" y="6" width="44" height="88" rx="8"/><rect x="33" y="14" width="34" height="66" rx="2" ${BG}/><circle cx="50" cy="87" r="3" ${BG}/>`,
  laptop: `<path d="M18 20 H82 V66 H18 Z"/><rect x="23" y="25" width="54" height="36" ${BG}/><path d="M6 70 H94 L88 80 H12 Z"/>`,
  rocket: `<path d="M50 4 Q74 26 66 70 H34 Q26 26 50 4 Z"/><circle cx="50" cy="34" r="8" ${BG}/><path d="M34 52 L18 76 L36 70 Z M66 52 L82 76 L64 70 Z"/><path d="M40 76 L50 96 L60 76 Z" opacity=".7"/>`,
  chart: `<rect x="10" y="66" width="14" height="24"/><rect x="30" y="52" width="14" height="38"/><rect x="50" y="38" width="14" height="52"/><rect x="70" y="16" width="14" height="74"/><path d="M10 50 L40 30 L56 38 L88 8 M74 8 H88 V22" ${S(4)}/>`,
  cat: `<ellipse cx="50" cy="72" rx="26" ry="22"/><circle cx="50" cy="38" r="20"/><path d="M32 30 L30 8 L46 22 Z M68 30 L70 8 L54 22 Z"/><circle cx="42" cy="36" r="3.5" ${BG}/><circle cx="58" cy="36" r="3.5" ${BG}/><path d="M76 82 Q96 80 88 58" ${S(6)}/>`,
  dog: `<ellipse cx="54" cy="60" rx="30" ry="16"/><circle cx="24" cy="40" r="14"/><path d="M12 40 L4 46 L14 50 Z"/><path d="M28 30 L36 46 L24 48 Z" opacity=".7"/><path d="M32 72 V92 M48 72 V92 M64 72 V92 M78 70 V92 M84 56 L96 42" ${S(6)}/><circle cx="20" cy="38" r="2.5" ${BG}/>`,
  pigeon: `<ellipse cx="52" cy="58" rx="30" ry="20"/><circle cx="28" cy="34" r="12"/><path d="M16 34 L6 38 L16 40 Z"/><path d="M80 52 L98 46 L86 62 Z"/><path d="M46 78 V92 M58 78 V92 M42 92 H50 M54 92 H62" ${S(3)}/><circle cx="26" cy="32" r="2.5" ${BG}/><path d="M40 52 Q56 44 74 56" stroke="var(--bg)" stroke-width="2.5" fill="none"/>`,
  gull: `<path d="M6 50 Q26 26 50 52 Q74 26 94 50" ${S(7)}/><path d="M20 76 Q32 62 44 76 Q56 62 68 76" ${S(4)} opacity=".6"/>`,
  cloud: `<circle cx="34" cy="56" r="18"/><circle cx="54" cy="44" r="22"/><circle cx="72" cy="58" r="16"/><rect x="16" y="56" width="72" height="18" rx="9"/>`,
  sun: `<circle cx="50" cy="50" r="22"/>${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30} 50 50)" d="M50 6 V18" ${S(5)}/>`).join('')}`,
  rain: `<circle cx="34" cy="40" r="16"/><circle cx="54" cy="30" r="20"/><circle cx="70" cy="42" r="14"/><rect x="18" y="40" width="68" height="16" rx="8"/><path d="M30 66 L24 80 M50 66 L44 80 M70 66 L64 80 M40 84 L36 94 M60 84 L56 94" ${S(4)}/>`,
  hill: `<path d="M0 96 L70 14 L100 40 V96 Z"/><path d="M8 92 L68 22" stroke="var(--bg)" stroke-width="3" stroke-dasharray="6 5"/>${bike(26, 0.28).replace('translate(26 0)', 'translate(30 38) rotate(-50 14 66)')}`,
  bridge: `<path d="M24 92 V12 M76 92 V12" ${S(7)}/><path d="M0 60 Q24 12 24 12 Q50 64 76 12 Q76 12 100 60" ${S(3)}/><path d="M0 66 H100" ${S(6)}/><path d="M18 26 H30 M70 26 H82 M18 44 H30 M70 44 H82" ${S(3)}/>`,
  tower: `<path d="M50 2 L56 30 L66 62 L84 96 H64 Q50 72 36 96 H16 L34 62 L44 30 Z"/><path d="M38 62 H62 M44 30 H56" stroke="var(--bg)" stroke-width="3"/>`,
  house: `<path d="M10 46 L50 10 L90 46 V92 H10 Z"/><rect x="42" y="62" width="16" height="30" ${BG}/><rect x="20" y="52" width="14" height="14" ${BG}/><rect x="66" y="52" width="14" height="14" ${BG}/>`,
  bed: `<rect x="6" y="50" width="88" height="22" rx="4"/><rect x="6" y="28" width="10" height="56"/><rect x="18" y="40" width="22" height="12" rx="6" opacity=".7"/><path d="M90 72 V84" ${S(8)}/><text x="58" y="36" font-size="18" font-weight="900" fill="currentColor">z z</text>`,
  shoe: `<path d="M6 70 Q8 44 20 40 L40 46 Q56 52 70 54 Q94 58 94 72 V78 H6 Z"/><path d="M6 78 H94" stroke="var(--bg)" stroke-width="3"/><path d="M26 48 L36 54 M32 44 L42 50" stroke="var(--bg)" stroke-width="3"/>`,
  sock: `<path d="M34 6 H62 V54 L86 72 Q96 82 86 92 Q78 98 66 90 L34 66 Z"/><path d="M34 18 H62 M34 26 H62" stroke="var(--bg)" stroke-width="4"/>`,
  glasses: `<g ${S(6)}><circle cx="28" cy="54" r="18"/><circle cx="72" cy="54" r="18"/><path d="M46 52 Q50 46 54 52 M10 50 L2 38 M90 50 L98 38"/></g>`,
  perfume: `<rect x="22" y="38" width="56" height="56" rx="6"/><rect x="40" y="22" width="20" height="16"/><rect x="34" y="8" width="32" height="14" rx="3"/><rect x="32" y="56" width="36" height="18" ${BG}/>`,
  tooth: `<path d="M18 22 Q30 6 50 18 Q70 6 82 22 Q90 40 76 56 Q72 80 66 92 Q58 96 56 80 Q50 62 44 80 Q42 96 34 92 Q28 80 24 56 Q10 40 18 22 Z"/><path d="M60 24 Q70 22 72 32" stroke="var(--bg)" stroke-width="4" fill="none"/>`,
  heart: `<path d="M50 90 L12 50 Q0 30 18 16 Q36 4 50 26 Q64 4 82 16 Q100 30 88 50 Z"/>`,
  note: `<path d="M34 20 L82 10 V70" ${S(7)}/><path d="M34 20 V80" ${S(7)}/><ellipse cx="24" cy="80" rx="13" ry="10"/><ellipse cx="72" cy="70" rx="13" ry="10"/>`,
  mask: `<path d="M14 14 Q50 4 86 14 Q90 60 50 92 Q10 60 14 14 Z"/><path d="M26 36 Q34 28 42 36 Q34 42 26 36 Z M58 36 Q66 28 74 36 Q66 42 58 36 Z" ${BG}/><path d="M32 62 Q50 78 68 62 Q50 70 32 62 Z" ${BG}/>`,
  film: `<circle cx="50" cy="50" r="42"/>${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(50 + Math.sin(a * Math.PI / 180) * 24).toFixed(1)}" cy="${(50 - Math.cos(a * Math.PI / 180) * 24).toFixed(1)}" r="10" ${BG}/>`).join('')}<circle cx="50" cy="50" r="5" ${BG}/>`,
  plant: `<path d="M30 70 H70 L64 96 H36 Z"/><path d="M50 70 V30" ${S(5)}/><path d="M50 50 Q26 50 20 26 Q42 28 50 50 Z M50 40 Q74 40 82 14 Q58 16 50 40 Z"/>`,
  key: `<circle cx="28" cy="50" r="20"/><circle cx="28" cy="50" r="8" ${BG}/><path d="M46 50 H94 M80 50 V64 M90 50 V60" ${S(8)}/>`,
  star: star(50, 52, 44),
}
// (each set's own pictograms beside the shared ones: p_ Paris's, s_ SF's)
const ALL: Record<string, string> = { ...ART, ...ART_PARIS, ...ART_SF }
export const artSvg = (key: string): string =>
  `<svg viewBox="0 0 100 100" fill="currentColor">${ALL[key] ?? ART.star}</svg>`
