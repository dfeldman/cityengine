/**
 * The Seine's FAMOUS boats, by their OSM name (PackedBoat carries only the name — a tag-free route until a bake
 * packs `kind`). Each is fitted to its own OSM footprint like any moored boat. Sources and confidence: the
 * research note of 2026-11-15 (positions from OSM; dimensions from the boats' own sites and Wikipedia; colours
 * partly from memory — tune here).
 *
 * A name maps to a bespoke builder, or to a library kind with its look pinned (a venue's colours, a tour boat).
 */
import { box, prism, wedge, EMIT, type Rgb } from '../models.ts'
import { BOX_HULL, DARK, GLASS, LIGHT, PENICHE_HULL, PLANT, PLANT2, SHIP_HULL, STEEL, TJALK_HULL, VARNISH, WHITE, F, flag, hull, parasol, planter, railing, rnd, stringLights, windows } from '../moored.ts'
import type { Builder, MooredKind } from './moored.ts'

const RED: Rgb = [0.72, 0.1, 0.09]
const CREAM: Rgb = [0.9, 0.87, 0.78]
const CONCRETE: Rgb = [0.62, 0.61, 0.58]

/** BATOFAR (Le Bateau Phare): the Irish lightship Osprey, 41 × 7.6 — a red ship's hull, the white lantern tower amidships. */
const batofar: Builder = (out, L, B) => {
  const y = 2.2
  hull(out, L, B, -0.5, y, SHIP_HULL, RED, WHITE, 0.25, [0.45, 0.35, 0.25])
  const h = L / 2
  for (const s of [-1, 1]) railing(out, s * (B / 2 - 0.25), y, -h + 3, h - 6, RED, 1.0)
  // the deckhouses fore and aft of the tower, white
  box(out, 0, y + 1.2, 6, B / 2 - 1.2, 1.2, 4, WHITE, F)
  windows(out, B / 2 - 1.2, y + 1.4, 2, 10, 0.6, 0.6, 1.4)
  box(out, 0, y + 1.0, -9, B / 2 - 1.4, 1.0, 3.5, WHITE, F)
  // the tower: a white lattice-ish column, a gallery, the lantern glazed and glowing, a dome
  prism(out, 0, 0, y, y + 8.5, 1.1, 8, WHITE, F, 0.8)
  prism(out, 0, 0, y + 8.5, y + 8.7, 1.7, 12, RED, F)
  prism(out, 0, 0, y + 8.7, y + 10.2, 1.0, 12, LIGHT, EMIT)
  for (let a = 0; a < 6; a++) box(out, Math.sin(a) * 1.0, y + 9.45, Math.cos(a) * 1.0, 0.05, 0.75, 0.05, RED, F)
  prism(out, 0, 0, y + 10.2, y + 11.2, 1.15, 12, RED, F, 0.1)
  prism(out, 0, 0, y + 11.2, y + 12, 0.04, 4, DARK, F)
  // BATOFAR in white on the hull: a long white board each side
  for (const s of [-1, 1]) box(out, s * (B / 2 + 0.02), y - 0.9, 0, 0.02, 0.35, 4, WHITE, F)
  return y
}

/** The ASILE FLOTTANT (Louise-Catherine), Le Corbusier's concrete coal barge of 1915, ~70 × 8: a grey box hull, a long cream block of square windows, a roof garden. */
const asile: Builder = (out, L, B) => {
  const y = 1.3
  hull(out, L, B, -0.5, y, BOX_HULL, CONCRETE, [0.7, 0.69, 0.66], 0.3, [0.5, 0.5, 0.48])
  const h = L / 2
  const z0 = -h + 4, z1 = h - 8
  box(out, 0, y + 1.3, (z0 + z1) / 2, B / 2 - 0.4, 1.3, (z1 - z0) / 2, CREAM, F)
  windows(out, B / 2 - 0.4, y + 1.5, z0, z1, 0.9, 0.9, 1.6)
  box(out, 0, y + 2.65, (z0 + z1) / 2, B / 2 - 0.3, 0.05, (z1 - z0) / 2 + 0.1, [0.75, 0.74, 0.7], F)
  // the bridge at the bow turned hanging garden: a raised deck on thin columns
  for (const x of [-1.5, 1.5]) for (const z of [z1 + 1, z1 + 5]) prism(out, x, z, y, y + 2.6, 0.12, 6, CREAM, F)
  box(out, 0, y + 2.65, z1 + 3, B / 2 - 0.6, 0.08, 3, CREAM, F)
  for (let z = z1 + 1; z < z1 + 6; z += 1.6) prism(out, (z % 2) - 0.5, z, y + 2.7, y + 4.2, 0.6, 6, PLANT, F, 0.2)
  for (let z = z0 + 2; z < z1 - 2; z += 6) planter(out, 0, y + 2.7, z, rnd(z | 0))
  return y
}

/** PETIT BAIN (Encore Heureux, 2011), 40 × 10.5: a floating building — a timber box, big glazed openings, a planted roof terrace under a greenhouse. */
const petitBain: Builder = (out, L, B) => {
  const r = rnd(7)
  const y = 1.0
  hull(out, L, B, -0.5, y, BOX_HULL, DARK, [0.3, 0.3, 0.3], 0.2, [0.45, 0.4, 0.33])
  const h = L / 2
  const timber: Rgb = [0.42, 0.3, 0.2]
  box(out, 0, y + 1.8, 0, B / 2 - 0.3, 1.8, h - 0.6, timber, F)
  for (let z = -h + 3; z < h - 2; z += 6) for (const s of [-1, 1]) box(out, s * (B / 2 - 0.27), y + 1.6, z, 0.03, 1.2, 1.8, GLASS, F)
  for (let z = -h + 0.6; z < h; z += 0.9) for (const s of [-1, 1]) box(out, s * (B / 2 - 0.26), y + 3.2, z, 0.04, 0.4, 0.04, [0.32, 0.22, 0.14], F)   // battens
  const ty = y + 3.65
  box(out, 0, ty, 0, B / 2 - 0.2, 0.05, h - 0.5, [0.48, 0.4, 0.3], F)
  // the roof: beds of grasses, a greenhouse at one end, rails
  for (let z = -h + 2; z < h - 10; z += 2.2) for (const s of [-1, 1]) prism(out, s * (B / 2 - 1.3), z, ty, ty + 0.5 + r() * 0.7, 0.75, 6, r() > 0.5 ? PLANT : PLANT2, F, 0.3)
  box(out, 0, ty + 1.3, h - 5.5, B / 2 - 0.8, 1.3, 4.5, GLASS, F)
  for (let z = h - 10; z <= h - 1; z += 1.5) box(out, B / 2 - 0.8, ty + 1.3, z, 0.04, 1.3, 0.04, WHITE, F)
  for (const s of [-1, 1]) railing(out, s * (B / 2 - 0.2), ty, -h + 0.6, h - 0.6, DARK)
  stringLights(out, [-B / 2 + 0.3, ty + 2.2, -h + 1], [-B / 2 + 0.3, ty + 2.2, h - 10], 14)
  return y
}

/** LA DAME DE CANTON, a junk built in Canton, 25 × 7: dark teak, a high round stern castle, two masts with red battened sails furled, painted eyes. */
const dameDeCanton: Builder = (out, L, B) => {
  const y = 1.1
  hull(out, L, B, -0.4, y, { ...TJALK_HULL, sheer: 1.4, sternSheer: 2.4, bow: 5, stern: 4 }, [0.32, 0.18, 0.1], RED, 0.35, VARNISH)
  const h = L / 2
  // the stern castle: stepped up, red with gold trim, its windows red-framed
  box(out, 0, y + 1.6, -h + 3.5, B / 2 - 0.6, 1.6, 2.5, RED, F)
  box(out, 0, y + 3.3, -h + 3.5, B / 2 - 0.4, 0.1, 2.8, [0.85, 0.65, 0.2], F)
  wedge(out, 0, y + 3.7, -h + 3.5, B / 2 - 0.6, 0.3, 2.5, 1.2, [0.3, 0.16, 0.08], F)
  // the deckhouse amidships
  box(out, 0, y + 1.15, 0, B / 2 - 1.2, 1.15, 4, [0.55, 0.12, 0.1], F)
  windows(out, B / 2 - 1.2, y + 1.3, -4, 4, 0.6, 0.7, 1.4, [0.85, 0.65, 0.2])
  wedge(out, 0, y + 2.5, 0, B / 2 - 0.9, 0.2, 4.3, 0.8, [0.3, 0.16, 0.08], F)
  // the masts with their sails: tall fans of red-brown battened cloth, half lowered
  for (const [z, H] of [[5, 13], [-4.5, 10]] as const) {
    prism(out, 0, z, y, y + H, 0.15, 6, VARNISH, F, 0.1)
    box(out, 0.15, y + H * 0.62, z - 1.2, 0.04, H * 0.3, 2.2, [0.62, 0.22, 0.12], F)
    for (let k = 0; k < 6; k++) box(out, 0.2, y + H * 0.35 + k * H * 0.1, z - 1.2, 0.04, 0.04, 2.3, VARNISH, F)
  }
  // the eyes on the bow
  for (const s of [-1, 1]) {
    box(out, s * 1.95, y + 0.7, h - 2.4, 0.03, 0.35, 0.45, WHITE, F)
    box(out, s * 1.98, y + 0.7, h - 2.35, 0.03, 0.18, 0.2, DARK, F)
  }
  for (let z = -1; z < 4; z += 1.6) box(out, B / 2 - 0.6, y + 2.2, z, 0.15, 0.3, 0.15, [0.9, 0.15, 0.1], EMIT)   // lanterns
  return y
}

/** OFF PARIS SEINE, the floating hotel, 82 × 20 on twin hulls: two long two-storey wings of rooms, glass between, a pool on the deck. */
const offParisSeine: Builder = (out, L, B) => {
  const y = 1.0
  const h = L / 2
  hull(out, L, B, -0.5, y, BOX_HULL, [0.85, 0.85, 0.83], [0.3, 0.3, 0.32], 0.15, [0.5, 0.42, 0.32])
  for (const s of [-1, 1]) {
    const x = s * (B / 2 - 2.6)
    box(out, x, y + 2.8, -2, 2.4, 2.8, h - 6, [0.92, 0.92, 0.9], F)
    for (const yy of [y + 1.4, y + 4.2]) for (let z = -h + 5; z < h - 9; z += 2.2) box(out, x + s * 2.42, yy, z + 1.1, 0.03, 0.75, 0.8, GLASS, F)
    for (let z = -h + 5; z < h - 8; z += 2.2) box(out, x + s * 2.42, y + 2.8, z, 0.03, 2.6, 0.06, [0.3, 0.25, 0.2], F)
  }
  box(out, 0, y + 0.1, 4, B / 2 - 5.2, 0.05, 8, [0.25, 0.6, 0.72], F)
  box(out, 0, y + 2.2, -h + 6, B / 2 - 5.2, 2.2, 4, GLASS, F)
  for (let z = -h + 18; z < h - 10; z += 4) parasol(out, 0, y, z, rnd(z | 0))
  return y
}

/** FLUCTUART, the floating street-art centre, ~40 × 11.4 on three levels: a dark modular box, glass bays, painted panels, a roof bar. */
const fluctuart: Builder = (out, L, B) => {
  const r = rnd(11)
  const y = 0.9
  hull(out, L, B, -0.5, y, BOX_HULL, DARK, [0.25, 0.25, 0.27], 0.15, [0.4, 0.4, 0.4])
  const h = L / 2
  box(out, 0, y + 2.4, 0, B / 2 - 0.3, 2.4, h - 1, [0.14, 0.14, 0.15], F)
  const tags: Rgb[] = [[0.9, 0.3, 0.5], [0.2, 0.6, 0.9], [0.95, 0.8, 0.15], [0.3, 0.75, 0.4], [0.95, 0.95, 0.95], [0.9, 0.35, 0.1]]
  for (let z = -h + 2; z < h - 2; z += 2.4) for (const s of [-1, 1]) {
    if (r() > 0.45) box(out, s * (B / 2 - 0.27), y + 1.2 + r() * 2.4, z, 0.03, 0.4 + r() * 0.8, 0.6 + r() * 0.6, tags[Math.floor(r() * tags.length)], F)
    else box(out, s * (B / 2 - 0.27), y + 2.4, z, 0.03, 1.6, 1.0, GLASS, F)
  }
  const ty = y + 4.85
  box(out, 0, ty, 0, B / 2 - 0.2, 0.05, h - 0.8, [0.45, 0.4, 0.33], F)
  for (const s of [-1, 1]) railing(out, s * (B / 2 - 0.2), ty, -h + 1, h - 1, WHITE)
  box(out, 0, ty + 1.3, -h + 5, B / 2 - 2, 1.3, 3, [0.15, 0.35, 0.6], F)
  for (let z = -h + 10; z < h - 3; z += 3.5) parasol(out, (r() - 0.5) * 4, ty, z, r)
  return y
}

/** ANNETTE K, 108 × 16.7: the sports barge — a long low hall, a deck bar and beer garden on the roof. */
const annetteK: Builder = (out, L, B) => {
  const y = 1.1
  hull(out, L, B, -0.5, y, PENICHE_HULL, [0.2, 0.22, 0.26], WHITE, 0.25, [0.5, 0.45, 0.38])
  const h = L / 2
  box(out, 0, y + 2.2, -6, B / 2 - 0.6, 2.2, h - 14, [0.88, 0.88, 0.86], F)
  windows(out, B / 2 - 0.6, y + 2.4, -h + 8, h - 20, 2.4, 3.2, 4, GLASS)
  const ty = y + 4.45
  box(out, 0, ty, -6, B / 2 - 0.4, 0.05, h - 13.8, [0.5, 0.42, 0.32], F)
  for (const s of [-1, 1]) railing(out, s * (B / 2 - 0.4), ty, -h + 8, h - 20, DARK)
  for (let z = -h + 12; z < h - 22; z += 4) parasol(out, (z % 8 === 0 ? 3 : -3), ty, z, rnd(z | 0))
  for (let z = h - 18; z < h - 4; z += 3) planter(out, 0, y, z, rnd(z | 0))
  return y
}

/** A floating STATION (Brigade fluviale, Centre de Secours La Monnaie): a pontoon carrying a two-storey station, a launch alongside. */
const station = (fire: boolean): Builder => (out, L, B, seed) => {
  const y = 0.9
  hull(out, L, B, -0.5, y, BOX_HULL, [0.3, 0.32, 0.34], fire ? RED : [0.15, 0.25, 0.5], 0.2, [0.45, 0.45, 0.45])
  const h = L / 2
  const bw = Math.min(B / 2 - 0.8, 3.2)
  box(out, -B / 2 + bw + 0.4, y + 2.6, -h * 0.3, bw, 2.6, h * 0.55, fire ? CREAM : WHITE, F)
  windows(out, bw, y + 1.5, -h * 0.85, h * 0.25, 0.8, 1.0, 2, GLASS)
  box(out, -B / 2 + bw + 0.4, y + 5.25, -h * 0.3, bw + 0.2, 0.06, h * 0.55 + 0.2, fire ? RED : [0.15, 0.25, 0.5], F)
  flag(out, -B / 2 + 1, y + 5.3, -h * 0.3, 2.5, [[0.1, 0.25, 0.6], [0.95, 0.95, 0.95], [0.8, 0.12, 0.15]])
  for (const s of [-1, 1]) railing(out, s * (B / 2 - 0.1), y, -h + 0.3, h - 0.3, STEEL)
  // a launch tied alongside, on the open side of the deck
  for (let z = h * 0.35; z < h - 1; z += 2.2) box(out, B / 2 - 1.2, y + 0.3, z, 0.25, 0.3, 0.25, fire ? RED : [0.15, 0.25, 0.5], F)
  void seed
  return y
}

/** the floating gardens at the Bateaux-Mouches' pier (L'île aux oiseaux, L'île prairie …): low planted rafts */
const ilot: Builder = (out, L, B, seed) => {
  const r = rnd(seed)
  const y = 0.4
  hull(out, L, B, -0.3, y, BOX_HULL, [0.35, 0.3, 0.25], null, 0, [0.35, 0.42, 0.25])
  for (let i = 0; i < (L * B) / 6; i++) prism(out, (r() - 0.5) * (B - 1), (r() - 0.5) * (L - 1), y, y + 0.4 + r() * 1.8, 0.4 + r() * 0.6, 6, r() > 0.5 ? PLANT : PLANT2, F, 0.15)
  return y
}

export interface Named { re: RegExp; build?: Builder; kind?: MooredKind; seed?: number; skip?: boolean; hut?: boolean }

export const NAMED_BOATS: Named[] = [
  { re: /Joséphine Baker/i, skip: true },                       // a landmark of its own (museums/piscine-josephine-baker.ts)
  { re: /Bateau phare|Batofar/i, build: batofar },
  { re: /Asile Flottant|Louise.Catherine/i, build: asile },
  { re: /^Petit Bain$/i, build: petitBain },
  { re: /Dame De Canton/i, build: dameDeCanton },
  { re: /Off Paris Seine/i, build: offParisSeine },
  { re: /Fluctuart/i, build: fluctuart },
  { re: /Annette K/i, build: annetteK },
  { re: /Brigade fluviale/i, build: station(false) },
  { re: /Centre de Secours/i, build: station(true) },
  { re: /^L'île /i, build: ilot },
  { re: /Bateaux parisiens|Bateaux.Mouches|Vedettes/i, kind: 'tourBoat' },
  { re: /Concorde Atlantique|Rosa Bonheur|Flow|Calife|Balle au Bond|Nouvelle Seine|Marcounet|Maquereaux|Pélican|El Alamein|Nix Nox|Mazette|Café Barge|Escale Bleue|Baleine Blanche|Péniche B2|Barge|River|Bateau Ivre|Antipode|Bistrot|Maison Jaune|Quai de la photo|Péniche/i, kind: 'venue' },
  { re: /Ponton/i, kind: 'pontoon' },
]

export const namedBoat = (name: string | undefined): Named | undefined => name ? NAMED_BOATS.find((n) => n.re.test(name)) : undefined
