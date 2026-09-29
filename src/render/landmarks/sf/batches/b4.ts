/**
 * Kit batch 4 (docs/sf-batches/BRIEF-KIT-BATCH.md): 20 unclaimed SF ways.
 *
 * Photograph check (`docs/shots/refs/`): `387313434`, `260140489` (batch4); `260126019`, `260320985`,
 * `260142634`, `151316276`, `160163535`, `261273676`, `260142631` (batch5). Nine ids have a photo. The other
 * eleven — `173237461`, `32947510`, `48995282`, `172886856`, `267102407`, `256720468`, `256720199`,
 * `256853335`, `1458363734`, `35973054`, `257338315` — have no photograph anywhere under `docs/shots/refs/`
 * and are built BLIND (or, for the three churches and the pagoda, not built at all — see escalations) from
 * OSM tags, tagged height/levels, and plan geometry only. Noted per builder below.
 *
 * Kept (14, `kit`): 387313434, 173237461, 260140489, 32947510, 260126019, 48995282, 260142634, 172886856,
 * 256720468, 151316276, 256720199, 260142631, 256853335, 257338315.
 *
 * Escalated (6, no builder):
 *  - `267102407` — Saint Anne of the Sunset Catholic Church. `building=church`, `amenity=place_of_worship`,
 *    active Catholic parish. Textbook nave/aisle/apse church plan (45 vertices). There is a `church()` kit;
 *    the brief says this is exactly what it is for.
 *  - `160163535` — Saint Joseph's Arts Society. Now a secular arts venue, but the reference photo
 *    (`batch5/way-160163535.jpg`) shows the unaltered original building: a Baroque-domed bell tower and
 *    round-arched nave windows — the former Saint Joseph's Roman Catholic Church (`old_name` confirms it).
 *    Church-shaped regardless of current use; escalated per the brief's rule, not built as an "arts society".
 *  - `261273676` — Macang Monastery, old_name "Old Saint Patricks Church". `building=church`,
 *    `amenity=place_of_worship`. Reference photo (`batch5/way-261273676.jpg`) shows twin ornate bell towers
 *    with lanterns over a classical church front — unambiguous nave-and-towers church plan, now a Buddhist
 *    monastery but built as, and shaped as, a 19th-century Catholic church.
 *  - `1458363734` — Peace Pagoda, Japantown. `building=pagoda`. Not a box: a freestanding five-tier
 *    stepped/tapering pagoda spire (49-vertex near-circular plan, ~13 m across, height tag a nonsense
 *    `0.01`). Massing changes with height at every tier and the roof form is the entire building — the
 *    brief's taper/vaulted-roof triggers, and there is no slot in `facade()` for a pagoda tier stack.
 *  - `260320985` — Sailors' Union of the Pacific, 450 Harrison St. Both reference photos
 *    (`batch5/way-260320985.jpg`, `-2.jpg`) are unusable — the target is occluded behind neighbouring towers
 *    in both crops, nothing of its own facade is visible. Geometry settles it independently: the plan's last
 *    six short edges turn smoothly through headings -95°→-122°→-131°→-137°→-144°→-161° (about 66° of
 *    rotation over six chords of 1-4 m each) — a genuine curved/rounded corner in plan, not survey noise
 *    (noise is small and directionless; this is monotonic). A curved corner is an explicit escalate trigger,
 *    and it is independently consistent with this building's known Streamline Moderne design. The tagged
 *    54 m height is also wildly out of character for what's otherwise a low waterfront union hall, which
 *    would normally call for overriding it from a reference — but there isn't one, so no builder at all.
 *  - `35973054` — San Francisco Armory (Kink.com building), 1800 Mission St. No photograph, but plan
 *    geometry shows two distinct 2-3 m projecting bump-outs along the long north wall (each flanked by a
 *    small counter-turn, e.g. `2.1m@54° 2.9m@4° 2.0m@-49°`) plus chamfered (canted) corners at both ends of
 *    that wall. This matches the building's well-documented castellated corner towers, which rise clear
 *    above the main roofline — massing that changes with height, which one flat `facade()` extrusion cannot
 *    say. Escalated on the plan evidence, not on the building's fame (it also happens to be a locally
 *    well-known landmark, which is not why it's escalated).
 *
 * `387313434` (UC Law SF Parking Garage, `building=parking`/`amenity=parking`) was checked against the
 * brief's infrastructure warning — unlike the Bay Bridge pylons, this is a real, named, photographed,
 * building-shaped multi-storey structure with a proper punched/screened facade, so it is kept and modelled
 * as the plain garage box its photo shows.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const B4: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * way/387313434 — UC Law SF Parking Garage, 376 Larkin St, 46 m. Reference photos
   * (`batch4/way-387313434.jpg`, `-2.jpg`): a beige precast multi-storey parking structure, small square
   * screened/punched openings in a tight regular grid, no glazing, vertical precast piers dividing bays,
   * plain ground floor with a vehicle entrance.
   */
  b4_garage_387313434: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'precast' },
      shaft: { storeys: 10, windows: 'small', material: 'precast' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: { verticals: { kind: 'pier', width: 0.4, at: 'bays', count: 8 }, horizontals: null, recess: 0, material: 'precast' },
      entrance: { at: 'corner', kind: 'door', steps: 0 },
      material: 'precast',
    })
  },

  /**
   * way/173237461 — Storek Building, 155 9th St, office, 4 levels, 31 m, brick. No photograph. Plan is a
   * clean rectilinear outline (13 vertices, no jogs beyond a couple of survey-scale notches). Built BLIND as
   * a plain pre-war brick office/loft building typical of the SoMa/9th St corridor.
   */
  b4_office_173237461: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 3, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 3, windows: 'balanced', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/260140489 — Oasis Apartments, 12 levels. Reference photo (`batch4/way-260140489.jpg`): tall
   * red-brown brick residential tower, tight regular grid of punched windows, plain flat-topped massing with
   * a stepped parapet, no ground-floor ornament visible (obscured by street-level shopfronts of a neighbour).
   */
  b4_apartment_260140489: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 10, windows: 'balanced', material: 'brick' },
      top: { kind: 'attic', storeys: 1, material: 'brick' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'brick',
    })
  },

  /**
   * way/32947510 — Old Federal Reserve Bank, 400 Sansome St. SUPERSEDED — "No photograph... Built BLIND" was
   * true of the street-level fetch, not of the building: it is well documented by name (Wikipedia, National
   * Register, SF Chronicle) — an Ionic colonnade, Beaux-Arts, with a Moderne tower above. See
   * `BANK_TEMPLES.b4_bank_32947510` in `sf/districts/bank-temples.ts`, which overrides this entry (spread
   * order in `sf/index.ts`). This function is dead code, kept only for review; its comment is not evidence
   * about the building.
   */
  b4_bank_32947510: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'limestone' },
      shaft: { storeys: 5, windows: 'dressed', material: 'limestone' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'bracketed' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 3 },
      material: 'limestone',
    })
  },

  /**
   * way/260126019 — Ellis Garden (Tigren Hotel), 13 levels. Reference photo (`batch5/way-260126019.jpg`):
   * narrow grey mid-rise, plain grid of punched windows on most floors, round-arched windows on the top
   * floor only, fire escapes down the front (not modelled), black-painted shopfront ground floor with a
   * central door.
   */
  b4_hotel_260126019: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 3, storeys: 1, material: 'dark-stone' },
      shaft: { storeys: 11, windows: 'balanced', material: 'concrete' },
      top: { kind: 'attic', storeys: 1, material: 'concrete' },
      bands: { aboveGround: 'string', belowTop: 'string', top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'concrete',
    })
  },

  /**
   * way/48995282 — The Olympic Club, 524 Post St, private club, 6 levels, 27 m. No photograph. Plan is a
   * clean rectilinear footprint. Built BLIND as a historic stone clubhouse in the Union Square area: a
   * rusticated base, dressed windows above, a proper cornice — the kind of significant building that is
   * still just a box, per the brief's own caution against escalating on significance alone.
   */
  b4_club_48995282: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'dark-stone' },
      shaft: { storeys: 4, windows: 'dressed', material: 'limestone' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'bracketed' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 4 },
      material: 'limestone',
    })
  },

  /**
   * way/260142634 — Mosser Towers (old_name Central Towers), 350 Turk St, apartments, 41 m. Reference photo
   * (`batch5/way-260142634.jpg`) shows a large, plain, near-windowless tan stucco flank wall with a dark
   * boxy mechanical penthouse above the roofline — evidently a side/party wall, not the main frontage, but
   * it does confirm the plain finish and a set-back rooftop element. Modelled as a plain stucco apartment
   * tower with a glazed mechanical-penthouse top; the main frontage's own window rhythm is not shown in the
   * photo, so a modest, unremarkable punched pattern is used rather than invented ornament.
   */
  b4_apartment_260142634: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'stucco' },
      shaft: { storeys: 9, windows: 'small', material: 'stucco' },
      top: { kind: 'setback', storeys: 1, by: 1.2, material: 'glass' },
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'stucco',
    })
  },

  /**
   * way/172886856 — The Presidio Landmark, 1801 Wedemeyer St, residential, 25 m. No photograph. A large
   * former hospital (San Francisco Public Health Service Hospital) converted to condos — a 38-vertex plan of
   * several straight wings around courtyards, but every segment is a substantial rectilinear run (no curves,
   * no per-bay rhythm, no columns outside the ring); this is complex in PLAN layout, not in cross-section, so
   * `facade()` can still say it one wing-wall at a time. Built BLIND as a 1930s brick Georgian-revival
   * institutional block: plain punched windows, a modest cornice, no applied ornament invented beyond what
   * the tags support.
   */
  b4_residential_172886856: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'brick' },
      shaft: { storeys: 5, windows: 'balanced', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'brick',
    })
  },

  /**
   * way/256720468 — French American International School, 150 Oak St, 7 levels, 23 m. No photograph. Plan
   * is a rectilinear footprint with a couple of setback-scale notches. Built BLIND as a plain modern
   * institutional school building: glazed ground floor, plain panelled storeys above, no ornament invented.
   */
  b4_school_256720468: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 1, material: 'glass' },
      shaft: { storeys: 6, windows: 'horizontal', material: 'precast' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'precast',
    })
  },

  /**
   * way/151316276 — Gramercy Towers, 18 levels, 49 m. Reference photo (`batch5/way-151316276.jpg`) shows a
   * plain grey corrugated-metal-clad flank wall, no windows visible on this elevation — again a side wall,
   * not the main front, next to a Victorian neighbour and a scaffolded construction site. Modelled as a
   * plain modern apartment tower with a restrained window rhythm on the (unphotographed) main faces, keeping
   * the plain unornamented character the visible wall shows.
   */
  b4_apartment_151316276: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'concrete' },
      shaft: { storeys: 16, windows: 'small', material: 'precast' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'precast',
    })
  },

  /**
   * way/256720199 — San Francisco Ballet, 455 Franklin St, 22 m. No photograph. Part of the Van Ness Civic
   * Center performing-arts area; plan is a clean rectilinear footprint. Built BLIND as a plain modern
   * institutional box — many performance venues are, per the brief, and nothing in tags or plan suggests
   * otherwise.
   */
  b4_ballet_256720199: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'precast' },
      shaft: { storeys: 4, windows: 'small', material: 'precast' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 2 },
      material: 'precast',
    })
  },

  /**
   * way/260142631 — Mosser Towers (Central Towers), 455 Eddy St, 41 m. Reference photo
   * (`batch5/way-260142631.jpg`): a plain dark tower with a regular grid of small punched windows, partly
   * obscured by construction and a painted mural on an adjacent building. Matches its sibling `260142634` in
   * material and plainness but darker.
   */
  b4_apartment_260142631: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'dark-stone' },
      shaft: { storeys: 9, windows: 'small', material: 'dark-brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 0 },
      material: 'dark-brick',
    })
  },

  /**
   * way/256853335 — Redstone Building (San Francisco Labor Temple), 2940 16th St, commercial, 3 levels,
   * 20 m. No photograph. Plan is a clean rectilinear footprint. Built BLIND as a plain early-1900s brick
   * labor-temple/commercial building typical of the Mission's 16th St corridor: shopfront ground floor,
   * plain storeys above, a modest cornice.
   */
  b4_commercial_256853335: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 4, storeys: 1, material: 'dark-brick' },
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
   * way/257338315 — Bethlehem Steel Administrative Building (#101), 20th St, industrial, 3 levels, 19 m.
   * No photograph. Plan is a rectilinear footprint with several small setback-scale notches (a light well
   * and a stepped corner), not a repeating bay rhythm. Built BLIND as a plain early-20th-century industrial
   * office/admin building: brick, plain punched windows, no ornament invented.
   */
  b4_industrial_257338315: (out: MeshBuilder, fit: Fit): void => {
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
}
