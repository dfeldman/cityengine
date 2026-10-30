/**
 * The gardens of Paris's palaces and great houses, traced from IGN's aerial photographs (tools/ortho.ts). Each laid out in metres on
 * its own axis, read off a grid drawn over the photograph in that frame: u along the axis, v to its right. OSM's own hedges, beds and
 * tree rows are drawn as well, so these are only what it has not got; a landmark model's basins and walls are left to the model.
 */
import { circle, closed, frame, rect, type Frame, type GardenPlan, type LL } from './plan.ts'

type Row = NonNullable<GardenPlan['rows']>[number]
type Yew = NonNullable<GardenPlan['topiary']>[number]

/** the same frame seen in a mirror: v on the left. A symmetrical garden draws one side twice */
const mirror = (f: Frame, s: 1 | -1): Frame => (u, v) => f(u, s * v)
/** points along an arc round (u, v): degrees from +u towards +v */
const arc = (f: Frame, u: number, v: number, r: number, a0: number, a1: number, step = 6): LL[] => {
  const n = Math.max(1, Math.round(Math.abs(a1 - a0) / step))
  return Array.from({ length: n + 1 }, (_, k) => {
    const a = ((a0 + ((a1 - a0) * k) / n) * Math.PI) / 180
    return f(u + r * Math.cos(a), v + r * Math.sin(a))
  })
}
/** a curved band: between two radii, from one angle to another */
const sector = (f: Frame, u: number, v: number, r0: number, r1: number, a0: number, a1: number, step = 6): LL[] =>
  [...arc(f, u, v, r1, a0, a1, step), ...arc(f, u, v, r0, a1, a0, step)]
const poly = (f: Frame, pts: [number, number][]): LL[] => pts.map(([u, v]) => f(u, v))
const beds = (rings: LL[][], rim = false) => rings.map((ring) => (rim ? { ring, rim } : { ring }))
const balls = (at: LL[], h: number, shape: Yew['shape'] = 'ball'): Yew[] => at.map((p) => ({ at: p, shape, h }))
const along = (a: number, b: number, step: number): number[] => {
  const n = Math.max(1, Math.round(Math.abs(b - a) / step))
  return Array.from({ length: n + 1 }, (_, k) => a + ((b - a) * k) / n)
}
/**
 * A planted block of trees in a grid: rows along v, `du` apart and a tree every `dv`, each row the half step on from the last (a
 * quincunx) if `stagger`; rows stop at `holes`, [u0, u1, v0, v1].
 */
const grove = (f: Frame, u0: number, u1: number, v0: number, v1: number, du: number, dv: number, o: { h?: number; stagger?: boolean; holes?: [number, number, number, number][] } = {}): Row[] => {
  const out: Row[] = []
  let k = 0
  for (const u of along(u0, u1, du)) {
    const start = o.stagger && k++ % 2 ? v0 + dv / 2 : v0
    let cuts: [number, number][] = [[start, v1]]
    for (const [a, b, c, d] of o.holes ?? []) {
      if (u < a || u > b) continue
      cuts = cuts.flatMap(([p, q]): [number, number][] => (q <= c || p >= d ? [[p, q]] : [...(p < c ? [[p, c] as [number, number]] : []), ...(q > d ? [[d, q] as [number, number]] : [])]))
    }
    for (const [p, q] of cuts) if (q - p >= dv) out.push({ line: [f(u, p), f(u, q)], spacing: dv, h: o.h })
  }
  return out
}

/* ------------------------------------------------------------------------------------------------------ the Luxembourg */

/**
 * The JARDIN DU LUXEMBOURG (aerial, about 0.15 m/px). The axis runs from the palace's front through the Grand Bassin to the
 * Observatoire, bearing 2.7; the frame stands on the basin (the model's own centre, 48.846913 2.3372), u north to the palace.
 * Every number below is off the grid; OSM has only the outer rows of the chestnut blocks and the Orangerie court's hedges.
 */
const LUX = frame(48.846913, 2.3372, 2.7)

/**
 * The sunken PARTERRE: the octagon (the model's) between a square lawn to the north, a long round-ended lawn to the south and a
 * half-round lawn either side, each inside a band of flowers with a thin gravel line round the grass. Round them the sand; at the
 * foot of the terrace walls (the model's) a strip of turf, concentric with the walls, r 45 about (0, ±45); and two rings of clipped
 * round-headed trees, one either side of it.
 */
const luxParterre = (): GardenPlan => {
  const f = LUX
  const lawn: LL[][] = []
  const bed: LL[][] = []
  const trees: LL[] = []
  // the north lawn
  lawn.push(rect(f, 49.5, -19, 81.8, 19))
  bed.push(rect(f, 43.5, -23.7, 47, 23.7), rect(f, 84, -23.7, 87, 23.7), rect(f, 47, -23.7, 84, -20.5), rect(f, 47, 20.5, 84, 23.7))
  // the south lawn: its head has a notch for the plinth; its foot is a half round
  lawn.push(poly(f, [[-44.8, -19.2], [-44.8, -3.6], [-49, -3.6], [-49, 3.6], [-44.8, 3.6], [-44.8, 19.2], [-97, 19.2], [-97, 17], [-99.5, 17]]).concat(arc(f, -99.5, 0, 17, 90, 270).slice(1), poly(f, [[-97, -17], [-97, -19.2]])))
  bed.push(rect(f, -40.5, -24.2, -43.8, 24.2), rect(f, -43.8, -24.2, -96.5, -20.8), rect(f, -43.8, 20.8, -96.5, 24.2), sector(f, -99.5, 0, 18.4, 21.3, 90, 270))
  for (const s of [1, -1] as const) {
    const m = mirror(f, s)
    // the half-round lawns, about (0.5, ±44.3)
    lawn.push(sector(m, 0.5, 44.3, 0, 23.6, 0, 180).slice(0, -1))
    bed.push(sector(m, 0.5, 44.3, 25, 28, 0, 180), rect(m, -27.5, 39.2, 28.5, 42.8))
    // the turf at the foot of the walls: the two quarter rounds, the straights north and south of them
    lawn.push(sector(m, 0, 45, 40.2, 45, 6, 86), sector(m, 0, 45, 40.2, 45, 94, 174))
    lawn.push(rect(m, 44, 44.4, 84, 49.9), rect(m, -40, 39.3, -64, 45), rect(m, -72.5, 39.3, -96, 45), rect(m, -137, 33, -155, 40))
    // the flowers along the north straights
    bed.push(rect(m, 43, 39.4, 85, 43.6))
    // and the quarter round that carries the turf round to the palace's gardens, r 45 about (126, ±49)
    lawn.push(sector(m, 126, 49, 40, 45, 180 + 3, 180 - 62))
    // the clipped trees: the ring inside the turf, the ring on the terrace outside the wall
    for (const a of along(14, 76, 12.4)) for (const t of [a, 180 - a]) trees.push(...arc(m, 0, 45, 36.3, t, t, 1).slice(0, 1), ...arc(m, 0, 45, 51, t, t, 1).slice(0, 1))
    for (const u of along(50, 84, 8.5)) trees.push(m(u, 36), m(u, 52.8))
    for (const u of [...along(-46, -62, 8), ...along(-74, -94, 8)]) trees.push(m(u, 36), m(u, 48.3))
    // the palace front's clipped trees and its low beds
    for (const v of [12, 25.5, 37]) trees.push(m(100.5, v))
    bed.push(rect(m, 103.2, 10.7, 105.4, 22.6), rect(m, 103.2, 25, 105.4, 46.7), rect(m, 107.5, 10, 115, 20.5))
  }
  const outline = poly(f, [
    [116, -50], [116, 50], [103, 46], [104, 58], [115, 66], [128, 72], [128, 84], [116, 90], [102, 85], [90, 72], [81, 52], [78, 61], [62, 64], [50, 72], [40, 90],
    [20, 104], [0, 108], [-20, 104], [-38, 88], [-48, 70], [-62, 60], [-100, 55], [-120, 50], [-145, 44], [-160, 36], [-160, -36], [-145, -44], [-120, -52], [-100, -60],
    [-62, -60], [-48, -70], [-38, -88], [-20, -104], [0, -108], [20, -106], [35, -97], [45, -88], [60, -84], [76, -82], [81, -52], [90, -72], [102, -85], [114, -88], [128, -82], [128, -72],
    [115, -66], [104, -58], [103, -46],
  ])
  // (the register has these trees too, as if they were full grown: they are small, clipped and round)
  return { name: 'Jardin du Luxembourg: the parterre', ring: outline, clearMapped: true, gravel: [outline], lawn, beds: beds(bed, true), topiary: balls(trees, 3.6) }
}

/** Lines across a ring in its frame, `dv` apart: an espalier's rows, cut to the shape of their bed. */
const stripes = (f: Frame, ring: [number, number][], v0: number, v1: number, dv: number): LL[][] => {
  const out: LL[][] = []
  for (const v of along(v0, v1, dv)) {
    const us: number[] = []
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [ua, va] = ring[j], [ub, vb] = ring[i]
      if ((va > v) !== (vb > v)) us.push(ua + ((v - va) * (ub - ua)) / (vb - va))
    }
    us.sort((a, b) => a - b)
    for (let k = 0; k + 1 < us.length; k += 2) if (us[k + 1] - us[k] > 3) out.push([f(us[k] + 0.8, v), f(us[k + 1] - 0.8, v)])
  }
  return out
}

/**
 * The Senate's own gardens down the palace's flanks: lawns in thin borders of flowers, the sand walk that curves round them from the
 * palace front, on the east a flower strip and a clipped hedge along it. Their walls and the pavilions are the palace model's.
 */
const luxSenate = (): GardenPlan => {
  const f = LUX
  const eastLawn = [...poly(f, [[145.6, 51.8], [145.6, 65.5]]), ...arc(f, 134, 43.3, 22.2, 90, 157)]
  const ring = poly(f, [[108, 50], [150, 50], [198, 50], [198, 76], [134, 76], [122, 74], [110, 66]])
  return {
    name: 'Jardin du Luxembourg: the Senate\'s east garden',
    ring,
    gravel: [ring],
    lawn: [
      rect(f, 153, 52.2, 176, 66), eastLawn,
      [...poly(f, [[189.7, 51.5], [189.7, 68], [181.3, 68], [180.5, 66.5]]), ...arc(f, 180.5, 60, 6.5, 90, -90), ...poly(f, [[181.3, 51.5]])],
    ],
    beds: beds([
      rect(f, 176.5, 50.5, 178.4, 59), rect(f, 176.5, 60, 178.4, 68), rect(f, 153, 66.2, 176.5, 68), rect(f, 150.8, 50.5, 152.7, 59), rect(f, 150.8, 60, 152.7, 68),
      rect(f, 146, 51.8, 147.8, 59), rect(f, 146, 60, 147.8, 68), rect(f, 134, 66, 146, 68), sector(f, 134, 43.3, 22.6, 24.6, 90, 150),
      rect(f, 134, 70.3, 198, 72.3), sector(f, 134, 43.3, 27, 29, 90, 150),
    ]),
    hedges: [{ line: [f(153, 50.9), f(176.5, 50.9)], h: 0.5, w: 0.6 }],
  }
}
const luxSenateWest = (): GardenPlan => {
  const f = LUX
  const ring = poly(f, [[110, -52], [190, -44], [190, -72], [148, -72], [128, -72], [116, -64]])
  const walk: [number, number][] = [[110, -51.5], [190, -51.5], [190, -44], [110, -44]]
  return {
    name: 'Jardin du Luxembourg: the Senate\'s west garden',
    ring,
    gravel: [poly(f, walk), rect(f, 179.5, -72, 188.5, -52)],
    lawn: [
      [...poly(f, [[145.3, -66.5], [145.3, -54.5], [111, -54.5]]), ...arc(f, 128, -46.7, 20.5, 205, 270, 8)],
      poly(f, [[154, -67], [175, -67], [175, -55.6], [154, -55.6], [154, -63], [160, -63], [170, -63], [170, -67]]),
      rect(f, 181, -71, 187.5, -63.5), rect(f, 181, -60.5, 187.5, -53),
    ],
    beds: beds([rect(f, 114, -54.3, 147.6, -52), rect(f, 145.5, -66.5, 147.6, -60.8), rect(f, 145.5, -59.5, 147.6, -54.3)]),
    topiary: balls(along(116, 188, 8).map((u) => f(u, -46)), 2.2),
  }
}

/**
 * The ORANGERIE's court: the sand between the glasshouse and the parterre, its two lines of tubbed oranges and palms; the parterre's
 * middle lawn and its side lawns (OSM's hedges draw their edges and its flowerbed the north border), the clipped hedge along the
 * south; and below it the quincunx of round-headed trees on sand, down to the tennis courts.
 */
const luxOrangerie = (): GardenPlan => {
  const f = LUX
  const ring = rect(f, 54, -248, 137.5, -172)
  return {
    name: 'Jardin du Luxembourg: the Orangerie',
    ring,
    gravel: [ring],
    lawn: [
      rect(f, 98.7, -216.6, 115.5, -203.7),
      poly(f, [[121.8, -237.3], [122.3, -226.7], [115, -226.4], [114.9, -229], [110, -232.8], [106.4, -233.2], [102.9, -232.9], [99.1, -228.7], [98.8, -226.1], [93, -226], [92.5, -237.3]]),
      poly(f, [[122.5, -193.9], [122.6, -182.8], [93.1, -182.8], [92.8, -193.4], [99.4, -193.5], [100, -191.1], [103.7, -187.7], [106.4, -186.5], [110.4, -186.7], [114.2, -190.9], [115.1, -193.6]]),
    ],
    hedges: [{ line: [f(93.5, -224), f(93.5, -195)], h: 1.5, w: 2.6 }],
    topiary: balls([...along(-231, -176, 5).map((v) => f(137, v)), ...along(-229, -178, 5).map((v) => f(125.6, v))], 2.4),
    rows: grove(f, 57.5, 89, -246, -174, 7, 9.7, { h: 8, stagger: true }),
  }
}

/**
 * The KIOSQUE's quincunx, east of the parterre: clipped trees on sand on a grid of about 6 m, the bandstand (a model) in its clearing
 * in the north block, a shelter and a small kiosk in the south one. OSM has only the rows along the cross alley, which stay.
 */
const luxKiosque = (): GardenPlan => {
  const f = LUX
  const ring = rect(f, -62, 86, 75, 153)
  return {
    name: 'Jardin du Luxembourg: the Kiosque quincunx',
    ring,
    gravel: [ring],
    rows: [
      ...grove(f, 13, 73, 104, 151, 6, 6, { h: 7, holes: [[30, 56, 111, 139]] }),
      ...grove(f, -60, -9, 92, 147, 6, 6, { h: 7, holes: [[-42, -26, 90, 132], [-16, -8, 132, 142]] }),
    ],
  }
}

/**
 * The great block of chestnuts west of the parterre: the canopy shows its rows, about 5.5 m apart, either side of an alley at u 75 and
 * south of the cross alley. The two sand clearings are left clear for the iron cones (not modelled).
 */
const luxChestnuts = (): GardenPlan[] => {
  const f = LUX
  const north = poly(f, [[20, -174], [120, -174], [120, -80], [76, -82], [60, -84], [45, -88], [35, -97], [20, -106]])
  const south = poly(f, [[-8, -174], [-8, -112], [-20, -106], [-38, -90], [-50, -80], [-62, -78], [-62, -174]])
  const trim: [number, number, number, number][] = [[18, 35, -112, -50], [35, 45, -101, -50], [45, 77, -91, -50]]
  return [
    {
      name: 'Jardin du Luxembourg: the north chestnut block',
      ring: north,
      rows: [
        ...grove(f, 22, 72, -172, -82, 5.5, 6.5, { h: 12, stagger: true, holes: [[26, 50, -142, -118], ...trim] }),
        ...grove(f, 78, 118, -172, -82, 5.5, 6.5, { h: 12, stagger: true }),
      ],
      gravel: [north],
    },
    {
      name: 'Jardin du Luxembourg: the south chestnut block',
      ring: south,
      rows: grove(f, -60, -10, -172, -82, 5.5, 6.5, { h: 12, stagger: true, holes: [[-45, -25, -141, -118], [-22, -8, -112, -50], [-40, -22, -96, -50], [-62, -40, -84, -50]] }),
      gravel: [south],
    },
  ]
}

/** The VERGER, the old fruit garden by the rue Auguste-Comte: its two beds of espaliered pears on their north-south wires, in turf. */
const luxVerger = (): GardenPlan => {
  const f = LUX
  const east: [number, number][] = [[-252.3, -243.9], [-244.9, -234.5], [-243.8, -222.5], [-246.1, -211.2], [-254.3, -196.9], [-264.3, -192.7], [-269.9, -193.4], [-271.6, -200.7], [-270.4, -214.7], [-264.1, -229]]
  const west: [number, number][] = [[-266.6, -241.4], [-270.1, -246.4], [-268.4, -261.3], [-265.3, -273.5], [-252.3, -274.6], [-249.5, -252.9], [-259.3, -245]]
  const espalier = [...stripes(f, east, -239, -196, 3.8), ...stripes(f, west, -272, -244, 4)]
  return {
    name: 'Jardin du Luxembourg: the Verger',
    ring: poly(f, [[-242, -280], [-242, -188], [-274, -188], [-274, -280]]),
    lawn: [poly(f, east), poly(f, west)],
    hedges: espalier.map((line) => ({ line, h: 1.9, w: 1.1 })),
  }
}

/** The PETIT LUXEMBOURG's parterre (the rest of its garden is trees, left to the scatter): a broderie round a little basin. */
const petitLuxembourg = (): GardenPlan => {
  const f = LUX
  const ring = rect(f, 185.2, -104.7, 213.1, -89.1)
  return {
    name: 'Petit Luxembourg: the parterre',
    ring,
    gravel: [ring],
    lawn: [rect(f, 200, -102.8, 209.3, -90.3), rect(f, 186, -102.8, 193.5, -90.3), rect(f, 193.5, -102.8, 200, -100.6), rect(f, 193.5, -92.8, 200, -90.3)],
    beds: beds([rect(f, 201.5, -100.5, 208, -92.8), rect(f, 187.2, -100.5, 192.5, -92.8)], true),
  }
}

/**
 * The AVENUE's head, south of the terrace: four long lawns between eight walls of clipped chestnuts on OSM's rows (lines read off
 * their tops; the walls cast about 9 m of shadow at this sun, so some 10 m tall), a sand walk down the middle of each pair.
 */
const luxAvenue = (): GardenPlan => {
  const f = LUX
  const ring = rect(f, -160, -48, -262, 49)
  return {
    name: 'Jardin du Luxembourg: the avenue of clipped chestnuts',
    ring,
    clearMapped: true,
    gravel: [ring],
    lawn: [rect(f, -164, -9, -258, 10.5), rect(f, -165, 26.5, -259, 34.5), rect(f, -163, -29, -256, -22)],
    pleached: [-42, -32.3, -19, -10, 12.8, 23.5, 37.2, 44.3].map((v) => ({ line: [f(-163, v), f(-262, v)], y0: 2, h: 8.5, w: 4.8, spacing: 8 })),
  }
}

/* ------------------------------------------------------------------------------------------------------ the Tuileries */

/**
 * The JARDIN DES TUILERIES, the photograph rectified to its axis: bearing 295.9 through both round basins' centres (the models'),
 * u west towards the Concorde from the Grand Bassin Rond, v north towards the rue de Rivoli. OSM has its flower borders, 129 rows of
 * trees and the Carrousel's yews, so this is the ground they stand on and the trees it has not got. The summer 2024 cauldron stands
 * in the round basin and tents along the cross walks; they are ignored.
 */
const TUI = frame(48.862873, 2.329294, 295.9)
/** the rectangle from (uFar, vFar) to (uEdge, vEdge), its corner at (uEdge, vEdge) cut off by the circle round (cu, cv) */
const cornerCut = (f: Frame, uFar: number, uEdge: number, vFar: number, vEdge: number, cu: number, cv: number, r: number): LL[] => {
  const deg = (dv: number, du: number): number => (Math.atan2(dv, du) * 180) / Math.PI
  const a0 = deg(vEdge - cv, Math.sign(uFar - cu) * Math.sqrt(r * r - (vEdge - cv) ** 2))
  const a1 = deg(Math.sign(vFar - cv) * Math.sqrt(r * r - (uEdge - cu) ** 2), uEdge - cu)
  // (the short way round)
  const a1n = a1 - a0 > 180 ? a1 - 360 : a1 - a0 < -180 ? a1 + 360 : a1
  return [f(uFar, vFar), f(uFar, vEdge), ...arc(f, cu, cv, r, a0, a1n, 10), f(uEdge, vFar)]
}
/** a single tree: a row one tree long */
const tree = (f: Frame, u: number, v: number, h?: number): Row => ({ line: [f(u, v), f(u + 0.2, v)], spacing: 1, h })

/**
 * The GRAND CARRÉ: eight lawns between the walks, the four western ones cut by the round basin's sand, the four eastern ones by the
 * rings round their two little fountains; low clipped balls along the cross walk and tubs down the east walk. The lawns' free
 * standing trees are placed one by one.
 */
const tuileriesCarre = (): GardenPlan => {
  const f = TUI
  const ring = rect(f, -120, -123, 88, 122)
  const lawn: LL[][] = []
  const yews: LL[] = []
  // the west half: straight panels outside the N-S walks, the inner ones cut by the basin's circle, r 46
  lawn.push(rect(f, 11, -122, 76, -71), rect(f, 11, 68, 76, 113.4))
  lawn.push([...poly(f, [[76, -64.5], [76, -10.7], [44.6, -10.7]]), ...arc(f, 0, 0, 46, -13.8, -76).slice(1), ...poly(f, [[11, -64.5]])])
  lawn.push([...poly(f, [[76, 62], [76, 12.5], [44.3, 12.5]]), ...arc(f, 0, 0, 46, 15.8, 76).slice(1), ...poly(f, [[11, 62]])])
  // the east half: the rings round the fountains, r 15, about (-72.4, -68) and (-72.4, 64.5), on the crossing of the walks (u -70
  // to -74.7; v -70.4 to -65.3 and 62 to 67.6)
  for (const [c, s, out, inn] of [[-68, -1, -70.4, -65.3], [64.5, 1, 67.6, 62]] as const) {
    const near = s * 11.3
    lawn.push(cornerCut(f, -12.5, -70, s * 122, out, -72.4, c, 15), cornerCut(f, -119.6, -74.7, s * 122, out, -72.4, c, 15), cornerCut(f, -119.6, -74.7, near, inn, -72.4, c, 15))
    // the inner north panel loses a corner to its ring and its head to the round basin's sand
    lawn.push([...cornerCut(f, -12.5, -70, near, inn, -72.4, c, 15).slice(1), ...arc(f, 0, 0, 46, s * 165.8, s * 105.8)])
  }
  for (const [a, b] of [[-91, -72], [-53, -42], [45, 63], [71, 91]]) yews.push(...along(a, b, 3.5).map((v) => f(-7, v)))
  for (const [a, b] of [[-100, -77], [-63, -44], [44, 62], [71, 92]]) yews.push(...along(a, b, 3.5).map((v) => f(9.4, v)))
  const tubs = [-57, -67.7, -76, -84, -91].flatMap((u) => [f(u, -7.5), f(u, 7.5)])
  return {
    name: 'Jardin des Tuileries: the Grand Carré',
    ring,
    gravel: [ring],
    lawn,
    topiary: [...balls(yews, 1.5), ...balls(tubs, 2.2)],
    rows: ([
      [25.9, -99.8], [19.6, -82.5], [-24.4, -77.8], [-22.1, -88], [-40.1, -44.8], [-33.9, -67.6], [-53.5, -10.2], [-65.3, 11], [-77.1, 20.4], [-81, 44],
      [-18.1, 78.6], [-43.3, 94.3], [-70, 86.4], [-81, -46.4], [-109.3, -80.9], [21.1, 75.4], [21.1, 97.4],
    ] as const).map(([u, v]) => tree(f, u, v)),
  }
}

/**
 * The GRAND COUVERT: blocks of chestnuts and limes between the central walk and the terraces, the sand showing through; OSM's rows
 * line each block, these fill it, on the 8 m the crowns show. Inside the blocks are the lawn rooms, and either side of the walk the
 * two long round-ended basins (the map's water) in their hedges by the cafés (OSM has only the north one's hedge).
 */
const tuileriesCouvert = (): GardenPlan => {
  const f = TUI
  const ring = rect(f, 88, -123, 402, 123)
  const stadium = (v: number): LL[] => [...arc(f, 117.7, v, 10.7, 90 + 180, 90), ...arc(f, 143.3, v, 10.7, 90, -90)]
  return {
    name: 'Jardin des Tuileries: the Grand Couvert',
    ring,
    gravel: [ring],
    lawn: [
      rect(f, 183.6, -55, 235, -24), rect(f, 183.6, 25, 235, 51.8), rect(f, 268.6, -55, 291, -24), rect(f, 271, 25, 288, 50), rect(f, 321, -55, 359, -25), rect(f, 321, 25, 359, 50),
    ],
    hedges: [{ line: closed(stadium(-37.6)), h: 1.1, w: 0.8 }],
    rows: [
      // the central walk's two rows a side, the small trees within
      ...[-16, 16].map((v) => ({ line: [f(92, v), f(370, v)], spacing: 8, h: 14 })),
      ...[-8, 8].map((v) => ({ line: [f(92, v), f(372, v)], spacing: 8, h: 8 })),
      { line: [f(180, 20), f(240, 20)], spacing: 7, h: 12 },
      { line: [f(108, -20), f(156, -20)], spacing: 7, h: 8 },
      { line: [f(108, 55), f(156, 55)], spacing: 7, h: 8 },
      ...grove(f, 96, 160, -106, -84, 8, 8),
      ...grove(f, 96, 160, 72, 112, 8, 8),
      ...grove(f, 182, 238, -104, -84, 8, 8),
      ...grove(f, 200, 222, 84, 100, 7, 7, { h: 9 }),
      ...grove(f, 262, 296, 72, 112, 8, 8, { holes: [[266, 292, 76, 108]] }),
      ...grove(f, 316, 392, 78, 112, 8, 8, { holes: [[338, 364, 84, 102]] }),
    ],
  }
}

/**
 * The west end: the sand round the octagon (a model), the two five-sided lawns whose yew hedges OSM draws, and the HORSESHOE's clipped
 * yews along its ramps. The photograph has the Olympic works on it here; the planting stands clear of them.
 */
const tuileriesFerACheval = (): GardenPlan => {
  const f = TUI
  const ring = rect(f, 402, -82, 545, 82)
  const line = (pts: [number, number][]) => ({ line: poly(f, pts), h: 1.3, w: 1.6 })
  return {
    name: 'Jardin des Tuileries: the Fer à Cheval',
    ring,
    gravel: [ring],
    lawn: [
      poly(f, [[438.2, -80.4], [438.2, -50.9], [443.2, -50.9], [454.3, -41.1], [458.2, -48.2], [463.2, -46.4], [474.8, -53.6], [476.6, -50.9], [489.1, -57.1], [454.3, -80.4]]),
      poly(f, [[438.2, 51.8], [439.1, 79.5], [456.1, 79.5], [488.6, 56.8], [479.3, 54.5], [465.9, 49.1], [461.4, 58.9], [456.1, 57.1], [457.9, 46.4], [455.2, 42.9], [445.4, 51.8]]),
      poly(f, [[529, -80], [530, -61], [505, -80]]), poly(f, [[528, 51], [528, 80], [485, 80]]),
    ],
    hedges: [
      line([[528, -22.3], [517.7, -29.7], [508.6, -32], [498.3, -31.4], [488, -26.9], [481.1, -21.7]]),
      line([[522.3, -42.9], [512, -45.7], [502.9, -46.3], [492.6, -44], [480, -38.9], [474.3, -34.9]]),
      line([[526.9, 26.3], [510.9, 32.6], [500.6, 31.4], [488, 26.9], [482.9, 23.4]]),
      line([[517.7, 45.1], [506.3, 45.7], [490.3, 43.4], [480, 38.9], [475.4, 34.3]]),
    ],
  }
}

/**
 * The CARROUSEL's lawns (OSM has the yew rays and the hedged squares; this is the turf round them and the sand they stand in). The
 * esplanade's sand stops short of the avenue's two tunnel mouths, and short of the Pyramid's roundabout.
 */
const carrousel = (): GardenPlan => {
  const f = TUI
  const ring = poly(f, [[-120, -78], [-120, 82], [-160, 82], [-160, 121.5], [-262, 121.5], [-266, 106], [-321, 120], [-362, 120], [-353, 72], [-321, 36], [-340, 32], [-340, -32], [-327, -34], [-362, -57.5], [-363, -87.5], [-266, -99], [-262, -116], [-160, -100], [-160, -78]])
  return {
    name: 'Jardins du Carrousel',
    ring,
    gravel: [ring],
    lawn: [
      poly(f, [[-160, -100], [-160, -7], [-205.5, -7], [-205.5, -115], [-195, -112], [-180, -105]]),
      poly(f, [[-210, -115], [-210, -7], [-236, -7], [-262, -32], [-262, -110]]),
      poly(f, [[-160, 8.6], [-160, 121.5], [-205.5, 121.5], [-205.5, 8.6]]),
      poly(f, [[-210, 8.6], [-210, 121.5], [-259, 121.5], [-261, 40], [-240, 8.6]]),
      // the south square: its walk runs round inside the outer lawn
      rect(f, -275.4, -83.7, -312, -46.3), rect(f, -265.6, -99, -272, -41.5), rect(f, -272, -99, -315.7, -86.6), rect(f, -272, -42.9, -315.7, -34.3),
      poly(f, [[-319.6, -96], [-319.6, -34.3], [-327.3, -34.3], [-361.6, -57.5], [-363, -87.5]]),
      // the north one
      rect(f, -275, 45.5, -312, 86.6), rect(f, -265.6, 35.2, -271.6, 106), rect(f, -271.6, 35.2, -315.7, 42), rect(f, -271.6, 90, -315.7, 96),
      poly(f, [[-319.6, 35.2], [-319.6, 120], [-362, 120], [-353, 72]]),
    ],
  }
}

/* ---------------------------------------------------------------------------------------------------- the Place des Vosges */

/**
 * The SQUARE LOUIS-XIII (aerial, 0.09 m/px, on the model's own frame, bearing 13.8): the limes are not free trees but four L-shaped
 * blocks clipped flat, three rows deep, each row on the register's own surveyed line; so a block is a plan of its own, replacing the
 * register's trees in it and leaving the great chestnuts round the statue theirs. The model has the railing, the fountains and the
 * statue. Its lawns run out under the limes, which the real ones do not; the plan's own are drawn too in case it is ever trimmed.
 */
const vosges = (): GardenPlan[] => {
  const f = frame(48.8556179, 2.3655421, 13.8)
  const block = (name: string, su: 1 | -1, sv: 1 | -1): GardenPlan => {
    const m: Frame = (u, v) => f(su * u, sv * v)
    return {
      name: `Square Louis-XIII: the ${name} limes`,
      ring: poly(m, [[7, 41.5], [41.5, 41.5], [41.5, 12], [57, 12], [57, 57.5], [7, 57.5]]),
      clearMapped: true,
      pleached: [[44.4, 44.4], [49.3, 49.3], [54.2, 54.2]].map(([u, v]) => ({ line: poly(m, [[9, v], [u, v], [u, 13.5]]), y0: 3, h: 5.4, w: 5.6, spacing: 5 })),
    }
  }
  return [
    {
      name: 'Square Louis-XIII',
      ring: rect(f, -57.5, -57.5, 57.5, 57.5),
      gravel: [rect(f, -57.5, -57.5, 57.5, 57.5)],
      lawn: [rect(f, 7, 6.8, 38, 38), rect(f, 7, -38, 38, -6.8), rect(f, -38, 6.8, -7, 38), rect(f, -38, -38, -7, -6.8)],
      topiary: balls([[37.3, -31], [33, -35.2], [37.3, 32.2], [32.7, 36.5], [-30, -35.7], [-34.4, -31.6], [-32.5, 36.4], [-36.7, 32]].map(([u, v]) => f(u, v)), 4, 'cone'),
    },
    block('north-west', 1, -1), block('north-east', 1, 1), block('south-west', -1, -1), block('south-east', -1, 1),
  ]
}

/* ------------------------------------------------------------------------------------------------------- les Invalides */

/** The Invalides on the model's axis, bearing 4; u north to the Seine. The 2024 photograph has the Olympic archery on the Esplanade, so that was read from IGN's 2021 one. */
const INV = frame(48.857, 2.3127, 4)

/**
 * The ESPLANADE: the register has its blocks of limes, so this is the turf down the middle either side of the road and the sand under
 * the blocks, stopping at the kerbs of the two cross streets. Three pairs of panels: the south, whose turf is cut by the round of the
 * Place des Invalides, r 50 about (170, 6); the middle; the north, narrower where it nears the quay.
 */
const esplanade = (): GardenPlan[] => {
  const f = INV
  const west = poly(f, [[171, -115], [243, -114.5], [247, -109], [255, -94], [276, -94], [284, -109], [290, -114.5], [309, -114.5], [313, -112], [317, -57.4], [170, -57.4]])
  const east = poly(f, [[168, 65], [168, 126], [256, 126], [266, 106], [276, 106], [288, 126], [325, 126], [327, 105], [324, 65]])
  const ring = poly(f, [[168, -116], [340, -116], [348, -116], [441, -116], [441, -8], [464, -8], [464, -56], [505, -56], [505, -36], [593, -36], [593, -6.5], [168, -6.5]])
  const ringE = poly(f, [[168, 22], [593, 22], [593, 54], [505, 54], [505, 66], [464, 66], [464, 24], [441, 24], [441, 126], [168, 126]])
  return [
    {
      name: 'Esplanade des Invalides: the west side',
      ring,
      gravel: [west, rect(f, 345, -116, 441, -55)],
      lawn: [
        [...poly(f, [[315, -57.4], [315, -9.6], [214, -9.6]]), ...arc(f, 170, 6, 49.7, -18, -86, 8), ...poly(f, [[170, -57.4]])],
        rect(f, 342, -55, 441, -8), rect(f, 464, -55, 505, -7.3), rect(f, 505, -35.5, 593, -6.5),
      ],
      hedges: [{ line: [f(224, -55.8), f(277, -55.8)], h: 0.8, w: 5.5 }],
    },
    {
      name: 'Esplanade des Invalides: the east side',
      ring: ringE,
      gravel: [east, rect(f, 345, 62, 441, 126)],
      lawn: [
        [...poly(f, [[315, 65], [315, 21.4], [217, 21.4]]), ...arc(f, 170, 6, 49.7, 18, 86, 8), ...poly(f, [[170, 65]])],
        rect(f, 342, 23, 441, 63), rect(f, 464, 23, 505, 64), rect(f, 505, 24, 593, 53),
      ],
    },
  ]
}

/**
 * The FORECOURT's fan (read from the 2021 photograph): sand walks spreading from the gate, turf between them, and along every walk
 * and round the moat the small clipped yews the register has as trees (its survey is where these lines come from). Symmetrical about
 * v = 5.8.
 */
const invalidesFan = (): GardenPlan => {
  const f = INV
  const yews: LL[] = []
  const lawn: LL[][] = []
  for (const s of [1, -1] as const) {
    const m: Frame = (u, v) => f(u, s > 0 ? v : 11.6 - v)
    const walk = (u0: number, v0: number, u1: number, v1: number, step: number) => {
      const n = Math.round(Math.hypot(u1 - u0, v1 - v0) / step)
      for (let k = 0; k <= n; k++) yews.push(m(u0 + ((u1 - u0) * k) / n, v0 + ((v1 - v0) * k) / n))
    }
    walk(100.6, -3.5, 44, -3.5, 5.2)
    walk(95.5, -5.6, 29, -44.1, 4.6)
    walk(99, -18.5, 24.8, -60.7, 5.4)
    walk(96.7, -23.3, 30, -83, 5.4)
    walk(104.3, -28.2, 42, -83, 5.4)
    walk(119, -24.6, 110.5, -76, 5.3)
    walk(109, -82.7, 26, -82.7, 5.2)
    walk(25, -25, 25, -78, 4.6)
    lawn.push(
      poly(m, [[99, -5], [44, -5], [38, -11], [32, -17], [26, -20], [26, -43], [34, -44]]),
      poly(m, [[97, -21], [26, -61.5], [26, -82], [56, -61]]),
      poly(m, [[117, -26], [105, -29], [42, -82], [110, -82]]),
    )
  }
  const ring = rect(f, 24, -84, 121, 95.6)
  return { name: 'Les Invalides: the forecourt', ring, clearMapped: true, gravel: [ring], lawn, topiary: balls(yews, 3.6, 'cone') }
}

/** The DOME's front: the two long round-headed lawns on the sand between OSM's rows of limes, in front of the moat. */
const invalidesDome = (): GardenPlan => {
  const f = INV
  const ring = rect(f, -250, -38, -320, 47)
  const panel = (c: number): LL[] => [...poly(f, [[-308.5, c - 11.2], [-269.5, c - 11.2]]), ...arc(f, -276.6, c, 13.1, -57, 57, 10), ...poly(f, [[-269.5, c + 11.2], [-308.5, c + 11.2]])]
  return { name: 'Les Invalides: the Dome\'s lawns', ring, gravel: [ring], lawn: [panel(-21), panel(27.3)] }
}

/**
 * The JARDIN DE L'INTENDANT (aerial, 0.1 m/px): Bruno's parterre of 1980, four lawns round a basin in bands of clipped box with little
 * yews in them, a quatrefoil at each end of the cross axis. Symmetrical about (0, 25) on bearing 4. The drained basin is left as sand.
 * Its bosquet to the west is OSM's three rings of trees.
 */
const intendant = (): GardenPlan => {
  const f = frame(48.85447, 2.31091, 4)
  const lawn: LL[][] = []
  const hedges: NonNullable<GardenPlan['hedges']> = []
  const yews: LL[] = []
  for (const su of [1, -1] as const) {
    for (const sv of [1, -1] as const) {
      const m: Frame = (u, v) => f(su * u, 25 + sv * v)
      lawn.push(poly(m, [[32.8, 12], [32.8, 30], [25, 38.5], [5, 38.5], [5, 37.2], [11, 36], [18, 30], [21, 26], [23, 11], [28, 11]]))
      const bands: [number, number][][] = [
        [[3, 40], [25, 40], [35, 30.5], [35, 8], [28, 11], [23.5, 11], [21.2, 8]],
        [[21.5, 8], [21.5, 25], [18, 26], [13, 32], [5, 36]],
        [[17, 0.8], [17, 21], [14, 21], [7, 29], [3, 30]],
      ]
      for (const b of bands) {
        hedges.push({ line: poly(m, b), h: 0.45, w: 1.5 })
        for (let i = 1; i < b.length; i++) yews.push(m(b[i][0], b[i][1]))
      }
      hedges.push({ line: arc(m, 29, 0, 6.8, 8, 82), h: 0.45, w: 1.4 }, { line: arc(m, 29, 0, 6.8, 98, 172), h: 0.45, w: 1.4 })
    }
  }
  for (const su of [1, -1]) lawn.push(circle(f, su * 29, 25, 4.8))
  const ring = rect(f, -40, -21, 41, 71)
  return { name: 'Jardin de l\'Intendant', ring, gravel: [ring], lawn, hedges, topiary: balls(yews, 1.5, 'ball') }
}

/** The JARDIN DE L'ABONDANCE, the Invalides' kitchen garden in a court: its three low-hedged squares by the glasshouse (mid works in 2024). */
const abondance = (): GardenPlan => {
  const f = frame(48.8549, 2.313, 4)
  const squares = [rect(f, -32.1, 26.4, -41.8, 37.9), rect(f, -32.1, 41.4, -41.8, 47), rect(f, -46, 41.4, -55, 47)]
  return {
    name: 'Jardin de l\'Abondance',
    ring: rect(f, -30, 24, -57, 49),
    gravel: [rect(f, -30, 24, -57, 49)],
    lawn: squares,
    hedges: squares.map((r) => ({ line: closed(r), h: 0.7, w: 0.5 })),
    topiary: balls(squares.flatMap((r) => r), 1.2),
  }
}

/* --------------------------------------------------------------------------------------------------------- the Musée Rodin */

/**
 * The MUSÉE RODIN, Hôtel de Biron, on its own axis, bearing 10 (aerial, 0.14 m/px). West of the cour d'honneur the parterre of crossed
 * walks with its clipped yew cones, each on the register's own point (the register has them as trees); east the smaller one; south
 * the terrace's low hedges, and the long lawn down to the round basin between the rose beds. OSM's rows either side are the tall
 * clipped hedges, and stay. The wooded park east of it is left to the scatter.
 */
const RODIN = frame(48.8553, 2.3158, 10)
const rodinParterres = (): GardenPlan[] => {
  const f = RODIN
  const west = poly(f, [[46.8, -44.8], [46.8, -13.6], [9.5, -13.6], [9.5, -44.8]])
  const east = poly(f, [[46.8, 17], [46.8, 53.6], [16.3, 53.6], [16.3, 17]])
  const cone = (pts: [number, number][]) => balls(poly(f, pts), 3.4, 'cone')
  return [
    {
      name: 'Musée Rodin: the west parterre',
      ring: west,
      clearMapped: true,
      gravel: [west, rect(f, 24.4, -8, 61, 16)],
      lawn: [
        poly(f, [[41.4, -36.6], [41.4, -17.6], [33.9, -24.4], [33.9, -28.5]]), poly(f, [[42.1, -44.5], [31.2, -31.2], [27.8, -31.9], [17.6, -43.4]]),
        poly(f, [[17, -35.3], [23.7, -29.2], [23.7, -23.1], [17, -17]]), poly(f, [[41.4, -14.7], [31.2, -23.1], [27.1, -23.1], [20.4, -16.6]]),
        poly(f, [[10.2, -42.7], [10.2, -21.7], [1.4, -21.7], [1.4, -41.4]]),
      ],
      topiary: cone([
        [40.3, -42.5], [41.1, -36.5], [41.4, -16], [36.1, -16.3], [35, -30.1], [34.3, -24.2], [32, -21], [31.1, -31.9], [27.8, -32.2], [27.7, -21.3],
        [24.2, -28.9], [24.2, -23.7], [22.9, -16.3], [19.3, -41.5], [18, -36.2], [17.6, -15.3], [11.3, -40.6], [12.1, -32.3], [12.1, -28.5], [12.3, -22.8],
      ]),
    },
    {
      name: 'Musée Rodin: the east parterre',
      ring: east,
      clearMapped: true,
      gravel: [east],
      lawn: [poly(f, [[40.7, 17.4], [35.3, 29.2], [25.1, 29.2], [21.7, 25.8], [21.7, 17.4]]), poly(f, [[28.5, 42.7], [28.5, 52.9], [21.7, 48.8]])],
      topiary: cone([[41.8, 18.7], [45, 21.4], [44.5, 31.5], [36.9, 31.5], [31.9, 30.8], [28.5, 30.8], [23.7, 32.2], [19, 25.4], [20.1, 19], [24.4, 37.3], [24.3, 41.1], [21.3, 51.6], [18.6, 47.5]]),
    },
  ]
}
const rodinSouth = (): GardenPlan => {
  const f = RODIN
  const ring = rect(f, -10, -25, -160, 34.5)
  const roses: LL[][] = []
  for (const s of [1, -1] as const) {
    const m: Frame = (u, v) => f(u, s > 0 ? v : 9 - v)
    roses.push(
      rect(m, -54.5, -11.5, -67.5, -3), rect(m, -69.5, -8, -89.5, -5), rect(m, -91, -8.5, -113, -5), rect(m, -114.5, -8.5, -124, -5.5),
      rect(m, -53, -16, -61.5, -12.5), rect(m, -63.5, -16, -85.5, -13.5), rect(m, -87.5, -15.5, -104, -12), rect(m, -106, -15.5, -121, -10),
    )
  }
  return {
    name: 'Musée Rodin: the south garden',
    ring,
    gravel: [ring],
    lawn: [
      rect(f, -57.5, -1, -120, 10), rect(f, -53, -16.5, -125, -2.8), rect(f, -53, 11.8, -125, 25.5),
      circle(f, -136.2, 4.8, 8.7),
    ],
    beds: beds(roses, true),
    hedges: [
      { line: [f(-20.3, -19.7), f(-20.3, -0.7)], h: 1.1, w: 1.6 }, { line: [f(-20.3, 8), f(-20.3, 29)], h: 1.1, w: 1.6 },
      { line: closed(circle(f, -136.2, 4.8, 10.6)), h: 0.8, w: 0.9 },
    ],
  }
}

/* ------------------------------------------------------------------------------------------- the Marais's hôtels particuliers */

/**
 * The HÔTEL DE SENS's parterre (IGN 2021, its axis at bearing 29; OSM's garden outlines fit the photograph and these are them, tidied):
 * a star of eight clipped beds round a sand crossing, a small clipped square at each corner, inside OSM's hedge.
 */
const hotelDeSens = (): GardenPlan => {
  const f = frame(48.85368, 2.35889, 29)
  const star: LL[][] = []
  const boxes: LL[] = []
  for (const su of [1, -1]) {
    for (const sv of [1, -1]) {
      const m: Frame = (u, v) => f(-18.7 + su * u, -23.2 + sv * v)
      star.push(poly(m, [[12.9, 1.6], [13, 9.5], [10.6, 9.5], [4.4, 3.2], [4.4, 1.6]]), poly(m, [[1.6, 12.9], [9.5, 13], [9.5, 10.6], [3.2, 4.4], [1.6, 4.4]]))
      boxes.push(m(12, 12))
    }
  }
  const c: Frame = (u, v) => f(-18.7 + u, -23.2 + v)
  return {
    name: 'Hôtel de Sens: the parterre',
    ring: rect(c, -18.5, -17.9, 17.8, 18),
    gravel: [rect(c, -14.5, -14.5, 14.5, 14.5)],
    beds: beds(star, true),
    topiary: balls(boxes, 1.4, 'box'),
  }
}

/** The HÔTEL DE SULLY's orangery court (aerial, its four hedges OSM's): sand, and four lawns inside the hedges. */
const hotelDeSully = (): GardenPlan => {
  const f = frame(48.8548, 2.3638, 0)
  const px = (pts: [number, number][]): LL[] => pts.map(([x, y]) => f((700 - y) / 15.56, (x - 700) / 15.56))
  const ring = px([[905, 70], [1240, 130], [1185, 500], [1150, 520], [985, 630], [700, 510], [760, 420], [880, 310], [880, 90]])
  return {
    name: 'Hôtel de Sully: the orangery court',
    ring,
    gravel: [ring],
    lawn: [
      px([[925, 143], [1003, 168], [968, 265], [940, 270], [925, 285], [875, 263]]),
      px([[1092, 187], [1178, 210], [1135, 355], [1080, 335], [1065, 305], [1053, 295]]),
      px([[824, 338], [890, 360], [895, 385], [920, 408], [880, 522], [770, 473]]),
      px([[1048, 418], [1115, 447], [1072, 605], [957, 560], [1000, 443], [1025, 435]]),
    ],
  }
}

/**
 * The ARCHIVES NATIONALES, the Hôtel de Soubise's garden (IGN 2021, bearing 35; the 2024 photograph has it dug up): the broad clipped
 * hedges that run round a horseshoe of sand to the glasshouse, 3 m south of OSM's rows of them, where the photograph has them. The
 * trees to the south are the register's.
 */
const soubise = (): GardenPlan => {
  const f = frame(48.85998, 2.35873, 35)
  const ring = rect(f, -2, -29, 40, 46)
  const wall = (pts: [number, number][]) => ({ line: poly(f, pts), h: 3.2, w: 3.4 })
  return {
    name: 'Jardin des Archives-Nationales: the hedged garden',
    ring,
    gravel: [poly(f, [[37, -23], [37, -5], [24, -2], [8, -8], [8, -23]])],
    hedges: [
      wall([[37.3, -6.8], [34.3, 42.5]]), wall([[3, -7.8], [-0.2, 40]]),
      wall([[25, -25.5], [30.3, -23], [33, -19], [33.2, -10.2], [37.3, -6.8]]), wall([[19, -26.8], [15, -26], [10, -22], [7.5, -17.8], [7.5, -13], [3, -7.8]]),
    ],
  }
}

/** The JARDIN DE L'HÔTEL-LAMOIGNON: its sand and the lawn beside OSM's hedge (2021). The trees are the register's. */
const lamoignon = (): GardenPlan => {
  const f = frame(48.85697, 2.3623, 0)
  const px = (pts: [number, number][]): LL[] => pts.map(([x, y]) => f((700 - y) / 15.56, (x - 700) / 15.56))
  const ring = px([[510, 600], [695, 672], [900, 700], [650, 1225], [295, 1055]])
  return {
    name: 'Jardin de l\'Hôtel-Lamoignon',
    ring,
    gravel: [px([[510, 600], [680, 675], [590, 800], [510, 920], [420, 870]])],
    lawn: [px([[590, 800], [640, 730], [780, 800], [690, 960], [510, 920]])],
  }
}

export const PALACE_GARDENS: GardenPlan[] = [
  luxParterre(), luxSenate(), luxSenateWest(), luxOrangerie(), luxKiosque(), ...luxChestnuts(), luxVerger(), petitLuxembourg(), luxAvenue(),
  tuileriesCarre(), tuileriesCouvert(), tuileriesFerACheval(), carrousel(),
  ...vosges(),
  ...esplanade(), invalidesFan(), invalidesDome(), intendant(), abondance(),
  ...rodinParterres(), rodinSouth(),
  hotelDeSens(), hotelDeSully(), soubise(), lamoignon(),
]
