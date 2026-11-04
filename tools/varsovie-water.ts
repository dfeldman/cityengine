/**
 * The Fontaine de Varsovie's water for the fountain shader (render/fountains.ts), written into
 * public/landmarks/paris-fountains.json as the "Fontaine de Varsovie" entry (replacing any earlier one).
 * In the landmark's own frame (render/landmarks/paris/monuments/fontaine-varsovie.ts): −z down the pool toward the
 * river, y over the ground under each piece (`drape`). From the owner's aerial (2026-11-03) and the fountain's
 * well-known layout: the twelve cannons firing up the axis from the river end, pairs of arcs crossing in from the
 * side walls, plumes up the middle, the water stair, and the two rows of tall jets in each upper pool.
 *   node --experimental-strip-types tools/varsovie-water.ts
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

type V3 = [number, number, number]
type Piece =
  | { kind: 'jet'; at: V3; height: number; r: number }
  | { kind: 'arc'; from: V3; to: V3; rise: number; r: number }
  | { kind: 'lip'; a: V3; b: V3; drop: number; out: number }
  | { kind: 'foam'; at: V3; r: number }
const W = 0.14
const r1 = (v: number): number => Math.round(v * 100) / 100
const v = (x: number, y: number, z: number): V3 => [r1(x), r1(y), r1(z)]
const pieces: Piece[] = []

// the cannons: twelve, from the round end, firing up the pool toward Chaillot
for (let i = 0; i < 12; i++) {
  const u = (i - 5.5) / 5.5
  const from = v(u * 5, 0.4, -54 + Math.abs(u) * 2)
  const to = v(u * 7, W, -8 - 10 * (1 - Math.abs(u)))
  pieces.push({ kind: 'arc', from, to, rise: 7 + 3 * (1 - Math.abs(u)), r: 0.16 })
  pieces.push({ kind: 'foam', at: to, r: 1.1 })
}
// the arcs crossing in from both side walls, angled up the pool, in pairs
for (let z = -38; z <= 22; z += 10) {
  for (const s of [-1, 1]) {
    const to = v(s * 2.5, W, z + 6)
    pieces.push({ kind: 'arc', from: v(s * 11.6, 0.42, z), to, rise: 3.2, r: 0.1 })
    pieces.push({ kind: 'foam', at: to, r: 0.7 })
  }
}
// the plumes up the middle
for (const z of [-44, -28, -12, 4, 20]) {
  pieces.push({ kind: 'jet', at: v(0, W, z), height: 9, r: 0.22 })
  pieces.push({ kind: 'foam', at: v(0, W, z), r: 1.4 })
}
// the half-round basin's tiers spilling over, and the jets along the cross-basin either side of it
for (const [r, y] of [[6.2, 0.35], [4.6, 0.7], [3.0, 1.05]]) {
  for (let i = 0; i < 6; i++) {
    const a0 = Math.PI + (i / 6) * Math.PI, a1 = Math.PI + ((i + 1) / 6) * Math.PI
    pieces.push({ kind: 'lip', a: v(Math.cos(a0) * r, y, 42.5 + Math.sin(a0) * r), b: v(Math.cos(a1) * r, y, 42.5 + Math.sin(a1) * r), drop: 0.33, out: 0.15 })
  }
}
for (let x = 9; x <= 27; x += 3) for (const s of [-1, 1]) pieces.push({ kind: 'jet', at: v(s * x, W, 45.5), height: 4.5, r: 0.12 })
// the water stair: a sheet down every step
for (let i = 7; i >= 0; i--) pieces.push({ kind: 'lip', a: v(-2.9, 0.2 * (i + 1), 49.8 + i), b: v(2.9, 0.2 * (i + 1), 49.8 + i), drop: 0.2, out: 0.12 })
// the upper pools: two rows of tall jets each, four round each raised basin
for (const s of [-1, 1]) {
  for (let x = 7; x <= 27; x += 2.5) {
    if (Math.abs(x - 17) < 4.5) continue
    for (const z of [53.2, 60.4]) pieces.push({ kind: 'jet', at: v(s * x, 1.35, z), height: 6.5, r: 0.11 })
  }
  for (const [dx, dz] of [[-2.2, 55.2], [2.2, 55.2], [-2.2, 58.3], [2.2, 58.3]]) pieces.push({ kind: 'jet', at: v(s * 17 + dx, 1.65, dz), height: 3.6, r: 0.09 })
  for (const z of [55, 58.5]) pieces.push({ kind: 'lip', a: v(s * 17 - 3.5, 1.9, z), b: v(s * 17 - 3.5, 1.9, z + 1), drop: 0.4, out: 0.1 })
}

const file = resolve(import.meta.dirname, '..', 'public', 'landmarks', 'paris-fountains.json')
const all = (JSON.parse(readFileSync(file, 'utf8')) as { landmark?: string }[]).filter((f) => f.landmark !== 'Fontaine de Varsovie')
all.push({ landmark: 'Fontaine de Varsovie', drape: true, pieces } as { landmark: string })
writeFileSync(file, JSON.stringify(all, null, 1) + '\n')
console.log(`Fontaine de Varsovie: ${pieces.length} pieces`)
