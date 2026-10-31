/**
 * Batch 4's museums in their hôtels (2026-10-31; docs/landmarks/PARIS-BATCHES.md). A restyle changes little from the road (Batch 1's lesson), and a museum is usually a hôtel or a historic front that deserves its own look. These are drawn in world metres: each entry gives a point and a numeric `front`, and `frameOf` turns OSM's outline (./rings.ts) and any
 * world position into the model's frame, so a bay or a front goes where the aerial has it. Their dress is from their period, the Wikipedia articles and memory, not a photograph: street view could say more (see the batch report).
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, placed, prism, shade, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { edgeAt } from '../../parts.ts'
import { archOn, balustrade, extrude, palette, pedimentOn, rectOn, segmentOn, slabOn, statue, type Pal, type Storey } from '../palaces/common.ts'
import { BALZAC, BIRON, BOURDELLE, CAMONDO, CERNUSCHI, JEANNERET, LAROCHE, MOREAU, ROMANTIQUE, ZADKINE } from './rings.ts'

type P2 = { x: number; z: number }
const ash = surfaceTag('ashlar')

/** World metres to a model's own frame: the entry's point at (ox, oz) and its `front` bearing (−z to it, +x to the bearing 90° anticlockwise of it, tests/landmarks.test.ts's convention). */
export const frameOf = (ox: number, oz: number, front: number) => {
  const b = ((front - 90) * Math.PI) / 180, c = ((front + 180) * Math.PI) / 180
  return (wx: number, wz: number): P2 => { const dx = wx - ox, dz = wz - oz; return { x: dx * Math.sin(b) + dz * Math.cos(b), z: dx * Math.sin(c) + dz * Math.cos(c) } }
}
export const localRing = (flat: number[], f: ReturnType<typeof frameOf>): P2[] => Array.from({ length: flat.length / 2 }, (_, i) => f(flat[2 * i], flat[2 * i + 1]))

/**
 * An elevation drawn once in its own frame (its wall the plane z = 0, facing −z, x along it about its middle) and set on the line a–b, facing the side of `to`.
 */
export function elevation(out: MeshBuilder, a: P2, b: P2, to: P2, draw: (q: MeshBuilder, L: number) => void): void {
  const q = new MeshBuilder(), L = Math.hypot(b.x - a.x, b.z - a.z), mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2
  let nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
  if (nx * (to.x - mx) + nz * (to.z - mz) < 0) { nx = -nx; nz = -nz }
  draw(q, L)
  placed(out, q, Math.atan2(-nx, -nz), mx, mz)
}

/** A hôtel's classical front on its plane: rusticated ground floor, the piano nobile's tall windows with pilasters between, an avant-corps of `mid` bays, cornice and balustrade. */
function classical(q: MeshBuilder, L: number, p: Pal, o: { e: number; nob: number; n: number; mid?: number; ped?: boolean; door?: 'arch' | 'rect'; rust?: boolean; arched?: boolean; bal?: boolean; statues?: boolean; attic?: number; plate?: number }): void {
  const P = -(o.plate ?? 0.15), bay = L / o.n, mid = o.mid ?? 0
  block(q, -L / 2, L / 2, P, 0.3, 0, o.e, p.stone, ash)
  if (o.rust !== false) for (let y = 0.55; y < o.nob - 0.3; y += 0.55) rectOn(q, '-z', P, -L / 2, L / 2, y - 0.03, y + 0.03, p.deep, 0.03)
  slabOn(q, '-z', P, -L / 2 - 0.1, L / 2 + 0.1, o.nob - 0.2, o.nob + 0.15, 0.25, p.trim)
  const zm = P - 0.7
  if (mid) block(q, -(mid * bay) / 2, (mid * bay) / 2, zm, P, 0, o.e + 0.25, shade(p.stone, 1.02), ash)
  const top = o.attic ? o.e - o.attic : o.e - 0.9
  for (let i = 0; i < o.n; i++) {
    const t = -L / 2 + (i + 0.5) * bay, inMid = mid > 0 && Math.abs(t) < (mid * bay) / 2, Z = inMid ? zm : P, w = Math.min(1.9, bay * 0.52)
    // the ground floor, and a door in the middle
    const isDoor = o.door && Math.abs(t) < bay * 0.51
    if (isDoor && o.door === 'arch') { archOn(q, '-z', Z, t, 0, w + 1.1, o.nob - 0.9, shade(p.dark, 1.2), 0.08); rectOn(q, '-z', Z, t - w / 2 - 0.65, t + w / 2 + 0.65, o.nob - 0.8, o.nob - 0.3, p.trim, 0.05) }
    else if (isDoor) { rectOn(q, '-z', Z, t - w / 2 - 0.3, t + w / 2 + 0.3, 0, o.nob - 0.6, p.trim, 0.04); rectOn(q, '-z', Z, t - w / 2, t + w / 2, 0, o.nob - 0.85, shade(p.dark, 1.2), 0.08) }
    else if (o.arched) archOn(q, '-z', Z, t, 0.7, w, o.nob - 1.6, p.glass, 0.08)
    else { rectOn(q, '-z', Z, t - w / 2 - 0.15, t + w / 2 + 0.15, 0.8, o.nob - 1, p.trim, 0.04); rectOn(q, '-z', Z, t - w / 2, t + w / 2, 0.95, o.nob - 1.15, p.glass, 0.08) }
    // the piano nobile
    const y0 = o.nob + 0.6
    rectOn(q, '-z', Z, t - w / 2 - 0.2, t + w / 2 + 0.2, y0 - 0.2, top - 0.35, p.trim, 0.04)
    rectOn(q, '-z', Z, t - w / 2, t + w / 2, y0, top - 0.55, p.glass, 0.08)
    slabOn(q, '-z', Z, t - w / 2 - 0.3, t + w / 2 + 0.3, top - 0.35, top - 0.15, 0.2, p.trim)
    block(q, t - w / 2 - 0.1, t + w / 2 + 0.1, Z - 0.22, Z, y0 - 0.25, y0 - 0.08, p.trim, ash)
    for (let k = 0; k < 4; k++) { const x = t - w / 2 + ((k + 0.5) * w) / 4; block(q, x - 0.03, x + 0.03, Z - 0.12, Z - 0.09, y0 - 0.1, y0 + 0.8, p.dark) }
    if (o.attic) { rectOn(q, '-z', Z, t - w / 2 + 0.2, t + w / 2 - 0.2, top + 0.45, o.e - 0.75, p.glass, 0.08) }
  }
  // the pilasters: between all of the avant-corps' bays, at the ends of the rest
  for (let i = 0; i <= o.n; i++) {
    const t = -L / 2 + i * bay, inMid = mid > 0 && Math.abs(t) <= (mid * bay) / 2 + 0.01, Z = inMid ? zm : P
    if (!inMid && i !== 0 && i !== o.n) continue
    slabOn(q, '-z', Z, t - 0.32, t + 0.32, o.nob + 0.15, top, 0.16, p.trim)
    slabOn(q, '-z', Z, t - 0.44, t + 0.44, top - 0.5, top, 0.24, shade(p.trim, 1.03))
  }
  if (o.attic) slabOn(q, '-z', P, -L / 2, L / 2, top, top + 0.3, 0.3, p.trim)
  const wMid = (mid * bay) / 2
  slabOn(q, '-z', P, -L / 2 - 0.15, L / 2 + 0.15, o.e - 0.7, o.e, 0.45, p.trim)
  if (mid) slabOn(q, '-z', zm, -wMid - 0.2, wMid + 0.2, o.e - 0.7, o.e + 0.25, 0.45, p.trim)
  if (o.ped && mid) pedimentOn(q, '-z', zm, -wMid - 0.25, wMid + 0.25, o.e + 0.25, Math.max(1.3, wMid * 0.28), 0.5, p.trim)
  if (o.bal !== false) {
    const x0 = o.ped && mid ? wMid : 0
    for (const [a, b] of (x0 ? [[-L / 2, -x0], [x0, L / 2]] : [[-L / 2, L / 2]])) balustrade(q, a, b, -0.2, 0.2, o.e, p, { sides: ['-z'], h: 0.95 })
    if (o.statues) for (const t of [-L / 2 + 0.5, -wMid, wMid, L / 2 - 0.5]) statue(q, t, -0.2, o.e, 1.7, p.trim)
  }
}

/** A ring cut by the line z = zc, the side beyond it or short of it (Sutherland–Hodgman: a concave ring's cut may leave a seam along the line, which the wall of the taller half covers) */
function clipZ(r: P2[], zc: number, above: boolean): P2[] {
  const inside = (q: P2): boolean => (above ? q.z >= zc : q.z <= zc)
  const o: P2[] = []
  for (let i = 0; i < r.length; i++) {
    const a = r[i], c = r[(i + 1) % r.length]
    if (inside(a)) o.push(a)
    if (inside(a) !== inside(c)) { const t = (zc - a.z) / (c.z - a.z); o.push({ x: a.x + (c.x - a.x) * t, z: zc }) }
  }
  return o
}

/** OSM's outline, walled and roofed: `extrude` from the kit, with green shutters where it asks. */
function shell(out: MeshBuilder, ring: P2[], p: Pal, o: { eaves: number; storeys: Storey[]; bay: number; win?: number; rise?: number; inset?: number; dormers?: boolean; shutters?: Rgb }): void {
  extrude(out, [ring], p, { frames: true, ...o })
  if (!o.shutters) return
  const area = ring.reduce((s, q, i) => { const r = ring[(i + 1) % ring.length]; return s + q.x * r.z - r.x * q.z }, 0)
  const cw = area > 0 ? ring : [...ring].reverse()
  const win = o.win ?? 1.5
  for (let i = 0; i < cw.length; i++) {
    const e = edgeAt(cw, i)
    if (e.L < 3) continue
    const nb = Math.max(1, Math.round((e.L - 1.2) / o.bay)), step = (e.L - 1.2) / nb
    for (let j = 0; j < nb; j++) {
      const u = 0.6 + step * (j + 0.5)
      for (const s of o.storeys) {
        const y0 = s.y + (s.sill ?? 0.9)
        for (const k of [-1, 1]) {
          const c = u + k * (win / 2 + 0.33), P = (uu: number, y: number): [number, number, number] => [e.a.x + e.tx * uu + e.nx * 0.14, y, e.a.z + e.tz * uu + e.nz * 0.14]
          out.quad([P(c - 0.3, y0), P(c + 0.3, y0), P(c + 0.3, y0 + s.h), P(c - 0.3, y0 + s.h)], [e.nx, 0, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], o.shutters, 0)
        }
      }
    }
  }
}

/* ------------------------------------------------------------------------------------------------- Parc Monceau's two */

/**
 * LE MUSÉE CERNUSCHI (William Bouwens van der Boijen, 1873–74, for the banker Henri Cernuschi and his Asian bronzes; way/68353939, 7 avenue Vélasquez, at the Parc Monceau's gate): narrow to the avenue (20 m), the hôtel running back from it behind. Stone, a round carriage arch in the middle with a Renaissance frame, the first floor's three tall windows between pilasters and
 * medallions, an attic of little windows, a high slate roof. Front from the outline: it faces the avenue at bearing 338.
 */
export function museeCernuschi(out: MeshBuilder, _fit: Fit): void {
  const f = frameOf(-1422.6, 2111.6, 337.6), p = palette('#c8bea8', '#4e555b'), ring = localRing(CERNUSCHI, f)
  shell(out, ring, p, { eaves: 15, storeys: [{ y: 0.6, h: 3.2 }, { y: 5.4, h: 4.6 }], bay: 3.8, win: 1.7, rise: 4, inset: 2.4, dormers: true })
  const a = f(-1422.3, 2134.9), b = f(-1440.5, 2127.4)
  elevation(out, a, b, f(-1450, 2160), (q, L) => {
    classical(q, L, p, { e: 15, nob: 5.6, n: 3, mid: 1, door: 'arch', attic: 2.4, bal: true, plate: 0.5 })
    // the medallions, between the first floor's windows: a disc in a square frame
    for (const t of [-L / 6, L / 6]) {
      rectOn(q, '-z', -0.5, t - 0.7, t + 0.7, 9.6, 11, p.deep, 0.06)
      segmentOn(q, '-z', -0.5, t, 10, 1, 0.55, shade(p.trim, 1.04), 0.1)
    }
    block(q, -L / 2, L / 2, -0.2, 0.3, 15, 15.1, p.trim, ash)
  })
}

/**
 * LE MUSÉE NISSIM-DE-CAMONDO (René Sergent, 1911–14, after the Petit Trianon, for Moïse de Camondo; way/68353886, 63 rue de Monceau): the hemicycle of the court (the notch in OSM's outline) entered from the street through a gate between low wings; the great block behind, two tall storeys of Corinthian pilasters over a rusticated floor, the balustrade and a low roof: the
 * Trianon's shape, 1911's size. To the Parc Monceau (west-north-west, its trees before it) the same order and the curved bay of the salon, which OSM's outline has. −z to the street, bearing 142.6.
 */
export function museeCamondo(out: MeshBuilder, _fit: Fit): void {
  const f = frameOf(-1420, 2061.5, 142.6), p = palette('#c9c0aa', '#585f64'), ring = localRing(CAMONDO, f)
  // the block, from the court's head back; the street's wings low round the court (the outline has them all at one height): OSM's vertices from the court's east corner on, in this frame (7.4, 1.8), and a cut across the east wing at z = 3
  const zc = 3, corner = ring.reduce((best, q, i) => (Math.hypot(q.x - 7.4, q.z - 1.8) < Math.hypot(ring[best].x - 7.4, ring[best].z - 1.8) ? i : best), 0)
  shell(out, clipZ(ring, zc, true), p, { eaves: 15.5, storeys: [{ y: 0.3, h: 3.4 }, { y: 5.2, h: 5.2 }], bay: 3.4, win: 1.8, rise: 1.2, inset: 2.6, dormers: false })
  shell(out, [ring[0], ring[1], { x: 12.1, z: zc }, { x: 7.45, z: zc }, ...ring.slice(corner)], p, { eaves: 6.75, storeys: [{ y: 0.3, h: 3.4 }], bay: 3.4, win: 1.8, rise: 1.4, inset: 1.6, dormers: false })
  const FAR = f(-1520, 2100)
  // the garden front: tips of OSM's long west side
  elevation(out, f(-1432.9, 2097.1), f(-1442, 2090.7), FAR, (q, L) => classical(q, L, p, { e: 15.5, nob: 5, n: 3, rust: true }))
  elevation(out, f(-1445.4, 2067.6), f(-1438.7, 2058.2), FAR, (q, L) => classical(q, L, p, { e: 15.5, nob: 5, n: 3, rust: true }))
  elevation(out, f(-1436.2, 2082.7), f(-1442, 2090.7), FAR, (q, L) => classical(q, L, p, { e: 15.5, nob: 5, n: 3, rust: true }))
  // the salon's bay, a half-round standing out of the middle of it: pilasters round the drum
  const c = f(-1437.9, 2077.6), R = 5.4
  prism(out, c.x, c.z, 0, 15.2, R, 18, p.stone, ash)
  prism(out, c.x, c.z, 4.9, 5.25, R + 0.2, 18, p.trim, 0)
  prism(out, c.x, c.z, 14.5, 15.5, R + 0.4, 18, p.trim, 0)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, x = c.x + Math.cos(a) * (R + 0.08), z = c.z + Math.sin(a) * (R + 0.08)
    block(out, x - 0.2, x + 0.2, z - 0.2, z + 0.2, 5.25, 14.5, shade(p.trim, 1.02), ash)
    const m = a + Math.PI / 12, xm = c.x + Math.cos(m) * (R + 0.04), zm = c.z + Math.sin(m) * (R + 0.04)
    block(out, xm - 0.55, xm + 0.55, zm - 0.55, zm + 0.55, 6, 13.6, p.glass, 0)
    block(out, xm - 0.55, xm + 0.55, zm - 0.55, zm + 0.55, 1, 4, p.glass, 0)
  }
  prism(out, c.x, c.z, 15.5, 15.9, R - 0.2, 18, p.slate, surfaceTag('metal'), R - 1.4)
  // the court's face, the hemicycle's head, the gate on the street between two low wings, its iron and lamps
  elevation(out, f(-1413.5, 2073.6), f(-1431.4, 2055.8), f(-1400, 2040), (q, L) => classical(q, L, p, { e: 15.5, nob: 5, n: 5, mid: 3, door: 'rect', ped: true }))
  const gA = f(-1394.5, 2046.9), gB = f(-1420, 2028)
  elevation(out, gA, gB, f(-1390, 2020), (q, L) => {
    block(q, -L / 2, L / 2, -0.15, 3, 0, 6.2, p.stone, ash)
    block(q, -L / 2 - 0.2, L / 2 + 0.2, -0.3, 3.1, 6.2, 6.75, p.trim, ash)
    for (let y = 0.5; y < 5.5; y += 0.5) rectOn(q, '-z', -0.15, -L / 2, L / 2, y - 0.03, y + 0.03, p.deep, 0.03)
    for (const t of [-8, 8]) { archOn(q, '-z', -0.15, t, 0.6, 2.3, 4.2, p.glass, 0.08); archOn(q, '-z', -0.15, t - 3.4, 0.6, 2, 3.8, p.glass, 0.08); archOn(q, '-z', -0.15, t + 3.4, 0.6, 2, 3.8, p.glass, 0.08) }
    archOn(q, '-z', -0.15, 0, 0, 4.2, 5.2, hex('#2f3534'), 0.08)
    rectOn(q, '-z', -0.15, -1.7, 1.7, 5.3, 5.95, p.trim, 0.1)
    balustrade(q, -L / 2, L / 2, -0.15, 0.4, 6.75, p, { sides: ['-z'], h: 0.8 })
  })
}

/**
 * L'HÔTEL BIRON, LE MUSÉE RODIN (Jean Aubert for Peyrenc de Moras, 1727–32; way/68568682, 44 × 30 m): the great rocaille hôtel between its court and its seven acres of garden, two floors and a roof of lucarnes, its wings a step forward at the middle under a pediment; the arched French windows on the ground floor give it its air. Both long fronts the same; −z to
 * the garden, south.
 */
export function hotelBiron(out: MeshBuilder, _fit: Fit): void {
  const f = frameOf(-1182.3, -578.4, 189.4), p = palette('#c6bca4', '#4f565b'), ring = localRing(BIRON, f)
  shell(out, ring, p, { eaves: 13.2, storeys: [{ y: 0.5, h: 4 }, { y: 6.6, h: 4 }], bay: 3.6, win: 1.8, rise: 5, inset: 3, dormers: true })
  // the two long faces: the outline's south and north sides, either side of its middle
  elevation(out, f(-1204.2, -584.8), f(-1163.5, -589.2), f(-1180, -640), (q, L) => classical(q, L, p, { e: 13.2, nob: 6, n: 11, mid: 3, ped: true, arched: true, rust: false, door: undefined, bal: false, plate: 1.6 }))
  elevation(out, f(-1200.6, -563.5), f(-1160.3, -570.4), f(-1180, -520), (q, L) => classical(q, L, p, { e: 13.2, nob: 6, n: 11, mid: 3, ped: true, arched: true, rust: false, door: 'arch', bal: false, plate: 1.6 }))
}

/* --------------------------------------------------------------------------------------------- the small museums */

/**
 * LA MAISON DE BALZAC (47 rue Raynouard; way/83863727): where he corrected the Comédie humaine, 1840–47, hiding from his creditors. A plain Passy gardener's house on its terrace above the Rue Berton, low pale render and green shutters under old tile. Nothing more: that's its charm. Any front will do, the shutters all round.
 */
export function maisonBalzac(out: MeshBuilder, _fit: Fit): void {
  const f = frameOf(-3730.3, -585.8, 180), p = palette('#c2b392', '#7c5b45')
  shell(out, localRing(BALZAC, f), p, { eaves: 6.4, storeys: [{ y: 0.2, h: 2 }, { y: 3.4, h: 1.9 }], bay: 3.1, win: 1, rise: 2.4, inset: 2.2, dormers: false, shutters: hex('#3c5a45') })
}

/**
 * LE MUSÉE DE LA VIE ROMANTIQUE (Ary Scheffer's house and studios, 1830; 16 rue Chaptal, way/79107217, at the end of its lane): an Italianate house in ochre render with green shutters, a shallow tile roof and its long studio wing, under its big trees. George Sand and Chopin came on Fridays.
 */
export function vieRomantique(out: MeshBuilder, _fit: Fit): void {
  const f = frameOf(99.7, 2322.7, 180), p = palette('#b89a68', '#8a6147')
  shell(out, localRing(ROMANTIQUE, f), p, { eaves: 7, storeys: [{ y: 0.2, h: 2.2 }, { y: 3.8, h: 2 }], bay: 3.2, win: 1.05, rise: 1.8, inset: 1.6, dormers: false, shutters: hex('#3f6348') })
}

/**
 * LE MUSÉE GUSTAVE-MOREAU (14 rue de La Rochefoucauld, way/69562760; his parents' house, raised by Albert Lafon in 1895 for his studios): a plain stone Nouvelle-Athènes town house to the second floor, then the two floors of studio, each one huge window after another. OSM's 24 m is high: 18 m. That's the thing to see from the street.
 */
export function museeMoreau(out: MeshBuilder, _fit: Fit): void {
  const f = frameOf(185.9, 1936.7, 180), p = palette('#c1b8a4', '#50575c')
  shell(out, localRing(MOREAU, f), p, { eaves: 17.5, storeys: [{ y: 0.3, h: 2.6 }, { y: 4.2, h: 2.4 }, { y: 7.9, h: 3.4, sill: 0.2 }, { y: 12.4, h: 4, sill: 0.2 }], bay: 3.6, win: 2.8, rise: 1.8, inset: 1.2, dormers: false })
}

/**
 * LE MUSÉE BOURDELLE (18 rue Antoine-Bourdelle; way/2425753): the sculptor's studios, in brick and tall factory windows, round the green court with Héraklès in it. Portzamparc's extension of 1992 is the same size in smooth grey. A plain low U of sooty brick with a skylit roof.
 */
export function museeBourdelle(out: MeshBuilder, _fit: Fit): void {
  const f = frameOf(-977.1, -1924.9, 180), p = palette('#6f4a3d', '#5b6065')
  p.trim = hex('#a49a87')
  shell(out, localRing(BOURDELLE, f), p, { eaves: 8.4, storeys: [{ y: 0.2, h: 5.6, sill: 0.3 }], bay: 4.4, win: 3.1, rise: 1, inset: 2.2, dormers: false })
}

/** LE MUSÉE ZADKINE (100 bis rue d'Assas; way/64103861): the tiny white house he lived and worked in, at the end of a lane behind the street. Two floors, a low tile roof. */
export function museeZadkine(out: MeshBuilder, _fit: Fit): void {
  const f = frameOf(122.5, -1984.8, 180), p = palette('#bab5a6', '#80604b')
  shell(out, localRing(ZADKINE, f), p, { eaves: 5.6, storeys: [{ y: 0.2, h: 1.9 }, { y: 3.2, h: 1.6 }], bay: 2.8, win: 1, rise: 1.6, inset: 1.5, dormers: false, shutters: hex('#5a6e77') })
}

/**
 * LES MAISONS LA ROCHE ET JEANNERET (Le Corbusier and Pierre Jeanneret, 1923–25; 8–10 square du Docteur-Blanche, ways/85224488 and 85224477; the Fondation Le Corbusier; one of UNESCO's seventeen): the white box at the head of a cul-de-sac, ribbon windows, flat roofs, and the art gallery's curved wall on its one piloti, which is OSM's outline's curve. Paint, not stone. In for the Maison de Victor Hugo, whose front is the
 * Place des Vosges's and good.
 */
export function maisonLaRoche(out: MeshBuilder, _fit: Fit): void {
  const f = frameOf(-4878.6, -964.9, 180), W = hex('#c5c1b5'), GLASS: Rgb = [0.11, 0.13, 0.15], DARK = hex('#2a2b2b')
  const wall = (flat: number[], h: number, gaps: number[]): void => {
    const ring = localRing(flat, f), area = ring.reduce((s, q, i) => { const r = ring[(i + 1) % ring.length]; return s + q.x * r.z - r.x * q.z }, 0), r = area > 0 ? ring : [...ring].reverse()
    for (let i = 0; i < r.length; i++) {
      const e = edgeAt(r, i), P = (u: number, y: number, d = 0): [number, number, number] => [e.a.x + e.tx * u + e.nx * d, y, e.a.z + e.tz * u + e.nz * d]
      const n: [number, number, number] = [e.nx, 0, e.nz], uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
      out.quad([P(0, 0), P(e.L, 0), P(e.L, h), P(0, h)], n, uv, W, 0)
      if (e.L > 2.6) for (const g of gaps) {
        out.quad([P(0.5, g, 0.05), P(e.L - 0.5, g, 0.05), P(e.L - 0.5, g + 1.25, 0.05), P(0.5, g + 1.25, 0.05)], n, uv, GLASS, 0)
        for (let u = 0.5; u <= e.L - 0.5; u += 1.05) out.quad([P(u - 0.025, g, 0.07), P(u + 0.025, g, 0.07), P(u + 0.025, g + 1.25, 0.07), P(u - 0.025, g + 1.25, 0.07)], n, uv, DARK, 0)
      }
    }
    const cap = (y: number, c: Rgb) => { const m = new MeshBuilder(); extrudeCap(m, r, y, c); for (let k = 0; k < m.positions.length; k++) out.positions.push(m.positions[k]); for (const v of m.normals) out.normals.push(v); for (const v of m.uvs) out.uvs.push(v); for (const v of m.colors) out.colors.push(v); const base = (out.positions.length - m.positions.length) / 3; for (const v of m.indices) out.indices.push(base + v) }
    cap(h, shade(W, 0.92))
  }
  wall(LAROCHE, 9.6, [1.6, 5.2, 7.6])
  wall(JEANNERET, 11, [1.6, 4.6, 7.8])
  // the gallery's piloti, under the curve: a dark slot and the one round post
  const c = f(-4874.4, -961.6)
  prism(out, c.x, c.z, 0, 3.4, 0.28, 10, shade(W, 0.97), 0)
  // the roof garden's parapets and the box of a chimney
  const r0 = f(-4876, -968)
  block(out, r0.x - 1, r0.x + 1, r0.z - 0.5, r0.z + 0.5, 9.6, 10.6, W)
}

function extrudeCap(out: MeshBuilder, r: P2[], y: number, c: Rgb): void {
  // a fan about the centre, enough for these small outlines: the ring is nearly convex and the seam is under the parapet
  let mx = 0, mz = 0
  for (const q of r) { mx += q.x; mz += q.z }
  mx /= r.length; mz /= r.length
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length]
    out.quad([[mx, y, mz], [b.x, y, b.z], [a.x, y, a.z], [mx, y, mz]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
  }
}

