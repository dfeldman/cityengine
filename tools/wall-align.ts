/**
 * BD TOPO'S WALL LINES, MOVED ONTO THE LIDAR'S STEP (owner, 2026-11-15, the Pont d'Iéna's right bank: the lower quai's retaining wall
 * stood as a grass ramp and a cliff of ground, the stone 2 m back on the plateau). BD TOPO's Quai / Mur de soutènement lines are a metre
 * or three off the step the lidar sees; the ground pass snapped its step to the line (tools/multilevel.ts mntG) and the walls were
 * built on it (tools/deck-zones.ts runWalls), while OSM's paths and the lidar put the face further out. Each line is resampled every
 * WA_STEP m; at each sample the offset along its normal within ±WA_REACH m where the lidar steps hardest (over WA_SPAN m) is taken when
 * that step is WA_MIN m or more and WA_BETTER times the step on the line; the offsets are smoothed by a running median of ±WA_SMOOTH
 * samples, and the line moved by them.
 */
export const WA_ON = process.env.WALL_ALIGN !== '0'
export const WA_STEP = 2, WA_REACH = 3, WA_SPAN = 1.5, WA_MIN = 1.0, WA_BETTER = 1.3, WA_SMOOTH = 3, WA_RES = 0.5

type XZ = { x: number; z: number }

export function alignWallLine(line: XZ[], mnt: (x: number, z: number) => number | null): { line: XZ[]; moved: number } {
  if (!WA_ON || line.length < 2) return { line, moved: 0 }
  // resample
  const pts: XZ[] = [], nrm: XZ[] = []
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1], b = line[i], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 1e-6) continue
    const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L, n = Math.max(1, Math.round(L / WA_STEP))
    for (let k = i === 1 ? 0 : 1; k <= n; k++) { const t = k / n; pts.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }); nrm.push({ x: -uz, z: ux }) }
  }
  const step = (p: XZ, n: XZ, o: number): number | null => {
    const h = WA_SPAN / 2
    const a = mnt(p.x + n.x * (o - h), p.z + n.z * (o - h)), b = mnt(p.x + n.x * (o + h), p.z + n.z * (o + h))
    return a === null || b === null ? null : Math.abs(b - a)
  }
  const off = pts.map((p, i) => {
    const s0 = step(p, nrm[i], 0) ?? 0
    let best = 0, bs = s0
    for (let o = -WA_REACH; o <= WA_REACH + 1e-9; o += WA_RES) { const s = step(p, nrm[i], o); if (s !== null && s > bs) { bs = s; best = o } }
    return bs >= WA_MIN && bs >= WA_BETTER * s0 ? best : 0
  })
  const sm = off.map((_, i) => { const w = off.slice(Math.max(0, i - WA_SMOOTH), i + WA_SMOOTH + 1).sort((a, b) => a - b); return w[Math.floor(w.length / 2)] })
  let moved = 0
  const out = pts.map((p, i) => { if (Math.abs(sm[i]) > 0.25) moved++; return { x: p.x + nrm[i].x * sm[i], z: p.z + nrm[i].z * sm[i] } })
  return { line: out, moved }
}
