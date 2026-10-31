/**
 * Batch 3's towers (2026-10-31; docs/landmarks/PARIS-BATCHES.md; owner, 2026-10-30: "may in some cases just be a high-rise or shopping center that is highly visible and unusual even if it is not a conventional destination"). Silhouette and colour first:
 * these are read from two kilometres off, across the roofs. The Orgues de Flandre's stepped pipes, the Tour Totem's bundles on their trunk, the round Super-Italie, the Front de Seine's and the Olympiades's dozen-odd tall boxes each in its own skin
 * (tower.ts's grammar on OSM's own outline), the Y of the Tripode. Every outline is `fit.ring`; every height the manifest's.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { MeshBuilder as MB } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { boxAlong, edgeAt } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, placed, prism, shade, type Rgb } from '../../kit.ts'
import { faceBand, insetRing, tower, towerRing, type Face, type TowerSpec } from '../../tower.ts'
import { bandRound, capRound } from '../palaces/showfront.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

/* ------------------------------------------------------------------------------------------- Les Orgues de Flandre */

/**
 * LES ORGUES DE FLANDRE (Martin Schulz van Treeck, 1974–80; Avenue de Flandre, 2 000 flats: Prélude 123 m, Fugue 108, Cantate 101, Sonate 90 and the long blocks at 48): every flat a bay of raw concrete stood out from the wall, so that the towers
 * are bundles of pipes, each stopping at its own height: an organ, and from the Bassin de la Villette the one skyline of its kind in Paris. Heights from pss-archi's list; the pipes from memory of photographs, as the sources I could read don't describe them; OSM's zigzag outline is the bundle's plan. Pipes the width of a room or two run round
 * every wall, standing out by a metre or two, and stop `steps` floors or fewer under the top; the corners stop soonest, so the crown stairs in. The core is a dark rough stump behind them.
 */
function organ(out: MeshBuilder, fit: Fit, o: { steps: number; floor?: number; low?: boolean }): void {
  const ring = towerRing(fit), H = fit.height, floor = o.floor ?? 3.05
  const C = hex('#64605a'), GLASS: Rgb = hex('#232a30'), DK = shade(C, 0.72)
  const core = insetRing(ring, 1.2)
  const coreTop = H - (o.low ? 1.5 : 3) * floor
  faceBand(out, core, 0, coreTop, { kind: 'blank', wall: DK, material: 'concrete' })
  capPolygon(out, core, coreTop, shade(C, 0.62), 0)
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x / ring.length; cz += p.z / ring.length }
  const R = Math.max(...ring.map((p) => Math.hypot(p.x - cx, p.z - cz)))
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 1.2) continue
    const n = Math.max(1, Math.round(e.L / 3.6))
    const w = e.L / n
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) * w
      const x = e.a.x + e.tx * u, z = e.a.z + e.tz * u
      // (far from the middle stops soonest: the crown stairs in; and a little at random, as the flats do)
      const far = Math.hypot(x - cx, z - cz) / R
      const drop = Math.round(hash(x, z) * (o.steps * 0.5) + far * far * o.steps * 0.75)
      const top = H - drop * floor
      const d = 0.8 + hash(z, x) * 1.3
      const tone = 0.9 + hash(x + 3, z) * 0.2
      const hx = w / 2 - 0.12, hy = top / 2, hz = (d + 1.2) / 2
      boxAlong(out, x + e.nx * (d - 1.2) / 2, hy, z + e.nz * (d - 1.2) / 2, hx, hy, hz, e.heading, shade(C, tone))
      // a window to a floor on the pipe's face, and a slit on its side every other: what makes a pipe a pipe at riding distance
      const P = (t: number, y: number, dd: number): [number, number, number] => [x + e.tx * t + e.nx * dd, y, z + e.tz * t + e.nz * dd]
      const nn: [number, number, number] = [e.nx, 0, e.nz]
      for (let y = 3.2; y < top - 1.8; y += floor) {
        const ww = Math.min(hx - 0.25, 1.15 + hash(k, y) * 0.35)
        out.quad([P(-ww, y, d + 0.05), P(ww, y, d + 0.05), P(ww, y + 1.9, d + 0.05), P(-ww, y + 1.9, d + 0.05)], nn, UV, GLASS, 0)
      }
    }
  }
}
export const orguesPrelude = (out: MeshBuilder, fit: Fit): void => organ(out, fit, { steps: 7 })
export const orguesFugue = (out: MeshBuilder, fit: Fit): void => organ(out, fit, { steps: 6 })
export const orguesBloc = (out: MeshBuilder, fit: Fit): void => organ(out, fit, { steps: 7, low: true, floor: 3 })

/* --------------------------------------------------------------------------------------------------- La Tour Totem */

/**
 * LA TOUR TOTEM (Andrault and Parat, 1976–79; quai de Grenelle, 100 m, 31 floors): the Front de Seine's one odd tower. Four raw concrete columns and their beams stand as a tree, and the flats hang in bundles off 14 m cantilevers: glazed boxes, in clusters,
 * each cluster turned and shifted on the one below, so the outline is lumps on a trunk (fr.wikipedia; OSM's relation/6066445 is the pinwheel of the bundles). Six storeys of bundle, pale frame and bronze glass; the four columns plain below and above them.
 */
export function tourTotem(out: MeshBuilder, fit: Fit): void {
  const H = Math.min(fit.height || 96, 100)
  const C = hex('#a29a8a'), CD = shade(C, 0.78), G = hex('#544f46'), F = hex('#b7b0a0')
  const y0 = 9
  // the trunk: four columns and the core between them, to the top and past it
  for (const [x, z] of [[-4.2, -4.2], [4.2, -4.2], [4.2, 4.2], [-4.2, 4.2]] as const) block(out, x - 1.3, x + 1.3, z - 1.3, z + 1.3, 0, H + 3, C)
  block(out, -3, 3, -3, 3, 0, H - 2, CD)
  // the bundles, stack by stack; quadrants rise out of step, so no two heights meet and the top is broken
  const tiers = 6
  const tierH = (H - y0) / tiers
  for (let q = 0; q < 4; q++) {
    const a = (q * Math.PI) / 2
    const local = new MB()
    for (let t = 0; t < tiers; t++) {
      const base = y0 + t * tierH + (q % 2) * tierH * 0.42 + (q === 3 ? tierH * 0.2 : 0)
      const top = Math.min(base + tierH - 0.5, H + (q % 2 ? 1.5 : 0))
      if (top - base < 6) continue
      // alternately a box square to the trunk and pushed out along one arm or the other
      const far = t % 2 === 0
      const x0 = far ? 2 : 6, x1 = far ? 19.5 : 15
      const z0 = far ? 3.5 : 1, z1 = far ? 13 : 19.5
      block(local, x0, x1, z0, z1, base, top, G)
      // the concrete tray under it and the beam back to the trunk
      block(local, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, base - 0.9, base, F)
      block(local, 2, x1, (z0 + z1) / 2 - 0.8, (z0 + z1) / 2 + 0.8, base - 1.4, base - 0.1, C)
      block(local, x0 - 0.2, x1 + 0.2, z0 - 0.2, z1 + 0.2, top, top + 0.45, F)
      // floors and mullions in pale on its outer faces
      const floors = Math.round((top - base) / 3.05)
      for (let f = 1; f < floors; f++) {
        const y = base + ((top - base) * f) / floors
        for (const [nx, nz, a0, b0, a1, b1] of [[1, 0, x1, z0, x1, z1], [0, 1, x1, z1, x0, z1], [-1, 0, x0, z1, x0, z0], [0, -1, x0, z0, x1, z0]] as const) {
          local.quad([[a0 + nx * 0.05, y - 0.16, b0 + nz * 0.05], [a1 + nx * 0.05, y - 0.16, b1 + nz * 0.05], [a1 + nx * 0.05, y + 0.16, b1 + nz * 0.05], [a0 + nx * 0.05, y + 0.16, b0 + nz * 0.05]], [nx, 0, nz], UV, F, 0)
        }
      }
      for (let k = 1; k <= 3; k++) {
        const x = x0 + ((x1 - x0) * k) / 4, z = z0 + ((z1 - z0) * k) / 4
        for (const [p, nn] of [[[x, z1 + 0.06], [0, 1]], [[x, z0 - 0.06], [0, -1]], [[x1 + 0.06, z], [1, 0]], [[x0 - 0.06, z], [-1, 0]]] as const) {
          const sx = nn[1] !== 0 ? 0.13 : 0, sz = nn[0] !== 0 ? 0.13 : 0
          local.quad([[p[0] - sx, base, p[1] - sz], [p[0] + sx, base, p[1] + sz], [p[0] + sx, top, p[1] + sz], [p[0] - sx, top, p[1] - sz]], [nn[0], 0, nn[1]], UV, F, 0)
        }
      }
    }
    placed(out, local, a, 0, 0)
  }
}

/* ------------------------------------------------------------------------------------------- La Tour Super-Italie */

/**
 * LA TOUR SUPER-ITALIE (Maurice Novarina, 1974; Avenue d'Italie, 112 m, 38 floors): "the round tower", the only one in a district of boxes. Aerial 48.8219 2.3594: an oval, 29 × 33 m, its balconies a pale ribbon round every floor, and the flat box of the lifts on its roof.
 */
export function superItalie(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 80 ? fit.height : 112
  const rx = Math.max(10, fit.hx), rz = Math.max(10, fit.hz)
  const SP = hex('#a59a86'), DK = hex('#3a3a39'), a0 = -Math.PI, a1 = Math.PI, segs = 28
  bandRound(out, 0, 0, rx - 0.8, rz - 0.8, a0, a1, 0, H, DK, { segs })
  const floor = H / 38
  for (let k = 0; k < 38; k++) {
    const y = k * floor
    bandRound(out, 0, 0, rx, rz, a0, a1, y + floor - 1.05, y + floor, SP, { segs })
    capRound(out, 0, 0, rx, rz, a0, a1, y + floor, SP, true, 2 + (k === 37 ? segs : 0))
  }
  // the ground floor glazed behind its columns
  bandRound(out, 0, 0, rx - 0.5, rz - 0.5, a0, a1, 0, 5.2, hex('#505b60'), { segs })
  capRound(out, 0, 0, rx, rz, a0, a1, H, SP, true, segs)
  // the roof's lift house and its parapet
  block(out, -rx * 0.55, rx * 0.55, -rz * 0.45, rz * 0.45, H, H + 4.5, hex('#8d8676'))
  block(out, -rx * 0.2, rx * 0.2, -rz * 0.2, rz * 0.2, H + 4.5, H + 7, hex('#8d8676'))
  bandRound(out, 0, 0, rx + 0.1, rz + 0.1, a0, a1, H, H + 1.2, shade(SP, 1.1), { segs })
}

/* ---------------------------------------------------------------------------- the rest: tower.ts on OSM's own outline */

const band = (wall: string, glass: string, solid = 0.5, floor = 3.05): Face => ({ kind: 'bands', wall: hex(wall), glass: hex(glass), solid, floor, material: 'concrete' })
const fins = (wall: string, glass: string, pitch = 2.7, solid = 0.42, depth = 0.45, floor = 2.9): Face => ({ kind: 'fins', wall: hex(wall), glass: hex(glass), pitch, solid, depth, floor, material: 'concrete' })
const raised = (spec: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, spec)

/**
 * THE FRONT DE SEINE (Pottier, Proux, Marty and Lopez, 1967–90; "Beaugrenelle"): twenty towers of about 98 m on a 2-level slab, the one piece of the Plan d'urbanisme of the 1960s that went up. From the Pont de Grenelle or the Eiffel Tower, a palisade of flat tops, each its own
 * skin: pale ribbed concrete and bronze glass; dark curtain; white balconies. Tones are from the aerial's roofs and memory of photographs; which tower has which skin is the part most worth a street-view check. Tour Cristal's mirror is the exception: lit up pale, with its frame, so it doesn't read as a dark box.
 */
const FDS: TowerSpec = {
  height: 98, roof: hex('#8d8878'),
  base: { height: 7, face: { kind: 'curtain', wall: hex('#57585a'), glass: hex('#3a4347'), pitch: 2.4, floor: 3.5 } },
  tiers: [{ to: 1, face: band('#928a78', '#322f2c', 0.46) }],
  crown: { kind: 'parapet', height: 1.1, colour: hex('#b9b09c') },
  penthouse: 2,
}
export const fdsRibbed = raised({ ...FDS, tiers: [{ to: 1, face: fins('#8d8571', '#2c2a28', 2.5, 0.44, 0.5) }] })
export const fdsBanded = raised(FDS)
export const fdsBalcon = raised({ ...FDS, tiers: [{ to: 1, face: band('#a6a294', '#3a4142', 0.36) }], crown: { kind: 'parapet', height: 1.4, colour: hex('#c4bfb0') } })
export const fdsBronze = raised({ ...FDS, tiers: [{ to: 1, face: { kind: 'curtain', wall: hex('#6f6555'), glass: hex('#47403a'), pitch: 2.1, floor: 3.05 } }], roof: hex('#6a6456') })
export const fdsCristal = raised({ ...FDS, roof: hex('#7c8a91'), tiers: [{ to: 1, face: { kind: 'curtain', wall: hex('#cbd2d3'), glass: hex('#6f94a4'), pitch: 2.4, floor: 3.4 } }], crown: { kind: 'parapet', height: 2, colour: hex('#b3bec2') } })
/** the Tour Mirabeau's offices, a fat stepped block (way/53447028, 50 m on a square of 73 m) and Le Village beside: a brown curtain over its ring */
export const fdsMirabeau = raised({ ...FDS, height: 50, roof: hex('#6d675a'), tiers: [{ to: 0.7, face: { kind: 'bands', wall: hex('#7c6e5b'), glass: hex('#37332f'), solid: 0.4, floor: 3.2 } }, { to: 1, inset: 5, face: { kind: 'bands', wall: hex('#7c6e5b'), glass: hex('#37332f'), solid: 0.4, floor: 3.2 } }] })

/**
 * LES OLYMPIADES (Michel Holley, 1969–77, on the Gare des Gobelins's goods yard): towers named for Olympic cities standing on a dalle over the lorries. Sandblasted precast panels on a 6 m module, ribbed in a hyperbolic section: from far off they're vertical stripes (fr.wikipedia). The bars are grids.
 */
const OLY: TowerSpec = {
  height: 104, roof: hex('#7f7a6f'),
  tiers: [{ to: 1, face: fins('#726d60', '#2b2e30', 3, 0.5, 0.55, 2.9) }],
  crown: { kind: 'parapet', height: 1.2, colour: hex('#a09a8a') },
  penthouse: 2,
}
export const olympiadesTower = raised(OLY)
export const olympiadesPale = raised({ ...OLY, tiers: [{ to: 1, face: fins('#8a8474', '#2f3233', 3, 0.5, 0.55, 2.9) }] })
export const olympiadesRust = raised({ ...OLY, tiers: [{ to: 1, face: fins('#6a5a4c', '#2c2a28', 3, 0.5, 0.55, 2.9) }] })
export const olympiadesBar = raised({ ...OLY, height: 52, tiers: [{ to: 1, face: { kind: 'punched', wall: hex('#a0998a'), glass: hex('#2b2e30'), pitch: 3, solid: 0.48, floor: 2.9, material: 'concrete' } }], penthouse: 0 })

/** LE TRIPODE (Ivry's edge; way/149277208; aerial 48.8224 2.3991): a Y of three identical arms, 60 m off its shadow, ribbon windows in cream panels: one of the odd shapes on the Périphérique. The Y is OSM's outline. */
export const tripode = raised({ height: 60, roof: hex('#6b6456'), tiers: [{ to: 1, face: { kind: 'bands', wall: hex('#9a8d72'), glass: hex('#3a3734'), solid: 0.5, floor: 3 } }], crown: { kind: 'parapet', height: 1.1, colour: hex('#a89b80') }, penthouse: 1 })

/**
 * THE MAINE-MONTPARNASSE's BASE (Beaudouin, Cassan, de Marien, Saubot, 1973; way/23936267): what the Tour stands on, a low long block in the tower's dark bronze curtain with a broad concrete fascia at each floor and a canopy over the shops along the Rue de l'Arrivée. OSM's massing is right, if tan, and it reads with the tower only if it's the tower's colour.
 */
export const maineMontparnasse = raised({
  height: 24, roof: hex('#5d5a52'),
  base: { height: 5.5, face: { kind: 'curtain', wall: hex('#45433e'), glass: hex('#3e4a50'), pitch: 3, floor: 5.5 }, canopy: { depth: 2.4, colour: hex('#2d2c2a') } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex('#55524a'), glass: hex('#2a2926'), solid: 0.42, floor: 4.5 } }],
  crown: { kind: 'parapet', height: 1, colour: hex('#68655c') },
})

/** The Front de Seine's heating-plant chimney (way/245189975, `man_made=chimney`, 130 m, 9 m across): the thin pale stick that stands over the towers from the Pont Mirabeau. A taper of concrete and its gallery. */
export function fdsChimney(out: MeshBuilder, fit: Fit): void {
  const H = Math.max(fit.height || 130, 100), C = hex('#94907f'), r = 4.2
  prism(out, 0, 0, 0, H * 0.9, r, 12, C, 0, 2.6, false)
  prism(out, 0, 0, H * 0.9, H, 2.6, 12, shade(C, 0.7), 0, 2.3, false)
  for (const y of [H * 0.45, H * 0.72, H * 0.97]) prism(out, 0, 0, y, y + 1, r - ((y / H) * 1.6) + 0.7, 12, shade(C, 1.08), 0)
  prism(out, 0, 0, H - 0.1, H, 2.3, 12, hex('#26282a'), 0)
}

/* -------------------------------------------------------------------------------------------- Les Olympiades's pagodas */

/**
 * LES PAGODES of the Olympiades (way/40690954… in OSM, `retail`, one level each): the Galerie du Mercure's sawtooth of tented roofs, meant to evoke a market's tents in hyperbolic paraboloid sheet (fr.wikipedia "Les Olympiades") and long since called pagodas. Aerial 48.8245 2.3650: their long
 * plum-brown roofs run 146 m along bearing 160 between the bars Rome and Grenoble. Local frame: x east, z north about the row's middle, drawn along its own axis. Each tent is square over its bay with its corners up and its ridges sagging, so a rider on the dalle sees a row of swept eaves.
 */
export function olympiadesPagodes(out: MeshBuilder, fit: Fit): void {
  const y = (fit.grade ?? 0) + 3.6, ROOF = hex('#5a3c3c'), RIB = hex('#83605a'), W = hex('#88847a'), G = hex('#343c40')
  const q = new MB()
  const n = 7, bay = 146 / n, hw = 15
  for (let k = 0; k < n; k++) {
    const c = -73 + (k + 0.5) * bay
    const x0 = c - bay / 2, x1 = c + bay / 2
    // the shop glass and the piers under the eave
    block(q, x0, x1, -hw + 1.2, hw - 1.2, y - 3.6, y, G)
    for (const z of [-hw + 1, hw - 1]) block(q, x0 - 0.3, x0 + 0.5, z - 0.3, z + 0.3, y - 3.6, y + 0.1, W)
    // the tent, four sagging facets to its point: a band at a time, its corners swept out and up
    const top = y + 8.4, m = 4
    const corner = (s: number, t: number): [number, number, number] => [c + s * bay * 0.5, y + 1.1, t * hw]
    const C = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)]
    for (let i = 0; i < 4; i++) {
      const A = C[i], B = C[(i + 1) % 4]
      for (let j = 0; j < m; j++) {
        const f0 = j / m, f1 = (j + 1) / m
        const at = (p: [number, number, number], f: number): [number, number, number] => {
          const sag = Math.sin(f * Math.PI) * 1.05
          return [p[0] + (c - p[0]) * f, p[1] + (top - p[1]) * f - sag, p[2] * (1 - f)]
        }
        const a0 = at(A, f0), b0 = at(B, f0), b1 = at(B, f1), a1 = at(A, f1)
        const ux = b0[0] - a0[0], uy = b0[1] - a0[1], uz = b0[2] - a0[2], vx = a1[0] - a0[0], vy = a1[1] - a0[1], vz = a1[2] - a0[2]
        let nn: [number, number, number] = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
        if (nn[1] < 0) nn = [-nn[0], -nn[1], -nn[2]]
        q.quad([a0, b0, b1, a1], nn, UV, shade(ROOF, 0.9 + hash(k, i + j) * 0.16), surfaceTag('metal'))
      }
      // the hip's rib
      const h = (f: number): [number, number, number] => [A[0] + (c - A[0]) * f, A[1] + (top - A[1]) * f - Math.sin(f * Math.PI) * 1.05 + 0.08, A[2] * (1 - f)]
      for (let j = 0; j < m; j++) {
        const a = h(j / m), b = h((j + 1) / m)
        q.quad([[a[0] - 0.14, a[1], a[2]], [a[0] + 0.14, a[1], a[2]], [b[0] + 0.14, b[1], b[2]], [b[0] - 0.14, b[1], b[2]]], [0, 1, 0], UV, RIB, 0)
      }
    }
    prism(q, c, 0, top - 0.3, top + 1.2, 0.5, 6, RIB, 0, 0.12)
    // the eave's fascia
    block(q, x0, x1, -hw - 0.25, -hw + 0.25, y + 0.5, y + 1.15, W)
    block(q, x0, x1, hw - 0.25, hw + 0.25, y + 0.5, y + 1.15, W)
  }
  // (along x in `q`; its axis runs on bearing 160, so turned 70° off east)
  placed(out, q, (70 * Math.PI) / 180, 0, 0)
}

