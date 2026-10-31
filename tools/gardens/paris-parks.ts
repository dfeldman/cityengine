/**
 * Paris's great public parks (Batch 1, 2026-10-31; owner, 2026-10-30: "A special focus should be park gardens, since in a cycling game they are very
 * obvious, and Paris has a lot of them"). Most of them are English landscape parks, not parterres, and read by other things: their open lawns in the
 * mass of the trees, shrubs massed along the walks, flowers at the walks' edges. The register's trees are real and already placed, so no ring here clears
 * them. OSM's lawns and paths stay too; a plan's `lawn` only says which of the green is mown and open, from the photograph.
 *
 * Traced from IGN's aerial (tools/ortho.ts) read off a metre grid, north up, round each park's own origin: every plan's shapes are [east, north] from there.
 * What a plan can't say (water, follies, gates) is a landmark entry in public/landmarks/paris/batch1.json (src/render/landmarks/paris/batch1/).
 */
import { closed, frame, rect, type GardenPlan, type LL } from './plan.ts'

type EN = [number, number]
/** a park's origin: east and north metres to lat/lon */
const grid = (lat: number, lon: number) => {
  const f = frame(lat, lon, 0)
  return (p: EN[]): LL[] => p.map(([e, n]) => f(n, e))
}
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

/** points every `step` metres along a line, each with its heading */
const along = (line: EN[], step: number): { p: EN; ux: number; uz: number }[] => {
  const out: { p: EN; ux: number; uz: number }[] = []
  let left = step / 2
  for (let i = 1; i < line.length; i++) {
    const [ax, az] = line[i - 1], [bx, bz] = line[i]
    const L = Math.hypot(bx - ax, bz - az)
    if (L < 0.01) continue
    const ux = (bx - ax) / L, uz = (bz - az) / L
    let d = left
    while (d < L) { out.push({ p: [ax + ux * d, az + uz * d], ux, uz }); d += step }
    left = d - L
  }
  return out
}

/** a border along a line: a strip `v0`..`v1` metres to its right */
const strip = (line: EN[], v0: number, v1: number): EN[] => {
  const pts = line.map((p, i) => {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(line.length - 1, i + 1)]
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    return { p, rx: (b[1] - a[1]) / L, rz: -(b[0] - a[0]) / L }
  })
  return [...pts.map(({ p, rx, rz }): EN => [p[0] + rx * v0, p[1] + rz * v0]), ...pts.reverse().map(({ p, rx, rz }): EN => [p[0] + rx * v1, p[1] + rz * v1])]
}

/** a blob: `n` corners round (e, n), radii rx and rz give or take a third */
const blob = (e: number, n: number, rx: number, rz: number, c = 8): EN[] => Array.from({ length: c }, (_, k) => {
  const a = (k / c) * Math.PI * 2, m = 0.72 + hash(e + k, n) * 0.56
  return [e + Math.cos(a) * rx * m, n + Math.sin(a) * rz * m] as EN
})

type Parts = Pick<GardenPlan, 'hedges' | 'topiary' | 'beds'>

/**
 * A SHRUBBERY: laurels and spiraeas in a clump at the foot of the trees, which is what stands between an English park's walks and its trees. A loose oval of mounds at no
 * regular height, 40-odd triangles each.
 */
const clump = (g: (p: EN[]) => LL[], e: number, n: number, r: number): Parts => {
  const a = hash(e, n) * Math.PI
  const count = Math.max(4, Math.round(r * 2))
  return {
    topiary: Array.from({ length: count }, (_, k) => {
      const t = (k + 0.5) / count * 2 - 1, off = (hash(e + k * 3.1, n) - 0.5) * r * 0.9
      const u = t * r
      return { at: g([[e + Math.cos(a) * u - Math.sin(a) * off, n + Math.sin(a) * u + Math.cos(a) * off]])[0], shape: 'shrub' as const, h: 1.5 + hash(e, n + k) * 1.8 }
    }),
  }
}

/**
 * THE EDGES OF A WALK: every `every` metres or so, on one side or the other, `off` metres back from the line (the walk's own half-width and the grass
 * verge), a shrubbery or, one time in `flowers`, a border of the season's flowers nearer the walk. Irregular on purpose, and the same at every bake.
 */
const walkside = (g: (p: EN[]) => LL[], line: EN[], o: { every?: number; off?: number; flowers?: number; r?: number } = {}): Parts[] => {
  const every = o.every ?? 34, off = o.off ?? 6, flowers = o.flowers ?? 3
  return along(line, every).map(({ p, ux, uz }, i) => {
    const side = hash(p[0], p[1] + i) < 0.5 ? 1 : -1
    const k = side * (off + hash(p[1], p[0]) * 3)
    const nudge = (hash(p[0] + 7, p[1]) - 0.5) * every * 0.5
    const e = p[0] + ux * nudge - uz * k, n = p[1] + uz * nudge + ux * k
    if (flowers > 0 && i % flowers === flowers - 1) {
      const back = side * (off - 2.5)
      const c: EN = [p[0] + ux * nudge - uz * back, p[1] + uz * nudge + ux * back]
      return { beds: [{ ring: g(strip([[c[0] - ux * 6, c[1] - uz * 6], c, [c[0] + ux * 6, c[1] + uz * 6]], -1.1, 1.1)) }] }
    }
    return clump(g, e, n, (o.r ?? 3) + hash(e, n) * 2.5)
  })
}

/** gather parts of a plan together */
const merge = (name: string, ring: LL[], ...parts: Partial<GardenPlan>[]): GardenPlan => {
  const out: GardenPlan = { name, ring }
  for (const p of parts) {
    for (const k of ['gravel', 'lawn'] as const) if (p[k]) out[k] = [...(out[k] ?? []), ...p[k]!]
    if (p.beds) out.beds = [...(out.beds ?? []), ...p.beds]
    if (p.hedges) out.hedges = [...(out.hedges ?? []), ...p.hedges]
    if (p.rows) out.rows = [...(out.rows ?? []), ...p.rows]
    if (p.topiary) out.topiary = [...(out.topiary ?? []), ...p.topiary]
    if (p.pleached) out.pleached = [...(out.pleached ?? []), ...p.pleached]
  }
  return out
}

/**
 * THE PARC MONCEAU (Thomassin's English garden for the Duc de Chartres, 1778; Alphand, 1861), aerial 48.8795 2.3093, 0.84 m/px. OSM has every lawn between
 * the paths as grass. Under a mown lawn's own colour a polygon's edge read as a stain on the grass (first try, 2026-10-31, from a rider's height), so the
 * lawns stay OSM's; what this adds is the shrubberies on the walks, the flowers along the Allée de la Comtesse de Ségur and round the Rotonde's lawns. The
 * follies and gates are landmark entries.
 */
const monceau = (): GardenPlan => {
  const g = grid(48.8795, 2.3093)
  const walks: EN[][] = [
    [[-176, -87], [-130, -62], [-85, -40], [-48, -14], [-10, -3]], // the allée's western half
    [[8, 3], [50, 5], [95, 6], [140, 11], [188, 19]], // and its eastern
    [[-15, 80], [-5, 47], [5, 0], [20, -50], [35, -115]], // Ferdousi, north to south
    [[12, 58], [60, 70], [100, 90], [135, 95], [170, 75], [190, 40]],
    [[188, 19], [150, -20], [110, -45], [75, -62], [50, -95], [25, -112]],
    [[-176, -87], [-225, -40], [-205, -5], [-120, 30], [-68, 45]],
    [[-210, -112], [-120, -116], [-40, -108], [25, -112]],
  ]
  return merge(
    'Parc Monceau',
    g([[-250, -8], [-205, 12], [-110, 48], [-30, 85], [0, 92], [80, 96], [150, 94], [198, 66], [212, 28], [200, 0], [150, -40], [100, -80], [55, -112], [-30, -122], [-120, -120], [-205, -117], [-240, -90], [-258, -45]]),
    { beds: [{ ring: g(blob(-30, 58, 7, 4)) }, { ring: g(blob(3, 58, 6, 4)) }, { ring: g(blob(12, -22, 8, 3)) }, { ring: g(blob(-96, -33, 9, 3)) }, { ring: g(blob(-140, -80, 8, 3)) }] },
    ...walks.flatMap((w) => walkside(g, w)),
  )
}

/**
 * THE PARC MONTSOURIS (Alphand, 1878; 15 ha, the railway in its cutting down the middle), aerial 48.8222 2.3385. OSM has its lake and lawns; here, the walks'
 * shrubberies and the lakeside's flowers. The Mire du Sud and the rocks of the cascade are entries.
 */
const montsouris = (): GardenPlan => {
  const g = grid(48.8222, 2.3385)
  const walks: EN[][] = [
    [[-15, 203], [-5, 165], [14, 112], [40, 90], [75, 53], [97, 10]], // round the lake
    [[-91, 120], [-85, 85], [-75, 53], [-61, 23], [-118, 13]],
    [[-128, -44], [-96, -30], [-64, -18], [-40, -30], [-25, -45]],
    [[-160, 200], [-140, 150], [-195, 60], [-205, 25], [-250, -45]],
    [[-200, -90], [-140, -90], [-100, -120], [-90, -145]],
    [[50, -40], [100, -60], [150, -90], [180, -140]],
    [[-20, -90], [20, -130], [60, -160], [110, -180]],
  ]
  return merge(
    'Parc Montsouris',
    g([[-175, 225], [-20, 228], [80, 170], [125, 100], [172, 0], [210, -120], [225, -200], [100, -205], [0, -175], [-110, -150], [-250, -90], [-290, -60], [-255, 30], [-200, 130]]),
    { beds: [{ ring: g(blob(2, 140, 10, 3.5)) }, { ring: g(blob(47, 85, 10, 3.5)) }, { ring: g(blob(-52, 15, 10, 4)) }, { ring: g(blob(-92, -55, 9, 4)) }, { ring: g(blob(-85, -135, 7, 4)) }] },
    ...walks.flatMap((w) => walkside(g, w, { every: 36 })),
  )
}

/**
 * THE PARC ANDRÉ-CITROËN (Clément, Provost, Berger, Viguier, Jodry, 1992), aerial 48.8415 2.2755, 0.52 m/px; bearing 120.6 along the great lawn's north-east
 * edge. It is the one geometric park of the lot: the plan is what it says. The six SERIAL GARDENS between the lawn and the Rue Balard, each in its own metal
 * and colour (OSM has their greenhouses and little else): a clipped frame, two long beds, its path pale up the middle. The ESPLANADE between the great
 * greenhouses, its groves in clipped squares (the jets are an entry). The JARDIN NOIR's dark clipped pattern at the lawn's north-west end, the JARDIN BLANC's
 * sunk lawn in the flats by the south gate. The great lawn itself is OSM's, deliberately plain: it is the park's whole idea.
 */
const citroen = (): GardenPlan[] => {
  const g = grid(48.8415, 2.2755)
  const f = frame(48.84190, 2.27375, 120.6) // (the lawn's north corner, u down its edge, v across it toward the Seine; −v is the Rue Balard's side)
  const serial = (u0: number, u1: number): Pick<GardenPlan, 'beds' | 'hedges' | 'topiary'> => {
    const m = (u0 + u1) / 2
    return {
      // (mostly green clipped compartments, the garden's colour only a run down the middle: a carpet of flowers was the first try's mistake)
      hedges: [
        { line: closed(rect(f, u0 + 1, -60, u1 - 1, -9)), h: 1.2, w: 0.9 },
        ...[-48, -38, -28, -18].map((v) => ({ line: [f(u0 + 4, v), f(m - 2, v)], h: 1.7, w: 1.6 })),
        ...[-48, -38, -28, -18].map((v) => ({ line: [f(m + 2, v), f(u1 - 4, v)], h: 1.7, w: 1.6 })),
      ],
      beds: [{ ring: rect(f, m - 1.5, -56, m + 1.5, -13) }],
      topiary: [{ at: f(u0 + 4, -12), shape: 'box' as const, h: 2 }, { at: f(u1 - 4, -12), shape: 'box' as const, h: 2 }],
    }
  }
  const noir = frame(48.8416, 2.2734, 30.6) // (the Jardin Noir's axis, at its middle)
  return [
    merge(
      'Parc André-Citroën',
      g([[-200, 65], [-40, 95], [60, 40], [145, -40], [150, -105], [100, -200], [10, -215], [-30, -120], [-170, -30], [-215, 10]]),
      ...[[34, 62], [66, 92], [96, 124], [128, 156], [160, 186], [190, 212]].map(([a, b]) => serial(a, b)),
      {
        gravel: [g([[45, -101], [107, -137], [81, -183], [20, -137]])],
        // (the Jardin Noir: dark clipped compartments in threes, and the Jardin Blanc's sunk lawn)
        hedges: [-18, 0, 18].flatMap((u) => [-14, 0, 14].map((v) => ({ line: closed(rect(noir, u - 7, v - 5.5, u + 7, v + 5.5)), h: 1.5, w: 1.6 }))),
        lawn: [g([[-40, -185], [-5, -165], [-20, -142], [-55, -160]])],
        beds: [{ ring: g(blob(-30, -190, 9, 4)) }, { ring: g(blob(-58, -172, 6, 3)) }],
      },
    ),
  ]
}

/**
 * THE PARC DE BERCY (Huet, Le Caisne, Feugas, Le Roy, Ferrand, 1994), on the old wine warehouses, aerial 48.8345 2.3830, 0.92 m/px; its grid is bearing 45
 * off the warehouses' lanes. The GRANDE PRAIRIE stays as OSM has it. LES PARTERRES: the potager, orchard, rose and scent gardens round the Maison du Jardinage,
 * each square a low hedge with its beds, and the vine the wine trade is remembered by. The JARDIN ROMANTIQUE east of the bridge: shrubberies on its winding
 * walks. The lanes' rails are an entry (`bercyRails`), OSM having the lanes in cobbles.
 */
const bercy = (): GardenPlan[] => {
  const g = grid(48.8345, 2.383)
  const f = frame(48.8345, 2.383, 45) // (u north-east, v south-east: a parterre square's own axis)
  const uv = (e: number, n: number): [number, number] => [(e + n) * Math.SQRT1_2, (e - n) * Math.SQRT1_2]
  const square = (e: number, n: number, r: number, cross = true): Pick<GardenPlan, 'beds' | 'hedges' | 'lawn'> => {
    const [u, v] = uv(e, n)
    const beds = cross ? [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => ({ ring: rect(f, u + a * r * 0.55 - r * 0.32, v + b * r * 0.55 - r * 0.32, u + a * r * 0.55 + r * 0.32, v + b * r * 0.55 + r * 0.32), rim: true })) : []
    return { hedges: [{ line: closed(rect(f, u - r, v - r, u + r, v + r)), h: 0.9, w: 0.7 }], beds, lawn: cross ? [] : [rect(f, u - r + 2, v - r + 2, u + r - 2, v + r - 2)] }
  }
  // (the vine: rows across the slope at 1.8 m, a hand's height of wire and leaf)
  const [vu, vv] = uv(-120, 240)
  const vine = Array.from({ length: 14 }, (_, k) => ({ line: [f(vu - 12, vv - 12 + k * 1.8), f(vu + 12, vv - 12 + k * 1.8)], h: 1.1, w: 0.45 }))
  const romantic: EN[][] = [
    [[50, 40], [90, 0], [120, -50], [150, -90], [190, -130]],
    [[30, -60], [70, -90], [105, -120], [140, -170]],
    [[60, 60], [120, 30], [180, -30], [225, -80]],
  ]
  return [
    merge(
      'Parc de Bercy, les Parterres',
      g([[-175, 158], [-60, 268], [40, 175], [-65, 65]]),
      square(-60, 200, 16), square(-115, 140, 15), square(-20, 165, 15, false), square(-75, 115, 14), square(-30, 110, 12, false), { hedges: vine },
    ),
    merge(
      'Parc de Bercy, le Jardin romantique',
      g([[10, 50], [80, 95], [225, 0], [240, -90], [170, -190], [80, -160], [20, -80]]),
      ...romantic.flatMap((w) => walkside(g, w, { every: 28 })),
    ),
  ]
}

/**
 * THE PARC GEORGES-BRASSENS (Milliex, Bossard, Besson, 1985), the Vaugirard horse market and abattoirs: aerial 48.8335 2.3000. Its pale esplanade from the Rue
 * des Morillons gate, the Clos des Morillons' vine down its slope (OSM's vineyards, as vines), the Jardin des senteurs' scented beds by the south-east, shrubs
 * on the winding walks. The market halls are OSM's roof; the belfry and the bulls are entries.
 */
const brassens = (): GardenPlan => {
  const g = grid(48.8335, 2.3)
  const f = frame(48.8335, 2.3, 32)
  const uv = (e: number, n: number): [number, number] => {
    const b = (32 * Math.PI) / 180
    return [n * Math.cos(b) + e * Math.sin(b), e * Math.cos(b) - n * Math.sin(b)]
  }
  const vines = (e: number, n: number, ru: number, rv: number) => {
    const [u, v] = uv(e, n), rows = Math.round((2 * rv) / 1.7)
    return Array.from({ length: rows }, (_, k) => ({ line: [f(u - ru, v - rv + k * 1.7), f(u + ru, v - rv + k * 1.7)], h: 1, w: 0.45 }))
  }
  return merge(
    'Parc Georges-Brassens',
    g([[-30, -90], [30, -86], [70, -115], [85, -160], [120, -160], [180, -210], [150, -300], [40, -300], [-110, -300], [-175, -260], [-160, -180], [-110, -130], [-50, -100]]),
    {
      gravel: [g([[12, -130], [35, -122], [52, -132], [72, -160], [78, -188], [70, -205], [55, -205], [62, -180], [50, -158], [28, -148], [8, -155], [-5, -170], [-15, -158], [0, -143]])],
      hedges: [...vines(-100, -270, 11, 9), ...vines(-65, -282, 19, 11)],
      beds: [{ ring: g(blob(112, -188, 12, 5)) }, { ring: g(blob(135, -222, 12, 6)) }, { ring: g(blob(100, -218, 9, 4)) }, { ring: g(blob(45, -240, 8, 3)) }],
    },
    ...[
      [[0, -150], [-40, -165], [-75, -195], [-115, -225], [-170, -255]],
      [[-30, -222], [-20, -245], [0, -260], [60, -270]],
      [[80, -205], [105, -240], [100, -270]],
      [[-115, -160], [-90, -150], [-70, -165]],
    ].flatMap((w) => walkside(g, w as EN[], { every: 26 })),
  )
}

/**
 * THE PARC DES BUTTES-CHAUMONT (Alphand, Barillet-Deschamps, Davioud, 1867), aerial 48.8795 2.3830, 0.6 m/px. Almost all canopy, so a ring and the walks'
 * shrubberies round the lake and across the west lawns; the cliff is the terrain's, the temple and bridges models, the Grande Cascade's grotto an entry.
 */
const buttes = (): GardenPlan => {
  const g = grid(48.8795, 2.383)
  const walks: EN[][] = [
    [[-100, 220], [-90, 255], [-30, 268], [30, 262], [60, 235], [78, 190], [78, 140], [92, 105], [135, 90], [172, 70]],
    [[-200, 80], [-150, 55], [-100, 30], [-60, 15]],
    [[-40, 0], [-22, 50], [-10, 85]],
    [[-100, 300], [-40, 318], [20, 305], [60, 270]],
    [[100, 170], [150, 110], [190, 90]],
    [[155, 320], [175, 250], [195, 195]],
    [[250, 240], [265, 190], [230, 120]],
    [[-135, 170], [-125, 110], [-90, 90], [-40, 88]],
  ]
  return merge(
    'Parc des Buttes-Chaumont',
    g([[-110, 340], [40, 365], [175, 365], [320, 255], [350, 150], [305, 60], [220, 10], [60, -20], [-100, -15], [-250, 55], [-205, 150], [-160, 250]]),
    { beds: [{ ring: g(blob(-70, 262, 10, 3)) }, { ring: g(blob(55, 248, 3.5, 10)) }, { ring: g(blob(-150, 72, 9, 3)) }, { ring: g(blob(120, 100, 9, 3)) }] },
    ...walks.flatMap((w) => walkside(g, w, { every: 36 })),
  )
}

/**
 * THE JARDIN DU RANELAGH (the old ballroom's lawn, laid out 1860 under Haussmann), aerial 48.8580 2.2690. Lawns and chestnuts; the register has the chestnuts.
 * So few shrubs, and only by the walks' junctions: this one is open on purpose. The bandstand and the old carousel are entries.
 */
const ranelagh = (): GardenPlan => {
  const g = grid(48.858, 2.269)
  const walks: EN[][] = [
    [[-25, 200], [5, 215]], [[12, 160], [55, 185]],
    [[-57, 130], [-30, 105], [-22, 77]],
    [[-90, -5], [-72, 37], [-30, 40]],
    [[27, -17], [55, -30], [80, -25]],
    [[20, 30], [40, 15], [90, 40]],
  ]
  return merge(
    'Jardin du Ranelagh',
    g([[-135, -60], [-60, 25], [10, 45], [100, 55], [110, 170], [70, 230], [35, 330], [-60, 330], [-90, 210], [-115, 90], [-160, 10]]),
    { beds: [{ ring: g(blob(-30, 95, 8, 3)) }, { ring: g(blob(38, 170, 8, 3)) }] },
    ...walks.flatMap((w) => walkside(g, w, { every: 30, flowers: 4 })),
  )
}

/**
 * THE JARDIN DES PLANTES, past the perspective (which is jardin.ts's): the Butte de Coupeaux's Grand Labyrinthe west of the Grandes Serres, aerial 48.8430
 * 2.3590, shrubs up its spiral to the Gloriette (an entry) and on the walks through the Ménagerie's side and the Carré Lamarck.
 */
const plantes = (): GardenPlan => {
  const g = grid(48.843, 2.359)
  // (the labyrinth's spiral, from the Gloriette at (−227, 15) out to its foot at 45 m)
  const spiral: EN[] = Array.from({ length: 28 }, (_, k) => {
    const a = k * 0.72, r = 10 + k * 1.35
    return [-227 + Math.cos(a) * r, 15 + Math.sin(a) * r * 0.85]
  })
  return merge(
    'Jardin des Plantes, le Labyrinthe',
    g([[-268, 60], [-215, 72], [-180, 55], [-168, 22], [-185, -20], [-235, -30], [-272, 0]]),
    ...walkside(g, spiral, { every: 12, off: 3.5, flowers: 0, r: 2.2 }),
  )
}

/**
 * THE PARC DE LA VILLETTE (Tschumi, 1987), whose folies, Grande Halle and canal are models and OSM's. What lies under the trees is its "cinematic promenade" of themed gardens in hollows, OSM naming
 * each: read off aerial 48.8925 2.3900. The JARDIN DES BAMBOUS's dense tall leaf (a shrub that is 6 m is a bamboo, and it stops the eye as the real one does), the JARDIN DE LA TREILLE's
 * vine trellis on its posts, the JARDIN DES MIROIRS's dark planting, the DUNES's low scrub. The Dragon's slide is an entry. Terraced hollows are the terrain's and not said here.
 */
const villette = (): GardenPlan[] => {
  const g = grid(48.8925, 2.39)
  const tall = (e: number, n: number, re: number, rn: number, count: number, h0: number, h1: number): NonNullable<GardenPlan['topiary']> => Array.from({ length: count }, (_, k) => ({
    at: g([[e + (hash(k, e) * 2 - 1) * re, n + (hash(n, k) * 2 - 1) * rn]])[0], shape: 'shrub' as const, h: h0 + hash(k + 3, n) * (h1 - h0),
  }))
  const treille = Array.from({ length: 6 }, (_, k) => ({ line: g([[12, 38 + k * 6], [70, 38 + k * 6]]), y0: 2.3, h: 0.5, w: 2.6, spacing: 3 }))
  return [
    { name: 'Parc de la Villette, le Jardin des Bambous', ring: g(blob(148, -6, 66, 33)), topiary: tall(148, -6, 58, 24, 60, 4.5, 7) },
    { name: 'Parc de la Villette, le Jardin de la Treille', ring: g(blob(41, 52, 47, 31)), pleached: treille },
    { name: 'Parc de la Villette, le Jardin des Miroirs', ring: g(blob(-52, -183, 28, 31)), topiary: tall(-52, -183, 24, 26, 26, 2.2, 3.8) },
    { name: 'Parc de la Villette, le Jardin des Vents et des Dunes', ring: g(blob(-114, -105, 60, 45)), topiary: tall(-114, -105, 52, 38, 26, 0.8, 1.6) },
    { name: 'Parc de la Villette, le Jardin des Ombres', ring: g(blob(248, 75, 22, 24)), topiary: tall(248, 75, 19, 20, 14, 2.5, 4) },
  ]
}

/**
 * The COUR AUX ERNESTS (École normale supérieure, 45 rue d'Ulm; aerial 48.8420 2.3445 and the court of OSM's relation/4057561): gravel, its four lawns under the court's trees, round the round pool (an entry). Its axis on bearing 18, from the court's walls.
 */
const ernests = (): GardenPlan => {
  const f = frame(48.841906, 2.344826, 18)
  return {
    name: 'École normale supérieure, la Cour aux Ernests',
    ring: rect(f, -23, -21, 23, 21),
    gravel: [rect(f, -23, -21, 23, 21)],
    lawn: [rect(f, -20, -18, -7, -3), rect(f, -20, 3, -7, 18), rect(f, 7, -18, 20, -3), rect(f, 7, 3, 20, 18)],
  }
}

export const PARKS_GARDENS: GardenPlan[] = [monceau(), buttes(), montsouris(), ...citroen(), ...bercy(), brassens(), plantes(), ranelagh(), ...villette(), ernests()]
