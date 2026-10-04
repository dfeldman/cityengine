/**
 * MODELS DRAWN INTO EACH OTHER, AND INTO THE CITY'S BUILDINGS — measured from what is actually DRAWN (owner,
 * 2026-10-03: "another custom building intersecting a generic building. we should audit for these").
 *
 *   node --experimental-strip-types tools/drawn-overlaps.ts [--city=san-francisco] [--box=lat0,lon0,lat1,lon1]
 *
 * Needs the dev server (SHOTS_BASE, default http://localhost:5200). For every landmark placed in the box (the page's
 * `__placed()`, swept tile by tile) the probe reads the model's mesh and rasterises its PLAN — every triangle more
 * than 1.5 m over the model's foot, walls seen edge-on traced as lines — into 1 m cells. Then, offline:
 *
 *   1. MODEL × MODEL: two models whose plans share cells. The common cause (the first audit's 22 conflicts): an
 *      entry fitted to an OUTLINE whose `building:part`s another entry models — render/landmarks.ts now leaves such a
 *      part out of the outline's union (`ownedBy`), and what remains here is two neighbours' walls in one plane.
 *   2. MODEL × CITY: a baked building no entry takes away (not claimed, not a part of a claimed outline) whose
 *      footprint the model's plan covers by 12 m² and 15% or more.
 *
 * Not every line is a defect — San Francisco's buildings touch, and some stand on others — but a line at a high
 * percentage almost always is. Writes docs/review/<city>-drawn-overlaps.txt and prints the top of it.
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'

const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
const arg = (k: string): string | undefined => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3)
const city = arg('city') ?? 'san-francisco'
// default: downtown San Francisco, Civic Center to the Embarcadero
const [lat0, lon0, lat1, lon1] = (arg('box') ?? '37.775,-122.420,37.800,-122.388').split(',').map(Number)
const ROOT = resolve(import.meta.dirname, '..')
const AREA = /marina|harbo|yacht|plaza|park|deck|podium|court|garden|bridge|pier|square|steps|labyrinth|paddock|turntable|sign|fountain|statue|monument|esplanade/i

interface Placed { name: string; x: number; z: number; height: number }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const plans = new Map<string, Set<string>>()
const placed = new Map<string, Placed>()
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } })
  page.on('pageerror', (e) => console.log('page threw:', e.message.slice(0, 160)))
  await page.goto(`${BASE}/?city=${city}&freeze=1&without=life`)
  await page.waitForFunction('window.gameReady === true', null, { timeout: 240000 })
  // ---- what is placed in the box: sweep it 300 m at a time
  for (let la = lat0; la <= lat1; la += 0.0027) for (let lo = lon0; lo <= lon1; lo += 0.0034) {
    await page.evaluate(([a, o]) => (window as never as { __view: (f: number[], t: number[]) => void }).__view([a - 0.002, o, 120], [a, o, 0]), [la, lo])
    await page.waitForTimeout(600)
    await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 90000 }).catch(() => {})
    for (const l of await page.evaluate('window.__placed()') as Placed[]) if (!AREA.test(l.name) && l.height >= 6) placed.set(l.name, l)
  }
  console.log(`${placed.size} building landmarks placed in the box`)
  // ---- each one's drawn plan
  for (const t of placed.values()) {
    await page.evaluate(([x, z]) => (window as never as { __viewLocal: (f: number[], t: number[]) => void }).__viewLocal([x + 60, 60, z + 60], [x, 0, z]), [t.x, t.z])
    const ok = await page.waitForFunction((n) => (window as never as { __scene: { meshes: { name: string }[] } }).__scene.meshes.some((m) => m.name === `landmark:${n}`), t.name, { timeout: 25000 }).then(() => true).catch(() => false)
    if (!ok) { console.log('  not drawn:', t.name); continue }
    const cells = await page.evaluate((n) => {
      type M = { name: string; computeWorldMatrix(f: boolean): void; getVerticesData(k: string): number[]; getIndices(): number[]; getWorldMatrix(): { m: number[] } }
      const m = (window as never as { __scene: { meshes: M[] } }).__scene.meshes.find((q) => q.name === `landmark:${n}`)!
      m.computeWorldMatrix(true)
      const pos = m.getVerticesData('position'), idx = m.getIndices(), W = m.getWorldMatrix().m
      const P = (i: number): number[] => { const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]; return [x * W[0] + y * W[4] + z * W[8] + W[12], x * W[1] + y * W[5] + z * W[9] + W[13], x * W[2] + y * W[6] + z * W[10] + W[14]] }
      let base = Infinity
      for (let i = 0; i < pos.length / 3; i++) base = Math.min(base, P(i)[1])
      const set = new Set<string>()
      for (let t = 0; t < idx.length; t += 3) {
        const a = P(idx[t]), b = P(idx[t + 1]), c = P(idx[t + 2])
        if (Math.max(a[1], b[1], c[1]) < base + 1.5) continue
        const d = (b[2] - c[2]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[2] - c[2])
        if (Math.abs(d) < 0.05) {
          // a wall seen edge-on: the cells along its line, not its bounding box
          for (const [p, q] of [[a, b], [b, c], [c, a]]) {
            const n = Math.ceil(Math.hypot(q[0] - p[0], q[2] - p[2]) / 0.5) + 1
            for (let k = 0; k <= n; k++) set.add(`${Math.floor(p[0] + ((q[0] - p[0]) * k) / n)},${Math.floor(p[2] + ((q[2] - p[2]) * k) / n)}`)
          }
          continue
        }
        const x0 = Math.floor(Math.min(a[0], b[0], c[0])), x1 = Math.floor(Math.max(a[0], b[0], c[0]))
        const z0 = Math.floor(Math.min(a[2], b[2], c[2])), z1 = Math.floor(Math.max(a[2], b[2], c[2]))
        for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
          const px = x + 0.5, pz = z + 0.5
          const l1 = ((b[2] - c[2]) * (px - c[0]) + (c[0] - b[0]) * (pz - c[2])) / d
          const l2 = ((c[2] - a[2]) * (px - c[0]) + (a[0] - c[0]) * (pz - c[2])) / d
          if (l1 >= -0.05 && l2 >= -0.05 && 1 - l1 - l2 >= -0.05) set.add(`${x},${z}`)
        }
      }
      return [...set]
    }, t.name)
    plans.set(t.name, new Set(cells))
  }
} finally { await browser.close() }

// ---- the city's buildings, and what the manifests take away
type P = { x: number; z: number }
const index = JSON.parse(readFileSync(resolve(ROOT, 'public/cities', city, 'v3/index.json'), 'utf8')) as { origin: { lat: number; lon: number } }
const proj = new Projection(index.origin)
const LM = resolve(ROOT, 'public/landmarks')
interface Entry { osm?: string | string[]; include?: string; restyle?: string }
const entriesOf = (f: string): Entry[] => {
  const raw = JSON.parse(readFileSync(f, 'utf8')) as Entry[] | { entries?: Entry[] }
  return (Array.isArray(raw) ? raw : raw.entries ?? []).flatMap((e) => (e.include ? entriesOf(resolve(LM, e.include)) : [e]))
}
const claimed = new Set<number>()
for (const e of entriesOf(resolve(LM, `${city}.json`))) {
  if (e.restyle) continue
  for (const s of Array.isArray(e.osm) ? e.osm : e.osm ? [e.osm] : []) { const [k, n] = s.split('/'); claimed.add(k === 'relation' ? 2 * Number(n) + 1 : Number(n)) }
}
const tilesDir = resolve(ROOT, 'public/cities', city, 'tiles')
const wantTiles = new Set<string>()
for (const s of plans.values()) for (const c of s) { const [x, z] = c.split(',').map(Number); wantTiles.add(`${Math.floor(x / 200)}_${Math.floor(z / 200)}`) }
const city_ = new Map<number, { ring: P[]; h: number; minH: number }>()
for (const k of wantTiles) {
  const f = resolve(tilesDir, `${k}.json`)
  if (!existsSync(f)) continue
  const t = JSON.parse(readFileSync(f, 'utf8')) as { buildings?: { id: number; ring: number[]; height?: number; minHeight?: number; partOf?: number }[] }
  for (const b of t.buildings ?? []) {
    if (claimed.has(b.id) || (b.partOf !== undefined && claimed.has(b.partOf)) || city_.has(b.id)) continue
    const ring: P[] = []
    for (let i = 0; i < b.ring.length; i += 2) ring.push({ x: b.ring[i], z: b.ring[i + 1] })
    city_.set(b.id, { ring, h: b.height ?? 10, minH: b.minHeight ?? 0 })
  }
}
const inside = (r: P[], x: number, z: number): boolean => {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a.z > z) !== (b.z > z) && x < a.x + ((z - a.z) * (b.x - a.x)) / (b.z - a.z)) c = !c }
  return c
}
const at = (cells: string[]): string => {
  let sx = 0, sz = 0
  for (const c of cells) { const [x, z] = c.split(',').map(Number); sx += x + 0.5; sz += z + 0.5 }
  const ll = proj.toLatLon({ x: sx / cells.length, z: sz / cells.length })
  return `${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}`
}

const lines: string[] = []
// ---- 1. model × model
const names = [...plans.keys()]
const pairs: { a: string; b: string; n: number; frac: number; at: string }[] = []
for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
  const A = plans.get(names[i])!, B = plans.get(names[j])!
  const pa = placed.get(names[i])!, pb = placed.get(names[j])!
  if (Math.hypot(pa.x - pb.x, pa.z - pb.z) > 250) continue
  const [small, big] = A.size < B.size ? [A, B] : [B, A]
  const common = [...small].filter((c) => big.has(c))
  if (common.length >= 8) pairs.push({ a: names[i], b: names[j], n: common.length, frac: common.length / small.size, at: at(common) })
}
pairs.sort((p, q) => q.frac - p.frac || q.n - p.n)
lines.push(`== MODEL × MODEL — ${pairs.length} (shared plan, m²; share of the smaller)`)
for (const p of pairs) lines.push(`  ${String(p.n).padStart(5)} m²  ${String(Math.round(p.frac * 100)).padStart(3)}%  ${p.a}  ×  ${p.b}   (${p.at})`)
// ---- 2. model × city
const hits: { a: string; id: number; n: number; frac: number; at: string }[] = []
for (const [name, cells] of plans) {
  const height = placed.get(name)!.height
  const xs = [...cells].map((c) => Number(c.split(',')[0])), zs = [...cells].map((c) => Number(c.split(',')[1]))
  const bx = { x0: Math.min(...xs), x1: Math.max(...xs) + 1, z0: Math.min(...zs), z1: Math.max(...zs) + 1 }
  for (const [id, b] of city_) {
    if (b.minH >= height - 1) continue
    const rx = b.ring.map((q) => q.x), rz = b.ring.map((q) => q.z)
    if (Math.max(...rx) < bx.x0 || Math.min(...rx) > bx.x1 || Math.max(...rz) < bx.z0 || Math.min(...rz) > bx.z1) continue
    let tot = 0
    const common: string[] = []
    for (let x = Math.floor(Math.min(...rx)); x <= Math.floor(Math.max(...rx)); x++) for (let z = Math.floor(Math.min(...rz)); z <= Math.floor(Math.max(...rz)); z++) {
      if (!inside(b.ring, x + 0.5, z + 0.5)) continue
      tot++
      if (cells.has(`${x},${z}`)) common.push(`${x},${z}`)
    }
    if (common.length >= 12 && common.length / Math.max(1, tot) >= 0.15) hits.push({ a: name, id, n: common.length, frac: common.length / tot, at: at(common) })
  }
}
hits.sort((p, q) => q.frac - p.frac || q.n - p.n)
lines.push('', `== MODEL × CITY — ${hits.length} (a baked building nothing takes away, inside a model's plan: m²; share of the building)`)
for (const h of hits) lines.push(`  ${String(h.n).padStart(5)} m²  ${String(Math.round(h.frac * 100)).padStart(3)}%  ${h.a}  ×  ${h.id}   (${h.at})`)

const out = resolve(ROOT, 'docs/review', `${city}-drawn-overlaps.txt`)
writeFileSync(out, `drawn-overlap audit, ${new Date().toISOString().slice(0, 10)} — tools/drawn-overlaps.ts\n\n${lines.join('\n')}\n`)
console.log(lines.slice(0, 40).join('\n'))
console.log(`\n→ ${out}`)
