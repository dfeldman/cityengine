/**
 * The road, which is most of what a rider looks at for the whole session.
 *
 * Two decisions are worth explaining.
 *
 * **Markings are drawn in the shader, not painted into the texture.** A texture of a centre line would have
 * to be stretched to whatever width the street happens to be, and OSM streets change width constantly — so
 * the line would drift off centre at every junction and go fat on a boulevard. Instead every road vertex
 * carries *how far across the carriageway it is, in metres*, and the shader draws the line where that value
 * is near zero. The line is then exactly 12 cm wide on a 4 m alley and on a 20 m avenue, which is what paint
 * on a real road does.
 *
 * **Wheel polish.** Traffic burnishes two bands where the tyres run and leaves the crown between them and the
 * gutters either side darker and rougher. It costs two `smoothstep`s and it is the mark that makes a road
 * look used rather than laid this morning — worth more than any amount of extra texture resolution.
 *
 *      gutter   wheel track   crown   wheel track   gutter
 *      ──────┬──────────────┬───────┬──────────────┬──────
 *       dark │    polished  │ line  │   polished   │ dark
 */
import { Constants } from '@babylonjs/core/Engines/constants'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import type { Scene } from '@babylonjs/core/scene'
import { DAYLIGHT, NIGHT, WETNESS, type SkyLook } from './facade-material.ts'
import { GRASS_GLSL, getGrassDetail } from './grass-glsl.ts'
import { LITTER_GLSL, LITTER_UNIFORMS, LT, SITE, bindLitter, litterDefines } from './litter-glsl.ts'

/** How many metres of road one tile of a surface page covers. Matches tools/roadgen/paint.py. */
export const ROAD_PAGE_METRES = 6.0

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;        // x = signed metres across the carriageway, y = metres along it
attribute vec4 color;     // rgb = tint, a = half the carriageway width in metres
uniform mat4 worldViewProjection;
uniform mat4 world;
varying vec2 vAcross;
varying vec3 vNormal;
varying vec3 vTint;
varying float vHalf;
varying float vDepth;
varying vec3 vWorld;


void main(void) {
  gl_Position = worldViewProjection * vec4(position, 1.0);
  vWorld = (world * vec4(position, 1.0)).xyz;
  vAcross = uv;
  vNormal = normalize(mat3(world) * normal);
  vTint = color.rgb;
  vHalf = color.a;
  vDepth = gl_Position.w;
}
`

/** natural ground steeper than this is drawn as stone: |normal.y| from CLIFF_FROM (all stone) to CLIFF_TO (all ground); the courses' height (m) and colour */
export const CLIFF_FROM = 0.42, CLIFF_TO = 0.62, CLIFF_COURSE_PLAIN = 0.55, CLIFF_STONE: [number, number, number] = [0.66, 0.6, 0.5]
/** Paris's ashlar: course height (m) and colour */
export const CLIFF_COURSE = 0.45, CLIFF_ASHLAR: [number, number, number] = [0.6, 0.575, 0.52]
/** the ashlar's blocks (m) and its mortar's shade (of the stone's) */
export const CLIFF_BLOCK = 0.95, CLIFF_MORTAR = 0.58
/** the base ground's steepness per vertex (render/city.ts): grade from CLIFF_GRADE_FROM (ground) to CLIFF_GRADE_TO (all stone), read over CLIFF_GRADE_RUN m */
export const CLIFF_GRADE_FROM = 0.8, CLIFF_GRADE_TO = 1.4, CLIFF_GRADE_RUN = 0.8
/** the ground surfaces a cliff turns to stone on (the city's base ground; never a road, a deck or a painted layer) */
export const CLIFF_SURFACES = new Set(['grass', 'dirt', 'sand'])

/**
 * ROAD DETAIL (owner, 2026-11-26: "a far better appearance for road surfaces… keep performance impact minimal"; "turn
 * advanced road appearance on and off in the settings or graphics levels"). A compile-time level, so Off is the old
 * shader to the instruction:
 *   0  off: the page, the wheel polish, the paint, as before
 *   1  simple (Low / phones on Auto): the page's grain calmed towards its own mean and more so with distance (the far
 *      road was a sparkle), a broad tone in world metres so the page stops tiling, wheel tracks and an oil line per
 *      lane, kerbside grime, a dry grazing sheen
 *   2  full (Medium/High): a second rotated sample of the page against tiling, utility patches, sealed cracks, manholes
 * No new textures at any level: everything is arithmetic on the page already loaded.
 */
export const RD = {
  /** the grain's contrast against the page mean, near and far, and the depths (m) between */
  contrastNear: 0.62, contrastFar: 0.22, near: 6, far: 70,
  /** broad tone: two noise scales (m) and the brightness swing; how far old asphalt greys */
  macro1: 23, macro2: 7, macroAmp: 0.16, grey: 0.22,
  /** lanes: a lane's width (m); wheel-track polish and the oil line's darkening; kerb grime */
  lane: 3.4, polish: 0.07, oil: 0.14, grime: 0.2,
  /** dry sheen at a grazing angle (of the horizon colour), and a broad sun highlight on the polished tracks */
  sheen: 0.12, sunSheen: 0.05,
  /** utility patches: cell length (m), odds a cell has one, how dark a newer patch is (light ones are 2 − this) */
  patchLen: 17, patchOdds: 0.32, patchDark: 0.64,
  /** sealed cracks: transverse spacing (m) and odds; longitudinal segment (m) and odds; the sealant's width (m) and shade */
  crackGap: 6.5, crackOdds: 0.45, seamLen: 21, seamOdds: 0.35, sealW: 0.05, seal: 0.55,
  /** manholes: cell length (m), odds, radius (m) */
  holeGap: 31, holeOdds: 0.42, holeR: 0.33,
}
let ROAD_DETAIL = 2
/** before anything is built (game.ts): materials read it as they are made */
export function setRoadDetail(level: number): void { ROAD_DETAIL = level }
const f = (v: number): string => v.toFixed(4)

/**
 * PARK TRAILS (owner, 2026-11-27: "a high quality shader for park trails, similar to the one we have for asphalt… detailed,
 * realistic, and also extremely fast even on limited hardware"). The trail layer's materials (`layer:trail`, render/city.ts)
 * compile a TRAIL branch of this same shader; nothing else pays for it. It follows ROAD DETAIL: Off is the plain page as
 * before, 1 the shape (a ragged edge the grass eats into, a worn line wandering down the middle or two tyre tracks on a fire
 * road, a mottled verge, damp earth, matt, puddles in the worn line), 2 adds the fine things within TR.fineFar m: pebbles
 * lit by the sun, leaf litter, rain rills across the way, root-heave cracks on an asphalt path. Arithmetic only, no textures.
 * The strip carries its half-width in the colour alpha (city.ts) and is widened by `pad` a side so the ragged edge averages
 * out at the way's own width.
 */
export const TR = {
  /** the ragged edge's two noise scales along the way (m) */
  edge1: 1.7, edge2: 0.45,
  /** the worn line's wander along the way (m) and how far it strays (of the half-width) */
  wander: 11, stray: 0.3,
  /** a way this wide (half, m) or wider wears two tyre tracks rather than one foot line; where they run (of the half-width) */
  twin: 1.4, track: 0.42,
  /** a promenade this wide (half, m) wears evenly: the worn line fades out between wideFrom and wideTo */
  wideFrom: 2.5, wideTo: 4.5,
  /** the verge: where it begins (of the half-width), its mottle's scale (m) and shade (moss and litter creeping in) */
  vergeFrom: 0.55, mottle: 0.9, vergeShade: [0.8, 0.84, 0.66] as const,
  /** damp patches on earth (the macro tone's high end): their shade, in place of asphalt's greying */
  damp: [0.84, 0.82, 0.77] as const,
  /** fine detail is drawn nearer than this (m) */
  fineFar: 30,
  /** leaf litter: the cell (m), the leaf's half-length and half-width (of the cell), its two colours, the patches' scale (m) */
  leaf: 0.22, leafL: 0.28, leafW: 0.13, leafA: [0.27, 0.22, 0.14] as const, leafB: [0.43, 0.37, 0.24] as const, litter: 2.6,
  /** pebbles: radius (of the cell), how far the sun lights and darkens them, their contact shadow */
  pebbleR: 0.24, pebbleSun: 0.55, pebbleShadow: 0.72,
  /** rain rills across the way: spacing (m), width (m), how deep a shade */
  rillGap: 3.4, rillW: 0.07, rillShade: 0.3,
  /** an asphalt path's root-heave cracks: spacing (m), odds, and the weeds' colour in them */
  heaveGap: 4.5, heaveOdds: 0.5, weed: [0.09, 0.1, 0.065] as const,
}
/** per page: kind (1 asphalt, 2 earth, 3 gravel, 4 stabilisé — the sand page), pad and rag (m), the worn line's shade and how
 *  much smoother it is, pebble density and cell (m), leaf density, rill odds, dry sheen (of the road's) */
const TRAIL_LOOK: Record<string, { kind: number; pad: number; rag: number; worn: number; smooth: number; pebbles: number; pebble: number; leaves: number; rills: number; sheen: number }> = {
  asphalt: { kind: 1, pad: 0, rag: 0.07, worn: 1.0, smooth: 0, pebbles: 0, pebble: 0.05, leaves: 0.05, rills: 0, sheen: 0.6 },
  dirt: { kind: 2, pad: 0.18, rag: 0.36, worn: 0.86, smooth: 0.55, pebbles: 0.12, pebble: 0.06, leaves: 0.16, rills: 0.35, sheen: 0.06 },
  gravel: { kind: 3, pad: 0.13, rag: 0.26, worn: 1.08, smooth: 0.45, pebbles: 0.5, pebble: 0.045, leaves: 0.08, rills: 0.15, sheen: 0.05 },
  sand: { kind: 4, pad: 0.05, rag: 0.1, worn: 0.93, smooth: 0.5, pebbles: 0.28, pebble: 0.035, leaves: 0.06, rills: 0.4, sheen: 0.1 },
}
/** how much wider (m, a side) city.ts draws a trail of this page, for its ragged edge; 0 with road detail off */
export function trailPad(page: string): number { return ROAD_DETAIL > 0 ? TRAIL_LOOK[page]?.pad ?? 0 : 0 }
/** whether a trail strip carries its half-width for the shader (road detail on) */
export function trailDetail(): boolean { return ROAD_DETAIL > 0 }
const v3 = (c: readonly number[]): string => `vec3(${c.map(f).join(', ')})`

/* the trail's shape: its ragged edge, its worn line and verge, the grain calmed in the worn line (before the base colour) */
const TRAIL_SHAPE = `
  float tFw = length(fwidth(vWorld.xz));
  {
    // (wrapped: sin() of a large argument stripes on a phone's GPU, and this noise decides a discard; a notch once per 512 m)
    float tAl = mod(along, 512.0);
    float tAc = abs(across);
    float tSide = step(0.0, across);
    float tN = vnoise(vec2(tAl * ${f(1 / TR.edge1)}, tSide * 7.3)) * 0.7 + vnoise(vec2(tAl * ${f(1 / TR.edge2)}, tSide * 5.1 + 13.0)) * 0.3;
    tEdge = max(vHalf - TR_RAG * (1.0 - tN), 0.2);
    if (vHalf > 0.05 && tAc > tEdge) discard;
    tRel = tAc / tEdge;
    float tMid = (vnoise(vec2(tAl * ${f(1 / TR.wander)}, 3.0)) - 0.5) * ${f(2 * TR.stray)} * tEdge;
    float tC = abs(across - tMid) / tEdge;
    float tOne = 1.0 - smoothstep(0.2, 0.65, tC);
    float tTwo = 1.0 - smoothstep(0.07, 0.2, abs(tC - ${f(TR.track)}));
    tWorn = mix(tOne, tTwo, step(${f(TR.twin)}, vHalf)) * (0.6 + 0.4 * vnoise(vec2(tAl * 0.31, 9.0))) * (1.0 - 0.8 * smoothstep(${f(TR.wideFrom)}, ${f(TR.wideTo)}, vHalf));
    tVerge = smoothstep(${f(TR.vergeFrom)}, 1.0, tRel);
    gk *= 1.0 - TR_SMOOTH * tWorn;
#if TRAIL > 1
    gk *= 1.0 + 0.4 * tVerge;
#endif
  }
`

/* the trail's surface: the worn line's shade, the verge, and near the eye pebbles, leaves, rills and cracks */
const TRAIL_SURFACE = `
  base *= mix(1.0, TR_WORN, tWorn);
  base *= mix(vec3(1.0), ${v3(TR.vergeShade)}, tVerge * smoothstep(0.3, 0.8, vnoise(vWorld.xz * ${f(1 / TR.mottle)} + 41.0)));
#if TRAIL == 1
  base *= 1.0 - 0.12 * tVerge;
#endif
#if ROAD_DETAIL > 1
  if (vDepth < ${f(TR.fineFar)}) {
    vec3 L = -normalize(sunDir);
#if TRAIL > 1
    // PEBBLES: one per cell at most, a dome lit by the sun with its shadow on the far side; gone once under two pixels
    {
      vec2 pc = vWorld.xz / TR_PEBBLE;
      float pfw = tFw / TR_PEBBLE;
      vec2 ci = floor(pc);
      float h = hashc(ci);
      float dens = TR_PEBBLES * (0.5 + tVerge + 0.6 * vnoise(vWorld.xz * 0.7)) * (1.0 - 0.6 * tWorn);
      if (fract(h * 5.31) < dens && pfw < 0.6) {
        vec2 d = fract(pc) - 0.5 - (vec2(fract(h * 7.13), fract(h * 3.71)) - 0.5) * 0.4;
        float r = ${f(TR.pebbleR)} * (0.7 + 0.6 * fract(h * 11.3));
        float fade = 1.0 - smoothstep(0.3, 0.6, pfw);
        float disc = 1.0 - smoothstep(r - pfw, r + pfw, length(d));
        vec2 dn = d / r;
        vec3 pn = vec3(dn.x, sqrt(max(0.0, 1.0 - dot(dn, dn))), dn.y);
        float lit = clamp(dot(pn, L) / max(L.y, 0.25), 0.0, 1.6);
        float shadow = (1.0 - smoothstep(r - pfw, r + pfw, length(d + L.xz * r * 0.6))) * (1.0 - disc);
        vec3 stone = base * (0.75 + 0.55 * fract(h * 17.1)) * mix(1.0 - ${f(TR.pebbleSun)}, 1.0 + ${f(TR.pebbleSun)} * 0.6, lit);
        base = mix(base, stone, disc * fade);
        base *= 1.0 - shadow * fade * ${f(1 - TR.pebbleShadow)};
      }
    }
    // RAIN RILLS: a shallow groove across the way in some cells, slanted and wandering, fines washed out on its lower bank
    {
      float rc = floor(along / ${f(TR.rillGap)});
      float rh = hashc(vec2(rc, 211.0));
      float slant = (fract(rh * 7.7) - 0.5) * 1.6;
      float rpos = (rc + 0.2 + 0.6 * fract(rh * 3.3)) * ${f(TR.rillGap)} + across * slant + 0.15 * sin(across * 3.1 + rh * 20.0);
      float on = step(rh, TR_RILLS) * (1.0 - 0.6 * tVerge);
      float rw = fwA + fwC * abs(slant);
      float rill = line(along - rpos, ${f(TR.rillW)} * (0.6 + 0.8 * fract(rh * 5.1)), rw) * on;
      float bank = line(along - rpos - 0.08, 0.07, rw) * on;
      base *= (1.0 - rill * ${f(TR.rillShade)}) * (1.0 + bank * 0.12);
    }
#else
    // ROOT HEAVE: a wandering crack across the path in some cells and one down its edge, weeds in both
    {
      float hc = floor(along / ${f(TR.heaveGap)});
      float hh = hashc(vec2(hc, 307.0));
      float hpos = (hc + 0.3 + 0.4 * fract(hh * 7.1)) * ${f(TR.heaveGap)} + 0.12 * sin(across * 2.3 + hh * 30.0) + 0.04 * sin(across * 9.0 + hh * 11.0);
      float crack = line(along - hpos, 0.025, fwA + fwC * 0.3) * step(hh, ${f(TR.heaveOdds)});
      float wob = 0.04 * sin(along * 1.7) + 0.02 * sin(along * 5.3);
      float ecrack = line(abs(across) - tEdge * 0.8 - wob, 0.016, fwC + fwA * 0.2) * smoothstep(0.6, 0.8, vnoise(vec2(along * 0.4, 5.0)));
      base = mix(base, ${v3(TR.weed)}, clamp(crack + ecrack, 0.0, 1.0) * 0.6);
    }
#endif
    // LEAF LITTER: an ellipse in some cells, thicker at the verge and in drifts; gone once a leaf is a pixel or two
    {
      vec2 lp = vWorld.xz / ${f(TR.leaf)};
      float lfw = tFw / ${f(TR.leaf)};
      vec2 li = floor(lp);
      float lh = hashc(li + 101.0);
      float dens = TR_LEAVES * (0.4 + 1.6 * tVerge) * smoothstep(0.3, 0.75, vnoise(vWorld.xz * ${f(1 / TR.litter)} + 3.0)) * 2.0;
      if (lh < dens && lfw < 0.5) {
        float a = fract(lh * 91.7) * 6.2832;
        vec2 cs = vec2(cos(a), sin(a));
        vec2 q = fract(lp) - 0.5 - (vec2(fract(lh * 13.7), fract(lh * 29.3)) - 0.5) * 0.3;
        q = vec2(dot(q, cs), dot(q, vec2(-cs.y, cs.x))) / vec2(${f(TR.leafL)}, ${f(TR.leafW)});
        float e = length(q);
        float leaf = (1.0 - smoothstep(1.0 - lfw * 4.0, 1.0 + lfw * 4.0, e)) * (1.0 - smoothstep(0.25, 0.5, lfw));
        vec3 lc = mix(${v3(TR.leafA)}, ${v3(TR.leafB)}, fract(lh * 53.1)) * (0.85 + 0.3 * step(0.0, q.y));
        base = mix(base, lc, leaf);
      }
    }
  }
#endif
`

const FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
#ifndef ROAD_DETAIL
#define ROAD_DETAIL 0
#endif
#ifndef GRASS_DETAIL
#define GRASS_DETAIL 0
#endif
#ifndef GRASS_GROUND
#define GRASS_GROUND 0
#endif
#ifndef TRAIL
#define TRAIL 0
#endif
varying vec2 vAcross;
varying vec3 vNormal;
varying vec3 vTint;
varying float vHalf;
varying float vDepth;
varying vec3 vWorld;
uniform sampler2D surfaceTex;
uniform float cliff;
uniform vec3 sunDir;
uniform vec3 sunColour;
uniform vec3 skyColour;
uniform vec3 groundColour;
uniform vec3 fogColour;
uniform float fogDensity;
uniform float pageMetres;
uniform float marked;      // 1 for a carriageway that carries paint, 0 for setts, gravel, a footway
uniform float lanes;       // 1 for the carriageway's strips (uv.x across from the centre, alpha its half-width), 0 for a pavement
uniform float night;
uniform float wetness;     // 0 dry, 1 standing water
uniform vec3 zenith;
uniform vec3 horizon;
uniform vec3 eye;

// A band of the given width centred on 'at', softened by however much of it one pixel covers. Without the
// derivative term a centre line shimmers horribly as it recedes.
float hash21(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

/* Smooth value noise in world metres, for where the water stands. */
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
}

/*
 * Is the eye looking at this surface from underneath? The TRUE slope, from screen-space derivatives — not
 * the vertex normal, which on draped ground is always straight up. Testing "is the eye below this point"
 * made every hillside that rose above the eye transparent. The derivative normal is flipped to face the
 * eye, and if that eye-facing normal points down, the eye is under the ground.
 */
bool underside(vec3 p, vec3 e) {
  vec3 n = cross(dFdx(p), dFdy(p));
  float len = length(n);
  if (len < 1e-10) return false;
  n /= len;
  if (dot(n, e - p) < 0.0) n = -n;
  return n.y < -0.05;
}

float band(float x, float at, float width) {
  float d = abs(x - at) - width * 0.5;
  return 1.0 - smoothstep(0.0, fwidth(x) + 0.004, d);
}

#if GRASS_GROUND > 0
${GRASS_GLSL}
#endif
${LITTER_GLSL}

#if ROAD_DETAIL > 0
/* a hash for cell coordinates: wrapped first, since sin() of a large argument stripes on a phone's GPU */
float hashc(vec2 c) { return hash21(mod(c, 509.0)); }

/* A line that keeps its INK as it recedes: band() widens with the pixel, so a 5 cm crack 60 m off would draw
   one pixel wide at full strength and shimmer. This one fades instead — the coverage a real line would have. */
float line(float x, float width, float fw) {
  float w = max(fw, 0.002);
  return (1.0 - smoothstep(width * 0.5, width * 0.5 + w, abs(x))) * min(1.0, width / w);
}
#endif

void main(void) {
  /*
   * Never the underside. The ground is drawn without back-face culling because the clipper's winding is
   * not dependable, which meant that ground standing above the eye was drawn from beneath — a green
   * ceiling across the whole sky. The winding cannot say which side the eye is on, but the slope can.
   */
  if (underside(vWorld, eye)) discard;
  float across = vAcross.x;
  float along  = vAcross.y;
  vec3 tex = texture2D(surfaceTex, vec2(across, along) / pageMetres).rgb;
  // a park trail's edge, worn line and verge (TRAIL below): read by the puddles too
  float tEdge = 1.0, tRel = 0.0, tWorn = 0.0, tVerge = 0.0;
#if LITTER > 0
  // (render/litter-glsl.ts: its pixel size here, in uniform flow)
  float ltFw = length(fwidth(vWorld.xz));
  float ltGloss = 0.0;
#endif
#if ROAD_DETAIL > 0
  float polish = 0.0, gloss = 0.0;
  // (derivatives here, in uniform flow, for the lines drawn inside branches below)
  float fwA = fwidth(along), fwC = fwidth(across);
  // the page's own mean: its smallest mip
  vec3 mean = texture2D(surfaceTex, vec2(0.5), 14.0).rgb;
  vec3 grain = tex - mean;
#if ROAD_DETAIL > 1
  // a second look at the same page, turned and scaled, so it stops repeating every ${ROAD_PAGE_METRES} m
  vec2 ruv = mat2(0.8, -0.6, 0.6, 0.8) * vec2(across, along) / (pageMetres * 1.37) + 0.31;
  grain = (grain + texture2D(surfaceTex, ruv).rgb - mean) * 0.7;
#endif
  float dist = smoothstep(${f(RD.near)}, ${f(RD.far)}, vDepth);
  float gk = mix(${f(RD.contrastNear)}, ${f(RD.contrastFar)}, dist);
#if TRAIL > 0
${TRAIL_SHAPE}
#endif
  vec3 base = (mean + grain * gk) * vTint * 1.25;
  // broad tone in world metres: resurfaced stretches, old greyed ones
  float m1 = vnoise(vWorld.xz * ${f(1 / RD.macro1)});
  float m2 = vnoise(vWorld.xz * ${f(1 / RD.macro2)} + 17.0);
  base *= 1.0 + ((m1 - 0.5) + (m2 - 0.5) * 0.5) * ${f(RD.macroAmp)};
#if TRAIL > 1
  // earth does not grey as asphalt does: it lies in damp patches, darker and warmer
  base *= mix(vec3(1.0), ${v3(TR.damp)}, 0.8 * smoothstep(0.45, 0.85, m1));
#else
  base = mix(base, vec3(dot(base, vec3(0.333))) * vec3(1.03, 1.0, 0.96), ${f(RD.grey)} * smoothstep(0.35, 0.9, m1));
#endif
#if TRAIL > 0
${TRAIL_SURFACE}
#endif
#else
  // 2.0 was chosen when the tints were brighter and at this exposure it washed every street out
  vec3 base = tex * vTint * 1.25;
#endif
#if GRASS_GROUND > 0
  // the base ground is unkempt grass (render/grass-glsl.ts): its own colours, the page supplying only its grain
  float gSheen = 0.0;
  {
    vec3 gmean = texture2D(surfaceTex, vec2(0.5), 14.0).rgb;
    float gg = dot(tex - gmean, vec3(0.333));
#if GRASS_DETAIL > 1
    vec2 gruv = mat2(0.8, -0.6, 0.6, 0.8) * vec2(across, along) / (pageMetres * 1.37) + 0.31;
    gg = (gg + dot(texture2D(surfaceTex, gruv).rgb - gmean, vec3(0.333))) * 0.7;
#endif
    float gfw = length(fwidth(vWorld.xz));
    vec3 gsurf = grassSurface(3.0, vWorld, vDepth, normalize(vWorld - eye), sunDir, gfw, gg, gSheen);
    // only the ground itself: a way mapped surface=grass shares this mesh (city.ts drawnSurface) and carries its half-width
    // in the colour alpha, where the ground's quads carry 0 — it stays the path it was, not grass with clover on it
    float gOn = 1.0 - step(0.01, vHalf);
    base = mix(base, gsurf, gOn);
    gSheen *= gOn;
  }
#endif
  /*
   * A CLIFF IS STONE (2026-11-15, owner: the Iéna tunnel's sides "quite weird in texture"): the natural ground (grass, dirt, sand) on a
   * face steeper than about 60° — the step at a trench, a quay, a bank — is drawn as limestone in courses, not grass stretched up a
   * wall. The slope is the face's own (screen derivatives of the world position): several ground meshes carry an up normal everywhere.
   */
  if (cliff > 0.5) {
    vec3 gn = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    // (the ground's own steepness per vertex where the city gave it, colour alpha −1..−2: smooth across triangles, so the stone's edge
    //  follows the bank and not the mesh's diagonals; the face's own slope otherwise)
    bool given = vHalf < -0.5;
    float steep = given ? smoothstep(0.15, 0.55, clamp(-vHalf - 1.0, 0.0, 1.0))
      : 1.0 - smoothstep(${CLIFF_FROM.toFixed(3)}, ${CLIFF_TO.toFixed(3)}, abs(gn.y));
    if (steep > 0.0) {
      vec3 stone;
      if (given) {
        /*
         * ASHLAR (2026-11-16, the plazas and bridgeheads pass; Paris, where the city gives the steepness per vertex): dressed limestone
         * in courses of CLIFF_COURSE m, blocks CLIFF_BLOCK m long staggered by half a block, sunk mortar joints, each block its own shade
         * and a broad weathering. Along a fixed world direction, not the face's: the face's slope from screen derivatives jitters at a
         * lumpy bank's many triangle edges, and the blocks speckled. No texture: the grass page speckled the stone too.
         */
        float v = vWorld.y / ${CLIFF_COURSE.toFixed(3)};
        float row = floor(v);
        float u = dot(vWorld.xz, vec2(0.8, 0.6)) / ${CLIFF_BLOCK.toFixed(3)} + 0.5 * mod(row, 2.0);
        vec2 cell = vec2(floor(u), row);
        float fv = fract(v), fu = fract(u);
        float wv = fwidth(v) * 1.0 + 0.04, wu = fwidth(u) * 1.0 + 0.03;
        float joint = smoothstep(0.0, wv, fv) * (1.0 - smoothstep(1.0 - wv, 1.0, fv)) * smoothstep(0.0, wu, fu) * (1.0 - smoothstep(1.0 - wu, 1.0, fu));
        float shade = (0.88 + 0.18 * hash21(cell)) * (0.86 + 0.14 * vnoise(vWorld.xz * 0.35 + vWorld.y * 0.2));
        stone = vec3(${CLIFF_ASHLAR.map((v) => v.toFixed(3)).join(', ')}) * shade * mix(${CLIFF_MORTAR.toFixed(3)}, 1.0, joint);
      } else {
        // (elsewhere, as before: limestone in courses)
        float course = fract(vWorld.y / ${CLIFF_COURSE_PLAIN.toFixed(3)});
        float joint = smoothstep(0.0, 0.07, course) * (1.0 - smoothstep(0.93, 1.0, course));
        stone = vec3(${CLIFF_STONE.map((v) => v.toFixed(3)).join(', ')}) * (0.8 + 0.2 * joint) * (0.92 + 0.08 * tex.g / max(0.001, dot(tex, vec3(0.333))));
      }
      base = mix(base, stone, steep);
    }
  }

#if ROAD_DETAIL > 0
  if (lanes > 0.5 && vHalf > 0.5) {
    float rel = abs(across) / vHalf;
    // lanes from the width: two wheel tracks in each, and the oil line cars drip between them
    float lanes = max(1.0, floor(vHalf / ${f(RD.lane)} + 0.35));
    float lx = fract(rel * lanes);
    polish = 1.0 - smoothstep(0.05, 0.15, min(abs(lx - 0.27), abs(lx - 0.73)));
    float oil = (1.0 - smoothstep(0.03, 0.11, abs(lx - 0.5))) * (0.4 + 0.6 * vnoise(vec2(along * 0.4, rel * 3.0 + 5.0))) * marked;
    float gutter = smoothstep(0.78, 1.0, rel);
    base *= 1.0 + polish * ${f(RD.polish)} - oil * ${f(RD.oil)} - gutter * ${f(RD.grime)};
    // grit and leaf litter along the kerb
    base = mix(base, base * vec3(1.08, 1.0, 0.86), gutter * vnoise(vec2(along * 0.6, 3.0)));
#if ROAD_DETAIL > 1
    if (marked > 0.5) {
      float lc = abs(across);
      float side = step(0.0, across);
      // UTILITY PATCHES: a rectangle in some cells, each side of the crown on its own; mostly newer and blacker
      float pc = floor(along / ${f(RD.patchLen)});
      float ph = hashc(vec2(pc, side * 3.0 + 7.0));
      if (ph < ${f(RD.patchOdds)}) {
        float la = along - pc * ${f(RD.patchLen)};
        float a0 = fract(ph * 7.31) * 0.45 * ${f(RD.patchLen)};
        float a1 = a0 + (0.2 + 0.35 * fract(ph * 3.17)) * ${f(RD.patchLen)};
        float c0 = fract(ph * 11.7) * 0.55 * vHalf;
        float c1 = min(vHalf, c0 + (0.3 + 0.5 * fract(ph * 5.93)) * vHalf);
        float d = max(max(a0 - la, la - a1), max(c0 - lc, lc - c1));
        float fw = fwA + fwC;
        float shade = fract(ph * 23.1) < 0.7 ? ${f(RD.patchDark)} : ${f(2 - RD.patchDark)};
        base *= mix(1.0, shade, 1.0 - smoothstep(-fw, fw, d));
        float rim = line(d, 0.07, fw);
        base *= 1.0 - rim * 0.4;
        gloss += rim * 0.6;
      }
      // SEALED CRACKS: transverse ones across part of the width, a wandering seam down a joint
      float tc = floor(along / ${f(RD.crackGap)});
      float th = hashc(vec2(tc, 31.0));
      float tpos = (tc + 0.2 + 0.6 * fract(th * 9.13)) * ${f(RD.crackGap)}
                 + 0.3 * sin(across * 1.3 + th * 40.0) + 0.1 * sin(across * 4.7 + th * 17.0);
      float tspan = 1.0 - smoothstep(0.0, 0.3, abs(across - (fract(th * 5.71) - 0.5) * vHalf) - vHalf * (0.25 + 0.5 * fract(th * 3.37)));
      float crack = line(along - tpos, ${f(RD.sealW)} * (0.7 + 0.6 * fract(th * 2.9)), fwA + fwC * 0.5) * step(th, ${f(RD.crackOdds)}) * tspan;
      float sc = floor(along / ${f(RD.seamLen)});
      float sh = hashc(vec2(sc, 57.0 + side));
      float wob = 0.12 * sin(along * 0.37 + sh * 30.0) + 0.05 * sin(along * 1.9 + sh * 11.0);
      float joint = fract(sh * 7.7) < 0.5 ? 0.12 : vHalf - 0.9;
      float seam = line(lc - joint - wob, ${f(RD.sealW)}, fwC + fwA * 0.2) * step(sh, ${f(RD.seamOdds)})
                 * (1.0 - smoothstep(0.3, 0.45, abs(fract(along / ${f(RD.seamLen)}) - 0.5)));
      float sealant = clamp(crack + seam, 0.0, 1.0);
      base *= 1.0 - sealant * ${f(1 - RD.seal)};
      gloss += sealant;
      // MANHOLES: an iron disc in some cells, in a lane
      float hc = floor(along / ${f(RD.holeGap)});
      float hh = hashc(vec2(hc, 91.0));
      if (hh < ${f(RD.holeOdds)}) {
        float ha = (hc + 0.3 + 0.4 * fract(hh * 7.7)) * ${f(RD.holeGap)};
        float hx = (fract(hh * 13.3) < 0.5 ? -1.0 : 1.0) * vHalf * (0.25 + 0.4 * fract(hh * 4.1));
        float r = length(vec2(along - ha, across - hx));
        float fw = fwA + fwC;
        float disc = 1.0 - smoothstep(${f(RD.holeR)} - fw, ${f(RD.holeR)} + fw, r);
        float hatch = step(0.5, fract((along + across) * 7.0)) * (1.0 - smoothstep(0.02, 0.06, fw));
        vec3 iron = vec3(dot(base, vec3(0.333))) * vec3(0.8, 0.76, 0.72) * (0.85 + 0.25 * hatch);
        base = mix(base, iron, disc);
        base *= 1.0 - line(r - ${f(RD.holeR)}, 0.06, fw) * 0.5;
        gloss += disc * 0.8;
      }
    }
#endif
  }
#else
  // Wheel polish, but only on a carriageway STRIP, where 'across' means distance from the centre line. The
  // unioned road surface has no centre line to measure from — its uvs are just world metres — so it carries
  // a half-width of zero and is left alone.
  if (vHalf > 0.5 && lanes < 0.5) {
    float track = abs(across) / vHalf;
    float polish = smoothstep(0.18, 0.42, track) * (1.0 - smoothstep(0.58, 0.86, track));
    float gutter = smoothstep(0.72, 1.0, track);
    base *= 1.0 + polish * 0.14 - gutter * 0.18;
  }

  // paint. Only on a carriageway wide enough to have two directions on it.
  if (marked > 0.5 && vHalf > 2.6 && lanes < 0.5) {
    vec3 paint = vec3(0.86, 0.85, 0.80);
    // a dashed centre line, 3 m on in every 9 m
    float dash = step(fract(along / 9.0), 0.34);
    float centre = band(across, 0.0, 0.12) * dash;
    // solid edge lines, set in from the kerb
    float edges = band(abs(across), vHalf - 0.45, 0.10);
    float wear = 0.72 + 0.28 * step(0.35, fract(along * 0.7 + across));  // paint is never perfect
    base = mix(base, paint * wear, clamp(centre + edges, 0.0, 1.0) * 0.92);
  }
#endif

  /*
   * Where the water stands. Puddles are low-frequency noise in WORLD metres, so they stay put as the rider
   * moves and are the same size on a boulevard as on an alley, plus a bias towards the gutter: a road is
   * cambered, and water on it ends up at the edges, which is also where it is most visible from a bike.
   */
#if LITTER > 0
  // LITTER (render/litter-glsl.ts): this material's site, and how near the kerb (a gutter) or the verge (a trail) this is
  {
    float ltEdge = 0.0;
#if LITTER_SITE == 1
    ltEdge = vHalf > 0.5 ? 1.0 - clamp((vHalf - abs(across)) / ${LT.gutterW.toFixed(4)}, 0.0, 1.0) : ${LT.noKerb.toFixed(4)};
#elif LITTER_SITE == 3
    ltEdge = tVerge;
#endif
    ltGloss = litterGround(vWorld.xz, vDepth, float(LITTER_SITE), ltEdge, ltFw, wetness, base);
  }
#endif
  float puddle = 0.0;
  if (wetness > 0.01) {
    float gutter = smoothstep(0.55, 1.0, abs(across) / max(vHalf, 0.5)) * marked;
#if TRAIL > 1
    // on earth and gravel the water stands in the worn line, in small puddles, never at the verge; and wet earth goes darker
    puddle = smoothstep(0.52, 0.74, vnoise(vWorld.xz * 0.45) + tWorn * 0.18 - tVerge * 0.25);
    base *= mix(1.0, mix(0.52, 0.34, puddle), wetness);
#else
    puddle = smoothstep(0.48, 0.74, vnoise(vWorld.xz * 0.22) + gutter * 0.24);
    // wet asphalt is darker than dry asphalt everywhere, and darkest where it is deepest
    base *= mix(1.0, mix(0.60, 0.38, puddle), wetness);
#endif
  }

  vec3 n = normalize(vNormal);
  float sun = max(dot(n, -normalize(sunDir)), 0.0);
  float up = n.y * 0.5 + 0.5;
  vec3 lit = base * (mix(groundColour, skyColour, up) + sunColour * sun);
  /*
   * The pool of light a street lamp throws — not modelled per lamp, just the fact that a lit street is lit.
   * It backs off on a WET night, because there it is the wrong mechanism: spread evenly over the road it
   * washes the whole surface one warm brown and leaves the puddles with nothing to be brighter than. On wet
   * tarmac the lamplight belongs in the reflection, where it pools.
   */
  if (night > 0.01) lit += base * vec3(0.26, 0.21, 0.14) * night * (1.0 - wetness * 0.75);
#if LITTER > 0
  // a can's or a cap's glint, and wet mud's
  if (ltGloss > 0.0) lit += sunColour * pow(max(dot(n, normalize(-normalize(sunDir) - normalize(vWorld - eye))), 0.0), 40.0) * ltGloss * 0.7;
#endif
#if GRASS_GROUND > 0
  lit += base * sunColour * gSheen;
#endif
#if ROAD_DETAIL > 0
  /*
   * DRY SHEEN: dry asphalt is not matt. At the grazing angle a rider sees the road ahead at, it picks up the sky,
   * the polished tracks and the sealant most; and the sun leaves a broad soft highlight down the tracks. The wet
   * branch below does this properly for water, so this backs off as the road wets.
   */
  {
    vec3 view = normalize(vWorld - eye);
    float fres = pow(1.0 - clamp(-view.y, 0.0, 1.0), 5.0);
    float dry = (1.0 - wetness) * mix(0.35, 1.0, marked) * (1.0 - 0.8 * cliff);
#if TRAIL > 0
    dry *= TR_SHEEN;
#endif
    lit = mix(lit, horizon * (1.0 - 0.85 * night), clamp(fres * ${f(RD.sheen)} * (0.7 + polish * 0.6 + gloss * 0.8) * dry, 0.0, 0.3));
    vec3 hv = normalize(-normalize(sunDir) - view);
    lit += sunColour * pow(max(dot(n, hv), 0.0), 28.0) * ${f(RD.sunSheen)} * (polish + gloss) * dry;
  }
#endif

  /*
   * And the mirror. A dry road scatters, a wet one reflects, hardest at a grazing angle — which is exactly
   * the angle a rider sees the road ahead at, so the street turns to glass towards the horizon and stays
   * merely dark underneath. At night the thing it reflects is not the sky, which is black, but the street
   * lighting, and a puddle carrying lamplight is the whole reason to render rain at all.
   */
  if (wetness > 0.01) {
    vec3 view = normalize(vWorld - eye);
    float grazing = clamp(-view.y, 0.0, 1.0);
    float fresnel = 0.06 + 0.94 * pow(1.0 - grazing, 3.6);
    vec3 refl = mix(horizon, zenith, smoothstep(0.0, 0.45, grazing));
    /*
     * Only where the water STANDS. A constant term here put the lamplight into every fragment of the road
     * at once and turned a night street into a flat sheet of orange — the ground stopped having a texture
     * at all. What makes a wet street at night worth looking at is the contrast: black tarmac, and the
     * lights picked out in the puddles between.
     */
    refl += vec3(1.00, 0.78, 0.44) * night * puddle * 1.15;
    // a footway or grass sheens, and only a carriageway becomes a proper mirror
    float mirror = mix(0.45, 1.0, marked) * mix(0.58, 1.0, puddle) * wetness;
#if TRAIL > 1
    mirror *= puddle;
#endif
    lit = mix(lit, refl, clamp(fresnel * mirror, 0.0, 0.92));
    // and the sun's own glint on the water, which is what says "wet" rather than "dark"
    vec3 h = normalize(-normalize(sunDir) - view);
    lit += sunColour * pow(max(dot(n, h), 0.0), 190.0) * wetness * (0.35 + 0.65 * puddle) * 1.5;
  }

  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(lit, fogColour, clamp(fog, 0.0, 1.0)), 1.0);
}
`

let registered = false

/** The surfaces that carry painted markings; the rest are setts, gravel, dirt or a footway. */
const MARKED = new Set(['asphalt', 'concrete'])

/**
 * Each page in public/roads at 8x8, inlined, as a stand-in until the real one arrives.
 *
 * A colour would do the job in principle and did not in practice: a flat RGBA pixel of the page's measured
 * mean rendered 45% darker than the page itself on the phone tier, so the road still changed tone, just the
 * other way. Rather than chase the difference — sampling, mip levels and colour space all sit between a
 * byte and a lit pixel — these go through the EXACT path the real page does, as a `Texture` built from a
 * data URL, so whatever the engine does to one it does to the other. What appears when the full page lands
 * is the grain, and nothing else.
 *
 * Ten pages, 2.1 KB of bundle in total, generated with a box resample of each file. Regenerate if a page is
 * redrawn; 8x8 keeps the broad light and shade of the page (a kerbside gutter, a dirt track's centre) that
 * one averaged pixel throws away.
 */
const PAGE_THUMB: Record<string, string> = {
  asphalt: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAYUlEQVR42k3OwQ3CQAADQa+T2qD/fnJeHgiJqWB4vd7nnESnSZK22+7zPIGEXo2GONveU5KCmsSpuhUATAr7aVtAVUOAbedMrUqSZHMbtHC1d/4mbaOjgQLfZyFJrwtw+wBYgVDL9ClNlQAAAABJRU5ErkJggg==',
  brick: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAaUlEQVR42iXLsUEEQQDDQMl7XxYV0Bktc2sTMPn48/115B0ZlQDK9qy7LMoQ2p0IPJ7QlaGq6cv/uH3kQhjAwJ2Q6Qsk02KFZPjYfo5ve1vwSO/teJq8kBj93UzCVp6PsG17b0/kVnH8AXETRSGqEz/xAAAAAElFTkSuQmCC',
  cobblestone: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAf0lEQVR42gXBSXIDQQwDMFJLf9OHVP5/ij1lNcUA/P15AXG6DKz0nckIaSszMxOgd6/uOQ1Dq8rI5/N093pJZqTtqoorVTXIOxPkekF7HbpjrL1VVdX3qrIZDIAkg+zu5/kQ+M7oqvqcO7MEd0Hazgx31/v9J4lgVsMSY2ZA/APYkFUTUPwwfQAAAABJRU5ErkJggg==',
  concrete: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAUklEQVR42l2OQQ7DMAzDKCPfHzD0weEOyoqiulmWTOf6fhL23gCQRFUHVAE1yczMTJKp22zXNVbn/KWCwGn0CA+totqD84W6GnyRkqy7e2dL+gE+gTjIqK+iRQAAAABJRU5ErkJggg==',
  dirt: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAaklEQVR42gXBwUEEMBADsfEm0Bwl0AH9/y7rQcrf7885Q9ItMDPbfZ83kopES0ICkFy7W+fccy4Jar1nLlj1fXK/pXYh537d1iQJ22cVzqAdUAUCmQmqux2ItiokSaLuvptJuAqSQCZB/AdAdFINMsfk8wAAAABJRU5ErkJggg==',
  grass: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAX0lEQVR42k2NsRXCQBTDZCcjsQVTsP8KuS+KI3mocGVbeX9eAKTtzFpr2iQ920KSAMrMQI+DKjcCCYDa67pmlqokJN2tJigqO/Zv0qTPXAfoJuFffjc8f16FtFHAtdYXA7s76UvFND0AAAAASUVORK5CYII=',
  gravel: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAdUlEQVR42iXBQQ4CQRACQKBnTNZvezHxw+4q4MEqvp4PUiCbUIwNcjRr7w3wPN9AiWVHYkjZLiqJWp/rnBnNiNR1XU0Bxt+1NtDRJFnHcW8DYO8bAElOSK7EIIGSsA0CLSk5aSqN7b1vTSm20V9bAEDbNLH9A+8cT7gVxjTVAAAAAElFTkSuQmCC',
  sand: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAYElEQVR42i2NsQ3DQBDDKPmGzywZwosFPqZ4dwQoULm/n4S0ASAJKkwQimsuABdXWhLOxsVHQy6wAHgyhxVlZsZdX1GIPi+RoCetm5Sku49KIrC/YNsmg6bniXSSJtD+AVROORX8lAcEAAAAAElFTkSuQmCC',
  sheet: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAlElEQVR42jXNOQ7CQBAEwO6dWXNJhBxCwF/g/zkZGRESkmXjY/E0AaI+ULxcrof95nw6bnfbvns/7rdP86yicwAAx1IAREQih2Hou9pJkszZp2kyczNLKTG7A1BIEgCSTKnKeTFbuyRBEElKoQgzWy3z7wAIAJIkNW3bvmqXZO6J4J+bVfNFAlDK2PVDRICUFIqxjF+6bU31d72v5AAAAABJRU5ErkJggg==',
  wood: 'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAASklEQVR42m2NMQ7AMAwCQWJo5vQxfUi/0c979UCHOpUimQnBCfjcFzoJRl/Mc/aFbQIGuKLPKyJQKQ2zACszN/KfGsfoPyTtfJkXLYQTPA0/w8UAAAAASUVORK5CYII=',
}

function trailDefines(look: (typeof TRAIL_LOOK)[string] | undefined): string[] {
  if (!look) return []
  return [`#define TRAIL ${look.kind}`, `#define TR_RAG ${f(look.rag)}`, `#define TR_WORN ${f(look.worn)}`, `#define TR_SMOOTH ${f(look.smooth)}`,
    `#define TR_PEBBLES ${f(look.pebbles)}`, `#define TR_PEBBLE ${f(look.pebble)}`, `#define TR_LEAVES ${f(look.leaves)}`,
    `#define TR_RILLS ${f(look.rills)}`, `#define TR_SHEEN ${f(look.sheen)}`]
}

/**
 * Which litter a ground material gets (render/litter-glsl.ts SITE): the carriageway (its layer, or the plain road surface) its gutters, the pavements and squares a
 * pavement's, the park trails a trail's, the bare ground and grass outside any polygon a verge's. Sand, water, decks: none.
 */
export function litterSite(surface: string, variant: string): number {
  if (variant === 'layer:carriage' || (!variant && MARKED.has(surface))) return SITE.gutter
  if (variant === 'layer:corridor' || variant.startsWith('layer:square-')) return SITE.pavement
  if (variant === 'layer:trail') return SITE.trail
  if (!variant && (surface === 'grass' || surface === 'dirt' || surface === 'gravel')) return SITE.verge
  return SITE.none
}

export function roadMaterial(scene: Scene, surface: string, assetBase: string,
                             variant = ''): ShaderMaterial {
  const name = `road:${surface}${variant ? `:${variant}` : ''}`
  const existing = scene.materials.find((m) => m.name === name)
  if (existing) return existing as ShaderMaterial

  if (!registered) {
    Effect.ShadersStore['roadVertexShader'] = VERTEX
    Effect.ShadersStore['roadFragmentShader'] = FRAGMENT
    registered = true
  }

  // (a park trail of a page with a look, road detail on: render/city.ts gives its strips their half-width)
  const look = variant === 'layer:trail' && ROAD_DETAIL > 0 ? TRAIL_LOOK[surface] : undefined
  const mat = new ShaderMaterial(name, scene, 'road', {
    attributes: ['position', 'normal', 'uv', 'color'],
    uniforms: ['world', 'worldViewProjection', 'sunDir', 'sunColour', 'skyColour', 'groundColour',
      'fogColour', 'fogDensity', 'pageMetres', 'marked', 'night', 'wetness', 'zenith', 'horizon', 'eye', 'cliff', 'lanes', ...LITTER_UNIFORMS],
    samplers: ['surfaceTex'],
    defines: [`#define ROAD_DETAIL ${ROAD_DETAIL}`, `#define GRASS_DETAIL ${getGrassDetail()}`,
      `#define GRASS_GROUND ${surface === 'grass' && !variant && getGrassDetail() > 0 ? 1 : 0}`, ...trailDefines(look),
      ...litterDefines(litterSite(surface, variant))],
  })
  bindLitter(mat, scene)
  // (only the base ground's own material: a road, a deck's sides and the painted layers are never cliffs)
  mat.setFloat('cliff', CLIFF_SURFACES.has(surface) && !variant ? 1 : 0)
  /*
   * A SINGLE PIXEL OF THE PAGE'S OWN AVERAGE COLOUR, until the page itself arrives.
   *
   * Owner, 2026-10-21: *"the road texture only loads when the user is on top of the road, leading to a
   * disconcerting shift... If we lower the asphalt color to be about the same as the texture, the texture
   * loading will be much less noticeable."* An unloaded sampler reads as white, so the road was laid pale
   * and went dark the moment the page landed — the whole street changing tone under the rider. Starting it
   * at the average of the page it is waiting for means only the GRAIN appears when the texture arrives,
   * which nobody notices, instead of the brightness changing, which everybody does.
   *
   * The averages are the real ones, measured off the files in public/roads (a 64x64 box resample of each).
   * Keep them in step if a page is redrawn; being a little wrong is still far better than white.
   *
   * Swapped on a render observer rather than `onLoadObservable`, because a texture whose image is already
   * in the browser's cache never fires that observable and the road would keep its flat pixel for ever.
   */
  const tex = new Texture(`${assetBase}${surface}.png`, scene, false, false)
  tex.wrapU = Texture.WRAP_ADDRESSMODE
  tex.wrapV = Texture.WRAP_ADDRESSMODE
  const thumb = PAGE_THUMB[surface]
  if (!thumb) mat.setTexture('surfaceTex', tex)
  else {
    const small = new Texture(`data:image/png;base64,${thumb}`, scene, false, false)
    small.wrapU = Texture.WRAP_ADDRESSMODE
    small.wrapV = Texture.WRAP_ADDRESSMODE
    mat.setTexture('surfaceTex', small)
    const swap = scene.onBeforeRenderObservable.add(() => {
      if (!tex.isReady()) return
      mat.setTexture('surfaceTex', tex)
      scene.onBeforeRenderObservable.remove(swap)
      small.dispose()
    })
  }
  mat.setFloat('pageMetres', ROAD_PAGE_METRES)
  // (never on a trail: no paint, no gutter, no mirror)
  mat.setFloat('marked', MARKED.has(surface) && !look ? 1 : 0)
  // (the carriageway layer only: the corridor's concrete is 'marked' too, and lanes on a pavement would be nonsense)
  mat.setFloat('lanes', variant === 'layer:carriage' || (!variant && MARKED.has(surface)) ? 1 : 0)
  applyRoadLook(mat, DAYLIGHT)
  // The ground is flat and only ever seen from above, and the polygons that make it come from a clipper
  // whose ring winding is not something worth depending on. Culling buys nothing here and costs an entire
  // invisible road network when the winding goes the other way.
  mat.backFaceCulling = false
  // explicit, so a layer that overrides it to ALWAYS cannot leak into anything drawn afterwards
  mat.depthFunction = Constants.LEQUAL
  return mat
}

/**
 * A ground layer that PAINTS rather than depth-tests within itself.
 *
 * The corridor and the carriageway are each made of overlapping quads — every street laps over its
 * neighbours at a bend and at a junction — and coplanar overlap z-fights horribly. Each layer lives in its
 * own rendering group, Babylon clears depth between groups, and nothing else shares the group, so the depth
 * test inside a layer buys nothing and costs a shimmering road. `ALWAYS` makes the last quad drawn win,
 * which is what a painter would do and what the layering already assumes.
 */
export function groundLayerMaterial(scene: Scene, assetBase: string, surface: string,
                                    name: string): ShaderMaterial {
  const mat = roadMaterial(scene, surface, assetBase, `layer:${name}`)
  /*
   * LEQUAL, not ALWAYS — with no depth write, overlapping quads in the layer still resolve by the order they
   * are drawn (nothing in the layer writes depth to test against), but the terrain occluder drawn first in
   * the group now hides the parts of the layer behind a hill. Under ALWAYS the roads beyond a crest showed
   * through it.
   */
  mat.depthFunction = Constants.LEQUAL
  // and writes none: a painted layer hides nothing by depth, and the pavement round a bridge lapping over
  // the river hid the river once the water began to depth-test
  mat.disableDepthWrite = true
  return mat
}

export function applyRoadLook(mat: ShaderMaterial, look: SkyLook): void {
  mat.setVector3('sunDir', look.sun)
  mat.setColor3('sunColour', look.sunColour)
  mat.setColor3('skyColour', look.skyColour)
  mat.setColor3('groundColour', look.groundColour)
  mat.setColor3('fogColour', look.fogColour)
  mat.setFloat('fogDensity', look.fogDensity)
  mat.setFloat('night', NIGHT)
  mat.setFloat('wetness', WETNESS)
  mat.setColor3('zenith', look.zenith)
  mat.setColor3('horizon', look.horizon)
  // far overhead until the first frame supplies the real eye, so nothing is discarded before then
  mat.setVector3('eye', new Vector3(0, 1e5, 0))
}

