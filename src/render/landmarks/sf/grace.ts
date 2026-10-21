/**
 * GRACE CATHEDRAL (Lewis Hobart, 1928–64; way/32946942): French Gothic in grey reinforced concrete — a west front of
 * twin square flat-topped towers with the rose between them over three portals (the Ghiberti doors), facing EAST
 * across Taylor Street to Huntington Park (it is not oriented west like a European cathedral); the long buttressed nave behind it; a transept; a polygonal apse; a slender flèche at
 * the crossing.
 *
 * It was Notre-Dame de Paris's own model scaled down, which put the west front at the wrong end — that builder faces
 * its front to local −z, where every city builder faces +z — and read as the entrance on the side (owner,
 * 2026-10-04: "the big entrance of a cathedral is opposite the nave … we probably need a basic generic cathedral
 * model that isn't notre dame, since they generally are very similar, but notre dame is exceptional"). So: the
 * generic `cathedral()` — the church kit's twin-towered rose front, aisled nave with flying buttresses, transept and
 * apse, plus the crossing flèche the kit's single tower slot cannot add — for Grace and any cathedral after it.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { church } from '../church.ts'
import { towerRing } from '../tower.ts'
import { spireOn } from '../parts.ts'
import type { Material } from '../facade.ts'

export interface CathedralSpec {
  /** window bays along one flank */
  bays: number
  /** the stages of each west tower (string courses), and how they finish */
  towerStages: number
  towerTop: 'flat' | 'spire' | 'parapet'
  material: Material
  colour?: Rgb
  /** a flèche at the crossing: its height over the nave ridge, metres (0: none) */
  fleche: number
}

export function cathedral(out: MeshBuilder, fit: Fit, c: CathedralSpec): void {
  church(out, fit, {
    nave: { bays: c.bays, storeys: 2, roof: 'gable', pitch: 'steep' },
    aisles: { roof: 'lean-to' },
    transept: { ends: 'projecting' },
    chancel: { kind: 'apse' },
    tower: { at: 'twin', stages: c.towerStages, plan: 'square', top: c.towerTop },
    front: { kind: 'gable', portal: 'triple', window: 'rose', steps: 4 },
    walls: { material: c.material, openings: 'tracery', buttresses: 'flying', ...(c.colour ? { colour: c.colour } : {}) },
  })
  if (c.fleche <= 0) return
  // the crossing, where the kit puts it (church.ts build: zBack − 22 % of the body), in the fitted frame
  const ring = towerRing(fit)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  const alongZ = z1 - z0 >= x1 - x0
  const L = alongZ ? z1 - z0 : x1 - x0, W = alongZ ? x1 - x0 : z1 - z0
  const chancel = Math.min(L * 0.2, W * 0.9)
  const zBack = L / 2 - chancel, body = zBack + L / 2
  const along = zBack - body * 0.22
  const at = alongZ ? { x: (x0 + x1) / 2, z: (z0 + z1) / 2 + along } : { x: (x0 + x1) / 2 + along, z: (z0 + z1) / 2 }
  const H = fit.height > 4 ? fit.height : 14
  const lift = Math.max(0, (fit.grade ?? 0) - 0.5) >= 0.8 ? Math.max(0, (fit.grade ?? 0) - 0.5) : 0
  spireOn(out, at, lift + H - 1, 1.6, 4, c.fleche, { colour: c.colour ?? [0.6, 0.6, 0.58], spireColour: [0.42, 0.45, 0.46], material: 'ashlar', spireMaterial: 'copper', sides: 8 })
}

