/**
 * THE CNIT (Camelot, de Mailly and Zehrfuss; engineers Esquillan and Faessel; Prouvé's curtain walls; 1956-58; reglazed
 * 2009): a thin double concrete shell on a triangular plan, resting on three abutments only, 218 m a side (238 m quoted
 * between the supports' axes), 46.3 m at the crown (Wikipedia fr; the brief's 46 m BD TOPO apex).
 * The shell is three lobes (one over each facade) meeting in valleys that run from the crown down to the three corners; each
 * lobe is corrugated, the folds fanning from the crown out to the facade arch, deep at the rim and fading to the crown. Under
 * each lobe's rim a great glass arch, leaning back a little, with strong vertical mullion fins and transoms every storey-ish;
 * the hotel/office blocks (Hilton) stand inside, dark behind the glass.
 * Sources: Commons "Puteaux - Centre des nouvelles industries et technologies - 2025-10-08 17-14-11 001.jpg" (parvis side,
 * the fanned folds on the shell, the white rim, the glass grid, Hilton behind), "2010-09-28 - CNIT Paris 22.jpg" (a facade
 * end-on: the arch running down to the corner, the inclined glass, 2.5 m panel grid). Plan as the old model (OSM relation
 * 3071527, -z facing bearing 206).
 * Each facet is shaded by its own normal, so the folds read as crisp creases.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { fitted } from '../palaces/common.ts'

type V3 = [number, number, number]
type P = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const CONCRETE = surfaceTag('concrete')
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// ---- tunables ----
const CN_A: P = { x: -107.7, z: -93.0 }
const CN_B: P = { x: 107.7, z: -93.0 }
const CN_C: P = { x: -2.2, z: 93.9 }
const CN_H = 46.3          // crown
const ARCH_H = 41          // top of each facade arch at its middle
const ARCH_POW = 0.62      // arch fullness (lower = rounder shoulders)
const CROWN_POW = 1.6      // how fast a lobe rises from rim to crown
const FOLDS = 34           // folds per lobe (fan lines from crown to rim, even)
const FOLD_AMP = 2.6       // fold depth at the rim (m)
const FOLD_FADE = 0.85     // share of the fold depth lost by the crown
const RINGS = 9            // facets from rim to crown
const RIM_OUT = 3.0        // shell rim projects past the glass
const RIM_DEPTH = 2.2      // rim band height
const GLASS_LEAN = 3.5     // glass top set back this far (m) at the arch top
const MULL_EVERY = 2.6     // vertical fins
const MULL_W = 0.35
const MULL_D = 0.9         // fin depth
const TRANSOM_EVERY = 4.6
const ABUT_R = 9           // corner abutment half-size
const ABUT_H = 5
const SHELL = '#d9d5ca'    // pale concrete shell, sky-lit
const RIM = '#f2f0ea'      // white rim
const GLASS_C = '#8fa6b3'  // grey-blue glass with the sky in it
const GLASS_LOW = '#5d6e78' // ground-floor glass, concourse lit behind
const MULL_C = '#d6dcdf'   // aluminium fins
const ABUT_C = '#b7b2a6'
const INSIDE_C = '#4c565d' // Hilton / office blocks behind the glass

export function cnitVault(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, 107.7, 93.9, (q) => build(q))
}

function build(q: MeshBuilder): void {
  const C = [CN_A, CN_B, CN_C]
  const O: P = { x: (CN_A.x + CN_B.x + CN_C.x) / 3, z: (CN_A.z + CN_B.z + CN_C.z) / 3 }
  const face = (pts: V3[], col: Rgb, tag: number, lit = true, up = true): void => {
    const [a, b, c] = pts
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const L = Math.hypot(...n) || 1; n = [n[0] / L, n[1] / L, n[2] / L]
    const cx = (a[0] + b[0] + c[0]) / 3 - O.x, cz = (a[2] + b[2] + c[2]) / 3 - O.z
    const out = up ? n[1] : n[0] * cx + n[2] * cz
    if (out < 0) n = [-n[0], -n[1], -n[2]]
    // per-facet tone from the normal (sun high in the south-west-ish)
    const t = lit ? 0.7 + 0.22 * n[1] + 0.22 * (n[0] * -0.5 + n[2] * -0.6) : 1
    const p4 = pts.length === 3 ? [pts[0], pts[1], pts[2], pts[2]] : pts
    q.quad(p4 as [V3, V3, V3, V3], n, UV, shade(col, t), tag)
  }
  const arch = (s: number): number => ARCH_H * Math.pow(Math.max(0, Math.sin(Math.PI * s)), ARCH_POW)

  for (let e = 0; e < 3; e++) {
    const a = C[e], b = C[(e + 1) % 3]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
    let nx = tz, nz = -tx
    const mx = (a.x + b.x) / 2 - O.x, mz = (a.z + b.z) / 2 - O.z
    if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz }
    const edge = (s: number, d = 0): P => ({ x: a.x + (b.x - a.x) * s + nx * d, z: a.z + (b.z - a.z) * s + nz * d })

    // ---- the lobe: fan from the crown to the rim (which sits RIM_OUT past the edge) ----
    const shellPt = (i: number, r: number): V3 => {
      const s = i / FOLDS
      const t = r / RINGS // 0 at rim, 1 at crown
      const rim = edge(s, RIM_OUT * Math.sin(Math.PI * s))
      const x = rim.x + (O.x - rim.x) * t, z = rim.z + (O.z - rim.z) * t
      const y0 = arch(s)
      let y = y0 + (CN_H - y0) * (1 - Math.pow(1 - t, CROWN_POW))
      const fold = (i % 2 === 0 ? 1 : -1) * FOLD_AMP * (1 - FOLD_FADE * t) * Math.pow(Math.sin(Math.PI * s), 0.5)
      if (i > 0 && i < FOLDS && r < RINGS) y += fold
      return [x, y, z]
    }
    for (let i = 0; i < FOLDS; i++) {
      for (let r = 0; r < RINGS; r++) {
        const p00 = shellPt(i, r), p10 = shellPt(i + 1, r), p01 = shellPt(i, r + 1), p11 = shellPt(i + 1, r + 1)
        if (r === RINGS - 1) face([p00, p10, p01], hex(SHELL), CONCRETE)
        else { face([p00, p10, p11], hex(SHELL), CONCRETE); face([p00, p11, p01], hex(SHELL), CONCRETE) }
      }
    }
    // underside of the shell (seen through the glass and from below the rim)
    // ---- the rim band and the glass ----
    const K = 48
    for (let k = 0; k < K; k++) {
      const s0 = k / K, s1 = (k + 1) / K
      const r0 = edge(s0, RIM_OUT * Math.sin(Math.PI * s0)), r1 = edge(s1, RIM_OUT * Math.sin(Math.PI * s1))
      const y0 = arch(s0), y1 = arch(s1)
      face([[r0.x, y0 - RIM_DEPTH * Math.sin(Math.PI * s0), r0.z], [r1.x, y1 - RIM_DEPTH * Math.sin(Math.PI * s1), r1.z], [r1.x, y1, r1.z], [r0.x, y0, r0.z]], hex(RIM), CONCRETE, true, false)
      // soffit from rim back to the glass head
      const g0 = edge(s0, -GLASS_LEAN * (y0 / ARCH_H)), g1 = edge(s1, -GLASS_LEAN * (y1 / ARCH_H))
      const h0 = Math.max(0, y0 - RIM_DEPTH * Math.sin(Math.PI * s0)), h1 = Math.max(0, y1 - RIM_DEPTH * Math.sin(Math.PI * s1))
      face([[r0.x, h0, r0.z], [r1.x, h1, r1.z], [g1.x, h1, g1.z], [g0.x, h0, g0.z]], shade(hex(SHELL), 0.7), CONCRETE, false)
      // glass: from the ground (at the edge line) leaning back to the head
      const b0 = edge(s0, 0), b1 = edge(s1, 0)
      const lowH = Math.min(6, h0, h1)
      const lerp = (bp: P, gp: P, y: number, h: number): V3 => { const f = h > 0 ? y / h : 0; return [bp.x + (gp.x - bp.x) * f, y, bp.z + (gp.z - bp.z) * f] }
      face([lerp(b0, g0, 0, h0), lerp(b1, g1, 0, h1), lerp(b1, g1, lowH, h1), lerp(b0, g0, lowH, h0)], hex(GLASS_LOW), GLASS, false, false)
      if (h0 > lowH || h1 > lowH) face([lerp(b0, g0, lowH, h0), lerp(b1, g1, lowH, h1), lerp(b1, g1, h1, h1), lerp(b0, g0, h0, h0)], hex(GLASS_C), GLASS, false, false)
    }
    // vertical fins
    const nm = Math.round(L / MULL_EVERY)
    for (let m = 1; m < nm; m++) {
      const s = m / nm, h = Math.max(0, arch(s) - RIM_DEPTH * Math.sin(Math.PI * s))
      if (h < 1) continue
      const w = MULL_W / 2 / L
      const g = (ss: number, y: number, d: number): V3 => { const p = edge(ss, d - GLASS_LEAN * (y / ARCH_H)); return [p.x, y, p.z] }
      face([g(s - w, 0, MULL_D), g(s + w, 0, MULL_D), g(s + w, h, MULL_D), g(s - w, h, MULL_D)], hex(MULL_C), METAL, false, false)
      face([g(s, 0, 0), g(s, 0, MULL_D), g(s, h, MULL_D), g(s, h, 0)], shade(hex(MULL_C), 0.82), METAL, false, false)
    }
    // transoms, each spanning between where the arch meets it
    for (let y = TRANSOM_EVERY; y < ARCH_H - 2; y += TRANSOM_EVERY) {
      let lo = 0, hi = 0.5
      for (let it = 0; it < 20; it++) { const m = (lo + hi) / 2; if (arch(m) - RIM_DEPTH * Math.sin(Math.PI * m) < y) lo = m; else hi = m }
      const sa = hi, sb = 1 - hi
      const d = 0.25 - GLASS_LEAN * (y / ARCH_H)
      const pa = edge(sa, d), pb = edge(sb, d)
      face([[pa.x, y, pa.z], [pb.x, y, pb.z], [pb.x, y + 0.3, pb.z], [pa.x, y + 0.3, pa.z]], hex(MULL_C), METAL, false, false)
    }
    // the hotel/office block inside, behind the middle of this facade
    const ia = edge(0.3, -14), ib = edge(0.7, -14), ic = edge(0.7, -34), id = edge(0.3, -34)
    const H = 24
    const box: V3[] = [[ia.x, 0, ia.z], [ib.x, 0, ib.z], [ib.x, H, ib.z], [ia.x, H, ia.z]]
    face(box, hex(INSIDE_C), GLASS, false, false)
    face([[ib.x, 0, ib.z], [ic.x, 0, ic.z], [ic.x, H, ic.z], [ib.x, H, ib.z]], hex(INSIDE_C), GLASS, false, false)
    face([[id.x, 0, id.z], [ia.x, 0, ia.z], [ia.x, H, ia.z], [id.x, H, id.z]], hex(INSIDE_C), GLASS, false, false)
    face([[ia.x, H, ia.z], [ib.x, H, ib.z], [ic.x, H, ic.z], [id.x, H, id.z]], shade(hex(INSIDE_C), 1.2), CONCRETE, false)
  }

  // ---- the three abutments: wedges where the valleys come down ----
  for (const c of C) {
    const dx = O.x - c.x, dz = O.z - c.z, l = Math.hypot(dx, dz)
    const ux = dx / l, uz = dz / l, vx = -uz, vz = ux
    const p = (f: number, s: number, y: number): V3 => [c.x + ux * f + vx * s, y, c.z + uz * f + vz * s]
    const tip = p(-2, 0, 0), l1 = p(ABUT_R * 1.6, -ABUT_R, 0), r1 = p(ABUT_R * 1.6, ABUT_R, 0)
    const top = p(ABUT_R * 1.2, 0, ABUT_H)
    face([tip, l1, top], hex(ABUT_C), CONCRETE)
    face([tip, top, r1], hex(ABUT_C), CONCRETE)
    face([l1, r1, top], hex(ABUT_C), CONCRETE)
  }
}
