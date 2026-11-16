/**
 * L'Archipel (Nanterre, 2021, Jean-Paul Viguier with Marc Mimram; Vinci HQ; OSM way/639745597 tower, no parts): five
 * linked blocks over the RER tracks. The tower (R+25, 105.7 m per pss-archi) is a pale clear-glass box banded floor by
 * floor in white, on a tall glazed street-level hall, capped by a white plant screen. The low blocks (~41 m, pss-archi
 * A/B2/C) share the skin. Sources: viguier.com project page, pss-archi.eu FR-92050-54207, Commons photo Vinci_headquarters_at_Nanterre_-_2021-07-11.jpg.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'
import { registerRing, type P2 } from '../museums/enframe.ts'

const HEIGHT = 105.7
const LOBBY_H = 8
const BAND = '#dfe3e4', GLASS = '#a9b9c4', ROOF = '#a4a6a4', LOBBY = '#7d93a1', PARAPET = '#e6e8e6'
const FLOOR = 4.0, SOLID = 0.24, DEPTH = 0.45, PARAPET_H = 3.5
const TOP_INSET = 1.5, TOP_FROM = 0.88

/** OSM way/639745597 in east/north metres about (48.8973, 2.2265): the tower B1 plus the 42.7 m block B2 on one ring */
const RING_EN: P2[] = [[-38, -15], [-35, 9], [-42, 9], [-40, 28], [-32, 27], [7, 22], [5, 10], [17, 8], [19, 21], [77, 13], [71, -29],
  [17, -22], [17, -20], [4, -18], [3, -20], [2, -20]]
/** east coordinate splitting the tower (west, per Viguier's west overhang on V bipods) from B2; flip TOWER_WEST if wrong */
const SPLIT_E = 11, TOWER_WEST = true
const B2_HEIGHT = 42.7
const CROWN_DARK = '#7f8a92', STRUT = '#d9dcdc'

/** keep the part of ring with sign*(e - at) <= 0 (Sutherland-Hodgman on one vertical line) */
function clipE(ring: P2[], at: number, sign: number): P2[] {
  const out: P2[] = []
  const f = (p: P2): number => sign * (p[0] - at)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const fa = f(a), fb = f(b)
    if (fa <= 0) out.push(a)
    if ((fa < 0 && fb > 0) || (fa > 0 && fb < 0)) { const t = fa / (fa - fb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) }
  }
  return out
}

export const archipel = (out: MeshBuilder, fit: Fit): void => {
  const fr = registerRing(RING_EN, fit)
  const local = (r: P2[]): { x: number; z: number }[] => r.map(([e, n]) => fr.xz(e, n))
  const s = TOWER_WEST ? 1 : -1
  const towerFit: Fit = { ...fit, ring: local(clipE(RING_EN, SPLIT_E, s)), height: HEIGHT }
  const lowFit: Fit = { ...fit, ring: local(clipE(RING_EN, SPLIT_E, -s)), height: B2_HEIGHT }
  // B1: V-strut podium over the tracks, silver-grey glass grid, the top storeys in a darker grey glass band
  tower(out, towerFit, {
    height: HEIGHT, roof: hex(ROOF),
    base: { height: LOBBY_H, face: { kind: 'xbrace', wall: hex(STRUT), glass: hex(LOBBY), floor: LOBBY_H, pitch: 6, brace: 1 } },
    tiers: [
      { to: TOP_FROM, face: { kind: 'bands', wall: hex(BAND), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: DEPTH, material: 'metal' } },
      { to: 1, inset: TOP_INSET, face: { kind: 'curtain', wall: hex(CROWN_DARK), glass: hex(CROWN_DARK), floor: FLOOR, pitch: 1.5 } },
    ],
    crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'metal' },
  })
  archipelLow(out, lowFit)
}

/** The campus's low blocks (way/639745596, /639745598, /639745554; ~41 m): same banded skin. */
const LOW_HEIGHT = 42.7, LOW_LOBBY_H = 6

export const archipelLow = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: LOW_HEIGHT, roof: hex(ROOF),
  base: { height: LOW_LOBBY_H, face: { kind: 'curtain', wall: hex(BAND), glass: hex(LOBBY), floor: LOW_LOBBY_H, pitch: 3 } },
  tiers: [{ to: 1, face: { kind: 'bands', wall: hex(BAND), glass: hex(GLASS), floor: FLOOR, solid: SOLID, depth: DEPTH, material: 'metal' } }],
  crown: { kind: 'parapet', height: 1.5, colour: hex(PARAPET), material: 'metal' },
})
