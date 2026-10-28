/**
 * MOVING WATER: fountains, falls and pools (owner, 2026-10-06: "I think we need a REALLY solid system for rendering
 * fountains. Every city has distinctive fountains, and we're not even attempting to render them. For a different
 * project we did a simple particle system but it didn't work that well … DO NOT do statues or sculptures in or near
 * fountains; just the water with a spray coming out"; and "maybe we can reuse the water spray system for Huntington
 * Falls too").
 *
 * Not particles. Water in a fountain is a few SHAPES that hold still while the water runs through them — a jet's arc
 * stands in the air, a sheet hangs over a lip — so each is a fixed mesh, and the running is in its shader: streaks
 * of white carried along the shape at the water's own speed, broken up into drops where a jet tops out and falls,
 * spray at the edges. One draw per kind per landmark, nothing updated on the CPU but the clock.
 *
 * A landmark builder describes its water on its MeshBuilder (`out.water`, in its own frame, like its clock hands and
 * rotors); `Water.raise` makes the meshes, parented to the placed landmark:
 *
 *  - `jet`:    from a nozzle at `at` with velocity `v` (m/s; gravity does the rest): a parabola, as two crossed ribbons
 *              that widen as the water spreads; `width` at the nozzle. A vertical jet (no horizontal velocity) rises,
 *              stalls and falls back on itself as a column, which is what a single-jet fountain looks like. It ends
 *              in the highest pool it comes down INTO (the ring its landing point is inside), else on the lowest
 *              pool, else at 0; `land` says the height outright.
 *  - `sheet`:  a curtain over a lip from `a` to `b`, leaving it at `out` m/s and falling `drop` metres — a basin
 *              overflowing, a cascade, a waterfall.
 *  - `pool`:   a still surface over a ring (any simple polygon) at height `y`: tinted water that glitters, with the
 *              wind's ripples on it.
 *  - `splash`: where falling water lands, a disc of radius `r` of white churn and rings running out.
 *
 * Heights are in the model's frame (its base at 0). Lit by the city's light and fog (NIGHT dims it).
 */
import type { Scene } from '@babylonjs/core/scene'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import earcut from 'earcut'
import { DAYLIGHT, NIGHT } from './facade-material.ts'

type V3 = [number, number, number]
export type WaterFeature =
  | { kind: 'jet'; at: V3; v: V3; width?: number; spread?: number; land?: number }
  | { kind: 'sheet'; a: V3; b: V3; out?: number; drop: number; thick?: number }
  | { kind: 'pool'; ring: { x: number; z: number }[]; y: number; colour?: V3 }
  | { kind: 'splash'; at: V3; r: number }

const G = 9.81

const COMMON = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { return noise(p) * 0.55 + noise(p * 2.13 + 3.1) * 0.3 + noise(p * 4.7 + 7.3) * 0.15; }
`

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec4 color;
uniform mat4 world;
uniform mat4 viewProjection;
varying vec2 vUV;
varying vec4 vData;
varying float vDepth;
varying vec3 vWorld;
void main(void) {
  vec4 w = world * vec4(position, 1.0);
  vWorld = w.xyz;
  vUV = uv;
  vData = color;
  gl_Position = viewProjection * w;
  vDepth = gl_Position.w;
}
`

/*
 * FLOW (jets and sheets). uv.x across the ribbon (−1..1), uv.y along the flow in SECONDS of the water's flight from
 * the nozzle or lip; color.r a seed, color.g the flight's whole length in seconds, color.b 1 for a jet, 0 for a sheet.
 */
const FLOW_FRAGMENT = `
precision highp float;
uniform float time;
uniform float light;
uniform vec3 fogColour;
uniform float fogDensity;
varying vec2 vUV;
varying vec4 vData;
varying float vDepth;
${COMMON}
void main(void) {
  float across = vUV.x, t = vUV.y, seed = vData.r * 97.0, life = max(vData.g, 0.01);
  float jet = vData.b;
  float f = t / life;                                  // 0 at the nozzle or lip, 1 where it lands
  // streaks carried with the water: the pattern is fixed to the water, so it moves along at the flow's speed
  float streak = fbm(vec2(across * (jet > 0.5 ? 2.2 : 7.0) + seed, (t - time) * 3.2));
  float fine = noise(vec2(across * 18.0 + seed, (t - time) * 11.0));
  // a glassy core near the nozzle, opening into white water, breaking into drops at the end
  float core = 1.0 - smoothstep(0.0, 0.85, abs(across));
  float body = mix(0.55 + 0.45 * core, 0.35 + 0.65 * streak, smoothstep(0.0, 0.35, f));
  float drops = step(0.55 - 0.35 * smoothstep(0.55, 1.0, f), fine * 0.6 + streak * 0.5);
  float a = body * mix(1.0, drops, smoothstep(0.45, 0.95, f));
  // soft edges, and gone where it lands
  a *= (1.0 - smoothstep(0.55, 1.0, abs(across))) * (1.0 - smoothstep(0.9, 1.0, f));
  a *= jet > 0.5 ? 0.85 : 0.75;
  if (a < 0.02) discard;
  vec3 water = mix(vec3(0.62, 0.74, 0.8), vec3(0.97, 0.98, 1.0), smoothstep(0.3, 0.8, streak + 0.3 * f));
  vec3 c = water * light;
  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(c, fogColour, clamp(fog, 0.0, 1.0)), a);
}
`

/*
 * POOL: a surface; color.rgb its tint. Ripples in the world's own metres tilt its normal, and through that normal it
 * shows its own colour looking down and the SKY at a glancing angle (Fresnel), with the sun glinting in it — which is
 * what makes a basin read as water and not as a blue floor. (Was a two-tone of the tint with blotchy glints, which
 * read as camouflage on a 20 m pool.)
 */
const POOL_FRAGMENT = `
precision highp float;
uniform float time;
uniform float light;
uniform vec3 fogColour;
uniform float fogDensity;
uniform vec3 cameraPosition;
uniform vec3 sunDir;
uniform vec3 skyTop;
uniform vec3 skyLow;
varying vec4 vData;
varying float vDepth;
varying vec3 vWorld;
${COMMON}
float ripple(vec2 p) {
  return noise(p * 1.7 + vec2(time * 0.45, time * 0.3)) * 0.6 + noise(p * 4.3 - vec2(time * 0.7, -time * 0.55)) * 0.4;
}
void main(void) {
  vec2 p = vWorld.xz;
  float e = 0.12, h0 = ripple(p);
  vec3 n = normalize(vec3((h0 - ripple(p + vec2(e, 0.0))) * 0.7, 1.0, (h0 - ripple(p + vec2(0.0, e))) * 0.7));
  vec3 V = normalize(cameraPosition - vWorld);
  float cosT = clamp(dot(n, V), 0.0, 1.0);
  float fres = 0.06 + 0.94 * pow(1.0 - cosT, 4.0);
  // the sky it reflects: the horizon's pale at a glancing angle, the zenith's blue looking steeply down
  vec3 R = reflect(-V, n);
  vec3 sky = mix(skyLow, skyTop, clamp(R.y * 1.6, 0.0, 1.0));
  vec3 deep = vData.rgb * (0.85 + 0.3 * h0);
  vec3 c = mix(deep, sky, clamp(fres, 0.0, 0.8));
  // the sun in it: a tight glint that breaks up on the ripples
  float sun = pow(max(dot(R, -normalize(sunDir)), 0.0), 180.0);
  c += vec3(1.0, 0.97, 0.9) * sun * 1.4;
  c *= light;
  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(c, fogColour, clamp(fog, 0.0, 1.0)), 0.92);
}
`

/* SPLASH: a disc, uv −1..1; white churn at the middle and rings running out. */
const SPLASH_FRAGMENT = `
precision highp float;
uniform float time;
uniform float light;
uniform vec3 fogColour;
uniform float fogDensity;
varying vec2 vUV;
varying vec4 vData;
varying float vDepth;
${COMMON}
void main(void) {
  float r = length(vUV);
  if (r > 1.0) discard;
  float seed = vData.r * 50.0;
  float ang = atan(vUV.y, vUV.x);
  float churn = fbm(vec2(ang * 2.0 + seed, r * 4.0 - time * 2.5));
  float centre = (1.0 - smoothstep(0.15, 0.6, r)) * (0.55 + 0.45 * churn);
  float rings = smoothstep(0.75, 1.0, fract(r * 3.5 - time * 0.9)) * (1.0 - smoothstep(0.5, 1.0, r)) * 0.6;
  float lace = smoothstep(0.55, 0.8, churn) * (1.0 - smoothstep(0.6, 1.0, r));
  float a = max(centre, max(rings, lace * 0.7));
  if (a < 0.02) discard;
  vec3 c = vec3(0.96, 0.98, 1.0) * light;
  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(c, fogColour, clamp(fog, 0.0, 1.0)), a * 0.9);
}
`

let registered = false

function material(scene: Scene, kind: 'flow' | 'pool' | 'splash'): ShaderMaterial {
  if (!registered) {
    // (its OWN name: `waterVertexShader` is the bay's (render/water-material.ts), and registering a fountain under it
    //  replaced the sea's vertex shader whenever a fountain loaded first — the whole bay drew as the green ground under
    //  it, owner 2026-10-07)
    Effect.ShadersStore['fountainWaterVertexShader'] = VERTEX
    Effect.ShadersStore['waterFlowFragmentShader'] = FLOW_FRAGMENT
    Effect.ShadersStore['waterPoolFragmentShader'] = POOL_FRAGMENT
    Effect.ShadersStore['waterSplashFragmentShader'] = SPLASH_FRAGMENT
    registered = true
  }
  const name = { flow: 'waterFlow', pool: 'waterPool', splash: 'waterSplash' }[kind]
  const have = scene.getMaterialByName(name)
  if (have) return have as ShaderMaterial
  const m = new ShaderMaterial(name, scene, { vertex: 'fountainWater', fragment: name }, {
    attributes: ['position', 'uv', 'color'],
    uniforms: ['world', 'viewProjection', 'time', 'light', 'fogColour', 'fogDensity', 'cameraPosition', 'sunDir', 'skyTop', 'skyLow'],
    needAlphaBlending: true,
  })
  m.backFaceCulling = false
  // the pool writes depth (it is a surface things stand in); the moving water does not, so it never cuts holes
  m.disableDepthWrite = kind !== 'pool'
  let last = -1
  scene.onBeforeRenderObservable.add(() => {
    m.setFloat('time', performance.now() / 1000)
    if (NIGHT !== last) {
      last = NIGHT
      m.setFloat('light', 1 - 0.7 * NIGHT)
      m.setColor3('fogColour', DAYLIGHT.fogColour)
      m.setFloat('fogDensity', DAYLIGHT.fogDensity)
      m.setVector3('sunDir', DAYLIGHT.sun)
      m.setColor3('skyTop', DAYLIGHT.zenith)
      m.setColor3('skyLow', DAYLIGHT.horizon)
    }
  })
  return m
}

class Geo {
  p: number[] = []; uv: number[] = []; c: number[] = []; i: number[] = []
  v(x: number, y: number, z: number, u: number, w: number, c: [number, number, number, number]): number {
    this.p.push(x, y, z); this.uv.push(u, w); this.c.push(...c)
    return this.p.length / 3 - 1
  }
  mesh(scene: Scene, name: string): Mesh | null {
    if (!this.i.length) return null
    const vd = new VertexData()
    vd.positions = this.p; vd.uvs = this.uv; vd.colors = this.c; vd.indices = this.i
    const m = new Mesh(name, scene)
    vd.applyToMesh(m)
    return m
  }
}

/** a jet's flight: where the water is `t` seconds after the nozzle */
function along(j: { at: V3; v: V3 }, t: number): V3 {
  return [j.at[0] + j.v[0] * t, j.at[1] + j.v[1] * t - 0.5 * G * t * t, j.at[2] + j.v[2] * t]
}

/** seconds until a jet comes back down to height `floor` */
function flight(j: { at: V3; v: V3 }, floor: number): number {
  const a = 0.5 * G, b = -j.v[1], c = floor - j.at[1]
  const d = b * b - 4 * a * c
  return d < 0 ? 0.5 : (-b + Math.sqrt(d)) / (2 * a)
}

function addJet(g: Geo, j: Extract<WaterFeature, { kind: 'jet' }>, seed: number, floor: number): void {
  const T = flight(j, floor)
  const N = 24
  const w0 = j.width ?? 0.08, spread = j.spread ?? 0.25
  const horiz = Math.hypot(j.v[0], j.v[2])
  // across the ribbons: two directions square to the flight, so the jet reads from any side
  const fx = horiz > 0.05 ? j.v[0] / horiz : 1, fz = horiz > 0.05 ? j.v[2] / horiz : 0
  const sides: V3[] = horiz > 0.05 ? [[-fz, 0, fx], [0, 1, 0]] : [[1, 0, 0], [0, 0, 1]]
  for (const [k, side] of sides.entries()) {
    const base = g.p.length / 3
    for (let s = 0; s <= N; s++) {
      const t = (s / N) * T
      const p = along(j, t)
      // a vertical jet falls back round its own column: wider as it comes down
      const w = w0 + spread * (t / T) * (horiz > 0.05 ? 1 : 1.6)
      // (the up-down ribbon of an arcing jet is its thickness, which stays slimmer)
      const ww = k === 1 && horiz > 0.05 ? w * 0.5 : w
      for (const u of [-1, 1]) g.v(p[0] + side[0] * ww * u, p[1] + side[1] * ww * u, p[2] + side[2] * ww * u, u, t, [seed, T, 1, 1])
    }
    for (let s = 0; s < N; s++) {
      const a = base + s * 2
      g.i.push(a, a + 1, a + 3, a, a + 3, a + 2)
    }
  }
}

function addSheet(g: Geo, sh: Extract<WaterFeature, { kind: 'sheet' }>, seed: number): void {
  const out = sh.out ?? 0.6
  const T = Math.sqrt((2 * sh.drop) / G)
  const dx = sh.b[0] - sh.a[0], dz = sh.b[2] - sh.a[2]
  const L = Math.hypot(dx, dz) || 1
  // the sheet leaves the lip square to it: the normal on the right of a→b
  const nx = dz / L, nz = -dx / L
  const N = 14, M = Math.max(2, Math.round(L / 1.5))
  const base = g.p.length / 3
  for (let s = 0; s <= N; s++) {
    const t = (s / N) * T
    for (let m = 0; m <= M; m++) {
      const f = m / M
      const x = sh.a[0] + dx * f + nx * out * t, z = sh.a[2] + dz * f + nz * out * t
      const y = sh.a[1] + (sh.b[1] - sh.a[1]) * f - 0.5 * G * t * t
      g.v(x, y, z, f * 2 - 1 + 0 * L, t, [seed, T, 0, 1])
    }
  }
  for (let s = 0; s < N; s++) for (let m = 0; m < M; m++) {
    const a = base + s * (M + 1) + m
    g.i.push(a, a + 1, a + M + 2, a, a + M + 2, a + M + 1)
  }
  void L
}

function addPool(g: Geo, pl: Extract<WaterFeature, { kind: 'pool' }>): void {
  const c = pl.colour ?? [0.18, 0.34, 0.38]
  // (earcut, not a fan from the centre: a fan covered the outside of a pond that is not convex — the MLK Memorial's)
  const first = g.p.length / 3
  for (const q of pl.ring) g.v(q.x, pl.y, q.z, 0, 0, [c[0], c[1], c[2], 1])
  for (const k of earcut(pl.ring.flatMap((q) => [q.x, q.z]))) g.i.push(first + k)
}

function addSplash(g: Geo, sp: Extract<WaterFeature, { kind: 'splash' }>, seed: number): void {
  const base = g.p.length / 3
  for (const [u, w] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.v(sp.at[0] + u * sp.r, sp.at[1], sp.at[2] + w * sp.r, u, w, [seed, 0, 0, 1])
  g.i.push(base, base + 1, base + 2, base, base + 2, base + 3)
}

type Pool = Extract<WaterFeature, { kind: 'pool' }>

function inside(ring: { x: number; z: number }[], x: number, z: number): boolean {
  let hit = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
  }
  return hit
}

/**
 * Where a jet comes down: the highest pool below its apex that its landing point falls inside, else the lowest pool,
 * else the ground. (Every jet used to end at the HIGHEST pool's level, wherever it fell: the Legion's ring of jets
 * from the outer rim stopped in mid-air at the height of the bowl in the middle.)
 */
function landing(j: Extract<WaterFeature, { kind: 'jet' }>, pools: Pool[]): number {
  if (j.land !== undefined) return j.land
  if (!pools.length) return 0
  const apex = j.at[1] + Math.max(0, j.v[1]) ** 2 / (2 * G)
  for (const p of [...pools].sort((a, b) => b.y - a.y)) {
    if (p.y >= apex) continue
    const q = along(j, flight(j, p.y))
    if (inside(p.ring, q[0], q[2])) return p.y
  }
  return Math.min(...pools.map((p) => p.y))
}

/** A landmark's water, as meshes parented to it. */
export class Water {
  constructor(private readonly scene: Scene) {}

  raise(features: WaterFeature[], host: Mesh, name: string): void {
    const flow = new Geo(), pool = new Geo(), splash = new Geo()
    // the jets come down to the pool they fall into (`landing`)
    const pools = features.filter((f): f is Pool => f.kind === 'pool')
    features.forEach((f, k) => {
      const seed = ((k * 0.618) % 1)
      if (f.kind === 'jet') addJet(flow, f, seed, landing(f, pools))
      else if (f.kind === 'sheet') addSheet(flow, f, seed)
      else if (f.kind === 'pool') addPool(pool, f)
      else addSplash(splash, f, seed)
    })
    const made: [Geo, 'flow' | 'pool' | 'splash', number][] = [[pool, 'pool', 0], [splash, 'splash', 1], [flow, 'flow', 2]]
    for (const [g, kind, order] of made) {
      const m = g.mesh(this.scene, `water:${kind}:${name}`)
      if (!m) continue
      m.material = material(this.scene, kind)
      m.parent = host
      m.isPickable = false
      m.renderingGroupId = host.renderingGroupId
      m.alphaIndex = order
    }
  }
}
