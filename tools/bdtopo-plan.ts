/*
 * A TOP-DOWN PLAN of a box from IGN BD TOPO (2026-11-08): roads coloured by NGF altitude with z labelled every PL_LABEL_EVERY m,
 * bridges (sol 1) dashed, tunnels (sol -1) dotted, Quai lines thick blue, retaining walls thick brown, the mini city's OSM ways
 * thin grey under them and the hand deck zone's level rings dashed purple. For judging BD TOPO's tiers against the satellite view.
 *   npx vite-node tools/bdtopo-plan.ts -- <city> <s,w,n,e> <out.svg>     (also writes out.png via playwright)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { readPackage } from './bake-files.ts'
import { Projection } from '../src/city/geo.ts'
import { fetchBdTopo, fillNoZ, btSol, btName, BT_NOZ } from './bdtopo-zones.ts'

/** round 2 (2026-11-08): OSM edge → route assignment on Pont National's right bank (the owner's four routes against BD TOPO),
 *  drawn as thick translucent bands under the BD TOPO lines; PL_TIERS=0 leaves them out */
const PL_TIERS: { name: string; col: string; ids: number[] }[] = process.env.PL_TIERS === '0' ? [] : [
  { name: 'Quai de Bercy northbound (BD TOPO 23933/23371)', col: '#e0218a', ids: [159, 228, 155, 1007, 227] },
  { name: 'Quai de Bercy southbound, to the A4 (23931/23932)', col: '#ff8c00', ids: [19, 1006, 226, 230] },
  { name: 'unnamed on-ramp under the bridge (23365/23367/23930)', col: '#1f9e3a', ids: [957, 955, 22, 40, 41, 42, 229, 233] },
  { name: 'Port de Bercy (23372/23368): ends north of the bridge', col: '#2060ff', ids: [223, 224, 970000000000000] },
  { name: 'slip to the Périphérique (23912)', col: '#8a2be2', ids: [38] },
]
const PL_PX = 2.5, PL_PAD = 40, PL_LABEL_EVERY = 30, PL_ZMIN = 27, PL_ZMAX = 40, PL_SCALE_M = 50, PL_FONT = 10

const [city = 'pont-national-mini', box = '48.8265,2.3845,48.8305,2.3905', out = 'plans/bridgeheads/pont-national-bdtopo.svg'] = process.argv.slice(2).filter((a) => a !== '--')
const [s, w, n, e] = box.split(',').map(Number)
const pkg = readPackage(city), proj = new Projection(pkg.origin)
const roads = await fetchBdTopo('troncon_de_route', s, w, n, e), lines = await fetchBdTopo('construction_lineaire', s, w, n, e)
fillNoZ(roads)
const sw = proj.toLocal({ lat: s, lon: w }), ne = proj.toLocal({ lat: n, lon: e })
const W = (ne.x - sw.x) * PL_PX + 2 * PL_PAD, H = (ne.z - sw.z) * PL_PX + 2 * PL_PAD + 60
const X = (x: number) => ((x - sw.x) * PL_PX + PL_PAD).toFixed(1), Y = (z: number) => ((ne.z - z) * PL_PX + PL_PAD).toFixed(1)
const ll = (lo: number, la: number) => proj.toLocal({ lat: la, lon: lo })
// altitude colour: a blue→teal→yellow→orange→red ramp over PL_ZMIN..PL_ZMAX
const STOPS = [[0, 40, 70, 200], [0.3, 0, 160, 170], [0.55, 120, 190, 40], [0.75, 240, 170, 0], [1, 210, 30, 30]]
const col = (z: number) => {
  if (z <= BT_NOZ) return '#000'
  const t = Math.max(0, Math.min(1, (z - PL_ZMIN) / (PL_ZMAX - PL_ZMIN)))
  let i = 0; while (i < STOPS.length - 2 && t > STOPS[i + 1][0]) i++
  const [t0, ...a] = STOPS[i], [t1, ...b] = STOPS[i + 1], k = (t - t0) / (t1 - t0)
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * k)).join(',')})`
}
const svg: string[] = []
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" font-family="sans-serif" font-size="${PL_FONT}"><rect width="100%" height="100%" fill="#fbfaf7"/>`)
// OSM ways (thin grey) and their names
const inBox = (x: number, z: number) => x >= sw.x - 20 && x <= ne.x + 20 && z >= sw.z - 20 && z <= ne.z + 20
for (const ed of pkg.edges) {
  const p = ed.points; let any = false
  for (let i = 0; i < p.length; i += 2) if (inBox(p[i], p[i + 1])) { any = true; break }
  if (!any) continue
  const d = []; for (let i = 0; i < p.length; i += 2) d.push(`${X(p[i])},${Y(p[i + 1])}`)
  const tier = PL_TIERS.find((t) => t.ids.includes(ed.id))
  if (tier) svg.push(`<polyline points="${d.join(' ')}" fill="none" stroke="${tier.col}" stroke-width="9" stroke-opacity="0.35" stroke-linecap="round"/>`)
  svg.push(`<polyline points="${d.join(' ')}" fill="none" stroke="#888" stroke-width="${ed.bridge ? 1.6 : 0.9}" stroke-opacity="0.7"${ed.tunnel ? ' stroke-dasharray="2 2"' : ''}/>`)
}
PL_TIERS.forEach((t, i) => { svg.push(`<rect x="${PL_PAD}" y="${PL_PAD + i * 14}" width="18" height="8" fill="${t.col}" fill-opacity="0.5"/><text x="${PL_PAD + 24}" y="${PL_PAD + i * 14 + 8}">${t.name}</text>`) })
// the hand deck zone's rings
const zones = (JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'src', 'city', 'regions.json'), 'utf8')).paris.deckZones ?? []) as { ring: [number, number][]; levels: { name: string; alt: number; ring?: [number, number][] }[] }[]
for (const z of zones) for (const r of [{ ring: z.ring, name: 'zone', alt: 0 }, ...z.levels.filter((l) => l.ring)] as { ring: [number, number][]; name: string; alt: number }[]) {
  const pts = r.ring.map(([la, lo]) => { const q = ll(lo, la); return `${X(q.x)},${Y(q.z)}` })
  svg.push(`<polygon points="${pts.join(' ')}" fill="none" stroke="#a040c0" stroke-width="1" stroke-dasharray="5 3" stroke-opacity="0.8"/>`)
  const q = ll(r.ring[0][1], r.ring[0][0]); svg.push(`<text x="${X(q.x)}" y="${Y(q.z)}" fill="#a040c0" font-size="9">${r.name}${r.alt ? ' ' + r.alt : ''}</text>`)
}
// a polyline's segments coloured by z, labels every PL_LABEL_EVERY m
const labels: string[] = []
function draw(pt: number[][], width: number, dash: string, colour: ((z: number) => string) | string, op = 1, labelCol?: string) {
  let run = PL_LABEL_EVERY / 2
  for (let i = 1; i < pt.length; i++) {
    const a = ll(pt[i - 1][0], pt[i - 1][1]), b = ll(pt[i][0], pt[i][1]), zz = (pt[i - 1][2] + pt[i][2]) / 2
    const c = typeof colour === 'string' ? colour : colour(zz)
    svg.push(`<line x1="${X(a.x)}" y1="${Y(a.z)}" x2="${X(b.x)}" y2="${Y(b.z)}" stroke="${c}" stroke-width="${width}" stroke-linecap="round" stroke-opacity="${op}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`)
    const L = Math.hypot(b.x - a.x, b.z - a.z); run += L
    while (run >= PL_LABEL_EVERY) {
      run -= PL_LABEL_EVERY
      const t = 1 - run / (L || 1), x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, zv = pt[i - 1][2] + (pt[i][2] - pt[i - 1][2]) * t
      if (zv > BT_NOZ) labels.push(`<text x="${X(x)}" y="${Y(z)}" fill="${labelCol ?? (typeof colour === 'string' ? colour : colour(zv))}" stroke="#fff" stroke-width="2.5" paint-order="stroke" font-weight="bold">${zv.toFixed(1)}</text>`)
    }
  }
}
const byOrder = (f: typeof roads[number]) => ({ '1': 0, '-1': 1, '0': 2 } as Record<string, number>)[btSol(f)] ?? 2
for (const f of [...roads].sort((a, b) => byOrder(a) - byOrder(b))) {
  const sol = btSol(f), nat = String(f.props.nature)
  const wd = nat === 'Sentier' || nat === 'Escalier' ? 1.5 : nat === 'Bretelle' ? 2.5 : 3.5
  for (const pt of f.coords) draw(pt, sol === '1' ? wd + 1.5 : wd, sol === '1' ? '7 4' : sol === '-1' ? '1.5 3' : '', col, sol === '1' ? 0.55 : 1)
  const nm = btName(f), mid = f.coords[0][Math.floor(f.coords[0].length / 2)]
  if (nm) { const q = ll(mid[0], mid[1]); labels.push(`<text x="${X(q.x)}" y="${(+Y(q.z) + 11).toFixed(1)}" fill="#333" font-size="8" font-style="italic" stroke="#fff" stroke-width="2" paint-order="stroke">${nm.toLowerCase()}</text>`) }
}
for (const f of lines) {
  const nat = String(f.props.nature)
  const c = nat === 'Quai' ? '#1060e0' : nat === 'Mur de soutènement' ? '#8a4a10' : nat === 'Tunnel' ? '#444' : '#999'
  for (const pt of f.coords) draw(pt, nat === 'Quai' || nat === 'Mur de soutènement' ? 5 : 2, nat === 'Tunnel' ? '3 3' : nat === 'Pont' ? '1 3' : '', c, 0.85)
}
svg.push(...labels)
// scale bar, north arrow, legend
const by = H - 30
svg.push(`<rect x="${PL_PAD}" y="${by}" width="${PL_SCALE_M * PL_PX}" height="5" fill="#222"/><text x="${PL_PAD}" y="${by - 4}">${PL_SCALE_M} m</text>`)
svg.push(`<g transform="translate(${W - 30},60)"><path d="M0,-30 L8,0 L0,-6 L-8,0 Z" fill="#222"/><text x="-4" y="14" font-weight="bold">N</text></g>`)
const lg = [['road, z ramp 27→40 NGF', col(33)], ['bridge (sol 1) dashed', col(39)], ['tunnel (sol -1) dotted', col(29)], ['Quai (wall top)', '#1060e0'], ['Mur de soutènement', '#8a4a10'], ['OSM way', '#888'], ['hand deck-zone ring', '#a040c0']]
lg.forEach(([t, c], i) => svg.push(`<rect x="${PL_PAD + 70 + (i % 4) * 170}" y="${by - 12 + Math.floor(i / 4) * 16}" width="14" height="6" fill="${c}"/><text x="${PL_PAD + 88 + (i % 4) * 170}" y="${by - 5 + Math.floor(i / 4) * 16}">${t}</text>`))
for (let z = PL_ZMIN; z <= PL_ZMAX; z++) svg.push(`<rect x="${PL_PAD + (z - PL_ZMIN) * 22}" y="8" width="22" height="8" fill="${col(z)}"/>${z % 2 ? '' : `<text x="${PL_PAD + (z - PL_ZMIN) * 22}" y="28">${z}</text>`}`)
svg.push(`<text x="${PL_PAD + 320}" y="16">BD TOPO NGF m (bake = NGF − 32.94) · ${box}</text></svg>`)
writeFileSync(out, svg.join('\n'))
console.log(`${out}: ${roads.length} roads, ${lines.length} lines`)
try {
  const { chromium } = await import('playwright')
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: Math.ceil(W), height: Math.ceil(H) } })
  await pg.setContent(readFileSync(out, 'utf8')); await pg.screenshot({ path: out.replace(/\.svg$/, '.png') }); await b.close()
  console.log(out.replace(/\.svg$/, '.png'))
} catch (err) { console.log(`no png: ${err}`) }
