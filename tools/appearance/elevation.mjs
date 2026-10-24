// For each labelled building: stand square in front of its street wall and shoot the city with and without ?labels=1 (appearance research).
// node tools/appearance/elevation.mjs <outdir> <id,id,...>   (needs the dev server on :5200)
// SHOTS=base,look,imputed picks the renders: the generics, the photo labels, the appearance model (default base,look)
import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const ROOT = '/Users/dfeldman/cityengine/'
const OUT = process.argv[2]
// even light (most frames are overcast or in shade), and nothing parked or growing in front of the wall
const SCENE = 'weather=overcast&traffic=none&cars=0&without=trees,plants,furniture,crowd,rider,life'
mkdirSync(OUT, { recursive: true })
const ids = process.argv[3].split(',')
const pkg = JSON.parse(readFileSync(ROOT + 'tools/cache/bake/san-francisco/package.json', 'utf8'))
const by = new Map(pkg.buildings.map((b) => [b.id, b]))
const roads = []
for (const e of pkg.edges) if (!e.foot) for (let k = 0; k < e.points.length; k += 2) roads.push([e.points[k], e.points[k + 1], e.id])
const nearest = (x, z) => { let bd = Infinity, id = null; for (const [rx, rz, i] of roads) { const d = Math.hypot(rx - x, rz - z); if (d < bd) { bd = d; id = i } } return [bd, id] }
// point in any other building's footprint (the buildings near it: a coarse grid over the bake)
const cell = (x, z) => `${Math.floor(x / 50)},${Math.floor(z / 50)}`
const grid = new Map()
for (const b of pkg.buildings) {
  const n = b.ring.length / 2
  let x = 0, z = 0
  for (let i = 0; i < n; i++) { x += b.ring[2 * i]; z += b.ring[2 * i + 1] }
  const k = cell(x / n, z / n)
  if (!grid.has(k)) grid.set(k, [])
  grid.get(k).push(b)
}
function inside(x, z, self) {
  const [cx, cz] = [Math.floor(x / 50), Math.floor(z / 50)]
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    for (const b of grid.get(`${cx + i},${cz + j}`) ?? []) {
      if (String(b.id) === String(self)) continue
      const r = b.ring, n = r.length / 2
      let c = false
      for (let a = 0, p = n - 1; a < n; p = a++) {
        const [xa, za, xp, zp] = [r[2 * a], r[2 * a + 1], r[2 * p], r[2 * p + 1]]
        if ((za > z) !== (zp > z) && x < ((xp - xa) * (z - za)) / (zp - za) + xa) c = !c
      }
      if (c) return true
    }
  }
  return false
}
for (const id of ids) {
  const b = by.get(Number(id)); if (!b) { console.log(id, 'not in bake'); continue }
  if (existsSync(`${OUT}/${id}-look.png`)) continue
  // the clearest frame's bearing, camera to building (photos.csv)
  let look = null
  try {
    const rows = readFileSync(`${ROOT}tools/cache/appearance-r2/way-${id}/photos.csv`, 'utf8').trim().split('\n').slice(1).map((l) => l.split(','))
    const r = rows.find((x) => x[6])
    if (r && Number.isFinite(Number(r[8]))) look = (Number(r[8]) * Math.PI) / 180
  } catch { /* no capture record: the street decides */ }
  const n = b.ring.length / 2
  const P = Array.from({ length: n }, (_, i) => [b.ring[2 * i], b.ring[2 * i + 1]])
  const cx = P.reduce((s, p) => s + p[0], 0) / n, cz = P.reduce((s, p) => s + p[1], 0) / n
  let best = null
  for (let i = 0; i < n; i++) {
    const a = P[i], c = P[(i + 1) % n]
    const len = Math.hypot(c[0] - a[0], c[1] - a[1]); if (len < 3) continue
    const mx = (a[0] + c[0]) / 2, mz = (a[1] + c[1]) / 2
    let nx = (c[1] - a[1]) / len, nz = -(c[0] - a[0]) / len
    if (nx * (mx - cx) + nz * (mz - cz) < 0) { nx = -nx; nz = -nz }
    const [d, edge] = nearest(mx + nx * 6, mz + nz * 6)
    // the wall the photograph looks at, when the capture says where the camera stood (wave 7: a corner building shot
    // on its narrow end while the photo showed its long side)
    const facing = look ? -(nx * Math.sin(look) + nz * Math.cos(look)) : 0
    const score = d - Math.min(len, 20) * 0.15 - facing * 12
    if (!best || score < best.score) best = { score, mx, mz, nx, nz, len, edge }
  }
  const h = b.height ?? 10
  // stand in the street: just past the nearest road's centreline along the wall's normal
  let tRoad = 8, dMin = Infinity
  // (the FIRST road out along the normal: the best minimum over 40 m found the next street over)
  for (let t = 2; t <= 40; t += 0.5) {
    const [d] = nearest(best.mx + best.nx * t, best.mz + best.nz * t)
    if (d < dMin) { dMin = d; tRoad = t }
    if (dMin < 2.5 && d > dMin + 1) break
  }
  // …and back to the far kerb when the building needs it to fit (a tall or wide front seen from mid-street was a wall)
  const back = Math.max(7, tRoad + 2, Math.min(2 * tRoad - 1.5, Math.max(best.len * 0.9, h * 1.0)))
  // never inside a building across the street (wave 6: a camera in the opposite house shot a purple wall): come back
  // towards the target until the point is clear of every footprint
  let stand = back
  while (stand > 5 && inside(best.mx + best.nx * stand, best.mz + best.nz * stand, id)) stand -= 0.5
  const fx = best.mx + best.nx * stand, fz = best.mz + best.nz * stand
  const lift = Math.min(14, h * 0.45)
  const SHOTS = { base: SCENE, look: SCENE + '&labels=1', imputed: SCENE + '&looks=imputed' }
  for (const tag of (process.env.SHOTS ?? 'base,look').split(',')) {
    const extra = SHOTS[tag]
    const args = ['--experimental-strip-types', 'tools/look-at.ts', '--city=san-francisco', `--start=${best.edge}`, `--at=${best.mx.toFixed(1)},${best.mz.toFixed(1)}`,
      `--from=${fx.toFixed(1)},${fz.toFixed(1)},1.7`, `--lift=${lift.toFixed(1)}`, '--fov=68', `--out=${OUT}/${id}-${tag}.png`]
    if (extra) args.push(`--extra=${extra}`)
    if (process.env.SHOW) console.log('node', args.join(' '))
    try { execFileSync('node', args, { cwd: ROOT, stdio: 'pipe', timeout: 240000 }) } catch (e) { console.log(id, tag, 'failed', String(e).slice(0, 160)) }
  }
  console.log('shot', id)
}
