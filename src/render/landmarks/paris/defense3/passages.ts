import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'

/**
 * RAISED WAYS THROUGH THE DEFENSE3 BLOCKS. The ride graph's raised decks (the dalle's streets and the Cours du Triangle)
 * cross buildings the cadastre draws solid from the ground to the roof. Each way below is cut through every defense3
 * model it enters: the walls opened with the deck's own slope, dark linings and a soffit drawn along the stretch inside.
 * Positions are paris-centre local x, z, and city y (the ride edge's heights, shipped ride-bike.json), so the cut is
 * fixed in the world and the same whichever model it lands in. (Precedent: defense-famous/cbx.ts, Passerelle des Reflets.)
 */
export interface DeckWay { name: string; width: number; pts: [number, number, number][] }

const PASS_EXTRA_W = 1.5      // clear width = the edge's width + this, metres
const PASS_H = 4.6            // clear height above the ride height
const PASS_BELOW = 0.35       // the cut starts this far under the ride height (the deck's own slab stands there)
const PASS_EXT = 4            // the way is carried this far past its two ends so it always crosses the walls
const PASS_JOIN = 1.2         // and this far past each interior vertex, so a bend leaves no web
const PASS_LINING = '#262c30'
const PASS_SOFFIT = '#3c4448'

export const DECK_WAYS: DeckWay[] = [
  { name: 'Rue Hoche (edge 1021680)', width: 6, pts: [[-7213.1, 3343.8, 36.9], [-7206.9, 3344.5, 37.6], [-7200.3, 3344.2, 38.6], [-7193.7, 3344.0, 39.4], [-7187.6, 3343.6, 40.1], [-7181.6, 3343.3, 40.7], [-7178.4, 3344.0, 40.6], [-7175.9, 3345.2, 40.2], [-7171.6, 3348.3, 40.2], [-7170.1, 3349.4, 40.3], [-7169.0, 3349.6, 40.4], [-7163.7, 3350.1, 40.2], [-7158.3, 3350.6, 40.5], [-7152.9, 3351.0, 40.7], [-7145.1, 3351.6, 41.1], [-7137.4, 3352.1, 41.4], [-7129.6, 3352.7, 41.8], [-7121.8, 3353.2, 42.1], [-7114.1, 3353.8, 41.9], [-7106.3, 3354.3, 41.6], [-7098.5, 3354.9, 41.4], [-7091.9, 3355.3, 41.2], [-7085.4, 3355.8, 41.0], [-7078.8, 3356.2, 40.8], [-7072.2, 3356.7, 40.5], [-7068.0, 3357.2, 40.4]] },
  { name: 'Cours du Triangle a (edge 318071)', width: 6, pts: [[-6992.4, 3749.1, 32.5], [-6988.0, 3753.1, 32.0], [-6983.6, 3757.2, 31.6], [-6980.6, 3763.4, 31.0], [-6977.7, 3769.6, 30.2], [-6974.7, 3775.8, 30.3], [-6971.7, 3781.9, 33.5], [-6968.8, 3788.1, 33.9]] },
  { name: 'Cours du Triangle b (edge 318093)', width: 6, pts: [[-6895.0, 3776.1, 33.2], [-6902.4, 3777.3, 32.4], [-6909.8, 3778.5, 30.1], [-6917.1, 3779.7, 27.1], [-6924.5, 3780.9, 26.0], [-6931.9, 3782.1, 25.4], [-6939.3, 3783.3, 24.9], [-6946.6, 3784.5, 24.9], [-6954.0, 3785.7, 27.1], [-6961.4, 3786.9, 32.9], [-6968.8, 3788.1, 33.9]] },
  { name: 'Cours du Triangle c (edge 318094)', width: 6, pts: [[-6968.8, 3788.1, 33.9], [-6975.6, 3791.2, 32.2], [-6982.5, 3794.3, 27.8], [-6989.4, 3797.4, 27.4], [-6996.3, 3800.5, 28.0], [-7003.1, 3803.6, 28.3], [-7010.0, 3806.7, 28.5], [-7016.9, 3809.8, 28.9], [-7023.8, 3812.9, 29.4], [-7030.7, 3816.0, 29.7], [-7035.9, 3812.1, 29.5], [-7041.2, 3808.3, 29.3], [-7046.5, 3804.4, 29.3], [-7051.8, 3800.5, 29.6], [-7057.1, 3796.7, 29.6]] },
  { name: 'Bd Devedjian (edge 1021116)', width: 7, pts: [[-6696.8, 3805.7, 30.1], [-6692.2, 3808.2, 30.1], [-6685.9, 3811.5, 30.0], [-6679.7, 3814.8, 29.9], [-6673.4, 3818.1, 29.8], [-6667.2, 3821.5, 29.7], [-6660.9, 3824.8, 29.6], [-6654.7, 3828.1, 29.5], [-6648.4, 3831.4, 29.4], [-6642.2, 3834.8, 29.4], [-6636.1, 3837.6, 29.3], [-6630.0, 3840.5, 29.2], [-6623.9, 3843.3, 29.1], [-6617.8, 3846.2, 29.0], [-6612.9, 3848.2, 28.9], [-6607.9, 3850.2, 28.9], [-6602.9, 3852.1, 28.8], [-6597.2, 3853.5, 28.7], [-6591.5, 3854.8, 28.7], [-6585.8, 3856.2, 28.6], [-6578.6, 3856.7, 28.5], [-6571.3, 3857.3, 28.4], [-6564.4, 3857.3, 28.3], [-6557.6, 3857.4, 28.2], [-6550.5, 3856.9, 28.1], [-6543.4, 3856.3, 28.0], [-6536.5, 3854.9, 27.9], [-6529.6, 3853.4, 27.9], [-6522.0, 3851.2, 27.8]] },
  { name: 'Passerelle des Bouvets (edge 1021538)', width: 3, pts: [[-7411.9, 3563.1, 30.0], [-7408.3, 3559.0, 30.7], [-7404.6, 3554.9, 31.3], [-7400.7, 3554.0, 32.3], [-7400.7, 3554.0, 32.3], [-7398.7, 3553.5, 32.3], [-7396.7, 3553.1, 32.3], [-7391.4, 3550.2, 32.1], [-7386.1, 3547.3, 32.1], [-7379.9, 3542.9, 32.1], [-7373.6, 3538.4, 32.0], [-7368.8, 3535.0, 31.9], [-7363.9, 3531.6, 31.9], [-7358.2, 3530.0, 31.8], [-7352.4, 3528.3, 31.8], [-7344.6, 3527.2, 31.7], [-7336.7, 3525.9, 31.6], [-7328.9, 3524.8, 31.5], [-7321.1, 3523.6, 31.5], [-7312.9, 3522.3, 31.6], [-7322.7, 3518.9, 31.4], [-7329.3, 3516.6, 31.3], [-7335.8, 3514.3, 31.3], [-7340.0, 3512.8, 31.3], [-7346.3, 3510.8, 31.2], [-7352.5, 3508.7, 31.2], [-7358.8, 3506.6, 31.2], [-7365.1, 3504.5, 31.2], [-7367.3, 3498.1, 31.1], [-7369.6, 3491.8, 31.6], [-7370.5, 3487.8, 34.3], [-7371.5, 3483.8, 34.1], [-7373.0, 3479.7, 33.8], [-7374.5, 3475.6, 33.5], [-7378.1, 3469.6, 33.0], [-7381.8, 3463.7, 32.7], [-7383.9, 3459.8, 32.5], [-7386.0, 3456.0, 32.3], [-7387.1, 3450.7, 31.9], [-7387.4, 3448.8, 31.8], [-7387.1, 3446.9, 31.6], [-7386.6, 3443.4, 31.6], [-7386.3, 3441.7, 31.4], [-7389.0, 3441.3, 31.1], [-7396.9, 3440.2, 30.1], [-7404.8, 3439.0, 29.2], [-7412.7, 3437.9, 28.1], [-7420.6, 3436.8, 27.1], [-7428.3, 3435.5, 26.1], [-7435.9, 3434.3, 25.8], [-7443.5, 3433.1, 25.7], [-7447.4, 3431.8, 25.9], [-7449.3, 3431.2, 25.9], [-7449.2, 3427.7, 26.0], [-7449.1, 3425.7, 26.0], [-7449.1, 3424.1, 26.0], [-7448.9, 3420.1, 26.0], [-7448.8, 3418.8, 26.0], [-7448.6, 3414.8, 26.1], [-7448.5, 3411.5, 26.1], [-7448.4, 3409.5, 26.2], [-7448.2, 3406.8, 26.2], [-7448.1, 3404.8, 26.3], [-7448.1, 3404.1, 26.3], [-7447.9, 3400.1, 26.0], [-7447.5, 3393.8, 26.1], [-7450.3, 3393.3, 26.6], [-7450.2, 3391.8, 26.7], [-7450.0, 3389.1, 26.9]] },
  { name: 'Jardins Boieldieu (edge 1067054)', width: 4, pts: [[-6855.5, 3043.9, 29.1], [-6857.7, 3039.7, 29.0], [-6859.9, 3035.4, 29.0], [-6862.0, 3031.2, 28.9], [-6864.2, 3027.0, 28.8], [-6866.3, 3022.8, 28.7], [-6868.5, 3018.5, 28.6]] },
]

type Plane = [number, number, number, number]   // dist = a x + b y + c z + d; inside the slot where dist < 0
const FIXED = 0
const UV4: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

function inRing(r: { x: number; z: number }[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  }
  return o
}

/** every triangle of the builder cut by the slot (the convex region where all planes are < 0): the part inside is dropped */
export function carve(out: MeshBuilder, planes: Plane[], box: { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }): void {
  type V = number[]   // p(3) n(3) uv(2) colour(4)
  const P = out.positions, N = out.normals, U = out.uvs, C = out.colors, I = out.indices
  const vert = (i: number): V => [P[i * 3], P[i * 3 + 1], P[i * 3 + 2], N[i * 3], N[i * 3 + 1], N[i * 3 + 2], U[i * 2], U[i * 2 + 1], C[i * 4], C[i * 4 + 1], C[i * 4 + 2], C[i * 4 + 3]]
  const dist = (pl: Plane, v: V): number => pl[0] * v[0] + pl[1] * v[1] + pl[2] * v[2] + pl[3]
  const clip = (poly: V[], pl: Plane, keepOut: boolean): V[] => {
    const res: V[] = []
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length]
      const da = dist(pl, a) * (keepOut ? -1 : 1), db = dist(pl, b) * (keepOut ? -1 : 1)   // keep da < 0
      if (da < 0) res.push(a)
      if ((da < 0) !== (db < 0)) { const t = da / (da - db); res.push(a.map((x, k) => x + (b[k] - x) * t)) }
    }
    return res
  }
  const keep: number[] = []
  const added: V[][] = []
  for (let t = 0; t < I.length; t += 3) {
    const vs = [vert(I[t]), vert(I[t + 1]), vert(I[t + 2])]
    const lo = (k: number): number => Math.min(vs[0][k], vs[1][k], vs[2][k]), hi = (k: number): number => Math.max(vs[0][k], vs[1][k], vs[2][k])
    if (hi(0) < box.x0 || lo(0) > box.x1 || hi(1) < box.y0 || lo(1) > box.y1 || hi(2) < box.z0 || lo(2) > box.z1) { keep.push(I[t], I[t + 1], I[t + 2]); continue }
    let rest: V[] = vs, any = false
    const pieces: V[][] = []
    for (const pl of planes) {
      const o = clip(rest, pl, true)       // outside this plane (dist >= 0): survives
      if (o.length >= 3) pieces.push(o)
      rest = clip(rest, pl, false)
      if (rest.length < 3) { rest = []; break }
    }
    any = rest.length >= 3
    if (!any) { keep.push(I[t], I[t + 1], I[t + 2]); continue }
    added.push(...pieces)
  }
  out.indices.length = 0
  out.indices.push(...keep)
  for (const poly of added) {
    const b = out.positions.length / 3
    for (const v of poly) { out.positions.push(v[0], v[1], v[2]); out.normals.push(v[3], v[4], v[5]); out.uvs.push(v[6], v[7]); out.colors.push(v[8], v[9], v[10], v[11]) }
    for (let k = 1; k < poly.length - 1; k++) out.indices.push(b, b + k, b + k + 1)
  }
}

/**
 * Cuts every `DECK_WAYS` stretch that enters this model's footprint through it. Call after the model is drawn. Nothing
 * happens without a placed model (`fit.toLocal`: tests, a bare ?model=) or when no way touches the footprint.
 */
export function cutDeckWays(out: MeshBuilder, fit: Fit): void {
  if (!fit.toLocal || fit.baseY === undefined || !fit.ring || fit.ring.length < 3) return
  const ring = fit.ring
  const side = hex(PASS_LINING), roof = hex(PASS_SOFFIT)
  const linings: (() => void)[] = []   // drawn after every cut, or a later segment's slot would eat an earlier one's lining
  for (const way of DECK_WAYS) {
    const pts = way.pts.map(([x, z, y]) => ({ ...fit.toLocal!(x, z), y: y - fit.baseY! }))
    const half = way.width / 2 + PASS_EXTRA_W / 2
    for (let i = 1; i < pts.length; i++) {
      const A = pts[i - 1], B = pts[i], L = Math.hypot(B.x - A.x, B.z - A.z)
      if (L < 0.05) continue
      // a way that passes over the roof (the Devedjian viaduct over w82486000, capped at 10 m) has nothing to cut
      if (Math.min(A.y, B.y) - PASS_BELOW >= fit.height) continue
      const ux = (B.x - A.x) / L, uz = (B.z - A.z) / L, nx = -uz, nz = ux, k = (B.y - A.y) / L
      const e0 = i === 1 ? PASS_EXT : PASS_JOIN, e1 = i === pts.length - 1 ? PASS_EXT : PASS_JOIN
      const yAt = (s: number): number => A.y + k * s
      const planes: Plane[] = [
        [nx, 0, nz, -(nx * A.x + nz * A.z) - half],
        [-nx, 0, -nz, nx * A.x + nz * A.z - half],
        [-ux, 0, -uz, ux * A.x + uz * A.z - e0],
        [ux, 0, uz, -(ux * A.x + uz * A.z) - L - e1],
        [k * ux, -1, k * uz, A.y - k * (ux * A.x + uz * A.z) - PASS_BELOW],
        [-k * ux, 1, -k * uz, -A.y + k * (ux * A.x + uz * A.z) - PASS_H],
      ]
      // stretches of this segment inside the footprint, 0.25 m steps
      const inside: boolean[] = []
      const n = Math.ceil(L / 0.25)
      for (let j = 0; j <= n; j++) { const s = (j / n) * L; inside.push(inRing(ring, A.x + ux * s, A.z + uz * s)) }
      if (!inside.some(Boolean)) continue
      const xs = [A.x - e0 * ux, B.x + e1 * ux], zs = [A.z - e0 * uz, B.z + e1 * uz]
      const rad = half + 0.5
      carve(out, planes, {
        x0: Math.min(...xs) - rad, x1: Math.max(...xs) + rad, z0: Math.min(...zs) - rad, z1: Math.max(...zs) + rad,
        y0: Math.min(A.y, B.y) - PASS_BELOW - 0.01, y1: Math.max(A.y, B.y) + PASS_H + 0.01,
      })
      linings.push(() => { for (let j = 0; j < n; j++) {
        if (!(inside[j] && inside[j + 1])) continue
        const s0 = (j / n) * L, s1 = ((j + 1) / n) * L
        const P = (s: number, o: number): [number, number] => [A.x + ux * s + nx * o, A.z + uz * s + nz * o]
        for (const sg of [1, -1]) {
          const a = P(s0, sg * half), b = P(s1, sg * half)
          const nn: [number, number, number] = [-nx * sg, 0, -nz * sg]
          const qd: [number, number, number][] = [[a[0], yAt(s0) - PASS_BELOW, a[1]], [b[0], yAt(s1) - PASS_BELOW, b[1]], [b[0], yAt(s1) + PASS_H, b[1]], [a[0], yAt(s0) + PASS_H, a[1]]]
          // one quad each: the landmark material is double-sided, so a reversed twin at the same place z-fought it (the stripes on the soffit)
          out.quad(qd, nn, UV4, side, FIXED)
        }
        const a = P(s0, half), b = P(s1, half), c = P(s1, -half), d = P(s0, -half)
        const q: [number, number, number][] = [[a[0], yAt(s0) + PASS_H, a[1]], [b[0], yAt(s1) + PASS_H, b[1]], [c[0], yAt(s1) + PASS_H, c[1]], [d[0], yAt(s0) + PASS_H, d[1]]]
        out.quad(q, [0, -1, 0], UV4, roof, FIXED)
      } })
    }
  }
  for (const l of linings) l()
}

/** The Dôme IMAX's circle (OSM way/186981683, paris-centre local x, z): the mall's blocks are cut away round it so the sphere stands clear */
export const DOME_X = -7050.5
export const DOME_Z = 3429
export const DOME_R = 19
const DOME_CLEAR = 1        // metres of gap between the sphere's grid and the cut
const DOME_SIDES = 28

/** Cuts the dome's circle (+ DOME_CLEAR) out of this model, walls and roof alike, if it overlaps. Call after the model is drawn. */
export function cutDomeImax(out: MeshBuilder, fit: Fit): void {
  if (!fit.toLocal) return
  const c = fit.toLocal(DOME_X, DOME_Z)
  const r = DOME_R + DOME_CLEAR
  const planes: Plane[] = []
  // a polygon circumscribing the circle, so the cut is never narrower than r
  const rr = r / Math.cos(Math.PI / DOME_SIDES)
  for (let i = 0; i < DOME_SIDES; i++) {
    const a = ((i + 0.5) / DOME_SIDES) * Math.PI * 2, nx = Math.cos(a), nz = Math.sin(a)
    planes.push([nx, 0, nz, -(nx * c.x + nz * c.z) - rr * Math.cos(Math.PI / DOME_SIDES)])
  }
  carve(out, planes, { x0: c.x - rr, x1: c.x + rr, z0: c.z - rr, z1: c.z + rr, y0: -1e4, y1: 1e4 })
}
