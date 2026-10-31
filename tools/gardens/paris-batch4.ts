/**
 * Batch 4's gardens (2026-10-31; docs/landmarks/PARIS-BATCHES.md; owner, 2026-10-30: "A special focus should be park gardens, since in a cycling game they are very obvious"). Traced from IGN's aerial
 * (tools/ortho.ts) read off the photograph's own pixels, as Batch 3's: each plan names the frame it read, its centre and metres a pixel, and `pix` turns [x, y] on that picture into lat/lon. North is up on all of them.
 *
 * The Bois are woods, and a plan's `ring` keeps the scatter off everything inside it: so these rings are small, only the paved or planted ground round a thing, and the woods stay as they are. The Parc Floral (x 7800) and the
 * Jardin d'Agronomie Tropicale (x 9850) fall outside the world: the box ends at x 5715, and past its 700 m fringe nothing is baked. Lac Daumesnil, at x 5650–6330, is inside that fringe, and the water, islands and paths are there. Jardin Nelson-Mandela takes
 * one of the two places.
 *
 * What a plan can't say (the Grande Cascade, the temple, the chalet, the Tour aux Figures, the château) is a landmark entry in public/landmarks/paris/batch4.json (src/render/landmarks/paris/batch4/).
 */
import { closed, frame, type GardenPlan, type LL } from './plan.ts'
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
/** a ring round (x, y) on the picture, radius r in metres; or the arc a0..a1 (degrees, east first, anticlockwise) as an open line */
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
/** a bed of the picture's own blob, centred on (x, y) */
const patch = (P: Pix, x: number, y: number, rx: number, rz: number): { ring: LL[] } => ({ ring: P.g(blob((x - 500) * P.mpp, (500 - y) * P.mpp, rx, rz)) })

/**
 * THE LAC INFÉRIEUR (Alphand and Barillet-Deschamps, 1855; aerials 48.8605 2.262, 1.4 m/px, g-lacinf, for the whole of it, and 48.8638 2.2612, 0.36 m/px, g-chalet, for the islands): a kilometre of narrow water and two wooded islands joined by a
 * bridge, the Chalet des Îles on the northern one with its paved terrace and its landing stage, the boats let from the east bank. OSM has the water, the islands and the walks. What it lacks is what a rider going round the Chemin de Ceinture
 * sees: the shrubs at the water's edge and the flowers where the walks open out. The chalet, the Kiosque de l'Empereur, the boats and the Petite Cascade are entries.
 */
const lacInferieur = (): GardenPlan => {
  const P = pix(48.8605, 2.262, 1.4), C = pix(48.8638, 2.2612, 0.36)
  return merge(
    'Bois de Boulogne: le Lac Inférieur',
    C.ll([[215, 545], [295, 505], [375, 590], [310, 670], [235, 650]]),
    {
      gravel: [C.ll([[222, 568], [262, 530], [292, 556], [252, 600]]), C.ll([[318, 625], [372, 596], [380, 606], [326, 640]])],
      beds: [
        border(C, [[175, 690], [240, 692], [300, 660]], 2), border(C, [[328, 646], [376, 616]], 1.6), border(C, [[218, 590], [250, 622]], 1.8),
        patch(C, 205, 640, 5, 2.4), patch(C, 615, 395, 6, 2.2), patch(C, 300, 290, 5, 2.2), patch(C, 560, 830, 6, 2.2),
      ],
    },
    ...lumps(C, [[120, 650, 4], [150, 500, 4], [340, 500, 3], [395, 545, 3], [590, 560, 4], [580, 700, 4], [470, 880, 4], [260, 880, 4], [130, 870, 4], [420, 330, 4], [530, 250, 4]]),
    ...walks(C, [[[250, 325], [335, 195], [405, 145], [470, 100]], [[330, 400], [335, 240]], [[440, 405], [500, 290], [555, 230]], [[175, 700], [270, 685], [345, 625]]], { every: 22, off: 4, r: 2.2 }),
    // the Chemin de Ceinture, both banks, at the water's side only: the wood beyond is the wood
    ...walks(P, [
      [[335, 630], [300, 560], [288, 440], [292, 300], [335, 190], [405, 90], [465, 15]],
      [[350, 630], [405, 500], [490, 385], [497, 280], [525, 195], [580, 80], [640, 8]],
    ], { every: 48, off: 5, r: 3 }),
  )
}

/**
 * THE LAC SUPÉRIEUR (aerial 48.856 2.261, 0.9 m/px, g-lacsup): the smaller, higher lake, a long pear on the Auteuil side of the Bois with the racecourse's rail along its east, its overflow running under the Carrefour du Bout des Lacs into the Lac
 * Inférieur. A green roundel and two triangles of lawn at the carrefour are the only formal thing. Shrubs and flowers on its Chemin de Ceinture.
 */
const lacSuperieur = (): GardenPlan => {
  const S = pix(48.856, 2.261, 0.9)
  return merge(
    'Bois de Boulogne: le Lac Supérieur',
    round(S, 235, 172, 9),
    {
      lawn: [round(S, 235, 172, 8)],
      beds: [{ ring: round(S, 235, 172, 3.4, 12), rim: true }, border(S, [[272, 186], [328, 172]], 1.6), border(S, [[300, 222], [316, 248]], 1.6), patch(S, 232, 130, 7, 2.4)],
    },
    ...walks(S, [
      [[135, 250], [118, 340], [108, 430], [72, 545], [58, 625], [80, 690]],
      [[292, 250], [240, 390], [205, 500], [172, 625], [168, 690]],
    ], { every: 26, off: 4.5, r: 2.6 }),
    ...lumps(S, [[300, 300, 4], [260, 430, 4], [90, 310, 4], [80, 440, 4], [120, 700, 4]]),
  )
}

/**
 * THE GRANDE CASCADE (Alphand, 1856; aerial 48.863 2.2425, 0.44 m/px, g-cascade): the restaurant in its Second Empire pavilion, with a round lawn and its star of flowers before it and the half-round terrace at the top of the steps; the fall itself, in the wood
 * behind, from the Lac du Réservoir into OSM's small pool, is an entry (`grandeCascade`). OSM's pool is at (225, 365), the restaurant's pavilion at (150, 590).
 */
const grandeCascade = (): GardenPlan => {
  const G = pix(48.863, 2.2425, 0.44)
  return merge(
    'Bois de Boulogne: la Grande Cascade',
    G.ll([[85, 440], [150, 425], [215, 480], [215, 700], [110, 740], [75, 600]]),
    {
      gravel: [G.ll([[118, 520], [185, 520], [226, 590], [195, 720], [105, 730], [118, 620]])],
      lawn: [round(G, 148, 472, 24)],
      hedges: [{ line: closed(round(G, 148, 472, 24.4, 24)), h: 0.5, w: 0.5 }, { line: arc(G, 148, 528, 13, 10, 170), h: 0.8, w: 0.6 }],
      beds: [{ ring: round(G, 142, 466, 6, 12), rim: true }, { ring: arc(G, 148, 472, 17, 0, 180, 10).concat(arc(G, 148, 472, 14.5, 180, 0, 10)) }, { ring: arc(G, 148, 472, 17, 180, 360, 10).concat(arc(G, 148, 472, 14.5, 360, 180, 10)) }],
      topiary: [[118, 525], [182, 525], [110, 700], [190, 700]].map(([x, y]) => ({ at: G.ll([[x, y] as XY])[0], shape: 'ball' as const, h: 1.6 })),
    },
    ...lumps(G, [[235, 450, 4], [290, 470, 4], [330, 550, 4], [260, 330, 3], [180, 300, 3], [395, 560, 3], [460, 355, 4]]),
    ...walks(G, [[[400, 495], [430, 520]], [[385, 570], [410, 600]], [[640, 500], [690, 565]]], { every: 16, off: 3, r: 2 }),
  )
}

/**
 * LE PRÉ CATELAN (Barillet-Deschamps, 1856; 7.5 ha in the middle of the Bois, aerial 48.865 2.253, 0.56 m/px, g-catelan): the great lawn, nearly round, parted by its two pale walks and held by the grey loop of the Allée; the Théâtre de Verdure in the Jardin
 * Shakespeare to its south-west, a stage of clipped yew and a raked lawn in the clearing at (415, 590), where each play's plants have a corner; the restaurant (way/83115461) at (204, 703) with its terrace; the little wood of fruit trees south. OSM has the walks and the
 * hedges, and a very good set of them. What this adds is the Jardin's yews and each corner's plants, flowers at the great lawn's foot, and the shrubs on the walks.
 */
const preCatelan = (): GardenPlan => {
  const K = pix(48.865, 2.253, 0.56)
  return merge(
    'Le Pré Catelan',
    K.ll([[350, 545], [420, 530], [480, 590], [440, 650], [370, 650]]),
    {
      lawn: [round(K, 415, 590, 16, 20)],
      hedges: [
        // the Théâtre's clipped back wall and its wings, a half-round open to the lawn
        { line: arc(K, 415, 590, 17, 20, 160), h: 2.6, w: 1.4 }, { line: arc(K, 415, 590, 21, 30, 150), h: 3.2, w: 1.6 },
        { line: arc(K, 415, 590, 17, 200, 340), h: 0.8, w: 0.6 },
      ],
      beds: [
        // the plays' corners: Macbeth's heath, A Midsummer Night's Dream's flowers, As You Like It's forest edge, The Tempest's rocks, Hamlet's stream
        patch(K, 360, 560, 5, 3), patch(K, 365, 630, 5, 3), patch(K, 465, 630, 5, 3), patch(K, 470, 555, 5, 3),
        border(K, [[455, 460], [510, 412], [560, 395], [620, 400]], 2), border(K, [[405, 500], [430, 560], [475, 585], [530, 590]], 2),
        border(K, [[620, 510], [640, 455], [625, 410]], 1.8), patch(K, 600, 590, 8, 2.8),
        // the restaurant's front
        border(K, [[175, 640], [215, 655], [255, 700]], 2.2), patch(K, 280, 700, 6, 3),
      ],
      topiary: [[395, 568], [435, 568], [415, 566], [380, 590], [450, 590]].map(([x, y], i) => ({ at: K.ll([[x, y] as XY])[0], shape: i === 2 ? 'cone' as const : 'ball' as const, h: i === 2 ? 3.2 : 1.8 })),
    },
    ...lumps(K, [[440, 420, 4], [660, 450, 4], [730, 470, 4], [630, 580, 4], [330, 700, 4], [460, 740, 4], [340, 760, 4], [680, 300, 4], [720, 240, 3], [640, 240, 4], [340, 470, 4], [300, 590, 4]]),
    ...walks(K, [
      [[335, 500], [395, 440], [470, 375], [560, 355], [650, 385], [680, 450]],
      [[400, 490], [410, 560], [450, 610], [525, 635], [630, 585]],
      [[295, 790], [400, 800], [500, 800], [530, 820]],
      [[525, 640], [525, 810]],
      [[140, 600], [235, 560]],
    ], { every: 22, off: 3.5, r: 2.2, flowers: 3 }),
  )
}

/**
 * LAC DAUMESNIL AND THE PELOUSE DE REUILLY (Alphand, 1860; aerial 48.831 2.413, 0.8 m/px, g-daumesnil): the lake in its two arms round the Île de Bercy and the Île de Reuilly, the two joined by a bridge; the Pelouse, the great mown lawn south of it where the Foire du Trône
 * pitches, at the foot of the picture. All of it is past the box's east edge (x 5715), on the fringe, which has water, paths and trees and which the road round the Porte Dorée looks over: it gets no ring, since nothing here is formal. Shrubs and flowers on the shore walks; the temple and
 * Davioud's grotto are entries. The Pelouse stays open grass, a plain thing that is right: a few shrubs at its road edge.
 */
const daumesnil = (): GardenPlan => {
  const D = pix(48.831, 2.413, 0.8)
  return merge(
    'Lac Daumesnil',
    round(D, 170, 395, 6),
    {
      beds: [border(D, [[132, 345], [150, 385], [185, 430]], 2), patch(D, 360, 185, 6, 2.4), patch(D, 640, 395, 6, 2.4), patch(D, 835, 580, 7, 2.4), patch(D, 455, 625, 6, 2.4), border(D, [[580, 610], [650, 612]], 1.8), patch(D, 540, 520, 5, 2.4)],
    },
    ...walks(D, [
      [[215, 212], [340, 188], [450, 200], [540, 255], [620, 340], [655, 410]],
      [[705, 462], [825, 565], [940, 685], [995, 800]],
      [[160, 400], [230, 500], [340, 590], [450, 640], [570, 690], [690, 735]],
      [[820, 750], [840, 850]],
      [[295, 255], [345, 270], [400, 340], [425, 460]],
      [[210, 310], [265, 390], [330, 430], [375, 475]],
      [[470, 480], [530, 520], [600, 530], [640, 585]],
    ], { every: 30, off: 4.5, r: 2.6 }),
    ...lumps(D, [[505, 900, 4], [640, 880, 4], [760, 900, 4], [880, 945, 4], [545, 770, 4], [420, 720, 4], [300, 340, 4], [640, 640, 4]]),
  )
}

/**
 * THE PARC DE L'ÎLE SAINT-GERMAIN (Issy; 1980, on an old army depot; aerial 48.8265 2.2555, 1 m/px, g-stgermain): Dubuffet's Tour aux Figures (OSM way/105152323, an entry) at (720, 277) among the spiral of walks and hummocks at the east end, the great lawns (735, 205) and (660, 380), the brick Halle (610, 460)
 * with its pale court, and the gardens beyond it: a formal square of lawns on the diagonal, parted by walks in a hedge, at (445, 580), and the wild garden at the west end. OSM has the walks and lawns.
 */
const ileSaintGermain = (): GardenPlan => {
  const I = pix(48.8265, 2.2555, 1)
  return merge(
    "Parc de l'Île Saint-Germain",
    I.ll([[375, 540], [440, 520], [510, 585], [440, 650], [370, 620]]),
    {
      gravel: [I.ll([[440, 545], [476, 581], [440, 617], [404, 581]])],
      lawn: [I.ll([[440, 551], [470, 581], [443, 578]]), I.ll([[470, 581], [440, 611], [443, 584]]), I.ll([[440, 611], [410, 581], [437, 584]]), I.ll([[410, 581], [440, 551], [437, 578]])],
      hedges: [
        { line: closed(I.ll([[440, 543], [478, 581], [440, 619], [402, 581]])), h: 0.9, w: 0.7 },
        { line: closed(I.ll([[400, 543], [420, 523], [445, 535], [420, 560]])), h: 0.7, w: 0.6 },
        { line: closed(I.ll([[452, 618], [478, 594], [500, 615], [476, 640]])), h: 0.7, w: 0.6 },
        { line: closed(I.ll([[385, 590], [404, 610], [385, 630], [366, 610]])), h: 0.7, w: 0.6 },
      ],
      beds: [
        { ring: round(I, 440, 581, 3, 12), rim: true },
        border(I, [[408, 534], [424, 526]], 1.4), border(I, [[462, 620], [490, 612]], 1.4), border(I, [[376, 606], [392, 620]], 1.4),
        border(I, [[590, 395], [640, 345], [680, 330]], 2), border(I, [[640, 480], [672, 440]], 2.2), patch(I, 590, 500, 6, 2.6),
      ],
      topiary: [[440, 543], [478, 581], [440, 619], [402, 581]].map(([x, y]) => ({ at: I.ll([[x, y] as XY])[0], shape: 'cone' as const, h: 2.6 })),
    },
    ...lumps(I, [[690, 250, 5], [745, 280, 5], [660, 290, 5], [640, 265, 4], [770, 195, 5], [700, 150, 5], [570, 400, 5], [540, 460, 5], [350, 690, 5], [430, 700, 5], [280, 720, 5], [210, 790, 5], [320, 780, 5], [510, 640, 4]]),
    ...walks(I, [
      [[545, 395], [590, 340], [620, 320]],
      [[550, 420], [600, 430], [640, 400]],
      [[370, 760], [410, 710], [470, 680]],
      [[225, 760], [280, 695], [355, 655]],
      [[625, 280], [670, 270], [720, 310]],
    ], { every: 26, off: 4, r: 2.6 }),
  )
}

/**
 * THE ÎLE DE PUTEAUX (aerial 48.8775 2.2425, 1.1 m/px, g-puteaux): pitches, tennis and a swimming pool from end to end, OSM's, with the Pont de Puteaux across its middle. What's a garden on it is the roundabout's two roundels of lawn and rose at the bridge foot, (575, 558) and (608, 597), and the long walk of trees down its spine
 * to the south. It stays the plain sporting thing it is.
 */
const ileDePuteaux = (): GardenPlan => {
  const U = pix(48.8775, 2.2425, 1.1)
  return merge(
    'Île de Puteaux',
    round(U, 590, 578, 34),
    {
      lawn: [round(U, 575, 558, 15), round(U, 608, 597, 15)],
      beds: [{ ring: round(U, 575, 558, 6.5, 14), rim: true }, { ring: round(U, 608, 597, 6.5, 14), rim: true }, border(U, [[530, 540], [548, 562]], 1.8), border(U, [[584, 620], [612, 632]], 1.8)],
      hedges: [{ line: closed(round(U, 575, 558, 15.3, 22)), h: 0.6, w: 0.5 }, { line: closed(round(U, 608, 597, 15.3, 22)), h: 0.6, w: 0.5 }],
    },
    ...walks(U, [[[505, 700], [405, 790], [290, 890]], [[720, 410], [700, 365], [770, 290]]], { every: 30, off: 6, r: 2.6, flowers: 4 }),
  )
}

/**
 * THE PARC DE BOULOGNE EDMOND-DE-ROTHSCHILD (Boulogne; the Baron's English park of 1855–60, Armand's château, Paris's great Japanese garden of 1900 now gone, the Commune's since 1949; aerial 48.8505 2.23, 0.7 m/px, g-rothschild): the great lawn (700, 620) with its clumps, sloping to the lake at (520, 550)
 * and its island; the western lawns (360, 360), parted by a path; the two pale sand grounds (240, 390) and (280, 605). The château, at (875, 615), under its long white protective roof in the photograph, is an entry (`rothschildChateau`), as are the rocks at the lake's head. Only the shrubs here: the Baron's hedges went with his gardeners.
 */
const rothschild = (): GardenPlan => {
  const R = pix(48.8505, 2.23, 0.7)
  return merge(
    'Parc de Boulogne Edmond-de-Rothschild',
    R.ll([[205, 355], [240, 345], [280, 415], [245, 440]]),
    {
      gravel: [R.ll([[208, 356], [240, 347], [279, 412], [247, 437]]), R.ll([[245, 545], [300, 540], [325, 640], [275, 668], [250, 640]])],
      beds: [border(R, [[605, 545], [625, 620], [660, 700]], 2.2), border(R, [[300, 355], [325, 410]], 2), border(R, [[370, 415], [410, 340]], 2), patch(R, 700, 720, 7, 2.8), patch(R, 820, 750, 6, 2.6)],
    },
    ...lumps(R, [[615, 500, 5], [790, 530, 5], [640, 620, 4], [680, 700, 5], [440, 440, 5], [430, 330, 5], [300, 480, 5], [315, 520, 4], [350, 590, 4], [570, 450, 4], [540, 460, 4], [820, 700, 5]]),
    ...walks(R, [
      [[262, 475], [265, 530], [240, 545]],
      [[305, 355], [325, 420]],
      [[375, 410], [430, 330]],
      [[665, 720], [760, 745], [855, 775]],
      [[595, 510], [620, 640]],
      [[320, 515], [310, 570]],
    ], { every: 24, off: 4, r: 2.6 }),
  )
}

/**
 * LE JARDIN NELSON-MANDELA (Seura, David Mangin, 2018, on the deck over the Forum's station; aerial 48.8626 2.3445, 0.44 m/px, g-mandela): between the Bourse de Commerce and the Canopée. Its broad pale walks; the two great lawns in the middle, each with low rails and a clump in it, the western one with the
 * deck's skylights in it; pines to the south, the long pool of its fountain, the playground. In for the Parc Floral, out of the box: it's in the very middle of the city and had nothing but OSM's grass. Tufts of shrub at each lawn's edge, a little flower at the walks' corners, the shrubs round it.
 */
const mandela = (): GardenPlan => {
  const M = pix(48.8626, 2.3445, 0.44)
  return merge(
    'Jardin Nelson-Mandela',
    M.ll([[310, 400], [380, 345], [560, 400], [700, 480], [800, 450], [780, 700], [620, 740], [450, 700], [320, 610]]),
    {
      // (short, and at the walks: the first try's long borders along each lawn ran like painted ribbons across a plain lawn. Seura's planting is grasses and shrubs)
      beds: [border(M, [[352, 462], [392, 484]], 1.8), border(M, [[640, 575], [660, 588]], 1.8), border(M, [[470, 560], [495, 580]], 1.6), border(M, [[640, 620], [650, 655]], 1.6), patch(M, 345, 560, 4, 2)],
      topiary: [[[370, 400], [540, 428]], [[535, 532], [655, 586]], [[575, 452], [690, 498]], [[430, 505], [506, 530]]].flatMap(([a, b]) => {
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]) * M.mpp, n = Math.round(L / 5)
        return Array.from({ length: n }, (_, k) => ({ at: M.ll([[a[0] + ((b[0] - a[0]) * (k + 0.5)) / n, a[1] + ((b[1] - a[1]) * (k + 0.5)) / n]])[0], shape: 'shrub' as const, h: 0.8 + ((k * 7) % 5) * 0.15 }))
      }),
      hedges: [{ line: M.ll([[345, 610], [470, 650]]), h: 0.7, w: 0.6 }, { line: M.ll([[350, 628], [460, 668]]), h: 0.7, w: 0.6 }],
    },
    ...lumps(M, [[340, 515, 3], [395, 590, 3.5], [445, 590, 3.5], [520, 610, 3.5], [560, 660, 3], [700, 610, 3], [745, 650, 3], [720, 520, 3], [770, 560, 2.5], [640, 415, 3], [490, 355, 3], [720, 725, 3]]),
  )
}

/** The court of the Musée Nissim-de-Camondo: pale gravel in the hemicycle, where OSM's ground and the bake gave a lawn (2026-10-31, from above; aerial 48.8793 2.3125, 0.18 m/px). In the model's frame (batch4/hotels.ts museeCamondo): u up its axis, bearing 322.6, v to its right. */
const camondoCourt = (): GardenPlan => {
  const f = frame(48.879019, 2.31262, 322.6)
  const ring: LL[] = [f(4.7, -11.3), f(4.7, 6.5), f(-9.3, 7), f(-13.6, 3.6), f(-16.2, -0.2), f(-16.4, -5), f(-14, -8.5), f(-10.4, -11)]
  return { name: 'Musée Nissim-de-Camondo: the court', ring, gravel: [ring] }
}

export const BATCH4_GARDENS: GardenPlan[] = [lacInferieur(), lacSuperieur(), grandeCascade(), preCatelan(), daumesnil(), ileSaintGermain(), ileDePuteaux(), rothschild(), mandela(), camondoCourt()]
