/**
 * Le Large, the cultural district on the upstream point of the Île Seguin, Boulogne-Billancourt (2025–26, with the Hyde hotel; OSM way/1334545440,
 * the only building OSM draws there). From one aerial rendering supplied by the owner: glazed blocks in copper-bronze frames with dense vertical fins
 * and roof gardens on the downstream end, and a sculpted copper hall that swells up on the upstream point with a pale glass box on top of it.
 * Distance fidelity. Plan in metres east/north of 48.8335, 2.2700; the copper hall is the part west of SPLIT_E.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { ccwEN, registerRing, tools, type P2 } from '../museums/enframe.ts'

const PLAN: P2[] = [[-2335.4, -1264.9], [-2333.4, -1270.3], [-2324.5, -1284.2], [-2318.5, -1285.7], [-2310.7, -1282.3], [-2296.9, -1269.0], [-2289.4, -1267.9], [-2253.6, -1268.7], [-2246.9, -1262.0], [-2246.3, -1257.7], [-2321.9, -1240.1], [-2335.4, -1263.8]]

export const LE_LARGE = {
  SPLIT_E: -2302, // the copper hall west of this, the glazed blocks east
  H: 25, FIN: 2.2, FIN_D: 0.25, FIN_W: 0.3,
  PLINTH: 6, SLAB_D: 2.5, LOUVRE_LO: 14, LOUVRE_H: 5, CONCRETE: '#b4b2ac', LOUVRE: '#a4624a',
  HALL_LO: 16, HALL_HI: 27, HALL_POW: 0.8, // the hall's roof rises from LO at the split to HI at the point
  BOX_E: -2318, BOX_N: -1258, BOX_W: 12, BOX_D: 9, BOX_H: 5,
  GARDEN_INSET: 0.25, GARDEN_H: 0.6,
  FRAME: '#2e2622', GLASS: '#3c4448', FRAME_HOTEL: '#6e4a36', GLASS_HOTEL: '#4d5a62', COPPER: '#9c5a3c', COPPER_TOP: '#a8684a', ROOF: '#8e8c86', GARDEN: '#6f8a4a', BOX: '#dfe2dc',
}

/** the part of an anticlockwise ring with e on one side of x (keep >= x when east) */
const clip = (r: P2[], x: number, east: boolean): P2[] => {
  const out: P2[] = [], inside = (p: P2): boolean => (east ? p[0] >= x : p[0] <= x)
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length]
    if (inside(a)) out.push(a)
    if (inside(a) !== inside(b)) { const t = (x - a[0]) / (b[0] - a[0]); out.push([x, a[1] + t * (b[1] - a[1])]) }
  }
  return out
}

/** the hotel block's original look: bronze frame, a glass band per floor, close vertical fins */
const banded = (T: ReturnType<typeof tools>, ring: P2[], H: number, skipE = NaN): void => {
  const K = LE_LARGE, frame = hex(K.FRAME_HOTEL), glass = hex(K.GLASS_HOTEL)
  T.prism(ring, 0, H, frame, hex(K.ROOF), 6, 0.03)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 2 || (Math.abs(a[0] - skipE) < 0.01 && Math.abs(b[0] - skipE) < 0.01)) continue
    const ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, nx = uy, ny = -ux, o = 0.1
    const A: P2 = [a[0] + nx * o, a[1] + ny * o], B: P2 = [b[0] + nx * o, b[1] + ny * o]
    for (let y = 4.5; y + 2.5 < H; y += 3.6) T.wall(A, B, y, y + 2.5, glass)
    T.wall(A, B, 0.3, 4, glass)
    for (let s = 1.6; s < l - 0.5; s += 1.6) {
      const p: P2 = [a[0] + ux * s + nx * 0.5, a[1] + uy * s + ny * 0.5], q: P2 = [p[0] + ux * 0.25, p[1] + uy * 0.25]
      T.wall(p, q, 4, H - 0.3, frame)
    }
  }
}

/** Pathé-side look: bronze-framed glass over a ring: a glass band per floor and vertical fins; edges lying on e = skipE (a cut) get none */
const finned = (T: ReturnType<typeof tools>, office: P2[], H: number, skipE = NaN): void => {
  const K = LE_LARGE, frame = hex(K.FRAME), glass = hex(K.GLASS)
  T.prism(office, 0, H, frame, hex(K.ROOF), 6, 0.03)
  for (let i = 0; i < office.length; i++) {
    const a = office[i], b = office[(i + 1) % office.length], l = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (l < 2 || (Math.abs(a[0] - skipE) < 0.01 && Math.abs(b[0] - skipE) < 0.01)) continue
    const ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, nx = uy, ny = -ux, o = 0.1
    const A: P2 = [a[0] + nx * o, a[1] + ny * o], B: P2 = [b[0] + nx * o, b[1] + ny * o]
    // concrete plinth on the quay, a terrace slab, two glazed storeys, the copper louvre band, glazed floors above (Google Maps photo, Pathé side)
    T.wall(A, B, 0, K.PLINTH, hex(K.CONCRETE))
    const S: P2 = [a[0] + nx * K.SLAB_D, a[1] + ny * K.SLAB_D], E: P2 = [b[0] + nx * K.SLAB_D, b[1] + ny * K.SLAB_D]
    T.wall(S, E, K.PLINTH, K.PLINTH + 0.6, hex(K.CONCRETE))
    T.wall(A, B, K.PLINTH + 0.6, K.LOUVRE_LO, glass)
    const lh = Math.min(H, K.LOUVRE_LO + K.LOUVRE_H)
    T.wall([a[0] + nx * 0.3, a[1] + ny * 0.3], [b[0] + nx * 0.3, b[1] + ny * 0.3], K.LOUVRE_LO, lh, hex(K.LOUVRE), 2, 0.05)
    if (H > lh + 1) T.wall(A, B, lh, H - 0.4, glass)
    for (let s = K.FIN; s < l - 0.5; s += K.FIN) {
      const p: P2 = [a[0] + ux * s + nx * K.FIN_D, a[1] + uy * s + ny * K.FIN_D], q: P2 = [p[0] + ux * K.FIN_W, p[1] + uy * K.FIN_W]
      T.wall(p, q, K.PLINTH + 0.6, K.LOUVRE_LO, frame)
      if (H > lh + 1) T.wall(p, q, lh, H - 0.4, frame)
    }
  }
}

/** a copper hall over a ring whose roof rises from lo at e = from to hi at the far end */
const swell = (T: ReturnType<typeof tools>, ring: P2[], from: number, lo: number, hi: number, pow: number): ((e: number) => number) => {
  const far = ring.reduce((m, p) => (Math.abs(p[0] - from) > Math.abs(m - from) ? p[0] : m), from)
  const h = (e: number): number => lo + (hi - lo) * Math.pow(Math.min(1, Math.max(0, (e - from) / (far - from))), pow)
  T.prism(ring, 0, (e) => h(e), hex(LE_LARGE.COPPER), hex(LE_LARGE.COPPER_TOP), 4, 0.04)
  return h
}

export const leLarge = (out: MeshBuilder, fit: Fit): void => {
  const K = LE_LARGE, F = registerRing(PLAN, fit), T = tools(out, F), r = ccwEN(PLAN)
  const office = clip(r, K.SPLIT_E, true)
  banded(T, office, K.H, K.SPLIT_E)
  const cx = office.reduce((s, p) => s + p[0], 0) / office.length, cy = office.reduce((s, p) => s + p[1], 0) / office.length, k = 1 - K.GARDEN_INSET
  T.prism(office.map(([e, n]) => [cx + (e - cx) * k, cy + (n - cy) * k] as P2), K.H, K.H + K.GARDEN_H, hex(K.ROOF), hex(K.GARDEN))
  // the copper hall swelling toward the point
  const hi = swell(T, clip(r, K.SPLIT_E, false), K.SPLIT_E, K.HALL_LO, K.HALL_HI, K.HALL_POW)
  const bx = K.BOX_E, bn = K.BOX_N, w = K.BOX_W / 2, d = K.BOX_D / 2
  T.prism([[bx - w, bn - d], [bx + w, bn - d], [bx + w, bn + d], [bx - w, bn + d]], hi(bx + w) - 1, hi(bx) + K.BOX_H, hex(K.BOX), hex(K.ROOF))
}

/** RCR Arquitectes' main building of Le Large (OSM relation/18294091, "Large", layer 1): the C of offices, cinema and cultural centre west of the hotel */
const LARGE: P2[] = [[-2495.8, -1262.9], [-2481.7, -1269.4], [-2457.7, -1277.7], [-2433.4, -1282.8], [-2403.7, -1285.4], [-2364.5, -1284.2], [-2360.4, -1278.8], [-2353.1, -1281.3], [-2349.4, -1274.7], [-2353.2, -1273.0], [-2330.9, -1233.5], [-2359.8, -1217.4], [-2363.8, -1223.7], [-2371.2, -1229.8], [-2388.2, -1216.6], [-2420.1, -1193.0], [-2420.9, -1194.4], [-2431.8, -1186.4], [-2445.5, -1171.3], [-2457.0, -1193.3], [-2387.9, -1239.8], [-2403.2, -1246.0], [-2407.0, -1250.7], [-2408.4, -1264.0], [-2421.8, -1262.9], [-2419.8, -1245.6], [-2453.0, -1221.5], [-2470.8, -1217.8]]
const LARGE_COURT: P2[] = [[-2468.8, -1256.5], [-2459.4, -1240.0], [-2437.7, -1255.3], [-2438.6, -1265.2]]

export const LARGE_K = {
  H: 22, ARM_H: 28, ARM_N: -1215, // the northern arm stands taller
  COPPER_E: -2462, COPPER_LO: 20, COPPER_HI: 30, COPPER_POW: 0.7, // the copper hall on the downstream end
  COURT_H: 0.6,
}

export const leLargeMain = (out: MeshBuilder, fit: Fit): void => {
  const K = LARGE_K, F = registerRing(LARGE, fit), T = tools(out, F), r = ccwEN(LARGE)
  const body = clip(r, K.COPPER_E, true)
  const south = body.filter(() => true)
  finned(T, south, K.H, K.COPPER_E)
  // the taller northern arm
  const arm = ccwEN(body.filter(p => p[1] > K.ARM_N - 30 && p[0] > -2460 && p[0] < -2370))
  if (arm.length >= 3) finned(T, arm, K.ARM_H)
  swell(T, clip(r, K.COPPER_E, false), K.COPPER_E, K.COPPER_LO, K.COPPER_HI, K.COPPER_POW)
  T.prism(ccwEN(LARGE_COURT), K.H, K.H + K.COURT_H, hex(LE_LARGE.ROOF), hex(LE_LARGE.GARDEN))
}
