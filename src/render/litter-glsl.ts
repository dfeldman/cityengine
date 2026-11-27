/**
 * LITTER AND GRIME (owner, 2026-11-26: "small amounts of litter: leaves, sticks, small weeds, actual trash like paper or cans,
 * mud, footprints, graffiti… only in high graphics mode, and only in certain locations and only very small amounts";
 * docs/LITTER-PLAN.md).
 *
 * Fragment-shader arithmetic only, in the shaders that already draw the ground and the walls: no geometry, no CPU work per frame,
 * no bake data. One chunk is shared by render/road-material.ts (carriageway gutters, pavements, trails, verges) and
 * render/facade-material.ts (the areas mesh's lawns and pavements, and graffiti on the walls), so a pavement meets a lawn without
 * a seam. The one texture is the tag atlas (render/graffiti-tags.ts), drawn on a canvas at load, per city.
 *
 * THREE SWITCHES, each separately:
 *   - the machine: `setLitter(level)` before anything is built (game.ts). 0 compiles none of it (the shader is byte-for-byte
 *     today's), 1 draws it, 2 is a debug view that tints the ground by the local amounts. Auto turns it on for High only.
 *   - the place: `LITTER_PLACES[region]`, a base amount plus round zones (lat/lon, radius) that override it, later zones winning.
 *     Three amounts each: litter (junk, mud, gum), tags (graffiti), leaves (multiplied by the season). 0 is spotless.
 *   - the surface: each material gets a SITE (below), so a gutter, a pavement, a trail and a lawn get different things, and a
 *     surface with site 0 compiles none of it.
 * On top of those a 60 m block hash leaves most blocks clean (LT.blockOdds), so even a dirty district reads as "a little".
 *
 * Everything is gone past LT.near (m) behind one `if (depth < near)`: depth is smooth across the screen, so the branch is
 * coherent, and the far ground cannot sparkle. Each item lives inside its own cell (one hash, one shape, no neighbour loops),
 * and a bounding test returns before any shape maths for the fragments of a cell that miss its item.
 */
import type { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import type { Scene } from '@babylonjs/core/scene'
import type { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Projection, type LatLon } from '../city/geo.ts'
import { tagAtlas, TAG_ATLAS } from './graffiti-tags.ts'

export const LT = {
  /** everything is drawn nearer than this (m), fading out from fadeFrom × near */
  near: 34, fadeFrom: 0.7,
  /** graffiti is drawn nearer than this (m) */
  tagNear: 60,
  /** the block hash: block size (m), the odds a block is dirty, how much a clean block keeps and a dirty one gains (up to) */
  block: 60, blockOdds: 0.35, blockClean: 0.45, blockDirty: 1.8,

  /** the fine layer (leaves, gum): cell (m), leaf half-length range (m); leaves clump on this noise scale (m) */
  fineCell: 0.5, leafL0: 0.05, leafL1: 0.12, leafClump: 2.6,
  /** the junk layer (twigs, paper, cans, butts, weeds): cell (m) */
  junkCell: 1.25,
  /** footprints and tyre tracks: cell (m), stride (m), the share of tracks that are a bicycle's */
  printCell: 3.2, stride: 0.36, bikeShare: 0.3,

  /** the gutter: how far out from the kerb (m) litter gathers, how much still lies out in the lane, and the edge a carriageway
   *  that carries no half-width (the unioned surface) is given everywhere */
  gutterW: 0.55, laneShare: 0.04, noKerb: 0.15,

  /** densities per site at amount 1: [leaves, gum, junk, prints] — the odds a cell has one */
  site: {
    gutter:    [0.42, 0.0, 0.10, 0.0],
    pavement:  [0.05, 0.07, 0.018, 0.10],
    trail:     [0.0, 0.0, 0.05, 0.30],
    verge:     [0.07, 0.0, 0.035, 0.08],
    lawn:      [0.06, 0.0, 0.012, 0.0],
    manicured: [0.025, 0.0, 0.0, 0.0],
    meadow:    [0.0, 0.0, 0.03, 0.0],
  } as Record<string, [number, number, number, number]>,
  /** what a junk item is, per site: shares of [twig, paper, can, weed] (what is left is a butt or a bottle cap) */
  junk: {
    gutter:    [0.30, 0.25, 0.12, 0.15],
    pavement:  [0.10, 0.30, 0.10, 0.12],
    trail:     [0.75, 0.05, 0.02, 0.10],
    verge:     [0.35, 0.20, 0.10, 0.25],
    lawn:      [0.55, 0.15, 0.05, 0.0],
    manicured: [1, 0, 0, 0],
    meadow:    [0.70, 0.05, 0.0, 0.25],
  } as Record<string, [number, number, number, number]>,
  /** mud: per site how much (at litter amount 1), the noise scale (m) and threshold; kerb silt's strength */
  mud: { gutter: 0.0, pavement: 0.0, trail: 0.8, verge: 0.55, lawn: 0.0, manicured: 0.0, meadow: 0.2 } as Record<string, number>,
  mudScale: 3.4, mudFrom: 0.66, silt: 0.32,

  /** graffiti: odds a 4 m stretch of wall carries a tag (at tags amount 1), the share of buildings that are ever tagged,
   *  how much less dressed stone gets, the tag size (m, width range; height is half), the lowest and highest the tag stands (m),
   *  and the odds of a "buffed" patch of mismatched paint over an old tag */
  tagCell: 4, tagOdds: 0.8, tagBuildings: 0.7, tagStone: 0.25, tagW0: 1.0, tagW1: 2.3, tagLow: 0.25, tagHigh: 2.7, buffOdds: 0.35,
  /** 1 mirrors the tags across the wall (if a shot shows them backwards) */
  tagFlip: 0,

  /** season: leaves through the year, Jan..Dec (northern hemisphere; SF's street trees drop less: the place's leaves amount) */
  season: [0.45, 0.35, 0.2, 0.15, 0.12, 0.12, 0.15, 0.2, 0.45, 0.8, 1.0, 0.85],
}

/** sites (one per material, or per fragment on the areas mesh): 0 none */
export const SITE = { none: 0, gutter: 1, pavement: 2, trail: 3, verge: 4, lawn: 5, manicured: 6, meadow: 7 }
const SITE_NAMES = ['', 'gutter', 'pavement', 'trail', 'verge', 'lawn', 'manicured', 'meadow']

/** a round zone: centre, radius (m), and its amounts (any left out keep what is under it) */
export interface LitterZone extends LatLon { name: string; r: number; litter?: number; tags?: number; leaves?: number }
export interface LitterPlace { litter: number; tags: number; leaves: number; zones: LitterZone[] }

/**
 * WHERE. Rough districts, not surveyed: tune by riding. Later zones win where they overlap, so the small dirty pockets come
 * after the big clean ones. At most LT_ZONES zones a city.
 */
export const LITTER_PLACES: Record<string, LitterPlace> = {
  'san-francisco': {
    litter: 0.6, tags: 0.6, leaves: 0.45,
    zones: [
      { name: 'Presidio and Sea Cliff', lat: 37.7890, lon: -122.4660, r: 1600, litter: 0.2, tags: 0.05 },
      { name: 'Pacific Heights', lat: 37.7925, lon: -122.4350, r: 900, litter: 0.25, tags: 0.1 },
      { name: 'Golden Gate Park', lat: 37.7694, lon: -122.4862, r: 1700, litter: 0.45, tags: 0.1, leaves: 1.2 },
      { name: 'SoMa', lat: 37.7765, lon: -122.4050, r: 700, litter: 1.2, tags: 1.5 },
      { name: 'Mission', lat: 37.7600, lon: -122.4190, r: 800, litter: 1.3, tags: 2.0 },
      { name: 'Haight', lat: 37.7700, lon: -122.4470, r: 350, litter: 1.0, tags: 1.3 },
      { name: 'Chinatown', lat: 37.7940, lon: -122.4070, r: 300, litter: 1.3, tags: 0.6 },
      { name: 'Tenderloin', lat: 37.7840, lon: -122.4140, r: 450, litter: 1.8, tags: 1.6 },
    ],
  },
  paris: {
    litter: 0.5, tags: 0.5, leaves: 1.0,
    zones: [
      { name: '7e and 16e', lat: 48.8580, lon: 2.2900, r: 1500, litter: 0.25, tags: 0.12 },
      { name: 'La Défense', lat: 48.8920, lon: 2.2380, r: 700, litter: 0.3, tags: 0.1 },
      { name: 'Louvre, Concorde, Opéra', lat: 48.8650, lon: 2.3300, r: 1100, litter: 0.22, tags: 0.06 },
      { name: 'Île de la Cité', lat: 48.8550, lon: 2.3470, r: 400, litter: 0.2, tags: 0.02 },
      { name: 'Châtelet–Les Halles', lat: 48.8620, lon: 2.3470, r: 300, litter: 1.2, tags: 1.0 },
      { name: 'Pigalle', lat: 48.8820, lon: 2.3370, r: 350, litter: 1.3, tags: 1.4 },
      { name: 'Gare du Nord and Barbès', lat: 48.8820, lon: 2.3520, r: 600, litter: 1.7, tags: 1.8 },
      { name: 'Canal Saint-Martin', lat: 48.8710, lon: 2.3640, r: 500, litter: 1.2, tags: 2.0 },
    ],
  },
}
const DEFAULT_PLACE: LitterPlace = { litter: 0.5, tags: 0.4, leaves: 0.6, zones: [] }

/** zones the shader holds */
export const LT_ZONES = 12

let LITTER = 0
let REGION = ''
let ZONES = new Float32Array(LT_ZONES * 4)
let AMTS = new Float32Array(LT_ZONES * 4)
let BASE: [number, number, number, number] = [0, 0, 0, 0]

/** before anything is built (game.ts): 0 off, 1 on, 2 the debug tint. Materials read it as they are made */
export function setLitter(level: number): void { LITTER = level }
export function getLitter(): number { return LITTER }

/** the city (game.ts, before anything is built): its region's place, projected into this package's metres; `scale` multiplies
 *  every amount (`?litterx=`, for tuning) */
export function setLitterPlace(region: string, origin: LatLon, scale = 1, month = new Date().getMonth()): void {
  REGION = region
  const place = LITTER_PLACES[region] ?? DEFAULT_PLACE
  const season = LT.season[month] ?? 0.5
  const pr = new Projection(origin)
  const zones = place.zones.slice(0, LT_ZONES)
  ZONES = new Float32Array(LT_ZONES * 4)
  AMTS = new Float32Array(LT_ZONES * 4)
  zones.forEach((z, i) => {
    const p = pr.toLocal(z)
    ZONES.set([p.x, p.z, z.r, Math.min(z.r * 0.4, 150)], i * 4)
    AMTS.set([(z.litter ?? place.litter) * scale, (z.tags ?? place.tags) * scale, (z.leaves ?? place.leaves) * season * scale, 0], i * 4)
  })
  BASE = [place.litter * scale, place.tags * scale, place.leaves * season * scale, zones.length]
}

/** the defines a material compiles with: `site` is SITE.*, or -1 for the areas mesh (decided per fragment); walls take tags */
export function litterDefines(site: number, walls = false): string[] {
  const on = LITTER > 0 && (site !== 0 || walls)
  return [`#define LITTER ${on ? LITTER : 0}`, `#define LITTER_SITE ${on ? site : 0}`, `#define LITTER_WALLS ${on && walls ? 1 : 0}`]
}
export const LITTER_UNIFORMS = ['ltZone', 'ltAmt', 'ltBase']
export const litterSamplers = (walls: boolean): string[] => (LITTER > 0 && walls ? ['tagTex'] : [])

/** sets a material's place uniforms and, for walls, the tag atlas; a no-op with litter off */
export function bindLitter(mat: ShaderMaterial, scene: Scene, walls = false): void {
  if (LITTER <= 0) return
  mat.setArray4('ltZone', Array.from(ZONES))
  mat.setArray4('ltAmt', Array.from(AMTS))
  mat.setVector4('ltBase', { x: BASE[0], y: BASE[1], z: BASE[2], w: BASE[3] } as never)
  if (walls) mat.setTexture('tagTex', tagAtlas(scene, REGION) as Texture)
}

const f = (v: number): string => v.toFixed(4)
const v4 = (a: number[]): string => `vec4(${a.map(f).join(', ')})`
const siteTable = (t: Record<string, number[]>): string =>
  SITE_NAMES.map((n, i) => i === 0 ? '' : `  if (site < ${i}.5) return ${v4(t[n] ?? [0, 0, 0, 0])};`).join('\n')

/**
 * The shared chunk. The host defines LITTER, LITTER_SITE and LITTER_WALLS (litterDefines) before including it, computes
 * `fw = length(fwidth(world.xz))` IN UNIFORM FLOW, and calls:
 *   float litterGround(vec2 p, float depth, float site, float edge, float fw, float wet, inout vec3 base)  -> gloss 0..1
 *     edge: 0..1, how near the kerb (gutter) or verge (trail) this is; wet: 0..1
 *   vec3 litterWall(vec2 p, vec2 q, float seed, float stone, float depth, vec3 base)
 *     p: world xz; q: metres along the wall and up from its foot; seed: the building's (0 none); stone: 1 dressed stone
 */
export const LITTER_GLSL = `
#ifndef LITTER
#define LITTER 0
#endif
#if LITTER > 0
#define LT_ZONES ${LT_ZONES}
uniform vec4 ltZone[LT_ZONES];   // x, z, radius, feather (m)
uniform vec4 ltAmt[LT_ZONES];    // litter, tags, leaves (already the season's)
uniform vec4 ltBase;             // the same three for the rest of the city, and the zone count
#if LITTER_WALLS > 0
uniform sampler2D tagTex;
#endif
float ltH(vec2 c) { return fract(sin(dot(mod(c, 811.0), vec2(12.9898, 78.233))) * 43758.5453); }
float ltN(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(ltH(i), ltH(i + vec2(1.0, 0.0)), f.x), mix(ltH(i + vec2(0.0, 1.0)), ltH(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec2 ltRot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
// coverage of a signed distance (m, negative inside), softened over a pixel
float ltCov(float d, float fw) { return 1.0 - smoothstep(-fw, fw, d); }

// the place's amounts here: litter, tags, leaves
vec3 ltAmount(vec2 p) {
  vec3 a = ltBase.xyz;
  for (int i = 0; i < LT_ZONES; i++) {
    if (float(i) >= ltBase.w) break;
    float d = length(p - ltZone[i].xy);
    a = mix(a, ltAmt[i].xyz, 1.0 - smoothstep(ltZone[i].z - ltZone[i].w, ltZone[i].z, d));
  }
  return a;
}
// most blocks are clean, a few carry a little
float ltBlock(vec2 p) {
  float bh = ltH(floor(p / ${f(LT.block)}) + 3.1);
  return bh < ${f(LT.blockOdds)} ? 1.0 + (${f(LT.blockDirty)} - 1.0) * (bh / ${f(LT.blockOdds)}) : ${f(LT.blockClean)};
}

vec4 ltSiteDens(float site) {
${siteTable(LT.site)}
  return vec4(0.0);
}
vec4 ltSiteJunk(float site) {
${siteTable(LT.junk)}
  return vec4(0.0);
}
float ltSiteMud(float site) {
  vec4 a = vec4(${[1, 2, 3, 4].map((i) => f(LT.mud[SITE_NAMES[i]] ?? 0)).join(', ')});
  vec4 b = vec4(${[5, 6, 7, 0].map((i) => f(i ? LT.mud[SITE_NAMES[i]] ?? 0 : 0)).join(', ')});
  return site < 1.5 ? a.x : site < 2.5 ? a.y : site < 3.5 ? a.z : site < 4.5 ? a.w : site < 5.5 ? b.x : site < 6.5 ? b.y : b.z;
}

// LEAVES and GUM: one item a ${LT.fineCell} m cell at most
void ltFine(vec2 p, float leafD, float gumD, float fw, inout vec3 base) {
  vec2 c = floor(p / ${f(LT.fineCell)});
  float h = ltH(c + 7.0);
  if (h >= leafD + gumD) return;
  vec2 o = (c + 0.3 + 0.4 * vec2(ltH(c + 1.3), ltH(c + 2.9))) * ${f(LT.fineCell)};
  vec2 d0 = p - o;
  if (dot(d0, d0) > ${f((LT.leafL1 + 0.02) ** 2)}) return;
  if (h >= leafD) {
    // gum: a flattened black spot, a little lighter at its rim
    float r = mix(0.007, 0.016, ltH(c + 4.4));
    float d = length(d0) - r;
    vec3 gum = base * 0.42 + vec3(0.025);
    base = mix(base, mix(gum, base * 0.8, smoothstep(-r * 0.4, 0.0, d)), ltCov(d, fw) * 0.85);
    return;
  }
  float L = mix(${f(LT.leafL0)}, ${f(LT.leafL1)}, ltH(c + 4.4));
  float W = L * mix(0.38, 0.62, ltH(c + 5.5));
  vec2 q = ltRot(d0, ltH(c + 2.2) * 6.2832);
  float lw = W * max(1.0 - q.x * q.x / (L * L), 0.0);
  float d = max(abs(q.y) - lw, abs(q.x) - L);
  // its contact shadow first, a thin dark rim
  base *= 1.0 - 0.25 * (1.0 - smoothstep(0.0, 0.012 + fw, d));
  float cov = ltCov(d, fw);
  if (cov <= 0.0) return;
  // autumn: brown, ochre, dull yellow, red-brown, the odd green one
  float k = ltH(c + 6.6);
  vec3 col = k < 0.35 ? vec3(0.30, 0.19, 0.09) : k < 0.6 ? vec3(0.46, 0.31, 0.11) : k < 0.78 ? vec3(0.52, 0.43, 0.15)
           : k < 0.93 ? vec3(0.33, 0.13, 0.06) : vec3(0.24, 0.27, 0.10);
  col *= 0.78 + 0.32 * step(0.0, q.y) + 0.1 * (ltH(c + 8.8) - 0.5);   // curled: one half in its own shade
  col *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.003 + fw, abs(q.y))) * step(abs(q.x), L * 0.85);   // the midrib
  base = mix(base, col, cov * 0.95);
}

// JUNK: twigs, paper, cans, weeds, butts and caps; one item a ${LT.junkCell} m cell at most. Returns gloss.
float ltJunk(vec2 p, float dens, vec4 share, float fw, inout vec3 base) {
  vec2 c = floor(p / ${f(LT.junkCell)});
  float h = ltH(c + 11.0);
  if (h >= dens) return 0.0;
  vec2 o = (c + 0.3 + 0.4 * vec2(ltH(c + 12.1), ltH(c + 13.7))) * ${f(LT.junkCell)};
  vec2 d0 = p - o;
  if (dot(d0, d0) > 0.0484) return 0.0;   // 0.22 m: nothing is bigger
  vec2 q = ltRot(d0, ltH(c + 14.3) * 6.2832);
  float r1 = ltH(c + 15.1), r2 = ltH(c + 16.9), r3 = ltH(c + 17.3);
  float t = ltH(c + 18.7);
  float gloss = 0.0;
  if (t < share.x) {
    // a twig, sometimes forked
    float len = mix(0.07, 0.18, r1), w = mix(0.0035, 0.009, r2);
    float d = max(abs(q.y) - w * (1.0 - 0.45 * abs(q.x) / len), abs(q.x) - len);
    vec2 q2 = ltRot(q - vec2(len * 0.15, 0.0), 0.6);
    d = min(d, r3 < 0.5 ? max(abs(q2.y) - w * 0.65, abs(q2.x - len * 0.3) - len * 0.3) : 1.0);
    base *= 1.0 - 0.2 * (1.0 - smoothstep(0.0, 0.008 + fw, d));
    base = mix(base, vec3(0.17, 0.13, 0.09) * (0.75 + 0.5 * r3), ltCov(d, fw));
  } else if (t < share.x + share.y) {
    // paper: a flat receipt or napkin, or a crumpled ball; white, kraft or newsprint
    vec3 col = r3 < 0.55 ? vec3(0.78, 0.77, 0.73) : r3 < 0.8 ? vec3(0.55, 0.42, 0.28) : vec3(0.62, 0.61, 0.58);
    float d;
    if (r2 < 0.6) {
      vec2 hs = vec2(mix(0.035, 0.07, r1), mix(0.05, 0.10, r2));
      d = max(abs(q.x) - hs.x, abs(q.y) - hs.y);
      col *= 0.84 + 0.28 * ltN(q * 55.0);
      // a receipt's printing
      col *= 1.0 - 0.22 * step(0.6, fract(q.y * 70.0)) * step(abs(q.x), hs.x * 0.7) * step(r3, 0.4);
    } else {
      float r = mix(0.025, 0.045, r1);
      d = length(q) - r * (0.82 + 0.3 * ltN(q * 90.0 + r2 * 9.0));
      col *= 0.62 + 0.5 * clamp(dot(q / r, vec2(0.6, 0.6)) * 0.5 + 0.5, 0.0, 1.0) + 0.15 * (ltN(q * 160.0) - 0.5);
    }
    base *= 1.0 - 0.22 * (1.0 - smoothstep(0.0, 0.012 + fw, d));
    base = mix(base, col, ltCov(d, fw));
  } else if (t < share.x + share.y + share.z) {
    // a can on its side, sometimes crushed: a lit cylinder with a highlight along it and silver ends
    float crush = step(0.7, r3);
    float hl = 0.06, rr = mix(0.033, 0.045, crush);
    float d = max(abs(q.x) - hl, abs(q.y) - rr * (1.0 - crush * 0.3 * ltN(q * 40.0)));
    float k = r1;
    vec3 col = k < 0.3 ? vec3(0.62, 0.07, 0.06) : k < 0.5 ? vec3(0.62, 0.63, 0.64) : k < 0.7 ? vec3(0.10, 0.20, 0.52)
             : k < 0.85 ? vec3(0.08, 0.34, 0.14) : vec3(0.62, 0.48, 0.16);
    col = mix(col, vec3(0.6), step(hl - 0.008, abs(q.x)));
    float s = q.y / rr;
    col *= 0.45 + 0.6 * (1.0 - s * s);
    float cov = ltCov(d, fw);
    base *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.015 + fw, d));
    base = mix(base, col, cov);
    gloss = cov * (1.0 - smoothstep(0.0, 0.3, abs(s + 0.35))) * (1.0 - crush * 0.6);
  } else if (t < share.x + share.y + share.z + share.w) {
    // a weed: a few thin blades from one root, with a ring of dark soil
    float d = length(q) - 0.018;
    for (int i = 0; i < 5; i++) {
      float a = (float(i) + ltH(c + float(i) * 3.1)) * 1.2566;
      float bl = mix(0.04, 0.10, ltH(c + float(i) * 5.7 + 1.0));
      vec2 b = ltRot(q, -a);
      d = min(d, max(abs(b.y) - 0.006 * (1.0 - b.x / bl), abs(b.x - bl * 0.5) - bl * 0.5));
    }
    base *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.03, length(q)));
    base = mix(base, vec3(0.15, 0.24, 0.07) * (0.8 + 0.45 * r1), ltCov(d, fw));
  } else {
    // a cigarette butt (tan filter, white paper) or a bottle cap
    if (r2 < 0.7) {
      float d = max(abs(q.x) - 0.014, abs(q.y) - 0.0038);
      base = mix(base, q.x < -0.004 ? vec3(0.62, 0.45, 0.25) : vec3(0.80, 0.79, 0.75), ltCov(d, fw));
    } else {
      float d = length(q) - 0.014;
      float cov = ltCov(d, fw);
      base = mix(base, (r3 < 0.5 ? vec3(0.62) : vec3(0.55, 0.10, 0.08)) * (0.7 + 0.4 * smoothstep(0.012, 0.0, length(q))), cov);
      gloss = cov * 0.6;
    }
  }
  return gloss;
}

// FOOTPRINTS and TYRE TRACKS: one short walk or ride across a ${LT.printCell} m cell at most
void ltPrints(vec2 p, float dens, float strength, float fw, inout vec3 base) {
  vec2 c = floor(p / ${f(LT.printCell)});
  float h = ltH(c + 31.0);
  if (h >= dens) return;
  vec2 q = ltRot(p - (c + 0.5) * ${f(LT.printCell)}, -ltH(c + 32.0) * 6.2832);
  float run = ${f(LT.printCell * 0.42)};
  if (abs(q.x) > run || abs(q.y) > 0.3) return;
  float fade = (1.0 - smoothstep(run * 0.65, run, abs(q.x))) * strength;
  if (ltH(c + 33.0) < ${f(LT.bikeShare)}) {
    float y = q.y - 0.12 * sin(q.x * 1.3 + h * 20.0);
    float d = abs(y) - 0.018;
    float tread = 0.85 + 0.15 * step(0.5, fract(q.x * 45.0));
    base *= 1.0 - fade * ltCov(d, fw) * tread;
    return;
  }
  float st = ${f(LT.stride)};
  float k = floor(q.x / st + 0.5);
  float side = mod(k, 2.0) * 2.0 - 1.0;
  vec2 l = q - vec2(k * st + (ltH(c + k) - 0.5) * 0.04, side * 0.09);
  l = ltRot(l, side * 0.08);
  float d = (length(l / vec2(0.13, 0.045)) - 1.0) * 0.045;
  d = max(d, -(0.007 - abs(l.x + 0.055)));   // the gap before the heel
  float tread = 0.8 + 0.2 * step(0.5, fract(l.x * 55.0));
  float cov = ltCov(d, fw);
  base *= 1.0 - fade * cov * tread;
  base *= 1.0 + fade * 0.35 * (1.0 - smoothstep(0.0, 0.01 + fw, abs(d))) * (1.0 - cov);   // a pushed-up rim
}

float litterGround(vec2 p, float depth, float site, float edge, float fw, float wet, inout vec3 base) {
  if (depth > ${f(LT.near)} || site < 0.5) return 0.0;
  vec3 b0 = base;
  vec3 amt = ltAmount(p);
  float lit = amt.x * ltBlock(p);
  vec4 dens = ltSiteDens(site);
  float gloss = 0.0;
#if LITTER > 1
  base = mix(base, vec3(lit * 0.5, amt.y * 0.4, amt.z * 0.5), 0.7);
  return 0.0;
#endif
  // where in the site: the gutter gathers it against the kerb, the lane keeps a little
  float place = site < 1.5 ? mix(${f(LT.laneShare)}, 1.0, edge) : 1.0;
  // mud: soft blobs at a verge or a trail's edge, kerb silt in the gutter; wet mud darkens and shines
  float mud = ltSiteMud(site);
  if (mud > 0.0) {
    float m = smoothstep(${f(LT.mudFrom)}, ${f(LT.mudFrom)} + 0.16, ltN(p / ${f(LT.mudScale)}) + 0.15 * ltN(p * 2.1) + edge * 0.12) * min(mud * lit, 1.0);
    vec3 mc = mix(vec3(0.33, 0.27, 0.20), vec3(0.17, 0.13, 0.09), wet);
    base = mix(base, mc * (0.85 + 0.3 * ltN(p * 7.0)), m * 0.85);
    gloss += m * wet * 0.5;
    dens.w *= 1.0 + 2.0 * m;   // footprints keep to the mud
  }
  if (site < 1.5) {
    float s = (1.0 - smoothstep(0.0, 0.22, (1.0 - edge) * ${f(LT.gutterW)})) * ltN(p * 1.7);
    base = mix(base, vec3(0.30, 0.26, 0.21), s * ${f(LT.silt)} * min(lit, 1.0));
  }
  float leaves = amt.z * dens.x * place * smoothstep(0.3, 0.8, ltN(p / ${f(LT.leafClump)}));
  ltFine(p, leaves, dens.y * lit, fw, base);
  gloss += ltJunk(p, dens.z * lit * place, ltSiteJunk(site), fw, base);
  // prints: always on dirt, on a pavement only once it is wet (a wet sole on dry stone, and the other way)
  float prints = dens.w * (site > 2.5 ? 1.0 : wet) * (0.5 + 0.5 * min(lit, 1.0));
  ltPrints(p, prints, site > 2.5 ? 0.22 : 0.12, fw, base);
  float fade = 1.0 - smoothstep(${f(LT.near * LT.fadeFrom)}, ${f(LT.near)}, depth);
  base = mix(b0, base, fade);
  return gloss * fade;
}

#if LITTER_WALLS > 0
vec3 litterWall(vec2 p, vec2 q, float seed, float stone, float depth, vec3 base) {
  if (depth > ${f(LT.tagNear)} || seed <= 0.0 || q.y > ${f(LT.tagHigh + 0.2)} || q.y < 0.0) return base;
  vec3 amt = ltAmount(p);
  float tags = amt.y * ltBlock(p + 17.0);
  // whole buildings stay clean
  if (fract(seed * 23.17) > min(tags * ${f(LT.tagBuildings)}, 1.0)) return base;
  float odds = tags * ${f(LT.tagOdds)} * mix(1.0, ${f(LT.tagStone)}, stone);
  float fade = 1.0 - smoothstep(${f(LT.tagNear * 0.75)}, ${f(LT.tagNear)}, depth);
#if ${LT.tagFlip} > 0
  q.x = -q.x;
#endif
  float c = floor(q.x / ${f(LT.tagCell)});
  vec2 cs = vec2(c, seed * 131.0);
  // a buffed patch: mismatched paint rolled over an old tag
  if (ltH(cs + 5.0) < odds * ${f(LT.buffOdds)}) {
    vec2 bo = vec2(c * ${f(LT.tagCell)} + ltH(cs + 6.0) * ${f(LT.tagCell * 0.5)}, 0.2 + ltH(cs + 7.0) * 0.8);
    vec2 bs = vec2(0.9 + ltH(cs + 8.0) * 1.4, 0.6 + ltH(cs + 9.0) * 1.0);
    vec2 r = abs(q - bo - bs * 0.5) - bs * 0.5 + 0.03 * ltN(q * 9.0);
    float inside = step(max(r.x, r.y), 0.0);
    vec3 paint = mix(base, vec3(dot(base, vec3(0.333))), 0.6) * (0.9 + 0.2 * ltH(cs + 10.0)) * vec3(1.02, 1.0, 0.95);
    base = mix(base, paint, inside * 0.9 * fade);
  }
  float h = ltH(cs);
  if (h >= odds) return base;
  float w = mix(${f(LT.tagW0)}, ${f(LT.tagW1)}, ltH(cs + 1.0)), ht = w * 0.5;
  float x0 = c * ${f(LT.tagCell)} + ltH(cs + 2.0) * (${f(LT.tagCell)} - w);
  float y0 = mix(${f(LT.tagLow)}, ${f(LT.tagHigh)} - ht, ltH(cs + 3.0));
  vec2 uv = vec2((q.x - x0) / w, (q.y - y0) / ht);
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return base;
  float k = floor(ltH(cs + 4.0) * ${TAG_ATLAS.cols * TAG_ATLAS.rows}.0);
  vec2 cell = vec2(mod(k, ${TAG_ATLAS.cols}.0), floor(k / ${TAG_ATLAS.cols}.0));
  vec2 auv = (cell + vec2(0.01) + clamp(uv, 0.0, 1.0) * 0.98) / vec2(${TAG_ATLAS.cols}.0, ${TAG_ATLAS.rows}.0);
  vec4 t = texture2D(tagTex, vec2(auv.x, 1.0 - auv.y));
  // older tags fade into the wall; the paint is a little rough
  float age = ltH(cs + 11.0);
  float a = t.a * (1.0 - 0.55 * age) * (0.85 + 0.15 * ltN(q * 30.0));
  return mix(base, t.rgb * 0.82, a * fade);
}
#endif
#endif
`
