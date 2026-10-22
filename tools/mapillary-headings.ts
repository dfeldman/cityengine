/**
 * How far to trust a Mapillary frame's heading, measured from the cache alone (no requests).
 *
 * A frame's direction can come from three places: the phone's compass (`compass_angle`, in the vector tile), Mapillary's
 * structure-from-motion (`computed_compass_angle`, from the Graph API, cached when a frame was shortlisted), or the
 * direction the camera was MOVING — the bearing from the frame before it to the frame after it in its own sequence
 * (owner, 2026-10-21: "it's not like someone is hand-taking these pictures, they're driving around"). None is ground
 * truth, but they fail differently: the compass by tens of degrees among steel buildings, the motion bearing at a
 * standstill or a turn, the SfM only where a sequence was never reconstructed. Where two independent ones agree, both
 * are probably right; this prints how often each pair does.
 *
 *   node --experimental-strip-types tools/mapillary-headings.ts
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CACHE = resolve(import.meta.dirname, 'cache', 'mapillary')
const Z = 14
const lonLat = (x: number, y: number, px: number, py: number, extent: number): [number, number] => {
  const n = 2 ** Z
  const lon = ((x + px / extent) / n) * 360 - 180
  const t = Math.PI * (1 - (2 * (y + py / extent)) / n)
  return [(Math.atan(Math.sinh(t)) * 180) / Math.PI, lon]
}

const { VectorTile } = await import('@mapbox/vector-tile')
const { PbfReader } = await import('pbf')
type F = { id: string; lat: number; lon: number; compass?: number; pano: boolean; seq?: string; t?: number }
const frames = new Map<string, F>()
const keys = new Map<string, number>()
for (const f of readdirSync(CACHE)) {
  const m = f.match(/^14-(\d+)-(\d+)\.mvt$/)
  if (!m) continue
  const layer = new VectorTile(new PbfReader(readFileSync(resolve(CACHE, f)))).layers.image
  if (!layer) continue
  for (let i = 0; i < layer.length; i++) {
    const ft = layer.feature(i)
    const g = ft.loadGeometry()[0]?.[0]
    if (!g) continue
    const p = ft.properties as Record<string, unknown>
    for (const k of Object.keys(p)) keys.set(k, (keys.get(k) ?? 0) + 1)
    const [lat, lon] = lonLat(Number(m[1]), Number(m[2]), g.x, g.y, layer.extent)
    frames.set(String(p.id), { id: String(p.id), lat, lon, compass: p.compass_angle as number | undefined, pano: p.is_pano === true,
      seq: p.sequence_id as string | undefined, t: p.captured_at as number | undefined })
  }
}
const all = [...frames.values()]
console.log(`${all.length} frames; ${all.filter((f) => f.pano).length} panoramas, ${all.filter((f) => !f.pano).length} flat`)

// the motion bearing: from the frame before to the frame after, in the same sequence, close in time and space
const M = 111320
const metres = (a: F, b: F): [number, number] => [(b.lon - a.lon) * M * Math.cos((a.lat * Math.PI) / 180), (b.lat - a.lat) * M]
const bySeq = new Map<string, F[]>()
for (const f of all) if (f.seq && f.t) (bySeq.get(f.seq) ?? bySeq.set(f.seq, []).get(f.seq)!).push(f)
const motion = new Map<string, number>()
for (const l of bySeq.values()) {
  l.sort((a, b) => a.t! - b.t!)
  for (let i = 1; i + 1 < l.length; i++) {
    const a = l[i - 1], b = l[i + 1]
    if (b.t! - a.t! > 12000) continue                          // a pause or a gap: no reliable direction
    const [dx, dy] = metres(a, b)
    const d = Math.hypot(dx, dy)
    if (d < 3 || d > 60) continue                              // standing still, or a jump
    // and not on a turn: the two halves within 20 degrees of each other
    const [ax, ay] = metres(a, l[i]), [bx, by] = metres(l[i], b)
    const h1 = Math.atan2(ax, ay), h2 = Math.atan2(bx, by)
    if (Math.hypot(ax, ay) > 1 && Math.hypot(bx, by) > 1 && Math.abs(((h2 - h1) * 180 / Math.PI + 540) % 360 - 180) > 20) continue
    motion.set(l[i].id, ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360)
  }
}
console.log(`motion bearing for ${motion.size} frames (${Math.round((100 * motion.size) / all.length)}%)`)

// the SfM heading, wherever the cache holds one
const sfm = new Map<string, number>()
for (const f of readdirSync(CACHE)) {
  if (!f.endsWith('.json')) continue
  try {
    const j = JSON.parse(readFileSync(resolve(CACHE, f), 'utf8')) as { id?: string; computed_compass_angle?: number; computed_geometry?: unknown }
    // only a frame Mapillary actually reconstructed: without a computed position its computed heading is the compass again
    if (j.id && j.computed_compass_angle !== undefined && j.computed_geometry) sfm.set(String(j.id), j.computed_compass_angle)
  } catch { /* a partial write */ }
}
console.log(`SfM heading for ${sfm.size} frames`)

const diff = (a: number, b: number): number => ((a - b + 540) % 360) - 180
const pct = (xs: number[], q: number): number => { const s = [...xs].sort((p, r) => p - r); return s[Math.min(s.length - 1, Math.floor(q * s.length))] }
const report = (name: string, ds: number[]): void => {
  if (ds.length === 0) { console.log(`${name}: none`); return }
  const a = ds.map(Math.abs)
  const within = (t: number): string => `${Math.round((100 * a.filter((v) => v <= t).length) / a.length)}%`
  console.log(`${name.padEnd(42)} n=${String(ds.length).padStart(7)}  median ${pct(a, 0.5).toFixed(1)}°  p90 ${pct(a, 0.9).toFixed(1)}°  ≤5° ${within(5)}  ≤15° ${within(15)}  ≤30° ${within(30)}`)
}
for (const pano of [false, true]) {
  const kind = pano ? 'panoramas' : 'flat'
  const fs = all.filter((f) => f.pano === pano)
  report(`compass vs motion, ${kind}`, fs.filter((f) => f.compass !== undefined && motion.has(f.id)).map((f) => diff(f.compass!, motion.get(f.id)!)))
  report(`SfM vs motion, ${kind}`, fs.filter((f) => sfm.has(f.id) && motion.has(f.id)).map((f) => diff(sfm.get(f.id)!, motion.get(f.id)!)))
  report(`compass vs SfM, ${kind}`, fs.filter((f) => f.compass !== undefined && sfm.has(f.id)).map((f) => diff(f.compass!, sfm.get(f.id)!)))
}
// a panorama's centre need not face forward: is the offset from the motion bearing constant along a sequence?
const offs = new Map<string, number[]>()
for (const f of all) if (f.pano && f.seq && f.compass !== undefined && motion.has(f.id)) (offs.get(f.seq) ?? offs.set(f.seq, []).get(f.seq)!).push(diff(f.compass, motion.get(f.id)!))
const spread: number[] = []
const centres: number[] = []
for (const l of offs.values()) {
  if (l.length < 8) continue
  const m = pct(l, 0.5)
  centres.push(Math.round(m / 15) * 15)
  for (const v of l) spread.push(diff(v, m))
}
report('pano compass about its sequence median', spread)
const hist = new Map<number, number>()
for (const c of centres) hist.set(c, (hist.get(c) ?? 0) + 1)
console.log('pano sequences by median offset (15° bins):', [...hist].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}°:${v}`).join('  '))

/*
 * THE ESTIMATE: a panorama's heading as its motion bearing plus its sequence's own offset — the median of (compass −
 * motion) along the sequence, which a noisy compass cannot move far. Scored against the reconstructed (SfM) frames,
 * with the raw compass beside it.
 */
const seqOff = new Map<string, number>()
for (const [k, l] of offs) if (l.length >= 5) seqOff.set(k, pct(l, 0.5))
const est = (f: F): number | null => (f.seq && motion.has(f.id) && seqOff.has(f.seq) ? (motion.get(f.id)! + seqOff.get(f.seq)! + 360) % 360 : null)
const truth = all.filter((f) => f.pano && sfm.has(f.id))
report('raw compass vs SfM (reconstructed panos)', truth.filter((f) => f.compass !== undefined).map((f) => diff(f.compass!, sfm.get(f.id)!)))
report('motion+sequence offset vs SfM', truth.filter((f) => est(f) !== null).map((f) => diff(est(f)!, sfm.get(f.id)!)))
console.log(`  the estimate exists for ${Math.round((100 * all.filter((f) => f.pano && est(f) !== null).length) / all.filter((f) => f.pano).length)}% of all panoramas`)

// motion alone, and motion plus the offset the sequence's OTHER reconstructed frames show (leave one out)
report('motion alone vs SfM', truth.filter((f) => motion.has(f.id)).map((f) => diff(motion.get(f.id)!, sfm.get(f.id)!)))
const sfmOff = new Map<string, { id: string; d: number }[]>()
for (const f of truth) if (f.seq && motion.has(f.id)) (sfmOff.get(f.seq) ?? sfmOff.set(f.seq, []).get(f.seq)!).push({ id: f.id, d: diff(sfm.get(f.id)!, motion.get(f.id)!) })
const loo: number[] = []
let fallback = 0
for (const f of truth) {
  if (!f.seq || !motion.has(f.id)) continue
  const others = (sfmOff.get(f.seq) ?? []).filter((o) => o.id !== f.id).map((o) => o.d)
  const off = others.length >= 2 ? pct(others, 0.5) : (fallback++, 0)
  loo.push(diff((motion.get(f.id)! + off + 360) % 360, sfm.get(f.id)!))
}
report('motion + other frames\' SfM offset vs SfM', loo)
console.log(`  (${fallback} with no reconstructed neighbours fell back to motion alone)`)
