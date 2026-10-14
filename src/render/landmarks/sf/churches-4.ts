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
import { prism, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { towerRing } from '../tower.ts'
import { church, crossFinial } from '../church.ts'
import { placed } from '../kit.ts'

/* ================================================================== the onion-dome kit gap */

/**
 * A Russian Orthodox onion dome on its drum: the shape `church()`'s `Tower.top` cannot say.
 *
 * **The kit-gap check.** `churchTower()`'s only bulbous option is `top: 'dome'`, which calls `kit.ts`'s
 * `dome()` — a quarter-circle profile whose radius is MONOTONICALLY DECREASING from the springing to the
 * point (`dome()`, six rings each `cos(a)` of the last, `a` running 0→90°). That is a hemispherical cap. An
 * onion dome's silhouette is the opposite: the radius first GROWS past the drum's own width (the bulge, at
 * roughly a fifth of the way up) and only then narrows, through a concave neck, to the point. No
 * `Tower['top']` value produces a non-monotonic radius — `'lantern'` and `'dome'` are the only bulbous
 * options at all, and both read as Italianate/Spanish-colonial silhouettes, the wrong religion for a
 * building whose entire identity is its onion domes. Substituting either would be exactly the quiet
 * approximation the brief says not to make.
 *
 * **Reported as a kit gap**: `Tower['top']` needs an `'onion'` case with a non-monotonic (bulge-then-neck)
 * radius profile, or `churchTower()` needs to take an explicit profile.
 *
 * Built here as a stack of `prism` rings following a bulge-then-neck radius profile, axis-symmetric so it
 * takes no heading, capped by a spike and a three-bar Orthodox cross (`crossFinial`, already in the kit).
 */
function onionDome(out: MeshBuilder, cx: number, cz: number, y0: number, r: number, h: number,
                   colour: Rgb, trim: Rgb): void {
  const profile: [number, number][] = [[0, 1.0], [0.16, 1.32], [0.34, 1.18], [0.55, 0.78], [0.78, 0.34], [1, 0.04]]
  for (let k = 0; k < profile.length - 1; k++) {
    const [u0, f0] = profile[k]
    const [u1, f1] = profile[k + 1]
    prism(out, cx, cz, y0 + u0 * h, y0 + u1 * h, r * f0, 12, colour, 0, r * f1, k === profile.length - 2)
  }
  prism(out, cx, cz, y0 + h, y0 + h * 1.1, Math.max(0.08, r * 0.05), 8, trim, 0, 0.01)
  crossFinial(out, { x: cx, z: cz }, y0 + h * 1.1, Math.max(1, r * 1.15), trim)
}

/** A drum: the plain cylindrical neck an onion dome always stands on. */
function drum(out: MeshBuilder, cx: number, cz: number, y0: number, r: number, h: number, colour: Rgb): void {
  prism(out, cx, cz, y0, y0 + h, r, 12, colour, 0, r, false)
}

/**
 * Holy Virgin Cathedral ("Joy of All Who Sorrow"), way/286435447 — Russian Orthodox Church Outside Russia,
 * `archetype: church`, baked ring ~19.7 × 29.8 m, 5 levels / 19 m tag. A Russian Orthodox cathedral's
 * silhouette IS its onion domes, so this is `church()` for the hall (nave, front, walls — the parts the kit
 * says perfectly well), **plus a hand-built drum-and-dome group for the one part it cannot say.**
 *
 * `tower: null` in the `church()` call: the dome sits on a drum on the ROOF, not on a `churchTower()` shaft
 * rising from the ground, so it is built separately and placed with the exact same transform `church()` uses
 * internally (`towerRing(fit)` → its bounding box → `placed()` with the same `alongZ`/`cx`/`cz` church()
 * computes), so the dome lands centred on the same footprint the nave was fitted to, not a guess.
 *
 * Restrained without a photograph: real Russian Orthodox cathedrals often cluster five domes (one over the
 * crossing, four smaller at the corners); with nothing here to confirm a count, this uses ONE large dome
 * over the roof's centre — the single most identifying feature — rather than inventing four more nobody
 * confirmed. `front.kind: 'mission'` is the plainest flat-parapet front the kit offers, since nothing argues
 * for Gothic ornament on an Orthodox building; `walls.material: 'stucco'` for a painted masonry cathedral.
 *
 * **Roof-colour kit gap, already recorded, directly relevant here**: `church()`'s stucco roof colour is a
 * fixed terracotta-brown with no gold/gilt option (churches-3.ts's Saint Joseph's note). The real domes are
 * gold-leafed; this hand-built dome reuses that same fixed brown so the building stays internally
 * consistent, rather than inventing an unmatched "gold" RGB found nowhere else in the kit.
 */
export function holyVirginCathedral(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 3, storeys: 1, roof: 'hip', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: null,
    front: { kind: 'mission', portal: 'triple', window: 'oculus', steps: 3 },
    walls: { material: 'stucco', openings: 'round', buttresses: 'none' },
  })

  // the same bounding-box + orientation computation church() makes internally (see church.ts's own `church()`)
  const ring = towerRing(fit)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  const alongZ = (z1 - z0) >= (x1 - x0)
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const minSpan = Math.min(x1 - x0, z1 - z0)

  const H = fit.height > 4 ? fit.height : 12
  const roofBrown: Rgb = [0.45, 0.28, 0.2]
  const trim: Rgb = [0.72, 0.62, 0.4]
  const r = Math.max(2.2, minSpan * 0.28)
  const domeGroup = new MeshBuilder()
  drum(domeGroup, 0, 0, H * 0.75, r, H * 0.55, roofBrown)
  onionDome(domeGroup, 0, 0, H * 0.75 + H * 0.55, r, r * 2.1, roofBrown, trim)
  placed(out, domeGroup, alongZ ? Math.PI : -Math.PI / 2, cx, cz)
}

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
  holyVirginCathedral,
  saintJohnsPresbyterian,
  starOfTheSea,
  way223211125Church,
  way277035386Church,
  way286297924Church,
  way260152155Church,
}
