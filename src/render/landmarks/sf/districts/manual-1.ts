/** Modelled by hand: buildings the ladder bailed out of, where a reference settled what they actually are. */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower, towerRing } from '../../tower.ts'
import { boxAlong, edgeAt, edgeFacing, longestEdge, roundRing, spireOn, stripRoof, bladeSign, marquee, clockFace } from '../../parts.ts'
import { faceBand, insetRing } from '../../tower.ts'
import { capPolygon } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { church } from '../../church.ts'

const PRECAST: [number, number, number] = [0.86, 0.85, 0.81]
const PRECAST_DARK: [number, number, number] = [0.6, 0.59, 0.56]

export const MANUAL_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /*
   * Ghirardelli Square's clock tower block (the old chocolate factory, 1915). The sign on the roof was
   * already here; the building under it was a plain `brick` restyle, which is an odd thing to leave holding
   * one of the city's landmark signs. From the photograph: red brick with WHITE stone window surrounds and a
   * deep dentilled cornice, and on the corner a square brick clock tower with a white terracotta belfry stage
   * and a steep grey spire. The clock is the thing people photograph.
   */
  ghirardelliClockTower: (out, fit) => {
    const ring = towerRing(fit)
    const BRICK: [number, number, number] = [0.72, 0.42, 0.32]
    const STONE: [number, number, number] = [0.93, 0.92, 0.87]
    const H = 18
    tower(out, fit, {
      height: H,
      base: { height: 4.5, face: { kind: 'punched', wall: BRICK, glass: [0.22, 0.24, 0.25], pitch: 3.4, floor: 4.5, solid: 0.62, material: 'brick' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.24, 0.26, 0.27], pitch: 3.4, floor: 4.3, solid: 0.6, material: 'brick' } }],
      cornices: [{ at: H, depth: 0.8, height: 1.1, colour: STONE }],
      crown: { kind: 'parapet', height: 0.9, colour: STONE, material: 'ashlar' },
    })
    // the clock tower on the corner: a brick shaft, a white belfry stage, and the steep spire over it
    const corner = edgeAt(ring, edgeFacing(ring, 0)).a
    spireOn(out, corner, 0, 4.4, 30, 11,
      { colour: BRICK, spireColour: [0.46, 0.48, 0.5], material: 'brick', spireMaterial: 'tile', sides: 4, belfry: true })
    // the white stage under the spire, and a clock face on each side of the shaft
    for (const y of [26.5]) {
      boxAlong(out, corner.x, y, corner.z, 4.9, 1.9, 4.9, 0, STONE, surfaceTag('ashlar'))
    }
    /*
     * A clock face on each side of the shaft. `spireOn` builds its shaft as a polygon of radius r whose flats
     * sit at r*cos(pi/sides) from the centre — 0.707r on a square — so a face hung at r floated well clear of
     * the wall. And the hands want to point at a TIME: at 12 and 3 they made a neat cross, which reads as a
     * crucifix on a tower, not a clock.
     */
    const flat = 4.4 * Math.cos(Math.PI / 4)
    for (let k = 0; k < 4; k++) {
      // spireOn puts its VERTICES at 45 degrees (ring angle (k+0.5)/sides), so the FLATS face the cardinal
      // directions — turning the dials a further quarter step put them on the corners, edge-on
      const a = (k * Math.PI) / 2
      const ox = Math.sin(a)
      const oz = Math.cos(a)
      const fx = corner.x + ox * flat
      const fz = corner.z + oz * flat
      boxAlong(out, fx, 21.5, fz, 1.9, 1.9, 0.1, a, [0.95, 0.94, 0.9], surfaceTag('ashlar'))
      // the dial and its hands, on the real time (render/clocks.ts; owner, 2026-10-04) — no more ten past ten
      clockFace(out, fx + ox * 0.1, 21.5, fz + oz * 0.1, ox, oz, 1.6, { rim: [0.2, 0.2, 0.22], out: 0.02 })
    }
  },

  /*
   * USS Pampanito (1943), moored at Pier 45. The queue takes vessels out of the refacing ladder because no
   * facade style means anything for a hull — this is the whole of that list for San Francisco. A Balao-class
   * submarine: a long black hull barely out of the water, a flat casing deck, the grey sail amidships with its
   * periscopes and masts, and the deck gun forward.
   */
  ussPampanito: (out, fit) => {
    const hull = towerRing(fit)
    const deck = insetRing(hull, 1.1)
    const BLACK: [number, number, number] = [0.13, 0.14, 0.15]
    const GREY: [number, number, number] = [0.42, 0.44, 0.45]
    // the hull: black, sitting low, with the casing deck a little inside it
    faceBand(out, hull, 0, 2.6, { kind: 'blank', wall: BLACK, material: 'metal' })
    capPolygon(out, hull, 2.6, [0.17, 0.18, 0.19], 0)
    faceBand(out, deck, 2.6, 3.1, { kind: 'blank', wall: [0.2, 0.21, 0.22], material: 'metal' })
    capPolygon(out, deck, 3.1, [0.22, 0.23, 0.24], 0)
    // the sail amidships, turned along the hull, with its periscopes and masts
    // heading turns a box onto the wall; tx/tz move along it (parts.ts edgeAt)
    const e = edgeAt(hull, longestEdge(hull))
    const along = e.heading
    const ax = e.tx
    const az = e.tz
    const mid = { x: 0, z: 0 }
    boxAlong(out, mid.x, 3.1 + 2.9, mid.z, 8.0, 2.9, 1.6, along, GREY, surfaceTag('metal'))
    boxAlong(out, mid.x, 3.1 + 6.2, mid.z, 3.0, 0.5, 1.2, along, GREY, surfaceTag('metal'))
    for (const f of [-0.35, 0, 0.35]) {
      boxAlong(out, mid.x + ax * f * 6, 3.1 + 8.6, mid.z + az * f * 6, 0.1, 2.2, 0.1, along, [0.3, 0.31, 0.32], surfaceTag('metal'))
    }
    // the deck gun forward, on its platform
    const gx = ax * 22
    const gz = az * 22
    boxAlong(out, gx, 3.4, gz, 1.6, 0.3, 1.6, along, GREY, surfaceTag('metal'))
    boxAlong(out, gx, 4.1, gz, 0.5, 0.5, 0.5, along, GREY, surfaceTag('metal'))
    boxAlong(out, gx + ax * 2.2, 4.4, gz + az * 2.2, 2.4, 0.12, 0.12, along, [0.28, 0.29, 0.3], surfaceTag('metal'))
  },

  /*
   * Opera Plaza, 601 Van Ness (1982). OSM maps it as SIX ways and no source describes it as one building,
   * which is why the ladder could not make sense of it: three squarish towers of pale precast with rounded
   * corners and balconies, standing on a perimeter block round a raised garden courtyard with a pool. Two of
   * the towers had already been guessed at as `glass-tower` and `hotel-punched` by different batches; these
   * entries supersede both, so all three finally match each other.
   */
  operaPlazaTower: (out, fit) => {
    const ring = roundRing(towerRing(fit), 2.4, 3)
    tower(out, { ...fit, ring }, {
      height: 73,
      base: { height: 20, face: { kind: 'punched', wall: PRECAST, glass: [0.22, 0.24, 0.26], pitch: 3.4, floor: 4.0, solid: 0.7, material: 'concrete' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: PRECAST, glass: [0.2, 0.23, 0.26], pitch: 3.2, floor: 3.2, solid: 0.58, material: 'concrete' } }],
      cornices: [{ at: 20, depth: 0.5, height: 0.5, colour: PRECAST_DARK }],
      crown: { kind: 'parapet', height: 1.2, colour: PRECAST_DARK },
    })
  },

  /*
   * The courtyard itself, as a standalone piece: the whole complex is six OSM ways round a space that belongs
   * to none of them, so the garden deck has to be placed on its own. A paved terrace one storey up, planters
   * and low walls round the edge, the glazed conservatory, and the pool at the east end.
   */
  operaPlazaCourtyard: (out, fit) => {
    const hx = fit.hx
    const hz = fit.hz
    const deck = 5.0
    const slab = [{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: hz }, { x: -hx, z: hz }]
    faceBand(out, slab, deck - 1.2, deck, { kind: 'blank', wall: [0.62, 0.6, 0.57], material: 'concrete' })
    capPolygon(out, slab, deck, [0.74, 0.72, 0.68], 0)
    // the low parapet round the deck (a band on the ring, not four boxes — boxAlong is for one wall, and
    // four of them chased their own headings off across the terrace)
    faceBand(out, slab, deck, deck + 1.0, { kind: 'blank', wall: [0.66, 0.64, 0.6], material: 'concrete' })
    // the pool at one end, and the conservatory beside it
    boxAlong(out, hx * 0.45, deck + 0.08, 0, hx * 0.3, 0.1, hz * 0.34, 0, [0.29, 0.62, 0.72], 0)
    boxAlong(out, -hx * 0.2, deck + 1.8, hz * 0.4, 5.0, 1.8, 3.2, 0, [0.72, 0.78, 0.76], 0)
    // planters: a scatter of low boxes, no planting — the vegetation layer does that
    for (let i = 0; i < 10; i++) {
      const t = (i + 0.5) / 10
      boxAlong(out, -hx + 2 * hx * t, deck + 0.35, -hz * 0.55 + (i % 2) * hz * 0.15, 1.1, 0.35, 1.1, 0, [0.6, 0.58, 0.55], 0)
    }
  },

  /*
   * The perimeter block: five storeys of flats over an OPEN ground floor. The whole slab stands on columns so
   * the courtyard, the car park and the cinema are reachable underneath — which is exactly why every street
   * photograph of this address shows low walls and no tower, and why it should be rideable through.
   */
  operaPlazaBlock: (out, fit) => {
    const ring = roundRing(towerRing(fit), 1.8, 2)
    const OPEN = 5.0
    // the columns the block stands on, round the outside, and a dark recessed wall well behind them
    for (let i = 0; i < ring.length; i++) {
      const e = edgeAt(ring, i)
      const n = Math.max(1, Math.round(e.L / 7))
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n
        const x = e.a.x + (e.b.x - e.a.x) * t
        const z = e.a.z + (e.b.z - e.a.z) * t
        boxAlong(out, x, OPEN / 2, z, 0.55, OPEN / 2, 0.55, e.heading, PRECAST_DARK, 0)
      }
    }
    // the soffit — the underside of the flats — so the undercroft reads as a covered space you can see into,
    // and two service cores. Deliberately NOT a wall round the outside: the ground floor is open
    capPolygon(out, ring, OPEN, [0.26, 0.25, 0.24], 0)
    for (const k of [0.3, 0.7]) {
      const a = ring[Math.floor(ring.length * k)]
      boxAlong(out, a.x * 0.55, OPEN / 2, a.z * 0.55, 3.0, OPEN / 2, 3.0, 0, [0.34, 0.33, 0.31], 0)
    }
    // the flats above, and the shallow dark roof band along the top
    faceBand(out, ring, OPEN, 19.5,
      { kind: 'punched', wall: PRECAST, glass: [0.22, 0.24, 0.26], pitch: 3.2, floor: 2.9, solid: 0.62, material: 'concrete' })
    faceBand(out, ring, 19.5, 21.0, { kind: 'blank', wall: [0.29, 0.36, 0.33], material: 'metal' })
    capPolygon(out, ring, 21.0, [0.32, 0.38, 0.35], 0)
  },

  /*
   * Saint John Coltrane African Orthodox Church, 1286 Fillmore Street: a timber hall church painted in two
   * colours — ochre below, sage above — under a steep shingled gable, with a square corner bell tower carrying
   * a tall brown broach spire and a cross. The ladder bailed out of it: every written source describes the
   * congregation's home as "a simple modernist structure" (they moved to Fort Mason), which is true of where
   * they ended up and not of the building OSM has at this corner. The photograph settled it.
   */
  stJohnColtraneChurch: (out, fit) => {
    const ring = towerRing(fit)
    const ochre: [number, number, number] = [0.9, 0.72, 0.28]
    const sage: [number, number, number] = [0.66, 0.74, 0.5]
    // the nave: an ochre base band under sage walls, tall narrow windows, no cornice
    tower(out, fit, {
      height: 10.5,
      base: { height: 3.2, face: { kind: 'punched', wall: ochre, glass: [0.16, 0.17, 0.19], pitch: 3.0, floor: 3.2, solid: 0.82, material: 'clapboard' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: sage, glass: [0.16, 0.17, 0.19], pitch: 3.0, floor: 7.3, solid: 0.84, material: 'clapboard' } }],
      crown: { kind: 'flat' },
    })
    // the shingled gable over it, and the tower on the street corner with its spire
    stripRoof(out, ring, 10.5, 4.2, [0.44, 0.35, 0.27], 'tile')
    // edgeFacing/longestEdge give an INDEX; edgeAt turns it into the edge itself
    const corner = edgeAt(ring, edgeFacing(ring, 0)).a
    spireOn(out, corner, 0, 2.6, 15.5, 7.5,
      { colour: sage, spireColour: [0.42, 0.24, 0.16], material: 'clapboard', spireMaterial: 'metal', sides: 4 })
  },

  /**
   * Mission San Francisco de Asis / Old Mission Dolores, way/256442765 (1776) — the oldest standing building
   * in San Francisco. Not to be confused with the much larger Mission Dolores Basilica next door
   * (way/256442760), which is a separate building and stays untouched. No usable street photograph (Mapillary
   * marked junk), but the form is unambiguous and well documented: a very plain, very low adobe hall with a
   * flat parapet front pierced by bell niches — the classic mission `espadaña` — no aisles, no transept, no
   * tower. `church()`'s own `front: { kind: 'mission' }` is that exact shape (its doc comment names this
   * building), so this is the kit end to end.
   */
  missionDolores: (out, fit) => {
    church(out, fit, {
      nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'low' },
      aisles: null,
      transept: null,
      chancel: { kind: 'square' },
      tower: null,
      front: { kind: 'mission', portal: 'single', window: 'none', steps: 2 },
      walls: { material: 'stucco', openings: 'square', buttresses: 'none' },
    })
  },

  /**
   * Bimbo's 365 Club, way/262435071, 1025 Columbus Avenue — a 1931 nightclub, low and flat-roofed. No usable
   * Mapillary frame (marked junk), but the building is famous enough that a short, name-confirmed Commons look
   * settled it (`Bimbo's365Blade.jpg`, `Bimbo's Marquee.jpg`, both plainly 1025 Columbus): a single storey,
   * cream-walled, its whole street face covered in a decorative PIERCED SCREEN — a fine circle-motif breeze
   * block, not glazing — between plain corner piers, under a flat parapet roof. No slot in `facade()` reads as
   * "the wall itself is an ornamental screen", so the screen is a dense grid of small dark punches standing in
   * for the pierced pattern. The real fixture people actually recognise the building by is the corner sign:
   * a tall black vertical blade reading "BIMBO'S 365" over a lit readerboard marquee at the door — both of
   * which `parts.ts` already has words for.
   */
  bimbos365Club: (out, fit) => {
    const ring = towerRing(fit)
    const H = fit.height || 6
    const cream: [number, number, number] = [0.86, 0.84, 0.78]
    const dark: [number, number, number] = [0.14, 0.14, 0.15]
    // the pierced breeze-block screen: a dense grid of small dark punches over the pale wall
    tower(out, fit, {
      height: H,
      tiers: [{ to: 1, face: { kind: 'punched', wall: cream, glass: dark, pitch: 1.1, floor: H * 0.9, solid: 0.72, material: 'concrete' } }],
      crown: { kind: 'parapet', height: H * 0.15, colour: cream, material: 'concrete' },
    })
    // the corner sign: BIMBO'S down a vertical blade, and the lit readerboard marquee at the entrance below it
    const corner = edgeAt(ring, edgeFacing(ring, 0))
    bladeSign(out, corner.a.x, H * 1.9, corner.a.z, H * 1.1, "BIMBO'S", { heading: corner.heading, width: 1.4, out: 1 })
    marquee(out, corner.mid.x, H * 0.55, corner.mid.z, 2.6, 1.1, '365', { heading: corner.heading })
  },
}
