/**
 * A building's look from street-photo labels (appearance research, 2026-10-22; docs/APPEARANCE-RESEARCH.md): what
 * Haiku read off its Mapillary frames, turned into the three things the generic renderer draws a building with —
 * a style (its paintings and proportions), a palette, and a dressing (src/city/facade.ts Dress).
 *
 * Experimental: the city applies it only behind `?labels=1`, to the few dozen buildings in
 * `data/appearance/looks/haiku-v3.json` (tools/appearance/looks.py), so a labelled street can be compared with its
 * photographs. Every answer is optional; a building keeps whatever the bake gave it where the label is silent.
 */
import table from '../../data/appearance/looks/haiku-v3.json' with { type: 'json' }
import menus from '../../data/appearance/research/menus-v3.json' with { type: 'json' }
import type { Dress, Palette, StyleId } from './facade.ts'

type Label = Record<string, string>

export interface Look {
  style?: StyleId
  palette?: Partial<Palette>
  dress?: Partial<Dress>
}

const COLOURS = menus.colours as Record<string, string>
const STYLE_OF_TYPE = (menus.attributes.type as unknown as { style: Record<string, string | null> }).style
const LABELS = table as Record<string, Label>

const colour = (v?: string): string | undefined => (v && COLOURS[v] ? COLOURS[v] : undefined)

/** The look a building's label asks for, or null where it has none. */
export function lookFor(id: number): Look | null {
  const l = LABELS[String(id)]
  if (!l) return null
  const look: Look = {}
  const style = STYLE_OF_TYPE[l.type]
  if (style) look.style = style as StyleId

  const wall = colour(l.wall_colour)
  const palette: Partial<Palette> = {}
  if (wall) palette.wall = wall
  if (l.trim_colour === 'same_as_wall' && wall) palette.trim = wall
  else if (colour(l.trim_colour)) palette.trim = colour(l.trim_colour)
  if (colour(l.ground_colour)) palette.ground = colour(l.ground_colour)
  if (colour(l.awning_colour)) palette.accent = colour(l.awning_colour)
  if (Object.keys(palette).length) look.palette = palette

  const dress: Partial<Dress> = {}
  const shops: Record<string, Dress['shops']> = { shops_all: 'all', one_shop: 'one', garages: 'none', entrance_only: 'none', blank: 'none' }
  if (shops[l.ground_floor]) dress.shops = shops[l.ground_floor]
  const cap: Record<string, Dress['cap']> = { bracketed_cornice: 'bracket', plain_cornice: 'plain', brick_corbels: 'corbel',
    plain_parapet: 'plain', sign_panel: 'panel', roof_overhang: 'overhang' }
  if (cap[l.top]) dress.cap = cap[l.top]
  if (l.bays === 'none') dress.bays = false
  else if (l.bays === 'one_stack' || l.bays === 'several_stacks') dress.bays = true
  if (l.balconies === 'none') dress.balconies = false
  else if (l.balconies === 'balconettes' || l.balconies === 'projecting') dress.balconies = true
  if (l.fire_escape === 'yes' || l.fire_escape === 'no') dress.fireEscape = l.fire_escape === 'yes'
  if (l.piers === 'yes' || l.piers === 'no') dress.piers = l.piers === 'yes'
  if (l.colour_panels === 'yes' || l.colour_panels === 'no') dress.blocks = l.colour_panels === 'yes'
  if (l.awnings === 'some') dress.canopy = true
  if (Object.keys(dress).length) look.dress = dress
  return look
}

/** `?labels=1`: draw the labelled buildings from their labels. */
export const LOOKS_ON = typeof location !== 'undefined' && new URLSearchParams(location.search).get('labels') === '1'
