/**
 * parisRecipe: a plain Paris tower from a closed menu, so a building costs one line of JSON (2026-10-31, claude-sonnet-5-5).
 * The footprint is OSM's (thinned to 12 corners), so the plan is never an argument. An entry names it with `kit`:
 *   {"procedural":"parisRecipe","kit":{"wall":"#e8e4da","glass":"#4a5660","windows":"grid","crown":"plant"}}
 * Menus: windows grid|ribbon|fins|curtain|balconies; crown none|stepped|plant; taper none|slight; setback {at: 0..1, by: m}.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { simplifyRing, tower, type Face, type TowerSpec } from '../../tower.ts'

export interface RecipeArgs {
  wall: string; glass?: string; base?: string; baseH?: number
  windows?: 'grid' | 'ribbon' | 'fins' | 'curtain' | 'balconies'
  crown?: 'none' | 'stepped' | 'plant'
  setback?: { at: number; by: number }
  taper?: 'none' | 'slight'
}

const SKIN: Record<NonNullable<RecipeArgs['windows']>, Pick<Face, 'kind' | 'pitch' | 'solid' | 'depth' | 'material'>> = {
  grid: { kind: 'punched', pitch: 3, solid: 0.5, depth: 0.3, material: 'concrete' },
  ribbon: { kind: 'bands', pitch: 3, solid: 0.45, depth: 0.2, material: 'concrete' },
  fins: { kind: 'fins', pitch: 1.8, solid: 0.5, depth: 0.4, material: 'concrete' },
  curtain: { kind: 'curtain', pitch: 2.4, solid: 0.3, depth: 0.2, material: 'metal' },
  balconies: { kind: 'punched', pitch: 3.2, solid: 0.42, depth: 0.6, material: 'concrete' },
}

/** the outline thinned until it has at most `n` corners */
function thin(fit: Fit, n = 12): Fit {
  if (!fit.ring || fit.ring.length <= n) return fit
  for (let min = 2; min < 40; min += 2) {
    const ring = simplifyRing(fit.ring, min, 0.1)
    if (ring.length <= n) return { ...fit, ring }
  }
  return fit
}

export function parisRecipe(out: MeshBuilder, fit: Fit, kit?: unknown): void {
  const a = (kit ?? { wall: '#d8d4c8' }) as RecipeArgs
  const s = SKIN[a.windows ?? 'grid']
  const wall = hex(a.wall)
  const glass = hex(a.glass ?? '#4a5660')
  const face: Face = { ...s, wall, glass, floor: 3 }
  const H = fit.height > 20 ? fit.height : 60
  const tiers: TowerSpec['tiers'] = []
  const cut = a.setback ? Math.min(0.9, Math.max(0.3, a.setback.at)) : 0
  if (cut) { tiers.push({ to: cut, face }); tiers.push({ to: 1, face, inset: a.setback!.by }) }
  else if (a.taper === 'slight') { tiers.push({ to: 0.5, face }, { to: 0.8, face, inset: 0.6 }, { to: 1, face, inset: 0.6 }) }
  else tiers.push({ to: 1, face })
  const spec: TowerSpec = {
    height: H, roof: [0.42, 0.42, 0.44], tiers,
    base: a.base ? { height: a.baseH ?? 6, face: { kind: 'curtain', wall: hex(a.base), glass, pitch: 2.4, solid: 0.3, floor: 3.5, depth: 0.2, material: 'metal' } } : undefined,
  }
  if (a.crown === 'stepped') spec.crown = { kind: 'stepped', steps: 2, height: 4, inset: 2, face: { ...face, kind: 'blank' } }
  else if (a.crown === 'plant') { spec.crown = { kind: 'parapet', height: 1.1, colour: hex(a.wall) }; spec.penthouse = 2 }
  else spec.crown = { kind: 'flat' }
  tower(out, thin(fit), spec)
}
