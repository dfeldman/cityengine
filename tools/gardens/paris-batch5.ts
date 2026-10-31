/**
 * Batch 5's gardens (2026-10-31; docs/landmarks/PARIS-BATCHES.md; owner, 2026-10-30: "A special focus should be park gardens, since in a cycling game they are very obvious"): the little historic squares by the great churches, and the two long quay gardens. Traced from IGN's aerial (tools/ortho.ts) read off the photograph's own pixels: each plan names the frame it read, its centre and metres a pixel, and `pix` turns [x, y] on that picture into lat/lon. North is up on all of them.
 * No plan here has a `lawn`: OSM's green is under all of them, and on this batch's first shots a plan's lawn read as a darker stain on it, as paris-parks.ts found at Monceau. The rings are OSM's own outlines. The register's trees are real and stay, but for Jean-XXIII's clipped limes. OSM's water and lawns stay. These are squares of walks and shrubs: none has a parterre forced on it. What a plan can't say (a fountain, a pergola, a carousel, the quay's stepped bays, the sculpture) is a landmark entry in public/landmarks/paris/batch5.json (src/render/landmarks/paris/batch5/parks.ts).
 */
import { closed, type GardenPlan, type LL } from './plan.ts'
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
/** a ring round (x, y) on the picture, radius r in metres */
const round = (P: Pix, x: number, y: number, r: number, n = 18): LL[] => P.g(Array.from({ length: n }, (_, k) => {
  const a = (k / n) * Math.PI * 2
  return [(x - 500) * P.mpp + Math.cos(a) * r, (500 - y) * P.mpp + Math.sin(a) * r] as EN
}))
/** the arc a0..a1 (degrees, east first, anticlockwise) as an open line */
const arc = (P: Pix, x: number, y: number, r: number, a0: number, a1: number, n = 14): LL[] => P.g(Array.from({ length: n + 1 }, (_, k) => {
  const a = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180
  return [(x - 500) * P.mpp + Math.cos(a) * r, (500 - y) * P.mpp + Math.sin(a) * r] as EN
}))
/** a flower border along a line on the picture, `w` metres wide */
const border = (P: Pix, line: XY[], w = 2): { ring: LL[] } => ({ ring: P.g(strip(P.en(line), -w / 2, w / 2)) })
/** a walk along a line on the picture, `w` metres wide */
const walk = (P: Pix, line: XY[], w: number): LL[] => P.g(strip(P.en(line), -w / 2, w / 2))
const walks = (P: Pix, lines: XY[][], o: Parameters<typeof walkside>[2] = {}): Partial<GardenPlan>[] => lines.flatMap((l) => walkside(P.g, P.en(l), o))
const lumps = (P: Pix, at: [number, number, number][]): Partial<GardenPlan>[] => at.map(([x, y, r]) => clump(P.g, (x - 500) * P.mpp, (500 - y) * P.mpp, r))

/**
 * THE SQUARE GEORGES-CAIN (Carnavalet's lapidary garden, 1923; aerial 48.85806 2.36275, 0.16 m/px): a walled plot behind the Hôtel Le Peletier's orangery, under big trees. A pale patch of gravel in its middle with a crescent bed in it, the long clipped hedge against the museum's wall, and the Tuileries' and the old Hôtel de Ville's stones stood about (the entry).
 */
const cain = (): GardenPlan => {
  const P = pix(48.85806, 2.36275, 0.16)
  return merge(
    'Square Georges-Cain',
    [[48.857958, 2.362355], [48.857771, 2.362884], [48.858084, 2.363128], [48.858147, 2.363142], [48.858342, 2.362608], [48.858094, 2.362455]],
    {
      gravel: [P.ll([[478, 468], [520, 447], [590, 478], [563, 505], [530, 548], [508, 512], [484, 492]])],
      beds: [{ ring: P.ll([[514, 488], [535, 498], [546, 528], [536, 532], [524, 506], [510, 496]]), rim: true }, border(P, [[592, 492], [565, 530], [545, 562]], 1.8)],
      hedges: [{ line: P.ll([[650, 442], [612, 520], [575, 610]]), h: 2.2, w: 3 }],
    },
    ...lumps(P, [[590, 440, 2.5], [470, 560, 2.5]]),
  )
}

/**
 * THE JARDIN ANNE-FRANK (2007, behind the Hôtel de Saint-Aignan; aerial 48.8616 2.3548, 0.16 m/px): a pale court in the curve of its green pergola, a round bed with the sapling off Anne Frank's chestnut, a lawn down the east, and the playground to the north (OSM's, its floor drawn by the city; the first shot of this plan set a kitchen garden down on top of it, 2026-10-31). The pergola and Polzin's Celan are the entry.
 */
const anneFrank = (): GardenPlan => {
  const P = pix(48.8616, 2.3548, 0.16)
  return merge(
    'Jardin Anne-Frank',
    [[48.861402, 2.354248], [48.861341, 2.354398], [48.861362, 2.354538], [48.861531, 2.354681], [48.861403, 2.354848], [48.861621, 2.355244], [48.861582, 2.355472], [48.8617, 2.355568], [48.861828, 2.355442], [48.861964, 2.354879], [48.861802, 2.354767], [48.861776, 2.35459], [48.861597, 2.354588], [48.861661, 2.354501], [48.861504, 2.354342]],
    {
      gravel: [P.ll([[430, 398], [500, 390], [618, 432], [600, 470], [548, 520], [520, 470], [490, 480], [450, 510], [430, 470]]), walk(P, [[218, 628], [250, 590], [330, 470]], 2.6)],
      beds: [
        { ring: round(P, 518, 500, 4.6), rim: true },
        border(P, [[622, 442], [604, 476]], 1.6),
      ],
      topiary: [{ at: P.ll([[518, 500]])[0], shape: 'ball', h: 2.6 }],
    },
    ...lumps(P, [[610, 500, 3.5], [660, 480, 3.5], [340, 520, 3]]),
  )
}

/**
 * THE SQUARE DE LA TOUR-SAINT-JACQUES (Paris's first public square, Alphand and Barillet-Deschamps, 1856; aerial 48.8579 2.3488, 0.16 m/px): English walks and big trees round the tower's knoll. Pale gravel at the foot of the tower to north and east, a walk across to the Rue Saint-Martin side, a lawn in the south-east with the trees opening over it. Flowers along the walks by the tower, as the city plants them.
 */
const tourSaintJacques = (): GardenPlan => {
  const P = pix(48.8579, 2.3488, 0.16)
  return merge(
    'Square de la Tour-Saint-Jacques',
    [[48.85784, 2.348055], [48.857769, 2.348097], [48.857489, 2.349118], [48.857528, 2.349246], [48.857926, 2.349466], [48.858015, 2.349416], [48.858337, 2.348425], [48.858309, 2.348316]],
    {
      gravel: [
        P.ll([[462, 308], [518, 312], [512, 382], [498, 385], [465, 360]]),
        P.ll([[590, 395], [640, 390], [675, 430], [675, 470], [650, 500], [650, 545], [590, 548], [610, 480], [600, 440]]),
        P.ll([[312, 225], [330, 280], [400, 280], [405, 295], [345, 310], [312, 320]]),
        P.ll([[310, 572], [468, 572], [468, 590], [345, 600], [315, 595]]),
        walk(P, [[735, 495], [715, 560], [660, 640], [630, 690]], 3),
      ],
      beds: [border(P, [[586, 415], [600, 470], [582, 540]], 1.8), border(P, [[455, 318], [458, 360], [490, 392]], 1.6), border(P, [[405, 305], [340, 320], [315, 330]], 1.6), border(P, [[596, 560], [610, 620]], 1.6)],
    },
    ...lumps(P, [[670, 525, 3], [640, 590, 3.5], [755, 500, 3], [370, 330, 3]]),
  )
}

/**
 * THE SQUARE RENÉ-VIVIANI (1928, on the Hôtel-Dieu's annexe, across from Notre-Dame; aerial 48.8521 2.3475, 0.16 m/px): gravel round Jeanclos's fountain in its ring of clipped box, two blocks of clipped limes standing in it, the hedge along the quay, and the walk out to Saint-Julien-le-Pauvre's flank where the Robinia stands, Paris's oldest tree. The fountain, the Robinia's crutch and Notre-Dame's old stones are entries.
 */
const viviani = (): GardenPlan => {
  const P = pix(48.8521, 2.3475, 0.16)
  return merge(
    'Square René-Viviani',
    [[48.852199, 2.346951], [48.852071, 2.347277], [48.852031, 2.347265], [48.851966, 2.347271], [48.851894, 2.347376], [48.851842, 2.34739], [48.851725, 2.347523], [48.851866, 2.347751], [48.852213, 2.348007], [48.852311, 2.348012], [48.852362, 2.347968], [48.852531, 2.347589], [48.852509, 2.3475], [48.852233, 2.347011]],
    {
      gravel: [P.ll([[530, 345], [545, 310], [600, 265], [690, 340], [640, 440], [625, 480], [640, 560], [600, 530], [480, 460], [440, 480], [420, 550], [400, 490], [470, 440], [520, 410]])],
      beds: [{ ring: P.ll([[470, 440], [440, 480], [420, 548], [398, 490]]) }, border(P, [[525, 345], [540, 305], [595, 262]], 1.6), border(P, [[694, 345], [645, 440], [630, 480]], 1.6)],
      hedges: [
        { line: closed(round(P, 600, 382, 8.2, 16)), h: 0.8, w: 1.5 },
        { line: P.ll([[520, 205], [600, 235], [665, 275], [720, 320]]), h: 1.4, w: 2.5 },
      ],
      pleached: [
        { line: P.ll([[443, 365], [497, 303]]), y0: 0.9, h: 3.1, w: 10, spacing: 2.8 },
        { line: P.ll([[452, 490], [598, 545]]), y0: 0.9, h: 3.1, w: 11, spacing: 2.8 },
      ],
    },
    ...lumps(P, [[520, 610, 3], [660, 480, 3], [420, 270, 2.5], [390, 610, 2.5]]),
  )
}

/**
 * The SQUARE JEAN-XXIII's remainder (ORTHOPHOTOS2018, 48.8525 2.3508, 0.22 m/px; the 2024 picture is Notre-Dame's site huts): the seven long walls of clipped limes that give the square its look, which paris-public.ts left to OSM's tree rows and a tree_row cannot say. Ranked along bearing 113.5 either side of the fountain's court; the lines are off the picture, and the third is broken by the clearing where the Monument stands in the 2018 photograph. Its ring clears the rows these replace; the lawn and the court stay paris-public's.
 */
const jeanLimes = (): GardenPlan => {
  const P = pix(48.8525, 2.3508, 0.22)
  const wall = (a: XY, b: XY) => ({ line: P.ll([a, b]), y0: 2.2, h: 4.6, w: 5.4, spacing: 3.6 })
  const plan = merge(
    'Square Jean-XXIII: the limes',
    P.ll([[620, 300], [895, 412], [865, 465], [810, 600], [775, 735], [525, 650], [540, 560], [565, 480], [622, 355]]),
    {
      pleached: [
        wall([625, 332], [880, 432]), wall([630, 367], [850, 452]), wall([572, 497], [795, 587]), wall([572, 537], [800, 630]),
        wall([545, 570], [618, 596]), wall([665, 615], [785, 660]), wall([540, 612], [770, 697]), wall([530, 642], [760, 722]),
      ],
      beds: [border(P, [[556, 660], [695, 712]], 1.6), border(P, [[612, 416], [650, 402], [720, 408], [770, 460]], 1.4)],
    },
  )
  return { ...plan, clearMapped: true }
}

/**
 * THE SQUARE BOUCICAUT (1887–1912, across from the Bon Marché; aerial 48.8513 2.3258, 0.18 m/px): the walk from the Rue de Babylone's corner along the whole square, widening to a court where the kiosk stands, the two playgrounds' soft floors in it (OSM's), the pond, a lawn, and a striped carousel under the trees. Moreau-Vauthier's monument to Mme Boucicaut and the Baroness de Hirsch is at the far end among the trees, where OSM has it. All entries.
 */
const boucicaut = (): GardenPlan => {
  const P = pix(48.8513, 2.3258, 0.18)
  return merge(
    'Square Boucicaut',
    [[48.851607, 2.325003], [48.850978, 2.325293], [48.850918, 2.32553], [48.851332, 2.326518], [48.851423, 2.326612], [48.851504, 2.326628], [48.851629, 2.326507], [48.851686, 2.326349], [48.851667, 2.325289], [48.851586, 2.325143]],
    {
      gravel: [P.ll([[280, 345], [340, 370], [400, 395], [450, 415], [500, 415], [590, 395], [700, 345], [710, 385], [600, 420], [550, 440], [480, 440], [440, 470], [390, 470], [340, 440], [300, 480], [290, 430]]), round(P, 512, 555, 7, 12), round(P, 730, 361, 6, 10)],
      beds: [border(P, [[548, 446], [640, 418], [684, 410]], 1.6), border(P, [[345, 378], [400, 402], [448, 422]], 1.6), border(P, [[590, 398], [640, 372], [695, 345]], 1.6)],
      hedges: [{ line: arc(P, 512, 555, 7.6, -40, 220), h: 0.8, w: 0.8 }],
    },
    ...lumps(P, [[640, 500, 3], [420, 520, 3], [330, 480, 2.5], [780, 400, 3], [480, 300, 3], [620, 300, 3]]),
    ...walks(P, [[[300, 490], [340, 560], [400, 640]]], { every: 22, r: 2.5 }),
  )
}

/**
 * THE SQUARE D'AJACCIO (aerial 48.8575 2.3146, 0.18 m/px): the narrow English strip between the Invalides' moat and the Boulevard de La Tour-Maubourg's limes, a winding walk under big trees, grass on the bank. Nothing formal in it, and it wants nothing more than that walk, its shrubs and its three memorials (entries).
 */
const ajaccio = (): GardenPlan => {
  const P = pix(48.8575, 2.3146, 0.18)
  return merge(
    "Square d'Ajaccio",
    [[48.857267, 2.314282], [48.857111, 2.314472], [48.856977, 2.314493], [48.856961, 2.314818], [48.857769, 2.314913], [48.857856, 2.314884], [48.857912, 2.314814], [48.857953, 2.314365]],
    {
      gravel: [walk(P, [[565, 283], [600, 288], [612, 340], [605, 400], [590, 465], [565, 500], [575, 560], [568, 640]], 3.6)],
      beds: [border(P, [[592, 300], [598, 345], [592, 395]], 1.3)],
    },
    ...lumps(P, [[540, 300, 3], [620, 470, 2.5], [525, 500, 3], [610, 600, 2.5]]),
  )
}

/**
 * THE JARDIN DE L'ARSENAL (1983, on the Bassin's east bank; ORTHOPHOTOS2018, north half 48.8508 2.3676 and south half 48.8486 2.3679, each 0.26 m/px): the broad quay along the water for its whole length (traced 3.6 m inside the water's edge: OSM's quay stone has the rest, and a plan's flat over the water reads as a raft), the raised walk behind it and between them the bank, its massed roses and shrubs and two sandy play lawns. The bank's trees are the register's. The moored boats are an entry.
 */
const arsenal = (): GardenPlan => {
  const N = pix(48.8508, 2.3676, 0.26)
  const S = pix(48.8486, 2.3679, 0.26)
  return merge(
    "Jardin de l'Arsenal",
    [[48.847476, 2.366976], [48.847501, 2.367133], [48.848543, 2.367605], [48.84904, 2.367831], [48.850503, 2.368498], [48.851343, 2.368883], [48.851804, 2.369082], [48.851836, 2.368993], [48.850958, 2.3682], [48.850774, 2.368039], [48.850597, 2.368041], [48.849171, 2.367421], [48.848803, 2.367261], [48.847776, 2.367041]],
    {
      gravel: [
        N.ll([[885, 72], [905, 90], [850, 190], [700, 400], [690, 470], [640, 520], [640, 570], [610, 660], [560, 860], [525, 1000], [515, 1000], [572, 765], [614, 585], [654, 455]]),
        N.ll([[640, 842], [662, 872], [640, 960], [600, 1000], [576, 895]]),
        S.ll([[454, 0], [470, 0], [420, 180], [390, 270], [355, 470], [290, 700], [265, 1000], [254, 1000], [284, 703], [359, 424], [379, 254]]),
        S.ll([[465, 80], [495, 100], [480, 190], [460, 225], [445, 200]]),
        S.ll([[410, 312], [438, 340], [415, 410], [385, 395], [400, 360]]),
        walk(S, [[552, 5], [510, 150], [468, 280], [400, 510], [335, 712]], 3.2),
      ],
      beds: [
        // the roses: the bank's red beds along the quay's inner edge, the strip the aerial shows at the head of the bank
        { ring: N.ll([[690, 490], [710, 488], [690, 610], [672, 610]]) },
        border(N, [[735, 372], [840, 225]], 2.4), border(N, [[655, 530], [630, 640], [590, 810]], 2), border(S, [[425, 200], [395, 300], [362, 460]], 2), border(S, [[352, 500], [310, 640], [285, 760]], 1.8),
      ],
      hedges: [{ line: N.ll([[842, 232], [732, 368]]), h: 1.2, w: 1.6 }, { line: S.ll([[348, 505], [302, 700]]), h: 1.1, w: 1.2 }],
    },
    ...walks(S, [[[468, 280], [400, 510], [335, 712]]], { every: 26, r: 2.5 }),
    ...walks(N, [[[720, 620], [670, 840]]], { every: 30, r: 2.5 }),
  )
}

/**
 * THE JARDIN TINO-ROSSI, the Musée de la Sculpture en plein air (Daniel Badani, 1980, on the Quai Saint-Bernard; ORTHOPHOTOS2018, 48.8478 2.3604, 0.34 m/px): the long pale quay along the Seine, on it the great star of paving and the four half-round stepped bays where Paris dances the tango of a summer evening; behind them the trees over the river road's cutting, and the sculptures. The sandy oval in its ring of shrubs, the beach at the Austerlitz end. Paving, bays and sculpture are entries.
 */
const tinoRossi = (): GardenPlan => {
  const P = pix(48.8478, 2.3604, 0.34)
  return merge(
    'Jardin Tino-Rossi',
    [[48.849228, 2.357655], [48.848843, 2.358248], [48.848612, 2.35878], [48.848218, 2.359175], [48.847917, 2.3598], [48.847463, 2.360479], [48.846854, 2.361387], [48.846713, 2.361326], [48.846021, 2.362347], [48.845411, 2.363517], [48.845573, 2.363819], [48.846179, 2.363074], [48.84721, 2.36183], [48.847595, 2.361224], [48.848768, 2.359383], [48.849116, 2.358849], [48.849426, 2.357887]],
    {
      gravel: [
        P.ll([[25, 0], [150, 60], [240, 150], [410, 315], [470, 365], [720, 600], [770, 665], [1000, 920], [1000, 960], [900, 880], [850, 800], [760, 720], [690, 650], [640, 600], [565, 530], [510, 490], [440, 420], [380, 350], [310, 290], [240, 250], [215, 200], [120, 100]]),
        P.ll([[525, 565], [545, 555], [580, 565], [590, 580], [560, 595], [530, 590]]),
        P.ll([[770, 690], [800, 720], [820, 760], [790, 760], [750, 720]]),
      ],
      hedges: [{ line: arc(P, 556, 574, 16, -30, 250), h: 1.1, w: 1.5 }],
      beds: [border(P, [[505, 530], [535, 545], [590, 545]], 1.6), border(P, [[340, 330], [390, 370]], 1.6)],
    },
    ...lumps(P, [[320, 320, 3], [500, 520, 3], [640, 590, 3], [700, 690, 3.5], [800, 690, 3], [160, 130, 3]]),
  )
}

export const BATCH5_GARDENS: GardenPlan[] = [cain(), anneFrank(), tourSaintJacques(), viviani(), jeanLimes(), boucicaut(), ajaccio(), arsenal(), tinoRossi()]
