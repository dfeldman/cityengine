import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT A BARYE (square Barye, eastern tip of the Île Saint-Louis, 4e; OSM way 92316091, Wikidata Q18168658;
 * Stanislas Bernier, 1894): a tall stone pylon on a stepped platform, Barye's portrait medallion on its front, the bronze
 * group of Theseus and the centaur Bienor on top, a seated stone allegory with a child on a rock block at the right, and
 * a bronze lion at the left. Procedural: platform, pylon, cornice, medallion disc, ledges, plaque. Sculpture (Modly,
 * attached in paris-statues.json at TOP_AT / SEATED_AT / LION_AT): barye-theseus, barye-seated, barye-lion.
 * Frame: −z the front (medallion side), x across, y up from the ground (G). Dimensions estimated off Commons photos
 * and the OSM outline (7.6 x 5.9 m), not surveyed.
 */
export const HX = 3.8
export const HZ = 2.9

// tunables (metres)
const STEP1 = { hx: 3.7, hz: 1.9, h: 0.2 }, STEP2 = { hx: 3.5, hz: 1.7, h: 0.3 }
const PLINTH = { hx: 1.35, hz: 1.05, h: 0.55 }              // die under the shaft
const SHAFT = { hx: 1.05, hz: 0.8, h: 3.3 }                 // the pylon
const CORNICE = { hx: 1.3, hz: 1.05, h: 0.3 }, CAP = { hx: 1.15, hz: 0.9, h: 0.2 }
const MEDAL = { y: 2.9, r: 0.38, rim: 0.07 }                // portrait medallion on the front
const ROCK = { x0: 1.1, x1: 3.3, z0: -1.9, z1: -0.35, h: 0.65 }   // rock block under the seated figure
const LEDGE = { x0: -3.4, x1: -1.3, z0: -1.8, z1: -0.5, h: 0.2 } // low ledge under the lion

const STONE: Rgb = hex('#cfc8b6')
const DARK: Rgb = hex('#9b9484')
const BRONZE: Rgb = hex('#4a5a4a')

const topY = STEP1.h + STEP2.h + PLINTH.h + SHAFT.h + CORNICE.h + CAP.h
export const TOP_AT: [number, number, number] = [0, G + topY, 0]
export const SEATED_AT: [number, number, number] = [(ROCK.x0 + ROCK.x1) / 2, G + STEP1.h + STEP2.h + ROCK.h, (ROCK.z0 + ROCK.z1) / 2]
export const LION_AT: [number, number, number] = [(LEDGE.x0 + LEDGE.x1) / 2, G + STEP1.h + STEP2.h + LEDGE.h, (LEDGE.z0 + LEDGE.z1) / 2]

function draw(q: MeshBuilder): void {
  const b = (hx: number, hz: number, y0: number, y1: number, c: Rgb, cx = 0, cz = 0): void =>
    block(q, cx - hx, cx + hx, cz - hz, cz + hz, G + y0, G + y1, c)
  let y = 0
  b(STEP1.hx, STEP1.hz, y, y + STEP1.h, shade(STONE, 0.88)); y += STEP1.h
  b(STEP2.hx, STEP2.hz, y, y + STEP2.h, shade(STONE, 0.94)); y += STEP2.h
  b(PLINTH.hx, PLINTH.hz, y, y + PLINTH.h, STONE); y += PLINTH.h
  b(PLINTH.hx + 0.05, PLINTH.hz + 0.05, y - 0.08, y, shade(STONE, 0.9))        // moulded top of the die
  const yShaft = y
  b(SHAFT.hx, SHAFT.hz, y, y + SHAFT.h, STONE); y += SHAFT.h
  // frieze band under the cornice and a darker weathered base course
  b(SHAFT.hx + 0.02, SHAFT.hz + 0.02, y - 0.35, y - 0.12, DARK)
  b(SHAFT.hx + 0.03, SHAFT.hz + 0.03, yShaft, yShaft + 0.15, shade(STONE, 0.9))
  b(CORNICE.hx, CORNICE.hz, y, y + CORNICE.h, shade(STONE, 1.03)); y += CORNICE.h
  b(CAP.hx, CAP.hz, y, y + CAP.h, shade(STONE, 0.96)); y += CAP.h
  // portrait medallion: a stepped disc (rows of a circle) standing out of the front face
  const zf = -SHAFT.hz
  const rows = 9
  for (const [r, d, c] of [[MEDAL.r + MEDAL.rim, 0.04, shade(STONE, 0.85)], [MEDAL.r, 0.08, BRONZE]] as [number, number, Rgb][]) {
    for (let i = 0; i < rows; i++) {
      const t0 = -1 + (2 * i) / rows, t1 = -1 + (2 * (i + 1)) / rows, tm = (t0 + t1) / 2
      const w = r * Math.sqrt(Math.max(0, 1 - tm * tm))
      block(q, -w, w, zf - d, zf, G + yShaft + MEDAL.y + r * t0, G + yShaft + MEDAL.y + r * t1, c)
    }
  }
  // inscription panel under the medallion
  plaque(q, { x: 0, z: zf, y0: yShaft + 0.5, w: 0.9, h: 0.5, panel: shade(STONE, 1.04), letters: shade(STONE, 0.5), lines: [0.8, 0.5] })
  // rock block under the seated allegory (two rough tiers) and the lion's ledge
  const rx = (ROCK.x0 + ROCK.x1) / 2, rz = (ROCK.z0 + ROCK.z1) / 2, rhx = (ROCK.x1 - ROCK.x0) / 2, rhz = (ROCK.z1 - ROCK.z0) / 2
  const y0 = STEP1.h + STEP2.h
  b(rhx, rhz, y0, y0 + ROCK.h * 0.6, shade(STONE, 0.9), rx, rz)
  b(rhx - 0.2, rhz - 0.15, y0 + ROCK.h * 0.6, y0 + ROCK.h, shade(STONE, 0.84), rx + 0.05, rz)
  const lx = (LEDGE.x0 + LEDGE.x1) / 2, lz = (LEDGE.z0 + LEDGE.z1) / 2
  b((LEDGE.x1 - LEDGE.x0) / 2, (LEDGE.z1 - LEDGE.z0) / 2, y0, y0 + LEDGE.h, shade(STONE, 0.9), lx, lz)
}

export function monumentBarye(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
