/**
 * The seven churches `docs/sf-batches/ESCALATIONS.md` names from batch 5 and batch 6, none of which had ever
 * reached `church()` (src/render/landmarks/church.ts) before now. **No photograph exists under
 * `docs/shots/refs/` for any of the seven** (checked by id, not by folder, per the escalation brief), so every
 * one of these is built restrained and plainly massed from its baked ring and OSM tags alone. A brief web
 * search was tried for the two named, distinctive buildings (Holy Virgin Cathedral, Star of the Sea) for style
 * context only — **plan geometry below comes from the baked ring**
 * (`tools/cache/bake/san-francisco/tiles/*.json`), never from the search, per the brief.
 *
 * Six of the seven are ordinary nave/tower forms the `church()` kit says directly, the same outcome as all four
 * of `churches-3.ts`. **One, Holy Virgin Cathedral, needed hand-built primitives for its onion domes — a real
 * kit gap, not a substitution.** See its doc comment for the measurement against `kit.ts`'s `dome()`.
 *
 * Registered through ../index.ts; placed by public/landmarks/san-francisco/churches-4.json.
 */
import { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { church } from '../church.ts'

/**
 * Saint John's Presbyterian Church, way/274615294 — `archetype: church`, baked ring ~38.7 × 22.5 m, 4 levels
 * / 15 m tag. No photograph, no distinctive tag beyond `church`, so this is the textbook restrained parish
 * form: a single front-corner tower, gabled nave, square-ended chancel (no apse claimed without evidence of
 * one), plain lancet openings. `walls.material: 'brick'` — the ordinary San Francisco Presbyterian choice —
 * with nothing in the tags to argue for stone.
 */
export function saintJohnsPresbyterian(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 5, storeys: 1, roof: 'gable', pitch: 'moderate' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-corner', stages: 3, plan: 'square', top: 'pyramid' },
    front: { kind: 'gable', portal: 'single', window: 'wheel', steps: 2 },
    walls: { material: 'brick', openings: 'lancet', buttresses: 'plain' },
  })
}

/**
 * Star of the Sea Catholic Church, way/274858124 — `archetype: church`, baked ring ~35.7 × 58.5 m, **70
 * vertices**, batch 6 measured `form.arc: 8` against `form.ortho: 57` (mostly orthogonal with one genuine
 * curved run) and escalated on BOTH tag and geometry: "two monotonic heading sweeps (curved apse/tower,
 * curved corner) plus a chamfered bay rhythm on the long faces."
 *
 * **The curve decision.** `church()`'s `Chancel.kind: 'apse'` already builds a half-octagon — flat facets
 * that read as round from a shot's distance, which is exactly what the escalation's "curved apse" sweep is
 * (a real church apse is a shallow polygon in plan, not a true arc; OSM's own curve here is the ring's usual
 * arc-tessellation of that same polygon). `Tower.plan: 'octagon'` is the same approximation for the "curved
 * tower" sweep — an octagonal tower reads round at range, which is the only thing a monotonic-heading
 * sweep in a baked ring actually asks a kit to reproduce. **Neither sweep needs new geometry**: the kit
 * already carries the vocabulary for "reads round, built flat." The **chamfered bay rhythm** on the long
 * faces is a facade DETAIL below the kit's slot vocabulary (there is no per-bay chamfer option in `Walls`)
 * and, with no photograph to confirm its exact rhythm, is left off rather than guessed at — restrained and
 * plainly massed, per the brief, beats inventing a bay pattern nobody has seen. So: **kit only, no
 * primitives**, using `octagon`/`apse` as the round-reading approximations the escalation's own geometry
 * calls for.
 *
 * The 58.5 m long / 35.7 m short baked extent and the crossing-scaled plan argue for a fuller parish church
 * than the other five here: aisles, a projecting transept (Star of the Sea's real building has one), and a
 * two-stage front-corner tower matching its modest 12 m tag (corrected up slightly to 14 m as a nave ridge —
 * the tag reads as an eaves height on a building this footprint size, not a ridge, and 12 m would leave next
 * to no roof pitch to work with; a small, stated correction, not a guess at ornament).
 */
export function starOfTheSea(out: MeshBuilder, fit: Fit): void {
  church(out, { ...fit, height: Math.max(fit.height, 14) }, {
    nave: { bays: 6, storeys: 1, roof: 'gable', pitch: 'moderate' },
    aisles: { roof: 'lean-to' },
    transept: { ends: 'projecting' },
    chancel: { kind: 'apse' },
    tower: { at: 'front-corner', stages: 3, plan: 'octagon', top: 'spire' },
    front: { kind: 'gable', portal: 'triple', window: 'rose', steps: 3 },
    walls: { material: 'limestone', openings: 'round', buttresses: 'plain' },
  })
}

/**
 * way/223211125 — `church`, `amenity=place_of_worship`, baked ring ~49.4 × 29.8 m, 4 levels / 14 m tag. No
 * photograph, no name in the tags. Built plainly: a single front-centre tower (the widest, most generic
 * choice with nothing arguing for corner or twin towers), plain gable front, square chancel.
 */
export function way223211125Church(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'moderate' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-centre', stages: 2, plan: 'square', top: 'belfry' },
    front: { kind: 'gable', portal: 'single', window: 'oculus', steps: 2 },
    walls: { material: 'brick', openings: 'round', buttresses: 'none' },
  })
}

/**
 * way/277035386 — `church`, baked ring ~37.6 × 28.8 m, 3 levels / 13 m tag. No photograph, no name. Built
 * plainly, one storey lower and one stage shorter than 223211125 to match its lower tag, otherwise the same
 * restrained treatment: front-corner tower, plain gable front, square chancel.
 */
export function way277035386Church(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-corner', stages: 2, plan: 'square', top: 'pyramid' },
    front: { kind: 'plain', portal: 'single', window: 'none', steps: 1 },
    walls: { material: 'stucco', openings: 'square', buttresses: 'none' },
  })
}

/**
 * way/286297924 — `church`, baked ring ~17.0 × 56.5 m (a narrow, long lot), 3 levels / 13 m tag. No
 * photograph, no name. The extreme length-to-width ratio (over 3:1) is a narrow urban parish lot, so this is
 * a long, plain hall with no aisles (there is no width to spare for them) and one front tower.
 */
export function way286297924Church(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 7, storeys: 1, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-corner', stages: 2, plan: 'square', top: 'flat' },
    front: { kind: 'plain', portal: 'single', window: 'oculus', steps: 1 },
    walls: { material: 'brick', openings: 'round', buttresses: 'none' },
  })
}

/**
 * way/260152155 — `church`, baked ring ~17.7 × 21.9 m (the smallest of the seven, only 7 vertices — a
 * simple box), 3 levels / 13 m tag. No photograph, no name. The smallest, plainest form the kit offers: no
 * tower at all (there is not enough footprint to give one a stable base without it reading as a gatehouse),
 * a plain front, a square chancel.
 */
export function way260152155Church(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 3, storeys: 1, roof: 'gable', pitch: 'moderate' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: null,
    front: { kind: 'gable', portal: 'single', window: 'oculus', steps: 1 },
    walls: { material: 'stucco', openings: 'square', buttresses: 'none' },
  })
}

export const CHURCHES_4: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  saintJohnsPresbyterian,
  starOfTheSea,
  way223211125Church,
  way277035386Church,
  way286297924Church,
  way260152155Church,
}
