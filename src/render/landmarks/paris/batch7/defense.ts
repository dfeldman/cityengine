/**
 * Batch 7's La Défense (2026-10-31; docs/landmarks/PARIS-BATCHES.md; owner, 2026-10-30: "may in some cases just be a high-rise or shopping center that is highly visible and unusual even if it is not a conventional destination"). OSM's outlines and heights are good, and the bake dressed every one of them in the same grey punched windows, so from the Pont de Neuilly it was a wall of filing cabinets (shot 2026-10-31). What tells these towers apart is what each is clad in and how it stops: this says that for each, in tower.ts's grammar on OSM's own ring, and the four that aren't extrusions (Alto's flare, the Triangle's taper, D2's and Carpe Diem's lattices) get a loft.
 * The skins are from memory of photographs and the aerial's tones: which glass is how blue is the part most worth a street-view check. Glass renders opaque, so these are mid-tones with structure on them, never a pale mirror: Tour First's glass read as white in the same shot.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { insetRing, tower, towerRing, type TowerSpec } from '../../tower.ts'

type P = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

/**
 * A SKIN: big panes, each its own tone of the glass, a darker spandrel every module and a fin at each `fin` metres if it has one. The first version had tower.ts's curtain and fins, a mullion every 2 m, and from the Pont de Neuilly they beat against the pixels: zebra stripes and scribbles across every tower (shot, 2026-10-31). Nothing here is thinner than a pixel at two kilometres, and the panes' tones are what reads as glass.
 */
interface Skin { glass: string; fin?: string; every?: number; module?: number }
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
const lobby = (colour = '#39444b'): TowerSpec['base'] => ({ height: 8, face: { kind: 'blank', wall: hex(colour), material: 'concrete' } })
function skinned(out: MeshBuilder, ring: P[], y0: number, y1: number, k: Skin): void {
  const glass = hex(k.glass), module = k.module ?? 7.6, pane = 4.6
  const rows = Math.max(1, Math.round((y1 - y0) / module)), h = (y1 - y0) / rows
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.3) continue
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = tz, nz = -tx
    const n: [number, number, number] = [nx, 0, nz]
    const P3 = (u: number, y: number, o: number): [number, number, number] => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
    const cols = Math.max(1, Math.round(L / pane)), w = L / cols
    for (let r = 0; r < rows; r++) {
      const ya = y0 + r * h, yb = ya + h
      for (let c = 0; c < cols; c++) {
        const tone = 0.86 + hash(a.x + c * 1.3, a.z + r * 2.1) * 0.3
        out.quad([P3(c * w, ya, 0.08), P3((c + 1) * w, ya, 0.08), P3((c + 1) * w, yb, 0.08), P3(c * w, yb, 0.08)], n, UV, shade(glass, tone), GLASS)
      }
      out.quad([P3(0, ya, 0.12), P3(L, ya, 0.12), P3(L, ya + 0.9, 0.12), P3(0, ya + 0.9, 0.12)], n, UV, shade(glass, 0.62), METAL)
    }
    if (k.fin) {
      const fin = hex(k.fin), every = k.every ?? 7
      const m = Math.max(1, Math.round(L / every))
      for (let c = 0; c <= m; c++) {
        const u = (L * c) / m
        out.quad([P3(Math.max(0, u - 0.3), y0, 0.5), P3(Math.min(L, u + 0.3), y0, 0.5), P3(Math.min(L, u + 0.3), y1, 0.5), P3(Math.max(0, u - 0.3), y1, 0.5)], n, UV, fin, METAL)
      }
    }
  }
}
/** a tower of tiers in `Skin`s: tower.ts draws the base, the setbacks and the crown, on a plain core, and the skin goes on it */
const raised = (o: { height: number; roof: string; base?: TowerSpec['base']; tiers: { to: number; inset?: number; ledge?: string; skin: Skin }[]; crown?: TowerSpec['crown']; cornices?: TowerSpec['cornices'] }) => (out: MeshBuilder, fit: Fit): void => {
  tower(out, fit, {
    height: o.height, roof: hex(o.roof), base: o.base, crown: o.crown, cornices: o.cornices,
    tiers: o.tiers.map((t) => ({ to: t.to, inset: t.inset, face: { kind: 'blank' as const, wall: shade(hex(t.skin.glass), 0.8), material: 'concrete' as const }, ...(t.ledge ? { cornice: { depth: 1.3, height: 1.1, colour: hex(t.ledge) } } : {}) })),
  })
  const H = fit.height > 0.6 * o.height && fit.height < 1.6 * o.height ? fit.height : o.height
  let ring = towerRing(fit), y = o.base?.height ?? 0
  for (const t of o.tiers) {
    if (t.inset) ring = insetRing(ring, t.inset)
    const top = t.to <= 1.5 ? t.to * H : t.to
    if (top > y) skinned(out, ring, y, top, t.skin)
    y = Math.max(y, top)
  }
}
const ROOF: TowerSpec['crown'] = { kind: 'parapet', height: 2, colour: hex('#5a6368'), material: 'concrete' }
const slant = (height: number, colour = '#47575f'): TowerSpec['crown'] => ({ kind: 'sliced', height, colour: hex(colour), material: 'concrete' })

/** the ring at each height of a tower that isn't an extrusion, drawn as storeys of glass with its floor lines and mullions */
function loft(out: MeshBuilder, at: (y: number) => P[], y0: number, y1: number, step: number, glass: Rgb, line: Rgb, roof: Rgb): void {
  const n = Math.max(1, Math.round((y1 - y0) / step))
  const h = (y1 - y0) / n
  for (let k = 0; k < n; k++) {
    const ya = y0 + k * h, yb = ya + h
    const ra = at(ya), rb = at(yb)
    for (let i = 0; i < ra.length; i++) {
      const j = (i + 1) % ra.length
      const a = ra[i], b = ra[j], c = rb[j], d = rb[i]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L < 0.1) continue
      const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
      out.quad([[a.x, ya, a.z], [b.x, ya, b.z], [c.x, yb, c.z], [d.x, yb, d.z]], [nx, 0, nz], UV, glass, GLASS)
      // the floor's slab line
      const t = 0.9 / h
      const e = { x: a.x + (d.x - a.x) * t, z: a.z + (d.z - a.z) * t }, f = { x: b.x + (c.x - b.x) * t, z: b.z + (c.z - b.z) * t }
      const o = 0.06
      out.quad([[a.x + nx * o, ya, a.z + nz * o], [b.x + nx * o, ya, b.z + nz * o], [f.x + nx * o, ya + 0.9, f.z + nz * o], [e.x + nx * o, ya + 0.9, e.z + nz * o]], [nx, 0, nz], UV, line, METAL)
    }
  }
  capPolygon(out, at(y1), y1, roof, 0)
}

/** a lattice laid on a ring that may change with height: struts rising both ways round the perimeter, `pitch` metres apart at the ground and `rise` up to a crossing */
function lattice(out: MeshBuilder, at: (y: number) => P[], y0: number, y1: number, pitch: number, rise: number, w: number, colour: Rgb, off = 0.45): void {
  const perimeterAt = (r: P[], t: number): { p: P; nx: number; nz: number } => {
    let total = 0
    for (let i = 0; i < r.length; i++) total += Math.hypot(r[(i + 1) % r.length].x - r[i].x, r[(i + 1) % r.length].z - r[i].z)
    let s = (((t % 1) + 1) % 1) * total
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (s <= L && L > 0) { const u = s / L; const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L; return { p: { x: a.x + (b.x - a.x) * u + nx * off, z: a.z + (b.z - a.z) * u + nz * off }, nx, nz } }
      s -= L
    }
    return { p: r[0], nx: 1, nz: 0 }
  }
  const r0 = at(y0)
  let total = 0
  for (let i = 0; i < r0.length; i++) total += Math.hypot(r0[(i + 1) % r0.length].x - r0[i].x, r0[(i + 1) % r0.length].z - r0[i].z)
  const cols = Math.max(4, Math.round(total / pitch))
  const rows = Math.max(1, Math.round((y1 - y0) / rise))
  const h = (y1 - y0) / rows
  for (let row = 0; row < rows; row++) {
    const ya = y0 + row * h, yb = ya + h
    const ra = at(ya), rb = at(yb)
    for (let c = 0; c < cols; c++) {
      for (const dir of [1, -1]) {
        // (half a bay along, every other row: the struts cross on the row line, and the lattice is continuous up the tower)
        const ta = (c + (row % 2 ? 0.5 : 0)) / cols, tb = ta + (dir * 0.5) / cols
        const a = perimeterAt(ra, ta), b = perimeterAt(rb, tb)
        // (a strut's width runs round the perimeter, near enough)
        const sx = (a.nz * w) / 2, sz = (-a.nx * w) / 2
        out.quad([[a.p.x - sx, ya, a.p.z - sz], [a.p.x + sx, ya, a.p.z + sz], [b.p.x + sx, yb, b.p.z + sz], [b.p.x - sx, yb, b.p.z - sz]], [a.nx, 0, a.nz], UV, colour, METAL)
      }
    }
  }
}

/** HEKLA (Jean Nouvel, 2022; 220 m, the tallest thing at Puteaux's end): a blade of fritted glass with white vertical fins, and its top cut on the slant, its prow to the Seine. */
export const hekla = raised({ height: 220, roof: '#5c686e', base: lobby(), tiers: [{ to: 0.93, skin: { glass: '#465f6c', fin: '#8f999c', every: 6 } }], crown: slant(15) })

/** THE LINK (PCA-Stream, 2025; 241 m, TotalEnergies's): two slim glass blades held together by a bridge every few floors. OSM's outline is the pair; the bridges read as dark bands round it, and the top is two heights. */
export const theLink = raised({ height: 241, roof: '#5c686e', base: lobby(), tiers: [{ to: 0.86, skin: { glass: '#4d6d80' } }, { to: 1, inset: 5, skin: { glass: '#527387' } }], crown: ROOF,
  cornices: Array.from({ length: 9 }, (_, k) => ({ at: 26 + k * 22, depth: 0.5, height: 3.4, colour: hex('#242d33') })) })

/** MAJUNGA (Jean-Paul Viguier, 2014; 195 m): a stack of glass sails, each drawn back from the one below, with a balcony's pale rail at every step. */
export const majunga = raised({ height: 195, roof: '#5c686e', base: lobby(), tiers: [
  { to: 0.3, ledge: '#a9b1b3', skin: { glass: '#435d6c', fin: '#7f8a8f', every: 9 } },
  { to: 0.55, inset: 1.8, ledge: '#a9b1b3', skin: { glass: '#476474', fin: '#7f8a8f', every: 9 } },
  { to: 0.8, inset: 1.8, ledge: '#a9b1b3', skin: { glass: '#4b6a7b', fin: '#7f8a8f', every: 9 } },
  { to: 1, inset: 2.2, skin: { glass: '#4f7082', fin: '#7f8a8f', every: 9 } },
], crown: slant(9) })

/** TOUR ORANO, ex-AREVA, ex-FIAT (1974; 184 m): the black one. Dark granite and small windows, 1970s and American: nothing else in the district looks like it. */
export const areva = (out: MeshBuilder, fit: Fit): void => tower(out, fit, { height: 184, roof: hex('#3a3b3c'), base: { height: 8, face: { kind: 'blank', wall: hex('#1c2124'), material: 'granite' } }, tiers: [{ to: 1, face: { kind: 'punched', wall: hex('#26272a'), glass: hex('#101417'), floor: 7.2, pitch: 3.6, solid: 0.55, material: 'granite' } }], crown: { kind: 'parapet', height: 2, colour: hex('#2d2e30') } })

/** TOUR GRANITE (Christian de Portzamparc, 2008; 184 m, Société Générale's): crystal facets in pale grey granite and glass, and a top cut on the slant. */
export const granite = raised({ height: 184, roof: '#6a7072', base: lobby(), tiers: [{ to: 0.92, skin: { glass: '#55696f', fin: '#7d8485', every: 5 } }], crown: slant(14, '#59666c') })

/** TOUR ENGIE T1 (Valode & Pistre, 2008; 185 m): a curved sail of clear glass, narrowing to a blade: its roofline falls away along its length. */
export const engieT1 = raised({ height: 169, roof: '#5c686e', base: lobby(), tiers: [{ to: 0.82, skin: { glass: '#4f7184' } }], crown: slant(30, '#4f7184') })

/** TOUR SAINT-GOBAIN "M" (Valode & Pistre, 2019; 178 m): folded clear glass with a double skin, its top stepped and slanted. */
export const saintGobain = raised({ height: 178, roof: '#5c686e', base: lobby(), tiers: [{ to: 0.8, skin: { glass: '#4e6e80' } }, { to: 1, inset: 2.5, skin: { glass: '#55768a' } }], crown: slant(10) })

/** TOUR TRINITY (Cro&Co, 2020; 151 m): clear glass with its concrete core outside on one flank. Mid-blue here, with a lighter frame. */
export const trinity = raised({ height: 151, roof: '#5c686e', base: lobby(), tiers: [{ to: 1, skin: { glass: '#49687a', fin: '#8b9599', every: 8 } }], crown: ROOF })

/** Plain towers, their outlines and heights OSM's: a skin each, so that the district isn't one colour */
export const defenseGreen = raised({ height: 150, roof: '#4c5451', base: lobby(), tiers: [{ to: 1, skin: { glass: '#2f433e' } }], crown: ROOF })
export const defenseBlue = raised({ height: 150, roof: '#59636a', base: lobby(), tiers: [{ to: 1, skin: { glass: '#3a5566' } }], crown: ROOF })
export const defenseBronze = raised({ height: 130, roof: '#514e48', base: lobby('#3e3a35'), tiers: [{ to: 1, skin: { glass: '#443f38', fin: '#5d564c', every: 5 } }], crown: ROOF })
export const defenseStone = raised({ height: 130, roof: '#696660', base: lobby(), tiers: [{ to: 1, skin: { glass: '#6b6a62', module: 3.8 } }], crown: ROOF })
export const defenseSteel = raised({ height: 150, roof: '#59636a', base: lobby(), tiers: [{ to: 1, skin: { glass: '#414d55', fin: '#6d777c', every: 5 } }], crown: ROOF })

/** TOUR D2 (Anthony Béchu and Tom Sheehan, 2014; 171 m): an egg in a white steel net over dark glass, the columns on the outside so that the floors have none. Its plan is a lozenge with round ends, fattest a little below mid-height and drawn in at foot and crown; the top is a glass dome over a garden. The plan is a superellipse on the OSM ring's principal axes, scaled by a wavy profile. */
const D2 = {
  height: 171,
  /** superellipse exponent of the plan: 2 an ellipse, higher squarer */
  squareness: 2.6,
  /** scale of the plan at the foot, at the bulge and at the dome's spring */
  foot: 0.86, bulge: 1.04, crown: 0.8,
  /** where the bulge peaks, as a fraction of the shaft */
  bulgeAt: 0.45,
  /** the dome: its height and how far in it draws at the top */
  dome: 14, domeTop: 0.35,
  storey: 4.2, segs: 40,
  /** diagrid: metres round the foot between nodes, metres up to a crossing, strut width */
  gridPitch: 9, gridRise: 12, gridWidth: 1.1,
  glass: '#2c3c46', floorLine: '#3a4a54', domeGlass: '#7f97a2', steel: '#e4e8e9',
}
export function tourD2(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit), H = fit.height || D2.height, Hs = H - D2.dome
  let cx = 0, cz = 0
  for (const p of r) { cx += p.x / r.length; cz += p.z / r.length }
  let sxx = 0, szz = 0, sxz = 0
  for (const p of r) { const dx = p.x - cx, dz = p.z - cz; sxx += dx * dx; szz += dz * dz; sxz += dx * dz }
  const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th)
  let A = 0, B = 0
  for (const p of r) { const dx = p.x - cx, dz = p.z - cz; A = Math.max(A, Math.abs(dx * ux + dz * uz)); B = Math.max(B, Math.abs(-dx * uz + dz * ux)) }
  const e = 2 / D2.squareness
  const plan: P[] = []
  for (let i = 0; i < D2.segs; i++) {
    const t = (i / D2.segs) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t)
    const u = A * Math.sign(c) * Math.abs(c) ** e, v = B * Math.sign(s) * Math.abs(s) ** e
    plan.push({ x: u * ux - v * uz, z: u * uz + v * ux })
  }
  if (signedArea(plan) * signedArea(r) < 0) plan.reverse()
  const scale = (y: number): number => {
    if (y > Hs) { const t = Math.min(1, (y - Hs) / D2.dome); return D2.crown * (1 - (1 - D2.domeTop) * (1 - Math.sqrt(1 - t * t))) }
    const t = y / Hs
    return t < D2.bulgeAt
      ? D2.foot + (D2.bulge - D2.foot) * Math.sin((t / D2.bulgeAt) * Math.PI / 2)
      : D2.crown + (D2.bulge - D2.crown) * Math.cos(((t - D2.bulgeAt) / (1 - D2.bulgeAt)) * Math.PI / 2)
  }
  const at = (y: number): P[] => { const k = scale(y); return plan.map((p) => ({ x: cx + p.x * k, z: cz + p.z * k })) }
  loft(out, at, 0, Hs, D2.storey, hex(D2.glass), hex(D2.floorLine), hex(D2.glass))
  loft(out, at, Hs, H, D2.dome / 4, hex(D2.domeGlass), hex(D2.steel), hex(D2.domeGlass))
  lattice(out, at, 0, H, D2.gridPitch, D2.gridRise, D2.gridWidth, hex(D2.steel))
}
const signedArea = (r: P[]): number => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z } return a / 2 }

/** TOUR CARPE DIEM (Robert A. M. Stern, 2013; 166 m): cut facets and a tall diamond of pale mullions down each one, a crown slanting to a point. */
// Carpe Diem tunables
const CD_CROWN = 12        // open frame above the last floor
const CD_FOLD = 3.2        // metres each corner swings in/out as the facets fold
const CD_FOLDS = 2         // fold cycles over the height
const CD_STEP = 4.2        // storey
const CD_PLANT_H = 2.5     // the rooftop planter's rise
export function carpeDiem(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit), H = (fit.height || 166) - CD_CROWN
  let cx = 0, cz = 0
  for (const p of r) { cx += p.x / r.length; cz += p.z / r.length }
  // corners alternate their phase, so neighbouring corners swing opposite ways: each face folds into two big triangles
  const at = (y: number): P[] => r.map((p, i) => {
    const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz) || 1
    const t = (y / (H + CD_CROWN)) * CD_FOLDS + (i % 2) * 0.5
    const tri = 1 - 2 * Math.abs(t - Math.floor(t) - 0.5) * 2 // -1..1 zigzag
    const k = CD_FOLD * tri
    return { x: p.x + (dx / d) * k, z: p.z + (dz / d) * k }
  })
  loft(out, at, 0, H, CD_STEP, hex('#4b6675'), hex('#71858f'), hex('#5c686e'))
  lattice(out, at, 0, H, 16, 30, 0.6, hex('#a0aaae'), 0.3)
  // the crown: an open frame of diagonal struts round the planter
  lattice(out, at, H, H + CD_CROWN, 6, CD_CROWN, 0.5, hex('#c4ccd0'), 0.1)
  const top = at(H + CD_CROWN)
  for (let i = 0; i < top.length; i++) {
    const a = top[i], b = top[(i + 1) % top.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z); if (L < 0.1) continue
    const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L, y = H + CD_CROWN
    out.quad([[a.x, y - 1, a.z], [b.x, y - 1, b.z], [b.x, y, b.z], [a.x, y, a.z]], [nx, 0, nz], UV, hex('#c4ccd0'), METAL)
  }
  const box = at(H).map((p) => ({ x: cx + (p.x - cx) * 0.7, z: cz + (p.z - cz) * 0.7 }))
  for (let i = 0; i < box.length; i++) {
    const a = box[i], b = box[(i + 1) % box.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z); if (L < 0.1) continue
    out.quad([[a.x, H, a.z], [b.x, H, b.z], [b.x, H + CD_PLANT_H, b.z], [a.x, H + CD_PLANT_H, a.z]], [(b.z - a.z) / L, 0, -(b.x - a.x) / L], UV, hex('#8a8f8c'), METAL)
  }
  capPolygon(out, box, H + CD_PLANT_H, hex('#4f7a3c'), 0)
}

/** TOUR ALTO (IF Architectes and Arquitectonica's kin, 2020; 160 m): the tower that widens as it climbs, a third more floor at the top than at its foot, on a site too small for it. OSM's outline is the top; the shaft draws in towards the parvis. */
export function tourAlto(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit), H = fit.height || 160
  let cx = 0, cz = 0
  for (const p of r) { cx += p.x / r.length; cz += p.z / r.length }
  const at = (y: number): P[] => {
    const t = Math.min(1, y / (H * 0.62))
    const s = 0.72 + 0.28 * t * (2 - t)
    return r.map((p) => ({ x: cx + (p.x - cx) * s, z: cz + (p.z - cz) * s }))
  }
  loft(out, at, 0, H, 7.6, hex('#49677a'), hex('#6f8592'), hex('#5c686e'))
}

/**
 * TOUR TRIANGLE (Herzog & de Meuron, Porte de Versailles, 180 m): a blade seen end-on and a great triangle seen side-on: its long plan, some 170 m at the foot, draws in to a short ridge at the top, and its glass is a net of big diamonds. OSM has the foot's outline, and the bake raised that to 180 m, a slab the size of a street. The long axis scales down with height; the thickness barely.
 */
export function tourTriangle(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit), H = fit.height || 180
  let cx = 0, cz = 0
  for (const p of r) { cx += p.x / r.length; cz += p.z / r.length }
  // (the long axis: the ring's two farthest corners)
  let far = 0, ax = 1, az = 0
  for (const p of r) for (const q of r) { const d = Math.hypot(p.x - q.x, p.z - q.z); if (d > far) { far = d; ax = (q.x - p.x) / d; az = (q.z - p.z) / d } }
  const at = (y: number): P[] => {
    const t = y / H
    const sl = 1 - 0.9 * t, sw = 1 - 0.3 * t
    return r.map((p) => {
      const dx = p.x - cx, dz = p.z - cz
      const u = dx * ax + dz * az, v = -dx * az + dz * ax
      return { x: cx + ax * u * sl - az * v * sw, z: cz + az * u * sl + ax * v * sw }
    })
  }
  loft(out, at, 0, H, 7.2, hex('#4a6371'), hex('#5f7683'), hex('#5c686e'))
  lattice(out, at, 0, H, 14, 14.4, 1, hex('#8e9a9f'), 0.3)
}
