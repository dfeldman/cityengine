/**
 * Batch 2's gardens (2026-10-31; docs/landmarks/PARIS-BATCHES.md; owner, 2026-10-30: "A special focus should be park gardens, since in a cycling game they are very obvious"). Traced from IGN's aerial
 * (tools/ortho.ts) read off a metre grid, north up, round each park's own origin. Two of these parks have no register behind them, so the trees come from the photograph too (paris-batch2-trees.ts): the plan's `rows`
 * here are single trees, and wait for a real bake. What a plan can't say (water, follies, glasshouses, rock) is a landmark entry in public/landmarks/paris/batch2.json. The Jardin Atlantique is not here: it lies on a deck 19 m up, where
 * a plan can't reach (paris/batch2/atlantique.ts); nor is the Coulée verte, on its viaduct.
 */
import { closed, frame, type GardenPlan, type LL } from './plan.ts'
import { blob, grid, merge, strip, walkside, clump } from './paris-parks.ts'
import { ACCLIM_RING, ACCLIM_TREES, BELLEVILLE_TREES, CITEUEST_TREES, CITEUOUEST_TREES, CITEU_EST_RING, CITEU_OUEST_RING } from './paris-batch2-trees.ts'

type EN = [number, number]
/** each tree of the photograph as a row of one (index.ts rowPoints: one point at its middle) */
const trees = (g: (p: EN[]) => LL[], t: [number, number, number][]): Partial<GardenPlan> => ({
  rows: t.map(([e, n, h]) => ({ line: g([[e, n], [e + 1, n]]), spacing: 4, h })),
})
const roundel = (e: number, n: number, r: number, c = 16): EN[] => Array.from({ length: c }, (_, k) => [e + Math.cos((k / c) * Math.PI * 2) * r, n + Math.sin((k / c) * Math.PI * 2) * r])

/**
 * THE PARC DE BELLEVILLE (Debulois and Brichet, 1988; the hill, 108 m; aerial 48.8713 2.3849, 0.34 m/px). OSM has one polygon and a dozen walks, and the register 2 trees: it came out a bald green hillside, where the photograph
 * is a closed wood with a sunny terrace on top and two lawns in the trees. The trees are the photograph's; the terrace lawns and the two below are theirs; shrubs on the walks. The cascade, the belvedere's wall and the vines are entries.
 */
const belleville = (): GardenPlan => {
  const g = grid(48.8713, 2.3849)
  const walks: EN[][] = [
    [[-85, 75], [-88, 40], [-60, 25], [-40, 8], [-5, -10], [30, -15], [60, -30], [85, -50], [105, -62], [125, -62]], // the long walk across the hill
    [[-15, 22], [5, 15], [25, 5], [50, 0]], // the terrace's
    [[22, -50], [5, -90], [-18, -112]], // down to the Rue des Couronnes
    [[-160, -55], [-125, -25], [-90, -5], [-60, 0]],
  ]
  return merge(
    'Parc de Belleville',
    g([[-125, 118], [-85, 160], [-82, 60], [-85, 42], [-40, 30], [0, 25], [50, 8], [65, -8], [95, -30], [115, -60], [132, -85], [125, -93], [-10, -112], [-25, -85], [-50, -75], [-75, -100], [-105, -110], [-160, -60], [-130, -25], [-100, -10], [-118, 15], [-110, 40]]),
    {
      lawn: [
        g([[-12, 20], [8, 14], [28, 6], [46, 4], [38, 14], [20, 20], [0, 26]]),
        g([[-25, -46], [-2, -44], [3, -56], [-5, -62], [-24, -60]]),
        g([[16, -56], [28, -52], [46, -62], [40, -76], [20, -68]]),
      ],
      beds: [{ ring: g(blob(10, 21, 7, 2.5)) }, { ring: g(blob(34, 10, 6, 2.5)) }, { ring: g(blob(-30, 33, 8, 2.5)) }, { ring: g(blob(-60, 31, 7, 2.5)) }, { ring: g(blob(-8, -52, 4, 2)) }, { ring: g(blob(30, -60, 4, 2)) }],
    },
    trees(g, BELLEVILLE_TREES),
    ...walks.flatMap((w) => walkside(g, w)),
  )
}

/**
 * THE SQUARE DES BATIGNOLLES (Alphand, 1862, an English garden on the railway's edge; aerial 48.8875 2.3163, 0.22 m/px). The register has its trees and OSM its pond; what it lacks is what Alphand put between them: massed shrubs, flowers at the walks,
 * the sunny lawn in the middle. The pond's rockwork and Vautours, and the kiosk, are entries.
 */
const batignolles = (): GardenPlan => {
  const g = grid(48.8875, 2.3163)
  const walks: EN[][] = [
    [[-45, 92], [-38, 70], [-52, 50], [-55, 30], [-42, 20]],
    [[-30, 25], [-18, 18], [-5, 15]],
    [[10, 58], [30, 45], [42, 22], [50, 8]],
    [[8, -15], [22, -22], [27, -35], [25, -50]],
    [[-40, -22], [-25, -30], [-20, -45]],
    [[15, -68], [40, -60], [52, -45], [58, -30]],
  ]
  return merge(
    'Square des Batignolles',
    g([[-60, 100], [-20, 95], [25, 55], [60, 25], [95, 0], [70, -40], [40, -70], [30, -85], [20, -85], [-45, -30], [-70, 25]]),
    {
      lawn: [g([[18, 12], [32, 24], [42, 10], [46, -8], [34, -30], [20, -16], [14, -2]])],
      beds: [{ ring: g(blob(24, 16, 5, 2)) }, { ring: g(blob(40, -18, 2.5, 5)) }, { ring: g(blob(-8, 30, 3, 6)) }, { ring: g(blob(-56, 62, 2.5, 5)) }, { ring: g(blob(-30, -18, 5, 2.5)) }],
    },
    ...walks.flatMap((w) => walkside(g, w, { every: 18, off: 4, r: 2.5 })),
  )
}

/**
 * THE PARC MARTIN-LUTHER-KING (Jacqueline Osty, 2007–2020; on the Batignolles goods yard; aerial 48.8912 2.3135, 0.5 m/px). Its trees are registered and OSM has walks and water. What it lacks is the long pale promenade the whole park hangs from, the
 * reeds round the Bassin Biotope and the canal, and the planting along them. No clipping: a new, loose, naturalistic park.
 */
const clichyBatignolles = (): GardenPlan => {
  const g = grid(48.8912, 2.3135)
  const promenade: EN[] = [[3, 40], [25, 0], [45, -50], [70, -105], [95, -160], [120, -205]]
  const reeds = (line: EN[]): Partial<GardenPlan>[] => walkside(g, line, { every: 9, off: 1.5, flowers: 0, r: 1.5 })
  return merge(
    'Parc Clichy-Batignolles Martin-Luther-King',
    g([[-215, 195], [-100, 235], [-40, 130], [5, 60], [50, 50], [50, -30], [130, -80], [200, -110], [130, -215], [100, -215], [40, -70], [0, -30], [-60, 0], [-120, 40], [-165, 90]]),
    {
      gravel: [g(strip(promenade, -3.5, 3.5)), g(strip([[-139, 73], [-90, 95], [-55, 117]], -2.5, 2.5))],
      beds: [{ ring: g(strip([[10, 25], [25, -5]], 4, 6)) }, { ring: g(strip([[35, -28], [50, -60]], -6, -4)) }, { ring: g(strip([[62, -90], [78, -125]], 4, 6)) }, { ring: g(strip([[-120, 84], [-85, 100]], 3, 5)) }, { ring: g(strip([[-85, 100], [-58, 115]], -5, -3)) }],
    },
    ...walkside(g, promenade, { every: 22, off: 7.5, flowers: 3, r: 3 }),
    ...reeds([[-135, 62], [-100, 66], [-65, 72], [-40, 76]]),
    ...reeds([[-50, 22], [-18, 20], [-14, 50]]),
  )
}

/**
 * THE JARDIN DES SERRES D'AUTEUIL's remainder (paris-public.ts has the formal axis; aerial 48.8466 2.2525, 0.34 m/px): the École's garden east of the glasshouses, its long lawn and the sunk hedged parterre. The glasshouses themselves are an entry.
 */
const serresEast = (): GardenPlan => {
  const g = grid(48.8466, 2.2525)
  return merge(
    'Jardin des serres d\'Auteuil: the east lawn',
    g([[50, 18], [105, 18], [105, 52], [50, 52]]),
    {
      lawn: [g([[52, 20], [103, 20], [103, 50], [52, 50]])],
      gravel: [g([[50, 26], [68, 26], [68, 30], [50, 30]])],
      beds: [{ ring: g([[71, 26], [88, 26], [88, 37], [71, 37]]), rim: true }],
      hedges: [{ line: g(closed([[68, 24], [91, 24], [91, 39], [68, 39]] as EN[]) as EN[]), h: 1, w: 0.7 }],
    },
  )
}

/**
 * THE PARCS DE LA CITÉ UNIVERSITAIRE (Est and Ouest; aerial 48.8190 2.3385, 0.8 m/px). The Grande Pelouse is OSM's; the woods round it are half-registered and half not. The rest of the crown is the photograph's, shrubs at the walks' edges, the terrace behind the
 * Maison Internationale in pale gravel with a clipped edge. Its round rose court is OSM's.
 */
const citeEst = (): GardenPlan => {
  const g = grid(48.819, 2.3385)
  const walks: EN[][] = [
    [[-125, -140], [-110, -85], [-95, -30]],
    [[-5, -40], [-28, -90], [-50, -140]],
    [[-100, -15], [-50, -28], [-5, -40]],
    [[0, -150], [50, -140], [100, -135], [160, -130]],
    [[-5, -40], [40, -60], [90, -90], [130, -130]],
  ]
  return merge(
    'Cité universitaire: Parc Est',
    g(CITEU_EST_RING as EN[]),
    {
      gravel: [g(strip([[-95, -22], [-50, -33], [-8, -45]], -3, 3))],
      hedges: [{ line: g([[-95, -28], [-50, -39], [-8, -51]]), h: 0.9, w: 0.7 }],
      beds: [{ ring: g(strip([[-90, -31], [-60, -38]], -3.5, -2)) }, { ring: g(strip([[-40, -44], [-12, -52]], -3.5, -2)) }],
    },
    trees(g, CITEUEST_TREES),
    ...walks.flatMap((w) => walkside(g, w, { every: 40, off: 6, flowers: 2 })),
  )
}
const citeOuest = (): GardenPlan => {
  const g = grid(48.8203, 2.3316)
  return merge(
    'Cité universitaire: Parc Ouest',
    g(CITEU_OUEST_RING as EN[]),
    trees(g, CITEUOUEST_TREES),
    ...walkside(g, [[-110, -60], [-40, -30], [30, -60], [80, -110]], { every: 40, off: 6, flowers: 2 }),
    ...walkside(g, [[-40, -30], [-30, 60], [10, 130]], { every: 40, off: 6, flowers: 2 }),
  )
}

/**
 * THE JARDIN CHARLES-AZNAVOUR (the Carré Ledoyen, Alphand's; the Pavillon Ledoyen in it, the Grand Palais's neighbour; aerial 48.8660 2.3177, 0.34 m/px). The trees and OSM's hooped lawns stay: its walks are the thing, broad raked pale sand, where OSM's
 * are a metre or two of path. The same treatment as the Ambassadeurs and Marigny in paris-public.ts.
 */
const aznavour = (): GardenPlan => {
  const g = grid(48.866, 2.3177)
  const walks: [EN[], number][] = [
    [[[-140, -100], [-142, 0], [-138, 60], [-125, 100]], 9],
    [[[-125, 100], [-60, 55], [-5, 30], [45, 12], [80, -5]], 6],
    [[[-25, 50], [-32, 25], [-25, 0], [-40, -20], [-60, -38], [-75, -70], [-85, -92]], 8],
    [[[-140, -25], [-105, -50], [-85, -60], [-70, -40]], 7],
    [[[-125, 35], [-75, 38], [-50, 45]], 6],
    [[[45, 10], [42, -20], [50, -50], [75, -60]], 7],
    [[[-5, -55], [30, -50], [50, -50]], 5],
    [[[65, -60], [58, -85]], 5],
  ]
  return merge(
    'Jardin Charles-Aznavour',
    g([[-150, -105], [-150, 60], [-125, 105], [-60, 62], [-5, 36], [45, 18], [88, -5], [85, -105]]),
    { gravel: walks.map(([l, w]) => g(strip(l, -w / 2, w / 2))) },
    ...walks.flatMap(([l, w]) => walkside(g, l, { every: 45, off: w / 2 + 3, flowers: 2, r: 2 })),
  )
}

/**
 * THE JARDIN D'ACCLIMATATION (1860; 18 ha, fenced, a theme park now; aerial 48.8785 2.2645, 0.7 m/px). The register stops at its railings: it came out a mown field with sheds on it, where the photograph is a wood with a clearing. The crown is the
 * photograph's, the formal court before the Palais is traced, and shrubs on the great walk. Its rides are OSM's; the volière, kiosk, carousel, Korean pavilion and rock are entries.
 */
const acclimatation = (): GardenPlan => {
  const g = grid(48.8785, 2.2645)
  return merge(
    'Jardin d\'Acclimatation',
    g(ACCLIM_RING as EN[]),
    {
      gravel: [g([[-73, 28], [-7, 28], [-7, 73], [-73, 73]])],
      lawn: [g([[-52, 34], [-28, 34], [-28, 67], [-52, 67]]), g([[-68, 34], [-58, 34], [-58, 67], [-68, 67]]), g([[-22, 34], [-12, 34], [-12, 67], [-22, 67]])],
      beds: [{ ring: g([[-50, 32], [-30, 32], [-30, 34], [-50, 34]]) }, { ring: g([[-50, 67], [-30, 67], [-30, 69], [-50, 69]]) }],
      hedges: [[-52, 34, -28, 67], [-68, 34, -58, 67], [-22, 34, -12, 67]].map(([a, b, c, d]) => ({ line: g(closed([[a, b], [c, b], [c, d], [a, d]] as LL[]) as EN[]), h: 0.5, w: 0.4 })),
      topiary: [[-55, 31], [-25, 31], [-55, 70], [-25, 70]].map(([e, n]) => ({ at: g([[e, n]])[0], shape: 'cone' as const, h: 2.4 })),
    },
    trees(g, ACCLIM_TREES),
    ...walkside(g, [[-330, 20], [-200, 55], [-100, 30], [0, 25], [100, 15], [200, 0]], { every: 26, off: 6 }),
    ...walkside(g, [[0, 25], [-10, -40], [-40, -100], [-50, -150]], { every: 26, off: 5 }),
  )
}

/** The COUR D'HONNEUR at TENON (Billon, 1878; aerial 48.8664 2.4018, the round parterre the wards look on): a round bed in its lawn, in a clipped ring, between the pavilions. */
const tenonCourt = (): GardenPlan => {
  const g = grid(48.8664, 2.4018)
  const f = frame(48.8664 - 40 / 111320, 2.4018 - 20 / 73370, 61)
  return {
    name: 'Hôpital Tenon: the cour d\'honneur',
    ring: g(roundel(-20, -40, 14)),
    lawn: [g(roundel(-20, -40, 11))],
    beds: [{ ring: g(roundel(-20, -40, 4.5)), rim: true }],
    hedges: [{ line: g(closed(roundel(-20, -40, 11.5) as unknown as LL[]) as unknown as EN[]), h: 0.7, w: 0.5 }],
    topiary: [[-11, 0], [11, 0], [0, -11], [0, 11]].map(([u, v]) => ({ at: f(u, v), shape: 'ball' as const, h: 1.8 })),
  }
}

/** The JARDIN DES CARMES (the Institut Catholique's; aerial 48.8488 2.3303): the old convent's garden, walled, its round court and cross. The register has the trees. */
const carmes = (): GardenPlan => {
  const g = grid(48.8488, 2.3303)
  return merge('Jardin des Carmes', g([[-62, 62], [-8, 62], [-8, 8], [-62, 8]]), { gravel: [g(roundel(-35, 40, 7)), g(strip([[-35, 12], [-35, 33]], -1.2, 1.2))], lawn: [g(roundel(-35, 40, 4.5))], beds: [{ ring: g(roundel(-35, 40, 1.8)) }] }, clump(g, -50, 24, 5), clump(g, -18, 24, 5), clump(g, -52, 52, 4), clump(g, -18, 52, 4))
}

/** The JARDIN DE LA PAIX at UNESCO (Isamu Noguchi, 1958; aerial 48.8495 2.3065): the Japanese garden between the Y and the Avenue de Suffren: shrubs and stone, a stream the plan doesn't say. Massed shrubs on its grid of walks. */
const unescoGarden = (): GardenPlan => {
  const g = grid(48.8495, 2.3065)
  return merge(
    'UNESCO: the Jardin de la Paix',
    g([[-125, 55], [-40, 45], [-30, -40], [-85, -55], [-125, -20]]),
    { gravel: [g(strip([[-110, 42], [-55, 30], [-40, 5]], -1.5, 1.5)), g(strip([[-95, -35], [-55, -18], [-40, 5]], -1.2, 1.2))], beds: [{ ring: g(blob(-85, 12, 6, 3)) }, { ring: g(blob(-65, -5, 5, 3)) }] },
    ...[[-100, 15, 5], [-75, 25, 4], [-58, 12, 4], [-92, -12, 5], [-70, -28, 4], [-50, -8, 3]].map(([e, n, r]) => clump(g, e, n, r)),
  )
}

export const BATCH2_GARDENS: GardenPlan[] = [belleville(), batignolles(), clichyBatignolles(), serresEast(), citeEst(), citeOuest(), aznavour(), acclimatation(), tenonCourt(), carmes(), unescoGarden()]
