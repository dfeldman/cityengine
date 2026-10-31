import type { MeshBuilder } from '../../../buildings.ts'
import { box } from '../../../models.ts'
import { block, classicalColumn, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { balustrade, rectOn } from '../palaces/common.ts'
import { FIXED, graded } from './common.ts'
import { church } from './churches.ts'
import { chevet, classicalDoor, faceFrame, flank, louvred, pedimentFront, pilaster, traceryWindow, statue } from './gothic.ts'

/*
 * SAINT-VINCENT-DE-PAUL (Lepère and Hittorff, 1824–44), high over the Place Franz-Liszt at the top of its stepped and
 * curving RAMPS: a Roman basilica in front of which Hittorff set a Greek temple front — the Ionic PORTICO of six
 * columns and the pediment carved with the saint's glory, the enamelled lava panels under it, the balustrade with the
 * four Evangelists over it — between TWIN SQUARE TOWERS of 45 m (OSM's parts 653147917/8), each with its clock and a
 * belfry of tall paired openings under a balustrade. Behind, the long nave under a low-pitched roof, its aisles, the
 * apse. (The ramps themselves are OSM's steps and footways, drawn by the city.)
 *
 * In the city OSM's parts gave the towers and body as plain windowed blocks (2026-10-29); the model replaces the
 * outline (way 63197162) and its nine parts. Frame: −z the front toward the place (bearing 190.3). Batch 5 (2026-10-31): its windows, doors and belfries on the Gothic kit, its pediment's Glory, a stone that doesn't blow out.
 */
const HX = 18.1
const HZ = 47.1

export function saintVincentDePaul(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => svdp(q))
}

function svdp(out: MeshBuilder): void {
  const p = church('#a89f8c', '#454c50')
  // the terrace the church stands on, the steps up to the portico
  const t = 2.4
  block(out, -18.1, 18.1, -40, 28, 0, t, p.deep)
  for (let k = 0; k < 8; k++) block(out, -10.8 + k * 0.1, 10.8 - k * 0.1, -47.1 + k * 0.45, -40, 0, t * (k + 1) / 8, k % 2 ? p.trim : p.stone)
  // the aisles to 17 and the nave to 27, under low Roman roofs; their windows
  block(out, -18.1, 18.1, -27, 28, t, 17, p.stone)
  roof(out, -18.4, 18.4, -27, 28.2, 17, 2.2, 7.2, 0.01, p.slate)
  block(out, -11.4, 11.4, -27, 34.5, t, 27, p.stone)
  roof(out, -11.8, 11.8, -27, 34.7, 27, 4.0, 11.8, 0.01, p.slate)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    // the aisles' pilastered bays, on their terrace; the high round-headed clerestory (Roman, not Gothic: no tracery but the glazing bars)
    const aisle = faceFrame(out, f, s * 18.1)
    flank(aisle, -25.4, 27.8, 11, { stone: p.stone, glass: p.glass, y0: 6, h: 6.6, head: 'round', lights: 1, share: 0.48, far: false, cornice: 17 })
    for (let i = 0; i <= 11; i++) pilaster(aisle, -25.4 + (53.2 * i) / 11, t, 15.6, 0.7, 0.28, p.stone)
    const nave = faceFrame(out, f, s * 11.4)
    flank(nave, -25.4, 33.8, 12, { stone: p.stone, glass: p.glass, y0: 19.2, h: 5.8, head: 'round', lights: 1, share: 0.5, cornice: 27 })
  }
  // the apse
  chevet(out, 0, 34.5, 7.3, t, 18, 22, p.stone, p.slate, p.glass, { n: 7, win: { y0: 8, h: 7, head: 'round', lights: 1 } })
  block(out, -7.3, 7.3, 28, 34.6, t, 18, p.stone)

  // THE FRONT: the wall between the towers to 27.6, the portico of six Ionic columns, the pediment, the attic's
  // balustrade with the four Evangelists, the enamelled panels behind the columns
  const zf = -34.0
  block(out, -11.4, 11.4, zf, -26.8, t, 27.6, p.stone)
  const zp = -46.0
  for (let i = 0; i < 6; i++) {
    const x = -8.75 + i * 3.5
    classicalColumn(out, x, zp + 0.8, t, 16.2, 0.62, p.stone, { order: 'ionic', tier: 'mid', heading: Math.PI })
    if (i === 0 || i === 5) classicalColumn(out, x, zp + 5.6, t, 16.2, 0.62, p.stone, { order: 'ionic', tier: 'mid', heading: Math.PI })
  }
  block(out, -10.4, 10.4, zp - 0.3, zf, 16.2, 18.4, p.trim)
  roof(out, -10.6, 10.6, zp - 0.3, zf, 18.4, 3.8, 10.6, 0.01, p.slate)
  const lava = [hex('#5d6f86'), hex('#8f5f4c'), hex('#a8905c'), hex('#62786a')]
  for (let i = 0; i < 4; i++) rectOn(out, '-z', zf, -7.5 + i * 3.9, -4.6 + i * 3.9, 6.0, 13.5, shade(lava[i], 0.82), 0.06)
  const wall = faceFrame(out, '-z', zf)
  classicalDoor(wall, 0, t, 3, 3.4, p.trim, [0.1, 0.1, 0.08], { head: 'flat', pediment: true })
  for (const s of [-1, 1]) classicalDoor(wall, s * 6.4, t, 2, 3.2, p.trim, [0.1, 0.1, 0.08], { head: 'flat' })
  traceryWindow(wall, 0, 18.4, 3.4, 6.8, { stone: p.trim, glass: p.glass, head: 'round', lights: 3, far: true })
  // the frieze's words and the pediment's Glory of Saint Vincent, on its column-front
  pedimentFront(faceFrame(out, '-z', zp - 0.3), -10.6, 10.6, 18.4, 3.8, 0.75, p.trim, { relief: 13 })
  balustrade(out, -11.4, 11.4, zf, zf + 1.4, 27.6, p, { sides: ['-z'], h: 1.0 })
  for (const x of [-6, -2, 2, 6]) statue(out, x, 27.6, zf + 0.6, 2.6, p.trim)

  // THE TOWERS: square to 45, a cornice at the portico's height, the clock stage, the belfry's paired openings, the
  // balustraded top
  for (const s of [-1, 1]) {
    const tx = s * 14.75
    const tz = -30.45
    block(out, tx - 3.4, tx + 3.4, tz - 3.6, tz + 3.6, t, 43.6, p.stone)
    for (const y of [18.0, 27.0, 34.2]) block(out, tx - 3.7, tx + 3.7, tz - 3.9, tz + 3.9, y, y + 0.9, p.trim)
    for (const f of ['-z', s < 0 ? '-x' : '+x', '+z'] as const) {
      const plane = f === '-z' ? tz - 3.6 : f === '+z' ? tz + 3.6 : tx + s * 3.4
      const u = f === '-z' || f === '+z' ? tx : tz
      // the clock and the belfry's two tall openings
      box(out, f === '-z' || f === '+z' ? u : plane + s * 0.05, 30.8, f === '-z' ? plane - 0.05 : f === '+z' ? plane + 0.05 : u,
        f === '-z' || f === '+z' ? 1.15 : 0.04, 1.15, f === '-z' || f === '+z' ? 0.04 : 1.15, p.trim, FIXED)
      box(out, f === '-z' || f === '+z' ? u : plane + s * 0.08, 30.8, f === '-z' ? plane - 0.08 : f === '+z' ? plane + 0.08 : u,
        f === '-z' || f === '+z' ? 0.8 : 0.04, 0.8, f === '-z' || f === '+z' ? 0.04 : 0.8, p.dark, FIXED)
      const fr = faceFrame(out, f, plane)
      for (const d of [-1.3, 1.3]) louvred(fr, u + d, 35.4, 1.5, 6.6, p.trim, p.dark, { head: 'round', lights: 1, slats: 6 })
      traceryWindow(fr, u, 20.6, 1.5, 4.6, { stone: p.trim, glass: p.glass, head: 'round', lights: 1, far: true })
    }
    block(out, tx - 3.8, tx + 3.8, tz - 4.0, tz + 4.0, 43.6, 44.4, p.trim)
    balustrade(out, tx - 3.6, tx + 3.6, tz - 3.8, tz + 3.8, 44.4, p, { h: 0.8 })
  }
}
