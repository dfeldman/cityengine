/**
 * What each kind of exception is, by APUR's period (`p`: tools/paris-apur.ts PERIODS): one line of `civic()` a kind.
 * An entry in public/landmarks/paris/civic.json names one with its `kit` (tools/paris-civic.ts writes that file).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { church, type ChurchSpec } from '../../church.ts'
import type { Material } from '../../facade.ts'
import { civic, type CivicSpec } from './civic.ts'

/** (`word`, on a place of worship, is its faith: temple, synagogue, mosque, chapelle; a church has none) */
export interface KitArgs { kind: string; p: number; word?: string; seed?: number }

/** the building's materials and windows by its date: what the kinds share */
function byDate(p: number): Pick<CivicSpec, 'wall' | 'windows' | 'roof'> {
  if (p <= 2) return { wall: 'stone', windows: 'dressed', roof: 'slate' }
  if (p === 3 || p === 4) return { wall: 'brickStone', windows: 'segmental', roof: 'slate' }
  if (p === 5) return { wall: 'brick', windows: 'wide', roof: 'terrace' }
  if (p === 6 || p === 7 || p === 8) return { wall: 'concrete', windows: 'horizontal', roof: 'terrace' }
  if (p === 99) return { wall: 'render', windows: 'balanced', roof: 'terrace' }
  return { wall: 'render', windows: 'wide', roof: 'terrace' }
}

const grand = (p: number): Pick<CivicSpec, 'wall' | 'windows' | 'roof'> =>
  p <= 4 ? { wall: 'stone', windows: p <= 2 ? 'dressed' : 'segmental', roof: p <= 2 ? 'slate' : 'mansard' } : byDate(p)

const KINDS: Record<string, (p: number) => CivicSpec> = {
  ecole: (p) => ({ ...byDate(p), centre: 'door', flag: 1, storey: 4 }),
  lycee: (p) => ({ ...byDate(p), centre: p <= 5 ? 'frontispiece' : 'door', flag: 1, storey: 4.4 }),
  fac: (p) => ({ ...(p === 3 ? grand(p) : byDate(p)), centre: p <= 5 ? 'pediment' : 'door', storey: 4.6 }),
  hopital: (p) => ({ ...byDate(p), centre: p <= 5 ? 'pavilions' : 'door', storey: 3.9 }),
  hospice: (p) => ({ ...grand(p), centre: 'pediment', storey: 4.2 }),
  mairie: (p) => ({ ...grand(p), wall: p <= 5 ? 'stone' : byDate(p).wall, centre: p <= 5 ? 'pavilions' : 'door', flag: 2, storey: 5 }),
  ministere: (p) => ({ ...grand(p), centre: p <= 4 ? 'pediment' : 'door', flag: 2, storey: 4.8 }),
  hotel: (p) => ({ ...grand(p), wall: 'stone', windows: 'dressed', roof: 'mansard', centre: 'frontispiece', storey: 4.8 }),
  bibliotheque: (p) => ({ ...grand(p), windows: p <= 4 ? 'arched' : byDate(p).windows, centre: p <= 4 ? 'frontispiece' : 'door', storey: 5.2 }),
  caserne: (p) => ({ ...byDate(p), centre: 'frontispiece', flag: 1, storey: 4 }),
  poste: (p) => ({ ...byDate(p), centre: 'door', storey: 4.6 }),
  police: (p) => ({ ...byDate(p), centre: 'door', flag: 1, storey: 3.8 }),
  tribunal: (p) => ({ ...grand(p), centre: 'portico', flag: 1, storey: 5.5 }),
  salle: (p) => ({ ...grand(p), windows: p <= 4 ? 'arched' : 'horizontal', centre: 'frontispiece', storey: 5 }),
  equipement: (p) => ({ ...byDate(p), centre: 'door', storey: 4 }),
}

/**
 * A place of worship, by its date and its faith. What the parish churches share: the long nave on the footprint, one street
 * front on its short end, stone until 1914. Before 1800 the classical front (a pediment, a round window, no spire); the
 * nineteenth century's Gothic and Romanesque revivals, told apart by the seed, with a spire or a belfry over the door; brick
 * and a square tower between the wars; after 1945 a plain concrete hall. A temple or a synagogue has no tower.
 */
function eglise(p: number, seed: number, big: boolean, faith: string): ChurchSpec {
  const stone: Material = 'limestone'
  if (faith === 'temple' || faith === 'synagogue' || faith === 'mosque' || faith === 'chapelle') {
    return {
      nave: { bays: big ? 6 : 4, storeys: 1, roof: faith === 'chapelle' ? 'gable' : 'hip', pitch: 'low' }, aisles: null, transept: null, chancel: null, tower: null,
      front: { kind: faith === 'chapelle' ? 'gable' : 'pediment', portal: 'single', window: faith === 'synagogue' ? 'medallion' : 'oculus', steps: 2 },
      walls: { material: p >= 6 ? 'precast' : stone, openings: faith === 'chapelle' ? 'lancet' : 'round', buttresses: 'none' },
    }
  }
  if (p <= 2) {
    return {
      nave: { bays: big ? 7 : 5, storeys: big ? 2 : 1, roof: 'gable', pitch: 'moderate' }, aisles: big ? { roof: 'lean-to' } : null,
      transept: big ? { ends: 'flush' } : null, chancel: { kind: 'apse' },
      tower: seed % 3 === 0 ? { at: 'crossing', stages: 1, plan: 'octagon', top: 'dome' } : null,
      front: { kind: 'pediment', portal: big ? 'triple' : 'single', window: 'oculus', steps: 4 },
      walls: { material: stone, openings: 'round', buttresses: 'none' },
    }
  }
  if (p <= 4) {
    const gothic = seed % 2 === 0
    return {
      nave: { bays: big ? 8 : 6, storeys: big ? 2 : 1, roof: 'gable', pitch: gothic ? 'steep' : 'moderate' }, aisles: big ? { roof: 'lean-to' } : null,
      transept: big ? { ends: 'projecting' } : null, chancel: { kind: 'apse' },
      tower: { at: big && seed % 5 === 0 ? 'twin' : 'front-centre', stages: 3, plan: 'square', top: gothic ? 'spire' : 'belfry' },
      front: { kind: 'gable', portal: big ? 'triple' : 'single', window: gothic ? 'rose' : 'wheel', steps: 3 },
      walls: { material: stone, openings: gothic ? 'tracery' : 'round', buttresses: gothic ? 'stepped' : 'plain' },
    }
  }
  if (p === 5) {
    return {
      nave: { bays: 6, storeys: 1, roof: 'gable', pitch: 'moderate' }, aisles: null, transept: null, chancel: { kind: 'apse' },
      tower: { at: 'front-corner', stages: 3, plan: 'square', top: 'pyramid' },
      front: { kind: 'gable', portal: 'recessed', window: 'lancets', steps: 2 },
      walls: { material: seed % 2 ? 'brick' : 'dark-brick', openings: 'round', buttresses: 'plain' },
    }
  }
  return {
    nave: { bays: 5, storeys: 1, roof: 'flat', pitch: 'low' }, aisles: null, transept: null, chancel: null,
    tower: { at: 'detached', stages: 3, plan: 'square', top: 'flat' },
    front: { kind: 'plain', portal: 'recessed', window: 'none', steps: 1 },
    walls: { material: 'precast', openings: 'square', buttresses: 'none' },
  }
}

/** the registered builder: `{"procedural": "parisCivic", "kit": {"kind": "ecole", "p": 3}}` */
export function parisCivic(out: MeshBuilder, fit: Fit, a?: KitArgs): void {
  if (a?.kind === 'eglise') {
    church(out, fit, eglise(a.p, a.seed ?? 0, fit.hx * fit.hz * 4 > 1400, a.word ?? ''))
    return
  }
  const k = KINDS[a?.kind ?? 'equipement'] ?? KINDS.equipement
  civic(out, fit, { ...k(a?.p ?? 3), word: a?.word, seed: a?.seed })
}
