/**
 * STEP WALLS (2026-11-16, the plazas and bridgeheads pass). The fine ground (the Seine band's 1–2 m blocks) steps between street levels
 * wherever the multi-level pass laid two corridors side by side: at bridgeheads, along trench roads' banks, round sunken quais. With no
 * wall there, the renderer drew the step as a lumpy slope of ground in limestone courses (render/road-material.ts CLIFF_*): wavy beige
 * bands with sawtooth edges, the commonest flaw on the bridgehead sheets (16 of 28). Paris builds these steps as dressed-stone retaining
 * walls. This finds them in the ground as shipped and returns them as quay walls, so the quay walls' own machinery draws them: a stone
 * face with its coping (render/quays.ts) and the ground read flat on each side up to it (city/wall-ground.ts).
 *
 * How: on each fine block, the posts whose ground rises SW_MIN_DROP or more within SW_WIN m and whose slope is SW_GRADE or steeper are
 * a step. The wall is the step's mid-height contour (marching squares on the ground less the local mid-level), chained, simplified
 * and cut into pieces of at most SW_PIECE m, the high side to the left as quay walls are (city/wall-ground.ts `side`).
 */
import type { QuayWall } from '../src/city/package.ts'

/** a step: rises this much (m) within this window (m, each way), on a slope this steep or steeper */
export const SW_MIN_DROP = Number(process.env.SW_MIN_DROP ?? 1.4), SW_WIN = 3, SW_GRADE = 0.9
/** only on ground shipped this fine or finer (m) */
export const SW_STEP_MAX = 2
/** pieces at most this long (m), polylines simplified to this (m), and chains shorter than this dropped (m) */
export const SW_PIECE = 3, SW_SIMPLIFY = 0.35, SW_MIN_RUN = 4
/** the top and the foot read this far out on each side (m: the most and least within 0.5..SW_READ) */
export const SW_READ = 2.5
/** a parapet (m) on a step this tall or taller (m); lower steps have none */
export const SW_PARAPET = 1.0, SW_PARAPET_MIN = 2.2
/** a side is paved if a street's or a path's corridor is this far out from the line (m); the top and foot smoothed over this many pieces each way */
export const SW_PAVED = 1.5, SW_SMOOTH = 3
/** on with SW=1 (off by default: on the Neuilly and Garigliano minis it walled lawn bumps in crenellations, and the banks the sheets
 *  showed were long embankment slopes it does not find; the ground's stone, render/road-material.ts CLIFF_*, does those) */
export const SW_ON = process.env.SW === '1'

type Block = { step: number; cols: number; dm: ArrayLike<number> }

export function stepWalls(blocks: Map<string, Block>, tile: number, G: (x: number, z: number) => number, skip: (x: number, z: number) => boolean,
  paved: (x: number, z: number) => boolean, log: (s: string) => void): QuayWall[] {
  if (!SW_ON) return []
  const segs: [number, number, number, number][] = []
  for (const [k, b] of blocks) {
    if (b.step > SW_STEP_MAX || b.cols < 3) continue
    const [tx, tz] = k.split(',').map(Number), s = b.step, c = b.cols, x0 = tx * tile, z0 = tz * tile
    const h = (i: number, j: number): number => b.dm[Math.max(0, Math.min(c - 1, j)) * c + Math.max(0, Math.min(c - 1, i))] / 10
    const w = Math.max(1, Math.round(SW_WIN / s))
    // per post: the local low and high, and whether it is on a steep face
    const lo = new Float32Array(c * c), hi = new Float32Array(c * c), steep = new Uint8Array(c * c)
    for (let j = 0; j < c; j++) for (let i = 0; i < c; i++) {
      let a = Infinity, z = -Infinity
      for (let dj = -w; dj <= w; dj++) for (let di = -w; di <= w; di++) { const v = h(i + di, j + dj); if (v < a) a = v; if (v > z) z = v }
      lo[j * c + i] = a; hi[j * c + i] = z
      const gx = (h(i + 1, j) - h(i - 1, j)) / (2 * s), gz = (h(i, j + 1) - h(i, j - 1)) / (2 * s)
      steep[j * c + i] = z - a >= SW_MIN_DROP && Math.hypot(gx, gz) >= SW_GRADE ? 1 : 0
    }
    // marching squares on f = h − mid, in cells with a steep corner and a drop at every corner
    const f = (i: number, j: number): number => h(i, j) - (lo[j * c + i] + hi[j * c + i]) / 2
    for (let j = 0; j < c - 1; j++) for (let i = 0; i < c - 1; i++) {
      const ks = [j * c + i, j * c + i + 1, (j + 1) * c + i + 1, (j + 1) * c + i]
      if (!ks.some((q) => steep[q]) || ks.some((q) => hi[q] - lo[q] < SW_MIN_DROP)) continue
      const v = [f(i, j), f(i + 1, j), f(i + 1, j + 1), f(i, j + 1)]
      const P = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]]
      const cross: [number, number][] = []
      for (let e = 0; e < 4; e++) {
        const a = v[e], bb = v[(e + 1) % 4]
        if ((a < 0) === (bb < 0)) continue
        const t = a / (a - bb), pa = P[e], pb = P[(e + 1) % 4]
        cross.push([x0 + (pa[0] + (pb[0] - pa[0]) * t) * s, z0 + (pa[1] + (pb[1] - pa[1]) * t) * s])
      }
      if (cross.length === 2) segs.push([cross[0][0], cross[0][1], cross[1][0], cross[1][1]])
      else if (cross.length === 4) { segs.push([cross[0][0], cross[0][1], cross[1][0], cross[1][1]]); segs.push([cross[2][0], cross[2][1], cross[3][0], cross[3][1]]) }
    }
  }
  // chain the segments by their shared ends (rounded to 1 cm)
  const key = (x: number, z: number): string => `${Math.round(x * 100)},${Math.round(z * 100)}`
  const ends = new Map<string, number[]>()
  segs.forEach((g, n) => { for (const kk of [key(g[0], g[1]), key(g[2], g[3])]) (ends.get(kk) ?? ends.set(kk, []).get(kk)!).push(n) })
  const used = new Uint8Array(segs.length), chains: { x: number; z: number }[][] = []
  for (let n = 0; n < segs.length; n++) {
    if (used[n]) continue
    used[n] = 1
    const line = [{ x: segs[n][0], z: segs[n][1] }, { x: segs[n][2], z: segs[n][3] }]
    for (const fwd of [true, false]) {
      for (;;) {
        const tip = fwd ? line[line.length - 1] : line[0]
        const next = (ends.get(key(tip.x, tip.z)) ?? []).find((m) => !used[m])
        if (next === undefined) break
        used[next] = 1
        const g = segs[next], far = key(g[0], g[1]) === key(tip.x, tip.z) ? { x: g[2], z: g[3] } : { x: g[0], z: g[1] }
        if (fwd) line.push(far); else line.unshift(far)
      }
    }
    chains.push(line)
  }
  const out: QuayWall[] = []
  let dropped = 0, unpaved = 0
  const r1 = (v: number): number => Math.round(v * 10) / 10
  for (const ch of chains) {
    let L = 0
    for (let i = 1; i < ch.length; i++) L += Math.hypot(ch[i].x - ch[i - 1].x, ch[i].z - ch[i - 1].z)
    if (L < SW_MIN_RUN) { dropped++; continue }
    const pl = simplify(ch, SW_SIMPLIFY)
    const run: QuayWall[] = []
    for (let i = 1; i < pl.length; i++) {
      const a = pl[i - 1], b = pl[i], l = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(l / SW_PIECE))
      for (let q = 0; q < n; q++) {
        let ax = a.x + (b.x - a.x) * q / n, az = a.z + (b.z - a.z) * q / n, bx = a.x + (b.x - a.x) * (q + 1) / n, bz = a.z + (b.z - a.z) * (q + 1) / n
        const pl2 = Math.hypot(bx - ax, bz - az)
        if (pl2 < 0.3) continue
        const mx = (ax + bx) / 2, mz = (az + bz) / 2
        if (skip(mx, mz)) continue
        let ux = (bx - ax) / pl2, uz = (bz - az) / pl2
        // the high side is +(uz, −ux) (city/wall-ground.ts `side`)
        let up = -Infinity, dn = Infinity, upB = -Infinity, dnB = Infinity
        for (let o = 0.5; o <= SW_READ; o += 0.5) {
          const p = G(mx + uz * o, mz - ux * o), m = G(mx - uz * o, mz + ux * o)
          up = Math.max(up, p); dn = Math.min(dn, p); upB = Math.max(upB, m); dnB = Math.min(dnB, m)
        }
        if (upB > up) { [ax, az, bx, bz] = [bx, bz, ax, az]; ux = -ux; uz = -uz; [up, dnB] = [upB, dn] }
        const top = up, low = dnB
        if (top - low < SW_MIN_DROP) continue
        // (a street's or a path's step, not a lawn's: one side or the other is paved within SW_PAVED m)
        if (!paved(mx + uz * SW_PAVED, mz - ux * SW_PAVED) && !paved(mx - uz * SW_PAVED, mz + ux * SW_PAVED)) { unpaved++; continue }
        run.push({ ax: r1(ax), az: r1(az), bx: r1(bx), bz: r1(bz), top, low, cap: 0.6, parapet: 0 })
      }
    }
    // along the step its top and foot are smoothed (the median of SW_SMOOTH pieces each way): read piece by piece they jogged, and the
    // wall stood in crenellations
    for (let i = 0; i < run.length; i++) {
      const win = run.slice(Math.max(0, i - SW_SMOOTH), i + SW_SMOOTH + 1), med = (v: number[]): number => v.sort((a, b) => a - b)[v.length >> 1]
      const top = med(win.map((q) => q.top)), low = med(win.map((q) => q.low))
      if (top - low < SW_MIN_DROP) continue
      out.push({ ...run[i], top: r1(top), low: r1(low), parapet: top - low >= SW_PARAPET_MIN ? SW_PARAPET : 0 })
    }
  }
  log(`  step walls: ${out.length} pieces from ${chains.length - dropped} steps (${dropped} under ${SW_MIN_RUN} m dropped, ${unpaved} pieces with no paving on either side) on blocks of ${SW_STEP_MAX} m or finer`)
  return out
}

/** Douglas–Peucker */
function simplify(p: { x: number; z: number }[], tol: number): { x: number; z: number }[] {
  if (p.length < 3) return p
  let best = 0, bi = 0
  const a = p[0], b = p[p.length - 1], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1e-9
  for (let i = 1; i < p.length - 1; i++) { const d = Math.abs((p[i].x - a.x) * dz - (p[i].z - a.z) * dx) / L; if (d > best) { best = d; bi = i } }
  if (best <= tol) return [a, b]
  return [...simplify(p.slice(0, bi + 1), tol).slice(0, -1), ...simplify(p.slice(bi), tol)]
}
