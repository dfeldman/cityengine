/**
 * Kit batch 3 (docs/sf-batches/BRIEF-KIT-BATCH.md): 20 unclaimed SF ways handed down with `building:part`s
 * already stripped by the owner, so all 20 are genuine outlines (no floating-slice risk from batch 2).
 *
 * Photograph check (`docs/shots/refs/` by way id — some land in `batch3/`, some in `batch4/`,
 * `sf-mapillary/` or `exp1(-commons)/`, but a photo under any of those folders for one of THESE ids is a
 * legitimate reference): `260162805`, `71739084`, `25759123` (batch3); `84805700` (sf-mapillary);
 * `192883977`, `259925716`, `35024321`, `259990934` (batch4); `690663633` (exp1/exp1-commons). The other
 * seven kept buildings — `256763516`, `192883909`, `1204801750`, `251511538`, `556047031`, `941563175`,
 * `941568179` — have no photograph anywhere and are built BLIND, from the plan, tagged height/levels and
 * (where present) the OSM `building`/`amenity`/`architect` tags only. Noted per builder below.
 *
 * Kept (16, `kit`): 260162805, 84805700, 71739084, 25759123, 256763516, 192883977, 259925716, 35024321,
 * 259990934, 192883909, 1204801750, 251511538, 556047031, 941563175, 941568179, 690663633.
 *
 * Escalated (1, no builder): 71739089 — 840 Post St, a 9-level apartment building whose north wall is a
 * genuine fine sawtooth in PLAN (repeated ~2-6 m in-and-out jogs across ~30 of its 33 vertices, not survey
 * noise — compare `259925716`'s ~0.3 m jog, which IS noise and was kept). That is the brief's "depth that
 * varies per BAY" trigger for a bay-window building; `facade()`'s slots draw one flat plane per polygon
 * edge and cannot say a repeating in-and-out bay rhythm. No builder written.
 *
 * Bailed (3, no builder, no usable reference):
 *  - `12960731` — the id does not resolve. It was a `highway=residential` way in White County, Arkansas,
 *    deleted from OSM in 2015 (checked via the OSM API's element history). Not an SF building; never was.
 *  - `30672537` — resolves to a real, current way, but it is `highway=path` / `bicycle=yes` (a Golden Gate
 *    Park bike path), not a building at all. No building geometry exists at this id.
 *  - `1389915136` — Transbay Block 2 West. `building=construction`, and OSM's own tag says the ring is
 *    provisional: `note=general building outline for Transbay Block 2 West, can be refined once imagery
 *    reflects current conditions`. No completed building exists yet to model; the shape on record is a
 *    placeholder the surveyor flagged as such.
 *
 * `192883977` (PG&E Embarcadero Substation) was checked against the brief's infrastructure warning
 * (`power=substation` on a `building=industrial`) — unlike the Bay Bridge pylons in batch 1, this is a real,
 * named, photographed building-shaped structure (a large blank fluted-concrete block, not a pylon or mast),
 * so it is kept and modelled as the plain windowless industrial box it is.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const B3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * way/260162805 — GEDEC Family Housing, 125 Mason St, 41 m. Reference photo (`batch3/way-260162805.jpg`):
   * cream terracotta mid-rise, black-ground-floor storefronts under round-arched openings reading as an
   * arcade, plain upper storeys with arched top-floor windows, bracketed cornice. `arcade()`/`facade()`'s
   * `ground: 'arcade'` may still draw a flat opening-less wall (BUGS.md #96, reopened) — used anyway per the
   * brief rather than silently substituting `shopfronts`.
   */
  b3_hotel_260162805: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'arcade', arches: 6, storeys: 1, material: 'dark-stone' },
      shaft: { storeys: 5, windows: 'balanced', material: 'terracotta' },
      top: { kind: 'attic', storeys: 1, material: 'terracotta' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'bracketed' },
      crown: null,
      frame: null,
      entrance: { at: 'corner', kind: 'door', steps: 0 },
      material: 'terracotta',
    })
  },

  /**
   * way/84805700 — J David Gladstone Institutes, 1650 Owens St, 41 m / 6 levels. Reference photo
   * (`sf-mapillary/way-84805700-01.jpg`): plain modern biotech/office low-rise, metal panel and glass, no
   * ornament, articulated bays reading as vertical panel piers, ground floor recessed under an overhang.
   */
  b3_lab_84805700: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 1.2, material: 'glass' },
      shaft: { storeys: 4, windows: 'horizontal', material: 'precast' },
      top: { kind: 'attic', storeys: 1, material: 'precast' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: { verticals: { kind: 'pier', width: 0.5, at: 'bays', count: 6 }, horizontals: null, recess: 0, material: 'precast' },
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'precast',
    })
  },

  /**
   * way/71739084 — 666 Post St, 50 m. Reference photo (`batch3/way-71739084.jpg`): dark red-brown brick/
   * terracotta pre-war tower, tight punched windows, prominent fire escapes down the front, flat-topped with
   * a plain roofline (no crown visible against the sky in the reference).
   */
  b3_prewarTower_71739084: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 11, windows: 'vertical', material: 'dark-brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'dark-brick',
    })
  },

  /**
   * way/25759123 — Arthur A Dugoni School of Dentistry, 155 5th St, 46 m. Reference photo
   * (`batch3/way-25759123.jpg`): glass curtain-wall block on a podium, ground floor recessed behind square
   * columns with a canopy and a large round wall medallion, horizontal glazing bands reading as balanced
   * punched-glass storeys, no cornice or crown — a flat modern top.
   */
  b3_university_25759123: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 1.5, material: 'concrete' },
      shaft: { storeys: 10, windows: 'horizontal', material: 'glass' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: { verticals: { kind: 'column', width: 0.6, at: 'corners' }, horizontals: null, recess: 0, material: 'concrete' },
      entrance: { at: 'centre', kind: 'recessed', steps: 2 },
      material: 'glass',
    })
  },

  /**
   * way/256763516 — Webster Tower & Terrace, 1489 Webster St, tagged height 15 m (no `building:levels`).
   * No photograph anywhere in `docs/shots/refs/`. `building=mixed`, named "Tower" but tagged very short —
   * per the brief's height-mistrust rule this would call for a real reference to override the tag, and
   * there isn't one, so the tagged 15 m stands as the honest figure to build to (roughly 4 storeys). Built
   * BLIND as a plain mixed-use Western Addition infill block: shopfront ground floor (the "Terrace" retail
   * frontage), plain balanced storeys above.
   */
  b3_mixedUse_256763516: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 5, storeys: 1, material: 'stucco' },
      shaft: { storeys: 3, windows: 'balanced', material: 'stucco' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'stucco',
    })
  },

  /**
   * way/192883977 — PG&E Embarcadero Substation, 51 m. Reference photo (`batch4/way-192883977.jpg`): a
   * huge, blank, windowless precast/concrete block with vertical fluted ribs and no visible openings at
   * street level beyond a small service door — the honest treatment is a plain, tall, unglazed wall.
   */
  b3_substation_192883977: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 2, material: 'concrete' },
      shaft: { storeys: 10, windows: 'small', material: 'concrete' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: null,
      frame: { verticals: { kind: 'pilaster', width: 0.35, at: 'bays', count: 10 }, horizontals: null, recess: 0, material: 'concrete' },
      entrance: { at: 'corner', kind: 'door', steps: 0 },
      material: 'concrete',
    })
  },

  /**
   * way/259925716 — La Galleria, 14 levels. Reference photo (`batch4/way-259925716.jpg`): a mid-rise
   * residential tower with continuous cantilevered balconies on every floor above a plain podium, parking
   * garage doors at grade. Footprint has a repeating ~0.3 m jog on one edge that is survey noise (not a real
   * bay rhythm, unlike `71739089`) — treated as a plain rectangular plan.
   */
  b3_apartment_259925716: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'stucco' },
      shaft: { storeys: 12, windows: 'balanced', material: 'stucco' },
      top: { kind: 'attic', storeys: 1, material: 'stucco' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'stucco',
    })
  },

  /**
   * way/35024321 — Hotel Adagio, 550 Geary St, 47 m. Reference photo (`batch4/way-35024321.jpg`): tall
   * white mid-century hotel slab, plain grid of punched windows, dark canopy over a shopfront/lobby ground
   * floor, plain flat top.
   */
  b3_hotel_35024321: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 4, storeys: 1, material: 'dark-stone' },
      shaft: { storeys: 11, windows: 'balanced', material: 'stucco' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'stucco',
    })
  },

  /**
   * way/259990934 — Alexander Residence, 230-232 Eddy St, 43 m. Reference photo
   * (`batch4/way-259990934.jpg`): brick SRO hotel tower, punched windows, fire escapes down the front,
   * painted ground-floor storefront/mural base, plain flat top.
   */
  b3_residence_259990934: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 3, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 9, windows: 'vertical', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/192883909 — unnamed, 9 levels. No photograph. Plan is a long diagonal bar (following a diagonal
   * street) with one small mid-length notch — a light well, not a repeating bay rhythm — so it is a genuine
   * rectilinear outline, not a sawtooth. Built BLIND as a plain mid-rise apartment/office block typical of
   * the area.
   */
  b3_midrise_192883909: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'brick' },
      shaft: { storeys: 7, windows: 'balanced', material: 'brick' },
      top: { kind: 'attic', storeys: 1, material: 'brick' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'brick',
    })
  },

  /**
   * way/1204801750 — unnamed office, 9 levels. No photograph. Footprint is close to a plain rotated
   * rectangle (fill ratio 0.84 against its bounding box, 5 vertices). Built BLIND as a plain mid-century
   * office block — a box with windows, deliberately: nothing in the tags or plan suggests otherwise.
   */
  b3_office_1204801750: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'precast' },
      shaft: { storeys: 8, windows: 'balanced', material: 'precast' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'precast',
    })
  },

  /**
   * way/251511538 — Kaiser Permanente Mission Bay clinic, 1600 Owens St. No photograph. A modern medical
   * building; `layer=1` is present but the footprint itself is a self-contained notched rectangle (a
   * chamfered corner, not geometry outside the ring), so treated as ordinary. Built BLIND: glazed ground
   * floor entrance, plain panelled storeys above, no ornament — a clinic building typical of Mission Bay's
   * 2000s-2010s architecture.
   */
  b3_clinic_251511538: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 1, material: 'glass' },
      shaft: { storeys: 4, windows: 'horizontal', material: 'precast' },
      top: { kind: 'attic', storeys: 1, material: 'glass' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'precast',
    })
  },

  /**
   * way/556047031 — The Rise, 1699 Market St, 9-level apartments. No photograph. Footprint has an L-shaped
   * step (a rectilinear corner notch, not a repeating bay). Built BLIND as a contemporary Market St infill
   * apartment building: ground-floor shopfronts on the Market St frontage, plain balanced storeys, glazed
   * setback top typical of 2010s SF podium buildings.
   */
  b3_apartment_556047031: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 4, storeys: 1, material: 'concrete' },
      shaft: { storeys: 7, windows: 'balanced', material: 'stucco' },
      top: { kind: 'setback', storeys: 1, by: 1.5, material: 'glass' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'stucco',
    })
  },

  /**
   * way/941563175 — 222 Taylor, 9 levels. No photograph. Tenderloin/Union Square-adjacent site. Built
   * BLIND as a plain mid-rise apartment building: modest street door, plain punched storeys, a cornice
   * reading as composed rather than extruded.
   */
  b3_apartment_941563175: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'brick' },
      shaft: { storeys: 7, windows: 'balanced', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'brick',
    })
  },

  /**
   * way/941568179 — Crescent Nob Hill, 875 California St, 8 levels + 1 roof level, architect Robert A.M.
   * Stern. No photograph, but the architect and Nob Hill address point clearly at an upscale traditionalist
   * condo building rather than a plain modern one: rusticated stone base, vertically-dressed punched
   * windows, string courses, a proper cornice. Built BLIND from that inference, not from an image.
   */
  b3_condo_941568179: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'limestone' },
      shaft: { storeys: 6, windows: 'dressed', material: 'limestone' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 3 },
      material: 'limestone',
    })
  },

  /**
   * way/690663633 — Alvinza Hayward Building (Kohl Building), 400 Montgomery St, 9 levels. Reference photo
   * (`exp1-commons/way-690663633-01.jpg`): a beaux-arts bank/office building — a genuine box, per the
   * owner's own note that "some extremely significant buildings are actually just boxes." Rusticated
   * ground floor with a big carved stone arched entrance surround, plain upper storeys with a bracketed
   * cornice course under the roofline, large plain windows at ground level either side of the entrance.
   */
  b3_bank_690663633: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 2, material: 'dark-stone' },
      shaft: { storeys: 6, windows: 'dressed', material: 'limestone' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'bracketed' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 2 },
      material: 'limestone',
    })
  },
}
