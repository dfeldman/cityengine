/**
 * GENERIC BUILDINGS STANDING INSIDE A MODEL (owner, 2026-11-16: "a persistent issue has been generic buildings heavily
 * overlapping a custom-rendered building. this is usually because the building has multiple parts, and the custom renderer
 * only claims one" — the zoo's Grande serre, 48.833382, 2.416707, with a cadastre way drawn through its glass).
 *
 *   npx tsx tools/model-box-claims.ts [city] [--fix] [--frac=0.6] [--review=0.3] [--json=out.json]
 *
 * tools/building-overlaps.ts measures a claiming entry by the rings it claims, so a model that draws MORE than it claims —
 * placed at a lat/lon with a `size` (render/landmarks.ts `atPoint`), or fitted to the box round one part of many — never
 * shows there: the unclaimed parts sit beside its claimed ring, not on it. This measures the model where it is DRAWN: the
 * same box render/landmarks.ts places it in (the `size` box at the point, turned by `front`/`rotateDeg`; otherwise the
 * minimum-area box round its claimed rings, which is what `fitTo`/`fitMinArea` give a builder), and lists every baked
 * building no model takes whose plan lies inside that box by `--frac` or more at heights the model also spans.
 *
 * `--fix` appends each such building's id to its entry's `osm` list, in place (text insertion, so the manifests keep their
 * formatting). Lines between `--review` and `--frac` are printed for a look but not fixed. A building inside two models'
 * boxes goes to the one it lies deeper in. Also lists ids an entry names that the bake does not have while the entry's
 * other ids are there — a typo, or a packed id written as a relation (the Grande serre's `relation/522886224` is
 * 2 × way/261443112).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { readV2 } from './bake-files.ts'
import { Projection } from '../src/city/geo.ts'

type P = { x: number; z: number }
interface Baked { id: number; ring: P[]; holes: P[][]; h: number; minH: number; partOf?: number; area: number; x0: number; x1: number; z0: number; z1: number }
interface Entry {
  name?: string; procedural?: string; file?: string; osm?: string | string[]; include?: string; restyle?: unknown; kind?: string
  lat?: number; lon?: number; size?: [number, number]; rotateDeg?: number; front?: number | string; height?: number; base?: number
  __file?: string
}

const args = process.argv.slice(2)
const city = args.find((a) => !a.startsWith('--')) ?? 'paris-centre'
const opt = (k: string, d: number): number => Number(args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d)
const FRAC = opt('frac', 0.6), REVIEW = opt('review', 0.3)
const FIX = args.includes('--fix')
const jsonOut = args.find((a) => a.startsWith('--json='))?.slice(7)
const ROOT = resolve(import.meta.dirname, '..')
const LM = resolve(ROOT, 'public/landmarks')
const lmRoot = args.find((a) => a.startsWith('--lm='))?.slice(5) ?? (city.startsWith('paris') ? 'paris' : city)

// ---- the bake
const v2 = readV2(city)
const proj = new Projection(v2.index.origin)
const area = (r: P[]): number => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p.x * q.z - q.x * p.z }, 0)) / 2
const buildings = new Map<number, Baked>()
for (const t of v2.tiles) for (const b of t.buildings ?? []) {
  if (buildings.has(b.id)) continue
  const ring: P[] = []
  for (let i = 0; i < b.ring.length; i += 2) ring.push({ x: b.ring[i], z: b.ring[i + 1] })
  const xs = ring.map((q) => q.x), zs = ring.map((q) => q.z)
  const holes = ((b as { holes?: number[][] }).holes ?? []).map((h) => { const o: P[] = []; for (let i = 0; i < h.length; i += 2) o.push({ x: h[i], z: h[i + 1] }); return o })
  buildings.set(b.id, { id: b.id, ring, holes, h: b.height ?? 10, minH: b.minHeight ?? 0, partOf: b.partOf, area: area(ring),
    x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) })
}
// a superseded outline's parts, by the outline
const partsOf = new Map<number, Baked[]>()
for (const b of buildings.values()) if (b.partOf !== undefined) (partsOf.get(b.partOf) ?? partsOf.set(b.partOf, []).get(b.partOf)!).push(b)

// ---- the manifests, each entry remembering its file
function entriesOf(file: string): Entry[] {
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Entry[] | { entries?: Entry[] }
  const list = Array.isArray(raw) ? raw : raw.entries ?? []
  return list.flatMap((e) => (e.include ? entriesOf(resolve(LM, e.include)) : [{ ...e, __file: file }]))
}
const entries = entriesOf(resolve(LM, `${lmRoot}.json`))
const idsOf = (e: Entry): number[] => (Array.isArray(e.osm) ? e.osm : e.osm ? [e.osm] : []).map((s) => {
  const [k, n] = s.split('/')
  return k === 'relation' ? 2 * Number(n) + 1 : Number(n)
})
/** areas, not buildings: they stand among buildings by design (tools/building-overlaps.ts's list) */
const AREA = /marina|harbo|yacht|plaza|park|deck|podium|court|garden|bridge|pier|square|steps|labyrinth|paddock|moorings|parvis|esplanade|dalle|passage|walk|canopy|skybridge|pergola/i
const models = entries.filter((e) => !e.restyle && (e.procedural || e.file))
const claimed = new Set<number>()
for (const e of models) for (const id of idsOf(e)) claimed.add(id)
const isClaimed = (b: Baked): boolean => claimed.has(b.id) || (b.partOf !== undefined && claimed.has(b.partOf))

// ---- geometry
function inside(r: P[], x: number, z: number): boolean {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i], b = r[j]
    if ((a.z > z) !== (b.z > z) && x < a.x + ((z - a.z) * (b.x - a.x)) / (b.z - a.z)) c = !c
  }
  return c
}
const rect = (cx: number, cz: number, hx: number, hz: number, rot: number): P[] => {
  const cos = Math.cos(rot), sin = Math.sin(rot)
  // model frame → world as Babylon's rotation.y turns it (tools/building-overlaps.ts)
  return [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([x, z]) => ({ x: cx + x * cos + z * sin, z: cz - x * sin + z * cos }))
}
/** the minimum-area box round a set of points, by a 1° sweep: near enough what the fitters give a builder */
function minBox(pts: P[]): P[] {
  let best: { a: number; r: P[] } | null = null
  for (let d = 0; d < 90; d++) {
    const t = (d * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t)
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
    for (const p of pts) { const u = p.x * c + p.z * s, v = -p.x * s + p.z * c; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v) }
    const a = (u1 - u0) * (v1 - v0)
    if (!best || a < best.a) best = { a, r: [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([u, v]) => ({ x: u * c - v * s, z: u * s + v * c })) }
  }
  return best!.r
}
/** the share of a building's plan inside a ring, on a 0.5 m raster */
function fracIn(b: Baked, r: P[]): number {
  const S = b.area > 4000 ? 1 : 0.5
  let n = 0, k = 0
  for (let x = b.x0 + S / 2; x < b.x1; x += S) for (let z = b.z0 + S / 2; z < b.z1; z += S) {
    if (!inside(b.ring, x, z)) continue
    n++
    if (inside(r, x, z)) k++
  }
  return n ? k / n : 0
}

function fracInAny(b: Baked, rs: Baked[]): number {
  const S = b.area > 4000 ? 1 : 0.5
  let n = 0, k = 0
  for (let x = b.x0 + S / 2; x < b.x1; x += S) for (let z = b.z0 + S / 2; z < b.z1; z += S) {
    if (!inside(b.ring, x, z)) continue
    n++
    if (rs.some((r) => inside(r.ring, x, z) && !r.holes.some((h) => inside(h, x, z)))) k++
  }
  return n ? k / n : 0
}

// ---- a spatial index over what the city still draws
const CELL = 40
const grid = new Map<string, Baked[]>()
for (const b of buildings.values()) {
  if (isClaimed(b)) continue
  for (let i = Math.floor(b.x0 / CELL); i <= Math.floor(b.x1 / CELL); i++) for (let j = Math.floor(b.z0 / CELL); j <= Math.floor(b.z1 / CELL); j++) {
    const k = `${i},${j}`
    ;(grid.get(k) ?? grid.set(k, []).get(k)!).push(b)
  }
}
function near(r: P[]): Set<Baked> {
  const x0 = Math.min(...r.map((q) => q.x)), x1 = Math.max(...r.map((q) => q.x)), z0 = Math.min(...r.map((q) => q.z)), z1 = Math.max(...r.map((q) => q.z))
  const out = new Set<Baked>()
  for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++) for (let j = Math.floor(z0 / CELL); j <= Math.floor(z1 / CELL); j++) {
    for (const b of grid.get(`${i},${j}`) ?? []) if (!(b.x1 < x0 || b.x0 > x1 || b.z1 < z0 || b.z0 > z1)) out.add(b)
  }
  return out
}
const at = (r: P[]): string => {
  const ll = proj.toLatLon({ x: r.reduce((s, q) => s + q.x, 0) / r.length, z: r.reduce((s, q) => s + q.z, 0) / r.length })
  return `${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}`
}

// ---- 1. each model's drawn box against what the city still draws
interface Hit { entry: Entry; b: Baked; frac: number; ring: number; boxArea: number; top: number; union: boolean }
const best = new Map<number, Hit>()
const broken: string[] = []
for (const e of models) {
  if (e.kind || AREA.test(`${e.name ?? ''} ${e.procedural ?? ''}`)) continue
  const ids = idsOf(e)
  // the claimed buildings themselves: a building standing in one's COURTYARD (a hole) is not inside it
  const owned: Baked[] = []
  for (const id of ids) {
    const b = buildings.get(id)
    if (b) owned.push(b)
    for (const p of partsOf.get(id) ?? []) owned.push(p)
  }
  const rings = owned.map((o) => o.ring)
  const missing = ids.filter((id) => !buildings.has(id) && !partsOf.has(id))
  if (missing.length && rings.length) broken.push(`  ${e.name} (${e.__file?.split('/').pop()}): ${missing.map((id) => (id % 2 ? `relation/${(id - 1) / 2} or way/${id}` : `way/${id}`)).join(', ')}`)
  let box: P[]
  if (e.lat !== undefined && e.lon !== undefined && e.size) {
    const c = proj.toLocal({ lat: e.lat, lon: e.lon })
    const rot = typeof e.front === 'number' ? ((e.front + 180) * Math.PI) / 180 : ((e.rotateDeg ?? 0) * Math.PI) / 180
    box = rect(c.x, c.z, e.size[0] / 2, e.size[1] / 2, rot)
  } else if (rings.length) {
    // fitted to the FIRST of its ids the bake has (render/landmarks.ts `placeOnce`), or to the union of an outline's parts
    const first = ids.map((id) => buildings.get(id)).find(Boolean)
    box = minBox(ids.some((id) => partsOf.has(id)) || !first ? rings.flat() : first.ring)
  } else continue
  const ownTop = Math.max(0, ...ids.map((id) => buildings.get(id)?.h ?? 0), ...ids.flatMap((id) => (partsOf.get(id) ?? []).map((p) => p.h)))
  const lo = e.base ?? 0, hi = lo + (e.height ?? (ownTop || 20))
  const boxArea = area(box)
  // fitted to the union of an outline's parts: every id it names joins the union and moves the fit (render/landmarks.ts
  // `claims`), so an id appended there is a change of model, not a claim
  const union = !(e.lat !== undefined && e.lon !== undefined) && ids.some((id) => partsOf.has(id))
  for (const b of near(box)) {
    if (b.minH >= hi - 0.5 || b.h <= lo + 0.5) continue
    if (b.area > boxArea * 1.5) continue   // a building bigger than the model is the model standing on or in it
    const frac = fracIn(b, box)
    if (frac < REVIEW) continue
    // inside the rings the entry already claims: OSM's own outline round it, the owner's case — not just inside a box
    const ring = owned.length ? fracInAny(b, owned) : 0
    const prev = best.get(b.id)
    if (!prev || ring > prev.ring || (ring === prev.ring && frac > prev.frac)) best.set(b.id, { entry: e, b, frac, ring, boxArea, top: hi, union })
  }
}

const hits = [...best.values()].sort((p, q) => q.frac * q.b.area - p.frac * p.b.area)
/*
 * Fixed: inside the claimed rings by --frac, not on the union path, and no more than 5 m over the model (a taller building
 * in its plan is a tower standing on it, the Gare Montparnasse's slabs). Everything else is for a look: a box-only hit may
 * be a court of a U plan (the Louvre's 104) or a building the model was never meant to take, and claiming a building the
 * model does not cover leaves bare ground, which is worse than the overlap.
 */
const fix = hits.filter((h) => h.ring >= FRAC && h.frac >= FRAC && !h.union && h.b.h <= h.top + 5)
const review = hits.filter((h) => !fix.includes(h) && (h.frac >= FRAC || h.ring >= REVIEW))
const line = (h: Hit): string => `  box ${String(Math.round(h.frac * 100)).padStart(3)}% ring ${String(Math.round(h.ring * 100)).padStart(3)}%${h.union ? ' U' : ''}  ${String(Math.round(h.b.area)).padStart(6)} m²  h ${h.b.minH ? `${h.b.minH}–` : ''}${h.b.h} (model ${h.top})  ${h.entry.name}  ×  ${h.b.id}   (${at(h.b.ring)})`
console.log(`\n== ${city}: unclaimed buildings inside a model's claimed rings, ≥ ${FRAC * 100}% — fixable: ${fix.length}`)
for (const h of fix) console.log(line(h))
console.log(`\n== for review (box-only ≥ ${FRAC * 100}%, a union-fitted entry, taller than the model, or ring ${REVIEW * 100}–${FRAC * 100}%) — ${review.length}`)
for (const h of review) console.log(line(h))
console.log(`\n== ids an entry names that the bake lacks (its other ids present) — ${broken.length}`)
for (const l of broken) console.log(l)
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(hits.map((h) => ({ entry: h.entry.name, file: h.entry.__file, id: h.b.id, frac: h.frac, ring: h.ring, union: h.union, h: h.b.h, top: h.top, fix: fix.includes(h), area: h.b.area, at: at(h.b.ring) })), null, 1))

// ---- 2. --fix: append the ids, in place
if (FIX) {
  /*
   * A baked id is a way's, or a relation's packed `2n + 1` (tools/bake.ts) — and way ids are any integer, so an odd id may
   * be either. Each odd id is looked up in the city's OSM extract: a way of that id with a building tag is a way, else the
   * relation. Even ids are always ways.
   */
  const pbf = resolve(ROOT, 'tools/cache/osm', city.startsWith('paris') ? 'ile-de-france-latest.osm.pbf' : 'norcal-latest.osm.pbf')
  const odd = [...new Set(fix.map((h) => h.b.id).filter((id) => id % 2))]
  const ways = new Set<number>()
  if (odd.length) {
    const list = resolve(tmpdir(), `model-box-claims-${process.pid}.txt`)
    writeFileSync(list, odd.map((id) => `w${id}`).join('\n'))
    const run = spawnSync('osmium', ['getid', '-i', list, pbf, '-f', 'opl'], { encoding: 'utf8', maxBuffer: 1 << 28 })
    // (getid exits 1 when some ids are missing, which is the point; anything else is no answer, and an unanswered odd id
    //  would be written as a relation)
    if (run.error || (run.status !== 0 && run.status !== 1)) throw new Error(`osmium getid failed: ${run.error ?? run.stderr}`)
    const out = run.stdout
    for (const l of out.split('\n')) if (/ T.*building/.test(l)) ways.add(Number(l.slice(1, l.indexOf(' '))))
  }
  const ref = (id: number): string => (id % 2 && !ways.has(id) ? `relation/${(id - 1) / 2}` : `way/${id}`)
  const byFile = new Map<string, Hit[]>()
  for (const h of fix) (byFile.get(h.entry.__file!) ?? byFile.set(h.entry.__file!, []).get(h.entry.__file!)!).push(h)
  let n = 0
  for (const [file, list] of byFile) {
    let text = readFileSync(file, 'utf8')
    // by entry, not name: names repeat within a file (civic.json has two Hôtels de Breteuil)
    const byEntry = new Map<Entry, number[]>()
    for (const h of list) (byEntry.get(h.entry) ?? byEntry.set(h.entry, []).get(h.entry)!).push(h.b.id)
    for (const [own, ids] of byEntry) {
      const name = own.name!
      const key = JSON.stringify(name)
      // the entry is the object round its name, from the `{` before it to its matching `}` — the one that also carries
      // the entry's own first ref, as a repeated name is found more than once
      const firstRef = (Array.isArray(own.osm) ? own.osm[0] : own.osm) ?? null
      let s = -1, t = -1
      for (const re = new RegExp(`"name":\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'); ;) {
        const m = re.exec(text)
        if (!m) break
        let a = m.index
        for (let d = 0; a > 0; a--) { if (text[a] === '}') d++; else if (text[a] === '{') { if (d === 0) break; d-- } }
        let b = a + 1
        for (let d = 0, q = false; b < text.length; b++) {
          const ch = text[b]
          if (q) { if (ch === '\\') b++; else if (ch === '"') q = false; continue }
          if (ch === '"') q = true; else if (ch === '{') d++; else if (ch === '}') { if (d === 0) break; d-- }
        }
        if (firstRef === null || text.slice(a, b + 1).includes(JSON.stringify(firstRef))) { s = a; t = b; break }
      }
      if (s < 0) { console.warn(`  ! ${name}: not found in ${file}`); continue }
      const body = text.slice(s, t + 1)
      const refs = ids.map((id) => JSON.stringify(ref(id)))
      let next: string
      const m = body.match(/("osm":\s*\[)([^\]]*)\]/)
      if (m) {
        const head = m[1], inner = m[2]
        const multi = inner.includes('\n')
        const indent = multi ? (inner.match(/\n(\s*)"/)?.[1] ?? '      ') : ''
        const close = multi ? (inner.match(/\n(\s*)$/)?.[1] ?? '    ') : ''
        const items = inner.trim().replace(/,\s*$/, '')
        const sep = /",\s"/.test(inner) ? ', ' : /","/.test(inner) ? ',' : head.endsWith(' [') || head.includes(': ') ? ', ' : ','
        const added = items ? (multi ? `${items},\n${indent}${refs.join(`,\n${indent}`)}` : `${items}${sep}${refs.join(sep)}`) : refs.join(sep)
        next = body.replace(m[0], multi ? `${head}\n${indent}${added}\n${close}]` : `${head}${added}]`)
      } else if (/"osm":\s*"/.test(body)) {
        next = body.replace(/"osm":\s*("[^"]*")/, (_, one) => `"osm": [${one}, ${refs.join(', ')}]`)
      } else {
        const ind = body.match(/\n(\s*)"name"/)?.[1]
        next = ind !== undefined ? body.replace(/\n(\s*)"name"/, `\n${ind}"osm": [${refs.join(', ')}],\n${ind}"name"`) : body.replace(/"name"/, `"osm": [${refs.join(', ')}], "name"`)
      }
      text = text.slice(0, s) + next + text.slice(t + 1)
      n += ids.length
    }
    JSON.parse(text)   // refuse to write a manifest that no longer parses
    writeFileSync(file, text)
  }
  console.log(`\nfixed: ${n} ids added across ${byFile.size} files`)
}
