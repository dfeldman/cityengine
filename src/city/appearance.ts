/**
 * A building's look from street-photo labels (appearance research, 2026-10-22; docs/APPEARANCE-RESEARCH.md): what
 * Haiku read off its Mapillary frames, turned into the three things the generic renderer draws a building with —
 * a style (its paintings and proportions), a palette, and a dressing (src/city/facade.ts Dress).
 *
 * Experimental: the city applies it only behind `?looks=labels` (or `?labels=1`), to the buildings in
 * `data/appearance/looks/haiku.json` (tools/appearance/looks.py), so a labelled street can be compared with its
 * photographs; or behind `?looks=imputed`, to every building, from the appearance model (`LOOKS_MODE` below). Every
 * answer is optional; a building keeps whatever the bake gave it where the answers are silent.
 */
import table from '../../data/appearance/looks/haiku.json' with { type: 'json' }
import menus from '../../data/appearance/research/menus-v11.json' with { type: 'json' }
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

/**
 * WHERE A BUILDING'S ANSWERS COME FROM (owner, 2026-10-23: "don't remove the existing generics system. We want to keep it
 * for comparison purposes"), by `?looks=`:
 *
 * - `generic` (the default): none — every building is the bake's style and the generic draws, as before;
 * - `labels` (or the old `?labels=1`): the street-photo labels, for the buildings that have one;
 * - `imputed`: every building's answers drawn from the appearance model (tools/appearance/impute.py) — what it predicts
 *   from the map and the city's records, one draw per building, seeded by its id. Fetched at load (`loadLooks`) from
 *   `appearance/imputed.json`, so the default build carries none of it;
 * - `gated`: only the answers the model is sure of (calibrated held out), the generics' everywhere else
 *   (`appearance/gated.json`).
 */
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null
export const LOOKS_MODE: 'generic' | 'labels' | 'imputed' | 'gated' =
  params?.get('looks') === 'imputed' || params?.get('looks') === 'gated' ? params.get('looks') as 'imputed' | 'gated'
    : params?.get('looks') === 'labels' || params?.get('labels') === '1' ? 'labels' : 'generic'

interface Imputed { fields: string[]; values: string[][]; rows: Record<string, string>; signs: Record<string, string> }
let imputed: Imputed | null = null
/** the code alphabet: a field's answer is its index in `values`, one character each; `.` is no answer */
const CODES = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Fetch the model's answers when `?looks=imputed|gated` asks for them; a failed fetch leaves the generics. */
export async function loadLooks(base: string): Promise<void> {
  if ((LOOKS_MODE !== 'imputed' && LOOKS_MODE !== 'gated') || imputed) return
  try {
    const r = await fetch(new URL(`appearance/${LOOKS_MODE}.json`, base))
    if (r.ok) imputed = await r.json() as Imputed
  } catch { /* offline, or not deployed: the generics stand */ }
}

function labelOf(id: number): Label | undefined {
  if (LOOKS_MODE === 'labels') return LABELS[String(id)]
  if (!imputed) return undefined
  const code = imputed.rows[String(id)]
  if (!code) return undefined
  const l: Label = {}
  for (let i = 0; i < imputed.fields.length; i++) {
    const k = CODES.indexOf(code[i])
    if (k >= 0) l[imputed.fields[i]] = imputed.values[i][k]
  }
  const sign = imputed.signs[String(id)]
  if (sign) l.sign_text = sign
  return l
}

/** The look a building's answers ask for, or null where it has none. */
export function lookFor(id: number, baked?: StyleId): Look | null {
  const l = labelOf(id)
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
  // (a fire escape's landings read as balconies, wave after wave: with one, the balconies are its)
  else if (l.balconies === 'projecting' && l.fire_escape === 'yes') dress.balconies = false
  else if (l.balconies === 'balconettes' || l.balconies === 'projecting') {
    dress.balconies = true
    dress.balconyKind = l.balconies
  }
  if (l.bay_colour !== 'same_as_wall' && colour(l.bay_colour)) dress.bayTint = colour(l.bay_colour)
  if (l.unusual_kind === 'mural_covered') dress.mural = true
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
  special(l, look, dress)
  if (Object.keys(dress).length) look.dress = dress
  return look
}

/**
 * The special cases (owner, 2026-10-22: structures common enough and alike enough to draw from one recipe, which the
 * generic labels approximate badly). A label that names one gets the whole recipe, over whatever else it said:
 *
 * - an AUTO REPAIR SHOP: one or two storeys, the street front a row of open dark bays under a sign band, a plain raised
 *   panel at the top, no windows above;
 * - a PARKING GARAGE: the ground floor a wide entry, every storey above an open deck over a solid spandrel, a flat top.
 *
 * Gas stations and car washes are next when a sample has some.
 */
function special(l: Label, look: Look, dress: Partial<Dress>): void {
  const auto = l.special_structure === 'auto_repair_shop' || (l.service_bays === 'open_bays' && l.homes_above !== 'yes')
  if (auto) {
    // (a plain box: the storefront style borrows the Marina stucco's art, whose garage is an arch)
    look.style = 'bauhaus'
    // (its sign is over the bays, not over a shop)
    if (l.sign_text && l.sign_text.length <= 40) look.sign = l.sign_text
    // (every bay an open bay: the lobby door's painting is an arch, which read as a church door on a body shop)
    dress.ground = { garages: 99, shops: 'none', entrance: 'none' }
    dress.shops = 'none'
    dress.garageTint = '#2e2e30'
    dress.fascia = true
    dress.blank = true
    if ((look.levels ?? 1) <= 2) dress.cap = 'panel'
    dress.balconies = false
    dress.bayStacks = 0
  }
  if (l.special_structure === 'parking_garage') {
    look.style = 'bauhaus'
    dress.ground = { garages: 99, shops: 'none', entrance: 'none' }
    dress.garageTint = '#2b2b2d'
    dress.decks = true
    dress.cap = 'plain'
    dress.balconies = false
    dress.bayStacks = 0
    dress.fireEscape = false
    look.roof = 'flat'
  }
}

/** `?looks=labels|imputed` (or `?labels=1`): draw the buildings from their answers; otherwise the generics. */
export const LOOKS_ON = LOOKS_MODE !== 'generic'
