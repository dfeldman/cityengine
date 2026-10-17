/**
 * Building signage: the name that IS the building.
 *
 * On a department store the sign is the identity — Macy's, Saks, Neiman Marcus, Chase Center are a script, a
 * letterspaced engraved capital, a roman capital and a bold sans, and none of them survives being spelled out
 * of cubes. Builders were falling back on `signText`'s 3 x 5 block font (right for a small painted name on a
 * warehouse, wrong for a landmark) or on the extruded GLB path, which is a real typeface but always geometry
 * and always expensive.
 *
 * So there are TWO KINDS OF SIGN and a model must say which:
 *
 *   `flat`      ONE QUAD with a texture and an alpha channel — the letters rendered by the browser's own text
 *               engine in a real typeface, at whatever size the builder asks for. **This is what almost every
 *               sign is**: painted, applied, or illuminated letters are flat from any distance a rider sees
 *               them from, and this costs TWO TRIANGLES whatever the word.
 *   `extruded`  the GLB from tools/signgen, for letters that genuinely stand proud of the wall and catch the
 *               light — Ghirardelli's bulbs, a deep channel-letter sign, a roof sign read against the sky.
 *               Thousands of triangles per word, so it is the exception and has to be asked for by name.
 *
 * Nothing here touches Babylon: this module is the SPEC and the arithmetic, so it can be unit tested. A
 * builder's `sign()` call only records what it wants on the MeshBuilder's `signs` list; the renderer
 * (render/sign-plates.ts) makes the textures and the meshes, and render/landmarks.ts places them and gates
 * them by distance.
 *
 * ROTATION: everything here faces **+z** at heading 0 — the `edgeAt().heading` convention, NOT the −z one
 * `pane`/`pediment`/`courtFacade` use. On the kit's demo stage that means `heading: Math.PI`.
 */
import type { MeshBuilder } from '../buildings.ts'
import type { Rgb } from '../models.ts'

type P2 = { x: number; z: number }

/**
 * A typeface, as a CSS font stack the browser resolves at run time.
 *
 * Deliberately NOT a file path: the flat path renders text with the machine's own font engine, so the same
 * recipe works on any machine that has anything like the face asked for, and the last entry of every stack is
 * a generic that always resolves. (The extruded path still needs absolute paths — Blender has no font
 * fallback — which is why tools/signgen/signs.json keeps its own table.)
 */
export const FACES = {
  /** a classical roman capital: NEIMAN MARCUS, a bank, a museum */
  roman: '"Times New Roman", Times, Georgia, serif',
  /** an engraved, slightly flared capital, cut into stone: SAKS FIFTH AVENUE, an old bank's lintel */
  engraved: 'Copperplate, "Copperplate Gothic Light", "Academy Engraved LET", serif',
  /** a high-contrast didone: a fashion house, a 1920s hotel */
  didone: 'Didot, "Bodoni 72", "Playfair Display", Georgia, serif',
  /** a geometric grotesque: a modern civic building, an airport */
  grotesque: 'Futura, "Century Gothic", "Avenir Next", "Helvetica Neue", sans-serif',
  /** a CONDENSED grotesque: a stadium, a cinema, anything that has to fit a long name on a short wall */
  condensed: '"DIN Condensed", "Arial Narrow", "Helvetica Neue Condensed", "Haettenschweiler", sans-serif',
  /** a heavy sans that fills its line: CHASE CENTER, a supermarket, a 1970s office block */
  block: 'Impact, "Arial Black", "Helvetica Neue", sans-serif',
  /** a slab: a railway company, a warehouse, an industrial name */
  slab: 'Rockwell, "American Typewriter", "Roboto Slab", Georgia, serif',
  /** a formal SCRIPT: macy's, a hotel's signature, a neon in cursive */
  script: '"Snell Roundhand", "Savoye LET", "Apple Chancery", "Brush Script MT", cursive',
  /** a painted brush script: a diner, a soda sign, a 1950s motel */
  brush: '"Brush Script MT", "Bradley Hand", "Snell Roundhand", cursive',
} as const
export type Face = keyof typeof FACES

/**
 * How the sign behaves after dark, which is an observation from a night photograph and not a preference.
 *
 *   `none`   unlit. It goes dark with the wall. Most painted and applied signs do exactly this.
 *   `front`  floodlit from outside: the FACE is bright, the letters themselves do not emit, and at a
 *            distance it reads as a pale patch rather than a light source. A painted wall sign, an incised
 *            stone name under a spotlight.
 *   `back`   a halo behind the letters: the PANEL glows and the letters stay dark, read as silhouettes
 *            against it. The inverse of `self`, and the difference is the whole point. Modern retail.
 *   `self`   the letters emit: neon tube, channel letters with lit faces, exposed bulbs. Ghirardelli.
 *
 * RIGGED, NOT BUILT (2026-09-23). The field is required and the emissive picture is generated, because
 * capturing it while somebody has the photograph open costs nothing and backfilling it costs everything —
 * but there is no night view to judge it in yet, so it has never been looked at. It rides the SAME `night`
 * uniform as the lit windows in facade-material.ts, so when a night view arrives signs and windows come on
 * together. Nothing here adds a triangle: it is one extra texture on the signs that are lit at all.
 *
 * A note so it is not rediscovered: LOD probably INVERTS at night. A neon sign is a beacon — legible much
 * further than the same sign by day, and beacons are most of what makes a night city read — so the cull
 * distance below should likely grow with `night` for `self` and `back`. Deliberately not implemented: there
 * is nothing to tune it against.
 */
export type SignLighting = 'none' | 'front' | 'back' | 'self'

/** What a flat sign's picture is made of. Text today; a mural or a billboard is another member here. */
export type SignSource =
  | { kind: 'text'; text: string; face?: Face; weight?: 'normal' | 'bold'; italic?: boolean }
  /**
   * NOT IMPLEMENTED — the shape the mural path takes: a unique 2D image pasted on a chunk of wall. The quad,
   * the offset, the alpha, the material and the LOD gate below are all the same; only the picture and the
   * size differ, which is why the source is a union and `w`/`h` are both askable-for.
   */
  | { kind: 'image'; url: string }

/**
 * One sign a builder wants. `type` has NO DEFAULT on purpose (the spirit of `FacadeSpec`): a model states
 * whether its letters stand off the wall or are painted on it, because that choice costs either two triangles
 * or several thousand.
 */
export interface SignSpec {
  type: 'flat' | 'extruded'
  /** the words. For `extruded` this is only the label — the letters come from `model` */
  text: string
  /** CAP height in metres: the height of an `H`, so descenders and a script's flourishes do not shrink it */
  h: number
  /** flat only: the typeface */
  face?: Face
  /** flat only: bold, and italic */
  weight?: 'normal' | 'bold'
  italic?: boolean
  /** the colour of the letters (default near-white) */
  colour?: Rgb
  /** a backing panel or box behind the letters, in this colour — a fascia board, a box sign */
  panel?: Rgb
  /** an outline/halo round the letters in this colour: what makes pale letters read against a pale wall */
  halo?: Rgb
  /** letterspacing, in cap heights. Engraved capitals on stone want 0.15–0.25; a script wants 0 */
  tracking?: number
  /** stacked letters down a blade — an old theatre, a hotel */
  vertical?: boolean
  /** REQUIRED: what it does after dark. See SignLighting — `none` is a decision, not an omission */
  lit: SignLighting
  /** the full width in metres, where the sign must fit a given wall rather than follow its own text */
  w?: number
  /** extruded only: the GLB under public/models, e.g. `signs/ghirardelli.glb` (built by tools/signs.ts) */
  model?: string
  /**
   * flat only: the words laid ROUND a disc (`text` over the top, `below` under the bottom, letters' feet to the
   * middle), the panel a circle, a thin ring inside the words: the Fisherman's Wharf wheel. The quad is square, its
   * side the disc's diameter; `h` is still the cap height.
   */
  ring?: { below?: string }
  /** flat only: drawn from behind as well, mirrored — a free-standing frame sign on a roof, never a wall sign */
  twoSided?: boolean
  /** how far the sign stands off the surface it is on, metres (default 0.06 — see sign-plates.ts on z-fighting) */
  standoff?: number
}

/** A sign with its place in the landmark's LOCAL frame. `heading` is the way it FACES, 0 being +z. */
export interface PlacedSign {
  spec: SignSpec
  x: number
  y: number
  z: number
  heading: number
}

/** Where a sign goes: on an edge of the fit's ring, or at a point the builder works out itself. */
export type SignPlace =
  /** on edge `edge` of `ring`, `along` of the way across it (0.5 = centred), centre `y` metres up */
  | { ring: P2[]; edge: number; y: number; along?: number }
  /** anywhere: the centre of the sign and the way it faces (0 faces +z) */
  | { x: number; y: number; z: number; heading?: number }

/**
 * Put a sign on a building. **This is the only sign call a builder should need**: the text, the type, where it
 * goes and how tall the letters are — everything else follows.
 *
 *     sign(out, { type: 'flat', text: 'macy’s', h: 2.2, face: 'script', colour: RED }, { ring, edge: 0, y: 14 })
 *
 * Nothing is drawn into `out`'s geometry: the sign is recorded on `out.signs` and realised by the renderer as
 * its own mesh, because a sign has to be gated by distance and a landmark's geometry is one mesh that is not.
 */
export function sign(out: MeshBuilder, spec: SignSpec, where: SignPlace): void {
  out.signs.push(place(spec, where))
}

/** The arithmetic of `sign()`, without the MeshBuilder — the part worth testing. */
export function place(spec: SignSpec, where: SignPlace): PlacedSign {
  if ('ring' in where) {
    const r = where.ring
    const a = r[where.edge % r.length]
    const b = r[(where.edge + 1) % r.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    const u = (where.along ?? 0.5) * L
    // the same frame as edgeAt(): outward normal (tz, −tx), heading atan2(tz, −tx)
    return { spec, x: a.x + tx * u, y: where.y, z: a.z + tz * u, heading: Math.atan2(tz, -tx) }
  }
  return { spec, x: where.x, y: where.y, z: where.z, heading: where.heading ?? 0 }
}

/**
 * How far away a sign is still drawn, in metres.
 *
 * Signs must NOT draw at low detail: a name unreadable at that distance is a smear of pixels that costs a
 * draw call, and on a far building it is worse than nothing. Legibility is ANGULAR, so the reach follows the
 * cap height — big roof letters carry across a bay, a 40 cm shop name does not carry across a street.
 *
 * `cap` is the far ring the city is drawing at all (render/city.ts `MID * TILE`), passed in rather than
 * written down here because PLAN.md §Soon.0a says that ring's reach is a Paris number and will change for a
 * flat, tall city. Nothing is ever drawn beyond it, and nothing is dropped inside 90 m.
 */
export function signCut(h: number, cap: number): number {
  return Math.min(cap, Math.max(90, 220 * h))
}

/**
 * The four corners of a flat sign's quad in the landmark's local frame, and their uvs, given the sign's size
 * in metres. Bottom left FIRST, going round the face, which is how MeshBuilder.quad wants them.
 *
 * Two conventions are baked in here and both have bitten this project before:
 *  - the face points along `heading` (0 = +z);
 *  - text runs toward local −x, because a wall facing +z has local +x on the READER's left (BUGS.md #50) —
 *    the same reason `signText` lays its letters out right to left. So u = 0 is at the +x end.
 */
export function signCorners(p: PlacedSign, w: number, h: number, standoff: number): {
  corners: [number, number, number][]
  uvs: [number, number][]
  normal: [number, number, number]
} {
  const s = Math.sin(p.heading)
  const c = Math.cos(p.heading)
  // (dx, dy) in the sign's own plane, pushed `standoff` out along the face's normal
  const P = (dx: number, dy: number): [number, number, number] =>
    [p.x + dx * c + standoff * s, p.y + dy, p.z - dx * s + standoff * c]
  return {
    corners: [P(w / 2, -h / 2), P(-w / 2, -h / 2), P(-w / 2, h / 2), P(w / 2, h / 2)],
    /*
     * u = 0 at the +x corner, v = 0 at the BOTTOM. Both halves of this were CHECKED IN A SHOT rather than
     * reasoned out, and each was wrong the first time in its own way: v the other way up renders the word
     * upside down (Babylon flips a DynamicTexture as it uploads it, so the canvas's top row arrives at
     * v = 1, not v = 0), and u the other way round renders it mirrored — a wall facing +z has local +x on
     * the READER's left, which is the same reason `signText` lays its letters out right to left (BUGS.md #50).
     */
    uvs: [[0, 0], [1, 0], [1, 1], [0, 1]],
    normal: [s, 0, c],
  }
}
