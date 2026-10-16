/**
 * Invented shop names, for the shopfronts OSM has nothing to say about.
 *
 * Real names come first and always win (signs.ts); these fill the rest of the street so that a row of
 * ground-floor shops reads as shops rather than as a row of identical blank fascias. They are plausible
 * rather than real — nobody will find "Fromagerie Girard" on the Rue de Turenne — and they are in the
 * language of the place, because a Paris street lettered in English would be more wrong than a blank one.
 */
import type { PackedPoi } from './package.ts'

export type ShopLanguage = 'fr' | 'en' | 'zh'

interface Vocabulary {
  /** a trade and the kind of board it gets; `%` is where a name goes, or it stands alone */
  trades: [string, PackedPoi['kind']][]
  names: string[]
}

const FR: Vocabulary = {
  trades: [
    ['Boulangerie %', 'food'], ['Pâtisserie %', 'food'], ['Café %', 'food'], ['Brasserie %', 'food'],
    ['Bistrot %', 'food'], ['Crêperie %', 'food'], ['Fromagerie %', 'food'], ['Chocolatier %', 'food'],
    ['Épicerie %', 'food'], ['Caviste %', 'food'], ['Boucherie %', 'food'], ['Traiteur %', 'food'],
    ['Pharmacie %', 'service'], ['Opticien %', 'service'], ['Coiffure %', 'service'], ['Pressing %', 'service'],
    ['Librairie %', 'culture'], ['Galerie %', 'culture'], ['Papeterie %', 'shop'], ['Fleuriste %', 'shop'],
    ['Maroquinerie %', 'shop'], ['Bijouterie %', 'shop'], ['Chaussures %', 'shop'], ['Tabac %', 'shop'],
    ['Quincaillerie %', 'shop'], ['Mercerie %', 'shop'], ['Antiquités %', 'culture'], ['Horlogerie %', 'shop'],
  ],
  names: [
    'Martin', 'Bernard', 'Dubois', 'Moreau', 'Laurent', 'Lefèvre', 'Roux', 'Fournier', 'Girard', 'Bonnet',
    'Mercier', 'Blanc', 'Garnier', 'Chevalier', 'Rousseau', 'Faure', 'du Marais', 'des Arts', 'Saint-Paul',
    'de la Place', 'des Archives', 'du Temple', 'des Vosges', 'Turenne', 'Beaubourg', 'du Pont',
    'de la Bastille', 'Sévigné', 'Charlot', 'des Rosiers',
  ],
}

const EN: Vocabulary = {
  trades: [
    ['%’s Deli', 'food'], ['% Coffee', 'food'], ['% Bagels', 'food'], ['% Pizza', 'food'],
    ['% Diner', 'food'], ['% Bakery', 'food'], ['% Noodle House', 'food'], ['% Tacos', 'food'],
    ['% Pharmacy', 'service'], ['% Cleaners', 'service'], ['% Barbers', 'service'], ['% Optical', 'service'],
    ['% Books', 'culture'], ['% Gallery', 'culture'], ['% Hardware', 'shop'], ['% Florist', 'shop'],
    ['% Market', 'shop'], ['% Shoes', 'shop'], ['% Jewelers', 'shop'], ['% Wine & Spirits', 'shop'],
    ['% Outfitters', 'shop'], ['% Records', 'culture'], ['% Bank', 'service'], ['% Nails', 'service'],
  ],
  names: [
    'Joe', 'Sal', 'Rosie', 'Murphy', 'Lucky', 'Golden', 'Liberty', 'Main Street', 'Lakeside', 'Hudson',
    'Union', 'Corner', 'Empire', 'Blue Line', 'Riverside', 'Harbor', 'Franklin', 'Madison', 'Station',
    'Brooklyn', 'Metro', 'Park', 'Sunrise', 'Keystone', 'Greenwood', 'Atlas', 'Pioneer', 'Elm', 'Monroe',
  ],
}

/**
 * San Francisco's Chinatown (owner, 2026-10-16: "many signs in chinese. not all, it's not china, but maybe half"):
 * Cantonese trade names in characters — a family or lucky name and a trade — and as many again in Chinatown's
 * English, the romanised names over the same trades.
 */
const ZH: Vocabulary = {
  trades: [
    ['%酒家', 'food'], ['%茶樓', 'food'], ['%餅家', 'food'], ['%燒臘', 'food'], ['%海味', 'shop'], ['%藥材', 'service'],
    ['%珠寶', 'shop'], ['%雜貨', 'shop'], ['%麵家', 'food'], ['%書局', 'culture'], ['%金行', 'shop'], ['%茶行', 'shop'],
    ['% Bakery', 'food'], ['% Restaurant', 'food'], ['% Jewelry', 'shop'], ['% Herbs', 'service'], ['% Market', 'shop'],
    ['% Gift Shop', 'shop'], ['% Tea Co.', 'shop'], ['% Noodle House', 'food'], ['% Trading Co.', 'shop'], ['% Seafood', 'food'],
  ],
  names: ['金龍', '新華', '永利', '和記', '同興', '福來', '大中華', '萬利', '廣東', '鴻運', '美華', '泰和'],
}
const ZH_EN = ['Golden Dragon', 'Sun Wah', 'Wing Lee', 'Wo Kee', 'Tung Hing', 'Fook Loy', 'Great China', 'Man Lee', 'Canton', 'Hung Wan', 'Mei Wah', 'Tai Wo']

/** `count` distinct invented names, the same ones every session for the same seed. */
export function inventShopNames(lang: ShopLanguage, count: number, seed: number):
  { name: string; kind: PackedPoi['kind'] }[] {
  const v = lang === 'fr' ? FR : lang === 'zh' ? ZH : EN
  let a = seed >>> 0
  const r = (): number => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const seen = new Set<string>()
  const out: { name: string; kind: PackedPoi['kind'] }[] = []
  for (let tries = 0; out.length < count && tries < count * 20; tries++) {
    const [trade, kind] = v.trades[Math.floor(r() * v.trades.length)]
    const wi = Math.floor(r() * v.names.length)
    // (an English trade takes the romanised name: Sun Wah Bakery, not 新華 Bakery)
    const who = lang === 'zh' && /[A-Za-z]/.test(trade) ? ZH_EN[wi] : v.names[wi]
    const name = trade.replace('%', who)
    if (seen.has(name)) continue
    seen.add(name)
    out.push({ name, kind })
  }
  return out
}
