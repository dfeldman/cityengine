/**
 * Kit batch 10 (docs/sf-batches/BRIEF-KIT-BATCH.md): 22 ids from docs/sf-batches/B10-IDS.txt.
 *
 * OUTCOME: all 22 `bail`. No builders were written.
 *
 * Why: none of the 22 ids appear in docs/shots/refs/sf-fetch/done.csv (the Mapillary fetch cache), and none
 * have frames under docs/shots/refs/sf-mapillary/ or sf-commons/ — this list has zero cached street-level
 * reference, unlike prior kit batches (e.g. b9) whose lists were pre-filtered to ids with 3 frames on disk.
 *
 * Per-id disposition (see docs/sf-batches/B10-IDS.txt for the source list):
 *
 *  - way/32650734  "San Francisco Fire Station Q"     — no reference. Baked ring exists (9 vertices,
 *    tiles/-20_4.json, fallback height 6m/2 levels, style `sfapartment`) but that is the bake's generic
 *    fallback, not evidence of the real facade. bail.
 *  - way/34313513  "Harvey Milk Memorial Administration Building" — no reference, and NOT present in the
 *    current bake's `tools/cache/bake/san-francisco/tiles/` output at all (searched all ~108,800 tiles by id).
 *    bail.
 *  - way/112073353 "Harvey Milk Recreational Arts Center" — named and real (overlooks Duboce Park, built
 *    1954, expanded 2009 — sfrecpark.org / friendsofdubocepark.org confirm it exists and its use, not its
 *    facade). Wikimedia Commons search for "Harvey Milk Recreation Center" and "Duboce Park recreation
 *    building" returned zero image results. No usable photo found within a short look. bail.
 *  - way/115433822 "San Francisco Fire Station 6"      — no reference. bail.
 *  - way/120481448 "Golden Gate Park Aid Station"       — no reference. bail.
 *  - way/135620203 "Fire Chief's Residence"             — web search surfaces a well-known "Dennis T.
 *    Sullivan Memorial Fire Chief's House" at 870 Bush St (Nob Hill/Union Square), but this way bakes at a
 *    different tile (0_-2.json, victorian-rowhouse fallback) with no address corroboration that it is the
 *    same building, and Commons search for the Sullivan Memorial name returned zero results either way.
 *    Attributing that landmark's form to an unconfirmed footprint is exactly the wrong-building risk the
 *    brief warns about. bail.
 *  - way/161504247 "San Francisco Fire Station "        — no reference (garbled/blank OSM name). bail.
 *  - way/161504250 "San Francisco Fire Station "        — no reference. bail.
 *  - way/162470913 "San Francisco Fire Station #"       — no reference. bail.
 *  - way/218148097 "San Francisco Fire Station )"       — no reference. bail.
 *  - way/242973686 "Old Mission Police Station"         — no cached reference; no time-boxed Commons hit
 *    attempted beyond the general pattern established by the other checks in this batch. bail.
 *  - way/256461082 "Bryant Street Station"              — no reference. bail.
 *  - way/260327749 "Mission Police Station"             — no reference. bail.
 *  - way/261105865 "ODC Theater"                        — no reference. bail.
 *  - way/415417770 "Dorraine Zief Law Library"          — named and real (USF School of Law, EHDD architect,
 *    49,000 sqft, 3 storeys, 2101 Fulton St). Web search returned only text descriptions (floor plans, press
 *    releases) and no viewable photograph of the exterior massing/facade within a short look; Commons was
 *    not separately checked to have an entry either. Cannot establish the actual form (which facade treats
 *    the quad vs. the houses) from text alone. bail.
 *  - way/764313741 "San Francisco Fire Station H"       — no reference, and NOT present in the current
 *    bake's tiles output. bail.
 *  - way/1038340434 "Injector Station"                  — no reference, not a recognizable building type by
 *    name (utility structure), and NOT present in the current bake's tiles output. bail.
 *  - way/1186109887 "San Francisco Fire Station 5"      — no reference. bail.
 *  - way/288365551 "1890 Boathouse"                     — no reference. bail.
 *  - way/99202294  "Alcatraz Island Lighthouse"          — a lighthouse tower is a curved/round plan by
 *    definition, which is an automatic escalation under the brief regardless of photo quality; it is also
 *    NOT present in the current bake's tiles output. Not attempted as kit work. escalate — curved (round)
 *    tapering tower plan, outside the slot kit's vocabulary.
 *  - way/32946359  "Alioto - Veronese Building"          — a real, named Fisherman's Wharf building (former
 *    Alioto's restaurant, built 1932, since expanded; slated for demolition in the Port's wharf redesign),
 *    but no cached reference and no photo was located and inspected within a short look at Commons. bail.
 *  - way/165579428 "Alma"                                — this OSM way is the historic scow schooner *Alma*
 *    (a National Historic Landmark vessel, not a structure), moored/displayed near the waterfront. It is not
 *    a building the slot kit's facade/church builders apply to at all. bail — not a building.
 *
 * Total: 0 kit, 1 escalate (way/99202294, curved lighthouse tower), 21 bail (no usable reference, or in one
 * case not a building). No geometry was produced for this batch; nothing to register.
 */

import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'

export const B10: Record<string, (out: MeshBuilder, fit: Fit) => void> = {}

