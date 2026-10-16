/**
 * San Francisco's two big sports venues — Oracle Park and Chase Center — which the building pipeline had
 * never seen.
 *
 * **Why they were missing.** The bake is keyed on `building=*`. Oracle Park is mapped twice: `relation/7325085`
 * carries the name, the height and `leisure=stadium` but NO `building` tag, so the census never counted it;
 * `relation/7330762` carries `building=stadium, height=30` and is UNNAMED, so nothing in the register could
 * name it either. It is therefore in neither `docs/sf-buildings.csv` nor any manifest fragment, and the city
 * drew a plain 30 m extrusion over the whole block. Chase Center (`way/579646390`) IS tagged `building=yes`,
 * but it sits outside the DETAIL box, so the bake put it in `pkg.fringe` as coarse massing rather than in
 * `buildings` — which is why claiming its OSM id works to delete the lump but cannot supply a footprint, and
 * the entry is a `lat`/`lon`/`size` one.
 *
 * **A ballpark is not a box.** The whole point of Oracle Park from a bike on the Embarcadero is that it is an
 * OPEN BOWL: a ring of raked seating round a field that is open to the sky, tall behind home plate and low in
 * the outfield, with the dark green right-field wall standing right at the water of McCovey Cove. Rendered as
 * a solid extrusion — which is exactly what the generic path did — the most recognisable open space in Mission
 * Bay becomes a thirty-metre lump. Chase Center is the opposite and IS essentially closed: a smooth glassy
 * elliptical drum on a plaza, so a bowl would be wrong there.
 *
 * Modelled from general knowledge of both venues and from the OSM geometry (the outline, the pitch, the
 * infield dirt and the bullpens), not from photographs: the Mapillary fetch was not run for these.
 *
 * Nothing here plants anything (docs/BUILDINGS.md, "Never plant anything").
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { box, prism, EMIT, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { faceBand } from '../../tower.ts'
import { edgeAt, faceOn, sign, signText, boxAlong } from '../../parts.ts'

type P2 = { x: number; z: number }

const BRICK: Rgb = [0.55, 0.36, 0.29]
const STONE: Rgb = [0.80, 0.77, 0.71]
const STEEL: Rgb = [0.62, 0.64, 0.66]
// Oracle Park's seats are a deep forest green (they had been a slate blue that read as water from above)
const SEAT: Rgb = [0.10, 0.22, 0.15]
const DECK: Rgb = [0.55, 0.55, 0.53]
const GRASS: Rgb = [0.31, 0.50, 0.24]
const GRASS_2: Rgb = [0.36, 0.55, 0.27]
const DIRT: Rgb = [0.56, 0.40, 0.29]
const WALL_GREEN: Rgb = [0.08, 0.22, 0.16]
const WARN: Rgb = [0.52, 0.36, 0.26]
/** the second brick, a shade off: a wall of one flat colour reads as a painted board at any distance */
const BRICK_LT: Rgb = [0.61, 0.42, 0.33]

const T_BRICK = surfaceTag('brick')
const T_CONC = surfaceTag('concrete')
const T_METAL = surfaceTag('metal')
const T_GLASS = surfaceTag('glass')

/* ------------------------------------------------------------------ Oracle Park */

/*
 * The park's own frame, derived from the footprint so that it survives whatever rotation the fit chooses.
 *
 * Everything is measured in the SURVEY frame below — `way/24352572`'s outline as OSM has it, in metres, x
 * east and z north — and the builder finds the turn from that frame to whatever frame the fit hands it by
 * MATCHING THE TWO SHAPES: area centroid to area centroid, area ratio for the scale, and the turn that best
 * lines up the two support functions. Nothing else was stable. A manifest bearing is no good, because
 * `relation/7330762` is unnamed, so `"front": "street"` finds no frontage and the loader falls back to the
 * footprint's own long axis; and anchoring on the longest edge (the 124 m right-field wall) failed the first
 * time it was photographed, because the Overpass copy of the outline has one node fewer down the King Street
 * side and so merges two of its segments into a single 129 m edge — a different side, and the whole park was
 * built turned 136° and inside out.
 *
 * In the survey frame: home plate is at (−38, −20); a batter faces (0.997, 0.076), the bisector of the two
 * foul lines, bearing about 86° — which is why the outfield is the bay side and the right-field wall stands
 * at the water of McCovey Cove.
 */
const SURVEY: [number, number][] = [
  [18.7, 133.0], [4.5, 118.7], [-40.1, 74.0], [-80.2, 33.9], [-129.6, -16.9], [-119.5, -25.9], [-123.0, -44.6],
  [-147.8, -80.0], [-113.9, -113.5], [-99.0, -115.5], [-83.8, -118.2], [-60.9, -133.0], [-33.6, -119.3],
  [23.7, -95.8], [134.8, -41.0], [132.7, -12.1], [140.8, -6.7], [147.8, 5.6], [98.2, 56.1], [57.2, 96.5], [27.9, 124.1],
]
const HP: [number, number] = [-38, -20]
const FX = 0.997
const FZ = 0.076

/** a ring's area and area centroid — the two shape invariants the alignment below is built on */
function moments(ring: P2[]): { a: number; cx: number; cz: number } {
  let a = 0
  let cx = 0
  let cz = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    const w = p.x * q.z - q.x * p.z
    a += w
    cx += (p.x + q.x) * w
    cz += (p.z + q.z) * w
  }
  if (Math.abs(a) < 1e-6) return { a: 1, cx: 0, cz: 0 }
  return { a: Math.abs(a / 2), cx: cx / (3 * a), cz: cz / (3 * a) }
}

/** how far the outline reaches in each of `n` directions from its centroid: a shape's fingerprint, turnable */
function support(ring: P2[], c: { cx: number; cz: number }, n: number): number[] {
  const h = new Array<number>(n).fill(-Infinity)
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2
    const dx = Math.cos(a)
    const dz = Math.sin(a)
    for (const p of ring) h[k] = Math.max(h[k], (p.x - c.cx) * dx + (p.z - c.cz) * dz)
  }
  return h
}

/** the field wall's distance from home plate, by angle off centre (degrees, + towards LEFT field) */
const FENCE: [number, number][] = [[-58, 76], [-45, 90], [-30, 112], [-18, 122], [-5, 119], [10, 117], [25, 112], [40, 102], [58, 88]]

const lerpAt = (table: [number, number][], t: number): number => {
  if (t <= table[0][0]) return table[0][1]
  for (let i = 1; i < table.length; i++) {
    if (t <= table[i][0]) {
      const [a, va] = table[i - 1]
      const [b, vb] = table[i]
      return va + ((vb - va) * (t - a)) / (b - a)
    }
  }
  return table[table.length - 1][1]
}

/** the direction φ degrees off centre field, in the survey frame (+ is towards LEFT field) */
const dirAt = (deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180
  return [FX * Math.cos(a) - FZ * Math.sin(a), FX * Math.sin(a) + FZ * Math.cos(a)]
}

/** where a ray from `c` in direction `d` leaves the ring — the bowl is resampled on rays, not on vertices */
function rayHit(ring: P2[], c: P2, dx: number, dz: number): number {
  let best = Infinity
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const ex = b.x - a.x
    const ez = b.z - a.z
    const den = dx * ez - dz * ex
    if (Math.abs(den) < 1e-9) continue
    const t = ((a.x - c.x) * ez - (a.z - c.z) * ex) / den
    const s = ((a.x - c.x) * dz - (a.z - c.z) * dx) / den
    if (t > 1 && s >= 0 && s <= 1) best = Math.min(best, t)
  }
  return Number.isFinite(best) ? best : 100
}

function oraclePark(out: MeshBuilder, fit: Fit): void {
  /*
   * The footprint, or a rectangle of the fit when there is none. There always is one in the city — the entry
   * claims relation/7330762 — but the triangle-budget test builds every landmark on a bare fit, and a builder
   * that draws nothing there would pass every check by drawing nothing at all.
   */
  /*
   * No footprint of its own — placed standalone at the survey's origin (venues.json, 2026-10-02): the survey IS the
   * footprint. The stadium relations never reach the bake, so a claimed fit was the one 5 800 m2 part
   * (way/499568642), and the park was built a quarter of its size in the corner over the Cove (owner: "the giants
   * stadium is not really recognizable", the arcade "connected to nothing").
   */
  const ring: P2[] = fit.ring && fit.ring.length >= 6
    ? fit.ring
    : SURVEY.map(([x, z]) => ({ x, z }))
  /*
   * ---- line the survey up with the footprint we were given: same centroid, area ratio for the scale, and
   * the turn whose support function matches best, refined a degree at a time.
   */
  const surveyRing = SURVEY.map(([x, z]) => ({ x, z }))
  const ms = moments(surveyRing)
  const mr = moments(ring)
  const scale = Math.sqrt(mr.a / ms.a)
  const N_SUP = 360
  const hs = support(surveyRing, ms, N_SUP).map((v) => v * scale)
  const hr = support(ring, mr, N_SUP)
  let turn = 0
  let bestErr = Infinity
  for (let k = 0; k < N_SUP; k++) {
    let err = 0
    for (let i = 0; i < N_SUP; i++) { const d = hr[(i + k) % N_SUP] - hs[i]; err += d * d }
    if (err < bestErr) { bestErr = err; turn = (k / N_SUP) * Math.PI * 2 }
  }
  const ct = Math.cos(turn)
  const st = Math.sin(turn)
  /** a point of the survey, in the model's frame */
  const at = (sx: number, sz: number): P2 => ({
    x: mr.cx + scale * ((sx - ms.cx) * ct - (sz - ms.cz) * st),
    z: mr.cz + scale * ((sx - ms.cx) * st + (sz - ms.cz) * ct),
  })
  /** a direction of the survey, in the model's frame */
  const dir = (dx: number, dz: number): [number, number] => [dx * ct - dz * st, dx * st + dz * ct]

  const [fx, fz] = dir(FX, FZ)
  /** the middle of the right-field wall on the Cove, so the slices that ARE that wall can be picked out */
  const coveMid = at(79.25, -68.4)
  const home = at(HP[0], HP[1])
  const C = at(HP[0] + FX * 62, HP[1] + FZ * 62)             // the middle of the field, the bowl's centre

  // ---- the field's own outline: the fence from foul pole to foul pole, closed round behind home plate
  const field: P2[] = []
  for (let d = -58; d <= 58; d += 4) {
    const [du, dv] = dirAt(d)
    const r = lerpAt(FENCE, d)
    field.push(at(HP[0] + du * r, HP[1] + dv * r))
  }
  for (let d = 58; d <= 302; d += 16) {                      // the backstop and the dugout rails behind it
    const [du, dv] = dirAt(d)
    field.push(at(HP[0] + du * 21, HP[1] + dv * 21))
  }

  /*
   * ---- the bowl, resampled on rays from the middle of the field.
   *
   * `beta` is how far round from BEHIND HOME PLATE a ray points, and it drives everything: the grandstand is
   * 44 m there, steps down along the foul lines and falls to 11 m of bleachers in the outfield. That
   * asymmetry is the shape of a ballpark; a constant height would just be a round box.
   *
   * Each ray gives three radii and they are what makes it read as a stadium rather than a dish: `ri` at the
   * field wall, `rt` where the seating reaches the top, and `ro` at the outer wall. The seating rakes steeply
   * from ri to rt — about thirty degrees, as a grandstand does — and from rt out to ro the top is a FLAT roof
   * deck over the concourse. The first pass had the seats rise the whole way from the fence to the perimeter,
   * which over sixty metres is a gentle saucer and looked like a reservoir.
   */
  const cvL = Math.hypot(coveMid.x - C.x, coveMid.z - C.z) || 1
  const cvx = (coveMid.x - C.x) / cvL
  const cvz = (coveMid.z - C.z) / cvL
  const N = 64
  const lift = (beta: number): number => 11 + 33 * Math.pow((1 + Math.cos(beta)) / 2, 1.2)
  const R: { qx: number; qz: number; tx: number; tz: number; ix: number; iz: number; h: number; b: number; s: number }[] = []
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2
    const dx = Math.cos(a)
    const dz = Math.sin(a)
    const beta = Math.acos(Math.max(-1, Math.min(1, -(dx * fx + dz * fz))))
    const h = lift(beta)
    /*
     * The outline is the whole block, and out past centre field it runs sixty metres beyond the fence — so
     * the model is NOT simply the footprint raised. Past home plate the stadium really does fill the block
     * (Willie Mays Plaza, four levels of concourse behind the backstop) and the wall goes to the outline;
     * round towards the outfield the stands are capped at a bleacher's depth and the rest of the block is
     * left as ground. Filling it all gave a hectare of flat grey roof over right field.
     */
    const deep = 24 + 260 * Math.pow((1 + Math.cos(beta)) / 2, 4)
    const rf = rayHit(field, C, dx, dz)
    const ro = Math.min(rayHit(ring, C, dx, dz) - 1.2, rf + deep)
    const ri = Math.max(6, Math.min(ro - 6, rf))
    const rt = Math.min(ro - 5, ri + 7 + (h - 11) * 1.45)
    R.push({ qx: C.x + dx * ro, qz: C.z + dz * ro, tx: C.x + dx * rt, tz: C.z + dz * rt,
      ix: C.x + dx * ri, iz: C.z + dz * ri, h, b: beta, s: (dx * cvx + dz * cvz) })
  }

  for (let i = 0; i < N; i++) {
    const p = R[i]
    const q = R[i + 1]
    const n: [number, number, number] = [(p.qx + q.qx) / 2 - C.x, 0.1, (p.qz + q.qz) / 2 - C.z]
    /*
     * ---- the exterior.
     *
     * Three characters, and which one a slice gets is the whole look of the building from the street:
     *
     * - on the COVE — the slices pointing within about 55° of the middle of the right-field wall, which is
     *   found from the survey rather than from a sign convention that was easy to get backwards — the
     *   outside IS the wall: 24 ft of dark green standing at the water, with brick
     *   over it. This is the one thing a rider on the Embarcadero sees, and in the first pass the wall was
     *   drawn only on the INSIDE of the fence, so from the promenade the park was a grey concrete box;
     * - on the CITY sides — Third Street, King Street, Willie Mays Plaza — brick to the top;
     * - round towards the outfield, pale precast over the brick base.
     */
    const y = (k: { h: number }): number => Math.min(12.5, k.h - 1)
    const cove = p.s > 0.55 && q.s > 0.55
    const city = Math.cos(p.b) > -0.25
    const baseTop = cove ? 7.4 : y(p)
    const baseTopQ = cove ? 7.4 : y(q)
    out.quad([[p.qx, 0, p.qz], [q.qx, 0, q.qz], [q.qx, baseTopQ, q.qz], [p.qx, baseTop, p.qz]],
      n, [[0, 0], [1, 0], [1, 1], [0, 1]], cove ? WALL_GREEN : BRICK, cove ? T_METAL : T_BRICK)
    out.quad([[p.qx, baseTop, p.qz], [q.qx, baseTopQ, q.qz], [q.qx, q.h, q.qz], [p.qx, p.h, p.qz]],
      n, [[0, 0], [1, 0], [1, 1], [0, 1]],
      city || cove ? (i % 2 === 0 ? BRICK : BRICK_LT) : (i % 2 === 0 ? STONE : DECK),
      city || cove ? T_BRICK : T_CONC)
    // the flat roof deck between the top of the seating and the outer wall, and the parapet standing on it
    out.quad([[p.qx, p.h, p.qz], [q.qx, q.h, q.qz], [q.tx, q.h, q.tz], [p.tx, p.h, p.tz]],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], DECK, T_CONC)
    out.quad([[p.qx, p.h, p.qz], [q.qx, q.h, q.qz], [q.qx, q.h + 1.1, q.qz], [p.qx, p.h + 1.1, p.qz]],
      n, [[0, 0], [1, 0], [1, 1], [0, 1]], STONE, T_CONC)

    /*
     * ---- the club and press levels, a long block standing on the roof BEHIND HOME PLATE, where the real
     * park has four storeys of suites over the backstop. Without it the deep side of the roof was a hectare
     * of flat grey and the building read as a quarry.
     */
    if (p.h > 30 && q.h > 30) {
      const on = (k: typeof p, t: number): [number, number] => [k.tx + (k.qx - k.tx) * t, k.tz + (k.qz - k.tz) * t]
      const [i0x, i0z] = on(p, 0.12)
      const [i1x, i1z] = on(q, 0.12)
      const [o0x, o0z] = on(p, 0.9)
      const [o1x, o1z] = on(q, 0.9)
      const top0 = p.h + 8
      const top1 = q.h + 8
      out.quad([[i0x, p.h, i0z], [i1x, q.h, i1z], [i1x, top1, i1z], [i0x, top0, i0z]],
        [C.x - i0x, 0, C.z - i0z], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.24, 0.28, 0.33], T_GLASS)
      out.quad([[o0x, p.h, o0z], [o1x, q.h, o1z], [o1x, top1, o1z], [o0x, top0, o0z]],
        n, [[0, 0], [1, 0], [1, 1], [0, 1]], STONE, T_CONC)
      out.quad([[i0x, top0, i0z], [i1x, top1, i1z], [o1x, top1, o1z], [o0x, top0, o0z]],
        [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], DECK, T_METAL)
    }

    /*
     * ---- the seating: three decks raked from the field wall up to the roof, each with a fascia under it, so
     * the bowl is visibly stepped from the street and from above is a ring of dark seats round green.
     */
    const decks = 3
    const P = (k0: typeof p, t: number): [number, number] => [k0.ix + (k0.tx - k0.ix) * t, k0.iz + (k0.tz - k0.iz) * t]
    for (let k = 0; k < decks; k++) {
      const t0 = k / decks
      const t1 = (k + 1) / decks
      const y0 = 2.2 + (p.h - 2.2) * t0
      const y1 = 2.2 + (p.h - 2.2) * t1
      const z0 = 2.2 + (q.h - 2.2) * t0
      const z1 = 2.2 + (q.h - 2.2) * t1
      const [ax, az] = P(p, t0)
      const [bx, bz] = P(p, t1)
      const [ex2, ez2] = P(q, t0)
      const [gx, gz] = P(q, t1)
      out.quad([[ax, y0, az], [ex2, z0, ez2], [gx, z1, gz], [bx, y1, bz]],
        [C.x - (ax + bx) / 2, 6, C.z - (az + bz) / 2], [[0, 0], [1, 0], [1, 1], [0, 1]], SEAT, T_CONC)
      // the fascia hanging under each upper deck, which is what you see across the field
      if (k > 0) {
        out.quad([[ax, y0 - (p.h - 2.2) / decks * 0.55, az], [ex2, z0 - (q.h - 2.2) / decks * 0.55, ez2], [ex2, z0, ez2], [ax, y0, az]],
          [C.x - ax, 0, C.z - az], [[0, 0], [1, 0], [1, 1], [0, 1]], DECK, T_CONC)
      }
    }
  }

  // ---- the field: grass, the warning track round its edge, the infield dirt and the mound
  capPolygon(out, field, 0.35, GRASS, T_CONC)
  for (let i = 0; i < field.length; i++) {
    const a = field[i]
    const b = field[(i + 1) % field.length]
    const ia = { x: home.x + (a.x - home.x) * 0.955, z: home.z + (a.z - home.z) * 0.955 }
    const ib = { x: home.x + (b.x - home.x) * 0.955, z: home.z + (b.z - home.z) * 0.955 }
    out.quad([[a.x, 0.4, a.z], [b.x, 0.4, b.z], [ib.x, 0.4, ib.z], [ia.x, 0.4, ia.z]],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WARN, T_CONC)
  }
  // the infield: the dirt arc out to 48 m, and the mown grass diamond inside it
  const fan = (r0: number, r1: number, a0: number, a1: number, step: number): P2[] => {
    const pts: P2[] = []
    for (let d = a0; d <= a1; d += step) { const [du, dv] = dirAt(d); pts.push(at(HP[0] + du * r1, HP[1] + dv * r1)) }
    for (let d = a1; d >= a0; d -= step) { const [du, dv] = dirAt(d); pts.push(at(HP[0] + du * r0, HP[1] + dv * r0)) }
    return pts
  }
  capPolygon(out, fan(0, 48, -47, 47, 6), 0.42, DIRT, T_CONC)
  capPolygon(out, fan(7, 42, -40, 40, 6), 0.46, GRASS_2, T_CONC)
  const mound = at(HP[0] + FX * 18.4, HP[1] + FZ * 18.4)
  prism(out, mound.x, mound.z, 0.42, 0.72, 2.7, 10, DIRT, T_CONC)

  /*
   * ---- THE RIGHT FIELD WALL, the one thing everyone knows about this park: 24 ft of dark green standing at
   * the water's edge, with the brick arcade behind it. The rest of the field gets an ordinary low fence.
   */
  for (let d = -58; d < 58; d += 4) {
    const [u0, v0] = dirAt(d)
    const [u1, v1] = dirAt(d + 4)
    const r0 = lerpAt(FENCE, d)
    const r1 = lerpAt(FENCE, d + 4)
    const a = at(HP[0] + u0 * r0, HP[1] + v0 * r0)
    const b = at(HP[0] + u1 * r1, HP[1] + v1 * r1)
    const tall = d < -6 && d > -54                              // right field, on the Cove
    const h = tall ? 7.4 : 2.6
    out.quad([[a.x, 0.4, a.z], [b.x, 0.4, b.z], [b.x, h, b.z], [a.x, h, a.z]],
      [home.x - a.x, 0, home.z - a.z], [[0, 0], [1, 0], [1, 1], [0, 1]], WALL_GREEN, T_METAL)
    out.quad([[a.x, h, a.z], [b.x, h, b.z], [b.x, h + 0.18, b.z], [a.x, h + 0.18, a.z]],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.9, 0.88, 0.84], 0)
  }
  // the two foul poles, orange, at the ends of the wall
  for (const d of [-45, 45]) {
    const [du, dv] = dirAt(d)
    const r = lerpAt(FENCE, d)
    const p = at(HP[0] + du * r, HP[1] + dv * r)
    box(out, p.x, 12, p.z, 0.3, 12, 0.3, [0.92, 0.42, 0.10], T_METAL)
  }

  /*
   * ---- the scoreboard over the left-field bleachers, and the two things in that corner a visitor names: the
   * giant four-fingered mitt and the Coca-Cola bottle slide. Crude boxes, and deliberately so — they read at a
   * hundred metres, which is where they are seen from.
   */
  /** the top of the bowl above a point, so a thing on the bleachers stands on them and not in the air */
  const rimAt = (q: P2): number => {
    const L = Math.hypot(q.x - C.x, q.z - C.z) || 1
    const beta = Math.acos(Math.max(-1, Math.min(1, -(((q.x - C.x) / L) * fx + ((q.z - C.z) / L) * fz))))
    return lift(beta)
  }
  const sb = at(HP[0] + dirAt(16)[0] * 126, HP[1] + dirAt(16)[1] * 126)
  // boxAlong's face (+z) runs along (sin h, cos h): so this faces home plate (it was side-on, owner 2026-10-16)
  const sbh = Math.atan2(home.x - sb.x, home.z - sb.z)
  const sby = rimAt(sb) + 5.5
  boxAlong(out, sb.x, sby, sb.z, 23, 5.5, 0.9, sbh, [0.08, 0.09, 0.11], T_METAL)
  boxAlong(out, sb.x, sby, sb.z, 22, 4.8, 1.2, sbh, [0.10, 0.14, 0.18], EMIT)
  const glove = at(100, 40)
  const gy = rimAt(glove)
  box(out, glove.x, gy + 3.2, glove.z, 3.6, 3.2, 2.2, [0.42, 0.30, 0.22], T_CONC)
  box(out, glove.x, gy + 7.0, glove.z, 3.2, 1.2, 1.6, [0.42, 0.30, 0.22], T_CONC)
  const coke = at(92, 52)
  const cy = rimAt(coke)
  prism(out, coke.x, coke.z, cy, cy + 12, 2.2, 10, [0.66, 0.10, 0.12], T_METAL, 1.1)
  prism(out, coke.x, coke.z, cy + 12, cy + 15, 1.1, 10, [0.66, 0.10, 0.12], T_METAL, 0.9)

  // ---- the light towers on the roof: six banks on masts, lit after dark
  for (const d of [-40, -14, 14, 40, 72, -72]) {
    const a = ((d + 180) * Math.PI) / 180
    const dx = fx * Math.cos(a) - fz * Math.sin(a)
    const dz = fx * Math.sin(a) + fz * Math.cos(a)
    const r = rayHit(ring, C, dx, dz) - 6
    const x = C.x + dx * r
    const z = C.z + dz * r
    const beta = Math.acos(Math.max(-1, Math.min(1, -(dx * fx + dz * fz))))
    const y = lift(beta)
    for (const k of [-1, 1]) box(out, x + dz * k * 3, y + 7, z - dx * k * 3, 0.35, 7, 0.35, STEEL, T_METAL)
    box(out, x, y + 13.6, z, 4.2, 0.9, 1.2, [0.86, 0.87, 0.88], EMIT)
  }

  /*
   * ---- the brick exterior along Third Street and King Street: the arched openings that face the city, on
   * every long edge that looks BACK past home plate. The Cove side is the wall, not an arcade.
   */
  for (let i = 0; i < ring.length; i++) {
    const g = edgeAt(ring, i)
    if (g.L < 26) continue
    if ((g.nx * fx + g.nz * fz) > -0.25) continue
    /*
     * Drawn as a brick wall with ARCHED openings punched in it, laid on the outline a little proud of the
     * exterior. `arcade` was the obvious choice and was wrong: it stands free-standing piers proud of the
     * points it is given, so against a wall that is already there it came out as a brick picket fence round
     * the whole building.
     */
    faceOn(out, ring, i, 0, 12.4, { kind: 'punched', arched: true, wall: BRICK, glass: [0.13, 0.13, 0.15],
      pitch: 9.5, floor: 12.4, solid: 0.28, material: 'brick' }, -0.5)
  }

  // ---- Willie Mays Plaza: the entrance rotunda on the corner nearest home plate, outside the bowl
  const gate = at(HP[0] - FX * 60, HP[1] - FZ * 60)
  prism(out, gate.x, gate.z, 0, 21, 10, 12, BRICK, T_BRICK)
  prism(out, gate.x, gate.z, 21, 23.6, 11, 12, STONE, T_CONC, 10.4)
  prism(out, gate.x, gate.z, 0.2, 9, 7.6, 12, [0.14, 0.15, 0.17], T_GLASS)
  /*
   * The sign faces OUT of the plaza, away from the field — which is the direction from centre field back over
   * home plate, turned into the model's frame. Written out rather than left at the default because a
   * `signText` with no `heading` faces +z whatever the building is doing, so this one sat on the back of the
   * rotunda where the bowl hides it.
   */
  const [ox, oz] = dir(-FX, -FZ)
  signText(out, 'GIANTS', gate.x + ox * 10.8, 25.8, gate.z + oz * 10.8, 2.4, [0.92, 0.45, 0.12],
    { lit: true, heading: Math.atan2(ox, oz) })
}

/* ------------------------------------------------------------------ Chase Center */

/** an ellipse ring, which is very nearly what Chase Center's footprint is: 157 m by 158 m and barely faceted */
function ellipse(hx: number, hz: number, n = 40): P2[] {
  const pts: P2[] = []
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2
    // anticlockwise, like every other ring the kit takes: (sin, cos) runs the other way and every wall came
    // out facing inwards, so the arena was see-through and the roof appeared to float over its own plaza
    pts.push({ x: Math.cos(t) * hx, z: Math.sin(t) * hz })
  }
  return pts
}

/**
 * Chase Center (Manica, 2019): a closed elliptical drum 38 m high on its plaza at 16th and Third, the Warriors'
 * arena. Nothing about it is a bowl from outside — it is a smooth glass and metal cylinder with a dark glazed
 * concourse at the foot, a deep metallic fascia round the top and a slightly domed roof, standing on a broad
 * paved plaza with the two low office blocks to the west.
 *
 * Built from `fit.hx`/`fit.hz` and not from a footprint, because the bake has it in the FRINGE (outside the
 * detail box), where the loader cannot find a ring for it; the manifest entry is a lat/lon/size one and names
 * the OSM way only so the fringe lump is removed. The west notch of the real footprint is lost that way.
 */
function chaseCenter(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(30, fit.hx)
  const hz = Math.max(30, fit.hz)
  const SKIN: Rgb = [0.80, 0.81, 0.82]
  const GLASS: Rgb = [0.42, 0.55, 0.62]
  const DARK: Rgb = [0.20, 0.24, 0.28]

  // ---- the plaza it stands on, and the low ring of retail round the foot of the drum
  capPolygon(out, ellipse(hx * 1.2, hz * 1.18, 28), 0.12, [0.74, 0.73, 0.70], T_CONC)
  capPolygon(out, ellipse(hx * 1.02, hz * 1.02, 32), 0.3, [0.66, 0.65, 0.63], T_CONC)

  /*
   * ---- the drum. A dark glazed concourse at the foot, the glass skin above it on close mullions, a pale
   * metal fascia standing proud round the top, and a shallow domed roof drawn as ELLIPSE RINGS — the first
   * pass capped it with a circular prism of the larger half-width, which over a 158 × 159 m oval hung a
   * metre and a half out on two sides and read as the lid of a hatbox.
   */
  faceBand(out, ellipse(hx, hz), 0, 6.5, { kind: 'curtain', wall: DARK, glass: [0.16, 0.19, 0.23], pitch: 5, floor: 6.5, solid: 0.14, material: 'glass' })
  /*
   * Ribbons of glass in a metal skin, not a curtain wall. Drawn as a curtain (four fifths glass) the arena
   * was transparent: the roof and the far wall showed straight through it and it read as a glass bowl rather
   * than the closed drum it is.
   */
  faceBand(out, ellipse(hx * 1.008, hz * 1.008), 6.5, 30, { kind: 'bands', wall: SKIN, glass: GLASS, pitch: 3.2, floor: 5.8, solid: 0.66, material: 'metal' })
  faceBand(out, ellipse(hx * 1.028, hz * 1.026), 30, 36, { kind: 'fins', wall: SKIN, glass: [0.66, 0.67, 0.68], pitch: 3.2, solid: 0.72, depth: 0.4, material: 'metal' })
  faceBand(out, ellipse(hx * 1.032, hz * 1.03), 36, 37.4, { kind: 'blank', wall: [0.58, 0.59, 0.60], material: 'metal' })
  // the roof: three shallow courses of the same oval, so it domes instead of sitting flat
  const lids: [number, number][] = [[1.0, 37.4], [0.72, 39.2], [0.36, 40.2]]
  for (let k = 0; k < lids.length - 1; k++) {
    const [f0, y0] = lids[k]
    const [f1, y1] = lids[k + 1]
    const r0 = ellipse(hx * f0, hz * f0, 32)
    const r1 = ellipse(hx * f1, hz * f1, 32)
    for (let i = 0; i < r0.length; i++) {
      const j = (i + 1) % r0.length
      out.quad([[r0[i].x, y0, r0[i].z], [r0[j].x, y0, r0[j].z], [r1[j].x, y1, r1[j].z], [r1[i].x, y1, r1[i].z]],
        [r0[i].x, 8, r0[i].z], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.70, 0.71, 0.72], T_METAL)
    }
  }
  capPolygon(out, ellipse(hx * 0.36, hz * 0.36, 32), 40.2, [0.70, 0.71, 0.72], T_METAL)
  for (const [sx, sz] of [[-0.3, 0.2], [0.22, -0.15], [0.05, 0.4]]) {
    box(out, hx * sx, 40.0, hz * sz, 8, 1.8, 6, [0.64, 0.65, 0.66], T_METAL)
  }

  /*
   * ---- the main entrance on the east side (Thrive City and the bay), under a deep canopy carried on masts,
   * with the name across the fascia above it. The plaza's own gate is the one thing that breaks the drum.
   */
  box(out, 0, 9.0, hz * 1.05, 22, 0.5, hz * 0.1, SKIN, T_METAL)
  for (const k of [-1, 1]) box(out, k * 18, 4.6, hz * 1.13, 0.5, 4.6, 0.5, STEEL, T_METAL)
  box(out, 0, 4.2, hz * 1.0, 20, 4.2, 0.9, [0.24, 0.36, 0.46], T_GLASS)
  /*
   * The name across the fascia, in a real typeface on one quad (render/landmarks/signage.ts) instead of the
   * 3 x 5 block font it used to be spelled out in. `self` because it is a lit sign at night.
   *
   * The standoff is 2.4 m rather than the usual 6 cm, and deliberately: the sign is a flat chord across a
   * drum, so its ENDS are the part that sinks into the wall, and the sag across twenty metres of an ellipse
   * this size is a metre and a half. Standing it off the fascia is also what the real one does.
   */
  sign(out, { type: 'flat', text: 'CHASE CENTER', h: 2.4, face: 'grotesque', weight: 'bold',
    colour: [0.10, 0.22, 0.48], lit: 'self', standoff: 2.4 }, { x: 0, y: 33.2, z: hz * 1.026, heading: 0 })

  /*
   * The two Uber blocks and the garage on the Third Street side are NOT drawn: they are ordinary
   * `building=yes` ways of their own and the city already has them in its fringe massing, so a builder that
   * drew them too would put a second block inside each of them.
   */
}

export const VENUES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  oraclePark,
  chaseCenter,
}
