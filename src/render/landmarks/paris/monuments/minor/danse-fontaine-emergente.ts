import type { MeshBuilder } from '../../../../buildings.ts'
import { hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { finPlate, G, hoop, sweptTube } from './monument-kit.ts'
import type { Rgb } from '../../../../models.ts'

/*
 * LA DANSE DE LA FONTAINE ÉMERGENTE (place Augusta-Holmès, 13th; Chen Zhen, 2008; Wikidata Q747835): a stylised dragon
 * whose body breaks the pavement in a row of humps. Each hump is a glass tube with water driven through it under pressure,
 * ringed with polished-steel hoops and crested with scalloped steel fins. Wholly procedural (no figurative part: the head
 * is not visible in the one photograph found, so the body just dives under at both ends).
 * Frame: the dragon runs along x, wiggling in z; −z is the front; y up from the base, pavement at G. The hump count,
 * length and height are read off one Commons photograph (Place_Augusta_Holmes_03) against a car and a lamp post, not surveyed.
 */
export const HX = 15.8
export const HZ = 3.4

// tunables
const HUMPS = 4
const LENGTH = 30           // end to end along the plaza
const WIGGLE = 2.6          // amplitude of the plan serpentine
const PEAK = 1.85           // axis height above the pavement at the top of a hump
const SINK = 0.2            // how far the axis dips under the pavement between humps
const RADIUS = 0.85         // glass tube radius
const HOOP_PITCH = 0.62
const FIN_PITCH = 1.15
const FIN_H = 0.75

const GLASS: Rgb = hex('#9fc0c8')
const STEEL: Rgb = hex('#c9ced0')
const WATER: Rgb = hex('#5f93a8')

type V = [number, number, number]

function axis(t: number): V {
  const x = (t - 0.5) * LENGTH
  const z = Math.sin(t * Math.PI * 2 * 1.1 + 0.4) * WIGGLE
  const h = Math.sin(t * HUMPS * Math.PI)
  // humps stay at full height in the middle, shrinking toward the ends
  const env = 0.55 + 0.45 * Math.sin(t * Math.PI)
  const y = h >= 0 ? h * PEAK * env : h * SINK
  return [x, G + y - 0.05, z]
}

function draw(q: MeshBuilder): void {
  const N = 160
  const path: V[] = []
  for (let i = 0; i <= N; i++) path.push(axis(i / N))
  const rad = (t: number): number => RADIUS * (0.55 + 0.45 * Math.min(1, Math.sin(Math.min(1, t * 6) * Math.PI / 2), Math.sin(Math.min(1, (1 - t) * 6) * Math.PI / 2)))
  sweptTube(q, path, { r: rad, sides: 14, c: GLASS, caps: true })
  // the water inside shows as a darker, slightly smaller core
  sweptTube(q, path.map(p => [p[0], p[1] - 0.04, p[2]] as V), { r: t => rad(t) * 0.93, sides: 10, c: WATER, caps: false })
  const tan = (i: number): V => {
    const a = path[Math.max(0, i - 1)], b = path[Math.min(N, i + 1)]
    return [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  }
  // the steel hoops, only where the tube stands proud of the paving
  const hoops = Math.round(LENGTH / HOOP_PITCH)
  for (let k = 1; k < hoops; k++) {
    const i = Math.round((k / hoops) * N)
    if (path[i][1] < G - 0.1) continue
    hoop(q, path[i], tan(i), rad(i / N) * 1.04, 0.045, STEEL)
  }
  // the dorsal fins along the crest
  const fins = Math.round(LENGTH / FIN_PITCH)
  for (let k = 1; k < fins; k++) {
    const i = Math.round((k / fins) * N)
    const p = path[i]
    if (p[1] < G + 0.15) continue
    const t = tan(i)
    const tl = Math.hypot(t[0], t[2]) || 1
    const lean: V = [t[0] / tl, 0, t[2] / tl]
    const side: V = [lean[2], 0, -lean[0]]
    const r = rad(i / N)
    finPlate(q, [p[0], p[1] + r * 0.92, p[2]], lean, side, { h: FIN_H, len: 0.6, thick: 0.05, c: shade(STEEL, 0.92) })
  }
}

export function danseFontaineEmergente(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
