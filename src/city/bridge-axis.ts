type P = { x: number; z: number }

/** The outline's long axis: the minimum-area rectangle round its convex hull. */
export function axisOf(ring: P[]): { o: P; ux: number; uz: number; L: number; half: number } | null {
  if (ring.length < 3) return null
  const pts = [...ring].sort((a, b) => a.x - b.x || a.z - b.z)
  const cross = (o: P, a: P, b: P): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
  const lo: P[] = []
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p) }
  const hi: P[] = []
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p) }
  const hull = [...lo.slice(0, -1), ...hi.slice(0, -1)]
  let best: { area: number; ux: number; uz: number; s0: number; s1: number; o0: number; o1: number } | null = null
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]
    const b = hull[(i + 1) % hull.length]
    const l = Math.hypot(b.x - a.x, b.z - a.z)
    if (l < 1e-6) continue
    const ux = (b.x - a.x) / l
    const uz = (b.z - a.z) / l
    let s0 = Infinity, s1 = -Infinity, o0 = Infinity, o1 = -Infinity
    for (const p of hull) {
      const s = p.x * ux + p.z * uz
      const o = p.x * -uz + p.z * ux
      s0 = Math.min(s0, s); s1 = Math.max(s1, s); o0 = Math.min(o0, o); o1 = Math.max(o1, o)
    }
    const area = (s1 - s0) * (o1 - o0)
    if (!best || area < best.area) best = { area, ux, uz, s0, s1, o0, o1 }
  }
  if (!best) return null
  let { ux, uz, s0, s1, o0, o1 } = best
  // the long side is the axis
  if (o1 - o0 > s1 - s0) {
    const nux = -uz
    const nuz = ux
    ;[s0, s1, o0, o1] = [o0, o1, -s1, -s0]
    ux = nux
    uz = nuz
  }
  const om = (o0 + o1) / 2
  // world point of (s0, om): s along u, o along (−uz, ux)
  const o = { x: ux * s0 + -uz * om, z: uz * s0 + ux * om }
  return { o, ux, uz, L: s1 - s0, half: (o1 - o0) / 2 }
}


/**
 * The axis turned to run the way the bridge's own ways do. `axisOf` takes the outline's LONG side, which is the bridge's
 * length for anything spanning a river — but a road bridge over a footpath is wider than it is long: Kezar Drive's over
 * the path tunnel at the east end of Golden Gate Park is 7 m along the road and 25 m across its two sidewalks, and its
 * parapets were built along the long side, two stone walls straight across the drive (owner, 2026-10-27: "walkways
 * that are in osm as elevated but completely block the surface street"). `ways`: the segments of the raised ways on it.
 */
export function axisAlong(ax: NonNullable<ReturnType<typeof axisOf>>, ways: [P, P][]): NonNullable<ReturnType<typeof axisOf>> {
  let along = 0, across = 0
  for (const [a, b] of ways) {
    const dx = b.x - a.x, dz = b.z - a.z
    along += Math.abs(dx * ax.ux + dz * ax.uz)
    across += Math.abs(dx * -ax.uz + dz * ax.ux)
  }
  if (across <= along) return ax
  // the same rectangle, a quarter turn: the new axis is the old cross direction, starting at the old mid-length
  const vx = -ax.uz, vz = ax.ux
  return {
    o: { x: ax.o.x + ax.ux * ax.L / 2 - vx * ax.half, z: ax.o.z + ax.uz * ax.L / 2 - vz * ax.half },
    ux: vx, uz: vz, L: ax.half * 2, half: ax.L / 2,
  }
}

/**
 * Is this outline ONE straight bridge, which the structure along `axisOf` describes? An outline that fills under 45 %
 * of its axis rectangle is bent — Pier 39's footbridge over the Embarcadero is an L (OSM way/555671175: east along the
 * garage, then north across the road), and its structure was laid on the L's diagonal, across the corner, while the
 * path's own deck was switched off for it: walkers floated over the road (owner, 2026-10-16, BUGS.md #296). A bent one
 * is left to its ways' own decks (render/bridges.ts `deck`), which follow them.
 */
export function straightOutline(ring: P[]): boolean {
  const ax = axisOf(ring)
  if (!ax || ax.L <= 0 || ax.half <= 0) return false
  let a = 0
  for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; a += p.x * q.z - q.x * p.z }
  return Math.abs(a / 2) / (ax.L * 2 * ax.half) >= 0.45
}
