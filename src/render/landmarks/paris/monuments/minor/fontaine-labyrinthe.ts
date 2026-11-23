import { capPolygonWithHoles, type MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { ccw, FIXED, walls, type P2 } from '../common.ts'
import { G } from '../plaza-common.ts'

/*
 * THE FONTAINE-LABYRINTHE (place des Fêtes, 19e; Marta Pan, a 1980 competition, inaugurated 1986/87; Wikidata Q635634):
 * "five eccentric basins" — low concentric granite walls, each ring broken by a gap on alternating sides so the water ran
 * round the corridors between them and into the centre; cobbled floor. Dry since ~2015, so no water is drawn. Purely
 * structural (no Modly piece). Frame: y up from the base, pavement at G. Dimensions are estimated from one Commons
 * photograph (La fontaine-labyrinthe de Martha Pan.jpg) against a car, not surveyed: outer ring ~10 m radius.
 */
export const R = 10.8

// tunables: [outer radius, centre offset z, gap centre angle (deg), gap width (deg)] per ring, outermost first
const RINGS: [number, number, number, number][] = [
  [10.2, 0, 200, 0],
  [8.3, 0.5, 20, 50],
  [6.5, 1.0, 200, 55],
  [4.8, 1.5, 20, 60],
  [3.2, 2.0, 200, 70],
]
const WALL_T = 0.55          // wall thickness
const WALL_H = 0.55          // wall top above the pavement
const FLOOR_H = 0.1
const GRANITE: Rgb = hex('#8e9193')
const COBBLE: Rgb = hex('#a39b8c')

function arc(cx: number, cz: number, r: number, a0: number, a1: number, n: number): P2[] {
  const pts: P2[] = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    pts.push({ x: cx + Math.sin(a) * r, z: cz + Math.cos(a) * r })
  }
  return pts
}

function draw(q: MeshBuilder): void {
  const disc = arc(0, 0, RINGS[0][0] - 0.1, 0, Math.PI * 2, 40).slice(0, -1)
  capPolygonWithHoles(q, [ccw(disc)], G + FLOOR_H, COBBLE, FIXED)
  RINGS.forEach(([r, oz, gapDeg, gapW], k) => {
    const c = shade(GRANITE, 1 - 0.03 * k)
    const rad = (d: number) => (d * Math.PI) / 180
    const a0 = rad(gapDeg + gapW / 2)
    const a1 = rad(gapDeg - gapW / 2) + Math.PI * 2
    const sweep = gapW === 0 ? Math.PI * 2 : a1 - a0
    const n = Math.max(8, Math.round(sweep * 6))
    const outer = arc(0, oz, r, a0, a0 + sweep, n)
    const inner = arc(0, oz, r - WALL_T, a0, a0 + sweep, n)
    if (gapW === 0) {
      // closed ring: walls both faces and an annular lid
      const o = outer.slice(0, -1)
      const i = inner.slice(0, -1)
      walls(q, o, G, G + WALL_H, c)
      walls(q, [...i].reverse(), G, G + WALL_H, c)
      capPolygonWithHoles(q, [ccw(o), [...ccw(i)].reverse()], G + WALL_H, shade(c, 1.06), FIXED)
    } else {
      const plan = [...outer, ...[...inner].reverse()]
      walls(q, plan, G, G + WALL_H, c, shade(c, 1.06))
    }
  })
}

export function fontaineLabyrinthe(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, R, draw)
}
