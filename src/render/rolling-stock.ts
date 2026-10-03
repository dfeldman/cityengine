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
  /** liveries to choose from, one per train (the F-line's streetcars wear a dozen cities' colours) */
  liveries?: Rgb[]
  /** the blob under each car: long, wide, height */
  shadow: [number, number, number]
  /** most cars drawn at once */
  capacity: number
  /**
   * How high its floor is above the rail, in metres — where a rider carried on it stands (sim/transit.ts).
   * Left out, a rider rides at axle height, which is inside the saloon.
   */
  deck?: number
  /** it stops at the region's stations on its line (the métro's viaduct stations), dwelling there */
  stops?: boolean
  /**
   * Other models the same trains may be (the F-line runs PCC cars and Milan's Peter Witt trams; the California
   * line runs double-ended cable cars): each its own pools and liveries. One is chosen per line, by
   * `variantFor` where the region can tell (by the track's geometry), else round the variants in turn.
   */
  variants?: { mid: (out: MeshBuilder) => void; head?: (out: MeshBuilder) => void; tail?: (out: MeshBuilder) => void; liveries?: Rgb[]; pitch?: number; shadow?: [number, number, number] }[]
  variantFor?: (points: { x: number; z: number }[]) => number | null
}

export interface RegionStock {
  rail: TrainKind
  /** the métro where it comes up on a viaduct; null where the region has none worth drawing */
  metro: TrainKind | null
  tram: TrainKind
  /** cable-hauled tram track (PackedRail.cable: San Francisco's cable cars), where it differs from the tram */
  cable?: TrainKind
  /** light rail (PackedRail.light: Muni Metro's surface lines), where it differs from the tram */
  light?: TrainKind
  /** a gondola (PackedRail.gondola): Salesforce Park's, boarded like a cable car */
  gondola?: TrainKind
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
  rail: { mid: carriage, cars: 3, pitch: 18.6, speed: 18, colour: [0.78, 0.79, 0.82], shadow: [18, 3.4, 3.4], capacity: 150 },
  metro: null,
  tram: { mid: carriage, cars: 1, pitch: 18.6, speed: 6, colour: [0.78, 0.79, 0.82], shadow: [18, 3.4, 3.4], capacity: 16 },
  // (Chicago's L is mapped in short pieces, and 400 m would take three trains in four off it)
  minLine: 60,
}
