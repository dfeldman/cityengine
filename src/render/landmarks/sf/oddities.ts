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
import { boxAlong, cupola, edgeAt } from '../parts.ts'
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
   * way/168942987 — Camera Obscura, at the Cliff House site, Point Lobos Ave. A tiny (~4×4 m) shed literally
   * built in the shape of a giant box camera: a plain dark box body and a "lens" — a stubby cylinder —
   * projecting from the seaward wall. Too small and too odd a shape for any kit facade; a two-primitive
   * hand model is the right amount of effort.
   */
  cameraObscura_168942987: (out: MeshBuilder, fit: Fit): void => {
    // the Giant Camera (1946): a little building shaped like a box camera — a cream lower storey, a yellow camera body
    // with dark trim on top of it, and the lens turret on the roof turning over the sea (appearance pass, 2026-10-02:
    // it was a black box)
    const hx = Math.max(fit.hx, 3)
    const hz = Math.max(fit.hz, 3)
    const CREAM: [number, number, number] = [0.86, 0.82, 0.70]
    const YELLOW: [number, number, number] = [0.85, 0.68, 0.22]
    const DARK: [number, number, number] = [0.12, 0.11, 0.12]
    box(out, 0, 1.3, 0, hx, 1.3, hz, CREAM, 2)
    box(out, 0, 2.66, 0, hx + 0.15, 0.1, hz + 0.15, DARK, 2)
    box(out, 0, 3.9, 0, hx * 0.82, 1.15, hz * 0.82, YELLOW, 2)
    box(out, 0, 5.1, 0, hx * 0.86, 0.08, hz * 0.86, DARK, 2)
    // the lens turret on the roof, its lens looking out to sea
    prism(out, 0, 0, 5.18, 6.3, 0.95, 12, DARK, 2)
    box(out, 0, 6.0, 0.9, 0.45, 0.35, 0.5, DARK, 2)
    // a dark band of the camera's "bellows" and its door
    box(out, 0, 1.1, hz + 0.02, 0.6, 1.1, 0.03, DARK, 2)
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
