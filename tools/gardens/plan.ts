/**
 * A garden traced from the aerial photographs (tools/ortho.ts), for what OSM does not map: the bake adds these to OSM's own hedges,
 * beds and tree rows (tools/gardens/index.ts). Coordinates are lat/lon; `frame` lets a symmetrical garden be laid out in metres along
 * its own axis, which is how it was designed.
 */
export type LL = [number, number]

export interface GardenPlan {
  name: string
  /** where nothing is scattered: inside it, the only plants are the ones somebody planned or mapped */
  ring: LL[]
  /** the mapped trees inside `ring` go too: the plan's rows ARE those trees (OSM's and the register's would stand in its gravel) */
  clearMapped?: boolean
  /** nothing to draw: the ring only keeps the scatter off what a landmark lays there */
  ringOnly?: boolean
  gravel?: LL[][]
  lawn?: LL[][]
  beds?: { ring: LL[]; rim?: boolean }[]
  /** clipped, on the ground. Height 1 m and width 0.7 m unless it says */
  hedges?: { line: LL[]; h?: number; w?: number }[]
  /** a clipped row on its trunks: limes at the Palais-Royal and the Place des Vosges. Crown from y0 (3.5 m), h (5 m) tall, w (5 m) wide */
  pleached?: { line: LL[]; y0?: number; h?: number; w?: number; spacing?: number }[]
  /** real trees, in a line: chestnuts in a quincunx, the planes of an allée */
  rows?: { line: LL[]; spacing?: number; h?: number; form?: 'plane' }[]
  topiary?: { at: LL; shape: 'cone' | 'ball' | 'box'; h: number }[]
}

const M_LAT = 111320

/** A garden's own axis: u metres along the bearing from (lat, lon), v metres to its right. */
export type Frame = (u: number, v: number) => LL
export function frame(lat: number, lon: number, bearingDeg: number): Frame {
  const b = (bearingDeg * Math.PI) / 180
  const mLon = M_LAT * Math.cos((lat * Math.PI) / 180)
  return (u, v) => [lat + (u * Math.cos(b) - v * Math.sin(b)) / M_LAT, lon + (u * Math.sin(b) + v * Math.cos(b)) / mLon]
}

/** the rectangle u0..u1 by v0..v1 of a frame */
export const rect = (f: Frame, u0: number, v0: number, u1: number, v1: number): LL[] => [f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)]
/** the circle round (u, v) of a frame, as a ring */
export const circle = (f: Frame, u: number, v: number, r: number, n = 20): LL[] =>
  Array.from({ length: n }, (_, k) => f(u + Math.cos((k / n) * Math.PI * 2) * r, v + Math.sin((k / n) * Math.PI * 2) * r))
/** a ring closed for use as a hedge's line */
export const closed = (r: LL[]): LL[] => [...r, r[0]]
/** a ring pulled in by a pair of margins, for a frame's rectangles */
export const inset = (f: Frame, u0: number, v0: number, u1: number, v1: number, d: number): LL[] => rect(f, u0 + d, v0 + d, u1 - d, v1 - d)
