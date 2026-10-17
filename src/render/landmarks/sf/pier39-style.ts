/**
 * PIER 39, building by building (owner, 2026-10-17: "practically every 'building' on the pier (more like stalls) has a
 * completely different style leading to a busy, carnival-like atmosphere"; "the second floor walkways are mostly
 * continuous, with zany wood staircases going up and down"; "the decorative facades actually are on the sides facing the
 * water too (which looks odd)"). One builder per building, `pier39A` … `pier39Q`, each a STYLE (pier39-style.ts P39_STYLES)
 * drawn by one shared routine:
 *
 *  - the walls: weathered boards — lap siding or board-and-batten — in the building's own colour, white-trimmed sash
 *    windows upstairs; shopfronts, awnings and name boards ONLY on the faces that look onto the pier's walks and plazas.
 *    The faces over the marinas are plain boards and windows (a restaurant's big windows where one looks out). Which face
 *    is which was measured once, off the bake's sea polygon, and is carried per outline edge in P39_EDGES — edge `i` of the
 *    package ring is edge `i` of `Fit.ring` (the loader keeps the ring's order). A rebake that changes an outline makes
 *    the table disagree with the ring; the builder then says so in the console and treats every face as a walk face.
 *  - the shop names: OSM's own shops and cafés (2026-12 survey tags), each on the face and at the place OSM puts it; a
 *    level-1 shop's board goes upstairs. A walk face with no shop on it gets a plain word (GIFTS, CANDY…) — never another
 *    shop's name.
 *  - the roofs: steep grey shingle gables (or hips), one over each rectangle of the outline — "many small separate roofs
 *    at different angles" (owner's aerial photograph, 2026-10-17).
 *  - each building's own pieces (Feature): the Alcatraz gift shop's stepped Spanish parapet, Le Beastro's tower, Krazy
 *    Kaps' barber-pole arcade, Dreyer's giant cone, the chalet stalls, the painted cut-out on a balcony…
 *
 * The upper GALLERIES and their staircases are not drawn here but by `pier39Galleries` (one model for the whole pier,
 * following OSM's level-1 footways, which are continuous where these buildings' own walls are not); its lamp posts and
 * benches too. The Fog Harbor/Wipeout and Players/Bubba Gump fronts (pier39-fronts.ts) stand against their walls as
 * before — `Fit.bare` faces are left plain.
 *
 * Sources: the owner's Street View walk from the Embarcadero to the carousel and his aerial photograph (2026-10-17);
 * Mapillary 2025 sequences on the deck (ids in each style's note); OSM shop nodes.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { faceBand } from '../tower.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { boxAlong } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign, type Face as SignFace } from '../signage.ts'
import { tube, type V3 } from './wharf-carnival.ts'
import { PIER39_ROUTE } from '../../../city/sf/pier39-route.ts'

type P2 = { x: number; z: number }
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const WT = surfaceTag('clapboard'), GT = surfaceTag('glass'), MT = surfaceTag('metal'), TT = surfaceTag('tile'), ST = surfaceTag('stucco')
const hash = (a: number, b: number): number => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h) }

/** the ground floor's height and the upper storey's, metres: the galleries' deck is at G */
export const P39_G = 4.2
const U = 3.4

// ---- colours ---------------------------------------------------------------------------------------------------------
const WHITE: Rgb = [0.93, 0.92, 0.88], CREAM: Rgb = [0.9, 0.86, 0.72], INK: Rgb = [0.13, 0.13, 0.15]
const BROWN_D: Rgb = [0.33, 0.25, 0.19], BROWN: Rgb = [0.45, 0.35, 0.26], TAN: Rgb = [0.7, 0.58, 0.43], SILVER: Rgb = [0.56, 0.53, 0.48]
const GREY: Rgb = [0.66, 0.66, 0.65], PALEBLUE: Rgb = [0.6, 0.72, 0.82], GREYBLUE: Rgb = [0.47, 0.55, 0.62], REDBROWN: Rgb = [0.5, 0.24, 0.17]
const BUTTER: Rgb = [0.9, 0.82, 0.52], NAVY: Rgb = [0.12, 0.17, 0.33], BLUE: Rgb = [0.13, 0.36, 0.68], RED: Rgb = [0.74, 0.15, 0.13]
const GREEN: Rgb = [0.13, 0.4, 0.26], TEAL: Rgb = [0.1, 0.52, 0.55], YELLOW: Rgb = [0.93, 0.74, 0.14], PINK: Rgb = [0.92, 0.62, 0.72]
const LAVENDER: Rgb = [0.66, 0.56, 0.8], PURPLE: Rgb = [0.42, 0.24, 0.52], GOLD: Rgb = [0.86, 0.68, 0.26], SHINGLE: Rgb = [0.35, 0.36, 0.38]
const GLASS: Rgb = [0.24, 0.27, 0.29], SHOPGLASS: Rgb = [0.5, 0.48, 0.4]

/** an awning: canvas colour, its stripe (none: solid), scalloped valance */
interface Awn { a: Rgb; b?: Rgb; scallop?: boolean }

/** one building's own piece, on edge `e` of its outline (P39_EDGES order), `t` of the way along it */
type Feature =
  /** the Alcatraz gift shop's white stepped Spanish parapet over the whole face, red capitals on it */
  | { kind: 'parapet'; e: number; text: string }
  /** a tall square tower with a mansard cap at the corner where edge `e` starts (t 0) or ends (t 1) */
  | { kind: 'tower'; e: number; t: number; text: string; colour: Rgb }
  /** Krazy Kaps: a pink and lavender Moorish arcade, twisted barber-pole columns, from t0 to t1 */
  | { kind: 'moorish'; e: number; t0: number; t1: number; text: string }
  /** a row of little gabled pink-and-white chalet stalls on the walk in front of the face (Charms by the Bay) */
  | { kind: 'chalets'; e: number; t0: number; t1: number; text: string; colours: Rgb[] }
  /** an ice-cream kiosk against the face with a giant cone on its roof (TRIPO.md: the real cones) */
  | { kind: 'cone'; e: number; t: number; text: string; awn: Awn; sub?: string }
  /** a big painted cut-out figure on the upper storey (TRIPO.md: the cook holding his fish) */
  | { kind: 'cutout'; e: number; t: number }
  /** a market stall on the walk: striped canvas roof on poles over crates of fruit */
  | { kind: 'produce'; e: number; t: number; awn: Awn }
  /** a billboard on a green steel lattice standing on the roof line */
  | { kind: 'billboard'; e: number; t: number; text: string; bands: Rgb[] }
  /** a framed portal round a shop door, its name across the head */
  | { kind: 'portal'; e: number; t: number; text: string; colour: Rgb; letters: Rgb }
  /** a board of its own: on the fascia (y omitted) or at y, any face */
  | { kind: 'board'; e: number; t: number; text: string; panel?: Rgb; colour: Rgb; face: SignFace; h?: number; y?: number; w?: number }
  /** a specific awning from t0 to t1 in place of the style's (a word on its valance) */
  | { kind: 'awning'; e: number; t0: number; t1: number; awn: Awn; text?: string; letters?: Rgb }
  /** an open shopfront: white posts, no glass, teal awning (P's south end) */
  | { kind: 'open'; e: number; t0: number; t1: number; awn: Awn; posts: Rgb }
  /** the upper storey of edge `e` glazed whole: a restaurant over the water or the plaza */
  | { kind: 'glazing'; e: number }
  /** the wall colours of these edges in place of the style's (one building, two characters) */
  | { kind: 'paint'; edges: number[]; wall: Rgb; upper: Rgb; trim?: Rgb }
  /** a white marlin leaping over the awning (Pier Market) */
  | { kind: 'marlin'; e: number; t: number }
  /** a red crab on the wall, its name beside it (Crab House) */
  | { kind: 'crab'; e: number; t: number; text: string }

export interface P39Style {
  /** the ground floor's boards, between and round the shopfronts */
  wall: Rgb
  /** the upper storey's */
  upper: Rgb
  /** window frames, shopfront frames, corner boards */
  trim: Rgb
  /** board-and-batten (vertical battens) rather than lap siding */
  batten?: boolean
  /** hip roofs instead of gables */
  hip?: boolean
  /** one storey (a kiosk): the height of its walls */
  low?: number
  awn: Awn | null
  /** the shopfront glass's tint */
  glass?: Rgb
  /** the board the shop names are lettered on, and the letters, and the face */
  boardPanel?: Rgb
  boardInk?: Rgb
  boardFace?: SignFace
  /** plain words for walk faces with no shop on them */
  words?: string[]
  features?: Feature[]
}

// ---- the styles ------------------------------------------------------------------------------------------------------
/**
 * Each building as it stands (2025 Mapillary on the deck; the owner's photographs, 2026-10-17). Keyed by OSM way id.
 * Edge numbers are P39_EDGES' (the package outline's order); bearings are each face's outward compass bearing.
 */
export const P39_STYLES: Record<number, P39Style> = {
  // A — the entrance's west corner: dark boards with a white-trimmed upper storey, the Eagle Cafe upstairs looking at the
  // Embarcadero. (Mapillary 2201774833654730: brick and curved glass at its south-west foot.)
  466623895: {
    wall: BROWN_D, upper: TAN, trim: WHITE, batten: true, awn: { a: BLUE, b: WHITE },
    features: [{ kind: 'paint', edges: [1, 2], wall: [0.58, 0.3, 0.22], upper: TAN }],
  },
  // the little white ATM kiosk with a blue awning on the left as you come in (owner's photograph 1)
  466623896: {
    wall: WHITE, upper: WHITE, trim: WHITE, low: 3.4, awn: { a: BLUE },
    features: [{ kind: 'board', e: 1, t: 0.5, text: 'ATM', panel: BLUE, colour: WHITE, face: 'grotesque', h: 0.32, w: 1.6 }],
  },
  // FOG HARBOR's building: white boards, gabled; its east face is the Fog Harbor/Wipeout front (bare), its west face looks
  // over the marina with the restaurant's big windows (photograph 1: "a gabled white upper building with a timber balcony")
  128240149: {
    wall: [0.82, 0.82, 0.8], upper: WHITE, trim: [0.98, 0.98, 0.96], awn: { a: NAVY },
    features: [{ kind: 'glazing', e: 14 }, { kind: 'glazing', e: 16 }],
  },
  // B — tan lap siding over brown, white sash windows; The Hook's dark green front, Mrs. Fields, the Golden Gate gift shop's
  // red portal; the gelato kiosk with its giant cone at the south-east corner (Mapillary 1340963877366826); the painted cook
  // with his fish on the balcony and the striped fruit stand (photograph 2)
  128240115: {
    wall: BROWN, upper: TAN, trim: WHITE, awn: { a: GREEN },
    features: [
      { kind: 'cone', e: 6, t: 0.5, text: 'GELATO', sub: 'Atalia’s', awn: { a: YELLOW, b: INK } },
      { kind: 'portal', e: 11, t: 0.22, text: 'GOLDEN GATE', colour: RED, letters: WHITE },
      { kind: 'cutout', e: 9, t: 0.5 },
      { kind: 'produce', e: 7, t: 0.55, awn: { a: GREEN, b: YELLOW } },
      { kind: 'awning', e: 9, t0: 0.05, t1: 0.95, awn: { a: [0.85, 0.3, 0.45], b: WHITE } },
    ],
  },
  // C — grey-blue boards, white trim, hipped; the Crab House upstairs with its red crab
  128240130: {
    wall: GREYBLUE, upper: [0.55, 0.63, 0.69], trim: WHITE, hip: true, awn: { a: RED, b: WHITE },
    features: [{ kind: 'crab', e: 9, t: 0.5, text: 'CRAB HOUSE' }],
  },
  // D — dark board-and-batten at the south with Dreyer's red-and-white waffle-cone kiosk and its giant cone and the little
  // chalet kiosk beside it (Mapillary 4638570392820856; photograph 3); tan board-and-batten to the north with white sash
  // windows and the navy scalloped BREAKFAST · LUNCH · DINNER awning (photograph 4)
  128240133: {
    wall: BROWN_D, upper: BROWN_D, trim: WHITE, batten: true, awn: { a: NAVY, scallop: true },
    features: [
      { kind: 'paint', edges: [4, 5], wall: TAN, upper: TAN },
      { kind: 'cone', e: 4, t: 0.08, text: 'WAFFLE CONES', sub: 'Dreyer’s', awn: { a: RED, b: WHITE } },
      { kind: 'chalets', e: 4, t0: 0.2, t1: 0.3, text: 'SWISS CHOCOLATE', colours: [[0.55, 0.2, 0.16]] },
      { kind: 'awning', e: 4, t0: 0.62, t1: 0.98, awn: { a: NAVY, scallop: true }, text: 'BREAKFAST · LUNCH · DINNER', letters: WHITE },
    ],
  },
  // E — pale blue boards, white trim; Houdini's MAGIC SHOP on a navy board with gold letters, the Spice & Tea Exchange
  // upstairs (Mapillary 792042609873662)
  128240139: {
    wall: PALEBLUE, upper: PALEBLUE, trim: WHITE, awn: { a: BLUE, b: WHITE },
    features: [{ kind: 'board', e: 9, t: 0.25, text: 'MAGIC SHOP', panel: NAVY, colour: GOLD, face: 'didone', h: 0.5, w: 4.5 }],
  },
  // F — silver-grey weathered boards, hipped; PIER MARKET's blue scalloped awning with the white marlin, beside the wide
  // stair up to the gallery (photograph 6)
  128240107: {
    wall: SILVER, upper: [0.64, 0.61, 0.56], trim: WHITE, hip: true, awn: { a: BLUE, scallop: true },
    features: [
      { kind: 'awning', e: 6, t0: 0.0, t1: 0.45, awn: { a: BLUE, scallop: true }, text: 'PIER MARKET', letters: WHITE },
      { kind: 'marlin', e: 6, t: 0.22 },
    ],
  },
  // G — dark brown lap siding, red-and-white stripes; Swiss Louis upstairs
  128240116: { wall: BROWN_D, upper: BROWN, trim: CREAM, awn: { a: RED, b: WHITE }, words: ['SOCKS', 'MAGNETS', 'GIFTS'] },
  // H — red-brown boards with teal awnings and white posts
  128240142: { wall: REDBROWN, upper: REDBROWN, trim: WHITE, batten: true, awn: { a: TEAL }, words: ['PEARLS', 'GIFTS'] },
  // I — grey boards, the white pilastered portal of the electronics shop (Mapillary 1074043458221579)
  128240126: {
    wall: GREY, upper: GREY, trim: WHITE, hip: true, awn: { a: [0.35, 0.36, 0.38] },
    features: [{ kind: 'portal', e: 4, t: 0.5, text: 'ALEENK', colour: WHITE, letters: INK }],
  },
  // J — butter-yellow walls with purple trim, paw prints (Mapillary 1328824842191791)
  128240148: { wall: BUTTER, upper: BUTTER, trim: PURPLE, awn: { a: PURPLE, b: WHITE }, boardPanel: PURPLE, boardInk: WHITE },
  // K — the big north-west building: grey-white boards, glazed upstairs where it looks at the north plaza (Mapillary
  // 1063036765904274); Christmas in San Francisco in red and green; the Fudgery under the gallery (Mapillary 1049386220438961,
  // which face is a guess)
  128240134: {
    wall: [0.78, 0.78, 0.76], upper: [0.84, 0.84, 0.82], trim: WHITE, awn: { a: GREEN },
    features: [
      { kind: 'glazing', e: 16 }, { kind: 'glazing', e: 18 },
      { kind: 'awning', e: 8, t0: 0.05, t1: 0.95, awn: { a: GREEN, b: RED } },
      { kind: 'board', e: 15, t: 0.5, text: 'Fudgery', panel: [0.42, 0.1, 0.1], colour: GOLD, face: 'script', h: 0.55, w: 5 },
    ],
  },
  // L — deep red lower storey under tan; Players' front covers its west face (bare)
  128240131: { wall: [0.55, 0.16, 0.14], upper: TAN, trim: CREAM, awn: { a: RED, b: CREAM }, words: ['CANDY', 'GIFTS'] },
  // M — the north end: pale grey lap siding, white trim, gables with dormers (Mapillary 1598749671503601); Bubba Gump and
  // Lorenzo's upstairs with their windows over the water
  128240119: {
    wall: GREY, upper: [0.74, 0.75, 0.76], trim: WHITE, awn: { a: BLUE },
    features: [
      { kind: 'glazing', e: 21 }, { kind: 'glazing', e: 23 }, { kind: 'glazing', e: 25 }, { kind: 'glazing', e: 26 },
      { kind: 'board', e: 8, t: 0.5, text: 'BUBBA GUMP SHRIMP CO.', panel: BLUE, colour: WHITE, face: 'slab', h: 0.42, y: P39_G + 2.4, w: 7.5 },
    ],
  },
  // N — pale blue and white, KRAZY KAPS' pink and lavender Moorish arcade on twisted barber-pole columns on its west face
  // (photograph 7; Mapillary 769357576067807); the curved east end over the marina plain
  128240135: {
    wall: [0.72, 0.82, 0.9], upper: WHITE, trim: WHITE, awn: { a: BLUE, b: WHITE },
    features: [{ kind: 'moorish', e: 2, t0: 0.55, t1: 0.97, text: 'KRAZY KAPS' }],
  },
  // O — dark brown boards, Le Beastro / Biscoff's tall square tower with a mansard cap at the north-west corner, a green
  // shopfront and a red awning (photograph 7)
  128240136: {
    wall: BROWN_D, upper: BROWN_D, trim: CREAM, batten: true, awn: { a: RED },
    features: [
      { kind: 'tower', e: 0, t: 0, text: 'LE BEASTRO', colour: BROWN_D },
      { kind: 'awning', e: 0, t0: 0.4, t1: 0.95, awn: { a: GREEN }, text: 'Biscoff', letters: WHITE },
    ],
  },
  // P — the long east building: at the south the ALCATRAZ GIFT SHOP's white stepped Spanish parapet with red letters
  // (photographs 2 and 3), an open front of white posts and teal awnings, Na Hoku's blue awning; to the north pale blue
  // boards with white windows and Charms by the Bay's pink-and-white chalet stalls with a red-and-white candy kiosk
  // (photograph 6); hanging signs on its gallery (photograph 4)
  128240146: {
    wall: TAN, upper: TAN, trim: WHITE, awn: { a: BLUE },
    features: [
      { kind: 'paint', edges: [15, 16, 17, 18], wall: WHITE, upper: WHITE, trim: WHITE },
      { kind: 'paint', edges: [7, 8, 9, 10, 11, 12], wall: PALEBLUE, upper: PALEBLUE, trim: WHITE },
      { kind: 'parapet', e: 18, text: 'ALCATRAZ GIFT SHOP' },
      { kind: 'open', e: 17, t0: 0.05, t1: 0.5, awn: { a: TEAL }, posts: WHITE },
      { kind: 'board', e: 17, t: 0.27, text: 'MANGO’S', panel: YELLOW, colour: [0.2, 0.45, 0.2], face: 'brush', h: 0.45, w: 3 },
      { kind: 'awning', e: 17, t0: 0.6, t1: 0.98, awn: { a: BLUE }, text: 'NA HOKU', letters: WHITE },
      { kind: 'chalets', e: 10, t0: 0.15, t1: 0.95, text: 'Charms by the Bay', colours: [PINK, WHITE, PINK] },
      { kind: 'board', e: 12, t: 0.35, text: 'ALCATRAZ GIFT SHOP UPSTAIRS', panel: WHITE, colour: RED, face: 'grotesque', h: 0.28, y: P39_G + 1.6, w: 5 },
    ],
  },
  // Q — the entrance's east side: grey boards; Boudin, the Rock Shop; at its north tip the hat shop's billboard on a green
  // steel lattice (photograph 2). Its south face is the Hard Rock front's (bare).
  288396171: {
    wall: [0.5, 0.48, 0.45], upper: [0.6, 0.58, 0.54], trim: WHITE, awn: { a: [0.48, 0.3, 0.18] },
    features: [{ kind: 'billboard', e: 43, t: 0.5, text: 'NFL · COLLEGE · HATS', bands: [YELLOW, RED, BLUE] }],
  },
}

// ---- the outline's edges ---------------------------------------------------------------------------------------------
interface Ed {
  i: number; a: P2; b: P2; L: number; tx: number; tz: number; nx: number; nz: number
  /** s a walk face, w over the water, h against a neighbour (or a bare face) */
  kind: 's' | 'w' | 'h'
  /** g: carries its own gallery (no OSM one along it); t: and a stair down from it */
  gal: '' | 'g' | 't'
  pois: { name: string; t: number; lvl: number }[]
}

function edgesOf(fit: Fit, id: number): { ring: P2[]; eds: Ed[] } {
  const ring = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; area += p.x * q.z - q.x * p.z }
  const sgn = area >= 0 ? 1 : -1
  const data = P39_EDGES[id]
  const ok = !!data && data.n === ring.length && data.e.every(([L], i) => {
    const p = ring[i], q = ring[(i + 1) % ring.length]
    return Math.abs(Math.hypot(q.x - p.x, q.z - p.z) - L) < 0.6
  })
  if (data && !ok) console.warn(`pier39 ${id}: the outline no longer matches P39_EDGES (rebaked?) — every face drawn as a walk face`)
  const eds: Ed[] = ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1e-6
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
    const nx = tz * sgn, nz = -tx * sgn
    const row = ok ? data!.e[i] : undefined
    let kind = (row?.[1][0] ?? 's') as 's' | 'w' | 'h'
    const gal = (row?.[1][1] ?? '') as '' | 'g' | 't'
    if (fit.bare?.some((v) => nx * v.x + nz * v.z > 0.85)) kind = 'h'
    const pois = (row?.[2] ?? []).map((s) => {
      const m = /^(.*)@([\d.]+)\^(\d)$/.exec(s)
      return m ? { name: m[1], t: Number(m[2]), lvl: Number(m[3]) } : { name: s, t: 0.5, lvl: 0 }
    })
    return { i, a, b, L, tx, tz, nx, nz, kind, gal, pois }
  })
  return { ring, eds }
}

const at = (e: Ed, u: number, y: number, o: number): V3 => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
const heading = (e: Ed): number => Math.atan2(e.nx, e.nz)
/** a square timber from p0 to p1, half-width r: four faces, no end caps (the galleries have thousands) */
function beam(out: MeshBuilder, p0: V3, p1: V3, r: number, c: Rgb, tag: number): void {
  const d: V3 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]]
  const l = Math.hypot(...d) || 1
  const u: V3 = [d[0] / l, d[1] / l, d[2] / l]
  const ref: V3 = Math.abs(u[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
  let a: V3 = [u[1] * ref[2] - u[2] * ref[1], u[2] * ref[0] - u[0] * ref[2], u[0] * ref[1] - u[1] * ref[0]]
  const al = Math.hypot(...a) || 1
  a = [a[0] / al, a[1] / al, a[2] / al]
  const b: V3 = [u[1] * a[2] - u[2] * a[1], u[2] * a[0] - u[0] * a[2], u[0] * a[1] - u[1] * a[0]]
  const P = (p: V3, s1: number, s2: number): V3 => [p[0] + (a[0] * s1 + b[0] * s2) * r, p[1] + (a[1] * s1 + b[1] * s2) * r, p[2] + (a[2] * s1 + b[2] * s2) * r]
  const corners: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
  for (let k = 0; k < 4; k++) {
    const [s1, s2] = corners[k], [t1, t2] = corners[(k + 1) % 4]
    const n: V3 = [a[0] * (s1 + t1) + b[0] * (s2 + t2), a[1] * (s1 + t1) + b[1] * (s2 + t2), a[2] * (s1 + t1) + b[2] * (s2 + t2)]
    out.quad([P(p0, s1, s2), P(p0, t1, t2), P(p1, t1, t2), P(p1, s1, s2)], n, UVQ, c, tag)
  }
}

/** a flat rectangle on the face of edge e, u0..u1 along, y0..y1 up, o out from the wall */
function panel(out: MeshBuilder, e: Ed, u0: number, u1: number, y0: number, y1: number, o: number, c: Rgb, tag = WT): void {
  out.quad([at(e, u0, y0, o), at(e, u1, y0, o), at(e, u1, y1, o), at(e, u0, y1, o)], [e.nx, 0, e.nz], UVQ, c, tag)
}
/** a slab standing off the face (a board with thickness): front, top, ends */
function slab(out: MeshBuilder, e: Ed, u0: number, u1: number, y0: number, y1: number, o0: number, o1: number, c: Rgb, tag = WT): void {
  panel(out, e, u0, u1, y0, y1, o1, c, tag)
  out.quad([at(e, u0, y1, o0), at(e, u1, y1, o0), at(e, u1, y1, o1), at(e, u0, y1, o1)], [0, 1, 0], UVQ, c, tag)
  out.quad([at(e, u0, y0, o0), at(e, u1, y0, o0), at(e, u1, y0, o1), at(e, u0, y0, o1)], [0, -1, 0], UVQ, c, tag)
  for (const [u, s] of [[u0, -1], [u1, 1]] as [number, number][]) {
    out.quad([at(e, u, y0, o0), at(e, u, y0, o1), at(e, u, y1, o1), at(e, u, y1, o0)], [e.tx * s, 0, e.tz * s], UVQ, c, tag)
  }
}

// ---- the shared routine ----------------------------------------------------------------------------------------------
const AWN_TOP = P39_G - 1.0, AWN_LOW = P39_G - 1.75, AWN_OUT = 1.25

function awning(out: MeshBuilder, e: Ed, u0: number, u1: number, w: Awn, text?: string, letters?: Rgb): void {
  const n = w.b ? Math.max(2, Math.round((u1 - u0) / 0.45)) : 1
  for (let k = 0; k < n; k++) {
    const a0 = u0 + ((u1 - u0) * k) / n, a1 = u0 + ((u1 - u0) * (k + 1)) / n
    const c = w.b && k % 2 ? w.b : w.a
    out.quad([at(e, a0, AWN_TOP, 0.04), at(e, a1, AWN_TOP, 0.04), at(e, a1, AWN_LOW, AWN_OUT), at(e, a0, AWN_LOW, AWN_OUT)], [e.nx * 0.6, 0.8, e.nz * 0.6], UVQ, c, WT)
    out.quad([at(e, a0, AWN_TOP, 0.02), at(e, a1, AWN_TOP, 0.02), at(e, a1, AWN_LOW, AWN_OUT - 0.02), at(e, a0, AWN_LOW, AWN_OUT - 0.02)], [-e.nx * 0.6, -0.8, -e.nz * 0.6], UVQ, c, WT)
  }
  // the valance: straight, or scalloped (a row of half-round tongues)
  const vc = w.a
  if (w.scallop) {
    const m = Math.max(2, Math.round((u1 - u0) / 0.55)), d = (u1 - u0) / m
    panel(out, e, u0, u1, AWN_LOW - 0.16, AWN_LOW, AWN_OUT, vc)
    for (let k = 0; k < m; k++) {
      const c0 = u0 + k * d
      for (let s = 0; s < 4; s++) {
        const p0 = c0 + (d * s) / 4, p1 = c0 + (d * (s + 1)) / 4
        const dip = (s2: number): number => 0.18 * Math.sin((Math.PI * s2) / 4)
        out.quad([at(e, p0, AWN_LOW - 0.16, AWN_OUT), at(e, p1, AWN_LOW - 0.16, AWN_OUT), at(e, p1, AWN_LOW - 0.16 - dip(s + 1), AWN_OUT), at(e, p0, AWN_LOW - 0.16 - dip(s), AWN_OUT)],
          [e.nx, 0, e.nz], UVQ, vc, WT)
      }
    }
  } else {
    for (let k = 0; k < n; k++) {
      const a0 = u0 + ((u1 - u0) * k) / n, a1 = u0 + ((u1 - u0) * (k + 1)) / n
      panel(out, e, a0, a1, AWN_LOW - 0.26, AWN_LOW, AWN_OUT, w.b && k % 2 ? w.b : w.a)
    }
  }
  for (const u of [u0, u1]) {
    out.quad([at(e, u, AWN_TOP, 0.04), at(e, u, AWN_LOW, AWN_OUT), at(e, u, AWN_LOW - 0.2, AWN_OUT), at(e, u, AWN_LOW - 0.2, 0.04)], [e.tx, 0, e.tz], UVQ, w.a, WT)
  }
  if (text) {
    const c = at(e, (u0 + u1) / 2, AWN_LOW - 0.1, AWN_OUT + 0.04)
    sign(out, { type: 'flat', text, h: 0.17, w: (u1 - u0) * 0.9, face: 'grotesque', weight: 'bold', colour: letters ?? WHITE, lit: 'none' }, { x: c[0], y: c[1], z: c[2], heading: heading(e) })
  }
}

/** the windows upstairs: white-framed sashes with a glazing bar, a sill under each */
function sashes(out: MeshBuilder, e: Ed, y0: number, trim: Rgb, from = 0.6, to = e.L - 0.6): void {
  const span = to - from
  if (span < 1.2) return
  const n = Math.max(1, Math.round(span / 2.5)), d = span / n
  for (let k = 0; k < n; k++) {
    const c = from + d * (k + 0.5), hw = Math.min(0.55, d * 0.3)
    const wy0 = y0 + 0.95, wy1 = y0 + 2.55
    panel(out, e, c - hw - 0.09, c + hw + 0.09, wy0 - 0.09, wy1 + 0.12, 0.03, trim)
    panel(out, e, c - hw, c + hw, wy0, wy1, 0.05, GLASS, GT)
    panel(out, e, c - hw, c + hw, (wy0 + wy1) / 2 - 0.03, (wy0 + wy1) / 2 + 0.03, 0.07, trim)
    panel(out, e, c - 0.025, c + 0.025, wy0, wy1, 0.07, trim)
    slab(out, e, c - hw - 0.14, c + hw + 0.14, wy0 - 0.15, wy0 - 0.06, 0, 0.12, trim)
  }
}

/** battens: thin vertical boards every 0.7 m over a storey */
function battens(out: MeshBuilder, e: Ed, y0: number, y1: number, c: Rgb): void {
  const n = Math.floor(e.L / 0.7)
  const dark: Rgb = [c[0] * 0.82, c[1] * 0.82, c[2] * 0.82]
  for (let k = 1; k < n; k++) panel(out, e, k * 0.7 - 0.04, k * 0.7 + 0.04, y0, y1, 0.025, dark)
}

/**
 * The roofs: the outline cut into rectangles in its own grain (the longest edge's direction), and over each a steep gable
 * (or hip) of grey shingle — many small roofs, as the aerial photograph shows. The ring's own flat cap is drawn under them,
 * so a corner no rectangle covers is a flat roof, as some of the real ones are.
 */
function roofs(out: MeshBuilder, ring: P2[], y: number, col: Rgb, ends: Rgb, hip: boolean): void {
  let best = 0, ang = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L > best) { best = L; ang = Math.atan2(b.z - a.z, b.x - a.x) }
  }
  const c = Math.cos(ang), s = Math.sin(ang)
  const toG = (p: P2): P2 => ({ x: p.x * c + p.z * s, z: -p.x * s + p.z * c })
  const fromG = (x: number, z: number): P2 => ({ x: x * c - z * s, z: x * s + z * c })
  const r = ring.map(toG)
  const uniq = (v: number[]): number[] => {
    const o: number[] = []
    for (const x of [...v].sort((p, q) => p - q)) if (!o.length || x - o[o.length - 1] > 0.8) o.push(x)
    return o
  }
  const xs = uniq(r.map((p) => p.x)), zs = uniq(r.map((p) => p.z))
  const inside = (x: number, z: number): boolean => {
    let k = false
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const A = r[i], B = r[j]
      if ((A.z > z) !== (B.z > z) && x < ((B.x - A.x) * (z - A.z)) / (B.z - A.z) + A.x) k = !k
    }
    return k
  }
  const nx = xs.length - 1, nz = zs.length - 1
  if (nx < 1 || nz < 1) return
  const cell: boolean[][] = []
  for (let i = 0; i < nx; i++) { cell.push([]); for (let j = 0; j < nz; j++) cell[i].push(inside((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2)) }
  const used = cell.map((row) => row.map(() => false))
  const rects: [number, number, number, number][] = []
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (!cell[i][j] || used[i][j]) continue
    let i1 = i
    while (i1 + 1 < nx && cell[i1 + 1][j] && !used[i1 + 1][j]) i1++
    let j1 = j
    const rowFree = (jj: number): boolean => { for (let k = i; k <= i1; k++) if (!cell[k][jj] || used[k][jj]) return false; return true }
    while (j1 + 1 < nz && rowFree(j1 + 1)) j1++
    for (let a = i; a <= i1; a++) for (let b = j; b <= j1; b++) used[a][b] = true
    rects.push([xs[i], xs[i1 + 1], zs[j], zs[j1 + 1]])
  }
  rects.sort((p, q) => (q[1] - q[0]) * (q[3] - q[2]) - (p[1] - p[0]) * (p[3] - p[2]))
  const P = (x: number, yy: number, z: number): V3 => { const g = fromG(x, z); return [g.x, yy, g.z] }
  const nrm = (a: V3, b: V3, d: V3): V3 => {
    const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v: V3 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]]
    const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const l = Math.hypot(...n) || 1
    return n[1] < 0 ? [-n[0] / l, -n[1] / l, -n[2] / l] : [n[0] / l, n[1] / l, n[2] / l]
  }
  for (const [x0r, x1r, z0r, z1r] of rects.slice(0, 14)) {
    if (x1r - x0r < 2.4 || z1r - z0r < 2.4) continue
    const o = 0.35
    let x0 = x0r - o, x1 = x1r + o, z0 = z0r - o, z1 = z1r + o
    // ridge along the longer side; swap axes by drawing in a frame where the ridge runs along "a"
    const alongX = x1 - x0 >= z1 - z0
    const half = (alongX ? z1 - z0 : x1 - x0) / 2
    const rise = Math.min(4.2, half * Math.tan((36 * Math.PI) / 180))
    const Q = (a: number, b: number, yy: number): V3 => (alongX ? P(a, yy, b) : P(b, yy, a))
    const a0 = alongX ? x0 : z0, a1 = alongX ? x1 : z1, b0 = alongX ? z0 : x0, b1 = alongX ? z1 : x1, bm = (b0 + b1) / 2
    const inset = hip ? Math.min(rise / Math.tan((40 * Math.PI) / 180), (a1 - a0) / 2 - 0.2) : 0
    const r0 = a0 + inset, r1 = a1 - inset, yt = y + rise
    for (const [be, sg] of [[b0, -1], [b1, 1]] as [number, number][]) {
      const q: V3[] = [Q(a0, be, y), Q(a1, be, y), Q(r1, bm, yt), Q(r0, bm, yt)]
      const n = nrm(q[0], q[1], q[3])
      out.quad(q, n, UVQ, col, TT)
      // the soffit under the eaves' overhang
      out.quad([Q(a0, be, y - 0.02), Q(a1, be, y - 0.02), Q(a1, be + (o + 0.1) * -sg, y - 0.02), Q(a0, be + (o + 0.1) * -sg, y - 0.02)], [0, -1, 0], UVQ, [0.3, 0.28, 0.26], WT)
      // the fascia board at the eaves
      out.quad([Q(a0, be, y - 0.22), Q(a1, be, y - 0.22), Q(a1, be, y), Q(a0, be, y)], alongX ? (() => { const g = fromG(0, sg); return [g.x, 0, g.z] as V3 })() : (() => { const g = fromG(sg, 0); return [g.x, 0, g.z] as V3 })(), UVQ, ends, WT)
    }
    for (const [ae, re, sg] of [[a0, r0, -1], [a1, r1, 1]] as [number, number, number][]) {
      const dir = alongX ? fromG(sg, 0) : fromG(0, sg)
      if (hip) {
        const q: V3[] = [Q(ae, b0, y), Q(ae, b1, y), Q(re, bm, yt), Q(re, bm, yt)]
        out.quad(q, nrm(q[0], q[1], q[2]), UVQ, col, TT)
      } else {
        // the gable end: a triangle of boards, set back to the wall line
        const w = ae - sg * o
        out.quad([Q(w, b0 + o, y), Q(w, b1 - o, y), Q(w, bm, yt - o * Math.tan((36 * Math.PI) / 180)), Q(w, bm, yt - o * Math.tan((36 * Math.PI) / 180))], [dir.x, 0, dir.z], UVQ, ends, WT)
        // the bargeboards along its rakes
        for (const be of [b0, b1]) {
          const p0 = Q(ae, be, y - 0.05), p1 = Q(ae, bm, yt - 0.05)
          tube(out, p0, p1, 0.07, 4, [0.92, 0.91, 0.87], WT)
        }
      }
    }
  }
}

/** Le Beastro's tower: a square shaft past the eaves, belfry openings, a mansard cap and a finial */
function towerAt(out: MeshBuilder, p: P2, base: number, colour: Rgb, text: string, e: Ed): void {
  const s = 1.9, top = base + 13.5
  box(out, p.x, (base + top) / 2, p.z, s, (top - base) / 2, s, colour, WT)
  // white corner boards and a cornice
  for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(out, p.x + dx * s, (base + top) / 2, p.z + dz * s, 0.12, (top - base) / 2, 0.12, CREAM, WT)
  box(out, p.x, top + 0.15, p.z, s + 0.25, 0.15, s + 0.25, CREAM, WT)
  // the belfry openings, dark, on each face
  for (const [nx, nz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    box(out, p.x + nx * (s + 0.01), top - 2.2, p.z + nz * (s + 0.01), nz ? 0.7 : 0.02, 1.1, nx ? 0.7 : 0.02, GLASS, GT)
  }
  // the mansard: steep lower slopes, a low pyramid over
  frustum(out, p, top + 0.3, top + 2.6, s + 0.2, s * 0.6)
  frustum(out, p, top + 2.6, top + 3.6, s * 0.6, 0.05)
  tube(out, [p.x, top + 3.6, p.z], [p.x, top + 5.0, p.z], 0.05, 5, GOLD, MT)
  const c: V3 = [p.x + e.nx * (s + 0.1), top - 4.3, p.z + e.nz * (s + 0.1)]
  sign(out, { type: 'flat', text, h: 0.42, w: 3.4, face: 'didone', weight: 'bold', colour: CREAM, panel: [0.2, 0.15, 0.12], lit: 'front' }, { x: c[0], y: c[1], z: c[2], heading: heading(e) })
}

/** a square frustum (half-widths h0 at y0 to h1 at y1), its four sloping faces */
function frustum(out: MeshBuilder, p: P2, y0: number, y1: number, h0: number, h1: number): void {
  for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
    const tx = -dz, tz = dx
    const q: V3[] = [
      [p.x + dx * h0 - tx * h0, y0, p.z + dz * h0 - tz * h0], [p.x + dx * h0 + tx * h0, y0, p.z + dz * h0 + tz * h0],
      [p.x + dx * h1 + tx * h1, y1, p.z + dz * h1 + tz * h1], [p.x + dx * h1 - tx * h1, y1, p.z + dz * h1 - tz * h1],
    ]
    const slope = (h0 - h1) / Math.max(0.01, y1 - y0)
    const l = Math.hypot(1, slope)
    out.quad(q, [dx / l, slope / l, dz / l], UVQ, SHINGLE, TT)
  }
}

/** a twisted barber-pole column: a round shaft wound with a stripe */
function barberPole(out: MeshBuilder, x: number, z: number, y0: number, y1: number, a: Rgb, b: Rgb): void {
  const n = 8
  for (let k = 0; k < n; k++) tube(out, [x, y0 + ((y1 - y0) * k) / n, z], [x, y0 + ((y1 - y0) * (k + 1)) / n, z], 0.13, 6, k % 2 ? a : b, WT)
  box(out, x, y1 + 0.08, z, 0.2, 0.08, 0.2, GOLD, WT)
  box(out, x, y0 + 0.1, z, 0.2, 0.1, 0.2, GOLD, WT)
}

/** a little gabled chalet stall standing on the walk in front of the face, its back to it */
function chalet(out: MeshBuilder, e: Ed, u: number, w: number, c: Rgb, text: string): void {
  const d = 1.9, o0 = 0.6, H = 2.5
  const ctr = at(e, u, 0, o0 + d / 2)
  boxAlong(out, ctr[0], H / 2, ctr[2], w / 2, H / 2, d / 2, Math.atan2(-e.tz, e.tx), c, WT)
  // the counter's opening and its shutter propped up
  panel(out, e, u - w / 2 + 0.25, u + w / 2 - 0.25, 0.95, 1.95, o0 + d + 0.01, [0.25, 0.2, 0.18])
  slab(out, e, u - w / 2 + 0.2, u + w / 2 - 0.2, 0.9, 1.0, o0 + d, o0 + d + 0.35, WHITE)
  // its steep little gable roof, ridge out from the wall, white bargeboards
  const ridge = H + 1.3
  for (const s of [-1, 1]) {
    const q: V3[] = [at(e, u + s * (w / 2 + 0.2), H, o0 - 0.1), at(e, u + s * (w / 2 + 0.2), H, o0 + d + 0.3), at(e, u, ridge, o0 + d + 0.3), at(e, u, ridge, o0 - 0.1)]
    out.quad(q, [e.tx * s * 0.7, 0.7, e.tz * s * 0.7], UVQ, s < 0 ? [0.72, 0.3, 0.38] : [0.68, 0.27, 0.35], TT)
  }
  out.quad([at(e, u - w / 2, H, o0 + d + 0.01), at(e, u + w / 2, H, o0 + d + 0.01), at(e, u, ridge - 0.1, o0 + d + 0.01), at(e, u, ridge - 0.1, o0 + d + 0.01)], [e.nx, 0, e.nz], UVQ, WHITE, WT)
  const sp = at(e, u, H + 0.42, o0 + d + 0.04)
  sign(out, { type: 'flat', text, h: 0.16, w: w * 0.8, face: 'script', colour: [0.6, 0.15, 0.3], lit: 'none' }, { x: sp[0], y: sp[1], z: sp[2], heading: heading(e) })
}

/**
 * A gallery along one walk face, where OSM has none: a plank deck 1.8 m deep at the upper floor on posts with knee braces,
 * a railing of close pickets; on a `t` face an open timber stair runs down beside it, parallel to the wall, from one end.
 */
function attachedGallery(out: MeshBuilder, e: Ed, G: number, stair: boolean, seed: number): void {
  const D = 1.8, u0 = 0.1, u1 = e.L - 0.1
  out.quad([at(e, u0, G, 0), at(e, u1, G, 0), at(e, u1, G, D), at(e, u0, G, D)], [0, 1, 0], UVQ, DECK, WT)
  out.quad([at(e, u0, G - 0.32, D), at(e, u1, G - 0.32, D), at(e, u1, G + 0.05, D), at(e, u0, G + 0.05, D)], [e.nx, 0, e.nz], UVQ, BEAM, WT)
  out.quad([at(e, u0, G - 0.32, 0), at(e, u1, G - 0.32, 0), at(e, u1, G - 0.32, D), at(e, u0, G - 0.32, D)], [0, -1, 0], UVQ, [0.28, 0.23, 0.18], WT)
  const np = Math.max(1, Math.round((u1 - u0) / 3))
  for (let k = 0; k <= np; k++) {
    const u = u0 + 0.12 + ((u1 - u0 - 0.24) * k) / np
    beam(out, at(e, u, 0, D - 0.15), at(e, u, G - 0.3, D - 0.15), 0.11, BEAM, WT)
    // the knee braces, from the post to the beam
    if (k < np) beam(out, at(e, u, G - 1.2, D - 0.15), at(e, u + 0.9, G - 0.32, D - 0.15), 0.05, BEAM, WT)
    if (k > 0) beam(out, at(e, u, G - 1.2, D - 0.15), at(e, u - 0.9, G - 0.32, D - 0.15), 0.05, BEAM, WT)
  }
  // the stair: which end, and the gap it leaves in the rail
  const end = seed > 0.5 ? 1 : -1, run = Math.min(6.2, e.L - 1.2)
  const uTop = end > 0 ? u1 - 0.3 : u0 + 0.3, uFoot = uTop - end * run
  const gap0 = stair ? Math.min(uTop, uTop - end * 1.5) : 0, gap1 = stair ? Math.max(uTop, uTop - end * 1.5) : 0
  const railRun = (a0: number, a1: number): void => {
    if (a1 - a0 < 0.3) return
    const o = D - 0.05
    beam(out, at(e, a0, G + 1.05, o), at(e, a1, G + 1.05, o), 0.06, RAIL, WT)
    beam(out, at(e, a0, G + 0.15, o), at(e, a1, G + 0.15, o), 0.04, RAIL, WT)
    for (const u of [a0, a1]) beam(out, at(e, u, G, o), at(e, u, G + 1.12, o), 0.06, RAIL, WT)
    const n = Math.floor((a1 - a0) / 0.3)
    for (let k = 1; k < n; k++) {
      const u = a0 + k * 0.3
      for (const sg of [1, -1]) out.quad([at(e, u - 0.03, G + 0.15, o), at(e, u + 0.03, G + 0.15, o), at(e, u + 0.03, G + 1.02, o), at(e, u - 0.03, G + 1.02, o)], [e.nx * sg, 0, e.nz * sg], UVQ, RAIL, WT)
    }
  }
  if (stair && run > 3.5) { railRun(u0, gap0); railRun(gap1, u1) } else railRun(u0, u1)
  if (!stair || run <= 3.5) return
  // the flight: plank treads between two heavy stringers, the pier's blue handrails, a post under its top
  const w = 1.3, oc = D + w / 2 + 0.05
  const n = Math.max(2, Math.round(G / 0.19))
  for (let k = 0; k < n; k++) {
    const u = uFoot + (end * run * (k + 0.5)) / n, y = (G * (k + 1)) / n
    const c = at(e, u, y - 0.03, oc)
    boxAlong(out, c[0], c[1], c[2], (run / n) * 0.55, 0.035, w / 2, Math.atan2(-e.tz, e.tx), STEP, WT)
  }
  for (const o of [oc - w / 2 - 0.05, oc + w / 2 + 0.05]) {
    beam(out, at(e, uFoot, -0.1, o), at(e, uTop, G - 0.1, o), 0.1, BEAM, WT)
    tube(out, at(e, uFoot, 0.92, o), at(e, uTop, G + 0.92, o), 0.035, 6, RAILBLUE, MT)
    for (let k = 0; k <= 3; k++) {
      const u = uFoot + (end * run * k) / 3, y = (G * k) / 3
      tube(out, at(e, u, y, o), at(e, u, y + 0.92, o), 0.025, 5, RAILBLUE, MT)
    }
  }
  beam(out, at(e, uTop - end * 0.4, 0, oc), at(e, uTop - end * 0.4, G - 0.3, oc), 0.1, BEAM, WT)
}

/**
 * One Pier 39 building in its style. `id` is the OSM way the manifest claims. Everything stands on the deck: the model is
 * lifted to the ground under its middle (the loader seats it on the lowest ground under the outline, which beside the
 * marinas is the sea bed's), and a skirt of dark piles closes the gap.
 */
export function pier39Building(id: number): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const st = P39_STYLES[id]
    // (the boardwalk under its LOWEST walk face: the north end of the pier falls a few metres, and a floor set to its middle
    // floated over the walk on that side)
    const walkMids = edgesOf(fit, id).eds.filter((e) => e.kind === 's' && e.L >= 2).map((e) => fit.groundAt?.((e.a.x + e.b.x) / 2 + e.nx * 1.5, (e.a.z + e.b.z) / 2 + e.nz * 1.5))
      .filter((v): v is number => v !== undefined)
    const lift = Math.max(0, walkMids.length ? Math.min(...walkMids) : fit.groundAt?.(0, 0) ?? fit.grade ?? 0)
    const v0 = out.positions.length / 3, s0 = out.signs.length
    drawBuilding(out, fit, id, st)
    if (lift > 0.05) {
      for (let i = v0; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += lift
      for (let i = s0; i < out.signs.length; i++) out.signs[i] = { ...out.signs[i], y: out.signs[i].y + lift }
    }
    /*
     * The skirt of dark piles from the lowest ground under the outline up to the floor. A building seated on the pier deck
     * by its manifest's `deckAbove` (M, K and L round the carousel, 2026-10-17: seated on the lowest ground, M's floor was
     * 6.5 m under the carousel plaza and its awnings "touching the ground") has ground that sags BELOW its base — the baked
     * ground north of the carousel falls to 6 m under the sea — so there the skirt reaches down instead.
     */
    const { ring } = edgesOf(fit, id)
    const low = Math.min(0, ...ring.flatMap((q, i) => {
      const r = ring[(i + 1) % ring.length]
      return [fit.groundAt?.(q.x, q.z) ?? 0, fit.groundAt?.((q.x + r.x) / 2, (q.z + r.z) / 2) ?? 0]
    }))
    if (lift > 0.05 || low < -0.05) faceBand(out, ring, low, lift + 0.05, { kind: 'blank', wall: [0.32, 0.28, 0.24], material: 'clapboard' })
  }
}

function drawBuilding(out: MeshBuilder, fit: Fit, id: number, st: P39Style): void {
  const { ring, eds } = edgesOf(fit, id)
  const low = st.low
  const two = !low && (fit.height || 9) >= 6.5
  const G = low ?? P39_G, H = two ? G + U : G
  const feats = st.features ?? []
  const paintOf = (i: number): { wall: Rgb; upper: Rgb; trim: Rgb } => {
    const p = feats.find((f): f is Extract<Feature, { kind: 'paint' }> => f.kind === 'paint' && f.edges.includes(i))
    return { wall: p?.wall ?? st.wall, upper: p?.upper ?? st.upper, trim: p?.trim ?? st.trim }
  }
  const glazed = new Set(feats.filter((f): f is Extract<Feature, { kind: 'glazing' }> => f.kind === 'glazing').map((f) => f.e))
  const parapets = new Set(feats.filter((f): f is Extract<Feature, { kind: 'parapet' }> => f.kind === 'parapet').map((f) => f.e))
  const words = st.words ?? ['GIFTS', 'SOUVENIRS', 'T-SHIRTS', 'CANDY', 'SAN FRANCISCO']
  let wordN = Math.floor(hash(fit.hx, fit.hz) * words.length)

  for (const e of eds) {
    const pc = paintOf(e.i)
    const walk = e.kind === 's'
    // GROUND FLOOR: a walk face is shopfronts — glass in heavy timber frames; the others are boards and a few windows
    if (walk && e.L >= 2.2) {
      faceBand(out, ring, 0, G, { kind: 'curtain', wall: pc.trim, glass: st.glass ?? SHOPGLASS, pitch: 2.8, floor: G, material: 'glass' }, [e.i])
      // a sill board under the glass and a fascia board over it, and the posts between the bays
      panel(out, e, 0, e.L, 0, 0.5, 0.06, pc.wall)
      panel(out, e, 0, e.L, G - 0.75, G, 0.06, pc.wall)
      const nb = Math.max(1, Math.round(e.L / 3.2))
      for (let k = 0; k <= nb; k++) slab(out, e, Math.max(0, (e.L * k) / nb - 0.14), Math.min(e.L, (e.L * k) / nb + 0.14), 0, G - 0.75, 0.04, 0.18, pc.wall)
    } else {
      faceBand(out, ring, 0, G, e.kind === 'h' ? { kind: 'blank', wall: pc.wall, material: 'clapboard' }
        : { kind: 'punched', wall: pc.wall, glass: GLASS, pitch: 3.2, floor: G, solid: 0.72, material: 'clapboard' }, [e.i])
    }
    if (st.batten && e.kind !== 'h' && !walk) battens(out, e, 0, G, pc.wall)
    // UPPER STOREY: boards and white sash windows; a restaurant's big windows where `glazing` says
    if (two) {
      if (glazed.has(e.i)) {
        faceBand(out, ring, G, H, { kind: 'curtain', wall: pc.trim, glass: [0.3, 0.4, 0.46], pitch: 1.6, floor: U, material: 'glass' }, [e.i])
      } else {
        faceBand(out, ring, G, H, { kind: 'blank', wall: pc.upper, material: 'clapboard' }, [e.i])
        if (st.batten && e.kind !== 'h') battens(out, e, G, H, pc.upper)
        if (e.kind !== 'h') sashes(out, e, G, pc.trim)
      }
      // the corner boards and the frieze under the eaves
      panel(out, e, 0, e.L, H - 0.3, H, 0.04, pc.trim)
      if (walk && e.gal && e.L >= 4) attachedGallery(out, e, G, e.gal === 't', hash(e.a.z, e.a.x))
    }
    if (e.kind === 'h') continue
    panel(out, e, 0, 0.16, 0, H, 0.05, pc.trim)
    // SHOP NAMES: the OSM shops on this face where OSM puts them; upstairs ones on the upper wall
    if (!walk || e.L < 2.2) continue
    const own = feats.filter((f) => 'e' in f && f.e === e.i)
    const awned = own.some((f) => f.kind === 'awning' || f.kind === 'moorish' || f.kind === 'open' || f.kind === 'cone')
    if (st.awn && e.L >= 3 && !awned) {
      const nb = Math.max(1, Math.round(e.L / 3.2)), bw = e.L / nb
      for (let k = 0; k < nb; k++) if (hash(e.a.x + k, e.a.z - k) > 0.22) awning(out, e, k * bw + 0.25, (k + 1) * bw - 0.25, st.awn)
    }
    const boards = e.pois.length ? e.pois : e.L >= 6 ? [{ name: words[wordN++ % words.length], t: 0.5, lvl: 0 }] : []
    for (const p of boards) {
      if (own.some((f) => f.kind === 'board' && Math.abs(f.t - p.t) < 0.15)) continue
      if (own.some((f) => 'text' in f && typeof f.text === 'string' && f.text.toLowerCase().replace(/[^a-z]/g, '').includes(p.name.toLowerCase().replace(/[^a-z]/g, '')))) continue
      const up = p.lvl >= 1 && two
      const u = Math.max(1, Math.min(e.L - 1, p.t * e.L))
      const w = Math.min(e.L - 0.4, Math.max(2.2, Math.min(6, p.name.length * 0.26)))
      const y = up ? G + 2.95 : G - 0.37
      const c = at(e, Math.max(w / 2 + 0.1, Math.min(e.L - w / 2 - 0.1, u)), y, up ? 0.12 : 0.1)
      sign(out, { type: 'flat', text: p.name, h: up ? 0.3 : 0.28, w, face: st.boardFace ?? (hash(u, e.i) > 0.5 ? 'slab' : 'didone'), weight: 'bold',
        colour: st.boardInk ?? WHITE, panel: st.boardPanel ?? (st.awn?.a ?? NAVY), lit: 'front' }, { x: c[0], y: c[1], z: c[2], heading: heading(e) })
    }
  }

  // THE ROOFS: the flat cap under them, then the gables (a parapet face keeps a flat roof behind its parapet)
  capPolygon(out, ring, H, [0.27, 0.28, 0.3], 0)
  if (!parapets.size || !two) roofs(out, ring, H, SHINGLE, paintOf(eds[0]?.i ?? 0).upper, !!st.hip || !!low)
  else roofs(out, ring.map((p) => p), H, SHINGLE, st.upper, true)

  // THE BUILDING'S OWN PIECES
  for (const f of feats) {
    if (!('e' in f)) continue
    const e = eds[f.e]
    if (!e) continue
    switch (f.kind) {
      case 'awning': awning(out, e, f.t0 * e.L, f.t1 * e.L, f.awn, f.text, f.letters); break
      case 'board': {
        const y = f.y ?? G - 0.37
        const w = f.w ?? Math.min(e.L - 0.4, 6)
        const c = at(e, f.t * e.L, y, 0.13)
        sign(out, { type: 'flat', text: f.text, h: f.h ?? 0.3, w, face: f.face, weight: 'bold', colour: f.colour, panel: f.panel, lit: 'front' },
          { x: c[0], y: c[1], z: c[2], heading: heading(e) })
        break
      }
      case 'parapet': {
        // white stucco stepped up to a peak in the middle, a coping along its top, the name in red capitals
        const steps = [0, 0.18, 0.36, 0.5, 0.64, 0.82, 1], hts = [0.6, 1.1, 1.7, 2.3, 1.7, 1.1, 0.6]
        for (let k = 0; k + 1 < steps.length; k++) {
          const hh = hts[k] > hts[k + 1] ? hts[k] : hts[k + 1]
          slab(out, e, steps[k] * e.L, steps[k + 1] * e.L, H - 0.3, H + Math.min(hh, k === 2 || k === 3 ? 2.3 : hh), 0.0, 0.3, WHITE, ST)
          slab(out, e, steps[k] * e.L - 0.05, steps[k + 1] * e.L + 0.05, H + Math.min(hh, k === 2 || k === 3 ? 2.3 : hh), H + Math.min(hh, k === 2 || k === 3 ? 2.3 : hh) + 0.12, -0.05, 0.38, [0.8, 0.5, 0.36], TT)
        }
        const c = at(e, e.L / 2, H + 0.75, 0.33)
        sign(out, { type: 'flat', text: f.text, h: 0.55, w: e.L * 0.82, face: 'grotesque', weight: 'bold', colour: RED, lit: 'front' }, { x: c[0], y: c[1], z: c[2], heading: heading(e) })
        break
      }
      case 'tower': {
        const p = f.t < 0.5 ? e.a : e.b
        const q = { x: p.x - e.nx * 1.4 + e.tx * (f.t < 0.5 ? 1.4 : -1.4), z: p.z - e.nz * 1.4 + e.tz * (f.t < 0.5 ? 1.4 : -1.4) }
        towerAt(out, q, 0, f.colour, f.text, e)
        break
      }
      case 'moorish': {
        // a pink front wall with a run of horseshoe-headed openings on barber poles, lavender spandrels, KRAZY KAPS over
        const u0 = f.t0 * e.L, u1 = f.t1 * e.L, n = Math.max(2, Math.round((u1 - u0) / 2.6)), d = (u1 - u0) / n
        const o = 1.4, top = G + 0.9
        for (let k = 0; k <= n; k++) {
          const p = at(e, u0 + k * d, 0, o)
          barberPole(out, p[0], p[2], 0, 2.9, PINK, WHITE)
        }
        // the arch heads: each opening's spandrel blocks, lavender, the horseshoe's dark soffit
        for (let k = 0; k < n; k++) {
          const a0 = u0 + k * d, a1 = a0 + d
          for (let s = 0; s < 6; s++) {
            const p0 = a0 + (d * s) / 6, p1 = a0 + (d * (s + 1)) / 6
            const arch = (pp: number): number => 2.9 + 0.75 * Math.sqrt(Math.max(0, 1 - ((pp - (a0 + a1) / 2) / (d / 2)) ** 2))
            out.quad([at(e, p0, arch(p0), o + 0.15), at(e, p1, arch(p1), o + 0.15), at(e, p1, top, o + 0.15), at(e, p0, top, o + 0.15)], [e.nx, 0, e.nz], UVQ, k % 2 ? LAVENDER : PINK, ST)
          }
        }
        slab(out, e, u0 - 0.2, u1 + 0.2, top, top + 0.9, -0.05, o + 0.3, LAVENDER, ST)
        // the canopy roof back to the wall
        out.quad([at(e, u0 - 0.2, top + 0.9, 0), at(e, u1 + 0.2, top + 0.9, 0), at(e, u1 + 0.2, top + 0.9, o + 0.3), at(e, u0 - 0.2, top + 0.9, o + 0.3)], [0, 1, 0], UVQ, PURPLE, ST)
        // little onion finials along it
        for (let k = 0; k <= n; k++) {
          const p = at(e, u0 + k * d, top + 0.9, o + 0.15)
          prism(out, p[0], p[2], top + 0.9, top + 1.25, 0.18, 8, GOLD, MT)
          tube(out, [p[0], top + 1.25, p[2]], [p[0], top + 1.6, p[2]], 0.12, 6, GOLD, MT, 0.01)
        }
        const c = at(e, (u0 + u1) / 2, top + 0.45, o + 0.34)
        sign(out, { type: 'flat', text: f.text, h: 0.52, w: (u1 - u0) * 0.9, face: 'brush', weight: 'bold', colour: [0.95, 0.85, 0.2], halo: PURPLE, lit: 'front' }, { x: c[0], y: c[1], z: c[2], heading: heading(e) })
        break
      }
      case 'chalets': {
        const u0 = f.t0 * e.L, u1 = f.t1 * e.L, n = Math.max(1, Math.round((u1 - u0) / 2.4)), d = (u1 - u0) / n
        for (let k = 0; k < n; k++) chalet(out, e, u0 + d * (k + 0.5), Math.min(2.0, d - 0.3), f.colours[k % f.colours.length], f.text)
        break
      }
      case 'cone': {
        // a kiosk built out from the wall: counter, striped awning all round, its name, and on its roof a cone
        const u = Math.max(1.4, Math.min(e.L - 1.4, f.t * e.L)), w = Math.min(3.2, e.L - 0.4), d = 2.7
        slab(out, e, u - w / 2, u + w / 2, 0, 1.05, 0, d, WHITE)
        slab(out, e, u - w / 2, u + w / 2, 2.75, 3.1, 0, d, f.awn.a)
        for (const s of [-1, 1]) { const p = at(e, u + s * (w / 2 - 0.08), 0, d - 0.08); box(out, p[0], 1.4, p[2], 0.07, 1.4, 0.07, WHITE, WT) }
        const ee: Ed = { ...e, a: { x: e.a.x + e.nx * d, z: e.a.z + e.nz * d } }
        awning(out, ee, u - w / 2, u + w / 2, f.awn)
        /*
         * Its name on a white board of its own standing on the kiosk's roof, ABOVE the awning (owner, 2026-10-17: "the Gelato
         * sign is buried in an awning" — lettered at the awning's own top edge, 3.1 m, the canvas covered it): the board from
         * the roof (3.1 m) to 4.15 m, just behind the awning's head (3.2 m at the kiosk's front), beside the giant cone, not behind it.
         */
        const b0 = u - w / 2 + 0.1, b1 = Math.max(b0 + 0.9, u + w / 2 - 1.15), bm = (b0 + b1) / 2
        slab(out, e, b0, b1, 3.1, 4.15, d - 0.16, d - 0.06, WHITE)
        slab(out, e, b0 - 0.04, b1 + 0.04, 4.15, 4.22, d - 0.18, d - 0.04, f.awn.a)
        const cs = at(e, bm, 3.56, d - 0.02)
        sign(out, { type: 'flat', text: f.text, h: 0.26, w: (b1 - b0) * 0.92, face: 'slab', weight: 'bold', colour: RED, lit: 'front' }, { x: cs[0], y: cs[1], z: cs[2], heading: heading(e) })
        if (f.sub) sign(out, { type: 'flat', text: f.sub, h: 0.2, w: (b1 - b0) * 0.7, face: 'script', colour: RED, lit: 'front' }, { x: cs[0], y: cs[1] + 0.36, z: cs[2], heading: heading(e) })
        // the giant cone: a waffle cone point-down, three scoops, a cherry (TRIPO.md: the real one)
        const cp = at(e, u + w / 2 - 0.55, 0, d - 0.45)
        tube(out, [cp[0], 3.15, cp[2]], [cp[0], 4.9, cp[2]], 0.02, 10, [0.82, 0.6, 0.3], WT, 0.5)
        const scoops: Rgb[] = [[0.96, 0.9, 0.8], [0.9, 0.55, 0.62], [0.45, 0.28, 0.18]]
        scoops.forEach((c, k) => prism(out, cp[0], cp[2], 4.85 + k * 0.42, 5.3 + k * 0.42, 0.5 - k * 0.08, 12, c, WT))
        prism(out, cp[0], cp[2], 6.1, 6.3, 0.1, 8, RED, WT)
        break
      }
      case 'cutout': {
        // a cook in whites holding a big fish, painted on a cut-out board fixed upstairs (TRIPO.md: the real figure)
        const u = f.t * e.L, o = 0.35, y0 = G + 0.2
        const pt = (du: number, dy: number): V3 => at(e, u + du, y0 + dy, o)
        const q = (pts: [number, number][], c: Rgb): void => out.quad(pts.map(([a, b]) => pt(a, b)) as V3[], [e.nx, 0, e.nz], UVQ, c, WT)
        q([[-0.5, 0], [0.5, 0], [0.45, 1.6], [-0.45, 1.6]], WHITE)            // apron and coat
        q([[-0.42, 1.6], [0.42, 1.6], [0.3, 2.1], [-0.3, 2.1]], WHITE)
        q([[-0.22, 2.1], [0.22, 2.1], [0.24, 2.55], [-0.24, 2.55]], [0.92, 0.72, 0.58])   // face
        q([[-0.3, 2.55], [0.3, 2.55], [0.36, 3.05], [-0.36, 3.05]], WHITE)     // toque
        q([[-1.25, 1.25], [0.9, 1.45], [1.0, 1.75], [-1.2, 1.6]], [0.45, 0.6, 0.66])   // the fish
        q([[0.9, 1.45], [1.4, 1.2], [1.45, 2.0], [1.0, 1.75]], [0.4, 0.55, 0.6])      // its tail
        q([[-0.15, 2.3], [-0.05, 2.3], [-0.05, 2.38], [-0.15, 2.38]], INK)
        q([[0.05, 2.3], [0.15, 2.3], [0.15, 2.38], [0.05, 2.38]], INK)
        break
      }
      case 'produce': {
        // four poles, a striped canvas roof, a table of crates of fruit
        const u = f.t * e.L, o0 = 1.6, w = 2.6, d = 1.8
        for (const [du, dd] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) {
          const p = at(e, u + (du * w) / 2, 0, o0 + dd * d)
          tube(out, [p[0], 0, p[2]], [p[0], 2.4, p[2]], 0.04, 5, [0.85, 0.85, 0.82], MT)
        }
        const ee: Ed = { ...e, a: { x: e.a.x + e.nx * o0, z: e.a.z + e.nz * o0 } }
        const n = 8
        for (let k = 0; k < n; k++) {
          const a0 = u - w / 2 + (w * k) / n, a1 = a0 + w / n
          out.quad([at(ee, a0, 2.55, 0), at(ee, a1, 2.55, 0), at(ee, a1, 2.3, d), at(ee, a0, 2.3, d)], [0, 1, 0], UVQ, k % 2 ? f.awn.b ?? WHITE : f.awn.a, WT)
          out.quad([at(ee, a0, 2.55, 0), at(ee, a1, 2.55, 0), at(ee, a1, 2.3, d), at(ee, a0, 2.3, d)], [0, -1, 0], UVQ, k % 2 ? f.awn.b ?? WHITE : f.awn.a, WT)
        }
        slab(out, ee, u - w / 2 + 0.15, u + w / 2 - 0.15, 0, 0.85, 0.2, d - 0.2, [0.55, 0.42, 0.28])
        const fruit: Rgb[] = [[0.9, 0.5, 0.1], [0.8, 0.12, 0.1], [0.95, 0.85, 0.2], [0.35, 0.6, 0.18]]
        for (let k = 0; k < 4; k++) slab(out, ee, u - w / 2 + 0.25 + k * 0.6, u - w / 2 + 0.75 + k * 0.6, 0.85, 1.0, 0.35, d - 0.35, fruit[k])
        break
      }
      case 'billboard': {
        // a green steel lattice standing on the eaves, the board on it in colour bands, the words across
        const u = f.t * e.L, w = Math.min(7, e.L), y0 = H, y1 = H + 3.4
        for (const s of [-1, 1]) {
          const p = at(e, u + (s * w) / 2, 0, -0.4)
          tube(out, [p[0], y0 - 0.5, p[2]], [p[0], y1, p[2]], 0.08, 4, GREEN, MT)
        }
        for (let k = 0; k < 4; k++) {
          const a = at(e, u - w / 2 + (w * k) / 4, y0, -0.4), b = at(e, u - w / 2 + (w * (k + 1)) / 4, y0 + 1.2, -0.4)
          tube(out, a, b, 0.04, 4, GREEN, MT)
        }
        f.bands.forEach((c, k) => slab(out, e, u - w / 2, u + w / 2, y0 + 1.2 + k * 0.72, y0 + 1.2 + (k + 1) * 0.72, -0.35, -0.25, c, MT))
        const cc = at(e, u, y0 + 1.2 + 1.08, -0.22)
        sign(out, { type: 'flat', text: f.text, h: 0.55, w: w * 0.9, face: 'block', weight: 'bold', colour: WHITE, halo: INK, lit: 'front' }, { x: cc[0], y: cc[1], z: cc[2], heading: heading(e) })
        break
      }
      case 'portal': {
        const u = f.t * e.L, w = Math.min(3.4, e.L - 0.4)
        for (const s of [-1, 1]) slab(out, e, u + s * w / 2 - 0.25, u + s * w / 2 + 0.25, 0, G - 0.2, 0, 0.35, f.colour, ST)
        slab(out, e, u - w / 2 - 0.35, u + w / 2 + 0.35, G - 1.1, G + 0.4, 0, 0.4, f.colour, ST)
        const c = at(e, u, G - 0.35, 0.43)
        sign(out, { type: 'flat', text: f.text, h: 0.4, w: w + 0.4, face: 'grotesque', weight: 'bold', colour: f.letters, lit: 'front' }, { x: c[0], y: c[1], z: c[2], heading: heading(e) })
        break
      }
      case 'open': {
        // the glass gone: a dark interior, white posts, a teal awning across
        const u0 = f.t0 * e.L, u1 = f.t1 * e.L
        panel(out, e, u0, u1, 0.02, G - 0.8, 0.07, [0.2, 0.18, 0.17])
        const n = Math.max(1, Math.round((u1 - u0) / 2))
        for (let k = 0; k <= n; k++) slab(out, e, u0 + ((u1 - u0) * k) / n - 0.1, u0 + ((u1 - u0) * k) / n + 0.1, 0, G - 0.75, 0.05, 0.25, f.posts)
        awning(out, e, u0, u1, f.awn)
        break
      }
      case 'marlin': {
        // a flat white fish arched over the fascia: body, long bill, sail fin, forked tail
        const u = f.t * e.L, o = 0.14, y0 = G - 0.42
        const pt = (du: number, dy: number): V3 => at(e, u + du, y0 + dy, o)
        const q = (pts: [number, number][]): void => out.quad(pts.map(([a, b]) => pt(a, b)) as V3[], [e.nx, 0, e.nz], UVQ, WHITE, WT)
        q([[-0.8, -0.05], [0.6, -0.12], [0.7, 0.14], [-0.7, 0.18]])
        q([[0.6, -0.04], [1.5, 0.06], [1.5, 0.09], [0.65, 0.08]])
        q([[-0.5, 0.16], [0.35, 0.1], [0.1, 0.62], [-0.45, 0.55]])
        q([[-0.8, -0.05], [-1.25, -0.42], [-1.0, 0.05], [-1.25, 0.5]])
        break
      }
      case 'crab': {
        const u = f.t * e.L, y = two ? G + 1.8 : G - 0.4
        const c = at(e, u - 1.6, y, 0.14)
        // the crab: a red oval body, eight legs, two claws
        for (let k = 0; k < 10; k++) {
          const a0 = (k / 10) * Math.PI * 2, a1 = ((k + 1) / 10) * Math.PI * 2
          const P = (a: number): V3 => [c[0] + e.tx * Math.cos(a) * 0.75, c[1] + Math.sin(a) * 0.5, c[2] + e.tz * Math.cos(a) * 0.75]
          out.quad([c, P(a0), P(a1), P(a1)], [e.nx, 0, e.nz], UVQ, RED, WT)
        }
        for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
          const p0: V3 = [c[0] + e.tx * s * 0.6, c[1] - 0.1 - k * 0.08, c[2] + e.tz * s * 0.6]
          const p1: V3 = [c[0] + e.tx * s * (1.15 + k * 0.05), c[1] - 0.45 - k * 0.12, c[2] + e.tz * s * (1.15 + k * 0.05)]
          tube(out, p0, p1, 0.05, 4, RED, WT)
        }
        for (const s of [-1, 1]) {
          const p0: V3 = [c[0] + e.tx * s * 0.5, c[1] + 0.35, c[2] + e.tz * s * 0.5]
          const p1: V3 = [c[0] + e.tx * s * 0.95, c[1] + 0.9, c[2] + e.tz * s * 0.95]
          tube(out, p0, p1, 0.08, 5, RED, WT)
          prism(out, p1[0], p1[2], p1[1] - 0.05, p1[1] + 0.3, 0.17, 6, RED, WT)
        }
        const t = at(e, u + 1.0, y, 0.16)
        sign(out, { type: 'flat', text: f.text, h: 0.42, w: Math.min(4, e.L * 0.6), face: 'slab', weight: 'bold', colour: WHITE, panel: RED, lit: 'front' }, { x: t[0], y: t[1], z: t[2], heading: heading(e) })
        break
      }
      default: break
    }
  }
}

// ---- the galleries ---------------------------------------------------------------------------------------------------
const DECK: Rgb = [0.5, 0.44, 0.36], BEAM: Rgb = [0.34, 0.27, 0.21], RAIL: Rgb = [0.44, 0.36, 0.28], STEP: Rgb = [0.52, 0.45, 0.36]
const RAILBLUE: Rgb = [0.12, 0.33, 0.68]

/**
 * PIER 39's UPPER GALLERIES and their STAIRS, the whole pier in one model (owner, 2026-10-17: "the second floor walkways
 * are mostly continuous, with zany wood staircases going up and down"): a plank deck at the upper floor (P39_G over the
 * boardwalk) along every OSM level-1 footway (P39_GALLERY; the bake drew them flat on the boardwalk among the shops — they
 * are suppressed there, public/patches/san-francisco.json), on timber posts with knee braces where no wall carries it, a
 * timber railing of close pickets on the open side; the OSM bridge pieces get a deeper beam and X-braced sides. The stairs
 * (P39_STAIRS: OSM highway=steps) are open timber flights — heavy stringers, plank treads, a landing at every turn and
 * halfway up the long ones — with the pier's blue steel handrails (Mapillary 2436573056971574, 1085782470377031). And the
 * blue lamp posts with their PIER 39 banners, the benches and the wine-barrel planters on the main walk (photographs 1, 5,
 * 6). Placed at 37.8099 −122.4104, rotateDeg 0 (x east, z north); `baseY` the boardwalk, every height off `groundAt`.
 */
export function pier39Galleries(out: MeshBuilder, fit: Fit, part = -1): void {
  // (in three parts, south, middle and north, each its own manifest entry: the whole pier in one mesh was 65 000 triangles)
  const partOf = (z: number): number => (z < -60 ? 0 : z < 35 ? 1 : 2)
  const mine = (z: number): boolean => part < 0 || partOf(z) === part
  const gr = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0
  /*
   * The upper floor the galleries serve, over (x, z): the ground under them + P39_G — except north of the carousel, where
   * Buildings K, L and M stand on the deck's datum (their manifest `deckAbove`, 2026-10-17) over ground that sags up to 6 m
   * below it; there the galleries keep to the deck too (their posts and the stairs' feet still reach the real ground).
   * When the pier's ground is made flat (a zone), this is the same thing.
   */
  const floorGr = (x: number, z: number): number => (z > P39_DECK_NORTH ? Math.max(gr(x, z), 0) : gr(x, z))
  const W = 1.35
  for (const g of P39_GALLERY) {
    if (!mine(g.p.reduce((acc, q) => acc + q[1], 0) / g.p.length)) continue
    const p = g.p.map(([x, z]) => ({ x, z, y: floorGr(x, z) + P39_G }))
    for (let i = 0; i + 1 < p.length; i++) {
      const a = p[i], b = p[i + 1]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L < 0.05) continue
      const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = -tz, nz = tx
      const Q = (u: number, o: number, dy: number): V3 => {
        const y = a.y + ((b.y - a.y) * u) / L
        return [a.x + tx * u + nx * o, y + dy, a.z + tz * u + nz * o]
      }
      // the planks, the beams either side, the soffit
      out.quad([Q(0, -W, 0), Q(L, -W, 0), Q(L, W, 0), Q(0, W, 0)], [0, 1, 0], UVQ, DECK, WT)
      const deep = g.b ? 0.75 : 0.32
      for (const o of [-W, W]) out.quad([Q(0, o, -deep), Q(L, o, -deep), Q(L, o, 0.06), Q(0, o, 0.06)], [nx * Math.sign(o), 0, nz * Math.sign(o)], UVQ, BEAM, WT)
      out.quad([Q(0, -W, -deep), Q(L, -W, -deep), Q(L, W, -deep), Q(0, W, -deep)], [0, -1, 0], UVQ, [0.28, 0.23, 0.18], WT)
      const [left, right] = g.r[i] ?? [1, 1]
      const cut0 = i === 0 && g.j[0] ? 1.5 : 0, cut1 = i === p.length - 2 && g.j[1] ? 1.5 : 0
      for (const [side, open] of [[-1, left], [1, right]] as [number, number][]) {
        if (!open) continue
        const o = side * (W - 0.06)
        const u0 = cut0, u1 = L - cut1
        // posts to the boardwalk, every ~3 m, each with a knee brace up to the beam
        const np = Math.max(1, Math.round(L / 3))
        for (let k = 0; k <= np; k++) {
          const u = Math.min(L - 0.1, Math.max(0.1, (L * k) / np))
          const top = Q(u, side * (W - 0.12), -deep)
          const foot: V3 = [top[0], gr(top[0], top[2]), top[2]]
          // (none on the cycle lane: three galleries cross the main walk, and their posts stood in the middle of it)
          if (laneOff(top[0], top[2]) >= LANE_CLEAR) beam(out, foot, top, 0.12, BEAM, WT)
          if (k < np) beam(out, Q(u, side * (W - 0.12), -deep - 0.95), Q(Math.min(L, u + 0.95), side * (W - 0.12), -deep), 0.06, BEAM, WT)
          if (k > 0) beam(out, Q(u, side * (W - 0.12), -deep - 0.95), Q(Math.max(0, u - 0.95), side * (W - 0.12), -deep), 0.06, BEAM, WT)
        }
        if (u1 - u0 < 0.3) continue
        // the railing: a cap rail, a bottom rail, pickets every 0.3 m (or X braces on a bridge)
        beam(out, Q(u0, o, 1.05), Q(u1, o, 1.05), 0.06, RAIL, WT)
        beam(out, Q(u0, o, 0.15), Q(u1, o, 0.15), 0.04, RAIL, WT)
        const posts = Math.max(1, Math.round((u1 - u0) / 2.2))
        for (let k = 0; k <= posts; k++) { const u = u0 + ((u1 - u0) * k) / posts; beam(out, Q(u, o, 0), Q(u, o, 1.12), 0.06, RAIL, WT) }
        if (g.b) {
          for (let k = 0; k < posts; k++) {
            const ua = u0 + ((u1 - u0) * k) / posts, ub = u0 + ((u1 - u0) * (k + 1)) / posts
            beam(out, Q(ua, o, 0.15), Q(ub, o, 1.0), 0.035, RAIL, WT)
            beam(out, Q(ub, o, 0.15), Q(ua, o, 1.0), 0.035, RAIL, WT)
          }
        } else {
          const n = Math.floor((u1 - u0) / 0.4)
          for (let k = 1; k < n; k++) {
            const u = u0 + k * 0.4
            const lo = Q(u, o, 0.15), hi = Q(u, o, 1.02)
            out.quad([[lo[0] - tx * 0.03, lo[1], lo[2] - tz * 0.03], [lo[0] + tx * 0.03, lo[1], lo[2] + tz * 0.03], [hi[0] + tx * 0.03, hi[1], hi[2] + tz * 0.03], [hi[0] - tx * 0.03, hi[1], hi[2] - tz * 0.03]],
              [nx * side, 0, nz * side], UVQ, RAIL, WT)
            out.quad([[lo[0] - tx * 0.03, lo[1], lo[2] - tz * 0.03], [lo[0] + tx * 0.03, lo[1], lo[2] + tz * 0.03], [hi[0] + tx * 0.03, hi[1], hi[2] + tz * 0.03], [hi[0] - tx * 0.03, hi[1], hi[2] - tz * 0.03]],
              [-nx * side, 0, -nz * side], UVQ, RAIL, WT)
          }
        }
      }
    }
    // the corners: a square of planks at each bend, so consecutive pieces close
    for (let i = 1; i + 1 < p.length; i++) {
      const c = p[i]
      out.quad([[c.x - W, c.y - 0.005, c.z - W], [c.x + W, c.y - 0.005, c.z - W], [c.x + W, c.y - 0.005, c.z + W], [c.x - W, c.y - 0.005, c.z + W]], [0, 1, 0], UVQ, DECK, WT)
    }
    for (const k of [0, p.length - 1]) if (g.j[k ? 1 : 0]) {
      const c = p[k]
      out.quad([[c.x - W, c.y - 0.008, c.z - W], [c.x + W, c.y - 0.008, c.z - W], [c.x + W, c.y - 0.008, c.z + W], [c.x - W, c.y - 0.008, c.z + W]], [0, 1, 0], UVQ, DECK, WT)
    }
  }

  // THE STAIRS
  P39_STAIRS.forEach((s, si) => {
    if (!mine(s.top[1])) return
    const pts = [s.foot, ...s.mid, s.top].map(([x, z]) => ({ x, z }))
    const y0 = gr(pts[0].x, pts[0].z), y1 = floorGr(pts[pts.length - 1].x, pts[pts.length - 1].z) + P39_G
    let total = 0
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)
    if (total < 0.5) return
    // a short OSM line (a dog-leg folded on itself) still needs a whole flight: stretch it straight out past its head
    if (total < 4.5) {
      const a = pts[0], b = pts[pts.length - 1]
      const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
      pts.splice(0, pts.length, { x: b.x - ((b.x - a.x) / L) * 6, z: b.z - ((b.z - a.z) / L) * 6 }, b)
      total = 6
    }
    const width = si === 8 ? 2.6 : 1.5
    // a landing halfway up a long straight flight: the zig the real ones have
    if (pts.length === 2 && total > 7) {
      const a = pts[0], b = pts[1]
      pts.splice(1, 0, { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 })
    }
    let run = 0
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L < 0.05) continue
      const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, nx = -tz, nz = tx
      const landing = i > 0 ? 0.6 : 0, landingEnd = i + 2 < pts.length ? 0.6 : 0
      const ya = y0 + ((y1 - y0) * run) / total, yb = y0 + ((y1 - y0) * (run + L)) / total
      run += L
      const fa = landing, fb = L - landingEnd
      const n = Math.max(2, Math.round((yb - ya) / 0.19))
      const Pt = (u: number, o: number, y: number): V3 => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
      for (let k = 0; k < n; k++) {
        const u = fa + ((fb - fa) * (k + 0.5)) / n, y = ya + ((yb - ya) * (k + 1)) / n
        const c = Pt(u, 0, y - 0.03)
        boxAlong(out, c[0], c[1], c[2], ((fb - fa) / n) * 0.55, 0.035, width / 2, Math.atan2(-tz, tx), STEP, WT)
      }
      // landings at the ends of a middle piece
      for (const [u0, u1, y] of [[0, fa, ya], [fb, L, yb]] as [number, number, number][]) {
        if (u1 - u0 < 0.05) continue
        const c = Pt((u0 + u1) / 2, 0, y - 0.04)
        boxAlong(out, c[0], c[1], c[2], (u1 - u0) / 2 + width / 2, 0.05, width / 2 + 0.05, Math.atan2(-tz, tx), STEP, WT)
        const foot = Pt((u0 + u1) / 2, 0, 0)
        for (const o of [-1, 1]) beam(out, [foot[0] + nx * o * width / 2, gr(foot[0], foot[2]), foot[2] + nz * o * width / 2], [foot[0] + nx * o * width / 2, y - 0.08, foot[2] + nz * o * width / 2], 0.09, BEAM, WT)
      }
      // the stringers and the blue handrails, both sides
      for (const o of [-1, 1]) {
        const s0 = Pt(fa, o * (width / 2 + 0.05), ya - 0.3), s1 = Pt(fb, o * (width / 2 + 0.05), yb - 0.05)
        beam(out, s0, s1, 0.11, BEAM, WT)
        const h0 = Pt(fa, o * (width / 2 + 0.02), ya + 0.92), h1 = Pt(fb, o * (width / 2 + 0.02), yb + 0.92)
        tube(out, h0, h1, 0.035, 6, RAILBLUE, MT)
        const nb = Math.max(1, Math.round((fb - fa) / 1.6))
        for (let k = 0; k <= nb; k++) {
          const u = fa + ((fb - fa) * k) / nb, y = ya + ((yb - ya) * k) / nb
          tube(out, Pt(u, o * (width / 2 + 0.02), y), Pt(u, o * (width / 2 + 0.02), y + 0.92), 0.025, 5, RAILBLUE, MT)
        }
      }
      // a post under the flight's middle, where it is high enough to need one
      if (yb - gr(Pt(fb, 0, 0)[0], Pt(fb, 0, 0)[2]) > 1.6) {
        const m = Pt(fb - 0.3, 0, 0)
        beam(out, [m[0], gr(m[0], m[2]), m[2]], [m[0], yb - 0.25, m[2]], 0.1, BEAM, WT)
      }
    }
  })

  // THE MAIN WALK'S FURNITURE: blue lamp posts with their PIER 39 banners; benches between wine-barrel planters
  for (const f of P39_FURNITURE) {
    const [x, z] = f.p, g = gr(x, z)
    if (!mine(z)) continue
    const tx = Math.sin(f.h), tz = Math.cos(f.h)
    if (f.kind === 'l') {
      prism(out, x, z, g, g + 0.5, 0.16, 8, BLUE, MT)
      tube(out, [x, g + 0.5, z], [x, g + 4.4, z], 0.06, 8, BLUE, MT)
      prism(out, x, z, g + 4.4, g + 4.9, 0.2, 8, [0.95, 0.95, 0.9], GT)
      prism(out, x, z, g + 4.9, g + 5.05, 0.24, 8, BLUE, MT)
      // the two banners, on arms either side, along the walk
      for (const s of [-1, 1]) {
        const ax = x + tz * s * 0.08, az = z - tx * s * 0.08
        tube(out, [ax, g + 3.9, az], [ax + tz * s * 0.55, g + 3.9, az - tx * s * 0.55], 0.02, 4, BLUE, MT)
        const b0: V3 = [ax + tz * s * 0.1, g + 2.6, az - tx * s * 0.1], b1: V3 = [ax + tz * s * 0.55, g + 2.6, az - tx * s * 0.55]
        for (const sg of [-1, 1]) out.quad([b0, b1, [b1[0], g + 3.85, b1[2]], [b0[0], g + 3.85, b0[2]]], [tx * sg, 0, tz * sg], UVQ, BLUE, WT)
        const mid: V3 = [(b0[0] + b1[0]) / 2, g + 3.2, (b0[2] + b1[2]) / 2]
        for (const sg of [-1, 1]) sign(out, { type: 'flat', text: '39', h: 0.22, w: 0.4, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'none', standoff: 0.01 },
          { x: mid[0] + tx * sg * 0.01, y: mid[1], z: mid[2] + tz * sg * 0.01, heading: Math.atan2(tx * sg, tz * sg) })
      }
    } else {
      // a long wooden bench, a barrel planter of flowers at each end
      const hd = Math.atan2(-tz, tx)
      boxAlong(out, x, g + 0.45, z, 1.0, 0.04, 0.22, hd, [0.55, 0.42, 0.3], WT)
      boxAlong(out, x - tx * 0.2, g + 0.75, z - tz * 0.2, 1.0, 0.12, 0.03, hd, [0.55, 0.42, 0.3], WT)
      for (const s of [-1, 1]) {
        const lx = x + tx * s * 0.85, lz = z + tz * s * 0.85
        boxAlong(out, lx, g + 0.22, lz, 0.05, 0.22, 0.2, hd, [0.25, 0.25, 0.27], MT)
        const bx = x + tx * s * 1.6, bz = z + tz * s * 1.6
        prism(out, bx, bz, g, g + 0.75, 0.38, 10, [0.45, 0.3, 0.2], WT)
        prism(out, bx, bz, g + 0.2, g + 0.26, 0.4, 10, [0.25, 0.25, 0.27], MT)
        prism(out, bx, bz, g + 0.6, g + 0.66, 0.4, 10, [0.25, 0.25, 0.27], MT)
        prism(out, bx, bz, g + 0.75, g + 1.05, 0.34, 8, hash(bx, bz) > 0.5 ? [0.85, 0.25, 0.3] : [0.95, 0.75, 0.2], surfaceTag('foliage'))
      }
    }
  }

  // THE PIER 39 BIKEWAY's lane (src/city/sf/pier39-route.ts): the ways the bike rides, painted on the planks
  for (const w of PIER39_ROUTE) cycleLane(out, w.points, gr, mine)
}

/** north of this (the galleries' z), the buildings stand on the deck's datum, not on the ground (`pier39Galleries` floorGr) */
const P39_DECK_NORTH = 95

// ---- the cycle lane --------------------------------------------------------------------------------------------------
/** the lane's half-width, and how far from its middle no gallery post stands */
const LANE_HALF = 0.9, LANE_CLEAR = 1.6
const LANE: Rgb = [0.2, 0.56, 0.3], LANE_PAINT: Rgb = [0.94, 0.94, 0.9]
/** how far (x, z) is from the middle of the nearest of the bikeway's ways */
function laneOff(x: number, z: number): number {
  let best = Infinity
  for (const w of PIER39_ROUTE) {
    const p = w.points
    for (let i = 1; i < p.length; i++) {
      const a = p[i - 1], b = p[i], dx = b.x - a.x, dz = b.z - a.z
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1e-9)))
      best = Math.min(best, Math.hypot(a.x + dx * t - x, a.z + dz * t - z))
    }
  }
  return best
}

/**
 * A green cycle lane along one of the bikeway's ways, on the ground under it (the way's own heights are that ground, as
 * baked): the green strip, a white edge line each side, and every ~24 m a white bicycle painted across it, upright to a
 * rider coming either way in turn. Each piece goes in the part (`mine`) its middle is in.
 */
function cycleLane(out: MeshBuilder, pts: { x: number; z: number }[], gr: (x: number, z: number) => number, mine: (z: number) => boolean): void {
  // each point's sideways direction: the bisector of its two pieces, so the strip's pieces meet without a gap
  const side = pts.map((_, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return { x: -(b.z - a.z) / L, z: (b.x - a.x) / L }
  })
  const P = (i: number, o: number, dy: number): V3 => {
    const x = pts[i].x + side[i].x * o, z = pts[i].z + side[i].z * o
    return [x, gr(x, z) + dy, z]
  }
  for (let i = 1; i < pts.length; i++) {
    if (!mine((pts[i - 1].z + pts[i].z) / 2)) continue
    out.quad([P(i - 1, LANE_HALF, 0.06), P(i, LANE_HALF, 0.06), P(i, -LANE_HALF, 0.06), P(i - 1, -LANE_HALF, 0.06)], [0, 1, 0], UVQ, LANE, TT)
    for (const o of [LANE_HALF - 0.04, -(LANE_HALF - 0.04)]) {
      out.quad([P(i - 1, o + 0.05, 0.075), P(i, o + 0.05, 0.075), P(i, o - 0.05, 0.075), P(i - 1, o - 0.05, 0.075)], [0, 1, 0], UVQ, LANE_PAINT, TT)
    }
  }
  // the bicycles
  let run = 0, next = 9, flip = 1
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.z - a.z)
    while (next <= run + L) {
      const f = (next - run) / L, cx = a.x + (b.x - a.x) * f, cz = a.z + (b.z - a.z) * f
      if (mine(cz)) bicycle(out, cx, cz, ((b.x - a.x) / L) * flip, ((b.z - a.z) / L) * flip, gr)
      next += 24
      flip = -flip
    }
    run += L
  }
}

/** a lane marking's bicycle, flat on the ground at (cx, cz), its top towards (fx, fz): two wheels across the lane, the frame */
function bicycle(out: MeshBuilder, cx: number, cz: number, fx: number, fz: number, gr: (x: number, z: number) => number): void {
  // (u forward — the picture's up — and v across, to the picture's right)
  const W = (u: number, v: number): V3 => {
    const x = cx + fx * u - fz * v, z = cz + fz * u + fx * v
    return [x, gr(x, z) + 0.085, z]
  }
  const stroke = (u0: number, v0: number, u1: number, v1: number, w = 0.06): void => {
    const L = Math.hypot(u1 - u0, v1 - v0) || 1, nu = (-(v1 - v0) / L) * w, nv = ((u1 - u0) / L) * w
    out.quad([W(u0 - nu, v0 - nv), W(u1 - nu, v1 - nv), W(u1 + nu, v1 + nv), W(u0 + nu, v0 + nv)], [0, 1, 0], UVQ, LANE_PAINT, TT)
  }
  for (const v of [-0.48, 0.48]) {
    for (let k = 0; k < 12; k++) {
      const a0 = (k / 12) * Math.PI * 2, a1 = ((k + 1) / 12) * Math.PI * 2
      stroke(Math.sin(a0) * 0.3, v + Math.cos(a0) * 0.3, Math.sin(a1) * 0.3, v + Math.cos(a1) * 0.3, 0.035)
    }
  }
  stroke(0, -0.48, 0.42, -0.12)       // the seat stay
  stroke(0.42, -0.12, 0, 0)           // the seat tube, down to the cranks
  stroke(0, -0.48, 0, 0)              // the chain stay
  stroke(0, 0, 0.42, 0.28)            // the down tube
  stroke(0.42, -0.12, 0.42, 0.28)     // the top tube
  stroke(0.42, 0.28, 0, 0.48)         // the fork
  stroke(0.42, 0.28, 0.58, 0.22)      // the stem and bars
  stroke(0.48, -0.22, 0.48, -0.02, 0.07) // the saddle
}

/**
 * The FLYER's ticket kiosk on the entrance plaza (owner's photograph 1: "a bright BLUE board-and-batten ticket kiosk with a
 * curved blue roof, FLYER/TICKETS lettering and poster windows"; OSM "Ride the Flyer" 11390824789): a little blue box with
 * white battens, a barrel roof, ticket windows on its front, posters on its sides. Front faces local −z.
 */
export function pier39FlyerKiosk(out: MeshBuilder, fit: Fit): void {
  const hx = Math.min(fit.hx, 2.2), hz = Math.min(fit.hz, 1.6), H = 2.9
  const g = Math.max(0, fit.grade ?? 0)
  box(out, 0, g + H / 2, 0, hx, H / 2, hz, [0.15, 0.42, 0.85], WT)
  for (let x = -hx + 0.35; x < hx; x += 0.45) box(out, x, g + H / 2, -hz - 0.02, 0.03, H / 2, 0.02, [0.12, 0.34, 0.7], WT)
  for (const s of [-1, 1]) for (let z = -hz + 0.35; z < hz; z += 0.45) box(out, s * (hx + 0.02), g + H / 2, z, 0.02, H / 2, 0.03, [0.12, 0.34, 0.7], WT)
  // the barrel roof
  const n = 8
  for (let k = 0; k < n; k++) {
    const a0 = (Math.PI * k) / n, a1 = (Math.PI * (k + 1)) / n
    const P = (a: number, z: number): V3 => [Math.cos(a) * (hx + 0.25), g + H + Math.sin(a) * 0.8, z]
    out.quad([P(a0, -hz - 0.35), P(a1, -hz - 0.35), P(a1, hz + 0.35), P(a0, hz + 0.35)], [Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2), 0], UVQ, [0.12, 0.3, 0.66], MT)
    for (const z of [-hz - 0.35, hz + 0.35]) out.quad([[0, g + H, z], P(a0, z), P(a1, z), P(a1, z)], [0, 0, Math.sign(z)], UVQ, WHITE, WT)
  }
  // ticket windows and posters
  for (const x of [-hx / 2, hx / 2]) {
    box(out, x, g + 1.55, -hz - 0.03, 0.55, 0.45, 0.02, GLASS, GT)
    box(out, x, g + 1.05, -hz - 0.2, 0.65, 0.04, 0.2, WHITE, WT)
  }
  for (const s of [-1, 1]) box(out, s * (hx + 0.04), g + 1.6, 0, 0.02, 0.6, 0.6, [0.95, 0.85, 0.3], WT)
  sign(out, { type: 'flat', text: 'THE FLYER', h: 0.36, w: hx * 1.8, face: 'grotesque', weight: 'bold', colour: WHITE, lit: 'front' }, { x: 0, y: g + H + 0.35, z: -hz - 0.37, heading: Math.PI })
  sign(out, { type: 'flat', text: 'TICKETS', h: 0.2, w: hx * 1.4, face: 'grotesque', weight: 'bold', colour: WHITE, panel: [0.1, 0.25, 0.6], lit: 'front' }, { x: 0, y: g + 2.35, z: -hz - 0.06, heading: Math.PI })
}

export const PIER39_STYLE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  pier39A: pier39Building(466623895),
  pier39AtmBooth: pier39Building(466623896),
  pier39FogHarbor: pier39Building(128240149),
  pier39B: pier39Building(128240115),
  pier39C: pier39Building(128240130),
  pier39D: pier39Building(128240133),
  pier39E: pier39Building(128240139),
  pier39F: pier39Building(128240107),
  pier39G: pier39Building(128240116),
  pier39H: pier39Building(128240142),
  pier39I: pier39Building(128240126),
  pier39J: pier39Building(128240148),
  pier39K: pier39Building(128240134),
  pier39L: pier39Building(128240131),
  pier39M: pier39Building(128240119),
  pier39N: pier39Building(128240135),
  pier39O: pier39Building(128240136),
  pier39P: pier39Building(128240146),
  pier39Q: pier39Building(288396171),
  pier39GalleriesSouth: (out, fit) => pier39Galleries(out, fit, 0),
  pier39GalleriesMiddle: (out, fit) => pier39Galleries(out, fit, 1),
  pier39GalleriesNorth: (out, fit) => pier39Galleries(out, fit, 2),
  pier39FlyerKiosk,
}

/** GENERATED (2026-10-17) from the bake package and OSM: per building (OSM way id), its outline's vertex count and, per edge in
 * the package ring order (= Fit.ring order), [length m, "w" over the water / "h" against a neighbour / "s" on a walkway — and
 * then "g" where no OSM gallery runs along it, so the building carries its own, "t" the same with a stair down — the OSM
 * shops and cafés on it as "name@t^level" (t along the edge)]. */
export const P39_EDGES: Record<number, { n: number; e: [number, string, string[]][] }> = {
  93420019: { n: 4, e: [[7.27, 'sg', ['Blue & Gold Fleet@0.41^0']], [3.98, 's', []], [7.27, 'w', []], [3.98, 's', []]] },
  128240107: { n: 13, e: [[6.91, 'w', []], [7.6, 'w', []], [13.69, 's', []], [2.01, 's', []], [4.07, 'sg', ['Pier Market@0.9^0']], [1.6, 's', []], [22.6, 'st', ['Sunglass Hut@0.81^0', 'Solve-It@0.2^1']], [3.48, 's', []], [1.22, 's', []], [6.33, 's', []], [2.3, 's', []], [7.48, 'w', []], [6.16, 's', []]] },
  128240115: { n: 20, e: [[7.01, 's', []], [6.32, 's', []], [4.47, 's', ['Expedition@0.1^1']], [5.16, 's', []], [1.64, 's', []], [1.88, 's', []], [6.41, 'sg', ['Scentchips@0.56^2', 'Mrs. Fields@0.18^0']], [7.37, 'sg', ['The Hook@0.41^0']], [5.58, 'sg', []], [6.69, 'sg', ['Trish’s Mini Donuts@0.47^0']], [1.83, 's', []], [8.35, 'sg', ['Golden Gate@0.14^0', 'Under The Golden Gate@0.17^0']], [9.52, 'sg', []], [3.66, 's', []], [0.9, 's', []], [1.23, 's', []], [2.4, 's', []], [4.93, 's', []], [7.41, 's', []], [4.93, 's', []]] },
  128240116: { n: 16, e: [[27.88, 'w', []], [2.25, 's', []], [20.82, 'w', []], [4.47, 'w', []], [5.46, 's', []], [9.84, 's', []], [4.59, 'sg', []], [7, 's', []], [10.15, 'sg', ['Enlightenment@0.74^0']], [16.7, 's', ['Magnets@0.52^0', 'San Francisco Sock Market@0.9^0']], [9.81, 'sg', ['Swiss Louis@0.9^1']], [12.69, 's', []], [2.99, 's', ['Deep Pockets- But Not Deep Enough@0.1^1', 'Kids For Hire@0.25^1']], [2.38, 's', []], [6.19, 's', []], [10.71, 'sg', []]] },
  128240119: { n: 32, e: [[15.6, 'sg', []], [4.62, 's', ['Candy Baron@0.69^0']], [5.46, 's', []], [6.66, 's', []], [1.78, 's', []], [8.03, 's', []], [12.69, 's', ['Pier 39 Vs. The Big Quake@0.66^1']], [7.44, 'sg', []], [8.56, 'sg', ['Bubba Gump Shrimp Company@0.1^1']], [8.28, 's', []], [3.41, 's', ['Cable Cars To Pier 39?@0.1^1']], [3.72, 's', ['Lorenzo’s Pizzeria@0.9^1']], [3.97, 's', ['Bliss@0.51^0']], [10.25, 's', []], [10.82, 'st', ['7D Experience@0.39^0']], [12.93, 'sg', []], [9.8, 'st', []], [7.4, 'sg', []], [6.9, 'w', []], [6.12, 'w', []], [2.59, 'w', []], [17.27, 'w', []], [1.05, 's', []], [11.26, 'w', []], [1.16, 's', []], [8.55, 'w', []], [13.95, 'sg', ['Luau Lounge Tiki Bar@0.24^1']], [7.08, 'sg', []], [3.21, 's', []], [9, 'st', []], [1.15, 's', []], [8.2, 'sg', []]] },
  128240125: { n: 4, e: [[9.76, 'h', []], [4.86, 'sg', []], [9.76, 'sg', []], [4.85, 'sg', []]] },
  128240126: { n: 6, e: [[12.12, 'w', []], [12.22, 'sg', []], [2.29, 's', []], [3, 's', []], [9.83, 's', ['Aleenk Technologies@0.5^0']], [15.22, 'h', []]] },
  128240130: { n: 13, e: [[7.52, 'w', []], [2.85, 'w', []], [4, 'w', []], [17.09, 'w', []], [1.51, 's', []], [1.83, 's', []], [2.95, 's', []], [1.61, 's', []], [6.05, 's', []], [9.98, 's', []], [2.85, 's', ['Crab House@0.9^1']], [17.63, 'h', []], [6.14, 'sg', []]] },
  128240131: { n: 16, e: [[0.99, 's', []], [13.1, 'sg', ['Aunt Fanny’s Hot Pretzels@0.1^0']], [1.18, 's', []], [1.87, 's', []], [3.1, 's', []], [2.37, 's', []], [2.66, 's', []], [2.61, 's', ['Player’s Sports Grill and Arcade@0.1^0']], [8.95, 's', []], [7.5, 's', []], [2.43, 's', []], [3.88, 's', ['Alcatraz Gift Shop@0.69^1']], [1.35, 's', []], [2.24, 's', ['Pier 39 Vs. The Big Quake@0.9^1']], [3.41, 's', []], [16.06, 's', []]] },
  128240133: { n: 6, e: [[14.92, 'h', []], [2.32, 's', []], [7.41, 's', ['Only in San Francisco@0.35^1']], [10.24, 'sg', ['Trish’s Chocolate San Francisco@0.87^0']], [22.29, 'sg', ['Crepe Cafe@0.81^0', 'Expedition@0.55^0']], [12.65, 'sg', []]] },
  128240134: { n: 25, e: [[22.33, 'w', []], [3.12, 'w', []], [3.23, 's', []], [3.7, 'w', []], [12.33, 's', ['The Big Pier 37 Fire@0.51^1']], [3.77, 's', []], [3.5, 's', ['Local Boy Makes Good@0.9^1']], [3.72, 's', []], [9.25, 's', ['Christmas In San Francisco@0.9^0']], [9.17, 's', []], [2.49, 's', []], [9.07, 's', []], [12.48, 's', ['Magnetron@0.69^0']], [4.69, 's', ['Pier 39 Obsolete For Shipping?@0.1^1']], [4.52, 'sg', []], [7.84, 'sg', []], [16.38, 'st', []], [3.32, 's', []], [10.54, 'sg', []], [2.79, 's', []], [3.9, 's', []], [6.32, 'w', []], [3.85, 'w', []], [1.49, 's', []], [2.93, 's', []]] },
  128240135: { n: 25, e: [[1.52, 's', []], [4.93, 'sg', []], [23.04, 'st', ['Krazy Kaps@0.74^0', 'Image Arts@0.15^0', 'Shirtique@0.54^0']], [18.78, 's', ['Swarovski@0.58^0', 'Happy Bubbles@0.1^0']], [6.94, 'sg', []], [2.83, 's', []], [2.63, 's', []], [3.13, 'w', []], [2.87, 'w', []], [3.13, 'w', []], [3.07, 'w', []], [3.19, 'w', []], [3.01, 'w', []], [2.49, 'w', []], [3.8, 'w', []], [3.87, 'w', []], [4.17, 'sg', []], [6.54, 'w', []], [1.58, 's', []], [4.86, 'sg', []], [13.28, 'sg', []], [1.16, 's', []], [2.1, 's', []], [3.91, 's', []], [8.78, 'sg', []]] },
  128240136: { n: 6, e: [[12.92, 'st', ['San Francisco Keychain@0.59^0', 'Carmel Honey Company@0.28^0']], [1.41, 's', []], [11.83, 'sg', ['We Be Knives@0.1^0', 'Magowan’s Infinite Mirror Maze@0.1^1', 'Musical Stairs@0.52^0', 'Hot Licks@0.85^0']], [11.25, 's', []], [24.76, 'w', []], [12.68, 's', []]] },
  128240139: { n: 14, e: [[11.46, 'h', []], [3.76, 'w', []], [1.99, 'w', []], [4.69, 'w', []], [2, 'w', []], [5.91, 'w', []], [7.08, 'sg', []], [4.98, 'w', []], [8.39, 's', []], [13.62, 's', ['Lola San Francisco@0.69^0', 'Houdini’s Magic Shop@0.21^0', 'The Spice And Tea Exchange@0.35^1']], [2.57, 's', []], [7.24, 's', ['San Francisco USA@0.12^0', 'Fairy Tales@0.71^1']], [6.22, 's', []], [1.39, 's', []]] },
  128240142: { n: 8, e: [[12.14, 's', ['Kids For Hire@0.46^1']], [11.3, 's', ['Green Planet CBD@0.46^0']], [17.56, 'st', ['Lefty’s@0.23^0', 'Bow Wow@0.73^0', 'Pearl Factory@0.1^0']], [3.8, 's', []], [3.45, 's', []], [5.22, 'sg', []], [8.88, 's', []], [2.27, 's', []]] },
  128240146: { n: 19, e: [[22.8, 'w', []], [1.98, 's', []], [10.45, 'w', []], [2, 's', []], [5.59, 'w', []], [1.12, 's', []], [17.42, 'w', []], [8.87, 's', []], [2.35, 's', []], [6.65, 's', ['Charms By The Bay@0.16^0']], [10.16, 's', ['SF City Wear@0.8^0']], [1.56, 's', []], [12.88, 's', ['The Cable Car Store@0.61^0', 'Wilder West@0.9^0']], [0.98, 's', []], [1.12, 's', []], [9.8, 'sg', []], [2.05, 's', ['Na Hoku@0.9^0']], [16.46, 'st', ['The Shell Cellar@0.53^0']], [14.2, 's', ['Alcatraz Gift Shop@0.68^1']]] },
  128240148: { n: 20, e: [[0.91, 's', []], [1.54, 'h', []], [1.56, 'h', []], [1.03, 's', []], [10.24, 'sg', ['The $25 Reward That Cost $2,416,825@0.1^1']], [12.64, 'st', ['Vitality@0.42^0', 'Build-A-Bear Workshop@0.81^0']], [1.17, 's', []], [7.57, 'sg', []], [8.92, 's', ['Hidden Dragon@0.17^0', 'Alpaca Fashion@0.68^0']], [2, 's', []], [1.53, 's', []], [1.44, 's', []], [0.75, 's', []], [4.68, 's', []], [2.34, 's', ['The Big Pier 37 Fire@0.1^1']], [9.62, 'w', []], [1.15, 's', []], [4.92, 'w', []], [4.3, 'w', []], [7.87, 'h', []]] },
  128240149: { n: 18, e: [[2.12, 's', ['Fog Harbor Fish House@0.1^1']], [2.43, 's', []], [8.3, 's', ['Wipeout bar & grill@0.9^0']], [2.66, 's', []], [2.49, 's', []], [1.44, 's', []], [1.35, 's', []], [11, 's', ['Chowders@0.48^0']], [1.42, 's', []], [1.29, 's', []], [5.25, 's', []], [16.74, 's', []], [1.95, 's', []], [2.92, 's', []], [30.37, 'w', []], [4.03, 'h', []], [3.76, 'w', []], [11, 'h', []]] },
  288396171: { n: 58, e: [[9.64, 's', ['Aquarium of the Bay@0.9^1']], [2.11, 's', ['Boudin Bakery Cafe@0.9^0']], [1.31, 's', []], [5.11, 's', ['Boudin Sourdough@0.1^0']], [2.81, 's', []], [5.56, 's', ['The Flyer@0.9^1']], [4.98, 's', []], [16.67, 'sg', ['Rock Shop@0.7^0']], [2.26, 's', []], [5.67, 'sg', []], [22.73, 'sg', []], [3.66, 's', []], [14.92, 'st', ['Hard Rock Cafe@0.83^0']], [1.25, 's', []], [10.52, 'sg', []], [2.18, 's', []], [8.21, 'sg', []], [1.81, 'h', []], [1.61, 'h', []], [2.35, 's', []], [1.53, 's', []], [5.6, 'sg', []], [1.64, 's', []], [1.81, 's', []], [3.5, 's', []], [5.67, 'sg', []], [5.42, 'sg', []], [5.17, 'sg', []], [0.78, 's', []], [4.6, 'sg', []], [1.68, 's', []], [1.87, 's', []], [1.72, 's', []], [4.9, 'sg', []], [1.64, 's', []], [1.87, 's', []], [1.72, 'w', []], [4.35, 'w', []], [1.74, 's', []], [1.79, 'w', []], [1.98, 'w', []], [1.96, 's', []], [1.86, 's', []], [8.01, 'sg', ['Lids@0.49^0']], [5.59, 'sg', []], [5.83, 'sg', []], [1.79, 's', []], [5.55, 'sg', []], [1.07, 's', []], [1.49, 's', []], [2.38, 's', []], [2.73, 's', []], [1.36, 's', []], [2.03, 's', []], [1.54, 's', []], [2.42, 's', []], [0.65, 's', []], [3.04, 's', []]] },
  466623895: { n: 5, e: [[1.73, 's', []], [14.52, 'sg', []], [14.26, 'st', ['Eagle Cafe@0.52^1']], [14.51, 's', ['Only in San Francisco@0.29^0']], [12.53, 'h', []]] },
  466623896: { n: 9, e: [[0.74, 's', []], [4.87, 's', []], [11, 'h', []], [3.76, 'h', []], [4.03, 'h', []], [3.15, 'w', []], [1.03, 's', []], [5.89, 'w', []], [12.53, 'h', []]] },
  555946340: { n: 4, e: [[3.37, 's', []], [6.12, 'sg', []], [3.37, 's', []], [6.11, 'sg', []]] },
}

/** GENERATED: the upper gallery network — OSM's level-1 footways on the pier — in the pier39Galleries frame (x east, z north,
 * metres from 37.8099 −122.4104): its points; per segment [rail on the left, rail on the right] (0 where a wall stands); whether
 * each end is a junction (the rail stops short to leave the way open); OSM bridge=yes. */
export const P39_GALLERY: { p: [number, number][]; r: [number, number][]; j: [number, number]; b: number }[] = [
  { p: [[14.94,-62.31],[12.97,-61.56]], r: [[1,1]], j: [0,1], b: 0 },
  { p: [[12.97,-61.56],[10.34,-55.73]], r: [[0,1]], j: [1,1], b: 0 },
  { p: [[10.34,-55.73],[8.28,-51.53],[5.24,-49.99],[2.8,-44.7],[0.36,-39.42],[-2.08,-34.13]], r: [[0,0],[0,1],[0,0],[0,0],[0,0]], j: [1,1], b: 0 },
  { p: [[-2.08,-34.13],[2.02,-32.35],[-0.58,-25.95],[-3.19,-19.55],[-1.7,-17.42]], r: [[1,0],[0,1],[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-1.7,-17.42],[0.03,-16.59]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-5.71,-8.56],[-12.21,-11.42],[-18.69,-14.28],[-21.08,-9.12],[-23.46,-3.95],[-25.85,1.21],[-21.13,3.49],[-24.21,10.29],[-20.95,11.75],[-19.05,17.94],[-17.92,18.42]], r: [[1,0],[0,0],[1,0],[1,0],[1,0],[0,0],[1,0],[1,0],[1,0],[1,0]], j: [1,1], b: 0 },
  { p: [[-17.92,18.42],[-13.82,20.27]], r: [[1,0]], j: [1,1], b: 0 },
  { p: [[-13.82,20.27],[-10.74,21.66],[-11.18,28.41]], r: [[1,1],[0,1]], j: [1,1], b: 0 },
  { p: [[16.7,-24.84],[13.6,-18.21],[10.5,-11.59]], r: [[1,0],[1,0]], j: [0,1], b: 0 },
  { p: [[10.5,-11.59],[10.47,-8.86],[7.75,-2.3],[10.53,5.13],[9.77,6.81]], r: [[1,1],[1,0],[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[6.5,8.48],[7.65,5.82],[9.77,6.81]], r: [[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[9.77,6.81],[14.41,8.97]], r: [[1,1]], j: [1,0], b: 0 },
  { p: [[34.2,-47.36],[33.86,-46.55]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[34.2,-47.36],[37.55,-47.36],[36.56,-45.3],[33.86,-46.55]], r: [[1,1],[1,1],[1,0]], j: [1,1], b: 0 },
  { p: [[33.86,-46.55],[29.74,-48.42],[27.11,-42.67],[24.47,-36.93]], r: [[1,0],[1,0],[1,0]], j: [1,0], b: 0 },
  { p: [[34.89,-122.02],[37.67,-124.67],[38.07,-122.06],[36.86,-119.69]], r: [[1,1],[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[36.86,-119.69],[37.53,-115.4],[38.19,-111.12]], r: [[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[38.19,-111.12],[39.06,-105.58],[39.93,-100.04]], r: [[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[39.93,-100.04],[40.09,-99],[42.46,-98.1]], r: [[1,1],[1,1]], j: [1,0], b: 0 },
  { p: [[38.51,-99.81],[39.93,-100.04]], r: [[1,1]], j: [0,1], b: 0 },
  { p: [[23.44,-97.42],[22.11,-97.2]], r: [[1,1]], j: [0,1], b: 0 },
  { p: [[32.91,-121.75],[33.31,-119.1],[36.86,-119.69]], r: [[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[34.89,-122.02],[36.86,-119.69]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[14.66,-119.75],[15.9,-119.13],[16.99,-112.03],[19.74,-112.47],[20.93,-104.83],[22.11,-97.2]], r: [[0,1],[0,1],[1,1],[0,1],[0,1]], j: [1,1], b: 0 },
  { p: [[22.11,-97.2],[23.03,-91.26],[23.95,-85.32]], r: [[0,1],[0,1]], j: [1,1], b: 0 },
  { p: [[23.95,-85.32],[18.45,-84.47],[12.96,-83.61],[7.46,-82.76],[8.18,-76.91],[8.9,-71.07],[9.62,-65.22],[12.75,-63.88],[12.97,-61.56]], r: [[0,1],[0,1],[0,1],[1,1],[1,1],[1,1],[1,1],[1,0]], j: [1,1], b: 0 },
  { p: [[23.95,-85.32],[24.32,-82.72],[23.9,-81.63]], r: [[1,1],[1,0]], j: [1,0], b: 0 },
  { p: [[0.03,-16.59],[4.7,-14.36],[9.37,-12.13]], r: [[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[9.37,-12.13],[10.5,-11.59]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[11.72,-55.1],[10.34,-55.73]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-1.7,-17.42],[-3.7,-12.99],[-5.71,-8.56]], r: [[0,1],[0,1]], j: [1,1], b: 0 },
  { p: [[-5.71,-8.56],[-6.2,-7.47]], r: [[1,1]], j: [1,0], b: 0 },
  { p: [[9.02,-139.76],[10.07,-133.5],[11.11,-127.23],[12.16,-120.97],[14.66,-119.75]], r: [[1,1],[1,1],[1,1],[0,1]], j: [1,1], b: 0 },
  { p: [[14.66,-119.75],[14.52,-121.59]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[9.02,-139.76],[6.92,-139.45]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[38.19,-111.12],[41.34,-111.62],[38.19,-111.12]], r: [[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-2.91,32.23],[-1.85,32.72]], r: [[1,0]], j: [1,1], b: 0 },
  { p: [[-1.85,32.72],[1.65,34.33],[-0.94,39.95],[-3.54,45.58],[-6.13,51.2]], r: [[1,0],[1,1],[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-6.13,51.2],[-7.8,50.44]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-18.95,45.28],[-23.34,43.31],[-27.73,41.33],[-30.57,47.08],[-33.42,52.83]], r: [[1,1],[1,1],[1,1],[0,1]], j: [1,1], b: 0 },
  { p: [[-33.42,52.83],[-35.83,51.84],[-38.79,58.51],[-36.93,59.42]], r: [[1,1],[0,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-36.93,59.42],[-33.79,60.84],[-36.57,67.01],[-39.36,73.17],[-42.52,71.69]], r: [[1,1],[1,1],[1,1],[1,0]], j: [1,1], b: 0 },
  { p: [[-42.52,71.69],[-47.19,69.56],[-51.87,67.43],[-54.4,73.14]], r: [[0,0],[0,0],[1,0]], j: [1,1], b: 0 },
  { p: [[-54.4,73.14],[-57.52,80.04],[-60.64,86.93],[-55.99,89.15],[-51.33,91.36]], r: [[1,1],[1,1],[0,1],[0,1]], j: [1,1], b: 0 },
  { p: [[-51.33,91.36],[-47.05,93.4],[-42.78,95.43]], r: [[1,0],[1,0]], j: [1,1], b: 0 },
  { p: [[-42.78,95.43],[-45.31,101.11],[-47.85,106.78],[-40.68,110.2],[-33.52,113.61],[-32.88,117.12],[-33.81,119.18]], r: [[1,1],[1,1],[0,1],[1,1],[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-33.81,119.18],[-36.89,125.93],[-39.97,132.67],[-38.88,133.14]], r: [[1,1],[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-17.31,17.08],[-17.92,18.42]], r: [[1,1]], j: [0,1], b: 0 },
  { p: [[-13.82,20.27],[-13.01,18.62]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-18.95,45.28],[-16.37,39.66],[-13.77,34.03],[-11.18,28.41]], r: [[1,1],[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-11.18,28.41],[-9.7,29.09]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-9.7,29.09],[-2.91,32.23]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-14.69,49.69],[-13.87,47.63]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-13.03,48.02],[-13.87,47.63]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-13.87,47.63],[-18.95,45.28]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-7.8,50.44],[-13.03,48.02]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-34.8,54.65],[-34.54,54.06]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-34.8,54.65],[-36.93,59.42]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-34.54,54.06],[-33.42,52.83]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[0.01,78.15],[1.09,78.59],[0.17,80.54]], r: [[1,0],[0,1]], j: [1,1], b: 0 },
  { p: [[0.17,80.54],[-2.88,87.05]], r: [[0,1]], j: [1,1], b: 0 },
  { p: [[-2.88,87.05],[-6.16,94.08],[-9.45,101.11],[-7.17,108.45],[-0.82,111.56],[-3.86,117.7],[-6.91,123.84],[-9.95,129.98],[-15.54,127.45],[-21.13,124.91],[-26.72,122.38]], r: [[1,1],[1,1],[1,1],[1,1],[1,1],[1,1],[1,0],[0,1],[0,1],[0,1]], j: [1,1], b: 0 },
  { p: [[-26.72,122.38],[-27.72,121.93]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-42.78,95.43],[-40.98,96.29],[-40.58,95.33]], r: [[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-51.33,91.36],[-50.22,88.9]], r: [[0,1]], j: [1,0], b: 0 },
  { p: [[-43.2,73.2],[-42.52,71.69]], r: [[0,0]], j: [0,1], b: 0 },
  { p: [[-56.94,72.85],[-56.63,72.16],[-54.4,73.14]], r: [[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-32.8,119.63],[-33.81,119.18]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-27.72,121.93],[-32.8,119.63]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[-30.74,131.21],[-28.73,126.8],[-26.72,122.38]], r: [[0,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-38.88,133.14],[-37.79,133.59],[-30.74,131.21]], r: [[1,1],[1,1]], j: [1,1], b: 0 },
  { p: [[-6.13,51.2],[-6.69,52.51],[-5.48,55.76]], r: [[1,1],[1,0]], j: [1,0], b: 0 },
  { p: [[-4.8,86.23],[-2.88,87.05]], r: [[1,1]], j: [1,1], b: 0 },
  { p: [[0.01,78.15],[-2.06,79.51],[-0.9,80.04],[0.17,80.54]], r: [[0,1],[0,0],[1,1]], j: [1,1], b: 0 },
]

/** GENERATED: the stairs up to it (OSM highway=steps): foot on the boardwalk, any turns, head at the gallery. */
export const P39_STAIRS: { foot: [number, number]; mid: [number, number][]; top: [number, number] }[] = [
  { foot: [-1.32,-138.17], mid: [[2.8,-138.81]], top: [6.92,-139.45] },
  { foot: [13.14,-130.1], mid: [[13.83,-125.84]], top: [14.52,-121.59] },
  { foot: [35.17,-53.82], mid: [[35.26,-49.86]], top: [34.2,-47.36] },
  { foot: [3.28,15.91], mid: [[4.89,12.2]], top: [6.5,8.48] },
  { foot: [33.18,-133.02], mid: [[34.04,-127.52]], top: [34.89,-122.02] },
  { foot: [31.25,-132.62], mid: [[32.08,-127.18]], top: [32.91,-121.75] },
  { foot: [46.81,-90.87], mid: [[44.23,-88.49],[45.59,-87.9]], top: [45.46,-91.49] },
  { foot: [18.03,-52.23], mid: [], top: [11.72,-55.1] },
  { foot: [-9.49,11.39], mid: [[-11.25,15.01]], top: [-13.01,18.62] },
  { foot: [-17.9,57.24], mid: [[-16.3,53.47]], top: [-14.69,49.69] },
  { foot: [-35.69,90.44], mid: [[-37.8,89.44]], top: [-40.58,95.33] },
  { foot: [-59.27,78.15], mid: [], top: [-56.94,72.85] },
  { foot: [-13.66,82.44], mid: [[-9.23,84.34]], top: [-4.8,86.23] },
]

/** GENERATED: blue lamp posts (l) and benches with barrel planters (b) along the main walk, clear of the shops. */
export const P39_FURNITURE: { p: [number, number]; h: number; kind: string }[] = [{"p":[23.07,-126.72],"h":0.206,"kind":"l"},{"p":[32.6,-112.36],"h":0.204,"kind":"l"},{"p":[29.58,-95.39],"h":0.206,"kind":"b"},{"p":[37.23,-88.46],"h":0.151,"kind":"l"},{"p":[33.31,-71.68],"h":0.151,"kind":"l"},{"p":[67.71,-78.1],"h":-0.68,"kind":"b"},{"p":[37.14,-62.96],"h":-0.447,"kind":"l"},{"p":[25.29,-56.29],"h":-0.7,"kind":"b"},{"p":[24.11,-42.8],"h":-0.45,"kind":"l"},{"p":[10.52,-14.34],"h":-0.31,"kind":"b"},{"p":[-0.46,-1.06],"h":-0.311,"kind":"l"},{"p":[-9.17,34.27],"h":-0.337,"kind":"b"},{"p":[-8.41,51.49],"h":-0.336,"kind":"l"},{"p":[3.8,-71.36],"h":-2.999,"kind":"l"},{"p":[-4.8,-86.3],"h":-3,"kind":"b"},{"p":[-9.33,-117.97],"h":-3,"kind":"l"},{"p":[-22.32,71.84],"h":-0.338,"kind":"b"}]
