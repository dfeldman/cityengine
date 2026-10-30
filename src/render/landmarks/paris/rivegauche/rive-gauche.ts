import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { block, fitted, hex, hull, noise, panel, prism, pts, rectOn, ribbons, shade, sign, slabOn, wallOn, wound, FIXED, UV, type Rgb } from './common.ts'
import { extrude, palette } from '../palaces/common.ts'

// ---- MK2 Bibliothèque ---------------------------------------------------------------------------------------------------------

const MK2_HX = 17.05
const MK2_HZ = 49.7
const MK2 = pts([-17.0, 47.1, -16.3, 23.1, -14.4, 23.0, -14.3, 16.8, -16.1, 16.8, -13.8, -49.7, 6.8, -49.2, 13.9, 18.0, 11.8, 18.2, 11.4, 23.9, 14.5, 23.6, 17.0, 47.9, 13.0, 49.7, -15.2, 49.0])

/**
 * MK2 Bibliothèque (Jean-Michel Wilmotte, 2003, by memory), the fourteen-screen cinema on the Bibliothèque's esplanade: a long box
 * of pale stone panels under a thin flat roof, and at its north end, facing the esplanade and the Tour des Lettres, the white
 * portico that is all anyone sees of it: a shallow flat canopy on slim white posts, panelled underneath, the logo on the stone
 * behind it with the name in red, a poster screen, a band of glazed doors. All from Commons "MK2 Bibliothèque", "MK2
 * Bibliothèque en aout 2024" and "Mk2 Bibliotheque Paris rear"; the plan is OSM's. Local −z to the esplanade, bearing 322.
 */
export function mk2Bibliotheque(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, MK2_HX, MK2_HZ, (q) => drawMk2(q))
}

function drawMk2(out: MeshBuilder): void {
  const panelStone = hex('#cfc6b4')
  const white = hex('#eeeeea')
  const glass = hex('#2c3a42')
  const r = wound([MK2])[0]
  const H = 15
  hull(out, [r], 0, H, panelStone, hex('#7d7f7c'))
  ribbons(out, [r], [[0, 3.1]], glass, 0.05, 0.25, 3)
  ribbons(out, [r], [[3.1, 3.5], [H - 0.5, H]], white, 0.12, 0, 1)
  // the stone's panel joints, on the long walls; the glazed bays of the flanks at the north end, as the photographs have them
  for (let i = 0; i < r.length; i++) {
    const w = wallOn(out, r[i], r[(i + 1) % r.length])
    if (w.L < 20) continue
    const n = Math.round(w.L / 2.8)
    for (let j = 1; j < n; j++) w.rect((w.L * j) / n - 0.025, (w.L * j) / n + 0.025, 3.5, H - 0.5, shade(panelStone, 0.84), 0.07)
    for (const y of [5.4, 7.4, 9.4, 11.4]) w.rect(0, w.L, y - 0.025, y + 0.025, shade(panelStone, 0.84), 0.07)
  }
  // ---- the portico: the front wall's glazed flank, the canopy on its posts
  const zF = -49.7
  // the wall's green-grey glazed bay at its left
  rectOn(out, '-z', zF, -13.8, -6.5, 3.5, H - 0.5, hex('#7b9a96'), 0.09)
  for (let x = -13.8; x <= -6.5; x += 1.46) rectOn(out, '-z', zF, x - 0.04, x + 0.04, 3.5, H - 0.5, white, 0.12)
  for (let y = 5; y < H - 0.5; y += 1.6) rectOn(out, '-z', zF, -13.8, -6.5, y - 0.03, y + 0.03, white, 0.12)
  const CZ0 = zF - 8.5
  const CZ1 = zF + 3
  const CX0 = -18
  const CX1 = 11
  const CY = 15.7
  // the canopy: thin top, panelled soffit, a white fascia all round
  block(out, CX0, CX1, CZ0, CZ1, CY, CY + 0.7, white)
  for (let z = CZ0 + 0.1; z < CZ1; z += 1.9) block(out, CX0 + 0.1, CX1 - 0.1, z, z + 0.05, CY - 0.05, CY, shade(white, 0.82))
  for (const x of [CX0 + 0.5, (CX0 * 2 + CX1) / 3, (CX0 + CX1 * 2) / 3, CX1 - 0.5]) {
    prism(out, x, CZ0 + 0.6, 0, CY, 0.17, 6, white, FIXED, 0.27)
  }
  for (const z of [CZ0 + 0.6 + (CZ1 - CZ0) * 0.5, CZ1 - 0.5]) {
    prism(out, CX0 + 0.5, z, 0, CY, 0.17, 6, white, FIXED, 0.27)
    prism(out, CX1 - 0.5, z, 0, CY, 0.17, 6, white, FIXED, 0.27)
  }
  // the logo, the name, the poster screen
  sign(out, { type: 'flat', text: 'mk2', h: 2.3, face: 'grotesque', weight: 'bold', colour: hex('#1a1a1c'), lit: 'none' }, { x: -2.5, y: 9.6, z: zF - 0.14, heading: Math.PI })
  sign(out, { type: 'flat', text: 'Bibliothèque', h: 0.75, face: 'roman', colour: hex('#a4262c'), lit: 'none' }, { x: -2.5, y: 7.4, z: zF - 0.14, heading: Math.PI })
  rectOn(out, '-z', zF, 1.6, 6.3, 6.1, 9.1, hex('#8c2d33'), 0.11)
  rectOn(out, '-z', zF, 2, 5.9, 6.4, 8.8, hex('#d4a23a'), 0.13)
  // the row of film posters over the doors, a line of small dark frames
  for (let x = -5; x < 6; x += 1.1) rectOn(out, '-z', zF, x, x + 0.8, 3.7, 4.8, noise(x, 2) > 0.5 ? hex('#ece6d6') : hex('#2b2b2e'), 0.11)
}

// ---- Les Frigos ---------------------------------------------------------------------------------------------------------------

const FRIGOS_HX = 29.1
const FRIGOS_HZ = 42.9
const FRIGOS = pts([29.1, 27.9, 16.3, 42.9, -6.4, 24.1, -8.0, 25.9, -22.0, 14.2, -24.9, 11.9, -24.4, 8.8, -27.3, 8.0, -26.4, 4.2, -29.0, 1.1, -28.2, -2.2, -26.8, -3.5, -23.4, -3.8, 0.5, -42.9, 26.1, -26.9, 15.5, -9.6, 18.1, -7.9, 15.9, -4.3, 13.3, -5.8, 4.4, 8.6, 9.3, 12.8, 10.1, 11.9])

/**
 * Les Frigos (1919–21, the Paris–Orléans railway's cold store, artists' studios since the 1980s), rue des Frigos, in the middle of
 * the new quarter's glass: from Commons "Les Frigos, Paris 31 December 2012" and "Paris - Les Frigos": five storeys of stained raw
 * concrete with small irregular windows, a slate mansard with dormers put on later, the old WATER TOWER at the corner with
 * its collar and its striped pale-and-tan tank, and the walls lettered and painted by forty years of tenants. The plan is OSM's. The
 * graffiti is not any of the real pieces: patches where the photographs have them, in their colours, a line of pale tag
 * lettering. Local x east, z north.
 */
export function lesFrigos(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, FRIGOS_HX, FRIGOS_HZ, (q) => {
    const p = palette('#8c8570', '#4a4f55')
    const stained = hex('#74705e')
    const EAVES = 22
    extrude(q, [FRIGOS], { ...p, trim: shade(p.stone, 0.9), deep: stained, glass: hex('#2c3338') }, {
      eaves: EAVES, bay: 5.2, win: 1.5, rise: 5, inset: 2.4, frames: false, dormers: true,
      storeys: [{ y: 0, h: 2.2 }, { y: 4.4, h: 2 }, { y: 8.8, h: 2 }, { y: 13.2, h: 2 }, { y: 17.6, h: 2 }],
    })
    // ---- stains, tags and paint, on the walls of 6 m or more
    const r = wound([FRIGOS])[0]
    const PAINT: Rgb[] = [hex('#cfc7ad'), hex('#9b3c2e'), hex('#2f4a63'), hex('#c98a2f'), hex('#3f6b4e'), hex('#e6e2d8')]
    for (let i = 0; i < r.length; i++) {
      const w = wallOn(q, r[i], r[(i + 1) % r.length])
      if (w.L < 6) continue
      for (let k = 0; k < Math.round(w.L / 6); k++) {
        const u = noise(i, k) * (w.L - 3) + 1.5
        const y = 0.2 + noise(k, i + 3) * 16
        w.rect(u - 0.5, u + 0.5 + noise(i + k, 1) * 3, y, y + 1 + noise(k, 9) * 5, shade(stained, 0.86 + noise(k, i) * 0.3), 0.06)
      }
      for (let k = 0; k < Math.round(w.L / 9); k++) {
        const u = 1 + noise(i + 7, k) * (w.L - 4)
        const y = 0.3 + noise(k + 4, i) * 3
        w.rect(u, u + 1.4 + noise(k, 3) * 2.2, y, y + 0.9 + noise(i, k + 2) * 1.5, PAINT[(i + k) % PAINT.length], 0.1)
      }
    }
    // ---- the water tower, on OSM's rounded corner
    const TX = -27.2, TZ = -0.8, R = 4.3
    const wall = hex('#7f7966')
    prism(q, TX, TZ, 0, 25, R, 16, wall, FIXED)
    for (const y of [8, 13, 18, 22.6]) q.quad([[TX - 0.5, y, TZ - R - 0.05], [TX + 0.5, y, TZ - R - 0.05], [TX + 0.5, y + 1.3, TZ - R - 0.05], [TX - 0.5, y + 1.3, TZ - R - 0.05]], [0, 0, -1], UV, hex('#2c3338'), FIXED)
    prism(q, TX, TZ, 25, 26.8, R, 16, shade(wall, 0.9), FIXED, R + 1.2)
    for (let k = 0; k < 16; k++) {
      // the tank: its staves striped pale and tan, as the photographs have them
      const a0 = (k / 16) * Math.PI * 2, a1 = ((k + 1) / 16) * Math.PI * 2
      const c = k % 2 ? hex('#d6d2c0') : hex('#a79a78')
      const rr = R + 1.2
      q.quad([[TX + Math.cos(a0) * rr, 26.8, TZ + Math.sin(a0) * rr], [TX + Math.cos(a1) * rr, 26.8, TZ + Math.sin(a1) * rr], [TX + Math.cos(a1) * rr, 31.6, TZ + Math.sin(a1) * rr], [TX + Math.cos(a0) * rr, 31.6, TZ + Math.sin(a0) * rr]],
        [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)], UV, c, FIXED)
    }
    prism(q, TX, TZ, 31.6, 32, R + 1.25, 16, hex('#a79a78'), FIXED, R + 1)
  })
}

// ---- La Halle aux Farines -----------------------------------------------------------------------------------------------------

const FARINES_HX = 78.3
const FARINES_HZ = 16.2

/**
 * La Halle aux Farines (the Grands Moulins' flour store, 1950, by memory Denis Honegger; a university since 2006, rebuilt by Nicolas
 * Michelin), rue Thomas-Mann: a long block of grey ribbed concrete, a grid of piers with square windows and louvred bays, five
 * storeys on each long side, and between them the great barrel vault whose end shows over the roof at each gable as a half-round
 * of pale yellow panes in concrete ribs. Tall dark glazed slots with a big entrance under each in dark red; balconies. From
 * Commons "P1030183 Paris XIII la Halle aux farines", "2024-12-12 Paris - Halle aux Farines", "Halle aux farines Paris". OSM's
 * parts give the two wings (374148831, 374148832), the round-roofed middle (374148834) and the low glass hall at the south-west
 * end (374148833). Local x along the block, −z to the north-west, bearing 326.7.
 */
export function halleAuxFarines(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, FARINES_HX, FARINES_HZ, (q) => drawFarines(q))
}

function drawFarines(out: MeshBuilder): void {
  const concrete = hex('#a8a598')
  const deep = shade(concrete, 0.78)
  const glass = hex('#2b343a')
  const louvre = shade(concrete, 0.66)
  const red = hex('#5b2230')
  const yellow = hex('#d9b95e')
  const EAVES = 21
  const X0 = -64.7, X1 = 78.2
  // ---- the wings and the nave under the vault
  block(out, X0, 58.4, -16.2, -7, 0, EAVES, concrete)
  block(out, 58.4, X1, -8.8, -7, 0, EAVES, concrete)
  block(out, X0, X1, 9, 16.2, 0, EAVES, concrete)
  block(out, X0, X1, -7, 9, 0, EAVES + 0.5, deep)
  // ---- the vault: ribbed, its ends the half-round
  const CZ = 1, HW = 8.2, SPRING = EAVES + 0.5, RISE = 6.5
  const segs = 10
  for (let k = 0; k < segs; k++) {
    const a0 = (k / segs) * Math.PI, a1 = ((k + 1) / segs) * Math.PI
    const Z = (a: number): number => CZ - Math.cos(a) * HW
    const Y = (a: number): number => SPRING + Math.sin(a) * RISE
    panel(out, [[X0, Y(a0), Z(a0)], [X1, Y(a0), Z(a0)], [X1, Y(a1), Z(a1)], [X0, Y(a1), Z(a1)]], [0, SPRING - 2, CZ], k % 2 ? hex('#8f8d82') : hex('#9b998d'))
    for (let i = 0; i <= 24; i++) {
      const x = X0 + ((X1 - X0) * i) / 24
      panel(out, [[x - 0.18, Y(a0) + 0.1, Z(a0)], [x + 0.18, Y(a0) + 0.1, Z(a0)], [x + 0.18, Y(a1) + 0.1, Z(a1)], [x - 0.18, Y(a1) + 0.1, Z(a1)]], [0, SPRING - 2, CZ], shade(concrete, 0.72))
    }
    // the gables: a fan of pale yellow panes, ribs between
    for (const x of [X0, X1]) {
      const d = x === X0 ? -0.1 : 0.1
      panel(out, [[x + d, SPRING, CZ], [x + d, Y(a0), Z(a0)], [x + d, Y(a1), Z(a1)], [x + d, SPRING, CZ]], [0, SPRING, CZ], k % 2 ? yellow : shade(yellow, 0.88))
      out.quad([[x + d * 1.3, SPRING, CZ - 0.09], [x + d * 1.3, SPRING, CZ + 0.09], [x + d * 1.3, Y(a1), Z(a1) + 0.09], [x + d * 1.3, Y(a1), Z(a1) - 0.09]], [Math.sign(d), 0, 0], UV, concrete, FIXED)
    }
  }
  // the gables' arches themselves
  for (const x of [X0, X1]) {
    const d = x === X0 ? -0.15 : 0.15
    for (let k = 0; k < segs; k++) {
      const a0 = (k / segs) * Math.PI, a1 = ((k + 1) / segs) * Math.PI
      const P = (a: number, r: number): [number, number, number] => [x + d, SPRING + Math.sin(a) * RISE * r, CZ - Math.cos(a) * HW * r]
      out.quad([P(a0, 1), P(a1, 1), P(a1, 1.1), P(a0, 1.1)], [Math.sign(d), 0, 0], UV, concrete, FIXED)
    }
  }
  // ---- the long walls: piers every bay, a window and a louvred panel by turns in each storey
  const STOREYS = 5
  const fh = EAVES / STOREYS
  const bays = (f: '-z' | '+z', plane: number, x0: number, x1: number, keep: (x: number) => boolean): void => {
    const n = Math.round((x1 - x0) / 5.2)
    const b = (x1 - x0) / n
    for (let i = 0; i < n; i++) {
      const xm = x0 + b * (i + 0.5)
      const special = !keep(xm)
      if (special) continue
      for (let s = 1; s < STOREYS; s++) {
        const y = s * fh
        const lv = noise(i, s) > 0.62
        rectOn(out, f, plane, xm - 2.05, xm + 2.05, y + 0.65, y + fh - 0.75, lv ? louvre : glass, 0.04)
        if (lv) for (let k = 1; k < 4; k++) rectOn(out, f, plane, xm - 2.05, xm + 2.05, y + 0.65 + k * 0.6, y + 0.65 + k * 0.6 + 0.08, shade(louvre, 1.2), 0.06)
        else rectOn(out, f, plane, xm - 0.04, xm + 0.04, y + 0.65, y + fh - 0.75, deep, 0.06)
      }
      rectOn(out, f, plane, xm - 2, xm + 2, 0.5, fh - 0.6, glass, 0.04)
      slabOn(out, f, plane, xm + b / 2 - 0.3, xm + b / 2 + 0.3, 0, EAVES, 0.26, shade(concrete, 1.04))
    }
    for (let s = 1; s <= STOREYS; s++) slabOn(out, f, plane, x0, x1, s * fh - 0.28, s * fh, 0.14, shade(concrete, 1.03))
  }
  // the tall glazed slots, with the dark red porch under each
  const SLOTS = [-30, 22]
  const slotted = (x: number): boolean => !SLOTS.some((s) => Math.abs(x - s) < 5.3)
  bays('-z', -16.2, X0, 58.4, slotted)
  bays('+z', 16.2, X0, X1, slotted)
  for (const [f, plane] of [['-z', -16.2], ['+z', 16.2]] as const) {
    for (const s of SLOTS) {
      rectOn(out, f, plane, s - 5, s + 5, 0, 5, red, 0.06)
      rectOn(out, f, plane, s - 4.2, s + 4.2, 0, 4.2, hex('#1b1a1c'), 0.08)
      rectOn(out, f, plane, s - 4.4, s + 4.4, 6.2, EAVES - 1.2, glass, 0.06)
      for (let x = -3; x <= 3; x += 1.5) rectOn(out, f, plane, s + x - 0.05, s + x + 0.05, 6.2, EAVES - 1.2, hex('#7a7f7f'), 0.08)
    }
  }
  // the balconies: little dark boxes on the long wall
  for (const x of [-49, -8, 41]) {
    for (const f of ['-z', '+z'] as const) slabOn(out, f, f === '-z' ? -16.2 : 16.2, x, x + 4, 9.2, 10.2, 1.1, hex('#55595a'))
  }
  // the gable walls under the fan: storeys of small windows
  for (const [f, plane] of [['-x', X0], ['+x', X1]] as const) {
    for (let s = 1; s < STOREYS; s++) {
      for (let z = -12; z <= 12; z += 4) rectOn(out, f, plane, z - 1.2, z + 1.2, s * fh + 0.8, s * fh + fh - 0.8, s === 3 && Math.abs(z) < 5 ? yellow : glass, 0.05)
    }
    rectOn(out, f, plane, -8, 8, 0, 4, hex('#2d2a2b'), 0.05)
  }
  // ---- the low glass hall at the south-west end
  block(out, -74.8, X0, -15.7, 15.7, 0, 6.6, hex('#50646c'))
  for (let z = -15; z <= 15; z += 2.5) rectOn(out, '-x', -74.8, z - 0.05, z + 0.05, 0, 6.6, hex('#d0d4d2'), 0.05)
  rectOn(out, '-x', -74.8, -15.7, 15.7, 3.2, 3.3, hex('#d0d4d2'), 0.05)
}

// ---- UGC Ciné Cité Bercy ------------------------------------------------------------------------------------------------------

const UGC_HX = 35.4
const UGC_HZ = 24.4
const UGC = pts([-35.4, -24.3, -15.5, -23.0, -15.5, -19.3, -9.9, -20.4, -9.8, -23.5, 1.4, -23.8, 2.6, -19.6, 7.0, -19.6, 7.1, -23.4, 35.4, -24.4, 35.4, 21.3, 7.1, 20.8, 7.0, 18.5, -5.4, 16.2, -7.8, 20.4, -15.7, 18.7, -15.6, 23.3, -35.4, 24.4])

/**
 * UGC Ciné Cité Bercy (Valode & Pistre, 1998, by memory), the eighteen screens that close the end of the Cour Saint-Émilion: two
 * great windowless wings of dark ribbed metal, and between them, on the Cour's axis, a white steel frame round a tall recess, a wide
 * flight of steps going up into it, a glazed lobby over; either side of that a tower of bright blue mesh carrying a film poster
 * twenty metres high. From Commons "UGC Ciné Cité Bercy in 2022", "Cine Cite Bercy Cinema - Paris 2013", "Bercy village 02" and
 * "Bercy village, Paris August 2009 008", which shows the logo's blue oval. The plan is OSM's. Local −z up the Cour, bearing 40.7.
 */
export function ugcBercy(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, UGC_HX, UGC_HZ, (q) => drawUgc(q))
}

function drawUgc(out: MeshBuilder): void {
  const metal = hex('#3a3a3d')
  const white = hex('#e6e7e4')
  const blue = hex('#1f49a8')
  const glass = hex('#2f3f49')
  const H = 24
  const r = wound([UGC])[0]
  hull(out, [r], 0, H, metal, hex('#55585a'))
  // the ribs of the metal cladding on the long walls: a rib every 1.2 m, a band every 4.5 m
  for (let i = 0; i < r.length; i++) {
    const w = wallOn(out, r[i], r[(i + 1) % r.length])
    if (w.L < 9) continue
    const n = Math.round(w.L / 1.2)
    for (let j = 1; j < n; j++) w.rect((w.L * j) / n - 0.13, (w.L * j) / n + 0.13, 2.4, H - 0.3, j % 2 ? shade(metal, 1.35) : shade(metal, 0.85), 0.06)
    for (let y = 6; y < H; y += 4.5) w.rect(0, w.L, y - 0.05, y + 0.05, shade(metal, 0.7), 0.09)
    w.rect(0, w.L, 0, 2.4, hex('#7c7f80'), 0.05)
    w.rect(0, w.L, H - 0.5, H + 0.3, hex('#6a6d6f'), 0.1)
  }
  // ---- the recess on the Cour's axis: white frame, stair, glazed lobby, a black soffit overhead
  const X0 = -9.6, X1 = 1.2, Z = -19.6
  block(out, X0, X1, -23.5, Z + 1, H - 6.5, H - 0.2, hex('#2d2f31'))
  // the glazed lobby at the top of the steps and the storeys of glass above it
  rectOn(out, '-z', Z, X0, X1, 6.4, H - 7, glass, 0.04)
  for (const y of [9.5, 12.5, 15.5]) rectOn(out, '-z', Z, X0, X1, y - 0.1, y + 0.1, white, 0.08)
  for (let x = X0 + 2.7; x < X1; x += 2.7) rectOn(out, '-z', Z, x - 0.09, x + 0.09, 6.4, H - 7, white, 0.08)
  block(out, X0, X1, -23.4, Z, 6.1, 6.5, white)
  // the steps
  const STEPS = 14
  for (let k = 0; k < STEPS; k++) block(out, X0 + 0.3, X1 - 0.3, -23.4 + (k * 3.8) / STEPS - 3.5, Z + 0.1, (k * 6) / STEPS, ((k + 1) * 6) / STEPS, k % 2 ? hex('#a9abab') : hex('#c6c8c7'))
  // the frame's posts and the white truss across
  for (const x of [X0 - 0.2, X0 + (X1 - X0) / 3, X0 + (2 * (X1 - X0)) / 3, X1 + 0.2]) block(out, x - 0.25, x + 0.25, -24, -23.4, 0, H - 2.5, white)
  block(out, X0 - 0.5, X1 + 0.5, -24.2, -23.2, H - 2.8, H - 2, white)
  // ---- the blue mesh towers either side, each with its poster
  for (const [x0, x1, c] of [[-15.5, -9.9, hex('#d68a3c')], [1.4, 7, hex('#8a3f72')]] as const) {
    block(out, x0, x1, -24.6, -19, 0, H - 1.5, blue)
    for (let x = x0; x <= x1; x += 0.9) rectOn(out, '-z', -24.6, x - 0.03, x + 0.03, 0, H - 1.5, shade(blue, 1.5), 0.04)
    for (let y = 1; y < H - 1.5; y += 1.4) rectOn(out, '-z', -24.6, x0, x1, y - 0.03, y + 0.03, shade(blue, 1.5), 0.04)
    rectOn(out, '-z', -24.6, x0 + 0.5, x1 - 0.5, 5, H - 3, c, 0.07)
    for (let y = 7; y < H - 4; y += 3) rectOn(out, '-z', -24.6, x0 + 0.8, x1 - 0.8, y, y + 1, shade(c, 1.35), 0.09)
  }
  // the oval logo on the blue mesh, by the flank
  const ox = -22, oz = -24.5, oy = 15
  for (let k = 0; k < 14; k++) {
    const a0 = (k / 14) * Math.PI * 2, a1 = ((k + 1) / 14) * Math.PI * 2
    out.quad([[ox, oy, oz - 0.1], [ox + Math.cos(a0) * 5, oy + Math.sin(a0) * 2.8, oz - 0.1], [ox + Math.cos(a1) * 5, oy + Math.sin(a1) * 2.8, oz - 0.1], [ox, oy, oz - 0.1]], [0, 0, -1], UV, hex('#1b3f9e'), FIXED)
  }
  sign(out, { type: 'flat', text: 'UGC CINÉ CITÉ', h: 0.8, face: 'grotesque', weight: 'bold', colour: hex('#f3c23a'), lit: 'self', w: 8 }, { x: ox, y: oy - 0.4, z: oz - 0.14, heading: Math.PI })
}

// ---- Bercy Village: the Cour Saint-Émilion's chais ------------------------------------------------------------------------------

/**
 * The wine warehouses of the Cour Saint-Émilion, the last of Bercy's entrepôts (rebuilt as Bercy Village, 1990s): one chai after
 * another along the old rails, each a long stone shed with its pale rubble GABLE to the Cour, a tall round-headed door in dressed
 * stone with a smaller one each side, a round light in the gable, a brown tile roof running back, and awnings out over the cobbles
 * here and there. From Commons "Cour Saint-Émilion, Paris 7 August 2009", "Paris - 36 Cour Saint-Émilion" and "Bercy village,
 * Paris August 2009 008". OSM has each row as one outline (ways 78271210, 78271293), so the chais' number (one every 12 m) is
 * counted off the photographs and not off the plan. `rear` is OSM's back line along the row. Local −z to the Cour.
 */
function chais(out: MeshBuilder, hx: number, z0: number, rear: (x: number) => number, seed: number): void {
  const stone = hex('#d8cba6')
  const dressed = hex('#e6dcc0')
  const tile = hex('#7c5a48')
  const dark = hex('#2a2a2a')
  const WALL = 5.4
  const RISE = 3.6
  const n = Math.round((2 * hx) / 12)
  const w = (2 * hx) / n
  const AWNING: Rgb[] = [hex('#7a2230'), hex('#e6e0d0'), hex('#2d3e50'), hex('#7a2230'), hex('#cfc7b4')]
  for (let i = 0; i < n; i++) {
    const x0 = -hx + w * i, x1 = x0 + w, xm = (x0 + x1) / 2
    const z1 = rear(xm)
    const eave = 0.25
    const gableEnd = (z: number, sign_: number): void => {
      const d = sign_ < 0 ? -0.01 : 0.01
      out.quad([[x0, 0, z + d], [x1, 0, z + d], [x1, WALL, z + d], [x0, WALL, z + d]], [0, 0, sign_], UV, shade(stone, 0.96 + noise(i, seed) * 0.08), FIXED)
      out.quad([[x0, WALL, z + d], [x1, WALL, z + d], [xm, WALL + RISE, z + d], [xm, WALL + RISE, z + d]], [0, 0, sign_], UV, shade(stone, 0.96 + noise(i, seed + 1) * 0.08), FIXED)
    }
    gableEnd(z0, -1)
    gableEnd(z1, 1)
    // the roof: two slopes running back from the gable, a little proud of it
    const nl = Math.hypot(RISE, w / 2)
    out.quad([[x0 - eave, WALL - 0.2, z0 - 0.3], [xm, WALL + RISE + 0.1, z0 - 0.3], [xm, WALL + RISE + 0.1, z1 + 0.3], [x0 - eave, WALL - 0.2, z1 + 0.3]], [-RISE / nl, (w / 2) / nl, 0], UV, shade(tile, 0.94 + noise(seed, i) * 0.12), FIXED)
    out.quad([[xm, WALL + RISE + 0.1, z0 - 0.3], [x1 + eave, WALL - 0.2, z0 - 0.3], [x1 + eave, WALL - 0.2, z1 + 0.3], [xm, WALL + RISE + 0.1, z1 + 0.3]], [RISE / nl, (w / 2) / nl, 0], UV, shade(tile, 0.94 + noise(i, seed + 2) * 0.12), FIXED)
    // the gable's coping, the party wall's top
    for (const s of [-1, 1]) {
      const xe = s < 0 ? x0 : x1
      out.quad([[xe, WALL, z0 - 0.32], [xm, WALL + RISE, z0 - 0.32], [xm, WALL + RISE + 0.25, z0 - 0.32], [xe, WALL + 0.25, z0 - 0.32]], [0, 0, -1], UV, dressed, FIXED)
    }
    // the door and its neighbours, in dressed stone, the round light over
    const wall = wallOn(out, { x: x0, z: z0 }, { x: x1, z: z0 })
    wall.arch(w / 2, 0, 3.6, 4.5, dressed, 0.03)
    wall.arch(w / 2, 0, 2.8, 4.0, noise(i, 5) > 0.6 ? hex('#3f5a4e') : dark, 0.05)
    for (const s of [-1, 1]) {
      wall.arch(w / 2 + s * 3.7, 0.9, 1.9, 3.1, dressed, 0.03)
      wall.arch(w / 2 + s * 3.7, 1, 1.3, 2.7, dark, 0.05)
    }
    wall.disc(w / 2, WALL + 1.3, 0.62, dressed, 0.03)
    wall.disc(w / 2, WALL + 1.3, 0.42, dark, 0.05)
    // an awning here and there: a shallow pitched canopy out over the cobbles
    if (noise(i, seed + 7) > 0.45) {
      const c = AWNING[Math.floor(noise(seed, i + 3) * AWNING.length) % AWNING.length]
      const zo = z0 - 3.4
      panel(out, [[x0 + 1.2, 3.4, z0 - 0.1], [x1 - 1.2, 3.4, z0 - 0.1], [x1 - 1.2, 2.7, zo], [x0 + 1.2, 2.7, zo]], [xm, 0, z0 + 2], c)
      out.quad([[x0 + 1.2, 2.3, zo], [x1 - 1.2, 2.3, zo], [x1 - 1.2, 2.7, zo], [x0 + 1.2, 2.7, zo]], [0, 0, -1], UV, shade(c, 0.86), FIXED)
      for (const x of [x0 + 1.3, x1 - 1.3]) block(out, x - 0.04, x + 0.04, zo - 0.04, zo + 0.04, 0, 2.7, hex('#3a3a3a'))
    }
  }
}

export function bercyVillageNorth(out: MeshBuilder, fit: Fit): void {
  // OSM way 78271210: the row on the Cour's north-west side
  fitted(out, fit, 108.3, 17.1, (q) => chais(q, 108.3, -17, (x) => (x > 13.7 && x < 21.6 ? -0.7 : x > -41.5 && x < -34.9 ? 0.1 : 15.5), 3))
}

export function bercyVillageSouth(out: MeshBuilder, fit: Fit): void {
  // OSM way 78271293: the row on the Cour's south-east side
  fitted(out, fit, 98, 22.4, (q) => chais(q, 98, -22.4, (x) => (x > 51.1 ? 4.6 : x > -11 ? -2.6 : 9.6 + ((-11 - x) * 12.8) / 78), 11))
}

