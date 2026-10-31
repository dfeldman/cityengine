/**
 * A model that stands inside the generic buildings it should have replaced (owner, 2026-10-30: "for bibliotheque national we are
 * rendering a generic building WITH the custom towers on top of it", and Saint-Eustache, a Haussmann block through the nave). OSM
 * maps a great building as an outline and separate parts, not always in one relation, and an entry claims what its author found:
 * the rest stood on. This finds every building of the bake lying inside an outline an entry claims and claimed by nobody, and adds
 * it to the entry. Rerun after a bake, and before tools/paris-civic.ts, which leaves claimed ways alone.
 *   node --experimental-strip-types tools/paris-claims.ts [--dry]
 */
import { execFileSync } from 'node:child_process'
import { createReadStream, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

const ROOT = resolve(import.meta.dirname, '..')
const dry = process.argv.includes('--dry')
const X = (lon: number): number => (lon - 2.332) * 73270
const Z = (lat: number): number => (lat - 48.8605) * 111320
type Ring = [number, number][]
const inside = (r: Ring, x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i][1] > z) !== (r[j][1] > z) && x < ((r[j][0] - r[i][0]) * (z - r[i][1])) / (r[j][1] - r[i][1]) + r[i][0]) o = !o
  }
  return o
}

// every building's outline in OSM, by ref: the bake has dropped the outlines its parts supersede
const dir = mkdtempSync(resolve(tmpdir(), 'claims-'))
const box = resolve(dir, 'box.pbf'), bld = resolve(dir, 'b.pbf')
execFileSync('osmium', ['extract', '-b', '2.20,48.80,2.43,48.92', '--overwrite', '-o', box, resolve(ROOT, 'tools/cache/osm/ile-de-france-latest.osm.pbf')], { stdio: 'ignore' })
execFileSync('osmium', ['tags-filter', box, 'a/building', 'a/building:part', 'a/man_made', 'a/amenity', 'a/tourism', 'a/historic', '--overwrite', '-o', bld], { stdio: 'ignore' })
const seq = resolve(dir, 'b.geojsonseq')
execFileSync('osmium', ['export', bld, '-f', 'geojsonseq', '--add-unique-id=type_id', '--overwrite', '-o', seq], { stdio: 'ignore' })
const outlines = new Map<string, Ring[]>()
// (line by line: all of the box's buildings are too long for one string)
for await (const l of createInterface({ input: createReadStream(seq) })) {
  const s = l.replace(/^\x1e/, '').trim()
  if (!s) continue
  const f = JSON.parse(s) as { id?: string; geometry: { type: string; coordinates: number[][][][] } }
  if (f.geometry.type !== 'MultiPolygon' && f.geometry.type !== 'Polygon') continue
  const n = Number(String(f.id).slice(1))
  const ref = n % 2 === 0 ? `way/${n / 2}` : `relation/${(n - 1) / 2}`
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates as unknown as number[][][]] : f.geometry.coordinates
  outlines.set(ref, polys.map((p) => p[0].map(([lo, la]) => [X(lo), Z(la)] as [number, number])))
}
rmSync(dir, { recursive: true, force: true })

interface Entry { name?: string; osm?: string | string[]; procedural?: string; restyle?: string }
const FILES = ['stations', 'palaces', 'monuments', 'venues', 'museums', 'rivegauche', 'minor', 'batch1', 'bugs', 'batch2', 'batch3', 'batch4', 'batch5', 'extras', 'civic']
const files = new Map(FILES.map((f) => [f, JSON.parse(readFileSync(resolve(ROOT, `public/landmarks/paris/${f}.json`), 'utf8')) as Entry[]]))
const top = JSON.parse(readFileSync(resolve(ROOT, 'public/landmarks/paris.json'), 'utf8')) as Entry[]
const refsOf = (e: Entry): string[] => (e.osm === undefined ? [] : Array.isArray(e.osm) ? e.osm : [e.osm])
const packed = (ref: string): number => { const [k, n] = ref.split('/'); return k === 'relation' ? Number(n) * 2 + 1 : Number(n) }
const refOf = (id: number): string => (id > 2e11 ? `relation/${(id - 1) / 2}` : `way/${id}`)
const all = [...[...files.values()].flat(), ...top].filter((e) => e.osm !== undefined)
const taken = new Set(all.flatMap((e) => refsOf(e).map(packed)))

const pkg = JSON.parse(readFileSync(resolve(ROOT, 'tools/cache/bake/paris-centre/package.json'), 'utf8')) as { origin: { lat: number; lon: number }; buildings: { id: number; ring: number[]; partOf?: number; height?: number }[] }
const mx = 111320 * Math.cos((pkg.origin.lat * Math.PI) / 180)
const toX = (x: number): number => X(pkg.origin.lon + x / mx)
const toZ = (z: number): number => Z(pkg.origin.lat + z / 111320)

// the claimed outlines, indexed
const CELL = 100
const grid = new Map<string, { e: Entry; ring: Ring }[]>()
for (const e of all) {
  // (a model, not a restyle: a restyle dresses what is there, and a generic block is what it is)
  if (!e.procedural) continue
  for (const ref of refsOf(e)) for (const ring of outlines.get(ref) ?? []) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const [x, z] of ring) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z) }
    for (let a = Math.floor(x0 / CELL); a <= Math.floor(x1 / CELL); a++) for (let b = Math.floor(z0 / CELL); b <= Math.floor(z1 / CELL); b++) {
      const k = `${a},${b}`
      ;(grid.get(k) ?? grid.set(k, []).get(k)!).push({ e, ring })
    }
  }
}
const added = new Map<Entry, string[]>()
for (const b of pkg.buildings) {
  if (taken.has(b.id) || (b.partOf !== undefined && taken.has(b.partOf))) continue
  const ring: Ring = []
  for (let i = 0; i < b.ring.length; i += 2) ring.push([toX(b.ring[i]), toZ(b.ring[i + 1])])
  const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length
  for (const { e, ring: r } of grid.get(`${Math.floor(cx / CELL)},${Math.floor(cz / CELL)}`) ?? []) {
    // nearly all of it inside: a neighbour leaning over the line is a neighbour
    if (!inside(r, cx, cz) || ring.filter((p) => inside(r, p[0], p[1])).length < ring.length * 0.7) continue
    ;(added.get(e) ?? added.set(e, []).get(e)!).push(refOf(b.id))
    break
  }
}
let n = 0
for (const [e, refs] of [...added].sort((p, q) => q[1].length - p[1].length)) {
  n += refs.length
  console.log(`${String(refs.length).padStart(4)}  ${e.name}`)
  if (!dry) e.osm = [...refsOf(e), ...refs]
}
console.log(`${n} buildings in ${added.size} entries`)
if (!dry) {
  for (const [f, d] of files) writeFileSync(resolve(ROOT, `public/landmarks/paris/${f}.json`), `${JSON.stringify(d, null, f === 'civic' ? 1 : 2)}\n`)
  writeFileSync(resolve(ROOT, 'public/landmarks/paris.json'), `${JSON.stringify(top, null, 2)}\n`)
}
