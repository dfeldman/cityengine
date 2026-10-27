/**
 * Geometry shared by the Japanese Tea Garden's hand-built structures (tea-garden-pagoda.ts, tea-garden-temple-gate.ts,
 * tea-garden-main-gate.ts): boxes placed by their foot, quads that face outward, rings round a rectangle whose corners
 * curl up (the eaves of every Japanese roof here) and lofts between them.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'

export type P3 = [number, number, number]

/** a box from its FOOT: centre (cx, cz), bottom y0, full sizes sx × sz, height h */
export function B(out: MeshBuilder, cx: number, y0: number, cz: number, sx: number, sz: number, h: number, c: Rgb, tag = 0): void {
  box(out, cx, y0 + h / 2, cz, sx / 2, h / 2, sz / 2, c, tag)
}

/**
 * a quad whose normal is taken from its own diagonals and turned to face AWAY from the model's vertical axis (every
 * face here looks outward from it; a face centred on the axis — a cap, an underside — gives its normal as `n`)
 */
export function Q(out: MeshBuilder, p: P3[], c: Rgb, tag = 0, n?: P3): void {
  if (!n) {
    const d1 = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]]
    const d2 = [p[3][0] - p[1][0], p[3][1] - p[1][1], p[3][2] - p[1][2]]
    n = [d1[1] * d2[2] - d1[2] * d2[1], d1[2] * d2[0] - d1[0] * d2[2], d1[0] * d2[1] - d1[1] * d2[0]]
    const cx = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, cz = (p[0][2] + p[1][2] + p[2][2] + p[3][2]) / 4
    if (n[0] * cx + n[2] * cz < 0) n = [-n[0], -n[1], -n[2]]
  }
  const l = Math.hypot(...n) || 1
  out.quad(p, [n[0] / l, n[1] / l, n[2] / l], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
}

const same = (a: P3, b: P3): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2]

/** quads between two rings of the same length (a collapsed edge gives a triangle; both collapsed, nothing) */
export function loft(out: MeshBuilder, r0: P3[], r1: P3[], c: Rgb, tag = 0): void {
  const n = r0.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    if (same(r0[i], r0[j]) && same(r1[i], r1[j])) continue
    Q(out, [r0[i], r0[j], r1[j], r1[i]], c, tag)
  }
}

/** a polygon as a fan of quads from its first point; `n` when it is centred on the axis */
export function fan(out: MeshBuilder, pts: P3[], c: Rgb, tag = 0, n?: P3): void {
  for (let i = 1; i + 1 < pts.length; i += 2) Q(out, [pts[0], pts[i], pts[i + 1], pts[i + 2] ?? pts[0]], c, tag, n)
}

/** a square frustum with axis-aligned faces: half-width r0 at y0, r1 at y1, capped */
export function squareFrustum(out: MeshBuilder, y0: number, y1: number, r0: number, r1: number, c: Rgb, tag = 0): void {
  const lo = (sx: number, sz: number): P3 => [sx * r0, y0, sz * r0]
  const hi = (sx: number, sz: number): P3 => [sx * r1, y1, sz * r1]
  const cs: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
  for (let i = 0; i < 4; i++) {
    const [ax, az] = cs[i], [bx, bz] = cs[(i + 1) % 4]
    Q(out, [lo(ax, az), lo(bx, bz), hi(bx, bz), hi(ax, az)], c, tag)
  }
  Q(out, [hi(1, 1), hi(-1, 1), hi(-1, -1), hi(1, -1)], c, tag, [0, 1, 0])
  Q(out, [lo(1, -1), lo(-1, -1), lo(-1, 1), lo(1, 1)], c, tag, [0, -1, 0])
}

/** the eave's corner curl: 0 along the middle of a side, rising to 1 at its corners (u = |t|, 0..1 along the side) */
export const curl = (u: number): number => Math.max(0, (u - 0.55) / 0.45) ** 2
/** the karahafu: a cusped wave over the middle of a side, 0 outside |u| < w, 1 at the crest */
export const wave = (u: number, w: number): number => (Math.abs(u) >= w ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u / w)) ** 1.6

/**
 * a ring round hx × hz at y: nx points along each long (x) side, nz along each short side, clockwise from (+hx, +hz);
 * the corners lifted by `lift`, and the x sides' middles by `bump` (the karahafu) over a fraction `bw` of the side
 */
export function ring(hx: number, hz: number, y: number, lift: number, nx: number, nz: number, bump = 0, bw = 0.4): P3[] {
  const pts: P3[] = []
  const cs: [number, number][] = [[hx, hz], [-hx, hz], [-hx, -hz], [hx, -hz]]
  for (let i = 0; i < 4; i++) {
    const a = cs[i], b = cs[(i + 1) % 4]
    const n = i % 2 === 0 ? nx : nz      // sides 0 and 2 run along x
    for (let j = 0; j < n; j++) {
      const t = j / n, u = 2 * t - 1
      const dy = lift * curl(Math.abs(u)) + (i % 2 === 0 ? bump * wave(u, bw) : 0)
      pts.push([a[0] + (b[0] - a[0]) * t, y + dy, a[1] + (b[1] - a[1]) * t])
    }
  }
  return pts
}
