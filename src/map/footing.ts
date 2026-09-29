/**
 * Where a building's walls meet the ground: the renderer's rule (it lived inline in render/city.ts), in its own
 * file because map format v3 bakes the answer (MAP-FORMAT §5.3) and the bake and the renderer must agree
 * exactly while both still compute it.
 *
 * The 15th percentile of the ground along the OUTLINE, sampled every 4 m (at most 32 samples an edge), or the
 * ground at the centre if that is lower, less 0.3 m. Why the percentile and not the minimum, with the
 * measurements, is the comment at the call site in render/city.ts.
 *
 * Code frame: points are {x, z}, heights are metres (v2 datum frame).
 */
export function buildingFoot(ring: { x: number; z: number }[], heightAt: (x: number, z: number) => number): number {
  return buildingFooting(ring, heightAt).foot
}

/** The foot, and the pad — the ground at the centre — which the renderer's shadow also needs. */
export function buildingFooting(ring: { x: number; z: number }[], heightAt: (x: number, z: number) => number): { foot: number; pad: number } {
  let padX = 0
  let padZ = 0
  const under: number[] = []
  for (let i = 0; i < ring.length; i++) {
    const q = ring[i]
    padX += q.x
    padZ += q.z
    const n2 = ring[(i + 1) % ring.length]
    const n = Math.max(1, Math.min(32, Math.ceil(Math.hypot(n2.x - q.x, n2.z - q.z) / 4)))
    for (let k = 0; k < n; k++) {
      under.push(heightAt(q.x + ((n2.x - q.x) * k) / n, q.z + ((n2.z - q.z) * k) / n))
    }
  }
  under.sort((a, b) => a - b)
  const lowest = under.length < 8 ? under[0] : under[Math.floor(under.length * 0.15)]
  const pad = heightAt(padX / ring.length, padZ / ring.length)
  return { foot: Math.min(pad, lowest) - 0.3, pad }
}

/**
 * A footprint with its curves straightened into chords (Douglas–Peucker, 0.35 m): every sharp corner stays,
 * a gentle curve of short segments becomes a few long walls — the facade generator puts windows only on a wall
 * at least a bay wide. On a 40 m radius a chord strays under 0.3 m from the true line.
 */
export function simplifyRing(ring: { x: number; z: number }[], tol = 0.35): { x: number; z: number }[] {
  if (ring.length < 8) return ring
  const dist = (p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number => {
    const dx = b.x - a.x
    const dz = b.z - a.z
    const l2 = dx * dx + dz * dz || 1e-9
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / l2))
    return Math.hypot(a.x + dx * t - p.x, a.z + dz * t - p.z)
  }
  const keep = new Uint8Array(ring.length)
  // split the closed ring at vertex 0 and the vertex farthest from it
  let far = 0
  let fd = -1
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i].x - ring[0].x, ring[i].z - ring[0].z)
    if (d > fd) { fd = d; far = i }
  }
  keep[0] = 1
  keep[far] = 1
  const stack: [number, number][] = [[0, far], [far, ring.length]]
  while (stack.length) {
    const [i0, i1] = stack.pop()!
    const a = ring[i0]
    const b = ring[i1 % ring.length]
    let best = -1
    let bd = tol
    for (let i = i0 + 1; i < i1; i++) {
      const d = dist(ring[i], a, b)
      if (d > bd) { bd = d; best = i }
    }
    if (best >= 0) {
      keep[best] = 1
      stack.push([i0, best], [best, i1])
    }
  }
  const out = ring.filter((_, i) => keep[i])
  return out.length >= 3 ? out : ring
}
