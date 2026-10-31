/**
 * Batch 3's parks' small structures (2026-10-31; the planting is tools/gardens/paris-batch3.ts). Each says what it was read from. Rock is the owner's reason for `crag` here: "Rock and vines were weakest" on Batch 1 and 2's shots, seven-sided lumps at riding distance. A crag is a jittered sphere's facets in strata and tones, lit by its true normals; a pile of crags is rockwork you can ride up to.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { strut } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, prism, shade, type Rgb } from '../../kit.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
const groundOf = (fit: Fit) => (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
const ROCK = hex('#6f6a5f'), MOSS = hex('#4e5a38'), IRON = hex('#1d2124'), STONE = hex('#b8ae98')
const rockTag = surfaceTag('rock')

/** A boulder: a sphere of rx × ry × rz, 8 × 5 facets with their corners jittered, each facet's true normal; bedded in strata; moss where it faces up. About 80 triangles. */
export function crag(out: MeshBuilder, cx: number, y0: number, cz: number, rx: number, ry: number, rz: number, seed: number, c: Rgb = ROCK): void {
  const lon = 8, lat = 5
  const P = (i: number, j: number): [number, number, number] => {
    const a = ((i % lon) / lon) * Math.PI * 2 + seed
    const b = -0.25 + (j / lat) * (Math.PI / 2 + 0.25)
    const m = j === lat ? 0.45 : 0.72 + hash(seed + (i % lon), j) * 0.5
    const step = 0.86 + hash(seed, j) * 0.3
    return [cx + Math.cos(a) * Math.cos(b) * rx * m * step, y0 + Math.sin(b) * ry * (0.9 + hash(j, seed) * 0.2), cz + Math.sin(a) * Math.cos(b) * rz * m * step]
  }
  for (let j = 0; j < lat; j++) {
    for (let i = 0; i < lon; i++) {
      const a = P(i, j), b = P(i + 1, j), d = P(i + 1, j + 1), f = P(i, j + 1)
      const ux = d[0] - a[0], uy = d[1] - a[1], uz = d[2] - a[2], vx = f[0] - b[0], vy = f[1] - b[1], vz = f[2] - b[2]
      let n: [number, number, number] = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
      const mx = (a[0] + d[0]) / 2 - cx, mz = (a[2] + d[2]) / 2 - cz
      if (n[0] * mx + n[2] * mz < 0) n = [-n[0], -n[1], -n[2]]
      const l = Math.hypot(n[0], n[1], n[2]) || 1
      const up = n[1] / l
      const strata = 0.82 + ((j + (seed | 0)) % 2) * 0.13 + hash(i + seed, j) * 0.2
      const col: Rgb = up > 0.72 && hash(i, j + seed) > 0.4 ? shade(MOSS, 0.9 + hash(j, i) * 0.3) : shade(c, strata)
      out.quad([a, b, d, f], n, UV, col, rockTag)
    }
  }
}

/* ------------------------------------------------------------------------------------------------- Parc Kellermann */

/**
 * LES ROCHERS DANS LE CIEL (Parc Kellermann's east walk; OSM's five nodes, 48.81903–31, 2.35735–63; `tourism=artwork`): five boulders held up in the air on thin steel legs, over the path, in a line. The placement is OSM's; the look is the name's and memory. Local frame x east, z north about the middle stone.
 */
export function rochersDansLeCiel(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit), M = 111320, K = 73270
  const at = [[48.81903, 2.35759], [48.81914, 2.35763], [48.81916, 2.35752], [48.81924, 2.35741], [48.81931, 2.35735]]
  at.forEach(([la, lo], i) => {
    const x = (lo - 2.35750) * K, z = (la - 48.81917) * M
    const y = G(x, z) + 5 + hash(i, 3) * 3
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + i, r = 1.8
      strut(out, [x + Math.cos(a) * r, G(x, z), z + Math.sin(a) * r], [x + Math.cos(a) * 0.4, y + 0.2, z + Math.sin(a) * 0.4], 0.09, 0.09, hex('#55595c'), surfaceTag('metal'), false)
    }
    crag(out, x, y, z, 1.5 + hash(i, 1) * 0.8, 1.9 + hash(i, 2) * 0.9, 1.4 + hash(i, 5) * 0.8, i * 2.3, hex('#7a766b'))
  })
}

/* ------------------------------------------------------------------------------------------------ Square du Temple */

/**
 * THE KIOSK OF THE SQUARE DU TEMPLE (Davioud's bandstand, 1857–63; relation/3180746, OSM's `building=roof`, 8.5 m): eight iron columns and their lace of brackets, a zinc bell of a roof and a finial, on a stone drum: aerial 48.86435 2.36081: a grey-blue octagon 10 m across. Replaces OSM's flat roof.
 */
export function templeKiosk(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, r = 5, T = hex('#5c7b83'), GREEN = hex('#223a33')
  prism(out, 0, 0, y - 0.3, y + 1, r + 0.2, 8, STONE, surfaceTag('ashlar'))
  prism(out, 0, 0, y + 1, y + 1.12, r + 0.4, 8, shade(STONE, 1.05), 0)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, x = Math.cos(a) * (r - 0.3), z = Math.sin(a) * (r - 0.3)
    prism(out, x, z, y + 1.1, y + 5, 0.1, 6, GREEN, 0)
    const b = ((i + 1) / 8) * Math.PI * 2, x1 = Math.cos(b) * (r - 0.3), z1 = Math.sin(b) * (r - 0.3)
    strut(out, [x, y + 5, z], [x1, y + 5, z1], 0.18, 0.28, GREEN, 0, false)
    strut(out, [x, y + 4.2, z], [(x + x1) / 2, y + 4.95, (z + z1) / 2], 0.05, 0.05, GREEN, 0, false)
    strut(out, [x1, y + 4.2, z1], [(x + x1) / 2, y + 4.95, (z + z1) / 2], 0.05, 0.05, GREEN, 0, false)
    strut(out, [x, y + 2.05, z], [x1, y + 2.05, z1], 0.05, 0.05, GREEN, 0, false)
  }
  // the bell of the roof, three falls
  prism(out, 0, 0, y + 5.15, y + 6.3, r + 0.55, 8, T, surfaceTag('metal'), r - 1.3)
  prism(out, 0, 0, y + 6.3, y + 7.6, r - 1.3, 8, shade(T, 0.94), surfaceTag('metal'), 1.2)
  prism(out, 0, 0, y + 7.6, y + 8.1, 1.2, 8, GREEN, 0, 0.5)
  prism(out, 0, 0, y + 8.1, y + 9, 0.14, 6, hex('#a98b3a'), surfaceTag('metal'), 0.04)
}

/**
 * THE TEMPLE's ROCKWORK AND FALL (Alphand's pond, with Fontainebleau's rocks, OSM way/112563033, 20 × 29 m; 48.86429 2.36115): a shoulder of boulders on its north-east bank, a thin sheet of water over a lip into the pond. The owner said rock was weakest: these are `crag`s, bedded and overlapping. −z faces the pond.
 */
export function templeRocher(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, rocks: [number, number, number, number, number, number][] = [
    [-5.5, -0.2, 1.4, 2.4, 1.6, 1.6], [-3.2, 0, 1.4, 2.2, 2, 2], [-0.9, 0.4, 2.6, 2.2, 2.6, 1.8], [1.8, 0.3, 2.4, 2.2, 2.4, 2], [4.1, 0, 1.2, 2.4, 1.8, 1.6], [6.1, -0.2, 0.7, 1.7, 1.2, 1.5],
    [-2.3, 0.5, -0.8, 1.9, 1.8, 1.7], [2.6, 0.6, -0.8, 2, 1.6, 1.6], [-1.4, 2.6, 1.2, 1.6, 1.4, 1.5], [1.3, 2.6, 1.2, 1.5, 1.4, 1.4], [0, 3.4, 2.4, 1.5, 1.3, 1.3], [-6.8, -0.3, -0.6, 1.3, 0.9, 1], [6.3, -0.3, -1, 1.2, 0.8, 1],
  ]
  rocks.forEach(([x, h, z, rx, ry, rz], i) => crag(out, x, y + h, z, rx, ry, rz, i * 1.73))
  // the lip and the fall
  block(out, -0.75, 0.75, 0.1, 1.1, y + 3.5, y + 3.72, shade(ROCK, 0.72))
  out.water.push({ kind: 'sheet', a: [-0.6, y + 3.72, 0.1], b: [0.6, y + 3.72, 0.1], out: 0.3, drop: 3.5 })
  out.water.push({ kind: 'splash', at: [0, y + 0.2, -0.8], r: 1.1 })
}

/* --------------------------------------------------------------------------------------------- Square René-Le Gall */

/**
 * JEAN-CHARLES MOREUX's OBELISKS (1938; Square René-Le Gall): his garden's follies, rustic cones of rough stone and shell-work either side of the parterre's head, about six metres on their drums. The look is from memory and fr.wikipedia's mention; the place is off the aerial, the parterre's north corners. Listed for Tripo; this gives the outline.
 */
export function legallObelisk(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, C = hex('#7c7768'), L = hex('#958f7d')
  prism(out, 0, 0, y - 0.3, y + 0.7, 1.5, 8, L, rockTag, 1.3)
  const bands = 7, H = 5.4
  for (let b = 0; b < bands; b++) {
    const t0 = b / bands, t1 = (b + 1) / bands
    prism(out, 0, 0, y + 0.7 + t0 * H, y + 0.7 + t1 * H, 1.15 * (1 - t0 * 0.84) + hash(b, 2) * 0.1, 8, shade(C, 0.88 + hash(b, 1) * 0.2), rockTag, 1.15 * (1 - t1 * 0.84) + hash(b + 1, 2) * 0.05, false)
  }
  crag(out, 0, y + 0.7 + H, 0, 0.32, 0.3, 0.32, 7.3, L)
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; crag(out, Math.cos(a) * 1.55, y + 0.2, Math.sin(a) * 1.55, 0.55, 0.5, 0.5, i * 1.1, C) }
}

/* ----------------------------------------------------------------------------------------- Butte du Chapeau Rouge */

/**
 * THE FOUNTAIN OF ÈVE (Léon Azéma's terrace, Raymond Couvègnes's Ève, 1939; OSM's basin, way/1244550730 and way/245771978, node "Ève"; 48.88234 2.39933): at the park's head, a curved wall of pale stone with its stairs either side, a bronze figure on a pedestal over the long stone basin, water running from it down the main axis. Aerial 48.88209 2.39887: the white crescent over the lawn at (595, 410). −z down the park (bearing 200).
 */
export function chapeauEve(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit), S = hex('#a39b87'), n = 14, R = 16
  const yW = G(0, 9), yB = G(0, 0)
  // the crescent wall, standing back of OSM's basin; it faces down the park
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (0.12 + (i / n) * 0.76), a1 = Math.PI * (0.12 + ((i + 1) / n) * 0.76)
    const P = (a: number, r: number, yy: number): [number, number, number] => [Math.cos(a) * r, yy, 3 + Math.sin(a) * r * 0.45]
    const h = 3.6, low = Math.min(yW, yB) - 0.6
    const nn: [number, number, number] = [-Math.cos((a0 + a1) / 2), 0, -Math.sin((a0 + a1) / 2)]
    out.quad([P(a1, R, low), P(a0, R, low), P(a0, R, yW + h), P(a1, R, yW + h)], nn, UV, i % 3 === 1 ? shade(S, 0.92) : S, surfaceTag('ashlar'))
    out.quad([P(a0, R + 0.9, yW + h), P(a1, R + 0.9, yW + h), P(a1, R - 0.1, yW + h), P(a0, R - 0.1, yW + h)], [0, 1, 0], UV, shade(S, 1.08), 0)
    out.quad([P(a0, R + 0.9, low), P(a1, R + 0.9, low), P(a1, R + 0.9, yW + h), P(a0, R + 0.9, yW + h)], [-nn[0], 0, -nn[2]], UV, S, 0)
    // its balusters along the top
    const m = P((a0 + a1) / 2, R + 0.4, yW + h)
    block(out, m[0] - 0.12, m[0] + 0.12, m[2] - 0.12, m[2] + 0.12, yW + h, yW + h + 0.95, S)
    strut(out, [P(a0, R + 0.4, 0)[0], yW + h + 0.95, P(a0, R + 0.4, 0)[2]], [P(a1, R + 0.4, 0)[0], yW + h + 0.95, P(a1, R + 0.4, 0)[2]], 0.28, 0.16, shade(S, 1.05), 0, false)
  }
  // the kerb round OSM's basin (way/1244550730, 24 × 11 m): a ring, so the water shows
  const m = 24
  const on = (t: number, rx: number, rz: number, y: number): [number, number, number] => [Math.cos(t) * rx, y, Math.sin(t) * rz]
  for (let k = 0; k < m; k++) {
    const t0 = (k / m) * Math.PI * 2, t1 = ((k + 1) / m) * Math.PI * 2, tm = (t0 + t1) / 2
    const low = yB - 0.3, top = yB + 0.55
    out.quad([on(t1, 12.6, 6.2, top), on(t0, 12.6, 6.2, top), on(t0, 12, 5.6, top), on(t1, 12, 5.6, top)], [0, 1, 0], UV, shade(S, 1.08), 0)
    out.quad([on(t0, 12.6, 6.2, low), on(t1, 12.6, 6.2, low), on(t1, 12.6, 6.2, top), on(t0, 12.6, 6.2, top)], [Math.cos(tm), 0, Math.sin(tm)], UV, S, surfaceTag('ashlar'))
  }
  // the figure on her pier at the wall's foot, the water from it
  const B = hex('#3a4a43'), z = 6.4, y = G(0, z)
  block(out, -1, 1, z - 1, z + 1, y - 0.5, y + 3.2, S)
  prism(out, 0, z, y + 3.2, y + 4.3, 0.42, 8, B, surfaceTag('metal'), 0.34)
  prism(out, 0, z, y + 4.3, y + 5.5, 0.34, 8, B, surfaceTag('metal'), 0.24)
  prism(out, 0, z, y + 5.5, y + 5.9, 0.16, 6, B, surfaceTag('metal'), 0.16)
  prism(out, 0, z, y + 5.9, y + 6.3, 0.17, 6, B, surfaceTag('metal'), 0.1)
  out.water.push({ kind: 'sheet', a: [-0.6, y + 2.9, z - 1.05], b: [0.6, y + 2.9, z - 1.05], out: 0.15, drop: Math.max(0.6, y + 2.9 - yB) })
}

/** The SQUARE SAINT-LAMBERT's basin (OSM way/23936583, 26 m across; aerial: a little stepped pedestal and its jets in the middle): OSM has the water; this is the piece in its middle and the jet. */
export function lambertJet(out: MeshBuilder, fit: Fit): void {
  const y = (fit.grade ?? 0) + 0.3, S = hex('#a59c88')
  prism(out, 0, 0, y - 0.3, y + 0.5, 2.4, 12, S, surfaceTag('ashlar'), 2.1)
  prism(out, 0, 0, y + 0.5, y + 1.3, 1, 10, S, surfaceTag('ashlar'), 0.8)
  prism(out, 0, 0, y + 1.3, y + 1.5, 1.4, 10, shade(S, 1.08), 0, 1.5)
  out.water.push({ kind: 'jet', at: [0, y + 1.5, 0], v: [0, 8, 0], width: 0.12, spread: 0.3 })
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    out.water.push({ kind: 'jet', at: [Math.cos(a) * 2.2, y + 0.4, Math.sin(a) * 2.2], v: [-Math.cos(a) * 1, 4, -Math.sin(a) * 1], width: 0.05, spread: 0.15 })
  }
}

/* ---------------------------------------------------------------------------------------------- Jardins d'Éole */

/**
 * THE PAINTED COURTS OF ÉOLE (the Rue d'Aubervilliers end; aerial 48.88734 2.36624, 0.5 m/px, at (528–590, 90–290)): four games courts in a line on the rail side, their asphalt painted edge to edge in great bands of blue, rose, purple and yellow, one of the few things a rider sees at once from the road. The line runs on bearing 17; −z toward the south-west end. x across, z along. Colours off the aerial.
 */
export function eoleCourts(out: MeshBuilder, fit: Fit): void {
  const y = (fit.grade ?? 0) + 0.06
  const courts: [number, Rgb, Rgb, Rgb][] = [
    [-47, hex('#5b6d9b'), hex('#b6a14a'), hex('#a24f62')],
    [-21, hex('#a94d6e'), hex('#c47948'), hex('#5a7fb1')],
    [5, hex('#4c9a86'), hex('#5b6ea8'), hex('#c4b250')],
    [31, hex('#3b6da6'), hex('#d05a54'), hex('#d2b842')],
  ]
  const up: [number, number, number] = [0, 1, 0]
  for (const [z0, a, b, c] of courts) {
    const hw = 10, L = 23
    out.quad([[-hw, y, z0], [hw, y, z0], [hw, y, z0 + L], [-hw, y, z0 + L]], up, UV, a, 0)
    // a great band across and a circle: the painters' shapes
    out.quad([[-hw, y + 0.05, z0 + 6], [hw, y + 0.05, z0 + 3], [hw, y + 0.05, z0 + 10], [-hw, y + 0.05, z0 + 14]], up, UV, b, 0)
    for (let i = 0; i < 12; i++) {
      const t0 = (i / 12) * Math.PI * 2, t1 = ((i + 1) / 12) * Math.PI * 2
      const cz = z0 + 15
      out.quad([[0, y + 0.1, cz], [Math.cos(t0) * 5.5, y + 0.1, cz + Math.sin(t0) * 5.5], [Math.cos(t1) * 5.5, y + 0.1, cz + Math.sin(t1) * 5.5], [0, y + 0.1, cz]], up, UV, c, 0)
    }
    // the lines, the fence and hoop-posts at each end
    for (const x of [-hw + 0.6, hw - 0.6]) out.quad([[x - 0.05, y + 0.15, z0 + 0.6], [x + 0.05, y + 0.15, z0 + 0.6], [x + 0.05, y + 0.15, z0 + L - 0.6], [x - 0.05, y + 0.15, z0 + L - 0.6]], up, UV, hex('#a8a8a0'), 0)
    for (const z of [z0 + 1.2, z0 + L - 1.2]) {
      prism(out, 0, z, y, y + 3, 0.07, 6, IRON, 0)
      block(out, -0.7, 0.7, z - 0.02, z + 0.02, y + 2.7, y + 3.6, hex('#d2d2ca'))
    }
    for (const s of [-1, 1]) {
      for (let z = z0; z <= z0 + L; z += 4.6) prism(out, s * hw, z, y, y + 3, 0.04, 4, IRON, 0)
      strut(out, [s * hw, y + 3, z0], [s * hw, y + 3, z0 + L], 0.05, 0.05, IRON, 0, false)
    }
  }
}

