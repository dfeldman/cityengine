/**
 * THE PAINTED LADIES, 710–722 Steiner Street (1892–96, Matthew Kavanaugh): the row of Queen Anne houses facing
 * Alamo Square with the downtown skyline behind them — the most photographed houses in the city. Each is a narrow
 * front under one steep gable, a two-storey bay to one side and the stoop and door to the other, all of it picked out
 * in white and a darker accent over a pastel body. The colours are OSM's own `building:colour`, lifted a little —
 * the city's Victorian style drew them as seven anonymous flats.
 *
 * Fit frame: x across the lot, +z the street front (`"front": "street"`).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const WHITE: Rgb = [0.93, 0.92, 0.88]
const GLASS: Rgb = [0.16, 0.19, 0.22]
const ROOF: Rgb = [0.3, 0.3, 0.31]

const hex = (h: string): Rgb => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]
/** pull a colour away from grey: OSM's are washed out next to the houses themselves */
const lift = (c: Rgb, k = 1.5): Rgb => { const m = (c[0] + c[1] + c[2]) / 3; return c.map((v) => Math.max(0, Math.min(1, m + (v - m) * k))) as Rgb }

function lady(body: Rgb, accent: Rgb, bayLeft: boolean) {
  return (out: MeshBuilder, fit: Fit): void => {
    const clap = surfaceTag('clapboard')
    const hx = Math.min(fit.hx, 4.2), hz = fit.hz
    const E = 9                       // the eaves, over a raised basement
    const G = 4.6                     // the gable's rise
    const f = hz                      // the front face
    // the body, and the raised basement in the accent
    box(out, 0, E / 2, 0, hx, E / 2, hz, body, clap)
    box(out, 0, 0.9, f - 0.02, hx + 0.03, 0.9, 0.05, accent, 0)
    // the roof: a gable running back from the front, its triangular end over the street
    const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    for (const s of [-1, 1]) out.quad(s > 0
      ? [[0, E + G, -hz], [0, E + G, f + 0.3], [hx + 0.3, E, f + 0.3], [hx + 0.3, E, -hz]]
      : [[-hx - 0.3, E, -hz], [-hx - 0.3, E, f + 0.3], [0, E + G, f + 0.3], [0, E + G, -hz]], [s * G, hx, 0], uv, ROOF, 0)
    // the gable end: the triangle in the body colour, framed in white, a small window in it
    out.quad([[-hx, E, f + 0.25], [hx, E, f + 0.25], [0, E + G - 0.1, f + 0.25], [0, E + G - 0.1, f + 0.25]], [0, 0, 1], uv, body, clap)
    box(out, 0, E + 0.12, f + 0.3, hx + 0.35, 0.14, 0.12, WHITE, 0)
    for (const s of [-1, 1]) {
      const a = Math.atan2(G, hx)
      const L = Math.hypot(hx, G) / 2
      // the bargeboards, as short steps up the rake (a box cannot lean)
      for (let k = 0; k < 6; k++) {
        const t = (k + 0.5) / 6
        box(out, s * hx * (1 - t), E + G * t, f + 0.32, L / 6 * Math.cos(a) + 0.08, 0.12, 0.08, WHITE, 0)
      }
    }
    box(out, 0, E + G * 0.42, f + 0.3, 0.55, 0.6, 0.06, GLASS, 0)
    box(out, 0, E + G * 0.42, f + 0.33, 0.7, 0.75, 0.03, accent, 0)
    // the bay: two storeys, proud of the front on one side, a window in each face and the cornice over it
    const bx = (bayLeft ? -1 : 1) * hx * 0.45
    const bw = hx * 0.48
    box(out, bx, 5.05, f + 0.55, bw, 3.25, 0.55, body, clap)
    for (const y of [3.4, 6.6]) {
      box(out, bx, y, f + 1.12, bw * 0.62, 1.05, 0.04, GLASS, 0)
      box(out, bx, y + 1.2, f + 1.13, bw * 0.75, 0.12, 0.05, WHITE, 0)
      box(out, bx, y - 1.18, f + 1.13, bw * 0.75, 0.08, 0.05, WHITE, 0)
    }
    box(out, bx, 8.4, f + 0.65, bw + 0.15, 0.2, 0.68, accent, 0)
    box(out, bx, 8.65, f + 0.7, bw + 0.25, 0.08, 0.75, WHITE, 0)
    // the other side: the door at the top of the stoop, a tall window over it
    const dx = -bx * 1.05
    box(out, dx, 2.9, f + 0.04, 0.6, 1.1, 0.04, accent, 0)
    box(out, dx, 4.15, f + 0.06, 0.75, 0.12, 0.06, WHITE, 0)
    box(out, dx, 6.6, f + 0.04, 0.55, 1.0, 0.04, GLASS, 0)
    box(out, dx, 7.75, f + 0.06, 0.7, 0.12, 0.06, WHITE, 0)
    for (let k = 0; k < 8; k++) box(out, dx, 0.11 + k * 0.22, f + 0.3 + (8 - k) * 0.28, 0.75, 0.11 + k * 0.22, 0.14, WHITE, 0)
    // corner boards
    for (const s of [-1, 1]) box(out, s * (hx - 0.06), E / 2, f + 0.02, 0.1, E / 2, 0.06, WHITE, 0)
  }
}

export const PAINTED_LADIES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  paintedLady710: lady(lift(hex('#c9b085')), [0.42, 0.16, 0.18], true),
  paintedLady712: lady(lift(hex('#cad8d5'), 2.2), [0.16, 0.36, 0.42], false),
  paintedLady714: lady(lift(hex('#dadbde'), 2.2), [0.5, 0.26, 0.4], true),
  paintedLady716: lady(lift(hex('#e4c78b')), [0.2, 0.4, 0.32], false),
  paintedLady718: lady(lift(hex('#d4ceb0'), 2.0), [0.56, 0.2, 0.16], true),
  paintedLady720: lady(lift(hex('#d5c09d'), 1.8), [0.18, 0.28, 0.5], false),
  paintedLady722: lady(lift(hex('#96a55b'), 1.2), [0.46, 0.22, 0.2], true),
}
