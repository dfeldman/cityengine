/**
 * A building's look from street-photo labels (appearance research, 2026-10-22; docs/APPEARANCE-RESEARCH.md): what
 * Haiku read off its Mapillary frames, turned into the three things the generic renderer draws a building with —
 * a style (its paintings and proportions), a palette, and a dressing (src/city/facade.ts Dress).
 *
 * Experimental: the city applies it only behind `?labels=1`, to the buildings in `data/appearance/looks/haiku.json`
 * (tools/appearance/looks.py: only answers both runs agree on), so a labelled street can be compared with its
 * photographs. Every answer is optional; a building keeps whatever the bake gave it where the label is silent.
 */
import table from '../../data/appearance/looks/haiku.json' with { type: 'json' }
import menus from '../../data/appearance/research/menus-v10.json' with { type: 'json' }
import type { Dress, Palette, StyleId } from './facade.ts'
import type { RoofShape } from './package.ts'

type Label = Record<string, string>

export interface Look {
  style?: StyleId
  /** the storeys the photograph shows (the bake's are often wrong at the front) */
  levels?: number
  /** the roof the photograph shows */
  roof?: RoofShape
  /** the words on its main sign, as the photograph shows them */
  sign?: string
  /** dormers in its roof */
  dormers?: boolean
  palette?: Partial<Palette>
  dress?: Partial<Dress>
}

const COLOURS = menus.colours as Record<string, string>
const STYLE_OF_TYPE = (menus.attributes.type as unknown as { style: Record<string, string | null> }).style
const LABELS = table as Record<string, Label>
/** district styles a label's type must not replace: they carry the place (Chinatown's balconies, the Wharf's sheds) */
const KEEP: ReadonlySet<StyleId> = new Set(['chinatown', 'wharf'])
/**
 * The same proportions in the material the photograph showed: a type's style paints wood siding or render, and a label
 * that saw the other is drawn in it (wave 5: stucco fronts drawn as clapboard were the commonest wrong surface).
 */
const SURFACE: Record<string, Partial<Record<string, StyleId>>> = {
  stucco: { edwardian: 'flatsstucco', shopflats: 'shopflatsstucco', victorian: 'flatsstucco', sfapartment: 'aptmed' },
  wood_siding: { flatsstucco: 'edwardian', shopflatsstucco: 'shopflats', stucco: 'edwardian', aptmed: 'sfapartment', aptmodern: 'edwardian' },
  brick: { edwardian: 'aptbrick', flatsstucco: 'aptbrick', sfapartment: 'aptbrick', aptclassical: 'aptbrick', aptmodern: 'aptbrick', shopflats: 'brick', shopflatsstucco: 'brick', storefront: 'brick', bauhaus: 'brick' },
}

const colour = (v?: string): string | undefined => (v && COLOURS[v] ? COLOURS[v] : undefined)
const known = (v?: string): boolean => v !== undefined && v !== 'cannot_tell'

/** The look a building's label asks for, or null where it has none. */
export function lookFor(id: number, baked?: StyleId): Look | null {
  const l = LABELS[String(id)]
  if (!l) return null
  const look: Look = {}
  // (`classic_stone_block` is the apartment hotel or the office block, as homes_above says)
  let style = (STYLE_OF_TYPE[l.type]?.split('|')[l.homes_above === 'no' ? 1 : 0] ?? STYLE_OF_TYPE[l.type]) as StyleId | undefined
  // a painted lady is drawn as one, whatever else the type said
  if (known(l.victorian_kind) && l.victorian_kind !== 'none' && (!style || style === 'edwardian' || style === 'flatsstucco')) style = 'victorian'
  if (style && SURFACE[l.surface]?.[style]) style = SURFACE[l.surface]![style]
  // (big multi-pane industrial or office windows on a front with no homes: the Chicago window's grid, not punched
  //  openings — wave 8, lofts drawn with small sash)
  if (l.windows === 'grid' && l.homes_above === 'no' && style && ['brick', 'storefront', 'bauhaus', 'aptbrick', 'aptclassical'].includes(style)) style = 'chicago'
  // (stucco flats draw rectangular sash; arched windows are the Marina's and the Mediterranean block's)
  if (l.windows === 'arched' && style === 'flatsstucco') style = Number(l.storeys) >= 4 ? 'aptmed' : 'stucco'
  else if (style === 'stucco' && known(l.windows) && l.windows !== 'arched') style = 'flatsstucco'
  if (style && !(baked && KEEP.has(baked))) look.style = style
  const storeys = l.storeys === '8+' ? 8 : Number(l.storeys)
  if (storeys > 0) look.levels = storeys
  const roof: Record<string, RoofShape> = { flat: 'flat', gabled: 'gabled', hipped: 'hipped', mansard: 'mansard' }
  if (roof[l.roof]) look.roof = roof[l.roof]
  if (l.dormers === 'yes' || l.dormers === 'no') look.dormers = l.dormers === 'yes'
  // (a short sign only: a long reading is usually several signs run together)
  // (and only over a shop: a neighbour's shop sign read into a house's label was painted on the house — wave 7)
  if (l.sign_text && l.sign_text.length <= 40 && l.shopfronts && l.shopfronts !== 'none' && l.shopfronts !== 'cannot_tell') look.sign = l.sign_text

  const wall = colour(l.wall_colour)
  const palette: Partial<Palette> = {}
  if (wall) palette.wall = wall
  if (l.ground_colour === 'same_as_wall' && wall) palette.ground = wall
  else if (colour(l.ground_colour)) palette.ground = colour(l.ground_colour)
  if (colour(l.awning_colour)) palette.accent = colour(l.awning_colour)
  if (l.trim_colour === 'same_as_wall' && wall) palette.trim = wall
  else if (colour(l.trim_colour)) palette.trim = colour(l.trim_colour)
  if (Object.keys(palette).length) look.palette = palette

  const dress: Partial<Dress> = {}
  // the street front at eye level, bay by bay, once all three of its answers are in
  if (known(l.garage_doors) && known(l.shopfronts) && known(l.entrance)) {
    dress.ground = {
      garages: l.garage_doors === 'two_or_more' ? 2 : l.garage_doors === 'one' ? 1 : 0,
      shops: l.shopfronts as 'none' | 'one' | 'several' | 'all',
      entrance: l.entrance === 'stoop' ? 'stoop' : l.entrance === 'at_grade' ? 'at_grade' : 'none',
    }
  }
  // (the shop signs read Dress.shops: render/signs.ts)
  if (known(l.shopfronts)) dress.shops = l.shopfronts === 'none' ? 'none' : l.shopfronts === 'one' ? 'one' : 'all'
  const cap: Record<string, Dress['cap']> = { bracketed_cornice: 'bracket', plain_cornice: 'plain', brick_corbels: 'corbel',
    plain_parapet: 'plain', sign_panel: 'panel', roof_overhang: 'overhang' }
  if (cap[l.top]) dress.cap = cap[l.top]
  if (known(l.top)) dress.gable = l.top === 'gable'
  if (known(l.bays)) dress.bayStacks = l.bays === 'two_or_more' ? 2 : l.bays === 'one' ? 1 : 0
  if (l.balconies === 'none') dress.balconies = false
  else if (l.balconies === 'balconettes' || l.balconies === 'projecting') {
    dress.balconies = true
    dress.balconyKind = l.balconies
  }
  if (l.bay_shape === 'angled' || l.bay_shape === 'square' || l.bay_shape === 'rounded') dress.bayShape = l.bay_shape
  if (l.windows === 'few_or_none') dress.blank = true
  if (l.shop_glass === 'full' || l.shop_glass === 'partial' || l.shop_glass === 'little') dress.shopGlass = l.shop_glass
  if (l.sign_band === 'fascia') dress.fascia = true
  else if (l.sign_band === 'raised_panel') dress.cap = 'panel'
  // an auto shop's open bays and a warehouse's docks: the ground floor is their doors
  if ((l.service_bays === 'open_bays' || l.service_bays === 'loading_docks') && dress.ground) {
    dress.ground = { ...dress.ground, garages: Math.max(2, dress.ground.garages) }
    if (l.service_bays === 'open_bays') dress.garageTint = '#3a3a3c'
    else dress.docks = true
  }
  if (l.ornament === 'plain' || l.ornament === 'some' || l.ornament === 'rich') dress.ornament = l.ornament
  if (colour(l.garage_door_colour)) dress.garageTint = colour(l.garage_door_colour)
  // (a glass-panel door reads as a pale blue-grey pane, a roll-up as a light grey shutter, whatever its frame's colour)
  if (l.garage_door_style === 'glass_panels') dress.garageTint = '#a9b8c2'
  else if (l.garage_door_style === 'roll_up' && !dress.garageTint) dress.garageTint = '#b5b4ae'
  if (l.entrance_arch === 'yes' && dress.ground) dress.ground = { ...dress.ground, arched: true }
  if (l.victorian_kind === 'italianate' || l.victorian_kind === 'stick' || l.victorian_kind === 'queen_anne') dress.victorian = l.victorian_kind
  if (l.fire_escape === 'yes' || l.fire_escape === 'no') dress.fireEscape = l.fire_escape === 'yes'
  if (l.colour_panels === 'yes' || l.colour_panels === 'no') dress.blocks = l.colour_panels === 'yes'
  if (l.awnings === 'some') dress.canopy = true
  else if (l.awnings === 'none') dress.canopy = false
  if (Object.keys(dress).length) look.dress = dress
  return look
}

/** `?labels=1`: draw the labelled buildings from their labels. */
export const LOOKS_ON = typeof location !== 'undefined' && new URLSearchParams(location.search).get('labels') === '1'
