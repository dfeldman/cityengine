/**
 * Two simple geometric works the owner asked for (2026-11-03), each a bugs.json entry on OSM's node.
 *
 * HOMMAGE À CHARLIE PARKER (Alain Kirili, 2006; node 2378280508, Place Jean-Michel-Basquiat, 13e): five blocks of pink
 * Burgundy stone in a ring, each ~2.5 m high, 1.4 × 1.3 m, a rough squared lower half and an upper half cut to its own
 * geometric form (fr.wikipedia). Which form sits on which block is by eye: a step, a point, a turned cube, a drum, a notch.
 *
 * LA VASQUE PARIS 2024 (Mathieu Lehanneur; node 13056867987, the Tuileries' Grand Bassin Rond): a 7 m ring of mist-and-LED
 * flame hung under a 22 m helium balloon, ~30 m in all (fr.wikipedia). Drawn grounded, as it stands by day; it is up
 * summers only (Fête de la Musique to mid-September) until 2028. Local y = 0 is the ground.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, wedge, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { beam, shade } from '../../kit.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const PINK: Rgb = [0.78, 0.6, 0.55]
const PINK_CUT: Rgb = [0.84, 0.66, 0.6]

export function charlieParker(out: MeshBuilder, _fit: Fit): void {
  const rough = surfaceTag('rock')
  const cut = surfaceTag('granite')
  const R = 3.2
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const cx = Math.sin(a) * R
    const cz = Math.cos(a) * R
    // the rough squared lower half
    box(out, cx, 0.65, cz, 0.7, 0.65, 0.65, PINK, rough)
    // the upper half, each its own form, 1.2 m more
    const y = 1.3
    switch (i) {
      case 0: // a step: a smaller cube set back on a slab
        box(out, cx, y + 0.3, cz, 0.7, 0.3, 0.65, PINK_CUT, cut)
        box(out, cx - 0.2, y + 0.9, cz - 0.15, 0.45, 0.3, 0.45, PINK_CUT, cut)
        break
      case 1: // a point: a pyramid
        wedge(out, cx, y + 0.6, cz, 0.7, 0.6, 0.65, 0.68, PINK_CUT, cut)
        break
      case 2: // a cube turned 45° on the block
        prism(out, cx, cz, y, y + 1.0, 0.85, 4, PINK_CUT, cut)
        break
      case 3: // a drum
        prism(out, cx, cz, y, y + 1.2, 0.62, 12, PINK_CUT, cut)
        break
      default: // a notch: two half-cubes either side of a slot
        box(out, cx - 0.42, y + 0.6, cz, 0.28, 0.6, 0.65, PINK_CUT, cut)
        box(out, cx + 0.42, y + 0.45, cz, 0.28, 0.45, 0.65, PINK_CUT, cut)
    }
  }
}

export function vasque(out: MeshBuilder, _fit: Fit): void {
  // the mooring pad
  prism(out, 0, 0, 0, 0.4, 5, 24, [0.55, 0.55, 0.53], surfaceTag('metal'))
  // the rest goes up and down on its cable (render/paris/balloons.ts)
}

/** what rises: the flame ring, its frame and the balloon over it, the ground at local y = 0 */
export function vasqueFloat(out: MeshBuilder): void {
  const metal = surfaceTag('metal')
  const skin = surfaceTag('stucco')
  const flame: Rgb = [1.0, 0.62, 0.22]
  const steel: Rgb = [0.72, 0.72, 0.7]
  const white: Rgb = [0.95, 0.95, 0.93]
  // the ring: a metal band, the mist flame rising off it
  const yr = 2.2
  prism(out, 0, 0, yr - 0.5, yr, 3.5, 32, steel, metal, 3.5, false)
  prism(out, 0, 0, yr - 0.5, yr, 3.2, 32, steel, metal, 3.2, false)
  prism(out, 0, 0, yr, yr + 1.6, 3.4, 32, flame, skin, 2.6, true)
  // the frame from the ring up to the balloon's net
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    box(out, Math.sin(a) * 3.3, 0.4 + (yr - 0.4) / 2, Math.cos(a) * 3.3, 0.08, (yr - 0.4) / 2, 0.08, steel, metal)
  }
  prism(out, 0, 0, yr, 8, 0.25, 8, steel, metal)
  // the balloon, 22 m across, in latitude bands
  const r = 11
  const c = 8 + r
  const bands = 14
  for (let k = 0; k < bands; k++) {
    const t0 = -Math.PI / 2 + (k / bands) * Math.PI
    const t1 = -Math.PI / 2 + ((k + 1) / bands) * Math.PI
    prism(out, 0, 0, c + Math.sin(t0) * r, c + Math.sin(t1) * r, Math.max(0.05, Math.cos(t0) * r), 28, white, skin, Math.max(0.05, Math.cos(t1) * r), false)
  }
}

/**
 * THE MONUMENT TO THE TUNISIAN CAMPAIGN 1942–43 (OSM way 427592604, 5.3 × 3.3 m; owner's photograph, Commons, 2015-12-13):
 * a stepped granite plinth and on it three closed books in pink granite, their page edges gilt. The great book runs the
 * plinth's length, a green slab (the engraved map of Tunisia) let into its top at one end; a second book lies on its other
 * end and a third, smaller, turned a little, on that, the bronze medallion of a head on its cover. Local x is the long
 * axis, the stacked end at −x.
 */
export function tunisieBooks(out: MeshBuilder, fit: Fit): void {
  const granite = surfaceTag('granite')
  const gild = surfaceTag('metal')
  const PLINTH: Rgb = [0.62, 0.48, 0.44]
  const GILT: Rgb = [0.78, 0.64, 0.32]
  const hx = fit.hx, hz = fit.hz
  // the plinth: two shallow granite steps
  box(out, 0, 0.09, 0, hx, 0.09, hz, PLINTH, granite)
  box(out, 0, 0.24, 0, hx - 0.18, 0.06, hz - 0.18, PLINTH, granite)
  // a closed book: covers proud of the gilt page block on three sides, the spine at +z
  const book = (cx: number, cz: number, bx: number, bz: number, y: number, h: number): number => {
    const c = 0.05
    box(out, cx, y + c / 2, cz, bx, c / 2, bz, PINK, granite)
    box(out, cx - 0.02, y + h / 2, cz - 0.03, bx - 0.05, h / 2 - c, bz - 0.05, GILT, gild)
    box(out, cx, y + h / 2, cz + bz - 0.04, bx, h / 2, 0.04, PINK, granite)
    box(out, cx, y + h - c / 2, cz, bx, c / 2, bz, PINK, granite)
    return y + h
  }
  const big = book(0, 0, hx - 0.32, hz - 0.32, 0.3, 0.42)
  // the green map plaque on its top, at the open end
  box(out, (hx - 0.32) * 0.35, big + 0.01, 0, (hx - 0.32) * 0.6, 0.012, hz - 0.45, [0.4, 0.45, 0.42], surfaceTag('stucco'))
  const x2 = -(hx - 0.32) * 0.45
  const mid = book(x2, -0.05, (hx - 0.32) * 0.5, hz - 0.55, big, 0.26)
  const top = book(x2 + 0.1, -0.15, (hx - 0.32) * 0.36, hz - 0.85, mid, 0.2)
  // the bronze medallion on the top cover
  prism(out, x2 - 0.25, hz - 1.4, top, top + 0.05, 0.28, 14, [0.36, 0.32, 0.27], gild)
}

/**
 * CHRONOS 10 (Nicolas Schöffer, 1978; node 5548108421, the Jardin Tino-Rossi on the Quai Saint-Bernard; owner's
 * photograph, 2026-11-03): a white drum plinth with a band of polished steel round its head, and on it a square cage of
 * steel tube, a little wider at the top, eight rungs high; out of it steel arms at every angle, carrying round mirror
 * discs. Sizes by eye from the photograph (the drum ~2.4 m across). Local y = 0 is the ground.
 */
export function chronos10(out: MeshBuilder, _fit: Fit): void {
  const mirror = surfaceTag('mirror')
  const STEEL: Rgb = [0.78, 0.8, 0.83]
  const DARK: Rgb = [0.3, 0.32, 0.34]
  // the plinth and its steel band
  prism(out, 0, 0, 0, 2.3, 1.25, 24, [0.88, 0.88, 0.86], surfaceTag('stucco'))
  prism(out, 0, 0, 2.3, 3.2, 1.32, 24, DARK, mirror)
  // the cage: four corner posts leaning out, rungs all round
  const y0 = 3.2, y1 = 10.5
  const h0 = 0.8, h1 = 1.15
  const half = (y: number): number => h0 + ((y - y0) / (y1 - y0)) * (h1 - h0)
  const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  for (const [sx, sz] of C) {
    beam(out, [sx * h0, y0, sz * h0], [sx * h1, y1, sz * h1], 0.05, STEEL)
    beam(out, [sx * h0 * 0.35, y0, sz * h0], [sx * h1 * 0.35, y1, sz * h1], 0.035, STEEL)
    beam(out, [sx * h0, y0, sz * h0 * 0.35], [sx * h1, y1, sz * h1 * 0.35], 0.035, STEEL)
  }
  for (let k = 0; k <= 8; k++) {
    const y = y0 + 0.4 + (k / 8) * (y1 - y0 - 0.4)
    const h = half(y)
    for (let i = 0; i < 4; i++) {
      const [ax, az] = C[i], [bx, bz] = C[(i + 1) % 4]
      beam(out, [ax * h, y, az * h], [bx * h, y, bz * h], 0.03, STEEL)
    }
  }
  // the arms and their mirrors: a fixed scatter, most in the top half
  let s = 10
  const rnd = (): number => ((s = (s * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 16; i++) {
    const y = y0 + 2.5 + rnd() * (y1 - y0 - 1.5)
    const a = rnd() * Math.PI * 2
    const L = 1.6 + rnd() * 1.4
    const tilt = (rnd() - 0.4) * 0.8
    const h = half(y) * 0.6
    const A: [number, number, number] = [Math.cos(a) * h * -0.6, y, Math.sin(a) * h * -0.6]
    const B: [number, number, number] = [Math.cos(a) * L, y + tilt * L, Math.sin(a) * L]
    beam(out, A, B, 0.035, STEEL)
    if (i % 4 === 3) continue
    // a disc at the arm's end, standing across it or lying flat
    const r = 0.35 + rnd() * 0.25
    const n = 14
    const flat = i % 3 === 0
    const u: [number, number, number] = flat ? [1, 0, 0] : [-Math.sin(a), 0, Math.cos(a)]
    const v: [number, number, number] = flat ? [0, 0, 1] : [0, 1, 0]
    const nn: [number, number, number] = flat ? [0, 1, 0] : [Math.cos(a), 0, Math.sin(a)]
    const P = (t: number): [number, number, number] => [B[0] + (u[0] * Math.cos(t) + v[0] * Math.sin(t)) * r, B[1] + (u[1] * Math.cos(t) + v[1] * Math.sin(t)) * r, B[2] + (u[2] * Math.cos(t) + v[2] * Math.sin(t)) * r]
    for (let j = 0; j < n; j++) {
      const t0 = (j / n) * Math.PI * 2, t1 = ((j + 1) / n) * Math.PI * 2
      out.quad([B, P(t0), P(t1), B], nn, UV, STEEL, mirror)
      out.quad([B, P(t1), P(t0), B], [-nn[0], -nn[1], -nn[2]], UV, STEEL, mirror)
    }
  }
}

/**
 * MIND ACCUMULATION (Micha Laury, 1988; node 5548108422, the Jardin Tino-Rossi; owner's photograph, 2026-11-03): an
 * oval drum of polished steel lying on its side, open at the ends; a steel pipe that snakes across the lawn from it in
 * loops; a second pipe in two raised loops carried on wooden sawhorses, ending at a steel cone. Layout by eye from
 * the photograph. Local x along the piece, y = 0 the ground.
 */
export function mindAccumulation(out: MeshBuilder, _fit: Fit): void {
  const mirror = surfaceTag('mirror')
  const metal = surfaceTag('metal')
  const STEEL: Rgb = [0.75, 0.77, 0.79]
  const WOOD: Rgb = [0.55, 0.47, 0.36]
  // the drum: an oval tube 2.4 m long, 1.7 × 1.1 m, axis along z, outer and inner skins
  const cx = -2, cz = -0.5
  const n = 24
  const ring = (k: number, sc: number): [number, number] => [Math.cos((k / n) * Math.PI * 2) * 0.85 * sc, Math.sin((k / n) * Math.PI * 2) * 0.55 * sc]
  for (let k = 0; k < n; k++) {
    const [ax, ay] = ring(k, 1), [bx, by] = ring(k + 1, 1)
    const [ix, iy] = ring(k, 0.94), [jx, jy] = ring(k + 1, 0.94)
    const P = (x: number, y: number, z: number): [number, number, number] => [cx + x, 0.55 + y, cz + z]
    const nx = (ax + bx) / 2 / 0.85, ny = (ay + by) / 2 / 0.55, l = Math.hypot(nx, ny)
    out.quad([P(ax, ay, -1.2), P(bx, by, -1.2), P(bx, by, 1.2), P(ax, ay, 1.2)], [nx / l, ny / l, 0], UV, STEEL, mirror)
    out.quad([P(jx, jy, -1.2), P(ix, iy, -1.2), P(ix, iy, 1.2), P(jx, jy, 1.2)], [-nx / l, -ny / l, 0], UV, shade(STEEL, 0.8), metal)
    for (const z of [-1.2, 1.2]) out.quad([P(ax, ay, z), P(bx, by, z), P(jx, jy, z), P(ix, iy, z)], [0, 0, Math.sign(z)], UV, STEEL, metal)
  }
  // a pipe through points: straight runs between them, rounded by a Catmull–Rom pass
  const pipe = (pts: [number, number, number][], closed: boolean): void => {
    const m = pts.length
    const get = (i: number): [number, number, number] => pts[closed ? ((i % m) + m) % m : Math.max(0, Math.min(m - 1, i))]
    const seg = closed ? m : m - 1
    let prev: [number, number, number] | null = null
    for (let i = 0; i < seg; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2)
      for (let s = 0; s <= 6; s++) {
        const t = s / 6, t2 = t * t, t3 = t2 * t
        const q = [0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)) as [number, number, number]
        if (prev) beam(out, prev, q, 0.06, STEEL)
        prev = q
      }
    }
  }
  const g = 0.07
  // the ground pipe: out from the drum's foot, a long sweep across the lawn, two tight loops back
  pipe([[-2, g, 0.9], [-4.5, g, 1.8], [-7.5, g, 1.6], [-8.5, g, 3.2], [-6, g, 4.6], [-2, g, 4.8], [1.5, g, 4.4],
    [2.6, g, 3.4], [1.4, g, 2.4], [0.2, g, 3.2], [1.2, g, 4.4], [3.2, g, 4.9], [4.4, g, 4.2]], false)
  // the raised pipe: two loops at sawhorse height, the second ending at the cone
  const y = 0.95
  const loopA: [number, number, number][] = [[1, y, -1.2], [3, y, -2.6], [5.5, y, -2.4], [6.2, y, -1], [4.6, y, 0.2], [2, y, 0.4]]
  const loopB: [number, number, number][] = [[6.2, y, -1], [8.5, y, -2.2], [10.5, y, -1.6], [11, y, 0.2], [9, y, 0.9], [6.4, y, 0.6]]
  pipe(loopA, true)
  pipe([[1.2, y + 0.25, -0.9], [3.2, y + 0.25, -2.2], [5.4, y + 0.25, -2.0], [5.9, y + 0.25, -1], [4.5, y + 0.25, -0.1], [2.2, y + 0.25, 0]], true)
  pipe(loopB, false)
  // the cone it runs into, upturned, at the far end
  prism(out, 11.6, 0.6, 0, 1.3, 0.35, 16, STEEL, mirror, 0.75, true)
  // the sawhorses: a beam on two splayed pairs of legs
  for (const [x, z, a] of [[1.8, -1.6, 0.6], [4.6, -2.5, 0], [6, -0.2, 1.2], [3, 0.4, 0], [8.6, -2, 0.3], [10.8, -0.6, 1.4], [8.4, 0.8, 0]] as [number, number, number][]) {
    const ca = Math.cos(a), sa = Math.sin(a)
    const L = 0.55, top = y - 0.08
    const P = (u: number, v: number, h: number): [number, number, number] => [x + ca * u - sa * v, h, z + sa * u + ca * v]
    beam(out, P(-L, 0, top), P(L, 0, top), 0.05, WOOD)
    for (const u of [-L + 0.1, L - 0.1]) for (const v of [-0.3, 0.3]) beam(out, P(u, 0, top), P(u * 1.15, v, 0), 0.03, WOOD)
  }
}

/**
 * TIERRA DE MÉXICO EN TIERRA DE FRANCIA (Águeda Lozano, given by Mexico, 2006; the centre of the Place de Mexico, 16e —
 * OSM has no node for it; owner's photograph, 2026-11-03): two sheets of polished steel ~8 m high. The inner one a
 * cylinder, its top cut on a slant, an irregular gash torn down its side; the outer one a deformed half-cylinder
 * wrapped round it, taller, leaning, its free edge flaring out and curling at the foot. Sizes by eye from the buildings
 * behind. Local y = 0 the ground.
 */
export function tierraDeMexico(out: MeshBuilder, _fit: Fit): void {
  const mirror = surfaceTag('mirror')
  const STEEL: Rgb = [0.72, 0.74, 0.77]
  // a sheet over (u, v) in [0,1]²: point(u, v) gives the position; both faces drawn
  const sheet = (point: (u: number, v: number) => [number, number, number] | null, nu: number, nv: number, c: Rgb): void => {
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const a = point(i / nu, j / nv), b = point((i + 1) / nu, j / nv), d = point((i + 1) / nu, (j + 1) / nv), e = point(i / nu, (j + 1) / nv)
      if (!a || !b || !d || !e) continue
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
      const vx = e[0] - a[0], vy = e[1] - a[1], vz = e[2] - a[2]
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx
      const l = Math.hypot(nx, ny, nz) || 1
      nx /= l; ny /= l; nz /= l
      out.quad([a, b, d, e], [nx, ny, nz], UV, c, mirror)
      out.quad([e, d, b, a], [-nx, -ny, -nz], UV, shade(c, 0.85), mirror)
    }
  }
  // the inner cylinder: r 0.55, the top slanting 7.2 → 8.0, a jagged gash on the −x side from 1.4 m up
  const H0 = 7.2, H1 = 8.0
  const gash = (v: number, y: number): boolean => {
    if (y < 1.4) return false
    const w = 0.05 + 0.06 * ((y - 1.4) / 6.6) + 0.025 * Math.sin(y * 7.3) + 0.02 * Math.sin(y * 17.1)
    return Math.abs(v - 0.5 - 0.03 * Math.sin(y * 3.1)) < w
  }
  sheet((u, v) => {
    const a = u * Math.PI * 2
    const top = H0 + (H1 - H0) * (0.5 + 0.5 * Math.cos(a))
    const y = v * top
    // u = 0.5 is the −x side; leave the gash open
    if (gash(u, y)) return null
    return [Math.cos(a) * 0.55, y, Math.sin(a) * 0.55]
  }, 48, 32, STEEL)
  // the outer sheet: wrapped round the +x side over ~190°, leaning a little, taller (to 8.8), its leading edge
  // flaring out into a curl at the foot and its top edge torn back
  sheet((u, v) => {
    const a = -1.55 + u * 3.3
    const top = 8.8 - 1.4 * u
    const y = v * top
    const edge = Math.max(0, (u - 0.75) / 0.25)                 // the free edge, last quarter
    const foot = Math.max(0, 1 - y / 3)                         // the curl near the ground
    const r = 0.78 + 0.25 * edge * edge * (0.4 + foot) + 0.04 * Math.sin(y * 1.3)
    const lean = 0.03 * y
    const twist = 0.5 * edge * foot * foot
    return [Math.cos(a + twist) * r + lean, y, Math.sin(a + twist) * r]
  }, 40, 32, shade(STEEL, 1.08))
  // a low flower bed round them
  prism(out, 0, 0, 0, 0.25, 2.4, 20, [0.42, 0.36, 0.3], surfaceTag('rock'))
  prism(out, 0, 0, 0.25, 0.4, 2.3, 20, [0.4, 0.5, 0.26], surfaceTag('foliage'), 2.1)
}

/**
 * INTERPÉNÉTRATION DES DEUX ESPACES (Guy de Rougemont, 1975; node 11813823746, the Jardin Tino-Rossi; owner's
 * photograph, 2026-11-03): on a low concrete slab, four tall thin painted columns banded across in blue, red, orange,
 * green, white and black, and four short fat drums painted in sweeping patches of the same colours. Bands and patches
 * by eye. Local x along the slab, y = 0 the ground.
 */
export function rougemontEspaces(out: MeshBuilder, _fit: Fit): void {
  const paint = surfaceTag('stucco')
  const B: Rgb = [0.15, 0.42, 0.78], R: Rgb = [0.85, 0.2, 0.15], O: Rgb = [0.92, 0.48, 0.15], G: Rgb = [0.1, 0.5, 0.35]
  const W: Rgb = [0.94, 0.94, 0.92], K: Rgb = [0.1, 0.1, 0.12]
  box(out, 0, 0.12, 0, 4.6, 0.12, 0.8, [0.66, 0.65, 0.62], surfaceTag('concrete'))
  const y0 = 0.24
  // the tall columns: bands bottom to top, [colour, length]
  const poles: [number, number, [Rgb, number][]][] = [
    [-4.1, 0.1, [[K, 0.2], [W, 0.2], [R, 0.08], [B, 0.06], [W, 0.35], [G, 0.2], [W, 0.08], [B, 1.4], [R, 0.25], [O, 0.5], [G, 0.08], [W, 0.25], [B, 0.5]]],
    [-3.2, -0.1, [[B, 0.2], [W, 0.4], [K, 0.08], [W, 0.15], [O, 1.4], [G, 0.2], [W, 0.08], [B, 0.5], [W, 0.08], [K, 0.08], [R, 0.35]]],
    [-1.6, 0.0, [[W, 0.35], [B, 1.1], [K, 0.4], [O, 0.55], [W, 0.25], [R, 1.1], [W, 0.08], [K, 0.4], [O, 0.1], [G, 0.3]]],
    [-0.75, 0.15, [[W, 0.25], [B, 0.4], [G, 0.06], [K, 0.2], [W, 0.2], [R, 1.6], [B, 0.15], [W, 0.08], [B, 0.12], [W, 0.2], [O, 0.25], [K, 0.15]]],
  ]
  for (const [x, z, bands] of poles) {
    let y = y0
    for (const [c, h] of bands) { prism(out, x, z, y, y + h, 0.11, 12, c, paint, 0.11, false); y += h }
    prism(out, x, z, y - 0.01, y, 0.11, 12, bands[bands.length - 1][0], paint)
  }
  // the drums: each a ring of vertical strips whose colour shifts with height, sweeping patches
  const drums: [number, number, number, Rgb[]][] = [
    [-2.5, 0.25, 0.65, [W, O, B, B]], [0.6, 0.1, 1.15, [R, K, G, W]], [3.0, 0.15, 1.45, [O, B, W, R]], [4.0, -0.05, 2.15, [K, O, B, W]],
  ]
  const r = 0.24, n = 16, rows = 6
  for (const [x, z, h, cs] of drums) {
    for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
      const ya = y0 + (j / rows) * h, yb = y0 + ((j + 1) / rows) * h
      // a diagonal sweep: which patch this cell is in depends on angle plus height
      const k = Math.floor(((i / n) * 4 + (j / rows) * 1.6 + 4) % 4)
      const am = (a0 + a1) / 2
      out.quad([[x + Math.sin(a0) * r, ya, z + Math.cos(a0) * r], [x + Math.sin(a1) * r, ya, z + Math.cos(a1) * r],
        [x + Math.sin(a1) * r, yb, z + Math.cos(a1) * r], [x + Math.sin(a0) * r, yb, z + Math.cos(a0) * r]], [Math.sin(am), 0, Math.cos(am)], UV, cs[k], paint)
    }
    prism(out, x, z, y0 + h - 0.01, y0 + h, r, n, K, paint)
  }
}

/**
 * LE GLOBE SYMBOLIQUE (Erik Reitzel, 1995; node 4680186199, on the lawn before UNESCO, Place de Fontenoy; owner's
 * photograph, 2026-11-03): a sphere of thin galvanised tube ~10 m across, meridians and parallels on a fine grid,
 * standing on the grass on a low ring. Local y = 0 the ground.
 */
export function globeSymbolique(out: MeshBuilder, _fit: Fit): void {
  const STEEL: Rgb = [0.82, 0.84, 0.86]
  const R = 5, cy = R - 0.25
  const merid = 40, par = 20
  const P = (lat: number, lon: number): [number, number, number] => [Math.cos(lat) * Math.cos(lon) * R, cy + Math.sin(lat) * R, Math.cos(lat) * Math.sin(lon) * R]
  const sinBot = -cy / R                                        // where the sphere meets the ground
  const latMin = Math.asin(Math.max(-1, sinBot))
  for (let i = 0; i < merid; i++) {
    const lon = (i / merid) * Math.PI * 2
    for (let j = 0; j < par; j++) {
      const la0 = latMin + (j / par) * (Math.PI / 2 - latMin)
      const la1 = latMin + ((j + 1) / par) * (Math.PI / 2 - latMin)
      beam(out, P(la0, lon), P(la1, lon), 0.035, STEEL)
    }
  }
  for (let j = 0; j <= par; j++) {
    const lat = -Math.PI / 2 + ((j + 0.5) / (par + 1)) * Math.PI
    if (lat < latMin) continue
    for (let i = 0; i < merid; i++) beam(out, P(lat, (i / merid) * Math.PI * 2), P(lat, ((i + 1) / merid) * Math.PI * 2), 0.03, STEEL)
  }
  // the ring it stands in
  const rr = Math.cos(latMin) * R
  prism(out, 0, 0, 0, 0.15, rr + 0.3, 32, [0.6, 0.6, 0.6], surfaceTag('concrete'))
}

/**
 * LES SPHÉRADES, the Fontaine des Sphères (Pol Bury, 1985; OSM ways 440281436 and 440281437, the two square basins in
 * the Galerie d'Orléans' court at the Palais-Royal, ~5.5 m each; owner's photograph, 2026-11-03): in each basin a raised
 * octagonal table of dark stone with a steel edge, the water sheeting off all eight sides into the basin
 * (paris-fountains.json); on it a cluster of a dozen polished stainless-steel spheres all of one size, each two shells
 * with a seam round its middle, standing on a short stem. The spheres turn slowly in the real thing; here they stand
 * still. Local y = 0 the court's paving.
 */
export const SPHERADE_TABLE = { y: 0.62, r: 2.05 }
function spherades(out: MeshBuilder, fit: Fit, balls: [number, number][]): void {
  const mirror = surfaceTag('mirror')
  const granite = surfaceTag('granite')
  const STONE: Rgb = [0.26, 0.26, 0.28]
  const WATER: Rgb = [0.22, 0.32, 0.3]
  const STEEL: Rgb = [0.8, 0.82, 0.85]
  const hx = fit.hx || 2.9, hz = fit.hz || 2.6
  // the basin: a low pale kerb flush with the paving's edge, dark water inside
  const k = 0.3, h = 0.3
  const KERB: Rgb = [0.62, 0.6, 0.56]
  box(out, 0, h / 2, -hz + k / 2, hx, h / 2, k / 2, KERB, granite)
  box(out, 0, h / 2, hz - k / 2, hx, h / 2, k / 2, KERB, granite)
  box(out, -hx + k / 2, h / 2, 0, k / 2, h / 2, hz - k, KERB, granite)
  box(out, hx - k / 2, h / 2, 0, k / 2, h / 2, hz - k, KERB, granite)
  box(out, 0, 0.1, 0, hx - k, 0.1, hz - k, WATER, surfaceTag('glass'))
  // the octagonal table on its plinth, its steel edge (a corner at +z, as the shader's octagonal sheet has)
  const { y, r } = SPHERADE_TABLE
  prism(out, 0, 0, 0, y - 0.1, r * 0.8, 8, STONE, granite, r * 0.8, true)
  prism(out, 0, 0, y - 0.1, y, r, 8, STEEL, mirror, r, true)
  prism(out, 0, 0, y, y + 0.01, r - 0.06, 8, [0.2, 0.24, 0.24], surfaceTag('glass'), r - 0.06, true)
  // the spheres: one size, a seam round the middle, each on a short stem
  const R = 0.45
  for (const [x, z] of balls) {
    const cy = y + 0.12 + R
    prism(out, x, z, y, y + 0.14, 0.04, 6, STEEL, mirror)
    const bands = 12
    for (let j = 0; j < bands; j++) {
      const a0 = -Math.PI / 2 + (j / bands) * Math.PI, a1 = -Math.PI / 2 + ((j + 1) / bands) * Math.PI
      // the upper shell a hair wider than the lower, as the seam shows
      const g = j >= bands / 2 ? 1.02 : 1
      prism(out, x, z, cy + Math.sin(a0) * R, cy + Math.sin(a1) * R, Math.max(0.01, Math.cos(a0) * R * g), 18, STEEL, mirror, Math.max(0.01, Math.cos(a1) * R * g), false)
    }
    prism(out, x, z, cy - 0.015, cy + 0.015, R * 1.035, 18, [0.45, 0.47, 0.5], mirror)
  }
}

// a dozen, in staggered rows across the table; the two basins' clusters are set a little differently
export function spheradesWest(out: MeshBuilder, fit: Fit): void {
  spherades(out, fit, [[-1.25, -0.75], [-0.42, -0.85], [0.42, -0.8], [1.25, -0.7], [-1.45, 0.05], [-0.62, 0.0], [0.22, 0.05], [1.05, 0.08],
    [-0.95, 0.85], [-0.12, 0.88], [0.72, 0.85], [1.5, 0.75]])
}
export function spheradesEast(out: MeshBuilder, fit: Fit): void {
  spherades(out, fit, [[-1.3, -0.7], [-0.45, -0.82], [0.4, -0.85], [1.22, -0.72], [-1.05, 0.1], [-0.2, 0.02], [0.65, 0.05], [1.5, 0.1],
    [-1.4, 0.85], [-0.55, 0.9], [0.3, 0.88], [1.1, 0.82]])
}
