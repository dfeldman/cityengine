/**
 * TOUR EQHO, ex-Descartes (1988; reclad 2013, 131 m, 40 storeys). A long slab, ~66 × 30 m, its long axis running
 * WNW–ESE, with a half-cylinder scooped out of the middle of its north long face the full height (fr.wikipedia: "un
 * demi-cylindre aurait été extrudé"), and blank corners where the load-bearing pillars stand. It sits on a low podium
 * that fills the rest of OSM's relation ring (relation/3071645; outer ways only, no building:part).
 * Plan and heights from IGN LiDAR HD MNS (0.5 m), metres east/north of the ring's vertex mean (48.89231, 2.24688):
 * main roof 127 m, central plant 130 m above 49.9 m NGF; podium 15–21 m. BD TOPO h = 129.9; fr.wikipedia 131 m.
 * Skin (fr.wikipedia lead photo "Tour Eqho Février 2022"; OSM building:facade:color=#E0E0E0): PALE — silver-grey
 * glass under a light warm-grey band at every floor. The old restyle's gold trim was too strong; the bands are a faint
 * champagne at most.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { registerRing, type P2 } from '../museums/enframe.ts'
import { towerRing } from '../../tower.ts'
import { centroid, scaleAbout, skin, walls } from './tourAlto.ts'

type P = { x: number; z: number }

// tunables (E/N metres)
const EQHO_ROOF = 127
const EQHO_TOP = 130
const EQHO_HU = 33, EQHO_HV = 15        // half-length, half-width
const EQHO_NOTCH_R = 6.5, EQHO_NOTCH_U = -4 // the scooped half-cylinder on the north face
const EQHO_PODIUM_H = 16
const EQHO_LOBBY_H = 6                  // above the podium: a recessed glass storey
const EQHO_FLOOR = 3.1
const EQHO_GLASS = '#b8c3ca'            // silver-grey glass with sky in it
const EQHO_BAND = '#e2ded4'             // light warm grey (faint champagne)
const EQHO_PILLAR = '#c9cbc8'           // blank corner pillars
const EQHO_PODIUMC = '#9aa2a5'
const EQHO_ROOFC = '#8c9497'

// OSM's outer ring, E/N metres from (48.89231, 2.24688)
const OSM: P2[] = [[-55, -2], [-51, -4], [-50, -11], [-48, -17], [-44, -23], [-41, -27], [-43, -28], [-43, -29], [-39, -32], [-35, -35], [-31, -37], [-28, -39], [-26, -40], [-22, -41], [-17, -41], [-16, -26], [-12, -26], [-7, -25], [-2, -28], [6, -31], [12, -34], [20, -19], [21, -18], [28, -22], [30, -22], [31, -19], [32, -17], [32, -15], [33, -13], [33, -11], [34, -9], [34, -7], [34, -5], [34, -2], [34, 0], [34, 2], [34, 4], [33, 7], [33, 9], [32, 11], [31, 14], [31, 16], [30, 18], [29, 20], [28, 22], [27, 24], [25, 25], [24, 27], [23, 29], [22, 30], [20, 32], [18, 34], [17, 35], [15, 36], [13, 38], [11, 39], [9, 40], [7, 41], [-3, 20], [-7, 21], [-11, 22], [-16, 22], [-20, 21], [-21, 21], [-26, 23], [-40, 30], [-47, 15], [-46, 14], [-47, 12], [-48, 13]]

const area = (r: P[]): number => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z } return a }
const orient = (r: P[], sign: number): P[] => (Math.sign(area(r)) === Math.sign(sign) ? r : [...r].reverse())

/**
 * The slab's plan in the fit's own frame: the loader's ring for this relation varies (the Overpass cache gives a 46-point
 * partial outline), so the E/N registration is used only to tell which local side faces north; the slab is centred on
 * the footprint along its long axis (local x), the scoop on the north face.
 */
function slabPlan(north: number): P[] {
  const pts: P[] = [{ x: -EQHO_HU, z: -EQHO_HV }, { x: EQHO_HU, z: -EQHO_HV }, { x: EQHO_HU, z: EQHO_HV }]
  const N = 8
  for (let k = 0; k <= N; k++) {
    const th = (Math.PI * k) / N
    pts.push({ x: EQHO_NOTCH_U + EQHO_NOTCH_R * Math.cos(th), z: EQHO_HV - EQHO_NOTCH_R * Math.sin(th) })
  }
  pts.push({ x: -EQHO_HU, z: EQHO_HV })
  return north >= 0 ? pts : pts.map((p) => ({ x: p.x, z: -p.z }))
}

export function eqho(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(OSM, fit)
  const given = towerRing(fit), sense = area(given) >= 0 ? 1 : -1
  const H = fit.height > 115 && fit.height < 145 ? fit.height : EQHO_TOP
  const roof = H * (EQHO_ROOF / EQHO_TOP)
  // podium on OSM's own ring
  walls(out, given, 0, EQHO_PODIUM_H, hex(EQHO_PODIUMC))
  capPolygon(out, given, EQHO_PODIUM_H, hex(EQHO_PODIUMC), 0)
  const plan = orient(slabPlan(F.n([0, 1, 0])[2]), sense)
  const c = centroid(plan)
  walls(out, scaleAbout(plan, c, 0.96), EQHO_PODIUM_H, EQHO_PODIUM_H + EQHO_LOBBY_H, hex('#5d6a71'), undefined)
  skin(out, () => plan, EQHO_PODIUM_H + EQHO_LOBBY_H, roof, EQHO_FLOOR, 3.2, hex(EQHO_GLASS), hex(EQHO_BAND), 1.0, 0.16)
  // blank corner pillars: the four slab corners, 2.6 m each way, proud of the glass
  for (const i of [0, 1, 2, plan.length - 1]) {
    const p = plan[i], q = plan[(i + 1) % plan.length], o = plan[(i - 1 + plan.length) % plan.length]
    const dq = Math.hypot(q.x - p.x, q.z - p.z), dO = Math.hypot(o.x - p.x, o.z - p.z)
    const A = { x: p.x + ((q.x - p.x) / dq) * 2.6, z: p.z + ((q.z - p.z) / dq) * 2.6 }
    const B = { x: p.x + ((o.x - p.x) / dO) * 2.6, z: p.z + ((o.z - p.z) / dO) * 2.6 }
    const box = scaleAbout(orient([B, p, A, { x: A.x + B.x - p.x, z: A.z + B.z - p.z }], sense), centroid([B, p, A, { x: A.x + B.x - p.x, z: A.z + B.z - p.z }]), 1.06)
    walls(out, box, EQHO_PODIUM_H, roof + 1.2, hex(EQHO_PILLAR))
  }
  walls(out, plan, roof, roof + 1.2, hex(EQHO_BAND))
  capPolygon(out, plan, roof + 0.3, hex(EQHO_ROOFC), 0)
  const plant = scaleAbout(plan, c, 0.45)
  walls(out, plant, roof, H, hex('#b3b8b9'))
  capPolygon(out, plant, H, hex(EQHO_ROOFC), 0)
}
