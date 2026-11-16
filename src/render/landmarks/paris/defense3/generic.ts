import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { d3, type D3Look } from './kit.ts'
import { canopy } from './small2.ts'
import { D3G_DATA } from './generic-data.ts'

/**
 * DEFENSE3 GENERIC (2026-11-16): every remaining OSM building of the La Défense core (unnamed, unmodelled) gets its own
 * builder + manifest entry (generated rows in generic-data.ts: kind, seed, canopy clear). A builder is a look by KIND with
 * a per-entry seeded variation of palette, bay and floor, so neighbours differ. No photo was taken; the palettes are the
 * Défense's usual ones. Heights are in the manifest (OSM height / levels x 3.2 / BD TOPO / typed default, noted per entry).
 * Everything tunable is a named constant here.
 */

const pick = <T,>(a: T[], s: number): T => a[Math.abs(s) % a.length]
const rnd = (s: number, k: number): number => { const x = Math.sin(s * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }

const STONE = ['#d9d2c0', '#d3cab6', '#dcd6c8', '#cfc7b4', '#e0d9c8', '#d6cdb8', '#c9c6bc']
const BRICK = ['#b98a6e', '#c49a78', '#a97d65', '#c7a98a', '#d2bfa0']
const CONCRETE = ['#bdbcb6', '#c4c3bf', '#b3b2ad', '#cbc9c2', '#a9a8a4']
const GLASS_WALL = ['#8b949a', '#9aa3a8', '#7f8a90', '#a8b0b4']
const GLASS = ['#7f98aa', '#6f8fa0', '#86a3b3', '#7d97a6', '#8fb0c0', '#6a7f8c']
const WIN = ['#6c7780', '#6f7a83', '#78858f', '#5d676e', '#7a8791']
const ROOF = ['#85837f', '#8a8a89', '#7c7e80', '#8d9094', '#80838a']
const ROOF_TILE = ['#8a6a58', '#7b6f66', '#6f6a66', '#8e6e5c']
const SHED_WALL = ['#a9a49a', '#b8b2a4', '#9fa3a4', '#c0bcb0']

export const D3G_KINDS: Record<string, (s: number) => D3Look> = {
  // apartment blocks: punched windows in stone, sometimes with a recessed top storey
  apt: (s) => ({
    face: { kind: 'punched', wall: pick(STONE, s), glass: pick(WIN, s >> 2), floor: 2.9 + rnd(s, 1) * 0.3, pitch: 2.1 + rnd(s, 2) * 0.8, solid: 0.5 + rnd(s, 3) * 0.12, depth: 0.45 },
    lobby: { h: 4, wall: '#a8a398', glass: '#4a5157' }, roof: pick(ROOF, s >> 1), parapet: { h: 0.8 },
    setbacks: rnd(s, 4) > 0.65 ? [{ at: 0.82, inset: 1.2 }] : undefined,
  }),
  // office blocks: ribbon windows or a glass grid
  office: (s) => rnd(s, 5) > 0.5
    ? { face: { kind: 'bands', wall: pick(CONCRETE, s), glass: pick(GLASS, s >> 1), floor: 3.4 + rnd(s, 1) * 0.3, solid: 0.4 + rnd(s, 3) * 0.12, depth: 0.3 }, lobby: { h: 4.5, wall: '#a9b0b4', glass: '#5d6f7a' }, roof: pick(ROOF, s), parapet: { h: 0.8 } }
    : { face: { kind: 'curtain', wall: pick(GLASS_WALL, s), glass: pick(GLASS, s >> 1), floor: 3.4 + rnd(s, 1) * 0.3, pitch: 1.3 + rnd(s, 2) * 0.4 }, lobby: { h: 4.5, wall: '#9aa3a8' }, roof: pick(ROOF, s), parapet: { h: 0.7 }, plant: 1 },
  // tall glass blocks (35 m and over)
  glass: (s) => ({ face: { kind: 'curtain', wall: pick(GLASS_WALL, s), glass: pick(GLASS, s >> 1), floor: 3.6, pitch: 1.4 + rnd(s, 2) * 0.3 }, lobby: { h: 5, wall: '#9aa3a8' }, roof: '#8a8c8e', parapet: { h: 0.9 }, plant: 1 }),
  // low commercial: shops, kiosks, pavilions
  shop: (s) => rnd(s, 6) > 0.45
    ? { face: { kind: 'curtain', wall: pick(CONCRETE, s), glass: pick(GLASS, s >> 1), floor: 4, pitch: 2 + rnd(s, 2) * 0.8 }, roof: pick(ROOF, s), parapet: { h: 0.4 } }
    : { face: { kind: 'punched', wall: pick(STONE, s), glass: pick(WIN, s >> 1), floor: 3.2, pitch: 3 + rnd(s, 2), solid: 0.7 }, roof: pick(ROOF, s), parapet: { h: 0.3 } },
  // houses: brick or render, tiled roof tone
  house: (s) => ({ face: { kind: 'punched', wall: rnd(s, 7) > 0.5 ? pick(BRICK, s) : pick(STONE, s), glass: pick(WIN, s >> 1), floor: 2.8, pitch: 2.4 + rnd(s, 2) * 0.6, solid: 0.6 }, roof: pick(ROOF_TILE, s), parapet: { h: 0.3 } }),
  // garages: blank-ish concrete with a few openings
  gar: (s) => ({ face: { kind: 'punched', wall: pick(CONCRETE, s), glass: '#3c4146', floor: 3.2, pitch: 3.6, solid: 0.85 }, roof: '#7b7d7e', parapet: 'none' }),
  // utility sheds and substations
  shed: (s) => ({ face: { kind: 'punched', wall: pick(SHED_WALL, s), glass: '#4a5157', floor: 4, pitch: 4, solid: 0.9 }, roof: '#6f7072', parapet: 'none' }),
}

export const D3G: Record<string, (out: MeshBuilder, fit: Fit) => void> = {}
for (const [name, [kind, seed, clear]] of Object.entries(D3G_DATA)) {
  if (kind === 'can') {
    D3G[name] = (out, fit) => canopy(out, fit, { clear: clear ?? 4, slab: pick(['#8d9094', '#9a9c9e', '#7f8386'], seed), fascia: pick(['#c9cbcc', '#b9bcbe', '#d6d4cf'], seed >> 1), post: '#6d7276' })
  } else D3G[name] = d3(D3G_KINDS[kind](seed))
}
