/**
 * A planting's FORM: what kind of tree stands there, as far as the renderer needs to know. The bake decides it from
 * whatever a region knows about its trees (San Francisco: the species of every street tree, city/sf/trees.ts);
 * each region's flora (render/flora.ts) says which models draw each form. Code 0 is "no form known", which every
 * package baked before forms existed has, and which falls back to the region's street and park pools.
 *
 * Shared, and append-only: the code is stored in the package (city/plantings.ts), so a form's number never changes.
 */
export const TREE_FORMS = [
  '',
  'plane',        // London plane and sycamores: the big lobed-leaf deciduous street tree, often pollarded
  'evergreen',    // brisbane box, water gum and the unknowns: an upright oval evergreen crown
  'laurel',       // pittosporum, magnolia, bay, privet, loquat, podocarpus: dense, dark, glossy, conical
  'ficus',        // Indian laurel fig: the clipped dense dark dome on a pale trunk, the downtown street tree
  'myrtle',       // New Zealand Christmas tree (pohutukawa): wide, dark, with the crimson brush flowers
  'olive',        // olive, strawberry tree, acacia, melaleuca, tea tree: small grey-green leaves, gnarled
  'bottlebrush',  // callistemon: fine grey-green with the red brushes
  'plum',         // cherry plum: the purple-leaved street tree, pink blossom in February
  'blossom',      // cherries, crabapples, redbud, crape myrtle: small, round, pink in flower
  'pear',         // flowering pears, hawthorn, fringe tree: small, upright, white in flower
  'flowering',    // the other small deciduous: goldenrain, locust, Japanese maple, chitalpa, jacaranda
  'deciduous',    // the rest of the deciduous street trees: elm, maple, ash, liquidambar, ginkgo, zelkova
  'columnar',     // Lombardy poplar and the fastigiate cultivars
  'weeping',      // mayten, pepper tree, peppermint willow, weeping bottlebrush, willows
  'eucalyptus',   // the tall, sparse-crowned gums (and the tall acacias, silk oak, she-oak)
  'pine',         // pines and cedars
  'cypress',      // cypress, juniper, yew, redwood
  'canary',       // Canary Island date palm (and the date palm)
  'fan',          // fan palms: Washingtonia, windmill palm, Mediterranean fan palm
  'queen',        // queen palm: slim trunk, feather crown
  'spiky',        // cabbage tree, yucca, tree fern: a small tuft on a stem
  'windmill',     // windmill palm, Mediterranean fan palm: a small fan palm, four to eight metres
  'oak',          // the park oak: a big spreading deciduous or coast live oak, not the clipped street Quercus
] as const

export type TreeForm = (typeof TREE_FORMS)[number]

export const formCode = (f: TreeForm): number => TREE_FORMS.indexOf(f)
export const formOf = (code: number): TreeForm => TREE_FORMS[code] ?? ''

/** the palm forms, drawn by render/palms.ts rather than from the tree library */
export const PALM_FORMS: ReadonlySet<TreeForm> = new Set<TreeForm>(['canary', 'fan', 'queen', 'spiky', 'windmill'])
