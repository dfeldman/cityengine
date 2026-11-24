import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'

const FIXED = 0

/**
 * A bronze equestrian statue on its stone pedestal: the procedural stand-in for the statues awaiting the
 * user's models (MODELS_NEEDED.md): Louis XIV at the Place des Victoires (the horse rearing), Foch at the
 * Trocadéro (walking). The horse's body, neck and head, four legs, a tail; the rider with a raised arm. A
 * model from the user replaces it through paris-statues.json.
 *
 * Local frame: the horse faces −z.
 */
function horseman(out: MeshBuilder, plinth: number, rearing: boolean, stoneHex: string, withStone = true): void {
  const stone = hex(stoneHex)
  const bronze: Rgb = [0.24, 0.27, 0.22]
  if (withStone) {
    block(out, -2.2, 2.2, -3.4, 3.4, 0, 0.5, shade(stone, 0.92))
    block(out, -1.8, 1.8, -3, 3, 0.5, plinth - 0.4, stone)
    block(out, -2, 2, -3.2, 3.2, plinth - 0.4, plinth, shade(stone, 1.04))
  }
  const y = plinth
  const lift = rearing ? 0.7 : 0
  const tilt = rearing ? 0.55 : 0
  // the barrel of the body, tilted up at the front when rearing
  const body = (t: number): [number, number, number] => [0, y + 1.6 + lift + t * tilt, -t * 1.1]
  beam(out, body(-1), body(1), 0.55, bronze)
  // neck and head
  const neckTop: [number, number, number] = [0, y + 2.7 + lift + tilt * 1.6, -1.55]
  beam(out, body(0.9), neckTop, 0.3, bronze)
  beam(out, neckTop, [0, neckTop[1] - 0.35, -2.1], 0.2, bronze)
  // legs: the hind ones planted; the fore ones planted, or raised and bent when rearing
  for (const x of [-0.3, 0.3]) {
    beam(out, [x, y + 1.3 + lift * 0.2, 1.0], [x, y, 1.15], 0.14, bronze)
    if (rearing) {
      beam(out, [x, body(1)[1] - 0.4, -1.05], [x, body(1)[1] - 0.9, -1.55], 0.13, bronze)
      beam(out, [x, body(1)[1] - 0.9, -1.55], [x, body(1)[1] - 1.5, -1.3], 0.12, bronze)
    } else {
      beam(out, [x, y + 1.3, -1.0], [x, y, x > 0 ? -1.3 : -0.9], 0.14, bronze)
    }
  }
  beam(out, body(-1), [0, y + 0.9, 1.9], 0.12, bronze)                                  // the tail
  // the rider: legs astride, torso, head, the arm raised
  const seat: [number, number, number] = [0, body(0.1)[1] + 0.55, -0.15]
  for (const x of [-0.45, 0.45]) beam(out, [x, seat[1], seat[2]], [x, seat[1] - 0.8, seat[2] - 0.2], 0.1, bronze)
  prism(out, 0, seat[2], seat[1], seat[1] + 0.95, 0.28, 8, bronze, FIXED, 0.22)
  prism(out, 0, seat[2], seat[1] + 0.95, seat[1] + 1.3, 0.15, 8, bronze, FIXED, 0.13)
  beam(out, [0.25, seat[1] + 0.85, seat[2]], [0.55, seat[1] + 1.55, seat[2] - 0.4], 0.07, bronze)
  box(out, 0.58, seat[1] + 1.62, seat[2] - 0.45, 0.05, 0.12, 0.05, bronze, FIXED)
}

/** Louis XIV, rearing, at the Place des Victoires, on his tall pedestal. */
export function louisXIV(out: MeshBuilder): void { horseman(out, 8.5, true, '#d9d0bd') }

/**
 * Foch's pedestal at the Trocadéro: a tall pale stone shaft (inscription FOCH on the end facing the horse's head)
 * whose back (tail end) steps down in slender vertical fins, on a plinth and a wide low platform with steps.
 * Total height ~8 m (fr.wikipedia "Statue équestre du maréchal Foch": socle en maçonnerie, 8 m); the rest is
 * measured off a Commons photo against a seated person (Marshal_Foch_Equestrian_Statue_Paris.jpg), so +-0.5 m.
 * The long axis lies along the horse (it faces -z). All tunable.
 */
const FOCH_SOCLE = {
  height: 8,                               // top of the pedestal above the ground
  stoneHex: '#d6cdb8',
  platW: 5.0, platL: 7.6, platH: 0.6,      // the wide low platform
  plinthW: 2.8, plinthL: 4.6, plinthH: 0.5,
  shaftW: 1.8, shaftL: 2.0,                // the main shaft block, at the horse's head end
  finN: 3, finT: 0.4, finStep: 0.45, finDrop: 1.3,  // fins behind it: count, thickness, height step between them, drop of the first below the top
}
/** While true the stand-in horseman is drawn on the pedestal; set false once the Modly piece (paris-statues.json) is published. */
export const FOCH_DRAW_STANDIN = true

/** Foch, walking, facing the Eiffel Tower from the Trocadéro: the procedural pedestal (the bronze is a Modly model attached on top; a stand-in horseman until then). */
export function fochTrocadero(out: MeshBuilder): void {
  const c = FOCH_SOCLE
  const stone = hex(c.stoneHex)
  const half = (w: number): [number, number] => [-w / 2, w / 2]
  const slab = (w: number, l: number, y0: number, y1: number, col: Rgb): void =>
    block(out, half(w)[0], half(w)[1], -l / 2, l / 2, y0, y1, col)
  const top = c.height
  const y0 = c.platH + c.plinthH
  slab(c.platW, c.platL, 0, c.platH, shade(stone, 0.88))
  slab(c.plinthW, c.plinthL, c.platH, y0, shade(stone, 0.94))
  const len = c.shaftL + c.finN * c.finT                  // z extent of shaft + fins, centred
  const zHead = -len / 2
  block(out, -c.shaftW / 2, c.shaftW / 2, zHead, zHead + c.shaftL, y0, top, stone)
  for (let i = 0; i < c.finN; i++) {                      // fins step up toward the shaft
    const z0 = zHead + c.shaftL + i * c.finT
    const h = top - c.finDrop - i * c.finStep
    block(out, -c.shaftW / 2, c.shaftW / 2, z0, z0 + c.finT, y0, h, shade(stone, 0.96 - 0.02 * i))
  }
  if (FOCH_DRAW_STANDIN) horseman(out, c.height, false, c.stoneHex, false)   // the bronze alone, on top
}
