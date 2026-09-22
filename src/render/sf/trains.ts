/**
 * San Francisco's rolling stock (render/rolling-stock.ts for the shared engine): its "trams" are the cable
 * cars, one car at about 15 km/h in the Powell Street maroon (BUGS.md #34).
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, FIXED, type Rgb } from '../models.ts'
import { DEFAULT_STOCK, type RegionStock } from '../rolling-stock.ts'

/**
 * A tram, drawn as a San Francisco cable car because that is the tram this game has: short, high, with
 * open platforms at both ends and a clerestory roof. The body takes its colour per copy (the livery);
 * the cream window band, the roof and the running gear keep theirs. Half the length of a train carriage —
 * which is what every tram line was drawn with before, a seventeen-metre white box grinding up Powell
 * Street at train speed.
 */
function cableCar(out: MeshBuilder): void {
  const cream: Rgb = [0.90, 0.84, 0.68]
  const roof: Rgb = [0.72, 0.70, 0.66]
  const dark: Rgb = [0.12, 0.12, 0.13]
  const glass: Rgb = [0.30, 0.36, 0.40]
  // the enclosed saloon in the middle, the livery below the windows
  box(out, 0, 0.95, 0, 1.18, 0.45, 2.6, [1, 1, 1])
  box(out, 0, 1.75, 0, 1.19, 0.35, 2.61, cream, FIXED)
  box(out, 0, 1.78, 0, 1.2, 0.22, 2.2, glass, FIXED)
  box(out, 0, 2.2, 0, 1.18, 0.1, 2.6, [1, 1, 1])
  // open platforms at each end: a floor, corner posts and the roof carried over them
  for (const e of [-1, 1]) {
    box(out, 0, 0.62, e * 3.45, 1.2, 0.12, 0.85, [1, 1, 1])
    for (const x of [-1.1, 1.1]) box(out, x, 1.45, e * 4.2, 0.05, 0.8, 0.05, dark, FIXED)
  }
  box(out, 0, 2.45, 0, 1.25, 0.12, 4.3, roof, FIXED)
  box(out, 0, 2.66, 0, 0.7, 0.1, 3.4, roof, FIXED)
  // the running gear, dark under the floor
  box(out, 0, 0.32, 0, 0.9, 0.2, 3.6, dark, FIXED)
}

export const SF_STOCK: RegionStock = {
  ...DEFAULT_STOCK,
  tram: { mid: cableCar, cars: 1, pitch: 9.5, speed: 4.2, colour: [0.52, 0.10, 0.12], shadow: [9, 2.6, 2.6], capacity: 24 },
}
