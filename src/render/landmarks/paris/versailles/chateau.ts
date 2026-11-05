import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { prism } from '../../../models.ts'
import { extrude, fitted, hipRidge, hipRoof, mansard, pairOn, palette, pedimentOn, rectOn, statue, type F, type Pal } from '../palaces/common.ts'
import { COURTS, HX, HZ, OUTLINE } from './plan.ts'

/*
 * Tunables, in metres above the builder's base, from IGN's lidar surface model (docs/landmarks/refs/versailles/mns,
 * sampled in this frame: docs/landmarks/MODEL-VERSAILLES.md).
 */
/** the cornice round the whole château: the lidar's roofs read 23–26 m with the balustrade and trophies */
const EAVES = 20
/** the low roof behind the balustrade (the garden fronts are flat-roofed to the eye) */
const RISE = 2.4
/** the Chapelle royale: x 28…57, z −74…2 in the lidar, its ridge 31 m */
const CHAPEL = { x0: 28, x1: 57, z0: -74, z1: 2, eaves: 24, ridge: 32 }
/** the Opéra royal at the north wing's end: x 186…199, z −69…−21, its roof 33 m */
const OPERA = { x0: 186, x1: 199, z0: -69, z1: -21, eaves: 24, ridge: 33 }
/** the balustrade's height and the spacing of the trophies and vases along it */
const BALUSTER_H = 1.1
/** the Cour de Marbre (OSM's notch x −12.9…9.9, z 18…47.6) and the Louis XIII ranges round it, under tall mansards */
const MARBRE = { x0: -12.9, x1: 9.9, z0: 18, z1: 47.6, wing: 17.7, back: 5, step: 1.5, rise: 0.9 }
const MANSARD = { h1: 3.2, h2: 1.2 }
const BRICK = '#9c4a36'
/** the avant-corps of the garden fronts: [face plane z, centre x, width] — four columns on the piano nobile, statues over */
const AVANTS: [number, number, number][] = [[72.6, -1.5, 14], [72.6, -38, 10], [72.6, 35, 10], [-12.4, -130, 12], [-12.4, -185, 10], [-12.4, 130, 12], [-12.4, 185, 10]]
const COLUMN_R = 0.55
/** the chapel's apse at its town (−z) end, a half-round of this radius */
const APSE_SIDES = 14
const TROPHY_STEP = 7.2
/** a gilt ridge-bar stops this far short of each end of the roof's ridge (m), and is this wide and tall */
/** the chapel's windows keep this far from the apse's join and the nave's end (m); an apse window fills this share of its facet */
const WIN_MARGIN = 3, APSE_WIN_FILL = 0.55
const GILT_TRIM = 0.3, GILT_HALF = 0.2, GILT_H = 0.7

/**
 * The Château de Versailles (Le Vau's envelope, 1668; Hardouin-Mansart's garden front and the Galerie des Glaces, 1678,
 * the north and south wings, 1680s; the Chapelle royale, 1699–1710; Gabriel's Opéra, 1770). OSM's plan
 * round its seven courts extruded to one cornice, the garden front's three storeys (the arched rez-de-jardin, the tall
 * piano nobile, the attic), the balustrade with its trophies, the chapel and the Opéra standing above the roofs.
 * The Cour de Marbre's brick, mansards, gilt and marble; the garden fronts' avant-corps; the chapel's apse. Still to come:
 * the Cour royale's paving, the Grille royale, the terrace's ground.
 */
export function versaillesChateau(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e8dcc2', '#3f474d')
  extrude(out, [OUTLINE, ...COURTS], p, {
    eaves: EAVES, bay: 4.2, win: 1.8, rise: RISE, inset: 2.2, dormers: false,
    storeys: [{ y: 0, h: 4.2, sill: 0.6 }, { y: 7.6, h: 5.0, sill: 0.4 }, { y: 15.4, h: 2.4, sill: 0.4 }],
  })
  trophies(out, p)
  chapel(out, p)
  roofed(out, p, OPERA, 1.0)
  marbre(out, p)
  for (const [z, x, w] of AVANTS) avantCorps(out, p, '+z', z, x, w)
}

/**
 * The Cour de Marbre: Louis XIII's brick-and-stone château kept inside Le Vau's envelope — brick between stone piers on
 * the court fronts, tall slate mansards with gilt crests round three sides, the gilt balcony of the King's bedchamber
 * on the back range, and the raised court paved in black and white marble.
 */
function marbre(out: MeshBuilder, p: Pal): void {
  const m = MARBRE
  const gold = p.gold, brick = hex(BRICK)
  const ranges: [number, number, number, number][] = [
    [m.x0 - m.wing, m.x0, m.z0 - 25, m.z1 + m.back], [m.x1, m.x1 + m.wing, m.z0 - 25, m.z1 + m.back], [m.x0, m.x1, m.z1, m.z1 + m.back + 2]]
  for (const [x0, x1, z0, z1] of ranges) {
    mansard(out, x0, x1, z0, z1, EAVES, MANSARD.h1, MANSARD.h2, p.slate)
    const top = EAVES + MANSARD.h1 + MANSARD.h2
    const r = hipRidge(x0 + 1.6, x1 - 1.6, z0 + 1.6, z1 - 1.6, 0, GILT_TRIM)
    if (r.t1 > r.t0) block(out, r.alongX ? r.t0 : r.c - GILT_HALF, r.alongX ? r.t1 : r.c + GILT_HALF, r.alongX ? r.c - GILT_HALF : r.t0, r.alongX ? r.c + GILT_HALF : r.t1,
      top - 0.2, top + GILT_H - 0.2, gold)
  }
  // brick between stone piers on the three court fronts
  const faces: [F, number, number, number][] = [['+x', m.x0, m.z0, m.z1], ['-x', m.x1, m.z0, m.z1], ['-z', m.z1, m.x0, m.x1]]
  for (const [f, plane, t0, t1] of faces) {
    const n = Math.round((t1 - t0) / 3.6)
    for (let k = 0; k < n; k++) {
      const a = t0 + ((t1 - t0) * k) / n
      rectOn(out, f, plane, a + 0.25, a + 0.75, 0.4, EAVES - 0.6, brick, 0.1)
      rectOn(out, f, plane, a + 2.85, a + 3.35, 0.4, EAVES - 0.6, brick, 0.1)
    }
    rectOn(out, f, plane, t0, t1, 7.0, 7.5, p.trim, 0.14)
  }
  // the balcony of the King's bedchamber, gilt, on the back range, and the clock's pediment over it
  const cx = (m.x0 + m.x1) / 2
  block(out, cx - 4, cx + 4, m.z1 - 1.4, m.z1, 7.6, 7.9, p.stone)
  rectOn(out, '-z', m.z1 - 1.4, cx - 4, cx + 4, 7.9, 8.9, gold, 0.05)
  for (const s of [-1, 1]) pairOn(out, '-z', m.z1, cx + s * 2.6, 0.9, 7.6, 0.35, p.trim, 0.9)
  pedimentOn(out, '-z', m.z1, cx - 4.5, cx + 4.5, EAVES, 3.2, 0.5, p.trim)
  rectOn(out, '-z', m.z1 - 0.5, cx - 1.1, cx + 1.1, EAVES + 0.5, EAVES + 2.3, gold, 0.06)
  // the raised court, black and white marble
  const nx = Math.round((m.x1 - m.x0) / m.step), nz = Math.round((m.z1 - m.z0) / m.step)
  const w = shade(p.stone, 1.12), b = shade(p.dark, 0.8)
  block(out, m.x0, m.x1, m.z0, m.z1, 0, m.rise - 0.05, p.stone)
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    if ((i + j) % 2) continue
    const x = m.x0 + ((m.x1 - m.x0) * i) / nx, z = m.z0 + ((m.z1 - m.z0) * j) / nz
    block(out, x, x + (m.x1 - m.x0) / nx, z, z + (m.z1 - m.z0) / nz, m.rise - 0.05, m.rise, b)
  }
  block(out, m.x0, m.x1, m.z0, m.z1, m.rise - 0.06, m.rise - 0.04, w)
}

/** an avant-corps on a garden front: a shallow forward slab, four columns on the piano nobile, statues on the attic */
function avantCorps(out: MeshBuilder, p: Pal, f: F, plane: number, t: number, w: number): void {
  const sgn = f === '+z' || f === '+x' ? 1 : -1
  const fwd = plane + sgn * 0.8
  block(out, t - w / 2, t + w / 2, Math.min(plane, fwd), Math.max(plane, fwd), 0, EAVES, p.stone)
  rectOn(out, f, fwd, t - w / 2, t + w / 2, 7.2, 7.6, p.trim, 0.12)
  for (let k = 0; k < 4; k++) {
    const u = t - w / 2 + (w * (k + 0.5)) / 4
    pairOn(out, f, fwd, u, 7.6, 15.2, COLUMN_R, p.trim, 0.01)
    statue(out, u, fwd - sgn * 0.3, EAVES + BALUSTER_H * 0.5, 2.0, p.trim)
  }
  rectOn(out, f, fwd, t - w / 2, t + w / 2, 0, 7.2, shade(p.stone, 0.93), 0.08)
}

/** vases and trophies along the parapet of the outline's long straight runs */
function trophies(out: MeshBuilder, p: Pal): void {
  const r = OUTLINE
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 20) continue
    const n = Math.floor(L / TROPHY_STEP)
    for (let k = 1; k < n; k++) {
      const t = k / n
      statue(out, a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, EAVES + BALUSTER_H * 0.5, 1.6, p.trim)
    }
  }
}

function roofed(out: MeshBuilder, p: Pal, b: { x0: number; x1: number; z0: number; z1: number; eaves: number; ridge: number }, eave = 0.5): void {
  block(out, b.x0, b.x1, b.z0, b.z1, 0, b.eaves, p.stone)
  block(out, b.x0 - 0.3, b.x1 + 0.3, b.z0 - 0.3, b.z1 + 0.3, b.eaves - 0.8, b.eaves, p.trim)
  hipRoof(out, b.x0, b.x1, b.z0, b.z1, b.eaves, b.ridge - b.eaves, p.slate, eave)
}

/** the chapel: its tall nave over the roofs, the gilt ridge, the windows of the tribune storey */
function chapel(out: MeshBuilder, p: Pal): void {
  const c = CHAPEL
  const r = (c.x1 - c.x0) / 2, mx0 = (c.x0 + c.x1) / 2, za = c.z0 + r
  roofed(out, p, { ...c, z0: za }, 0.4)
  // the apse: a half-round to the town, its roof a cone into the nave's
  prism(out, mx0, za, 0, c.eaves, r, APSE_SIDES * 2, p.stone)
  prism(out, mx0, za, c.eaves - 0.8, c.eaves, r + 0.3, APSE_SIDES * 2, p.trim)
  prism(out, mx0, za, c.eaves, c.ridge, r + 0.4, APSE_SIDES * 2, p.slate, undefined, 0.3)
  const glass = shade(p.glass, 0.9)
  // the tribune windows stand on the straight nave only: below za the wall is the apse, which curves in
  for (let z = za + WIN_MARGIN + 1; z < c.z1 - WIN_MARGIN; z += 6) {
    block(out, c.x0 - 0.1, c.x0, z - 1.2, z + 1.2, EAVES + 0.6, c.eaves - 1.4, glass)
    block(out, c.x1, c.x1 + 0.1, z - 1.2, z + 1.2, EAVES + 0.6, c.eaves - 1.4, glass)
  }
  // and on the apse: one in every other facet, inside the facet's own width, in its plane
  const n = APSE_SIDES * 2, rf = r * Math.cos(Math.PI / n) + 0.05, FIXED = 0
  for (let i = 0; i < n; i += 2) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2
    if (Math.cos(am) > -0.05 || Math.abs(Math.sin(am)) > 0.98) continue
    const k = (1 - APSE_WIN_FILL) / 2
    const pt = (a: number, y: number): [number, number, number] => [mx0 + Math.sin(a) * rf / Math.cos(a - am), y, za + Math.cos(a) * rf / Math.cos(a - am)]
    const aa = a0 + (a1 - a0) * k, ab = a1 - (a1 - a0) * k
    out.quad([pt(aa, EAVES + 0.6), pt(ab, EAVES + 0.6), pt(ab, c.eaves - 1.4), pt(aa, c.eaves - 1.4)], [Math.sin(am), 0, Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, FIXED)
  }
  const g = hipRidge(c.x0, c.x1, za, c.z1, 0.4, GILT_TRIM)
  if (g.t1 > g.t0) block(out, g.c - GILT_HALF, g.c + GILT_HALF, g.t0, g.t1, c.ridge - 0.2, c.ridge + GILT_H - 0.2, p.gold)
}
