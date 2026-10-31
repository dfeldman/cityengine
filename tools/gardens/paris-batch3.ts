/**
 * Batch 3's gardens (2026-10-31; docs/landmarks/PARIS-BATCHES.md; owner, 2026-10-30: "A special focus should be park gardens, since in a cycling game they are very obvious"). Traced from IGN's aerial
 * (tools/ortho.ts) read off the photograph's own pixels: each plan names the frame it read, its centre and metres a pixel, and `pix` turns [x, y] on that picture into lat/lon. North is up on all of them.
 * The register's trees are real and stay; OSM's lawns, water and pitches stay. These parks have no parterre forced on them: Choisy, Le Gall, Saint-Lambert and the Chapeau Rouge are 1930s formal gardens and their
 * plans are what they say; Kellermann, the Temple, Éole and Lenglen are read by their walks and shrubs. What a plan can't say (kiosks, rock, a fountain's wall, an artist's rocks on legs) is a landmark entry in
 * public/landmarks/paris/batch3.json (src/render/landmarks/paris/batch3/parks.ts). The Square Louise-Michel's stonework is sacreCoeurTerraces's: here only its flowers and shrubs.
 */
import { closed, type GardenPlan, type LL } from './plan.ts'
import { blob, clump, grid, merge, strip, walkside } from './paris-parks.ts'

type EN = [number, number]
type XY = [number, number]
/** one aerial's own pixels: the picture of half-width 500·mpp round (lat, lon), [x, y] from its top left, to the park's metre grid and to lat/lon */
const pix = (lat: number, lon: number, mpp: number) => {
  const g = grid(lat, lon)
  const en = (p: XY[]): EN[] => p.map(([x, y]) => [(x - 500) * mpp, (500 - y) * mpp])
  return { g, en, ll: (p: XY[]): LL[] => g(en(p)), mpp }
}
type Pix = ReturnType<typeof pix>
/** a ring round (x, y) on the picture, radius r in metres, a whole circle or the arc a0..a1 (degrees, east first, anticlockwise) as an open line */
const round = (P: Pix, x: number, y: number, r: number, n = 18): LL[] => P.g(Array.from({ length: n }, (_, k) => {
  const a = (k / n) * Math.PI * 2
  return [(x - 500) * P.mpp + Math.cos(a) * r, (500 - y) * P.mpp + Math.sin(a) * r] as EN
}))
const arc = (P: Pix, x: number, y: number, r: number, a0: number, a1: number, n = 14): LL[] => P.g(Array.from({ length: n + 1 }, (_, k) => {
  const a = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180
  return [(x - 500) * P.mpp + Math.cos(a) * r, (500 - y) * P.mpp + Math.sin(a) * r] as EN
}))
/** a flower border along a line on the picture, `w` metres wide */
const border = (P: Pix, line: XY[], w = 2.2): { ring: LL[] } => ({ ring: P.g(strip(P.en(line), -w / 2, w / 2)) })
const walks = (P: Pix, lines: XY[][], o: Parameters<typeof walkside>[2] = {}): Partial<GardenPlan>[] => lines.flatMap((l) => walkside(P.g, P.en(l), o))
const lumps = (P: Pix, at: [number, number, number][]): Partial<GardenPlan>[] => at.map(([x, y, r]) => clump(P.g, (x - 500) * P.mpp, (500 - y) * P.mpp, r))
/** a bed of flowers as a star, its points `r` metres out: the two stars in the lawns of the Parc de Choisy */
const star = (P: Pix, x: number, y: number, r: number): LL[] => P.g(Array.from({ length: 10 }, (_, k) => {
  const a = (k / 10) * Math.PI * 2 + Math.PI / 2, m = k % 2 ? r * 0.45 : r
  return [(x - 500) * P.mpp + Math.cos(a) * m, (500 - y) * P.mpp + Math.sin(a) * m] as EN
}))

/**
 * THE PARC KELLERMANN (Jacques Gréber, 1937–50, on the old fortifications; aerial 48.81856 2.35543, 0.5 m/px, g-kellermann). OSM has its lake, its basins and sixty lawns: what it lacks is the upper terrace's PARTERRE, the
 * long gravel panel between its two clipped walls of limes at the Boulevard Kellermann end, the ROND-POINT's half-round of hedges above the basins and the shrubs on the walks down to the lake. The Rochers dans le ciel and
 * the stone of the basins are entries.
 */
const kellermann = (): GardenPlan => {
  const P = pix(48.81856, 2.35543, 0.5)
  return merge(
    'Parc Kellermann',
    P.ll([[225, 245], [230, 450], [240, 590], [350, 650], [430, 800], [640, 900], [690, 800], [640, 560], [770, 420], [800, 360], [760, 330], [600, 400], [530, 250], [410, 240], [390, 330], [370, 240]]),
    {
      gravel: [P.ll([[592, 432], [772, 350], [792, 398], [618, 480]])],
      lawn: [P.ll([[628, 440], [750, 382], [762, 404], [642, 462]])],
      hedges: [
        { line: closed(P.ll([[622, 437], [752, 376], [768, 406], [638, 468]])), h: 0.8, w: 0.7 },
        // (the half-round above the basins: three-quarters of a ring, open to the lake)
        { line: arc(P, 528, 492, 15, -50, 230), h: 1, w: 0.9 },
        { line: arc(P, 528, 492, 9, -40, 220), h: 0.7, w: 0.6 },
      ],
      pleached: [
        { line: P.ll([[600, 424], [762, 342]]), y0: 2.6, h: 4.6, w: 5.5, spacing: 4 },
        { line: P.ll([[624, 480], [790, 396]]), y0: 2.6, h: 4.6, w: 5.5, spacing: 4 },
      ],
      beds: [
        border(P, [[640, 432], [745, 379]], 2.6), border(P, [[652, 470], [762, 415]], 2.6), border(P, [[622, 448], [640, 480]], 2),
        { ring: round(P, 528, 492, 12.5, 18) .slice(0, 9).concat(round(P, 528, 492, 10.5, 18).slice(0, 9).reverse()) },
        { ring: P.g(blob(-105 * 0.5, -5 * 0.5, 9, 3)) }, { ring: P.g(blob(-110, -8, 11, 3)) },
      ],
      topiary: [[592, 432], [772, 350], [792, 398], [618, 480]].map(([x, y]) => ({ at: P.ll([[x, y]])[0], shape: 'cone' as const, h: 2.8 })),
    },
    ...walks(P, [
      [[240, 520], [290, 515], [340, 505], [400, 495], [440, 440], [470, 420]],
      [[425, 335], [460, 400], [470, 420]],
      [[415, 430], [470, 520]],
      [[490, 250], [510, 320], [535, 375]],
      [[630, 520], [650, 580]],
      [[350, 620], [390, 660], [380, 670]],
      [[670, 700], [680, 760], [650, 860]],
    ], { every: 30 }),
  )
}

/**
 * THE PARC DE CHOISY (1937; aerial 48.82838 2.35992, 0.38 m/px, g-choisy): a French garden on a diagonal. The medallion in the middle, a lawn in a gravel oval; a lawn either side of it toward the
 * Avenue de Choisy and the Rue Charles-Moureu with a STAR of flowers in each and a square bed at its corner; the long lawn south-east between clipped walls of limes. All of this is gravel and shears; the register has the
 * trees round it and OSM the lawns' edges, loosely.
 */
const choisy = (): GardenPlan => {
  const P = pix(48.82838, 2.35992, 0.38)
  return merge(
    'Parc de Choisy',
    P.ll([[250, 640], [290, 620], [330, 575], [430, 490], [455, 420], [600, 340], [660, 380], [740, 720], [640, 790], [490, 680], [410, 600], [320, 665]]),
    {
      gravel: [
        P.ll([[310, 640], [420, 520], [500, 450], [620, 372], [655, 395], [560, 475], [645, 650], [620, 668], [540, 560], [480, 595], [440, 578], [335, 672]]),
      ],
      lawn: [
        P.ll([[322, 606], [415, 542], [445, 576], [346, 644]]),
        P.ll([[525, 455], [610, 396], [636, 422], [548, 492]]),
        P.ll([[443, 520], [482, 482], [522, 506], [486, 550]]),
        P.ll([[492, 586], [545, 542], [630, 655], [580, 695]]),
      ],
      beds: [
        { ring: star(P, 382, 592, 7.5) }, { ring: star(P, 580, 447, 7.5) },
        { ring: P.ll([[328, 620], [345, 610], [356, 625], [340, 637]]), rim: true },
        { ring: P.ll([[612, 408], [627, 396], [636, 410], [621, 422]]), rim: true },
        { ring: P.ll([[470, 500], [495, 512], [482, 536], [458, 524]]) },
        border(P, [[322, 600], [413, 536]]), border(P, [[525, 449], [608, 390]]), border(P, [[496, 592], [578, 690]], 1.8),
      ],
      hedges: [
        { line: closed(P.ll([[320, 604], [416, 539], [448, 576], [346, 647]])), h: 0.7, w: 0.6 },
        { line: closed(P.ll([[523, 454], [611, 394], [639, 422], [549, 495]])), h: 0.7, w: 0.6 },
      ],
      pleached: [
        { line: P.ll([[446, 604], [542, 702]]), y0: 2.6, h: 4.6, w: 6, spacing: 4 },
        { line: P.ll([[560, 516], [734, 726]]), y0: 2.6, h: 4.6, w: 6, spacing: 4 },
        { line: P.ll([[335, 588], [425, 528]]), y0: 2.6, h: 4.2, w: 4.5, spacing: 4 },
        { line: P.ll([[470, 440], [595, 378]]), y0: 2.6, h: 4.2, w: 4.5, spacing: 4 },
      ],
      topiary: [[310, 640], [335, 672], [620, 372], [655, 395], [622, 668], [645, 650]].map(([x, y]) => ({ at: P.ll([[x, y]])[0], shape: 'ball' as const, h: 1.8 })),
    },
    ...lumps(P, [[240, 490, 5], [300, 520, 5], [640, 530, 5], [700, 620, 5], [420, 720, 5], [550, 800, 6], [720, 690, 4]]),
    ...walks(P, [[[415, 700], [455, 720], [510, 800]], [[735, 590], [700, 540]], [[300, 640], [270, 660]]], { every: 26 }),
  )
}

/**
 * LES JARDINS D'ÉOLE (Michel Corajoud, 2007, on the old goods yards of the Gare de l'Est; aerial 48.88734 2.36624, 0.5 m/px, g-eole2): a thin strip beside the tracks, all straight lines and rough grass. Long pale walks; the meadow's dry grass,
 * uncut, and a wet ditch; the young birches in loose lots; the raised boardwalk (OSM's). The courts, painted in great shapes, are an entry.
 */
const eole = (): GardenPlan => {
  const P = pix(48.88734, 2.36624, 0.5)
  return merge(
    "Jardins d'Éole",
    P.ll([[600, 30], [710, 30], [690, 180], [640, 400], [560, 520], [510, 700], [410, 850], [290, 800], [320, 660], [420, 450], [490, 330], [540, 170]]),
    {
      gravel: [
        P.ll([[418, 768], [424, 770], [526, 512], [520, 510]]),
        P.ll([[384, 760], [390, 762], [436, 642], [430, 640]]),
        P.ll([[596, 368], [602, 368], [612, 180], [606, 180]]),
        P.ll([[584, 362], [590, 364], [612, 180], [606, 178]]),
        P.ll([[640, 300], [650, 305], [712, 60], [703, 58]]),
      ],
      // the meadows' tall grasses, in long runs of tufts beside the walks: Corajoud's wild edge, not a flower border (the first try's ribbons of red and purple shouted across the tracks)
      topiary: [[[430, 738], [510, 530]], [[396, 738], [428, 652]], [[614, 330], [622, 190]], [[660, 300], [716, 70]]].flatMap(([a, b]) => {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]) * P.mpp, n = Math.round(L / 6)
        return Array.from({ length: n }, (_, k) => ({ at: P.ll([[a[0] + ((b[0] - a[0]) * (k + 0.5)) / n, a[1] + ((b[1] - a[1]) * (k + 0.5)) / n]])[0], shape: 'shrub' as const, h: 0.9 + ((k * 7) % 5) * 0.14 }))
      }),
      beds: [border(P, [[612, 240], [616, 190]], 1.6), border(P, [[468, 640], [490, 585]], 1.6)],
    },
    ...lumps(P, [[360, 730, 5], [440, 560, 4], [470, 470, 4], [560, 400, 4], [620, 250, 3], [640, 170, 4], [680, 120, 4], [330, 760, 5], [480, 680, 3]]),
    ...walks(P, [[[420, 770], [520, 510]], [[600, 370], [610, 180]]], { every: 38, flowers: 0, off: 5 }),
  )
}

/**
 * THE SQUARE RENÉ-LE GALL (Jean-Charles Moreux, 1938, on the Bièvre's islands, once the Gobelins' weavers' gardens; aerial 48.83324 2.34972, 0.5 m/px, g-gall): the sunk PARTERRE at its south, a diamond in a diamond of box round
 * its round basin; the long walks to the north with their walls of limes, and the half-round lawn at the head; Moreux's rocaille obelisks are entries.
 */
const leGall = (): GardenPlan => {
  const P = pix(48.83324, 2.34972, 0.5)
  const d = (r: number): LL[] => P.g([[r, 0], [0, r], [-r, 0], [0, -r]].map(([e, n]) => [e + 42.5, n - 20] as EN))
  return merge(
    'Square René-Le Gall',
    P.ll([[515, 235], [595, 255], [610, 400], [640, 500], [620, 610], [480, 700], [380, 830], [260, 880], [320, 680], [420, 610], [510, 470], [520, 400]]),
    {
      gravel: [P.ll([[545, 435], [600, 435], [640, 500], [628, 600], [570, 610], [535, 560], [535, 500]])],
      lawn: [
        P.ll([[585, 502], [620, 540], [585, 578], [550, 540]]),
        P.ll([[530, 260], [590, 275], [592, 380], [528, 362]]),
      ],
      hedges: [
        { line: closed(d(21)), h: 0.9, w: 0.8 },
        { line: closed(d(12)), h: 0.6, w: 0.5 },
        { line: P.ll([[520, 245], [515, 360]]), h: 1.4, w: 1 },
        { line: P.ll([[597, 262], [598, 385]]), h: 1.4, w: 1 },
      ],
      beds: [
        { ring: d(5) },
        ...[[0, 20], [20, 0], [0, -20], [-20, 0]].map(([e, n]) => ({ ring: P.g(blob(42.5 + e * 1.15, -20 + n * 1.15, 2.2, 2.2, 6)), rim: true })),
        border(P, [[548, 450], [598, 450]], 2.2), border(P, [[552, 594], [620, 594]], 2.2),
      ],
      topiary: [[545, 435], [600, 435], [628, 600], [570, 610]].map(([x, y]) => ({ at: P.ll([[x, y]])[0], shape: 'cone' as const, h: 3 })),
    },
    ...lumps(P, [[455, 560, 6], [410, 640, 7], [350, 710, 8], [320, 830, 7], [680, 540, 5], [650, 450, 4]]),
    ...walks(P, [[[525, 300], [520, 360], [530, 440]], [[600, 300], [595, 380]], [[510, 620], [440, 680], [360, 780]], [[370, 720], [320, 800]]], { every: 26 }),
  )
}

/**
 * THE SQUARE DU TEMPLE (Alphand and Barillet-Deschamps, 1857, on the Templars' enclos; aerial 48.86435 2.36081, 0.19 m/px, g-temple). An English square at its best: the sunny lawn in the north, the gravel round the kiosk in the middle, OSM's pond in
 * the south-east with its waterfall. Flowers at the lawn's foot and all along the walks. The kiosk is OSM's roof until an entry drew it; the rock and waterfall are entries.
 */
const temple = (): GardenPlan => {
  const P = pix(48.86435, 2.36081, 0.19)
  return merge(
    'Square du Temple',
    P.ll([[230, 170], [360, 165], [500, 230], [720, 340], [800, 480], [740, 620], [640, 740], [570, 770], [450, 650], [290, 480], [150, 300]]),
    {
      beds: [
        border(P, [[375, 395], [430, 410], [490, 415]], 2),
        border(P, [[250, 210], [300, 190], [355, 180]], 1.8),
        border(P, [[555, 480], [555, 560]], 1.8),
        { ring: P.g(blob(-24, 16, 5, 2)) }, { ring: P.g(blob(30, 26, 4, 2)) },
      ],
    },
    ...walks(P, [
      [[240, 225], [300, 185], [360, 180]],
      [[360, 390], [300, 330], [245, 260]],
      [[570, 380], [510, 410]],
      [[570, 545], [590, 640], [620, 700]],
      [[730, 520], [750, 490]],
    ], { every: 13, off: 3, r: 1.6, flowers: 3 }),
  )
}

/** THE SQUARE LOUISE-MICHEL (Formigé, 1880s; aerial 48.88548 2.34377, 0.28 m/px, g-louise): its stairs, fountain and balustrades are sacreCoeurTerraces's and its lawns OSM's. Flower borders down the central lawns' edges, and shrubs in the thin wood either side, are what the hill wanted. */
const louiseMichel = (): GardenPlan => {
  const P = pix(48.88548, 2.34377, 0.28)
  return merge(
    'Square Louise-Michel',
    P.ll([[280, 460], [440, 460], [490, 520], [480, 650], [520, 740], [460, 820], [320, 760], [270, 660]]),
    {
      beds: [
        border(P, [[343, 510], [352, 695]], 1.6), border(P, [[398, 495], [430, 695]], 1.6),
        border(P, [[288, 550], [340, 590]], 1.5), border(P, [[420, 500], [470, 515]], 1.5), border(P, [[300, 660], [345, 610]], 1.5), border(P, [[440, 610], [478, 640]], 1.5),
      ],
    },
    ...lumps(P, [[260, 590, 4], [250, 690, 4], [500, 560, 5], [530, 460, 5], [520, 640, 4], [280, 760, 4]]),
  )
}

/**
 * THE PARC SUZANNE-LENGLEN (Paris's sports park on the Issy heliport's edge; aerial 48.83088 2.27273, 0.74 m/px, g-lenglen): pitches, a track, tennis, all OSM's. Its garden is the wood round the track and pitches: a shrub belt along the
 * walks and flowers where they meet. It stays the plain thing it is.
 */
const lenglen = (): GardenPlan => {
  const P = pix(48.83088, 2.27273, 0.74)
  return merge(
    'Parc Suzanne-Lenglen',
    P.ll([[10, 450], [280, 330], [530, 300], [640, 480], [650, 620], [560, 860], [20, 920]]),
    {
      beds: [{ ring: P.g(blob((170 - 500) * 0.74, (500 - 745) * 0.74, 9, 4)) }, { ring: P.g(blob((590 - 500) * 0.74, (500 - 640) * 0.74, 8, 4)) }, { ring: P.g(blob((280 - 500) * 0.74, (500 - 660) * 0.74, 9, 3)) }],
    },
    ...walks(P, [
      [[190, 400], [240, 370], [320, 310]],
      [[170, 745], [255, 665], [340, 680], [400, 660]],
      [[510, 650], [600, 640], [640, 700]],
      [[30, 700], [100, 620], [180, 630]],
      [[210, 780], [290, 830], [380, 870]],
    ], { every: 36, off: 7 }),
  )
}

/**
 * THE PARC DE LA BUTTE DU CHAPEAU ROUGE (Léon Azéma, 1939, on the last fortifications; aerial 48.88209 2.39887, 0.38 m/px, g-chapeau). A French garden on a slope, the last of its kind in Paris: from the fountain of Ève at its head the pale stair
 * and walks fan down through four great lawns to a cross walk, a clipped LABYRINTH of yew below, and hedged borders along the stone. Flowers at each lawn's foot. The fountain's wall is an entry.
 */
const chapeauRouge = (): GardenPlan => {
  const P = pix(48.88209, 2.39887, 0.38)
  return merge(
    'Parc de la Butte du Chapeau Rouge',
    P.ll([[150, 260], [220, 260], [460, 340], [640, 370], [800, 450], [840, 560], [740, 720], [710, 860], [600, 900], [480, 880], [370, 720], [230, 670], [170, 480]]),
    {
      gravel: [
        P.ll([[372, 718], [388, 724], [464, 586], [564, 428], [550, 420], [448, 572]]),
        P.ll([[612, 450], [626, 450], [622, 790], [606, 790]]),
      ],
      beds: [
        border(P, [[526, 482], [558, 436]], 1.8), border(P, [[472, 568], [516, 502]], 1.8), border(P, [[522, 622], [606, 626]], 1.8),
        border(P, [[612, 460], [610, 520]], 1.6), border(P, [[612, 530], [610, 620]], 1.6), border(P, [[612, 630], [608, 700]], 1.6),
        border(P, [[420, 640], [464, 590]], 1.6),
        { ring: P.g(blob(-20, 56, 7, 2.5)) }, { ring: P.g(blob(-62, -30, 6, 2.5)) },
      ],
      hedges: [
        // the labyrinth under the great lawns: arcs of clipped yew about its middle, a gap on each to walk through
        { line: arc(P, 490, 735, 10, 20, 320), h: 2, w: 1.4 },
        { line: arc(P, 490, 735, 17, 80, 400), h: 2.2, w: 1.5 },
        { line: arc(P, 490, 735, 24, 150, 470), h: 2.4, w: 1.6 },
        { line: arc(P, 490, 735, 31, -30, 280), h: 2.6, w: 1.8 },
        { line: P.ll([[470, 572], [515, 502]]), h: 0.7, w: 0.6 },
        { line: P.ll([[612, 450], [608, 720]]), h: 0.8, w: 0.7 },
        { line: P.ll([[626, 450], [622, 720]]), h: 0.8, w: 0.7 },
      ],
      topiary: [[612, 450], [626, 450], [606, 790], [622, 790], [372, 718], [388, 724]].map(([x, y]) => ({ at: P.ll([[x, y]])[0], shape: 'cone' as const, h: 2.4 })),
    },
    ...lumps(P, [[290, 400, 6], [360, 330, 5], [720, 520, 6], [760, 640, 5], [650, 760, 5], [240, 600, 6]]),
    ...walks(P, [[[240, 610], [230, 560], [310, 530]], [[370, 450], [430, 490]], [[680, 610], [720, 625]], [[680, 560], [660, 580]]], { every: 24, r: 2.2 }),
  )
}

/**
 * THE SQUARE SAINT-LAMBERT (on the Vaugirard gasworks' ground, 1930s; aerial 48.8424 2.29696, 0.24 m/px, g-lambert): opposite the Lycée Camille-Sée. Two great lawns, nearly triangles, a pale walk parting them, a flower border down each edge
 * and a low hedge; the great round basin with its rim, facing them from the corner; a wood all round with a sand pitch for the children. OSM has the basin.
 */
const saintLambert = (): GardenPlan => {
  const P = pix(48.8424, 2.29696, 0.24)
  return merge(
    'Square Saint-Lambert',
    P.ll([[60, 340], [220, 290], [740, 290], [800, 480], [850, 710], [420, 910], [230, 720], [30, 480]]),
    {
      gravel: [P.ll([[395, 385], [490, 368], [590, 380], [690, 480], [690, 650], [530, 680], [470, 675], [395, 730], [325, 690], [335, 610], [370, 545]])],
      lawn: [
        P.ll([[415, 412], [604, 432], [480, 550], [405, 522]]),
        P.ll([[505, 577], [632, 465], [660, 490], [660, 655], [535, 657]]),
      ],
      hedges: [
        { line: closed(P.ll([[412, 408], [608, 430], [482, 554], [402, 524]])), h: 0.55, w: 0.45 },
        { line: closed(P.ll([[503, 577], [632, 462], [664, 490], [664, 659], [533, 661]])), h: 0.55, w: 0.45 },
      ],
      beds: [
        border(P, [[408, 420], [405, 520]], 1.6), border(P, [[480, 545], [600, 438]], 1.6), border(P, [[510, 575], [628, 470]], 1.6),
        border(P, [[535, 650], [655, 650]], 1.6),
      ],
      topiary: [[395, 385], [590, 380], [690, 480], [690, 650]].map(([x, y]) => ({ at: P.ll([[x, y]])[0], shape: 'cone' as const, h: 2.5 })),
    },
    ...lumps(P, [[280, 480, 4], [130, 440, 4], [720, 540, 3.5], [790, 620, 3.5], [460, 760, 4], [560, 720, 3.5], [430, 340, 3], [610, 340, 3]]),
    ...walks(P, [[[320, 400], [360, 360], [420, 345]], [[660, 390], [720, 340]], [[480, 700], [420, 830]]], { every: 16, off: 3.5, r: 2 }),
  )
}

export const BATCH3_GARDENS: GardenPlan[] = [kellermann(), choisy(), eole(), leGall(), temple(), louiseMichel(), lenglen(), chapeauRouge(), saintLambert()]
