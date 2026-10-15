/**
 * San Francisco's street tunnels, as they look (render/tunnels.ts draws any tunnel; this says what these two are
 * like). From photographs (Wikimedia Commons, Category:Stockton Street Tunnel and Category:Broadway Tunnel (San
 * Francisco); Mapillary), recognisable rather than accurate (feedback-landmark-method):
 *
 *   * THE STOCKTON TUNNEL (1914), under Nob Hill from Sutter/Bush to Sacramento. One wide bore with a low
 *     segmental arch on short walls (the published cross-section), warm-lit walls, raised pavements behind rails.
 *     The south portal is Beaux-Arts: the arch in a stone face on engaged columns, a small arched doorway either
 *     side, roundels, an entablature, and Bush Street's balustrade along the top. The north portal the same.
 *   * THE BROADWAY TUNNEL (1952), under Russian Hill from Mason to Hyde. Twin bores, one each way, round vaults on
 *     low walls, yellow tiled walls, a light strip along each crown, a railed catwalk on the outer side. The west
 *     portal is two concrete arches on a central pier with long retaining walls lining the approach. The east
 *     mouth is under the Chinatown Public Health Center (1490 Mason): a raised concrete block of tall window bays
 *     over a dragon relief, standing on a pylon — so that portal IS the building (the generic landmark for it is
 *     suppressed in public/patches/san-francisco.json).
 *
 *   * THE YERBA BUENA TUNNEL (1936), the Bay Bridge through the island: ONE bore 23 m wide and 17 m high carrying
 *     both roadways, the upper on a deck inside it. Here it is two tunnels, one per roadway (each OSM way is its
 *     own, 9.5 m apart in height): the lower a flat-ceilinged box under the upper deck, the upper under the
 *     bore's arch. Each mouth is one plain concrete face with both openings in it — the lower tunnel's portal
 *     draws the whole face and the housing behind it; the upper tunnel's draws nothing.
 *
 * Portals are built in the portal's own frame (render/tunnels.ts `PortalContext`): x across (to the viewer's right),
 * y up from the road at the mouth, z towards the viewer; the face is z = 0.
 */
import { MeshBuilder } from '../../buildings.ts'
import type { PortalContext, PortalParts, Rgb, TunnelStyle, V3 } from '../../tunnels.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const STONE: Rgb = [0.8, 0.79, 0.75]
const PAVEMENT: Rgb = [0.3, 0.3, 0.31]
const STONE_DARK: Rgb = [0.66, 0.65, 0.61]
const STONE_LIGHT: Rgb = [0.86, 0.85, 0.81]
const RECESS: Rgb = [0.1, 0.1, 0.11]
const DOOR: Rgb = [0.86, 0.7, 0.18]
const TEAL: Rgb = [0.1, 0.52, 0.58]
const SIGN_YELLOW: Rgb = [0.92, 0.72, 0.1]
const CONCRETE: Rgb = [0.8, 0.77, 0.7]
const CONCRETE_LIGHT: Rgb = [0.86, 0.84, 0.79]
/** Yerba Buena's rock and the scrub over it */
const ROCK: Rgb = [0.5, 0.46, 0.4]
const SCRUB: Rgb = [0.22, 0.3, 0.15]
const GLASS: Rgb = [0.2, 0.23, 0.27]
const RELIEF: Rgb = [0.26, 0.26, 0.27]

/** an axis-aligned box, all six faces out */
function box(out: MeshBuilder, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, col: Rgb): void {
  const q = (p: V3[], n: V3): void => out.quad(p, n, UV, col, 0)
  q([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1])
  q([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1])
  q([[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], [0, 1, 0])
  q([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0])
  q([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0])
  q([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0])
}

/** the face of a wall from x0 to x1, from `bottom(x)` up to `top`, at depth z, facing the viewer */
function faceWall(out: MeshBuilder, x0: number, x1: number, bottom: (x: number) => number, top: number, z: number, col: Rgb, step = 0.3): void {
  for (let x = x0; x < x1 - 1e-6; x += step) {
    const xb = Math.min(x1, x + step)
    const b0 = bottom(x)
    const b1 = bottom(xb)
    if (b0 >= top && b1 >= top) continue
    out.quad([[x, b0, z], [xb, b1, z], [xb, top, z], [x, top, z]], [0, 0, 1], UV, col, 0)
  }
}

/** a band following the opening's edge, `w` wide, `d` proud of the face */
function archBand(out: MeshBuilder, c: PortalContext, w: number, d: number, col: Rgb): void {
  const step = 0.25
  for (let x = -c.half; x < c.half - 1e-6; x += step) {
    const xb = Math.min(c.half, x + step)
    const t0 = c.opening(x)
    const t1 = c.opening(xb)
    if (t0 === null || t1 === null) continue
    out.quad([[x, t0, d], [xb, t1, d], [xb, t1 + w, d], [x, t0 + w, d]], [0, 0, 1], UV, col, 0)
    // its soffit, under the band's front edge, for a little depth
    out.quad([[x, t0, 0], [xb, t1, 0], [xb, t1, d], [x, t0, d]], [0, -1, 0], UV, STONE_DARK, 0)
  }
}

/** an engaged column: a half-octagon shaft with a base and a capital block */
function column(out: MeshBuilder, x: number, y0: number, y1: number, r: number, col: Rgb): void {
  const n = 5
  for (let k = 0; k < n; k++) {
    const a0 = Math.PI * (k / n)
    const a1 = Math.PI * ((k + 1) / n)
    const p = (a: number, y: number): V3 => [x - Math.cos(a) * r, y, Math.sin(a) * r]
    const am = (a0 + a1) / 2
    out.quad([p(a0, y0 + 0.6), p(a1, y0 + 0.6), p(a1, y1 - 0.6), p(a0, y1 - 0.6)], [-Math.cos(am), 0, Math.sin(am)], UV, col, 0)
  }
  box(out, x - r - 0.15, x + r + 0.15, y0, y0 + 0.6, 0, r + 0.15, STONE_LIGHT)
  box(out, x - r - 0.2, x + r + 0.2, y1 - 0.6, y1, 0, r + 0.2, STONE_LIGHT)
}

/** a round-headed opening, recessed: a dark (or coloured) panel set back, reveals, and a surround proud of the face */
function archedDoor(out: MeshBuilder, cx: number, w: number, h: number, fill: Rgb): void {
  const r = w / 2
  const spring = h - r
  const top = (x: number): number => spring + Math.sqrt(Math.max(0, r * r - (x - cx) ** 2))
  const step = w / 10
  for (let x = cx - r; x < cx + r - 1e-6; x += step) {
    const xb = x + step
    out.quad([[x, 0, -0.35], [xb, 0, -0.35], [xb, top(xb), -0.35], [x, top(x), -0.35]], [0, 0, 1], UV, fill, 0)
    // the arch's soffit
    out.quad([[x, top(x), 0], [xb, top(xb), 0], [xb, top(xb), -0.35], [x, top(x), -0.35]], [0, -1, 0], UV, STONE_DARK, 0)
    // the surround
    out.quad([[x, top(x), 0.08], [xb, top(xb), 0.08], [xb, top(xb) + 0.3, 0.08], [x, top(x) + 0.3, 0.08]], [0, 0, 1], UV, STONE_LIGHT, 0)
  }
  for (const s of [-1, 1]) {
    const x = cx + s * r
    out.quad([[x, 0, 0], [x, 0, -0.35], [x, spring, -0.35], [x, spring, 0]], [-s, 0, 0], UV, STONE_DARK, 0)
  }
}

/** a flat disc on the face (a roundel), `d` proud */
function roundel(out: MeshBuilder, x: number, y: number, r: number, d: number, col: Rgb): void {
  const n = 12
  for (let k = 0; k < n; k++) {
    const a0 = (2 * Math.PI * k) / n
    const a1 = (2 * Math.PI * (k + 1)) / n
    out.quad([[x, y, d], [x + Math.cos(a0) * r, y + Math.sin(a0) * r, d], [x + Math.cos(a1) * r, y + Math.sin(a1) * r, d], [x, y, d]], [0, 0, 1], UV, col, 0)
  }
}

/** a balustrade from x0 to x1 standing on `y`: plinth, balusters, a rail on top */
function balustrade(out: MeshBuilder, x0: number, x1: number, y: number, z: number): void {
  box(out, x0, x1, y, y + 0.2, z - 0.35, z + 0.05, STONE)
  for (let x = x0 + 0.25; x < x1 - 0.2; x += 0.42) box(out, x - 0.08, x + 0.08, y + 0.2, y + 0.9, z - 0.25, z - 0.09, STONE_LIGHT)
  box(out, x0, x1, y + 0.9, y + 1.08, z - 0.38, z + 0.06, STONE)
}

/**
 * THE STOCKTON TUNNEL's portals (both alike): a stone face across the cut, the tunnel's arch in it on engaged
 * columns, a small arched doorway and a roundel either side, an entablature, and a balustrade on top — at the street
 * that runs over the mouth (Bush Street at the south end), or a little over the arch where the hill is higher.
 */
function stocktonPortal(c: PortalContext): PortalParts {
  const face = new MeshBuilder()
  let over = -Infinity
  for (let x = -c.half; x <= c.half; x += 1) over = Math.max(over, c.over(x))
  // (…and the street's own level a little further in: the ground falls from Bush Street's kerb to the mouth over some
  //  8 m, so 4 m in found the slope's middle, missed the street, and stood the parapet a metre over Bush — owner,
  //  2026-10-07)
  let street = -Infinity
  for (let x = -c.half; x <= c.half; x += 1) for (let z = 2; z <= 12; z += 1) street = Math.max(street, c.ground(x, -z))
  // the deck on top: the street over the mouth when there is one close above, else a parapet 2.2 m over the arch
  const deck = over > c.crown + 0.8 && over < c.crown + 3.5 ? over
    : street > c.crown + 0.8 && street < c.crown + 3.5 ? street : c.crown + 2.2
  const W = c.half + 6.2
  const ent0 = deck - 1.3
  // the face, round the opening and the two doorways, up to the entablature
  const doorW = 1.9
  const doorH = 3.2
  const doorAt = (x: number): number | null => {
    for (const sd of [-1, 1]) {
      const dx = sd * (c.half + 3.3)
      const r = doorW / 2
      if (Math.abs(x - dx) < r) return doorH - r + Math.sqrt(Math.max(0, r * r - (x - dx) ** 2))
    }
    return null
  }
  faceWall(face, -W, W, (x) => (Math.abs(x) < c.half ? c.opening(x) ?? 0 : doorAt(x) ?? 0), ent0, 0, STONE, 0.19)
  /*
   * …and its BACK, its top and its ends: the face was one sheet, drawn from the front only, so from Bush Street — on
   * top of it, behind it — the wall vanished and the cornice, the balustrade and the stubs of the columns hung over
   * the cut like a footbridge (owner, 2026-10-07: "top of the stockton tunnel looks really bad … it doesn't connect to
   * the ground when viewed from the top"). Now a solid wall 0.6 m thick, closed over the arch up to the deck.
   */
  const T = 0.6
  for (let x = -W; x < W - 1e-6; x += 0.19) {
    const xb = Math.min(W, x + 0.19)
    const b0 = Math.abs(x) < c.half ? c.opening(x) ?? 0 : 0
    const b1 = Math.abs(xb) < c.half ? c.opening(xb) ?? 0 : 0
    if (b0 >= deck && b1 >= deck) continue
    face.quad([[xb, b1, -T], [x, b0, -T], [x, deck, -T], [xb, deck, -T]], [0, 0, -1], UV, STONE, 0)
  }
  box(face, -W, W, ent0, deck, -T, 0, STONE)
  for (const s of [-1, 1]) box(face, s > 0 ? W - 0.05 : -W, s > 0 ? W : -W + 0.05, 0, ent0, -T, 0, STONE)
  // the street's deck from the wall back to where the ground comes up to it: Bush Street bridging the mouth, its
  // pavement over the slope the terrain draws there
  // (measured down the middle, over the bore: the sides run into Bush's own sidewalks; and a touch under the street, so
  //  where the two overlap the street draws)
  let D = T
  for (let z = 1; z <= 12; z += 0.5) {
    D = z
    if (c.ground(0, -z) >= deck - 0.3) break
  }
  if (deck - c.crown > 0.8 && D > T) box(face, -W, W, deck - 0.6, deck - 0.12, -D - 0.5, -T, PAVEMENT)
  archBand(face, c, 0.7, 0.18, STONE_LIGHT)
  // the keystone
  box(face, -0.5, 0.5, c.crown - 0.2, Math.min(ent0, c.crown + 1.0), 0, 0.35, STONE_LIGHT)
  // the columns either side of the arch, and at the outer ends
  for (const s of [-1, 1]) {
    column(face, s * (c.half + 0.75), 0, ent0, 0.45, STONE_LIGHT)
    column(face, s * (W - 0.6), 0, ent0, 0.4, STONE_LIGHT)
    // the side doorway and the roundel over it
    const dx = s * (c.half + 3.3)
    archedDoor(face, dx, doorW, doorH, s > 0 ? DOOR : RECESS)
    roundel(face, dx, Math.min(ent0 - 0.9, 4.6), 0.55, 0.1, STONE_LIGHT)
  }
  // the entablature: a plain frieze, then a cornice proud of it
  box(face, -W - 0.3, W + 0.3, ent0, deck - 0.35, 0, 0.3, STONE_LIGHT)
  box(face, -W - 0.5, W + 0.5, deck - 0.35, deck, -0.2, 0.55, STONE)
  // the street's balustrade along the top
  balustrade(face, -W - 0.3, W + 0.3, deck, 0.2)
  // "QUIET THROUGH TUNNEL" — a teal sign hung under the entablature, and the clearance diamond beside the arch
  box(face, -0.8, 0.8, Math.max(c.crown - 0.2, ent0 - 1.2), Math.max(c.crown + 0.4, ent0 - 0.6), 0.4, 0.55, TEAL)
  const dy = 4.0
  const dxs = c.half + 1.7
  face.quad([[dxs - 0.4, dy, 0.5], [dxs, dy - 0.4, 0.5], [dxs + 0.4, dy, 0.5], [dxs, dy + 0.4, 0.5]], [0, 0, 1], UV, SIGN_YELLOW, 0)
  return { face }
}

/**
 * THE BROADWAY TUNNEL, west portal: two round arches over the bores on a central pier, in a flat concrete face, and
 * tall retaining walls lining the approach either side.
 */
function broadwayWest(c: PortalContext): PortalParts {
  const face = new MeshBuilder()
  const W = c.half + 3
  const top = c.crown + 2.6
  faceWall(face, -W, W, (x) => (Math.abs(x) < c.half ? c.opening(x) ?? 0 : 0), top, 0, CONCRETE)
  archBand(face, c, 0.9, 0.3, CONCRETE_LIGHT)
  // the coping along the top
  box(face, -W - 0.2, W + 0.2, top, top + 0.35, -0.4, 0.3, CONCRETE_LIGHT)
  // the plaque on the pier (its face only: a box's back showed from inside the tunnel as a black square)
  face.quad([[-0.35, 2.2, 0.06], [0.35, 2.2, 0.06], [0.35, 2.9, 0.06], [-0.35, 2.9, 0.06]], [0, 0, 1], UV, RELIEF, 0)
  /*
   * The retaining walls along the approach, their tops easing down to the ground 30 m out. The top is a clean profile
   * (2026-10-14, owner: "looks pretty bad all around"): the ground beside this cut is the frontage roads' level for
   * the first ten metres and then the raw ground 3–4 m lower, and a top that followed it point by point tore into a
   * jagged slab, seen even from inside the tunnel. So: at each point the highest ground still to come (a wall never
   * rises going out), falling at most 0.35 m a metre, and both faces drawn.
   */
  const RUN = 30
  for (const s of [-1, 1]) {
    const x = s * (W + 0.2)
    const want: number[] = []
    for (let z = 0; z <= RUN; z++) want.push(Math.max(1.1, Math.min(top, top * (1 - z / RUN) + (c.ground(x, z) + 1.1) * (z / RUN))))
    for (let z = RUN - 1; z >= 0; z--) want[z] = Math.max(want[z], want[z + 1])
    for (let z = 1; z <= RUN; z++) want[z] = Math.max(want[z], want[z - 1] - 0.35)
    for (let z = 0; z < RUN; z++) {
      const z0 = z
      const z1 = z + 1
      const h0 = want[z0]
      const h1 = want[z1]
      face.quad([[x, 0, z0], [x, 0, z1], [x, h1, z1], [x, h0, z0]], [-s, 0, 0], UV, CONCRETE, 0)
      face.quad([[x + s * 0.6, 0, z1], [x + s * 0.6, 0, z0], [x + s * 0.6, h0, z0], [x + s * 0.6, h1, z1]], [s, 0, 0], UV, CONCRETE, 0)
      face.quad([[x, h0, z0], [x, h1, z1], [x + s * 0.6, h1, z1], [x + s * 0.6, h0, z0]], [0, 1, 0], UV, CONCRETE_LIGHT, 0)
    }
  }
  return { face }
}

/**
 * THE BROADWAY TUNNEL, east portal: the Chinatown Public Health Center standing over it. A raised concrete block —
 * a deep roof slab, eleven tall window bays, a dark dragon relief along a brick band — on a solid pylon to the
 * south and a slim one to the north, the tunnel's two bores open beneath. The footprint runs back over the tunnel
 * about 45 m (OSM way 206652621).
 */
function broadwayEast(c: PortalContext): PortalParts {
  const face = new MeshBuilder()
  const mass = new MeshBuilder()
  // across: the pylon to the viewer's left (south) is wide, the one to the right slim
  const xl = -c.half - 8.6
  const xr = c.half + 0.8
  const D = 45
  const soffit = c.crown + 0.9
  const beam = soffit + 0.8
  const band0 = beam
  const band1 = band0 + 2.6
  const top = 19
  // the face under the building: the two bores' arches in it, up to the soffit (a flat opening showed the tubes'
  // outsides in its corners)
  faceWall(face, xl, xr, (x) => (Math.abs(x) < c.half ? c.opening(x) ?? 0 : 0), soffit, 0, CONCRETE_LIGHT, 0.2)
  archBand(face, c, 0.5, 0.15, CONCRETE)
  // the pylon faces and the soffit over the openings (drawn with the face, being down at road level)
  box(face, xl, -c.half, 0, soffit, -1.5, 0, CONCRETE_LIGHT)
  box(face, c.half, xr, 0, soffit, -1.5, 0, CONCRETE_LIGHT)
  // the building over it
  box(mass, xl, xr, soffit, top, -D, 0, CONCRETE_LIGHT)
  // the beam, the relief band with the dragon, the window bays, the roof slab
  box(mass, xl - 0.1, xr + 0.1, soffit, beam, 0, 0.25, CONCRETE_LIGHT)
  box(mass, xl + 3.2, xr - 0.4, band0, band1, 0, 0.05, [0.6, 0.56, 0.5])
  // the dragon: a run of dark scales and a head, rising and falling
  let x = xl + 3.6
  let k = 0
  while (x < xr - 1.2) {
    const h = 0.5 + 0.35 * Math.sin(k * 0.9) + (k === 1 ? 0.5 : 0)
    const w = 0.8 + 0.3 * Math.cos(k * 1.7)
    box(mass, x, x + w, band0 + 1.0 - h / 2, band0 + 1.3 + h / 2, 0.05, 0.3, RELIEF)
    x += w + 0.15
    k++
  }
  const bays = 11
  const b0 = xl + 3.4
  const b1 = xr - 0.9
  const bw = (b1 - b0) / bays
  for (let i = 0; i < bays; i++) {
    const x0 = b0 + i * bw + 0.14
    const x1 = b0 + (i + 1) * bw - 0.14
    box(mass, x0, x1, band1 + 0.4, top - 1.6, 0, 0.02, GLASS)
    box(mass, x0 - 0.12, x0, band1 + 0.3, top - 1.5, 0, 0.18, CONCRETE_LIGHT)
  }
  // the south pylon stands proud, full height, and the roof slab oversails everything
  box(mass, xl - 0.2, xl + 3.0, 0, top + 0.2, 0, 0.4, CONCRETE)
  box(mass, xl - 0.6, xr + 0.8, top, top + 0.7, -D - 0.5, 1.2, CONCRETE_LIGHT)
  return { face, mass }
}

/** the Bay Bridge's upper roadway over its lower (src/city/sf/bridges.ts BAY_BETWEEN) */
const YBI_BETWEEN = 9.5
const YBI_ARCH = 8

/**
 * THE YERBA BUENA TUNNEL's mouths: a plain concrete face, the lower roadway's flat-topped opening at the bottom, the
 * upper roadway's arch over it, a pier each side — and behind the face a concrete housing running back into the
 * hill, because the coarse ground does not reach up to the upper roadway until well inside the mouth.
 *
 * The arch (2026-10-05, from Commons "San Francisco-Bay Bridge02.jpg", the west mouth from the upper deck — the owner:
 * "the entrance and exit of the tunnel are both poorly rendered"): weathered GREY concrete, not cream; the opening is
 * framed by THREE concentric rings, each stepped forward of the one inside it, so the arch reads as a deep stepped
 * archivolt; the headwall over it is cut into tall panels by vertical joints; plain wide piers either side. The bore's
 * own arch stays in the face plane (z = 0), where the tube meets it; the rings and the headwall stand forward of it.
 */
const YBI_GREY: Rgb = [0.63, 0.63, 0.6]
const YBI_LIGHT: Rgb = [0.7, 0.7, 0.67]
const YBI_JOINT: Rgb = [0.47, 0.47, 0.45]

function yerbaBuenaPortal(c: PortalContext): PortalParts {
  const face = new MeshBuilder()
  const mass = new MeshBuilder()
  const W = c.half + 7
  const top = YBI_BETWEEN + YBI_ARCH + 4.2
  // the upper opening: across the whole width between the piers (the two roadways are 3.5 m off each other's line)
  const r = c.half + 1.2
  const y0 = YBI_BETWEEN + 3
  // ring k: the bore's arch (k = 0) and the two rings round it, each 1.1 m wider and taller, 0.6 m further forward
  const RING = 1.1, STEP = 0.6
  const arc = (k: number) => (x: number): number => {
    const a = r + RING * k, bb = YBI_ARCH - 3 + RING * k
    return y0 + bb * Math.sqrt(Math.max(0, 1 - (x / a) ** 2))
  }
  const lower = (x: number): number => (Math.abs(x) < c.half ? c.opening(x) ?? 0 : 0)
  const deckTop = YBI_BETWEEN + 0.9
  // the band between the two openings: the upper deck's edge, a ledge right across the face
  faceWall(face, -r, r, lower, YBI_BETWEEN - 0.2, 0, YBI_GREY, 0.4)
  box(face, -W, W, YBI_BETWEEN - 1.2, deckTop, 0, STEP * 2 + 0.3, YBI_LIGHT)
  // under the ledge, beside the lower opening: the face out to the headwall's line, and its return forward to it
  for (const side of [-1, 1]) {
    const ao = r + RING * 2
    faceWall(face, Math.min(side * r, side * ao), Math.max(side * r, side * ao), () => -2, YBI_BETWEEN - 1.2, 0, YBI_GREY, 0.4)
    const x = side * ao
    face.quad(side > 0 ? [[x, -2, 0], [x, -2, STEP * 3], [x, YBI_BETWEEN - 1.2, STEP * 3], [x, YBI_BETWEEN - 1.2, 0]] : [[x, -2, STEP * 3], [x, -2, 0], [x, YBI_BETWEEN - 1.2, 0], [x, YBI_BETWEEN - 1.2, STEP * 3]], [side, 0, 0], UV, YBI_GREY, 0)
  }
  // the rings: each an arched band from its inner curve to its outer, standing forward of the one inside it, with
  // its jambs down to the ledge and the soffit of its inner edge
  const n = 72
  for (let k = 0; k < 2; k++) {
    const inner = arc(k), outer = arc(k + 1)
    const ai = r + RING * k, ao = r + RING * (k + 1)
    const z = STEP * (k + 1)
    for (let i = 0; i < n; i++) {
      const x0 = -ao + (2 * ao * i) / n, x1 = -ao + (2 * ao * (i + 1)) / n
      const b0 = Math.abs(x0) < ai ? inner(x0) : deckTop, b1 = Math.abs(x1) < ai ? inner(x1) : deckTop
      const t0 = outer(x0), t1 = outer(x1)
      // (beyond the inner ring's span the band runs down to the ledge as the jamb)
      face.quad([[x0, Math.abs(x0) < ai ? b0 : deckTop, z], [x1, Math.abs(x1) < ai ? b1 : deckTop, z], [x1, t1, z], [x0, t0, z]], [0, 0, 1], UV, k === 0 ? YBI_LIGHT : YBI_GREY, 0)
      // the soffit along the inner curve, from the ring inside back to this one
      if (Math.abs(x0) < ai && Math.abs(x1) < ai) face.quad([[x1, b1, z - STEP], [x0, b0, z - STEP], [x0, b0, z], [x1, b1, z]], [0, -1, 0], UV, YBI_JOINT, 0)
    }
    // the jamb returns: the inner ring's side, from the ledge to its springing, facing across the opening
    for (const side of [-1, 1]) {
      const x = side * ai
      face.quad(side > 0 ? [[x, deckTop, z - STEP], [x, deckTop, z], [x, y0, z], [x, y0, z - STEP]] : [[x, deckTop, z], [x, deckTop, z - STEP], [x, y0, z - STEP], [x, y0, z]], [-side, 0, 0], UV, YBI_JOINT, 0)
    }
  }
  // the headwall: forward of the outer ring, over its curve and down to the ground beyond it, with its own soffit
  const zw = STEP * 3
  const ao = r + RING * 2
  const outerArc = arc(2)
  faceWall(face, -ao, ao, (x) => (Math.abs(x) < ao ? outerArc(x) : deckTop), top, zw, YBI_GREY, 0.3)
  for (let i = 0; i < n; i++) {
    const x0 = -ao + (2 * ao * i) / n, x1 = -ao + (2 * ao * (i + 1)) / n
    face.quad([[x1, outerArc(x1), zw - STEP], [x0, outerArc(x0), zw - STEP], [x0, outerArc(x0), zw], [x1, outerArc(x1), zw]], [0, -1, 0], UV, YBI_JOINT, 0)
  }
  for (const side of [-1, 1]) {
    faceWall(face, Math.min(side * ao, side * W), Math.max(side * ao, side * W), () => -2, top, zw, YBI_GREY, 0.5)
    // the outer jamb return
    const x = side * ao
    face.quad(side > 0 ? [[x, deckTop, zw - STEP], [x, deckTop, zw], [x, y0, zw], [x, y0, zw - STEP]] : [[x, deckTop, zw], [x, deckTop, zw - STEP], [x, y0, zw - STEP], [x, y0, zw]], [-side, 0, 0], UV, YBI_JOINT, 0)
    // the wide plain pier, a step forward again, full height and a little over
    box(face, side > 0 ? W - 4.2 : -W, side > 0 ? W : -W + 4.2, -2, top + 0.8, zw, zw + 0.8, YBI_LIGHT)
  }
  // the panel joints in the headwall, over the arch, and its coping
  for (let x = -W + 4.2 + 5.2; x < W - 4.2 - 1; x += 5.2) {
    const b = Math.abs(x) < ao ? outerArc(x) : -2
    if (b < top - 0.8) box(face, x - 0.06, x + 0.06, b, top - 0.6, zw, zw + 0.04, YBI_JOINT)
  }
  box(face, -W, W, top - 0.6, top + 0.2, zw - 0.3, zw + 0.45, YBI_LIGHT)
  /*
   * The hill over and beside it. The coarse ground does not reach up to the upper roadway until well inside the
   * mouth, so something has to stand there; it was a concrete housing with a flat 46 m roof, which from the upper deck
   * read as a white canopy laid over the portal (backlog, 2026-10-02). The real mouths are cut into Yerba Buena's
   * rock: so a mound of scrub over the bore, rising back from the face, and rock cuttings flaring out from the piers
   * down to the ground either side.
   */
  const D = 46
  const RISE = 7
  const FLARE = 16
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const crestZ = -D * 0.45
  // the crown of the mound: from the face's top back and up to a crest, then level into the hill
  const n1: V3 = [0, 0.99, RISE / (D * 0.45)]
  mass.quad([[-W, top, 0], [W, top, 0], [W, top + RISE, crestZ], [-W, top + RISE, crestZ]], n1, uv, SCRUB, 0)
  mass.quad([[-W, top + RISE, crestZ], [W, top + RISE, crestZ], [W, top + RISE, -D], [-W, top + RISE, -D]], [0, 1, 0], uv, SCRUB, 0)
  for (const side of [-1, 1]) {
    const x = side * W, xo = side * (W + FLARE)
    // the rock cutting: a steep face from the pier's edge, turned back into the hill, down to the ground
    mass.quad(side > 0
      ? [[x, -4, 0], [xo, -4, -FLARE * 0.6], [xo, top * 0.35, -FLARE * 0.6 - 4], [x, top, 0]]
      : [[xo, -4, -FLARE * 0.6], [x, -4, 0], [x, top, 0], [xo, top * 0.35, -FLARE * 0.6 - 4]], [0, 0, 1], uv, ROCK, 0)
    // and the mound's flank, from the crown down over the cutting's top to the ground
    mass.quad(side > 0
      ? [[x, top, 0], [xo, top * 0.35, -FLARE * 0.6 - 4], [xo, -4, -D], [x, top + RISE, -D]]
      : [[xo, top * 0.35, -FLARE * 0.6 - 4], [x, top, 0], [x, top + RISE, -D], [xo, -4, -D]], [side * 0.7, 0.7, 0], uv, SCRUB, 0)
    mass.quad(side > 0
      ? [[x, top, 0], [x, top + RISE, crestZ], [x, top + RISE, -D], [x, top, 0]]
      : [[x, top, 0], [x, top + RISE, -D], [x, top + RISE, crestZ], [x, top, 0]], [side, 0, 0], uv, SCRUB, 0)
  }
  return { face, mass }
}

export const SF_TUNNELS: Record<string, TunnelStyle> = {
  'Stockton Tunnel': {
    /*
     * crown 4.9, not 6.0 (owner, 2026-10-01: cars and people on Bush Street showed INSIDE the top of the arch). In
     * the baked heights Bush Street crosses the south mouth only ~6.1 m above the tunnel's road, so a 6 m arch rose to
     * the street over it, the portal's deck could not be the street (stocktonPortal wants it 0.8 m clear), and the
     * traffic on Bush rode through the arch. The real tunnel's clearance is about 4.3 m.
     */
    vault: 'segmental', spring: 1.6, crown: 4.9,
    wall: [0.93, 0.78, 0.45], wallTop: 2.4, vaultColour: [0.72, 0.66, 0.52],
    lamps: 'springs', walks: 'both',
    portal: (c) => stocktonPortal(c),
  },
  Broadway: {
    vault: 'round', twin: 0.8, spring: 1.6,
    wall: [0.9, 0.86, 0.42], wallTop: 2.6, vaultColour: [0.86, 0.85, 0.72],
    lamps: 'crown', walks: 'catwalk',
    portal: (c) => (c.facing === 'e' ? broadwayEast(c) : broadwayWest(c)),
  },
  // the Yerba Buena tunnel: OSM names its ways for the freeway; the lower roadway is layer −2, the upper −1
  'Dwight D. Eisenhower Highway#-2': {
    vault: 'segmental', spring: 5.4, crown: 6.6,
    wall: [0.82, 0.8, 0.72], wallTop: 3, vaultColour: [0.6, 0.6, 0.58],
    lamps: 'springs', walks: 'both',
    portal: (c) => yerbaBuenaPortal(c),
  },
  'Dwight D. Eisenhower Highway#-1': {
    vault: 'segmental', spring: 3, crown: YBI_ARCH - 0.4,
    wall: [0.82, 0.8, 0.72], wallTop: 3, vaultColour: [0.74, 0.73, 0.68],
    lamps: 'springs', walks: 'both',
    portal: () => ({}),
  },
}
