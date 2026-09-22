/**
 * Paris's rolling stock (render/rolling-stock.ts for the shared engine): the RER's double-deck Z 2N cars on
 * the main lines, the métro's MP 73 on the Line 2 and 6 viaducts, and the RATP's Citadis trams. Each train has
 * a head car with its headlights lit and a tail with its red lamps; the bodies are tinted per copy.
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, EMIT, FIXED, type Rgb } from '../models.ts'
import { turned, type RegionStock } from '../rolling-stock.ts'

const LAMP: Rgb = [1.0, 0.95, 0.8]
const RED: Rgb = [0.9, 0.08, 0.06]

/**
 * A Paris tram (BUGS.md #34): an Alstom Citadis, as the RATP's T-lines run them — low floor, a long window
 * band, a raked cab. Articulated: `citadisCab` at each end (nose toward +z) and `citadisMid` between, each
 * module 8.2 m, the body tinted per instance (white, the RATP's pale grey).
 */
function citadisBody(out: MeshBuilder, doors: number[]): void {
  const glass: Rgb = [0.16, 0.2, 0.23]
  const dark: Rgb = [0.13, 0.13, 0.14]
  const roof: Rgb = [0.62, 0.64, 0.66]
  const accent: Rgb = [0.35, 0.6, 0.45]
  box(out, 0, 0.95, 0, 1.32, 0.6, 4.08, [1, 1, 1])
  box(out, 0, 2.02, 0, 1.325, 0.52, 3.96, glass, FIXED)
  for (const k of [-1.33, 1.33]) box(out, k, 1.52, 0, 0.012, 0.03, 3.96, [0.85, 0.86, 0.87], FIXED)
  box(out, 0, 2.78, 0, 1.32, 0.24, 4.08, [1, 1, 1])
  box(out, 0, 3.07, 0, 1.18, 0.07, 4.0, roof, FIXED)
  box(out, 0, 0.3, 0, 1.24, 0.14, 3.95, dark, FIXED)
  // the livery's stripe low down, and the doors: dark glazed leaves in both sides
  for (const k of [-1.33, 1.33]) box(out, k, 0.62, 0, 0.012, 0.06, 4.0, accent, FIXED)
  for (const z of doors) for (const k of [-1.335, 1.335]) box(out, k, 1.45, z, 0.012, 1.0, 0.62, glass, FIXED)
  // the gangway bellows at each end
  for (const e of [-1, 1]) box(out, 0, 1.6, e * 4.14, 1.18, 1.25, 0.08, dark, FIXED)
}

function citadisMid(out: MeshBuilder): void {
  citadisBody(out, [-1.9, 1.9])
  // the pantograph on its roof: a folded arm and the collector bar
  const dark: Rgb = [0.13, 0.13, 0.14]
  box(out, 0, 3.22, 0, 0.6, 0.08, 1.2, [0.5, 0.52, 0.54], FIXED)
  box(out, 0, 3.55, -0.3, 0.04, 0.3, 0.04, dark, FIXED)
  box(out, 0, 3.55, 0.3, 0.04, 0.3, 0.04, dark, FIXED)
  box(out, 0, 3.87, 0, 0.8, 0.03, 0.08, dark, FIXED)
}

function citadisCab(out: MeshBuilder, lamp: Rgb = [1.0, 0.95, 0.8]): void {
  citadisBody(out, [-1.2])
  const glass: Rgb = [0.16, 0.2, 0.23]
  // the raked nose: a lower face, the big windscreen leaning back, the roof carried over it
  box(out, 0, 0.95, 4.45, 1.28, 0.6, 0.4, [1, 1, 1])
  box(out, 0, 2.0, 4.35, 1.22, 0.5, 0.28, glass, FIXED)
  box(out, 0, 2.72, 4.2, 1.26, 0.2, 0.2, [1, 1, 1])
  box(out, 0, 0.5, 4.82, 1.1, 0.12, 0.05, [0.13, 0.13, 0.14], FIXED)
  for (const x of [-0.85, 0.85]) box(out, x, 0.95, 4.86, 0.18, 0.07, 0.02, lamp, EMIT)
  // the destination board over the windscreen
  box(out, 0, 2.62, 4.42, 0.7, 0.09, 0.02, [1.0, 0.72, 0.2], EMIT)
}

/**
 * A Paris métro car on a viaduct (Line 6, MP 73, rubber-tyred): 15 m, boxy with a gently rounded roof, five
 * doors a side, the body tinted per instance (RATP white) over a blue-green skirt. Faces +z.
 */
function metroCar(out: MeshBuilder): void {
  const glass: Rgb = [0.15, 0.19, 0.22]
  const dark: Rgb = [0.12, 0.12, 0.13]
  const band: Rgb = [0.12, 0.42, 0.5]
  box(out, 0, 1.25, 0, 1.2, 0.95, 7.4, [1, 1, 1])
  box(out, 0, 1.75, 0, 1.205, 0.38, 7.1, glass, FIXED)
  box(out, 0, 2.28, 0, 1.12, 0.1, 7.35, [0.8, 0.81, 0.83], FIXED)
  box(out, 0, 2.42, 0, 0.9, 0.06, 7.2, [0.72, 0.73, 0.75], FIXED)
  for (const k of [-1.205, 1.205]) {
    box(out, k, 0.62, 0, 0.012, 0.16, 7.4, band, FIXED)
    for (const z of [-5.6, -2.8, 0, 2.8, 5.6]) box(out, k, 1.25, z, 0.013, 0.85, 0.55, glass, FIXED)
  }
  // the bogies' rubber tyres and guide wheels, dark under the floor
  box(out, 0, 0.22, 0, 1.0, 0.2, 7.0, dark, FIXED)
  for (const e of [-1, 1]) box(out, 0, 1.3, e * 7.45, 1.0, 0.9, 0.06, dark, FIXED)
}

/**
 * A double-deck RER / Transilien car (Z 2N family): 24 m, two rows of windows, white with the blue and red
 * band, the body tinted per instance. Faces +z.
 */
function rerCar(out: MeshBuilder): void {
  const glass: Rgb = [0.15, 0.19, 0.22]
  const dark: Rgb = [0.12, 0.12, 0.13]
  box(out, 0, 2.05, 0, 1.45, 1.6, 11.9, [1, 1, 1])
  box(out, 0, 3.72, 0, 1.3, 0.12, 11.8, [0.7, 0.71, 0.73], FIXED)
  for (const k of [-1.455, 1.455]) {
    box(out, k, 1.45, 0, 0.012, 0.35, 9.4, glass, FIXED)
    box(out, k, 2.85, 0, 0.012, 0.38, 9.4, glass, FIXED)
    box(out, k, 0.85, 0, 0.012, 0.09, 11.9, [0.13, 0.25, 0.55], FIXED)
    box(out, k, 0.7, 0, 0.012, 0.05, 11.9, [0.75, 0.12, 0.15], FIXED)
    for (const z of [-10.2, 10.2]) box(out, k, 1.65, z, 0.013, 1.05, 0.7, glass, FIXED)
  }
  box(out, 0, 0.35, 0, 1.1, 0.3, 11.2, dark, FIXED)
  for (const e of [-1, 1]) box(out, 0, 2.0, e * 11.95, 1.2, 1.4, 0.06, dark, FIXED)
}

/** a lit front or back on a car of `half` length: two lamps low on the end face */
function lamps(out: MeshBuilder, half: number, y: number, x: number, colour: Rgb): void {
  const z = Math.sign(half) * (Math.abs(half) + 0.09)
  for (const s of [-1, 1]) box(out, s * x, y, z, 0.14, 0.07, 0.02, colour, EMIT)
}

export const PARIS_STOCK: RegionStock = {
  rail: {
    mid: rerCar, head: (o) => { rerCar(o); lamps(o, 11.95, 0.95, 0.9, LAMP) }, tail: (o) => { rerCar(o); lamps(o, -11.95, 0.95, 0.9, RED) },
    cars: 3, pitch: 24.3, speed: 16, colour: [0.93, 0.93, 0.94], shadow: [24, 3.4, 3.4], capacity: 40,
  },
  metro: {
    mid: metroCar, head: (o) => { metroCar(o); lamps(o, 7.45, 0.75, 0.8, LAMP) }, tail: (o) => { metroCar(o); lamps(o, -7.45, 0.75, 0.8, RED) },
    cars: 5, pitch: 15.2, speed: 11, colour: [0.94, 0.94, 0.95], shadow: [15, 2.6, 2.6], capacity: 40,
    // the viaducts' stations (regions.json `viaductStations`): trains stop at them
    stops: true,
  },
  tram: {
    // the cab leads and trails (the last one turned round), the middle modules between; RATP white
    mid: citadisMid, head: (o) => citadisCab(o), tail: turned((o) => citadisCab(o, RED)),
    cars: 4, pitch: 8.3, speed: 7, colour: [0.93, 0.94, 0.95], shadow: [8.3, 2.8, 2.8], capacity: 48,
  },
  // a line, not a scrap: trains shuttling up and down 45 m of track at a tunnel mouth or a station throat
  // (the RER C by the Quai Saint-Bernard) looked like toys (BUGS.md #34)
  minLine: 400,
}
