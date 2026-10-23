/**
 * The buildings OSM names outright that look alike everywhere and that the generic facade draws badly (appearance
 * research, 2026-10-22; owner: "gas stations… common and similar in appearance… special cases"): a fuel station's pump
 * canopy, its shop, and a car wash. `data/appearance/specials.json` (tools/appearance/specials.py) lists them with their
 * brand; each gets a recipe — a style, a palette in the brand's colours and a dressing — and a canopy its columns
 * (render/city.ts). Unlike the photo labels these are the map's own word, so they are drawn always, not only behind
 * `?labels=1`.
 */
import table from '../../data/appearance/specials.json' with { type: 'json' }
import type { Look } from './appearance.ts'

export interface Special {
  kind: 'fuel' | 'car_wash'
  /** the canopy over the pumps, the station's shop, or a car wash */
  part: 'canopy' | 'shop' | 'wash'
  brand: string
}

const SPECIALS = table as Record<string, Special>

/** The special case a building is, or null. */
export const specialFor = (id: number): Special | null => SPECIALS[String(id)] ?? null

/** A brand's fascia and its stripe: what reads from down the street before any lettering does. */
const BRANDS: Record<string, { fascia: string; stripe: string }> = {
  shell: { fascia: '#f6c400', stripe: '#d52b1e' },
  chevron: { fascia: '#f4f4f2', stripe: '#0b5aa8' },
  '76': { fascia: '#f37021', stripe: '#1c4f9c' },
  arco: { fascia: '#0b5aa8', stripe: '#f4f4f2' },
  valero: { fascia: '#f4f4f2', stripe: '#00539b' },
}
const PLAIN = { fascia: '#f2f1ec', stripe: '#c0392b' }
const brandOf = (b: string): { fascia: string; stripe: string } => BRANDS[b.toLowerCase()] ?? PLAIN

/** The look a special building is drawn with, over any photo label it also has. */
export function specialLook(s: Special, label: Look | null): Look {
  const c = brandOf(s.brand)
  const sign = s.brand && s.brand !== 'independent' ? s.brand.toUpperCase() : undefined
  if (s.part === 'canopy') {
    // a flat slab in the brand's colour, its edge striped: no windows, no storeys, nothing below but its columns
    return { style: 'bauhaus', palette: { wall: c.fascia, trim: c.stripe, ground: c.fascia },
      dress: { blank: true, solid: true, cap: 'plain', balconies: false, fireEscape: false, bayStacks: 0, shops: 'none', canopy: false } }
  }
  if (s.part === 'shop') {
    // the station's shop: glass all along under the brand's fascia
    return { style: 'bauhaus', levels: 1, sign, palette: { wall: '#ecebe6', accent: c.fascia, trim: c.stripe },
      dress: { ground: { garages: 0, shops: 'all', entrance: 'none' }, shopGlass: 'full', fascia: true, blank: true,
        cap: 'plain', balconies: false, fireEscape: false, bayStacks: 0 } }
  }
  // a car wash: open bays under a fascia, its name over them
  return { ...label, style: 'bauhaus', levels: 1, sign: label?.sign ?? sign, palette: { ...label?.palette, accent: c.stripe },
    dress: { ...label?.dress, ground: { garages: 99, shops: 'none', entrance: 'none' }, garageTint: '#2e2e30', fascia: true,
      blank: true, cap: 'panel', balconies: false, fireEscape: false, bayStacks: 0 } }
}
