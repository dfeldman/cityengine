/**
 * The four churches `docs/sf-batches/ESCALATIONS.md` names as correctly escalated on FORM — batch 2 and batch 4
 * both hit the church kit's own trigger ("There is a `church()` kit; this is it.") and neither batch carries a
 * geometry tool, so none of these four ever reached `church()` (src/render/landmarks/church.ts) until now.
 *
 * All four are built WITH the kit, not from primitives. Unlike the Art Deco church in `churches-2.ts`
 * (docs/FELLOWSHIP-CHURCH.md) — whose tower is square below and only octagonal at its very top, a shape
 * `ChurchSpec`'s vocabulary cannot say — every one of these four is a traditional nave/tower church whose form
 * fits the slot vocabulary directly: a gabled hall with a front tower or twin towers, an apse or a domed
 * crossing. So the kit is the whole job here; no hand-drawn geometry is added alongside it.
 *
 * References: two of the four have a usable photograph, both filed under `docs/shots/refs/batch5/` even
 * though the id, not the folder name, is what matters (per the escalation brief) —
 *   - `batch5/way-160163535.jpg` / `-2.jpg` — Saint Joseph's Arts Society.
 *   - `batch5/way-261273676.jpg` (its `-2.jpg` sibling shows the WRONG building, a blue-sided house down the
 *     block, and is not used).
 * Saint Anne of the Sunset and Saint Ignatius have no photograph anywhere under `docs/shots/refs/` (confirmed
 * by search) and no web research was done per the brief, so both are built restrained from their OSM tags and
 * the plan-geometry description in ESCALATIONS.md/b2.ts/b4.ts alone — a modest, correctly-massed church rather
 * than a guess at ornament neither ever showed us.
 *
 * Saint Ignatius (`way/225193440`) carries two of its own `building:part`s (`way/1028575826`,
 * `way/1028575827`, per batch 2's note) sitting inside its own bounding box. Both are claimed by this entry's
 * manifest `osm` array (BUGS.md #156's pattern: list the real outline FIRST so `place()`/`towerRing()` fits to
 * it, then list the parts after so the tile bake does not draw them a second time as their own boxes).
 *
 * Registered through ../index.ts; placed by public/landmarks/san-francisco/churches-3.json.
 */
import { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { church } from '../church.ts'

/**
 * Saint Anne of the Sunset Catholic Church, way/267102407 — active Catholic parish, `building=church`. No
 * photograph. ESCALATIONS.md/b4.ts both describe the plan as "textbook nave/aisle/apse/tower", 45 vertices, so
 * that description IS the reference: a full parish-church plan with side aisles, an apsidal chancel and one
 * corner tower — built plainly, no ornament invented beyond what "textbook Gothic/Romanesque parish church"
 * implies. `walls.material: 'brick'` is the ordinary choice for an early-20th-century Sunset District parish
 * church of this size; there is nothing in the tags or the plan that argues for stone instead.
 */
export function saintAnneOfTheSunset(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 5, storeys: 1, roof: 'gable', pitch: 'moderate' },
    aisles: { roof: 'lean-to' },
    transept: null,
    chancel: { kind: 'apse' },
    tower: { at: 'front-corner', stages: 3, plan: 'square', top: 'spire' },
    front: { kind: 'gable', portal: 'triple', window: 'rose', steps: 3 },
    walls: { material: 'brick', openings: 'lancet', buttresses: 'plain' },
  })
}

// Saint Ignatius moved to its own model from photographs, sf/st-ignatius.ts (2026-10-05).

/**
 * Saint Joseph's Arts Society, way/160163535 — a secular arts venue today, but `old_name` and the photograph
 * (`docs/shots/refs/batch5/way-160163535.jpg`, `-2.jpg`) both confirm the unaltered former Saint Joseph's Roman
 * Catholic Church: cream stucco, round-arched nave windows, and a domed bell tower carrying a small gilded
 * cupola visible over the roofline from a block away. Built AS that church, not as an "arts society" — the
 * brief's own rule for a converted building that still reads as its original form.
 *
 * `tower.top: 'dome'` and `plan: 'octagon'` are the photograph's drum-and-dome silhouette; `front.kind:
 * 'pediment'` is the plain triangular pediment visible over the street-facing bay to the photograph's left.
 * `walls.material: 'stucco'` matches the cream wall colour directly; `church()` has no wood/shingle option in
 * its `Material` union, but this building does not need one — the photograph shows plain smooth stucco, not
 * shingle, so no compromise is being made here (unlike St Mary the Virgin in `churches-2.ts`).
 *
 * **Height.** The tag (47 m, filed under `tall` in `docs/sf-buildings.csv`) is wildly out of scale with the
 * photograph, which shows an ordinary 3–4 storey mass with one modest domed tower — nothing like a 47 m
 * building. Per the escalation brief's own rule ("if the reference disagrees with the tagged height, believe
 * the reference"), the manifest here carries a corrected ~16 m nave ridge instead, with the domed tower rising
 * a further storey above it.
 *
 * **Kit gap, undocumented until now**: `church()`'s dome/roof colour for `walls.material: 'stucco'` is a
 * fixed hardcoded terracotta-brown (`build()`'s own `roofC`, not exposed anywhere in `ChurchSpec`), so the
 * render's dome comes out brown-tiled rather than the photograph's gilded gold. There is no spec key to say
 * gold, and adding one, or a hand-painted gold cap after the fact, is more than this task's scope — noted as a
 * compromise the same way `churches-2.ts` notes the missing wood/shingle material, not silently worked around.
 */
export function saintJosephsArtsSociety(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 4, storeys: 1, roof: 'hip', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: null,
    tower: { at: 'front-centre', stages: 2, plan: 'octagon', top: 'dome' },
    front: { kind: 'pediment', portal: 'single', window: 'oculus', steps: 2 },
    walls: { material: 'stucco', openings: 'round', buttresses: 'none' },
  })
}

export const CHURCHES_3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  saintAnneOfTheSunset,
  saintJosephsArtsSociety,
}
