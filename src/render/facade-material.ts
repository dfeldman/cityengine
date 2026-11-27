/**
 * The material every building is drawn with, and the reason the facade generator works at all.
 *
 * Two pages are bound at once because they are sampled differently and cannot share a texture:
 *
 *   `wall`   a seamless material page for this style, sampled with REPEATING uvs in metres, so a twelve-metre
 *            wall gets five courses of brick rather than one brick stretched twelve metres.
 *   `atlas`  the painted elements, sampled with CLAMPED uvs inside one cell, so a window stays in its cell.
 *
 * A per-vertex `kind` attribute picks between them, which keeps a whole style down to one draw call.
 *
 * Then the tint. Both pages store **alpha as a mask, not as transparency**:
 *
 *     colour = albedo.rgb * mix(vec3(1.0), tint, albedo.a)
 *
 * The brick page is painted pale, so `tint` makes it red on one street and yellow-buff on the next; the
 * mortar is painted with a low mask and stays pale in both; glass is painted with a zero mask and keeps the
 * colour it was given, because a red building does not have red windows. That one line is what lets seven
 * styles and four palettes each cover a city without a single repeated-looking building.
 *
 * Lighting is deliberately simple — a sun term and a sky/ground hemisphere — because the facades carry their
 * own painted shading (the reveal shadow in every opening is doing the work a real light could not do at this
 * cost), and because the platform runs on whatever GPU the rider's machine has.
 */
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Vector3, Vector4 } from '@babylonjs/core/Maths/math.vector'
import { Constants } from '@babylonjs/core/Engines/constants'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import type { Scene } from '@babylonjs/core/scene'
import { wallPageOf } from '../city/facade.ts'
import { GRASS_GLSL, GRASS_CODE_BASE, GRASS_CODE_STEP, getGrassDetail } from './grass-glsl.ts'
import { LITTER_GLSL, LITTER_UNIFORMS, SITE, bindLitter, litterDefines, litterSamplers } from './litter-glsl.ts'

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec4 color;      // rgb = the building's palette tint, a = which page to sample
attribute vec2 uv2;        // weathering: the building's foot height (mesh frame) and its seed, 0 seed = none (buildings.ts)
uniform mat4 worldViewProjection;
uniform mat4 world;
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vTint;
varying float vKind;
varying float vDepth;
varying vec3 vWorld;
varying vec2 vFoot;        // height above the building's foot, its seed


void main(void) {
  vec4 wp = world * vec4(position, 1.0);
  vFoot = vec2(position.y - uv2.x, uv2.y);
  gl_Position = worldViewProjection * vec4(position, 1.0);
  vUV = uv;
  vNormal = normalize(mat3(world) * normal);
  vTint = color.rgb;
  vKind = color.a;
  vWorld = wp.xyz;
  vDepth = gl_Position.w;
}
`

const FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vTint;
varying float vKind;
varying float vDepth;
varying vec3 vWorld;
uniform sampler2D wallTex;
uniform sampler2D atlasTex;
uniform vec3 sunDir;
uniform vec3 sunColour;
uniform vec3 skyColour;
uniform vec3 groundColour;
uniform vec3 fogColour;
uniform float fogDensity;
uniform vec3 eye;
uniform vec3 zenith;
uniform vec3 horizon;
uniform float night;
uniform float flatGround;  // 1 for the ground variant: parks and pavements, drawn without culling
uniform float weathering;  // 0..1, Menu → Settings → Graphics → Weathering
uniform float stoneKind;   // what the style's wall is, for FACADE_DETAIL: 0 other, 1 dressed stone, 2 render (STONE_PAGES)
uniform float pageCourses; // stone courses in one wall page, 0 = none painted
uniform vec4 glassMix;     // per style (GLASS_LOOKS): odds a pane has sheers, drapes drawn back, a blind, and how bright an empty room reads
uniform float glassCoat;   // per style: odds a building with no glass tint of its own gets coated (tinted, reflective) glass
varying vec2 vFoot;

/*
 * WEATHERING (owner, 2026-11-18: "better materials… building weathering"). A painted page tiles the same at the
 * pavement as under the cornice, and a whole wall comes out one even fill. Real walls are dirtiest where the street
 * splashes them, streaked where rain runs off, patchy where they were repaired, and no two buildings are quite the
 * same colour. Each a strength; all scaled by \`weathering\`.
 */
#define W_GRIME_H 1.15     // metres of street grime at a wall's foot (ragged: 0.75..1.25 of this)
#define W_GRIME_DARK 0.24  // how much darker at the very foot
#define W_GRIME_DESAT 0.35 // and how much greyer
#define W_STREAK 0.11      // run-off streaks down the wall
#define W_PATCH 0.07       // low-frequency patchiness (repairs, damp, sun-bleaching)
#define W_TONE 0.075       // each building's own brightness, ±
#define W_WARM 0.035       // and its own warmth, ±
#define W_BOUNCE 0.20      // sunlight the street throws back up on the lowest storeys
#define W_BOUNCE_H 4.0     // metres it fades over

float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), f.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), f.x), f.y);
}

/*
 * STONE DETAIL (owner, 2026-11-26: the Haussmann fronts are good but "a little bit too perfect"). Every block of a
 * painted page is the same stone, and every front the same clean cream. Real Paris limestone is bedded (long soft
 * blotches, warmer and cooler), each course came from a different block, an uncleaned front carries a grey-black
 * crust, and the joints are recessed so the sun picks out each course. Menu → Settings → Graphics → Detailed facades:
 * FACADE_DETAIL 1 is arithmetic only (phones, on Auto), 2 adds the crust, render grain and a relief probe (2 fetches).
 */
#ifndef FACADE_DETAIL
#define FACADE_DETAIL 0
#endif
#ifndef GRASS_DETAIL
#define GRASS_DETAIL 0
#endif
#ifndef GRASS_AREAS
#define GRASS_AREAS 0
#endif
#if GRASS_AREAS > 0
${GRASS_GLSL}
#endif
${LITTER_GLSL}
#define F_MOTTLE 0.065     // bedding in the stone, ± brightness (half this on styles that are neither stone nor render)
#define F_HUE 0.03         // and its warm/cool drift, ±
#define F_COURSE 0.045     // each painted course of the page its own stone, ±
#define F_BLOCK 0.03       // and block-sized variation along the course, ±
#define F_SOOT 0.14        // the black crust on an uncleaned front: this much darker
#define F_SOOT_DESAT 0.3   // and this much greyer
#define F_SOOT_COVER 0.62  // noise level the crust starts at (higher = less of it)
#define F_SOOT_ODDS 0.45   // the share of stone buildings never cleaned
#define F_GRAIN 0.05       // render's trowel grain, ±
#define F_RELIEF 1.3       // relief: shade per unit of luminance step up the wall
#define F_RELIEF_M 0.025   // metres up the wall the relief probe looks
#define F_RELIEF_MAX 0.2
#define F_NEAR 40.0        // the fine terms (courses, grain, relief) are gone by here, metres
float fHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float fNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(fHash(i), fHash(i + vec2(1.0, 0.0)), f.x), mix(fHash(i + vec2(0.0, 1.0)), fHash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// The sky, as a function of direction. There is no environment map — a city of this size cannot afford one
// per material and would not gain much — so the sky is the same two-colour gradient the ambient term uses,
// which means a reflection always agrees with the light in the scene.
vec3 skyAt(vec3 dir) {
  float up = clamp(dir.y, -1.0, 1.0);
  vec3 above = mix(horizon, zenith, pow(max(up, 0.0), 0.55));
  // below the horizon a window reflects the street, not the sky, which is what stops ground-floor glass from
  // glowing brighter than the sky above it
  vec3 below = mix(horizon * 0.55, groundColour * 1.4, pow(max(-up, 0.0), 0.6));
  return up > 0.0 ? above : below;
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

// glass tint strength (Dress.glassTint): the interior's gain, and how far the reflection leans to the tint
#define GLASS_BODY 2.2
#define GLASS_SKY_GAIN 1.8
#define GLASS_SKY_MIX 0.55
// a PALE tint (luminance from LO to 0.9) also lifts the room's gain by up to GLASS_PALE_GAIN: silver and pale-blue glass (La Defense)
// would otherwise read as dark as the painted pane. Dark tints (lum < LO) are untouched.
#define GLASS_PALE_GAIN 0.32
#define GLASS_PALE_LO 0.55

/*
 * WINDOW DRESSING and COATED GLASS (FACADE_DETAIL > 0; owner, 2026-11-26: "everything is a dark glass").
 *
 * A pane is only dark when the room behind it is. Paris's French windows mostly hang white voile behind clear
 * glass, so a Haussmann front reads as pale panes in white frames; SF sash windows have blinds and lace; offices
 * have blinds pulled to all heights. That is a BACKING behind the glass, lit by the daylight coming in through it,
 * not a tint — a tint multiplies, and white multiplies to nothing. Each pane picks one by its own random (winR).
 *
 * Towers with no glass tint of their own pick a COATING by building seed, from the glass the trade actually sells:
 * metal oxides in the melt give green (iron), grey (cobalt) and bronze (selenium); a reflective coating gives
 * silver or blue mirror; contemporary low-e is near-clear with a faint blue-green cast. Coated glass also reflects
 * more square-on (G_F0_*), which is why a tower reads as its colour and the sky even head-on.
 */
#define G_SHEER vec3(0.93, 0.91, 0.86)  // voile: a warm white
#define G_SHEER_COVER 0.8   // how much of the room a sheer hides
#define G_SUN_IN 0.55       // how much of the sun on the facade reaches a curtain behind the glass
#define G_BEHIND 0.8        // the daylight behind the glass, against the wall's
#define G_DRAPE_W 0.22      // a drawn-back curtain's width, of the pane (0.6..1.4 of this)
#define G_BLIND vec3(0.86, 0.84, 0.79)
#define G_FOLDS 7.0         // folds across a sheer (FACADE_DETAIL 2), and how deep
#define G_FOLD_AMP 0.1
#define G_SHOP_H 2.6        // no dressing on a pane whose centre is below this, metres: shop windows
#define G_F0 0.05           // reflectance square-on: clear glass, tinted, blue reflective, silver mirror
#define G_F0_COAT 0.14
#define G_F0_BLUE 0.24
#define G_F0_MIRROR 0.38
#define G_ATLAS vec2(8.0, 21.0)  // atlas cells across and down (tools/facadegen/paint.py COLS, ROWS)
#define G_ART 0.9375        // a cell's painted part, ART / CELL (240 / 256)

vec3 coatColour(float k) {
  return k < 1.0 ? vec3(0.40, 0.62, 0.62)   // blue-green low-e, the commonest tower glass since the 1990s
       : k < 2.0 ? vec3(0.38, 0.52, 0.70)   // blue reflective
       : k < 3.0 ? vec3(0.60, 0.48, 0.36)   // bronze
       : k < 4.0 ? vec3(0.46, 0.48, 0.52)   // grey
       : k < 5.0 ? vec3(0.80, 0.84, 0.88)   // silver mirror
       : vec3(0.72, 0.82, 0.80);            // contemporary near-clear
}

void main(void) {
  // The ground variant is drawn with culling off, so it must refuse its own underside, or a lawn standing
  // above the eye becomes a green ceiling.
  if (flatGround > 0.5 && underside(vWorld, eye)) discard;
  // vKind: 0 = the seamless wall page (uv in metres, wrapped), 1 = the element atlas (uv already a cell)
  vec4 w = texture2D(wallTex, vUV);
  vec4 a = texture2D(atlasTex, vUV);
  // the kind is the alpha's integer part; its fraction carries a glass tint (buildings.ts glassCode, GLASS_SCALE 8192)
  float kindInt = floor(vKind + 0.0001);
  float gcode = floor((vKind - kindInt) * 8192.0 + 0.5) - 1.0;
  vec3 glassTint = gcode < 0.0 ? vec3(1.0)
    : vec3(floor(gcode / 256.0), mod(floor(gcode / 16.0), 16.0), mod(gcode, 16.0)) / 15.0;
  vec4 albedo = mix(w, a, step(0.5, kindInt));
#if GRASS_AREAS > 0
  // a grass polygon's type (render/grass-glsl.ts): 1 manicured .. 4 meadow, in the alpha's fraction above the glass codes. All derivatives
  // and fetches here, in uniform flow
  float gT = floor((vKind - kindInt - ${GRASS_CODE_BASE.toFixed(4)}) / ${GRASS_CODE_STEP.toFixed(4)} + 0.5);
  gT = (vKind - kindInt > ${(GRASS_CODE_BASE + GRASS_CODE_STEP * 0.5).toFixed(4)} && gT > 0.5 && gT < 4.5) ? gT : 0.0;
  float gFw = length(fwidth(vWorld.xz));
  float gGrain = dot(w.rgb - texture2D(wallTex, vec2(0.5), 14.0).rgb, vec3(0.333)) * 0.5;
  float gSheen = 0.0;
#endif
#if LITTER > 0
  // (render/litter-glsl.ts: its pixel size here, in uniform flow)
  float ltFw = length(fwidth(vWorld.xz));
  float ltGloss = 0.0;
#endif
#if FACADE_DETAIL > 1
  // the relief probe, a few centimetres up the wall: v's rate of change with height, by least squares over the
  // pixel's screen derivatives, works for the page (uv in metres) and an atlas cell alike. Out here in uniform
  // flow, because derivatives and implicit-lod fetches are undefined inside a branch.
  float hx = dFdx(vFoot.x), hy = dFdy(vFoot.x);
  float dvdh = (dFdx(vUV.y) * hx + dFdy(vUV.y) * hy) / (hx * hx + hy * hy + 1e-8);
  vec2 ruv = vUV + vec2(0.0, clamp(dvdh * F_RELIEF_M, -0.01, 0.01));
  vec4 above = mix(texture2D(wallTex, ruv), texture2D(atlasTex, ruv), step(0.5, kindInt));
#endif
#if FACADE_DETAIL > 0
  // The window this pixel is in, for its dressing: where in the pane (wf, 0..1), and one random per window. An
  // atlas window is one cell, so its centre in the world is this point less the uv's offset from the cell centre,
  // carried back through the screen-space Jacobian; a page tile (kind 0: the far pages are a bay by a storey) is
  // its own window. Out here because derivatives are undefined inside a branch.
  vec2 gcell = vUV * G_ATLAS;
  vec2 wf = kindInt > 0.5 ? clamp((fract(gcell) - 0.5) / G_ART + 0.5, 0.0, 1.0) : fract(vUV);
  vec3 wpx = dFdx(vWorld), wpy = dFdy(vWorld);
  vec2 wux = dFdx(vUV), wuy = dFdy(vUV);
  float wdet = wux.x * wuy.y - wux.y * wuy.x;
  vec2 duv = kindInt > 0.5 ? vUV - (floor(gcell) + 0.5) / G_ATLAS : vec2(0.0);
  vec3 wc = abs(wdet) > 1e-14
    ? vWorld - ((wpx * wuy.y - wpy * wux.y) * duv.x + (wpy * wux.x - wpx * wuy.x) * duv.y) / wdet : vWorld;
  float winR = kindInt > 0.5 ? fHash(floor(wc.xz * 2.0) + floor(wc.y * 2.0) * vec2(17.0, 31.0))
                             : fHash(floor(vUV) + vFoot.y * 97.0);
#endif
  // 2 = a wrought-iron RAIL (BUGS.md #23): uv.x metres along it, uv.y 0 at its foot to 1 at its top. The
  // openwork is cut here, not modelled: a top and bottom rail, bars every 11 cm, and a band of rings at
  // mid-height, each antialiased by its own screen size — a bar thinner than a pixel coverage-fades and is
  // dropped, so a far balcony reads as its two rails and the wall behind, never as a black band.
  if (kindInt > 1.5) {
    float fu = max(fwidth(vUV.x), 1e-4);
    float fv = max(fwidth(vUV.y), 1e-4);
    float rails = max(1.0 - smoothstep(0.07 - fv, 0.07 + fv, vUV.y), smoothstep(0.9 - fv, 0.9 + fv, vUV.y));
    float bu = abs(fract(vUV.x / 0.11) - 0.5) * 0.11;
    // bars and rings are kept at least about a pixel wide, so the pattern still reads across the street
    float bw = max(0.011, 0.5 * fu);
    float bars = (1.0 - smoothstep(bw - fu, bw + fu, bu)) * step(0.62, vUV.y);
    vec2 c = vec2((fract(vUV.x / 0.44) - 0.5) * 0.44, (vUV.y - 0.36) * 0.85);
    float ring = abs(length(c) - 0.15);
    float rings = (1.0 - smoothstep(bw - fu, bw + fu, ring)) * step(0.07, vUV.y) * step(vUV.y, 0.62);
    float posts = (1.0 - smoothstep(bw - fu, bw + fu, abs(c.x))) * step(vUV.y, 0.62);
    // a bar narrower than about a pixel drops out entirely: seen edge-on, fwidth grows and the smoothstep
    // would otherwise count half the rail as iron — a black band down every side wall
    float fine = 1.0 - smoothstep(0.035, 0.06, fu);
    float cover = max(rails, max(max(bars, rings), posts) * fine);
    if (cover < 0.5) discard;
    albedo = vec4(1.0, 1.0, 1.0, 1.0);
  }

  vec3 n = normalize(vNormal);
  vec3 view = normalize(vWorld - eye);
  vec3 lit;

  // A reserved alpha band marks GLASS. Everything else uses alpha as a tint mask.
  float isGlass = step(0.004, albedo.a) * step(albedo.a, 0.035);

  if (isGlass > 0.5) {
    // Schlick fresnel: glass seen square on is a window, glass seen at a grazing angle is a mirror. This one
    // term is most of why real glass reads as glass — a flat gradient never does, however well painted.
    float cosine = clamp(dot(-view, n), 0.0, 1.0);
    float f0 = gcode < 0.0 ? G_F0 : G_F0_COAT;
#if FACADE_DETAIL > 0
    // a tower with no tint of its own: one coating for the whole building
    if (gcode < 0.0 && vFoot.y > 0.0 && fract(vFoot.y * 5.77) < glassCoat) {
      float k = floor(fract(vFoot.y * 11.31) * 6.0);
      glassTint = coatColour(k);
      gcode = 0.0;
      f0 = k > 3.5 && k < 4.5 ? G_F0_MIRROR : k > 0.5 && k < 1.5 ? G_F0_BLUE : G_F0_COAT;
    }
#endif
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosine, 5.0);

    vec3 reflected = reflect(view, n);
    vec3 sky = skyAt(reflected);

    // the sun, caught in the pane
    float spec = pow(max(dot(reflected, -normalize(sunDir)), 0.0), 220.0);

    // the painted pixel becomes the room behind the glass: darkened, and tinted slightly by the sky so an
    // unlit interior is cold rather than black
    vec3 interior = albedo.rgb * 0.34 + skyColour * 0.06;
    // a tinted pane: the room behind it takes the tint (scaled up, a #3d5c70 is a dark colour) and the reflection some
    float glassLum = dot(glassTint, vec3(0.299, 0.587, 0.114));
    interior = gcode < 0.0 ? interior : interior * glassTint * GLASS_BODY * (1.0 + GLASS_PALE_GAIN * smoothstep(GLASS_PALE_LO, 0.9, glassLum));
    sky = gcode < 0.0 ? sky : sky * mix(vec3(1.0), glassTint * GLASS_SKY_GAIN, GLASS_SKY_MIX);
#if FACADE_DETAIL > 0
    {
      // what hangs behind the pane, lit by the daylight on this face of the building
      float r1 = fract(winR * 7.13), r2 = fract(winR * 13.7), r3 = fract(winR * 31.1);
      vec3 behind = (mix(groundColour, skyColour, 0.6) + sunColour * max(dot(n, -normalize(sunDir)), 0.0) * G_SUN_IN) * G_BEHIND;
      behind *= gcode < 0.0 ? vec3(1.0) : glassTint * 1.4;
      vec3 dress = G_SHEER * (0.94 + 0.12 * r2);
      float cover = 0.0;
      if (r1 < glassMix.x) {
        cover = G_SHEER_COVER;
#if FACADE_DETAIL > 1
        float fw = fwidth(wf.x) * G_FOLDS;
        cover *= 1.0 - G_FOLD_AMP * (0.5 + 0.5 * sin((wf.x + r3) * G_FOLDS * 6.2832)) * (1.0 - smoothstep(0.25, 0.7, fw));
#endif
      } else if (r1 < glassMix.x + glassMix.y) {
        float dw = G_DRAPE_W * (0.6 + 0.8 * r3);
        cover = 1.0 - smoothstep(dw - 0.03, dw + 0.03, min(wf.x, 1.0 - wf.x));
        dress = r2 < 0.5 ? vec3(0.86, 0.80, 0.70) : r2 < 0.7 ? vec3(0.62, 0.55, 0.48)
              : r2 < 0.85 ? vec3(0.55, 0.22, 0.20) : vec3(0.42, 0.48, 0.56);
        dress *= 0.85;
      } else if (r1 < glassMix.x + glassMix.y + glassMix.z) {
        // a blind down from the head; the atlas cell's v runs down the window, a page tile's up it
        float down = kindInt > 0.5 ? wf.y : 1.0 - wf.y;
        cover = step(down, 0.2 + 0.6 * r3);
        dress = G_BLIND * (0.88 + 0.14 * r2);
      }
      cover *= step(G_SHOP_H, vFoot.x + wc.y - vWorld.y);
      interior = mix(interior * (1.0 + glassMix.w), dress * behind, cover);
    }
#endif

    lit = mix(interior, sky, clamp(fresnel * 1.35, 0.0, 0.94)) + sunColour * spec * 1.6;

    /*
     * After dark, some of the windows are on.
     *
     * A city at night is not a dark city, it is a black city with thousands of lit windows in it, and that
     * is the entire difference between the picture at midnight and the picture at noon. Which windows are
     * lit comes from the cell the pixel is in, so a window is lit or not as a whole and stays that way —
     * flickering per pixel would look like static.
     */
    if (night > 0.01) {
      /*
       * One random per WINDOW, keyed to where the window is in the world rather than to the texel.
       *
       * Hashing the texture coordinate gave a different answer for every pixel of every pane, so each
       * window came out as a mosaic of lit and unlit speckle — static, not a city. Quantising the world
       * position to roughly a bay and a storey gives one answer per window that holds still, and gives
       * neighbouring windows different answers, which is what a lit building looks like.
       */
      vec3 cell = floor(vec3(vWorld.x, vWorld.y, vWorld.z) / vec3(2.7, 3.1, 2.7));
      float r = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
      float on = step(0.58, r) * night;
      vec3 warm = vec3(1.0, 0.85, 0.60) * (0.5 + 0.5 * fract(r * 7.3));
      lit = mix(lit, warm, on * 0.9);
    }
  } else {
    // The tint mask: alpha says how much of the building's palette colour multiplies this pixel.
    //
    // Scaled down, because the pages are painted NEAR WHITE on purpose — that is what makes one brick page
    // serve every palette — and a near-white page lit by a strong sun lands on 1.0 and stays there. The
    // whole city came out high-key and flat: pale stone, pale render, pale concrete, no material reading as
    // darker than any other. This is the exposure the painted pages are actually meant to be seen at.
    vec3 base = albedo.rgb * mix(vec3(1.0), vTint, albedo.a) * 0.80;
#if GRASS_AREAS > 0
    if (gT > 0.5) base = grassSurface(gT, vWorld, vDepth, view, sunDir, gFw, gGrain, gSheen);
#endif
    float wk = weathering * step(0.0005, vFoot.y) * (1.0 - flatGround);
    float h = vFoot.x;
    float onWall = (1.0 - smoothstep(0.35, 0.7, abs(n.y))) * wk;
    if (wk > 0.0) {
      float seed = vFoot.y;
      vec2 tng = normalize(vec2(-n.z, n.x) + vec2(1e-5, 0.0));
      float along = dot(vWorld.xz, tng);   // metres along the wall
      // the building's own tone and warmth
      float warm = (fract(seed * 7.31) - 0.5) * 2.0 * W_WARM;
      base *= (1.0 + W_TONE * (seed * 2.0 - 1.0) * wk) * (1.0 + vec3(warm, 0.0, -warm) * wk);
      // patches, at two scales
      float blot = wNoise(vec2(along, h) / 3.5 + seed * 17.0) * 0.65 + wNoise(vec2(along, h) / 0.9 + seed * 5.0) * 0.35;
      base *= 1.0 - W_PATCH * (blot - 0.5) * 2.0 * onWall;
      // run-off: thin streaks of varying width, each fading in and out down the wall
      float streak = pow(wNoise(vec2(along * 1.6, seed * 31.0)), 4.0) * (0.55 + 0.45 * wNoise(vec2(along * 1.6, h / 5.0 + seed * 3.0)));
      base *= 1.0 - W_STREAK * streak * onWall * step(0.3, h);
      // street grime at the foot, with a ragged top
      float edge = W_GRIME_H * (0.75 + 0.5 * wNoise(vec2(along * 1.3, seed * 9.0)));
      float grime = (1.0 - smoothstep(0.0, edge, h)) * step(-0.5, h) * onWall;
      vec3 grey = mix(base, vec3(dot(base, vec3(0.333))), W_GRIME_DESAT) * vec3(0.99, 0.96, 0.91);
      base = mix(base, grey * (1.0 - W_GRIME_DARK), grime);
    }
#if FACADE_DETAIL > 0
    // (walls of buildings only — not roofs, the ground variant, rails or anything without a foot)
    float fd = step(0.0005, vFoot.y) * (1.0 - flatGround) * (1.0 - smoothstep(0.35, 0.7, abs(n.y))) * step(kindInt, 1.5);
    if (fd > 0.0) {
      float seed = vFoot.y;
      vec2 tg = normalize(vec2(-n.z, n.x) + vec2(1e-5, 0.0));
      vec2 q = vec2(dot(vWorld.xz, tg), h);   // metres along the wall, and up it
      float kStone = step(0.5, stoneKind) * step(stoneKind, 1.5);
      float kRender = step(1.5, stoneKind);
      float near = 1.0 - smoothstep(F_NEAR * 0.5, F_NEAR, vDepth);
      float amt = mix(0.5, 1.0, kStone + kRender);
      // bedding: long low blotches, lighter and darker, warmer and cooler
      float bed = fNoise(q / vec2(2.6, 0.8) + seed * 19.0) * 0.6 + fNoise(q / vec2(0.9, 0.35) + seed * 7.0) * 0.4 - 0.5;
      base *= 1.0 + 2.0 * F_MOTTLE * bed * amt;
      base *= 1.0 + vec3(1.0, 0.2, -1.0) * (2.0 * F_HUE * (fNoise(q / 4.3 + seed * 3.0) - 0.5) * amt);
      // the page's own painted courses, each a slightly different stone (a joint every 1/pageCourses of the page)
      if (kindInt < 0.5 && pageCourses > 0.0) {
        float row = floor(fract(vUV.y) * pageCourses) + floor(vUV.y) * 17.0;
        float t = (fHash(vec2(row, seed * 101.0)) - 0.5) * 2.0 * F_COURSE + (fNoise(vec2(q.x / 1.1, row * 3.1)) - 0.5) * 2.0 * F_BLOCK;
        base *= 1.0 + t * kStone * near;
      }
#if FACADE_DETAIL > 1
      // the black crust of a front never cleaned: broad grey drifts, on some buildings and not others
      float crust = smoothstep(F_SOOT_COVER, F_SOOT_COVER + 0.2, fNoise(q / vec2(3.0, 5.0) + seed * 41.0))
        * (0.35 + 0.65 * fNoise(vec2(q.x / 0.7, q.y / 6.0) + seed * 23.0))   // run down the wall in streaks
        * kStone * step(1.0 - F_SOOT_ODDS, fract(seed * 13.7));
      base = mix(base, mix(base, vec3(dot(base, vec3(0.333))), F_SOOT_DESAT) * (1.0 - F_SOOT), crust);
      base *= 1.0 + (fNoise(q / 0.12 + seed * 5.0) - 0.5) * 2.0 * F_GRAIN * kRender * near;
      // relief: luminance as height, lit from above — a joint under a block is in its shade, a block's top edge catches the light
      float rel = (dot(above.rgb, vec3(0.3, 0.59, 0.11)) - dot(albedo.rgb, vec3(0.3, 0.59, 0.11))) * F_RELIEF;
      base *= 1.0 - clamp(rel, -F_RELIEF_MAX, F_RELIEF_MAX) * near * (1.0 - isGlass);
#endif
    }
#endif
#if LITTER > 0
    /*
     * LITTER (render/litter-glsl.ts): a pavement's on the walks; on the areas mesh by the grass type (none: a paved square's),
     * graffiti on the lowest few metres of a building's walls
     */
#if LITTER_SITE != 0
    {
      float ltSite = ${SITE.pavement}.0;
#if LITTER_SITE > 0
      ltSite = float(LITTER_SITE);
#elif GRASS_AREAS > 0
      ltSite = gT > 3.5 ? ${SITE.meadow}.0 : gT > 2.5 ? ${SITE.verge}.0 : gT > 1.5 ? ${SITE.lawn}.0 : gT > 0.5 ? ${SITE.manicured}.0 : ${SITE.pavement}.0;
#endif
      ltGloss = litterGround(vWorld.xz, vDepth, ltSite, 0.0, ltFw, 0.0, base);
    }
#endif
#if LITTER_WALLS > 0
    if (vFoot.y > 0.0005 && abs(n.y) < 0.35 && isGlass < 0.5 && kindInt < 1.5) {
      vec2 ltT = normalize(vec2(-n.z, n.x) + vec2(1e-5, 0.0));
      base = litterWall(vWorld.xz, vec2(dot(vWorld.xz, ltT), vFoot.x), vFoot.y, step(0.5, stoneKind) * step(stoneKind, 1.5), vDepth, base);
    }
#endif
#endif
    float sun = max(dot(n, -normalize(sunDir)), 0.0);
    // a hemisphere term so north-facing walls are sky-lit rather than black
    float up = n.y * 0.5 + 0.5;
    lit = base * (mix(groundColour, skyColour, up) + sunColour * sun);
#if LITTER > 0
    if (ltGloss > 0.0) lit += sunColour * pow(max(dot(n, normalize(-normalize(sunDir) - view)), 0.0), 40.0) * ltGloss * 0.7;
#endif
    // the sunlit street lights the bottom of the walls from below
    if (wk > 0.0) lit += base * sunColour * groundColour * W_BOUNCE * exp(-max(h, 0.0) / W_BOUNCE_H) * onWall;
    // the glow a lit street throws back onto the walls above it
    if (night > 0.01) lit += base * vec3(0.16, 0.13, 0.09) * night;
#if GRASS_AREAS > 0
    lit += base * sunColour * gSheen;
#endif
  }

  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(lit, fogColour, clamp(fog, 0.0, 1.0)), 1.0);
}
`

let registered = false

/** How a vertex says which page it wants; written into the alpha of the colour attribute. */
export const KIND_WALL = 0
export const KIND_ATLAS = 1
/** a wrought-iron rail, its openwork cut in the shader: uv.x in metres along, uv.y 0→1 up */
export const KIND_RAIL = 2

export interface SkyLook {
  sun: Vector3
  sunColour: Color3
  skyColour: Color3
  groundColour: Color3
  fogColour: Color3
  fogDensity: number
  /** what a window reflects looking up, and at the horizon */
  zenith: Color3
  horizon: Color3
}

/**
 * A brighter sun and a darker sky, which is what gives a street its shape.
 *
 * The first values had a strong ambient and a modest sun, so every surface came out at roughly the same
 * brightness whichever way it faced — a city with no light direction in it, which reads as washed out and
 * flat however good the textures are. A sun that clearly beats the ambient puts one side of every street in
 * light and the other in shade, and that contrast is most of what makes a photograph of a city look like
 * one.
 */
/**
 * The four times of day, and why they are a LAUNCH setting rather than a clock.
 *
 * Every static shadow in the city is baked into its tile as geometry, which is what makes shadows
 * affordable without teaching a dozen hand-written shaders to sample a shadow map. The price of that is
 * that the sun cannot move during a ride: moving it would mean rebuilding every tile. Choosing the hour at
 * the start costs nothing, changes the whole look of the city, and is honest about the limitation instead
 * of pretending to a day/night cycle that the renderer cannot actually do.
 *
 * Night is the one that earns its place. A city at night is not a dark city — it is a black city with
 * thousands of lit windows in it, and that is a completely different picture from the same streets at noon.
 */
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

const LOOKS: Record<TimeOfDay, SkyLook & { night: number }> = {
  dawn: {
    sun: new Vector3(-0.80, -0.30, 0.52),
    sunColour: new Color3(1.32, 0.88, 0.62),
    skyColour: new Color3(0.40, 0.40, 0.52),
    groundColour: new Color3(0.20, 0.18, 0.19),
    fogColour: new Color3(0.82, 0.72, 0.68),
    fogDensity: 0.0026,
    zenith: new Color3(0.34, 0.44, 0.74),
    horizon: new Color3(0.95, 0.76, 0.62),
    night: 0.25,
  },
  day: {
    sun: new Vector3(-0.42, -0.72, 0.55),
    sunColour: new Color3(1.16, 1.05, 0.87),
    skyColour: new Color3(0.42, 0.47, 0.58),
    groundColour: new Color3(0.22, 0.21, 0.19),
    fogColour: new Color3(0.72, 0.76, 0.82),
    fogDensity: 0.0012,
    zenith: new Color3(0.40, 0.55, 0.82),
    horizon: new Color3(0.80, 0.85, 0.92),
    night: 0,
  },
  dusk: {
    sun: new Vector3(0.84, -0.22, -0.48),
    sunColour: new Color3(1.40, 0.74, 0.44),
    skyColour: new Color3(0.36, 0.34, 0.46),
    groundColour: new Color3(0.17, 0.15, 0.17),
    fogColour: new Color3(0.72, 0.58, 0.58),
    fogDensity: 0.0030,
    zenith: new Color3(0.24, 0.30, 0.60),
    horizon: new Color3(0.96, 0.62, 0.42),
    night: 0.55,
  },
  night: {
    // the "sun" is the moon: weak, cold, and high enough to give the streets some shape
    sun: new Vector3(-0.35, -0.80, 0.48),
    sunColour: new Color3(0.20, 0.23, 0.34),
    skyColour: new Color3(0.10, 0.12, 0.19),
    groundColour: new Color3(0.05, 0.05, 0.07),
    fogColour: new Color3(0.10, 0.11, 0.17),
    fogDensity: 0.0042,
    zenith: new Color3(0.03, 0.04, 0.09),
    horizon: new Color3(0.13, 0.14, 0.22),
    night: 1,
  },
}

/** How lit the windows are: 0 by day, 1 at night. Read by the facade and cartoon shaders. */
export let NIGHT = 0

/**
 * Choose the hour. Must be called BEFORE anything is built, because the materials read these values when
 * they are created and the shadows are baked with this sun.
 */
export function setTimeOfDay(when: TimeOfDay): void {
  const l = LOOKS[when]
  DAYLIGHT.sun.copyFrom(l.sun)
  DAYLIGHT.sunColour.copyFrom(l.sunColour)
  DAYLIGHT.skyColour.copyFrom(l.skyColour)
  DAYLIGHT.groundColour.copyFrom(l.groundColour)
  DAYLIGHT.fogColour.copyFrom(l.fogColour)
  DAYLIGHT.zenith.copyFrom(l.zenith)
  DAYLIGHT.horizon.copyFrom(l.horizon)
  DAYLIGHT.fogDensity = l.fogDensity
  NIGHT = l.night
}

/**
 * Weather, layered ON TOP of the hour rather than multiplied into it.
 *
 * Four times of day and three weathers is twelve looks to hand-tune and keep consistent, which is a table
 * nobody maintains. A weather is instead a MODIFIER applied after `setTimeOfDay`: overcast does the same
 * thing to dusk that it does to noon, because what overcast physically is does not depend on the hour — the
 * sun stops being a point and becomes the whole sky. So direct light goes down hard, ambient goes up, every
 * colour loses its saturation, and the fog thickens.
 *
 * Rain is overcast plus water on the ground, and the water is the part that matters. A dry street is a
 * diffuse surface and lighting it well is a matter of texture; a wet one is a MIRROR, and suddenly the road
 * carries the sky, the lamps and the headlights in it. That is the single biggest change to how a street
 * looks that this renderer can make, which is why it is worth more than another facade style.
 *
 * Like the hour, this must be set BEFORE anything is built.
 */
export type Weather = 'clear' | 'overcast' | 'rain'

/** How wet the ground is: 0 dry, 1 standing water. Read by the road shader. */
export let WETNESS = 0
/** How flat the light is: 0 direct sun, 1 a sky-wide softbox. Read by the shadows. */
export let OVERCAST = 0

/** Pull a colour towards its own luminance, then scale it. */
function flatten(c: Color3, desaturate: number, gain: number): void {
  const l = c.r * 0.30 + c.g * 0.59 + c.b * 0.11
  c.r = (c.r + (l - c.r) * desaturate) * gain
  c.g = (c.g + (l - c.g) * desaturate) * gain
  c.b = (c.b + (l - c.b) * desaturate) * gain
}

export function setWeather(w: Weather): void {
  WETNESS = w === 'rain' ? 1 : 0
  OVERCAST = w === 'clear' ? 0 : 1
  if (w === 'clear') return
  const d = DAYLIGHT
  // the sun loses; the sky wins. Both halves matter — cutting the sun alone just makes a dark city.
  flatten(d.sunColour, 0.88, 0.30)
  flatten(d.skyColour, 0.72, 1.38)
  flatten(d.groundColour, 0.65, 1.18)
  flatten(d.fogColour, 0.78, 0.94)
  flatten(d.zenith, 0.70, 0.86)
  flatten(d.horizon, 0.78, 0.90)
  d.fogDensity *= w === 'rain' ? 3.2 : 2.1
}

export const DAYLIGHT: SkyLook = {
  sun: new Vector3(-0.42, -0.72, 0.55),
  // Warm sun, cool sky: the two together are what give stone its colour. A neutral sun and a grey ambient
  // average out to grey, which is what "washed out" actually looks like.
  /*
   * Warm sun, cool sky — the two together are what give stone its colour, where a neutral sun against a grey
   * ambient averages out to grey. But the ambient has to stay high enough to READ: cut too far, the shaded
   * side of a street goes almost black, and a city where one side of every road is unreadable is not
   * dramatic, it is broken. This is the balance: a sun that clearly wins, over an ambient you can still see
   * a facade in.
   */
  sunColour: new Color3(1.16, 1.05, 0.87),
  skyColour: new Color3(0.42, 0.47, 0.58),
  groundColour: new Color3(0.22, 0.21, 0.19),
  fogColour: new Color3(0.72, 0.76, 0.82),
  fogDensity: 0.0012,
  zenith: new Color3(0.40, 0.55, 0.82),
  horizon: new Color3(0.80, 0.85, 0.92),
}

/**
 * Detailed facades (the shader's F_ constants): 0 off, 1 arithmetic only, 2 full. Also read by cartoon-material.ts for
 * the landmarks' stone and render. Set before the first material is made (game.ts, from Menu → Settings → Graphics).
 */
export let FACADE_DETAIL = 2
export function setFacadeDetail(level: number): void { FACADE_DETAIL = level }

/**
 * What each wall page is made of, for FACADE_DETAIL: [1 dressed stone | 2 render, courses painted in one page]. The
 * course counts are the pages' own joint pitch (haussmann a joint every 56 px of 512, classical and brownstone 73, opera 128).
 */
const STONE_PAGES: Record<string, [number, number]> = {
  haussmann: [1, 512 / 56], classical: [1, 512 / 73], brownstone: [1, 512 / 73], opera: [1, 4],
  marais: [2, 0], stucco: [2, 0], presidioStucco: [2, 0],
}

/**
 * What hangs behind each style's windows, for FACADE_DETAIL: [sheer, drapes drawn back, blind] odds per pane, how much
 * brighter an undressed room reads (lit offices), and the odds a building with no glass tint gets coated glass.
 * Keyed by wall page, so a style that borrows another's paintings (Style.art) borrows its glass too.
 */
type GlassLook = [number, number, number, number, number]
const GLASS_DEFAULT: GlassLook = [0.25, 0.1, 0.35, 0, 0]
const GLASS_LOOKS: Record<string, GlassLook> = {
  // Paris: white voile behind most French windows, a few heavier curtains, blinds rare (the shutters do that)
  haussmann: [0.55, 0.15, 0.04, 0, 0], classical: [0.5, 0.15, 0.06, 0, 0],
  marais: [0.45, 0.18, 0.04, 0, 0], vosges: [0.45, 0.18, 0.04, 0, 0],
  parismodern: [0.35, 0.08, 0.3, 0, 0.1], opera: [0, 0, 0, 0.2, 0], operaGlass: [0, 0, 0, 0.2, 0],
  // SF and the old American cities: lace and blinds at every height
  victorian: [0.35, 0.12, 0.3, 0, 0], edwardian: [0.35, 0.12, 0.3, 0, 0], brownstone: [0.35, 0.12, 0.3, 0, 0],
  // the modern: vertical and roller blinds, bright rooms, coated glass on the larger ones
  bauhaus: [0.15, 0.08, 0.35, 0.1, 0.35], brutalist: [0.1, 0.05, 0.35, 0.1, 0.3],
  towerblock: [0.25, 0.1, 0.35, 0, 0.05], chicago: [0.05, 0.05, 0.35, 0.25, 0.2],
  skyscraper: [0, 0, 0.35, 0.35, 0.8],
}

/**
 * One material per style, because each style has its own wall page. Cached, since a city has seven of them
 * and several thousand buildings.
 */
export function facadeMaterial(scene: Scene, styleId: string, assetBase: string,
                               variant = ''): ShaderMaterial {
  const name = `facade:${styleId}${variant ? `:${variant}` : ''}`
  const existing = scene.materials.find((m) => m.name === name)
  if (existing) return existing as ShaderMaterial

  if (!registered) {
    Effect.ShadersStore['facadeVertexShader'] = VERTEX
    Effect.ShadersStore['facadeFragmentShader'] = FRAGMENT
    registered = true
  }

  // litter (render/litter-glsl.ts): the areas mesh decides per fragment (-1), the walks are pavement; walls get graffiti,
  // but not a far stand-in's
  const litterSite = variant === 'ground' ? -1 : variant === 'pavement' ? SITE.pavement : SITE.none
  const litterWalls = !variant && !styleId.endsWith('-far')
  const mat = new ShaderMaterial(name, scene, 'facade', {
    attributes: ['position', 'normal', 'uv', 'color', 'uv2'],
    uniforms: ['world', 'worldViewProjection', 'sunDir', 'sunColour', 'skyColour', 'groundColour',
      'fogColour', 'fogDensity', 'eye', 'zenith', 'horizon', 'night', 'flatGround', 'weathering', 'stoneKind', 'pageCourses', 'glassMix', 'glassCoat',
      ...LITTER_UNIFORMS],
    samplers: ['wallTex', 'atlasTex', ...litterSamplers(litterWalls)],
    defines: [`#define FACADE_DETAIL ${FACADE_DETAIL}`, `#define GRASS_DETAIL ${getGrassDetail()}`,
      `#define GRASS_AREAS ${variant === 'ground' && getGrassDetail() > 0 ? 1 : 0}`,
      ...litterDefines(litterSite, litterWalls)],
  })
  bindLitter(mat, scene, litterWalls)
  const [kind, courses] = STONE_PAGES[wallPageOf(styleId).replace(/-far$/, '')] ?? [0, 0]
  mat.setFloat('stoneKind', kind)
  mat.setFloat('pageCourses', courses)
  const [sheer, drapes, blind, room, coat] = GLASS_LOOKS[wallPageOf(styleId).replace(/-far$/, '')] ?? GLASS_DEFAULT
  mat.setVector4('glassMix', new Vector4(sheer, drapes, blind, room))
  mat.setFloat('glassCoat', coat)

  // (a style that borrows another's paintings binds that one's page: facade.ts `Style.art`)
  const wall = new Texture(`${assetBase}walls/${wallPageOf(styleId)}.png`, scene, false, false)
  wall.wrapU = Texture.WRAP_ADDRESSMODE
  wall.wrapV = Texture.WRAP_ADDRESSMODE
  const atlas = new Texture(`${assetBase}atlas.png`, scene, false, false)
  // clamped, so a cell cannot sample its neighbour even before the 8 px bleed margin is reached
  atlas.wrapU = Texture.CLAMP_ADDRESSMODE
  atlas.wrapV = Texture.CLAMP_ADDRESSMODE

  mat.setTexture('wallTex', wall)
  mat.setTexture('atlasTex', atlas)
  applyLook(mat, DAYLIGHT)
  mat.setFloat('flatGround', variant === 'ground' ? 1 : 0)
  // far overhead until the first frame supplies the real eye, so nothing is discarded before then
  mat.setVector3('eye', new Vector3(0, 1e5, 0))
  mat.backFaceCulling = true
  /**
   * An explicit depth function, so nothing inherits one.
   *
   * The ground layers deliberately draw with ALWAYS — within a painted layer the last quad wins — and
   * Babylon only sets `depthFunction` for materials that specify one, leaving the previous material's state
   * bound for every material that does not. Whatever happened to be drawn after a road then had no depth
   * test either, which is invisible until something new joins the scene and changes the order things are
   * drawn in, and then the whole city goes wrong at once.
   */
  mat.depthFunction = Constants.LEQUAL
  return mat
}

/** Weathering strength, 0..1 (the shader's W_ constants say what it does); set before the first facade material is made. */
let WEATHERING = 1
export function setWeathering(v: number, scene?: Scene): void {
  WEATHERING = v
  if (scene) for (const m of scene.materials) if (m.name.startsWith('facade:')) (m as ShaderMaterial).setFloat('weathering', v)
}

export function applyLook(mat: ShaderMaterial, look: SkyLook): void {
  mat.setFloat('weathering', WEATHERING)
  mat.setVector3('sunDir', look.sun)
  mat.setColor3('sunColour', look.sunColour)
  mat.setColor3('skyColour', look.skyColour)
  mat.setColor3('groundColour', look.groundColour)
  mat.setColor3('fogColour', look.fogColour)
  mat.setFloat('fogDensity', look.fogDensity)
  mat.setColor3('zenith', look.zenith)
  mat.setColor3('horizon', look.horizon)
  mat.setFloat('night', NIGHT)
}

/**
 * Glass needs to know where the eye is, so this has to be fed every frame rather than set once. Babylon's
 * `ShaderMaterial` has no automatic for it when the camera is driven by hand, as the chase camera is.
 *
 * Wet road needs it for the same reason: a reflection is a function of the angle you look at it from, and
 * an eye that never moves gives a mirror painted onto the tarmac.
 */
export function updateEye(scene: Scene, eye: Vector3): void {
  for (const m of scene.materials) {
    // road materials use it too: for the wet mirror, and to refuse to draw the ground from underneath
    if (m.name.startsWith('facade:') || m.name.startsWith('road:')) (m as ShaderMaterial).setVector3('eye', eye)
  }
}
