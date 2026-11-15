/** Builds every Paris fleet kind, moored kind and big ship once, headless, and prints its size and triangle count: npx tsx tools/fleet-check.ts */
import { MeshBuilder } from '../src/render/buildings.ts'
import { PARIS_FLEET } from '../src/render/paris/boats.ts'
import { MOORED, MOORED_SIZES, type MooredKind } from '../src/render/paris/moored.ts'
import { containerShip, cruiseShip, SHIP_SIZES } from '../src/render/ships.ts'
for (const k of new Set(PARIS_FLEET)) { const o = new MeshBuilder(); const d = k.build(o, 11); console.log('fleet', k.name, d.L.toFixed(1), d.B.toFixed(1), o.indices.length / 3) }
for (const k of Object.keys(MOORED) as MooredKind[]) { const o = new MeshBuilder(); const z = MOORED_SIZES[k]; MOORED[k](o, z.L[1], z.B, 3); console.log('moored', k, o.indices.length / 3) }
for (const [k, z] of Object.entries(SHIP_SIZES)) { const o = new MeshBuilder(); (k.startsWith('cruise') || k === 'expedition' ? cruiseShip : containerShip)(o, z.L, z.B, 5); console.log('ship', k, o.indices.length / 3) }
