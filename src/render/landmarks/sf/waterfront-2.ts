/**
 * Two owner-picked landmarks with no model at all before this pass, registered through ../index.ts, placed by
 * public/landmarks/san-francisco/waterfront-2.json.
 *
 * - **Aquarium of the Bay**, way/288396169, at the foot of Pier 39. No Mapillary frame (its one frame is
 *   marked `junk`), so this is built from Wikimedia Commons: `Aquarium of the Bay 2025a.jpg` (Commons category
 *   "Aquarium of the Bay - Building"), a clear daylight exterior taken from the plaza side. It shows a long,
 *   gently curved two-tier building following the pier's edge: a dark navy-blue lower wall carrying big painted
 *   marine-life murals, a cream/white upper band with a perimeter walkway behind a railing and a run of
 *   flagpoles, and a small square lantern/cupola near the ridge. `AQUARIUM OF THE BAY` is painted large across
 *   the lower wall facing the plaza — the one legible thing a rider on the Embarcadero promenade actually
 *   reads, so it is built as a real `sign()`, not a hand-blocked font.
 *
 * - **Art Gallery of the Macang Monastery**, way/261273687, immediately beside way/261273676 (`macangMonastery`
 *   in ../churches-3.ts — the former Catholic church, twin octagonal bell towers, sandstone). Reference:
 *   `docs/shots/refs/batch5/way-261273687.jpg` — the corridor lands on a modest two-storey cream/stucco
 *   gable-roofed hall standing between the monastery's trees and the modern condo tower next door (which is
 *   OUTSIDE the corridor and not this building); a dark gable roof, a shuttered upper window facing the
 *   street, an arched opening at grade behind a low forecourt wall (confirmed by the `-2.jpg` sibling, which
 *   shows the same gate and tree from the monastery's own side). This matches the building's real history: it
 *   is the monastery's own former parish hall, used today as its gallery. Built with the SAME `church()` kit as
 *   `macangMonastery` — a plain nave, no tower, gable front — so the two sit together as one composition rather
 *   than as an unrelated box: same sandstone-family material, a gable front that agrees with the monastery's
 *   classical one, and a height (OSM tag 11 m) well under the monastery's twin towers.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { church } from '../church.ts'
import { tower, towerRing, type TowerSpec } from '../tower.ts'
import { edgeAt, cupola, panelOn } from '../parts.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { sign } from '../signage.ts'

const NAVY: Rgb = [0.09, 0.16, 0.32]
const CREAM: Rgb = [0.92, 0.91, 0.86]
const DECK: Rgb = [0.82, 0.8, 0.74]
const DARK_GLASS: Rgb = [0.14, 0.18, 0.24]

/**
 * Aquarium of the Bay, way/288396169 — a low two-tier hall following the curved pier-head footprint, per
 * `Aquarium of the Bay 2025a.jpg` (Wikimedia Commons). Height 15 m (OSM tag, plausible against the photo's
 * two-storey-plus-deck massing) is used unmodified.
 */
export function aquariumOfTheBay(out: MeshBuilder, fit: Fit): void {
  const spec: TowerSpec = {
    height: 15,
    tiers: [
      // the navy lower wall the murals sit on — plain, since the murals themselves are painted panels below
      { to: 0.62, face: { kind: 'blank', wall: NAVY, material: 'concrete' } },
      // the cream upper band, set in slightly so the lower wall reads as the taller of the two
      { to: 1.0, inset: 0.3, face: { kind: 'blank', wall: CREAM, material: 'stucco' },
        cornice: { depth: 0.35, height: 0.3, colour: CREAM } },
    ],
    // the perimeter walkway rail the flags stand along
    crown: { kind: 'balustrade', height: 1.1, colour: DECK, material: 'concrete' },
    roof: DECK,
  }
  tower(out, fit, spec)

  const ring = towerRing(fit)
  const H = fit.height > 0.6 * spec.height && fit.height < 1.6 * spec.height ? fit.height : spec.height
  const lowerTop = H * 0.62

  // painted marine-life murals: broad colour blocks across the plaza-facing (longest) edge of the navy wall,
  // per the photograph's big graphics either side of the entrance
  let front = 0
  {
    let bestL = 0
    for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (e.L > bestL) { bestL = e.L; front = i } }
  }
  // painted round every long-enough wall, not just the one longest edge: from the photograph the murals wrap
  // most of the visible frontage, and a rider passes the building on more than one side
  const muralColours: Rgb[] = [[0.16, 0.38, 0.5], [0.62, 0.72, 0.24], [0.75, 0.22, 0.22]]
  for (let i = 0; i < ring.length; i++) {
    const eL = edgeAt(ring, i).L
    if (eL < 6) continue
    const panelW = Math.min(eL * 0.28, 6)
    const n = eL > panelW * 2.5 ? 2 : 1
    for (let k = 0; k < n; k++) {
      const c = muralColours[(i + k) % muralColours.length]
      panelOn(out, ring, i, (k + 0.5) / n, lowerTop * 0.52, panelW, lowerTop * 0.78, c, { out: 0.08 })
    }
  }

  // the sign a rider on the Embarcadero actually reads
  sign(out, { type: 'flat', text: 'AQUARIUM OF THE BAY', h: 1.1, face: 'grotesque', weight: 'bold', colour: CREAM,
    lit: 'front' }, { ring, edge: front, y: lowerTop * 0.78 })

  // the small square lantern near the ridge, and a line of flagpoles along the deck
  const e = edgeAt(ring, front)
  cupola(out, { x: e.mid.x - e.nx * fit.hz * 0.3, z: e.mid.z - e.nz * fit.hz * 0.3 }, H, 0.9,
    { colour: CREAM, domeColour: [0.3, 0.3, 0.32], domeMaterial: 'metal', drum: 1.4, dome: 0.8 })
  for (let i = 1; i <= 4; i++) {
    const u = (i / 5) * e.L
    const px = e.a.x + e.tx * u + e.nx * 0.2
    const pz = e.a.z + e.tz * u + e.nz * 0.2
    prism(out, px, pz, H, H + 2.4, 0.05, 6, [0.75, 0.75, 0.72], 0)
    box(out, px + e.tx * 0.35, H + 2.1, pz + e.tz * 0.35, 0.4, 0.22, 0.02, [0.7, 0.15, 0.15], 0)
  }
  // the dark window band under the deck, a hint of the mesh-grated openings in the photograph
  box(out, e.mid.x, lowerTop + 0.2, e.mid.z, e.L * 0.32, 0.5, 0.08, DARK_GLASS, 0)
}

/**
 * Art Gallery of the Macang Monastery, way/261273687 — the monastery's own former parish hall, immediately
 * beside `macangMonastery`. Built with the same `church()` kit: a plain gabled nave, no tower (the photograph
 * shows none), a single shuttered window in the gable end reading as the front, in the same sandstone family
 * as the monastery next door so the two read as one property. Height 11 m (OSM tag) matches the photograph's
 * modest two-storey-under-a-gable scale.
 */
export function macangGallery(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 2, storeys: 2, roof: 'gable', pitch: 'moderate' },
    aisles: null,
    transept: null,
    chancel: null,
    tower: null,
    front: { kind: 'gable', portal: 'single', window: 'oculus', steps: 1 },
    walls: { material: 'sandstone', openings: 'square', buttresses: 'none' },
  })
}

export const WATERFRONT_2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  aquariumOfTheBay,
  macangGallery,
}
