import type { MeshBuilder } from './buildings.ts'

/**
 * A TILE'S OVERLAYS STOP AT ITS EDGE (owner, 2026-11-16, the Place de Varsovie: "random patches of different pavements", "holes in the
 * surface" that "appear and disappear"). Every tile draws the whole pavement strip and carriageway of each way it holds, so within a few
 * metres of a tile's edge two tiles drew the same surface, each subdivided and draped its own way, and they fought through each other in
 * patches — on a plaza a tile seam runs through, a patchwork. Each triangle is clipped to the tile's square in plan (Sutherland–Hodgman,
 * every attribute interpolated), so neighbouring tiles meet along the shared line.
 */
/*
 * `from`: only the triangles appended from that index on are clipped (one way's strip). A bound of ±Infinity is an open side: no cut
 * there (render/city.ts clips a way's strip only along the seams whose neighbour tile also holds that way).
 */
export function clipMeshToRect(out: MeshBuilder, x0: number, z0: number, x1: number, z1: number, from = 0): number {
  const P = out.positions, N = out.normals, U = out.uvs, C = out.colors
  const hasN = N.length === P.length, hasU = U.length * 3 === P.length * 2, hasC = C.length * 3 === P.length * 4
  const tris = out.indices.splice(from)
  let cut = 0
  const lerpVert = (a: number, b: number, t: number): number => {
    const v = P.length / 3
    for (let k = 0; k < 3; k++) P.push(P[3 * a + k] + (P[3 * b + k] - P[3 * a + k]) * t)
    if (hasN) for (let k = 0; k < 3; k++) N.push(N[3 * a + k] + (N[3 * b + k] - N[3 * a + k]) * t)
    if (hasU) for (let k = 0; k < 2; k++) U.push(U[2 * a + k] + (U[2 * b + k] - U[2 * a + k]) * t)
    if (hasC) for (let k = 0; k < 4; k++) C.push(C[4 * a + k] + (C[4 * b + k] - C[4 * a + k]) * t)
    return v
  }
  // one plane: keep where sign * (coord - at) <= 0
  const clipPoly = (poly: number[], axis: 0 | 2, at: number, sign: 1 | -1): number[] => {
    const res: number[] = []
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length]
      const da = sign * (P[3 * a + axis] - at), db = sign * (P[3 * b + axis] - at)
      if (da <= 0) res.push(a)
      if ((da <= 0) !== (db <= 0)) res.push(lerpVert(a, b, da / (da - db)))
    }
    return res
  }
  for (let t = 0; t < tris.length; t += 3) {
    const a = tris[t], b = tris[t + 1], c = tris[t + 2]
    const xs = [P[3 * a], P[3 * b], P[3 * c]], zs = [P[3 * a + 2], P[3 * b + 2], P[3 * c + 2]]
    if (Math.min(...xs) >= x0 && Math.max(...xs) <= x1 && Math.min(...zs) >= z0 && Math.max(...zs) <= z1) { out.indices.push(a, b, c); continue }
    cut++
    let poly = [a, b, c]
    if (isFinite(x0)) { poly = clipPoly(poly, 0, x0, -1); if (poly.length < 3) continue }
    if (isFinite(x1)) { poly = clipPoly(poly, 0, x1, 1); if (poly.length < 3) continue }
    if (isFinite(z0)) { poly = clipPoly(poly, 2, z0, -1); if (poly.length < 3) continue }
    if (isFinite(z1)) { poly = clipPoly(poly, 2, z1, 1); if (poly.length < 3) continue }
    for (let i = 1; i + 1 < poly.length; i++) out.indices.push(poly[0], poly[i], poly[i + 1])
  }
  return cut
}
