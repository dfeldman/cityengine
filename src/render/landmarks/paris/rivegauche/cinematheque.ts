import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { UV, arc, cap, centroid, edgeAt, fitted, hex, panel, pts, shade, sign, stripWall, surfaceTag, wallOn, wound, type P2, type Rgb, type V3 } from './common.ts'

/** the design footprint: OSM way 78271385's box, x east, z north, metres from the box's centre (48.837002 N, 2.382646 E) */
const HX = 28.4
const HZ = 35.9

const STONE = hex('#d8cdb0')
const STONE_DEEP = hex('#c7ba9b')
const ZINC = hex('#6b747b')
/** the punched windows of the stone */
const GLASS = hex('#26333a')
/** the lobby's glass, which the glass surface fills with sky */
const LOBBY = hex('#c3d4db')
const MULLION = hex('#44565b')
const PLAIN = 0
const METAL = surfaceTag('metal')
const GLAZED = surfaceTag('glass')

/*
 * The massing, from IGN's LiDAR HD surface model (docs/landmarks/MODEL-CINEMATHEQUE.md), metres above the park:
 *  - MAIN, 28.5 m: the block along the whole Rue de Bercy (north-east) edge, wrapping south to the park corner,
 *    with a court in its west side whose roof is the 11 m foyer;
 *  - STRIP, 18 m: 6 m wide along the Rue Jean-Renoir (south-east) edge, the set-back the lane shows;
 *  - the foyer, 11 m, between the main block and the west edge, under the glass lobby's skirt.
 */
/** (both wound anticlockwise, so an edge's wall faces out) */
const MAIN = pts([-16, 25.5, -14, 22, -12, 20, -10, 17, 1, 17, 1, -2, -15, -2, -17.5, -13, -19.5, -26, -6.5, -25.5, -1.4, -20, 24.5, 1.8, -3.8, 35.9])
const STRIP = pts([28.4, -2.8, 24.5, 1.8, -1.4, -20, -6.5, -25.5, -19.5, -26, -11, -35.9])
const FOYER = pts([-19, -19.8, -18.5, -19.5, -17.5, -13, -15, -2, 1, -2, 1, 17, -10, 17, -12, 20, -14, 22, -16, 25.5, -17.5, 24.5, -20.4, 23.1, -23, 14, -20.5, 9.5, -21, 7, -21.5, 2, -22, -3.5, -21.5, -9, -20.5, -15.5])
/** the lobby's glass, on the ring's west edge; the eave 1.6 m outside it; the inner line where the zinc meets the stone */
const G = pts([-23.3, -20, -25, -15.5, -26.6, -9, -27.2, -3.5, -26.8, 2, -26, 7, -25.3, 9.5])
const E = pts([-24.9, -20.6, -26.6, -15.9, -28.2, -9.2, -28.8, -3.5, -28.4, 2.2, -27.6, 7.3, -26.9, 9.9])
const I = pts([-19, -19.8, -20.5, -15.5, -21.5, -9, -22, -3.5, -21.5, 2, -21, 7, -20.5, 9.5])
const I_Y = [10, 10.8, 12, 13, 13.5, 14, 14]

/** A straight-walled prism on any plan (concave too: the normals are the edges' own), its lid a shade darker. */
function prism(out: MeshBuilder, ring: P2[], y0: number, y1: number, c: Rgb, tag: number): void {
  const r = wound([ring])[0]
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    out.quad([[e.a.x, y0, e.a.z], [e.b.x, y0, e.b.z], [e.b.x, y1, e.b.z], [e.a.x, y1, e.a.z]], [e.nx, 0, e.nz], UV, c, tag)
  }
  cap(out, r, y1, shade(c, 0.9), tag)
}

/** A convex plan lofted from ring `a` at `ya` to ring `b`, each of whose vertices has its own height: a leaning block with a sloped top. */
function loftTo(out: MeshBuilder, a: P2[], ya: number, b: P2[], yb: number[], c: Rgb, tag: number): void {
  const m = centroid(a)
  const inner: V3 = [m.x, ya, m.z]
  for (let i = 0; i < a.length; i++) {
    const j = (i + 1) % a.length
    panel(out, [[a[i].x, ya, a[i].z], [a[j].x, ya, a[j].z], [b[j].x, yb[j], b[j].z], [b[i].x, yb[i], b[i].z]], inner, c, tag)
  }
  const t = centroid(b)
  const ty = yb.reduce((s, y) => s + y, 0) / yb.length
  for (let i = 0; i < b.length; i++) {
    const j = (i + 1) % b.length
    panel(out, [[b[i].x, yb[i], b[i].z], [b[j].x, yb[j], b[j].z], [t.x, ty, t.z], [t.x, ty, t.z]], [t.x, ty - 3, t.z], shade(c, 0.9), tag)
  }
}

/**
 * A window set on a lofted wall: `s0..s1` along the ring (fractional vertex index: 1.3 is three tenths of the way along the
 * second edge), `v0..v1` of the way up. It follows the lean, 0.12 proud of the face.
 */
function windowOn(out: MeshBuilder, a: P2[], ya: number, b: P2[], yb: number[], s0: number, s1: number, v0: number, v1: number, c: Rgb): void {
  const m = centroid(a)
  const at = (s: number, v: number): V3 => {
    const i = Math.min(a.length - 1, Math.floor(s)), j = (i + 1) % a.length, t = s - i
    const ax = a[i].x + (a[j].x - a[i].x) * t, az = a[i].z + (a[j].z - a[i].z) * t
    const bx = b[i].x + (b[j].x - b[i].x) * t, bz = b[i].z + (b[j].z - b[i].z) * t
    const by = yb[i] + (yb[j] - yb[i]) * t
    const x = ax + (bx - ax) * v, z = az + (bz - az) * v
    const nx = x - m.x, nz = z - m.z, nl = Math.hypot(nx, nz) || 1
    return [x + (nx / nl) * 0.12, ya + (by - ya) * v, z + (nz / nl) * 0.12]
  }
  panel(out, [at(s0, v0), at(s1, v0), at(s1, v1), at(s0, v1)], [m.x, ya, m.z], c)
}

/** A D-shaped ring: an arc about (cx, cz) from a0 to a1, closed by a flat back at x = `back`. */
function dee(cx: number, cz: number, r: number, a0: number, a1: number, n: number, back: number): P2[] {
  const bow = arc(cx, cz, r, a0, a1, n)
  return [...bow, { x: back, z: bow[n].z }, { x: back, z: bow[0].z }]
}

const rad = (deg: number): number => (deg * Math.PI) / 180

/**
 * The Cinémathèque française, Frank Gehry's American Center of 1994, 51 rue de Bercy, on the north corner of the Parc de Bercy.
 * Measured from IGN's LiDAR HD surface model and orthophoto, and from the photographs (the owner's from the park, Commons
 * "Gehrys American Center 2011", the lobby by night, the Rue Jean-Renoir lane, the Rue Paul-Belmondo promenade): see
 * docs/landmarks/MODEL-CINEMATHEQUE.md. What the park sees, from the west:
 *
 * - at the left a tall CURVED tower of limestone, five rows of square windows on a bowed face, leaning out, its top sloping up
 *   toward the middle;
 * - in the middle a planar tower, the highest thing (32–33 m), leaning a little, its top a slope;
 * - in front of it the limestone PETAL over the entrance: a bowed sail that swells out over the doors and rounds off at the top;
 * - at the right a lower bowed block with a sloping shoulder, in front of the regular wing;
 * - under all of it the GLASS LOBBY: a run of tall panes in dark mullions along the west edge, a thin glass canopy at door
 *   height, LA CINÉMATHÈQUE FRANÇAISE in pale capitals on the glass, and the ZINC SKIRT sweeping up from its eave to the stone.
 *
 * The street (north-east) and the lane (south-east) get the plain block and its strict grid of windows.
 */
export function cinematheque(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  // ---- the plain block on the street, and the lane's set-back strip
  prism(out, MAIN, 0, 28.5, STONE, PLAIN)
  const strip = wound([STRIP])[0]
  const sc = centroid(strip)
  stripWall(out, [pts([24.5, 1.8, 28.4, -2.8, -11, -35.9, -19.5, -26])].flat(), 0, 18, sc, STONE, PLAIN)
  cap(out, strip, 18, shade(STONE, 0.9), PLAIN)
  // the street face: seven rows on a 3.3 m grid over a stone base, the north-west end the same but sparser
  for (const [p, q, rows] of [[MAIN[11], MAIN[12], [5.5, 8.8, 12.1, 15.4, 18.7, 22, 25.3]], [MAIN[12], MAIN[0], [8.8, 12.1, 15.4, 18.7, 22, 25.3]]] as const) {
    const w = wallOn(out, p, q)
    const n = Math.round(w.L / 3.3)
    for (let j = 0; j < n; j++) {
      const u = (w.L * (j + 0.5)) / n
      for (const y of rows) w.rect(u - 0.8, u + 0.8, y, y + 2.1, GLASS, 0.07)
    }
    w.rect(0, w.L, 28.1, 28.5, shade(STONE, 1.05), 0.1)
  }
  // the lane: the strip's few square windows and the set-back block's two rows over it
  {
    const w = wallOn(out, STRIP[5], STRIP[0])
    for (let u = 4; u < w.L - 3; u += 6) for (const y of [8, 13]) w.rect(u - 0.7, u + 0.7, y, y + 1.6, GLASS, 0.07)
    const b = wallOn(out, MAIN[10], MAIN[11])
    const n = Math.round(b.L / 3.3)
    for (let j = 0; j < n; j++) {
      const u = (b.L * (j + 0.5)) / n
      for (const y of [20.2, 23.8]) b.rect(u - 0.8, u + 0.8, y, y + 2.1, GLASS, 0.07)
    }
  }
  // the promenade (south-west) faces: tall glazed slots in the stone, as the Rue Paul-Belmondo shows them
  {
    const s = wallOn(out, STRIP[4], STRIP[5])
    for (const u of [3.5, 8.5]) s.rect(u - 1.1, u + 1.1, 0.4, 8.5, LOBBY, 0.1)
    const w = wallOn(out, MAIN[7], MAIN[8])
    w.rect(1.2, 2.8, 9, 27, LOBBY, 0.1)
    w.rect(1.2, 2.8, 0.4, 8.5, LOBBY, 0.1)
  }
  // plant on the roof, where the lidar had it
  prism(out, pts([-7, 22, -3, 22, -3, 26, -7, 26]), 28.5, 30.2, STONE_DEEP, PLAIN)
  prism(out, pts([0, 23.5, 4, 23.5, 4, 26.5, 0, 26.5]), 28.5, 29.8, STONE_DEEP, PLAIN)
  // ---- the foyer: its roof over the court (10 m: the lidar's 11, kept under the zinc where that meets the stone) and out to the glass; a 22 m block standing in the court
  cap(out, wound([FOYER])[0], 10, shade(STONE, 0.86), PLAIN)
  prism(out, pts([-6, 3, 1, 3, 1, 9, -6, 9]), 11, 22, STONE_DEEP, PLAIN)

  // ---- the curved tower at the north-west: a bowed west face, leaning out, its top sloping up toward the middle of the front
  {
    const a = dee(-15, 14, 11.5, rad(143), rad(217), 7, -12)
    const b = dee(-16.2, 14.3, 12.1, rad(143), rad(217), 7, -12.6)
    const ys = b.map((p) => 25.5 - (p.z - 14) * 0.21)
    loftTo(out, a, 0, b, ys, STONE, PLAIN)
    // five rows of square windows in three columns on the bow, one column of slots on the flat south face
    for (const y of [9.5, 12.8, 16.1, 19.4, 22.7]) {
      for (const s of [1, 3, 5]) windowOn(out, a, 0, b, ys, s + 0.12, s + 0.88, (y - 1) / 25.5, (y + 1) / 25.5, GLASS)
      windowOn(out, a, 0, b, ys, 7.3, 7.42, (y - 1) / 25.5, (y + 1.2) / 25.5, GLASS)
    }
  }
  // ---- the planar tower in the middle: the highest, leaning west, its top a slope up to the west and north
  {
    const a = pts([-21, -14, -11, -14, -11, -2, -21, -2])
    const b = pts([-22.3, -14.3, -11.9, -14.3, -11.9, -1.7, -22.3, -1.7])
    const ys = [32.4, 28.6, 29.6, 33.4]
    loftTo(out, a, 0, b, ys, shade(STONE, 1.03), PLAIN)
    // the tall glazed slit up its west face, by the south corner, and a column of windows on the north
    windowOn(out, a, 0, b, ys, 3.1, 3.24, 11 / 32, 30 / 32, GLASS)
    for (const y of [14, 18, 22, 26]) windowOn(out, a, 0, b, ys, 2.45, 2.6, (y - 1.2) / 32, (y + 1.2) / 32, GLASS)
  }
  // ---- the petal over the entrance: a sail of limestone, bowed to the west, swelling out over the doors and rounding off
  {
    // a lens in plan, 11 m wide at its foot in the skirt and 14.5 m at the crest, its bow swelling out over the doors by 1 m past the
    // glass, the top edge rounded off and higher at the north; its back is in the tower
    const sail = (cx: number, r: number, spread: number, back: number): P2[] => {
      const bow = arc(cx, -3.8, r, rad(180 - spread), rad(180 + spread), 8)
      return [...bow, { x: back, z: bow[8].z }, { x: back, z: bow[0].z }]
    }
    const r0 = sail(-14.5, 9.5, 36, -17.5), r1 = sail(-15.5, 11.5, 36, -18.5), r2 = sail(-16, 13, 34, -19.5), r3 = sail(-16.5, 12, 30, -19.5)
    const flat = (ring: P2[], y: number): number[] => ring.map(() => y)
    loftTo(out, r0, 7, r1, flat(r1, 12), STONE, PLAIN)
    loftTo(out, r1, 12, r2, flat(r2, 16), STONE, PLAIN)
    loftTo(out, r2, 16, r3, r3.map((p) => 17.6 + (p.z + 3.8) * 0.08), STONE, PLAIN)
  }
  // ---- the shoulder block right of the tower: a bow in front of the wing, leaning out, its top sloping down to the south
  {
    const a = dee(-9, -20.5, 13, rad(160), rad(200), 5, -18.3)
    const b = dee(-10, -20.5, 13.3, rad(160), rad(200), 5, -18.3)
    const ys = b.map((p) => 21.5 + (p.z + 20.5) * 0.38)
    loftTo(out, a, 0, b, ys, STONE_DEEP, PLAIN)
    for (const y of [12, 16]) windowOn(out, a, 0, b, ys, 2.2, 2.8, (y - 0.9) / 21.5, (y + 0.9) / 21.5, GLASS)
  }

  // ---- the glass lobby along the west edge: panes in dark mullions, a transom, the doors, the canopy, the name
  const inner: P2 = { x: -12, z: -5 }
  const panes: P2[] = []
  for (let i = 0; i + 1 < G.length; i++) {
    const a = G[i], b = G[i + 1]
    const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.z - a.z) / 1.6))
    for (let k = 0; k < n; k++) panes.push({ x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n })
  }
  panes.push(G[G.length - 1])
  stripWall(out, panes, 0.15, 6.5, inner, LOBBY, GLAZED)
  stripWall(out, G, 0, 0.15, inner, shade(STONE, 0.7), PLAIN)
  stripWall(out, G, 3.25, 3.4, inner, MULLION)
  for (const p of panes) {
    panel(out, [[p.x - 0.08, 0, p.z - 0.08], [p.x + 0.08, 0, p.z + 0.08], [p.x + 0.08, 6.5, p.z + 0.08], [p.x - 0.08, 6.5, p.z - 0.08]], [inner.x, 3, inner.z], MULLION)
    panel(out, [[p.x - 0.08, 0, p.z + 0.08], [p.x + 0.08, 0, p.z - 0.08], [p.x + 0.08, 6.5, p.z - 0.08], [p.x - 0.08, 6.5, p.z + 0.08]], [inner.x, 3, inner.z], MULLION)
  }
  // the doors, three pairs in the middle run, in heavier frames
  {
    const w = wallOn(out, G[3], G[4])
    for (const u of [0.9, 2.7, 4.5]) {
      w.rect(u - 0.85, u + 0.85, 0.15, 2.7, MULLION, 0.1)
      w.rect(u - 0.7, u + 0.7, 0.2, 2.6, shade(LOBBY, 0.8), 0.12)
    }
  }
  // the canopy at door height: a thin sheet of glass out over the pavement, on the middle three runs
  {
    const run = G.slice(2, 6)
    const outer = run.map((p) => ({ x: p.x - 2.2, z: p.z }))
    for (let i = 0; i + 1 < run.length; i++) {
      const a = run[i], b = run[i + 1], c = outer[i + 1], d = outer[i]
      panel(out, [[a.x, 3.72, a.z], [b.x, 3.72, b.z], [c.x, 3.62, c.z], [d.x, 3.62, d.z]], [inner.x, -10, inner.z], hex('#8a9ca4'))
      panel(out, [[a.x, 3.6, a.z], [b.x, 3.6, b.z], [c.x, 3.5, c.z], [d.x, 3.5, d.z]], [inner.x, 30, inner.z], hex('#6f7f86'))
      panel(out, [[d.x, 3.5, d.z], [c.x, 3.5, c.z], [c.x, 3.62, c.z], [d.x, 3.62, d.z]], [inner.x, 3.5, inner.z], MULLION)
    }
  }
  // the name on the glass, in pale capitals, facing the park
  sign(out, { type: 'flat', text: 'LA CINÉMATHÈQUE FRANÇAISE', h: 0.8, face: 'grotesque', weight: 'bold', colour: hex('#e9eff1'), lit: 'none', w: 24 }, { x: -27.4, y: 5.1, z: -4.5, heading: -Math.PI / 2 })

  // ---- the zinc skirt: a fascia on the eave, the soffit back to the glass, and the sweep up from the eave to the stone, steeper and higher at the north
  stripWall(out, E, 6.5, 7.2, inner, shade(ZINC, 0.9), METAL)
  for (let i = 0; i + 1 < E.length; i++) {
    panel(out, [[E[i].x, 6.5, E[i].z], [E[i + 1].x, 6.5, E[i + 1].z], [G[i + 1].x, 6.5, G[i + 1].z], [G[i].x, 6.5, G[i].z]], [inner.x, 20, inner.z], shade(ZINC, 0.8), METAL)
    panel(out, [[E[i].x, 7.2, E[i].z], [E[i + 1].x, 7.2, E[i + 1].z], [I[i + 1].x, I_Y[i + 1], I[i + 1].z], [I[i].x, I_Y[i], I[i].z]], [inner.x, 2, inner.z], ZINC, METAL)
  }
}
