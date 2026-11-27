/**
 * GRASS (owner, 2026-11-26: "grass that looks GREAT, fast"; docs/GRASS-PLAN.md phase 1). Ground-shader arithmetic only: no
 * texture, no geometry. One GLSL chunk is shared by the two shaders that draw grass, so a lawn meets the base ground without a seam:
 *   - the base ground (render/road-material.ts, surface 'grass', define GRASS_GROUND): type 3, unkempt
 *   - the park, grass and pitch polygons and the garden lawns (render/facade-material.ts, 'ground' variant, define GRASS_AREAS): the
 *     type is carried in the vertex colour alpha's fraction (GRASS_CODE_*), set where the areas mesh is built (render/city.ts)
 *
 * Types (how far each runs to patchy: GR.upkeep): 1 manicured (gardens, pitches: flawless, mowing stripes), 2 park lawn (well trimmed), 3 unkempt (dry patches, worn bare ground, tufts, weeds),
 * 4 meadow (straw and gold, scrub clumps, sparse flowers).
 *
 * A compile-time GRASS_DETAIL, like ROAD_DETAIL and FACADE_DETAIL: 0 off (today's flat green, to the instruction), 1 simple
 * (macro noise, dry patches, stripes, grazing-angle shift, sheen), 2 full (patch and fine scales, tufts, wear, near flecks, a second
 * rotated sample of the road page).
 *
 * Real lawns (Commons photos, docs/GRASS-PLAN.md) are olive, #8E9238 to #94A165, with a 2 to 3.7x bright/dark spread, not saturated green.
 * Colours here are albedo, before light: the shaders light them as they light everything else (about x1.25 in full sun).
 */
export const GR = {
  /** albedo colours: lawn green, dry straw, meadow's scrub green and gold, dark tufts and shade, bare worn soil */
  green: [0.22, 0.26, 0.12] as [number, number, number],
  straw: [0.40, 0.34, 0.19] as [number, number, number],
  scrub: [0.30, 0.32, 0.13] as [number, number, number],
  gold: [0.47, 0.41, 0.25] as [number, number, number],
  dusty: [0.28, 0.29, 0.17] as [number, number, number],
  dark: [0.14, 0.19, 0.06] as [number, number, number],
  bare: [0.34, 0.28, 0.19] as [number, number, number],
  /**
   * UPKEEP, per type [manicured, lawn, unkempt, meadow] (owner, 2026-11-26: "in smaller parks the grass is typically well-trimmed,
   * and in gardens it is perfectly maintained and nearly flawless"; the patchy green and yellow is for big unkempt ground only):
   *   dry: how dry it runs (0 none, 1 all straw; the dry patches start at noise 0.8 minus this x 0.8)
   *   dusty: how far the dusty olive patches go
   *   macro: share of the 57 m brightness swing (lum1)
   *   calm: share of the 2–20 m swings (lum2, lumPatch, lumMid): mottling there reads as tree shade on open lawn
   *   wear: worn bare ground odds
   *   fleck: clover, weed and flower odds a cell
   *   tuft: darker tufts and scrub clumps
   */
  upkeep: {
    dry: [0, 0, 0.32, 0.50],
    dusty: [0, 0.22, 0.7, 0.7],
    macro: [0.25, 0.55, 1, 1],
    calm: [0.12, 0.28, 1, 1],
    wear: [0, 0.04, 1.0, 0.2],
    fleck: [0, 0.004, 0.07, 0.045],
    tuft: [0, 0, 1, 1],
  } as Record<string, [number, number, number, number]>,
  /** noise scales (m): the dry and green macro patches, the second macro, the patches, a tuft, a meadow's scrub clump, a worn patch */
  macro1: 57, macro2: 19, patch: 5.5, mid: 1.8, tuft: 2.4, clump: 4.2, wear: 7, fine: 0.7, grain: 0.22, blade: 0.07,
  /** brightness swing (peak to peak, fraction) at each scale: macro1, macro2, patch, fine grain, and the page's own grain */
  lum1: 0.40, lum2: 0.34, lumPatch: 0.42, lumMid: 0.34, lumFine: 0.40, lumPage: 1.2, lumGrain: 0.45, lumBlade: 0.35,
  /** darker tufts (how much of dark they mix to), worn bare ground (share of its type below, bare mixes to this much) */
  tuftAmt: 0.55, wearAmt: 0.85,
  /** mowing stripes on manicured: the band width (m), the world direction (unit), brightness swing */
  stripeW: 3.2, stripeDir: [0.8, 0.6] as [number, number], stripeAmp: 0.24,
  /** flecks (clover, weed, flowers): cells per metre, the depth (m) they are gone by (odds: upkeep.fleck) */
  fleckDens: 5, fleckNear: 24,
  /** grazing angle (blade sides, not soil): the yellow shift, the saturation gain, the brightening far off (depth m from, to) */
  grazeYellow: 0.08, grazeSat: 0.12, grazeLum: 0.05, grazeFrom: 12, grazeTo: 160,
  /** backlit sheen: the strength, when looking toward the sun */
  sheen: 0.20,
  /** the pixel footprint (m) the fine terms are gone by: from, to */
  fadeFrom: 0.10, fadeTo: 0.55,
  /** area types decided at city build time (render/city.ts): a mapped `grass` polygon over this many m2 is meadow, a `park` over PARK_BIG m2 is unkempt */
  meadowArea: 30000, parkBigArea: 400000,
}

export const GRASS_TYPE = { manicured: 1, lawn: 2, unkempt: 3, meadow: 4 }
/** the type rides in the colour alpha's fraction (a glass tint's code is below 0.5, buildings.ts glassCode / 8192 x 4096) */
export const GRASS_CODE_BASE = 0.5, GRASS_CODE_STEP = 0.05
export const grassCode = (type: number): number => GRASS_CODE_BASE + GRASS_CODE_STEP * type

let GRASS_DETAIL = 2
/** before anything is built (game.ts): materials read it as they are made */
export function setGrassDetail(level: number): void { GRASS_DETAIL = level }
export function getGrassDetail(): number { return GRASS_DETAIL }

const f = (v: number): string => v.toFixed(4)
const v3 = (c: readonly number[]): string => `vec3(${c.map(f).join(', ')})`
/** a per-type upkeep value (GR.upkeep) for the GLSL's type t */
const up = (k: string): string => `gPick(vec4(${GR.upkeep[k].map(f).join(', ')}), t)`
const PICK = 'float gPick(vec4 v, float t) { return t < 1.5 ? v.x : t < 2.5 ? v.y : t < 3.5 ? v.z : v.w; }'

/**
 * The shared chunk. Needs `GRASS_DETAIL` defined and, in the host, a call `grassSurface(...)` made in uniform flow (it takes
 * derivatives through `fw`, which the host computes outside any branch). Returns the albedo; `sheen` is the share of sunlit
 * brightness to add (host: lit += base * sunColour * sheen).
 */
export const GRASS_GLSL = `
float gHash(vec2 p) {
  p = mod(p, 997.0);
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float gNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), f.x), mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
${PICK}

/*
 * t: 1 manicured, 2 lawn, 3 unkempt, 4 meadow. wp: the world position. depth: view depth (m). view: unit, eye to point.
 * fw: the pixel's footprint on the ground (m). grain: the page's own luminance deviation, already scaled by the host.
 */
vec3 grassSurface(float t, vec3 wp, float depth, vec3 view, vec3 sunDir, float fw, float grain, out float sheen) {
  vec2 p = wp.xz;
  float amt = ${up('dry')};
  float m1 = gNoise(p / ${f(GR.macro1)});
  float m2 = gNoise(p / ${f(GR.macro2)} + 7.3);
  float mm = m1 * 0.6 + m2 * 0.4;
  float dry = smoothstep(0.80 - amt * 0.8, 1.0 - amt * 0.8, mm) * step(0.001, amt);
  vec3 greenC = t > 3.5 ? ${v3(GR.scrub)} : ${v3(GR.green)};
  vec3 dryC = t > 3.5 ? ${v3(GR.gold)} : ${v3(GR.straw)};
  // dusty olive patches: a lawn is rarely the green of a leaf
  greenC = mix(greenC, ${v3(GR.dusty)}, smoothstep(0.45, 0.8, m2) * ${up('dusty')});
  vec3 c = mix(greenC, dryC, dry);
  float calm = ${up('calm')};
  float lum = (1.0 + (m1 - 0.5) * ${f(GR.lum1)} * ${up('macro')}) * (1.0 + (m2 - 0.5) * ${f(GR.lum2)} * calm);
  float fine = 1.0 - smoothstep(${f(GR.fadeFrom)}, ${f(GR.fadeTo)}, fw);
  float wear = 0.0;
#if GRASS_DETAIL > 1
  float m3 = gNoise(p / ${f(GR.patch)} + 13.1);
  lum *= 1.0 + (m3 - 0.5) * ${f(GR.lumPatch)} * calm;
  lum *= 1.0 + (gNoise(p / ${f(GR.mid)} + 29.3) - 0.5) * ${f(GR.lumMid)} * calm * (1.0 - smoothstep(0.2, 0.9, fw));
  lum *= 1.0 + (gNoise(p / ${f(GR.fine)} + 3.1) - 0.5) * ${f(GR.lumFine)} * fine + grain * ${f(GR.lumPage)} * fine;
  // grain and blade scales: only the rider's own feet see them (the pixel is far under a blade there), so they go first as fw grows
  float nearG = 1.0 - smoothstep(0.012, 0.09, fw);
  lum *= 1.0 + (gNoise(p / ${f(GR.grain)} + 51.7) - 0.5) * ${f(GR.lumGrain)} * nearG;
  float nearB = 1.0 - smoothstep(0.004, 0.03, fw);
  lum *= 1.0 + (gNoise(vec2(p.x * 2.6, p.y) / ${f(GR.blade)} + 77.3) - 0.5) * ${f(GR.lumBlade)} * nearB;
  // darker tufts: small ones on unkempt ground, wider scrub clumps on a meadow
  float tuftS = t > 3.5 ? ${f(GR.clump)} : ${f(GR.tuft)};
  float tuft = smoothstep(0.62, 0.86, gNoise(p / tuftS + 4.7)) * ${up('tuft')};
  c = mix(c, ${v3(GR.dark)}, tuft * ${f(GR.tuftAmt)} * (1.0 - 0.45 * dry));
  // worn bare ground
  float wearOdds = ${up('wear')};
  wear = smoothstep(0.72, 0.9, gNoise(p / ${f(GR.wear)} + 21.7) * 0.7 + m3 * 0.3) * wearOdds;
#endif
  // mowing stripes: bands in world space, lost to a pixel wider than them
  if (t < 1.5) {
    float sx = dot(p, vec2(${f(GR.stripeDir[0])}, ${f(GR.stripeDir[1])})) / ${f(GR.stripeW)};
    float fx = fw / ${f(GR.stripeW)};
    float tri = abs(fract(sx) - 0.5) * 2.0;
    float band = smoothstep(0.5 - fx - 0.06, 0.5 + fx + 0.06, tri) * 2.0 - 1.0;
    // blades bent one way and the other catch the light differently: the bands read stronger looking along them than across
    float al = abs(dot(normalize(view.xz + 1e-4), vec2(-${f(GR.stripeDir[1])}, ${f(GR.stripeDir[0])})));
    lum *= 1.0 + band * ${f(GR.stripeAmp)} * (0.65 + 0.5 * al) * (1.0 - smoothstep(0.1, 0.4, fx));
    c = mix(c, c * vec3(1.03, 1.0, 0.93), band * 0.5 + 0.5);
  }
  // the grazing angle: a rider sees blade sides, so yellower, more saturated, a little brighter toward the horizon, less soil
  float gz = smoothstep(0.55, 0.95, 1.0 - clamp(-view.y, 0.0, 1.0));
  c *= mix(vec3(1.0), vec3(1.08, 1.04, 0.80), gz * ${f(GR.grazeYellow)});
  float l = dot(c, vec3(0.333));
  c = mix(vec3(l), c, 1.0 + gz * ${f(GR.grazeSat)});
  lum *= 1.0 + gz * ${f(GR.grazeLum)} * smoothstep(${f(GR.grazeFrom)}, ${f(GR.grazeTo)}, depth);
  c = mix(c, ${v3(GR.bare)}, wear * ${f(GR.wearAmt)} * (1.0 - 0.7 * gz));
  c *= lum;
#if GRASS_DETAIL > 1
  // clover, weeds and flowers, near only
  float nearF = 1.0 - smoothstep(${f(GR.fleckNear * 0.35)}, ${f(GR.fleckNear)}, depth);
  float odds = ${up('fleck')};
  if (nearF > 0.0 && odds > 0.0) {
    vec2 fp = p * ${f(GR.fleckDens)};
    vec2 cell = floor(fp);
    float h = gHash(cell);
    float h2 = gHash(cell + 41.7);
    vec2 off = vec2(gHash(cell + 3.3), gHash(cell + 9.1)) * 0.5 + 0.25;
    float spot = (1.0 - smoothstep(0.10, 0.20, length(fract(fp) - off))) * step(h, odds) * nearF;
    vec3 fc = t < 3.5
      ? (h2 < 0.55 ? vec3(0.34, 0.47, 0.15) : h2 < 0.8 ? vec3(0.80, 0.62, 0.07) : vec3(0.80, 0.78, 0.68))
      : (h2 < 0.4 ? vec3(0.82, 0.66, 0.08) : h2 < 0.7 ? vec3(0.80, 0.78, 0.70) : h2 < 0.88 ? vec3(0.55, 0.38, 0.62) : vec3(0.72, 0.12, 0.06));
    c = mix(c, fc, spot * 0.9);
  }
#endif
  // looking toward the sun the blades glow
  float back = pow(max(dot(view, -normalize(sunDir)), 0.0), 3.0);
  sheen = back * gz * ${f(GR.sheen)} * (1.0 - wear) * (0.5 + 0.5 * (1.0 - dry));
  return c;
}
`

/**
 * The same field for the near-field grass (render/grass-near.ts `fieldGlsl`): the ground's own macro colour, dry
 * patches and worn ground, so a blade grows out of the colour under it and the edge of the near ring cannot be seen.
 * No derivatives (it runs in a vertex shader too). Alpha is how tall the grass stands here, 0..1: low on worn ground.
 */
export const GRASS_FIELD_GLSL = `
float gHash(vec2 p) {
  p = mod(p, 997.0);
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float gNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(gHash(i), gHash(i + vec2(1.0, 0.0)), f.x), mix(gHash(i + vec2(0.0, 1.0)), gHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
${PICK}
vec4 grassField(vec2 p, float t) {
  float amt = ${up('dry')};
  float m1 = gNoise(p / ${f(GR.macro1)});
  float m2 = gNoise(p / ${f(GR.macro2)} + 7.3);
  float mm = m1 * 0.6 + m2 * 0.4;
  float dry = smoothstep(0.80 - amt * 0.8, 1.0 - amt * 0.8, mm) * step(0.001, amt);
  vec3 greenC = t > 3.5 ? ${v3(GR.scrub)} : ${v3(GR.green)};
  vec3 dryC = t > 3.5 ? ${v3(GR.gold)} : ${v3(GR.straw)};
  greenC = mix(greenC, ${v3(GR.dusty)}, smoothstep(0.45, 0.8, m2) * ${up('dusty')});
  vec3 c = mix(greenC, dryC, dry);
  float m3 = gNoise(p / ${f(GR.patch)} + 13.1);
  float calm = ${up('calm')};
  float lum = (1.0 + (m1 - 0.5) * ${f(GR.lum1)} * ${up('macro')}) * (1.0 + (m2 - 0.5) * ${f(GR.lum2)} * calm) * (1.0 + (m3 - 0.5) * ${f(GR.lumPatch)} * calm);
  float wearOdds = ${up('wear')};
  float wear = smoothstep(0.72, 0.9, gNoise(p / ${f(GR.wear)} + 21.7) * 0.7 + m3 * 0.3) * wearOdds;
  float tall = t < 2.5 ? 0.85 + 0.15 * m3 : t < 3.5 ? mix(0.45, 1.0, m2) : 0.3 + 0.7 * smoothstep(0.2, 0.7, m3);
  return vec4(c * lum, tall * (1.0 - 0.9 * wear));
}
`
