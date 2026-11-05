/**
 * The Garden of Peace's plan (UNESCO, Paris): its outline and its paths, shared by the builder that draws them
 * (render/landmarks/paris/batch2/unesco-jardin.ts) and the bake that rides them (unesco-trails.ts). No Babylon here.
 * Local frame x east, z north, metres about OSM's outline's centroid (48.849331, 2.306971).
 */
type P = { x: number; z: number }
export type UV2 = [number, number]
export const A = { x: -22.9, z: -6.2 }, B = { x: 2.8, z: 23.5 }, D = { x: -2.9, z: -23.5 }
export const at = ([u, v]: UV2): { x: number; z: number } => ({ x: A.x + u * (B.x - A.x) + v * (D.x - A.x), z: A.z + u * (B.z - A.z) + v * (D.z - A.z) })

export const PATH_SMOOTH = 3
/** Chaikin's corner cutting, `k` times: the paths and the stream wander instead of turning on a vertex */
export const smooth = (l: P[], k = PATH_SMOOTH): P[] => {
  let r = l
  for (let it = 0; it < k; it++) {
    const n: P[] = [r[0]]
    for (let i = 0; i + 1 < r.length; i++) {
      const a = r[i], b = r[i + 1]
      n.push({ x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 })
    }
    n.push(r[r.length - 1]); r = n
  }
  return r
}

/**
 * The paths, split at their junctions so each is one ridden way (src/city/paris/unesco-trails.ts): the terrace end W,
 * the avenue end E, and where the cross path meets the south walk (J1) and the north walk (J2). Each piece is smoothed
 * on its own, so the junctions stay put. `straight`: drawn as laid (the cross path's slab bridge).
 */
const W: UV2 = [0.02, 0.9], E: UV2 = [0.97, 0.58], J1: UV2 = [0.6, 0.72], J2: UV2 = [0.62, 0.14]
const PATHS: { name: string; uv: UV2[]; straight?: boolean }[] = [
  // the south walk, from the stone terrace up to the avenue
  { name: 'Jardin de la Paix: south walk', uv: [W, [0.2, 0.86], [0.42, 0.84], J1] },
  { name: 'Jardin de la Paix: east walk', uv: [J1, [0.8, 0.64], E] },
  // the north walk under the Y's wing, back round to the terrace
  { name: 'Jardin de la Paix: north walk', uv: [E, [0.9, 0.2], J2] },
  { name: 'Jardin de la Paix: west walk', uv: [J2, [0.34, 0.2], [0.12, 0.34], W] },
  // across the stream by the slab bridge
  { name: 'Jardin de la Paix: bridge path', uv: [J2, [0.66, 0.36], J1], straight: true },
]
/** where the paths leave for the avenue de Ségur, from E (local metres): the access way's points beyond E */
export const JARDIN_EXIT: { x: number; z: number }[] = [{ x: 20, z: 11 }, { x: 27, z: 9.5 }]
/** the paths as drawn (and ridden), local metres */
export const jardinPaths = (): { name: string; points: { x: number; z: number }[] }[] =>
  PATHS.map((p) => ({ name: p.name, points: p.straight ? p.uv.map(at) : smooth(p.uv.map(at)) }))
export const jardinEnd = (): { x: number; z: number } => at(E)
