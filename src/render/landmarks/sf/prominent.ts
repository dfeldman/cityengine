/**
 * PROMINENT TOWERS the city still drew from its generic styles (appearance pass, 2026-10-02 — the tallest unmodelled
 * buildings, found by scanning the package for height over 50 m with no model). Each from a Mapillary frame, built
 * with the tower kit: what a rider reads from the street is the material, the window rhythm and the top.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, faceBand } from '../tower.ts'
import { capPolygon } from '../../buildings.ts'
import { sign } from '../signage.ts'
import { boxAlong, edgeAt, offsetRing } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'

/** THE ST. REGIS MUSEUM TOWER's tower, 125 Third Street (SOM, 2005; 42 storeys, 148 m — OSM's part way/436648187): a
 *  slender shaft in a pale precast grid of deep punched windows, the base dressed in warm stone, a plain flat top with
 *  a thin cap. Built 2026-10-02 as "the Paramount" from a Mapillary frame taken HERE, on Third at Mission — the
 *  Paramount is the terracotta Deco tower at 680 Mission, way/160673823 (fidi-3.ts `paramount`), and the two entries
 *  shared one registry key, so both towers were drawn as this one (owner: z-fighting at 37.786342, -122.401152). */
export function stRegisTower(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 148 }, {
    height: 148,
    base: { height: 12, face: { kind: 'curtain', wall: [0.62, 0.52, 0.42], glass: [0.22, 0.25, 0.28], pitch: 3.2, floor: 6, material: 'granite' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.86, 0.84, 0.78], glass: [0.28, 0.32, 0.36], pitch: 2.0, floor: 2.9, solid: 0.45, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.4, colour: [0.82, 0.8, 0.74], material: 'concrete' },
  })
}

/** THE GLASS CUBE at Market and Montgomery, beside 44 Montgomery (way/148710871, the Fidelity Investments pavilion):
 *  three storeys of green-tinted glass in tall thin mullions, a dark green band at the first floor, the name on it.
 *  The owner, 2026-10-02: "i always see [it] when i'm in person because of the unique glass cube". It was not drawn at
 *  all: a part of 44 Montgomery's outline, it went with the tower's claim. */
export function montgomeryGlassCube(out: MeshBuilder, fit: Fit): void {
  const H = 17
  tower(out, { ...fit, height: H }, {
    height: H,
    tiers: [{ to: 1, face: { kind: 'curtain', wall: [0.2, 0.38, 0.34], glass: [0.42, 0.66, 0.58], pitch: 1.6, floor: 5.6, solid: 0.06, material: 'glass' } }],
    crown: { kind: 'parapet', height: 0.4, colour: [0.18, 0.34, 0.3], material: 'metal' },
  })
  const ring = towerRing(fit)
  let best = 0
  for (let i = 0; i < ring.length; i++) if (edgeAt(ring, i).L > edgeAt(ring, best).L) best = i
  sign(out, { type: 'flat', text: 'Fidelity', h: 0.8, face: 'grotesque', weight: 'bold', colour: [0.96, 0.96, 0.94], panel: [0.12, 0.32, 0.26], lit: 'front' }, { ring, edge: best, y: 4.6, along: 0.25 })
}

/** HOLIDAY INN GOLDEN GATEWAY, 1500 Van Ness (1971; way/436473931, the 26-storey tower): tan board-formed concrete,
 *  the windows in tall slots, glazed at the corners; a plain flat top. From Mapillary 357435216014082. */
export function holidayInnTower(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 101 }, {
    height: 101,
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.72, 0.66, 0.56], glass: [0.24, 0.3, 0.36], pitch: 1.8, floor: 3.0, solid: 0.6, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.7, 0.64, 0.55], material: 'concrete' },
  })
}

/** …and its PODIUM on Van Ness (way/197462674, the outline): two storeys of dark brown panels in a cream frame, arched
 *  upper windows, a dentil cornice. Was given the tower's 101 m, a second box round the tower. */
export function holidayInnPodium(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 10 }, {
    height: 10,
    base: { height: 5, face: { kind: 'curtain', wall: [0.84, 0.8, 0.7], glass: [0.18, 0.2, 0.22], pitch: 3.4, floor: 5, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.36, 0.26, 0.2], glass: [0.2, 0.22, 0.25], pitch: 3.4, floor: 5, solid: 0.45, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.0, colour: [0.86, 0.82, 0.72], material: 'concrete' },
  })
}

/** SOMA GRAND, 1160 Mission (2007; way/255960463, 92 m): a tan stucco tower with full-height strips of teal glass bays,
 *  stepping in near the top under a deep cornice, on a podium whose Mission Street face is a big glass mural in greens,
 *  ochre and red. From Mapillary 509830794412142. */
export function somaGrand(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 92 }, {
    height: 92,
    base: { height: 18, face: { kind: 'curtain', wall: [0.62, 0.6, 0.55], glass: [0.42, 0.56, 0.34], pitch: 3.4, floor: 4.5, material: 'glass' } },
    tiers: [
      { to: 0.86, face: { kind: 'bays', wall: [0.8, 0.72, 0.6], glass: [0.34, 0.56, 0.58], pitch: 4.4, floor: 3.0, solid: 0.4, material: 'stucco' } },
      { to: 1, inset: 2.0, face: { kind: 'curtain', wall: [0.8, 0.72, 0.6], glass: [0.36, 0.58, 0.6], pitch: 2.2, floor: 3.0, material: 'glass' } },
    ],
    crown: { kind: 'parapet', height: 1.8, colour: [0.84, 0.78, 0.68], material: 'stucco' },
  })
}

/** THE TOWER ON GEARY at Gough (way/681442044, 24 storeys, 84 m): a white frame gridded with square windows, a tall
 *  windowless grey concrete service shaft up one narrow end, standing a little proud. From Mapillary 779979624520451. */
export function gearyTower(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 84 }, {
    height: 84,
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.9, 0.9, 0.88], glass: [0.32, 0.38, 0.44], pitch: 2.1, floor: 3.4, solid: 0.32, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.0, colour: [0.86, 0.86, 0.84], material: 'concrete' },
  })
  // the service shaft: proud of the narrow end (the fit's short axis is the end), the full height and a storey over
  const alongX = fit.hx >= fit.hz
  const L = Math.max(fit.hx, fit.hz), W = Math.min(fit.hx, fit.hz)
  if (alongX) boxAlong(out, -L - 1.6, 45, 0, 2.0, 45, W * 0.55, 0, [0.5, 0.49, 0.46], surfaceTag('concrete'))
  else boxAlong(out, 0, 45, -L - 1.6, W * 0.55, 45, 2.0, 0, [0.5, 0.49, 0.46], surfaceTag('concrete'))
}

/** ISLE HOUSE, Treasure Island (2024; way/1249412094, 22 storeys, 67 m): white panels in tall vertical bands of narrow
 *  windows and grey spandrels, on a glazed three-storey podium. Treasure Island's first tower, seen from the whole
 *  bridge. From Mapillary 1139940888031863. */
export function isleHouse(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 67 }, {
    height: 67,
    base: { height: 10, face: { kind: 'curtain', wall: [0.78, 0.8, 0.8], glass: [0.3, 0.38, 0.42], pitch: 3.2, floor: 3.4, material: 'glass' } },
    tiers: [{ to: 1, face: { kind: 'fins', wall: [0.9, 0.9, 0.89], glass: [0.42, 0.46, 0.5], pitch: 2.6, solid: 0.55, depth: 0.25, floor: 2.9, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.9, 0.9, 0.89], material: 'concrete' },
  })
}

/** THE PALACE OF FINE ARTS' EXHIBITION HALL (1915; way/288371302): the great curved shed behind the colonnade — almost
 *  windowless, pale ochre concrete ribbed by shallow pilasters, a low parapet. It was baked as an apartment block,
 *  windows and fire escapes and all, directly behind the rotunda. */
export function pofaHall(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 20 }, {
    height: 20,
    tiers: [{ to: 1, face: { kind: 'fins', wall: [0.78, 0.68, 0.52], glass: [0.7, 0.6, 0.46], pitch: 6, solid: 0.7, depth: 0.5, floor: 20, material: 'concrete' } }],
    roof: [0.52, 0.52, 0.5],
    crown: { kind: 'parapet', height: 1.2, colour: [0.8, 0.7, 0.54], material: 'concrete' },
  })
}

/** ONE MISSION BAY (2018; way/563104192, 58 m): two storeys of white panels perforated in a pebble pattern, a white
 *  frame of punched windows, then a pale teal curtain wall in thin white fins. Mapillary 2839126093018170. */
export function oneMissionBay(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 58 }, {
    height: 58,
    base: { height: 9, face: { kind: 'fins', wall: [0.9, 0.9, 0.88], glass: [0.62, 0.64, 0.66], pitch: 1.2, solid: 0.55, depth: 0.15, floor: 9, material: 'metal' } },
    tiers: [
      { to: 0.25, face: { kind: 'punched', wall: [0.92, 0.92, 0.9], glass: [0.24, 0.38, 0.42], pitch: 2.6, floor: 3.1, solid: 0.45, material: 'concrete' } },
      { to: 1, face: { kind: 'curtain', wall: [0.86, 0.9, 0.9], glass: [0.42, 0.6, 0.62], pitch: 1.5, floor: 3.1, material: 'glass' } },
    ],
    crown: { kind: 'parapet', height: 1.2, colour: [0.9, 0.9, 0.88], material: 'metal' },
  })
}

/** SYMPHONY TOWERS, Van Ness and Grove (way/256045049, 12 storeys): ochre stucco, rows of white-framed bay windows
 *  stacked up every face over a sandstone base. Mapillary 225398422844615. */
export function symphonyTowers(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 41 }, {
    height: 41,
    base: { height: 7, face: { kind: 'punched', wall: [0.78, 0.64, 0.46], glass: [0.3, 0.32, 0.34], pitch: 3.2, floor: 3.5, solid: 0.4, material: 'stucco' } },
    tiers: [{ to: 1, face: { kind: 'bays', wall: [0.66, 0.46, 0.28], glass: [0.6, 0.64, 0.66], pitch: 4.2, floor: 3.0, solid: 0.35, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1.0, colour: [0.6, 0.62, 0.52], material: 'stucco' },
  })
}

/** JOHN F. KENNEDY TOWERS, 2451 Sacramento (way/1315380002, 12 storeys): a concave white slab, open galleries in
 *  continuous bands with doors in red, yellow and blue, two dark stair towers at its ends. Mapillary 968930874064650. */
export function jfkTowers(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 41 }, {
    height: 41,
    tiers: [{ to: 1, face: { kind: 'bands', wall: [0.9, 0.89, 0.85], glass: [0.62, 0.42, 0.36], floor: 3.2, solid: 0.42, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.88, 0.87, 0.84], material: 'concrete' },
  })
}

/** 230 FOLSOM (2024; way/1389914425, 17 storeys): terracotta-coloured precast in a two-storey grid, deep window bays
 *  paired within each cell, a glazed ground floor behind concrete columns. Mapillary 1046607004254809. */
export function folsom230(out: MeshBuilder, fit: Fit): void {
  tower(out, { ...fit, height: 58 }, {
    height: 58,
    base: { height: 6, face: { kind: 'curtain', wall: [0.62, 0.6, 0.57], glass: [0.16, 0.18, 0.2], pitch: 5, floor: 6, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.62, 0.42, 0.34], glass: [0.18, 0.3, 0.48], pitch: 3.4, floor: 3.2, solid: 0.38, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 1.4, colour: [0.6, 0.4, 0.32], material: 'concrete' },
  })
}

/** THE JAMES R. HERMAN CRUISE TERMINAL, Pier 27 (2014; way/262476981): long and low — two tall storeys of glass in a
 *  dark grey steel frame under one thin flat roof that oversails the walls deeply all round. The bake drew it as an
 *  11 m brick warehouse on the Embarcadero. Mapillary 550030322935500. */
export function cruiseTerminal27(out: MeshBuilder, fit: Fit): void {
  const H = 11
  tower(out, { ...fit, height: H }, {
    height: H,
    // (the ground storey in ribbed silver panels with the doors between fins, the glass hall above: Commons "James R.
    //  Herman Cruise Terminal at Pier 27 San Francisco (15151185718)", 2026-10-17)
    base: { height: 4.6, face: { kind: 'fins', wall: [0.7, 0.71, 0.72], glass: [0.2, 0.22, 0.24], pitch: 3.2, solid: 0.7, depth: 0.15, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'curtain', wall: [0.22, 0.23, 0.25], glass: [0.24, 0.3, 0.34], pitch: 2.4, floor: 6.4, material: 'glass' } }],
    crown: { kind: 'flat' },
  })
  // PIER 27 in big orange numerals on the silver panels of each end
  const ring0 = towerRing(fit)
  const ends = ring0.map((_, i) => i).filter((i) => edgeAt(ring0, i).L >= 12).sort((p, q) => edgeAt(ring0, p).L - edgeAt(ring0, q).L).slice(0, 2)
  for (const i of ends) {
    sign(out, { type: 'flat', text: '27', h: 2.6, face: 'grotesque', weight: 'bold', colour: [0.95, 0.42, 0.12], lit: 'front' }, { ring: ring0, edge: i, y: 2.5, along: 0.3 })
    sign(out, { type: 'flat', text: 'PIER', h: 0.7, face: 'grotesque', weight: 'bold', colour: [0.95, 0.42, 0.12], lit: 'front' }, { ring: ring0, edge: i, y: 2.5, along: 0.13 })
    sign(out, { type: 'flat', text: 'JAMES R. HERMAN CRUISE TERMINAL', h: 0.32, face: 'grotesque', weight: 'bold', colour: [0.2, 0.22, 0.25], lit: 'front' }, { ring: ring0, edge: i, y: 4.2, along: 0.3 })
  }
  // the roof: one slab, 4 m out past the walls
  const eaves = offsetRing(towerRing(fit), 4)
  faceBand(out, eaves, H, H + 0.7, { kind: 'blank', wall: [0.32, 0.33, 0.34], material: 'metal' })
  capPolygon(out, eaves, H + 0.7, [0.5, 0.5, 0.5], surfaceTag('metal'))
  capPolygon(out, [...eaves].reverse(), H, [0.36, 0.37, 0.38], surfaceTag('metal'))
}

/** THE CABLE CAR BARN AND POWERHOUSE, Washington and Mason (1887, rebuilt 1907; way/30029681): where every cable on
 *  the system is still wound, and the museum over the winding wheels. Dark red-brown brick, two tall storeys of
 *  round-arched windows in deep reveals, a corbelled cornice, the museum's name along the Mason Street front.
 *  Mapillary 1159800127874424. Was the generic brick restyle. */
export function cableCarBarn(out: MeshBuilder, fit: Fit): void {
  const H = 14
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 1.2, face: { kind: 'blank', wall: [0.32, 0.18, 0.14], material: 'brick' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.34, 0.17, 0.13], glass: [0.2, 0.22, 0.24], pitch: 4.6, floor: 6.4, solid: 0.5, head: 'segmental', material: 'brick' }, cornice: { depth: 0.7, height: 0.8 } }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.3, 0.16, 0.12], material: 'brick' },
  })
  const ring = towerRing(fit)
  let best = 0
  for (let i = 0; i < ring.length; i++) if (edgeAt(ring, i).L > edgeAt(ring, best).L) best = i
  sign(out, { type: 'flat', text: 'CABLE CAR MUSEUM', h: 0.9, face: 'roman', weight: 'bold', colour: [0.95, 0.9, 0.78], panel: [0.12, 0.1, 0.09], lit: 'front' }, { ring, edge: best, y: 11.6, along: 0.5 })
}

/** THE WARMING HUT at the west end of Crissy Field (1909 Army storehouse; way/32777524): the café every rider on the
 *  bay trail to the Golden Gate stops at — one storey of white-painted clapboard, tall windows, a low grey roof.
 *  Built from what is known of it (the nearest Mapillary frames are 130 m off); was the city's generic style. */
export function warmingHut(out: MeshBuilder, fit: Fit): void {
  const H = 5
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 0.6, face: { kind: 'blank', wall: [0.5, 0.5, 0.48], material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.93, 0.92, 0.88], glass: [0.22, 0.26, 0.3], pitch: 2.8, floor: 4.4, solid: 0.45, material: 'clapboard' } }],
    crown: { kind: 'hip', height: 1.6, inset: -0.5, colour: [0.46, 0.47, 0.48], material: 'metal' },
  })
}

export const PROMINENT: Record<string, (out: MeshBuilder, fit: Fit) => void> = { pofaHall, stRegisTower, montgomeryGlassCube, holidayInnTower, holidayInnPodium, somaGrand, gearyTower, isleHouse, oneMissionBay, symphonyTowers, jfkTowers, folsom230, cruiseTerminal27, cableCarBarn, warmingHut }
