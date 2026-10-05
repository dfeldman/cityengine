/**
 * San Francisco's figure monuments without a model of the owner's (fountains & monuments audit, 2026-10-04): a granite
 * pedestal and a bronze figure suggested by stacked tapering prisms — a plinth with a silhouette on it reads as the
 * monument from the street; the sculpture itself is the owner's GLB work (render/statues.ts) if ever wanted.
 *  - the PIONEER MONUMENT (1894, Frank Happersberger), Civic Center: a tall granite pedestal carrying "Eureka" with her
 *    bear, four bronze groups on lower plinths at its corners;
 *  - the McKINLEY MEMORIAL (1904, the Panhandle at Baker): Victory with a sword and palm on a tall granite pedestal;
 *  - GOETHE & SCHILLER (1901, Golden Gate Park): two figures side by side on a granite block.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const GRANITE: Rgb = [0.62, 0.61, 0.58]
const BRONZE: Rgb = [0.27, 0.3, 0.24]

/** a standing bronze figure of height h, its feet at y */
function figure(out: MeshBuilder, x: number, y: number, z: number, h: number): void {
  /*
   * A standing bronze man: legs under a long coat, a chest, shoulders broad enough to read, the arms down at his sides,
   * a head. It was a tapering column, and from the street every statue in the city — Lincoln, Franklin, Garfield,
   * Sun Yat-sen — read as a dark spike on its pedestal (standalone sweep, 2026-10-05). Facing local +z.
   */
  const m = surfaceTag('metal')
  const u = h / 1.8      // a man's height to the scale of the figure
  for (const s of [-1, 1]) prism(out, x + s * 0.11 * u, z, y, y + 0.5 * u, 0.085 * u, 6, BRONZE, m, 0.075 * u)      // the legs
  prism(out, x, z, y + 0.35 * u, y + 1.0 * u, 0.24 * u, 8, BRONZE, m, 0.2 * u)                                       // the coat
  box(out, x, y + 1.22 * u, z, 0.22 * u, 0.24 * u, 0.13 * u, BRONZE, m)                                              // the chest
  box(out, x, y + 1.42 * u, z, 0.26 * u, 0.05 * u, 0.12 * u, BRONZE, m)                                              // the shoulders
  for (const s of [-1, 1]) box(out, x + s * 0.3 * u, y + 1.12 * u, z, 0.05 * u, 0.3 * u, 0.06 * u, BRONZE, m)       // the arms
  prism(out, x, z, y + 1.46 * u, y + 1.52 * u, 0.05 * u, 6, BRONZE, m, 0.05 * u)                                     // the neck
  prism(out, x, z, y + 1.52 * u, y + 1.78 * u, 0.1 * u, 8, BRONZE, m, 0.085 * u)                                     // the head
}

function steps(out: MeshBuilder, w: number, d: number, n: number, rise: number): number {
  const g = surfaceTag('granite')
  for (let k = 0; k < n; k++) box(out, 0, rise * k + rise / 2, 0, w / 2 - k * 0.5, rise / 2, d / 2 - k * 0.5, GRANITE, g)
  return rise * n
}

export function pioneerMonument(out: MeshBuilder, fit: Fit): void {
  const g = surfaceTag('granite')
  const W = Math.min(14, Math.max(8, Math.min(fit.hx, fit.hz) * 2))
  const y0 = steps(out, W, W, 3, 0.45)
  // the shaft, stepping in, and its cornice
  box(out, 0, y0 + 2.5, 0, 2.6, 2.5, 2.6, GRANITE, g)
  box(out, 0, y0 + 9, 0, 1.8, 4, 1.8, GRANITE, g)
  box(out, 0, y0 + 13.3, 0, 2.1, 0.3, 2.1, GRANITE, g)
  figure(out, 0, y0 + 13.6, 0, 4.2)
  // the four groups at the corners, on their own plinths
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const x = sx * (W / 2 - 1.6), z = sz * (W / 2 - 1.6)
    box(out, x, y0 + 0.9, z, 1, 0.9, 1, GRANITE, g)
    figure(out, x, y0 + 1.8, z, 2.4)
  }
}

export function mckinleyMonument(out: MeshBuilder, fit: Fit): void {
  void fit
  const g = surfaceTag('granite')
  const y0 = steps(out, 7, 7, 3, 0.4)
  box(out, 0, y0 + 3, 0, 1.5, 3, 1.5, GRANITE, g)
  box(out, 0, y0 + 6.2, 0, 1.75, 0.2, 1.75, GRANITE, g)
  figure(out, 0, y0 + 6.4, 0, 3.4)
}

export function goetheSchiller(out: MeshBuilder, fit: Fit): void {
  void fit
  const g = surfaceTag('granite')
  const y0 = steps(out, 6, 4.5, 2, 0.35)
  box(out, 0, y0 + 1.3, 0, 1.8, 1.3, 1.1, GRANITE, g)
  figure(out, -0.6, y0 + 2.6, 0, 3.2)
  figure(out, 0.6, y0 + 2.6, 0, 3.3)
}

/**
 * Any figure on a granite pedestal, scaled to the entry's `height` (the top of the figure): a stepped base, a shaft of
 * about two-thirds the height, a cornice, the bronze figure on top. For the many statues whose particular shape no one
 * would miss at riding speed but whose presence on the square they would.
 */
export function figureOnPedestal(out: MeshBuilder, fit: Fit): void {
  const g = surfaceTag('granite')
  const H = Math.max(3, fit.height ?? 6)
  const w = Math.max(1, Math.min(fit.hx, fit.hz) * 2)
  const y0 = steps(out, w, w, 2, Math.min(0.4, H * 0.04))
  // (the pedestal a little over half, the figure the rest and never under 2.6 m: a monumental bronze is larger than
  //  life, and at 0.62 of the height the figure came out a doll on a plinth)
  const fig = Math.max(2.6, H * 0.45)
  const shaft = Math.max(0.8, H - fig - y0 - 0.24)
  box(out, 0, y0 + shaft / 2, 0, w * 0.24, shaft / 2, w * 0.24, GRANITE, g)
  box(out, 0, y0 + shaft + 0.12, 0, w * 0.28, 0.12, w * 0.28, GRANITE, g)
  figure(out, 0, y0 + shaft + 0.24, 0, fig)
}

/** a monument whose statue is gone: base, shaft and an empty cornice (Mount Olympus's "Triumph of Light", lost 1950s) */
export function emptyPedestal(out: MeshBuilder, fit: Fit): void {
  const g = surfaceTag('granite')
  const H = Math.max(3, fit.height ?? 8)
  const w = Math.max(2, Math.min(fit.hx, fit.hz) * 2)
  const y0 = steps(out, w, w, 3, 0.4)
  box(out, 0, y0 + (H - y0) / 2, 0, w * 0.22, (H - y0) / 2, w * 0.22, GRANITE, g)
  box(out, 0, H + 0.2, 0, w * 0.28, 0.2, w * 0.28, GRANITE, g)
}

export const MONUMENTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { pioneerMonument, mckinleyMonument, goetheSchiller, figureOnPedestal, emptyPedestal }
