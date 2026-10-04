/**
 * Kit batch 5 (docs/sf-batches/BRIEF-KIT-BATCH.md): 20 unclaimed SF ways.
 *
 * Photograph check (`docs/shots/refs/`): only two of the twenty have a photo anywhere on disk —
 * `147808261` (`batch5/way-147808261.jpg`, `-2.jpg`) and `256066230` (`exp1`/`exp1-commons`, eleven frames).
 * The other twelve KEPT buildings — `71504443`, `211118823`, `259979000`, `260194175`, `1206216224`,
 * `32863779`, `115944818`, `257338714`, `288342510`, `259872761`, plus the two photographed ones above — are
 * all built from tagged height/levels and baked plan geometry (`tools/footprint.ts`), checked edge-by-edge for
 * curvature, per-bay rhythm and non-orthogonal jogs before deciding kit vs escalate. The eight escalations
 * needed no photo to call: geometry and tags alone are decisive for a church, a circle and a curved corner.
 *
 * Kept (12, `kit`): 71504443, 147808261, 211118823, 259979000, 260194175, 1206216224, 32863779, 256066230,
 * 115944818, 257338714, 288342510, 259872761.
 *
 * Escalated (8, no builder):
 *  - `286435447` — Holy Virgin Cathedral, 6210 Geary Blvd. `amenity=place_of_worship`,
 *    `denomination=russian_orthodox`. Textbook nave/tower church plan. There is a `church()` kit; this is
 *    exactly what it is for.
 *  - `274615294` — Saint John's Presbyterian Church, 201 Arguello Blvd. `amenity=place_of_worship`,
 *    `denomination=presbyterian`. Same call: church-shaped, escalate to `church()`.
 *  - `112072207` — Round House Café, Golden Gate Bridge Presidio plaza. Baked ring is 34 vertices, every
 *    chord 1.4–1.9 m, with the heading sweeping continuously through a full 360° turn (e.g.
 *    `…-77°→-109°→-150°→-178°→174°→…→21°→4°→-13°→-47°→-61°→-77°`) — a true circular plan, not a many-sided
 *    polygon approximation of a rectangle. The name says it too: it is literally a round house. Curved plan
 *    is an explicit escalate trigger.
 *  - `288396169` — Aquarium of the Bay, Pier 39 (`attraction=aquarium`, "Building R"). Baked ring is 47
 *    vertices at highly irregular, mostly non-orthogonal headings (33°, 121°, -59°, -148°, -126°, …, no
 *    consistent right-angle grid) — a sprawling pier structure with multiple wings meeting at odd angles, not
 *    a rectilinear box a flat `facade()` extrusion can wrap. Geometry outside a simple footprint (the pier
 *    itself) plus genuinely irregular plan.
 *  - `286277781` — Alexandria (former Alexandria Theatre, `was:amenity=cinema`), 5400 Geary Blvd. Baked ring
 *    shows eight consecutive short chords (2.4–3.4 m) whose heading rotates smoothly and monotonically from
 *    -40° through -57°, -101°, -120°, -135°, -156° to 159°, 139° — about 160° of continuous turn, the
 *    building's known rounded corner tower/marquee. A curved corner, not survey noise (noise is small and
 *    directionless; this is a long smooth monotonic sweep).
 *  - `32947069` — Pacific Union Club (James C. Flood Mansion), 1000 California St. Baked ring (29 vertices)
 *    has a long dominant run of nine consecutive edges 6.6–16.3 m long, alternating between headings ~45° and
 *    ~135°/-47° — a real, structural 45°-angled bay-wing rhythm running most of the building's north face
 *    (the mansion's canted bay projections), not a couple of short jogs. Depth varies per bay across the
 *    defining length of the building; the flat wall `facade()` draws cannot say a canted bay.
 *  - `288633744` — Kalmanovitz Library (UCSF), 530 Parnassus Ave, 5 levels. Baked ring (38 vertices) is a
 *    dense, near-continuous chain of short (1–15 m) alternating 90°/180° jogs with no long uninterrupted wall
 *    run anywhere in the perimeter — a genuinely stepped/terraced plan (the building steps down UCSF's
 *    Parnassus hillside a level at a time), unlike `172886856` in batch 4 (a few long wings around courtyards
 *    with clean long runs between the jogs). Massing that changes with height/level, one flat extrusion
 *    cannot say.
 *
 * `32863779` (Old San Francisco Mint) and `288342510` (Bay School of San Francisco) both have complex,
 * many-cornered plans (25 and 28 vertices) but every edge is strictly orthogonal (headings cluster on 0/90/
 * 180/-90, confirmed against the BAKED ring, not the raw lat/lon which rounds to false diagonals) — long
 * straight wings around light wells/courtyards, the same shape as batch 4's kept Presidio Landmark
 * (`172886856`). Kept and modelled wing-wall by wing-wall.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const B5: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * way/71504443 — Nextdoor, 400/420 Taylor St, office, 18 m. No photograph. Baked plan is a clean rectangle
   * (41x33m, one small 1.2m survey jog). Built BLIND as a plain mid-rise office building typical of the
   * Tenderloin/Union Square edge.
   */
  b5_office_71504443: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 4, storeys: 1, material: 'dark-stone' },
      shaft: { storeys: 4, windows: 'balanced', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/147808261 — The Beverly Apartments, 12 levels. Reference photo (`batch5/way-147808261.jpg`, `-2.jpg`)
   * shows a narrow red-brick residential building, regular grid of punched windows on tall floors, plain
   * stone/brick banding between storeys, a fire escape down the front (not modelled), dark shopfront-height
   * ground floor with an arched entrance visible on the neighbour's corner.
   */
  b5_apartment_147808261: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 10, windows: 'balanced', material: 'brick' },
      top: { kind: 'attic', storeys: 1, material: 'brick' },
      bands: { aboveGround: 'string', belowTop: 'string', top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/211118823 — Adobe Systems (old_name Baker & Hamilton), 601 Townsend St, office, 17 m. No photograph.
   * Baked plan is a clean rectangle (~73x74m). Built BLIND as the large early-1900s brick industrial/loft
   * warehouse it once was: plain punched windows, a heavy cornice, shopfront-scale ground floor for the
   * SoMa/Townsend St corridor.
   */
  b5_office_211118823: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 6, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 3, windows: 'wide', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'corner', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/259979000 — Cadillac Hotel, 380 Eddy St, 17 m, built 1907. No photograph. Baked plan is a rectangle
   * (33x41m) with a small light-well notch on one side, survey-scale otherwise. Built BLIND as a plain
   * early-1900s Tenderloin SRO hotel: shopfront ground floor, punched windows above, a modest cornice.
   */
  b5_hotel_259979000: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 5, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 4, windows: 'balanced', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },





  /**
   * way/32863779 — Old San Francisco Mint, "The Granite Lady", 88 Fifth St. SUPERSEDED — this was written
   * "No photograph... Built BLIND", which was wrong: this is a National Historic Landmark with abundant
   * photography under its own name, it was simply never looked up. See `BANK_TEMPLES.b5_civic_32863779` in
   * `sf/districts/bank-temples.ts`, which overrides this entry in the registry (spread order in
   * `sf/index.ts`) and is built from Alfred B. Mullett's confirmed Greek Revival design: a Doric portico in
   * antis, pedimented, on sandstone over a granite basement. This function is dead code, kept only so the
   * diff that replaces it stays reviewable; do not treat its comment as evidence about the building.
   */
  b5_civic_32863779: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'granite' },
      shaft: { storeys: 2, windows: 'dressed', material: 'granite' },
      top: { kind: 'attic', storeys: 1, material: 'granite' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'bracketed' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 4 },
      material: 'granite',
    })
  },

  /**
   * way/256066230 — San Francisco Pacific Exchange Building (old_name Pacific Coast Stock Exchange), 301
   * Pine St, 16 m. Reference photos (`exp1`/`exp1-commons`, eleven frames): a monumental grey granite block,
   * a run of eight fluted columns three storeys tall standing IN FRONT of the wall under a plain entablature,
   * with solid end blocks flanking them (the wall visible between the columns, not blank behind them) — this
   * is the exact `giant-order` example named in `src/render/landmarks/facade.ts`'s own doc comment
   * (`flanks: true` "is exactly the Pacific Exchange"). Corner statue groups on plinths are separate
   * sculptures clear of the building mass and are not modelled.
   */
  b5_bank_256066230: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: {
        kind: 'giant-order', columns: 8, storeys: 3, order: 'doric', windows: 'dressed',
        engaged: false, flanks: true, pediment: false, material: 'granite',
      },
      shaft: null,
      top: { kind: 'attic', storeys: 1, material: 'granite' },
      bands: { aboveGround: null, belowTop: 'string', top: 'dentil' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 3 },
      material: 'granite',
    })
  },

  /**
   * way/115944818 — San Francisco Mint (current, "New Mint"), 155 Hermann St. SUPERSEDED — "No photograph...
   * Built BLIND" undersold this: a name search (Living New Deal, NPS) confirms it is a 1937 Gilbert Stanley
   * Underwood design in Stripped Classicism, granite-faced reinforced concrete, four storeys around a central
   * court. See `BANK_TEMPLES.b5_civic_115944818` in `sf/districts/bank-temples.ts`, which overrides this
   * entry (spread order in `sf/index.ts`). This function is dead code, kept only for review; its comment is
   * not evidence about the building.
   */
  b5_civic_115944818: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'limestone' },
      shaft: { storeys: 2, windows: 'dressed', material: 'limestone' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 3 },
      material: 'limestone',
    })
  },

  /**
   * way/257338714 — Union Iron Works Office (Building #104), 560 20th St, industrial, 15 m. No photograph.
   * Baked plan (12 vertices) is a rectangle with a couple of small (0.6–0.8m) setback-scale notches, survey
   * scale. Built BLIND as a plain early-1900s brick shipyard administration building — the same family as
   * batch 4's Bethlehem Steel Administrative Building down the same 20th St industrial waterfront.
   */
  b5_industrial_257338714: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 2, windows: 'balanced', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/288342510 — Bay School of San Francisco, 35 Keyes Ave, Presidio, 14 m. No photograph. Baked plan
   * (28 vertices) is strictly orthogonal — long wings (up to 95m and 89m runs) with several courtyard/light-
   * well notches, the same wing-and-courtyard shape family as the Old Mint above and batch 4's Presidio
   * Landmark. Built BLIND as a plain modern institutional school building on the Presidio's converted
   * military-post footprint: glazed ground floor, plain panelled storeys above.
   */
  b5_school_288342510: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 1, material: 'glass' },
      shaft: { storeys: 3, windows: 'horizontal', material: 'precast' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'precast',
    })
  },

  /**
   * way/259872761 — San Francisco Circus Center, 755 Frederick St, 5 levels, 14 m. No photograph. Baked plan
   * is a clean rectangle (~19.6x45.7m). Built BLIND as a plain early-1900s brick commercial/school building
   * typical of the inner-Sunset Frederick St corridor.
   */
  b5_school_259872761: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 3, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 4, windows: 'balanced', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },
}
