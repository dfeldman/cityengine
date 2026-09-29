/**
 * Kit batch 6 (docs/sf-batches/BRIEF-KIT-BATCH.md): 20 unclaimed SF ways.
 *
 * Photograph check (`docs/shots/refs/`): NONE of the twenty have a photo anywhere on disk (searched by id
 * across the whole `refs/` tree, not just a folder named for this batch). All twelve KEPT buildings below
 * are built BLIND, from OSM tags/names, baked plan geometry (`tools/footprint.ts`, projected metres, not
 * raw lat/lon) and — for the more distinctive names — a web search for the real building's known form
 * (Alhambra Theatre, Harding Theater, Koshland House "Le Petit Trianon", Swedish American Hall, Mish House,
 * Richmond Branch Library). Every ring was checked edge-by-edge in the BAKED frame for curvature, per-bay
 * rhythm and non-orthogonal jogs before deciding kit vs escalate.
 *
 * Kept (12, `kit`): 206662303, 242973692, 220522604, 273181546, 121024973, 260351423, 263823315, 260353691,
 * 169204245, 256487848, 68876388, 132605490.
 *
 * Escalated (8, no builder):
 *  - `223211125` — Most Holy Redeemer Roman Catholic Church, 110 Diamond St. `amenity=place_of_worship`,
 *    `building=church`, `denomination=catholic`. Textbook church plan; there is a `church()` kit.
 *  - `277035386` — San Francisco Korean United Methodist Church, 3030 Judah St. `building=church`,
 *    `denomination=united_methodist`. Same call.
 *  - `286297924` — Our Lady of Fatima Byzantine Catholic Church, 5920 Geary Blvd. `building=yes` but
 *    `amenity=place_of_worship`, `religion=christian`; the elongated (56x16m) plan is a nave-and-narthex box.
 *    Church-shaped, escalate to `church()`.
 *  - `260152155` — Russian Orthodox Convent of Our Lady of Vladimir, 3365 19th St. `building=church`,
 *    `denomination=orthodox`. Same call.
 *  - `274858124` — Star of the Sea Roman Catholic Church, 4410 Geary Blvd. `building=church`,
 *    `denomination=catholic`, tag-confirmed AND geometry-confirmed: the baked ring (70 vertices) has two
 *    separate monotonic heading sweeps on 0.6-2.1m chords (-169°→-86° across ~20 vertices, then -157°→-14°
 *    across another ~19) — a curved apse/tower plus a curved corner — on top of scattered 0.8-1.8m diagonal
 *    jogs at 37/130/-33/-55° along the long faces, a chamfered bay rhythm. Two independent escalate triggers.
 *  - `273587509` — Richard A Gleeson Library, USF, Golden Gate Ave. `building=university`/`amenity=library`,
 *    3 levels. Baked ring (54 vertices) has an 8-vertex run of 1.1-1.9m chords whose heading rotates
 *    monotonically ~133°→176° (a serrated curve), immediately followed by a smooth monotonic sweep
 *    -176°→-119° — a genuinely curved plan section (the library's known curved reading-room bay), not noise.
 *    The clean 67.8x30.3m rear block does not save it: massing includes a real curve.
 *  - `288340246` — **Walt Disney Family Museum**, 104 Montgomery St, Presidio. `building=museum`,
 *    `tourism=museum`. This is a named destination on the Presidio/Golden Gate route, so it got the careful
 *    treatment, not a box: baked ring (24 vertices) is confirmed STRICTLY ORTHOGONAL (every heading clusters
 *    on 0/90/180/-90; the only real feature is one 18.8m x 1.8m projection on the long north face) — the
 *    PLAN does not defeat the kit, matching the two-wing 1897 brick Army barracks it actually is. But the
 *    real building (per Wikipedia/archpaper.com) has a preserved brick, arcaded-porch front facing the
 *    parade ground on one long face, AND a two-storey glass curtain wall filling the opposite (rear) face
 *    where the two wings' courtyard was walled in during the 2009 renovation — two structurally different
 *    materials/treatments on two long faces of ONE ring. `FacadeSpec.shaft`/`ground` take one `material` and
 *    one `Ground.on` selection each; `Shaft` has no per-edge `on` at all, so one `facade()` call cannot give
 *    "brick arcade front, glass curtain rear" on the same ring, and calling `facade()` twice on the full ring
 *    double-draws the shared walls. Forcing it into one material (all-brick, or all-glass) would repeat
 *    exactly the SFMOMA mistake this brief warns about — a real half of the building's identity missing.
 *    Escalate: two distinct claddings on opposite long faces of one ring, not expressible in one spec.
 *  - `288794272` — unnamed (`building=yes`, no `name`), 170 Otis St, height tagged 45m, baked ring is a large
 *    (~87m across) 32-vertex polygon with a genuine SECOND grid rotated ~31/-59/121/-149° on top of the
 *    orthogonal one — not a rhythm, a real second orientation. The only two photos on file for this id
 *    (`docs/shots/refs/batch5/way-288794272.jpg`, `-2.jpg`) show a massive elevated-freeway girder deck on a
 *    single concrete pier directly over the site, and a plain one-storey warehouse wall beside it — no
 *    45m-tall building is visible in either frame. Otis St sits under the US-101/Central Freeway ramps.
 *    This reads as infrastructure (a freeway ramp/viaduct footprint) wearing a `building=yes` tag, the same
 *    failure mode as the four Bay Bridge pylons in #150, not a modellable building. Escalate for review
 *    rather than guess a box at a height nothing on the ground supports.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const B6: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * way/206662303 — Alhambra Theatre, 2330 Polk St, 14 m. No photograph. Web search: 1926 Moorish Revival
   * movie palace (Timothy Pflueger), twin corner turrets flanking the entrance, richly ornamented facade —
   * now a gym, interior largely intact. Baked plan (9 vertices) is an orthogonal box with two straight
   * splayed corners at the front, matching the twin-turret massing (the splays are straight chamfers, not a
   * curve — a kit parameter, not an escalation trigger). Unusual ornament/colour is a kit PARAMETER: built
   * with an arched, richly dressed ground floor and a decorative cornice standing in for the Moorish detail;
   * individual turret domes are not modelled.
   */
  b6_theatre_206662303: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'arcade', arches: 5, storeys: 1, material: 'terracotta', on: 'front' },
      shaft: { storeys: 2, windows: 'pedimented', material: 'terracotta' },
      top: { kind: 'attic', storeys: 1, material: 'terracotta' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'modillion' },
      crown: null,
      frame: { verticals: { kind: 'pier', width: 0.6, at: 'corners' }, horizontals: null, recess: 0, material: 'terracotta' },
      entrance: { at: 'centre', kind: 'portal', steps: 2 },
      material: 'terracotta',
    })
  },

  /**
   * way/242973692 — Pioneer Building (old_name Pioneer Trunk Factory), 3180 18th St, industrial, 2 levels,
   * 13 m. No photograph. Baked plan (16 vertices) is strictly orthogonal — a wing/light-well industrial box.
   * Built BLIND as the early-1900s brick trunk-factory/loft building it is tagged as: plain punched windows,
   * heavy cornice, shopfront-scale ground for the Mission's 18th St corridor.
   */
  b6_industrial_242973692: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 5, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 2, windows: 'wide', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/220522604 — Harding Theater, 616 Divisadero St, 13 m. No photograph. Web search: 1926 Gothic/Moorish
   * movie theatre (Reid Brothers), heavily cast-ornamented facade, later an arcade bar retaining historic
   * mouldings. Baked plan (8 vertices) is a clean orthogonal box with one notch. Built with an ornamented
   * ground arcade and a decorative crown standing in for the lost cast detail; ornament is a kit PARAMETER.
   */
  b6_theatre_220522604: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'arcade', arches: 3, storeys: 1, material: 'terracotta', on: 'front' },
      shaft: { storeys: 2, windows: 'dressed', material: 'stucco' },
      top: { kind: 'attic', storeys: 1, material: 'terracotta' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'bracketed' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 2 },
      material: 'stucco',
    })
  },

  /**
   * way/273181546 — Koshland House ("Le Petit Trianon"), 3800 Washington St, Presidio Heights, 13 m. No
   * photograph. Web search: 1902-04 Classical Revival mansion (Franklin S. Van Trees), a near-replica of Le
   * Petit Trianon at Versailles — a giant colonnaded/pedimented front, symmetrical, rusticated ground.
   * Baked plan (12 vertices) is strictly orthogonal, a rectangle with shallow wings; the rotunda and atrium
   * are interior, not plan curves, so the kit is not defeated. Built as a giant-order classical front.
   */
  b6_mansion_273181546: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: {
        kind: 'giant-order', columns: 6, storeys: 2, order: 'corinthian', windows: 'pedimented',
        engaged: false, flanks: true, pediment: true, material: 'limestone', on: 'front',
      },
      shaft: null,
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: null, belowTop: 'string', top: 'dentil' },
      crown: null,
      frame: { verticals: { kind: 'quoins', width: 0.5, at: 'corners' }, horizontals: null, recess: 0, material: 'limestone' },
      entrance: { at: 'centre', kind: 'portal', steps: 4 },
      material: 'limestone',
    })
  },

  /**
   * way/121024973 — Cafe du Nord / Swedish American Hall, 2170-2174 Market St, commercial, 3 levels + 1
   * underground, 13 m. No photograph. Web search: 1907 Arts and Crafts hall, wood shingle and brick primary
   * facade, expressive woodwork. Baked plan (7 vertices) is a clean orthogonal box. Built as a shingled
   * Arts-and-Crafts commercial hall with a plain dark-brick shopfront base (Cafe du Nord's street entrance).
   */
  b6_hall_121024973: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 3, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 2, windows: 'balanced', material: 'stucco' },
      top: { kind: 'attic', storeys: 1, material: 'stucco' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 1 },
      material: 'stucco',
    })
  },

  /**
   * way/260351423 — Victoria Theatre, 2961 16th St, Mission, 1908, 13 m. No photograph. Web search: ornate
   * Edwardian-era theatre (O'Brien & Werner), the oldest operating theatre in SF; facade detail is not
   * documented beyond "ornate and stately". Baked plan (11 vertices) is strictly orthogonal. Built as a
   * modest ornamented theatre front — arcaded ground, banded brick shaft.
   */
  b6_theatre_260351423: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'arcade', arches: 3, storeys: 1, material: 'dark-brick', on: 'front' },
      shaft: { storeys: 2, windows: 'balanced', material: 'brick' },
      top: null,
      bands: { aboveGround: 'cornice', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/263823315 — Mish House (alt_name Sarah Mish House), 1153 Oak St, Haight-Ashbury, 1885, 13 m. No
   * photograph. Web search: Stick-Eastlake Victorian, sunburst brackets and rosettes typical of the style.
   * Baked plan (16 vertices, ~12.6x26.4m footprint) is strictly orthogonal with ONE 2.6m x 5.8m
   * projecting bay on the front (not a repeating rhythm — a single Victorian bay window, drawn by the ring
   * itself). Built as a narrow Stick-Eastlake rowhouse: small punched windows, a stoop entrance, timber.
   */
  b6_house_263823315: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 1, material: 'stucco' },
      shaft: { storeys: 2, windows: 'small', material: 'stucco' },
      top: { kind: 'attic', storeys: 1, material: 'stucco' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'bracketed' },
      crown: null,
      frame: { verticals: { kind: 'pilaster', width: 0.3, at: 'corners' }, horizontals: null, recess: 0, material: 'stucco' },
      entrance: { at: 'centre', kind: 'door', steps: 3, stoop: { height: 1, splay: 0.2 } },
      material: 'stucco',
    })
  },

  /**
   * way/260353691 — Union Hotel, 2030 Mission St, SRO hotel, 13 m. No photograph. Baked plan (5 vertices) is
   * a clean, very elongated (30.6m x 7.2m) orthogonal strip along Mission St. Built BLIND as a plain
   * early-1900s SRO/commercial hotel typical of the corridor: ground-floor shopfronts, plain brick above.
   */
  b6_hotel_260353691: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 4, storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 2, windows: 'small', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
  },

  /**
   * way/169204245 — Rainbow Grocery Coop, 1745 Folsom St, `building=hall`, SoMa, no OSM height tag. No
   * photograph. Web search: a former warehouse the co-op bought and converted (~30,000 sqft). Baked plan
   * (18 vertices, ~61x76m) is orthogonal, just off-axis by ~5-6 degrees from the city grid (two flat
   * orthogonal families 5-6 degrees apart — `edgeAt()` handles this, the kit is not defeated). Own height
   * estimate: 11 m (a one-and-a-mezzanine SoMa warehouse; no tag to disagree with, so this is a plain guess).
   * Built as a plain converted brick/concrete warehouse with a wide loading-dock-scale ground floor.
   */
  b6_warehouse_169204245: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 8, storeys: 1, material: 'concrete' },
      shaft: { storeys: 1, windows: 'horizontal', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 0 },
      material: 'brick',
    })
  },

  /**
   * way/256487848 — Sacred Heart Cathedral Preparatory School, `building=school`, no OSM height tag. No
   * photograph. Web search: the school's current building at this address was built new in 1980, replacing
   * an older (demolished 1981) structure — so this is a modern institutional building, not the historic
   * Gothic Sacred Heart High. Baked plan (4 vertices) is a perfect 56.8m x 36.9m rectangle. Own height
   * estimate: 15 m (3 storeys, typical for a 1980s SF school block; no tag to disagree with). Built as a
   * plain, deliberately unornamented modern school block — "if that genuinely is the building, say so".
   */
  b6_school_256487848: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 1, material: 'concrete' },
      shaft: { storeys: 3, windows: 'horizontal', material: 'precast' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 2 },
      material: 'precast',
    })
  },

  /**
   * way/68876388 — Richmond / Senator Milton Marks Branch Library, 351 9th Ave, `building=library`, 2
   * levels, 12 m. No photograph. Web search: 1914 Bliss & Faville Classical Revival Carnegie library,
   * sandstone and reinforced concrete, San Francisco's first Carnegie branch. Baked plan (22 vertices) is
   * strictly orthogonal, a wing-and-recess civic box. Built as a small classical Carnegie library front.
   */
  b6_library_68876388: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: {
        kind: 'portico', columns: 4, storeys: 1, order: 'ionic', pediment: true, steps: 5,
        projecting: true, material: 'sandstone', on: 'front',
      },
      shaft: { storeys: 1, windows: 'dressed', material: 'sandstone' },
      top: null,
      bands: { aboveGround: null, belowTop: 'string', top: 'dentil' },
      crown: null,
      frame: { verticals: { kind: 'quoins', width: 0.5, at: 'corners' }, horizontals: null, recess: 0, material: 'sandstone' },
      entrance: { at: 'centre', kind: 'portal', steps: 5 },
      material: 'sandstone',
    })
  },

  /**
   * way/132605490 — DNA Lounge, 375 11th St, SoMa nightclub, no OSM height tag. No photograph. Web search:
   * "sparsely decorated two-level venue" in an ordinary SoMa building, no distinguishing exterior form
   * documented. Baked plan (4 vertices) is a perfect 30.6m x 14.8m rectangle. Own height estimate: 9 m (two
   * levels, industrial-scale floor-to-floor; no tag to disagree with). Built deliberately plain: a shaft
   * alone with a signage-scale shopfront ground is genuinely what this building is.
   */
  b6_nightclub_132605490: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 3, storeys: 1, material: 'dark-stone' },
      shaft: { storeys: 1, windows: 'wide', material: 'concrete' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'concrete',
    })
  },
}
