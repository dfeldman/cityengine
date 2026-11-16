import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, hex, type Rgb } from '../../kit.ts'
import { towerRing } from '../../tower.ts'
import { d3, type D3Look } from './kit.ts'

/**
 * DEFENSE3 SMALL2 (docs/landmarks/defense3-small2.tsv, 2026-11-16): the small and unheighted buildings of the
 * La Défense core — kiosks, pavilions, shop rows, open canopies, dalle structures, low offices. Looks are set from
 * Panoramax frames (tools/panoramax.py; contact sheets in the maker's scratch d3s2/). Heights: BD TOPO where it has one,
 * else building:levels × 3.2 m, else a default by type (recorded in defense3.json). Everything tunable is a named
 * constant. Not built (underground rooms, level < 0, indoor substation, slivers < 8 m²) are listed in the json notes
 * of the report, and simply left to the generic bake.
 */

type P2 = { x: number; z: number }

// ---- open canopy: a thin roof slab at a clear height on slim posts; nothing solid underneath -------------------------
export interface CanopyOpts {
  /** underside height, m (the clear height riders pass under) */
  clear: number
  /** slab thickness, m */
  thick?: number
  slab?: string
  fascia?: string
  post?: string
  /** target post spacing along the edges, m; interior grid at the same pitch for wide roofs */
  every?: number
  /** post half-width, m */
  postR?: number
  /** a second inset slab edge (a raised lip) of this height, m */
  lip?: number
}

const inside = (p: P2, ring: P2[]): boolean => {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a.z > p.z) !== (b.z > p.z) && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) c = !c
  }
  return c
}

/** Reusable: a roof slab over the footprint at `clear`..`clear+thick`, posts at the corners, along the edges and (wide roofs) in a grid. */
export function canopy(out: MeshBuilder, fit: Fit, o: CanopyOpts): void {
  const ring = towerRing(fit)
  const thick = o.thick ?? 0.35
  const every = o.every ?? 7
  const pr = o.postR ?? 0.16
  const slab = hex(o.slab ?? '#8d9094'), fascia = hex(o.fascia ?? '#c9cbcc'), post = hex(o.post ?? '#6d7276')
  const y0 = o.clear, y1 = o.clear + thick
  capPolygon(out, ring, y1, slab, 0)
  capPolygon(out, ring, y0, shadeRgb(slab, 0.8), 0)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) continue
    const n: [number, number, number] = [(b.z - a.z) / L, 0, -(b.x - a.x) / L]
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], n, [[0, 0], [1, 0], [1, 1], [0, 1]], fascia, 0)
    const k = Math.max(1, Math.round(L / every))
    for (let s = 0; s < k; s++) {
      const t = s / k
      // posts stand just inside the edge so they read as holding the slab
      const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t
      box(out, x - n[0] * pr * 1.5, y0 / 2, z - n[2] * pr * 1.5, pr, y0 / 2, pr, post, 0)
    }
  }
  // interior posts for a wide roof
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  const step = every * 1.3
  if (Math.min(x1 - x0, z1 - z0) > step * 1.5) {
    let n = 0
    for (let x = x0 + step; x < x1 - step * 0.6 && n < 40; x += step)
      for (let z = z0 + step; z < z1 - step * 0.6 && n < 40; z += step)
        if (inside({ x, z }, ring)) { box(out, x, y0 / 2, z, pr, y0 / 2, pr, post, 0); n++ }
  }
}
const shadeRgb = (c: Rgb, f: number): Rgb => [c[0] * f, c[1] * f, c[2] * f]
const cn = (o: CanopyOpts) => (out: MeshBuilder, fit: Fit): void => canopy(out, fit, o)


// ---- looks by type (tunable) ---------------------------------------------------------------------------------------
const DARK_LOOK: D3Look = { face: { kind: 'punched', wall: '#4a4440', glass: '#2d3236', floor: 3.2, pitch: 2.2, solid: 0.6 }, roof: '#6a6a6a' }
const RES_LOOK: D3Look = { face: { kind: 'punched', wall: '#d9cdb4', glass: '#6c7780', floor: 2.9, pitch: 2.6, solid: 0.55 }, roof: '#8a8580', parapet: { h: 0.5 } }
const LOW_LOOK: D3Look = { face: { kind: 'bands', wall: '#c4c3bf', glass: '#69767f', floor: 3.4, solid: 0.45 }, roof: '#8d8d8c', parapet: { h: 0.5 } }
const GLASS_LOOK: D3Look = { face: { kind: 'curtain', wall: '#8b949a', glass: '#7f98aa', floor: 3.5, pitch: 1.6 }, roof: '#8a8d90', parapet: { h: 0.4 } }
const SHED_LOOK: D3Look = { face: { kind: 'punched', wall: '#d8ccb0', glass: '#7a8288', floor: 3.2, pitch: 3.4, solid: 0.8 }, roof: '#7b6f66', parapet: { h: 0.3 } }
const CORE_LOOK: D3Look = { face: { kind: 'punched', wall: '#b9b8b3', glass: '#5d676e', floor: 3.2, pitch: 3, solid: 0.85 }, roof: '#8a8a89', parapet: { h: 0.3 } }


const d3s2_50027239 = d3(DARK_LOOK) // way/50027239
const d3s2_68850489 = cn({ clear: 3.85 }) // way/68850489
const d3s2_68850832 = cn({ clear: 6.55 }) // way/68850832
const d3s2_68851972 = cn({ clear: 3.65 }) // way/68851972
const d3s2_68852340 = d3(LOW_LOOK) // way/68852340
const d3s2_68852655 = d3(GLASS_LOOK) // way/68852655
const d3s2_81128838 = d3(SHED_LOOK) // way/81128838
const d3s2_81129010 = d3(SHED_LOOK) // way/81129010
const d3s2_82322699 = d3(RES_LOOK) // way/82322699
const d3s2_82322716 = d3(LOW_LOOK) // way/82322716
const d3s2_82322739 = d3(RES_LOOK) // way/82322739
const d3s2_82322899 = d3(LOW_LOOK) // way/82322899
const d3s2_82322929 = d3(LOW_LOOK) // way/82322929
const d3s2_82322978 = d3(LOW_LOOK) // way/82322978
const d3s2_82323003 = d3(LOW_LOOK) // way/82323003
const d3s2_82323025 = d3(RES_LOOK) // way/82323025
const d3s2_82323035 = d3(RES_LOOK) // way/82323035
const d3s2_82323039 = d3(RES_LOOK) // way/82323039
const d3s2_82323152 = d3(RES_LOOK) // way/82323152
const d3s2_82323213 = d3(RES_LOOK) // way/82323213
const d3s2_82323254 = d3(RES_LOOK) // way/82323254
const d3s2_82466944 = d3(LOW_LOOK) // way/82466944
const d3s2_82466964 = d3(LOW_LOOK) // way/82466964
const d3s2_82466969 = d3(GLASS_LOOK) // way/82466969
const d3s2_82466972 = d3(LOW_LOOK) // way/82466972
const d3s2_82467003 = d3(LOW_LOOK) // way/82467003
const d3s2_82467013 = d3(LOW_LOOK) // way/82467013
const d3s2_82467017 = d3(GLASS_LOOK) // way/82467017
const d3s2_82467020 = d3(LOW_LOOK) // way/82467020
const d3s2_82467025 = d3(LOW_LOOK) // way/82467025
const d3s2_82467030 = d3(LOW_LOOK) // way/82467030
const d3s2_82467037 = d3(LOW_LOOK) // way/82467037
const d3s2_82467042 = d3(GLASS_LOOK) // way/82467042
const d3s2_82467056 = d3(LOW_LOOK) // way/82467056
const d3s2_82467059 = d3(LOW_LOOK) // way/82467059
const d3s2_82467063 = d3(LOW_LOOK) // way/82467063
const d3s2_82467075 = d3(LOW_LOOK) // way/82467075
const d3s2_82467078 = d3(LOW_LOOK) // way/82467078
const d3s2_82467081 = d3(CORE_LOOK) // way/82467081
const d3s2_82467082 = d3(LOW_LOOK) // way/82467082
const d3s2_82467086 = d3(LOW_LOOK) // way/82467086
const d3s2_82467089 = d3(CORE_LOOK) // way/82467089
const d3s2_82486081 = d3(RES_LOOK) // way/82486081
const d3s2_82486095 = d3(CORE_LOOK) // way/82486095
const d3s2_82486269 = d3(LOW_LOOK) // way/82486269
const d3s2_82467018 = d3(CORE_LOOK) // way/82467018

const d3s2_226245904 = cn({ clear: 4, thick: 1 }) // way/226245904
const d3s2_226278448 = cn({ clear: 3.65 }) // way/226278448
const d3s2_226278449 = cn({ clear: 3.65 }) // way/226278449
const d3s2_244134030 = cn({ clear: 2.35 }) // way/244134030
const d3s2_244134033 = cn({ clear: 2.35 }) // way/244134033
const d3s2_334718417 = d3(LOW_LOOK) // way/334718417
const d3s2_334718421 = d3(LOW_LOOK) // way/334718421
const d3s2_334718422 = d3(RES_LOOK) // way/334718422
const d3s2_642579386 = d3(CORE_LOOK) // way/642579386
const d3s2_642579387 = cn({ clear: 2.65 }) // way/642579387
const d3s2_642579389 = d3(CORE_LOOK) // way/642579389
const d3s2_642579390 = cn({ clear: 4.95 }) // way/642579390
const d3s2_651001042 = d3(CORE_LOOK) // way/651001042
const d3s2_725892764 = d3(LOW_LOOK) // way/725892764
const d3s2_789623267 = cn({ clear: 4.15 }) // way/789623267
const d3s2_789623268 = cn({ clear: 4.15 }) // way/789623268
const d3s2_789623269 = cn({ clear: 4.15 }) // way/789623269
const d3s2_789623270 = d3(LOW_LOOK) // way/789623270
const d3s2_849832245 = d3(LOW_LOOK) // way/849832245
const d3s2_849832247 = d3(LOW_LOOK) // way/849832247
const d3s2_850122976 = d3(LOW_LOOK) // way/850122976
const d3s2_850466889 = cn({ clear: 3.65 }) // way/850466889
const d3s2_850519703 = cn({ clear: 3.65 }) // way/850519703
const d3s2_851585852 = cn({ clear: 6.65 }) // way/851585852
const d3s2_851585853 = d3(GLASS_LOOK) // way/851585853
const d3s2_852450683 = d3(LOW_LOOK) // way/852450683
const d3s2_852634174 = cn({ clear: 5.15 }) // way/852634174
const d3s2_1069791337 = d3(GLASS_LOOK) // way/1069791337
const d3s2_1077987996 = d3(GLASS_LOOK) // way/1077987996

export const SMALL2 = {
  d3s2_50027239, d3s2_68850489, d3s2_68850832, d3s2_68851972, d3s2_68852340, d3s2_68852655, d3s2_81128838, d3s2_81129010, d3s2_82322699, d3s2_82322716, d3s2_82322739, d3s2_82322899, d3s2_82322929, d3s2_82322978, d3s2_82323003, d3s2_82323025, d3s2_82323035, d3s2_82323039, d3s2_82323152, d3s2_82323213, d3s2_82323254, d3s2_82466944, d3s2_82466964, d3s2_82466969, d3s2_82466972, d3s2_82467003, d3s2_82467013, d3s2_82467017, d3s2_82467020, d3s2_82467025, d3s2_82467030, d3s2_82467037, d3s2_82467042, d3s2_82467056, d3s2_82467059, d3s2_82467063, d3s2_82467075, d3s2_82467078, d3s2_82467081, d3s2_82467082, d3s2_82467086, d3s2_82467089, d3s2_82486081, d3s2_82486095, d3s2_82486269, d3s2_82467018, d3s2_226245904, d3s2_226278448, d3s2_226278449, d3s2_244134030, d3s2_244134033, d3s2_334718417, d3s2_334718421, d3s2_334718422, d3s2_642579386, d3s2_642579387, d3s2_642579389, d3s2_642579390, d3s2_651001042, d3s2_725892764, d3s2_789623267, d3s2_789623268, d3s2_789623269, d3s2_789623270, d3s2_849832245, d3s2_849832247, d3s2_850122976, d3s2_850466889, d3s2_850519703, d3s2_851585852, d3s2_851585853, d3s2_852450683, d3s2_852634174, d3s2_1069791337, d3s2_1077987996,
}
