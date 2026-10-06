/**
 * SURF ON A SANDY BEACH (owner, 2026-10-06: "the beach at the end of Golden Gate Park … has simple waves crashing
 * effect that is only ok … a more realistic waves crashing animation"). Zones with `water: 'beach'` (data/zones:
 * Ocean Beach, Baker and China Beach) get this instead of the rocks' surf (render/surf.ts, which stays for cliffs).
 *
 * One strip along the COASTLINE as drawn (the sea ring, which the water is painted to), from a dozen metres up the
 * sand to about a hundred and sixty out to sea, and one shader over it. Each vertex carries where it is: `u`, metres along the
 * shore, and `d`, metres from the waterline, seaward positive. Everything that moves is a function of (u, d, time):
 *
 *  - SWELL: lines of crests marching in from the edge of the strip at a few metres a second, a faint light band on
 *    each, bent along the shore by a low noise so the lines are never ruled straight;
 *  - THE BREAK: each wave breaks at its own distance (30–50 m, varying wave to wave and along the shore); from there
 *    in, its crest is a band of white water with a lacy tail of foam behind it, fading as it runs in;
 *  - FOAM between the waves, slowly drifting patches over the surf zone, thickest near the shore;
 *  - THE SWASH: the bore reaches the waterline and runs up the sand as a thin film with a bright lacy edge, as far as
 *    that wave's run-up (4–11 m), then drains back, leaving the sand it covered dark and glistening for a few seconds.
 *
 * Built once per tile from the coastline; the only thing that changes a frame is `time`. Drawn in the buildings'
 * group with alpha, no depth writes: over the water the occluder is already held below the sea's level, and on the
 * sand the strip lies on the ground a hand above it.
 */
import type { Scene } from '@babylonjs/core/scene'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { Effect } from '@babylonjs/core/Materials/effect'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import type { Terrain } from '../city/terrain.ts'
import type { TileLayer } from './city.ts'
import { inRing } from '../map/zones.ts'
import { DAYLIGHT, NIGHT } from './facade-material.ts'

interface Zone { ring: number[]; bbox: [number, number, number, number]; props: { water?: string } }
type P = { x: number; z: number }

/** the strip's rows across the shore, metres from the waterline (seaward positive) */
const ROWS = ((): number[] => {
  const r: number[] = [-14, -11, -8.5, -6.5, -5, -3.8, -2.8, -2, -1.3, -0.6, 0]
  // finely through the surf zone (a crest's lip is a couple of metres deep), coarser out to sea
  for (let d = 0.8; d <= 90; d += d < 12 ? 0.8 : 1.2) r.push(Math.round(d * 10) / 10)
  for (const d of [95, 102, 110, 120, 132, 145, 160]) r.push(d)
  return r
})()
/** metres between samples along the shore */
const STEP = 4

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec4 color;
uniform mat4 worldViewProjection;
uniform float time;
varying vec2 vUD;
varying float vFade;
varying float vDepth;
varying float vH;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
const float T = 9.0;       // seconds between waves
const float C = 5.0;       // metres a second they run in
float wobble(float u) { return (noise(vec2(u * 0.011, 0.0)) - 0.5) * 0.45 + (noise(vec2(u * 0.045, 5.0)) - 0.5) * 0.10; }
float breakAt(float u, float wave) { return 45.0 + 30.0 * noise(vec2(u * 0.018, wave * 0.37)); }
/*
 * The water's height over the sea at (u, d): a swell offshore that steepens and grows as it nears its break, a lip
 * pitching up at the break, then a bore of white water running in that shrinks to nothing at the shore.
 */
float waveHeight(float u, float d, float time) {
  if (d <= 0.0) return 0.0;
  float ph = time / T + d / (C * T) + wobble(u);
  float p = fract(ph);
  float brk = breakAt(u, floor(ph));
  // the shape of one wave in phase: a steep front (just shoreward of the crest, p near 1), a long back (p from 0)
  float back = exp(-p / 0.16);
  float front = smoothstep(0.90, 1.0, p);
  float shape = max(back, front);
  float grow = smoothstep(140.0, brk, d);                      // builds as it comes in
  float size = 0.2 + grow * (0.9 + 0.6 * noise(vec2(u * 0.02, floor(ph) * 1.3)));
  float lip = exp(-abs(d - brk) / 5.0) * exp(-p / 0.05) * 1.0;
  float inside = smoothstep(brk + 2.0, brk - 2.0, d);
  // inside the break the wave is a bore, lower, and shrinks to nothing at the waterline
  float bore = exp(-p / 0.10) * 0.8 * smoothstep(0.0, brk, d);
  return mix(size * shape, bore, inside) + lip;
}

void main(void) {
  vUD = uv;
  vFade = color.r;
  float h = waveHeight(uv.x, uv.y, time);
  vH = h;
  gl_Position = worldViewProjection * vec4(position + vec3(0.0, h, 0.0), 1.0);
  vDepth = gl_Position.w;
}
`

const FRAGMENT = `
precision highp float;
uniform float time;
uniform float light;
uniform vec3 fogColour;
uniform float fogDensity;
varying vec2 vUD;
varying float vFade;
varying float vDepth;


float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
const float T = 9.0;
const float C = 5.0;
float wobble(float u) { return (noise(vec2(u * 0.011, 0.0)) - 0.5) * 0.45 + (noise(vec2(u * 0.045, 5.0)) - 0.5) * 0.10; }
float breakAt(float u, float wave) { return 32.0 + 18.0 * noise(vec2(u * 0.018, wave * 0.37)); }
/*
 * The water's height over the sea at (u, d): a swell offshore that steepens and grows as it nears its break, a lip
 * pitching up at the break, then a bore of white water running in that shrinks to nothing at the shore.
 */
float waveHeight(float u, float d, float time) {
  if (d <= 0.0) return 0.0;
  float ph = time / T + d / (C * T) + wobble(u);
  float p = fract(ph);
  float brk = breakAt(u, floor(ph));
  // the shape of one wave in phase: a steep front (just shoreward of the crest, p near 1), a long back (p from 0)
  float back = exp(-p / 0.16);
  float front = smoothstep(0.90, 1.0, p);
  float shape = max(back, front);
  float grow = smoothstep(95.0, brk, d);                       // builds as it comes in
  float size = 0.15 + grow * (0.55 + 0.35 * noise(vec2(u * 0.02, floor(ph) * 1.3)));
  float lip = exp(-abs(d - brk) / 4.0) * exp(-p / 0.05) * 0.7;
  float inside = smoothstep(brk + 2.0, brk - 2.0, d);
  // inside the break the wave is a bore, lower, and shrinks to nothing at the waterline
  float bore = exp(-p / 0.08) * 0.55 * smoothstep(0.0, brk, d);
  return mix(size * shape, bore, inside) + lip;
}

varying float vH;
float fbm(vec2 p) { return noise(p) * 0.55 + noise(p * 2.13 + 3.1) * 0.3 + noise(p * 4.7 + 7.3) * 0.15; }

const float PI = 3.14159265;

void main(void) {
  float u = vUD.x, d = vUD.y;
  // the crest lines bend along the shore, broadly and a little finely
  float wob = wobble(u);
  // phase: 0 on a crest, rising seaward behind it (so at a fixed place it rises with time: the crest runs shoreward)
  float ph = time / T + max(d, 0.0) / (C * T) + wob;
  float p = fract(ph);
  float wave = floor(ph);
  // where this wave breaks
  float brk = breakAt(u, wave);
  float broken = smoothstep(brk + 3.0, brk - 3.0, d);
  // foam that travels with the water, and foam that drifts slowly
  float laceMoving = fbm(vec2(u * 0.32, (d + time * C) * 0.42));
  // (streaks drawn out along the shore, a few metres across: big round blobs read as camouflage)
  float laceSlow = fbm(vec2(u * 0.12 + time * 0.03, d * 0.42 - time * 0.08));

  vec3 white = vec3(0.95, 0.97, 0.98);
  float a = 0.0;
  vec3 col = white;

  if (d >= 0.0) {
    // the shallows, paler and greener than the open sea, inside and just beyond the break
    float shallow = 1.0 - smoothstep(brk * 0.7, brk + 35.0, d);
    col = vec3(0.30, 0.45, 0.46);
    a = 0.38 * shallow;
    // the face of a wave standing up before it breaks: darker and greener, lit through at its top
    float face = smoothstep(0.86, 0.985, p) * (1.0 - broken) * smoothstep(130.0, brk + 5.0, d);
    if (face * 0.55 > a) { col = mix(vec3(0.12, 0.27, 0.29), vec3(0.35, 0.55, 0.55), smoothstep(0.9, 0.99, p)); a = face * 0.55; }
    // the swell offshore: a soft light band on each crest, fading out to sea
    float swell = exp(-p / 0.05) * smoothstep(0.0, 0.01, p) * (1.0 - broken) * (1.0 - smoothstep(110.0, 150.0, d));
    if (0.22 * swell > a) { col = white; a = 0.22 * swell; }
    // the white water: sharp at the front of the bore, a lacy tail seaward of it, thinning as it runs in
    // a broad band of white water behind the front, and a long tail of foam behind that, laced
    float bore = exp(-p / 0.16) * broken;
    float tail = exp(-p / 0.45) * broken * smoothstep(0.25, 0.7, laceMoving);
    float fade = 0.55 + 0.45 * smoothstep(0.0, brk, d);
    // the moment of breaking is the whitest
    float plunge = exp(-abs(d - brk) / 3.5) * exp(-p / 0.05);
    float foam = (0.9 * bore + 0.55 * tail) * fade + 0.4 * plunge;
    if (foam > 0.0) { col = mix(col, white, smoothstep(0.0, 0.5, foam)); a = max(a, min(1.0, foam)); }
    // drifting foam over the whole surf zone, thicker close in
    float drift = smoothstep(0.5, 0.82, laceSlow) * (1.0 - smoothstep(4.0, brk + 10.0, d));
    if (0.35 * drift > 0.0) { col = mix(col, white, smoothstep(0.0, 0.3, drift)); a = max(a, 0.35 * drift); }
    // a fringe of churned water right at the edge
    float churn = 0.55 * (1.0 - smoothstep(0.0, 3.0, d)) * smoothstep(0.35, 0.7, laceMoving);
    if (churn > 0.0) { col = mix(col, white, smoothstep(0.0, 0.3, churn)); a = max(a, churn); }
  }

  // the swash, up the sand
  float q = fract(time / T + wob);
  float n = floor(time / T + wob);
  float R = 4.0 + 7.0 * noise(vec2(u * 0.028, n * 0.71));
  float up = 0.55;                                   // the share of the cycle the water is on the sand
  float reach = q < up ? -R * sin(PI * q / up) : 0.0;
  if (d < 3.0) {
    if (d > reach && d < 0.5) {
      // a thin glassy film, brighter towards the leading edge
      float film = 0.28 + 0.25 * smoothstep(reach + 2.5, reach, d);
      col = mix(vec3(0.70, 0.80, 0.84), white, smoothstep(reach + 1.5, reach, d));
      a = max(a, film);
    }
    // the bright lacy edge of the run-up (bold on the way up, thin on the way back)
    float edge = exp(-abs(d - reach) / (q < up * 0.5 ? 0.45 : 0.25)) * step(-0.01, -reach) * step(0.02, -reach + 0.02);
    float lace = smoothstep(0.25, 0.6, fbm(vec2(u * 0.6, d * 0.9 + n)));
    a = max(a, edge * (0.55 + 0.4 * lace) * step(q, up));
    // where the water has just drained: wet, dark sand for a few seconds
    if (d < 0.0 && d > -R && (q >= up || d < reach)) {
      float since = q >= up ? (q - up) * T : 0.0;
      float wetDark = 0.22 * (1.0 - smoothstep(0.0, 4.0, since)) * smoothstep(-R, -R + 1.5, d);
      if (wetDark > a) { col = vec3(0.0); a = wetDark; }
    }
  }

  a *= vFade;
  if (a < 0.004) discard;
  // a little shading on the moving water: the raised lip is brightest
  vec3 c = col * light * (0.92 + 0.12 * clamp(vH, 0.0, 1.0));
  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(c, fogColour, clamp(fog, 0.0, 1.0)), a);
}
`

let registered = false

function material(scene: Scene): ShaderMaterial {
  if (!registered) {
    Effect.ShadersStore['beachSurfVertexShader'] = VERTEX
    Effect.ShadersStore['beachSurfFragmentShader'] = FRAGMENT
    registered = true
  }
  const m = new ShaderMaterial('beachSurf', scene, 'beachSurf', {
    attributes: ['position', 'uv', 'color'],
    uniforms: ['worldViewProjection', 'time', 'light', 'fogColour', 'fogDensity'],
    needAlphaBlending: true,
  })
  m.backFaceCulling = false
  m.disableDepthWrite = true
  m.setColor3('fogColour', DAYLIGHT.fogColour)
  m.setFloat('fogDensity', DAYLIGHT.fogDensity)
  let lastNight = -1
  scene.onBeforeRenderObservable.add(() => {
    // (`window.__surfTime`: a debug clock, so a contact sheet can show the surf at chosen moments)
    const fixed = (window as unknown as { __surfTime?: number }).__surfTime
    m.setFloat('time', fixed ?? performance.now() / 1000)
    if (NIGHT !== lastNight) {
      lastNight = NIGHT
      m.setFloat('light', 1 - 0.72 * NIGHT)
      m.setColor3('fogColour', DAYLIGHT.fogColour)
    }
  })
  return m
}

/**
 * The coastline inside the beach zones, as runs of points every `STEP` metres with their seaward normals. `sea`: the
 * sea's rings (outer and island holes), `box` the rideable box (a clip artefact runs along it, and is no shore).
 */
export function beachRuns(zones: Zone[], seaRings: { ring: P[]; holes: P[][] }[], box?: { x0: number; x1: number; z0: number; z1: number }):
  { pts: P[]; nx: number[]; nz: number[]; u0: number }[] {
  const beach = zones.filter((z) => z.props.water === 'beach')
  if (!beach.length) return []
  const inBeach = (x: number, z: number): boolean => beach.some((zn) => x >= zn.bbox[0] && x <= zn.bbox[2] && z >= zn.bbox[1] && z <= zn.bbox[3] && inRing(zn.ring, x, z))
  const onBox = (a: P, b: P): boolean => !!box && [[a.x, b.x, box.x0], [a.x, b.x, box.x1], [a.z, b.z, box.z0], [a.z, b.z, box.z1]]
    .some(([p, q, s]) => Math.abs(p - s) < 0.75 && Math.abs(q - s) < 0.75)
  const inside = (r: P[], x: number, z: number): boolean => {
    let o = false
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
    }
    return o
  }
  const isSea = (x: number, z: number): boolean => seaRings.some((s) => inside(s.ring, x, z) && !s.holes.some((h) => inside(h, x, z)))
  const runs: { pts: P[]; nx: number[]; nz: number[]; u0: number }[] = []
  for (const s of seaRings) {
    for (const ring of [s.ring, ...s.holes]) {
      let cur: P[] = []
      const flush = (): void => {
        if (cur.length < 2) { cur = []; return }
        // resample every STEP metres
        const pts: P[] = [cur[0]]
        let carry = 0
        for (let i = 1; i < cur.length; i++) {
          const a = cur[i - 1], b = cur[i]
          const L = Math.hypot(b.x - a.x, b.z - a.z)
          let t = STEP - carry
          while (t < L) { pts.push({ x: a.x + (b.x - a.x) * (t / L), z: a.z + (b.z - a.z) * (t / L) }); t += STEP }
          carry = L - (t - STEP)
        }
        const last = cur[cur.length - 1]
        if (Math.hypot(last.x - pts[pts.length - 1].x, last.z - pts[pts.length - 1].z) > 0.5) pts.push(last)
        if (pts.length < 3) { cur = []; return }
        // the normals, mitred (averaged between neighbouring segments), turned to the sea by a vote down the run
        const nx: number[] = [], nz: number[] = []
        for (let i = 0; i < pts.length; i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]
          const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
          nx.push(-(b.z - a.z) / L); nz.push((b.x - a.x) / L)
        }
        let vote = 0
        for (let i = 0; i < pts.length; i += Math.max(1, Math.floor(pts.length / 15))) vote += isSea(pts[i].x + nx[i] * 12, pts[i].z + nz[i] * 12) ? 1 : -1
        if (vote < 0) for (let i = 0; i < pts.length; i++) { nx[i] = -nx[i]; nz[i] = -nz[i] }
        runs.push({ pts, nx, nz, u0: Math.round(pts[0].x * 0.37 + pts[0].z * 0.61) })
        cur = []
      }
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length]
        const ok = inBeach((a.x + b.x) / 2, (a.z + b.z) / 2) && !onBox(a, b)
        if (ok) { if (!cur.length) cur.push(a); cur.push(b) } else flush()
      }
      flush()
    }
  }
  return runs
}


/**
 * THE BEACH FACE (2026-10-06). The elevation data has none: Ocean Beach stands about 3 m over the sea right at the
 * waterline, so the sand ended in a step with the sea painted below it, and the surf had nowhere to run up. Within
 * reach of a beach's coastline the ground is lowered (never raised) onto a beach of 1 in 20 that meets the sea at the
 * waterline and carries on down under it, and blends back to the data where that is lower or further away. Faded out
 * over the last 40 m of each run, so a beach's end is not a cliff.
 */
export function shoreRamp(runs: ReturnType<typeof beachRuns>, sea: number): ((x: number, z: number, h: number) => number) | null {
  if (!runs.length) return null
  const LAND = 90, SEA = 40, SLOPE = 0.05, CELL = 20
  const grid = new Map<string, { x: number; z: number; nx: number; nz: number; w: number }[]>()
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const r of runs) {
    let along = 0
    const lens: number[] = [0]
    for (let i = 1; i < r.pts.length; i++) lens.push(lens[i - 1] + Math.hypot(r.pts[i].x - r.pts[i - 1].x, r.pts[i].z - r.pts[i - 1].z))
    const total = lens[lens.length - 1]
    for (let i = 0; i < r.pts.length; i++) {
      along = lens[i]
      const p = r.pts[i]
      const w = Math.max(0, Math.min(1, along / 40, (total - along) / 40))
      const k = `${Math.floor(p.x / CELL)},${Math.floor(p.z / CELL)}`
      const list = grid.get(k) ?? []
      list.push({ x: p.x, z: p.z, nx: r.nx[i], nz: r.nz[i], w })
      grid.set(k, list)
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
    }
  }
  x0 -= LAND; x1 += LAND; z0 -= LAND; z1 += LAND
  const reach = Math.ceil(LAND / CELL)
  return (x, z, h) => {
    if (x < x0 || x > x1 || z < z0 || z > z1 || h < sea - 2) return h
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL)
    let best = Infinity, near: { x: number; z: number; nx: number; nz: number; w: number } | null = null
    for (let j = cz - reach; j <= cz + reach; j++) for (let i = cx - reach; i <= cx + reach; i++) {
      for (const q of grid.get(`${i},${j}`) ?? []) {
        const d2 = (q.x - x) ** 2 + (q.z - z) ** 2
        if (d2 < best) { best = d2; near = q }
      }
    }
    if (!near || best > LAND * LAND) return h
    const s = (x - near.x) * near.nx + (z - near.z) * near.nz       // seaward positive
    if (s > SEA || s < -LAND) return h
    const beach = sea - 0.12 - s * SLOPE
    if (beach >= h) return h
    // fade the last stretch landward back into the data, and at the run's ends
    const w = near.w * (s < -LAND + 20 ? (s + LAND) / 20 : 1)
    return h + (beach - h) * w
  }
}

export function beachSurfLayer(scene: Scene, terrain: Terrain, sea: number,
                               runs: ReturnType<typeof beachRuns>): TileLayer | null {
  if (!runs.length) return null
  const mat = material(scene)
  return {
    name: 'beachSurf',
    range: 4,
    build(_near, rect) {
      const pos: number[] = [], uvs: number[] = [], cols: number[] = [], idx: number[] = []
      const nR = ROWS.length
      for (const run of runs) {
        const { pts, nx, nz } = run
        // along-shore metres, and a fade over the run's first and last 40 m (a zone's edge is not a shore's end)
        const us: number[] = [run.u0]
        for (let i = 1; i < pts.length; i++) us.push(us[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
        const total = us[us.length - 1] - run.u0
        for (let i = 0; i + 1 < pts.length; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2, mz = (pts[i].z + pts[i + 1].z) / 2
          if (mx < rect.x0 || mx >= rect.x1 || mz < rect.z0 || mz >= rect.z1) continue
          const base = pos.length / 3
          for (const k of [i, i + 1]) {
            const along = us[k] - run.u0
            const fade = Math.min(1, along / 40, (total - along) / 40)
            for (const d of ROWS) {
              const x = pts[k].x + nx[k] * d, z = pts[k].z + nz[k] * d
              // on the sand: lying on it; out at sea: at the water's level, where the occluder is held under
              const ground = terrain.rawHeightAt(x, z)
              const y = d <= 0 ? Math.max(ground, sea) + 0.07 : sea + 0.07
              pos.push(x, y, z)
              uvs.push(us[k], d)
              cols.push(Math.max(0, fade), 0, 0, 1)
            }
          }
          for (let r = 0; r + 1 < nR; r++) {
            const a = base + r, b = base + r + 1, c = base + nR + r + 1, e = base + nR + r
            idx.push(a, b, c, a, c, e)
          }
        }
      }
      if (!idx.length) return []
      const vd = new VertexData()
      vd.positions = pos
      vd.uvs = uvs
      vd.colors = cols
      vd.indices = idx
      const m = new Mesh(`beachSurf:${rect.x0},${rect.z0}`, scene)
      vd.applyToMesh(m)
      m.material = mat
      m.isPickable = false
      m.renderingGroupId = 3
      m.alphaIndex = 1
      return [m]
    },
  }
}
