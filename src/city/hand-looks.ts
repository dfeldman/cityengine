/**
 * Hand-picked looks for generic buildings, always on (unlike appearance.ts's experimental labels): OSM's footprints
 * are right but the bake's dark modern palette is not (plans/boulogne-recolour.md, owner 2026-11-05: Boulogne-
 * Billancourt is mostly light). Palettes are named once here so a cluster is retuned in one place.
 */
import type { Look } from './appearance.ts'
import type { Palette, StyleId } from './facade.ts'
import { labelPostwar } from './facade.ts'
import { Projection, type LatLon } from './geo.ts'
import labelled from './paris-looks.json' with { type: 'json' }

export const HAND_PALETTES: Record<string, Partial<Palette>> = {
  /** brushed stainless cladding, pale and cool */
  steel: { wall: '#eef1f4', trim: '#f8f9fa', roof: '#8a9096', ground: '#b4b8bc' },
  /** white render, the slab edges whiter still */
  /** board-marked beige concrete, dark ribbon balconies (Panoramax, Haiku 2026-11-05) */
  tan: { wall: '#b9a88e', trim: '#6e6150', roof: '#8c7e6c', ground: '#8c7e6c', accent: '#2e7f76' },
  white: { wall: '#fbfbf8', trim: '#ffffff', roof: '#9a9c9e', ground: '#e0dfda' },
  /** blue-grey curtain glass, mullioned (Mercuriales; Panoramax/Haiku 2026-11-05) */
  blueGlass: { wall: '#557080', trim: '#c9d3d9', roof: '#7e868c', accent: '#3d5c70', ground: '#474d52' },
  /** teal-grey curtain glass (Orange Eastview) */
  tealGlass: { wall: '#5a7176', trim: '#cfd6d6', roof: '#7e868c', accent: '#3f6a6e', ground: '#6b6a64' },
  /** orange-red render, dark bistro base (Ivry 1953 block) */
  /** curved blue-green curtain glass (Gallieni 2) */
  gallieniGlass: { wall: '#b7c3c9', trim: '#dfe5e8', roof: '#7e868c', accent: '#4f8aa0', ground: '#3c4a52' },
  /** dark bronze louvred cladding */
  bronze: { wall: '#5a4d3f', trim: '#8a7a66', roof: '#5e5850', accent: '#3f6f8c', ground: '#3b3b3b' },
  /** pale warm render of the 1960–2010s outskirts blocks */
  paleRender: { wall: '#ebe5d8', trim: '#f7f4ee', roof: '#8e8c88', ground: '#9a8c78' },
  paleGrey: { wall: '#d9dadb', trim: '#eef0f1', roof: '#8a8e92', ground: '#8e9296' },
  cream: { wall: '#e8d5c0', trim: '#f5ece0', roof: '#8e8a84', ground: '#5a4a42' },
  whiteNavy: { wall: '#f4f2ee', trim: '#ffffff', roof: '#9a9c9e', ground: '#1d2b4a' },
  terracotta: { wall: '#b8603f', trim: '#e8d9cc', roof: '#6e6660', ground: '#3a3530' },
}

interface Entry { name: string; palette: keyof typeof HAND_PALETTES; style?: Look['style']; dress?: Look['dress']; ids: number[] }

const ENTRIES: Entry[] = [
  {
    name: 'Pont de Sèvres: City 1–3, Citylights and the résidences (owner pin 48.82849,2.23131: light stainless steel)',
    palette: 'steel',
    style: 'parismodern', // the skyscraper style is mostly dark glass whatever its tint
    ids: [83203863, 83203849, 83203847, 83203856, 261416399, 261416400, 261416401, 261416402, 261416403, 261416404,
      261416405, 261416407, 83203855, 83203841, 56211861, 56211858,
      1264636114, 1264636115, 1264636116, 1264636117, 1264636118, 1264636119, 1264636120, 1264636121, 1264636122,
      1264636123, 1264636124, 1264636125, 1264636126, 1264636127, 1264636128, 1264636129, 1264636130, 1264636131,
      1264636132, 1264636133, 1264636134,
      // the untagged-height housing towers: Aravis, Jura, Ardennes, Aquitaine and their neighbours
      56211839, 56211841, 56211845, 56211848, 56211850, 56211851, 128395057, 1247542773, 261416406],
  },
  {
    name: 'Les Pyrénées and Les Alpes, the curved bars of the Pont de Sèvres (owner 48.830475,2.236288; photos: beige concrete, ribbon balconies, teal arcade)',
    palette: 'tan',
    style: 'parismodern',
    dress: { balconies: true, belts: true },
    ids: [56211840, 56211852],
  },
  {
    name: 'The ten-odd white slabs north of the Pont de Sèvres (owner pin 48.83159,2.23114: white, huge balconies every level)',
    palette: 'white',
    dress: { balconies: true, belts: true },
    ids: [74145607, 74145736, 74145695, 74145513, 74145562, 74145753, 74145876, 74145344, 73206122, 73206594,
      73206463, 73206466],
  },
  // Paris outskirts trial (plans/paris-restyle-panoramax.md), Panoramax read by Haiku, confidence 2
  { name: 'Les Mercuriales, Levant and Ponant (Bagnolet)', palette: 'blueGlass', style: 'skyscraper', dress: { belts: true, glassTint: '#3d5c70' }, ids: [483056039, 26129669] },
  { name: 'Orange Eastview (Bagnolet)', palette: 'tealGlass', style: 'skyscraper', dress: { belts: true, glassTint: '#3f6a6e' }, ids: [81617496] },
  { name: 'Ivry 1953 Chevallier block: rails every floor', palette: 'terracotta', style: 'parismodern', dress: { balconies: true, belts: true, glassTint: '#3d4a55' }, ids: [79153407] },
  // Bagnolet / Porte de Montreuil (plans/restyle/bagnolet.tsv; Panoramax + Haiku 2026-11-05; clusters with the target unseen left alone)
  { name: "Bagnolet: Centre d'Affaires Gallieni 2, curved blue-green curtain glass (conf 3)", palette: 'gallieniGlass', style: 'skyscraper', dress: { glassTint: '#4f8aa0' }, ids: [81617176] },
  { name: 'Bagnolet: Av. du Général de Gaulle 56 m, dark bronze louvres, rails', palette: 'bronze', style: 'parismodern', dress: { balconies: true, belts: true, fins: true, glassTint: '#3f6f8c' }, ids: [1126763807] },
  { name: 'Paris 20e / Bagnolet: white curved blocks, continuous balcony bands (Davout 14_1, 15_1; Gal. de Gaulle 17_2)', palette: 'white', style: 'parismodern', dress: { balconies: true, belts: true }, ids: [70145675, 70150342, 70147230, 1126763795, 1126763818, 81615203] },
  { name: 'Paris 20e: pale render blocks with rails (Davout 2017, Pyrénées 1961, Gambetta 2000, Pyrénées 2018)', palette: 'paleRender', style: 'parismodern', dress: { balconies: true }, ids: [685508507, 70004006, 741109491, 70148729, 479733392] },
  { name: 'Bagnolet: 53 m tower, Av. de la République, pale grey panels (cropped-pano retry, conf 3)', palette: 'paleGrey', style: 'towerblock', dress: { belts: true }, ids: [81613737, 70153549] },
  { name: 'Paris 20e: Rue des Pyrénées curved banded block, cream, rails', palette: 'cream', style: 'parismodern', dress: { balconies: true, belts: true }, ids: [70147113, 70151994] },
  { name: 'Paris 20e: périphérique silver curved cladding, ribbon windows', palette: 'steel', style: 'bauhaus', dress: { belts: true, glassTint: '#7f9aa6' }, ids: [685508512] },
  { name: 'Paris 20e: Avenue Circulaire white block on a navy garage base, rails', palette: 'whiteNavy', style: 'parismodern', dress: { balconies: true }, ids: [70149750] },
]

const BY_ID = new Map<number, Look>()

/**
 * Haiku's labels of tall/modern Paris generics from Panoramax (tools/paris-looks.py; plans/paris-restyle-panoramax.md).
 * The ways were chosen by tools/paris-restyle-list.ts, which drops anything a landmark claims, so these never reach a
 * custom renderer; a hand entry below still wins. Tune the mapping here.
 */
const MIN_CONFIDENCE = 2
interface Label { confidence: number; seen?: number; wall: string; trim?: string; ground?: string; material?: string; windows?: string;
  glass?: string; balconies?: string; bands?: boolean; fins?: boolean; colour_panels?: boolean }
function fromLabel(l: Label, id: number): Look | null {
  if ((l.confidence ?? 0) < MIN_CONFIDENCE || !/^#[0-9a-f]{6}$/i.test(l.wall ?? '')) return null
  // stone or French windows is an older front the list let through (Haussmann, or 1930s): keep the bake's style, recolour only
  const old = l.material === 'stone' || l.windows === 'french'
  const style: Look['style'] = old ? undefined : l.windows === 'curtain' ? 'skyscraper' : l.windows === 'ribbon' ? 'bauhaus' : 'parismodern'
  const dress: Look['dress'] = {}
  if (l.balconies && l.balconies !== 'none') dress.balconies = true
  if (l.bands || l.balconies === 'continuous') dress.belts = true
  if (l.fins) dress.fins = true
  if (l.colour_panels) dress.blocks = true
  if (l.glass && /^#[0-9a-f]{6}$/i.test(l.glass)) dress.glassTint = l.glass
  // (a ribbon or curtain front gets a Paris lobby, roofline and balconies: the SF dressers left them doorless)
  if (style === 'bauhaus' || style === 'skyscraper') Object.assign(dress, labelPostwar(id, style === 'skyscraper', l.balconies))
  return { ...(style ? { style } : {}), dress: old ? {} : dress, palette: { wall: l.wall, trim: l.trim ?? l.wall, ground: l.ground ?? l.wall } }
}
for (const [id, l] of Object.entries(labelled as Record<string, Label>)) { const k = fromLabel(l, Number(id)); if (k) BY_ID.set(Number(id), k) }
for (const e of ENTRIES) for (const id of e.ids) {
  const pw = e.style === 'bauhaus' || e.style === 'skyscraper' ? labelPostwar(id, e.style === 'skyscraper', e.dress?.balconies ? undefined : 'none') : {}
  BY_ID.set(id, { palette: HAND_PALETTES[e.palette], style: e.style, dress: { ...pw, ...e.dress } })
}

/** for the inspector: a building's Panoramax label, the hand entry naming it, and the look it gets (null if none) */
export function restyleInfo(id: number): { label?: unknown; entry?: string; look?: Look; applied: boolean } | null {
  const label = (labelled as Record<string, unknown>)[String(id)]
  const entry = ENTRIES.find((e) => e.ids.includes(id))?.name
  const look = BY_ID.get(id)
  if (!label && !entry) return null
  return { label, entry, look, applied: !!look }
}

/** a building's hand look, merged under whatever look it already has (a label or a special wins field by field) */
export function handLook(id: number, other: Look | null): Look | null {
  const h = BY_ID.get(id)
  if (!h) return other
  if (!other) return h
  return { ...h, ...other, palette: { ...h.palette, ...other.palette }, dress: { ...h.dress, ...other.dress } }
}

/**
 * Area palettes: inside a ring, a style draws from these palettes instead of its own. Boulogne-Billancourt and Issy's
 * north bank (owner 2026-11-05: "most are light-colored, the opposite of the black and dark beige generic buildings";
 * Panoramax photos, Haiku 2026-11-05: Seine-side offices pale blue-grey glass #8fa6b3–#9db0ba, housing cream or white).
 * The skyscraper style's own palettes are the dark ones (#4f5a63, #6d6255…). Ring is lat/lon, east of it is Paris proper.
 */
const AREAS: { name: string; ring: [number, number][]; styles: Partial<Record<StyleId, Palette[]>> }[] = [
  {
    name: 'Boulogne-Billancourt and Issy north bank',
    ring: [[48.846, 2.224], [48.846, 2.2555], [48.838, 2.2565], [48.834, 2.2625], [48.830, 2.2700], [48.822, 2.2720], [48.822, 2.224]],
    styles: {
      skyscraper: [
        { wall: '#9db0ba', trim: '#e6eaec', roof: '#8a9096', accent: '#4a5a64', weight: 1.4 },
        { wall: '#8fa6b3', trim: '#e2e6e8', roof: '#8a9096', accent: '#3e4e58', weight: 1.0 },
        { wall: '#e9e5da', trim: '#f6f4ee', roof: '#8e8c88', accent: '#5b5d60', weight: 1.4 },
        { wall: '#d8d2c4', trim: '#efebe2', roof: '#8e8c88', accent: '#5b5d60', weight: 1.0 },
        { wall: '#eef0f1', trim: '#ffffff', roof: '#8e9296', accent: '#3a4046', weight: 0.8 },
      ],
    },
  },
]

let proj: Projection | null = null
/** the city's origin, so a building's local x,z can be tested against the lat/lon rings */
export function setHandOrigin(origin: LatLon): void { proj = new Projection(origin) }

function inside(lat: number, lon: number, r: [number, number][]): boolean {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [ya, xa] = r[i], [yb, xb] = r[j]
    if ((ya > lat) !== (yb > lat) && lon < ((xb - xa) * (lat - ya)) / (yb - ya) + xa) c = !c
  }
  return c
}

/** the palettes an area gives this style at local x,z, or undefined */
export function areaPalettes(x: number, z: number, style: StyleId): Palette[] | undefined {
  if (!proj) return undefined
  const { lat, lon } = proj.toLatLon({ x, z })
  for (const a of AREAS) if (a.styles[style] && inside(lat, lon, a.ring)) return a.styles[style]
  return undefined
}
