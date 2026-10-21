/**
 * CIVIC CENTER, building by building (the owner's queue: "a close, methodical look at every unique building round City
 * Hall"), 2026-10-04.
 *
 * The Earl Warren Building that began this file is now in civic/state.ts with the rest of the Civic Center (2026-10-21).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { boxAlong, edgeAt, edgeFacing, cupola } from '../parts.ts'
import { box, prism } from '../../models.ts'

/**
 * MISSION DOLORES BASILICA (1918, Churrigueresque), way/256442760 beside the old Mission — "left untouched" by the 2026-09-24
 * pass that modelled the adobe, so a generic block stood next to San Francisco's oldest building. From Commons ("Mission
 * San Francisco de Asis (1776) and Mission Dolores Basilica (1918)"): white stucco walls under red tile, a red-tiled dome on
 * an octagonal windowed drum at the crossing, and on the Dolores Street front (east) two white bell towers — a plain shaft,
 * an ornate open belfry stage with its corner finials, a little green-tiled dome and cross. Front 180: the model is in the
 * world's axes, the towers at its east end.
 */
export function missionDoloresBasilica(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.93, 0.91, 0.86], TILE: Rgb = [0.44, 0.21, 0.15], GREEN: Rgb = [0.45, 0.66, 0.6]
  const H = 14
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'punched', wall: WHITE, glass: [0.2, 0.2, 0.22], pitch: 6, floor: H, solid: 0.8, arched: true, material: 'stucco' } }],
    roof: TILE,
    crown: { kind: 'hip', height: 5, inset: 0.2, colour: TILE, material: 'tile' },
  })
  const ring = towerRing(fit)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
  const st = surfaceTag('stucco')
  // the crossing dome, a third of the way back from the front
  const cx = x1 - (x1 - x0) * 0.62, cz = (z0 + z1) / 2
  cupola(out, { x: cx, z: cz }, H + 3, 5.5, { drum: 4, dome: 4.5, colour: WHITE, domeColour: TILE, material: 'stucco', domeMaterial: 'tile', lantern: true })
  // the two bell towers at the Dolores Street corners
  for (const tz of [z0 + 3.2, z1 - 3.2]) {
    const tx = x1 - 3.2
    box(out, tx, 12, tz, 3, 12, 3, WHITE, st)
    box(out, tx, 24.4, tz, 3.3, 0.4, 3.3, [0.88, 0.85, 0.78], st)
    // the belfry: four piers round an open arch on each face, corner finials
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(out, tx + sx * 2.3, 28, tz + sz * 2.3, 0.7, 3.6, 0.7, WHITE, st)
    box(out, tx, 26.4, tz, 1.6, 2, 1.6, [0.25, 0.22, 0.2], 0)
    box(out, tx, 31.9, tz, 3.1, 0.35, 3.1, [0.88, 0.85, 0.78], st)
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) prism(out, tx + sx * 2.6, tz + sz * 2.6, 32.2, 34, 0.35, 8, WHITE, st, 0.05)
    prism(out, tx, tz, 32.2, 33.8, 2.2, 12, WHITE, st, 2)
    prism(out, tx, tz, 33.8, 36.2, 2.0, 12, GREEN, surfaceTag('tile'), 0.3)
    box(out, tx, 37, tz, 0.08, 0.8, 0.08, [0.75, 0.62, 0.3], 0)
    box(out, tx, 37.2, tz, 0.35, 0.07, 0.08, [0.75, 0.62, 0.3], 0)
  }
}

/**
 * SAINT NICHOLAS RUSSIAN ORTHODOX CATHEDRAL, way/260494870 on 15th Street — a generic block (historic census, 2026-10-04).
 * From a Mapillary frame on 15th: a small YELLOW clapboard Gothic church with white trim, a big pointed window over the
 * red doors, a central front tower rising through the gable — a louvred belfry stage, a dark steep spire with little
 * dormers, and on top a teal onion bulb and the Orthodox cross. The kit has no yellow clapboard; built directly.
 */
export function saintNicholasCathedral(out: MeshBuilder, fit: Fit): void {
  const YELLOW: Rgb = [0.9, 0.82, 0.48], WHITE: Rgb = [0.93, 0.92, 0.88], SLATE: Rgb = [0.2, 0.22, 0.26], TEAL: Rgb = [0.25, 0.55, 0.55]
  const H = 9
  tower(out, fit, {
    height: H,
    tiers: [{ to: H, face: { kind: 'punched', wall: YELLOW, glass: [0.3, 0.26, 0.3], pitch: 3.6, floor: H, solid: 0.65, arched: true, material: 'clapboard' }, cornice: { depth: 0.2, height: 0.25, colour: WHITE } }],
    roof: SLATE,
    crown: { kind: 'hip', height: 4, inset: 0.2, colour: SLATE, material: 'tile' },
  })
  const ring = towerRing(fit)
  // (the entry's numeric front, 356, is the bearing to 15th Street: edgeFacing(ring) then finds that edge)
  const e = edgeAt(ring, edgeFacing(ring))
  const cb = surfaceTag('clapboard')
  const at = (o: number): [number, number] => [e.mid.x + e.nx * o, e.mid.z + e.nz * o]
  // the tower, standing half out of the front
  let [x, z] = at(-0.5)
  boxAlong(out, x, 8, z, 1.9, 8, 1.9, e.heading, YELLOW, cb)
  boxAlong(out, x, 14.5, z, 2.0, 0.15, 2.0, e.heading, WHITE, cb)
  ;[x, z] = at(1.42)
  boxAlong(out, x, 12.5, z, 0.45, 1.1, 0.04, e.heading, [0.22, 0.22, 0.24], 0)
  // the big pointed window and the doors below it, on the tower's face
  boxAlong(out, x, 7, z, 1.0, 2.2, 0.04, e.heading, [0.3, 0.26, 0.3], 0)
  boxAlong(out, x, 1.4, z, 0.8, 1.4, 0.04, e.heading, [0.45, 0.16, 0.12], 0)
  // the spire, the bulb, the cross
  ;[x, z] = at(-0.5)
  prism(out, x, z, 14.6, 21, 2.2, 4, SLATE, surfaceTag('tile'), 0.25)
  prism(out, x, z, 21, 21.6, 0.3, 12, TEAL, surfaceTag('copper'), 0.75)
  prism(out, x, z, 21.6, 22.4, 0.75, 12, TEAL, surfaceTag('copper'), 0.12)
  box(out, x, 23.2, z, 0.05, 0.8, 0.05, [0.78, 0.65, 0.3], 0)
  box(out, x, 23.5, z, 0.32, 0.05, 0.05, [0.78, 0.65, 0.3], 0)
}

export const CIVIC_CENTER: Record<string, (out: MeshBuilder, fit: Fit) => void> = { missionDoloresBasilica, saintNicholasCathedral }
