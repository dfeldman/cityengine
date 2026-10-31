/**
 * LES GRANDS MAGASINS (Batch 3, 2026-10-31; docs/landmarks/PARIS-BATCHES.md; owner: "highly visible and unusual"). Silhouette and colour first; each read off IGN's aerial at 0.22 m/px (printemps.jpg, gl.jpg in the batch's shots) and OSM's outline,
 * in world metres: an entry here has `lat`, `lon`, `size` and `front: 180`, so x is east and z is north about the outline's box. Heights are off a storey's and fr.wikipedia's figures. Le Bon Marché and the BHV have their own models (palaces/).
 *
 * The domes the manifest used to set down as corner domes on OSM's plain massing (PARIS_EXPAND §5 B) are drawn here where the photographs have them, which wasn't where those were: the Galeries Lafayette has no corner dome at all, and the Samaritaine lost its domes around 1930.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { strut } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, prism, shade, type Rgb } from '../../kit.ts'
import { edgeAt, offsetRing, roundRing } from '../../parts.ts'
import { tower, towerRing, type TowerSpec } from '../../tower.ts'
import { extrude, fitted, palette, pts, statue, type Pal } from '../palaces/common.ts'
import { bandRound, capRound, EMIT, lettersAlong } from '../palaces/showfront.ts'
import { baysOf, wallOn, type Wall } from '../palaces/wall.ts'

type P2 = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const area = (r: P2[]): number => { let a = 0; for (let i = 0; i < r.length; i++) a += r[i].x * r[(i + 1) % r.length].z - r[(i + 1) % r.length].x * r[i].z; return a }
const ccw = (r: P2[]): P2[] => (area(r) > 0 ? r : [...r].reverse())
const STONE = '#a99f88'
const IRON: Rgb = hex('#20282b'), GILT: Rgb = [0.72, 0.55, 0.2], GLASS: Rgb = hex('#3d4c54'), LIT: Rgb = hex('#7d6b4e')

/**
 * The department store's front, on a street wall: dark shop glass and a glazed iron marquise at the foot; the great arched windows through three floors between stone piers; a garland and a medallion over each arch; the attic's small windows; a heavy cornice. About 40 triangles a bay.
 */
function storeWall(w: Wall, p: Pal, o: { eaves: number; bay: number; arched?: boolean; marquise?: Rgb; shop?: number }): void {
  const { mids, step } = baysOf(w.L, o.bay, 0.3)
  const shop = o.shop ?? 5.4, spring = o.eaves - 6.2
  mids.forEach((m, i) => {
    const hw = step * 0.38
    w.rect(m - hw, m + hw, 0.25, shop - 0.7, i % 3 === 1 ? LIT : GLASS, 0.12)
    w.rect(m - step * 0.46, m + step * 0.46, shop - 0.7, shop, shade(p.stone, 0.92), 0.14)
    if (o.arched !== false) {
      w.arch(m, shop + 0.35, hw * 2 + 0.5, spring - shop, p.trim, 0.1)
      w.arch(m, shop + 0.55, hw * 2, spring - shop - 0.4, GLASS, 0.14)
    } else {
      w.rect(m - hw - 0.2, m + hw + 0.2, shop + 0.35, spring + 0.2, p.trim, 0.1)
      w.rect(m - hw, m + hw, shop + 0.55, spring, GLASS, 0.14)
    }
    // the iron of the great window
    for (const t of [-0.34, 0, 0.34]) w.rect(m + t * hw * 2 - 0.05, m + t * hw * 2 + 0.05, shop + 0.55, spring - (o.arched !== false ? hw * 0.55 : 0), IRON, 0.17)
    for (let y = shop + 3.6; y < spring - 1; y += 3.6) w.rect(m - hw, m + hw, y - 0.17, y + 0.17, IRON, 0.17)
    // the pier's pilaster, its capital
    const u = m - step / 2
    if (i > 0) {
      w.slab(u - 0.5, u + 0.5, shop, spring + 1.2, 0.34, p.trim)
      w.slab(u - 0.72, u + 0.72, spring + 1.2, spring + 1.85, 0.5, shade(p.trim, 1.03))
    }
    // the attic's windows
    w.rect(m - 1.1, m + 1.1, o.eaves - 3.7, o.eaves - 1.3, GLASS, 0.12)
  })
  w.slab(0, w.L, spring + 1.85, spring + 2.3, 0.62, p.trim)
  w.slab(0, w.L, o.eaves - 0.7, o.eaves + 0.2, 0.95, shade(p.trim, 1.04))
  w.slab(0, w.L, shop + 0.05, shop + 0.4, 2.2, o.marquise ?? IRON)
}

/** One store's body: OSM's outline to its eaves, the mansard, the street walls. `skip`: edges not to dress, shorter than 6 m by default. */
function storeBody(out: MeshBuilder, ring0: P2[], o: { eaves: number; bay?: number; rise?: number; inset?: number; stone?: string; slate?: string; arched?: boolean; marquise?: Rgb }): Pal {
  const ring = ccw(ring0)
  const p = palette(o.stone ?? STONE, o.slate ?? '#454d52')
  extrude(out, [ring], p, { eaves: o.eaves, storeys: [], bay: 6, rise: o.rise ?? 4, inset: o.inset ?? 2.6, dormers: false })
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 6) continue
    storeWall(wallOn(out, e.a, e.b), p, { eaves: o.eaves, bay: o.bay ?? 7.4, arched: o.arched, marquise: o.marquise })
  }
  return p
}

/** A mosaic rotunda on a store's corner: stone drum and pilasters through the eaves, its windows, the bulging ribbed dome with its teal scales and gold, the lantern and caduceus. */
function rotunda(out: MeshBuilder, x: number, z: number, r: number, eaves: number, o: { panel: Rgb; rib: Rgb; stone: Rgb; attic?: number; tall?: number }): void {
  const tall = o.tall ?? r * 1.75
  const attic = o.attic ?? 3.6
  const trim = shade(o.stone, 1.05), a0 = -Math.PI, a1 = Math.PI
  bandRound(out, x, z, r, r, a0, a1, 0, eaves + attic, o.stone, { segs: 16 })
  const n = 10
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const hw = 0.19
    // its tall windows between pilasters
    bandRound(out, x, z, r + 0.05, r + 0.05, a + 0.04, a + (Math.PI * 2) / n - 0.3, 6, eaves - 3, GLASS, { segs: 2 })
    prism(out, x + Math.cos(a) * (r + 0.1), z + Math.sin(a) * (r + 0.1), 6, eaves + 0.6, hw * 2, 5, trim, 0)
    bandRound(out, x, z, r + 0.04, r + 0.04, a + 0.04, a + (Math.PI * 2) / n - 0.3, 0.25, 4.6, LIT, { segs: 2 })
  }
  bandRound(out, x, z, r + 0.32, r + 0.32, a0, a1, eaves - 0.7, eaves + 0.2, trim, { segs: 16 })
  capRound(out, x, z, r + 0.32, r + 0.32, a0, a1, eaves + 0.2, trim, true, 16)
  bandRound(out, x, z, r + 2, r + 2, a0, a1, 5.2, 5.6, IRON, { segs: 16 })
  // the attic's round windows
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2
    bandRound(out, x, z, r + 0.05, r + 0.05, a - 0.08, a + 0.08, eaves + 1, eaves + 2.6, GLASS, { segs: 1 })
  }
  bandRound(out, x, z, r + 0.2, r + 0.2, a0, a1, eaves + attic - 0.35, eaves + attic + 0.1, trim, { segs: 16 })
  capRound(out, x, z, r + 0.2, r + 0.2, a0, a1, eaves + attic + 0.1, trim, true, 16)
  // the dome: an egg, ribbed in gold
  const y0 = eaves + attic + 0.1, bands = 7
  const R = (t: number): number => r * 0.98 * Math.max(0.1, Math.cos((t * Math.PI) / 2) ** 0.72 * (1 + 0.06 * Math.sin(t * Math.PI)))
  const sides = 16
  for (let b = 0; b < bands; b++) {
    const t0 = b / bands, t1 = (b + 1) / bands
    prism(out, x, z, y0 + t0 * tall, y0 + t1 * tall, R(t0), sides, b % 3 === 2 ? shade(o.panel, 1.25) : o.panel, 0, R(t1), false)
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), tx = -s * 0.17, tz = c * 0.17
    for (let b = 0; b < bands; b++) {
      const t0 = b / bands, t1 = (b + 1) / bands
      const r0 = R(t0) + 0.04, r1 = R(t1) + 0.04
      out.quad([[x + c * r0 - tx, y0 + t0 * tall, z + s * r0 - tz], [x + c * r0 + tx, y0 + t0 * tall, z + s * r0 + tz], [x + c * r1 + tx, y0 + t1 * tall, z + s * r1 + tz], [x + c * r1 - tx, y0 + t1 * tall, z + s * r1 - tz]],
        [c, 0.5, s], UV, o.rib, surfaceTag('metal'))
    }
  }
  // the belvedere lantern
  const yl = y0 + tall
  prism(out, x, z, yl - 0.1, yl + 1.9, r * 0.2, 8, o.stone, 0)
  for (let i = 0; i < 6; i++) block(out, x + Math.cos(i) * r * 0.2 - 0.06, x + Math.cos(i) * r * 0.2 + 0.06, z + Math.sin(i) * r * 0.2 - 0.06, z + Math.sin(i) * r * 0.2 + 0.06, yl, yl + 1.8, o.rib)
  prism(out, x, z, yl + 1.85, yl + 2.9, r * 0.27, 8, o.rib, surfaceTag('metal'), 0.12)
  prism(out, x, z, yl + 2.9, yl + 4.4, 0.08, 5, o.rib, surfaceTag('metal'), 0.03)
}

/**
 * A great iron and glass cupola on the roof, eight-sided, ribbed: Printemps's two (Binet's 1923 Coupole, the restaurant's, 20 m across; the aerial's pair) and the Galeries Lafayette's. Glass tag renders opaque, so these are lit: a pale grey-green with hoops, and the ribs darker, which holds from a long way off.
 */
function cupola(out: MeshBuilder, x: number, z: number, r: number, y0: number, h: number, c: Rgb, rib: Rgb, sides = 16, hoops = 3, tag = surfaceTag('glass')): void {
  const bands = 6
  const R = (t: number): number => r * Math.max(0.08, Math.cos((t * Math.PI) / 2) ** 0.85)
  for (let b = 0; b < bands; b++) {
    const t0 = b / bands, t1 = (b + 1) / bands
    prism(out, x, z, y0 + t0 * h, y0 + t1 * h, R(t0), sides, shade(c, 0.94 + b * 0.03), tag, R(t1), false)
  }
  for (let i = 0; i < sides; i++) {
    const a = ((i + 0.5) / sides) * Math.PI * 2
    const cx = Math.cos(a), sx = Math.sin(a), w = 0.16
    for (let b = 0; b < bands; b++) {
      const t0 = b / bands, t1 = (b + 1) / bands
      const r0 = R(t0) * Math.cos(Math.PI / sides) + 0.06, r1 = R(t1) * Math.cos(Math.PI / sides) + 0.06
      out.quad([[x + cx * r0 + sx * w, y0 + t0 * h, z + sx * r0 - cx * w], [x + cx * r0 - sx * w, y0 + t0 * h, z + sx * r0 + cx * w], [x + cx * r1 - sx * w, y0 + t1 * h, z + sx * r1 + cx * w], [x + cx * r1 + sx * w, y0 + t1 * h, z + sx * r1 - cx * w]],
        [cx, 0.6, sx], UV, rib, 0)
    }
  }
  for (let k = 1; k <= hoops; k++) {
    const t = k / (hoops + 1)
    bandRound(out, x, z, R(t) + 0.08, R(t) + 0.08, -Math.PI, Math.PI, y0 + t * h - 0.13, y0 + t * h + 0.13, rib, { segs: sides })
  }
  prism(out, x, z, y0 + h - 0.2, y0 + h + 1.5, r * 0.11, 8, rib, 0, r * 0.05)
}

/* ------------------------------------------------------------------------------------------------ Le Printemps */

const TEAL = hex('#2d5d5a'), MOSAIC_GOLD: Rgb = [0.74, 0.58, 0.24]

/**
 * LE PRINTEMPS's main store (Paul Sédille, 1882–83; way/69224137; 64 Boulevard Haussmann, at the Rue du Havre): pale stone over iron with giant Corinthian pilasters and the ROTUNDAS on its four corners, whose domes carry Facchina's mosaics and lanterns with their caducei
 * (fr.wikipedia; the façades and rotundas listed 1975). Over them on the aerial, the pair of eight-sided iron and glass COUPOLES and the square lantern between. Aerial 48.87392 2.3285, 0.22 m/px: rotundas at (−37.8, 24.2), (39, 26), (−39.6, −11), (36.8, −26.4), radius 6; cupolas (−20.9, 5.8), (22.5, 4), radius 13.6.
 * The mosaic's colour I can't read: the aerial's reads pale and gold from above, memory of the street says blue-green scales and gold. Listed for a street-view look.
 */
const PRINTEMPS_E = pts([-46.2, -8.7, -44.6, -14.9, -40.3, -17.5, 33.2, -32.9, 33.4, -31.4, 38.5, -31.6, 40.9, -29.6, 42.4, -24.5, 43.7, -24.6, 46.2, 25.4, 44.9, 29.3, 39, 32.9, -40.1, 30.6, -44.1, 26])
export function printempsMain(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 46.2, 32.9, (q) => {
    const eaves = 25
    const p = storeBody(q, PRINTEMPS_E, { eaves, bay: 7.2, rise: 4.5, inset: 3, stone:'#ada389' })
    const H = eaves + 4.5
    for (const [x, z] of [[-37.8, 24.2], [39, 26], [-39.6, -11], [36.8, -26.4]] as const) rotunda(q, x, z, 6, eaves, { panel: TEAL, rib: MOSAIC_GOLD, stone: p.stone })
    // the Coupoles and the square lantern, on the roof's own drum and terrace
    block(q, -35, 37, -11, 19, H - 0.6, H + 2.4, shade(p.stone, 0.88))
    for (const [x, z] of [[-20.9, 5.8], [22.5, 4]] as const) {
      prism(q, x, z, H + 2.4, H + 5.6, 14, 8, p.stone, 0, 13.6)
      cupola(q, x, z, 13.4, H + 5.5, 10.5, hex('#567e80'), hex('#262f33'), 16, 3)
    }
    block(q, -8, 10.5, -6, 14.5, H + 2.4, H + 5.6, shade(p.stone, 0.94))
    // (a pyramid in glass: four falls)
    const y = H + 5.6, g = hex('#4f7176'), cx = 1.25, cz = 4.25, hw = 9.2, hd = 10.2, ty = y + 7
    q.quad([[cx - hw, y, cz - hd], [cx + hw, y, cz - hd], [cx, ty, cz], [cx, ty, cz]], [0, 0.8, -1], UV, g, surfaceTag('glass'))
    q.quad([[cx + hw, y, cz - hd], [cx + hw, y, cz + hd], [cx, ty, cz], [cx, ty, cz]], [1, 0.8, 0], UV, shade(g, 0.94), surfaceTag('glass'))
    q.quad([[cx + hw, y, cz + hd], [cx - hw, y, cz + hd], [cx, ty, cz], [cx, ty, cz]], [0, 0.8, 1], UV, shade(g, 1.04), surfaceTag('glass'))
    q.quad([[cx - hw, y, cz + hd], [cx - hw, y, cz - hd], [cx, ty, cz], [cx, ty, cz]], [-1, 0.8, 0], UV, shade(g, 0.97), surfaceTag('glass'))
    // the statues on the Haussmann front's parapet, and the name
    const a = PRINTEMPS_E[2], b = PRINTEMPS_E[3]
    for (let i = 1; i < 9; i++) {
      const t = i / 9
      statue(q, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t + 1, eaves + 0.2, 2.5, shade(p.stone, 1.06))
    }
    lettersAlong(q, a, b, Math.hypot(b.x - a.x, b.z - a.z) / 2, 3.6, 'PRINTEMPS', { h: 1.2, c: GILT, wide: 0.72, d: 0.17 })
    // the galleries over the Rue du Havre to the other store
    block(q, -66, -44, 13, 18, 8, 13, shade(p.stone, 0.95))
  })
}

/**
 * The second store (Binet, 1907–10; way/69226605; "Printemps de la Mode" west of the Rue du Havre): the same stone, four small domed turrets on its corners (aerial: (−39.1, 20.5)…), a flat roof of terraces and white umbrellas: the rooftop restaurant. x east, z north: lat 48.873951 lon 2.327742.
 */
const PRINTEMPS_W = pts([-42.2, 15.8, -35.2, -3.5, -31.4, -8.2, 35.9, -21.9, 39.9, -19.9, 42.2, 15.2, 41.1, 15.8, 42, 19.4, 39.9, 21.7, -36, 20.3, -40.9, 19.2])
export function printempsWest(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 42.2, 21.9, (q) => {
    const eaves = 26
    const p = storeBody(q, PRINTEMPS_W, { eaves, bay: 6.8, rise: 2.2, inset: 2.2, stone:'#ada389' })
    for (const [x, z] of [[-38.5, 17.5], [39.8, 19.5], [-33.5, -5.5], [37.4, -19]] as const) rotunda(q, x, z, 4.4, eaves, { panel: TEAL, rib: MOSAIC_GOLD, stone: p.stone, attic: 2.2 })
    // the rooftop, its long metal roof and the restaurant's umbrellas
    block(q, 5, 36, -13, 16, eaves + 2.2, eaves + 7, hex('#49535a'))
    const U = hex('#d6d0c0')
    for (let i = 0; i < 9; i++) {
      const x = -28 + i * 3.6, z = -1 + ((i * 7) % 4) * 1.8
      prism(q, x, z, eaves + 2.2, eaves + 4.6, 0.05, 4, IRON, 0)
      prism(q, x, z, eaves + 4.2, eaves + 5.2, 1.6, 8, U, 0, 0.1)
    }
    // the roof garden at its west end
    block(q, -32, -20, 8, 15, eaves + 2.2, eaves + 2.8, hex('#4d6f3a'))
  })
}

/* ----------------------------------------------------------------------------------------- Les Galeries Lafayette */

/**
 * LES GALERIES LAFAYETTE (Georges Chedanne and Ferdinand Chanut, 1908–12; way/69224062; 40 Boulevard Haussmann): the great front of arched glass on the boulevard, its roof a terrace with Paris's best free view, and the COUPOLE (Gruber's glass, Chanut, 1912; 43 m to its head): from above and from a way off, a broad ribbed disc of pale green
 * glass standing out of its square base. No domes on its corners: the aerial has none and the manifest's corner dome went. Aerial 48.8736 2.3318, 0.22 m/px: centre (−8.6, −7.3), radius 15.8; base square ±18.7; the outline's own 130 × 120 m.
 */
const GL = pts([-64.9, -27.6, -58.4, -36.2, 54.9, -59.8, 64.9, -48.5, 50.9, 1.1, 47.4, 1.5, 34.5, 45.9, 36.7, 47.7, 36.3, 49, -18.3, 46.9, -18.6, 58.4, -23, 58.3, -23, 59.8, -35.1, 58, -35, 40.7, -44, 41.4, -44.2, 46.6, -58.4, 46.2])
export function galeriesLafayette(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 64.9, 59.8, (q) => {
    const eaves = 30
    const p = storeBody(q, GL, { eaves, bay: 8.2, rise: 1, inset: 0.8, stone: '#a89e88', slate: '#7f7c72', marquise: hex('#27333a') })
    const y = eaves + 1
    // the square base of the dome, and the terrace about it
    block(q, -28, 10.2, -25, 10.5, y, y + 5, shade(p.stone, 0.93))
    block(q, -29, 11.2, -26, 11.5, y + 4.7, y + 5.3, p.trim)
    cupola(q, -8.6, -7.3, 15.8, y + 5.2, 8.3, hex('#558079'), hex('#253130'), 20, 3)
    // the two floors of offices behind the dome, its plant, the long skylights on the Chaussée d'Antin wing
    block(q, -48, -24, 12, 44, y, y + 4.2, hex('#7c786c'))
    block(q, -5, 30, 14, 42, y, y + 3.2, hex('#7c786c'))
    for (let i = 0; i < 4; i++) block(q, 28 + i * 0.9 - 2, 28 + i * 0.9 + 5, -32 + i * 11, -24 + i * 11, y, y + 1.6, hex('#55636a'))
    // the terrace's parasols on its south-east corner
    const U = hex('#c7a79a')
    for (let i = 0; i < 8; i++) {
      const x = 24 + (i % 4) * 4.2, z = -45 + ((i * 3) % 4) * 3.4 + (i % 4)
      prism(q, x, z, y, y + 2.4, 0.05, 4, IRON, 0)
      prism(q, x, z, y + 2, y + 3, 1.6, 8, U, 0, 0.1)
    }
    // the Haussmann front's sign and a parapet you can look over
    const a = GL[1], b = GL[2], L = Math.hypot(b.x - a.x, b.z - a.z)
    lettersAlong(q, a, b, L / 2, 3.65, 'GALERIES LAFAYETTE', { h: 1.25, c: GILT, wide: 0.66, d: 0.17 })
    lettersAlong(q, a, b, L / 2, eaves - 4.8, 'GALERIES LAFAYETTE', { h: 2.3, c: hex('#1c3a5c'), wide: 0.64, th: 0.36, d: 0.2 })
    block(q, a.x, b.x, Math.min(a.z, b.z) + 1.6, Math.min(a.z, b.z) + 1.9, y, y + 1.1, IRON)
  })
}

/** The Galeries's second store (way/69224141; "L'Homme", between the Rue Mogador and Rue de la Chaussée…): plainer, the same arched rhythm, a terrace on top. The ring is fit.ring. */
export function galeriesHomme(out: MeshBuilder, fit: Fit): void {
  storeBody(out, towerRing(fit), { eaves: Math.min(fit.height || 30, 30), bay: 7.6, rise: 1, inset: 1, stone: '#a0978a', arched: false, marquise: hex('#27333a') })
}
/** And the Maison, on the south side of Haussmann (way/69224027): 1930s stone, tall piers without arches, a high slate roof. */
export function galeriesMaison(out: MeshBuilder, fit: Fit): void {
  storeBody(out, towerRing(fit), { eaves: Math.min(fit.height || 24, 24), bay: 6.4, rise: 3.5, inset: 2.4, stone: '#a39a85', arched: false, marquise: hex('#27333a') })
}
/** Printemps's narrow third store on the Rue de Provence, north of the second (way/69226711; now Le Printemps de l'Homme). */
export function printempsNorth(out: MeshBuilder, fit: Fit): void {
  storeBody(out, towerRing(fit), { eaves: Math.min(fit.height || 26, 26), bay: 6.4, rise: 2.4, inset: 1.6, stone: '#a39a85', arched: false })
}

/* --------------------------------------------------------------------------------------------- La Samaritaine */

/** the Samaritaine's frame: relation/3075632's box, lat 48.859267 lon 2.342435, x east, z north. The Sauvage block and Jourdain's are its parts, moved into it. */
const SAUVAGE = pts([-47, -41, -43.4, -48.2, -6.1, -61.9, 1.4, -59.1, 10.6, -41.3, -41.5, -20.7])
const JOURDAIN = pts([-41.5, -20.6, 10.6, -41.2, 47.1, 46.1, -18.7, 62])
const COURT = pts([-4.2, 22.7, 1.1, 43.2, 26.3, 36, 17.3, 13.1])
const BLEU = hex('#1f4d53'), ENAMEL = hex('#a07c2c'), ENAMEL_W: Rgb = hex('#a39f8d')

/**
 * LA SAMARITAINE, from the Pont Neuf (relation/3075632). Two buildings, and the domes are gone: Jourdain's rotunda-domes came down within about twenty years and aren't drawn (the manifest's cornerDome is removed).
 * - HENRI SAUVAGE's block on the Quai du Louvre (1926–28; now the Cheval Blanc): sober cream stone, tall fluted piers up seven floors, the corners rounded, the top going back in tiers ("en gradins"): OSM's part 3075633 and the aerial's terraces and white parasols. The Seine's face of the whole thing.
 * - FRANTZ JOURDAIN's store behind it (1905–10; the Rue de la Monnaie and the Rue Baillet): the frame of the shop in iron painted duck-blue ("bleu canard"), the glass, the panels of yellow lava-enamel with their flowers at the top of each bay, the great enamel signboard of its name, the huge zinc roof and its glazed atrium. Between them the glass roof over the old light well.
 * Aerial 48.8593 2.3425, 0.26 m/px; fr.wikipedia, en.wikipedia. The Rivoli side is samaritaineRivoli.
 */
export function samaritaine(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 47.1, 61.9, (q) => {
    // ---- Jourdain's store: the iron frame
    const p = palette('#c7bea8', '#50595e')
    const ring = ccw(JOURDAIN)
    const eaves = 21.5, rise = 8.5
    extrude(q, [ring, COURT], { ...p, stone: BLEU, trim: shade(BLEU, 1.15) }, { eaves, storeys: [], bay: 6, rise, inset: 7, dormers: false })
    for (let i = 0; i < ring.length; i++) {
      const e = edgeAt(ring, i)
      if (Math.abs(e.mid.z + 30) < 12 && e.L > 40) continue // (the side against Sauvage's)
      jourdainWall(wallOn(q, e.a, e.b), eaves)
      // the great signboard in enamel, along the top of the longest walls
      if (e.L > 60) {
        lettersAlong(q, e.a, e.b, e.L / 2, eaves - 7.6, 'LA SAMARITAINE', { h: 2.6, c: ENAMEL, wide: 0.66, th: 0.42, d: 0.2 })
      }
    }
    // the atrium's glass, in the great roof
    capPolygon(q, COURT, eaves + rise + 0.2, hex('#7f9ea3'), surfaceTag('glass'))
    for (let i = 0; i < 4; i++) {
      const a = COURT[i], b = COURT[(i + 1) % 4]
      strut(q, [a.x, eaves + rise + 0.35, a.z], [b.x, eaves + rise + 0.35, b.z], 0.4, 0.3, BLEU, 0, false)
    }
    // the glass roof toward the quai: its sawtooth of panes (aerial: blue-black, with white ribs)
    const G = hex('#415a68'), R = hex('#a7b0b0')
    for (let k = 0; k < 5; k++) {
      const u0 = k / 5, u1 = (k + 1) / 5
      const P = (t: number, s: number, y: number): [number, number, number] => {
        const ax = -38 + (6 - -38) * t, az = -21 + (-38 - -21) * t
        return [ax + s * 8.5, y, az + s * 22]
      }
      q.quad([P(u0, 0, eaves + 1), P(u1, 0, eaves + 1), P(u1, 1, eaves + 4), P(u0, 1, eaves + 4)], [-0.3, 1, 0.1], UV, G, surfaceTag('glass'))
      strut(q, P(u0, 0, eaves + 1.1), P(u0, 1, eaves + 4.1), 0.22, 0.14, R, 0, false)
    }
    // ---- Sauvage's block on the quai
    const round = roundRing(ccw(SAUVAGE), 9, 3)
    const F = { kind: 'fins' as const, wall: hex('#b8ae96'), glass: hex('#3d4648'), pitch: 2.6, solid: 0.46, depth: 0.5, floor: 3.3, material: 'ashlar' as const }
    const spec: TowerSpec = {
      height: 37, roof: hex('#80786a'),
      base: { height: 5.6, face: { kind: 'punched', wall: hex('#a79f88'), glass: hex('#3a4446'), pitch: 5, solid: 0.3, floor: 5.6, material: 'ashlar' }, canopy: { depth: 2, colour: hex('#3a4040') } },
      tiers: [
        { to: 24, face: F, cornice: { depth: 0.8, height: 0.7, colour: hex('#c6bda6') } },
        { to: 27.5, inset: 2.6, face: { ...F, pitch: 3.2 } },
        { to: 31, inset: 2.6, face: { ...F, pitch: 3.2 } },
        { to: 34.5, inset: 2.6, face: { ...F, pitch: 3.2 } },
      ],
      crown: { kind: 'parapet', height: 0.9, colour: hex('#c6bda6') },
    }
    tower(q, { hx: 30, hz: 30, height: 34.5, ring: round }, spec)
    // the parasols on the tiers, and the round pavilion on the roof the aerial has
    const U = hex('#c8c3b2')
    let cx = 0, cz = 0
    for (const s of SAUVAGE) { cx += s.x / SAUVAGE.length; cz += s.z / SAUVAGE.length }
    const inner = offsetRing(round, -1.6)
    for (let i = 0; i < inner.length; i += 2) {
      const x = inner[i].x, z = inner[i].z
      prism(q, x, z, 24, 26.2, 0.05, 4, IRON, 0)
      prism(q, x, z, 25.9, 26.8, 1.5, 8, U, 0, 0.1)
    }
    prism(q, cx, cz + 1, 34.5, 37.8, 4.2, 14, hex('#b8ae96'), 0)
    prism(q, cx, cz + 1, 37.8, 38.7, 4.6, 14, hex('#6f6a60'), 0, 3.2)
  })
}

/** A bay of Jourdain's: the iron frame, its glass, the enamel panel over and the flower in it, and the great name where the wall's long enough. */
function jourdainWall(w: Wall, eaves: number): void {
  const { mids, step } = baysOf(w.L, 5.6, 0.2)
  w.rect(0, w.L, 0, eaves, BLEU, 0.08)
  mids.forEach((m, i) => {
    const hw = step * 0.44
    w.rect(m - hw, m + hw, 0.25, 4.6, i % 3 === 2 ? LIT : hex('#35434a'), 0.12)
    // the shop's tall glass through three floors, iron bars across
    w.rect(m - hw, m + hw, 5.4, eaves - 4.6, hex('#4f6a72'), 0.12)
    for (let y = 8.7; y < eaves - 5; y += 3.4) w.rect(m - hw, m + hw, y - 0.14, y + 0.14, BLEU, 0.15)
    for (const t of [-0.33, 0.33]) w.rect(m + t * hw * 2 - 0.05, m + t * hw * 2 + 0.05, 5.4, eaves - 4.6, BLEU, 0.15)
    // the enamel: a yellow panel, a white roundel, a flower
    w.rect(m - hw, m + hw, eaves - 4.2, eaves - 1, ENAMEL, 0.12)
    w.disc(m, eaves - 2.6, 0.8, ENAMEL_W, 0.14)
    w.disc(m, eaves - 2.6, 0.5, hex('#35684b'), 0.16)
    w.rect(m - hw, m + hw, 4.65, 5.3, ENAMEL, 0.12)
  })
  w.slab(0, w.L, eaves - 0.5, eaves + 0.5, 1.5, shade(BLEU, 1.1))
  w.slab(0, w.L, 5.05, 5.35, 2.2, shade(BLEU, 0.9))
}

/* ----------------------------------------------------------------------------------------- the Rivoli front, SANAA */

/**
 * LA SAMARITAINE on the Rue de Rivoli (Kazuyo Sejima and Ryue Nishizawa, SANAA, 2021; way/284241422): a whole block's front of undulating glass, pale, its folds a street's width of soft waves; the mirror of the houses opposite was the idea. The glass tag renders opaque, so this is a pale blue-grey lit by its own bright floor lines, and its
 * waves are real, which gives bright and dark stripes as the sun moves on them. Behind, offices round a court (aerial 48.8593 2.3425): plain stone on the Rue de la Monnaie side. x east, z north about the outline's box: lat 48.860003, lon 2.342796. Wave from the Rue de l'Arbre-Sec corner to the Rue de la Monnaie.
 */
const RIVOLI = pts([-35.5, 15.1, -22.1, 11.7, -24.7, -12.5, -17.4, -14.6, -18.5, -20.9, 25.5, -30.2, 35.5, -3.8, 33.5, -3, 31.5, 2.4, -27.1, 30.7, -31.6, 28.6])
export function samaritaineRivoli(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 35.5, 30.7, (q) => {
    const H = 25.5
    const p = palette('#a89f8b', '#50595e')
    const ring = ccw(RIVOLI)
    extrude(q, [ring], { ...p }, { eaves: H, storeys: [{ y: 0, h: 3.2, sill: 0.3 }, { y: 5, h: 2.2 }, { y: 9, h: 2.2 }, { y: 13, h: 2.2 }, { y: 17, h: 2.2 }, { y: 21, h: 2 }], bay: 4.2, win: 2.8, rise: 1.5, inset: 1.2, dormers: false })
    // the wave: from a (the west corner) to b along the Rivoli edge, plus a turn at each end
    const a = { x: -27.1, z: 30.7 }, b = { x: 33.5, z: 2.0 }
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = -tz, nz = tx // (outward, north-east)
    const N = 40, amp = 1.7, wave = 7.2
    const G = hex('#5f7f8e'), W = hex('#b5b9b3')
    const off = (u: number): number => 1.9 + Math.sin((u / wave) * Math.PI * 2) * amp
    const P = (u: number, y: number): [number, number, number] => { const d = off(u); return [a.x + tx * u + nx * d, y, a.z + tz * u + nz * d] }
    const norm = (u: number): [number, number, number] => {
      const dd = Math.cos((u / wave) * Math.PI * 2) * amp * ((Math.PI * 2) / wave)
      const l = Math.hypot(1, dd)
      return [(nx - dd * tx) / l, 0, (nz - dd * tz) / l]
    }
    for (let i = 0; i < N; i++) {
      const u0 = (i / N) * L, u1 = ((i + 1) / N) * L
      const nm = norm((u0 + u1) / 2)
      // (a tone by how the fold looks: what the wave does to the sky in it)
      const tone = 0.86 + 0.28 * (0.5 + 0.5 * Math.sin((((u0 + u1) / 2) / wave) * Math.PI * 2 + 1))
      q.quad([P(u0, 0.1), P(u1, 0.1), P(u1, H + 1), P(u0, H + 1)], nm, UV, shade(G, tone), surfaceTag('glass'))
      for (let y = 4.6; y <= H + 1; y += 3.45) {
        const p0 = P(u0, y), p1 = P(u1, y)
        q.quad([[p0[0] + nm[0] * 0.04, y - 0.1, p0[2] + nm[2] * 0.04], [p1[0] + nm[0] * 0.04, y - 0.1, p1[2] + nm[2] * 0.04], [p1[0] + nm[0] * 0.04, y + 0.1, p1[2] + nm[2] * 0.04], [p0[0] + nm[0] * 0.04, y + 0.1, p0[2] + nm[2] * 0.04]], nm, UV, W, 0)
      }
      // the roof of the gap behind the wave
      const a0 = P(u0, H + 1), a1 = P(u1, H + 1)
      q.quad([a0, a1, [a.x + tx * u1, H + 1, a.z + tz * u1], [a.x + tx * u0, H + 1, a.z + tz * u0]], [0, 1, 0], UV, hex('#8c8d88'), 0)
    }
    // the Samaritaine's own name, small, in its sans over the door
    lettersAlong(q, { x: a.x + nx * 3.8, z: a.z + nz * 3.8 }, { x: b.x + nx * 3.8, z: b.z + nz * 3.8 }, L / 2, 4.9, 'SAMARITAINE', { h: 0.9, c: hex('#d9dcd6'), wide: 0.7, tag: EMIT, d: 0.05 })
  })
}

