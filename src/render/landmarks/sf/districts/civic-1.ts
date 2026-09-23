/**
 * civic-1: thirteen civic buildings (docs/sf-batches/civic-1.md) — churches, a theatre, a museum, schools, a fire
 * station, a monastery. Mostly recipes from ../recipes.ts with the colours and crown taken from a photograph;
 * the shared parts (../../parts.ts) for the corner towers, colonnades and cupolas that make these recognisable.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { faceBand, insetRing, tower, towerRing } from '../../tower.ts'
import { boxAlong, colonnade, cupola, edgeAt, edgeFacing, roundRing, signText, spireOn } from '../../parts.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { beam } from '../golden-gate.ts'

const CREAM: [number, number, number] = [0.86, 0.82, 0.72]
const OCHRE: [number, number, number] = [0.78, 0.68, 0.52]
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
   * Ripley's Believe It or Not (175 Jefferson St, height 13 m): the Fisherman's Wharf attraction's scalloped
   * red facade of round arches under a jagged red parapet, its name lit across the top.
   */
  ripleysBelieveItOrNot: (out: MeshBuilder, fit: Fit): void => {
    /*
     * 175 Jefferson, rebuilt from a photograph 2026-09-22. The first pass was a plain block with a sawtooth
     * parapet; what makes this building is that it is BRIGHT RED, that its whole upper wall is a painted
     * mural (the Golden Gate Bridge, a cable-car XING sign, the Palace of Fine Arts), and that the entrance
     * is a wide silver ARCH under a yellow sign, between silver fins.
     */
    const ring = towerRing(fit)
    const RED: [number, number, number] = [0.79, 0.11, 0.13]
    const SILVER: [number, number, number] = [0.72, 0.73, 0.75]
    const H = 13
    faceBand(out, ring, 0, 4.2, { kind: 'blank', wall: RED, material: 'stucco' })
    // the mural band: not paintable here, so it reads as a pale sky panel with the bridge's red towers on it
    faceBand(out, ring, 4.2, H, { kind: 'blank', wall: [0.62, 0.74, 0.82], material: 'stucco' })
    const e = edgeAt(ring, edgeFacing(ring, 0))
    for (const f of [-0.34, -0.12, 0.12, 0.34]) {
      const x = e.mid.x + e.tx * e.L * f + e.nx * 0.12
      const z = e.mid.z + e.tz * e.L * f + e.nz * 0.12
      // shallow, and stopping below the sign band: at 0.3 deep they stood further out than the lettering and
      // swallowed half of it
      boxAlong(out, x, (4.2 + H) / 2 - 0.4, z, 1.1, (H - 4.2) / 2 - 1.6, 0.1, e.heading, [0.85, 0.2, 0.18], surfaceTag('metal'))
    }
    faceBand(out, ring, H, H + 1.2, { kind: 'blank', wall: RED, material: 'stucco' })
    capPolygon(out, ring, H + 1.2, [0.5, 0.1, 0.1], 0)
    /*
     * The arched canopy. Built with `beam`, which runs a strut between two arbitrary points in 3D: a row of
     * boxes cannot make an arch, because boxAlong only turns in plan, so each box stays level and the curve
     * comes out as a stair. Chaining beams along the arc gives a smooth soffit.
     */
    const span = e.L * 0.5
    const rise = 3.0
    const spring = 4.6
    const arc = (t: number): [number, number, number] => {
      const a = Math.PI * t
      const u = -Math.cos(a) * span / 2
      return [e.mid.x + e.tx * u + e.nx * 1.6, spring + Math.sin(a) * rise, e.mid.z + e.tz * u + e.nz * 1.6]
    }
    for (let k = 0; k < 16; k++) beam(out, arc(k / 16), arc((k + 1) / 16), 0.34, 0.34, SILVER, false)
    for (let k = 0; k < 16; k++) {
      const a = arc(k / 16)
      const b = arc((k + 1) / 16)
      beam(out, [a[0] - e.nx * 1.2, a[1], a[2] - e.nz * 1.2], [b[0] - e.nx * 1.2, b[1], b[2] - e.nz * 1.2], 0.3, 0.3, SILVER, false)
    }
    for (const f of [-0.3, -0.18, 0.18, 0.3]) {
      const x = e.mid.x + e.tx * e.L * f + e.nx * 1.5
      const z = e.mid.z + e.tz * e.L * f + e.nz * 1.5
      boxAlong(out, x, 2.6, z, 0.22, 2.6, 0.5, e.heading, SILVER, surfaceTag('metal'))
    }
    /*
     * The sign itself is a GLB in a real bold italic (tools/signgen, `signs/ripleys.glb`) placed by its own
     * manifest entry above the arch — mixed case with an exclamation mark, neither of which the 3x5 block
     * font can carry, and this sign is most of what identifies the building. All that is drawn here is the
     * band it sits on.
     */
    const [bx, bz] = [e.mid.x + e.nx * 0.5, e.mid.z + e.nz * 0.5]
    boxAlong(out, bx, spring + rise + 1.4, bz, e.L * 0.3, 1.3, 0.2, e.heading, [0.88, 0.9, 0.9], surfaceTag('metal'))
  },

  /**
   * Gold Mountain Sagely Monastery (800 Sacramento St, ex-mattress-factory brick building bought 1970): a
   * three-storey cream Chinatown facade with a red-and-gold pagoda-eaved tower over the corner entrance.
   */
  goldMountainMonastery: (out: MeshBuilder, fit: Fit): void => {
    fromRecipe('chicago-block', { height: 11, base: 0, wall: [0.85, 0.78, 0.6], glass: [0.18, 0.18, 0.2], pitch: 3, floor: 3.6, solid: 0.5, material: 'stucco', crown: { kind: 'parapet', height: 0.6, colour: [0.85, 0.78, 0.6], material: 'stucco' } })(out, fit)
    const ring = towerRing(fit)
    const e = edgeAt(ring, edgeFacing(ring, 0))
    // the pagoda-eaved tower over the corner entrance, in Chinatown red and gold
    cupola(out, e.a, 11, 1.1, { drum: 1.4, dome: 1.6, colour: [0.82, 0.2, 0.16], domeColour: [0.18, 0.4, 0.32], material: 'stucco', domeMaterial: 'tile', lantern: false })
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
   * Nourse Theater (275 Hayes St, 1926, John Reid Jr.), the auditorium of the old High School of Commerce: a
   * tall plain cream stucco box — ONE storey of auditorium behind the wall — with an exuberant carved
   * terracotta Spanish Colonial Revival entrance surround and a red canvas awning.
   */
  nourseTheater: (out: MeshBuilder, fit: Fit): void => {
    /*
     * 275 Hayes (1927), rebuilt from a photograph 2026-09-22. The first pass was a grey box with a small
     * awning. What you actually see from Hayes Street is a plain CREAM STUCCO wall — correct, the auditorium
     * is one tall volume — with one extraordinarily rich TERRACOTTA PORTAL set into it: twisted colonettes
     * each side, a pair of arched windows above, AUDITORIUM carved in the frieze, and a red domed awning over
     * the doors. The wall being plain is what makes the portal read, so both matter.
     */
    const ring = towerRing(fit)
    // the wall is near-white and the portal distinctly warmer: at 0.88/0.83 they were the same value and the
    // ornament vanished into the stucco
    const CREAM: [number, number, number] = [0.93, 0.92, 0.87]
    const TERRA: [number, number, number] = [0.76, 0.66, 0.48]
    const H = 16
    tower(out, fit, {
      height: H,
      tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.2, 0.22, 0.22], pitch: 5.5, floor: H, solid: 0.9, material: 'stucco' } }],
      crown: { kind: 'parapet', height: 1.1, colour: [0.86, 0.84, 0.77], material: 'stucco' },
    })
    const e = edgeAt(ring, edgeFacing(ring, 0))
    const at = (u: number, o: number): [number, number] =>
      [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
    // the portal: a terracotta panel standing proud of the stucco, with its colonettes and cornice
    const pw = Math.min(e.L * 0.34, 8)
    const ph = 12
    const [px, pz] = at(0, 0.35)
    boxAlong(out, px, ph / 2, pz, pw / 2, ph / 2, 0.35, e.heading, TERRA, surfaceTag('terracotta'))
    for (const sgn of [-1, 1]) {
      const [cx2, cz2] = at(sgn * (pw / 2 - 0.45), 0.7)
      boxAlong(out, cx2, ph / 2, cz2, 0.4, ph / 2, 0.3, e.heading, [0.84, 0.77, 0.6], surfaceTag('terracotta'))
    }
    const [tx2, tz2] = at(0, 0.75)
    boxAlong(out, tx2, ph + 0.4, tz2, pw / 2 + 0.3, 0.5, 0.45, e.heading, [0.87, 0.8, 0.66], surfaceTag('terracotta'))
    // the paired arched windows, and AUDITORIUM in the frieze under them
    for (const sgn of [-1, 1]) {
      const [wx, wz] = at(sgn * pw * 0.17, 0.5)
      const [fx, fz] = at(sgn * pw * 0.17, 0.62)
      boxAlong(out, fx, 8.4, fz, pw * 0.16, 2.35, 0.1, e.heading, [0.86, 0.8, 0.64], surfaceTag('terracotta'))
      boxAlong(out, wx, 8.4, wz, pw * 0.13, 2.1, 0.12, e.heading, [0.2, 0.22, 0.23], surfaceTag('glass'))
    }
    const [sx, sz] = at(0, 0.52)
    signText(out, 'AUDITORIUM', sx, 6.0, sz, 0.75, [0.42, 0.31, 0.2], { heading: e.heading })
    // the red domed awning over the doors, and the bronze doors either side of the portal
    for (let k = 0; k <= 10; k++) {
      const t = k / 10
      const u = (t - 0.5) * pw * 0.78
      const [ax, az] = at(u, 1.1 + Math.sin(Math.PI * t) * 0.5)
      boxAlong(out, ax, 4.3 + Math.sin(Math.PI * t) * 0.85, az, pw * 0.05, 0.22, 0.6, e.heading, [0.72, 0.16, 0.16], 0)
    }
    for (const sgn of [-1, 1]) {
      const [dx, dz] = at(sgn * e.L * 0.3, 0.2)
      boxAlong(out, dx, 1.6, dz, 0.9, 1.6, 0.2, e.heading, [0.33, 0.45, 0.38], surfaceTag('copper'))
    }
  },

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
   * Notre Dame des Victoires (566 Bush St, 1915, French Romanesque): ochre terracotta, a round apse with tall
   * arched windows facing the street, and a square campanile with a pyramidal spire standing on one corner.
   */
  notreDameDesVictoires: (out: MeshBuilder, fit: Fit): void => {
    const ring = roundRing(towerRing(fit), 2.2, 4)
    tower(out, { ...fit, ring }, {
      height: 10,
      base: { height: 2, face: { kind: 'blank', wall: OCHRE, material: 'ashlar' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: OCHRE, glass: [0.22, 0.24, 0.3], pitch: 3, solid: 0.45, floor: 8, arched: true, material: 'ashlar' } }],
      roof: [0.4, 0.36, 0.3],
      crown: { kind: 'parapet', height: 0.8, colour: OCHRE, material: 'ashlar' },
    })
    const plain = towerRing(fit)
    spireOn(out, plain[edgeFacing(plain, 0)], 10, 1.4, 5, 6, { colour: OCHRE, spireColour: [0.4, 0.36, 0.3], material: 'ashlar', spireMaterial: 'tile', belfry: true })
  },

  /**
   * National Maritime Museum (Aquatic Park Bathhouse, 1939, William Mooser Jr., Streamline Moderne): a white
   * ship-shaped building with a curved prow, porthole windows, deck-rail parapets and a mast group on the
   * rounded pilot-house roof.
   */
  nationalMaritimeMuseum: (out: MeshBuilder, fit: Fit): void => {
    /*
     * The Aquatic Park Bathhouse (1939), rebuilt by hand 2026-09-22: the first pass was a rounded white slab
     * with punched windows, which loses the only thing anyone notices. It is a SHIP — Streamline Moderne, a
     * curved prow to the bay, continuous ribbon windows rather than holes, a stepped upper deck set back
     * behind a ship's rail, a curved bridge house on top, and masts.
     */
    const ring = roundRing(towerRing(fit), 7.0, 8)
    const deck = insetRing(ring, 3.2)
    const bridge = insetRing(deck, 5.0)
    const rail: [number, number, number] = [0.82, 0.81, 0.78]
    // the hull: a plinth, then two bands of ribbon window with a white spandrel between them
    faceBand(out, ring, 0, 1.4, { kind: 'blank', wall: [0.66, 0.66, 0.64], material: 'concrete' })
    faceBand(out, ring, 1.4, 4.6, { kind: 'bands', wall: WHITE, glass: [0.2, 0.26, 0.3], pitch: 2.2, floor: 3.2, solid: 0.42, material: 'stucco' })
    faceBand(out, ring, 4.6, 7.8, { kind: 'bands', wall: WHITE, glass: [0.2, 0.26, 0.3], pitch: 2.2, floor: 3.2, solid: 0.42, material: 'stucco' })
    capPolygon(out, ring, 7.8, [0.8, 0.79, 0.76], 0)
    // the rail round the main deck, a thin white line on posts, which is what reads as a ship at any distance
    faceBand(out, ring, 7.8, 8.9, { kind: 'blank', wall: rail, material: 'metal' })
    // the upper deck, set back, and the curved bridge house above it
    faceBand(out, deck, 8.9, 12.0, { kind: 'bands', wall: WHITE, glass: [0.2, 0.26, 0.3], pitch: 2.2, floor: 3.1, solid: 0.45, material: 'stucco' })
    capPolygon(out, deck, 12.0, [0.8, 0.79, 0.76], 0)
    faceBand(out, deck, 12.0, 13.0, { kind: 'blank', wall: rail, material: 'metal' })
    faceBand(out, bridge, 13.0, 16.2, { kind: 'bands', wall: WHITE, glass: [0.2, 0.26, 0.3], pitch: 2.0, floor: 3.2, solid: 0.4, material: 'stucco' })
    capPolygon(out, bridge, 16.2, [0.8, 0.79, 0.76], 0)
    // masts and a flagstaff off the bridge roof
    const m = bridge[0]
    for (const [f, h] of [[0.0, 9], [0.45, 5], [-0.45, 5]] as const) {
      boxAlong(out, m.x * (1 + f), 16.2 + h / 2, m.z * (1 + f), 0.14, h / 2, 0.14, 0, [0.32, 0.32, 0.34], surfaceTag('metal'))
    }
    // MARITIME MUSEUM across the front, as it is on the building
    const e = edgeAt(ring, edgeFacing(ring, 0))
    signText(out, 'MARITIME MUSEUM', e.mid.x, 8.3, e.mid.z, 0.6, [0.35, 0.35, 0.36], { heading: e.heading })
  },

  /**
   * San Francisco Unified School District Administration (the old High School of Commerce, building:levels=3):
   * a cream Classical Revival block matching its neighbour the Nourse Theater — an entrance colonnade, three
   * even storeys of punched windows.
   */
  sfusdAdministration: (out: MeshBuilder, fit: Fit): void => {
    fromRecipe('edwardian-terracotta', { height: 10, base: 3, wall: [0.85, 0.83, 0.77], baseWall: [0.5, 0.46, 0.4], material: 'stucco', crown: { kind: 'parapet', height: 0.8 } })(out, fit)
    const ring = towerRing(fit)
    const e = edgeAt(ring, edgeFacing(ring, 0))
    colonnade(out, e.a, e.b, 0, 3, 4, { colour: [0.85, 0.83, 0.77] })
  },

  /** 501 Fulton Street (Jehovah's Witness Kingdom Hall, height 9 m): a plain low stucco meeting hall. */
  fulton501: fromRecipe('hotel-punched', { height: 9, base: 0, wall: [0.78, 0.76, 0.7], glass: [0.2, 0.22, 0.24], material: 'stucco' }),

  /**
   * San Francisco Transition Structure (Transbay Tube ventilation/transition building, building:levels=3,
   * height 16 m, roof=quadruple_saltbox): a plain brick transit-infrastructure box under its distinctive
   * saltbox roof.
   */
  transbayTransitionStructure: fromRecipe('brick-loft', { height: 16, base: 0, wall: [0.5, 0.34, 0.28], crown: { kind: 'hip', height: 3, inset: 0.5, colour: [0.35, 0.32, 0.3], material: 'tile' } }),
}
