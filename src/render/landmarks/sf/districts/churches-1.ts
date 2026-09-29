/**
 * San Francisco's places of worship, modelled with the church kit (src/render/landmarks/church.ts).
 *
 * docs/INSTITUTIONS.md: 187 places of worship in the OSM cut, 15 modelled, 37 refaced, 135 with nothing. These
 * are the first two built with `church()` rather than with a style rule, and they are here to prove the kit on
 * real buildings rather than on a demo stage.
 *
 * **Both are placed by `lat`/`lon`/`size`, not fitted to their OSM outline, and that is deliberate.** Each of
 * these two OSM ways is a single outline covering the church AND its attached school or parish house: Saints
 * Peter and Paul's is 49 × 53 m and Old Saint Mary's 45 × 49 m, where the churches themselves are about 30 and
 * 24 m across. Fitted to that box the kit builds a church twice its own width — a real limit of any grammar
 * that takes the footprint as given. The manifest's point-and-size path (render/landmarks.ts: "a point AND a
 * size: placed there at that size, whatever its buildings are") is the existing answer, and the entry still
 * names the `osm` id so the merged outline is removed from the tile.
 *
 * Registered through ../index.ts; placed by public/landmarks/san-francisco/churches-1.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { church } from '../../church.ts'

/**
 * Saints Peter and Paul Church, 666 Filbert Street (way/29902626) — the North Beach icon, facing south across
 * Washington Square. From docs/shots/refs/sf-mapillary/way-29902626-*.jpg: twin square towers at the front
 * corners carrying tall openwork spires with corner pinnacles, a gabled front between them with a rose window
 * over a triple arched portal, and a long flank of pointed-arched windows in two levels over a lower aisle.
 * Pale cast stone throughout; the roof is low-pitched and barely visible from the pavement.
 */
export function saintsPeterAndPaul(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 6, storeys: 2, roof: 'gable', pitch: 'low' },
    aisles: { roof: 'lean-to' },
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'twin', stages: 5, plan: 'square', top: 'spire' },
    front: { kind: 'gable', portal: 'triple', window: 'rose', steps: 5 },
    walls: { material: 'limestone', openings: 'lancet', buttresses: 'plain' },
  })
}

/**
 * Old Saint Mary's Cathedral, 660 California Street (way/260520154) — 1854, the first cathedral in California,
 * facing south onto California Street from the corner of Grant. From
 * docs/shots/refs/sf-mapillary/way-260520154-*.jpg: red brick on a granite base, ONE square tower centred on
 * the front and rising through the gable, its top stage open with pointed openings under a flat parapet with
 * corner pinnacles, a clock below it; a single deep pointed portal on a long flight of steps; stepped
 * buttresses on the front and flank. **No spire** — which is why `top: 'parapet'` had to exist.
 *
 * This is one of the four churches in the owner's review that a style rule got wrong: `rule 1: chinatown zone`
 * dressed an 1854 brick cathedral as a Chinatown shopfront because it stands in Chinatown.
 */
export function oldSaintMarysCathedral(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 5, storeys: 1, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-centre', stages: 5, plan: 'square', top: 'parapet' },
    front: { kind: 'gable', portal: 'single', window: 'none', steps: 6 },
    walls: { material: 'brick', openings: 'lancet', buttresses: 'stepped' },
  })
}

/**
 * Saint Patrick Catholic Church, 756 Mission Street (way/32963425) — 1872, Gothic Revival, wedged among the
 * Yerba Buena towers. From docs/shots/refs/model1/way-32963425*.jpg and a Commons search (photos.md logic in
 * tools/commons.ts): red brick throughout, ONE square tower centred on the gable front (breaking through the
 * gable, not at a corner — the previous `stPatrickChurch` note called it a corner tower; the photographs say
 * otherwise), its top stage an open belfry of twin lancets under a flat, castellated parapet with corner
 * pinnacles and a cross finial — the same composition as Old Saint Mary's, not a spire. A single deep pointed
 * portal on a stone stair; a tall traceried lancet window fills the gable above it. The interior
 * (way-32963425-05/07/08.jpg) shows a proper arcaded nave with a clerestory over lower aisles, and a polygonal
 * apse lit by five tall lancets.
 *
 * **The footprint — checked, and it is the church alone.** way/32963425's outline is ~49 x 26.5 m, and
 * docs/shots/refs/model1/way-32963425.jpg shows a four-storey brick RECTORY sharing its wall — but that
 * building has its own OSM way, `way/118480406` (`building=yes`, unnamed, height 16 m), which shares the
 * church's long flank edge exactly and extends past it. This is NOT the merged-footprint case the other two
 * `church()` buildings hit (a first pass here wrongly assumed it was, placed the church by hand-measured
 * `lat`/`lon`/`size`, and got the front bearing 90 degrees wrong by trusting `model-shots.ts`'s numeric-`front`
 * camera, BUGS.md #117, instead of the footprint's own geometry). The entry now fits `church()` straight to
 * the way, and `front: 135` is the outward-normal bearing of the front wall's own long facets (the ones either
 * side of the tower's forward step), read off the ring with `edgeAt`'s convention — not the direction those
 * edges run in, which is the mistake that produced the wrong number the first time.
 *
 * **What the kit could not be given a free choice on.** `tower.stages` is pinned at the minimum, 2 —
 * `church()` floors a tower's per-stage height at `eaves * 0.52` regardless of `stages` (a landmark's tower
 * must clear its own roof), and this nave's OSM `height` (46, taken as its ridge per the kit's convention) is
 * more than double the two earlier churches'. Tried at 5 stages — the count the photograph's own storeys
 * suggested — and measured: the tower alone passed 90 m total, taller than every glass tower on the block the
 * photographs show it dwarfed by. 2 stages measures 68.8 m total, under its neighbours and still an honest
 * reading of the same photograph (a plain shaft, a belfry, the cresting, just fewer of them). Recorded here
 * because it is a real gap: the formula has no way to keep a materially taller nave's tower in proportion, and
 * `stages` — the one number the spec gives a tower — trades the photograph's own count against the skyline.
 */
export function saintPatrickChurch(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 6, storeys: 2, roof: 'gable', pitch: 'steep' },
    aisles: { roof: 'lean-to' },
    transept: null,
    chancel: { kind: 'apse' },
    tower: { at: 'front-centre', stages: 2, plan: 'square', top: 'parapet' },
    front: { kind: 'gable', portal: 'single', window: 'lancets', steps: 5 },
    walls: { material: 'brick', openings: 'lancet', buttresses: 'stepped' },
  })
}

export const CHURCHES_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  saintsPeterAndPaul,
  oldSaintMarysCathedral,
  saintPatrickChurch,
}
