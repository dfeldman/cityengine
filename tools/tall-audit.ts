/**
 * Implausibly tall buildings — the ones OSM is wrong about.
 *
 * The owner: *"We should do an audit for very tall buildings outside the downtown core. There are a handful
 * of them of course, but a bunch of them are errors in OSM. I suspect putting number of floors or height in
 * feet into the height in meters field."*
 *
 * That diagnosis is the whole design of this tool. A wrong `height` is not random noise; it is almost always
 * one of a few specific confusions, and each leaves a signature you can test for:
 *
 *   FEET IN THE METRES FIELD    height / 3.2808 lands on a sane storey height. A "100 m" four-storey
 *                               building is 30 m in feet, which is 7.6 m a storey — right.
 *   FLOORS IN THE METRES FIELD  height is small and equals (or nearly equals) `building:levels`, so the
 *                               building is a few metres tall and has that many floors.
 *   A HEIGHT WITH NO FLOORS     height implies far more storeys than the footprint could hold.
 *
 * The strongest single signal is METRES PER STOREY, where both tags exist: real buildings sit between about
 * 2.6 m (a tight flat) and 6 m (a grand lobby or a hall), with warehouses and theatres stretching to ~8 m.
 * Past 10 m a storey, something is wrong with the number rather than the building.
 *
 * "Outside the downtown core" matters because downtown genuinely has towers, so height alone proves nothing
 * there. Elsewhere a 90 m building is a claim worth checking. The core is given as a box in local metres.
 *
 *     node --experimental-strip-types tools/tall-audit.ts [--city=san-francisco] [--min=45] [--csv=path]
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { shippedDir } from './bake-files.ts'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, d = ''): string =>
  (process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))?.split('=').slice(1).join('=')) ?? d

const city = arg('city', 'san-francisco')
const MIN = Number(arg('min', '45'))
const FT = 3.2808

/** Downtown San Francisco in local metres: towers here are real and prove nothing. */
const CORE = { x0: -600, x1: 2600, z0: -1800, z1: 900 }

const unesc = (v: string): string => v.replace(/%([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))

interface Row {
  id: string; name: string; h: number; levels: number | null
  x: number; z: number; perStorey: number | null; verdict: string; why: string
}

// the origin, from the shipped v3 index
const idx = JSON.parse(readFileSync(resolve(shippedDir(city), 'index.json'), 'utf8')) as
  { origin: { lat: number; lon: number } }
const R = 6371000
const kx = (Math.PI / 180) * R * Math.cos((idx.origin.lat * Math.PI) / 180)
const kz = (Math.PI / 180) * R

const rows: Row[] = []
const seen = new Set<string>()
const re = /n\d+x(-?[\d.]+)y(-?[\d.]+)/g

for (const f of readdirSync(resolve(ROOT, 'tools/cache/osm/cuts'))) {
  if (!f.endsWith('.opl')) continue
  for (const line of readFileSync(resolve(ROOT, 'tools/cache/osm/cuts', f), 'utf8').split('\n')) {
    if (line[0] !== 'w') continue
    const id = line.slice(1, line.indexOf(' '))
    if (seen.has(id)) continue
    const ti = line.indexOf(' T')
    if (ti < 0) continue
    let t = line.slice(ti + 2)
    const ni = t.indexOf(' N')
    if (ni >= 0) t = t.slice(0, ni)
    t = unesc(t)
    if (!/(^|,)building(:part)?=/.test(t)) continue
    const h = parseFloat((/(^|,)height=([\d.]+)/.exec(t) ?? [])[2] ?? '')
    if (!Number.isFinite(h) || h < MIN) continue
    seen.add(id)
    let m: RegExpExecArray | null
    let sx = 0; let sy = 0; let n = 0
    re.lastIndex = 0
    while ((m = re.exec(line))) { sx += parseFloat(m[1]); sy += parseFloat(m[2]); n++ }
    if (!n) continue
    const x = (sx / n - idx.origin.lon) * kx
    const z = (sy / n - idx.origin.lat) * kz
    if (x >= CORE.x0 && x <= CORE.x1 && z >= CORE.z0 && z <= CORE.z1) continue   // downtown: towers are real
    const lvRaw = parseFloat((/(^|,)building:levels=([\d.]+)/.exec(t) ?? [])[2] ?? '')
    const levels = Number.isFinite(lvRaw) ? lvRaw : null
    const name = (/(^|,)name=([^,]*)/.exec(t) ?? [])[2] ?? ''
    const perStorey = levels && levels > 0 ? h / levels : null

    /*
     * The verdict, most specific first. A row is only worth a human's time if we can say WHAT we think the
     * mistake is — "suspicious" on its own is a list nobody works through.
     */
    let verdict = 'check'
    let why = 'tall for this part of the city, and no storey count to check it against'
    const desc = (/(^|,)description=([^,]*)/.exec(t) ?? [])[2] ?? ''
    const bridgePart = /^(leg|top_mast|mast|tower|pier|pylon|cable|strut)(_\d+)?$/i.test(desc)
      || /(^|,)bridge:support=/.test(t) || /(^|,)man_made=(tower|mast|chimney)/.test(t)
    if (bridgePart) {
      verdict = 'BRIDGE STRUCTURE, not a building'
      /*
       * The Golden Gate and Bay Bridge towers are mapped as stacks of `building:part=yes` steel segments —
       * `description=leg_1`, `top_mast_3` — each with its own `height` and `min_height`. The heights are
       * RIGHT (a 298 m mast really is 298 m); the fault is that they carry a building tag at all, so the
       * classifier gives them a facade and they stand over the water as the tallest "buildings" in the city.
       * They are also drawn a second time by the bridge builders themselves, so this is a double-draw too.
       */
      why = `${desc || 'mast/support'} — a bridge tower segment; the height is right, it should not be a building`
    } else if (perStorey !== null && perStorey > 10) {
      const asFeet = h / FT
      const feetPerStorey = levels ? asFeet / levels : 0
      verdict = feetPerStorey >= 2.4 && feetPerStorey <= 6 ? 'FEET IN THE METRES FIELD' : 'height vs levels'
      why = verdict === 'FEET IN THE METRES FIELD'
        ? `${h} ft = ${asFeet.toFixed(0)} m over ${levels} storeys = ${feetPerStorey.toFixed(1)} m each, which is right`
        : `${perStorey.toFixed(1)} m per storey over ${levels} storeys — no real building is built that way`
    } else if (levels !== null && Math.abs(h - levels) < 0.5) {
      verdict = 'FLOORS IN THE METRES FIELD'
      why = `height equals building:levels (${h}); the building is probably ~${(h * 3.2).toFixed(0)} m`
    }
    rows.push({ id: `way/${id}`, name, h, levels, x: Math.round(x), z: Math.round(z), perStorey, verdict, why })
  }
}

rows.sort((a, b) => b.h - a.h)
const byVerdict = new Map<string, Row[]>()
for (const r of rows) byVerdict.set(r.verdict, [...(byVerdict.get(r.verdict) ?? []), r])

console.log(`${rows.length} buildings tagged >= ${MIN} m OUTSIDE the downtown core (${city})\n`)
for (const [v, list] of [...byVerdict].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`== ${v}: ${list.length}`)
  for (const r of list.slice(0, 12)) {
    console.log(`   ${String(Math.round(r.h)).padStart(4)} m  ${r.id.padEnd(16)} ${(r.name || '(unnamed)').slice(0, 30).padEnd(31)} ${r.why}`)
  }
  if (list.length > 12) console.log(`   ... and ${list.length - 12} more`)
  console.log()
}

const csv = arg('csv')
if (csv) {
  writeFileSync(resolve(ROOT, csv),
    'osm,name,height_m,levels,m_per_storey,x,z,verdict,why\n'
    + rows.map((r) => [r.id, `"${r.name.replace(/"/g, '')}"`, r.h, r.levels ?? '',
      r.perStorey?.toFixed(1) ?? '', r.x, r.z, r.verdict, `"${r.why}"`].join(',')).join('\n') + '\n')
  console.log(`→ ${csv}`)
}
