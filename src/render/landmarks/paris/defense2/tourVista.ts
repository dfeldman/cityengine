/**
 * Tour Vista (Puteaux, 1973 as Tour Horizon, re-clad 2007 by BDVA; 23 office storeys; OSM way/68850753, no parts): a
 * "tour-pont" standing over Boulevard Alexandre Soljenitsyne — its lower floors open over the road on legs — clad
 * full height in pale silver-blue glass bands. Sources: parisladefense.com tower page (1973, renovated 2007, BDVA);
 * pss-archi.eu forum quoting Batiactu 2006 (tour-pont, 23 office floors); the boulevard's line and level from the
 * game's own road graph (tools/at-point.ts). Height: 23 storeys at 3.4 m (no BD TOPO feature found at the point).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { stack, type Passage } from './damiers-kit.ts'
import type { P2 } from '../museums/enframe.ts'

const WALL = hex('#c3cad0'), GLASS = hex('#86a0b4'), ROOF = hex('#7b7f83'), LOBBY = hex('#3b4248')
const STOREYS = 23, FLOOR = 3.4, SOLID = 0.32
const RING: P2[] = [[-6117.6,2698.8],[-6123.8,2690.9],[-6101.1,2672.8],[-6093.8,2663.2],[-6097.0,2659.1],[-6103.1,2651.6],[-6112.1,2640.1],[-6117.0,2634.2],[-6104.6,2624.0],[-6099.6,2630.2],[-6090.8,2641.2],[-6084.6,2648.9],[-6083.2,2650.8],[-6081.2,2653.2],[-6070.3,2648.6],[-6057.1,2638.3],[-6050.9,2646.2],[-6062.8,2655.5],[-6063.1,2655.8],[-6067.2,2659.0],[-6072.9,2663.6],[-6085.6,2673.5],[-6088.2,2675.6],[-6094.8,2680.8]]
/** the boulevard under the bridge: road at -2.9 m, 6 m clear (tunable) */
const PASSAGES: Passage[] = [{ a: [-6110, 2660], b: [-6085, 2640], width: 16, floorA: -2.9, floorB: -2.9, clear: 6 }]

export const tourVista = (out: MeshBuilder, fit: Fit): void => stack(out, fit, {
  ring: RING, storeys: STOREYS, floor: FLOOR, solid: SOLID, wall: WALL, glass: GLASS, roof: ROOF,
  passages: PASSAGES, soffit: LOBBY, baseY: -4.6, lobby: { height: FLOOR, colour: LOBBY }, parapet: 1.5,
})
