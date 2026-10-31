/**
 * Batch 6's gardens (2026-10-31; docs/landmarks/PARIS-BATCHES.md; owner, 2026-10-30: "A special focus should be park gardens, since in a cycling game they are very obvious"). Traced from IGN's aerial (tools/ortho.ts) read off the photograph's own pixels, as paris-batch5.ts does: each plan names the frame it read, and `pix` turns [x, y] on that picture into lat/lon. North is up on all of them.
 * The Jardins des Grands-Explorateurs are already paris-public.ts's and the Observatoire's fountain is a model: nothing here. What a plan can't say (Brassens's market halls, the Rocher at Bagatelle, Kahn's Japanese bridge and houses, the Grande Cascade and its basins, Billancourt's parasols) is a landmark entry in public/landmarks/paris/batch6.json (src/render/landmarks/paris/batch6/parks.ts).
 * No `lawn` here either, for paris-batch5.ts's reason: OSM's green is under them all, and a plan's lawn reads as a stain on it. In the Bois and at Saint-Cloud the scatter's woods stood on what the photograph shows as grass, so a `ringOnly` round the lawn takes them off (only a real bake shows that).
 */
import { type GardenPlan, type LL } from './plan.ts'
import { clump, grid, merge, strip, walkside } from './paris-parks.ts'

type EN = [number, number]
type XY = [number, number]
/** one aerial's own pixels: the picture of half-width 500·mpp round (lat, lon), [x, y] from its top left, to the park's metre grid and to lat/lon */
const pix = (lat: number, lon: number, mpp: number) => {
  const g = grid(lat, lon)
  const en = (p: XY[]): EN[] => p.map(([x, y]) => [(x - 500) * mpp, (500 - y) * mpp])
  return { g, en, ll: (p: XY[]): LL[] => g(en(p)), mpp }
}
type Pix = ReturnType<typeof pix>
const round = (P: Pix, x: number, y: number, r: number, n = 18): LL[] => P.g(Array.from({ length: n }, (_, k) => {
  const a = (k / n) * Math.PI * 2
  return [(x - 500) * P.mpp + Math.cos(a) * r, (500 - y) * P.mpp + Math.sin(a) * r] as EN
}))
const border = (P: Pix, line: XY[], w = 2): { ring: LL[] } => ({ ring: P.g(strip(P.en(line), -w / 2, w / 2)) })
const walk = (P: Pix, line: XY[], w: number): LL[] => P.g(strip(P.en(line), -w / 2, w / 2))
const walks = (P: Pix, lines: XY[][], o: Parameters<typeof walkside>[2] = {}): Partial<GardenPlan>[] => lines.flatMap((l) => walkside(P.g, P.en(l), o))
const lumps = (P: Pix, at: [number, number, number][]): Partial<GardenPlan>[] => at.map(([x, y, r]) => clump(P.g, (x - 500) * P.mpp, (500 - y) * P.mpp, r))
const ringOnly = (name: string, ring: LL[]): GardenPlan => ({ name, ring, ringOnly: true })

/**
 * THE CLOS DES MORILLONS (the Vaugirard vines, replanted 1985; aerial 48.8313 2.2985, 0.12 m/px, OSM's vineyards way/866761984 and way/866761985). Batch 1 ruled these straight along the park's axis, across the slope; the photograph has them across it the other way, two fans on the hillside: a west block of straight rows on bearing 125, and the larger east block's rows in arcs round the slope's head, broken by four grass aisles. A row is a hedge a metre tall. The vignerons' tiled hut is an entry.
 */
const clos = (): GardenPlan => {
  const P = pix(48.8313, 2.2985, 0.12)
  const rowsWest = Array.from({ length: 6 }, (_, k) => {
    const t = k / 5
    const a: XY = [585 - 40 * t, 635 + 45 * t], b: XY = [695 - 30 * t, 725 + 60 * t]
    return { line: P.ll([a, b]), h: 1, w: 0.45 }
  })
  const C: XY = [870, 650], gaps: [number, number][] = [[62, 76], [79, 94], [97, 112], [115, 128], [131, 142]]
  const rowsEast = Array.from({ length: 13 }, (_, k) => 92 + k * 13.5).flatMap((r) => gaps.map(([a0, a1]) => ({
    line: P.ll(Array.from({ length: 7 }, (_, i) => {
      const a = ((a0 + ((a1 - a0) * i) / 6) * Math.PI) / 180
      return [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r] as XY
    })),
    h: 1, w: 0.45,
  })))
  return merge(
    'Parc Georges-Brassens: le Clos des Morillons',
    P.ll([[525, 625], [590, 610], [720, 700], [860, 690], [1000, 780], [1000, 920], [820, 925], [660, 800]]),
    { hedges: [...rowsWest, ...rowsEast] },
    { gravel: [walk(P, [[662, 793], [690, 730], [712, 735]], 1.6)] },
  )
}

/**
 * The market's side of the PARC GEORGES-BRASSENS (aerial 48.8315 2.3010, 0.26 m/px): the paved round court where the book market's two halls break, the walk behind them from the pond, the two half-round stepped lawns of the little amphitheatre, the cross of pale walks with its planted bed in the middle, and the terrace in front of the theatre. paris-parks.ts has the pond's esplanade and the vines' slope; the halls are an entry.
 */
const brassensHalls = (): GardenPlan => {
  const P = pix(48.8315, 2.301, 0.26)
  return merge(
    'Parc Georges-Brassens: la cour des halles',
    P.ll([[400, 470], [640, 470], [790, 500], [800, 560], [680, 800], [660, 830], [500, 900], [420, 800]]),
    {
      gravel: [
        round(P, 778, 531, 6.5, 16),
        walk(P, [[620, 475], [690, 495], [750, 525]], 3),
        walk(P, [[740, 545], [690, 510], [640, 530], [610, 570]], 2.4),
        walk(P, [[450, 628], [495, 620], [555, 625]], 2.6),
        walk(P, [[495, 625], [520, 780]], 3),
        walk(P, [[400, 760], [480, 700], [550, 705]], 2.8),
        P.ll([[490, 790], [545, 785], [590, 850], [550, 890], [500, 850]]),
        // (the amphitheatre's two half-rounds are OSM's lawn: its stone is the entry's)
      ],
      beds: [
        { ring: P.ll([[460, 628], [490, 625], [505, 680], [470, 685]]), rim: true },
        border(P, [[595, 545], [625, 525], [660, 520]], 2),
        border(P, [[660, 560], [700, 595]], 1.6),
      ],
    },
    ...lumps(P, [[720, 520, 3], [540, 730, 3], [610, 700, 3.5]]),
  )
}

/**
 * THE JARDIN DE REUILLY-PAUL-PERNIN (Pierre Colboc, 1998, on the old Reuilly goods yard; aerial 48.8423 2.3875, 0.26 m/px): the great lawn, the Coulée verte's passerelle flying over the middle of it (an entry), and the three long dark walls of clipped cypress that shut in the lawn's north side, which is what you see first from the Rue Albinoni. South of the lawn the old railway's remains: the walled rock garden in its pit of pale stone, the little terraced walks and stairs down to the Rue de Rambouillet side, and the round lawn by the Rue Montgallet. Lawn, the register's trees and OSM's water stay.
 */
const reuilly = (): GardenPlan => {
  const P = pix(48.8423, 2.3875, 0.26)
  // the cypress walls, standing as a hedge does but a rider sees over nothing
  const wall = (a: XY, b: XY) => ({ line: P.ll([a, b]), h: 8, w: 4.2 })
  return merge(
    'Jardin de Reuilly-Paul-Pernin',
    [[48.842527, 2.386129], [48.842195, 2.386446], [48.842061, 2.38662], [48.841946, 2.386847], [48.841796, 2.387196], [48.841664, 2.387535], [48.841504, 2.388001], [48.841637, 2.388133], [48.841591, 2.38834], [48.84199, 2.388545], [48.842026, 2.388379], [48.842099, 2.388266], [48.842154, 2.388291], [48.842147, 2.388593], [48.842488, 2.388782], [48.84287, 2.388371], [48.842863, 2.388224], [48.842509, 2.387463], [48.842279, 2.387346], [48.842388, 2.386773], [48.842423, 2.386595]],
    {
      gravel: [
        walk(P, [[483, 470], [530, 445], [570, 425]], 3),
        walk(P, [[258, 550], [300, 525], [340, 510], [352, 545]], 2.6),
        P.ll([[276, 595], [352, 545], [370, 610], [320, 640]]),
        walk(P, [[320, 640], [345, 620], [368, 650]], 1.8),
        walk(P, [[420, 690], [455, 705], [460, 745], [520, 690], [550, 688]], 2.2),
        walk(P, [[590, 678], [650, 656], [690, 685], [735, 690]], 2.4),
        walk(P, [[655, 690], [650, 730]], 1.6),
        walk(P, [[600, 690], [618, 700], [602, 720], [620, 735], [600, 760], [620, 790]], 1.8),
        P.ll([[770, 460], [830, 395], [858, 420], [800, 540], [750, 530]]),
      ],
      beds: [
        border(P, [[520, 465], [545, 452]], 1.4),
        border(P, [[595, 690], [640, 672]], 1.5),
        border(P, [[262, 540], [310, 518]], 1.3),
        { ring: P.ll([[372, 665], [420, 630], [440, 690], [395, 705]]) },
      ],
      hedges: [wall([645, 455], [830, 425]), wall([655, 510], [820, 475]), wall([640, 400], [800, 345])],
    },
    ...lumps(P, [[450, 440, 3], [700, 700, 3], [400, 590, 2.5], [710, 575, 3]]),
    ...walks(P, [[[770, 560], [840, 480]]], { every: 22, r: 2.5 }),
  )
}

/**
 * THE PARC DE BAGATELLE's remainder (aerial 48.87 2.246, 0.64 m/px; its four formal gardens are paris-public.ts's). OSM has the water and the walks. The scatter has made a wood of what the photograph shows is an English park of great lawns under single trees, so the lawns' rings keep it off them (a real bake shows it); and the walks get the massed shrubs and iris borders Bagatelle is known for. The Rocher, the Kiosque and the Trianon are entries.
 */
const bagatelle = (): GardenPlan[] => {
  const P = pix(48.87, 2.246, 0.64)
  return [
    ringOnly('Parc de Bagatelle: la grande pelouse', P.ll([[680, 180], [700, 130], [770, 75], [840, 75], [890, 160], [895, 200], [830, 165], [770, 190], [720, 250], [690, 230]])),
    ringOnly('Parc de Bagatelle: la pelouse des rosiers', P.ll([[880, 90], [990, 60], [1000, 180], [960, 230], [900, 200]])),
    ringOnly('Parc de Bagatelle: la pelouse de l\'est', P.ll([[750, 380], [800, 370], [880, 430], [895, 500], [810, 550], [770, 510]])),
    ringOnly('Parc de Bagatelle: la pelouse de la pièce d\'eau', P.ll([[830, 300], [880, 290], [960, 320], [990, 350], [900, 390], [840, 350]])),
    ringOnly('Parc de Bagatelle: la pelouse de l\'Orangerie', P.ll([[335, 760], [400, 750], [400, 830], [340, 850]])),
    merge(
      'Parc de Bagatelle: la pelouse du Rocher',
      P.ll([[520, 520], [570, 500], [640, 530], [720, 560], [770, 580], [720, 620], [650, 640], [590, 625], [520, 600]]),
      {},
      ...walks(P, [[[520, 600], [560, 510]], [[630, 560], [660, 620], [700, 590]]], { every: 26, r: 3 }),
    ),
    {
      name: 'Parc de Bagatelle: les bordures',
      ring: P.ll([[820, 240], [850, 290], [890, 450], [800, 540], [790, 400]]),
      beds: [border(P, [[820, 250], [835, 300], [850, 355]], 2.2), border(P, [[885, 425], [895, 490]], 2.2), border(P, [[752, 490], [785, 545]], 2.2)],
    },
  ]
}

/**
 * THE JAPANESE GARDEN OF ALBERT KAHN (Boulogne; Kahn's village of 1898, Fumiaki Takano's contemporary garden of 1990; aerial 48.842 2.2288, 0.16 m/px, under its trees, OSM's pond way/113610865). The photograph sees only maples and a clearing, so the walks are traced from the pond's own shape and the museum's plan: round the water, over the red bridge, up to the houses and the tea pavilion, moss and clipped azalea at the water's edge. The bridge, houses and lanterns are an entry. The French garden and the panels are paris-public.ts's.
 */
const kahnJapon = (): GardenPlan => {
  const P = pix(48.842, 2.2288, 0.16)
  // (the azaleas: low clipped mounds, in drifts down to the water, as the Takano garden's are)
  const azaleas: LL[] = P.ll([[210, 670], [235, 680], [262, 666], [224, 720], [190, 760], [205, 800], [250, 825], [290, 840], [320, 818], [355, 842], [395, 838], [430, 800], [460, 790], [440, 740], [470, 710], [470, 660]])
  return merge(
    'Jardin Albert-Kahn: le jardin japonais',
    P.ll([[140, 640], [260, 600], [450, 610], [540, 680], [540, 830], [460, 880], [240, 890], [140, 810]]),
    {
      gravel: [
        walk(P, [[160, 630], [235, 640], [330, 625], [420, 650], [510, 700], [520, 780], [480, 840], [380, 870], [270, 865], [180, 800], [150, 720], [160, 630]], 2),
        P.ll([[360, 625], [440, 628], [450, 665], [370, 665]]),
      ],
      topiary: azaleas.map((at, k) => ({ at, shape: 'shrub' as const, h: 0.9 + (k % 3) * 0.3 })),
      beds: [{ ring: P.ll([[245, 625], [300, 618], [305, 638], [250, 645]]) }],
    },
    ...lumps(P, [[500, 640, 2.2], [200, 860, 2.5], [520, 840, 2.2]]),
  )
}

/**
 * THE SQUARE DES ARÈNES DE LUTÈCE AND THE SQUARE CAPITAN (aerial 48.845 2.353, 0.16 m/px): the model is the arena; round it the walk behind the east tiers, the slot of a kitchen garden north of the arena and its gravel, the way in from the Rue de Navarre, and Capitan's raised court in the north-east, gravel under big planes with its long planted bank. OSM's trees stand: a square of walks and shrubs.
 */
const arenes = (): GardenPlan => {
  const P = pix(48.845, 2.353, 0.16)
  return merge(
    'Square des Arènes de Lutèce et Capitan',
    // (the ring takes the arena's sand in too: the scatter had shrubs on the pitch, 2026-10-31)
    P.ll([[330, 140], [500, 145], [620, 190], [800, 165], [1000, 170], [1000, 480], [900, 470], [730, 780], [700, 880], [470, 930], [310, 880], [300, 610], [282, 440], [300, 270]]),
    {
      gravel: [
        walk(P, [[345, 155], [355, 215], [365, 262]], 3.2),
        P.ll([[398, 155], [480, 158], [482, 190], [400, 185]]),
        P.ll([[555, 212], [595, 245], [695, 465], [640, 505], [598, 470], [596, 390], [555, 290], [430, 262], [425, 245], [500, 245]]),
        P.ll([[925, 175], [1000, 250], [1000, 340], [915, 340], [800, 250]]),
        walk(P, [[785, 315], [840, 370], [895, 430]], 2.2),
        walk(P, [[635, 590], [645, 615]], 2),
        walk(P, [[757, 620], [770, 660], [738, 750]], 1.8),
      ],
      beds: [
        { ring: P.ll([[428, 192], [480, 192], [478, 245], [426, 245]]) },
        { ring: P.ll([[808, 315], [850, 300], [925, 385], [895, 408]]) },
        border(P, [[612, 245], [660, 360]], 2),
      ],
    },
    ...lumps(P, [[640, 310, 2.5], [760, 280, 3], [870, 440, 2.5], [300, 240, 2.2]]),
  )
}

/**
 * THE PARC DE SAINT-CLOUD's near end (Le Nôtre; Domaine national; aerial 48.8372 2.219, 0.30 m/px). The box reaches it by a few hundred metres: the world's detail stops at the Grande Cascade, which a rider sees across the Seine and from the Pont de Saint-Cloud. So only that end: the broad gravel avenues and the clipped charmilles along them, and the grass strips the scatter had as forest. The basins and the Cascade are entries (OSM has only the Bassin des Carpes as water). The woods stay.
 */
const saintCloud = (): GardenPlan[] => {
  const P = pix(48.8372, 2.219, 0.3)
  // (a wall of clipped hornbeam on its low trunk)
  const wall = (a: XY, b: XY) => ({ line: P.ll([a, b]), h: 5, w: 3.5 })
  return [
    merge(
      'Parc de Saint-Cloud: les avenues',
      P.ll([[420, 620], [545, 625], [800, 660], [900, 740], [890, 800], [790, 850], [545, 780], [420, 760]]),
      {
        gravel: [
          walk(P, [[440, 625], [560, 640], [800, 665], [860, 680]], 8),
          walk(P, [[450, 740], [545, 765], [775, 815]], 8),
          walk(P, [[975, 0], [905, 250], [860, 450], [835, 650], [810, 830], [790, 1000]], 9),
          walk(P, [[505, 40], [470, 330], [440, 620], [405, 760], [385, 1000]], 5),
        ],
      },
    ),
    {
      name: 'Parc de Saint-Cloud: le tapis de l\'est',
      ring: P.ll([[470, 590], [545, 110], [650, 100], [620, 180], [600, 420], [510, 430], [500, 600]]),
      hedges: [wall([610, 60], [900, 110]), wall([620, 180], [640, 440]), wall([660, 240], [890, 240]), wall([670, 300], [880, 330]), wall([655, 400], [855, 425])],
    },
    ringOnly('Parc de Saint-Cloud: le terrain de manœuvres', P.ll([[900, 460], [1000, 450], [1000, 720], [890, 680]])),
  ]
}

/**
 * THE PARC ANDRÉ-MALRAUX (Jacques Sgard, 1970s, on the old Nanterre tips, 25 ha; aerial 48.89288 2.21945, 1.1 m/px): OSM has the lake, the paths, the hills' lawns. It wants the great lawn kept open (a real bake) and what a park of the Seventies has: the round terrace at the head of the lawn, the planted hollow with its play-pond and the massed shrubs on the walks. Aillaud's Tours Nuages behind it are the fringe's, and read.
 */
const malraux = (): GardenPlan[] => {
  const P = pix(48.89288, 2.21945, 1.1)
  return [
    ringOnly('Parc André-Malraux: la grande pelouse', P.ll([[440, 530], [490, 510], [600, 490], [630, 520], [640, 590], [610, 600], [560, 560], [470, 550]])),
    ringOnly('Parc André-Malraux: la pelouse de l\'est', P.ll([[650, 620], [700, 640], [720, 660], [740, 630], [840, 700], [880, 700], [800, 720], [720, 700]])),
    merge(
      'Parc André-Malraux: la terrasse et les jeux',
      P.ll([[545, 585], [625, 585], [660, 620], [650, 700], [560, 700], [530, 640]]),
      {
        gravel: [round(P, 590, 603, 18, 22), walk(P, [[615, 620], [660, 595], [690, 560]], 5), walk(P, [[570, 620], [545, 660], [560, 700]], 4)],
        beds: [{ ring: round(P, 590, 603, 8, 14), rim: true }, border(P, [[560, 625], [595, 650], [630, 640]], 3)],
      },
      ...lumps(P, [[550, 640, 5], [640, 660, 5], [660, 620, 4]]),
    ),
    merge(
      'Parc André-Malraux: les massifs',
      P.ll([[280, 470], [340, 450], [430, 490], [420, 560], [330, 600], [260, 560]]),
      {},
      ...walks(P, [[[280, 500], [345, 480], [425, 525]], [[300, 590], [370, 610], [420, 650]], [[640, 480], [600, 460], [550, 465]]], { every: 40, r: 4, off: 8 }),
    ),
  ]
}

/**
 * THE PARC DE BILLANCOURT (Agence TER, 2010, on the Renault works' Trapèze; aerial 48.82612 2.23611, 0.34 m/px): OSM has its long canal-basin, the meadows and the deck paths. What it lacks: the reed beds along the water that clean the Trapèze's rain, the sand spit in the basin's elbow, and at the south-east corner the round paved place with its white parasols (an entry), and the shrub banks on the long walk.
 */
const billancourt = (): GardenPlan => {
  const P = pix(48.82612, 2.23611, 0.34)
  return merge(
    'Parc de Billancourt',
    [[48.826451, 2.234266], [48.826, 2.235351], [48.825729, 2.236015], [48.825422, 2.236766], [48.825171, 2.237377], [48.825133, 2.237802], [48.825807, 2.237956], [48.826151, 2.237249], [48.826389, 2.236666], [48.82658, 2.235998], [48.826766, 2.235745], [48.826906, 2.235221], [48.827115, 2.234895], [48.826646, 2.234444]],
    {
      gravel: [
        P.ll([[232, 417], [262, 430], [322, 452], [318, 468], [272, 458], [232, 435]]),
        P.ll([[700, 620], [760, 632], [832, 682], [800, 716], [750, 700], [700, 655]]),
        walk(P, [[530, 548], [600, 570], [680, 575], [720, 595]], 2.4),
        walk(P, [[780, 590], [830, 590], [880, 610]], 2.4),
        walk(P, [[470, 590], [560, 630], [640, 670], [690, 695]], 2.6),
      ],
      beds: [
        border(P, [[200, 280], [215, 245], [235, 225]], 3),
        border(P, [[165, 335], [200, 345], [240, 385]], 3),
        border(P, [[355, 505], [395, 530]], 2.6),
      ],
    },
    ...walks(P, [[[540, 560], [680, 590]], [[480, 600], [680, 690]]], { every: 22, r: 2.5 }),
    ...lumps(P, [[740, 610, 3], [840, 700, 3]]),
  )
}

export const BATCH6_GARDENS: GardenPlan[] = [clos(), brassensHalls(), reuilly(), ...bagatelle(), kahnJapon(), arenes(), ...saintCloud(), ...malraux(), billancourt()]
