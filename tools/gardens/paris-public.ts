/**
 * Paris's public formal gardens, traced from IGN's aerial photographs (tools/ortho.ts and its other years, as each plan says).
 * Most are laid out in a `frame` on the garden's own axis, read off the photograph rectified to that axis.
 */
import { circle, closed, frame, rect, type Frame, type GardenPlan, type LL } from './plan.ts'

/** a wall of clipped trees that takes the place of the register's trees it stands on: a plan of its own, the clearing only as big as the wall */
const clippedWall = (name: string, f: Frame, a: number, b: number, v: number, w = 6.5, h = 5.5, y0 = 2.6, spacing = 7.5): GardenPlan => ({
  name,
  ring: rect(f, a - 1, v - w / 2 - 0.5, b + 1, v + w / 2 + 0.5),
  clearMapped: true,
  pleached: [{ line: [f(a, v), f(b, v)], w, h, y0, spacing }],
})

/** a little square, half-width r, round (u, v) */
const square = (f: Frame, u: number, v: number, r: number): LL[] => rect(f, u - r, v - r, u + r, v + r)

/** a ring cut into two halves, so a lawn can have a hole in it that shows the gravel under it */
const annulus = (f: Frame, u: number, v: number, r0: number, r1: number, n = 16): LL[][] => {
  const half = (from: number): LL[] => {
    const arc = (r: number): LL[] => Array.from({ length: n + 1 }, (_, k) => {
      const a = from + (k / n) * Math.PI
      return f(u + Math.cos(a) * r, v + Math.sin(a) * r)
    })
    return [...arc(r1), ...arc(r0).reverse()]
  }
  return [half(0), half(Math.PI)]
}

/**
 * THE CHAMP DE MARS (Formigé's parterres), traced from IGN's Ortho_20cm_D075_2021 and ORTHOPHOTOS2018, rectified to the axis: the
 * summer-2024 photograph has the Olympic stadium on it, and 2021 the Grand Palais Éphémère on the École Militaire's end. Bearing 134.23,
 * u = 0 in the middle of the Place Jacques-Rueff. Eight lawn panels in three groups, 36.6 m wide: a lawn inside a pale strip (12.6 m off
 * the axis, closed at each group's ends and running on across the cross paths), a band of grass outside it carrying yew cones on a
 * regular beat that ignores the panels, then a gravel allée. OSM has the six beds in the first group's bands; the photographs show
 * none in the others. The allées' planes (the register's, at 7.5 m) are clipped into square-ended walls in places and left as trees
 * between: 2018's photograph was taken just after a clipping and draws the walls sharp, with their shadows across the allée. The English
 * gardens either side keep what they have: the rings are the formal strip only.
 */
const champDeMars = (): GardenPlan[] => {
  const f = frame(48.856123, 2.29783, 134.23)
  const W = 18.3, S = 12.6, ALLEE = 24.5, GAP = 0.35
  const group = (name: string, u0: number, u1: number, cross: [number, number][], s0: number, s1: number, cones: [number, number, number]): GardenPlan => {
    const edges = [u0, ...cross.flat(), u1]
    const lawn: LL[][] = []
    for (let i = 0; i < edges.length; i += 2) {
      const [a, b] = [edges[i], edges[i + 1]]
      lawn.push(rect(f, a, -W, b, -S - GAP), rect(f, a, S + GAP, b, W))
      lawn.push(rect(f, Math.max(a, s0 + GAP), -S + GAP, Math.min(b, s1 - GAP), S - GAP))
      if (a < s0) lawn.push(rect(f, a, -S - GAP, s0 - GAP, S + GAP))
      if (b > s1) lawn.push(rect(f, s1 + GAP, -S - GAP, b, S + GAP))
    }
    const topiary: NonNullable<GardenPlan['topiary']> = []
    for (let k = 0; k < cones[2]; k++) for (const v of [-15.5, 15.5]) topiary.push({ at: f(cones[0] + k * cones[1], v), shape: 'cone', h: 5 })
    return { name, ring: rect(f, u0 - 3, -31, u1 + 3, 31), gravel: [rect(f, u0 - 3, -ALLEE, u1 + 3, ALLEE)], lawn, topiary }
  }
  // [from u, to u, which row]: the walls as 2018 has them. Row ±26.5 is the register's nearest the allée, ±35 the one behind it
  const walls: [number, number, number][] = [
    [-193.8, -181.8, 26.5], [-145.8, -133.8, 26.5], [-128, -109, 26.5], [-78.6, -41, 26.5],
    [-259.4, -243.4, -29], [-208, -192, -29], [-175, -158, -29], [-117, -101, -29], [-76, -41, -29],
    [-243, -214, -37], [-210, -192, -37], [-156, -142, -37], [-108, -91, -37], [-63, -41, -37],
    [47, 67, 26.5], [69, 82, 26.5], [88, 101.5, 26.5], [106, 125.5, 26.5], [130, 141, 26.5], [149.5, 162, 26.5], [166, 181, 26.5], [187.7, 211, 26.5], [220.7, 232, 26.5],
    [46.7, 59.5, -29], [60.5, 72.7, -29], [89.5, 106, -29], [149.5, 167.5, -29], [168.5, 189, -29], [192, 205, -29], [219, 232.5, -29],
    [58.7, 79, 33.5], [175.7, 203.5, 33.5],
    [249.5, 274, 27.5], [275, 326, 27.5], [350, 395, 27.5], [396.5, 416, 27.5],
    [251, 265, -29], [279, 287, -29], [364, 387.5, -29], [388.5, 412, -29],
  ]
  return [
    group('Champ de Mars, les parterres du côté de la Tour', -256, -41, [[-183.7, -180.2], [-114.3, -110.6]], -250.6, -46.6, [-254.8, 26.35, 9]),
    group('Champ de Mars, les parterres du milieu', 53.5, 229.3, [[110.8, 114], [167.5, 170.5]], 60.6, 223.3, [55.8, 21.3, 9]),
    { ...group('Champ de Mars, les parterres du côté de l\'École', 253.5, 404, [[316, 318.8], [375.8, 379]], 259.5, 403.5, [255.8, 22.7, 7]),
      // (a low clipped hedge behind the south-west walls)
      hedges: [{ line: [f(266, 33), f(338, 33)], h: 1.8, w: 3 }] },
    ...walls.map(([a, b, v], i) => clippedWall(`Champ de Mars, les platanes taillés ${i + 1}`, f, a, b, v)),
  ]
}

/**
 * THE JARDINS DU TROCADÉRO (Expert, 1937), round the Fontaine de Varsovie, whose model stays as it is: traced from IGN's ORTHOPHOTOS2018
 * (2021 has the works for the Games over the basin), rectified to the basin's axis, bearing 134, u = 0 at the model's centre. Either side
 * of the water a lawn, and the crescent of lawn round its end, the register's stemmed trees on a stone strip along the kerb. Outside the
 * pink road two long terraces of gravel, each with a strip of grass in a low hedge on its road side and a line of cut hedge along its
 * outer wall: OSM has that outer line, and one length of the inner on the south-west. Below the terraces, a band of lawn panels under
 * the big trees with square planters on a 30 m beat, the ones the crowns leave visible.
 */
const trocadero = (): GardenPlan => {
  const f = frame(48.861163, 2.289971, 134)
  const arc = (n = 16): LL[] => Array.from({ length: n + 1 }, (_, k) => {
    const a = -Math.PI / 2 + (k / n) * Math.PI
    return f(45 + Math.cos(a) * 24.5, Math.sin(a) * 24.5)
  })
  const panels: [number, number][] = [[-105, -61], [-57.5, -32], [-28, -2], [2.5, 28], [32.5, 48]]
  const hedge = (a: number, b: number, v: number) => ({ line: [f(a, v), f(b, v)], h: 0.9, w: 0.8 })
  return {
    name: 'Jardins du Trocadéro',
    ring: rect(f, -110, -70, 76, 70),
    gravel: [
      rect(f, -40, -30, 46, -12.5), rect(f, -40, 12.5, 46, 29.5),
      rect(f, -103, -55, 60, -44.5), rect(f, -103, 44, 60, 54),
    ],
    lawn: [
      rect(f, -40, -30, 44, -17), rect(f, -40, 15, 45, 29.5),
      // (the crescent, from the rim of the round pool out to the kerb of the place)
      [...arc(), f(47, 30), f(62, 30), f(71, 18), f(75, 5), f(75, -5), f(71, -18), f(62, -30), f(47, -30)],
      // (the terraces' strips)
      ...[[-100, -59.4], [-53, -25], [-5, 26]].map(([a, b]) => rect(f, a, -48.5, b, -46.5)),
      ...[[-101, -62.5], [-56, -25.6], [-5, 26.3], [32.5, 60]].map(([a, b]) => rect(f, a, 45.2, b, 47.3)),
      // (the panels under the trees)
      ...panels.map(([a, b]) => rect(f, a, -67.5, b, -59.4)),
      ...panels.map(([a, b]) => rect(f, a, 58, b, 67.5)),
    ],
    beds: [[-74, -66], [-44, -66], [-14, -66], [15, -66], [45, -66], [-104, 64.5], [15, 64.7]].map(([u, v]) => ({ ring: rect(f, u - 1.7, v - 1.7, u + 1.7, v + 1.7), rim: true })),
    hedges: [
      ...[[-101, -79], [-77.5, -61], [-52, -16], [-13, 26], [35, 59.4]].map(([a, b]) => hedge(a, b, -46)),
      ...[[-100.6, -92], [-56.3, -16.9], [-13.8, 26.3], [31.9, 61]].map(([a, b]) => hedge(a, b, 44.5)),
    ],
  }
}

/**
 * THE PARC DE BAGATELLE (Ortho_20cm_D075_2021, rectified to each garden's own axis). OSM maps the beds and the French garden's hedge
 * well; what it leaves out is what they stand in. So only that here:
 *
 * The FRENCH GARDEN north of the Trianon (bearing 22.6): the gravel, the lawn in the middle and the oval bed on it. The ORANGERY PARTERRE
 * (bearing 104.7 along the Orangerie's front, u = 0 in the middle of the circle): gravel, the four corner lawns outside the circle, the
 * circle's lawn with its eight little rimmed clipped yews on a 7.4 m ring, and the two pale rings round a dark clump at the centre. The
 * ROSERAIE (bearing 222.4, along its long lawns): the gravel of the whole grid and of the two apses, and the yew cones in the apses' beds
 * and the small round beds. OSM has every bed; it has the long lawns as flowerbeds too, which is its word and not the photograph's.
 * The Trianon's COUR D'HONNEUR: the two lawns in the gravel.
 */
const bagatelle = (): GardenPlan[] => {
  const ff = frame(48.872183, 2.247481, 22.6)
  const oval = Array.from({ length: 20 }, (_, k) => ff(0.2 + Math.cos((k / 20) * Math.PI * 2) * 4.6, 4 + Math.sin((k / 20) * Math.PI * 2) * 2.4))
  const fo = frame(48.868143, 2.245428, 104.7)
  // (a corner lawn: from the spoke round the circle to the outer path, its corner in the (su, sv) quarter)
  const corner = (su: 1 | -1, sv: 1 | -1): LL[] => {
    const arc = Array.from({ length: 11 }, (_, k) => {
      const a = (5 + (k / 10) * 80) * (Math.PI / 180)
      return fo(su * Math.cos(a) * 13.4, sv * Math.sin(a) * 13.4)
    })
    return [...arc, fo(su * 1.1, sv * 16.6), fo(su * 16.2, sv * 16.6), fo(su * 16.2, sv * 1.1)]
  }
  const ring8 = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2
    return { u: 0.2 + Math.cos(a) * 7.4, v: Math.sin(a) * 7.4 }
  })
  const fr = frame(48.8673, 2.2442, 222.4)
  const cones: [number, number][] = [[39.2, -12.5], [46.2, -6], [46.2, 4], [39.5, 11], [-49, -3], [-48.5, 5.5], [-1, -23], [0.5, 23.5]]
  const cour = (lat: number, lon: number): LL[] => { const c = frame(lat, lon, 22.6); return rect(c, -11, -4.3, 11, 4.3) }
  return [
    {
      name: 'Parc de Bagatelle, le jardin français',
      ring: rect(ff, -36, -16, 40, 19),
      gravel: [rect(ff, -34, -14, 34, 17)],
      lawn: [rect(ff, -28.4, -5.3, 28.4, 13.2), rect(ff, -33.8, -11.6, 31, -8.9)],
      beds: [{ ring: oval, rim: true }],
    },
    {
      name: 'Parc de Bagatelle, la cour d\'honneur',
      ring: rect(frame(48.871313, 2.246982, 22.6), -32, -12, 32, 12),
      lawn: [cour(48.871441, 2.247066), cour(48.871185, 2.246898)],
    },
    {
      name: 'Parc de Bagatelle, le parterre de l\'Orangerie',
      ring: rect(fo, -21, -28, 18, 20),
      gravel: [rect(fo, -20.4, -27.5, 17.5, 19)],
      lawn: [
        corner(1, 1), corner(1, -1), corner(-1, 1), corner(-1, -1),
        ...annulus(fo, 0.2, 0, 4.9, 10.4), ...annulus(fo, 0.2, 0, 3.3, 4.2), circle(fo, 0.2, 0, 2.9),
      ],
      beds: ring8.map(({ u, v }) => ({ ring: square(fo, u, v, 1), rim: true })),
      topiary: [...ring8.map(({ u, v }) => ({ at: fo(u, v), shape: 'ball' as const, h: 1.4 })), { at: fo(0.2, 0), shape: 'ball' as const, h: 2.4 }],
    },
    {
      name: 'Parc de Bagatelle, la Roseraie',
      ring: rect(fr, -58, -34, 56, 34),
      gravel: [rect(fr, -37.5, -30, 35.5, 29), circle(fr, -34, 0.5, 22.5, 28), circle(fr, 35, -2, 19.5, 28)],
      topiary: cones.map(([u, v]) => ({ at: fr(u, v), shape: 'cone' as const, h: 5 })),
    },
  ]
}

/**
 * THE JARDINS DES GRANDS-EXPLORATEURS (Marco Polo and Cavelier-de-la-Salle, Davioud's axis from the Luxembourg to the Fontaine de
 * l'Observatoire), traced from ORTHOPHOTOS2018 rectified to the axis, bearing 3, u = 0 at the fountain, whose model keeps its circle.
 * A long lawn in a pale strip with a band of clipped green across each end, between two pairs of tree rows on sand. OSM has the rows'
 * lines and the register has the trees; the photograph shows what they are: mature limes clipped into square-ended blocks nearly 10 m
 * thick, with thin young ones between. The blocks are drawn as walls and the thin lengths stay the register's trees.
 */
const grandsExplorateurs = (): GardenPlan[] => {
  const f = frame(48.8410891, 2.3368145, 3)
  const wall = (i: number, [a, b, v, w]: number[]) => clippedWall(`Jardins des Grands-Explorateurs, le mur de tilleuls ${i + 1}`, f, a, b, v, w, 7, 3, 7)
  const walls = [
    [7.2, 71.3, -12.9, 9.5], [87, 114, -12.9, 9.5], [114, 119.3, -12.9, 8], [133.5, 149.5, -12.9, 9.5],
    [64.5, 76.5, -23, 9], [-10.5, -1.5, -23, 7],
    [7.5, 28.5, 12.2, 9.5], [32.3, 65.3, 12.2, 9.5], [65.3, 88.5, 12.2, 8.5], [93.8, 126, 12.2, 9.5], [143, 149.5, 12.2, 9.5], [-15, -1.5, 12.5, 8.5],
    [-9.8, 9.8, 23, 8.5], [14.3, 28.5, 23, 8.5], [63.7, 69.7, 23, 6], [146.3, 149.5, 23, 8],
    [173, 177, -13.5, 9.5], [180, 191.3, -13.5, 9.5], [212.3, 243, -13.5, 9.5], [272.3, 289.5, -13.5, 9.5], [295.5, 304.5, -13.5, 7], [307.5, 325.5, -13.5, 9.5], [336.8, 344, -13.5, 9.5],
    [237.8, 255, -24.5, 8.5], [269.3, 304.5, -24.5, 9], [313.5, 327.8, -24.5, 8.5], [332.3, 344, -24.5, 8.5],
    [211.5, 225, 10.8, 9.5], [238.5, 290.3, 10.8, 10], [324.8, 344, 10.8, 10],
    [173, 186, 21.3, 8.5], [239.3, 248.3, 21.3, 8], [252, 264, 21.3, 8.5], [286.2, 306, 21.3, 9], [309.8, 344, 21.3, 9],
  ]
  // (the lawn of each garden: outer lawn u0..u1 by v0..v1, the pale strip s0..s1 by t0..t1 just inside it, clipped bands across its ends)
  const lawn = (u0: number, u1: number, v0: number, v1: number, s0: number, s1: number, t0: number, t1: number): LL[][] => [
    rect(f, s0 + 0.3, t0 + 0.3, s1 - 0.3, t1 - 0.3), rect(f, u0, v0, u1, t0 - 0.3), rect(f, u0, t1 + 0.3, u1, v1),
  ]
  const ends = (a: number, b: number, v0: number, v1: number) => ({ line: [f((a + b) / 2, v0), f((a + b) / 2, v1)], w: b - a, h: 0.8 })
  return [
    {
      name: 'Jardin Cavelier-de-la-Salle',
      ring: rect(f, 8, -31, 149.5, 30),
      // (the sand starts past the fountain's model, which stands 12 m either side of u = 0)
      gravel: [rect(f, 13, -30, 149.5, -6.5), rect(f, 13, 8, 149.5, 29), rect(f, 13, -8, 149.5, 8)],
      lawn: [rect(f, 13, -5, 24, 5.3), ...lawn(42, 135, -8, 9.3, 42, 135, -6.5, 5.5)],
      hedges: [ends(24.8, 28.2, -6.5, 8.5), ends(37.5, 42, -8, 9.3), ends(135, 139.5, -8, 9.3)],
    },
    {
      name: 'Jardin Marco-Polo',
      ring: rect(f, 172, -31, 344, 28),
      gravel: [rect(f, 172, -31, 344, 28)],
      lawn: lawn(185.3, 327, -10, 8.5, 185.3, 327, -8, 4.3),
      hedges: [ends(181.5, 185.3, -10, 8.5), ends(327, 331.5, -10, 8.5)],
    },
    ...walls.map((w, i) => wall(i, w)),
  ]
}

/**
 * THE JARDINS DES CHAMPS-ÉLYSÉES (Alphand's): not formal, but kept like a salon: broad raked walks of pale sand and lawn islands in their
 * hoops, under trees the register has. Traced from ORTHOPHOTOS2018, north up, in metres from each garden's middle. The rings stop the
 * scatter; the walks and islands are what the photograph shows. Marigny's round bed is OSM's. Carré Ledoyen, the Carré de la Reine and the
 * Carré du Rond-Point are not done.
 */
const shape = (f: Frame, points: number[][]): LL[] => points.map(([u, v]) => f(u, v))
const champsElysees = (): GardenPlan[] => {
  const a = frame(48.86687, 2.31901, 90)
  const m = frame(48.8689, 2.3128, 90)
  return [
    {
      name: 'Jardin des Ambassadeurs',
      ring: shape(a, [[-145, -95], [-100, -80], [-85, -68], [-55, -60], [-42, -30], [30, -50], [80, -25], [88, -10], [60, 10], [60, 42], [20, 42], [-40, 8], [-110, -15], [-145, -50]]),
      gravel: [shape(a, [[-129, -69], [-98, -60], [-94, -48], [-88, -32], [-52, -36], [-42, -35], [-40, -25], [-20, -15], [-1, -11], [4, -10], [12, -22], [26, -36], [28, -34], [22, -10], [40, -12], [79, -20], [70, -9], [49, 0], [49, 15], [56, 35], [50, 39], [45, 20], [36, 8], [24, 4], [12, 6], [-2, 12], [-5, 8], [4, -2], [-10, -6], [-20, -12], [-32, -12], [-44, -20], [-60, -26], [-70, -34], [-86, -24], [-100, -38], [-118, -52], [-142, -72]])],
      lawn: [circle(a, -76.3, -48.8, 16.3, 28), shape(a, [[-42, -34], [-25, -36], [-12, -30], [-4, -20], [-1, -11], [-20, -15], [-32, -20], [-40, -25]]), shape(a, [[-55, -10], [-44, -19], [-32, -12], [-40, -4], [-52, -2]]), shape(a, [[12, 10], [24, 4], [36, 8], [45, 20], [50, 39], [38, 35], [18, 28]]), shape(a, [[28, -36], [40, -39], [60, -30], [69, -26], [60, -20], [40, -12], [25, -9], [29, -20]]), shape(a, [[49, 0], [70, -9], [69, 10], [55, 29], [49, 15]])],
      beds: [{ ring: rect(a, -83.8, -39, -73.8, -36) }],
    },
    {
      name: 'Carré Marigny',
      ring: shape(m, [[-105, -62], [-40, -92], [20, -60], [20, -30], [40, -5], [50, 5], [40, 18], [0, 22], [-30, -5], [-70, -5], [-105, -35]]),
      gravel: [shape(m, [[-97, -59], [-80, -61], [-66, -59], [-54, -64], [-52, -80], [-47, -85], [-44, -74], [-46, -66], [-48, -54], [-44, -42], [-34, -32], [-22, -30], [-12, -40], [-14, -52], [-18, -68], [-12, -68], [-10, -58], [-12, -46], [-10, -32], [-2, -15], [3, -12], [0, -6], [4, 0], [20, -2], [40, 2], [43, 8], [36, 14], [12, 16], [4, 20], [-4, 20], [-2, 8], [-4, 2], [-16, -8], [-28, -20], [-40, -24], [-54, -20], [-64, -14], [-76, -20], [-76, -28], [-70, -40], [-82, -40], [-90, -36], [-100, -46], [-104, -52]])],
      lawn: [circle(m, -95.2, -43, 7.5), circle(m, 11, -7.5, 8), shape(m, [[-10, -48], [-2, -54], [8, -56], [6, -36], [5, -20], [0, -14], [-6, -20], [-11, -34]]), shape(m, [[-16, -2], [-8, -2], [-3, 8], [-4, 18], [-12, 18], [-18, 8]]), shape(m, [[-42, -74], [-32, -78], [-20, -68], [-16, -62], [-22, -64], [-40, -66]])],
    },
  ]
}

/**
 * The JARDIN ALBERT-KAHN (Boulogne; IGN's current orthophoto, bearing 110.7 along the palm house's garden). The French garden east
 * of the rest, before the palm house: gravel, the lawn, and the purple L-shaped beds at its corners. West of it the rose garden and
 * the orchard: two groups of four panels, each a lawn or a rose bed inside a clipped edging, round a small round court with its clipped
 * shrubs, between the long gravel allées. The panels' notched corners are square here. The bedding is massed, as the photograph has it.
 * The Japanese garden and the forest are not touched: the ring is the French garden and the panels only.
 */
const albertKahn = (): GardenPlan => {
  const f = frame(48.842068, 2.227497, 110.7)
  const panels: [number, number, number, number, 'lawn' | 'bed'][] = [
    [-44.2, -6.6, -35.4, 5.5, 'lawn'], [-30.7, -8, -21.7, 3.9, 'lawn'], [-42.9, 10.5, -33.6, 21.7, 'lawn'], [-29.4, 9, -20.4, 20.8, 'lawn'],
    [-12, -9.4, -2.8, 2.4, 'bed'], [2.2, -8.9, 10.7, -0.4, 'bed'], [-10.9, 8.2, -1, 19, 'bed'],
  ]
  const round = (u: number, v: number, r: number, n: number) => Array.from({ length: n }, (_, k) => ({
    at: f(u + Math.cos((k / n) * Math.PI * 2) * r, v + Math.sin((k / n) * Math.PI * 2) * r), shape: 'ball' as const, h: 1.8,
  }))
  return {
    name: 'Jardin Albert-Kahn',
    ring: rect(f, -51, -13, 44, 26),
    gravel: [rect(f, -49, -13, 12.5, 25), rect(f, 12.5, -10.7, 40.4, 10.9)],
    lawn: [rect(f, 20.4, -4, 37.9, 8.4), ...panels.filter((p) => p[4] === 'lawn').map(([a, b, c, d]) => rect(f, a, b, c, d))],
    beds: [
      ...panels.filter((p) => p[4] === 'bed').map(([a, b, c, d]) => ({ ring: rect(f, a, b, c, d) })),
      ...[[15.4, -6.4, 18.8, 1], [18.8, -6.4, 22.9, -4.4], [34.4, -8.5, 38.8, -6], [38.8, -8.5, 41, -1], [16.5, 5.2, 19.7, 11], [39.5, 3.5, 41, 8.2]].map(([a, b, c, d]) => ({ ring: rect(f, a, b, c, d) })),
    ],
    hedges: panels.map(([a, b, c, d]) => ({ line: closed(rect(f, a - 1.5, b - 1.5, c + 1.5, d + 1.5)), h: 0.7, w: 0.9 })),
    topiary: [...round(-32.5, 6.6, 3.6, 8), ...round(-0.1, 3.25, 4.5, 8)],
    rows: [[-29, -5], [-29, -1.5], [-29, 2], [-28, 12], [-28, 15.5], [-28, 19]].map(([u, v]) => ({ line: [f(u, v), f(u + 6, v)], spacing: 3, h: 5 })),
  }
}

/**
 * The JARDIN DES SERRES D'AUTEUIL (Formigé, 1898; ORTHOPHOTOS2018, north up, u = 0 on the axis): the long lawn between the glasshouses, in
 * its pale strip with an apse at the south end and the bands of grass that carry OSM's beds; the broad raked court of the hemicycle
 * north of it, with the oval bed of the fountain in the middle of it and the two lawns of the hemicycle. The glasshouses' hedges are OSM's.
 */
const serresAuteuil = (): GardenPlan => {
  const f = frame(48.8469, 2.2522, 90)
  return {
    name: 'Jardin des serres d\'Auteuil',
    ring: rect(f, -50, -80, 50, 42),
    gravel: [
      shape(f, [[-10.0, -27.2], [11.8, -27.2], [9.8, 28.8], [3.5, 34.0], [-4.0, 34.0], [-10.5, 28.8]]),
      shape(f, [[-17.5, -59.0], [-10.0, -68.0], [15.5, -68.0], [23.0, -57.5], [21.5, -47.0], [15.5, -39.5], [-10.0, -39.5], [-19.0, -47.0]]),
    ],
    lawn: [
      shape(f, [[-7.0, -25.2], [10.0, -25.2], [8.0, 28.0], [2.8, 31.8], [-3.2, 31.8], [-8.5, 28.0]]),
      shape(f, [[-12.1, -17.0], [-10.0, -17.0], [-10.6, 29.5], [-12.6, 29.5]]),
      shape(f, [[11.9, -24.5], [14.0, -24.5], [12.0, 29.5], [10.0, 29.5]]),
      shape(f, [[-46.0, -50.0], [-43.8, -59.0], [-37.0, -65.8], [-23.5, -69.5], [-19.0, -63.5], [-19.0, -56.0], [-24.2, -45.5], [-46.0, -45.5]]),
      shape(f, [[23.0, -65.0], [30.5, -68.0], [42.5, -65.0], [53.0, -54.5], [53.8, -42.5], [29.0, -42.5], [24.5, -48.5], [23.8, -57.5]]),
    ],
    beds: [{ ring: Array.from({ length: 20 }, (_, k) => f(2.75 + Math.cos((k / 20) * Math.PI * 2) * 12.5, -50 + Math.sin((k / 20) * Math.PI * 2) * 5.3)), rim: true }],
  }
}

/**
 * The JARDIN DE LA COUR D'HONNEUR (Balard's parade court; ORTHOPHOTOS2018, bearing 137.6). OSM has every panel's hedge and the clipped rows;
 * what is inside the hedges is here: four lawns of a pale raked court, the two big ones each in a tan margin round their clumps of trees,
 * the four small ones with bands of clipped box in a rectangle of little balls, as the photograph shows them.
 */
const courDHonneur = (): GardenPlan => {
  const f = frame(48.829008, 2.277411, 137.6)
  const small: [number, number, number, number][] = [[-49.6, -32.5, -32.7, -11], [21.6, -32.5, 38.5, -11], [-49.3, 3.7, -32.7, 25], [22.1, 3.7, 38.7, 25]]
  const big: [number, number, number, number][] = [[-28.5, -32.5, 17.3, -11.5], [-28, 3.7, 17.7, 25]]
  const balls: NonNullable<GardenPlan['topiary']> = []
  for (const [a, b, c, d] of small) {
    const [p, q, r, t] = [a + 3, b + 3.3, c - 3, d - 3.3]
    for (let k = 0; k <= 8; k++) for (const v of [q, t]) balls.push({ at: f(p + ((r - p) * k) / 8, v), shape: 'ball', h: 0.8 })
    for (let k = 1; k < 8; k++) for (const u of [p, r]) balls.push({ at: f(u, q + ((t - q) * k) / 8), shape: 'ball', h: 0.8 })
  }
  return {
    name: 'Jardin de la Cour d\'Honneur',
    ring: rect(f, -55, -34, 44, 26.5),
    gravel: [rect(f, -54.5, -33.5, 43, -10), rect(f, -54.5, 2.5, 43, 26)],
    lawn: [...small.map(([a, b, c, d]) => rect(f, a, b, c, d)), ...big.map(([a, b, c, d]) => rect(f, a + 1.5, b + 1.5, c - 1.5, d - 1.5))],
    // (the box in three clipped bands across the little rectangle)
    hedges: small.flatMap(([a, b, c, d]) => [0.2, 0.5, 0.8].map((t) => ({ line: [f(a + 4.5, b + 5 + (d - b - 10) * t), f(c - 4.5, b + 5 + (d - b - 10) * t)], h: 0.6, w: 1.8 }))),
    topiary: balls,
  }
}

/**
 * The JARDIN CATHERINE-LABOURÉ (the old convent's kitchen garden; Ortho_20cm_D075_2021, north up, in metres from its middle). Four
 * quarters of grass under the register's orchard trees on two crossing gravel allées, a court at the north end, and two rows of the
 * vegetable plots in the north-east quarter. The pergola on the north wall is hidden by its own planting and is left out.
 */
const catherineLaboure = (): GardenPlan => {
  const f = frame(48.85112, 2.32053, 90)
  return {
    name: 'Jardin Catherine-Labouré',
    ring: shape(f, [[-28.0, -38.0], [16.0, -39.0], [35.0, -22.0], [35.0, 34.0], [10.0, 45.0], [-22.0, 33.0], [-27.0, 10.0]]),
    gravel: [
      shape(f, [[1.0, -21.0], [4.5, -21.0], [10.5, 44.0], [8.0, 44.0]]), shape(f, [[-24.5, 8.5], [33.0, -4.0], [34.5, -1.5], [-23.0, 11.2]]),
      shape(f, [[-1.5, -37.5], [15.0, -37.5], [15.0, -27.0], [4.0, -20.0], [1.0, -21.0]]),
    ],
    lawn: [
      shape(f, [[-27.0, -14.0], [0.0, -20.0], [2.5, -1.0], [-25.0, 7.0]]), shape(f, [[5.5, -21.0], [31.0, -23.0], [33.0, -6.0], [8.0, 0.0]]),
      shape(f, [[7.0, 7.0], [25.0, 0.0], [31.5, 11.0], [33.0, 33.0], [10.0, 37.0]]), shape(f, [[-23.0, 12.0], [4.0, 6.0], [6.5, 30.0], [-20.0, 30.0]]),
    ],
    beds: [{ ring: shape(f, [[9.0, -14.0], [18.0, -15.5], [18.5, -12.5], [9.5, -10.8]]) }, { ring: shape(f, [[21.0, -16.5], [30.5, -17.5], [30.8, -14.0], [21.5, -13.2]]) }],
  }
}

/**
 * The SQUARE JEAN-XXIII behind Notre-Dame (ORTHOPHOTOS2018, bearing 113.5 along its rows): the octagonal lawn round the Fontaine de la
 * Vierge in its raked court, and the long lawn by the river. OSM has the rows; the photograph has them clipped into walls, which a tree_row
 * cannot say, so they stay OSM's.
 */
const jeanXXIII = (): GardenPlan => {
  const f = frame(48.852566, 2.35138, 113.5)
  const [a, b, c] = [17.6, 9, 3.5]
  return {
    name: 'Square Jean-XXIII',
    ring: rect(f, -32, -21, 34, 62),
    gravel: [rect(f, -25, -12.5, 33, 9.5)],
    lawn: [
      shape(f, [[-a, -b + c - 0.6], [-a + c, -b - 0.6], [a - c, -b - 0.6], [a, -b + c - 0.6], [a, b - c - 0.6], [a - c, b - 0.6], [-a + c, b - 0.6], [-a, b - c - 0.6]]),
      rect(f, -12, 54, 18, 61),
    ],
  }
}

/**
 * The JARDIN MÉDIÉVAL behind Cluny, in the corner of the square where the trees let the 2018 photograph see it (ORTHOPHOTOS2018, bearing
 * 22.9): a walled rectangle of 28 × 21 m with a walk round it, the plots of the medicinal garden in a grid to the south and the
 * thousand-flowers meadow to the north. The plots are as many as can be counted, about the size they are; their planting is not known.
 */
const cluny = (): GardenPlan => {
  const f = frame(48.85077, 2.344328, 22.9)
  const plots: number[][] = []
  for (const u of [-12, -6.5]) for (const v of [-8, -2.7, 2.6]) plots.push([u, v, u + 4.6, v + 4.6])
  return {
    name: 'Jardin médiéval de Cluny',
    ring: rect(f, -14.5, -11, 14.5, 11.5),
    gravel: [rect(f, -14, -10.5, 14, 11)],
    beds: [...plots, [1, -6.5, 12, 0.5], [1, 1.5, 12, 8.5]].map(([a, b, c, d]) => ({ ring: rect(f, a, b, c, d), rim: true })),
    hedges: [{ line: closed(rect(f, -14, -10.5, 14, 11)), h: 1, w: 0.6 }],
  }
}

/**
 * The AUTEUIL course (owner, 2026-10-30: "there's a wide grass track for the hippodrome, and then two rugby fields in the middle. we show grass and
 * trees only"): OSM's outline of the course, way/13792244, simplified. It only stops the scatter: the copses in the middle are mapped
 * trees and stay, and what lies on the grass is render/landmarks/paris/minor/auteuil.ts.
 */
const auteuil = (): GardenPlan => ({
  ringOnly: true,
  name: "Hippodrome d'Auteuil",
  ring: [[48.855023, 2.257061], [48.854468, 2.256989], [48.85427, 2.256766], [48.854221, 2.256526], [48.854267, 2.256058], [48.854444, 2.255744], [48.854573, 2.255633], [48.854617, 2.255518], [48.854605, 2.255432], [48.854553, 2.255331], [48.854236, 2.254851], [48.854196, 2.254808], [48.85403, 2.254552], [48.853935, 2.254362], [48.85394, 2.254159], [48.85391, 2.253943], [48.853889, 2.253748], [48.853771, 2.253659], [48.853077, 2.253902], [48.852773, 2.254142], [48.852689, 2.25428], [48.852407, 2.254401], [48.852301, 2.254335], [48.852125, 2.254246], [48.851194, 2.253421], [48.850333, 2.252985], [48.850153, 2.253036], [48.849541, 2.253298], [48.849328, 2.253511], [48.848811, 2.254275], [48.84846, 2.255432], [48.848383, 2.255925], [48.848455, 2.256491], [48.84853, 2.256897], [48.848752, 2.25734], [48.84905, 2.257597], [48.851257, 2.258865], [48.856351, 2.262127], [48.857027, 2.262053], [48.857352, 2.261933], [48.857413, 2.261866], [48.857637, 2.261551], [48.857883, 2.261185], [48.857963, 2.261118], [48.857991, 2.261025], [48.857997, 2.260783], [48.858067, 2.260349], [48.85808, 2.260153], [48.858052, 2.259842], [48.857907, 2.259457], [48.85766, 2.259031], [48.857385, 2.258714], [48.856824, 2.258304], [48.855419, 2.257374]],
})

export const PUBLIC_GARDENS: GardenPlan[] = [auteuil(), ...champDeMars(), trocadero(), ...bagatelle(), ...grandsExplorateurs(), ...champsElysees(), albertKahn(), serresAuteuil(), courDHonneur(), catherineLaboure(), jeanXXIII(), cluny()]
