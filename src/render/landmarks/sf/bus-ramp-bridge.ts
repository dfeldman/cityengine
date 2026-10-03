/**
 * THE TRANSIT CENTER'S BUS RAMP BRIDGE over Howard Street: a cantilevered CABLE-STAYED bridge (2018), the last link of
 * the dedicated bus ramp from the Bay Bridge into the Transit Center's bus deck. A single tall SQUARE concrete pylon
 * rises through the middle of the deck — a ladder-beam deck, its stays anchored in the middle of the cross beams — and
 * eight pairs of thick white stay cables fan from the pylon's head down to the deck both ways in a single plane, so the
 * bridge reads from the street as a stack of TRIANGLES; the deck curves away into the Transit Center's perforated skin.
 * Built from the owner's photograph (2026-10-02: "the bus bridge into the transbay … is a triangular suspension bridge
 * — very unique … we have it as an ordinary overpass") and the Aspire article (Summer 2019).
 *
 * The deck itself stays the ramp's own (OSM's two busways, way/55081 and way/55487, drawn by render/bridges.ts); this
 * model adds what makes it this bridge: the pylon and the stays, on the centre line between the two ways. Placed at the
 * pylon with no rotation, so the model's frame is the city's, offset; the numbers below are the busways' points
 * relative to where they cross Howard (37.787352, −122.397521), measured from the package 2026-10-02.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import { beam } from './golden-gate.ts'
import type { Fit } from '../fit.ts'

const CONCRETE: Rgb = [0.80, 0.80, 0.78]
const STAY: Rgb = [0.94, 0.94, 0.93]

/** the two busways, x and z relative to the Howard crossing (way/55081, way/55487) */
const WAY_A: [number, number][] = [[-63.9, 41.5], [-53.2, 34.1], [-41.7, 27.8], [-29.1, 22.6], [-16.7, 17.7], [-4.2, 12.9], [8.8, 7.1], [22.3, 0.4], [31.4, -7.8], [40.9, -16.9], [50.8, -26.7], [60.7, -36.6], [70.1, -47.0]]
const WAY_B: [number, number][] = [[-71.4, 33.6], [-60.4, 25.2], [-49.2, 19.5], [-37.5, 14.4], [-25.8, 9.3], [-15.7, 5.7], [-3.4, 1.2], [10.6, -4.7], [23.8, -12.5], [35.3, -22.0], [45.4, -32.0], [55.5, -41.9], [66.3, -51.0]]
/** the deck's height over the ground at the pylon, and the pylon's head over the deck */
const DECK = 13.0
const HEAD = 32
/** the pylon, relative to the crossing: on the centre line, 20 m south-east of Howard */
export const PYLON_FROM_CROSSING = { x: 19.8, z: -3.8 }

/** the centre line between the two ways, relative to the pylon: each point of A paired with the nearest of B */
function centreLine(): { x: number; z: number }[] {
  return WAY_A.map(([ax, az]) => {
    let best = WAY_B[0], d = Infinity
    for (const b of WAY_B) { const e = Math.hypot(b[0] - ax, b[1] - az); if (e < d) { d = e; best = b } }
    return { x: (ax + best[0]) / 2 - PYLON_FROM_CROSSING.x, z: (az + best[1]) / 2 - PYLON_FROM_CROSSING.z }
  })
}

export function transbayBusRampBridge(out: MeshBuilder, _fit: Fit): void {
  const line = centreLine()
  // the pylon: square, from the ground through the deck to its head, a little tapered, with the cable saddles up it
  const levels = 12
  for (let k = 0; k < levels; k++) {
    const y0 = ((DECK + HEAD) * k) / levels
    const y1 = ((DECK + HEAD) * (k + 1)) / levels
    const h = 1.5 - 0.35 * (k / levels)
    box(out, 0, (y0 + y1) / 2, 0, h, (y1 - y0) / 2, h, CONCRETE, 0)
  }
  // the stays: eight each way, anchored on the centre line from 9 m out to 62 m, their tops spaced down the pylon's head
  const along = (d: number, sign: 1 | -1): { x: number; z: number } => {
    // walk the centre line from the point nearest the pylon, `d` metres in the `sign` direction
    let i0 = 0, best = Infinity
    line.forEach((p, i) => { const e = Math.hypot(p.x, p.z); if (e < best) { best = e; i0 = i } })
    let left = d
    let i = i0
    let p = { x: 0, z: 0 }
    while (true) {
      const j = i + sign
      if (j < 0 || j >= line.length) return p
      const q = line[j]
      const L = Math.hypot(q.x - p.x, q.z - p.z)
      if (L >= left) return { x: p.x + ((q.x - p.x) * left) / L, z: p.z + ((q.z - p.z) * left) / L }
      left -= L
      p = q
      i = j
    }
  }
  for (const sign of [1, -1] as const) {
    for (let k = 0; k < 8; k++) {
      const d = 9 + k * 7.5
      const a = along(d, sign)
      const top = DECK + HEAD - 1.5 - k * 2.4
      beam(out, [0, top, 0], [a.x, DECK + 0.6, a.z], 0.22, 0.22, STAY)
    }
  }
  // the deck's cross beam at the pylon, where the stays meet the ladder
  box(out, 0, DECK - 0.4, 0, 6.5, 0.5, 1.4, CONCRETE, 0)
}
