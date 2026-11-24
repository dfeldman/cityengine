import { capPolygonWithHoles, type MeshBuilder } from '../../../../buildings.ts'
import { surfaceTag } from '../../../../cartoon-material.ts'
import type { Rgb } from '../../../../models.ts'
import type { Fit } from '../../../fit.ts'
import { beam, hex, prism, shade } from '../../../kit.ts'
import { crag } from '../../batch3/parks.ts'
import { ccw, FIXED, UV, type P2 } from '../../monuments/common.ts'

/*
 * THE FOUR SEASONS BASINS OF THE PARC DE VERSAILLES (Le Nôtre's crossings of the quinconces' allées; the groups are gilded
 * lead, 1670s: Flore/Printemps by Tuby, Cérès/Été by Regnaudin, Bacchus/Automne by Marsy, Saturne/Hiver by Girardon).
 * Each basin: a stone curb round OSM's water (the bake draws the water and its jets; never here), a rock island in the
 * middle, and a STAND-IN for the god's group (a lying figure and cherubs; the real groups are queued for Modly in
 * guided-queue.md, to be attached at STAND_AT). One tunable table, four builders, four manifest entries.
 *
 * `ring` is OSM's water outline about the basin's centre, measured with osmium on the Île-de-France pbf (x east, z north,
 * metres): Bacchus (way/124531625) and Cérès (way/124531626) are octagons with alternate short sides, Flore (way/124531627)
 * and Saturne (way/95475805) round. The curb's height, width and the island's size are guessed from photographs.
 */
export interface Season {
  name: string
  /** OSM water ring about the centre */
  ring: [number, number][]
  /** island: radius, height over the ground, seed of its crag shape */
  rock: { r: number; h: number; seed: number }
  /** the god: height of the figure, how many cherubs round it */
  god: { h: number; cherubs: number }
}

export const SEASONS: Record<'bacchus' | 'ceres' | 'flore' | 'saturne', Season> = {
  bacchus: { name: 'Bassin de Bacchus', rock: { r: 2.8, h: 0.55, seed: 3 }, god: { h: 1.2, cherubs: 3 },
    ring: [[-7.84, 4.64], [2.28, 8.92], [4.60, 7.98], [8.74, -2.37], [7.83, -4.68], [-2.25, -8.85], [-4.56, -7.77], [-8.78, 2.14]] },
  ceres: { name: 'Bassin de Cérès', rock: { r: 2.8, h: 0.55, seed: 5 }, god: { h: 1.2, cherubs: 3 },
    ring: [[-8.22, 4.19], [-8.90, 2.45], [-4.08, -8.10], [-2.30, -8.82], [8.21, -4.25], [8.86, -2.58], [4.05, 8.22], [2.38, 8.88]] },
  flore: { name: 'Bassin de Flore', rock: { r: 2.4, h: 0.5, seed: 8 }, god: { h: 1.1, cherubs: 3 },
    ring: [[-0.60, 7.38], [2.55, 7.00], [4.68, 5.78], [6.26, 3.91], [7.11, 1.61], [6.91, -1.68], [5.81, -3.87], [4.02, -5.55], [2.68, -6.23], [0.28, -6.69], [-2.15, -6.32], [-4.30, -5.13], [-5.42, -3.98], [-6.57, -1.82], [-6.92, 0.61], [-6.41, 3.00], [-4.95, 5.26], [-2.97, 6.70]] },
  saturne: { name: 'Bassin de Saturne', rock: { r: 2.5, h: 0.55, seed: 11 }, god: { h: 1.3, cherubs: 2 },
    ring: [[-5.11, 5.74], [-3.12, 6.99], [-0.84, 7.58], [1.52, 7.44], [3.72, 6.61], [5.56, 5.15], [6.88, 3.21], [7.55, 0.95], [7.51, -1.41], [6.74, -3.63], [5.35, -5.52], [3.35, -6.96], [0.99, -7.69], [-1.47, -7.64], [-3.79, -6.81], [-5.73, -5.30], [-7.09, -3.25], [-7.74, -0.89], [-7.60, 1.57], [-6.70, 3.86]] },
}

// tunables (metres)
const CURB_OUT = 0.55, CURB_H = 0.32, CURB_DEPTH = 0.3   // the stone kerb: width outside the water, height over the ground, how far its inner face goes down
const COPE_OVER = 0.05, COPE_H = 0.07                      // the coping's overhang and thickness
const PLINTH_R = 1.8, PLINTH_H = 0.1                     // the rock's flat top the group stands on
const CHERUB_H = 0.55, CHERUB_R = 1.0                      // a cherub's height, how far from the god's axis
const STONE: Rgb = hex('#c9c3b2'), ROCK: Rgb = hex('#8b8475'), LEAD: Rgb = hex('#7d6a36'), GOLD: Rgb = hex('#b8963a')
const rockTag = surfaceTag('rock')

const grow = (ring: [number, number][], d: number): P2[] => ring.map(([x, z]) => { const l = Math.hypot(x, z) || 1; return { x: x * (1 + d / l), z: z * (1 + d / l) } })

/** the group's centre, the same for each basin: on the island's top (the Modly group attaches here) */
export const stand_at = (s: Season): [number, number, number] => [0, s.rock.h + PLINTH_H, 0]

function wall(out: MeshBuilder, ring: P2[], y0: number, y1: number, c: Rgb, inward: boolean): void {
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n]
    const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1
    const s = inward ? -1 : 1
    const nx = (dz / l) * s, nz = (-dx / l) * s   // ccw ring: outward normal is (dz, −dx)
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [nx, 0, nz], UV, c, FIXED)
  }
}

function season(out: MeshBuilder, fit: Fit, s: Season): void {
  const y = fit.grade ?? 0
  const water = ccw(s.ring.map(([x, z]) => ({ x, z })))
  const w: [number, number][] = water.map((p) => [p.x, p.z])
  const outer = ccw(grow(w, CURB_OUT)), cope = ccw(grow(w, CURB_OUT + COPE_OVER))
  // the curb: outer face, a flat top with the water as its hole, the inner face down to the water
  wall(out, outer, y, y + CURB_H, STONE, false)
  wall(out, cope, y + CURB_H - COPE_H, y + CURB_H, shade(STONE, 1.05), false)
  capPolygonWithHoles(out, [cope, [...water].reverse()], y + CURB_H, shade(STONE, 1.08), FIXED)
  wall(out, water, y - CURB_DEPTH, y + CURB_H, shade(STONE, 0.82), true)
  // the island: a crag, its top levelled by a rock plinth the group stands on
  const R = s.rock
  crag(out, 0, y - 0.35, 0, R.r, R.h + 0.35, R.r, R.seed, ROCK)
  prism(out, 0, 0, y, y + R.h + PLINTH_H, PLINTH_R, 9, shade(ROCK, 0.95), rockTag, PLINTH_R * 0.9)
  // the stand-in group (the real ones are reclining gods on a heaped mound, ~3 m across and ~1.2 m high): a lying torso, a head,
  // a raised arm and cherubs sprawled round it on the mound
  const y0 = y + R.h + PLINTH_H, H = s.god.h
  const lie = (x0: number, z0: number, x1: number, z1: number, ry0: number, ry1: number, r: number, c: Rgb): void => beam(out, [x0, y0 + ry0, z0], [x1, y0 + ry1, z1], r, c)
  lie(-0.9, 0.1, 0.5, -0.1, 0.18, 0.3, 0.26, LEAD)           // torso and thighs
  lie(0.5, -0.1, 1.0, -0.45, 0.3, 0.1, 0.12, LEAD)           // a bent leg
  lie(-0.5, 0.0, -0.1, 0.1, 0.4, H * 0.75, 0.1, GOLD)        // the raised arm
  prism(out, -0.95, 0.15, y0 + 0.18, y0 + 0.18 + H * 0.28, 0.14, 8, GOLD, FIXED, 0.12)   // head
  for (let i = 0; i < s.god.cherubs; i++) {
    const a = (i / s.god.cherubs) * Math.PI * 2 + 0.9, cx = Math.cos(a) * CHERUB_R * 1.3, cz = Math.sin(a) * CHERUB_R * 1.3
    lie(cx - 0.2, cz, cx + 0.2, cz + 0.1, 0.12, 0.2, 0.1, LEAD)
    prism(out, cx - 0.28, cz, y0 + 0.12, y0 + 0.12 + CHERUB_H * 0.4, 0.09, 7, GOLD, FIXED, 0.07)
  }
}

export const versaillesBassinBacchus = (out: MeshBuilder, fit: Fit): void => season(out, fit, SEASONS.bacchus)
export const versaillesBassinCeres = (out: MeshBuilder, fit: Fit): void => season(out, fit, SEASONS.ceres)
export const versaillesBassinFlore = (out: MeshBuilder, fit: Fit): void => season(out, fit, SEASONS.flore)
export const versaillesBassinSaturne = (out: MeshBuilder, fit: Fit): void => season(out, fit, SEASONS.saturne)
