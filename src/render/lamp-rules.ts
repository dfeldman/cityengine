/**
 * FAMOUS STREET LAMPS: the streets whose lamps are their own design, not the city's standard ones (owner, 2026-11-26:
 * "keep working on other famous lamps" — after the cities' everyday lamps, render/models.ts LAMP_LIGHTS).
 *
 * A rule names the streets (OSM `name`, exact) and a lat/lon box the edge's midpoint must fall in; the lamp loop in
 * render/city.ts then stands the rule's model in the lamp slots instead of the regional one, at its own pitch. The model
 * registers its light centres in LAMP_LIGHTS like every lamp, so its night pool and halo come for free.
 *
 * Frames are the lamp loop's: model +z along the street, local −x towards the road.
 */
import type { MeshBuilder } from './buildings.ts'
import { champsElyseesMast, marechauxMast } from './paris/famous-lamps.ts'
import { dragonLamp } from './sf/street-lights.ts'

export interface LampRule {
  /** for logs and window.__lampsPlaced */
  label: string
  /** OSM names, exact */
  streets: string[]
  /** [south lat, west lon, north lat, east lon] — the edge's midpoint must be inside */
  box: [number, number, number, number]
  model: (o: MeshBuilder) => void
  /** metres between lamps along the street (each side when `paired`, alternating sides otherwise) */
  pitch: number
  /** 'kerb': at the kerb, 0.45 m behind it (arms over the road); 'walk': on the pavement's lamp line */
  at: 'kerb' | 'walk'
  /** metres behind the kerb (overrides `at`): past a cycle track the bake draws as a road beside the carriageway */
  inset?: number
  /** both sides opposite each other, rather than staggered */
  paired?: boolean
  /** the street has no utility poles (its wires are underground) — the pole loop skips it */
  noPoles?: boolean
}

export const LAMP_RULES: LampRule[] = [
  // Chinatown's dragon lamps, 1925: Grant from Bush to Broadway (43 ordered), paired across the street, wires underground.
  { label: 'dragon-lamps', streets: ['Grant Avenue'], box: [37.7900, -122.4090, 37.7985, -122.4050], model: dragonLamp, pitch: 30, at: 'walk', paired: true, noPoles: true },
  // Paris: the Champs-Élysées' 12 m Wilmotte masts, Étoile to the Rond-Point (the gardens below it keep the old lamps).
  { label: 'champs-elysees', streets: ['Avenue des Champs-Élysées'], box: [48.8650, 2.2940, 48.8745, 2.3110], model: champsElyseesMast, pitch: 30, at: 'kerb', inset: 3, paired: true },
  // Paris: the Maréchaux ring's plain modern masts (tram boulevards).
  { label: 'marechaux', streets: ['Boulevard Lefebvre', 'Boulevard Brune', 'Boulevard Jourdan', 'Boulevard Kellermann', 'Boulevard Masséna', 'Boulevard Poniatowski', 'Boulevard Soult', 'Boulevard Davout', 'Boulevard Mortier', 'Boulevard Sérurier', 'Boulevard Macdonald', 'Boulevard Ney', 'Boulevard Bessières', 'Boulevard Berthier', 'Boulevard Gouvion-Saint-Cyr', 'Boulevard Lannes', 'Boulevard Victor'], box: [48.815, 2.25, 48.905, 2.42], model: marechauxMast, pitch: 28, at: 'kerb' },
]
