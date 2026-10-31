import type { MeshBuilder } from '../../buildings.ts'
import { box, prism } from '../../models.ts'
import { block, dome, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { church } from './monuments/churches.ts'
import { boxOn, chevet, classicalDoor, edgeFrame, engaged, entablature, faceFrame, flank, gable, niche, pedimentFront, traceryWindow, volute, statue } from './monuments/gothic.ts'

/**
 * Église Saint-Paul-Saint-Louis, the Jesuit church on Rue Saint-Antoine (Derand and Martellange, 1627–41): a tall frontispiece
 * of three superimposed orders, paired Corinthian columns either side of a central bay, niches and statues between them,
 * each tier narrower, the top one under a pediment; and behind it the first great dome in Paris, on a drum over the crossing,
 * with a lantern. The facade stands ON the footprint's street edge (local −z), so the name plate is on it.
 *
 * Batch 5 (2026-10-31): the tiers' heights and the dome are the first attempt's; the rest is the Gothic kit's dress, its
 * classical half. A front of paired engaged columns reads as a front at any distance. From memory: street view to confirm the niches.
 */
export function saintPaul(out: MeshBuilder, fit: Fit): void {
  const p = church('#a89f8c', '#3f464b')
  const lead = p.lead
  const door: [number, number, number] = [0.12, 0.08, 0.055]
  const front = -fit.hz
  const back = fit.hz
  const W = Math.min(2 * fit.hx, 30)
  const naveW = Math.min(W * 0.62, 16)
  // the nave and its aisles behind the facade
  block(out, -naveW / 2, naveW / 2, front + 1.5, back - 2, 0, 22, p.stone)
  roof(out, -naveW / 2 - 0.4, naveW / 2 + 0.4, front + 1.5, back - 2, 22, 7, naveW / 2 + 0.4, 0, p.slate)
  block(out, -0.07, 0.07, front + 1.5, back - 2, 28.95, 29.3, lead)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    const x0 = s < 0 ? -W / 2 : naveW / 2
    const x1 = s < 0 ? -naveW / 2 : W / 2
    block(out, x0, x1, front + 1.5, back - 4, 0, 13, p.stone)
    out.quad([[s * (W / 2 + 0.3), 13, front + 1.5], [s * (W / 2 + 0.3), 13, back - 4], [s * naveW / 2, 16, back - 4], [s * naveW / 2, 16, front + 1.5]], [s * 0.3, 0.95, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, 0)
    flank(faceFrame(out, f, s * W / 2), front + 6, back - 6, 5, { stone: p.stone, glass: p.glass, y0: 4.6, h: 6.4, head: 'round', lights: 1, share: 0.34, far: false, plinth: 1, cornice: 13, buttress: { y1: 12.4, d: 0.5, w: 0.8, stages: 1 } })
    flank(faceFrame(out, f, s * naveW / 2), front + 6, back - 6, 5, { stone: p.stone, glass: p.glass, y0: 16.6, h: 4.6, head: 'round', lights: 2, share: 0.42, cornice: 22 })
  }
  chevet(out, 0, back - 5.6, naveW / 2, 0, 22, 29, p.stone, p.slate, p.glass, { n: 5, win: { y0: 13, h: 7, head: 'round', lights: 1 } })

  // the frontispiece: three tiers, each set back a little and narrower
  const tiers: [number, number, number, number, 'corinthian'][] = [[0, 16, W, 0, 'corinthian'], [17.1, 30, W * 0.72, 0.4, 'corinthian'], [31.1, 40, W * 0.46, 0.8, 'corinthian']]
  // (the step up to it, the width of the first tier's columns)
  for (let k = 0; k < 3; k++) block(out, -W / 2 + 1 + k * 0.25, W / 2 - 1 - k * 0.25, front - 1.9 + k * 0.6, front, 0, 0.17 * (k + 1), p.trim)
  tiers.forEach(([y0, y1, w, setBack, order], t) => {
    const z = front + setBack
    block(out, -w / 2, w / 2, z, z + 3, y0, y1 + 1.1, p.stone)
    block(out, -w / 2 + 0.1, w / 2 - 0.1, z + 1, z + 3, y1 + 1.1, y1 + 1.16, p.lead)
    const fr = faceFrame(out, '-z', z)
    const r = t === 0 ? 0.56 : t === 1 ? 0.46 : 0.36
    // paired columns either side of the central bay, and at the ends; a statue in a niche in the bays between
    const inner = w * 0.14
    for (const s of [-1, 1]) {
      for (const u of [inner, inner + r * 3.1, w / 2 - r * 3.6, w / 2 - r * 1.3]) {
        if (t === 2 && u > w / 2 - r * 2) continue
        engaged(fr, s * u, y0 + (t ? 0 : 0.5), y1, r, p.trim, order)
      }
      const nu = (inner + r * 3.1 + w / 2 - r * 3.6) / 2
      if (t < 2) {
        niche(fr, s * nu, y0 + 2.4, t ? 1.3 : 1.7, t ? 4.2 : 5.4, 0.06, p.stone, p.dark)
        statue(out, s * nu, y0 + 2.5, z - 0.1, t ? 3.2 : 4, shade(p.stone, 1.12))
        boxOn(fr, s * nu - 1.4, s * nu + 1.4, y1 - 3, y1 - 2.7, 0, 0.14, p.trim)
      } else {
        statue(out, s * (w / 2 - 0.2), y1 + 1.15, z + 0.2, 2.5, shade(p.stone, 1.12))
      }
    }
    entablature(fr, -w / 2, w / 2, y1, 1.1, 0.7, p.trim)
    // the central opening: the great door on the ground tier, a tall window above
    if (t === 0) {
      classicalDoor(fr, 0, 0.5, 4.2, 9.4, p.trim, door, { head: 'round' })
      pedimentFront(fr, -3.3, 3.3, 11.1, 1.3, 0.5, p.trim, { curved: true })
      traceryWindow(fr, 0, 12.7, 2.4, 2.6, { stone: p.trim, glass: p.dark, head: 'round', lights: 1, far: true })
      for (const s of [-1, 1]) classicalDoor(fr, s * w * 0.33, 0.5, 2.2, 5.6, p.trim, door, { head: 'flat', pediment: true })
    } else {
      traceryWindow(fr, 0, y0 + 1.6, 3.2, (y1 - y0) * 0.72, { stone: p.trim, glass: p.glass, head: 'round', lights: 2, far: t === 2 })
    }
    // the scrolls that step each upper tier down to the one below
    if (t > 0) for (const s of [-1, 1]) volute(fr, s * (tiers[t - 1][2] / 2 - 0.6), y0, s * (w / 2 + 0.2), y0 + (t === 1 ? 6.4 : 4.6), 0.4, p.trim)
  })
  const top = faceFrame(out, '-z', front + 0.8)
  pedimentFront(top, -W * 0.25, W * 0.25, 41.1, 3.8, 0.75, p.trim, { relief: 5 })
  gable(faceFrame(out, '-z', front + 3.6), 0, 30.5, naveW + 1, 0.2, p.stone, { finial: 0 })
  prism(out, 0, front + 1.3, 44.9, 47.2, 0.1, 4, p.gold, 0, 0.1)
  box(out, 0, 46.4, front + 1.3, 0.55, 0.07, 0.07, p.gold, 0)

  // the dome over the crossing, well back from the street, rising behind the facade: a drum of windows between paired pilasters
  const cz = front + 1.5 + (back - front) * 0.58
  block(out, -9.8, 9.8, cz - 9.8, cz + 9.8, 22, 23.4, p.stone)
  prism(out, 0, cz, 22, 32, 9, 16, p.stone)
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * Math.PI * 2
    const a1 = ((i + 1) / 16) * Math.PI * 2
    if (i % 2 === 0) {
      const e = edgeFrame(out, { x: Math.sin(a0) * 9, z: cz + Math.cos(a0) * 9 }, { x: Math.sin(a1) * 9, z: cz + Math.cos(a1) * 9 }, { x: 0, z: cz })
      traceryWindow(e, e.L / 2, 24.6, 2.3, 5.6, { stone: p.trim, glass: p.glass, head: 'round', lights: 1, far: true })
    } else {
      box(out, Math.sin((a0 + a1) / 2) * 8.95, 27.3, cz + Math.cos((a0 + a1) / 2) * 8.95, 0.42, 4.5, 0.42, shade(p.stone, 1.05), 0)
    }
  }
  prism(out, 0, cz, 32, 32.6, 9.7, 16, shade(p.stone, 1.03), 0)
  dome(out, 0, cz, 32.6, 9.2, 15, lead, 16, shade(lead, 1.25))
  prism(out, 0, cz, 47, 51.5, 1.8, 8, p.stone)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    box(out, Math.sin(a) * 1.76, 49.1, cz + Math.cos(a) * 1.76, 0.42, 1.5, 0.42, p.dark, 0)
  }
  dome(out, 0, cz, 51.5, 1.9, 1.6, lead, 8)
  prism(out, 0, cz, 53, 55.5, 0.1, 4, p.gold, 0, 0.1)
  box(out, 0, 54.6, cz, 0.6, 0.08, 0.08, p.gold, 0)
}
