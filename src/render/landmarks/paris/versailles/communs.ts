import type { MeshBuilder } from '../../../buildings.ts'
import { hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { extrude, palette, type Pal, type Storey } from '../palaces/common.ts'
import { registerRing } from '../museums/enframe.ts'
import { PLANS } from './dependances-plan.ts'
import { church } from '../../church.ts'
import { pairOn, pedimentOn, rectOn } from '../palaces/common.ts'
import { box, prism } from '../../../models.ts'
import { dome } from '../../kit.ts'

/** the churches' pale Île-de-France limestone (the kit's limestone reads grey) */
const CHURCH_STONE = hex('#e3d8c0')
/** Saint-Louis's crossing dome: the drum's height over the ridge, the dome's radius as a share of the nave's half-width */
const CROSSING = { drum: 3, r: 0.55 }
/**
 * Saint-Louis's two-order front (owner's photograph, 2026-11-04): paired Doric columns across the lower order, four
 * columns (two pairs) on the frontispiece above under the pediment. Heights in metres; `centre` is the frontispiece's
 * half-width as a share of the front's; `proud` how far the order stands out of the front wall.
 */
/**
 * Saint-Louis's towers (owner's photograph): square, set back beside the frontispiece, rising one stage over the lower
 * order with a tall arched bell opening, a cornice, then a ribbed lead dome, a small lantern and a ball finial. `at` is
 * the centre's share of the front's half-width, `back` metres behind the front wall.
 */
const TOWERS = { at: 0.74, back: 5, w: 9.5, stage: [15.1, 27], dome: { r: 3.9, h: 3.6 }, lantern: [0.9, 2.6], ball: 0.6, spire: 4 }
const FRONT = { lower: [1.5, 13.5], entab: 1.6, upper: [15.1, 25.5], pedH: 5, centre: 0.3, proud: 1.2, r: 0.8, pairs: [0.32, 0.13, 0.6], light: 1.14, shadow: 0.78 }

/*
 * The château's dependencies round the Cour royale and the town (docs/landmarks/MODEL-VERSAILLES.md): each on its own OSM
 * footprint, extruded with its storeys and its roof. Tunables per building below; heights are from the literature and
 * photographs, not yet the lidar.
 */
interface Dep { stone: string; trim?: string; slate?: string; eaves: number; rise: number; inset: number; bay: number; win: number; storeys: Storey[]; dormers: boolean }

/** the Ailes des Ministres (Mansart, 1670s): two storeys of stone under a slate mansard, framing the Cour royale */
const MINISTRES: Dep = { stone: '#e6dac0', eaves: 11, rise: 3.6, inset: 1.6, bay: 3.8, win: 1.5, dormers: true,
  storeys: [{ y: 0, h: 3.2, sill: 0.5, arched: true }, { y: 5.4, h: 3.4, sill: 0.4 }] }
/** the Grand Commun (Mansart, 1684): brick with stone dressings, three storeys and a mansard round its court */
const COMMUN: Dep = { stone: '#a5543d', trim: '#e6dac0', eaves: 14, rise: 4, inset: 1.8, bay: 3.6, win: 1.4, dormers: true,
  storeys: [{ y: 0, h: 3.0, sill: 0.6, arched: true }, { y: 4.8, h: 2.8, sill: 0.4 }, { y: 9.2, h: 2.6, sill: 0.4 }] }
/** the Hôtel des Réservoirs (1752, for Mme de Pompadour): stone, three storeys and a mansard */
const RESERVOIRS: Dep = { stone: '#e4d8be', eaves: 13, rise: 3.6, inset: 1.6, bay: 3.6, win: 1.4, dormers: true,
  storeys: [{ y: 0, h: 3.0, sill: 0.6 }, { y: 4.6, h: 2.8, sill: 0.4 }, { y: 8.6, h: 2.6, sill: 0.4 }] }
/** the Orangerie (Mansart, 1686): one vaulted storey of huge arched windows, its roof the terrace's flat lawn */
const ORANGERIE: Dep = { stone: '#ddd0b4', eaves: 13, rise: 0.4, inset: 0.4, bay: 6.2, win: 3.6, dormers: false,
  storeys: [{ y: 0, h: 10, sill: 0.8, arched: true }] }

/** the Grande and Petite Écuries (Mansart, 1679–82) and the like: two storeys, the ground arched, round their courts */
const ECURIE: Dep = { stone: '#e3d6ba', eaves: 12, rise: 4, inset: 1.8, bay: 4, win: 1.6, dormers: true,
  storeys: [{ y: 0, h: 4.0, sill: 0.6, arched: true }, { y: 6.2, h: 3.2, sill: 0.4 }] }
/** a town hôtel of the court (the Chancellerie, the Guerre and Marine, the Affaires étrangères): stone, `n` storeys, mansard */
const hotel = (n: number, stone = '#e5d9bf'): Dep => ({ stone, eaves: 1 + n * 3.9, rise: 3.6, inset: 1.6, bay: 3.6, win: 1.4, dormers: true,
  storeys: Array.from({ length: n }, (_, i) => ({ y: i * 3.9, h: i === 0 ? 2.9 : 2.6, sill: 0.5 })) })
/** the Hôtel de ville (Legrand, 1900): Louis XIII revival, brick with stone dressings, three storeys under tall slate */
const MAIRIE: Dep = { ...COMMUN, eaves: 13, rise: 5 }
/** the Salle du Jeu de Paume (1686): a plain stone hall, its windows high under the eaves, a slate hip */
const PAUME: Dep = { stone: '#e2d5b9', eaves: 11, rise: 3.5, inset: 1.2, bay: 4.5, win: 2.0, dormers: false,
  storeys: [{ y: 6, h: 3.2, sill: 0.3 }] }

/** each OSM ref with a plan here, and the builder's dressing for it */
const BY_REF: Record<string, Dep> = {
  'relation/1172410': ECURIE, 'relation/1148863': ECURIE, 'relation/1148826': hotel(3), 'relation/1149004': hotel(3, '#e8dec8'),
  'relation/1148845': COMMUN, 'way/74622120': hotel(2), 'way/74625848': hotel(3), 'way/74627190': hotel(3),
  'way/74633639': hotel(4, '#e8dec8'), 'way/55697735': PAUME, 'way/74630181': MAIRIE,
}

/** a dependency drawn on its OSM plan with its courts, registered onto the fit */
function planned(out: MeshBuilder, fit: Fit, ref: string): void {
  const rings = PLANS[ref], d = BY_REF[ref]
  const F = registerRing(rings[0].map(([e, n]) => [e, n] as [number, number]), fit)
  const local = rings.map((r) => r.map(([e, n]) => F.xz(e, n)))
  const p: Pal = palette(d.stone, d.slate ?? '#3f474d')
  if (d.trim) { p.trim = hex(d.trim); p.deep = shade(hex(d.trim), 0.86) }
  extrude(out, local, p, { eaves: d.eaves, storeys: d.storeys, bay: d.bay, win: d.win, rise: d.rise, inset: d.inset, dormers: d.dormers })
}

/** the builder for a planned dependency: the entry's first OSM ref picks the plan (the loader passes only the fit) */
export const versaillesDependance = (ref: string) => (out: MeshBuilder, fit: Fit): void => planned(out, fit, ref)

function dep(out: MeshBuilder, fit: Fit, d: Dep): void {
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const p: Pal = palette(d.stone, d.slate ?? '#3f474d')
  if (d.trim) { p.trim = hex(d.trim); p.deep = shade(hex(d.trim), 0.86) }
  extrude(out, [ring], p, { eaves: d.eaves, storeys: d.storeys, bay: d.bay, win: d.win, rise: d.rise, inset: d.inset, dormers: d.dormers })
}

export const versaillesMinistres = (out: MeshBuilder, fit: Fit): void => dep(out, fit, MINISTRES)
export const versaillesGrandCommun = (out: MeshBuilder, fit: Fit): void => dep(out, fit, COMMUN)
export const versaillesReservoirs = (out: MeshBuilder, fit: Fit): void => dep(out, fit, RESERVOIRS)
export const versaillesOrangerie = (out: MeshBuilder, fit: Fit): void => dep(out, fit, ORANGERIE)

/** the planned dependencies by builder name, for the palaces' registry (the entries in palaces.json name them) */
export const VERSAILLES_DEPENDANCES = {
  versaillesGrandeEcurie: versaillesDependance('relation/1172410'),
  versaillesPetiteEcurie: versaillesDependance('relation/1148863'),
  versaillesEcuriesReine: versaillesDependance('relation/1148826'),
  versaillesRecollets: versaillesDependance('relation/1149004'),
  versaillesGrandCommunPlan: versaillesDependance('relation/1148845'),
  versaillesChancellerie: versaillesDependance('way/74622120'),
  versaillesGuerreMarine: versaillesDependance('way/74625848'),
  versaillesAffairesEtrangeres: versaillesDependance('way/74627190'),
  versaillesChefferieGenie: versaillesDependance('way/74633639'),
  versaillesJeuDePaume: versaillesDependance('way/55697735'),
  versaillesHotelDeVille: versaillesDependance('way/74630181'),
  versaillesMontansier, versaillesSaintLouis, versaillesNotreDame,
}

/** the Théâtre Montansier (Heurtier, 1777): a stone house of three storeys and a mansard on the Rue des Réservoirs */
export function versaillesMontansier(out: MeshBuilder, fit: Fit): void { dep(out, fit, hotel(3, '#e6dbc3')) }

/**
 * The Cathédrale Saint-Louis (Hardouin-Mansart de Sagonne, 1743–54): a Latin cross of pale stone, the two-storey front with
 * its pediment between twin towers under lanterns, the transept's arms, the apse.
 */
export function versaillesSaintLouis(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 7, storeys: 2, roof: 'gable', pitch: 'low' },
    aisles: { roof: 'lean-to' }, transept: { ends: 'projecting' }, chancel: { kind: 'apse' },
    tower: null,
    front: { kind: 'pediment', portal: 'triple', window: 'none', steps: 4 },
    walls: { material: 'limestone', openings: 'round', buttresses: 'none', colour: CHURCH_STONE },
    crossingDome: { drum: CROSSING.drum, r: CROSSING.r },
  })
  saintLouisFront(out, fit)

}

/** Notre-Dame de Versailles (Hardouin-Mansart, 1684–86), the court's parish: a pedimented two-order front, its towers domed */
export function versaillesNotreDame(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 6, storeys: 2, roof: 'gable', pitch: 'low' },
    aisles: { roof: 'lean-to' }, transept: { ends: 'flush' }, chancel: { kind: 'apse' },
    tower: { at: 'twin', stages: 2, plan: 'square', top: 'dome' },
    front: { kind: 'pediment', portal: 'triple', window: 'oculus', steps: 3 },
    walls: { material: 'limestone', openings: 'round', buttresses: 'none', colour: CHURCH_STONE },
  })
}

/** the columns, entablatures and pediment of Saint-Louis's front, drawn on its plane (local −z, the front) */
function saintLouisFront(out: MeshBuilder, fit: Fit): void {
  const F = FRONT, z = -fit.hz - F.proud, hx = fit.hx, c = shade(CHURCH_STONE, F.light), cw = hx * F.centre
  const back = shade(CHURCH_STONE, F.shadow)
  // the wall behind the orders in shadow, as the photograph has it, so the shafts read
  rectOn(out, '-z', -fit.hz, -hx * 0.68, hx * 0.68, F.lower[0], F.lower[1], back, 0.08)
  rectOn(out, '-z', -fit.hz, -cw, cw, F.upper[0], F.upper[1], back, 0.08)
  // the steps, the length of the front
  for (let k = 0; k < 4; k++) rectOn(out, '-z', -fit.hz - F.proud - 0.6 - k * 0.45, -hx * 0.75, hx * 0.75, 0, 0.3 * (4 - k), c, 0.45)
  // the lower order: a pair each side of the central portal, a pair at each side bay's outer edge
  for (const t of F.pairs) for (const s of [-1, 1]) pairOn(out, '-z', z, s * hx * t, F.lower[0], F.lower[1], F.r, c, 1.3)
  rectOn(out, '-z', z, -hx * 0.68, hx * 0.68, F.lower[1], F.lower[1] + F.entab, c, F.proud + 0.25)
  // the upper order on the frontispiece, and its pediment
  for (const s of [-1, 1]) pairOn(out, '-z', z, s * cw * 0.8, F.upper[0], F.upper[1], F.r * 0.9, c, 1.2)
  rectOn(out, '-z', z, -cw - 0.6, cw + 0.6, F.upper[1], F.upper[1] + F.entab, c, F.proud + 0.25)
  pedimentOn(out, '-z', z, -cw - 0.6, cw + 0.6, F.upper[1] + F.entab, F.pedH, 0.8, c)
  saintLouisTowers(out, fit, c, back)
}

function saintLouisTowers(out: MeshBuilder, fit: Fit, c: ReturnType<typeof hex>, dark: ReturnType<typeof hex>): void {
  const T = TOWERS, h = T.w / 2, lead = hex('#4a5257'), glass = hex('#24282b')
  for (const s of [-1, 1]) {
    const x = s * fit.hx * T.at, z = -fit.hz + T.back
    // the shaft up from the ground to the stage's top, then a cornice
    box(out, x, T.stage[1] / 2, z, h, T.stage[1] / 2, h, CHURCH_STONE)
    box(out, x, T.stage[1] + 0.35, z, h + 0.5, 0.35, h + 0.5, c)
    box(out, x, T.stage[0], z, h + 0.35, 0.3, h + 0.35, c)
    // a pilaster at each corner of the stage and the tall arched opening on each face
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(out, x + a * (h - 0.3), (T.stage[0] + T.stage[1]) / 2, z + b * (h - 0.3), 0.5, (T.stage[1] - T.stage[0]) / 2, 0.5, c)
    const oy = T.stage[0] + 2, oh = (T.stage[1] - T.stage[0]) * 0.62
    rectOn(out, '-z', z - h, x - 1.1, x + 1.1, oy, oy + oh, glass, 0.04)
    rectOn(out, '+z', z + h, x - 1.1, x + 1.1, oy, oy + oh, glass, 0.04)
    rectOn(out, '-x', x - h, z - 1.1, z + 1.1, oy, oy + oh, glass, 0.04)
    rectOn(out, '+x', x + h, z - 1.1, z + 1.1, oy, oy + oh, glass, 0.04)
    // the ribbed dome, its lantern and the ball and rod on top
    const y = T.stage[1] + 0.7
    prism(out, x, z, y, y + 0.9, T.dome.r, 8, dark)
    dome(out, x, z, y + 0.9, T.dome.r, T.dome.h, lead, 8, c)
    const ly = y + 0.9 + T.dome.h * 0.9
    prism(out, x, z, ly, ly + T.lantern[1], T.lantern[0], 8, c)
    dome(out, x, z, ly + T.lantern[1], T.lantern[0] * 1.1, T.lantern[0], lead, 8)
    const by = ly + T.lantern[1] + T.lantern[0]
    prism(out, x, z, by, by + T.ball * 2, T.ball, 8, lead, undefined, T.ball * 0.3)
    prism(out, x, z, by + T.ball * 2, by + T.ball * 2 + T.spire, 0.06, 4, lead)
  }
}
