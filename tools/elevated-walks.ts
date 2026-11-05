/**
 * A walk on a viaduct's roof that the bike RIDES (regions.json `elevatedWalks[].ride`: the Coulée Verte on the Viaduc
 * des Arts, owner 2026-11-05: "beautiful and rideable"). The bake lifts the walk (tools/bake.ts, BUGS.md #32), but it
 * stays a footway, so not in the bike graph, and every way that meets it keeps its street-level heights: the flights
 * up to it end 8 m under the deck, and where the walk leaves the viaduct at its east end its last footbridge dips to
 * the street between two lengths at deck height. Here, on the package edges as baked (so `--rides` reruns it):
 *  - the lifted ways become trails (city/ridegraph.ts rides a trail);
 *  - a flight of steps meeting a lifted node is re-sloped to it, keeping its foot where it was, and ridden too;
 *  - the walk's own unlifted ways beyond the viaduct are held up to an envelope that falls from the deck at RAMP_FALL
 *    per metre along the walk, so it comes down as a ramp, not a cliff.
 */
import { unpackPoints } from '../src/city/package.ts'

/** how fast the walk may come down off its viaduct, metres per metre (a gentle ramp a bike rolls down) */
export const RAMP_FALL = 0.06
/** a junction this far off the deck is mended; under it the heights already agree */
const MEND = 0.6
/** the longest flight of steps taken as a way up (a longer one goes somewhere else) */
const FLIGHT = 60

interface WalkEdge { id: number; a: number; b: number; points: string | number[] | unknown; kind?: string; name?: string; heights?: number[]; trail?: boolean }
interface Walk { name: string; height: number; eastTo?: number; ride?: boolean }

export function openElevatedWalks(edges: WalkEdge[], walks: Walk[], eastX: (lon: number) => number): { opened: number; flights: number; ramped: number } {
  const out = { opened: 0, flights: 0, ramped: 0 }
  const ridden = walks.filter((w) => w.ride)
  if (!ridden.length) return out
  const pts = (e: WalkEdge): { x: number; z: number }[] => unpackPoints(e.points as never)
  const at = new Map<number, WalkEdge[]>()
  for (const e of edges) for (const n of [e.a, e.b]) (at.get(n) ?? at.set(n, []).get(n)!).push(e)
  const lengths = (p: { x: number; z: number }[]): number[] => {
    const d = [0]
    for (let i = 1; i < p.length; i++) d.push(d[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z))
    return d
  }
  for (const w of ridden) {
    const named = edges.filter((e) => e.name === w.name && e.heights)
    const east = w.eastTo !== undefined ? eastX(w.eastTo) : Infinity
    const lifted = new Set(named.filter((e) => { const p = pts(e); return p[Math.floor(p.length / 2)].x <= east }))
    // the deck's height at each node it reaches
    const deck = new Map<number, number>()
    for (const e of lifted) {
      e.trail = true; out.opened++
      deck.set(e.a, Math.max(deck.get(e.a) ?? -Infinity, e.heights![0]))
      deck.set(e.b, Math.max(deck.get(e.b) ?? -Infinity, e.heights![e.heights!.length - 1]))
    }
    // the flights up: re-sloped from their foot to the deck, by distance along them
    for (const [n, h] of deck) for (const e of at.get(n) ?? []) {
      if (lifted.has(e) || e.kind !== 'steps' || !e.heights) continue
      const p = pts(e), d = lengths(p), L = d[d.length - 1]
      if (L > FLIGHT || L < 0.5) continue
      const atA = e.a === n, hs = e.heights, end = atA ? hs[0] : hs[hs.length - 1]
      if (Math.abs(end - h) < MEND) continue
      // (both ends on the deck: a flight along it, lifted whole)
      const other = deck.get(atA ? e.b : e.a)
      e.heights = hs.map((y, i) => {
        const t = atA ? 1 - d[i] / L : d[i] / L
        return Math.round((other !== undefined ? y + (h - end) * (1 - t) + (other - (atA ? hs[hs.length - 1] : hs[0])) * t : y + (h - end) * t) * 100) / 100
      })
      e.trail = true; out.flights++
    }
    // the walk on past the viaduct: held up to the envelope falling from the deck, way by way along it
    const best = new Map<number, number>(deck)
    const queue = [...deck.keys()]
    while (queue.length) {
      const n = queue.shift()!, top = best.get(n)!
      for (const e of at.get(n) ?? []) {
        if (lifted.has(e) || e.name !== w.name || !e.heights) continue
        const p = pts(e), d = lengths(p), L = d[d.length - 1], fromA = e.a === n
        let raised = false
        e.heights = e.heights.map((y, i) => {
          const env = top - RAMP_FALL * (fromA ? d[i] : L - d[i])
          if (env > y + 0.05) { raised = true; return Math.round(env * 100) / 100 }
          return y
        })
        if (!raised) continue
        out.ramped++
        e.trail = true
        const far = fromA ? e.b : e.a, fh = fromA ? e.heights[e.heights.length - 1] : e.heights[0]
        if (fh > (best.get(far) ?? -Infinity) + 0.05) { best.set(far, fh); queue.push(far) }
      }
    }
  }
  return out
}
