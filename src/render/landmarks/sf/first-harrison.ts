/**
 * FIRST AND HARRISON, Rincon Hill — every building on the corner (the owner, 2026-10-07: "every building at this corner
 * should have a custom model … the sailor's union doesn't look great, and also it blocks the sidewalk"; "401/489
 * harrison actually has two unique huge towers"; "500 harrison is another").
 *
 *  - SAILORS' UNION OF THE PACIFIC, 450 Harrison (1950; way/260320985). Mapillary on First and Harrison: a cream
 *    concrete hall of four storeys — a solid ground storey, three continuous ribbons of steel windows above it, a
 *    flat parapet — and on Harrison its front: the rounded corner and the entrance face carried up in tall deep piers
 *    with dark glass between them, steps up to the doors, the union's name over them. OSM's outline runs its First
 *    Street face to the middle of the sidewalk; it is drawn 2.5 m back from there.
 *  - ONE RINCON HILL, 425 First (South Tower, 2008, 60 storeys, 195 m; way/944990390) and its North Tower on Harrison
 *    (2014, 50 storeys, 165 m; way/944990391, which OSM names "The Harrison"). Commons (South View 2015, North Tower
 *    East View 2015, 2021): sea-green glass ruled across by a balcony edge at every floor, a white concrete blade up
 *    the straight face standing clear of the roof, the curved face stepping in near the top, the South Tower crowned
 *    with a rounded glass drum.
 *  - Their PODIUM (way/260320982, the site outline): townhouses and lobbies, three storeys of pale stone and glass.
 *  - MODERA RINCON HILL, 500 Harrison / 390 First (2020; way/939497446). Mapillary: eight storeys of pale grey panel,
 *    the windows in tall dark-framed stacks two by two with dark spandrels, a few stacks folded out as shallow bays, a
 *    dark stone ground floor of shops (OSM's 12 levels is the Jasper's neighbouring count; the photographs show eight).
 *  - 511–515 HARRISON (way/288647263): a white three-storey industrial loft, big many-paned steel windows.
 *
 * Each standalone at its own centre with no turn: local x east, z north, the world outline less the centre.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygonWithHoles } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { faceBand, insetRing, type Face } from '../tower.ts'
import { sign } from '../signage.ts'
import { orientedBox, outward, walls, type P } from './ec4-podium.ts'

type W = [number, number][]
const area = (r: P[]): number => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z } return a / 2 }
const ccw = (r: P[]): P[] => (area(r) > 0 ? r : [...r].reverse())
const local = (w: W, c: P): P[] => ccw(w.map(([x, z]) => ({ x: x - c.x, z: z - c.z })))
/** the ring's edges whose outward normal lies within ~45° of (nx, nz) */
const facing = (r: P[], nx: number, nz: number): number[] => r.map((_, i) => i).filter((i) => { const o = outward(r, i); return o.x * nx + o.z * nz > 0.7 })
const others = (r: P[], not: number[]): number[] => r.map((_, i) => i).filter((i) => !not.includes(i))

// Harrison runs north-east (its faces look south-east or north-west); First runs south-east (faces look north-east or south-west)
const SE = [Math.SQRT1_2, -Math.SQRT1_2] as const
const NE = [Math.SQRT1_2, Math.SQRT1_2] as const

// ---------------------------------------------------------------- Sailors' Union of the Pacific
export const SU_C = { x: 1670, z: -717 }
const SU_W: W = [[1640.7, -718.1], [1667.2, -745], [1670.8, -741.5], [1671.8, -742.6], [1676.1, -738.4], [1676.5, -738.9], [1678.1, -738.3],
  [1680.7, -736.4], [1683.1, -734.2], [1685.1, -731.9], [1687.4, -728.3], [1687.5, -727.2], [1692, -722.7], [1693.9, -724.6], [1700.1, -718.5],
  [1694.5, -712.8], [1695.1, -712.2], [1690.2, -707.2], [1693.8, -703.6], [1681.1, -690.8], [1676.9, -695], [1670.7, -688.6]]
// (the First Street face drawn 2.5 m in: OSM's sits on the sidewalk's centre line)
for (const i of [0, 1]) { SU_W[i] = [SU_W[i][0] + 2.5 * NE[0], SU_W[i][1] + 2.5 * NE[1]] }

const CREAM: Rgb = [0.9, 0.87, 0.8]
const CREAM_SHADE: Rgb = [0.8, 0.77, 0.7]
const STEEL_GLASS: Rgb = [0.2, 0.23, 0.26]

export function sailorsUnionPacific(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const ring = local(SU_W, SU_C)
  const front = facing(ring, SE[0], SE[1])
  const rest = others(ring, front)
  const G = 4.2, TOP = 15.8, FRONT_TOP = 17.6
  // the hall: a solid ground storey, three ribbons of steel windows, a plain parapet
  faceBand(out, ring, 0, G, { kind: 'punched', wall: CREAM, glass: STEEL_GLASS, pitch: 3.4, floor: G, solid: 0.6, material: 'concrete' }, rest)
  faceBand(out, ring, G, TOP, { kind: 'bands', wall: CREAM, glass: STEEL_GLASS, floor: 3.86, solid: 0.5, material: 'concrete' }, rest)
  walls(out, ring, TOP, TOP + 1, CREAM, conc)
  walls(out, insetRing(ring, -0.08), G - 0.3, G, CREAM_SHADE, conc)
  // the Harrison front: tall deep piers the full height, dark glass between, standing a little higher
  faceBand(out, ring, 0, FRONT_TOP, { kind: 'fins', wall: CREAM, glass: STEEL_GLASS, pitch: 2.2, floor: FRONT_TOP, solid: 0.45, depth: 0.9, material: 'concrete' }, front)
  for (const i of front) {
    const a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i), L = Math.hypot(b.x - a.x, b.z - a.z)
    orientedBox(out, (a.x + b.x) / 2 + o.x * 0.5, FRONT_TOP + 0.4, (a.z + b.z) / 2 + o.z * 0.5, L / 2 + 0.3, 0.4, 0.55, (b.x - a.x) / L, (b.z - a.z) / L, CREAM, conc)
  }
  capPolygonWithHoles(out, [ring], TOP + 1, [0.62, 0.61, 0.58], 0)
  // the entrance: the longest front edge — steps up to the doors, the name over them
  const e = front.reduce((m, i) => { const L = (j: number): number => { const a = ring[j], b = ring[(j + 1) % ring.length]; return Math.hypot(b.x - a.x, b.z - a.z) }; return L(i) > L(m) ? i : m }, front[0])
  const a = ring[e], b = ring[(e + 1) % ring.length], o = outward(ring, e), L = Math.hypot(b.x - a.x, b.z - a.z)
  const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2
  const g = fit.groundAt ? Math.max(0, fit.groundAt(mx + o.x * 4, mz + o.z * 4)) : 0
  for (let k = 0; k < 4; k++) orientedBox(out, mx + o.x * (1.2 + (3 - k) * 0.45), g + (k + 0.5) * 0.17, mz + o.z * (1.2 + (3 - k) * 0.45), 3.4, (k + 0.5) * 0.17, 0.23, ux, uz, CREAM_SHADE, conc)
  orientedBox(out, mx + o.x * 0.95, g + 0.7 + 1.5, mz + o.z * 0.95, 1.6, 1.5, 0.05, ux, uz, [0.16, 0.14, 0.12], 0)
  sign(out, { type: 'flat', text: "SAILORS' UNION OF THE PACIFIC", h: 0.55, face: 'grotesque', colour: [0.25, 0.27, 0.32], lit: 'none' },
    { x: mx + o.x * 1.0, y: g + 5.2, z: mz + o.z * 1.0, heading: Math.atan2(o.x, o.z) })
}

// ---------------------------------------------------------------- One Rincon Hill
const SEA: Rgb = [0.32, 0.56, 0.56]
const SEA_DEEP: Rgb = [0.24, 0.44, 0.46]
const WHITE: Rgb = [0.93, 0.93, 0.91]
const balconies = (glass: Rgb): Face => ({ kind: 'bands', wall: [0.82, 0.86, 0.86], glass, floor: 3.2, solid: 0.14, material: 'metal' })

export const ORH_S_C = { x: 1746, z: -807 }
const ORH_S_W: W = [[1731.1, -806.9], [1733.6, -809.3], [1737.1, -812.6], [1740.9, -816.3], [1744.3, -819.5], [1746.5, -820.5], [1749.1, -821.6],
  [1751.1, -822], [1762.2, -810.6], [1758.3, -803.2], [1752.8, -796.7], [1748.2, -793.4], [1743.2, -791.3], [1739.2, -791.2], [1735.8, -791.8],
  [1733.6, -794], [1732.2, -797], [1731.9, -801], [1733.7, -804.8]]
export const ORH_N_C = { x: 1754, z: -731 }
const ORH_N_W: W = [[1737.6, -727.2], [1740.1, -731.8], [1743.3, -736.2], [1746, -739.1], [1750.9, -743.4], [1754.8, -744.8], [1757.9, -745.7],
  [1762.4, -745.7], [1765.6, -744.5], [1767.5, -741.7], [1768.2, -739.1], [1767.6, -733.9], [1767.5, -731.8], [1769.8, -728.9], [1767.4, -726.4],
  [1763.5, -722.6], [1754.4, -717.8], [1749.6, -715.2]]

function edgeLen(r: P[], i: number): number { const a = r[i], b = r[(i + 1) % r.length]; return Math.hypot(b.x - a.x, b.z - a.z) }

/** a One Rincon Hill tower over its own outline: lobby, balconied shaft, two setbacks, the white blade, a crown */
function rinconTower(out: MeshBuilder, ring: P[], H: number, crown: 'drum' | 'screen'): void {
  const metal = surfaceTag('metal'), conc = surfaceTag('concrete')
  const LOBBY = 8, S1 = H * 0.84, S2 = H * 0.93
  faceBand(out, ring, 0, LOBBY, { kind: 'curtain', wall: WHITE, glass: SEA_DEEP, pitch: 2.2, floor: LOBBY / 2, material: 'metal' })
  faceBand(out, ring, LOBBY, S1, balconies(SEA))
  capPolygonWithHoles(out, [ring], S1, [0.5, 0.52, 0.52], 0)
  const r2 = insetRing(ring, 1.6), r3 = insetRing(ring, 3.2)
  faceBand(out, r2, S1, S2, balconies(SEA))
  capPolygonWithHoles(out, [r2], S2, [0.5, 0.52, 0.52], 0)
  faceBand(out, r3, S2, H, balconies(SEA_DEEP))
  capPolygonWithHoles(out, [r3], H, [0.45, 0.47, 0.48], 0)
  // the white blade up the middle of the longest straight face, clear of the roof
  let e = 0
  for (let i = 1; i < ring.length; i++) if (edgeLen(ring, i) > edgeLen(ring, e)) e = i
  const a = ring[e], b = ring[(e + 1) % ring.length], o = outward(ring, e), L = edgeLen(ring, e)
  orientedBox(out, (a.x + b.x) / 2 + o.x * 0.35, (H + 12) / 2, (a.z + b.z) / 2 + o.z * 0.35, Math.min(2.4, L * 0.15), (H + 12) / 2, 0.45, (b.x - a.x) / L, (b.z - a.z) / L, WHITE, conc)
  // and white frames at the corners of the shaft
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i], turn = outward(ring, i).x * outward(ring, (i + ring.length - 1) % ring.length).x + outward(ring, i).z * outward(ring, (i + ring.length - 1) % ring.length).z
    if (turn < 0.5) box(out, p.x, S1 / 2, p.z, 0.35, S1 / 2, 0.35, WHITE, conc)
  }
  let cx = 0, cz = 0
  for (const p of r3) { cx += p.x; cz += p.z }
  cx /= r3.length; cz /= r3.length
  const rad = Math.min(...r3.map((p) => Math.hypot(p.x - cx, p.z - cz)))
  if (crown === 'drum') {
    // the rounded glass drum, a white rim round its top
    prism(out, cx, cz, H, H + 7, rad * 0.8, 24, SEA_DEEP, surfaceTag('glass'))
    prism(out, cx, cz, H + 7, H + 7.6, rad * 0.8 + 0.25, 24, WHITE, metal)
  } else {
    // a screen of white fins round the roof, the plant behind it
    faceBand(out, insetRing(r3, 0.3), H, H + 6, { kind: 'fins', wall: WHITE, glass: SEA_DEEP, pitch: 1.6, floor: 6, solid: 0.35, depth: 0.4, material: 'metal' })
  }
}

export function oneRinconSouth(out: MeshBuilder, _fit: Fit): void { rinconTower(out, local(ORH_S_W, ORH_S_C), 195, 'drum') }
export function oneRinconNorth(out: MeshBuilder, _fit: Fit): void { rinconTower(out, local(ORH_N_W, ORH_N_C), 165, 'screen') }

// ---------------------------------------------------------------- the podium round them
export const ORH_P_C = { x: 1738, z: -770 }
const ORH_P_W: W = [[1694.4, -771], [1702, -778.6], [1704.5, -776.2], [1715.1, -786.8], [1715.9, -786], [1718.7, -788.8], [1724.1, -794.2], [1724.8, -793.5],
  [1727.8, -796.5], [1725.7, -798.6], [1729, -801.9], [1727.9, -803], [1728.3, -804.2], [1731.1, -806.9], [1733.6, -809.3], [1737.1, -812.6],
  [1740.9, -816.3], [1744.3, -819.5], [1746.5, -820.5], [1749.1, -821.6], [1751.1, -822], [1755.4, -826.4], [1781.6, -800.5], [1751.5, -771.2],
  [1761.9, -760.9], [1755.9, -755.1], [1757.4, -753.6], [1759.5, -755.5], [1776.6, -738.1], [1773.4, -734.9], [1774.6, -733.6], [1769.8, -728.9],
  [1767.4, -726.4], [1763.5, -722.6], [1754.4, -717.8], [1749.6, -715.2], [1737.6, -727.2], [1730.9, -733.8], [1732.9, -735.2], [1717.5, -750.4],
  [1703.6, -764.2], [1702.4, -763]]
const STONE: Rgb = [0.84, 0.82, 0.77]

export function oneRinconPodium(out: MeshBuilder, _fit: Fit): void {
  const ring = local(ORH_P_W, ORH_P_C)
  // (not the walls the towers already draw on the same line: two coplanar walls fight)
  const tower = [...ORH_S_W, ...ORH_N_W].map(([x, z]) => ({ x: x - ORH_P_C.x, z: z - ORH_P_C.z }))
  const on = (p: P): boolean => tower.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 0.3)
  const edges = ring.map((_, i) => i).filter((i) => !(on(ring[i]) && on(ring[(i + 1) % ring.length])))
  const H = 11
  faceBand(out, ring, 0, 4.4, { kind: 'curtain', wall: STONE, glass: SEA_DEEP, pitch: 2.4, floor: 4.4, material: 'granite' }, edges)
  faceBand(out, ring, 4.4, H, { kind: 'punched', wall: STONE, glass: [0.22, 0.3, 0.32], pitch: 2.6, floor: 3.3, solid: 0.45, material: 'granite' }, edges)
  for (const i of edges) {
    const a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i), L = edgeLen(ring, i)
    if (L < 1) continue
    orientedBox(out, (a.x + b.x) / 2 + o.x * 0.25, 4.5, (a.z + b.z) / 2 + o.z * 0.25, L / 2, 0.12, 0.3, (b.x - a.x) / L, (b.z - a.z) / L, WHITE, surfaceTag('concrete'))
    orientedBox(out, (a.x + b.x) / 2 + o.x * 0.1, H + 0.5, (a.z + b.z) / 2 + o.z * 0.1, L / 2, 0.5, 0.15, (b.x - a.x) / L, (b.z - a.z) / L, STONE, surfaceTag('granite'))
  }
  // the roof is a planted deck
  capPolygonWithHoles(out, [ring], H, [0.34, 0.44, 0.3], 0)
}

// ---------------------------------------------------------------- Modera Rincon Hill
export const MOD_C = { x: 1628, z: -768.5 }
const MOD_W: W = [[1598.7, -766.4], [1630, -798], [1657, -769.9], [1625.6, -739.3]]
const PANEL: Rgb = [0.82, 0.82, 0.8]
const BRONZE: Rgb = [0.17, 0.16, 0.15]
const DARK_STONE: Rgb = [0.24, 0.24, 0.25]

export function moderaRinconHill(out: MeshBuilder, _fit: Fit): void {
  const ring = local(MOD_W, MOD_C)
  const G = 4.6, H = G + 7 * 3.1
  const panel = surfaceTag('concrete')
  // the dark stone ground floor of shops and the lobby
  faceBand(out, ring, 0, G, { kind: 'curtain', wall: DARK_STONE, glass: [0.2, 0.28, 0.3], pitch: 3.2, floor: G, material: 'granite' })
  // seven storeys of pale panel, the windows in dark-framed stacks two by two
  faceBand(out, ring, G, H, { kind: 'punched', wall: PANEL, glass: BRONZE, pitch: 2.1, floor: 3.1, solid: 0.42, material: 'concrete' })
  walls(out, insetRing(ring, -0.2), H, H + 0.9, PANEL, panel)
  capPolygonWithHoles(out, [insetRing(ring, -0.2)], H + 0.9, [0.55, 0.55, 0.54], 0)
  // a few stacks folded out as shallow bays, glazed down their faces
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i), L = edgeLen(ring, i), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
    for (const t of [0.2, 0.5, 0.8]) {
      const x = a.x + ux * L * t + o.x * 0.45, z = a.z + uz * L * t + o.z * 0.45
      orientedBox(out, x, (G + 0.4 + H) / 2, z, 1.5, (H - G - 0.4) / 2, 0.45, ux, uz, PANEL, panel)
      for (let f = 0; f < 7; f++) orientedBox(out, x + o.x * 0.47, G + 0.4 + f * 3.1 + 1.45, z + o.z * 0.47, 1.05, 1.1, 0.02, ux, uz, BRONZE, surfaceTag('glass'))
    }
  }
  // the corner on First and Harrison: a dark entrance under the bays
  const c = ring.reduce((m, p) => (p.x - p.z > m.x - m.z ? p : m), ring[0])
  box(out, c.x, G / 2, c.z, 1.2, G / 2, 1.2, DARK_STONE, surfaceTag('granite'))
}

// ---------------------------------------------------------------- 511–515 Harrison
export const H511_C = { x: 1672, z: -827.5 }
const H511_W: W = [[1646.4, -817.5], [1654.5, -825.6], [1654.3, -825.8], [1678.9, -850.2], [1680.6, -848.4], [1684.1, -851.9], [1695.5, -840.5],
  [1695.1, -840], [1697.7, -837.4], [1694.9, -834.6], [1692.3, -837.2], [1659.4, -804.5]]
const LOFT_WHITE: Rgb = [0.93, 0.93, 0.9]

export function harrison511(out: MeshBuilder, _fit: Fit): void {
  const ring = local(H511_W, H511_C)
  const H = 11.4, conc = surfaceTag('concrete')
  // three storeys of big many-paned steel windows between white piers
  faceBand(out, ring, 0, H, { kind: 'punched', wall: LOFT_WHITE, glass: [0.26, 0.3, 0.32], pitch: 4.4, floor: 3.8, solid: 0.28, material: 'concrete' })
  // the muntins: a grid of white bars across each window
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i), L = edgeLen(ring, i), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
    if (L < 5) continue
    for (let f = 0; f < 3; f++) for (const dy of [0.33, 0.66]) {
      const y = f * 3.8 + 3.8 * (0.14 + 0.72 * dy)
      orientedBox(out, (a.x + b.x) / 2 + o.x * 0.06, y, (a.z + b.z) / 2 + o.z * 0.06, L / 2 - 0.5, 0.03, 0.03, ux, uz, LOFT_WHITE, 0)
    }
  }
  walls(out, insetRing(ring, -0.15), H, H + 0.8, LOFT_WHITE, conc)
  capPolygonWithHoles(out, [insetRing(ring, -0.15)], H + 0.8, [0.6, 0.6, 0.58], 0)
}

export const FIRST_HARRISON: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  sailorsUnionPacific, oneRinconSouth, oneRinconNorth, oneRinconPodium, moderaRinconHill, harrison511,
}
