/**
 * civic-1: thirteen civic buildings (docs/sf-batches/civic-1.md) — churches, a theatre, a museum, schools, a fire
 * station, a monastery. Mostly recipes from ../recipes.ts with the colours and crown taken from a photograph;
 * the shared parts (../../parts.ts) for the corner towers, colonnades and cupolas that make these recognisable.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { prism, strut } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { faceBand, insetRing, tower, towerRing } from '../../tower.ts'
import { boxAlong, colonnade, edgeAt, edgeFacing, roundRing, signText, spireOn } from '../../parts.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { church } from '../../church.ts'

const CREAM: [number, number, number] = [0.86, 0.82, 0.72]
const WHITE: [number, number, number] = [0.9, 0.89, 0.86]

export const CIVIC_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * Saint Mary's Chinese Mission (925 Stockton St, height 15 m from OSM): a cream Classical Revival box, a
   * pedimented portico over the entrance, paired windows, a low hip roof.
   */
  saintMarysChineseMission: (out: MeshBuilder, fit: Fit): void => {
    fromRecipe('edwardian-terracotta', { height: 15, base: 3, wall: CREAM, baseWall: [0.55, 0.5, 0.42], crown: { kind: 'hip', height: 3, inset: 0.6, colour: [0.4, 0.32, 0.26], material: 'tile' } })(out, fit)
    const ring = towerRing(fit)
    const e = edgeAt(ring, edgeFacing(ring, 0))
    colonnade(out, e.a, e.b, 0, 3.6, 4, { colour: CREAM })
  },

  /**
   * Mount Zion Baptist Church (1321 Oak St at Baker, built 1906): a modest wood-frame neighbourhood church,
   * one tall nave under a gable, a small square bell tower with a short spire beside the entrance.
   */
  mountZionBaptistChurch: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 10,
      base: { height: 1.2, face: { kind: 'blank', wall: [0.62, 0.56, 0.5], material: 'clapboard' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.7, 0.64, 0.58], glass: [0.2, 0.22, 0.24], pitch: 3.6, solid: 0.6, floor: 8.8, arched: true, material: 'clapboard' } }],
      roof: [0.35, 0.3, 0.26],
      crown: { kind: 'parapet', height: 0.5, colour: [0.7, 0.64, 0.58], material: 'clapboard' },
    })
    const ring = towerRing(fit)
    const e = edgeAt(ring, edgeFacing(ring, 0))
    spireOn(out, { x: e.mid.x - e.tx * e.L * 0.3, z: e.mid.z - e.tz * e.L * 0.3 }, 10, 1, 2.4, 3.2,
      { colour: [0.7, 0.64, 0.58], spireColour: [0.35, 0.3, 0.26], material: 'clapboard', spireMaterial: 'tile' })
  },

  /** Edwin and Anita Lee Newcomer School (657 Merchant St): an ordinary 4-storey stone-faced school block. */
  newcomerSchool: fromRecipe('edwardian-terracotta', { height: 14, base: 3.6, wall: [0.86, 0.85, 0.82], baseWall: [0.4, 0.38, 0.36], material: 'ashlar' }),

  /** City College Chinatown Annex (628 Washington St, 4-storey annex beside the Colombo Building): a plain brick block. */
  ccsfChinatownAnnex: fromRecipe('brick-loft', { height: 14, base: 4, wall: [0.6, 0.42, 0.34] }),

  /**
   * San Francisco Fire Station 35, the Fireboat House at Pier 22½ (1915, Alfred A. Pyle): a two-storey white
   * stucco Mission/Renaissance Revival building with round-arched openings and a red tile hip roof, right on
   * the water under the Bay Bridge approach.
   */
  fireStation35: fromRecipe('edwardian-terracotta', {
    height: 8, base: 0, wall: WHITE, glass: [0.16, 0.18, 0.2], pitch: 3.2, floor: 3.6, solid: 0.6,
    material: 'stucco', crown: { kind: 'hip', height: 2.4, inset: 0.4, colour: [0.55, 0.26, 0.2], material: 'tile' },
  }),

  /**
   * Notre Dame des Victoires (566 Bush St, 1915, Louis Brochoud; French Romanesque after Notre-Dame de Fourvière in
   * Lyon): a buff brick and terracotta front on Bush, the stained-glass central bay between two cross-topped
   * masonry towers, twin stairs up to the porch (Wikipedia, noehill SF Landmark #173). Rebuilt with the church kit
   * 2026-10-04 (BUGFIX #315): the first pass was a 10 m ochre ring with one corner campanile, and on Bush's slope
   * its roof stood level with the street — the kit's hillside plinth (#314) now stands it on its basement.
   */
  notreDameDesVictoires: (out: MeshBuilder, fit: Fit): void => {
    church(out, fit, {
      nave: { bays: 6, storeys: 1, roof: 'gable', pitch: 'low' },
      aisles: null,
      transept: null,
      chancel: { kind: 'apse' },
      tower: { at: 'twin', stages: 3, plan: 'square', top: 'parapet' },
      front: { kind: 'gable', portal: 'porch', window: 'wheel', steps: 5 },
      walls: { material: 'sandstone', openings: 'round', buttresses: 'none' },
    })
  },

  /**
   * National Maritime Museum (Aquatic Park Bathhouse, 1939, William Mooser Jr., Streamline Moderne): a white
   * ship-shaped building with a curved prow, porthole windows, deck-rail parapets and a mast group on the
   * rounded pilot-house roof.
   */
  nationalMaritimeMuseum: (out: MeshBuilder, fit: Fit): void => {
    /*
     * The Aquatic Park Bathhouse (1939), rebuilt 2026-10-17 from the owner's Street View of the Beach Street front
     * ("it has porthole windows, railings around the deck, an actual mast on top... more reminiscent of a boat than our
     * version while still clearly not being a boat"). The 2026-09-22 pass ran ribbon windows round every storey, and a
     * stack of white rings banded in dark glass read as a parking garage. The real hull is SOLID white wall: tall narrow
     * windows between fluted piers, portholes, louvred vents; the entrance a stepped frame of green slate under a
     * carved canopy; a pipe rail round the deck with ship's ventilator cowls on it; a set-back deck house with curved
     * glass at its rounded ends, a drum on top, and a mast with yards.
     */
    const ring = roundRing(towerRing(fit), 7.0, 8)
    const deck = insetRing(ring, 3.4)
    const HULL = 8.2, HOUSE = 11.8
    const rail: [number, number, number] = [0.72, 0.73, 0.74]
    const slate: [number, number, number] = [0.38, 0.47, 0.44]
    const glass: [number, number, number] = [0.13, 0.16, 0.19]
    const metal = surfaceTag('metal')
    // the hull: a grey plinth and solid white walls
    faceBand(out, ring, 0, 0.6, { kind: 'blank', wall: [0.62, 0.62, 0.6], material: 'concrete' })
    faceBand(out, ring, 0.6, HULL, { kind: 'blank', wall: WHITE, material: 'stucco' })
    capPolygon(out, ring, HULL, [0.78, 0.77, 0.74], 0)
    // (the entrance is on Beach Street, the bay at the back: the face looking along +z in this frame)
    const front = edgeFacing(ring, 0)
    // a porthole: a dark glass disc in a white rim, standing just off the wall
    const porthole = (x: number, y: number, z: number, nx: number, nz: number, r: number): void => {
      const tx = -nz, tz = nx, N = 14
      const at = (k: number, rr: number, off: number): [number, number, number] => {
        const a = (k / N) * Math.PI * 2
        return [x + tx * Math.cos(a) * rr + nx * off, y + Math.sin(a) * rr, z + tz * Math.cos(a) * rr + nz * off]
      }
      for (let k = 0; k < N; k++) {
        out.quad([[x + nx * 0.06, y, z + nz * 0.06], [x + nx * 0.06, y, z + nz * 0.06], at(k + 1, r, 0.06), at(k, r, 0.06)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, 0)
        out.quad([at(k, r, 0.1), at(k + 1, r, 0.1), at(k + 1, r + 0.16, 0.1), at(k, r + 0.16, 0.1)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.93, 0.92, 0.89], 0)
      }
    }
    const bay = edgeFacing(ring)
    for (let i = 0; i < ring.length; i++) {
      const e = edgeAt(ring, i)
      if (e.L < 10 || i === bay) continue
      // the entrance takes the middle 12 m of the front
      const skip = i === front ? [e.L / 2 - 7, e.L / 2 + 7] : [Infinity, -Infinity]
      const n = Math.floor((e.L - 2) / 3.2)
      for (let k = 0; k < n; k++) {
        const s = 1 + (e.L - 2) * ((k + 0.5) / n)
        if (s > skip[0] && s < skip[1]) continue
        const x = e.a.x + e.tx * s, z = e.a.z + e.tz * s
        if (k % 5 < 3) {
          // a tall narrow window and the fluted pier beside it, its three speed-line grooves at the head
          boxAlong(out, x + e.nx * 0.02, 4.2, z + e.nz * 0.02, 0.5, 2.4, 0.06, e.heading, [0.27, 0.34, 0.38], 0)
          for (let g = 0; g < 5; g++) boxAlong(out, x + e.nx * 0.06, 2.2 + g * 1.0, z + e.nz * 0.06, 0.5, 0.035, 0.03, e.heading, [0.85, 0.85, 0.83], 0)
          for (let g = 0; g < 3; g++) boxAlong(out, x + e.tx * 1.15 + e.nx * 0.05, 6.1 + g * 0.3, z + e.tz * 1.15 + e.nz * 0.05, 0.45, 0.05, 0.05, e.heading, [0.8, 0.79, 0.76], 0)
          boxAlong(out, x + e.tx * 1.15 + e.nx * 0.12, 3.6, z + e.tz * 1.15 + e.nz * 0.12, 0.32, 3.0, 0.12, e.heading, WHITE, 0)
        } else {
          porthole(x, 4.0, z, e.nx, e.nz, 0.62)
          // and a louvred vent above it
          for (let g = 0; g < 4; g++) boxAlong(out, x + e.nx * 0.04, 6.4 + g * 0.16, z + e.nz * 0.04, 0.6, 0.035, 0.06, e.heading, [0.3, 0.31, 0.32], 0)
        }
      }
    }
    // the entrance: a stepped frame of green slate, glass doors, a carved canopy band, steps up from the pavement
    {
      const e = edgeAt(ring, front)
      const cx = e.mid.x, cz = e.mid.z
      const P = (along: number, out_: number): [number, number] => [cx + e.tx * along + e.nx * out_, cz + e.tz * along + e.nz * out_]
      for (const side of [-1, 1]) {
        for (let st = 0; st < 3; st++) {
          const [x, z] = P(side * (4.2 + st * 0.9), 0.35)
          boxAlong(out, x, (4.6 - st * 1.3) / 2, z, 0.45, (4.6 - st * 1.3) / 2, 0.35, e.heading, slate, 0)
        }
      }
      let [x, z] = P(0, 0.1)
      boxAlong(out, x, 2.4, z, 3.6, 2.4, 0.08, e.heading, glass, 0)
      for (const d of [-2.4, -0.8, 0.8, 2.4]) { [x, z] = P(d, 0.2); boxAlong(out, x, 2.4, z, 0.06, 2.4, 0.06, e.heading, [0.55, 0.56, 0.57], metal) }
      ;[x, z] = P(0, 0.55)
      boxAlong(out, x, 5.7, z, 7.2, 0.95, 0.55, e.heading, slate, 0)
      // the canopy's carved sea creatures, as lighter scrolls along its face
      for (let k = -6; k <= 6; k++) { [x, z] = P(k * 1.05, 1.12); boxAlong(out, x, 5.7 + (k % 2 ? 0.25 : -0.25), z, 0.35, 0.12, 0.03, e.heading, [0.52, 0.6, 0.57], 0) }
      for (let st = 0; st < 3; st++) { [x, z] = P(0, 1.2 + st * 0.45); boxAlong(out, x, 0.27 - st * 0.09, z, 4.2, 0.27 - st * 0.09, 0.23, e.heading, [0.74, 0.73, 0.7], 0) }
    }
    /*
     * The BAY FACE (owner's photo from the beach, 2026-10-17): a ground floor of white-framed windows over a pale green
     * base, with doors; above it a LOGGIA — deep open bays between square piers, balcony rails across them, lamps hung
     * from their ceilings and Hilaire Hiler's green-and-white sea murals on the back walls; MARITIME MUSEUM over it; and at
     * the east end a plain wall with one tall gridded window.
     */
    {
      const e = edgeAt(ring, bay)
      const P = (along: number, out_: number): [number, number] => [e.a.x + e.tx * along + e.nx * out_, e.a.z + e.tz * along + e.nz * out_]
      const L = e.L
      // the ground floor: pale green base, a row of white-framed windows, doors every fifth
      let [x, z] = P(L / 2, 0.04)
      boxAlong(out, x, 1.0, z, L / 2 - 1, 0.4, 0.04, e.heading, [0.62, 0.72, 0.66], 0)
      for (let s = 2; s < L - 2; s += 1.5) {
        const door = Math.round(s / 1.5) % 5 === 0
        ;[x, z] = P(s, 0.05)
        boxAlong(out, x, door ? 1.65 : 2.45, z, 0.6, door ? 1.05 : 0.8, 0.04, e.heading, door ? [0.12, 0.16, 0.3] : [0.34, 0.42, 0.46], 0)
        ;[x, z] = P(s + 0.72, 0.08)
        boxAlong(out, x, 2.0, z, 0.07, 1.4, 0.05, e.heading, WHITE, 0)
      }
      // the loggia over the middle three-fifths
      const l0 = L * 0.2, l1 = L * 0.8, nb = Math.max(4, Math.round((l1 - l0) / 5))
      const bw = (l1 - l0) / nb
      const MURAL: [number, number, number][] = [[0.2, 0.55, 0.38], [0.88, 0.9, 0.86], [0.12, 0.42, 0.32], [0.55, 0.78, 0.6]]
      ;[x, z] = P((l0 + l1) / 2, 0.03)
      boxAlong(out, x, 5.9, z, (l1 - l0) / 2, 1.5, 0.03, e.heading, [0.3, 0.42, 0.38], 0)
      for (let b = 0; b < nb; b++) {
        const c = l0 + (b + 0.5) * bw
        // the mural on the back wall: bold bands and a fin, in the murals' greens and whites
        for (let k = 0; k < 4; k++) {
          ;[x, z] = P(c - bw * 0.3 + k * bw * 0.2, 0.06)
          boxAlong(out, x, 5.4 + ((k + b) % 3) * 0.45, z, bw * 0.09, 0.9 - ((k + b) % 2) * 0.3, 0.02, e.heading, MURAL[(k + b) % 4], 0)
        }
        // the lamp hung from the bay's ceiling
        ;[x, z] = P(c, 1.1)
        boxAlong(out, x, 7.0, z, 0.02, 0.3, 0.02, e.heading, [0.2, 0.2, 0.2], metal)
        boxAlong(out, x, 6.65, z, 0.28, 0.08, 0.28, e.heading, [0.25, 0.3, 0.28], 0)
        // the balcony rail across the bay's mouth
        const [a0x, a0z] = P(c - bw / 2 + 0.4, 2.0), [a1x, a1z] = P(c + bw / 2 - 0.4, 2.0)
        for (const h of [4.9, 5.35, 5.8]) strut(out, [a0x, h, a0z], [a1x, h, a1z], 0.04, 0.04, rail, metal, false)
      }
      // the piers between the bays and the loggia's floor and ceiling slabs, standing 2 m out from the back wall
      for (let b = 0; b <= nb; b++) { ;[x, z] = P(l0 + b * bw, 1.0); boxAlong(out, x, 6.1, z, 0.35, 1.7, 1.0, e.heading, WHITE, 0) }
      ;[x, z] = P((l0 + l1) / 2, 1.0)
      boxAlong(out, x, 4.45, z, (l1 - l0) / 2 + 0.35, 0.15, 1.0, e.heading, WHITE, 0)
      boxAlong(out, x, 7.65, z, (l1 - l0) / 2 + 0.35, 0.25, 1.0, e.heading, WHITE, 0)
      ;[x, z] = P((l0 + l1) / 2, 2.02)
      signText(out, 'MARITIME MUSEUM', x, 8.05, z, 0.5, [0.55, 0.57, 0.6], { heading: e.heading })
      // the tall gridded window in the plain wall toward the east end
      ;[x, z] = P(L * 0.9, 0.05)
      boxAlong(out, x, 5.9, z, 1.4, 1.6, 0.04, e.heading, [0.27, 0.4, 0.44], 0)
      for (let g = 0; g < 5; g++) boxAlong(out, x, 4.4 + g * 0.75, z, 1.4, 0.04, 0.07, e.heading, WHITE, 0)
    }
    // a pipe rail round a deck: posts every 2.4 m and three rails
    const pipeRail = (r: { x: number; z: number }[], y: number): void => {
      const inner = insetRing(r, 0.25)
      for (let i = 0; i < inner.length; i++) {
        const a = inner[i], b = inner[(i + 1) % inner.length]
        for (const h of [0.35, 0.7, 1.05]) strut(out, [a.x, y + h, a.z], [b.x, y + h, b.z], 0.05, 0.05, rail, metal, false)
        const L = Math.hypot(b.x - a.x, b.z - a.z)
        for (let s = 0; s < L; s += 2.4) {
          const t = s / L
          strut(out, [a.x + (b.x - a.x) * t, y, a.z + (b.z - a.z) * t], [a.x + (b.x - a.x) * t, y + 1.08, a.z + (b.z - a.z) * t], 0.05, 0.05, rail, metal, false)
        }
      }
    }
    pipeRail(ring, HULL)
    // the deck house: solid white with louvres along its sides, curved glass round its rounded ends
    const ends: number[] = [], sides: number[] = []
    for (let i = 0; i < deck.length; i++) (edgeAt(deck, i).L < 6 ? ends : sides).push(i)
    faceBand(out, deck, HULL, HOUSE, { kind: 'blank', wall: WHITE, material: 'stucco' }, sides)
    faceBand(out, deck, HULL, HOUSE, { kind: 'bands', wall: WHITE, glass: [0.32, 0.4, 0.44], pitch: 1.4, floor: 1.2, solid: 0.35, material: 'stucco' }, ends)
    capPolygon(out, deck, HOUSE, [0.78, 0.77, 0.74], 0)
    for (const i of sides) {
      const e = edgeAt(deck, i)
      for (let s = 3; s < e.L - 3; s += 7) for (let g = 0; g < 4; g++) {
        boxAlong(out, e.a.x + e.tx * s + e.nx * 0.04, 10.0 + g * 0.18, e.a.z + e.tz * s + e.nz * 0.04, 0.8, 0.04, 0.06, e.heading, [0.3, 0.31, 0.32], 0)
      }
    }
    pipeRail(deck, HOUSE)
    // MARITIME MUSEUM along the deck house's front, as on the building
    const df = edgeAt(deck, edgeFacing(deck, 0))
    signText(out, 'MARITIME MUSEUM', df.mid.x + df.nx * 0.05, 10.9, df.mid.z + df.nz * 0.05, 0.55, [0.62, 0.62, 0.62], { heading: df.heading })
    // ship's ventilator cowls on the main deck: a white trunk and a flared mouth turned to the wind
    {
      const e = edgeAt(ring, front)
      for (const f of [-0.32, 0.32]) {
        const x = e.mid.x + e.tx * e.L * f - e.nx * 1.4, z = e.mid.z + e.tz * e.L * f - e.nz * 1.4
        prism(out, x, z, HULL, HULL + 1.6, 0.26, 10, WHITE, 0)
        prism(out, x, z, HULL + 1.6, HULL + 2.2, 0.3, 10, WHITE, 0, 0.5)
        boxAlong(out, x + e.nx * 0.3, HULL + 2.0, z + e.nz * 0.3, 0.3, 0.3, 0.05, e.heading, [0.2, 0.2, 0.2], 0)
      }
    }
    // the drum on the deck house roof, domed
    let mx = 0, mz = 0
    for (const p of deck) { mx += p.x; mz += p.z }
    mx /= deck.length; mz /= deck.length
    prism(out, mx, mz, HOUSE, HOUSE + 2.4, 3.4, 20, WHITE, 0)
    prism(out, mx, mz, HOUSE + 2.4, HOUSE + 3.4, 3.4, 20, [0.86, 0.85, 0.82], 0, 2.0)
    pipeRail(Array.from({ length: 12 }, (_, k) => ({ x: mx + Math.cos((k / 12) * Math.PI * 2) * 3.4, z: mz + Math.sin((k / 12) * Math.PI * 2) * 3.4 })), HOUSE + 3.4)
    // the mast, with a yard and a topmast, and two signal poles either side
    const M = HOUSE + 3.4
    prism(out, mx, mz, M, M + 10, 0.13, 8, [0.92, 0.92, 0.9], metal, 0.08)
    {
      const e = edgeAt(ring, front)
      strut(out, [mx - e.tx * 2.6, M + 6.8, mz - e.tz * 2.6], [mx + e.tx * 2.6, M + 6.8, mz + e.tz * 2.6], 0.08, 0.08, [0.92, 0.92, 0.9], metal)
      strut(out, [mx - e.tx * 1.5, M + 8.6, mz - e.tz * 1.5], [mx + e.tx * 1.5, M + 8.6, mz + e.tz * 1.5], 0.06, 0.06, [0.92, 0.92, 0.9], metal)
      for (const f of [-0.3, 0.3]) {
        const x = mx + e.tx * e.L * f, z = mz + e.tz * e.L * f
        prism(out, x, z, HOUSE, HOUSE + 5.5, 0.06, 6, [0.85, 0.85, 0.83], metal)
      }
    }
  },

  /** 501 Fulton Street (Jehovah's Witness Kingdom Hall, height 9 m): a plain low stucco meeting hall. */
  fulton501: fromRecipe('hotel-punched', { height: 9, base: 0, wall: [0.78, 0.76, 0.7], glass: [0.2, 0.22, 0.24], material: 'stucco' }),

  /**
   * San Francisco Transition Structure (Transbay Tube ventilation/transition building, building:levels=3,
   * height 16 m, roof=quadruple_saltbox): a plain brick transit-infrastructure box under its distinctive
   * saltbox roof.
   */
  // the BART Transbay Tube's San Francisco vent on its pier behind the Ferry Building (Wikipedia: Sinbad's restaurant
  // stood on top of it until 2016): a near-windowless grey concrete box with louvred bands — was a brick-loft recipe
  transbayTransitionStructure: (out, fit) => tower(out, { ...fit, height: 16 }, {
    height: 16,
    tiers: [{ to: 16, face: { kind: 'bands', wall: [0.62, 0.61, 0.58], glass: [0.32, 0.33, 0.33], floor: 5.3, solid: 0.82, material: 'concrete' } }],
    roof: [0.5, 0.5, 0.48],
    crown: { kind: 'parapet', height: 0.8, colour: [0.62, 0.61, 0.58], material: 'concrete' },
  }),
}
