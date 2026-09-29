/**
 * The two presets `docs/PRESET-TRIAGE.md` singled out of a 216-builder triage of bare presets: the only two
 * judged genuinely church-shaped rather than boxy-facade buildings wearing a `place_of_worship` tag. Both
 * predate `church()` (src/render/landmarks/church.ts) and are rebuilt on it here — no scratch modelling, per
 * the triage note.
 *
 * Both are placed with their real OSM ring (`osm`, no `lat`/`lon`/`size`), so `church()` fits straight to the
 * footprint and derives the nave's length and width from it, per the module's own convention.
 *
 * Registered through ../index.ts; placed by public/landmarks/san-francisco/tierA-2.json and tierA-3.json (the
 * manifest entries that used to name the old presets now name these two builders instead — see the notes on
 * each function for what reference was available).
 */
import { MeshBuilder } from '../../buildings.ts'
import type { Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { church } from '../church.ts'
import { faceBand, towerRing, type Face } from '../tower.ts'
import { edgeAt } from '../parts.ts'
import { placed, dome } from '../kit.ts'
import { portal, lancet } from '../church.ts'

type P2 = { x: number; z: number }

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const put = (out: MeshBuilder, part: MeshBuilder, at: P2, heading: number): void => placed(out, part, heading, at.x, at.z)

const sqRing = (r: number, cx: number, cz: number): P2[] =>
  [{ x: cx - r, z: cz - r }, { x: cx + r, z: cz - r }, { x: cx + r, z: cz + r }, { x: cx - r, z: cz + r }]

const octRing = (r: number, cx: number, cz: number): P2[] =>
  Array.from({ length: 8 }, (_, k) => {
    const a = ((k + 0.5) / 8) * Math.PI * 2
    return { x: cx + Math.cos(a) * r, z: cz + Math.sin(a) * r }
  })

/** One recessed, dark, LOUVRED slot: a void with a few horizontal bars standing across it. Facing +z. */
function louvreSlot(out: MeshBuilder, at: P2, heading: number, y0: number, w: number, h: number, dark: Rgb, bar: Rgb): void {
  const part = new MeshBuilder()
  part.quad([[-w / 2, y0, 0.06], [w / 2, y0, 0.06], [w / 2, y0 + h, 0.06], [-w / 2, y0 + h, 0.06]], [0, 0, 1], UV, dark, 0)
  const n = 5
  for (let i = 0; i < n; i++) {
    const yy = y0 + ((i + 0.5) / n) * h
    part.quad([[-w / 2 - 0.03, yy - 0.05, 0.1], [w / 2 + 0.03, yy - 0.05, 0.1], [w / 2 + 0.03, yy + 0.05, 0.1], [-w / 2 - 0.03, yy + 0.05, 0.1]],
      [0, 0, 1], UV, bar, 0)
  }
  put(out, part, at, heading)
}

/**
 * The Church For the Fellowship of All People, 2041 Larkin St (way/260991572) — 1943, an interracial, interfaith
 * congregation founded by Howard Thurman. Redone 2026-09-23 at the owner's request ("it's an interesting one")
 * after a first pass on `church()` undersold it: docs/FELLOWSHIP-CHURCH.md has the full reading, written from
 * `docs/shots/refs/aerials/fellowship-church.jpg` (a black-and-white street photograph of the front, on disk)
 * plus three further photographs (two aerial) the owner supplied but that never reached the session's image
 * store. **This is Art Deco / Moderne, cream stucco, 1920s–30s — not a traditional church form**, and that is
 * why the kit is dropped for it (docs/FELLOWSHIP-CHURCH.md: "mixing `church()` with raw primitives is
 * supported... or drop the kit entirely for this one"): its whole identity is one very slender tower, an
 * octagonal belfry only at the very top, a rounded cap, and angular Deco portals — none of which `ChurchSpec`'s
 * vocabulary (a stage count times a stage height, `'spire'|'steeple'|'belfry'|'pyramid'|'dome'|'lantern'`) can
 * say. Built here from primitives: `tower()` (tower.ts) for the plain boxy nave mass and its dark hipped roof,
 * everything else (the slender tower, the belfry, the dome, the portals, the tracery window) by hand.
 *
 * From the photograph: a very tall, very slender SQUARE shaft at the front-left corner, flat plain stucco but
 * for a recessed vertical channel down its street face and a couple of small square windows — no string
 * courses, no buttresses. Only its TOP stage widens into an octagon, carrying paired tall narrow louvred
 * slots (two per face) with horizontal bars, and the whole thing is capped by a shallow rounded dome with a
 * banded rim at its foot — not a spire, not a cross-topped lantern. The tower reads roughly twice the height
 * of the nave parapet and about a sixth of the frontage's width, hard against the street.
 *
 * The front: three tall pointed-arch doorways side by side (church.ts's `portal()`, whose 'pointed' head is
 * already the two straight jambs meeting at a point rather than a Gothic curve — the angular Deco read the
 * photograph shows), and one tall narrow pointed tracery window above them (`lancet()`). A raked coping along
 * the parapet's top edge, rising toward the tower, stands in for the photograph's stepped/curved shoulder —
 * a flat plane can't reproduce the curve exactly, and a straight rake is the restrained approximation.
 *
 * `church()`'s own `Material` union has no smooth cream Deco stucco (its `'stucco'` triggers a mission-tile
 * roof assumption elsewhere in that module) — moot here since the kit is not used, but noted because the
 * colours below are hand-picked rather than drawn from that table for the same reason.
 */
export function churchForFellowshipOfAllPeople(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  const W = Math.max(8, x1 - x0)
  const cream: Rgb = [0.87, 0.85, 0.78]
  const dark: Rgb = [0.14, 0.14, 0.15]
  const bar: Rgb = [0.3, 0.3, 0.3]
  const naveH = fit.height > 4 ? fit.height : 13

  /*
   * Everything below the tower/portal detail is worked in the footprint's own BBOX frame, not per-edge
   * normals off the raw OSM ring. **The street-facing side is +z, not −z.** `church.ts`'s own module comment
   * says its canonical build is at −z and is then turned a HALF TURN before being placed, because — its own
   * words — "a CITY builder's front faces local +z: render/landmarks.ts rotates a fitted model by bearing +
   * 180°", checked empirically and corrected 2026-09-22 (the same fix is called out in `tools/model-shots.ts`:
   * "The FRONT FACES +z... This comment and the one in render/landmarks.ts both said −z until 2026-09-22,
   * when an agent checked it empirically"). A first pass here built everything on −z directly, with no such
   * flip, and every render came back with a plain, doorless, tower-buried wall: the portals and the tower were
   * real geometry (confirmed with a throwaway vitest dump of the mesh) sitting on the BACK of the building,
   * invisible to a camera that (correctly) looks at +z. So: `z1` is the street, and heading 0 — a part's own
   * drawn-facing-+z, unrotated — is the way anything on the front wall must face.
   *
   * The second bug, independent of the first: the tower's total height was measured against the nave's
   * PARAPET while the roof RIDGE (naveH + hipRise) stood taller than that, so the tower barely broke the
   * roofline even once it was on the right side. Fixed by giving it headroom over the ridge, not just the
   * parapet (see `towerH` below).
   */
  const FRONT_HEADING = 0 // faces +z: the confirmed city convention

  /* ---- the nave: a plain boxy stucco mass under a big dark hipped roof (tower.ts's own `hip` crown) */
  const hipRise = naveH * 0.32
  const ridgeY = naveH + hipRise
  const hipInset = Math.min(3, W * 0.12)
  const face: Face = { kind: 'blank', wall: cream, material: 'stucco' }
  faceBand(out, ring, 0, naveH, face)
  {
    const cx = ring.reduce((s, q) => s + q.x, 0) / ring.length
    const cz = ring.reduce((s, q) => s + q.z, 0) / ring.length
    const insetR = ring.map((p) => {
      const dx = p.x - cx, dz = p.z - cz
      const l = Math.hypot(dx, dz) || 1
      const k = Math.max(0.2, (l - hipInset) / l)
      return { x: cx + dx * k, z: cz + dz * k }
    })
    // the hip roof's sloped facets, closed to a ridge line above the inset top ring
    const top = insetR.map((p) => ({ x: p.x, y: ridgeY, z: p.z }))
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]
      const ta = top[i], tb = top[(i + 1) % ring.length]
      out.quad([[a.x, naveH, a.z], [b.x, naveH, b.z], [tb.x, tb.y, tb.z], [ta.x, ta.y, ta.z]],
        [(a.x + b.x) / 2, hipRise, (a.z + b.z) / 2], UV, dark, 0)
    }
  }

  /* ---- the tower: front-left corner, very slender, square shaft up to an octagon belfry and a dome cap */
  const tR = Math.max(0.7, W / 16)
  // hard against the street, flush with the corner (x0, z1) — "front-left" as seen from the footprint's own −x side
  const towerC: P2 = { x: x0 + tR, z: z1 - tR }

  // roughly twice the nave parapet, per the photograph — comfortably over the ridge too now that hipRise
  // is modest (a first pass had a steeper ridge and measured the tower against the parapet alone, so its
  // dome barely broke the roofline; both numbers are tuned together now)
  const towerH = naveH * 2.2
  const domeH = tR * 1.3
  const belfryH = towerH * 0.16
  const shaftH = towerH - belfryH - domeH
  const octR = tR * 1.28

  faceBand(out, sqRing(tR, towerC.x, towerC.z), 0, shaftH, { kind: 'blank', wall: cream, material: 'stucco' })
  // the recessed vertical channel down the street-facing (+z) side, and a couple of small square windows on it
  const towerFace: P2 = { x: towerC.x, z: towerC.z + tR }
  {
    const strip = new MeshBuilder()
    strip.quad([[-tR * 0.22, 1, 0.03], [tR * 0.22, 1, 0.03], [tR * 0.22, shaftH - 1, 0.03], [-tR * 0.22, shaftH - 1, 0.03]],
      [0, 0, 1], UV, [cream[0] * 0.8, cream[1] * 0.8, cream[2] * 0.8], 0)
    put(out, strip, towerFace, FRONT_HEADING)
  }
  for (const yy of [shaftH * 0.3, shaftH * 0.6]) {
    lancet(out, towerFace, FRONT_HEADING, yy, tR * 0.34, tR * 0.6, 'square', cream)
  }

  const belfryRing = octRing(octR, towerC.x, towerC.z)
  faceBand(out, belfryRing, shaftH, shaftH + belfryH, { kind: 'blank', wall: cream, material: 'stucco' })
  for (let i = 0; i < 8; i++) {
    const e = edgeAt(belfryRing, i)
    const slotW = Math.min(e.L * 0.24, tR * 0.42)
    for (const s of [-1, 1]) {
      const at = { x: e.mid.x + e.tx * s * slotW * 0.85 + e.nx * 0.05, z: e.mid.z + e.tz * s * slotW * 0.85 + e.nz * 0.05 }
      louvreSlot(out, at, e.heading, shaftH + belfryH * 0.16, slotW, belfryH * 0.66, dark, bar)
    }
  }
  // the banded rim at the belfry's head, then the shallow rounded dome — not a spire, not a cross
  const bandY = shaftH + belfryH
  faceBand(out, octRing(octR + 0.15, towerC.x, towerC.z), bandY, bandY + 0.5, { kind: 'blank', wall: dark, material: 'concrete' })
  dome(out, towerC.x, towerC.z, bandY + 0.5, octR * 0.98, domeH, cream, 8)

  /* ---- the front: three angular Deco portals and one tall tracery window, clear of the tower's footprint */
  const clear = x0 + tR * 2.2 // the tower's own width plus a gap, so the doors don't collide with its base
  const groupCx = (clear + x1) / 2
  const runL = (x1 - clear) * 0.86
  const pw = Math.min(1.6, runL * 0.22)
  const ph = pw * 2.1
  const spacing = runL * 0.32
  for (const s of [-1, 0, 1]) {
    portal(out, { x: groupCx + s * spacing, z: z1 }, FRONT_HEADING, pw, ph, 'pointed', [0.9, 0.88, 0.82], { orders: 2, steps: 2 })
  }
  lancet(out, { x: groupCx, z: z1 + 0.02 }, FRONT_HEADING, naveH * 0.62, pw * 0.7, naveH * 0.42, 'pointed', [0.9, 0.88, 0.82])

  // a raked coping along the parapet, rising toward the tower — the restrained stand-in for the photograph's
  // curved/stepped shoulder (a flat plane cannot reproduce a curve, and a straight rake is the honest version)
  {
    const stepH = naveH * 0.14
    out.quad([[x1, naveH, z1], [x0 + tR * 2, naveH + stepH, z1],
      [x0 + tR * 2, naveH + stepH, z1 + 0.5], [x1, naveH, z1 + 0.5]],
      [0, 0.3, 1], UV, cream, 0)
  }
}

/**
 * Saint Mary the Virgin Episcopal Church, 2325 Union St (way/261608748) — 1891, Cow Hollow, described (the
 * manifest's own prior note) as a small rustic wood-shingle Arts & Crafts church with a low tower and a steep
 * roof.
 *
 * **No usable reference photo.** docs/shots/refs/sf-mapillary/way-261608748-01/02/03.jpg were checked; all
 * three are obscured by street trees and parked cars and show the neighbouring Victorian houses on Union
 * Street, not a clearly church-shaped building — nothing in them can be read as this church's massing, tower
 * or portal. So this is built restrained and plainly massed from the description alone: a small gabled hall,
 * one low corner tower, a single doorway, no aisles, no transept, no tracery. `church()` has no wood-shingle
 * material option (facade.ts's `Material` union runs stone/brick/stucco/concrete/glass/bronze) — `dark-brick`
 * is used as the closest available tone to weathered brown shingle, which is a compromise on surface texture
 * the kit cannot avoid, not a claim that this church is built of brick.
 */
export function stMaryTheVirginEpiscopalChurch(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 3, storeys: 1, roof: 'gable', pitch: 'steep' },
    aisles: null,
    transept: null,
    chancel: null,
    tower: { at: 'front-corner', stages: 2, plan: 'square', top: 'pyramid' },
    front: { kind: 'gable', portal: 'single', window: 'lancets', steps: 2 },
    walls: { material: 'dark-brick', openings: 'lancet', buttresses: 'none' },
  })
}

export const CHURCHES_2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  churchForFellowshipOfAllPeople,
  stMaryTheVirginEpiscopalChurch,
}
