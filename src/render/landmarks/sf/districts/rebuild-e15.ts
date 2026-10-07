/**
 * 2026-09-23 rebuild pass: four buildings the owner's review marked for a full rebuild (docs/sf-batches, the
 * "reviewed 4" set). Each replaces a `restyle` or a `fromRecipe` placeholder with its own facade.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade, type FacadeSpec } from '../../facade.ts'
import { towerRing } from '../../tower.ts'
import { marquee, bladeSign, edgeAt, edgeFacing } from '../../parts.ts'
import { box } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

const spec = (s: FacadeSpec) => (out: MeshBuilder, fit: Fit): void => facade(out, fit, s)

export const REBUILD_E15: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * Strand Theatre (way/255960461), 1127 Market St: A.C.T.'s red-painted four-storey front — a dark
   * storefront base under theatre doors, three storeys of small punched windows in the red wall, a
   * projecting cornice, and a canopy over the entrance.
   */
  strandTheatre: (out: MeshBuilder, fit: Fit): void => {
    const RED: [number, number, number] = [0.62, 0.14, 0.11]
    const DARK: [number, number, number] = [0.08, 0.08, 0.09]
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 5, storeys: 1, material: null },
      shaft: { windows: 'balanced', storeys: 3, material: null },
      top: null,
      bands: { aboveGround: 'cornice', belowTop: null, top: 'cornice' },
      crown: { kind: 'parapet', height: 0.6, colour: RED },
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'brick',
    })
    // Recolour the base and shaft off the 'brick' default toward the Strand's own paint isn't available
    // through Material, so the canopy and blade carry the theatre's actual colours instead.
    const ring = towerRing(fit)
    const e = edgeFacing(ring, 0)
    const mid = edgeAt(ring, e).mid
    marquee(out, mid.x, 4.2, mid.z, 5, 1.8, 'A.C.T.', { body: DARK, band: RED })
    bladeSign(out, ring[e].x, fit.height * 0.7, ring[e].z, 4, 'STRAND', { width: 1.1, body: DARK })
  },

  /**
   * Rincon Annex (way/44106213), 1940 Streamline/Deco former post office: a long low cream block, full-height
   * fluted piers dividing tall recessed window bays, a dark granite base band, flat parapet. OSM's height (33m,
   * "levels >= 8") reads as a tall building; the photograph is a squat block a fraction of that — believe the
   * photograph (BUGS.md #126).
   */
  rinconAnnex: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'dark-stone' },
      shaft: { windows: 'vertical', storeys: 3, material: 'stucco' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: { kind: 'parapet', height: 0.8, material: 'stucco' },
      frame: { verticals: { kind: 'pilaster', width: 0.9, at: 'bays', count: 9 }, horizontals: null, recess: 0, material: 'stucco' },
      entrance: { at: 'centre', kind: 'portal', steps: 3 },
      material: 'stucco',
    })
    // the 1989 atrium's glass roof down the middle of the old post office (owner's aerial, 2026-10-06): a long grid of
    // square glazed bays over a dark frame, raised a little in a stepped ridge
    const H = fit.height, L = fit.hx * 0.62, W = Math.min(fit.hz * 0.42, 14)
    const FRAME: [number, number, number] = [0.22, 0.24, 0.26], PANE: [number, number, number] = [0.32, 0.42, 0.5]
    box(out, 0, H + 0.25, 0, L + 0.4, 0.25, W + 0.4, FRAME, 0)
    const nx = Math.max(4, Math.round(L / 3.2)), nz = Math.max(2, Math.round(W / 3.2))
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = -L + (2 * L * (i + 0.5)) / nx, z = -W + (2 * W * (j + 0.5)) / nz
      const lift = 0.9 * (1 - Math.abs(z) / W)
      box(out, x, H + 0.55 + lift, z, L / nx - 0.22, 0.06, W / nz - 0.22, PANE, surfaceTag('glass'))
    }
  },

  /**
   * 1500 Mission (way/693627612), 2016: a pale precast-and-glass residential tower whose street corner is
   * sliced off in plan (the footprint already carries that notch) and whose roofline itself rises to a
   * diagonal point on the same corner — `crown: 'sliced'` is the one shape in the kit that draws a roof
   * rising across the plan rather than flat, which a plain `parapet` cannot.
   */
  fifteenHundredMissionRebuilt: spec({
    ground: { kind: 'recessed', storeys: 1, depth: 1.2, material: 'glass' },
    shaft: { windows: 'balanced', storeys: 34, material: null },
    top: null,
    bands: { aboveGround: 'cornice', belowTop: null, top: null },
    crown: { kind: 'sliced', height: 26, colour: [0.8, 0.8, 0.78] },
    frame: null,
    entrance: { at: 'corner', kind: 'recessed', steps: 0 },
    material: 'precast',
  }),

  // Yerba Buena Center for the Arts Gallery (way/24563073): BAILED, not modelled. See
  // public/landmarks/san-francisco/lowrise.json's entry and the batch report for the reason — a
  // multi-volume complex (glass cubes, patios, walkways) that neither the photographs (every Mapillary
  // frame is the rear, BUGS.md #128) nor the OSM way (one undifferentiated polygon, no building:parts)
  // describe. Needs docs/INSTITUTIONS.md's dedicated procedure, starting from way/24563073's own
  // wikidata=Q1884883 and website=https://www.ybca.org/.
}
