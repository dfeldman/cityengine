import { MeshBuilder } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { classicalColumn } from '../column.ts'
import { block, hex, roof, shade } from '../kit.ts'
import { clockFace, sign } from '../parts.ts'
import { arcade, archOn, archRing, pedimentOn, rectOn, segmentOn, squareDome } from './palaces/common.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type P = [number, number]

/**
 * THE PALAIS DU LOUVRE (top-25 audit, 2026-10-30). It was OSM's outline, 25 m high, in the city's classical dress: an apartment block 700 m
 * long with no pavilions and no colonnade (the entry's own note: "the pavilions' own taller roofs are wanted next"). Now the palace as its
 * parts, each wing on its line off OSM's relation 3262297 and IGN's aerial, because they do not run parallel: the Seine gallery and the Rue
 * de Rivoli range close on each other by 7 degrees, the Cour Carrée stands a little off both. Local x is east, z north (the entry turns it
 * nothing and stands at the outline's middle), so a number here can be checked against the aerial.
 *
 * - THE COUR NAPOLÉON: Lefuel's fronts off "Musée de Louvre, Richelieu Wing and Sully Wing, 10 September 2008.jpg": an arcade, statues of the
 *   great men on the string, tall windows with pediments, balustrade and slate; PAVILLON SULLY off "Pavillon Sully 2012-05-25.jpg", feature by
 *   feature (the rose columns at the passage, the clock, the caryatids, the pediment, the square dome, the flag), Richelieu and Denon on the
 *   same body; Colbert, Daru, Turgot, Mollien with their truncated roofs;
 * - THE COUR CARRÉE: three tiers round the court, frontispieces in the middle of each side; to the east PERRAULT'S COLONNADE over its moat
 *   (paired columns, central pediment, end pavilions, the flat balustraded skyline that is the point of it); the giant order on the Seine and
 *   Rivoli sides, no roof to be seen, as it is;
 * - the GRANDE GALERIE along the river with its alternating pediments, PORTE DES LIONS and the GUICHETS DU CARROUSEL, the PAVILLON DE FLORE;
 *   the Rivoli range, the Rohan guichets, the PAVILLON DE MARSAN; the glazed roofs of the Cours Marly, Puget and Khorsabad.
 *
 * Every passage the ride graph runs through this outline (`passages.ts` draws the vault) is an open arch here; the numbers are where those
 * edges cross each wing. The ground is +1 m round the palace, +2.4 in the Cour Carrée and −3 in the Colonnade's moat, so everything stands
 * from y = −5 and the entry gives its own `baseY`.
 */
const STONE: Rgb = hex('#c4baa4')
const TRIM: Rgb = shade(STONE, 1.07)
const BAND: Rgb = shade(STONE, 0.9)
const DEEP: Rgb = shade(STONE, 0.62)
const COURT: Rgb = shade(STONE, 0.96)
const GLASS: Rgb = [0.16, 0.18, 0.2]
const PANE: Rgb = [0.27, 0.3, 0.33]
const SLATE: Rgb = hex('#50575e')
const LEAD: Rgb = hex('#696e72')
const ROSE: Rgb = hex('#b08f84')
const DARK: Rgb = hex('#3a3d3c')
const GLAZED: Rgb = hex('#86aaa2')
const plain = surfaceTag('stucco')
const LOW = -5

/** Everything is drawn in a frame of its own (x along, −z out) and set into the plan by this, a turn about y: no spread, these are long. */
export function into(out: MeshBuilder, q: MeshBuilder, a: P, c: number, s: number): void {
  const base = out.positions.length / 3
  const n = q.positions.length
  for (let i = 0; i < n; i += 3) {
    const x = q.positions[i], z = q.positions[i + 2]
    out.positions.push(a[0] + x * c - z * s, q.positions[i + 1], a[1] + x * s + z * c)
    const nx = q.normals[i], nz = q.normals[i + 2]
    out.normals.push(nx * c - nz * s, q.normals[i + 1], nx * s + nz * c)
  }
  for (let i = 0; i < q.uvs.length; i++) out.uvs.push(q.uvs[i])
  for (let i = 0; i < q.colors.length; i++) out.colors.push(q.colors[i])
  for (let i = 0; i < q.indices.length; i++) out.indices.push(base + q.indices[i])
  // (signs and clock hands are not geometry: they go with it, turned the same way)
  const th = Math.atan2(s, c)
  for (const g of q.signs) out.signs.push({ ...g, x: a[0] + g.x * c - g.z * s, z: a[1] + g.x * s + g.z * c, heading: g.heading - th })
  for (const k of q.clocks) out.clocks.push({ ...k, x: a[0] + k.x * c - k.z * s, z: a[1] + k.x * s + k.z * c, nx: k.nx * c - k.nz * s, nz: k.nx * s + k.nz * c })
}
/** A wall from A to B, its outside on the right as you walk it: `draw` makes it on z = 0, x from 0 to L, looking at −z. */
export function along(out: MeshBuilder, A: P, B: P, draw: (q: MeshBuilder, L: number) => void): void {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1])
  const q = new MeshBuilder()
  draw(q, L)
  into(out, q, A, (B[0] - A[0]) / L, (B[1] - A[1]) / L)
}

/** A strip standing `d` proud of the wall: its face, its two sides, its top. */
export function fin(q: MeshBuilder, x0: number, x1: number, y0: number, y1: number, d: number, c: Rgb): void {
  q.quad([[x0, y0, -d], [x1, y0, -d], [x1, y1, -d], [x0, y1, -d]], [0, 0, -1], UV, c, FIXED)
  q.quad([[x0, y0, 0], [x0, y0, -d], [x0, y1, -d], [x0, y1, 0]], [-1, 0, 0], UV, shade(c, 0.9), FIXED)
  q.quad([[x1, y0, -d], [x1, y0, 0], [x1, y1, 0], [x1, y1, -d]], [1, 0, 0], UV, shade(c, 0.9), FIXED)
  q.quad([[x0, y1, -d], [x1, y1, -d], [x1, y1, 0], [x0, y1, 0]], [0, 1, 0], UV, shade(c, 1.04), FIXED)
}
/** A cornice: the fin that overhangs, its underside shaded, because that is the line that draws the building from below. */
export function cornice(q: MeshBuilder, x0: number, x1: number, y0: number, y1: number, d: number, c: Rgb): void {
  fin(q, x0, x1, y0, y1, d, c)
  q.quad([[x0, y0, 0], [x1, y0, 0], [x1, y0, -d], [x0, y0, -d]], [0, -1, 0], UV, shade(c, 0.6), FIXED)
}
/** A window: a surround, a pane, its glazing bars. */
export function win(q: MeshBuilder, x: number, y: number, w: number, h: number, bars = true): void {
  rectOn(q, '-z', 0, x - w / 2 - 0.28, x + w / 2 + 0.28, y - 0.25, y + h + 0.25, TRIM, 0.04)
  rectOn(q, '-z', 0, x - w / 2, x + w / 2, y, y + h, GLASS, 0.07)
  if (bars) {
    rectOn(q, '-z', 0, x - 0.04, x + 0.04, y, y + h, PANE, 0.09)
    rectOn(q, '-z', 0, x - w / 2, x + w / 2, y + h * 0.62, y + h * 0.62 + 0.08, PANE, 0.09)
  }
}
/** A short figure on the string or the balustrade: a mass, shoulders, a head. */
export function fig(q: MeshBuilder, x: number, y: number, z: number, h: number, c: Rgb): void {
  prism(q, x, z, y, y + h * 0.74, h * 0.15, 5, shade(c, 0.94), plain, h * 0.11)
  prism(q, x, z, y + h * 0.74, y + h, h * 0.075, 5, c, plain, h * 0.05)
}
/** The balustrade along x0..x1 on a wall's top: a plinth, the dark of the gap, a rail, the posts. */
export function balus(q: MeshBuilder, x0: number, x1: number, y: number, pitch = 4.2): void {
  fin(q, x0, x1, y, y + 0.25, 0.25, TRIM)
  rectOn(q, '-z', 0, x0, x1, y + 0.25, y + 0.95, DEEP, 0.08)
  const n = Math.max(1, Math.round((x1 - x0) / 0.75))
  // (the balusters, on the wall's face, wider apart than the real ones and two triangles each)
  for (let i = 0; i < n; i++) rectOn(q, '-z', 0, x0 + ((i + 0.5) * (x1 - x0)) / n - 0.11, x0 + ((i + 0.5) * (x1 - x0)) / n + 0.11, y + 0.25, y + 0.95, TRIM, 0.13)
  fin(q, x0, x1, y + 0.95, y + 1.15, 0.28, TRIM)
  const m = Math.max(1, Math.round((x1 - x0) / pitch))
  for (let i = 0; i <= m; i++) { const x = x0 + ((x1 - x0) * i) / m; fin(q, x - 0.25, x + 0.25, y, y + 1.3, 0.3, TRIM) }
}
/** Stone lucarne on a roof's slope. */
function dormer(q: MeshBuilder, x: number, y: number, z: number, w = 1.5, h = 2.6): void {
  block(q, x - w / 2 - 0.3, x + w / 2 + 0.3, z, z + 1.6, y, y + h, TRIM)
  q.quad([[x - w / 2, y + 0.3, z - 0.04], [x + w / 2, y + 0.3, z - 0.04], [x + w / 2, y + h - 0.4, z - 0.04], [x - w / 2, y + h - 0.4, z - 0.04]], [0, 0, -1], UV, GLASS, FIXED)
  q.quad([[x - w / 2 - 0.5, y + h, z], [x + w / 2 + 0.5, y + h, z], [x, y + h + 1, z], [x, y + h + 1, z]], [0, 0, -1], UV, TRIM, FIXED)
  q.quad([[x - w / 2 - 0.5, y + h, z], [x, y + h + 1, z], [x, y + h + 1, z + 1.6], [x - w / 2 - 0.5, y + h, z + 1.6]], [-0.5, 0.8, 0], UV, SLATE, FIXED)
  q.quad([[x, y + h + 1, z], [x + w / 2 + 0.5, y + h, z], [x + w / 2 + 0.5, y + h, z + 1.6], [x, y + h + 1, z + 1.6]], [0.5, 0.8, 0], UV, SLATE, FIXED)
}

interface Gate { x: number; w: number; crown: number }
/** The ground storey up to `top`: a wall from LOW with every arch in it, the decorative ones `depth` deep to a dark back, the gates open through it. */
function ground(q: MeshBuilder, L: number, top: number, gates: Gate[], D: number, blind: { x: number; w: number; crown: number; depth: number }[] = [], c: Rgb = STONE): void {
  const all = [...gates.map((g) => ({ ...g, depth: D / 2, open: true })), ...blind.filter((b) => !gates.some((g) => Math.abs(g.x - b.x) < g.w / 2 + b.w / 2 + 0.6)).map((b) => ({ ...b, open: false }))]
  all.sort((a, b) => a.x - b.x)
  let x = 0
  all.forEach((a, i) => {
    const next = all[i + 1]
    const end = next ? (a.x + a.w / 2 + next.x - next.w / 2) / 2 : L
    arcade(q, 0, x, end, LOW, top, [a.x], a.w, a.crown - LOW, a.depth, c, DEEP, a.open ? null : GLASS, a.open ? 8 : 4)
    x = end
  })
  if (x < L) q.quad([[x, LOW, 0], [L, LOW, 0], [L, top, 0], [x, top, 0]], [0, 0, -1], UV, c, FIXED)
  if (!all.length) return
}

type Face = (q: MeshBuilder, L: number, g: Gate[], D: number) => void

/** Lefuel's front on the Cour Napoléon and the Carrousel: the arcade, statues on the string, tall pedimented windows, balustrade. */
function napoleon(statues: boolean): Face {
  return (q, L, g, D) => {
    const n = Math.max(1, Math.round(L / 6.8))
    const bay = L / n
    const xs = Array.from({ length: n }, (_, i) => (i + 0.5) * bay)
    const blind = xs.map((x) => ({ x, w: 3.7, crown: 8.8, depth: 1.3 }))
    ground(q, L, 21, g, D, blind)
    for (const x of xs) {
      if (!g.some((h) => Math.abs(h.x - x) < h.w / 2 + 1.5)) archRing(q, 0, x, 8.8 - 1.85, 1.85, 2.2, 0.12, TRIM, BAND, 4)
    }
    cornice(q, 0, L, 9.5, 10.4, 0.55, TRIM)
    xs.forEach((x, i) => {
      win(q, x, 11.5, 2.2, 5.6)
      if (i % 2) pedimentOn(q, '-z', 0, x - 1.7, x + 1.7, 17.4, 1, 0.3, TRIM)
      else segmentOn(q, '-z', 0, x, 17.4, 3.3, 0.9, TRIM, 0.3)
      // the piers between: rusticated every other, the great men in front of them
      if (i < n - 1) {
        const xp = x + bay / 2
        if (i % 3 === 2) fin(q, xp - 1, xp + 1, 10.4, 19.4, 0.3, BAND)
        else if (statues) { block(q, xp - 0.45, xp + 0.45, -0.95, 0, 10.4, 11, TRIM); fig(q, xp, 11, -0.55, 3.2, TRIM) }
      }
    })
    cornice(q, 0, L, 19.4, 20.5, 0.8, TRIM)
    balus(q, 0, L, 20.5, bay * 2)
  }
}
/** The Rue de Rivoli, and whatever is not meant to be looked at: two tiers of plain windows over an arched ground floor. */
const rivoli: Face = (q, L, g, D) => {
  const n = Math.max(1, Math.round(L / 5.6))
  const bay = L / n
  const blind: { x: number; w: number; crown: number; depth: number }[] = []
  ground(q, L, 20, g, D, blind)
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * bay
    if (g.some((h) => Math.abs(h.x - x) < h.w / 2 + 1.6)) { win(q, x, 14.8, 1.9, 3.1); continue }
    archOn(q, '-z', 0, x, 1.4, 2.5, 5.2, GLASS)
    win(q, x, 8.4, 2, 4.6, false)
    if (i % 2) pedimentOn(q, '-z', 0, x - 1.5, x + 1.5, 13.1, 0.8, 0.25, TRIM)
    win(q, x, 14.8, 1.9, 3.1, false)
    if (i % 3 === 0) fin(q, x - bay / 2 - 0.35, x - bay / 2 + 0.35, 7.3, 18.8, 0.22, BAND)
  }
  cornice(q, 0, L, 7.1, 7.5, 0.3, TRIM)
  cornice(q, 0, L, 18.8, 20, 0.8, TRIM)
}
/** A court's walls: unseen but from above and across a roof. */
const inner: Face = (q, L, g, D) => {
  const n = Math.max(1, Math.round(L / 7))
  ground(q, L, 20, g, D, [], COURT)
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * (L / n)
    if (g.some((h) => Math.abs(h.x - x) < h.w / 2 + 1.6)) continue
    rectOn(q, '-z', 0, x - 1.1, x + 1.1, 3, 8, GLASS, 0.06)
    rectOn(q, '-z', 0, x - 1.1, x + 1.1, 11, 16.5, GLASS, 0.06)
  }
  cornice(q, 0, L, 18.8, 20, 0.6, TRIM)
}
/** The Grande Galerie to the Seine: rusticated mezzanine and ground floor, a giant order in pairs, each second bay carrying a triangular pediment and the others a segmental one. */
const seine: Face = (q, L, g, D) => {
  const bay = 7.6
  const n = Math.max(1, Math.round(L / bay))
  const b = L / n
  ground(q, L, 20.5, g, D, [])
  for (let y = 2; y < 8.4; y += 1) rectOn(q, '-z', 0, 0, L, y, y + 0.09, BAND, 0.025)
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * b
    const hit = g.some((h) => Math.abs(h.x - x) < h.w / 2 + 2)
    if (!hit) archOn(q, '-z', 0, x, 1.5, 2.6, 4.4, GLASS)
    if (!hit) rectOn(q, '-z', 0, x - 0.9, x + 0.9, 6.2, 8, GLASS, 0.06)
    if (!g.some((h) => Math.abs(h.x - x) < h.w / 2 && h.crown > 11)) win(q, x, 10.2, 2.4, 6)
    if (i % 2) pedimentOn(q, '-z', 0, x - b * 0.45, x + b * 0.45, 19.9, 1.7, 0.5, TRIM)
    else segmentOn(q, '-z', 0, x, 19.9, b * 0.9, 1.5, TRIM, 0.5)
    for (const s of [-0.42, -0.26, 0.26, 0.42]) fin(q, x + s * b - 0.3, x + s * b + 0.3, 8.8, 18.8, 0.3, TRIM)
  }
  cornice(q, 0, L, 8.6, 9.2, 0.5, TRIM)
  cornice(q, 0, L, 18.7, 19.9, 0.8, TRIM)
}
/** The Cour Carrée: three tiers of pilasters, windows with pediments, a frontispiece in the middle. */
function courCarree(y0: number): Face {
  return (q, L, g, D) => {
    const n = Math.max(1, Math.round(L / 6.3))
    const b = L / n
    ground(q, L, 24, g, D, [], STONE)
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * b
      const mid = Math.abs(x - L / 2) < 9.5
      if (!g.some((h) => Math.abs(h.x - x) < h.w / 2 + 1.6)) archOn(q, '-z', 0, x, y0, 2.6, 5.2, GLASS)
      win(q, x, y0 + 7, 2.2, 4.9, false)
      if (i % 2) pedimentOn(q, '-z', 0, x - 1.6, x + 1.6, y0 + 12.05, 0.9, 0.25, TRIM)
      else segmentOn(q, '-z', 0, x, y0 + 12.05, 3.2, 0.8, TRIM, 0.25)
      rectOn(q, '-z', 0, x - 0.9, x + 0.9, y0 + 15, y0 + 17.7, GLASS, 0.06)
      if (!mid) {
        const xp = x - b / 2
        fin(q, xp - 0.34, xp + 0.34, y0 - 0.4, y0 + 6, 0.24, TRIM)
        fin(q, xp - 0.3, xp + 0.3, y0 + 6.6, y0 + 13.8, 0.22, TRIM)
        fin(q, xp - 0.26, xp + 0.26, y0 + 14.4, y0 + 18.6, 0.2, TRIM)
      }
    }
    cornice(q, 0, L, y0 + 5.8, y0 + 6.5, 0.4, TRIM)
    cornice(q, 0, L, y0 + 13.5, y0 + 14.3, 0.4, TRIM)
    cornice(q, 0, L, y0 + 18.6, y0 + 19.8, 0.8, TRIM)
    balus(q, 0, L, y0 + 19.8, b * 2)
    // the frontispiece: four columns on each tier and the pediment over the attic
    const m = L / 2
    fin(q, m - 9.5, m + 9.5, y0 - 1, y0 + 18.6, 0.8, COURT)
    q.quad([[m - 10.4, y0 + 19.8, -0.8], [m + 10.4, y0 + 19.8, -0.8], [m, y0 + 23.4, -0.8], [m, y0 + 23.4, -0.8]], [0, 0, -1], UV, TRIM, FIXED)
    for (const s of [-8.2, -2.8, 2.8, 8.2]) {
      prism(q, m + s, -1.2, y0, y0 + 6, 0.42, 6, TRIM, plain)
      prism(q, m + s, -1.2, y0 + 6.5, y0 + 13.6, 0.38, 6, TRIM, plain)
    }
  }
}
/** The giant order on the outside of the Cour Carrée's Seine and Rivoli sides: a high plain base, tall windows, the balustrade and no roof. */
const perrault: Face = (q, L, g, D) => {
  const n = Math.max(1, Math.round(L / 6.8))
  const b = L / n
  ground(q, L, 27, g, D, [])
  cornice(q, 0, L, 9.2, 10, 0.5, TRIM)
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * b
    if (!g.some((h) => Math.abs(h.x - x) < h.w / 2 + 1.6)) rectOn(q, '-z', 0, x - 0.9, x + 0.9, 3.4, 7.2, GLASS, 0.06)
    win(q, x, 11.6, 2.5, 7.8)
    if (i % 2) pedimentOn(q, '-z', 0, x - 1.8, x + 1.8, 19.8, 1, 0.3, TRIM)
    else segmentOn(q, '-z', 0, x, 19.8, 3.6, 0.9, TRIM, 0.3)
    fin(q, x - b / 2 - 0.42, x - b / 2 + 0.42, 10, 24, 0.3, TRIM)
  }
  cornice(q, 0, L, 24, 25.6, 1, TRIM)
  balus(q, 0, L, 25.6, b * 2)
  // the middle: a pavilion a step out and a pediment
  const m = L / 2
  fin(q, m - 11, m + 11, 10, 24, 0.5, COURT)
  q.quad([[m - 12, 25.6, -1.05], [m + 12, 25.6, -1.05], [m, 29.5, -1.05], [m, 29.5, -1.05]], [0, 0, -1], UV, TRIM, FIXED)
}
/** Perrault's Colonnade: a high base, the paired columns standing clear of a recessed wall, the end and middle pavilions, the balustrade. */
const colonnade: Face = (q, L, g, D) => {
  const END = 24
  const m = L / 2
  ground(q, L, 10.4, g, D, [])
  // the base's windows, small and square in plain stone, and the moat wall's cornice
  for (let x = 5; x < L - 2; x += 7.2) {
    if (g.some((h) => Math.abs(h.x - x) < h.w / 2 + 1.6)) continue
    rectOn(q, '-z', 0, x - 1, x + 1, 3.2, 7, GLASS, 0.06)
  }
  cornice(q, 0, L, 9.3, 10.4, 0.8, TRIM)
  const Y0 = 10.4
  const CAP = 25
  const REC = 4.2
  // the recessed wall and its tall niched windows, ceiling and floor of the peristyle
  block(q, END, m - 13, REC, REC + 1, Y0, CAP, shade(STONE, 0.66))
  block(q, m + 13, L - END, REC, REC + 1, Y0, CAP, shade(STONE, 0.66))
  for (const [a, b] of [[END, m - 13], [m + 13, L - END]] as const) {
    const n = Math.round((b - a) / 7.2)
    for (let i = 0; i < n; i++) {
      const x = a + ((i + 0.5) * (b - a)) / n
      const pair = (b - a) / n
      q.quad([[x - 1.2, Y0 + 2.6, REC - 0.04], [x + 1.2, Y0 + 2.6, REC - 0.04], [x + 1.2, Y0 + 10.2, REC - 0.04], [x - 1.2, Y0 + 10.2, REC - 0.04]], [0, 0, -1], UV, GLASS, FIXED)
      q.quad([[x - 1.5, Y0 + 10.3, REC - 0.04], [x + 1.5, Y0 + 10.3, REC - 0.04], [x + 1.5, Y0 + 11.5, REC - 0.04], [x - 1.5, Y0 + 11.5, REC - 0.04]], [0, 0, -1], UV, TRIM, FIXED)
      // the columns in pairs, at the bay's ends
      for (const e of [-pair / 2, pair / 2]) {
        for (const s of [-0.75, 0.75]) classicalColumn(q, x + e + s, 0.1, Y0, CAP, 0.56, shade(STONE, 1.08), { order: 'corinthian', tier: 'mid', tag: plain, trim: TRIM })
      }
    }
    q.quad([[a, Y0 + 0.02, -0.6], [b, Y0 + 0.02, -0.6], [b, Y0 + 0.02, REC], [a, Y0 + 0.02, REC]], [0, 1, 0], UV, BAND, FIXED)
    q.quad([[a, CAP, -0.6], [b, CAP, -0.6], [b, CAP, REC], [a, CAP, REC]], [0, -1, 0], UV, shade(STONE, 0.72), FIXED)
  }
  // the entablature and the balustrade, the length of it
  block(q, 0, L, -0.65, REC + 1, CAP, CAP + 3, TRIM)
  q.quad([[0, CAP + 1, -0.67], [L, CAP + 1, -0.67], [L, CAP + 1.8, -0.67], [0, CAP + 1.8, -0.67]], [0, 0, -1], UV, STONE, FIXED)
  q.quad([[0, CAP + 3, -0.9], [L, CAP + 3, -0.9], [L, CAP + 3, 0], [0, CAP + 3, 0]], [0, 1, 0], UV, TRIM, FIXED)
  q.quad([[0, CAP + 2.7, -0.9], [L, CAP + 2.7, -0.9], [L, CAP + 3, -0.9], [0, CAP + 3, -0.9]], [0, 0, -1], UV, TRIM, FIXED)
  balus(q, 0, L, CAP + 3, 6)
  // the end pavilions: solid, an order of pilasters on a great arched niche
  for (const x0 of [0, L - END]) {
    block(q, x0, x0 + END, -0.2, REC + 1, Y0, CAP, STONE)
    const c = x0 + END / 2
    q.quad([[c - 3.4, Y0 + 2.4, -0.25], [c + 3.4, Y0 + 2.4, -0.25], [c + 3.4, Y0 + 9, -0.25], [c - 3.4, Y0 + 9, -0.25]], [0, 0, -1], UV, DEEP, FIXED)
    archOn(q, '-z', -0.2, c, Y0 + 2.4, 5.4, 11, GLASS, 0.1)
    for (const s of [-10.6, -6.2, 6.2, 10.6]) fin(q, c + s - 0.5, c + s + 0.5, Y0, CAP, 0.42, TRIM)
  }
  // the middle pavilion: eight columns, a great arched door over the gate, the pediment
  block(q, m - 13, m + 13, -0.4, REC + 1, Y0, CAP, STONE)
  win(q, m, Y0 + 3, 3, 7)
  for (const s of [-11.2, -9.6, -3.6, -2, 2, 3.6, 9.6, 11.2]) classicalColumn(q, m + s, -1, Y0, CAP, 0.56, shade(STONE, 1.08), { order: 'corinthian', tier: 'mid', tag: plain, trim: TRIM })
  q.quad([[m - 14.5, CAP + 3, -1], [m + 14.5, CAP + 3, -1], [m, CAP + 8.2, -1], [m, CAP + 8.2, -1]], [0, 0, -1], UV, TRIM, FIXED)
  for (const s of [-1, 1]) {
    const a: [number, number, number] = [m + s * 15, CAP + 2.8, -1.4], b: [number, number, number] = [m, CAP + 8.6, -1.4]
    q.quad([a, b, [b[0], b[1] + 0.7, b[2]], [a[0], a[1] + 0.7, a[2]]], [0, 0, -1], UV, TRIM, FIXED)
    q.quad([[a[0], a[1] + 0.7, -1.4], [b[0], b[1] + 0.7, -1.4], [b[0], b[1] + 0.7, 2], [a[0], a[1] + 0.7, 2]], [s * 0.34, 0.94, 0], UV, TRIM, FIXED)
    fig(q, m + s * 7.4, CAP + 3, -0.6, 0.01, TRIM)
  }
  // a low figure in the tympanum: the bust and the groups of the real one, massed
  prism(q, m, -1.06, CAP + 3.4, CAP + 6.4, 1, 6, BAND, plain, 0.4)
  for (const s of [-1, 1]) q.quad([[m + s * 2, CAP + 3.3, -1.06], [m + s * 8.4, CAP + 3.3, -1.06], [m + s * 2, CAP + 5.4, -1.06], [m + s * 2, CAP + 5.4, -1.06]], [0, 0, -1], UV, BAND, FIXED)
}

/** A wing: its two faces (walk A→B: `right`, then `left` coming back), its ends, its roof. */
interface WingOpts { right: Face; left: Face; eaves: number; roof?: number; set?: number; flat?: boolean; gates?: Gate[]; dormers?: number; ends?: boolean; roofY?: number }
function wing(out: MeshBuilder, A: P, B: P, D: number, o: WingOpts): void {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1])
  const ex = (B[0] - A[0]) / L, ez = (B[1] - A[1]) / L
  const rx = ez, rz = -ex
  const h = D / 2
  const g = o.gates ?? []
  // the faces. `gates` count from A along the wing; going back on the left, from the other end
  along(out, [A[0] + rx * h, A[1] + rz * h], [B[0] + rx * h, B[1] + rz * h], (q) => o.right(q, L, g, D))
  along(out, [B[0] - rx * h, B[1] - rz * h], [A[0] - rx * h, A[1] - rz * h], (q) => o.left(q, L, g.map((k) => ({ ...k, x: L - k.x })), D))
  const q = new MeshBuilder()
  // the ends (x along the wing, z = 0 its axis)
  if (o.ends) {
    q.quad([[0, LOW, -h], [0, LOW, h], [0, o.eaves, h], [0, o.eaves, -h]], [-1, 0, 0], UV, STONE, FIXED)
    q.quad([[L, LOW, h], [L, LOW, -h], [L, o.eaves, -h], [L, o.eaves, h]], [1, 0, 0], UV, STONE, FIXED)
  }
  const ry = o.roofY ?? o.eaves
  if (o.flat) {
    q.quad([[0, ry - 0.1, -h], [L, ry - 0.1, -h], [L, ry - 0.1, h], [0, ry - 0.1, h]], [0, 1, 0], UV, LEAD, FIXED)
    // the low leads behind the balustrade
    roof(q, 1, L - 1, -h + 2.5, h - 2.5, ry, 1.2, 0.5, h - 2.6, LEAD)
  } else {
    const R = o.roof ?? 7
    const set = o.set ?? 3.6
    roof(q, 0, L, -h - 0.1, h + 0.1, ry, R, 0.01, set + 0.1, SLATE)
    q.quad([[0, ry + R, -h + set], [L, ry + R, -h + set], [L, ry + R, h - set], [0, ry + R, h - set]], [0, 1, 0], UV, shade(LEAD, 0.9), FIXED)
    if (o.dormers) {
      const n = Math.max(1, Math.round(L / o.dormers))
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * (L / n)
        // (the −z slope's only: the other looks at a court or at a street too close under it to see it)
        dormer(q, x, ry + 0.2, -h + 1.1)
      }
    }
  }
  into(out, q, A, ex, ez)
}

/** The hip of a court's glazed roof (the turquoise of the aerial): a quadrilateral pitched in to its middle, with ribs. */
function glazed(out: MeshBuilder, ring: P[], y: number, h: number): void {
  const cx = ring.reduce((a, p) => a + p[0], 0) / ring.length
  const cz = ring.reduce((a, p) => a + p[1], 0) / ring.length
  const top = ring.map((p): P => [cx + (p[0] - cx) * 0.3, cz + (p[1] - cz) * 0.3])
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], c = top[(i + 1) % ring.length], d = top[i]
    const n: [number, number, number] = [(a[0] + b[0]) / 2 - cx, 18, (a[1] + b[1]) / 2 - cz]
    const l = Math.hypot(n[0], n[1], n[2])
    out.quad([[a[0], y, a[1]], [b[0], y, b[1]], [c[0], y + h, c[1]], [d[0], y + h, d[1]]], [n[0] / l, n[1] / l, n[2] / l], UV, GLAZED, FIXED)
    // the ribs, up the slope
    for (let k = 1; k < 5; k++) {
      const t = k / 5
      const p: P = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      const r: P = [d[0] + (c[0] - d[0]) * t, d[1] + (c[1] - d[1]) * t]
      const tx = b[0] - a[0], tz = b[1] - a[1]
      const tl = Math.hypot(tx, tz)
      const wx = (tx / tl) * 0.1, wz = (tz / tl) * 0.1
      out.quad([[p[0] - wx, y + 0.05, p[1] - wz], [p[0] + wx, y + 0.05, p[1] + wz], [r[0] + wx, y + h + 0.05, r[1] + wz], [r[0] - wx, y + h + 0.05, r[1] - wz]], [n[0] / l, n[1] / l, n[2] / l], UV, LEAD, FIXED)
    }
  }
  out.quad([[top[0][0], y + h, top[0][1]], [top[1][0], y + h, top[1][1]], [top[2][0], y + h, top[2][1]], [top[3 % top.length][0], y + h, top[3 % top.length][1]]], [0, 1, 0], UV, GLAZED, FIXED)
}

/** The shell of a pavilion, front and back open at a gate: its side walls, so a body has no inside to block the way through. */
function shell(q: MeshBuilder, hw: number, d: number, top: number): void {
  q.quad([[-hw, LOW, d], [-hw, LOW, 0], [-hw, top, 0], [-hw, top, d]], [-1, 0, 0], UV, STONE, FIXED)
  q.quad([[hw, LOW, 0], [hw, LOW, d], [hw, top, d], [hw, top, 0]], [1, 0, 0], UV, STONE, FIXED)
}

/**
 * The front of a Pavillon of the Sully kind, off its photograph: the x and y are the picture's, 0.0305 m to the pixel.
 */
function grandFront(p: MeshBuilder, name: string, hw: number, gates: number[], clock: boolean): void {
  // ---- the ground storey to y = 11.6: the middle arch between its rose columns, the side arches, the oculi
  const arches: { x: number; w: number; crown: number }[] = gates.map((x) => ({ x, w: 4.4, crown: 8.8 }))
  const blind = [{ x: -11.6, w: 4.4, crown: 8.8, depth: 1.8 }, { x: 11.6, w: 4.4, crown: 8.8, depth: 1.8 }, { x: 0, w: 4.8, crown: 8.8, depth: 1.6 }]
  const q = p
  groundOf(q, hw, 24.4, arches, blind)
  for (const x of [...new Set([-11.6, 11.6, 0, ...gates])]) if (!gates.some((g) => g !== x && Math.abs(g - x) < 3.6)) archRing(q, 0, x, 8.8 - 2.3, 2.3, 2.7, 0.15, TRIM, BAND, 6)
  for (const s of [-1, 1]) {
    if (!gates.some((g) => Math.abs(g - s * 3.75) < 2.6)) {
      prism(q, s * 3.75, -0.9, 1.2, 10.3, 0.46, 8, ROSE, plain)
      box(q, s * 3.75, 10.6, -0.9, 0.62, 0.3, 0.62, TRIM, FIXED)
      box(q, s * 3.75, 0.9, -0.9, 0.62, 0.3, 0.62, TRIM, FIXED)
    }
    // the door beside it, the oculus over the door
    if (!gates.some((g) => Math.abs(g - s * 6.6) < 3.8)) rectOn(q, '-z', 0, s * 6.6 - 1.3, s * 6.6 + 1.3, 1.2, 6, GLASS, 0.06)
    prism(q, s * 6.6, -0.05, 7.8, 9.8, 1, 8, GLASS, FIXED)
    // the pairs of attached columns on the ground storey and the first
    for (const c of [8.6, 9.8, 14.6]) prism(q, s * c, -0.32, 1.2, 10.6, 0.42, 6, TRIM, plain)
    for (const c of [8.5, 9.8]) prism(q, s * c, -0.32, 12.6, 19.2, 0.42, 6, TRIM, plain)
    prism(q, s * 3, -0.32, 12.6, 19.2, 0.42, 6, TRIM, plain)
    // the windows of the first floor and their rusticated flank
    win(q, s * 5.6, 13.2, 2.1, 5)
    win(q, s * 12, 13.2, 2.1, 4.4)
    pedimentOn(q, '-z', 0, s * 12 - 1.8, s * 12 + 1.8, 18, 0.9, 0.3, TRIM)
    fin(q, s * hw - s * 1.2 - 1.2, s * hw - s * 1.2 + 1.2, 11.6, 23.4, 0.3, BAND)
    for (let y = 12.5; y < 23; y += 0.75) rectOn(q, '-z', 0, s * hw - s * 1.2 - 1.2, s * hw - s * 1.2 + 1.2, y, y + 0.1, DEEP, 0.33)
    // the second floor's small windows, with their carved panels
    for (const x of [5.6, 12]) { win(q, s * x, 20.5, 1.6, 2, false); rectOn(q, '-z', 0, s * x + 1.15, s * x + 2.2, 20.4, 22.6, TRIM, 0.08) }
    // the figure on the shoulder, and the seated one on the wing's corner
    block(q, s * 14.5 - 0.8, s * 14.5 + 0.8, -0.7, 2, 24.4, 25.2, TRIM)
    fig(q, s * 14.5, 25.2, 0.6, 2.8, TRIM)
    // the volute that leads the wall up to the top storey
    q.quad([[s * 10, 24.5, -0.02], [s * 13, 24.5, -0.02], [s * 10, 28.4, -0.02], [s * 10, 28.4, -0.02]], [0, 0, -1], UV, TRIM, FIXED)
  }
  win(q, 0, 13, 3.1, 4.3)
  archOn(q, '-z', 0, 0, 17.3, 3.1, 1.8, GLASS)
  archRing(q, 0, 0, 17.4, 1.6, 2, 0.12, TRIM, BAND, 6)
  cornice(q, -hw, hw, 11, 12.2, 0.7, TRIM)
  cornice(q, -6.4, 6.4, 19.4, 20, 0.6, TRIM)
  sign(q, { type: 'flat', text: name, h: 0.42, w: 4.8, face: 'roman', colour: [0.82, 0.72, 0.5], tracking: 0.2, lit: 'none' }, { x: 0, y: 19.45, z: -0.63, heading: Math.PI })
  // the clock or a medallion
  if (clock) {
    prism(q, 0, -0.02, 20.2, 23.2, 0.01, 3, TRIM, FIXED)
    clockFace(q, 0, 21.8, -0.14, 0, -1, 1.2, { dial: [0.1, 0.1, 0.11], rim: [0.78, 0.62, 0.28], marks: [0.85, 0.72, 0.4], hands: [0.85, 0.72, 0.4] })
    for (const s of [-1, 1]) fig(q, s * 2.1, 20.2, -0.12, 2.6, TRIM)
  } else fin(q, -1.1, 1.1, 20.6, 22.8, 0.1, TRIM)
  cornice(q, -hw - 0.2, hw + 0.2, 23.4, 24.4, 1, TRIM)
  // ---- the top storey: x ±10, the arched windows, the caryatids
  const T = 1.2
  const F = (x: number, y: number): [number, number, number] => [x, y, T]
  q.quad([F(-10, 24.4), F(10, 24.4), F(10, 31), F(-10, 31)], [0, 0, -1], UV, STONE, FIXED)
  block(q, -10.4, 10.4, T - 0.5, T, 24.4, 25.4, TRIM)
  for (const x of [-5.4, 0, 5.4]) {
    q.quad([F(x - 1.5, 25.6), F(x + 1.5, 25.6), F(x + 1.5, 29), F(x - 1.5, 29)].map((v): [number, number, number] => [v[0], v[1], T - 0.05]) as [[number, number, number], [number, number, number], [number, number, number], [number, number, number]], [0, 0, -1], UV, GLASS, FIXED)
    for (let i = 0; i < 4; i++) {
      const a0 = (i / 4) * Math.PI, a1 = ((i + 1) / 4) * Math.PI
      q.quad([[x, 29, T - 0.05], [x + Math.cos(a0) * 1.5, 29 + Math.sin(a0) * 1.5, T - 0.05], [x + Math.cos(a1) * 1.5, 29 + Math.sin(a1) * 1.5, T - 0.05], [x, 29, T - 0.05]], [0, 0, -1], UV, GLASS, FIXED)
    }
    q.quad([[x - 0.03, 25.6, T - 0.08], [x + 0.03, 25.6, T - 0.08], [x + 0.03, 30.4, T - 0.08], [x - 0.03, 30.4, T - 0.08]], [0, 0, -1], UV, PANE, FIXED)
  }
  // the caryatids: in pairs at the corners and between the windows
  for (const x of [-9.4, -8.2, -2.7, 2.7, 8.2, 9.4]) fig(q, x, 25.4, T - 0.7, 5.2, TRIM)
  block(q, -11, 11, T - 1, T, 30.9, 31.8, TRIM)
  // the pediment, its figure massed
  q.quad([[-10.6, 31.8, T - 0.7], [10.6, 31.8, T - 0.7], [0, 35.4, T - 0.7], [0, 35.4, T - 0.7]], [0, 0, -1], UV, TRIM, FIXED)
  for (const s of [-1, 1]) {
    const a: [number, number, number] = [s * 11.3, 31.6, T - 1.1], b: [number, number, number] = [0, 35.8, T - 1.1]
    q.quad([a, b, [b[0], b[1] + 0.6, b[2]], [a[0], a[1] + 0.6, a[2]]], [0, 0, -1], UV, TRIM, FIXED)
    q.quad([[a[0], a[1] + 0.6, a[2]], [b[0], b[1] + 0.6, b[2]], [b[0], b[1] + 0.6, T + 1], [a[0], a[1] + 0.6, T + 1]], [s * 0.3, 0.95, 0], UV, TRIM, FIXED)
    q.quad([[s * 1.2, 32, T - 0.74], [s * 7, 32, T - 0.74], [s * 1.2, 34, T - 0.74], [s * 1.2, 34, T - 0.74]], [0, 0, -1], UV, BAND, FIXED)
  }
  prism(q, 0, T - 0.76, 32, 34.8, 0.9, 6, BAND, plain, 0.45)
}
/** A pavilion's front wall: `ground` is the wing's, in this frame with x from −hw. */
function groundOf(q: MeshBuilder, hw: number, top: number, gates: { x: number; w: number; crown: number }[], blind: { x: number; w: number; crown: number; depth: number }[]): void {
  const part = new MeshBuilder()
  ground(part, 2 * hw, top, gates.map((g) => ({ ...g, x: g.x + hw })), 16, blind.map((b) => ({ ...b, x: b.x + hw })))
  into(q, part, [-hw, 0], 1, 0)
}

interface PavOpts { hw: number; d: number; name: string; gates?: number[]; clock?: boolean; flag?: boolean; both?: boolean }
/** Sully, Richelieu, Denon: a body to the top of the third storey, a storey of caryatids narrower than it, the square dome. P is the middle of its front, f the way it looks. */
function grand(out: MeshBuilder, P0: P, f: P, o: PavOpts): void {
  const q = new MeshBuilder()
  const { hw, d } = o
  const gates = o.gates ?? []
  grandFront(q, o.name, hw, gates, o.clock ?? false)
  shell(q, hw, d, 24.4)
  // the back: the same front on the far side if it has one, a plain wall if not
  if (o.both) {
    const back = new MeshBuilder()
    grandFront(back, o.name, hw, gates.map((x) => -x), o.clock ?? false)
    into(q, back, [0, d], -1, 0)
  } else {
    const part = new MeshBuilder()
    ground(part, 2 * hw, 24.4, gates.map((x) => ({ x: hw - x, w: 4.4, crown: 8.8 })), 16)
    into(q, part, [hw, d], -1, 0)
  }
  // the top storey's flanks and lid, the square dome on it, in the photograph's lead with its pale ribs at the arrises
  const T = 1.2
  q.quad([[-10, 24.4, d - T], [-10, 24.4, T], [-10, 31.8, T], [-10, 31.8, d - T]], [-1, 0, 0], UV, STONE, FIXED)
  q.quad([[10, 24.4, T], [10, 24.4, d - T], [10, 31.8, d - T], [10, 31.8, T]], [1, 0, 0], UV, STONE, FIXED)
  block(q, -hw, hw, 0, d, 24.2, 24.4, LEAD)
  const cz = d / 2
  squareDome(q, 0, cz, 31.8, 9.8, 6.4, SLATE, 6, d / 2 - T - 0.3)
  // the crown
  block(q, -2.8, 2.8, cz - 1.8, cz + 1.8, 37.9, 38.6, DARK)
  for (const s of [-1, 1]) prism(q, s * 2.8, cz, 38, 39.6, 0.6, 5, DARK, FIXED, 0.2)
  prism(q, 0, cz, 38.6, 40.4, 0.8, 6, DARK, FIXED, 0.35)
  // the chimneys either side of the dome, as stone blocks
  for (const s of [-1, 1]) {
    block(q, s * 8.8 - 0.9, s * 8.8 + 0.9, cz - 1.4, cz + 1.4, 31.8, 37.5, STONE)
    block(q, s * 8.8 - 1.1, s * 8.8 + 1.1, cz - 1.6, cz + 1.6, 37.5, 38, TRIM)
  }
  if (o.flag) {
    prism(q, 0, cz, 40.4, 47, 0.07, 4, DARK, FIXED)
    const flag: Rgb[] = [hex('#1d3f8c'), hex('#eeeeee'), hex('#c8202f')]
    for (let i = 0; i < 3; i++) {
      q.quad([[0.05 + i * 0.75, 45, cz], [0.8 + i * 0.75, 45.1, cz], [0.8 + i * 0.75, 46.9, cz], [0.05 + i * 0.75, 46.8, cz]], [0, 0, -1], UV, flag[i], FIXED)
      q.quad([[0.8 + i * 0.75, 45.1, cz], [0.05 + i * 0.75, 45, cz], [0.05 + i * 0.75, 46.8, cz], [0.8 + i * 0.75, 46.9, cz]], [0, 0, 1], UV, flag[i], FIXED)
    }
  }
  placePav(out, q, P0, f)
}
function placePav(out: MeshBuilder, q: MeshBuilder, P0: P, f: P): void {
  const l = Math.hypot(f[0], f[1])
  const fx = f[0] / l, fz = f[1] / l
  // local x runs along e, with −z out: e = (−fz, fx)
  into(out, q, P0, -fz, fx)
}

/** Flore, Marsan, and the lesser ones: a storeyed body, a tall truncated roof with its great lucarne and crest. */
function roofPav(out: MeshBuilder, P0: P, f: P, o: { hw: number; d: number; eaves: number; rise: number; order?: boolean }): void {
  const q = new MeshBuilder()
  const { hw, d, eaves, rise } = o
  const side = (p: MeshBuilder, W: number): void => {
    ground(p, 2 * W, eaves, [], 8)
    const n = Math.max(2, Math.round((2 * W) / 6.2))
    const b = (2 * W) / n
    const tiers = eaves > 27 ? [[2, 6, true], [10.2, 6.4, false], [18.4, 4.8, false]] as const : [[2, 5, true], [10, 6, false]] as const
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * b
      for (const [y, h, arched] of tiers) {
        if (arched) archOn(p, '-z', 0, x, y, 2.5, h, GLASS)
        else win(p, x, y, 2.2, h)
      }
      pedimentOn(p, '-z', 0, x - 1.7, x + 1.7, 16.9, 0.9, 0.28, TRIM)
    }
    fin(p, 0, 1.3, 1, eaves - 1.4, 0.3, BAND)
    fin(p, 2 * W - 1.3, 2 * W, 1, eaves - 1.4, 0.3, BAND)
    cornice(p, 0, 2 * W, 8.2, 8.9, 0.45, TRIM)
    cornice(p, 0, 2 * W, eaves - 1.4, eaves, 0.9, TRIM)
  }
  for (const [A, c, s, W] of [[[-hw, 0], 1, 0, hw], [[hw, 0], 0, 1, d / 2], [[hw, d], -1, 0, hw], [[-hw, d], 0, -1, d / 2]] as [P, number, number, number][]) {
    const part = new MeshBuilder()
    side(part, W)
    into(q, part, A, c, s)
  }
  // the roof: tall, its top cut flat, a crest of lead round the flat
  const top = Math.min(hw, d / 2) * 0.42
  roof(q, -hw - 0.2, hw + 0.2, -0.2, d + 0.2, eaves, rise, hw - top + 0.2, d / 2 - top + 0.2, SLATE)
  for (const [x0, x1, z0, z1] of [[-top, top, d / 2 - top - 0.05, d / 2 - top + 0.05], [-top, top, d / 2 + top - 0.05, d / 2 + top + 0.05], [-top - 0.05, -top + 0.05, d / 2 - top, d / 2 + top], [top - 0.05, top + 0.05, d / 2 - top, d / 2 + top]]) block(q, x0, x1, z0, z1, eaves + rise, eaves + rise + 0.8, DARK)
  // the great lucarne in its front, and one each side
  const y = eaves + 0.2
  block(q, -3, 3, 0.2, 3.4, y, y + 5, TRIM)
  win(q, 0, y + 0.6, 2.4, 3.6)
  q.quad([[-3.5, y + 5, 0.2], [3.5, y + 5, 0.2], [0, y + 7, 0.2], [0, y + 7, 0.2]], [0, 0, -1], UV, TRIM, FIXED)
  for (const s of [-1, 1]) q.quad([[s * 3.5, y + 5, 0.2], [0, y + 7, 0.2], [0, y + 7, 3.4], [s * 3.5, y + 5, 3.4]], [s * 0.5, 0.86, 0], UV, SLATE, FIXED)
  placePav(out, q, P0, f)
}

export function louvrePalace(out: MeshBuilder): void {
  const nap = napoleon(true)
  const car = napoleon(false)
  const cc = courCarree(3.4)

  // ---- the Cour Carrée: W, N, S and E
  wing(out, [73.5, -103], [108.5, 1.5], 19, { left: nap, right: cc, eaves: 24, roof: 9, set: 4, dormers: 13, gates: [{ x: 56.5, w: 5, crown: 8.6 }] })
  wing(out, [107, 15], [255, -36], 25, { right: cc, left: perrault, eaves: 27, flat: true, roofY: 27, ends: true, gates: [{ x: 76.2, w: 5, crown: 8.6 }] })
  wing(out, [57.7, -113.5], [213.7, -167.5], 33, { right: perrault, left: cc, eaves: 27, flat: true, roofY: 27, ends: true, gates: [{ x: 82.2, w: 5, crown: 8.6 }] })
  wing(out, [194.8, -178.4], [251.8, -13.4], 28, { right: colonnade, left: cc, eaves: 28, flat: true, roofY: 28, ends: true, gates: [{ x: 87, w: 5, crown: 8 }] })

  // ---- the Cour Napoléon: the Richelieu and Denon ranges, their flanks
  wing(out, [-95.7, 96.4], [60.3, 34.4], 18, { right: nap, left: inner, eaves: 20.5, roof: 8, set: 3.6, dormers: 13.6, gates: [{ x: 79.9, w: 4.4, crown: 8.8 }, { x: 92.9, w: 4.4, crown: 8.8 }] })
  wing(out, [55.7, -115.4], [-142.3, -40.4], 18, { right: nap, left: inner, eaves: 20.5, roof: 8, set: 3.6, dormers: 13.6 })
  wing(out, [-87, 92], [-70, 150], 16, { left: car, right: inner, eaves: 20.5, roof: 8, set: 3.4, dormers: 13.6 })
  wing(out, [-160, -93], [-140, -39], 16, { left: car, right: inner, eaves: 20.5, roof: 8, set: 3.4, dormers: 13.6 })

  // ---- the Rue de Rivoli's range, the Rohan guichets, Marsan
  const rohan: Gate[] = [{ x: 102.9, w: 3.4, crown: 6.5 }, { x: 218, w: 3.4, crown: 6.5 }, { x: 226.4, w: 6.3, crown: 9 }, { x: 234.7, w: 6.3, crown: 9 }, { x: 242.9, w: 6.3, crown: 9 }, { x: 251.5, w: 6.3, crown: 9 }, { x: 259.6, w: 3.4, crown: 6.5 }]
  wing(out, [-310, 272], [-67.3, 153.5], 24, { right: car, left: rivoli, eaves: 20, roof: 7.5, set: 3.8, dormers: 11, gates: rohan })
  wing(out, [-67.3, 153.5], [108, 68], 24, { right: inner, left: rivoli, eaves: 20, roof: 7.5, set: 3.8, dormers: 11, gates: [{ x: 80, w: 4.5, crown: 7.5 }] })

  // ---- the Grande Galerie: east of the guichets and west of them
  wing(out, [-187.2, -88.5], [15.8, -164.5], 16, { right: seine, left: inner, eaves: 19.9, roof: 6.4, set: 3, dormers: 15.2 })
  const guichets: Gate[] = [{ x: 76.3, w: 3.6, crown: 6.5 }, { x: 186.8, w: 3.6, crown: 7 }, { x: 200.2, w: 7.4, crown: 11 }, { x: 210.7, w: 7.4, crown: 11 }, { x: 221.1, w: 7.4, crown: 11 }, { x: 234.5, w: 3.6, crown: 7 }]
  wing(out, [-413.8, -6.1], [-186.8, -87.1], 19, { right: seine, left: car, eaves: 19.9, roof: 6.4, set: 3, dormers: 15.2, gates: guichets })
  // the Pavillon des Sessions' range to the Carrousel
  wing(out, [-316, -30], [-256, -52], 22, { right: inner, left: car, eaves: 20.5, roof: 7, set: 3.4, ends: true })

  // ---- what stands between the Denon courts, and the mass of the Salon Carré and the Galerie d'Apollon to the river
  wing(out, [-70, -70], [-84, -122], 24, { right: inner, left: inner, eaves: 19, roof: 6, set: 3 })
  wing(out, [18, -93], [-2, -160], 48, { right: inner, left: inner, eaves: 20, roof: 10, set: 6, ends: true })
  // the cross range over the Passage Richelieu, carried on nothing but its glass walls from the first floor up
  const pass = new MeshBuilder()
  // (a slab over the passage, and the glazed walls either side of the way)
  block(pass, 0, 64, -9, 9, 10.5, 12, shade(STONE, 0.8))
  for (const s of [-1, 1]) block(pass, 0, 64, s * 4.4 - 0.05, s * 4.4 + 0.05, 0, 10.5, [0.34, 0.42, 0.44])
  roof(pass, 0, 64, -9, 9, 12, 5, 0.01, 8.8, SLATE)
  {
    const L = Math.hypot(24, 63)
    into(out, pass, [-14, 66], 24 / L, 63 / L)
  }
  wing(out, [62, 25], [84, 88], 10, { right: inner, left: inner, eaves: 20, roof: 5, set: 3 })
  // the range that shuts the Richelieu block on the east, to the Rue de l'Amiral-de-Coligny
  wing(out, [101, 83], [83, 32], 24, { right: inner, left: rivoli, eaves: 20, roof: 7.5, set: 3.8, ends: true })

  // ---- the three glazed courts, off the outline's own courtyards
  glazed(out, [[-74, 100], [-58, 139], [-8, 114], [-21, 80]], 14, 9)
  glazed(out, [[1, 72], [8, 93], [14, 104], [62, 81], [52, 52]], 14, 9)
  glazed(out, [[65, 47], [76, 74], [93, 66], [84, 40]], 14, 7)

  // ---- the pavilions
  const toS: P = [-0.369, -0.929]
  const toN: P = [0.369, 0.929]
  grand(out, [78.5, -47], [-0.948, 0.318], { hw: 18, d: 27, name: 'PAVILLON SULLY', gates: [0], clock: true, flag: true, both: true })
  grand(out, [-16, 54], toS, { hw: 14.5, d: 20, name: 'PAVILLON RICHELIEU', gates: [-9.6, 3.9] })
  grand(out, [-61, -63.5], toN, { hw: 14.5, d: 20, name: 'PAVILLON DENON' })
  roofPav(out, [64, 22], toS, { hw: 9.5, d: 18, eaves: 21, rise: 9 })
  roofPav(out, [31, -96], toN, { hw: 9.5, d: 18, eaves: 21, rise: 9 })
  roofPav(out, [-92, 90], toS, { hw: 9, d: 18, eaves: 21, rise: 9 })
  roofPav(out, [-134, -35], toN, { hw: 9, d: 18, eaves: 21, rise: 9 })
  // the Pavillon de la Bibliothèque on the Rivoli, the Rohan over its guichets, Lesdiguières and La Trémoille over the Seine
  roofPav(out, [-3, 135], [0.439, 0.899], { hw: 9, d: 18, eaves: 22, rise: 9 })
  roofPav(out, [-52, 150], [-0.439, -0.899], { hw: 8, d: 18, eaves: 22, rise: 8 })
  roofPav(out, [-254, -66], [-0.336, -0.942], { hw: 10, d: 16, eaves: 22, rise: 8 })
  roofPav(out, [-330, -35], [-0.336, -0.942], { hw: 10, d: 16, eaves: 22, rise: 8 })
  // Flore and Marsan, the palace's two great ends
  roofPav(out, [-434, -16.5], [-0.447, -0.894], { hw: 12.5, d: 29, eaves: 28, rise: 15 })
  roofPav(out, [-311.5, 269.5], [-0.9, 0.433], { hw: 15, d: 28, eaves: 28, rise: 15 })
}
