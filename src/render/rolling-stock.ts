/**
 * What runs on a region's rails (the engine is render/life.ts): for each of its main-line railways, its
 * elevated métro and its trams, the cars a train is made of — a head car, the middle ones, a tail — how many,
 * how far apart, how fast, the livery and the shadow. Each region brings its own (render/paris/trains.ts,
 * render/sf/trains.ts); a region without one gets the plain carriages here.
 */
import { MeshBuilder } from './buildings.ts'
import { carriage, type Rgb } from './models.ts'

export interface TrainKind {
  /** a middle car, facing +z, its body tinted per copy */
  mid: (out: MeshBuilder) => void
  /** the leading car (headlights) and the last (tail lamps), if they differ from the middle ones */
  head?: (out: MeshBuilder) => void
  tail?: (out: MeshBuilder) => void
  cars: number
  /** metres between the cars' centres */
  pitch: number
  /** m/s, running */
  speed: number
  colour: Rgb
  /** the blob under each car: long, wide, height */
  shadow: [number, number, number]
  /** most cars drawn at once */
  capacity: number
  /** it stops at the region's stations on its line (the métro's viaduct stations), dwelling there */
  stops?: boolean
}

export interface RegionStock {
  rail: TrainKind
  /** the métro where it comes up on a viaduct; null where the region has none worth drawing */
  metro: TrainKind | null
  tram: TrainKind
  /** the shortest line trains are put on, metres */
  minLine: number
}

/** A builder turned round, front for back: the trailing cab of an articulated tram. */
export function turned(f: (out: MeshBuilder) => void): (out: MeshBuilder) => void {
  return (out) => {
    const m = new MeshBuilder()
    f(m)
    const base = out.positions.length / 3
    for (let i = 0; i < m.positions.length; i += 3) {
      out.positions.push(-m.positions[i], m.positions[i + 1], -m.positions[i + 2])
      out.normals.push(-m.normals[i], m.normals[i + 1], -m.normals[i + 2])
    }
    out.uvs.push(...m.uvs)
    out.colors.push(...m.colors)
    for (const idx of m.indices) out.indices.push(base + idx)
  }
}

export const DEFAULT_STOCK: RegionStock = {
  rail: { mid: carriage, cars: 3, pitch: 18.6, speed: 18, colour: [0.78, 0.79, 0.82], shadow: [18, 3.4, 3.4], capacity: 40 },
  metro: null,
  tram: { mid: carriage, cars: 1, pitch: 18.6, speed: 6, colour: [0.78, 0.79, 0.82], shadow: [18, 3.4, 3.4], capacity: 16 },
  // (Chicago's L is mapped in short pieces, and 400 m would take three trains in four off it)
  minLine: 60,
}
