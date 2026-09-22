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
function horseman(out: MeshBuilder, plinth: number, rearing: boolean, stoneHex: string): void {
  const stone = hex(stoneHex)
  const bronze: Rgb = [0.24, 0.27, 0.22]
  block(out, -2.2, 2.2, -3.4, 3.4, 0, 0.5, shade(stone, 0.92))
  block(out, -1.8, 1.8, -3, 3, 0.5, plinth - 0.4, stone)
  block(out, -2, 2, -3.2, 3.2, plinth - 0.4, plinth, shade(stone, 1.04))
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

/** Foch, walking, facing the Eiffel Tower from the Trocadéro. */
export function fochTrocadero(out: MeshBuilder): void { horseman(out, 4.5, false, '#cfc7b6') }
