/**
 * "The weird column" (docs/LADDER.md's selection rule: significant OR prominent OR WEIRD OR on a route) —
 * eight small San Francisco buildings, none of them large, that a rider notices and remembers: two octagon
 * houses, a domed columbarium, a camera-shaped camera obscura, the cliff-edge Cliff House, and two ordinary
 * small buildings famous for cultural reasons (City Lights, Vesuvio), which the owner has said a one-line
 * recipe answers just as well as a hand model.
 *
 * All eight came up `mapillary: junk` in docs/shots/refs/sf-fetch/done.csv — no usable street frame. Every one
 * of these buildings is well known enough that a short search by name is sanctioned (task brief), and that is
 * where the massing below comes from, not invention.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, type Face } from '../tower.ts'
import { facade } from '../facade.ts'
import { boxAlong, cupola, edgeAt, edgeFacing } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign } from '../signage.ts'
import { dome as domePart } from '../kit.ts'
import { box, prism } from '../../models.ts'
import { fromRecipe } from './recipes.ts'

type P2 = { x: number; z: number }

const octagonRing = (hx: number, hz: number): P2[] => {
  const r = Math.min(hx, hz)
  return Array.from({ length: 8 }, (_, k) => {
    const a = ((k + 0.5) / 8) * Math.PI * 2
    return { x: Math.sin(a) * r, z: Math.cos(a) * r }
  })
}

export const ODDITIES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * way/32947069 — Pacific Union Club (the James C. Flood Mansion), 1000 California St, Nob Hill. Built 1886
   * for James Flood in Connecticut brownstone, Italianate; the only Nob Hill mansion whose walls survived the
   * 1906 fire (the interior was gutted and rebuilt, Willis Polk adding the attic storey, bronze fence and
   * porticoes, 1907-12). A plain rectangular block: heavy rusticated base, tall arch-headed piano-nobile
   * windows, a bracketed cornice, a rooftop balustrade. `dark-brick`'s warm dark-brown reads closest to
   * brownstone in the kit's material list.
   */
  pacificUnionClub_32947069: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'dark-brick' },
      shaft: { storeys: 2, windows: 'pedimented', material: 'dark-brick' },
      top: { kind: 'attic', storeys: 1, material: 'dark-brick' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: { kind: 'balustrade', height: 1.2, material: 'brick', pier: true },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 4 },
      material: 'dark-brick',
    })
  },

  /**
   * way/273493901 — San Francisco Columbarium, 1 Loraine Court. 1898, Bernard J. Cahill, Neoclassical/Baroque:
   * a domed rotunda of funerary niches. A circular drum (not the octagon plan of the two houses below — no
   * `facade()` slot exists for a round building, so this is hand geometry on `tower()`'s parts) and the
   * copper-green dome that is the building's whole silhouette from the street. `bankTemple()` was considered
   * (KIT.md) but its ground is a portico-fronted BOX, not a round drum; a `colonnade()` entrance portico was
   * tried on the render and came out as a degenerate sliver on this footprint's short entrance edge, so it
   * was dropped rather than shipped broken — the drum and dome are the recognisable silhouette anyway.
   */
  columbarium_273493901: (out: MeshBuilder, fit: Fit): void => {
    const r = Math.min(fit.hx, fit.hz)
    const drumH = Math.max(8, fit.height * 0.6)
    const cream: Face['wall'] = [0.87, 0.85, 0.78]
    tower(out, fit, {
      height: drumH,
      tiers: [{ to: 1, face: { kind: 'punched', wall: cream, glass: [0.3, 0.4, 0.42], pitch: r * 0.9, floor: drumH, solid: 0.55, material: 'terracotta' } }],
      cornices: [{ at: drumH * 0.92, depth: 0.6, height: 0.5, colour: cream }],
      crown: { kind: 'flat' },
    })
    // the dome and its drum, set back from the rotunda's own wall
    domePart(out, 0, 0, drumH, r * 0.78, r * 0.95, [0.35, 0.55, 0.48], 16, [0.28, 0.45, 0.4])
  },

  /**
   * way/243512313 — Octagon House (the McElroy Octagon House), 2645 Gough St, Cow Hollow. 1861, Colonial
   * Revival: a true eight-sided plan (the fad Orson Fowler's "A Home for All" started), white-painted wood
   * clapboard, two storeys under a low hipped roof capped by a small octagonal cupola. An octagon plan has no
   * `facade()` slot (a facade wants a flat long edge), so it is `tower()` on a hand-built 8-gon ring —
   * exactly the kind of shape KIT.md calls out as legitimately hand work.
   */
  octagonHouse_243512313: (out: MeshBuilder, fit: Fit): void => {
    const ring = octagonRing(Math.max(fit.hx, 4), Math.max(fit.hz, 4))
    const white: Face['wall'] = [0.93, 0.92, 0.87]
    tower(out, { ...fit, ring }, {
      height: Math.max(fit.height, 8),
      tiers: [{ to: 1, face: { kind: 'punched', wall: white, glass: [0.18, 0.2, 0.24], pitch: 2.6, floor: 3.3, solid: 0.55, material: 'clapboard' } }],
      crown: { kind: 'hip', height: 1.8, inset: 0.6, colour: [0.32, 0.3, 0.28], material: 'tile' },
    })
    cupola(out, { x: 0, z: 0 }, Math.max(fit.height, 8) + 1.6, 1.2, { colour: white, domeColour: [0.32, 0.3, 0.28], material: 'clapboard', domeMaterial: 'tile' })
  },

  /**
   * way/256993234 — Feusier Octagon House, 1067 Green St, Russian Hill. 1857-59, enlarged c.1880s: a taller
   * three-storey octagon than its Gough Street cousin, grey-painted wood, topped by a Second-Empire
   * mansard-roofed cupola rather than a simple dome. Same hand-octagon approach as above, with a taller drum
   * and a mansard crown to say the mansard cupola.
   */
  feusierOctagonHouse_256993234: (out: MeshBuilder, fit: Fit): void => {
    const ring = octagonRing(Math.max(fit.hx, 4.5), Math.max(fit.hz, 4.5))
    const grey: Face['wall'] = [0.72, 0.72, 0.7]
    const h = Math.max(fit.height, 11)
    tower(out, { ...fit, ring }, {
      height: h,
      tiers: [{ to: 1, face: { kind: 'punched', wall: grey, glass: [0.18, 0.2, 0.24], pitch: 2.5, floor: 3.2, solid: 0.55, material: 'clapboard' } }],
      crown: { kind: 'mansard', height: 1.6, inset: 0.5, colour: [0.24, 0.22, 0.22], material: 'tile' },
    })
    cupola(out, { x: 0, z: 0 }, h + 1.6, 1.4, { colour: grey, domeColour: [0.24, 0.22, 0.22], material: 'clapboard', domeMaterial: 'tile' })
  },

  /**
   * way/168942987 — the Camera Obscura (the Giant Camera, 1946), on the Cliff House terrace over the sea. A little
   * building made to look like a box camera (owner's photographs, 2026-10-06; it was a stack of boxes): a pale yellow
   * body with every horizontal edge chamfered, the ends cut steeply top and bottom so the long side reads as a
   * stretched octagon; a light-blue band edged in black all round it, black round "knobs" on the ends by the front;
   * on the land side the entrance — a blue portal with an arched opening and a ticket window, its two cream doors
   * folded back, and over it the black board CAMERA OBSCURA AND HOLOGRAPH GALLERY; GIANT CAMERA in dark capitals on
   * the south end beside its own door. On the roof the lens house: a planked drum with a bulging blue ring, a dark
   * rim, and a shingled cone with the lens window looking out to sea.
   *
   * The footprint's long axis is local z; local +x faces the land (ESE, the terrace), −x the sea.
   */
  cameraObscura_168942987: (out: MeshBuilder, fit: Fit): void => {
    const hx = Math.max(fit.hx, 3), hz = Math.max(fit.hz, 4)
    // built from y = 0 and then stood on the HIGHEST ground under it: the terrace slopes, and from the model's base
    // (its lowest ground) the body sank a metre into the paving on the land side
    const v0 = out.positions.length, s0 = out.signs.length
    const g = fit.groundAt
    const lift = g ? Math.max(0, ...[[-1, -1], [-1, 1], [1, -1], [1, 1], [0, 0]].map(([a, b]) => g(a * (hx - 0.6), b * (hz - 1.1)))) : 0
    const BODY: [number, number, number] = [0.90, 0.85, 0.62]
    const BLUE: [number, number, number] = [0.55, 0.74, 0.86]
    const PORTAL: [number, number, number] = [0.50, 0.70, 0.84]
    const BLACK: [number, number, number] = [0.07, 0.07, 0.08]
    const SHINGLE: [number, number, number] = [0.40, 0.45, 0.42]
    const wall = 2, dark = surfaceTag('metal')
    // the body, lofted through chamfered rectangles: [y, inset across, inset along]
    const levels: [number, number, number][] = [[0, 0.55, 1.05], [1.0, 0, 0], [2.7, 0, 0], [3.25, 0.22, 0.62]]
    for (let k = 0; k + 1 < levels.length; k++) {
      const [ya, ia, ja] = levels[k], [yb, ib, jb] = levels[k + 1]
      const Xa = hx - ia, Za = hz - ja, Xb = hx - ib, Zb = hz - jb
      for (const sx of [-1, 1]) {
        const n = [yb - ya, -(Xb - Xa)]; const L = Math.hypot(n[0], n[1]) || 1
        out.quad([[sx * Xa, ya, -Za], [sx * Xa, ya, Za], [sx * Xb, yb, Zb], [sx * Xb, yb, -Zb]], [sx * n[0] / L, n[1] / L, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], BODY, wall)
      }
      for (const sz of [-1, 1]) {
        const n = [yb - ya, -(Zb - Za)]; const L = Math.hypot(n[0], n[1]) || 1
        out.quad([[-Xa, ya, sz * Za], [Xa, ya, sz * Za], [Xb, yb, sz * Zb], [-Xb, yb, sz * Zb]], [0, n[1] / L, sz * n[0] / L], [[0, 0], [1, 0], [1, 1], [0, 1]], BODY, wall)
      }
    }
    const rX = hx - 0.22, rZ = hz - 0.62
    out.quad([[-rX, 3.25, -rZ], [rX, 3.25, -rZ], [rX, 3.25, rZ], [-rX, 3.25, rZ]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], BODY, wall)
    // the black edge round the roof
    for (const sx of [-1, 1]) box(out, sx * rX, 3.27, 0, 0.05, 0.05, rZ + 0.05, BLACK, dark)
    for (const sz of [-1, 1]) box(out, 0, 3.27, sz * rZ, rX + 0.05, 0.05, 0.05, BLACK, dark)
    // the band all round the upright walls: black, light blue, black
    for (const [y0, y1, c] of [[1.50, 1.56, BLACK], [1.56, 1.80, BLUE], [1.80, 1.86, BLACK]] as const) {
      const yc = (y0 + y1) / 2, hy = (y1 - y0) / 2
      for (const sx of [-1, 1]) box(out, sx * (hx + 0.015), yc, 0, 0.015, hy, hz, c, sx > 0 ? dark : wall)
      for (const sz of [-1, 1]) box(out, 0, yc, sz * (hz + 0.015), hx, hy, 0.015, c, wall)
    }
    // the camera's knobs: black discs on each end, by the front corner
    const disc = (x: number, y: number, sz: number, r: number, c: [number, number, number]): void => {
      const z0 = sz * hz, z1 = sz * (hz + 0.1), N = 16
      for (let k = 0; k < N; k++) {
        const a0 = (k / N) * Math.PI * 2, a1 = ((k + 1) / N) * Math.PI * 2
        const p = (a: number, z: number): [number, number, number] => [x + Math.cos(a) * r, y + Math.sin(a) * r, z]
        out.quad([[x, y, z1], p(a0, z1), p(a1, z1), [x, y, z1]], [0, 0, sz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, dark)
        const am = (a0 + a1) / 2
        out.quad([p(a0, z0), p(a1, z0), p(a1, z1), p(a0, z1)], [Math.cos(am), Math.sin(am), 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, dark)
      }
    }
    for (const sz of [-1, 1]) disc(hx - 0.95, 1.68, sz, 0.55, BLACK)
    // THE ENTRANCE, on the land side: a blue portal standing out of the wall, an arched opening, the ticket window
    const fx = hx, PW = 1.65, PH = 2.65
    box(out, fx + 0.2, PH / 2, -PW + 0.12, 0.2, PH / 2, 0.12, PORTAL, wall)                // the jambs
    box(out, fx + 0.2, PH / 2, PW - 0.12, 0.2, PH / 2, 0.12, PORTAL, wall)
    box(out, fx + 0.2, PH - 0.14, 0, 0.2, 0.14, PW, PORTAL, wall)                          // the lintel
    // the arch's spandrels, stepped in a quarter circle each side
    for (let k = 0; k < 5; k++) {
      const t = (k + 0.5) / 5, w = 0.55 * (1 - Math.sqrt(1 - t * t))
      for (const sz of [-1, 1]) box(out, fx + 0.36, PH - 0.28 - 0.5 * (1 - t), sz * (PW - 0.24 - w / 2), 0.04, 0.05, w / 2 + 0.01, PORTAL, wall)
    }
    box(out, fx + 0.01, 1.2, 0, 0.01, 1.2, PW - 0.2, [0.62, 0.78, 0.88], wall)             // the vestibule's back wall
    box(out, fx + 0.3, 0.45, -0.95, 0.12, 0.45, 0.45, PORTAL, wall)                        // the ticket counter
    box(out, fx + 0.33, 1.3, -0.95, 0.02, 0.38, 0.42, [0.2, 0.26, 0.3], surfaceTag('glass'))
    box(out, fx + 0.37, 0.48, -0.95, 0.01, 0.12, 0.3, [0.85, 0.12, 0.12], wall)           // NOW OPEN, red
    // the two cream doors, folded back almost flat to the wall either side
    for (const sz of [-1, 1]) {
      const hingeZ = sz * PW, dirx = 0.32, dirz = sz * 0.95, W = 1.3
      boxAlong(out, fx + 0.4 + dirx * W / 2, 1.3, hingeZ + dirz * W / 2, W / 2, 1.3, 0.04, Math.atan2(-dirz, dirx), BODY, wall)   // (boxAlong's local x runs (cos h, −sin h))
    }
    // the board over the door: black, a cream border, the name
    box(out, fx + 0.45, 3.35, 0, 0.06, 0.62, 1.85, [0.86, 0.82, 0.66], wall)
    box(out, fx + 0.5, 3.35, 0, 0.02, 0.55, 1.77, BLACK, dark)
    const toLand = Math.PI / 2
    sign(out, { type: 'flat', text: 'CAMERA OBSCURA', h: 0.26, face: 'roman', colour: [0.9, 0.88, 0.8], tracking: 0.06, lit: 'none', w: 3.2 }, { x: fx + 0.54, y: 3.66, z: 0, heading: toLand })
    sign(out, { type: 'flat', text: 'AND', h: 0.13, face: 'roman', colour: [0.9, 0.88, 0.8], lit: 'none' }, { x: fx + 0.54, y: 3.37, z: 0, heading: toLand })
    sign(out, { type: 'flat', text: 'HOLOGRAPH   GALLERY', h: 0.17, face: 'roman', colour: [0.9, 0.88, 0.8], tracking: 0.05, lit: 'none', w: 3.1 }, { x: fx + 0.54, y: 3.07, z: 0, heading: toLand })
    // the south end: GIANT CAMERA, and the door into the dark room
    sign(out, { type: 'flat', text: 'GIANT CAMERA', h: 0.34, face: 'grotesque', weight: 'bold', colour: [0.1, 0.12, 0.2], tracking: 0.1, lit: 'none', w: 2.9 },
      { x: -hx + 1.75, y: 2.25, z: -hz - 0.02, heading: Math.PI })
    box(out, hx - 2.45, 1.05, -hz - 0.02, 0.42, 1.05, 0.03, [0.62, 0.64, 0.66], wall)
    box(out, hx - 2.45, 1.05, -hz - 0.04, 0.35, 0.98, 0.01, [0.12, 0.12, 0.13], dark)
    // THE LENS HOUSE on the roof
    const C: [number, number, number] = [0.9, 0.86, 0.66]
    prism(out, 0, 0, 3.25, 4.4, 1.3, 24, C, surfaceTag('clapboard'))
    prism(out, 0, 0, 3.66, 3.72, 1.48, 24, BLACK, dark)
    prism(out, 0, 0, 3.72, 4.0, 1.52, 24, BLUE, wall, 1.46)
    prism(out, 0, 0, 4.0, 4.06, 1.48, 24, BLACK, dark)
    prism(out, 0, 0, 4.4, 4.5, 1.4, 24, BLACK, dark)
    prism(out, 0, 0, 4.5, 5.75, 1.3, 16, SHINGLE, surfaceTag('tile'), 0.34)
    prism(out, 0, 0, 5.75, 5.92, 0.36, 12, [0.3, 0.3, 0.3], dark)
    // the lens window, a dark hood out of the cone towards the sea, its round eye
    boxAlong(out, -0.62, 5.2, 0, 0.32, 0.26, 0.28, -Math.PI / 2, [0.35, 0.33, 0.3], wall)
    boxAlong(out, -0.91, 5.2, 0, 0.17, 0.17, 0.02, -Math.PI / 2, [0.08, 0.06, 0.08], dark)
    if (lift > 0.02) {
      for (let i = v0; i < out.positions.length; i += 3) out.positions[i + 1] += lift
      for (let i = s0; i < out.signs.length; i++) out.signs[i].y += lift
      // the plinth it stands on, down into the low side of the terrace
      box(out, 0, lift / 2 - 0.15, 0, hx - 0.5, lift / 2 + 0.15, hz - 1.0, [0.62, 0.61, 0.58], surfaceTag('concrete'))
    }
  },

  /**
   * way/250216260 — the Lands End Lookout (the visitor centre, 680 Point Lobos Ave, 2012), from the owner's photographs
   * (2026-10-06: "the Lands End Lookout is pretty neat"). Long and low: a board-formed concrete wall along the front
   * with a band of sea-green glazed tile lettered LANDS END LOOKOUT beside the Park Service arrowhead; over the wall a
   * row of clerestory windows in white frames and a thin flat roof standing well out on a dark fascia; behind it the
   * building is weathered dark timber. At the east end the wall turns into a concrete frame round a display window,
   * and beyond it blue steel beams carry a canopy over the entrance (a lime-green door), red posts and a rope keeping
   * people off the planting. (The stone lion by the wall is a statue: the GLB pipeline's.)
   */
  landsEndLookout_250216260: (out: MeshBuilder, fit: Fit): void => {
    const hx = Math.max(fit.hx, 8), hz = Math.max(fit.hz, 4)
    const CONCRETE: [number, number, number] = [0.71, 0.7, 0.67]
    const TIMBER: [number, number, number] = [0.33, 0.28, 0.24]
    const TILE: [number, number, number] = [0.55, 0.69, 0.67]
    const FASCIA: [number, number, number] = [0.19, 0.2, 0.21]
    const BLUE: [number, number, number] = [0.14, 0.34, 0.76]
    const conc = surfaceTag('concrete'), wood = surfaceTag('clapboard')
    const wallEnd = hx * 0.6          // where the long wall stops and the frame begins
    // (drawn with the frame and the canopy at +x, then MIRRORED: seen from the front, +x is on the viewer's left, and
    // the photographs have the name on the left and the frame, the 680 and the blue steel at the right-hand end)
    const v0 = out.positions.length, i0 = out.indices.length, s0 = out.signs.length
    // the timber building behind everything
    box(out, 0, 2.3, -0.3, hx - 0.4, 2.3, hz - 0.6, TIMBER, wood)
    // THE WALL along the front, and the tile band with the name
    box(out, (-hx + wallEnd) / 2, 1.85, hz - 0.2, (hx + wallEnd) / 2, 1.85, 0.2, CONCRETE, conc)
    // (the formwork's joints, faint, in panels)
    for (let x = -hx + 2.4; x < wallEnd; x += 2.4) box(out, x, 1.85, hz + 0.005, 0.012, 1.85, 0.005, [0.64, 0.63, 0.6], conc)
    const b0 = -hx * 0.62, b1 = wallEnd - 0.6
    box(out, (b0 + b1) / 2, 2.45, hz + 0.02, (b1 - b0) / 2, 0.52, 0.02, TILE, surfaceTag('tile'))
    // the arrowhead, and the name in pale metal letters
    // (the arrowhead before the name: at −x here, which the mirror below puts on the viewer's left)
    box(out, b0 + 0.7, 2.45, hz + 0.05, 0.22, 0.34, 0.02, [0.86, 0.85, 0.8], conc)
    box(out, b0 + 0.7, 2.43, hz + 0.065, 0.15, 0.26, 0.01, [0.42, 0.33, 0.24], conc)
    sign(out, { type: 'flat', text: 'LANDS END LOOKOUT', h: 0.36, face: 'grotesque', colour: [0.93, 0.94, 0.92], tracking: 0.32, lit: 'none', w: (b1 - b0) - 2.2 },
      { x: (b0 + 1.4 + b1) / 2, y: 2.45, z: hz + 0.06, heading: 0 })
    // the house number high on the wall's end
    sign(out, { type: 'flat', text: '680', h: 0.28, face: 'grotesque', colour: [0.85, 0.85, 0.82], lit: 'none' }, { x: wallEnd - 0.7, y: 3.35, z: hz + 0.02, heading: 0 })
    // THE FRAME at the wall's end, round a display window, and the clerestory over the wall
    box(out, wallEnd + 0.25, 1.85, hz - 0.2, 0.25, 1.85, 0.2, CONCRETE, conc)
    box(out, hx - 0.25, 1.85, hz - 0.2, 0.25, 1.85, 0.2, CONCRETE, conc)
    box(out, (wallEnd + hx) / 2, 3.45, hz - 0.2, (hx - wallEnd) / 2, 0.25, 0.2, CONCRETE, conc)
    box(out, (wallEnd + hx) / 2, 0.3, hz - 0.2, (hx - wallEnd) / 2, 0.3, 0.2, CONCRETE, conc)
    box(out, (wallEnd + 0.5 + hx * 0.8) / 2, 1.9, hz - 0.3, (hx * 0.8 - wallEnd - 0.5) / 2, 1.3, 0.02, [0.2, 0.3, 0.3], surfaceTag('glass'))
    for (let x = -hx + 1.2; x < hx - 1; x += 2.1) {
      box(out, x, 4.15, hz - 0.62, 0.95, 0.42, 0.04, [0.32, 0.42, 0.48], surfaceTag('glass'))
      box(out, x, 4.15, hz - 0.6, 1.0, 0.47, 0.03, [0.93, 0.93, 0.9], surfaceTag('metal'))
    }
    // the thin flat roof, well out over the walls, on its dark fascia
    box(out, 0, 4.82, -0.1, hx + 1.0, 0.1, hz + 0.9, FASCIA, surfaceTag('metal'))
    box(out, 0, 4.7, -0.1, hx + 0.95, 0.04, hz + 0.85, [0.55, 0.5, 0.45], wood)
    // the BLUE STEEL over the entrance at the east end, and the lime-green door under it
    for (const x of [hx - 0.35, hx - 3.2]) box(out, x, 5.15, 0.8, 0.14, 0.2, hz + 1.6, BLUE, surfaceTag('metal'))
    box(out, hx - 1.8, 5.15, hz + 2.3, 1.9, 0.18, 0.14, BLUE, surfaceTag('metal'))
    box(out, hx - 1.8, 4.6, hz + 2.3, 1.9, 0.08, 0.1, BLUE, surfaceTag('metal'))
    box(out, hx * 0.86, 1.15, hz - 0.15, 0.6, 1.15, 0.03, [0.62, 0.7, 0.2], wood)
    // red posts and a rope along the planting in front of the timber end
    for (let k = 0; k < 4; k++) {
      const x = wallEnd + 0.8 + k * ((hx - wallEnd) / 3.4)
      box(out, x, 0.55, hz + 1.6, 0.06, 0.55, 0.06, [0.72, 0.28, 0.18], wood)
    }
    box(out, (wallEnd + 0.8 + hx) / 2, 0.85, hz + 1.6, (hx - wallEnd - 0.8) / 2, 0.012, 0.012, [0.85, 0.85, 0.82], 0)
    for (let i = v0; i < out.positions.length; i += 3) { out.positions[i] = -out.positions[i]; out.normals[i] = -out.normals[i] }
    for (let i = i0; i < out.indices.length; i += 3) { const t = out.indices[i + 1]; out.indices[i + 1] = out.indices[i + 2]; out.indices[i + 2] = t }
    for (let i = s0; i < out.signs.length; i++) out.signs[i].x = -out.signs[i].x
  },

  /**
   * way/705309578 — the Randall Museum (1951, 199 Museum Way), in the trees under Corona Heights' bare rock (owner,
   * 2026-10-06, with a photograph). A long, low mid-century block: cream walls, a ribbon of clerestory windows under a
   * thin flat roof that oversails on a deep fascia, and the ENTRANCE framed by two red-brick piers — between them a
   * wall of glazed doors in red frames under a slim green canopy on posts, the dark name board beside it with the
   * museum's leaf emblem — and a row of flags along the roof's edge over the door.
   */
  randallMuseum_705309578: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    const H = 4.6
    const CREAM: [number, number, number] = [0.88, 0.85, 0.74]
    const BRICK: [number, number, number] = [0.62, 0.3, 0.22]
    const RED: [number, number, number] = [0.6, 0.16, 0.12]
    const GREEN: [number, number, number] = [0.34, 0.45, 0.36]
    // the walls: plain cream to the sills, a clerestory ribbon above
    tower(out, { ...fit, ring }, {
      height: H,
      tiers: [{ to: 1, face: { kind: 'punched', wall: CREAM, glass: [0.22, 0.26, 0.28], floor: H, pitch: 2.4, solid: 0.45, material: 'stucco' } }],
      crown: { kind: 'parapet', height: 0.35, colour: [0.82, 0.8, 0.72], material: 'stucco' },
    })
    // the roof's oversailing fascia, all round
    const e = edgeAt(ring, edgeFacing(ring))
    // THE ENTRANCE on the front edge: brick piers, the glazed red doors, the canopy, the board, the flags
    const at = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
    for (const u of [-4.2, 4.2]) { const [x, z] = at(u, 0.3); boxAlong(out, x, 1.9, z, 0.9, 1.9, 0.45, e.heading, BRICK, surfaceTag('brick')) }
    { const [x, z] = at(0, 0.06); boxAlong(out, x, 1.45, z, 3.3, 1.45, 0.05, e.heading, [0.16, 0.2, 0.22], surfaceTag('glass')) }
    for (let k = 0; k <= 8; k++) { const [x, z] = at(-3.3 + k * 0.825, 0.12); boxAlong(out, x, 1.45, z, 0.04, 1.45, 0.05, e.heading, RED, 0) }
    for (const y of [0.1, 2.15, 2.85]) { const [x, z] = at(0, 0.12); boxAlong(out, x, y, z, 3.3, 0.05, 0.05, e.heading, RED, 0) }
    { const [x, z] = at(0, 1.6); boxAlong(out, x, 3.25, z, 5.4, 0.08, 1.6, e.heading, GREEN, surfaceTag('metal')) }
    for (const u of [-2.6, 2.6]) { const [x, z] = at(u, 3.0); boxAlong(out, x, 1.6, z, 0.05, 1.6, 0.05, e.heading, [0.85, 0.85, 0.82], surfaceTag('metal')) }
    { const [x, z] = at(-6.6, 0.12); boxAlong(out, x, 1.7, z, 1.2, 1.1, 0.04, e.heading, [0.16, 0.17, 0.2], 0) }
    sign(out, { type: 'flat', text: 'RANDALL MUSEUM', h: 0.17, face: 'grotesque', colour: [0.9, 0.88, 0.82], tracking: 0.1, lit: 'none', w: 2.0 },
      { ring, edge: edgeFacing(ring), y: 1.25, along: 0.5 - 6.6 / Math.max(1, e.L) })
    for (let k = 0; k < 5; k++) {
      const [x, z] = at(-6 + k * 3, 0.4)
      boxAlong(out, x, H + 1.3, z, 0.025, 1.0, 0.025, e.heading, [0.85, 0.85, 0.82], surfaceTag('metal'))
      boxAlong(out, x + e.tx * 0.32, H + 1.95, z + e.tz * 0.32, 0.3, 0.22, 0.01, e.heading, k % 2 ? [0.25, 0.35, 0.7] : [0.75, 0.2, 0.3], 0)
    }
  },

  /**
   * way/168942988 — Cliff House, 1090 Point Lobos Ave. The current (third) building, 1909, Reid Brothers,
   * Neo-Classical: a long low cream building stepping down the cliff edge toward the ocean rather than
   * standing as a single block — low massing, not height, is the point. A plain punched wall over a
   * rusticated base, wide view openings toward the sea, a balustraded parapet; no dome or portico (that was
   * the second, 1896 "Gingerbread Palace" Cliff House, burned 1907 — a different building).
   */
  cliffHouse_168942988: (out: MeshBuilder, fit: Fit): void => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'limestone' },
      shaft: { storeys: 1, windows: 'wide', material: 'stucco' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: { kind: 'balustrade', height: 0.9, material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'stucco',
    })
    // the 2004 glass dining room cantilevered over the cliff on the ocean side (the longest edge facing west), and the
    // name across the street front (appearance pass, 2026-10-02)
    const ring = towerRing(fit)
    let best = 0, bi = 0
    for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); const score = -e.nx * e.L; if (score > best) { best = score; bi = i } }
    const e = edgeAt(ring, bi)
    const cx = e.a.x + e.tx * e.L * 0.5, cz = e.a.z + e.tz * e.L * 0.5
    boxAlong(out, cx + e.nx * 3, 5, cz + e.nz * 3, e.L * 0.42, 3.6, 3, e.heading, [0.32, 0.42, 0.46], surfaceTag('glass'))
    boxAlong(out, cx + e.nx * 3, 8.75, cz + e.nz * 3, e.L * 0.44, 0.15, 3.2, e.heading, [0.9, 0.9, 0.88], surfaceTag('metal'))
    let fi = 0, fbest = -1
    for (let i = 0; i < ring.length; i++) { const f = edgeAt(ring, i); const score = f.nx * f.L; if (score > fbest) { fbest = score; fi = i } }
    sign(out, { type: 'flat', text: 'CLIFF HOUSE', h: 0.9, face: 'roman', colour: [0.2, 0.22, 0.26], lit: 'front' }, { ring, edge: fi, y: 6.4 })
  },

  /**
   * way/32858754 — City Lights Booksellers, 261 Columbus Ave, North Beach. An ordinary small three-storey
   * commercial building — cream/tan painted wood-and-brick — famous for the bookstore inside, not for its
   * architecture. The owner has said a one-line kit recipe is a fine outcome here, not a lesser one:
   * `brick-loft` gives a small punched-window block with a shopfront-dark base, recoloured to City Lights'
   * warm cream.
   */
  cityLightsBooksellers_32858754: fromRecipe('brick-loft', {
    height: 11, base: 3.5, wall: [0.82, 0.74, 0.58], baseWall: [0.2, 0.18, 0.17],
    crown: { kind: 'parapet', height: 0.6 },
  }),

  /**
   * way/35537202 — Vesuvio Cafe, 255 Columbus Ave, North Beach, right across Jack Kerouac Alley from City
   * Lights. A small painted building, the same treatment as City Lights per the owner's note: `brick-loft`
   * recoloured to Vesuvio's own dark red-brown paint scheme rather than a bespoke model.
   */
  vesuvio_35537202: fromRecipe('brick-loft', {
    height: 9, base: 3, wall: [0.42, 0.2, 0.16], baseWall: [0.14, 0.12, 0.11],
    crown: { kind: 'parapet', height: 0.5 },
  }),
}
