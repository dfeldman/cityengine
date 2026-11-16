/**
 * TOUR ALTO (IF Architectes, 2020; 38 storeys). The tower that stands on its toes: it rises from a small foot over the
 * road beside the dalle and its rounded plan WIDENS with height — every floor's edge 12 cm out from the one below
 * (fr.wikipedia), floors from ~700 m² at the foot to ~1,500 m² at the top — so the flare is a straight cone in
 * section, and the top part reads nearly upright because the step per floor is small against the plan. OSM's ring
 * (way/758211634) is the roof outline (IGN lidar MNS: the 50 × 56 m roof plane matches it).
 * Skin (fr.wikipedia lead photo "Tour Alto Mars 2022"): pale silver-blue reflective glass with a white-silver
 * spandrel ring at every floor, so it reads as a stack of hoops. Not gold, not dark.
 * Heights: IGN LiDAR HD MNS, main roof 146 m and the plant box 154 m above the street-level ground (37.2 m NGF);
 * BD TOPO h = 160; fr.wikipedia 160 m from the street, 150 m from the slab.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { towerRing } from '../../tower.ts'

type P = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// tunables
const ALTO_ROOF = 146            // IGN MNS main roof
const ALTO_TOP = 154             // IGN MNS plant box
const ALTO_FOOT = 0.66           // plan scale at the foot (sqrt(700/1500) ≈ 0.68)
const ALTO_FULL = 0.97           // fraction of the roof height where the cone reaches the roof ring
const ALTO_LOBBY_H = 9
const ALTO_FLOOR = 3.85
const ALTO_GLASS = '#abc0cf'     // silver-blue sky mirror
const ALTO_BAND = '#dde2e4'      // white-silver floor hoop
const ALTO_BAND_H = 0.75
const ALTO_LOBBY = '#56636b'
const ALTO_ROOFC = '#8f989c'
const ALTO_PLANT = 0.55          // plant box scale of the roof ring

const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

export const centroid = (r: P[]): P => { let x = 0, z = 0; for (const p of r) { x += p.x / r.length; z += p.z / r.length } return { x, z } }
export const scaleAbout = (r: P[], c: P, s: number): P[] => r.map((p) => ({ x: c.x + (p.x - c.x) * s, z: c.z + (p.z - c.z) * s }))

/**
 * Storeys of glass on a ring that may change with height: each edge cut into panes about `pane` m wide, each pane its
 * own tone of the glass, and a spandrel band at every floor. Ring anticlockwise (towerRing's sense).
 */
export function skin(out: MeshBuilder, at: (y: number) => P[], y0: number, y1: number, floor: number, pane: number, glass: Rgb, band: Rgb, bandH: number, spread = 0.22): void {
  const n = Math.max(1, Math.round((y1 - y0) / floor)), h = (y1 - y0) / n
  for (let k = 0; k < n; k++) {
    const ya = y0 + k * h, yb = ya + h, ra = at(ya), rb = at(yb)
    const yc = ya + Math.min(bandH, h * 0.5)
    for (let i = 0; i < ra.length; i++) {
      const j = (i + 1) % ra.length
      const a = ra[i], b = ra[j], d = rb[i], c = rb[j]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L < 0.1) continue
      const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
      const cols = Math.max(1, Math.round(L / pane))
      const lerp = (p: P, q: P, t: number): P => ({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t })
      const t = (yc - ya) / h
      for (let cc = 0; cc < cols; cc++) {
        const u0 = cc / cols, u1 = (cc + 1) / cols
        const p0 = lerp(a, b, u0), p1 = lerp(a, b, u1), q0 = lerp(d, c, u0), q1 = lerp(d, c, u1)
        const m0 = lerp(p0, q0, t), m1 = lerp(p1, q1, t)
        const tone = 1 - spread / 2 + hash(p0.x * 0.7 + k * 3.1, p0.z * 0.7 + cc) * spread
        out.quad([[m0.x, yc, m0.z], [m1.x, yc, m1.z], [q1.x, yb, q1.z], [q0.x, yb, q0.z]], [nx, 0, nz], UV, shade(glass, tone), GLASS)
      }
      out.quad([[a.x, ya, a.z], [b.x, ya, b.z], [lerp(b, c, t).x, yc, lerp(b, c, t).z], [lerp(a, d, t).x, yc, lerp(a, d, t).z]], [nx, 0, nz], UV, band, METAL)
    }
  }
}

/** plain walls on a ring between two heights */
export function walls(out: MeshBuilder, r: P[], y0: number, y1: number, c: Rgb, mat = METAL): void {
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.1) continue
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [(b.z - a.z) / L, 0, -(b.x - a.x) / L], UV, c, mat)
  }
}

export function tourAlto(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit), c = centroid(r)
  const top = fit.height > 140 && fit.height < 170 ? fit.height : ALTO_TOP
  const roof = top * (ALTO_ROOF / ALTO_TOP)
  const yFull = roof * ALTO_FULL
  const at = (y: number): P[] => scaleAbout(r, c, ALTO_FOOT + (1 - ALTO_FOOT) * Math.min(1, Math.max(0, y / yFull)))
  const lobby = at(0)
  walls(out, scaleAbout(r, c, ALTO_FOOT * 0.97), 0, ALTO_LOBBY_H, hex(ALTO_LOBBY), GLASS)
  capPolygon(out, lobby, ALTO_LOBBY_H, hex(ALTO_LOBBY), 0)
  skin(out, at, ALTO_LOBBY_H, roof, ALTO_FLOOR, 3.6, hex(ALTO_GLASS), hex(ALTO_BAND), ALTO_BAND_H)
  // parapet hoop and roof
  const rr = at(roof)
  walls(out, rr, roof, roof + 1.4, hex(ALTO_BAND))
  capPolygon(out, rr, roof + 0.2, hex(ALTO_ROOFC), 0)
  const plant = scaleAbout(rr, c, ALTO_PLANT)
  walls(out, plant, roof, top, hex('#b9c0c3'))
  capPolygon(out, plant, top, hex(ALTO_ROOFC), 0)
}
