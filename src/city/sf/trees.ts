/**
 * San Francisco's street trees as plantings (SF_PLAN.md §5): every tree Public Works keeps on the pavements
 * (tools/sf-trees.ts, DataSF's Street Tree List), where it stands, its form from its species, its height from its
 * trunk. The city's is a famously mixed collection — London plane, ficus, brisbane box, Victorian box, magnolia, the
 * New Zealand Christmas tree, the water gum, and the palms — and this is what makes Dolores different from
 * the Embarcadero different from Pacific Heights.
 */
import type { Planting } from '../plantings.ts'
import { formCode, type TreeForm } from '../tree-forms.ts'

/** genus (or "Genus species") → form; the longest match wins, so "Quercus agrifolia" beats "Quercus" */
const FORMS: Record<string, TreeForm> = {
  Platanus: 'plane', patanus: 'plane', platanus: 'plane',
  Ficus: 'ficus', 'Ficus carica': 'flowering', 'Ficus rubiginosa': 'laurel',
  // the upright evergreens
  Lophostemon: 'evergreen', lophostemon: 'evergreen', Tristaniopsis: 'evergreen', Lagunaria: 'evergreen',
  Elaeocarpus: 'evergreen', Cupaniopsis: 'evergreen', Geijera: 'evergreen', Hymenosporum: 'evergreen',
  Quillaja: 'evergreen', Cinnamomum: 'evergreen', Persea: 'evergreen', Syzygium: 'evergreen', Quercus: 'evergreen',
  'Quercus shumardii': 'deciduous', 'Schinus terebinthifolius': 'evergreen', Ceratonia: 'evergreen',
  // the dense glossy ones
  Pittosporum: 'laurel', Magnolia: 'laurel', 'Magnolia x soulangiana': 'blossom', Laurus: 'laurel', Ligustrum: 'laurel',
  Eriobotrya: 'laurel', Podocarpus: 'laurel', Afrocarpus: 'laurel', Photinia: 'laurel', Rhaphiolepis: 'laurel',
  Ilex: 'laurel', Citrus: 'laurel', Myoporum: 'laurel', 'Prunus caroliniana': 'laurel', 'Prunus lyonii': 'laurel',
  Nerium: 'laurel', Cotoneaster: 'laurel', Dodonaea: 'laurel', Ceanothus: 'laurel',
  Metrosideros: 'myrtle',
  Olea: 'olive', Arbutus: 'olive', Acacia: 'olive', 'Acacia melanoxylon': 'eucalyptus', Melaleuca: 'olive',
  Leptospermum: 'olive', Rhamnus: 'olive',
  Callistemon: 'bottlebrush', 'Callistemon viminalis': 'weeping',
  // flowering
  'Prunus cerasifera': 'plum', 'Prunus blireiana': 'plum', Prunus: 'blossom', Malus: 'blossom', Cercis: 'blossom',
  Lagerstroemia: 'blossom',
  Pyrus: 'pear', Crataegus: 'pear', Chionanthus: 'pear', 'Prunus domestica': 'pear', 'Prunus persica': 'blossom',
  Koelreuteria: 'flowering', Robinia: 'flowering', Chitalpa: 'flowering', Jacaranda: 'flowering',
  'Acer palmatum': 'flowering', 'Acer buergeranum': 'flowering', Cotinus: 'flowering', Aesculus: 'flowering',
  Sophora: 'flowering', Cassia: 'flowering', Brugmansia: 'flowering',
  // the other deciduous
  Ulmus: 'deciduous', Acer: 'deciduous', Liquidambar: 'deciduous', Liriodendron: 'deciduous', Fraxinus: 'deciduous',
  Tilia: 'deciduous', Celtis: 'deciduous', Zelkova: 'deciduous', Pistacia: 'deciduous', Carpinus: 'deciduous',
  Fagus: 'deciduous', Morus: 'deciduous', Alnus: 'deciduous', Betula: 'deciduous', Parrotia: 'deciduous',
  Ginkgo: 'deciduous', Populus: 'deciduous',
  'Populus nigra': 'columnar', "Carpinus betulus 'Fastigiata'": 'columnar', "Ginkgo biloba 'Princeton Sentry'": 'columnar',
  // weeping
  Maytenus: 'weeping', 'Schinus molle': 'weeping', Agonis: 'weeping', Salix: 'weeping',
  "Prunus subhirtella 'Pendula'": 'weeping',
  // the tall ones
  Eucalyptus: 'eucalyptus', Corymbia: 'eucalyptus', Grevillea: 'eucalyptus', Casuarina: 'eucalyptus',
  Lyonothamnus: 'eucalyptus',
  // conifers
  Pinus: 'pine', Cedrus: 'pine',
  Cupressus: 'cypress', Juniperus: 'cypress', Cupressocyparis: 'cypress', Taxus: 'cypress', Sequoia: 'cypress',
  Calocedrus: 'cypress',
  // palms and palm-likes
  Phoenix: 'canary', Washingtonia: 'fan', Trachycarpus: 'windmill', Chamaerops: 'windmill',
  Syagrus: 'queen', Arecastrum: 'queen',
  Cordyline: 'spiky', Yucca: 'spiky', Dicksonia: 'spiky',
}

/** entries that are not a tree: empty sites, stumps, paved-over basins */
const NOT_A_TREE = /^(planting site|stump|paved over|potential site|basin|landscape plants|$)/i

/** The form of a species by its Latin name; null for a site with no tree in it; 'evergreen' for "Tree(s)" and the unknowns. */
export function sfForm(latin: string): TreeForm | null {
  if (NOT_A_TREE.test(latin.trim())) return null
  let best: TreeForm = 'evergreen'
  let len = 0
  for (const [k, f] of Object.entries(FORMS)) {
    if (k.length > len && (latin === k || latin.startsWith(`${k} `) || latin.startsWith(k + "'"))) { best = f; len = k.length }
  }
  return best
}

/**
 * The height of a tree from its trunk (inches at breast height; 0 not measured). Street trees are pruned and
 * squeezed: a 10 in plane is about 8 m, a 30 in one 16. Palms grow up rather than out, the gums higher than the rest.
 */
export function sfHeight(form: TreeForm, dbh: number, r: number): number {
  const d = dbh > 0 && dbh < 80 ? dbh : 0
  switch (form) {
    case 'canary': return d ? Math.min(16, 7 + 0.25 * d) : 9 + r * 4
    case 'fan': return d ? Math.min(20, 8 + 0.5 * d) : 10 + r * 6
    case 'queen': return d ? Math.min(13, 6 + 0.4 * d) : 8 + r * 3
    case 'spiky': return 3 + r * 2.5
    case 'ficusGiant': return Math.min(18, 8 + 0.15 * d)
    case 'windmill': return d ? Math.min(8, 3 + 0.35 * d) : 4 + r * 3
    case 'eucalyptus': return d ? Math.min(24, 5 + 0.55 * d) : 12 + r * 5
    case 'flowering': case 'blossom': case 'pear': case 'plum': case 'bottlebrush': return d ? Math.min(9, 3.5 + 0.35 * d) : 5 + r * 1.5
    case 'olive': return d ? Math.min(9, 3.5 + 0.3 * d) : 5 + r * 2
    case 'cypress': case 'pine': return d ? Math.min(20, 4 + 0.45 * d) : 9 + r * 4
    default: return d ? Math.min(17, 3.8 + 0.42 * d) : 6 + r * 2.5
  }
}

/**
 * The famous row on Columbus between Broadway and Vallejo (owner, 2026-10-16, with a Street View: four great
 * pale-stemmed figs over the sidewalk): the city's list gives two of them 16-17 in trunks, which are wrong.
 */
const inFamousFigs = (lat: number, lon: number): boolean => lat > 37.7973 && lat < 37.7981 && lon > -122.4067 && lon < -122.4057

/** The street trees as plantings, in local metres. */
export function sfPlantings(trees: [number, number, string, number][], toLocal: (g: { lat: number; lon: number }) => { x: number; z: number },
                            inBox: (x: number, z: number) => boolean): Planting[] {
  const out: Planting[] = []
  for (const [lon, lat, latin, dbh] of trees) {
    let form = sfForm(latin)
    if (!form) continue
    // the old giants are another tree to look at, not a bigger clipped dome (owner, 2026-10-16: "extremely unusual")
    if (form === 'ficus' && ((dbh >= 30 && dbh < 80) || inFamousFigs(lat, lon))) form = 'ficusGiant'
    const { x, z } = toLocal({ lat, lon })
    if (!inBox(x, z)) continue
    // (a hash, not a random stream: the same tree gets the same spin however the list is ordered)
    const h = Math.abs(Math.sin(lat * 12.9898e3 + lon * 78.233e3) * 43758.5453) % 1
    out.push({ x, z, height: sfHeight(form, dbh, h), spin: h * 6.28, park: false, form: formCode(form) })
  }
  return out
}
