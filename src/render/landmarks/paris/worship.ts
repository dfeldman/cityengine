import type { MeshBuilder } from '../../buildings.ts'
import { box, prism } from '../../models.ts'
import { capPolygon } from '../../buildings.ts'
import { archedPane, block, hex, pane, roof, shade } from '../kit.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Fit } from '../fit.ts'

// Places of worship that want their own builder, one exported builder per building (sections below).
// Manifest entries live in public/landmarks/paris/worship.json (included from paris.json).

// ───────────────────────────── Centre européen du judaïsme (way/356914669), bd de Reims ─────────────────────────────
// Atelier Emmanuel Barrois, 2022. Read off Google Images / Pavillon de l'Arsenal / Chroniques d'architecture photos
// (2026-11-04): a white pale-concrete block, three storeys of sanctuary under a deep parapet; the upper two thirds are
// ranks of tall narrow slits with gilded-brass fins; a recessed corner entrance under a heavy canopy with a brass door;
// the sanctuary roof is flat with a lower stepped annex behind. Local −z is the street front.
const CEJ_H = 14.5           // parapet height of the main block
const CEJ_ANNEX_H = 9.7      // the lower rear volume
const CEJ_INSET = 0.6        // wall inset from the fitted footprint
const CEJ_SLAT_Y0 = 5.2      // where the gilded slit ranks start
const CEJ_SLAT_PITCH = 1.55  // slit spacing along a wall
const CEJ_SLAT_W = 0.62      // slit width
const CEJ_PARAPET = 1.0      // blank parapet above the slits
const CEJ_FRONT_FRAC = 0.62  // share of the depth the tall block takes at the front
const CEJ_DOOR_W = 3.2       // the brass entrance door
const CEJ_CANOPY = 1.6       // canopy projection

export function centreEuropeenJudaisme(out: MeshBuilder, fit: Fit): void {
  const concrete = hex('#d4d2cb'), plinth = hex('#b9b7b0'), gold = hex('#c79b45'), glass = hex('#4a3d22'), brass = hex('#a8803a')
  const CON = surfaceTag('concrete')
  const x0 = -fit.hx + CEJ_INSET, x1 = fit.hx - CEJ_INSET, z0 = -fit.hz + CEJ_INSET, z1 = fit.hz - CEJ_INSET
  const zs = z0 + CEJ_FRONT_FRAC * (z1 - z0)         // front block / rear annex split
  block2(out, x0, x1, z0, zs, 0, CEJ_H, concrete, CON)
  block2(out, x0 - 0.05, x1 + 0.05, z0 - 0.05, zs + 0.05, 0, 0.7, plinth, CON)
  block2(out, x0 - 0.1, x1 + 0.1, z0 - 0.1, zs + 0.1, CEJ_H - CEJ_PARAPET, CEJ_H, shade(concrete, 0.95), CON)
  block2(out, x0, x1, zs, z1, 0, CEJ_ANNEX_H, shade(concrete, 0.97), CON)
  roof(out, x0, x1, zs, z1, CEJ_ANNEX_H, 0.3, 0.2, 0.2, plinth)

  const top = CEJ_H - CEJ_PARAPET - 0.6
  const slit = (face: '-z' | '+z' | '-x' | '+x', plane: number, t: number, y0: number, y1: number): void => {
    pane(out, face, plane, t, y0, CEJ_SLAT_W, y1 - y0, glass, 0.04)
    pane(out, face, plane, t - CEJ_SLAT_W * 0.28, y0, CEJ_SLAT_W * 0.16, y1 - y0, gold, 0.1)
    pane(out, face, plane, t + CEJ_SLAT_W * 0.28, y0, CEJ_SLAT_W * 0.16, y1 - y0, gold, 0.1)
  }
  // slit ranks on the street front (leaving the corner entrance bay free) and on both flanks of the tall block
  const doorX = x1 - 5.5
  const nf = Math.floor((x1 - x0 - 2) / CEJ_SLAT_PITCH)
  for (let i = 0; i < nf; i++) {
    const t = x0 + 1 + (i + 0.5) * ((x1 - x0 - 2) / nf)
    if (Math.abs(t - doorX) < CEJ_DOOR_W * 0.9) slit('-z', z0 - 0.02, t, CEJ_H - 4.6, top)  // short slits over the door
    else slit('-z', z0 - 0.02, t, CEJ_SLAT_Y0, top)
  }
  const ns = Math.floor((zs - z0 - 2) / CEJ_SLAT_PITCH)
  for (let i = 0; i < ns; i++) {
    const t = z0 + 1 + (i + 0.5) * ((zs - z0 - 2) / ns)
    slit('-x', x0 - 0.02, t, CEJ_SLAT_Y0, top)
    slit('+x', x1 + 0.02, t, CEJ_SLAT_Y0, top)
  }
  // the entrance: a dark recess, brass door, the deep canopy and its gilded name band
  block2(out, doorX - CEJ_DOOR_W * 0.75, doorX + CEJ_DOOR_W * 0.75, z0 - 0.06, z0 + 0.02, 0, 4.2, shade(concrete, 0.55), CON)
  pane(out, '-z', z0 - 0.1, doorX, 0, CEJ_DOOR_W, 3.2, brass, 0.05)
  for (let k = -3; k <= 3; k++) pane(out, '-z', z0 - 0.16, doorX + k * CEJ_DOOR_W / 8, 0, 0.06, 3.2, shade(brass, 0.7), 0.05)
  block2(out, doorX - CEJ_DOOR_W * 0.9, doorX + CEJ_DOOR_W * 0.9, z0 - CEJ_CANOPY, z0, 4.2, 4.9, concrete, CON)
  pane(out, '-z', z0 - CEJ_CANOPY - 0.02, doorX, 4.35, CEJ_DOOR_W * 1.6, 0.35, gold, 0.03)
  // low pale seat blocks on the forecourt
  for (const t of [doorX - 4.5, doorX + 4.2]) block2(out, t - 1.1, t + 1.1, z0 - 3.2, z0 - 1.9, 0, 0.5, hex('#e2e0da'), CON)
}

// ───────────────────────────── Cathédrale Saint-Étienne (way/79232285), rue Georges-Bizet ─────────────────────────────
// Greek Orthodox cathedral (1895, Byzantine-Romanesque), squeezed between buildings. Read off the owner's street photo
// docs/landmarks/refs/worship/saint-etienne-street-front.webp (2026-11-04): a buff-stone gabled front banded with pale
// brick; three tall round-arched ground windows under red-and-white brick arches; a strong cornice between levels; a
// three-light stained-glass window under a polychrome arch; a row of small arched openings along the gable; lower side
// wings with one small arched window and a corbelled cornice each. Behind the front only a plain nave under a slate
// gable and a lower rear block (the flanks are hidden by neighbours). Local −z is the street front (bearing measured
// off the footprint's long street edge, 46°). Brick fields carry the brick surface tag, stone the ashlar tag.
const SE_WING_FRAC = 0.2     // share of the front width each side wing takes
const SE_WING_H = 9.6        // wing eaves height
const SE_TIER_H = 7.4        // ground tier / first cornice height
const SE_EAVES = 12.6        // gable eaves height
const SE_RIDGE = 18.0        // ridge height (OSM says 18.3 with the finial)
const SE_REAR_H = 10.5       // the lower rear block
const SE_REAR_FRAC = 0.62    // depth share where the rear block starts
const SE_INSET = 0.25        // walls inset from the footprint
const SE_WIN_W = 1.55        // ground window width
const SE_WIN_H = 5.4         // ground window height
const SE_WIN_Y = 0.9         // ground window sill
const SE_ROOF_RISE = 3.6     // rise of the nave roof

export function cathedraleSaintEtienne(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#c8a974'), pale = hex('#dccfa9'), red = hex('#b4573a'), dark = hex('#2b241d'), glass = hex('#2e4672'),
    slate = hex('#5a5e66'), lead = hex('#6e7078')
  const ASH = surfaceTag('ashlar'), BRK = surfaceTag('brick')
  const z0 = -fit.hz
  // the footprint's x extent at a depth, from its ring (the box round it is looser than the building)
  const ring = fit.ring
  const xAt = (z: number): [number, number] => {
    if (!ring) return [-fit.hx, fit.hx]
    let lo = Infinity, hi = -Infinity
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i]!, b = ring[(i + 1) % ring.length]!
      if ((a.z - z) * (b.z - z) > 0 || a.z === b.z) continue
      const x = a.x + ((z - a.z) / (b.z - a.z)) * (b.x - a.x)
      lo = Math.min(lo, x); hi = Math.max(hi, x)
    }
    return lo > hi ? [-fit.hx, fit.hx] : [lo, hi]
  }
  const span = (za: number, zb: number): [number, number] => {
    let lo = -Infinity, hi = Infinity
    for (let k = 0; k <= 6; k++) { const [l, h] = xAt(za + ((zb - za) * k) / 6); lo = Math.max(lo, l); hi = Math.min(hi, h) }
    return [lo + SE_INSET, hi - SE_INSET]
  }
  const zEnd = fit.hz - SE_INSET, zRear = z0 + SE_REAR_FRAC * (zEnd - z0)
  const [fl, fr] = span(z0 + 0.4, z0 + 1.2)                 // the front width
  const W = fr - fl, wing = W * SE_WING_FRAC
  const cl = fl + wing, cr = fr - wing, cx = (cl + cr) / 2, Wc = cr - cl
  const zf = z0 + SE_INSET                                  // the front plane
  const body = (x0: number, x1: number, za: number, zb: number, y1: number, tag: number): void => block2(out, x0, x1, za, zb, 0, y1, stone, tag)

  // central gable block, wings, nave behind and the lower rear block
  body(cl, cr, zf, zf + 6, SE_EAVES, ASH)
  const [nl, nr] = span(zf + 5, zRear)
  body(nl, nr, zf + 5, zRear, SE_EAVES, ASH)
  roof(out, nl, nr, zf + 5, zRear, SE_EAVES, SE_ROOF_RISE, (nr - nl) / 2, 0, slate)
  roof(out, cl, cr, zf, zf + 5.2, SE_EAVES, SE_RIDGE - SE_EAVES, Wc / 2, 0, slate)   // the gable's own ridge (front is the gable face)
  const [rl, rr] = span(zRear - 1, zEnd)
  body(rl, rr, zRear - 1, zEnd, SE_REAR_H, ASH)
  roof(out, rl, rr, zRear - 1, zEnd, SE_REAR_H, 1.6, 0.5, 0.5, lead)
  for (const [x0, x1] of [[fl, cl], [cr, fr]] as [number, number][]) {
    const [a, b] = span(zf, zf + 8)
    body(Math.max(x0, a), Math.min(x1, b), zf, zf + 8, SE_WING_H, ASH)
    roof(out, Math.max(x0, a), Math.min(x1, b), zf, zf + 8, SE_WING_H, 1.2, 0.4, 0.4, lead)
  }

  // cornice bands: the strong one across the whole front at the tier line, a lighter one on each wing and the eaves
  const band = (x0: number, x1: number, y: number, h: number, out2 = 0.35): void => block2(out, x0 - 0.05, x1 + 0.05, zf - out2, zf, y, y + h, shade(stone, 1.05), ASH)
  band(fl, fr, SE_TIER_H, 0.7)
  band(fl, cl, SE_WING_H - 0.7, 0.7); band(cr, fr, SE_WING_H - 0.7, 0.7)
  band(cl, cr, SE_EAVES - 0.5, 0.5, 0.25)
  for (const [x0, x1] of [[fl, cl], [cr, fr]] as [number, number][])                // corbel table under the wing cornice
    for (let x = x0 + 0.5; x < x1 - 0.2; x += 0.9) block2(out, x - 0.2, x + 0.2, zf - 0.3, zf, SE_WING_H - 1.3, SE_WING_H - 0.7, shade(stone, 0.9), ASH)

  // brick fields between the windows and in the upper tier
  const field = (x0: number, x1: number, y0: number, y1: number): void => block2(out, x0, x1, zf - 0.03, zf, y0, y1, pale, BRK)
  const gap = Wc / 3
  const wx = [cx - gap, cx, cx + gap]
  field(cl + 0.2, cr - 0.2, 0.4, 0.9)
  for (const t of [cx - gap / 2, cx + gap / 2]) field(t - 0.8, t + 0.8, 1.2, SE_TIER_H - 0.4)
  field(cl + 0.3, cl + 1.5, 1.2, SE_TIER_H - 0.4); field(cr - 1.5, cr - 0.3, 1.2, SE_TIER_H - 0.4)
  field(cl + 0.4, cx - 2.6, SE_TIER_H + 1.0, SE_EAVES - 1.6); field(cx + 2.6, cr - 0.4, SE_TIER_H + 1.0, SE_EAVES - 1.6)
  field(cx - 1.8, cx + 1.8, SE_TIER_H + 0.9, SE_TIER_H + 1.8)                         // brick under the sill course
  for (const [x0, x1] of [[fl, cl], [cr, fr]] as [number, number][]) field(x0 + 0.3, x1 - 0.3, 1.0, SE_WING_H - 1.6)

  // three tall round-arched ground windows, each under a red-and-white brick arch
  for (const t of wx) {
    archedPane(out, zf - 0.00, t, SE_WIN_Y + 0.2, SE_WIN_W + 2.0, SE_WIN_H + 1.1, red)      // outer red course
    archedPane(out, zf - 0.03, t, SE_WIN_Y + 0.2, SE_WIN_W + 1.6, SE_WIN_H + 0.9, pale)     // pale voussoirs
    archedPane(out, zf - 0.06, t, SE_WIN_Y, SE_WIN_W + 0.7, SE_WIN_H + 0.2, stone)          // stone surround
    archedPane(out, zf - 0.09, t, SE_WIN_Y, SE_WIN_W, SE_WIN_H, dark)
    block2(out, t - SE_WIN_W / 2 - 0.4, t + SE_WIN_W / 2 + 0.4, zf - 0.25, zf, SE_WIN_Y - 0.25, SE_WIN_Y, stone, ASH)   // sill
  }
  // the three-light stained-glass window over the tier cornice and the polychrome arch above it
  const uy = SE_TIER_H + 1.5
  archedPane(out, zf - 0.00, cx, uy + 0.2, 6.6, 5.6, red)
  archedPane(out, zf - 0.03, cx, uy + 0.1, 6.2, 5.4, pale)
  for (const [dx, w, h] of [[-1.55, 1.3, 4.3], [0, 1.55, 5.2], [1.55, 1.3, 4.3]] as [number, number, number][]) {
    archedPane(out, zf - 0.06, cx + dx, uy, w + 0.5, h + 0.2, stone)
    archedPane(out, zf - 0.09, cx + dx, uy, w, h, glass)
  }
  for (const dx of [-2.4, 2.4]) pane(out, '-z', zf - 0.02, cx + dx, uy + 4.45, 0.55, 0.55, red, 0.04)   // the roundels in the arch spandrels
  block2(out, cx - 3.3, cx + 3.3, zf - 0.3, zf, uy - 0.3, uy, stone, ASH)              // the sill course under the window

  // the row of small arched openings climbing the gable
  const n = 12
  for (let i = 0; i < n; i++) {
    const t = cl + 1.2 + ((Wc - 2.4) * (i + 0.5)) / n
    const top = SE_EAVES + (SE_RIDGE - SE_EAVES) * (1 - Math.abs(t - cx) / (Wc / 2))
    const h = 1.35
    if (top - 0.9 - h < SE_EAVES - 0.2) continue
    archedPane(out, zf - 0.09, t, top - 0.9 - h, 0.55, h, dark)
  }
  // the wings' small arched windows
  for (const [x0, x1] of [[fl, cl], [cr, fr]] as [number, number][]) {
    const t = (x0 + x1) / 2
    archedPane(out, zf - 0.0, t, 3.6, 1.7, 4.0, red)
    archedPane(out, zf - 0.06, t, 3.4, 1.3, 3.6, dark)
  }
}

/** block() with a surface tag (kit.block writes tag 0, which a pale face would show as ashlar). */
function block2(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number,
                colour: [number, number, number], tag: number): void {
  box(out, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2, colour, tag)
}

// ───────────────────────────── Synagogue Nazareth (way/56435813), 15 rue Notre-Dame-de-Nazareth ──────
// Alexandre Thierry, 1852, Romanesque-Byzantine. Read off Commons photos (2026-11-04, "synagogue rue Notre-Dame-de-
// Nazareth": street front, rose window close-up, period drawings): the footprint is a 13 m wide, ~50 m deep strip, only the
// short SSW end meets the street. That front is a low buff-stone screen with a crenellated parapet: a big round-arched
// central portal (blue double door, fanlight, two moulded archivolts on pilasters), a narrow arched window pair and a
// small round window in each flank bay. Behind it rises the pale rendered nave gable (eaves ~14.5, ridge 17.8) with a
// large star-tracery rose and a small clock above. Local −z is the street front (bearing −162, outward normal of the
// 12.8 m SW edge). Stone is ashlar-tagged, the nave stucco-tagged.
const SN_INSET = 0.2         // walls inset from the footprint
const SN_FRONT_H = 9.2       // street screen height (below the crenellation)
const SN_FRONT_DEPTH = 9.0   // screen thickness before the nave starts
const SN_CREN_H = 0.75       // merlon height
const SN_CREN_PITCH = 1.1    // merlon spacing
const SN_NAVE_INSET = 0.6    // nave wall inset from the footprint sides
const SN_EAVES = 14.5        // nave eaves
const SN_RIDGE = 17.8        // nave ridge
const SN_DOOR_W = 3.4        // portal clear width
const SN_DOOR_H = 5.6        // portal clear height
const SN_ROSE_R = 1.9        // rose window radius
const SN_ROSE_Y = 12.0       // rose window centre height
const SN_CLOCK_R = 0.6       // clock radius

/** A disc facing -z built from horizontal strips. */
function discZ(out: MeshBuilder, plane: number, cx: number, cy: number, r: number, colour: [number, number, number], proud: number): void {
  const n = 9
  for (let i = 0; i < n; i++) {
    const y0 = -r + (2 * r * i) / n, y1 = -r + (2 * r * (i + 1)) / n, ym = (y0 + y1) / 2
    pane(out, '-z', plane, cx, cy + y0, 2 * Math.sqrt(Math.max(0, r * r - ym * ym)), y1 - y0, colour, proud)
  }
}

export function synagogueNazareth(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#c4a578'), dark = hex('#2a2620'), door = hex('#1f3566'), glass = hex('#3a4a6a'),
    render = hex('#e6e0d0'), slate = hex('#6a6e74'), lite = hex('#d3b88a'), gold = hex('#b8963e')
  const ASH = surfaceTag('ashlar'), STU = surfaceTag('stucco')
  const x0 = -fit.hx + SN_INSET, x1 = fit.hx - SN_INSET, z0 = -fit.hz + SN_INSET, zEnd = fit.hz - SN_INSET
  const cx = (x0 + x1) / 2, W = x1 - x0, zn = z0 + SN_FRONT_DEPTH
  // the stone screen, its string course and the crenellated parapet
  block2(out, x0, x1, z0, zn, 0, SN_FRONT_H, stone, ASH)
  block2(out, x0 - 0.08, x1 + 0.08, z0 - 0.2, zn, SN_FRONT_H - 0.5, SN_FRONT_H + 0.15, lite, ASH)
  block2(out, x0 - 0.05, x1 + 0.05, z0 - 0.1, zn, 0, 0.6, shade(stone, 0.85), ASH)
  const nm = Math.floor(W / SN_CREN_PITCH)
  for (let i = 0; i < nm; i++) {
    const t = x0 + ((i + 0.5) * W) / nm
    block2(out, t - 0.3, t + 0.3, z0 - 0.1, z0 + 0.35, SN_FRONT_H + 0.15, SN_FRONT_H + 0.15 + SN_CREN_H, lite, ASH)
  }
  // central portal: pilasters, two archivolts, the fanlighted blue door
  const pw = SN_DOOR_W
  for (const s of [-1, 1]) block2(out, cx + s * (pw / 2 + 0.55) - 0.3, cx + s * (pw / 2 + 0.55) + 0.3, z0 - 0.3, z0, 0, SN_DOOR_H - 0.6, lite, ASH)
  archedPane(out, z0 - 0.02, cx, 0, pw + 2.6, SN_DOOR_H + 1.9, lite)
  archedPane(out, z0 - 0.05, cx, 0, pw + 1.7, SN_DOOR_H + 1.3, stone)
  archedPane(out, z0 - 0.08, cx, 0, pw + 0.8, SN_DOOR_H + 0.6, lite)
  archedPane(out, z0 - 0.11, cx, 0, pw, SN_DOOR_H, door)
  pane(out, '-z', z0 - 0.15, cx, 0, 0.08, SN_DOOR_H * 0.62, dark, 0.02)                    // the door's centre seam
  pane(out, '-z', z0 - 0.15, cx, SN_DOOR_H * 0.62, pw, 0.08, dark, 0.02)                   // transom bar under the fanlight
  // flank bays: a pair of narrow arched windows low down, a small round window above
  for (const s of [-1, 1]) {
    const bx = cx + s * (pw / 2 + 0.55 + (x1 - cx - pw / 2 - 0.55) / 2 + 0.2)
    for (const d of [-0.6, 0.6]) {
      archedPane(out, z0 - 0.02, bx + d, 1.4, 0.95, 3.2, lite)
      archedPane(out, z0 - 0.06, bx + d, 1.5, 0.65, 2.9, glass)
    }
    discZ(out, z0 - 0.02, bx, 6.9, 0.62, lite, 0.03)
    discZ(out, z0 - 0.06, bx, 6.9, 0.42, dark, 0.03)
  }
  // the nave behind: rendered, under a slate gable whose end shows over the screen with its rose and clock
  const nl = x0 + SN_NAVE_INSET - SN_INSET, nr = x1 - SN_NAVE_INSET + SN_INSET, zf = zn - 0.5
  block2(out, nl, nr, zf, zEnd, 0, SN_EAVES, render, STU)
  roof(out, nl, nr, zf, zEnd, SN_EAVES, SN_RIDGE - SN_EAVES, (nr - nl) / 2, 0, slate)
  block2(out, nl - 0.1, nr + 0.1, zf - 0.15, zf, SN_EAVES - 0.35, SN_EAVES, shade(render, 0.92), STU)    // the eaves cornice on the gable face
  const zg = zf - 0.02
  discZ(out, zg - 0.02, cx, SN_ROSE_Y, SN_ROSE_R + 0.3, shade(lite, 0.9), 0.03)       // the moulded surround
  discZ(out, zg - 0.06, cx, SN_ROSE_Y, SN_ROSE_R, dark, 0.03)
  discZ(out, zg - 0.1, cx, SN_ROSE_Y, SN_ROSE_R * 0.78, glass, 0.03)
  for (let k = 0; k < 3; k++) {                                                        // star tracery spokes
    const a = (k * Math.PI) / 3
    for (let j = -3; j <= 3; j++) {
      if (!j) continue
      const px = Math.cos(a) * j * SN_ROSE_R * 0.24, py = Math.sin(a) * j * SN_ROSE_R * 0.24
      pane(out, '-z', zg - 0.14, cx + px, SN_ROSE_Y + py - 0.13, 0.26, 0.26, lite, 0.02)
    }
  }
  discZ(out, zg - 0.04, cx, SN_EAVES + 2.1, SN_CLOCK_R + 0.12, lite, 0.03)
  discZ(out, zg - 0.08, cx, SN_EAVES + 2.1, SN_CLOCK_R, hex('#efe8d2'), 0.03)
  pane(out, '-z', zg - 0.12, cx, SN_EAVES + 2.1, 0.06, SN_CLOCK_R * 0.8, dark, 0.02)
  pane(out, '-z', zg - 0.12, cx + 0.15, SN_EAVES + 2.05, SN_CLOCK_R * 0.5, 0.06, dark, 0.02)
  block2(out, cx - 0.12, cx + 0.12, zg - 0.1, zg, SN_RIDGE - 0.1, SN_RIDGE + 0.5, gold, 0)    // small finial on the gable
}

// ───────────────────────────── Synagogue Buffault (way/69417432), 28 rue Buffault ─────────────────────────────
// Stanislas Ferrand, 1876–77, Portuguese rite, Romanesque-Byzantine. Read off Commons photos (2026-11-04, "Synagogue
// Buffault": straight-on porch, three-quarter views, the gable from below; contact sheet kept in
// docs/landmarks/refs/worship/buffault/): a 19 m pale-stone front on the street's ESE side. Ground: a three-arch loggia
// on short columns with carved archivolts, the bronze doors deep inside, one tall window in each flank bay; a carved
// frieze and cornice at ~7.5 m. Above: a great blind arch filling the middle, its archivolt studded with small oculi,
// a big rose of radiating petals inside; a pair of small arched windows in each flank bay; a full-width pediment with a
// corbelled raking cornice and the Tables of the Law at the apex. Behind, a basilican nave under a grey zinc gable.
// Heights from the IGN lidar MNS (2026-11-04): pediment apex and nave ridge ~20 m, nave eaves ~14 m, rear end ~13 m.
// Local −z is the street front (front 293 = outward normal of the two WNW street edges, 9.3 + 9.6 m).
const BF_INSET = 0.15        // walls inset from the footprint
const BF_FRONT_T = 1.4       // front wall thickness (the loggia is recessed into it)
const BF_LOGGIA_D = 1.6      // loggia depth behind the arches
const BF_CORNICE = 7.4       // ground-storey cornice top
const BF_FRIEZE = 0.8        // frieze band under it
const BF_EAVES = 15.2        // where the pediment's rake starts on the front
const BF_APEX = 19.8         // pediment apex (lidar)
const BF_NAVE_EAVES = 14.0   // nave side eaves (lidar)
const BF_NAVE_RIDGE = 19.6   // nave ridge (lidar)
const BF_MID_FRAC = 0.58     // share of the front width the middle (loggia / great arch) takes
const BF_ARCH_H = 5.6        // loggia arch clear height
const BF_COL_W = 0.55        // loggia columns
const BF_GREAT_R = 5.0       // radius of the great blind arch
const BF_GREAT_SPRING = 10.3 // its springing height
const BF_ROSE_R = 2.3        // rose window radius
const BF_ROSE_Y = 11.6       // rose centre height
const BF_PETALS = 12         // rose petals
const BF_OCULI = 11          // small oculi round the archivolt
const BF_SIDE_WIN_W = 1.1    // flank-bay ground window
const BF_SIDE_WIN_H = 3.4

export function synagogueBuffault(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#d9ceb4'), lite = hex('#e6dcc4'), deep = hex('#ad9e7c'), dark = hex('#2a2620'), recess = hex('#5b5246'),
    bronze = hex('#6a4a2a'), glass = hex('#34405a'), zinc = hex('#7b8088'), gold = hex('#c9a44c'), render = hex('#cfc6b0')
  const ASH = surfaceTag('ashlar'), STU = surfaceTag('stucco')
  const x0 = -fit.hx + BF_INSET, x1 = fit.hx - BF_INSET, z0 = -fit.hz + BF_INSET, z1 = fit.hz - BF_INSET
  const cx = (x0 + x1) / 2, W = x1 - x0, mw = W * BF_MID_FRAC, mx0 = cx - mw / 2, mx1 = cx + mw / 2
  const zb = z0 + BF_FRONT_T
  // the nave behind the front: rendered side walls under a zinc gable
  block2(out, x0, x1, zb, z1, 0, BF_NAVE_EAVES, render, STU)
  roof(out, x0 - 0.2, x1 + 0.2, zb, z1, BF_NAVE_EAVES, BF_NAVE_RIDGE - BF_NAVE_EAVES, W / 2 + 0.2, 0, zinc)
  // the front wall: flank bays full height, the middle above the loggia, a plinth
  block2(out, x0, mx0, z0, zb, 0, BF_EAVES, stone, ASH)
  block2(out, mx1, x1, z0, zb, 0, BF_EAVES, stone, ASH)
  block2(out, mx0, mx1, z0, zb, BF_ARCH_H + 0.9, BF_EAVES, stone, ASH)
  block2(out, mx0, mx1, z0 + BF_LOGGIA_D, zb, 0, BF_ARCH_H + 0.9, recess, 0)          // loggia back wall
  block2(out, x0 - 0.05, x1 + 0.05, z0 - 0.08, zb, 0, 0.5, deep, ASH)
  // loggia: four columns with capitals, three carved archivolts, the bronze doors deep inside
  const pitch = (mw - BF_COL_W) / 3
  for (let i = 0; i <= 3; i++) {
    const t = mx0 + BF_COL_W / 2 + i * pitch
    block2(out, t - BF_COL_W / 2, t + BF_COL_W / 2, z0, z0 + 0.6, 0, BF_ARCH_H - pitch / 2 + 0.1, lite, ASH)
    block2(out, t - BF_COL_W * 0.8, t + BF_COL_W * 0.8, z0 - 0.05, z0 + 0.65, BF_ARCH_H - pitch / 2 - 0.3, BF_ARCH_H - pitch / 2 + 0.1, deep, ASH)
  }
  for (let i = 0; i < 3; i++) {
    const t = mx0 + BF_COL_W / 2 + (i + 0.5) * pitch, aw = pitch - BF_COL_W
    archedPane(out, z0 - 0.03, t, 0, aw + 0.9, BF_ARCH_H + 0.45, deep)                 // carved archivolt
    archedPane(out, z0 - 0.06, t, 0, aw + 0.35, BF_ARCH_H + 0.15, lite)
    archedPane(out, z0 - 0.09, t, 0, aw, BF_ARCH_H - 0.1, recess)                      // the open arch
    archedPane(out, z0 + BF_LOGGIA_D - 0.02, t, 0.5, aw * 0.7, BF_ARCH_H * 0.72, bronze) // doors inside
    for (let k = -4; k <= 4; k++) pane(out, '-z', z0 - 0.12, t + (k * aw) / 9.5, 0.5, 0.05, 2.0, dark, 0.02) // railings
    pane(out, '-z', z0 - 0.12, t, 2.45, aw, 0.08, dark, 0.02)
  }
  // flank bays: a tall window below, a pair of small arched windows above, pilaster strips at the corners
  for (const s of [-1, 1]) {
    const bx = s < 0 ? (x0 + mx0) / 2 : (mx1 + x1) / 2
    pane(out, '-z', z0, bx, 1.6, BF_SIDE_WIN_W + 0.4, BF_SIDE_WIN_H + 0.4, lite, 0.05)
    pane(out, '-z', z0 - 0.04, bx, 1.8, BF_SIDE_WIN_W, BF_SIDE_WIN_H, glass, 0.05)
    pane(out, '-z', z0 - 0.04, bx, 1.8 + BF_SIDE_WIN_H + 0.3, BF_SIDE_WIN_W * 0.8, 0.7, glass, 0.05)  // small window over it
    for (const d of [-0.55, 0.55]) {
      archedPane(out, z0 - 0.03, bx + d, 9.6, 0.95, 2.9, lite)
      archedPane(out, z0 - 0.06, bx + d, 9.75, 0.65, 2.6, glass)
    }
    const ex = s < 0 ? x0 : x1
    block2(out, ex - 0.35, ex + 0.35, z0 - 0.15, z0 + 0.5, 0, BF_EAVES, lite, ASH)
  }
  // the frieze and the ground-storey cornice right across
  block2(out, x0 - 0.1, x1 + 0.1, z0 - 0.18, z0 + 0.3, BF_CORNICE - BF_FRIEZE, BF_CORNICE - 0.25, deep, ASH)
  block2(out, x0 - 0.25, x1 + 0.25, z0 - 0.4, z0 + 0.3, BF_CORNICE - 0.25, BF_CORNICE, lite, ASH)
  for (let t = x0 + 0.4; t < x1 - 0.2; t += 0.7) pane(out, '-z', z0 - 0.2, t, BF_CORNICE - BF_FRIEZE + 0.12, 0.35, 0.3, lite, 0.02)
  block2(out, x0 - 0.15, x1 + 0.15, z0 - 0.25, z0 + 0.3, BF_EAVES - 0.35, BF_EAVES, lite, ASH)  // eaves string course
  // the great blind arch: two archivolt rings, the studded oculi, the field and the rose
  const arch = (r: number, plane: number, c: [number, number, number]): void => {
    pane(out, '-z', plane, cx, BF_CORNICE, 2 * r, BF_GREAT_SPRING - BF_CORNICE, c, 0.03)
    discZ(out, plane, cx, BF_GREAT_SPRING, r, c, 0.03)
  }
  arch(BF_GREAT_R + 0.55, z0 - 0.03, lite)
  arch(BF_GREAT_R + 0.05, z0 - 0.07, deep)
  arch(BF_GREAT_R - 0.6, z0 - 0.11, stone)
  for (let k = 0; k < BF_OCULI; k++) {
    const a = (Math.PI * (k + 0.5)) / BF_OCULI, rr = BF_GREAT_R - 0.28
    discZ(out, z0 - 0.15, cx + Math.cos(a) * rr, BF_GREAT_SPRING + Math.sin(a) * rr, 0.24, dark, 0.02)
  }
  discZ(out, z0 - 0.15, cx, BF_ROSE_Y, BF_ROSE_R + 0.35, lite, 0.03)
  discZ(out, z0 - 0.19, cx, BF_ROSE_Y, BF_ROSE_R, glass, 0.03)
  for (let k = 0; k < BF_PETALS; k++) {                                                  // radiating petals
    const a = (2 * Math.PI * k) / BF_PETALS
    for (const f of [0.38, 0.6, 0.8]) {
      const r = BF_ROSE_R * f
      discZ(out, z0 - 0.23, cx + Math.cos(a) * r, BF_ROSE_Y + Math.sin(a) * r, BF_ROSE_R * (0.08 + 0.06 * f), lite, 0.02)
    }
  }
  discZ(out, z0 - 0.25, cx, BF_ROSE_Y, BF_ROSE_R * 0.22, lite, 0.02)
  // the pediment: stepped stone strips to the apex, a corbelled raking cornice, the Tables at the top
  const rise = BF_APEX - BF_EAVES, n = 14
  for (let i = 0; i < n; i++) {
    const y0 = BF_EAVES + (rise * i) / n, hw = (W / 2) * (1 - (i + 0.5) / n)
    pane(out, '-z', z0 + 0.3, cx, y0, 2 * hw, rise / n + 0.02, stone, 0.3)
    for (const s of [-1, 1]) {
      const ex = cx + s * hw
      block2(out, ex - 0.4, ex + 0.4, z0 - 0.2, zb, y0 + rise / n - 0.05, y0 + rise / n + 0.3, lite, ASH)  // raking cornice
      if (i < n - 1) pane(out, '-z', z0 - 0.02, ex - s * 0.7, y0 + rise / n - 0.35, 0.2, 0.3, deep, 0.06)   // corbels
    }
  }
  for (const d of [-0.32, 0.32]) archedPane(out, z0 - 0.2, cx + d, BF_APEX + 0.3, 0.6, 1.1, lite)       // Tables of the Law
  block2(out, cx - 0.8, cx + 0.8, z0 - 0.15, z0 + 0.4, BF_APEX - 0.1, BF_APEX + 0.35, lite, ASH)
  pane(out, '-z', z0 - 0.05, cx, BF_CORNICE + 0.15, 4.2, 0.22, gold, 0.02)                           // dedication band
}

// ───────────────────────────── Centre Culturel et Cultuel Musulman / Mosquée L'Olivier (way/107997690), 191 rue du Vieux-Pont-de-Sèvres ─────────────────────────────
// Boulogne-Billancourt, 2011. Read off Google Images (ileseguin, Bridgeman, lolivier.org, 2026-11-04; no Commons
// photos): no dome or minaret; a cluster of stacked white boxes with flat roofs and fine vertical ribbing, a tall four-
// level block set back and a two-level block stepping forward at the street corner, a full-height glazed slot between
// them and big glazed bays on the ground floor. Local −z is the street (rue du Vieux-Pont-de-Sèvres, NNE side).
const CCM_H = 13.4           // the tall block's parapet (OSM height)
const CCM_LOW_H = 8.4        // the street-corner block
const CCM_INSET = 0.3        // wall inset from the fitted footprint
const CCM_LOW_FRAC = 0.42    // share of the width the low block takes (left, street end)
const CCM_LOW_DEPTH = 0.62   // share of the depth the low block takes
const CCM_SLOT_W = 2.4       // the glazed slot between the volumes
const CCM_RIB_PITCH = 0.7    // vertical rib spacing
const CCM_RIB_W = 0.16       // rib width
const CCM_GLASS_H = 3.6      // ground-floor glazing height
const CCM_PARAPET = 0.5      // parapet cap over each roof

export function centreCulturelMusulman(out: MeshBuilder, fit: Fit): void {
  const white = hex('#e8e8e4'), rib = hex('#f4f4f0'), glass = hex('#4f6676'), frame = hex('#8c9296'), cap = hex('#d6d6d2'), plinth = hex('#bfbfbb')
  const PAN = surfaceTag('panel'), CON = surfaceTag('concrete'), GLS = surfaceTag('glass')
  const x0 = -fit.hx + CCM_INSET, x1 = fit.hx - CCM_INSET, z0 = -fit.hz + CCM_INSET, z1 = fit.hz - CCM_INSET
  const W = x1 - x0, D = z1 - z0
  const xl = x0 + W * CCM_LOW_FRAC, zl = z0 + D * CCM_LOW_DEPTH
  const xs0 = xl, xs1 = xl + CCM_SLOT_W                      // the slot, flush with the street face of the tall block
  // tall block (right, full depth) set back behind a front reveal; low block (left, forward)
  const zt = z0 + D * 0.18
  block2(out, xs1, x1, zt, z1, 0, CCM_H, white, PAN)
  block2(out, x0, xl, z0, zl, 0, CCM_LOW_H, white, PAN)
  block2(out, x0, xs1, zl, z1, 0, CCM_LOW_H + 2.2, shade(white, 0.97), PAN)   // rear-left volume, between the two heights
  // glazed slot: a full-height glass box in the re-entrant, its mullions
  block2(out, xs0, xs1, z0 + (zl - z0) * 0.55, zt + 0.6, 0, CCM_H - 1.0, glass, GLS)
  for (let y = 3.4; y < CCM_H - 1; y += 3.4) pane(out, '-z', zt + 0.55, (xs0 + xs1) / 2, y, CCM_SLOT_W, 0.18, frame, 0.04)
  // flat roofs: parapet caps
  block2(out, xs1 - 0.1, x1 + 0.1, zt - 0.1, z1 + 0.1, CCM_H, CCM_H + CCM_PARAPET, cap, CON)
  block2(out, x0 - 0.1, xl + 0.1, z0 - 0.1, zl + 0.1, CCM_LOW_H, CCM_LOW_H + CCM_PARAPET, cap, CON)
  block2(out, x0 - 0.1, xs1, zl, z1 + 0.1, CCM_LOW_H + 2.2, CCM_LOW_H + 2.2 + CCM_PARAPET, cap, CON)
  block2(out, x0 - 0.06, x1 + 0.06, z0 - 0.06, z1 + 0.06, 0, 0.35, plinth, CON)
  // vertical ribbing on every wall of both main volumes (thin proud fins)
  const ribs = (face: '-z' | '+z' | '-x' | '+x', plane: number, a: number, b: number, y0: number, y1: number): void => {
    const n = Math.max(1, Math.floor((b - a) / CCM_RIB_PITCH))
    for (let i = 0; i < n; i++) pane(out, face, plane, a + (i + 0.5) * ((b - a) / n), y0, CCM_RIB_W, y1 - y0, rib, 0.07)
  }
  ribs('-z', z0, x0 + 0.3, xl - 0.3, CCM_GLASS_H + 0.4, CCM_LOW_H - 0.2)           // low block street front, above glazing
  ribs('-z', zt, xs1 + 0.3, x1 - 0.3, 0.4, CCM_H - 0.2)                            // tall block street front
  ribs('+x', x1, zt + 0.3, z1 - 0.3, 0.4, CCM_H - 0.2)
  ribs('+z', z1, x0 + 0.3, x1 - 0.3, 0.4, CCM_H - 0.2)
  ribs('-x', x0, z0 + 0.3, z1 - 0.3, CCM_GLASS_H + 0.4, CCM_LOW_H - 0.2)
  // ground-floor glazing on the low block's street front and flank, and on the tall block's front
  const bays = (face: '-z' | '+z' | '-x' | '+x', plane: number, a: number, b: number, bay: number): void => {
    const n = Math.max(1, Math.floor((b - a) / bay)), st = (b - a) / n
    for (let i = 0; i < n; i++) {
      const t = a + (i + 0.5) * st
      pane(out, face, plane, t, 0.4, st - 0.3, CCM_GLASS_H, glass, 0.09)
      pane(out, face, plane, t, 0.4 + CCM_GLASS_H, st - 0.3, 0.12, frame, 0.1)
    }
  }
  bays('-z', z0, x0 + 0.5, xl - 0.5, 3.2)
  bays('-x', x0, z0 + 0.5, zl - 0.5, 3.2)
  bays('-z', zt, xs1 + 0.8, x1 - 0.8, 3.6)
  // upper-floor ribbon windows on the tall block's street face
  for (const y of [5.4, 8.4, 11.0]) pane(out, '-z', zt, (xs1 + x1) / 2 + 1, y, (x1 - xs1) * 0.6, 1.2, glass, 0.1)
}

// ───────────────────────────── Grande Synagogue de Levallois / Centre culturel israélite Anna et Simon Drahi (way/677002800), 10 rue Baudin ─────────────────────────────
// Levallois-Perret. Read off one Commons photo (Centre culturel israélite de Levallois Anna et Simon Drahi.jpg, 2026-11-04):
// a pale-grey panelled block of ~6 storeys with a chamfered street corner; the corner's tall middle bay stands proud with a
// big perforated (dot-grid) panel high up, a small twin-arched window above it, a round star-of-David oculus over the dark
// door wall (large dark leaves, glazed centre), and tall narrow dark windows in pairs on the flanks. Local −z is the
// corner/entrance face (outward normal of the 6 m chamfer edge).
const GL_H = 25.0            // central bay parapet
const GL_WING_H = 22.0       // flanking wings
const GL_INSET = 0.3         // wall inset from the fitted footprint
const GL_MID_FRAC = 0.46     // share of the width the central bay takes
const GL_MID_PROUD = 0.5     // how far the central bay stands proud of the wings
const GL_DOOR_W = 6.0        // dark door wall width
const GL_DOOR_H = 5.0        // and height
const GL_PERF_W = 6.4        // perforated panel width
const GL_PERF_Y0 = 12.8      // its bottom
const GL_PERF_H = 7.6        // its height
const GL_PERF_PITCH = 0.9    // dot spacing
const GL_PERF_DOT = 0.34     // dot size
const GL_OCULUS_Y = 8.6      // oculus centre height
const GL_OCULUS_R = 1.3      // oculus radius
const GL_WIN_W = 1.0         // tall narrow windows
const GL_WIN_H = 7.6
const GL_WIN_PITCH = 3.6     // window pair spacing along the wings

export function synagogueLevallois(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#dcdbd6'), seam = hex('#c8c7c1'), dark = hex('#2c2f33'), glass = hex('#3f4c58'), gold = hex('#b89a52'), plinth = hex('#a9a8a2')
  const PAN = surfaceTag('panel'), CON = surfaceTag('concrete')
  const x0 = -fit.hx + GL_INSET, x1 = fit.hx - GL_INSET, z0 = -fit.hz + GL_INSET, z1 = fit.hz - GL_INSET
  const W = x1 - x0, cx = (x0 + x1) / 2, mw = W * GL_MID_FRAC / 2
  const zf = z0 + GL_MID_PROUD                       // wing front plane; the central bay stands out to z0
  block2(out, x0, x1, zf, z1, 0, GL_WING_H, stone, PAN)
  block2(out, cx - mw, cx + mw, z0, z1, 0, GL_H, stone, PAN)
  block2(out, x0 - 0.05, x1 + 0.05, zf - 0.05, z1 + 0.05, 0, 0.5, plinth, CON)
  block2(out, cx - mw - 0.05, cx + mw + 0.05, z0 - 0.05, z1 + 0.05, 0, 0.5, plinth, CON)
  block2(out, x0 - 0.1, x1 + 0.1, zf - 0.1, z1 + 0.1, GL_WING_H, GL_WING_H + 0.35, seam, CON)
  block2(out, cx - mw - 0.1, cx + mw + 0.1, z0 - 0.1, z1 + 0.1, GL_H, GL_H + 0.35, seam, CON)
  // panel joints: horizontal seams on the central bay front
  for (let y = 3.2; y < GL_H; y += 3.2) pane(out, '-z', z0, cx, y, mw * 2, 0.06, seam, 0.03)
  // dark door wall: recess, glazed centre, flanking leaves
  block2(out, cx - GL_DOOR_W / 2, cx + GL_DOOR_W / 2, z0 - 0.08, z0 + 0.05, 0, GL_DOOR_H, dark, CON)
  pane(out, '-z', z0 - 0.1, cx, 0.3, GL_DOOR_W * 0.4, GL_DOOR_H - 1.2, glass, 0.04)
  pane(out, '-z', z0 - 0.1, cx, GL_DOOR_H + 0.15, GL_DOOR_W + 2.4, 0.22, dark, 0.03)
  // oculus with a gold star (stacked panes: a disc approximated by three overlapping rectangles, star by two)
  const r = GL_OCULUS_R
  pane(out, '-z', z0, cx, GL_OCULUS_Y - r, r * 2, r * 2, seam, 0.04)
  pane(out, '-z', z0, cx, GL_OCULUS_Y - r * 0.8, r * 1.6, r * 1.6, dark, 0.07)
  pane(out, '-z', z0, cx, GL_OCULUS_Y - r * 0.45, r * 0.9, r * 0.9, gold, 0.1)
  pane(out, '-z', z0, cx, GL_OCULUS_Y - r * 0.12, r * 1.3, r * 0.24, gold, 0.11)
  // perforated panel: a grid of dark dots
  const nx = Math.floor(GL_PERF_W / GL_PERF_PITCH), ny = Math.floor(GL_PERF_H / GL_PERF_PITCH)
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const off = (j % 2) * GL_PERF_PITCH / 2 - GL_PERF_PITCH / 4
    pane(out, '-z', z0, cx + (i - (nx - 1) / 2) * GL_PERF_PITCH + off, GL_PERF_Y0 + j * GL_PERF_PITCH, GL_PERF_DOT, GL_PERF_DOT, dark, 0.04)
  }
  // small twin-arched window at the top
  for (const d of [-0.45, 0.45]) archedPane(out, z0 - 0.02, cx + d, GL_H - 3.0, 0.7, 1.4, glass)
  // tall narrow window pairs: both wings on the front, and along both flanks
  const winCol = (face: '-z' | '+z' | '-x' | '+x', plane: number, t: number): void => {
    pane(out, face, plane, t - 0.7, 3.6, GL_WIN_W, GL_WIN_H, glass, 0.06)
    pane(out, face, plane, t + 0.7, 3.6, GL_WIN_W, GL_WIN_H, glass, 0.06)
    pane(out, face, plane, t - 0.7, 3.6 + GL_WIN_H + 0.1, GL_WIN_W, 0.1, dark, 0.07)
    pane(out, face, plane, t + 0.7, 3.6 + GL_WIN_H + 0.1, GL_WIN_W, 0.1, dark, 0.07)
    pane(out, face, plane, t - 0.7, 13.0, GL_WIN_W, GL_WIN_H - 1.5, glass, 0.06)
    pane(out, face, plane, t + 0.7, 13.0, GL_WIN_W, GL_WIN_H - 1.5, glass, 0.06)
  }
  const row = (face: '-z' | '+z' | '-x' | '+x', plane: number, a: number, b: number): void => {
    const n = Math.max(1, Math.floor((b - a) / GL_WIN_PITCH)), st = (b - a) / n
    for (let i = 0; i < n; i++) winCol(face, plane, a + (i + 0.5) * st)
  }
  row('-z', zf, x0 + 0.8, cx - mw - 0.8)
  row('-z', zf, cx + mw + 0.8, x1 - 0.8)
  row('-x', x0, zf + 1, z1 - 1)
  row('+x', x1, zf + 1, z1 - 1)
  row('+z', z1, x0 + 1, x1 - 1)
}

// ───────────────────────────── Synagogue de la rue Sainte-Isaure (way/41506069), 13 rue Sainte-Isaure ─────────────────────────────
// 1939, cream-rendered Art Deco front. Read off Commons photos (2026-11-04, search "Synagogue rue Sainte-Isaure": the
// street front three-quarter, a Star-of-David close-up, a night view): a tall central block with a big round Star-of-David
// window and the Tables of the Law on a corbel under it; below, a recessed porch with two red marble columns behind a
// black iron grille with small stars; either side a lower wing whose inner end is rounded into the centre: the left wing
// low with two arched windows, the right wing taller with a string course, two arched windows and a garage door.
// Local −z is the street front (front 103 = outward normal of the 24 m east edge along rue Sainte-Isaure, whose axis runs
// 13° off north; the first guess, the ring's stepped south end, faces a courtyard). The fitted box is 12 × 14.3 half-extents:
// the wings stand on the street line, the centre and its porch 3.5 m behind it, the grille at the line. Plan numbers are at
// that reference size and stretched to the fit (sx, sz).
const SI_REF_HX = 12.0
const SI_REF_HZ = 14.3
const SI_NOTCH = 3.5         // how far the porch/centre is set behind the wings; also the radius of their rounded ends
const SI_XL = -5.5           // central block's left face (reference x)
const SI_XR = 4.5            // and its right face
const SI_H_CENTRE = 12.5
const SI_H_TOWER = 14.5
const SI_H_LEFT = 6.2
const SI_H_RIGHT = 9.4
const SI_TOWER = [-4.2, 3.2] // the tower's x extent
const SI_ROSE_Y = 10.5
const SI_ROSE_R = 1.55
const SI_PORCH_X = [-5.0, 4.0] // grille extent
const SI_COL_X = [-1.6, 0.8]   // the red columns
const SI_COL_H = 4.4
const SI_GRILLE_H = 2.7
const SI_ARCH_STEPS = 5

export function synagogueSainteIsaure(out: MeshBuilder, fit: Fit): void {
  const cream = hex('#e6dbbd'), lite = hex('#d6c8a4'), dark = hex('#1c1c20'), brown = hex('#4a2a20'),
    red = hex('#8a3326'), glass = hex('#3f4a5c'), gold = hex('#c8a24a'), roofc = hex('#9a9a96'), stoneG = hex('#b8b0a0')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  const sx = fit.hx / SI_REF_HX, sz = fit.hz / SI_REF_HZ
  const X = (x: number): number => x * sx
  const Z = (z: number): number => z * sz
  const zf = -fit.hz, zEnd = Z(8.5), zc = zf + SI_NOTCH * sz, R = SI_NOTCH * sz
  const xl = X(SI_XL), xr = X(SI_XR)
  const plank = (ring: { x: number; z: number }[], y0: number, y1: number, col: [number, number, number], tag: number): void => {
    let a = 0
    for (let i = 0; i < ring.length; i++) { const p = ring[i], q = ring[(i + 1) % ring.length]; a += p.x * q.z - q.x * p.z }
    const r = a < 0 ? [...ring].reverse() : ring
    for (let i = 0; i < r.length; i++) {
      const p = r[i], q = r[(i + 1) % r.length], L = Math.hypot(q.x - p.x, q.z - p.z)
      if (L < 0.05) continue
      out.quad([[p.x, y0, p.z], [q.x, y0, q.z], [q.x, y1, q.z], [p.x, y1, p.z]], [(q.z - p.z) / L, 0, -(q.x - p.x) / L],
        [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
    }
    capPolygon(out, r, y1, col, tag)
  }
  const arc = (cx: number, cz: number, a0: number, a1: number): { x: number; z: number }[] =>
    Array.from({ length: SI_ARCH_STEPS + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / SI_ARCH_STEPS; return { x: cx + Math.cos(a) * R, z: cz + Math.sin(a) * R } })
  // wings: inner ends rounded into the centre
  const xlc = xl - R, xrc = xr + R
  plank([{ x: -fit.hx, z: zf }, { x: xlc, z: zf }, ...arc(xlc, zc, -Math.PI / 2, 0), { x: xl, z: Z(-6.4) }, { x: -fit.hx, z: Z(-6.4) }],
    0, SI_H_LEFT, cream, STU)
  plank([{ x: fit.hx, z: zf }, { x: fit.hx, z: Z(7.8) }, { x: xr, z: Z(7.8) }, { x: xr, z: zc }, ...arc(xrc, zc, Math.PI, 1.5 * Math.PI)],
    0, SI_H_RIGHT, cream, STU)
  // the centre and the tower
  plank([{ x: xl, z: zc }, { x: xr, z: zc }, { x: xr, z: zEnd }, { x: xl, z: zEnd }], 0, SI_H_CENTRE, cream, STU)
  const t0 = X(SI_TOWER[0]), t1 = X(SI_TOWER[1])
  plank([{ x: t0, z: zc }, { x: t1, z: zc }, { x: t1, z: zc + 9 }, { x: t0, z: zc + 9 }], SI_H_CENTRE, SI_H_TOWER, cream, STU)
  block2(out, t0 - 0.15, t1 + 0.15, zc - 0.2, zc + 9.2, SI_H_TOWER, SI_H_TOWER + 0.25, lite, STU)       // cornice cap
  block2(out, xl, xr, zc - 0.15, zEnd, SI_H_CENTRE, SI_H_CENTRE + 0.2, roofc, MET)                       // flat roof
  // the string courses of the wings (the right one runs along its front)
  block2(out, xrc, fit.hx + 0.05, zf - 0.12, zf + 0.1, 5.4, 5.7, lite, STU)
  block2(out, -fit.hx - 0.05, xlc, zf - 0.12, zf + 0.1, 3.6, 3.85, lite, STU)
  // the rose: a Star of David in a round frame, the Tables of the Law on a corbel under it
  const rx = (t0 + t1) / 2, zr = zc - 0.02
  discZ(out, zr - 0.02, rx, SI_ROSE_Y, SI_ROSE_R + 0.25, lite, 0.03)
  discZ(out, zr - 0.06, rx, SI_ROSE_Y, SI_ROSE_R, glass, 0.03)
  for (const s of [1, -1]) {
    const r = SI_ROSE_R * 0.92, y = SI_ROSE_Y
    out.quad([[rx - s * r * 0.87, y - s * r * 0.5, zr - 0.12], [rx + s * r * 0.87, y - s * r * 0.5, zr - 0.12], [rx, y + s * r, zr - 0.12], [rx, y + s * r, zr - 0.12]],
      [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], gold, 0)
  }
  block2(out, rx - 0.55, rx + 0.55, zc - 0.18, zc, SI_ROSE_Y - SI_ROSE_R - 2.35, SI_ROSE_Y - SI_ROSE_R - 0.35, stoneG, 0)   // the Tables
  block2(out, rx - 0.9, rx + 0.9, zc - 0.5, zc, SI_ROSE_Y - SI_ROSE_R - 2.7, SI_ROSE_Y - SI_ROSE_R - 2.35, lite, STU)       // corbel
  // the porch: stepped surround, dark recess, two red columns, black grille
  const px0 = X(SI_COL_X[0]) - 1.1, px1 = X(SI_COL_X[1]) + 1.1
  block2(out, px0 - 0.3, px1 + 0.3, zc - 0.25, zc, 0, SI_COL_H + 0.5, lite, STU)
  pane(out, '-z', zc, (px0 + px1) / 2, 0, px1 - px0, SI_COL_H, dark, 0.05)
  pane(out, '-z', zc, (px0 + px1) / 2, 0.2, (px1 - px0) * 0.5, SI_COL_H - 0.8, brown, 0.08)
  for (const cx of SI_COL_X) block2(out, X(cx) - 0.28, X(cx) + 0.28, zc - 1.1, zc - 0.55, 0, SI_COL_H, red, 0)
  const g0 = X(SI_PORCH_X[0]), g1 = X(SI_PORCH_X[1]), zg = zc - 1.5
  block2(out, g0, g1, zg - 0.05, zg + 0.05, 0, 0.5, dark, MET)                                                   // plinth
  block2(out, g0, g1, zg - 0.05, zg + 0.05, SI_GRILLE_H - 0.1, SI_GRILLE_H, dark, MET)
  const nb = Math.floor((g1 - g0) / 0.42)
  for (let i = 0; i <= nb; i++) block2(out, g0 + ((g1 - g0) * i) / nb - 0.03, g0 + ((g1 - g0) * i) / nb + 0.03, zg - 0.04, zg + 0.04, 0.5, SI_GRILLE_H, dark, MET)
  for (const f of [0.2, 0.4, 0.6, 0.8]) pane(out, '-z', zg, g0 + (g1 - g0) * f, 1.1, 0.35, 0.4, gold, 0.08)    // the small stars
  // wing windows and doors
  for (const t of [-fit.hx + 0.8 * sx + 0.0, -fit.hx + 2.35 * sx]) {
    archedPane(out, zf - 0.02, t, 2.9, 1.3, 2.7, lite); archedPane(out, zf - 0.06, t, 3.0, 0.95, 2.4, glass)
  }
  for (const t of [xrc + 1.0 * sx, fit.hx - 1.0 * sx]) {
    archedPane(out, zf - 0.02, t, 5.9, 1.5, 3.2, lite); archedPane(out, zf - 0.06, t, 6.0, 1.1, 2.9, glass)
  }
  pane(out, '-z', zf, fit.hx - 1.6 * sx, 0, 3.0, 3.4, dark, 0.07)                                                // garage shutter
  pane(out, '-z', zf, fit.hx - 1.6 * sx, 0.1, 2.6, 3.0, brown, 0.12)
}

// ───────────────────────────── Synagogue Michkenot Israël (way/63212274), 6 rue Jean Nohain ─────────────────────────────
// 1980s, grey-and-white striped aluminium vaults. Read off Google Images (Wikipédia / PSS-archi / Mappy street view,
// 2026-11-04): a dead-end lane (rue Jean Nohain) ends at a ~10.7 m wide half-cylinder barrel vault whose gable face shows
// vertical white/grey stripes, a round oculus and a tall slit window over a grey masonry base; behind it to the side
// stand two smaller barrels (also with oculi) and a horizontal-ribbed drum; a low flat-roofed grey annex covers the rest of
// the ring. The manifest's front is 4 (what the loader's footprint snap gives; the lane end actually faces bearing ~41.6),
// so the barrel is built in its own frame, yawed MI_YAW off local −z and found by the ring edge that faces that way.
const MI_YAW = 37.6           // degrees the barrel's front normal lies off local -z (sign taken from the ring)
const MI_ANNEX_H = 3.8        // the low annex
const MI_BASE_H = 2.6         // grey masonry base under the stripes
const MI_WALL_H = 3.6         // barrel straight wall below the springing of the arch (above the base)
const MI_BAR_LEN = 11.0       // main barrel depth
const MI_STRIPE = 0.62        // stripe width on the vault
const MI_SMALL_W = 7.0        // the two rear barrels' width
const MI_SMALL_LEN = 7.0      // their depth
const MI_SMALL_DROP = 1.6     // how much lower each springs than the one before
const MI_DRUM_R = 3.6         // the ribbed drum radius
const MI_DRUM_H = 5.2         // its height
const MI_RIB = 0.38           // rib course height
const MI_FACETS = 16          // drum facets
const MI_OCULUS_R = 0.8

export function synagogueMichkenot(out: MeshBuilder, fit: Fit): void {
  const white = hex('#dcdedb'), grey = hex('#8f9496'), base = hex('#7a7b7a'), dark = hex('#23262a'), roofc = hex('#6c7072'),
    drumA = hex('#d3d5d1'), drumB = hex('#a9adad')
  const STU = surfaceTag('stucco'), CON = surfaceTag('concrete'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  /** a quad with winding facing `outward` */
  const face = (p: V3[], outward: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * outward[0] + c[1] * outward[1] + c[2] * outward[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    const L = Math.hypot(...outward) || 1
    out.quad(pts, [outward[0] / L, outward[1] / L, outward[2] / L], [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  const ring = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  // the low annex: the whole ring, extruded
  {
    let a = 0
    for (let i = 0; i < ring.length; i++) { const p = ring[i]!, q = ring[(i + 1) % ring.length]!; a += p.x * q.z - q.x * p.z }
    const r = a < 0 ? [...ring].reverse() : ring
    for (let i = 0; i < r.length; i++) {
      const p = r[i]!, q = r[(i + 1) % r.length]!, L = Math.hypot(q.x - p.x, q.z - p.z)
      if (L < 0.05) continue
      face([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, MI_ANNEX_H, q.z], [p.x, MI_ANNEX_H, p.z]], [(q.z - p.z) / L, 0, -(q.x - p.x) / L], base, CON)
    }
    capPolygon(out, r, MI_ANNEX_H, roofc, MET)
  }
  // the barrel's front edge: a 10-11.5 m ring edge whose outward normal lies MI_YAW off -z
  let ex = 0, ez = -1, mx = 0, mz = -fit.hz + 14.9, W = 10.7
  {
    let a = 0
    for (let i = 0; i < ring.length; i++) { const p = ring[i]!, q = ring[(i + 1) % ring.length]!; a += p.x * q.z - q.x * p.z }
    const sg = a < 0 ? -1 : 1
    let bestErr = 1e9
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i]!, q = ring[(i + 1) % ring.length]!, L = Math.hypot(q.x - p.x, q.z - p.z)
      if (L < 10 || L > 11.5) continue
      const nx = (sg * (q.z - p.z)) / L, nz = (-sg * (q.x - p.x)) / L        // outward normal
      const ang = (Math.atan2(nx, -nz) * 180) / Math.PI                       // off -z
      const err = Math.abs(Math.abs(ang) - MI_YAW)
      if (err < bestErr) { bestErr = err; ex = nx; ez = nz; mx = (p.x + q.x) / 2; mz = (p.z + q.z) / 2; W = L }
    }
  }
  // the barrel frame: a = along the front (right-hand along the edge), b = depth into the building, y up
  const ax = -ez, az = ex            // edge direction (any sign: symmetric build)
  const P = (a: number, y: number, b: number): V3 => [mx + ax * a - ex * b, y, mz + az * a - ez * b]
  const D = (a: number, y: number, b: number): V3 => [ax * a - ex * b, y, az * a - ez * b]   // a direction in the frame
  const F = (pts: [number, number, number][], outward: V3, col: V3, tag: number): void =>
    face(pts.map(([a, y, b]) => P(a, y, b)), D(...outward), col, tag)
  // a half-cylinder barrel along b over a∈[a0,a1], b∈[b0,b1]; walls to yw above y0, arch above; stripes alternate
  const barrel = (a0: number, a1: number, b0: number, b1: number, y0: number, yw: number, rear: boolean): void => {
    const R = (a1 - a0) / 2, c = (a0 + a1) / 2
    const n = Math.max(6, Math.round((Math.PI * R) / MI_STRIPE))
    const m = Math.max(2, Math.round((b1 - b0) / (MI_STRIPE * 3)))
    for (const sx of [-1, 1]) for (let j = 0; j < m; j++) {                               // straight side walls
      const bb0 = b0 + ((b1 - b0) * j) / m, bb1 = b0 + ((b1 - b0) * (j + 1)) / m
      F([[c + sx * R, y0, bb0], [c + sx * R, y0, bb1], [c + sx * R, yw, bb1], [c + sx * R, yw, bb0]], [sx, 0, 0], j % 2 ? grey : white, STU)
    }
    for (let i = 0; i < n; i++) {
      const t0 = Math.PI * (i / n), t1 = Math.PI * ((i + 1) / n), mid = (t0 + t1) / 2
      const xa = c + Math.cos(t0) * R, xb = c + Math.cos(t1) * R, ya = yw + Math.sin(t0) * R, yb = yw + Math.sin(t1) * R
      const col = i % 2 ? grey : white
      F([[xa, ya, b0], [xa, ya, b1], [xb, yb, b1], [xb, yb, b0]], [Math.cos(mid), Math.sin(mid), 0], col, STU)
      F([[xa, y0, b0], [xb, y0, b0], [xb, yb, b0], [xa, ya, b0]], [0, 0, -1], col, STU)             // gable face
      if (rear) F([[xa, y0, b1], [xb, y0, b1], [xb, yb, b1], [xa, ya, b1]], [0, 0, 1], col, STU)
    }
    // the gable face below the springing, between the two straight walls, is covered by the columns above
  }
  const box3 = (a0: number, a1: number, b0: number, b1: number, y0: number, y1: number, col: V3, tag: number): void => {
    F([[a0, y0, b0], [a1, y0, b0], [a1, y1, b0], [a0, y1, b0]], [0, 0, -1], col, tag)
    F([[a0, y0, b1], [a1, y0, b1], [a1, y1, b1], [a0, y1, b1]], [0, 0, 1], col, tag)
    F([[a0, y0, b0], [a0, y0, b1], [a0, y1, b1], [a0, y1, b0]], [-1, 0, 0], col, tag)
    F([[a1, y0, b0], [a1, y0, b1], [a1, y1, b1], [a1, y1, b0]], [1, 0, 0], col, tag)
    F([[a0, y1, b0], [a1, y1, b0], [a1, y1, b1], [a0, y1, b1]], [0, 1, 0], col, tag)
  }
  const disc = (ca: number, cy: number, r: number, bb: number, col: V3): void => {                 // an oculus on the gable plane
    const k = 9
    for (let i = 0; i < k; i++) {
      const y0 = -r + (2 * r * i) / k, y1 = -r + (2 * r * (i + 1)) / k, w = Math.sqrt(Math.max(0, r * r - ((y0 + y1) / 2) ** 2))
      F([[ca - w, cy + y0, bb], [ca + w, cy + y0, bb], [ca + w, cy + y1, bb], [ca - w, cy + y1, bb]], [0, 0, -1], col, 0)
    }
  }
  const yWall = MI_BASE_H + MI_WALL_H
  const hw = W / 2
  box3(-hw, hw, 0.0, MI_BAR_LEN, 0, MI_BASE_H, base, CON)                       // masonry base
  barrel(-hw, hw, 0.0, MI_BAR_LEN, MI_BASE_H, yWall, true)
  const gy = yWall + hw - 2.0
  disc(0, gy, MI_OCULUS_R + 0.15, -0.04, white)
  disc(0, gy, MI_OCULUS_R, -0.08, dark)
  F([[-0.45, MI_BASE_H + 0.8, -0.08], [0.45, MI_BASE_H + 0.8, -0.08], [0.45, MI_BASE_H + 6.0, -0.08], [-0.45, MI_BASE_H + 6.0, -0.08]], [0, 0, -1], dark, 0)
  for (let j = 0; j < 8; j++) F([[-0.45, MI_BASE_H + 1.2 + j * 0.6, -0.12], [0.45, MI_BASE_H + 1.2 + j * 0.6, -0.12], [0.45, MI_BASE_H + 1.26 + j * 0.6, -0.12], [-0.45, MI_BASE_H + 1.26 + j * 0.6, -0.12]], [0, 0, -1], grey, 0)
  for (const s of [-1, 1]) F([[s * hw * 0.56 - 0.7, 0, -0.06], [s * hw * 0.56 + 0.7, 0, -0.06], [s * hw * 0.56 + 0.7, 2.2, -0.06], [s * hw * 0.56 - 0.7, 2.2, -0.06]], [0, 0, -1], dark, 0)
  // which side the annex lies: the side of the front edge where the ring reaches out in front (b < 0)
  let side = 1
  {
    const pl = P(-hw - 3, 0, -3), pr = P(hw + 3, 0, -3)
    const inside = (x: number, z: number): boolean => {
      let c = false
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const p = ring[i]!, q = ring[j]!
        if ((p.z > z) !== (q.z > z) && x < ((q.x - p.x) * (z - p.z)) / (q.z - p.z) + p.x) c = !c
      }
      return c
    }
    side = inside(pl[0], pl[2]) && !inside(pr[0], pr[2]) ? -1 : 1
  }
  // the rear barrels, on the annex side, each lower than the one before
  let br = 2.5, aEdge = side * hw
  for (let k = 0; k < 2; k++) {
    const a0 = side < 0 ? aEdge - MI_SMALL_W - 0.3 : aEdge + 0.3, a1 = a0 + MI_SMALL_W
    const yw = yWall - MI_SMALL_DROP * (k + 1), y0 = MI_ANNEX_H - 0.2
    box3(a0, a1, br, br + MI_SMALL_LEN, 0, y0 + 0.2, base, CON)
    barrel(a0, a1, br, br + MI_SMALL_LEN, y0, yw, true)
    disc((a0 + a1) / 2, yw + MI_SMALL_W * 0.2, 0.6, br - 0.04, dark)
    br += MI_SMALL_LEN * 0.55; aEdge = side < 0 ? a0 : a1
  }
  // the ribbed drum between the front barrel and the annex
  {
    const da = side * (hw + MI_DRUM_R + 0.2), db = MI_DRUM_R + 0.6, m = Math.round(MI_DRUM_H / MI_RIB)
    const top: { x: number; z: number }[] = []
    for (let i = 0; i < MI_FACETS; i++) { const t = (Math.PI * 2 * i) / MI_FACETS; const q = P(da + Math.cos(t) * MI_DRUM_R, 0, db + Math.sin(t) * MI_DRUM_R); top.push({ x: q[0], z: q[2] }) }
    for (let j = 0; j < m; j++) for (let i = 0; i < MI_FACETS; i++) {
      const t0 = (Math.PI * 2 * i) / MI_FACETS, t1 = (Math.PI * 2 * (i + 1)) / MI_FACETS, mid = (t0 + t1) / 2
      const y0 = MI_ANNEX_H * 0.5 + j * MI_RIB, y1 = y0 + MI_RIB
      const a0 = da + Math.cos(t0) * MI_DRUM_R, b0 = db + Math.sin(t0) * MI_DRUM_R, a1 = da + Math.cos(t1) * MI_DRUM_R, b1 = db + Math.sin(t1) * MI_DRUM_R
      F([[a0, y0, b0], [a1, y0, b1], [a1, y1, b1], [a0, y1, b0]], [Math.cos(mid), 0, Math.sin(mid)], j % 2 ? drumB : drumA, MET)
    }
    capPolygon(out, top, MI_ANNEX_H * 0.5 + m * MI_RIB, roofc, MET)
  }
}

// ───────────────────────────── Synagogue de Belleville (way/70003350), rue Julien-Lacroix / rue de Pali-Kao ─────────────────────────────
// One Commons photo (Synagogue Belleville (Paris) 02.jpg, Hadonos, CC BY-SA, 2014-04-18; checked 2026-11-04): a plain ochre/grey
// rendered block with a deep parapet; the entrance is a recessed door beside a roll-down shutter under a flat canopy, the
// stone Tables of the Law set in the parapet above it; to the right a long wall with two ranks of barred windows; behind, a
// raised ochre box (corner windows, hipped corners) on the roof. The street edge is the longest ring edge (19 m, facing
// rue de Pali-Kao, bearing ~123); the door end is the one whose neighbour edge is short (the corner at Julien-Lacroix).
const SB_WALL_H = 8.4        // eaves/parapet top of the main walls
const SB_PARAPET = 0.7       // the parapet band above the cornice, slightly darker
const SB_TOP_H = 11.3        // top of the raised box
const SB_TOP_W = 6.0         // the raised box's width along the street edge
const SB_TOP_D = 5.0         // and depth into the building
const SB_TOP_AT = 0.28       // where along the street edge (from the door end) its centre lies, 0..1
const SB_DOOR_AT = 3.4       // door centre, metres from the corner end of the street edge
const SB_DOOR_W = 1.2
const SB_DOOR_H = 2.5
const SB_SHUTTER_W = 3.0     // the roll-down shutter beside the door
const SB_WIN_W = 1.25
const SB_WIN_H = 1.45
const SB_WIN_PITCH = 2.35
const SB_WIN_Y = [3.0, 6.1]  // sill heights of the two window ranks
const SB_TABLET_W = 1.9      // the Tables of the Law above the door
const SB_TABLET_H = 1.4

export function synagogueBelleville(out: MeshBuilder, fit: Fit): void {
  const wall = hex('#b9aa8a'), ochre = hex('#d2b46f'), cornice = hex('#8e8470'), dark = hex('#2b2620'), door = hex('#6b3f22'),
    shutter = hex('#6e6f6c'), stone = hex('#a8a79f'), bars = hex('#3b3a38'), roofc = hex('#6e6a63')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal'), CON = surfaceTag('concrete')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0     // the winding the extrusion below assumes
  const n = ring.length
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // walls, cornice and parapet around the whole ring (outward normal for this winding: (dz, -dx))
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L]
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, SB_WALL_H, q.z], [p.x, SB_WALL_H, p.z]], o, wall, STU)
    const k = 0.12
    quad([[p.x + o[0] * k, SB_WALL_H - 0.3, p.z + o[2] * k], [q.x + o[0] * k, SB_WALL_H - 0.3, q.z + o[2] * k], [q.x + o[0] * k, SB_WALL_H + 0.1, q.z + o[2] * k], [p.x + o[0] * k, SB_WALL_H + 0.1, p.z + o[2] * k]], o, cornice, STU)
    quad([[p.x, SB_WALL_H, p.z], [q.x, SB_WALL_H, q.z], [q.x, SB_WALL_H + SB_PARAPET, q.z], [p.x, SB_WALL_H + SB_PARAPET, p.z]], o, shade(wall, 0.92), STU)
  }
  capPolygon(out, ring, SB_WALL_H + SB_PARAPET, roofc, MET)
  // the street edge: the longest; the door end is the one with a short neighbouring edge
  let bi = 0, bl = 0
  for (let i = 0; i < n; i++) { const p = ring[i]!, q = ring[(i + 1) % n]!; const L = Math.hypot(q.x - p.x, q.z - p.z); if (L > bl) { bl = L; bi = i } }
  let a = ring[bi]!, b = ring[(bi + 1) % n]!
  const nextL = Math.hypot(ring[(bi + 2) % n]!.x - b.x, ring[(bi + 2) % n]!.z - b.z)
  const prevL = Math.hypot(a.x - ring[(bi + n - 1) % n]!.x, a.z - ring[(bi + n - 1) % n]!.z)
  if (prevL < nextL) { const t = a; a = b; b = t }          // a = the corner end (short neighbour)
  const L = Math.hypot(b.x - a.x, b.z - a.z), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
  // outward normal = the side away from the ring's centroid
  let cx = 0, cz = 0
  for (const r of ring) { cx += r.x / n; cz += r.z / n }
  let nx = -uz, nz = ux
  if ((a.x - cx) * nx + (a.z - cz) * nz < 0) { nx = -nx; nz = -nz }
  const P = (s: number, y: number, d: number): V3 => [a.x + ux * s + nx * d, y, a.z + uz * s + nz * d]
  const O: V3 = [nx, 0, nz]
  const F = (s0: number, s1: number, y0: number, y1: number, d: number, col: V3, tag: number): void =>
    quad([P(s0, y0, d), P(s1, y0, d), P(s1, y1, d), P(s0, y1, d)], O, col, tag)
  // entrance: recessed door, shutter, canopy, tablets
  const sd = SB_DOOR_AT
  F(sd - SB_DOOR_W / 2, sd + SB_DOOR_W / 2, 0, SB_DOOR_H, 0.06, door, 0)
  const ss = sd + SB_DOOR_W / 2 + 0.5
  F(ss, ss + SB_SHUTTER_W, 0, SB_DOOR_H - 0.1, 0.06, shutter, MET)
  for (let j = 0; j < 8; j++) F(ss, ss + SB_SHUTTER_W, 0.2 + j * 0.28, 0.24 + j * 0.28, 0.08, shade(shutter, 0.8), MET)
  const c0 = sd - SB_DOOR_W / 2 - 0.3, c1 = ss + SB_SHUTTER_W + 0.3
  F(c0, c1, SB_DOOR_H, SB_DOOR_H + 0.18, 0.5, dark, MET)                      // flat canopy edge
  quad([P(c0, SB_DOOR_H + 0.18, 0), P(c1, SB_DOOR_H + 0.18, 0), P(c1, SB_DOOR_H + 0.18, 0.5), P(c0, SB_DOOR_H + 0.18, 0.5)], [0, 1, 0], dark, MET)
  for (const t of [-1, 1]) F(sd + t * (SB_TABLET_W * 0.26) - SB_TABLET_W * 0.22, sd + t * (SB_TABLET_W * 0.26) + SB_TABLET_W * 0.22, SB_WALL_H - 0.2 - SB_TABLET_H, SB_WALL_H - 0.2, 0.07, stone, CON)
  // barred windows, two ranks, along the rest of the long wall
  for (let s = c1 + 1.2; s + SB_WIN_W < L - 0.6; s += SB_WIN_PITCH) for (const y of SB_WIN_Y) {
    F(s, s + SB_WIN_W, y, y + SB_WIN_H, 0.05, dark, 0)
    for (let k = 1; k < 4; k++) F(s + (SB_WIN_W * k) / 4 - 0.025, s + (SB_WIN_W * k) / 4 + 0.025, y, y + SB_WIN_H, 0.07, bars, MET)
    F(s - 0.1, s + SB_WIN_W + 0.1, y - 0.12, y, 0.1, cornice, CON)
  }
  // the raised ochre box over the middle of the street wall, set back from it
  {
    const s0 = L * SB_TOP_AT - SB_TOP_W / 2, s1 = s0 + SB_TOP_W, d0 = -1.0 - SB_TOP_D, d1 = -1.0
    const base = SB_WALL_H + SB_PARAPET, ch = 0.9
    const T = (s: number, d: number): [number, number] => { const v = P(s, 0, d); return [v[0], v[2]] }
    const pts = [[s0 + ch, d1], [s1 - ch, d1], [s1, d1 - ch], [s1, d0 + ch], [s1 - ch, d0], [s0 + ch, d0], [s0, d0 + ch], [s0, d1 - ch]] as [number, number][]
    const poly = pts.map(([s, d]) => { const t = T(s, d); return { x: t[0], z: t[1] } })
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i]!, q = poly[(i + 1) % poly.length]!, l = Math.hypot(q.x - p.x, q.z - p.z)
      // pts run s1-wards along d1 (the street side) so (dz,-dx) is the outward normal when nz,nx point outward
      const o: V3 = [-(q.z - p.z) / l, 0, (q.x - p.x) / l]
      const outward = (p.x - cx) * o[0] + (p.z - cz) * o[2] > -1e3 ? o : o
      quad([[p.x, base, p.z], [q.x, base, q.z], [q.x, SB_TOP_H, q.z], [p.x, SB_TOP_H, p.z]], outward, ochre, STU)
      if (i % 2 === 0) {                                                       // open windows on the flat faces
        const mx = (p.x + q.x) / 2, mz = (p.z + q.z) / 2, w = l * 0.72
        const ex = (q.x - p.x) / l, ez = (q.z - p.z) / l
        quad([[mx - ex * w / 2 + outward[0] * 0.05, base + 0.7, mz - ez * w / 2 + outward[2] * 0.05], [mx + ex * w / 2 + outward[0] * 0.05, base + 0.7, mz + ez * w / 2 + outward[2] * 0.05],
          [mx + ex * w / 2 + outward[0] * 0.05, SB_TOP_H - 0.5, mz + ez * w / 2 + outward[2] * 0.05], [mx - ex * w / 2 + outward[0] * 0.05, SB_TOP_H - 0.5, mz - ez * w / 2 + outward[2] * 0.05]], outward, dark, 0)
      }
    }
    capPolygon(out, poly, SB_TOP_H, roofc, MET)
  }
}

// ───────────────────────────── Synagogue de Neuilly (way/67544237), rue Ancelle / rue Jacques Dulud ─────────────────────────────
// Ullmann/Debré/Hirsch, 1953-ish rebuild of the 1904 temple; Commons photos (Synagogue de Neuilly-sur-Seine, 2026-11-04):
// cream ashlar-look render; the 10 m portal front on rue Ancelle has a tall red arched door under a stone archivolt, a
// narrow arched window each side, a belt course, a rank of three small arched lights and a star roundel above, and a
// raised central attic; at its corner with rue Jacques Dulud stands a round tower with a triple arched window under a flat
// cap; the Dulud flank has a rank of tall arched windows over a rank of small round-headed lights; iron railings at the foot.
// The portal edge is the SHORTER neighbour of the longest edge, the tower sits on their shared corner (derived from the ring).
const SNY_H = 10.6            // cornice height of the main wall
const SNY_ATTIC_H = 1.3       // the raised central attic over the portal
const SNY_ATTIC_W = 5.0
const SNY_BELT_Y = 5.7        // belt course height
const SNY_TOWER_R = 2.5       // the corner rotunda's radius
const SNY_TOWER_UP = 0.9      // how far the rotunda stands over the cornice
const SNY_DOOR_W = 2.1
const SNY_DOOR_H = 4.1
const SNY_SIDE_WIN_DX = 2.7   // the narrow windows' offset from the door centre
const SNY_SIDE_WIN_W = 0.95
const SNY_SIDE_WIN_H = 2.9
const SNY_FLANK_PITCH = 3.1   // tall flank windows' spacing
const SNY_FLANK_W = 1.05
const SNY_FLANK_H = 3.6
const SNY_FLANK_Y = 1.4
const SNY_MIN_EDGE = 1.7     // ring edges shorter than this are ignored when finding the portal and flank
const SNY_STRAIGHT = 0.25    // vertices turning less than this (radians) are merged
const SNY_CHAMFER = 7        // a neighbour edge shorter than this is the tower's chamfer, the portal lies beyond
const SNY_FENCE_OUT = 0.7     // railings stand this far off the wall
const SNY_FENCE_H = 1.1
const SNY_FENCE_POST = 1.4

export function synagogueNeuilly(out: MeshBuilder, fit: Fit): void {
  const wall = hex('#d8cdb2'), trim = hex('#e7dfca'), door = hex('#6e2630'), glass = hex('#34414c'), iron = hex('#26262a'),
    capc = hex('#8b8a85'), belt = hex('#c6b996')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal'), CON = surfaceTag('concrete')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  let cx = 0, cz = 0
  for (const r of ring) { cx += r.x / n; cz += r.z / n }
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L]
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, SNY_H, q.z], [p.x, SNY_H, p.z]], o, wall, STU)
    const k = 0.14
    quad([[p.x + o[0] * k, SNY_H - 0.35, p.z + o[2] * k], [q.x + o[0] * k, SNY_H - 0.35, q.z + o[2] * k], [q.x + o[0] * k, SNY_H + 0.1, q.z + o[2] * k], [p.x + o[0] * k, SNY_H + 0.1, p.z + o[2] * k]], o, trim, STU)
    quad([[p.x, SNY_H, p.z], [q.x, SNY_H, q.z], [q.x, SNY_H + 0.5, q.z], [p.x, SNY_H + 0.5, p.z]], o, wall, STU)
  }
  capPolygon(out, ring, SNY_H + 0.5, capc, MET)
  // simplify the ring for detection only: drop sub-SNY_MIN_EDGE edges and near-straight vertices
  const sr = ring.map((r) => ({ x: r.x, z: r.z }))
  for (let guard = 0; guard < 60; guard++) {
    const m = sr.length
    if (m <= 4) break
    let hit = -1
    for (let i = 0; i < m && hit < 0; i++) if (Math.hypot(sr[(i + 1) % m]!.x - sr[i]!.x, sr[(i + 1) % m]!.z - sr[i]!.z) < SNY_MIN_EDGE) hit = (i + 1) % m
    for (let i = 0; i < m && hit < 0; i++) {
      const A = sr[(i + m - 1) % m]!, B = sr[i]!, C = sr[(i + 1) % m]!
      const t = Math.abs(Math.atan2((B.x - A.x) * (C.z - B.z) - (B.z - A.z) * (C.x - B.x), (B.x - A.x) * (C.x - B.x) + (B.z - A.z) * (C.z - B.z)))
      if (t < SNY_STRAIGHT) hit = i
    }
    if (hit < 0) break
    sr.splice(hit, 1)
  }
  const sn = sr.length
  const el = (i: number): number => Math.hypot(sr[(i + 1) % sn]!.x - sr[i]!.x, sr[(i + 1) % sn]!.z - sr[i]!.z)
  // flank = longest edge; at its shorter-neighbour end stands the tower: a neighbour under SNY_CHAMFER long is the tower's
  // chamfered wall and the portal is the edge beyond it, else the neighbour is the portal itself
  let bi = 0
  for (let i = 0; i < sn; i++) if (el(i) > el(bi)) bi = i
  const nextI = (bi + 1) % sn, prevI = (bi + sn - 1) % sn
  const useNext = el(nextI) <= el(prevI)
  const flankFar = useNext ? sr[bi]! : sr[(bi + 1) % sn]!
  const corner = useNext ? sr[(bi + 1) % sn]! : sr[bi]!
  const nbI = useNext ? nextI : prevI
  const chamfer = el(nbI) < SNY_CHAMFER
  let cornerP = corner, portalFar = useNext ? sr[(bi + 2) % sn]! : sr[(bi + sn - 1) % sn]!
  if (chamfer) {
    cornerP = useNext ? sr[(bi + 2) % sn]! : sr[(bi + sn - 1) % sn]!
    portalFar = useNext ? sr[(bi + 3) % sn]! : sr[(bi + sn - 2 + sn) % sn]!
  }
  // a face frame from corner toward `far`: P(s, y, d) with d outward
  const frame = (org: { x: number; z: number }, far: { x: number; z: number }) => {
    const L = Math.hypot(far.x - org.x, far.z - org.z), ux = (far.x - org.x) / L, uz = (far.z - org.z) / L
    let nx = -uz, nz = ux
    if ((org.x - cx) * nx + (org.z - cz) * nz < 0) { nx = -nx; nz = -nz }
    const P = (s: number, y: number, d: number): V3 => [org.x + ux * s + nx * d, y, org.z + uz * s + nz * d]
    const O: V3 = [nx, 0, nz]
    const F = (s0: number, s1: number, y0: number, y1: number, d: number, col: V3, tag: number): void =>
      quad([P(s0, y0, d), P(s1, y0, d), P(s1, y1, d), P(s0, y1, d)], O, col, tag)
    // a round-headed opening: rectangle plus a half-disc of strips
    const arch = (sc: number, y0: number, w: number, h: number, d: number, col: V3, tag: number): void => {
      const r = w / 2, yb = y0 + h - r
      F(sc - r, sc + r, y0, yb, d, col, tag)
      const m = 6
      for (let i = 0; i < m; i++) {
        const x0 = -r + (2 * r * i) / m, x1 = -r + (2 * r * (i + 1)) / m, xm = Math.abs((x0 + x1) / 2)
        F(sc + x0, sc + x1, yb, yb + Math.sqrt(Math.max(r * r - xm * xm, 0)), d, col, tag)
      }
    }
    const fence = (s0: number, s1: number): void => {
      for (const y of [0.3, SNY_FENCE_H - 0.1]) F(s0, s1, y, y + 0.06, SNY_FENCE_OUT, iron, MET)
      for (let s = s0; s <= s1 + 0.01; s += SNY_FENCE_POST) F(Math.min(s, s1) - 0.03, Math.min(s, s1) + 0.03, 0, SNY_FENCE_H, SNY_FENCE_OUT, iron, MET)
    }
    return { L, F, arch, fence, P, O, ux, uz, nx, nz }
  }
  const T = frame(cornerP, portalFar), Fl = frame(corner, flankFar)
  const TR = chamfer ? Math.max(2.2, Math.hypot(cornerP.x - corner.x, cornerP.z - corner.z) / 2) : SNY_TOWER_R
  const t0 = chamfer ? 0.9 : TR + 0.35
  const mid = (t0 + T.L - 0.3) / 2
  // portal front: archivolt, door, flanking windows, belt, upper lights, roundel, attic
  T.arch(mid, 0, SNY_DOOR_W + 1.0, SNY_DOOR_H + 0.7, 0.05, trim, STU)
  T.arch(mid, 0, SNY_DOOR_W, SNY_DOOR_H, 0.09, door, 0)
  for (const sgn of [-1, 1]) {
    T.arch(mid + sgn * SNY_SIDE_WIN_DX, 1.3, SNY_SIDE_WIN_W + 0.4, SNY_SIDE_WIN_H + 0.3, 0.05, trim, STU)
    T.arch(mid + sgn * SNY_SIDE_WIN_DX, 1.4, SNY_SIDE_WIN_W, SNY_SIDE_WIN_H, 0.09, glass, 0)
  }
  T.F(t0 - 0.2, T.L - 0.1, SNY_BELT_Y, SNY_BELT_Y + 0.22, 0.08, belt, STU)
  for (const sgn of [-1, 0, 1]) { T.arch(mid + sgn * 1.2, 7.1, 0.9, 1.9, 0.06, trim, STU); T.arch(mid + sgn * 1.2, 7.2, 0.62, 1.65, 0.1, glass, 0) }
  {
    const r = 0.6, cy = 9.5, m = 10
    for (let i = 0; i < m; i++) {                       // star roundel as a decagon of slim wedges
      const a0 = (i / m) * Math.PI * 2, a1 = ((i + 1) / m) * Math.PI * 2
      quad([T.P(mid, cy, 0.1), T.P(mid + Math.cos(a0) * r, cy + Math.sin(a0) * r, 0.1), T.P(mid + Math.cos(a1) * r, cy + Math.sin(a1) * r, 0.1), T.P(mid, cy, 0.1)], T.O, i % 2 ? trim : glass, 0)
    }
  }
  T.F(mid - SNY_ATTIC_W / 2, mid + SNY_ATTIC_W / 2, SNY_H + 0.5, SNY_H + 0.5 + SNY_ATTIC_H, 0.0, wall, STU)
  T.F(mid - SNY_ATTIC_W / 2 - 0.1, mid + SNY_ATTIC_W / 2 + 0.1, SNY_H + 0.5 + SNY_ATTIC_H, SNY_H + 0.5 + SNY_ATTIC_H + 0.18, 0.1, trim, STU)
  quad([T.P(mid - SNY_ATTIC_W / 2 - 0.1, SNY_H + 0.5 + SNY_ATTIC_H + 0.18, 0.1), T.P(mid + SNY_ATTIC_W / 2 + 0.1, SNY_H + 0.5 + SNY_ATTIC_H + 0.18, 0.1),
    T.P(mid + SNY_ATTIC_W / 2 + 0.1, SNY_H + 0.5 + SNY_ATTIC_H + 0.18, -0.6), T.P(mid - SNY_ATTIC_W / 2 - 0.1, SNY_H + 0.5 + SNY_ATTIC_H + 0.18, -0.6)], [0, 1, 0], capc, MET)
  T.fence(t0, T.L - 0.3)
  // flank: tall arched windows over small lights, belt course, railings
  Fl.F(t0 - 0.2, Fl.L - 0.2, SNY_BELT_Y, SNY_BELT_Y + 0.22, 0.08, belt, STU)
  for (let s = t0 + 0.8 + SNY_FLANK_W / 2; s + SNY_FLANK_W / 2 < Fl.L - 0.8; s += SNY_FLANK_PITCH) {
    Fl.arch(s, SNY_FLANK_Y, SNY_FLANK_W + 0.36, SNY_FLANK_H + 0.3, 0.05, trim, STU)
    Fl.arch(s, SNY_FLANK_Y + 0.05, SNY_FLANK_W, SNY_FLANK_H, 0.09, glass, 0)
    Fl.arch(s, 7.0, 0.8, 1.6, 0.08, glass, 0)
  }
  Fl.fence(t0, Fl.L - 0.3)
  // the corner rotunda, standing inside the corner on its bisector
  {
    let bx = -(T.nx + Fl.nx), bz = -(T.nz + Fl.nz)
    const bl2 = Math.hypot(bx, bz) || 1; bx /= bl2; bz /= bl2
    const R = TR, ccx = (corner.x + cornerP.x) / 2 + bx * R * 0.45, ccz = (corner.z + cornerP.z) / 2 + bz * R * 0.45, top = SNY_H + SNY_TOWER_UP
    prism(out, ccx, ccz, 0, top, R, 14, wall, STU)
    prism(out, ccx, ccz, top, top + 0.35, R * 1.08, 14, trim, STU, R * 1.08, false)
    prism(out, ccx, ccz, top + 0.35, top + 0.6, R * 1.0, 14, capc, MET, R * 0.9)
    prism(out, ccx, ccz, SNY_BELT_Y, SNY_BELT_Y + 0.22, R * 1.03, 14, belt, STU, R * 1.03, false)
    const ox = -bx, oz = -bz
    for (const a of [-0.45, 0, 0.45]) {
      const c = Math.cos(a), s = Math.sin(a), dx = ox * c - oz * s, dz = ox * s + oz * c
      const px = ccx + dx * (R + 0.06), pz = ccz + dz * (R + 0.06), tx = -dz, tz = dx, w = 0.5
      const yb = SNY_BELT_Y + 1.2, hh = 3.4
      quad([[px - tx * w, yb, pz - tz * w], [px + tx * w, yb, pz + tz * w], [px + tx * w, yb + hh, pz + tz * w], [px - tx * w, yb + hh, pz - tz * w]], [dx, 0, dz], glass, 0)
      quad([[px - tx * (w + 0.15), yb + hh, pz - tz * (w + 0.15)], [px + tx * (w + 0.15), yb + hh, pz + tz * (w + 0.15)], [px + tx * (w + 0.15), yb + hh + 0.2, pz + tz * (w + 0.15)], [px - tx * (w + 0.15), yb + hh + 0.2, pz - tz * (w + 0.15)]], [dx, 0, dz], trim, STU)
      const lw = 0.32, ly = 1.6
      quad([[px - tx * lw, ly, pz - tz * lw], [px + tx * lw, ly, pz + tz * lw], [px + tx * lw, ly + 1.6, pz + tz * lw], [px - tx * lw, ly + 1.6, pz - tz * lw]], [dx, 0, dz], glass, 0)
    }
  }
  void CON
}

// ───────────────────── Église orthodoxe roumaine des Saints-Archanges (way/55366403), 9 bis rue Jean-de-Beauvais ─────────────────────
// The chapel of the Collège de Beauvais (14th c., Gothic). Read off the Commons photographs (Médiathèque de l'architecture,
// Durand, "Collège de Beauvais (ancien) - Chapelle, ensemble ouest", 2026-11-04) and IGN lidar MNS (ridge ~17 m over ground,
// a lower stepped roof either side): a steep stone gable on the street, a tall pointed traceried window over a pointed portal,
// a small oculus under the apex, stepped buttresses at the corners, and a slim lead spire (flèche) over the ridge. The nave is
// the street-side bay of the footprint; the rest is lower wings. Local −z is the street (the manifest's front 297° = the west
// wall's outward normal, and fitSnug turns −z to it); the nave is centred on the street edge, found from the ring.
const SA_WING_H = 8.6         // the lower wings' parapet / eaves
const SA_EAVES = 10.8         // nave eaves
const SA_RIDGE = 17.2         // nave ridge (lidar)
const SA_NAVE_W = 11.0        // nave width at the gable
const SA_WALL_OVER = 0.0      // nave wall pushed out of the ring face
const SA_WIN_W = 4.4          // street window width
const SA_WIN_Y = 4.4          // sill height
const SA_WIN_H = 7.6          // window height incl. pointed head
const SA_DOOR_W = 2.4
const SA_DOOR_H = 3.6
const SA_BUTT_W = 1.1         // buttress width
const SA_BUTT_OUT = 0.8       // buttress projection
const SA_SPIRE_Z = 0.55       // spire position along the nave (fraction of its length)
const SA_SPIRE_TOP = 29.0     // spire tip height
const SA_SPIRE_R = 1.3        // spire base radius

export function eglisesSaintsArchanges(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cdc3a9'), dark = hex('#2b2f36'), slate = hex('#4a4e57'), glass = hex('#2e3a4a'), trim = hex('#b9ae90'), lead = hex('#5d6168')
  const MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // ring extent in z at a given x (min and max over the edges that span it)
  const zAt = (x: number): [number, number] => {
    let lo = Infinity, hi = -Infinity
    for (let i = 0; i < n; i++) {
      const p = ring[i]!, q = ring[(i + 1) % n]!
      if ((p.x - x) * (q.x - x) > 0 || p.x === q.x) continue
      const z = p.z + ((x - p.x) / (q.x - p.x)) * (q.z - p.z)
      lo = Math.min(lo, z); hi = Math.max(hi, z)
    }
    return lo === Infinity ? [-fit.hz, fit.hz] : [lo, hi]
  }
  // the street edge's x-range: vertices within 3 m of the front
  let fx0 = Infinity, fx1 = -Infinity
  for (const r of ring) if (r.z < -fit.hz + 3) { fx0 = Math.min(fx0, r.x); fx1 = Math.max(fx1, r.x) }
  if (fx0 === Infinity) { fx0 = -fit.hx; fx1 = fit.hx }
  const nc = (fx0 + fx1) / 2, nx0 = nc - SA_NAVE_W / 2, nx1 = nc + SA_NAVE_W / 2
  const [zf0] = zAt(nc), zb = zAt(nc)[1]
  const zf = zf0 - SA_WALL_OVER
  // ring walls (wings) and flat slate roof
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L]
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, SA_WING_H, q.z], [p.x, SA_WING_H, p.z]], o, stone, 0)
    quad([[p.x, SA_WING_H - 0.3, p.z], [q.x, SA_WING_H - 0.3, q.z], [q.x, SA_WING_H, q.z], [p.x, SA_WING_H, p.z]].map((v) => [v[0]! + o[0] * 0.12, v[1]!, v[2]! + o[2] * 0.12] as V3), o, trim, 0)
  }
  capPolygon(out, ring, SA_WING_H, slate, MET)
  // nave: side walls, gable ends, two roof slopes
  const wallQ = (xx: number, o: V3): void => quad([[xx, 0, zf], [xx, 0, zb], [xx, SA_EAVES, zb], [xx, SA_EAVES, zf]], o, stone, 0)
  wallQ(nx0, [-1, 0, 0]); wallQ(nx1, [1, 0, 0])
  const gable = (z: number, o: V3, col: V3, tag: number): void =>
    quad([[nx0, SA_EAVES, z], [nx1, SA_EAVES, z], [nc, SA_RIDGE, z], [nc, SA_RIDGE, z]], o, col, tag)
  gable(zf, [0, 0, -1], stone, 0); gable(zb, [0, 0, 1], stone, 0)
  quad([[nx0 - 0.4, SA_EAVES - 0.05, zf - 0.2], [nc, SA_RIDGE + 0.1, zf - 0.2], [nc, SA_RIDGE + 0.1, zb + 0.2], [nx0 - 0.4, SA_EAVES - 0.05, zb + 0.2]], [-0.8, 0.6, 0], slate, MET)
  quad([[nx1 + 0.4, SA_EAVES - 0.05, zf - 0.2], [nc, SA_RIDGE + 0.1, zf - 0.2], [nc, SA_RIDGE + 0.1, zb + 0.2], [nx1 + 0.4, SA_EAVES - 0.05, zb + 0.2]], [0.8, 0.6, 0], slate, MET)
  // gable-edge coping: slim bands up each rake
  for (const s of [-1, 1]) {
    const xe = nc + s * (SA_NAVE_W / 2 + 0.25)
    quad([[xe, SA_EAVES - 0.1, zf - 0.22], [nc, SA_RIDGE + 0.3, zf - 0.22], [nc, SA_RIDGE + 0.55, zf - 0.22], [xe, SA_EAVES + 0.15, zf - 0.22]], [0, 0, -1], trim, 0)
  }
  // street face: F(x0,x1,y0,y1,d) a quad d m proud of the gable plane
  const F = (x0: number, x1: number, y0: number, y1: number, d: number, col: V3, tag = 0): void =>
    quad([[x0, y0, zf - d], [x1, y0, zf - d], [x1, y1, zf - d], [x0, y1, zf - d]], [0, 0, -1], col, tag)
  // a pointed opening: rectangle plus a two-slope head (equilateral-ish arch drawn as a triangle apex)
  const pointed = (xc: number, y0: number, w: number, h: number, d: number, col: V3, tag = 0): void => {
    const hh = w * 0.95, yb = y0 + h - hh
    F(xc - w / 2, xc + w / 2, y0, yb, d, col, tag)
    quad([[xc - w / 2, yb, zf - d], [xc + w / 2, yb, zf - d], [xc, y0 + h, zf - d], [xc, y0 + h, zf - d]], [0, 0, -1], col, tag)
  }
  pointed(nc, SA_WIN_Y - 0.35, SA_WIN_W + 0.7, SA_WIN_H + 0.55, 0.05, trim)
  pointed(nc, SA_WIN_Y, SA_WIN_W, SA_WIN_H, 0.1, glass)
  for (const dx of [-SA_WIN_W / 6, SA_WIN_W / 6]) F(nc + dx - 0.07, nc + dx + 0.07, SA_WIN_Y, SA_WIN_Y + SA_WIN_H - SA_WIN_W * 0.5, 0.16, trim)   // mullions
  F(nc - SA_WIN_W / 2, nc + SA_WIN_W / 2, SA_WIN_Y + 3.2, SA_WIN_Y + 3.35, 0.16, trim)                                                           // transom
  pointed(nc, 0, SA_DOOR_W + 0.7, SA_DOOR_H + 0.5, 0.05, trim)
  pointed(nc, 0, SA_DOOR_W, SA_DOOR_H, 0.1, dark)
  F(nc - SA_NAVE_W / 2, nc + SA_NAVE_W / 2, SA_WIN_Y - 0.9, SA_WIN_Y - 0.75, 0.08, trim)                                                           // string course
  {
    const r = 0.75, cy = SA_RIDGE - 2.3, m = 12
    for (let i = 0; i < m; i++) {
      const a0 = (i / m) * Math.PI * 2, a1 = ((i + 1) / m) * Math.PI * 2
      quad([[nc, cy, zf - 0.1], [nc + Math.cos(a0) * r, cy + Math.sin(a0) * r, zf - 0.1], [nc + Math.cos(a1) * r, cy + Math.sin(a1) * r, zf - 0.1], [nc, cy, zf - 0.1]], [0, 0, -1], i % 2 ? trim : glass, 0)
    }
  }
  // buttresses at the gable's corners and along the nave flanks, stepped
  const butt = (x0: number, x1: number, z0: number, z1: number, h: number): void => {
    block(out, x0, x1, z0, z1, 0, h, stone)
    block(out, x0 + 0.1, x1 - 0.1, z0 + 0.1, z1 - 0.1, h, h + 0.35, trim)
  }
  for (const s of [-1, 1]) {
    const xs = s < 0 ? nx0 - SA_BUTT_OUT : nx1
    butt(xs, xs + SA_BUTT_OUT, zf - SA_BUTT_OUT, zf + 0.5, SA_EAVES - 1.5)
    for (let z = zf + 3.5; z < zb - 2; z += 4) butt(xs, xs + SA_BUTT_OUT, z, z + SA_BUTT_W, SA_EAVES - 2.5)
  }
  // lead spire over the ridge: octagonal, slim, with a lower collar
  const sz = zf + (zb - zf) * SA_SPIRE_Z
  prism(out, nc, sz, SA_RIDGE, SA_RIDGE + 2.0, SA_SPIRE_R * 1.1, 8, slate, MET, SA_SPIRE_R)
  prism(out, nc, sz, SA_RIDGE + 2.0, SA_SPIRE_TOP, SA_SPIRE_R, 8, lead, MET, 0.05)
}

// ───────────────────────────── Synagogue Chasseloup-Laubat (way/54117312), rue Chasseloup-Laubat, 15e ──────────────
// Byzantine-Romanesque temple (Commons "Synagogue Chasseloup-Laubat", 2026-11-04): the street front is a stepped gable of
// yellow brick framed by pale stone pilasters and a raking stone band; a tall stone arch holds a big eight-petal rose
// window, an arcade of three arched portals under it; the aisles stand lower either side with a narrow arched slit
// each; the flanks are tan stone with ranks of round-headed windows under slate roofs and iron railings at the foot.
const SCL_NAVE_H = 8.8        // nave eaves
const SCL_RIDGE = 13.9        // gable apex
const SCL_SIDE_H = 5.4        // aisle / flank wall height
const SCL_NAVE_FRAC = 0.62    // nave width as a share of the street front
const SCL_NAVE_LEN = 14       // nave depth behind the front
const SCL_PIL_W = 0.9         // pilaster width at each end of the gable
const SCL_RAKE_W = 0.5        // raking band along the gable
const SCL_ARCH_W = 6.2        // the tall arch of the gable
const SCL_ARCH_Y0 = 3.7       // its springing-free base
const SCL_ARCH_TOP = 10.4
const SCL_ROSE_R = 2.0
const SCL_ROSE_Y = 7.5
const SCL_PORTAL_W = 1.8
const SCL_PORTAL_H = 3.3
const SCL_FLANK_PITCH = 2.7   // flank windows' spacing
const SCL_FLANK_W = 1.0
const SCL_FLANK_H = 3.0
const SCL_FLANK_Y = 1.5
const SCL_FIRST_SEG = 3.6     // first flank window's distance from the front corner
const SCL_FACADE_LONGER = true // the street front is the longer neighbour of the flank (the gable end), not the shorter

export function synagogueChasseloup(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#d9c8a0'), brick = hex('#c9a860'), dark = hex('#2e2a28'), glass = hex('#3a3f4a'), slate = hex('#5c5f66'),
    door = hex('#6a3f24'), band = hex('#e6dab8'), iron = hex('#26262a')
  const BRK = surfaceTag('brick'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  let cx = 0, cz = 0
  for (const r of ring) { cx += r.x / n; cz += r.z / n }
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // aisle / flank walls round the whole ring
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L]
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, SCL_SIDE_H, q.z], [p.x, SCL_SIDE_H, p.z]], o, stone, 0)
    const k = 0.15
    quad([[p.x + o[0] * k, SCL_SIDE_H - 0.3, p.z + o[2] * k], [q.x + o[0] * k, SCL_SIDE_H - 0.3, q.z + o[2] * k], [q.x + o[0] * k, SCL_SIDE_H + 0.05, q.z + o[2] * k], [p.x + o[0] * k, SCL_SIDE_H + 0.05, p.z + o[2] * k]], o, band, 0)
  }
  capPolygon(out, ring, SCL_SIDE_H + 0.05, slate, MET)
  // simplify for detection: merge near-straight vertices and drop tiny edges
  const sr = ring.map((r) => ({ x: r.x, z: r.z }))
  for (let guard = 0; guard < 60; guard++) {
    const m = sr.length
    if (m <= 4) break
    let hit = -1
    for (let i = 0; i < m && hit < 0; i++) if (Math.hypot(sr[(i + 1) % m]!.x - sr[i]!.x, sr[(i + 1) % m]!.z - sr[i]!.z) < SNY_MIN_EDGE) hit = (i + 1) % m
    for (let i = 0; i < m && hit < 0; i++) {
      const A = sr[(i + m - 1) % m]!, B = sr[i]!, C = sr[(i + 1) % m]!
      const t = Math.abs(Math.atan2((B.x - A.x) * (C.z - B.z) - (B.z - A.z) * (C.x - B.x), (B.x - A.x) * (C.x - B.x) + (B.z - A.z) * (C.z - B.z)))
      if (t < SNY_STRAIGHT) hit = i
    }
    if (hit < 0) break
    sr.splice(hit, 1)
  }
  const sn = sr.length
  const el = (i: number): number => Math.hypot(sr[(i + 1) % sn]!.x - sr[i]!.x, sr[(i + 1) % sn]!.z - sr[i]!.z)
  let bi = 0
  for (let i = 0; i < sn; i++) if (el(i) > el(bi)) bi = i
  const nextI = (bi + 1) % sn, prevI = (bi + sn - 1) % sn
  const useNext = SCL_FACADE_LONGER ? el(nextI) >= el(prevI) : el(nextI) <= el(prevI)
  const fi = useNext ? nextI : prevI                       // the street front edge: sr[fi] -> sr[fi+1]
  const a = sr[fi]!, b = sr[(fi + 1) % sn]!
  const W = el(fi), ux = (b.x - a.x) / W, uz = (b.z - a.z) / W
  let nx = -uz, nz = ux
  if ((a.x - cx) * nx + (a.z - cz) * nz < 0) { nx = -nx; nz = -nz }
  const P = (s: number, y: number, d: number): V3 => [a.x + ux * s + nx * d, y, a.z + uz * s + nz * d]
  const O: V3 = [nx, 0, nz]
  const F = (s0: number, s1: number, y0: number, y1: number, d: number, col: V3, tag: number): void =>
    quad([P(s0, y0, d), P(s1, y0, d), P(s1, y1, d), P(s0, y1, d)], O, col, tag)
  // a round-headed panel on the front plane (rect + half-disc fan)
  const archF = (sc: number, y0: number, w: number, h: number, d: number, col: V3, tag: number, o: V3 = O, fr = P): void => {
    const yb = y0 + h - w / 2, r = w / 2
    quad([fr(sc - r, y0, d), fr(sc + r, y0, d), fr(sc + r, yb, d), fr(sc - r, yb, d)], o, col, tag)
    const N = 8
    for (let k = 0; k < N; k++) {
      const a0 = (k / N) * Math.PI, a1 = ((k + 1) / N) * Math.PI
      quad([fr(sc + Math.cos(a0) * r, yb + Math.sin(a0) * r, d), fr(sc + Math.cos(a1) * r, yb + Math.sin(a1) * r, d), fr(sc, yb, d), fr(sc, yb, d)], o, col, tag)
    }
  }
  const nw = Math.min(W - 2, W * SCL_NAVE_FRAC), s0 = (W - nw) / 2, s1 = s0 + nw, sm = W / 2
  const depth = SCL_NAVE_LEN
  // the nave: front gable (brick), side walls and rear gable, slate roof
  quad([P(s0, 0, 0), P(s1, 0, 0), P(s1, SCL_NAVE_H, 0), P(s0, SCL_NAVE_H, 0)], O, brick, BRK)
  quad([P(s0, SCL_NAVE_H, 0), P(s1, SCL_NAVE_H, 0), P(sm, SCL_RIDGE, 0), P(sm, SCL_RIDGE, 0)], O, brick, BRK)
  const Ob: V3 = [-nx, 0, -nz], Ou: V3 = [ux, 0, uz], Ou2: V3 = [-ux, 0, -uz]
  quad([P(s0, 0, -depth), P(s1, 0, -depth), P(s1, SCL_NAVE_H, -depth), P(s0, SCL_NAVE_H, -depth)], Ob, stone, 0)
  quad([P(s0, SCL_NAVE_H, -depth), P(s1, SCL_NAVE_H, -depth), P(sm, SCL_RIDGE, -depth), P(sm, SCL_RIDGE, -depth)], Ob, stone, 0)
  for (const [s, o] of [[s0, Ou2], [s1, Ou]] as [number, V3][]) {
    quad([P(s, SCL_SIDE_H, 0), P(s, SCL_SIDE_H, -depth), P(s, SCL_NAVE_H, -depth), P(s, SCL_NAVE_H, 0)], o, stone, 0)
    for (let d = 1.6; d < depth - 1; d += 2.6) quad([P(s + o[0] * 0 + (o === Ou ? 0.04 : -0.04), SCL_SIDE_H + 0.5, -d), P(s + (o === Ou ? 0.04 : -0.04), SCL_SIDE_H + 0.5, -d - 1.0), P(s + (o === Ou ? 0.04 : -0.04), SCL_NAVE_H - 0.5, -d - 1.0), P(s + (o === Ou ? 0.04 : -0.04), SCL_NAVE_H - 0.5, -d)], o, glass, 0)
  }
  const rise = SCL_RIDGE - SCL_NAVE_H, ov = 0.35
  for (const t of [-1, 1]) {   // the two roof slopes, overhanging the eaves a little
    const se = t < 0 ? s0 - ov : s1 + ov, ye = SCL_NAVE_H - ov * (rise / (nw / 2))
    const slope = Math.hypot(nw / 2, rise)
    const oo: V3 = [ux * t * rise / slope, (nw / 2) / slope, uz * t * rise / slope]
    quad([P(se, ye, 0.3), P(sm, SCL_RIDGE + 0.1, 0.3), P(sm, SCL_RIDGE + 0.1, -depth - 0.3), P(se, ye, -depth - 0.3)], oo, slate, MET)
  }
  // facade: pilasters and raking band in pale stone, proud of the brick
  F(s0, s0 + SCL_PIL_W, 0, SCL_NAVE_H, 0.1, stone, 0)
  F(s1 - SCL_PIL_W, s1, 0, SCL_NAVE_H, 0.1, stone, 0)
  for (const t of [-1, 1]) {
    const sA = t < 0 ? s0 : s1, sB = sm
    quad([P(sA, SCL_NAVE_H, 0.12), P(sB, SCL_RIDGE, 0.12), P(sB, SCL_RIDGE - SCL_RAKE_W * 1.4, 0.12), P(sA, SCL_NAVE_H - SCL_RAKE_W * 1.4, 0.12)], O, stone, 0)
  }
  // the tall arch: stone surround, pale recess, rose window and the arcade of portals
  const aw = SCL_ARCH_W, ah = SCL_ARCH_TOP - SCL_ARCH_Y0
  archF(sm, SCL_ARCH_Y0, aw + 1.2, ah + 0.6, 0.14, band, 0)
  archF(sm, SCL_ARCH_Y0, aw, ah, 0.18, stone, 0)
  const rN = 16, R = SCL_ROSE_R
  const disc = (r: number, d: number, col: V3, tag: number): void => {
    for (let k = 0; k < rN; k++) {
      const a0 = (k / rN) * Math.PI * 2, a1 = ((k + 1) / rN) * Math.PI * 2
      quad([P(sm + Math.cos(a0) * r, SCL_ROSE_Y + Math.sin(a0) * r, d), P(sm + Math.cos(a1) * r, SCL_ROSE_Y + Math.sin(a1) * r, d), P(sm, SCL_ROSE_Y, d), P(sm, SCL_ROSE_Y, d)], O, col, tag)
    }
  }
  disc(R * 1.12, 0.22, band, 0)
  disc(R, 0.26, glass, 0)
  for (let k = 0; k < 8; k++) {                       // eight stone spokes, then the petal arcs as a ring of lobes
    const ang = (k / 8) * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang), hw = 0.07
    quad([P(sm + c * R * 0.2 - s * hw, SCL_ROSE_Y + s * R * 0.2 + c * hw, 0.3), P(sm + c * R - s * hw, SCL_ROSE_Y + s * R + c * hw, 0.3), P(sm + c * R + s * hw, SCL_ROSE_Y + s * R - c * hw, 0.3), P(sm + c * R * 0.2 + s * hw, SCL_ROSE_Y + s * R * 0.2 - c * hw, 0.3)], O, band, 0)
  }
  disc(R * 0.78, 0.28, glass, 0)
  disc(R * 0.2, 0.32, band, 0)
  for (let k = 0; k < 8; k++) {                       // petal lobes: small stone discs on the spoke tips
    const ang = ((k + 0.5) / 8) * Math.PI * 2, px = sm + Math.cos(ang) * R * 0.74, py = SCL_ROSE_Y + Math.sin(ang) * R * 0.74
    for (let j = 0; j < 8; j++) {
      const a0 = (j / 8) * Math.PI * 2, a1 = ((j + 1) / 8) * Math.PI * 2, rr = R * 0.07
      quad([P(px + Math.cos(a0) * rr, py + Math.sin(a0) * rr, 0.34), P(px + Math.cos(a1) * rr, py + Math.sin(a1) * rr, 0.34), P(px, py, 0.34), P(px, py, 0.34)], O, band, 0)
    }
  }
  for (const t of [-1, 0, 1]) {                       // three round-headed portals, the middle one the door
    const sc = sm + t * (SCL_PORTAL_W + 0.4)
    archF(sc, 0, SCL_PORTAL_W + 0.5, SCL_PORTAL_H + 0.4, 0.14, band, 0)
    archF(sc, 0, SCL_PORTAL_W, SCL_PORTAL_H, 0.2, t === 0 ? door : dark, 0)
  }
  // aisle fronts: narrow arched slit each side
  for (const sc of [s0 / 2, (s1 + W) / 2]) archF(sc, 1.6, 0.8, 2.9, 0.06, dark, 0)
  // flank windows: along every long edge other than the front, from the front end back
  for (let i = 0; i < sn; i++) {
    if (i === fi) continue
    const p = sr[i]!, q = sr[(i + 1) % sn]!, L = el(i)
    if (L < 5) continue
    let fx = (q.x - p.x) / L, fz = (q.z - p.z) / L
    const ox = fz, oz = -fx
    // start from the end nearest the front corners
    const dA = Math.hypot(p.x - a.x, p.z - a.z), dB = Math.hypot(p.x - b.x, p.z - b.z), dC = Math.hypot(q.x - a.x, q.z - a.z), dD = Math.hypot(q.x - b.x, q.z - b.z)
    let sx = p.x, sz = p.z
    if (Math.min(dC, dD) < Math.min(dA, dB)) { sx = q.x; sz = q.z; fx = -fx; fz = -fz }
    const Q = (s: number, y: number, d: number): V3 => [sx + fx * s + ox * d, y, sz + fz * s + oz * d]
    // outward must point away from the centroid
    const mx = (p.x + q.x) / 2 - cx, mz = (p.z + q.z) / 2 - cz
    const flip = mx * ox + mz * oz < 0 ? -1 : 1
    const Qf = (s: number, y: number, d: number): V3 => Q(s, y, d * flip)
    const of: V3 = [ox * flip, 0, oz * flip]
    for (let s = SCL_FIRST_SEG; s + SCL_FLANK_W < L - 1.0; s += SCL_FLANK_PITCH) {
      archF(s + SCL_FLANK_W / 2, SCL_FLANK_Y - 0.15, SCL_FLANK_W + 0.3, SCL_FLANK_H + 0.3, 0.05, band, 0, of, Qf)
      archF(s + SCL_FLANK_W / 2, SCL_FLANK_Y, SCL_FLANK_W, SCL_FLANK_H, 0.09, dark, 0, of, Qf)
    }
  }
  // iron railing along the street front
  const rh = 1.2
  F(0, W, rh - 0.06, rh, 0.9, iron, MET)
  for (let s = 0.2; s < W; s += 0.45) F(s, s + 0.05, 0, rh, 0.9, iron, MET)
}

// ───────────────────────────── Église Saint-Sava (way/78020644), 23 rue du Simplon, 18e ──────────────────────────────
// Serbian Orthodox, a former Protestant church. Read off two Commons photographs ("Church of Saint Sava, Paris.jpg",
// "Eglise Saint-Sava -1.JPG", 2026-11-04) and the IGN MNS (nave ridge ~19 m over its street, presbytery 14-17 m): a narrow
// buff-stone gable on the street with a pointed-arch door in a stepped pilaster frame, a round-headed recess over it holding
// three tall arched lights, a small oculus, and a little bell turret on the apex; a lower presbytery in the same stone
// continues the frontage, with a barred ground floor, a gabled porch hood, and a slate mansard with dormers. The street
// edge is found from the ring (the 9+ m edge farthest from the longest, back edge); the presbytery is on the end whose
// neighbouring edge continues the frontage line. Frame: a along the frontage toward the presbytery, b inward from it.
const SS_MIN_FRONT = 9        // the gable edge is at least this long
const SS_EAVES = 11.2         // nave eaves
const SS_RIDGE = 16.0         // nave ridge
const SS_NAVE_D = 15          // nave depth behind the gable
const SS_BELL_TOP = 20.5      // turret tip
const SS_PIL_W = 0.8          // corner pilaster width
const SS_PIL_OUT = 0.25
const SS_DOOR_W = 1.7
const SS_DOOR_H = 3.3
const SS_REC_W = 4.2          // round-headed recess over the door
const SS_REC_Y = 5.0
const SS_REC_H = 5.4
const SS_PRES_EAVES = 10.2    // presbytery cornice
const SS_PRES_TOP = 14.0      // mansard top
const SS_PRES_D = 14          // presbytery depth
const SS_MANSARD_IN = 1.8     // mansard slope inset
const SS_WIN_PITCH = 2.6      // presbytery window spacing
const SS_REST_H = 8.4         // the plain walls round the rest of the ring
const SS_FLIP = false         // mirror the presbytery to the other end

export function eglisesSaintSava(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cdbf9c'), trim = hex('#dccfae'), dark = hex('#3b2a22'), slate = hex('#4b4f58'), glass = hex('#2e3a4a'),
    iron = hex('#26262a'), bell = hex('#7d6a3a'), wood = hex('#6b3d22')
  const MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  let cx = 0, cz = 0
  for (const r of ring) { cx += r.x / n; cz += r.z / n }
  const len = (i: number): number => { const p = ring[i]!, q = ring[(i + 1) % n]!; return Math.hypot(q.x - p.x, q.z - p.z) }
  const mid = (i: number): [number, number] => { const p = ring[i]!, q = ring[(i + 1) % n]!; return [(p.x + q.x) / 2, (p.z + q.z) / 2] }
  let back = 0
  for (let i = 1; i < n; i++) if (len(i) > len(back)) back = i
  const bm = mid(back)
  let fi = -1, fd = -1
  for (let i = 0; i < n; i++) {
    if (i === back || len(i) < SS_MIN_FRONT) continue
    const m = mid(i), d = Math.hypot(m[0] - bm[0], m[1] - bm[1])
    if (d > fd) { fd = d; fi = i }
  }
  if (fi < 0) fi = back
  const P = ring[fi]!, Q = ring[(fi + 1) % n]!
  const W0 = len(fi)
  // unit vectors along the edge and inward; which end continues the frontage
  let ux = (Q.x - P.x) / W0, uz = (Q.z - P.z) / W0
  const prev = ring[(fi + n - 1) % n]!, next = ring[(fi + 2) % n]!
  const col = (a: { x: number; z: number }, b: { x: number; z: number }): number => {
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return ((b.x - a.x) * (Q.x - P.x) + (b.z - a.z) * (Q.z - P.z)) / (l * W0)
  }
  // collinearity at the Q end (edge Q->next) and the P end (edge prev->P)
  let org = P
  const qEnd = Math.abs(col(Q, next)), pEnd = Math.abs(col(prev, P))
  if ((pEnd > qEnd) !== SS_FLIP) { org = Q; ux = -ux; uz = -uz }
  else if (SS_FLIP && pEnd <= qEnd) { /* keep */ }
  // inward = toward the centroid
  let vx = -uz, vz = ux
  if ((cx - org.x) * vx + (cz - org.z) * vz < 0) { vx = -vx; vz = -vz }
  const pt = (a: number, b: number, y: number): V3 => [org.x + ux * a + vx * b, y, org.z + uz * a + vz * b]
  const dir = (na: number, nb: number, ny: number): V3 => [ux * na + vx * nb, ny, uz * na + vz * nb]
  const Qd = (p: V3[], o: V3, c: V3, tag = 0): void => {
    const ax = p[1]![0] - p[0]![0], ay = p[1]![1] - p[0]![1], az = p[1]![2] - p[0]![2]
    const bx = p[2]![0] - p[0]![0], by = p[2]![1] - p[0]![1], bz = p[2]![2] - p[0]![2]
    const cr: V3 = [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx]
    const pts = cr[0] * o[0] + cr[1] * o[1] + cr[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
  // local quad: pts as [a,b,y]; outward normal as [na,nb,ny]
  const L = (p: [number, number, number][], o: [number, number, number], c: V3, tag = 0): void =>
    Qd(p.map((v) => pt(v[0], v[1], v[2])), dir(o[0], o[1], o[2]), c, tag)
  // the church's width is the pale-stone gable; take the frontage's own length, capped
  const W = Math.min(W0 - 6, 10), dn = SS_NAVE_D, PW = W0 - W
  const FB = [0, -1, 0] as [number, number, number]
  // ---- nave
  L([[0, 0, 0], [0, dn, 0], [0, dn, SS_EAVES], [0, 0, SS_EAVES]], [-1, 0, 0], stone)
  L([[W, 0, 0], [W, dn, 0], [W, dn, SS_EAVES], [W, 0, SS_EAVES]], [1, 0, 0], stone)
  L([[0, 0, 0], [W, 0, 0], [W, 0, SS_EAVES], [0, 0, SS_EAVES]], FB, stone)
  L([[0, 0, SS_EAVES], [W, 0, SS_EAVES], [W / 2, 0, SS_RIDGE], [W / 2, 0, SS_RIDGE]], FB, stone)
  L([[0, dn, 0], [W, dn, 0], [W, dn, SS_EAVES], [0, dn, SS_EAVES]], [0, 1, 0], stone)
  L([[0, dn, SS_EAVES], [W, dn, SS_EAVES], [W / 2, dn, SS_RIDGE], [W / 2, dn, SS_RIDGE]], [0, 1, 0], stone)
  const ov = 0.35
  L([[-ov, -ov, SS_EAVES - 0.1], [W / 2, -ov, SS_RIDGE + 0.1], [W / 2, dn + ov, SS_RIDGE + 0.1], [-ov, dn + ov, SS_EAVES - 0.1]], [-(SS_RIDGE - SS_EAVES), 0, W / 2], slate, MET)
  L([[W + ov, -ov, SS_EAVES - 0.1], [W / 2, -ov, SS_RIDGE + 0.1], [W / 2, dn + ov, SS_RIDGE + 0.1], [W + ov, dn + ov, SS_EAVES - 0.1]], [SS_RIDGE - SS_EAVES, 0, W / 2], slate, MET)
  // raking coping on the gable
  for (const s of [0, 1]) {
    const x0 = s ? W + ov : -ov, sg = s ? 1 : -1
    L([[x0, -0.2, SS_EAVES - 0.1], [W / 2, -0.2, SS_RIDGE + 0.1], [W / 2, -0.2, SS_RIDGE + 0.45], [x0 + sg * 0.05, -0.2, SS_EAVES + 0.3]], FB, trim)
  }
  // pilasters, stepped
  for (const [a0, a1] of [[-0.05, SS_PIL_W], [W - SS_PIL_W, W + 0.05]] as [number, number][]) {
    L([[a0, -SS_PIL_OUT, 0], [a1, -SS_PIL_OUT, 0], [a1, -SS_PIL_OUT, SS_EAVES + 0.4], [a0, -SS_PIL_OUT, SS_EAVES + 0.4]], FB, trim)
    L([[a0, -SS_PIL_OUT - 0.1, 0], [a1, -SS_PIL_OUT - 0.1, 0], [a1, -SS_PIL_OUT - 0.1, 0.2], [a0, -SS_PIL_OUT - 0.1, 0.2]], FB, trim)
  }
  const F = (a0: number, a1: number, y0: number, y1: number, d: number, c: V3, tag = 0): void =>
    L([[a0, -d, y0], [a1, -d, y0], [a1, -d, y1], [a0, -d, y1]], FB, c, tag)
  // round/pointed-headed opening: rect + fan (round = true gives a semicircle head)
  const arch = (ac: number, y0: number, w: number, h: number, d: number, c: V3, pointed: boolean, tag = 0): void => {
    const r = w / 2, yb = pointed ? y0 + h - w * 0.9 : y0 + h - r
    F(ac - r, ac + r, y0, yb, d, c, tag)
    if (pointed) { L([[ac - r, -d, yb], [ac + r, -d, yb], [ac, -d, y0 + h], [ac, -d, y0 + h]], FB, c, tag); return }
    const m = 8
    for (let i = 0; i < m; i++) {
      const t0 = Math.PI * (i / m), t1 = Math.PI * ((i + 1) / m)
      L([[ac + Math.cos(t0) * r, -d, yb + Math.sin(t0) * r], [ac + Math.cos(t1) * r, -d, yb + Math.sin(t1) * r], [ac, -d, yb], [ac, -d, yb]], FB, c, tag)
    }
  }
  const ac = W / 2
  // door and its pointed hood
  arch(ac, 0, SS_DOOR_W + 0.7, SS_DOOR_H + 0.6, 0.06, trim, true)
  arch(ac, 0, SS_DOOR_W, SS_DOOR_H, 0.12, wood, true)
  F(ac - 0.04, ac + 0.04, 0, SS_DOOR_H * 0.78, 0.16, dark)
  F(0.2, W - 0.2, SS_REC_Y - 1.0, SS_REC_Y - 0.88, 0.14, trim)                  // string course
  // recess with three lancet lights
  arch(ac, SS_REC_Y, SS_REC_W + 0.5, SS_REC_H + 0.3, 0.06, trim, false)
  arch(ac, SS_REC_Y, SS_REC_W, SS_REC_H, 0.1, stone, false)
  for (const [dx, hh] of [[-1.25, 0.8], [0, 1.0], [1.25, 0.8]] as [number, number][]) arch(ac + dx, SS_REC_Y + 0.4, 0.85, (SS_REC_H - 0.9) * hh, 0.16, glass, true)
  F(ac - SS_REC_W / 2, ac + SS_REC_W / 2, SS_REC_Y + 0.35, SS_REC_Y + 0.45, 0.18, trim)
  // oculus
  {
    const r = 0.45, cy = SS_RIDGE - 1.7, m = 10
    for (let i = 0; i < m; i++) {
      const t0 = (i / m) * Math.PI * 2, t1 = ((i + 1) / m) * Math.PI * 2
      L([[ac, -0.1, cy], [ac + Math.cos(t0) * r, -0.1, cy + Math.sin(t0) * r], [ac + Math.cos(t1) * r, -0.1, cy + Math.sin(t1) * r], [ac, -0.1, cy]], FB, i % 2 ? trim : glass)
    }
  }
  // ---- presbytery: stone, barred ground floor, mansard
  const a0 = W, a1 = W0, pd = SS_PRES_D
  L([[a0, 0, 0], [a1, 0, 0], [a1, 0, SS_PRES_EAVES], [a0, 0, SS_PRES_EAVES]], FB, stone)
  L([[a1, 0, 0], [a1, pd, 0], [a1, pd, SS_PRES_EAVES], [a1, 0, SS_PRES_EAVES]], [1, 0, 0], stone)
  L([[a0, pd, 0], [a1, pd, 0], [a1, pd, SS_PRES_EAVES], [a0, pd, SS_PRES_EAVES]], [0, 1, 0], stone)
  F(a0, a1, SS_PRES_EAVES - 0.35, SS_PRES_EAVES + 0.05, 0.18, trim)               // cornice
  F(a0, a1, 3.55, 3.7, 0.08, trim)                                                  // belt
  const mi = SS_MANSARD_IN
  L([[a0 - 0.1, -0.15, SS_PRES_EAVES], [a1 + 0.1, -0.15, SS_PRES_EAVES], [a1 + 0.1, mi, SS_PRES_TOP], [a0 - 0.1, mi, SS_PRES_TOP]], [0, -1, 0.7], slate, MET)
  L([[a1 + 0.1, -0.15, SS_PRES_EAVES], [a1 + 0.1, pd, SS_PRES_EAVES], [a1 + 0.1, pd - mi, SS_PRES_TOP], [a1 + 0.1, mi, SS_PRES_TOP]], [1, 0, 0.7], slate, MET)
  L([[a0 - 0.1, mi, SS_PRES_TOP], [a1 + 0.1, mi, SS_PRES_TOP], [a1 + 0.1, pd - mi, SS_PRES_TOP], [a0 - 0.1, pd - mi, SS_PRES_TOP]], [0, 0, 1], slate, MET)
  // windows (barred ground floor, tall first floor) and dormers on a regular pitch, a porch door in the middle
  const nw = Math.max(2, Math.round(PW / SS_WIN_PITCH)), pitch = PW / nw
  for (let i = 0; i < nw; i++) {
    const wc = a0 + pitch * (i + 0.5), mid = i === Math.floor(nw / 2) - (nw % 2 ? 0 : 1) + (nw % 2 ? 0 : 0)
    void mid
    if (i === nw - 1 && nw > 1 || (nw === 2 && i === 1)) {
      // porch door
      F(wc - 0.6, wc + 0.6, 0, 2.4, 0.1, wood)
      L([[wc - 1.2, -1.3, 2.9], [wc + 1.2, -1.3, 2.9], [wc + 1.2, 0, 3.7], [wc - 1.2, 0, 3.7]], [0, -0.6, 0.6], slate, MET)
      L([[wc - 1.2, -1.3, 2.9], [wc - 1.2, 0, 3.7], [wc - 1.2, 0, 2.9], [wc - 1.2, 0, 2.9]], [-1, 0, 0], trim)
      L([[wc + 1.2, -1.3, 2.9], [wc + 1.2, 0, 3.7], [wc + 1.2, 0, 2.9], [wc + 1.2, 0, 2.9]], [1, 0, 0], trim)
    } else {
      F(wc - 0.55, wc + 0.55, 0.9, 2.9, 0.1, glass)
      for (const bx of [-0.4, -0.13, 0.13, 0.4]) F(wc + bx - 0.02, wc + bx + 0.02, 0.9, 2.9, 0.14, iron, MET)
    }
    F(wc - 0.5, wc + 0.5, 4.6, 6.9, 0.1, glass)                                     // first floor
    F(wc - 0.6, wc + 0.6, 6.9, 7.05, 0.14, trim)
    F(wc - 0.5, wc + 0.5, 7.3, 9.1, 0.1, glass)                                     // second floor
    // dormer in the mansard
    const dw = 0.55, dy0 = SS_PRES_EAVES + 0.55, dy1 = dy0 + 1.7
    L([[wc - dw, 0.55, dy0], [wc + dw, 0.55, dy0], [wc + dw, 0.55, dy1], [wc - dw, 0.55, dy1]], FB, stone)
    L([[wc - dw, 0.55, dy1], [wc + dw, 0.55, dy1], [wc, 0.55, dy1 + 0.6], [wc, 0.55, dy1 + 0.6]], FB, stone)
    L([[wc - dw + 0.1, 0.5, dy0 + 0.1], [wc + dw - 0.1, 0.5, dy0 + 0.1], [wc + dw - 0.1, 0.5, dy1 - 0.1], [wc - dw + 0.1, 0.5, dy1 - 0.1]], FB, glass)
    L([[wc - dw - 0.1, 0.55, dy1 + 0.0], [wc, 0.55, dy1 + 0.7], [wc, 1.8, dy1 + 0.9], [wc - dw - 0.1, 1.8, dy1 - 0.1]], [-0.4, 0, 0.9], slate, MET)
    L([[wc + dw + 0.1, 0.55, dy1 + 0.0], [wc, 0.55, dy1 + 0.7], [wc, 1.8, dy1 + 0.9], [wc + dw + 0.1, 1.8, dy1 - 0.1]], [0.4, 0, 0.9], slate, MET)
  }
  // church ground-floor lancet either side of the door
  for (const dx of [-1.9, 1.9]) if (W > 7) { F(ac + dx - 0.35, ac + dx + 0.35, 1.2, 3.0, 0.1, glass) }
  // ---- bell turret on the apex: a little square tower with a pyramid cap and an open arched bell bay
  {
    const tw = 0.9, z0 = 1.2, z1 = z0 + tw * 2, a0t = ac - tw, a1t = ac + tw, yb = SS_RIDGE - 0.2, yt = SS_BELL_TOP - 2.6
    const sides: [number, number, number][][] = [
      [[a0t, z0, yb], [a1t, z0, yb], [a1t, z0, yt], [a0t, z0, yt]],
      [[a0t, z1, yb], [a1t, z1, yb], [a1t, z1, yt], [a0t, z1, yt]],
      [[a0t, z0, yb], [a0t, z1, yb], [a0t, z1, yt], [a0t, z0, yt]],
      [[a1t, z0, yb], [a1t, z1, yb], [a1t, z1, yt], [a1t, z0, yt]],
    ]
    const norm: [number, number, number][] = [[0, -1, 0], [0, 1, 0], [-1, 0, 0], [1, 0, 0]]
    sides.forEach((s, i) => L(s, norm[i]!, stone))
    L([[ac - 0.35, z0 - 0.05, yb + 0.7], [ac + 0.35, z0 - 0.05, yb + 0.7], [ac + 0.35, z0 - 0.05, yt - 0.3], [ac - 0.35, z0 - 0.05, yt - 0.3]], FB, dark)
    L([[ac - 0.2, z0 - 0.06, yb + 1.1], [ac + 0.2, z0 - 0.06, yb + 1.1], [ac + 0.2, z0 - 0.06, yb + 1.7], [ac - 0.2, z0 - 0.06, yb + 1.7]], FB, bell)
    const cap = (p: [number, number, number][], o: [number, number, number]): void => L(p, o, slate, MET)
    const apex: [number, number, number] = [ac, z0 + tw, SS_BELL_TOP]
    cap([[a0t - 0.12, z0 - 0.12, yt], [a1t + 0.12, z0 - 0.12, yt], apex, apex], [0, -1, 0.8])
    cap([[a0t - 0.12, z1 + 0.12, yt], [a1t + 0.12, z1 + 0.12, yt], apex, apex], [0, 1, 0.8])
    cap([[a0t - 0.12, z0 - 0.12, yt], [a0t - 0.12, z1 + 0.12, yt], apex, apex], [-1, 0, 0.8])
    cap([[a1t + 0.12, z0 - 0.12, yt], [a1t + 0.12, z1 + 0.12, yt], apex, apex], [1, 0, 0.8])
  }
  // rest of the ring: plain stone walls up to the eaves (party walls, flanks beyond the two masses)
  for (let i = 0; i < n; i++) {
    if (i === fi) continue
    const p = ring[i]!, q = ring[(i + 1) % n]!, l = len(i)
    if (l < 0.05) continue
    const o: V3 = [(q.z - p.z) / l, 0, -(q.x - p.x) / l]
    Qd([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, SS_REST_H, q.z], [p.x, SS_REST_H, p.z]], o, stone)
  }
  capPolygon(out, ring, SS_REST_H, slate, MET)
  void block; void box; void prism; void archedPane; void pane; void roof; void shade
}

// ───────────────────────────── Cathédrale arménienne Saint-Jean-Baptiste (way/69332080), 15 rue Jean-Goujon ─────────────────────────────
// Albert Guilbert, 1904-1905. Commons photo "Cathédrale arménienne Saint-Jean-Baptiste, 15 rue Jean-Goujon, Paris 8e" and
// its tympanum/relief series (2026-11-04): sand limestone, Armenian-revival. From the street: a gate pier with an urn at
// the east end (the footprint's forward bump), a low carved wing with fence, then the gable front — a granite-columned
// porch with a carved tympanum, a four-arch bell loggia over it, two medallions, a rake cornice — a green-copper-coned
// drum tower rising behind the gable's pier side, and a second low curved wing to the far side. The footprint's own axes
// are found from the ring (dominant edge angle); the front is the wider end, the pier end is the side of its forward bump.
// Heights are photo-scaled (car 1.5 m): OSM says 15.1 m; the MNS reads the neighbours' blank wall, so the gable is not trusted from it.
const ARM_H_WING = 6.0        // the low wings' cornice
const ARM_H_NAVE = 8.8        // the nave's eaves (gable end front)
const ARM_H_RIDGE = 11.6      // the nave ridge / pediment peak
const ARM_Q_GABLE0 = 7.1      // gable front spans q (m from the pier end) [0..W]
const ARM_Q_GABLE1 = 13.8
const ARM_FRONT_SET = 2.1     // the front line stands this far behind the forward bump's tip
const ARM_NAVE_BACK = 0.4     // the nave stops this short of the footprint's back
const ARM_PORCH_W = 3.6       // the portal's width (between column axes + 0.5)
const ARM_PORCH_OUT = 1.9     // how far the porch columns stand forward of the front line
const ARM_COL_R = 0.3
const ARM_COL_H = 4.1
const ARM_DOOR_W = 1.5
const ARM_DOOR_H = 3.1
const ARM_LOGGIA_W = 2.7
const ARM_LOGGIA_Y0 = 6.4
const ARM_LOGGIA_Y1 = 8.5
const ARM_LOGGIA_TOP = 9.9
const ARM_TOWER_Q = 8.4       // tower axis (m from the pier end) and depth behind the front line
const ARM_TOWER_T = 6.6
const ARM_TOWER_R = 1.95
const ARM_DRUM_Y0 = 8.8
const ARM_DRUM_Y1 = 13.3
const ARM_CONE_TOP = 17.6
const ARM_FENCE_OUT = 1.0     // railings stand this far ahead of the front line
const ARM_FENCE_H = 1.45
const ARM_FENCE_POST = 1.5
const ARM_NEAR_END = 7        // metres from each end used to judge which end is the wider front

export function cathedraleArmenienne(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#d9c7a1'), stoneD = hex('#c3ae84'), carve = hex('#cdb88e'), granite = hex('#4f4a4d'), dark = hex('#2a2623'),
    slate = hex('#5d6268'), patina = hex('#5f9a86'), gold = hex('#d9b13a'), iron = hex('#26262a'), wingRoof = hex('#6a8a7c')
  const MET = surfaceTag('metal'), CON = surfaceTag('concrete'), STU = surfaceTag('stucco')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // the footprint's frame: dominant edge angle (mod 90°), depth axis = the longer extent, front = the wider end
  let c4 = 0, s4 = 0
  for (let i = 0; i < n; i++) { const p = ring[i]!, q = ring[(i + 1) % n]!, a = Math.atan2(q.z - p.z, q.x - p.x), L = Math.hypot(q.x - p.x, q.z - p.z); c4 += L * Math.cos(4 * a); s4 += L * Math.sin(4 * a) }
  const th = Math.atan2(s4, c4) / 4
  let dx = Math.cos(th), dz = Math.sin(th)
  const ext = (ax: number, az: number): [number, number] => { let lo = 1e9, hi = -1e9; for (const r of ring) { const v = r.x * ax + r.z * az; lo = Math.min(lo, v); hi = Math.max(hi, v) } return [lo, hi] }
  { const [a0, a1] = ext(dx, dz), [b0, b1] = ext(-dz, dx); if (b1 - b0 > a1 - a0) { const t = dx; dx = -dz; dz = t } }
  let px = -dz, pz = dx
  const width = (sgn: number): number => {   // the cross extent within ARM_NEAR_END of the end on this side of the depth axis
    const [t0, t1] = ext(dx, dz); const tt = sgn > 0 ? t1 : t0
    let lo = 1e9, hi = -1e9
    for (const r of ring) { const t = r.x * dx + r.z * dz, s = r.x * px + r.z * pz; if (Math.abs(t - tt) < ARM_NEAR_END) { lo = Math.min(lo, s); hi = Math.max(hi, s) } }
    return hi - lo
  }
  if (width(1) > width(-1)) { dx = -dx; dz = -dz; px = -px; pz = -pz }       // front at minimum t
  let tFront = 1e9, sAtFront = 0
  for (const r of ring) { const t = r.x * dx + r.z * dz; if (t < tFront) { tFront = t; sAtFront = r.x * px + r.z * pz } }
  let [sLo, sHi] = ext(px, pz)
  if (sAtFront < (sLo + sHi) / 2) { px = -px; pz = -pz; [sLo, sHi] = ext(px, pz) }   // the forward bump (pier) at max s
  const [, tBack] = ext(dx, dz)
  const tF = tFront + ARM_FRONT_SET, W = sHi - sLo
  // frame point: q metres west of the pier end, t metres back from the front line
  const X = (q: number, t: number): number => px * (sHi - q) + dx * (tF + t)
  const Z = (q: number, t: number): number => pz * (sHi - q) + dz * (tF + t)
  const Pq = (q: number, y: number, t: number): V3 => [X(q, t), y, Z(q, t)]
  const oFront: V3 = [-dx, 0, -dz], oQ: V3 = [-px, 0, -pz]      // out the front; toward +q
  const neg = (o: V3): V3 => [-o[0], 0, -o[2]]
  const Fq = (q0: number, q1: number, y0: number, y1: number, t: number, col: V3, tag: number): void =>
    quad([Pq(q0, y0, t), Pq(q1, y0, t), Pq(q1, y1, t), Pq(q0, y1, t)], oFront, col, tag)
  const archQ = (qc: number, y0: number, w: number, h: number, t: number, col: V3, tag: number): void => {
    const r = w / 2, yb = y0 + h - r
    Fq(qc - r, qc + r, y0, yb, t, col, tag)
    const m = 6
    for (let i = 0; i < m; i++) {
      const a = -r + (2 * r * i) / m, b = -r + (2 * r * (i + 1)) / m, xm = Math.abs((a + b) / 2)
      Fq(qc + a, qc + b, yb, yb + Math.sqrt(Math.max(r * r - xm * xm, 0)), t, col, tag)
    }
  }
  const disc = (qc: number, yc: number, t: number, r: number, col: V3, tag: number): void => {
    const m = 10
    for (let i = 0; i < m; i++) {
      const a0 = (i / m) * Math.PI * 2, a1 = ((i + 1) / m) * Math.PI * 2
      const A = Pq(qc, yc, t), B = Pq(qc + Math.cos(a0) * r, yc + Math.sin(a0) * r, t), C = Pq(qc + Math.cos(a1) * r, yc + Math.sin(a1) * r, t)
      quad([A, B, C, C], oFront, col, tag)
    }
  }
  // box in frame, five faces
  const boxQ = (q0: number, q1: number, t0: number, t1: number, y0: number, y1: number, col: V3, tag: number): void => {
    quad([Pq(q0, y0, t0), Pq(q1, y0, t0), Pq(q1, y1, t0), Pq(q0, y1, t0)], oFront, col, tag)
    quad([Pq(q0, y0, t1), Pq(q1, y0, t1), Pq(q1, y1, t1), Pq(q0, y1, t1)], neg(oFront), col, tag)
    quad([Pq(q0, y0, t0), Pq(q0, y0, t1), Pq(q0, y1, t1), Pq(q0, y1, t0)], neg(oQ), col, tag)
    quad([Pq(q1, y0, t0), Pq(q1, y0, t1), Pq(q1, y1, t1), Pq(q1, y1, t0)], oQ, col, tag)
    quad([Pq(q0, y1, t0), Pq(q1, y1, t0), Pq(q1, y1, t1), Pq(q0, y1, t1)], [0, 1, 0], col, tag)
  }
  // 1 · walls, cornice and roof of the low footprint wings
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L], k = 0.14
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, ARM_H_WING, q.z], [p.x, ARM_H_WING, p.z]], o, stone, 0)
    quad([[p.x + o[0] * k, ARM_H_WING - 0.4, p.z + o[2] * k], [q.x + o[0] * k, ARM_H_WING - 0.4, q.z + o[2] * k], [q.x + o[0] * k, ARM_H_WING + 0.08, q.z + o[2] * k], [p.x + o[0] * k, ARM_H_WING + 0.08, p.z + o[2] * k]], o, stoneD, CON)
  }
  capPolygon(out, ring, ARM_H_WING + 0.08, wingRoof, MET)
  // plinth band and carved frieze belt along the front line (both wings)
  Fq(0, W, 0, 0.55, 0.05, stoneD, CON)
  Fq(0.2, W, 3.9, 4.25, 0.07, carve, CON)
  for (let q = 2.6; q < W - 0.4; q += 0.9) if (q < ARM_Q_GABLE0 - 0.5 || q > ARM_Q_GABLE1 + 0.5) Fq(q, q + 0.45, 4.3, 4.9, 0.09, stoneD, CON)   // dentil/ornament blocks
  for (const qc of [3.6, 16.2]) if (qc < W - 0.5) Fq(qc - 0.22, qc + 0.22, 3.0, 4.1, 0.06, dark, 0)   // slit windows in the wings
  // 2 · the gate pier at the pier end: proud shaft, capital, urn
  boxQ(0.1, 2.2, -0.2, 1.7, ARM_H_WING, ARM_H_WING + 0.9, carve, CON)
  prism(out, X(1.15, 0.7), Z(1.15, 0.7), ARM_H_WING + 0.9, ARM_H_WING + 1.9, 0.55, 8, stone, 0, 0.3)
  // 3 · the nave: gable front, gable roof along the depth
  const depth = Math.max(4, tBack - tF - ARM_NAVE_BACK)
  const qa = ARM_Q_GABLE0, qb = Math.min(ARM_Q_GABLE1, W - 0.3), qm = (qa + qb) / 2
  for (const [qq, o] of [[qa, neg(oQ)], [qb, oQ]] as [number, V3][]) quad([Pq(qq, 0, 0), Pq(qq, 0, depth), Pq(qq, ARM_H_NAVE, depth), Pq(qq, ARM_H_NAVE, 0)], o, stone, 0)
  quad([Pq(qa, 0, depth), Pq(qb, 0, depth), Pq(qb, ARM_H_NAVE, depth), Pq(qa, ARM_H_NAVE, depth)], neg(oFront), stone, 0)
  // gable end (front) rectangle and pediment triangle; back triangle
  Fq(qa, qb, ARM_H_WING, ARM_H_NAVE, 0.02, stone, 0)
  quad([Pq(qa, ARM_H_NAVE, 0.02), Pq(qb, ARM_H_NAVE, 0.02), Pq(qm, ARM_H_RIDGE, 0.02), Pq(qm, ARM_H_RIDGE, 0.02)], oFront, stone, 0)
  quad([Pq(qa, ARM_H_NAVE, depth), Pq(qb, ARM_H_NAVE, depth), Pq(qm, ARM_H_RIDGE, depth), Pq(qm, ARM_H_RIDGE, depth)], neg(oFront), stone, 0)
  for (const [q0, o] of [[qa, neg(oQ)], [qb, oQ]] as [number, V3][]) {                 // roof slopes (and rake cornice at the front)
    const sl = Math.hypot(qm - q0, ARM_H_RIDGE - ARM_H_NAVE), ro: V3 = [o[0] * (ARM_H_RIDGE - ARM_H_NAVE) / sl, (qm - q0 !== 0 ? Math.abs(qm - q0) / sl : 1), o[2] * (ARM_H_RIDGE - ARM_H_NAVE) / sl]
    quad([Pq(q0, ARM_H_NAVE, 0), Pq(q0, ARM_H_NAVE, depth), Pq(qm, ARM_H_RIDGE, depth), Pq(qm, ARM_H_RIDGE, 0)], ro, slate, MET)
    quad([Pq(q0, ARM_H_NAVE - 0.25, -0.12), Pq(q0 + (qm - q0) * 0.5, ARM_H_NAVE + (ARM_H_RIDGE - ARM_H_NAVE) * 0.5 - 0.25, -0.12), Pq(q0 + (qm - q0) * 0.5, ARM_H_NAVE + (ARM_H_RIDGE - ARM_H_NAVE) * 0.5 + 0.1, -0.12), Pq(q0, ARM_H_NAVE + 0.1, -0.12)], oFront, carve, CON)
  }
  Fq(qa - 0.12, qb + 0.12, ARM_H_NAVE - 0.3, ARM_H_NAVE + 0.05, -0.1, carve, CON)       // gable eaves belt
  // flank lancets on the pier-side flank above the low wing
  for (let t = 2.6; t < Math.min(depth - 1, 9); t += 1.15) {
    const w = 0.5, y0 = ARM_H_WING + 0.6, y1 = ARM_H_NAVE - 0.4
    quad([Pq(qa - 0.02, y0, t), Pq(qa - 0.02, y0, t + w), Pq(qa - 0.02, y1, t + w), Pq(qa - 0.02, y1, t)], neg(oQ), dark, 0)
  }
  // 4 · porch: granite columns, lintel, small pediment, carved tympanum and door
  const pc = qm - 0.5, pa = pc - ARM_PORCH_W / 2, pb = pc + ARM_PORCH_W / 2
  archQ(pc, 0, ARM_PORCH_W - 0.4, ARM_COL_H + 0.1, 0.06, carve, CON)                      // arched recess
  archQ(pc, 0.0, ARM_DOOR_W + 1.4, ARM_DOOR_H + 1.5, 0.1, stoneD, CON)                   // tympanum field
  archQ(pc, 0.0, ARM_DOOR_W, ARM_DOOR_H, 0.14, dark, 0)                                   // door
  for (const qc of [pa + 0.15, pb - 0.15]) {
    prism(out, X(qc, -ARM_PORCH_OUT), Z(qc, -ARM_PORCH_OUT), 0.35, ARM_COL_H, ARM_COL_R, 10, granite, 0)
    prism(out, X(qc, -ARM_PORCH_OUT), Z(qc, -ARM_PORCH_OUT), 0, 0.35, ARM_COL_R + 0.25, 8, carve, CON)
    prism(out, X(qc, -ARM_PORCH_OUT), Z(qc, -ARM_PORCH_OUT), ARM_COL_H, ARM_COL_H + 0.4, ARM_COL_R + 0.22, 8, carve, CON)
  }
  boxQ(pa - 0.3, pb + 0.3, -ARM_PORCH_OUT - 0.3, 0.0, ARM_COL_H + 0.4, ARM_COL_H + 1.0, carve, CON)     // entablature over the columns
  quad([Pq(pa - 0.3, ARM_COL_H + 1.0, -ARM_PORCH_OUT - 0.3), Pq(pb + 0.3, ARM_COL_H + 1.0, -ARM_PORCH_OUT - 0.3), Pq(pc, ARM_COL_H + 1.9, -ARM_PORCH_OUT - 0.3), Pq(pc, ARM_COL_H + 1.9, -ARM_PORCH_OUT - 0.3)], oFront, stoneD, CON)  // pediment
  // 5 · the bell loggia over the porch: four columns, slate pyramid cap, and two medallions
  boxQ(pc - ARM_LOGGIA_W / 2 - 0.15, pc + ARM_LOGGIA_W / 2 + 0.15, -1.1, 0.2, ARM_LOGGIA_Y0 - 0.3, ARM_LOGGIA_Y0, carve, CON)
  for (let i = 0; i < 4; i++) { const qc = pc - ARM_LOGGIA_W / 2 + 0.2 + (i * (ARM_LOGGIA_W - 0.4)) / 3; prism(out, X(qc, -0.9), Z(qc, -0.9), ARM_LOGGIA_Y0, ARM_LOGGIA_Y1, 0.11, 6, granite, 0) }
  boxQ(pc - ARM_LOGGIA_W / 2, pc + ARM_LOGGIA_W / 2, -0.95, 0.1, ARM_LOGGIA_Y0 + 0.2, ARM_LOGGIA_Y1, dark, 0)
  boxQ(pc - ARM_LOGGIA_W / 2 - 0.1, pc + ARM_LOGGIA_W / 2 + 0.1, -1.05, 0.2, ARM_LOGGIA_Y1, ARM_LOGGIA_Y1 + 0.25, carve, CON)
  prism(out, X(pc, -0.4), Z(pc, -0.4), ARM_LOGGIA_Y1 + 0.25, ARM_LOGGIA_TOP, 1.75, 4, slate, MET, 0.12, true, Math.PI / 4 + Math.atan2(px, pz))
  for (const sgn of [-1, 1]) disc(pc + sgn * 2.45, 7.1, -0.08, 0.68, carve, CON)
  // 6 · the drum tower behind the gable on the pier side
  const tqx = X(ARM_TOWER_Q, ARM_TOWER_T), tqz = Z(ARM_TOWER_Q, ARM_TOWER_T)
  boxQ(ARM_TOWER_Q - 2.2, ARM_TOWER_Q + 2.2, ARM_TOWER_T - 2.2, ARM_TOWER_T + 2.2, ARM_H_WING - 0.5, ARM_DRUM_Y0, stone, 0)
  const ph = Math.PI / 8 + Math.atan2(px, pz)
  prism(out, tqx, tqz, ARM_DRUM_Y0, ARM_DRUM_Y1, ARM_TOWER_R, 8, stone, 0, ARM_TOWER_R, true, ph)
  prism(out, tqx, tqz, ARM_DRUM_Y1 - 0.5, ARM_DRUM_Y1 + 0.15, ARM_TOWER_R + 0.28, 8, carve, CON, ARM_TOWER_R + 0.28, true, ph)
  prism(out, tqx, tqz, ARM_DRUM_Y1 + 0.15, ARM_CONE_TOP, ARM_TOWER_R + 0.15, 8, patina, MET, 0.1, true, ph)
  prism(out, tqx, tqz, ARM_CONE_TOP, ARM_CONE_TOP + 0.65, 0.34, 8, gold, MET, 0.34, true, ph)
  boxQ(ARM_TOWER_Q - 0.06, ARM_TOWER_Q + 0.06, ARM_TOWER_T - 0.06, ARM_TOWER_T + 0.06, ARM_CONE_TOP + 0.6, ARM_CONE_TOP + 2.2, gold, MET)
  boxQ(ARM_TOWER_Q - 0.45, ARM_TOWER_Q + 0.45, ARM_TOWER_T - 0.05, ARM_TOWER_T + 0.05, ARM_CONE_TOP + 1.5, ARM_CONE_TOP + 1.65, gold, MET)
  // tall arched lights on the drum's four sides
  for (const [dq, dt] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as [number, number][]) {
    const qx = ARM_TOWER_Q + dq * (ARM_TOWER_R * 0.93), tz = ARM_TOWER_T + dt * (ARM_TOWER_R * 0.93)
    const o: V3 = [oQ[0] * dq + oFront[0] * -dt, 0, oQ[2] * dq + oFront[2] * -dt]
    const c0 = Pq(qx, 0, tz), tx = -o[2], tzz = o[0]
    const y0 = ARM_DRUM_Y0 + 1.0, y1 = ARM_DRUM_Y1 - 0.8, w = 0.4
    quad([[c0[0] - tx * w, y0, c0[2] - tzz * w], [c0[0] + tx * w, y0, c0[2] + tzz * w], [c0[0] + tx * w, y1, c0[2] + tzz * w], [c0[0] - tx * w, y1, c0[2] - tzz * w]], o, dark, 0)
  }
  // 7 · iron railings along the street, open before the porch
  const fence = (q0: number, q1: number): void => {
    for (const y of [0.3, ARM_FENCE_H - 0.12]) Fq(q0, q1, y, y + 0.07, -ARM_FENCE_OUT, iron, MET)
    for (let q = q0; q <= q1 + 0.01; q += ARM_FENCE_POST) Fq(Math.min(q, q1) - 0.03, Math.min(q, q1) + 0.03, 0, ARM_FENCE_H, -ARM_FENCE_OUT, iron, MET)
    for (let q = q0; q <= q1; q += 0.18) Fq(q, q + 0.025, 0.3, ARM_FENCE_H - 0.1, -ARM_FENCE_OUT, iron, MET)
  }
  fence(2.4, pa - 0.5)
  fence(pb + 0.5, W - 0.3)
  void STU; void gold
}

// ───────────────────────────── Temple antoiniste (way/78470555), rue Vergniaud / rue Wurtz, 13e ─────────────────────────
// Commons "Temple Antoiniste Rue Vergniaud" (2026-11-04, docs/landmarks/refs/worship/antoiniste): a small pale-stucco church,
// long gabled nave under red tile with stepped lower roofs, paired arched windows high in the flanks, a slender slate flèche
// over the ridge, and a gable-end portal: a many-ringed stone archivolt round an arched, strap-hinged wooden door with a
// louvred fanlight. The portal end is the ring's longest edge that runs across the long axis.
const ATN_EAVES = 7.2        // nave eaves
const ATN_RIDGE = 10.2        // ridge
const ATN_OVER = 0.35        // roof overhang past the wall
const ATN_LOW_EAVES = 3.4    // lower side roof wall height
const ATN_JOIN = 4.4         // where the lean-to roofs meet the nave wall
const ATN_NAVE_HW = 4.4      // half-width of the nave above the lean-tos
const ATN_SPIRE_Z = 0.35     // spire position along the nave from the portal end (fraction)
const ATN_SPIRE_TOP = 16.5
const ATN_SPIRE_R = 0.7
const ATN_DOOR_W = 2.3
const ATN_DOOR_H = 3.6
const ATN_RINGS = 4          // archivolt rings
const ATN_RING_STEP = 0.2    // each ring's extra width per side
const ATN_WIN_PITCH = 3.2    // flank window spacing
const ATN_WIN_W = 0.85
const ATN_WIN_H = 1.95
const ATN_WIN_Y = 4.85

export function templeAntoiniste(out: MeshBuilder, fit: Fit): void {
  const wall = hex('#e6e0cf'), trim = hex('#f0ece0'), tile = hex('#9a4a35'), slate = hex('#4b4f58'), wood = hex('#7a4a22'),
    glass = hex('#3a4650'), iron = hex('#1f1f22'), plinth = hex('#bdb6a3')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const wring = area < 0 ? [...ring0].reverse() : ring0
  const n = wring.length
  // the ring is turned by the street bearing: find the nave axis (the longest edge) and build in a frame aligned to it
  let li = 0, ll = 0
  for (let i = 0; i < n; i++) { const L = Math.hypot(wring[(i + 1) % n]!.x - wring[i]!.x, wring[(i + 1) % n]!.z - wring[i]!.z); if (L > ll) { ll = L; li = i } }
  const th = Math.atan2(wring[(li + 1) % n]!.z - wring[li]!.z, wring[(li + 1) % n]!.x - wring[li]!.x), ct = Math.cos(th), st = Math.sin(th)
  const ring = wring.map((r) => ({ x: r.x * ct + r.z * st, z: -r.x * st + r.z * ct }))
  const toW = (a: number, b: number): [number, number] => [a * ct - b * st, a * st + b * ct]
  let xmin = Infinity, xmax = -Infinity, zmin = Infinity, zmax = -Infinity
  for (const r of ring) { xmin = Math.min(xmin, r.x); xmax = Math.max(xmax, r.x); zmin = Math.min(zmin, r.z); zmax = Math.max(zmax, r.z) }
  const zc = (zmin + zmax) / 2
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    const W = (v: V3): V3 => { const [x, z] = toW(v[0], v[2]); return [x, v[1], z] }
    const [ox, oz] = toW(o[0], o[2])
    out.quad(pts.map(W), [ox, o[1], oz], [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // the portal edge: longest edge lying across the long axis (|dz| > |dx|)
  let pe = -1, pl = 0
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (Math.abs(q.z - p.z) > Math.abs(q.x - p.x) && L > pl) { pl = L; pe = i }
  }
  const portalSign = pe >= 0 ? Math.sign(((ring[pe]!.x + ring[(pe + 1) % n]!.x) / 2) || 1) : -1
  // ring walls at the lean-to eaves height, plinth
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L], k = 0.06
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, ATN_LOW_EAVES, q.z], [p.x, ATN_LOW_EAVES, p.z]], o, wall, STU)
    quad([[p.x + o[0] * k, 0, p.z + o[2] * k], [q.x + o[0] * k, 0, q.z + o[2] * k], [q.x + o[0] * k, 0.6, q.z + o[2] * k], [p.x + o[0] * k, 0.6, p.z + o[2] * k]], o, plinth, STU)
  }
  capPolygon(out, wring, ATN_LOW_EAVES, tile, MET)
  // gable-end walls (stepped profile: lean-to eaves, nave eaves, ridge) at both ends of the nave
  const nhw = Math.min(ATN_NAVE_HW, (zmax - zmin) * 0.4)
  const prof: [number, number][] = [[zmin, 0], [zmax, 0], [zmax, ATN_LOW_EAVES], [nhw, ATN_JOIN], [nhw, ATN_EAVES], [zc, ATN_RIDGE], [-nhw, ATN_EAVES], [-nhw, ATN_JOIN], [zmin, ATN_LOW_EAVES]]
  const endWall = (xe: number, nx: number): void => {
    for (let i = 0; i < prof.length; i++) {
      const A: [number, number] = [zc, 0], B = prof[i]!, C = prof[(i + 1) % prof.length]!
      quad([[xe, A[1], A[0]], [xe, B[1], B[0]], [xe, C[1], C[0]], [xe, C[1], C[0]]], [nx, 0, 0], wall, STU)
    }
  }
  endWall(xmax + 0.02, 1); endWall(xmin - 0.02, -1)
  // clerestory walls over the lean-tos, each with a run of paired arched windows
  for (const sg of [-1, 1]) {
    const zb = sg * nhw, o: V3 = [0, 0, sg]
    quad([[xmin, ATN_JOIN, zb], [xmax, ATN_JOIN, zb], [xmax, ATN_EAVES, zb], [xmin, ATN_EAVES, zb]], o, wall, STU)
    const F = (s0: number, s1: number, y0: number, y1: number, d: number, col: V3): void =>
      quad([[s0, y0, zb + sg * d], [s1, y0, zb + sg * d], [s1, y1, zb + sg * d], [s0, y1, zb + sg * d]], o, col, 0)
    const cnt = Math.max(2, Math.floor((xmax - xmin - 3) / ATN_WIN_PITCH))
    for (let j = 0; j < cnt; j++) {
      const sc = xmin + 1.5 + ((xmax - xmin - 3) * (j + 0.5)) / cnt
      for (const dx of [-ATN_WIN_W * 0.62, ATN_WIN_W * 0.62]) {
        const cx2 = sc + dx, r = ATN_WIN_W / 2, yb = ATN_WIN_Y + ATN_WIN_H - r
        F(cx2 - r - 0.08, cx2 + r + 0.08, ATN_WIN_Y - 0.08, yb, 0.03, trim)
        F(cx2 - r, cx2 + r, ATN_WIN_Y, yb, 0.07, glass)
        for (let m = 0; m < 6; m++) {
          const x0 = -r + (2 * r * m) / 6, x1 = -r + (2 * r * (m + 1)) / 6, xm = Math.abs((x0 + x1) / 2)
          F(cx2 + x0, cx2 + x1, yb, yb + Math.sqrt(Math.max(r * r - xm * xm, 0)), 0.07, glass)
        }
        F(cx2 - 0.03, cx2 + 0.03, ATN_WIN_Y, yb + r * 0.9, 0.1, trim)
      }
    }
  }
  // roofs: nave gable, then lean-tos either side
  const rx0 = xmin - ATN_OVER, rx1 = xmax + ATN_OVER, hwid = nhw + ATN_OVER
  const slopeN = Math.hypot(ATN_RIDGE - ATN_EAVES, hwid)
  const sy = hwid / slopeN, sz = (ATN_RIDGE - ATN_EAVES) / slopeN
  quad([[rx0, ATN_EAVES - 0.2, zc - hwid], [rx1, ATN_EAVES - 0.2, zc - hwid], [rx1, ATN_RIDGE, zc], [rx0, ATN_RIDGE, zc]], [0, sy, -sz], tile, MET)
  quad([[rx0, ATN_EAVES - 0.2, zc + hwid], [rx1, ATN_EAVES - 0.2, zc + hwid], [rx1, ATN_RIDGE, zc], [rx0, ATN_RIDGE, zc]], [0, sy, sz], tile, MET)
  {
    const run = zmax + ATN_OVER - nhw, rise = ATN_JOIN - ATN_LOW_EAVES, ln = Math.hypot(run, rise)
    quad([[rx0, ATN_LOW_EAVES - 0.1, zmax + ATN_OVER], [rx1, ATN_LOW_EAVES - 0.1, zmax + ATN_OVER], [rx1, ATN_JOIN, nhw], [rx0, ATN_JOIN, nhw]], [0, run / ln, rise / ln], tile, MET)
    quad([[rx0, ATN_LOW_EAVES - 0.1, zmin - ATN_OVER], [rx1, ATN_LOW_EAVES - 0.1, zmin - ATN_OVER], [rx1, ATN_JOIN, -nhw], [rx0, ATN_JOIN, -nhw]], [0, run / ln, -rise / ln], tile, MET)
  }
  // portal on the gable end
  if (pe >= 0) {
    const p = ring[pe]!, q = ring[(pe + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L], ux = (q.x - p.x) / L, uz = (q.z - p.z) / L, sc = L / 2
    const P = (s: number, y: number, d: number): V3 => [p.x + ux * s + o[0] * d, y, p.z + uz * s + o[2] * d]
    const F = (s0: number, s1: number, y0: number, y1: number, d: number, col: V3): void => quad([P(s0, y0, d), P(s1, y0, d), P(s1, y1, d), P(s0, y1, d)], o, col, 0)
    const arch = (w: number, h: number, d: number, col: V3): void => {
      const r = w / 2, yb = h - r
      F(sc - r, sc + r, 0, yb, d, col)
      const m = 10
      for (let i = 0; i < m; i++) {
        const x0 = -r + (2 * r * i) / m, x1 = -r + (2 * r * (i + 1)) / m, xm = Math.abs((x0 + x1) / 2)
        F(sc + x0, sc + x1, yb, yb + Math.sqrt(Math.max(r * r - xm * xm, 0)), d, col)
      }
    }
    for (let k = ATN_RINGS; k >= 1; k--) arch(ATN_DOOR_W + 2 * k * ATN_RING_STEP * 2, ATN_DOOR_H + k * ATN_RING_STEP * 2, 0.05 + (ATN_RINGS - k) * 0.025, k % 2 ? trim : wall)
    arch(ATN_DOOR_W, ATN_DOOR_H, 0.14, wood)
    const yb = ATN_DOOR_H - ATN_DOOR_W / 2
    F(sc - ATN_DOOR_W / 2, sc + ATN_DOOR_W / 2, yb - 0.55, yb - 0.45, 0.17, iron)   // transom bar
    F(sc - 0.03, sc + 0.03, 0, yb - 0.5, 0.17, iron)                                  // meeting stile
    for (const yy of [0.5, 1.7, yb - 1.0]) { F(sc - ATN_DOOR_W / 2, sc + ATN_DOOR_W / 2, yy, yy + 0.1, 0.18, iron) }
    F(sc - ATN_DOOR_W / 2 + 0.1, sc + ATN_DOOR_W / 2 - 0.1, yb - 0.4, yb + 0.5, 0.17, glass)
  }
  // slate flèche over the ridge
  const sx = portalSign > 0 ? xmax - ATN_SPIRE_Z * (xmax - xmin) : xmin + ATN_SPIRE_Z * (xmax - xmin)
  const [wx, wz] = toW(sx, zc)
  prism(out, wx, wz, ATN_RIDGE - 0.3, ATN_RIDGE + 1.6, ATN_SPIRE_R * 1.6, 8, wall, STU, ATN_SPIRE_R * 1.3)
  prism(out, wx, wz, ATN_RIDGE + 1.6, ATN_RIDGE + 2.8, ATN_SPIRE_R * 1.3, 8, slate, MET, ATN_SPIRE_R)
  prism(out, wx, wz, ATN_RIDGE + 2.8, ATN_SPIRE_TOP, ATN_SPIRE_R, 8, slate, MET, 0.04)
  void box; void block; void roof; void pane; void archedPane; void shade
}

// ───────────────────────────── Église Saint-Serge-de-Radonège (way/63237639), 93 rue de Crimée, 19e ─────────────────────────
// Commons "Façade de l'Église Saint-Serge", "Église orthodoxe Saint-Serge - clocher coté sud" (2026-11-04,
// docs/landmarks/refs/worship/st-serge-*): a brick hall church whose entrance end is a Russian-style timber porch, painted red
// and green, with fretted balustrades, a double stair rising to a gabled door and deep eaves on carved brackets; a small yellow
// stucco bell tower with arched louvres and a teal onion dome beside it; a slate needle spire over the rear.
// The cadastre ring is a saw-tooth, so the frame comes from its minimum-area bounding rectangle.
const SSG_EAVES = 8.2         // brick wall height
const SSG_RIDGE = 13.0        // nave ridge
const SSG_OVER = 0.45         // roof overhang
const SSG_ROOF_HW = 0.42      // nave roof half-width as a fraction of the box width
const SSG_FRONT_SIGN = -1     // which end of the long axis carries the porch (-1 = low u); flip if it faces the wrong way
const SSG_PORCH_D = 5.4       // porch depth along the nave
const SSG_PORCH_HW = 3.6      // porch half-width
const SSG_PORCH_FLOOR = 2.2   // porch deck height (the stair rises to it)
const SSG_PORCH_EAVES = 6.0   // porch wall top
const SSG_PORCH_RIDGE = 8.6   // porch gable apex
const SSG_STAIR_W = 1.3       // each stair's width
const SSG_TOWER_W = 3.0       // bell tower plan
const SSG_TOWER_H = 8.6       // wall height
const SSG_TOWER_U = 0.3       // tower position along the nave from the front (fraction)
const SSG_DOME_R = 1.0        // onion dome radius
const SSG_SPIRE_TOP = 20.0    // slate needle height
const SSG_SPIRE_R = 1.1

export function egliseSaintSerge(out: MeshBuilder, fit: Fit): void {
  const brick = hex('#a4553b'), brickD = hex('#7d3f2c'), slate = hex('#4a4d55'), red = hex('#b6402c'), green = hex('#2f6b4a'),
    cream = hex('#d9c27a'), dark = hex('#2a2320'), teal = hex('#4a9aa0'), gold = hex('#d6b04a'), glass = hex('#5a4a52'), wood = hex('#7a4a28')
  const BRK = surfaceTag('brick'), STU = surfaceTag('stucco'), MET = surfaceTag('metal'), PLK = surfaceTag('planks')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const wring = area < 0 ? [...ring0].reverse() : ring0
  const n = wring.length
  // minimum-area bounding rectangle: the nave frame (u along the long side)
  let th = 0, best = Infinity
  for (let a = 0; a < 90; a += 1) {
    const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of wring) { const x = p.x * c + p.z * s, z = -p.x * s + p.z * c; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z) }
    if ((x1 - x0) * (z1 - z0) < best) { best = (x1 - x0) * (z1 - z0); th = r }
  }
  let ct = Math.cos(th), st = Math.sin(th)
  let ring = wring.map((r) => ({ x: r.x * ct + r.z * st, z: -r.x * st + r.z * ct }))
  const ext = (rg: { x: number; z: number }[]): number[] => [Math.min(...rg.map((p) => p.x)), Math.max(...rg.map((p) => p.x)), Math.min(...rg.map((p) => p.z)), Math.max(...rg.map((p) => p.z))]
  let [umin, umax, vmin, vmax] = ext(ring) as [number, number, number, number]
  if (vmax - vmin > umax - umin) {          // the long side is across: turn a quarter
    th += Math.PI / 2; ct = Math.cos(th); st = Math.sin(th)
    ring = wring.map((r) => ({ x: r.x * ct + r.z * st, z: -r.x * st + r.z * ct }))
    ;[umin, umax, vmin, vmax] = ext(ring) as [number, number, number, number]
  }
  const toW = (a: number, b: number): [number, number] => [a * ct - b * st, a * st + b * ct]
  const vc = (vmin + vmax) / 2, len = umax - umin
  const fs = SSG_FRONT_SIGN, uF = fs < 0 ? umin : umax          // the porch end
  const uAt = (t: number): number => uF - fs * t              // t metres in from the porch end (u grows inward)
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    const W = (v: V3): V3 => { const [x, z] = toW(v[0], v[2]); return [x, v[1], z] }
    const [ox, oz] = toW(o[0], o[2])
    out.quad(pts.map(W), [ox, o[1], oz], [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // a box in the (u, y, v) frame
  const bx = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, col: V3, tag: number): void => {
    quad([[u0, y0, v1], [u1, y0, v1], [u1, y1, v1], [u0, y1, v1]], [0, 0, 1], col, tag)
    quad([[u0, y0, v0], [u1, y0, v0], [u1, y1, v0], [u0, y1, v0]], [0, 0, -1], col, tag)
    quad([[u1, y0, v0], [u1, y0, v1], [u1, y1, v1], [u1, y1, v0]], [1, 0, 0], col, tag)
    quad([[u0, y0, v0], [u0, y0, v1], [u0, y1, v1], [u0, y1, v0]], [-1, 0, 0], col, tag)
    quad([[u0, y1, v0], [u1, y1, v0], [u1, y1, v1], [u0, y1, v1]], [0, 1, 0], col, tag)
  }
  // 1 · brick walls on the cadastre ring, flat cap
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, SSG_EAVES, q.z], [p.x, SSG_EAVES, p.z]], [(q.z - p.z) / L, 0, -(q.x - p.x) / L], brick, BRK)
  }
  capPolygon(out, wring, SSG_EAVES, slate, MET)
  // 2 · nave roof: gable along u, slate
  const hw = (vmax - vmin) * SSG_ROOF_HW + SSG_OVER, ru0 = umin - SSG_OVER, ru1 = umax + SSG_OVER
  const rise = SSG_RIDGE - SSG_EAVES, sl = Math.hypot(hw, rise)
  quad([[ru0, SSG_EAVES - 0.2, vc - hw], [ru1, SSG_EAVES - 0.2, vc - hw], [ru1, SSG_RIDGE, vc], [ru0, SSG_RIDGE, vc]], [0, hw / sl, -rise / sl], slate, MET)
  quad([[ru0, SSG_EAVES - 0.2, vc + hw], [ru1, SSG_EAVES - 0.2, vc + hw], [ru1, SSG_RIDGE, vc], [ru0, SSG_RIDGE, vc]], [0, hw / sl, rise / sl], slate, MET)
  for (const ue of [umin, umax]) {          // brick gable triangles at both ends
    const nx = ue === umin ? -1 : 1
    quad([[ue + nx * 0.02, SSG_EAVES, vc - hw + SSG_OVER], [ue + nx * 0.02, SSG_EAVES, vc + hw - SSG_OVER], [ue + nx * 0.02, SSG_RIDGE, vc], [ue + nx * 0.02, SSG_RIDGE, vc]], [nx, 0, 0], brickD, BRK)
  }
  // flank windows: tall arched lights along both long walls (on the bbox sides where the ring reaches them)
  for (const sg of [-1, 1]) {
    const vb = sg > 0 ? vmax : vmin
    for (let t = 3.2; t < len - 2; t += 3.0) {
      const u = uAt(t)
      quad([[u - 0.5, 2.6, vb + sg * 0.03], [u + 0.5, 2.6, vb + sg * 0.03], [u + 0.5, 6.6, vb + sg * 0.03], [u - 0.5, 6.6, vb + sg * 0.03]], [0, 0, sg], glass, 0)
    }
  }
  // 3 · the timber porch on the porch end
  const pu0 = uF, pu1 = uAt(SSG_PORCH_D), pvA = vc - SSG_PORCH_HW, pvB = vc + SSG_PORCH_HW
  const lo = Math.min(pu0, pu1), hi = Math.max(pu0, pu1), nF = fs < 0 ? -1 : 1
  bx(lo, hi, pvA, pvB, 0, SSG_PORCH_FLOOR, wood, PLK)                                            // plinth deck
  bx(lo - 0.0, hi, pvA + 0.3, pvB - 0.3, SSG_PORCH_FLOOR, SSG_PORCH_EAVES, red, PLK)              // red painted body
  for (const v of [pvA + 0.15, pvB - 0.15, vc - 1.2, vc + 1.2]) bx(Math.min(uF, uF - nF * 0.0) - 0.1, uF + 0.1 + (fs < 0 ? 0.2 : -0.2), v - 0.1, v + 0.1, SSG_PORCH_FLOOR, SSG_PORCH_EAVES, green, 0)
  // door and fretted balustrade on the porch face
  const fu = uF + nF * 0.04
  quad([[fu, SSG_PORCH_FLOOR, vc - 0.8], [fu, SSG_PORCH_FLOOR, vc + 0.8], [fu, SSG_PORCH_FLOOR + 2.6, vc + 0.8], [fu, SSG_PORCH_FLOOR + 2.6, vc - 0.8]], [nF, 0, 0], dark, 0)
  for (let k = 0; k < 14; k++) { const v = pvA + 0.6 + ((pvB - pvA - 1.2) * k) / 13; quad([[fu, SSG_PORCH_FLOOR + 3.0, v - 0.05], [fu, SSG_PORCH_FLOOR + 3.0, v + 0.05], [fu, SSG_PORCH_FLOOR + 4.0, v + 0.05], [fu, SSG_PORCH_FLOOR + 4.0, v - 0.05]], [nF, 0, 0], green, 0) }
  // porch gable roof, ridge along u, deep eaves in dark timber
  const phw = SSG_PORCH_HW + 0.7, prise = SSG_PORCH_RIDGE - SSG_PORCH_EAVES, psl = Math.hypot(phw, prise)
  const o0 = uF + nF * 0.7, o1 = uAt(SSG_PORCH_D) + (fs < 0 ? 0.3 : -0.3)
  quad([[o0, SSG_PORCH_EAVES - 0.1, vc - phw], [o1, SSG_PORCH_EAVES - 0.1, vc - phw], [o1, SSG_PORCH_RIDGE, vc], [o0, SSG_PORCH_RIDGE, vc]], [0, phw / psl, -prise / psl], brickD, MET)
  quad([[o0, SSG_PORCH_EAVES - 0.1, vc + phw], [o1, SSG_PORCH_EAVES - 0.1, vc + phw], [o1, SSG_PORCH_RIDGE, vc], [o0, SSG_PORCH_RIDGE, vc]], [0, phw / psl, prise / psl], brickD, MET)
  quad([[uF + nF * 0.6, SSG_PORCH_EAVES - 0.1, vc - phw + 0.2], [uF + nF * 0.6, SSG_PORCH_EAVES - 0.1, vc + phw - 0.2], [uF + nF * 0.6, SSG_PORCH_RIDGE - 0.15, vc], [uF + nF * 0.6, SSG_PORCH_RIDGE - 0.15, vc]], [nF, 0, 0], red, PLK)   // red gable face
  // double stair: two flights climbing toward the door from each side, fretted green rails
  for (const sg of [-1, 1]) {
    const v0 = vc + sg * (SSG_PORCH_HW - 0.1), v1 = v0 + sg * SSG_STAIR_W, vm = Math.min(v0, v1), vM = Math.max(v0, v1)
    const steps = 7, su = (SSG_PORCH_D - 0.5) / steps
    for (let k = 0; k < steps; k++) {
      const a = uF - fs * (0.3 + k * su), b = a - fs * su
      bx(Math.min(a, b), Math.max(a, b), vm, vM, 0, SSG_PORCH_FLOOR * (steps - k) / steps, wood, PLK)
    }
    bx(lo, hi, v1 - sg * 0.08 - 0.04, v1 - sg * 0.08 + 0.04, SSG_PORCH_FLOOR, SSG_PORCH_FLOOR + 1.0, green, 0)
  }
  // 4 · bell tower: yellow stucco box with arched louvres, hipped slate cap, teal onion dome and cross
  const tu = uAt(len * SSG_TOWER_U), tv = vmin - SSG_TOWER_W * 0.2
  bx(tu - SSG_TOWER_W / 2, tu + SSG_TOWER_W / 2, tv - SSG_TOWER_W / 2, tv + SSG_TOWER_W / 2, 0, SSG_TOWER_H, cream, STU)
  for (const sg of [-1, 1]) for (const ax of [0, 1]) {
    const o: V3 = ax ? [sg, 0, 0] : [0, 0, sg]
    const c = ax ? [tu + sg * (SSG_TOWER_W / 2 + 0.03), tv] : [tu, tv + sg * (SSG_TOWER_W / 2 + 0.03)]
    const d = ax ? [0, 1] : [1, 0]
    quad([[c[0]! - d[0]! * 0.7, SSG_TOWER_H - 2.0, c[1]! - d[1]! * 0.7], [c[0]! + d[0]! * 0.7, SSG_TOWER_H - 2.0, c[1]! + d[1]! * 0.7], [c[0]! + d[0]! * 0.7, SSG_TOWER_H - 0.4, c[1]! + d[1]! * 0.7], [c[0]! - d[0]! * 0.7, SSG_TOWER_H - 0.4, c[1]! - d[1]! * 0.7]], o, dark, 0)
  }
  {
    const [wx, wz] = toW(tu, tv)
    prism(out, wx, wz, SSG_TOWER_H, SSG_TOWER_H + 1.2, SSG_TOWER_W * 0.75, 4, slate, MET, SSG_TOWER_W * 0.3, true, Math.PI / 4 + th)
    prism(out, wx, wz, SSG_TOWER_H + 1.2, SSG_TOWER_H + 1.9, 0.5, 8, cream, STU)
    prism(out, wx, wz, SSG_TOWER_H + 1.9, SSG_TOWER_H + 2.5, SSG_DOME_R * 0.9, 12, teal, MET, SSG_DOME_R)
    prism(out, wx, wz, SSG_TOWER_H + 2.5, SSG_TOWER_H + 3.6, SSG_DOME_R, 12, teal, MET, 0.05)
    prism(out, wx, wz, SSG_TOWER_H + 3.6, SSG_TOWER_H + 4.8, 0.05, 4, gold, MET)
    prism(out, wx, wz, SSG_TOWER_H + 4.2, SSG_TOWER_H + 4.3, 0.35, 4, gold, MET)
  }
  // 5 · slate needle spire over the rear of the nave
  {
    const [wx, wz] = toW(uAt(len * 0.82), vc)
    prism(out, wx, wz, SSG_RIDGE - 0.5, SSG_RIDGE + 1.0, SSG_SPIRE_R * 1.7, 8, brick, BRK, SSG_SPIRE_R * 1.2)
    prism(out, wx, wz, SSG_RIDGE + 1.0, SSG_SPIRE_TOP, SSG_SPIRE_R * 1.2, 8, slate, MET, 0.05)
  }
  void box; void block; void roof; void pane; void archedPane; void shade; void STU
}

// ───────────────────────────── MJLF synagogue (way/115878693), 11 rue Gaston-de-Caillavet, Beaugrenelle ─────────────────────────────
// Two Commons photos (Oren Giorno, MJLF Centre Communautaire Beaugrenelle.jpg; Mouvement juif libéral de France, 11 rue
// Gaston-de-Caillavet.jpg; checked 2026-11-04; Lionel Schein): a pale limestone block under the Beaugrenelle towers, its
// street wall stepped in ragged tiers with small deep-set windows, a blue ribbon of glazing set back on top of the low part,
// a tall blank limestone block with the "mjlf" lettering at one end and a dark glazed ground band; the short end wall by
// rue Robert-de-Flers is white tile with a big dark menorah beside a red-tiled pier. The street edge is the longest ring edge.
const MJ_LOW_H = 10.6        // the stepped low part's top
const MJ_STEPS = [0.0, 0.1, 0.17, 0.3, 0.38, 0.5]  // where along the street wall (fraction) each step block starts
const MJ_STEP_H = [11.4, 12.2, 11.6, 12.8, 12.0, 13.2] // each step block's top
const MJ_TALL_AT = 0.62      // the tall blank block starts here (fraction of the street wall)
const MJ_TALL_H = 15.4       // its top
const MJ_GLASS_H = 2.6       // the ribbon of glazing's height above the low part
const MJ_GLASS_SET = 1.6     // its setback from the street wall
const MJ_WIN_W = 0.9
const MJ_WIN_H = 1.6
const MJ_WIN_PITCH = 2.1
const MJ_WIN_Y = [2.0, 4.4, 6.8, 9.0]  // sills of the staggered window ranks
const MJ_BAND_H = 4.2        // dark glazed ground band under the tall block
const MJ_TILE_PITCH = 0.62   // white tile module on the end wall
const MJ_PIER_W = 1.6        // the red-tiled pier at the end-wall corner
const MJ_MENORAH_W = 4.2     // overall menorah width
const MJ_MENORAH_H = 3.8
const MJ_SIGN_W = 3.4        // "mjlf" lettering plate

export function synagogueMjlf(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cbbfa8'), stoneD = hex('#b6aa92'), tile = hex('#eef0ee'), grout = hex('#c9ccc9'), red = hex('#b3281f'),
    dark = hex('#2a2d33'), glass = hex('#3f6a94'), navy = hex('#1d2640'), roofc = hex('#8a857b')
  const CON = surfaceTag('concrete'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  let cx = 0, cz = 0
  for (const r of ring) { cx += r.x / n; cz += r.z / n }
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // a wall edge p->q: local frame (s along, d out) with the outward normal pointing away from the centroid
  const frame = (p: { x: number; z: number }, q: { x: number; z: number }) => {
    const L = Math.hypot(q.x - p.x, q.z - p.z), ux = (q.x - p.x) / L, uz = (q.z - p.z) / L
    let nx = -uz, nz = ux
    if (((p.x + q.x) / 2 - cx) * nx + ((p.z + q.z) / 2 - cz) * nz < 0) { nx = -nx; nz = -nz }
    const O: V3 = [nx, 0, nz]
    const P = (s: number, y: number, d: number): V3 => [p.x + ux * s + nx * d, y, p.z + uz * s + nz * d]
    const F = (s0: number, s1: number, y0: number, y1: number, d: number, col: V3, tag: number): void =>
      quad([P(s0, y0, d), P(s1, y0, d), P(s1, y1, d), P(s0, y1, d)], O, col, tag)
    return { L, ux, uz, nx, nz, O, P, F }
  }
  // street edge = longest; tile end wall = the edge arriving at its start
  let bi = 0, bl = 0
  for (let i = 0; i < n; i++) { const p = ring[i]!, q = ring[(i + 1) % n]!; const L = Math.hypot(q.x - p.x, q.z - p.z); if (L > bl) { bl = L; bi = i } }
  const a = ring[bi]!, b = ring[(bi + 1) % n]!
  const st = frame(a, b), end = frame(ring[(bi + n - 1) % n]!, a)
  const L = st.L
  // all walls at the low height in stone
  for (let i = 0; i < n; i++) {
    if (i === (bi + n - 1) % n) continue
    const f = frame(ring[i]!, ring[(i + 1) % n]!)
    f.F(0, f.L, 0, MJ_LOW_H, 0, stone, CON)
  }
  capPolygon(out, ring, MJ_LOW_H, roofc, CON)
  // the white-tile end wall with its menorah and red pier
  {
    const E = end.L
    end.F(0, E, 0, MJ_LOW_H, 0, tile, CON)
    for (let s = MJ_TILE_PITCH; s < E; s += MJ_TILE_PITCH) end.F(s - 0.015, s + 0.015, 0, MJ_LOW_H, 0.01, grout, CON)
    for (let y = MJ_TILE_PITCH; y < MJ_LOW_H; y += MJ_TILE_PITCH) end.F(0, E, y - 0.015, y + 0.015, 0.01, grout, CON)
    end.F(E - MJ_PIER_W, E, 0, MJ_LOW_H, 0.05, red, CON)                       // pier at the street-wall corner end
    // menorah: base arc, stem and seven arms
    const mc = E * 0.4, t = 0.16, mh = MJ_MENORAH_H, y0 = 5.0
    for (let k = -3; k <= 3; k++) {
      const x = mc + (k * MJ_MENORAH_W) / 7, drop = (Math.abs(k) / 3) ** 2 * mh * 0.45
      end.F(x - t / 2, x + t / 2, y0 + drop + mh * 0.1, y0 + mh, 0.04, navy, MET)
    }
    const seg = 16
    for (let i = 0; i < seg; i++) {
      const u0 = (i / seg) * 2 - 1, u1 = ((i + 1) / seg) * 2 - 1
      const x0 = mc + (u0 * MJ_MENORAH_W * 3) / 7, x1 = mc + (u1 * MJ_MENORAH_W * 3) / 7
      const yy0 = y0 + mh * 0.1 + (u0 * u0) * mh * 0.45, yy1 = y0 + mh * 0.1 + (u1 * u1) * mh * 0.45
      quad([end.P(x0, yy0 - t / 2, 0.04), end.P(x1, yy1 - t / 2, 0.04), end.P(x1, yy1 + t / 2, 0.04), end.P(x0, yy0 + t / 2, 0.04)], end.O, navy, MET)
    }
    end.F(mc - t / 2, mc + t / 2, y0 - 1.0, y0 + mh * 0.1, 0.04, navy, MET)    // the stem
  }
  // the stepped low part on the street wall: ragged step blocks (set slightly proud), small deep windows
  for (let i = 0; i < MJ_STEPS.length; i++) {
    const s0 = MJ_STEPS[i]! * L, s1 = (i + 1 < MJ_STEPS.length ? MJ_STEPS[i + 1]! : MJ_TALL_AT) * L
    if (MJ_STEP_H[i]! > MJ_LOW_H) {
      const d = 0.0
      st.F(s0, s1, MJ_LOW_H, MJ_STEP_H[i]!, d, stoneD, CON)
      // cap and side returns
      quad([st.P(s0, MJ_STEP_H[i]!, 0), st.P(s1, MJ_STEP_H[i]!, 0), st.P(s1, MJ_STEP_H[i]!, -3), st.P(s0, MJ_STEP_H[i]!, -3)], [0, 1, 0], roofc, CON)
    }
  }
  // glazing ribbon on top of the low part, set back
  {
    const s0 = 0.08 * L, s1 = MJ_TALL_AT * L - 0.3, g = MJ_GLASS_SET, y0 = MJ_STEP_H[3]! + 0.0
    st.F(s0, s1, y0, y0 + MJ_GLASS_H, -g, glass, MET)
    for (let s = s0 + 1.1; s < s1; s += 1.1) st.F(s - 0.03, s + 0.03, y0, y0 + MJ_GLASS_H, -g + 0.02, dark, MET)
    st.F(s0, s1, y0 + MJ_GLASS_H, y0 + MJ_GLASS_H + 0.15, -g + 0.02, dark, MET)
  }
  // tall blank limestone block at the far end of the street wall, with lettering, over a dark glazed ground band
  {
    const s0 = MJ_TALL_AT * L
    st.F(s0, L, MJ_LOW_H, MJ_TALL_H, 0.15, stone, CON)
    st.F(s0 - 0.15, s0, MJ_LOW_H, MJ_TALL_H, 0.15, stoneD, CON)
    quad([st.P(s0, MJ_TALL_H, 0.15), st.P(L, MJ_TALL_H, 0.15), st.P(L, MJ_TALL_H, -4), st.P(s0, MJ_TALL_H, -4)], [0, 1, 0], roofc, CON)
    for (let y = 2.4; y < MJ_TALL_H; y += 2.4) st.F(s0, L, y - 0.02, y + 0.02, 0.17, stoneD, CON)   // slab joints
    const sc = s0 + (L - s0) * 0.5
    st.F(sc - MJ_SIGN_W / 2, sc + MJ_SIGN_W / 2, MJ_TALL_H - 1.8, MJ_TALL_H - 0.9, 0.2, navy, MET)
    st.F(L - 1.2, L - 0.5, MJ_TALL_H - 1.7, MJ_TALL_H - 1.0, 0.2, navy, MET)   // the star
    st.F(s0 + 0.4, L - 0.2, 0.3, MJ_BAND_H, 0.2, glass, MET)                    // glazed ground band
    for (let s = s0 + 1.8; s < L - 0.2; s += 1.8) st.F(s - 0.04, s + 0.04, 0.3, MJ_BAND_H, 0.22, dark, MET)
  }
  // small deep-set windows, staggered, on the stepped part
  const wEnd = MJ_TALL_AT * L - 0.5
  let k = 0
  for (let s = 1.2; s + MJ_WIN_W < wEnd; s += MJ_WIN_PITCH, k++) {
    for (let r = 0; r < MJ_WIN_Y.length; r++) {
      if ((k + r) % 2) continue
      const y = MJ_WIN_Y[r]!
      st.F(s, s + MJ_WIN_W, y, y + MJ_WIN_H, 0.04, dark, MET)
      st.F(s - 0.08, s + MJ_WIN_W + 0.08, y - 0.1, y, 0.08, stoneD, CON)
    }
  }
}

// ───────────────────────────── Temple antoiniste, Passage Roux (way/84317601), 17e ─────────────────────────
// Commons "Temple antoiniste Passage Roux.png" (2026-11-04, docs/landmarks/refs/worship/antoiniste17): a 1955 red-brick hall
// whose gable end on the passage is a single steep pointed arch filled with a pale concrete lattice over dark glass, a recessed
// wooden door in a cream surround below it, a dark slate roof and a low iron railing along the passage. The cadastre ring is
// ragged (annexes), so the frame is its minimum-area rectangle; the front end is the one facing the passage, which lies
// south of the plot (ATN17_FRONT_X/Z, a world-frame direction, z north).
const ATN17_EAVES = 6.0        // nave wall height
const ATN17_RIDGE = 9.2        // gable apex
const ATN17_LOW = 4.0          // annexe wall height on the ring
const ATN17_HW = 3.9           // nave half-width
const ATN17_OVER = 0.3         // roof overhang
const ATN17_FRONT_X = 0.3      // direction of the passage from the plot (world x east, z north: it runs past the south end)
const ATN17_FRONT_Z = -0.95
const ATN17_ARCH_W = 2.55      // lattice arch half-width
const ATN17_ARCH_Y0 = 2.9      // arch spring
const ATN17_ARCH_TOP = 8.3     // arch apex
const ATN17_ARCH_PW = 1.45     // taper exponent (1 = straight sides, higher = fuller)
const ATN17_BAR = 0.45         // lattice pitch
const ATN17_DOOR_W = 1.1       // door half-width
const ATN17_DOOR_H = 2.6
const ATN17_FENCE_D = 1.3      // railing distance in front of the gable
const ATN17_FENCE_H = 1.15

export function templeAntoiniste17(out: MeshBuilder, fit: Fit): void {
  const brick = hex('#a8503a'), cream = hex('#eadfc4'), slate = hex('#3f434b'), glass = hex('#2d333b'), wood = hex('#6a3f1e'),
    iron = hex('#1c1c1f'), tar = hex('#55565a')
  const BRK = surfaceTag('brick'), STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const wring = area < 0 ? [...ring0].reverse() : ring0
  const n = wring.length
  let th = 0, best = Infinity
  for (let a = 0; a < 90; a += 1) {
    const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of wring) { const x = p.x * c + p.z * s, z = -p.x * s + p.z * c; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z) }
    if ((x1 - x0) * (z1 - z0) < best) { best = (x1 - x0) * (z1 - z0); th = r }
  }
  const frame = (t: number): { x: number; z: number }[] => wring.map((r) => ({ x: r.x * Math.cos(t) + r.z * Math.sin(t), z: -r.x * Math.sin(t) + r.z * Math.cos(t) }))
  const ext = (rg: { x: number; z: number }[]): number[] => [Math.min(...rg.map((p) => p.x)), Math.max(...rg.map((p) => p.x)), Math.min(...rg.map((p) => p.z)), Math.max(...rg.map((p) => p.z))]
  let ring = frame(th)
  let [umin, umax, vmin, vmax] = ext(ring) as [number, number, number, number]
  if (vmax - vmin > umax - umin) { th += Math.PI / 2; ring = frame(th); [umin, umax, vmin, vmax] = ext(ring) as [number, number, number, number] }
  const ct = Math.cos(th), st = Math.sin(th)
  const toW = (a: number, b: number): [number, number] => [a * ct - b * st, a * st + b * ct]
  const vc = (vmin + vmax) / 2
  const [dx, dz] = toW(1, 0)
  const fs = dx * ATN17_FRONT_X + dz * ATN17_FRONT_Z >= 0 ? 1 : -1     // +1: the front is the high-u end
  const uF = fs > 0 ? umax : umin, uB = fs > 0 ? umin : umax
  const hw = Math.min(ATN17_HW, (vmax - vmin) * 0.45)
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    const W = (v: V3): V3 => { const [x, z] = toW(v[0], v[2]); return [x, v[1], z] }
    const [ox, oz] = toW(o[0], o[2])
    out.quad(pts.map(W), [ox, o[1], oz], [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  const bx = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, col: V3, tag: number): void => {
    quad([[u0, y0, v1], [u1, y0, v1], [u1, y1, v1], [u0, y1, v1]], [0, 0, 1], col, tag)
    quad([[u0, y0, v0], [u1, y0, v0], [u1, y1, v0], [u0, y1, v0]], [0, 0, -1], col, tag)
    quad([[u1, y0, v0], [u1, y0, v1], [u1, y1, v1], [u1, y1, v0]], [1, 0, 0], col, tag)
    quad([[u0, y0, v0], [u0, y0, v1], [u0, y1, v1], [u0, y1, v0]], [-1, 0, 0], col, tag)
    quad([[u0, y1, v0], [u1, y1, v0], [u1, y1, v1], [u0, y1, v1]], [0, 1, 0], col, tag)
  }
  // 1 · annexe walls on the ring, flat tar cap
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, ATN17_LOW, q.z], [p.x, ATN17_LOW, p.z]], [(q.z - p.z) / L, 0, -(q.x - p.x) / L], brick, BRK)
  }
  capPolygon(out, wring, ATN17_LOW, tar, MET)
  // 2 · the nave: brick walls, slate gable roof, gable ends
  const u0 = Math.min(uF, uB) , u1 = Math.max(uF, uB), vl = vc - hw, vr = vc + hw
  for (const [v, o] of [[vl, -1], [vr, 1]] as [number, number][]) quad([[u0, 0, v], [u1, 0, v], [u1, ATN17_EAVES, v], [u0, ATN17_EAVES, v]], [0, 0, o], brick, BRK)
  const gable = (u: number, o: number, col: V3, tag: number): void => {
    quad([[u, 0, vl], [u, 0, vr], [u, ATN17_EAVES, vr], [u, ATN17_EAVES, vl]], [o, 0, 0], col, tag)
    quad([[u, ATN17_EAVES, vl], [u, ATN17_EAVES, vr], [u, ATN17_RIDGE, vc], [u, ATN17_RIDGE, vc]], [o, 0, 0], col, tag)
  }
  gable(uF, fs, brick, BRK); gable(uB, -fs, brick, BRK)
  const hwr = hw + ATN17_OVER, slope = Math.hypot(ATN17_RIDGE - ATN17_EAVES, hwr), sy = hwr / slope, sz = (ATN17_RIDGE - ATN17_EAVES) / slope
  const ru0 = u0 - ATN17_OVER, ru1 = u1 + ATN17_OVER
  quad([[ru0, ATN17_EAVES - 0.25, vc - hwr], [ru1, ATN17_EAVES - 0.25, vc - hwr], [ru1, ATN17_RIDGE, vc], [ru0, ATN17_RIDGE, vc]], [0, sy, -sz], slate, MET)
  quad([[ru0, ATN17_EAVES - 0.25, vc + hwr], [ru1, ATN17_EAVES - 0.25, vc + hwr], [ru1, ATN17_RIDGE, vc], [ru0, ATN17_RIDGE, vc]], [0, sy, sz], slate, MET)
  // 3 · the front: pointed lattice arch over glass, cream surround, door and railing
  const F = (s0: number, s1: number, y0: number, y1: number, d: number, col: V3, tag = 0): void =>
    quad([[uF + fs * d, y0, vc + s0], [uF + fs * d, y0, vc + s1], [uF + fs * d, y1, vc + s1], [uF + fs * d, y1, vc + s0]], [fs, 0, 0], col, tag)
  const aw = (y: number): number => {
    if (y <= ATN17_ARCH_Y0 + 1.2) return ATN17_ARCH_W
    const t = Math.min(1, (y - ATN17_ARCH_Y0 - 1.2) / (ATN17_ARCH_TOP - ATN17_ARCH_Y0 - 1.2))
    return ATN17_ARCH_W * Math.pow(Math.max(0, 1 - Math.pow(t, ATN17_ARCH_PW)), 0.7)
  }
  const dy = 0.25
  for (let y = ATN17_ARCH_Y0; y < ATN17_ARCH_TOP; y += dy) {
    const w = aw(y + dy * 0.5)
    if (w < 0.05) continue
    F(-w - 0.28, w + 0.28, y, y + dy, 0.04, cream, STU)
    F(-w, w, y, y + dy, 0.07, glass)
  }
  for (let s = -ATN17_ARCH_W + ATN17_BAR / 2; s < ATN17_ARCH_W; s += ATN17_BAR) {
    let top = ATN17_ARCH_Y0
    while (top + dy < ATN17_ARCH_TOP && aw(top + dy * 0.5) > Math.abs(s)) top += dy
    if (top > ATN17_ARCH_Y0 + 0.2) F(s - 0.05, s + 0.05, ATN17_ARCH_Y0, top, 0.11, cream, STU)
  }
  for (let y = ATN17_ARCH_Y0 + ATN17_BAR / 2; y < ATN17_ARCH_TOP - 0.4; y += ATN17_BAR) { const w = aw(y); if (w > 0.1) F(-w, w, y - 0.05, y + 0.05, 0.11, cream, STU) }
  // door and its surround (recessed brick reveal below the arch)
  F(-ATN17_DOOR_W - 0.35, ATN17_DOOR_W + 0.35, 0, ATN17_DOOR_H + 0.3, 0.05, cream, STU)
  F(-ATN17_DOOR_W, ATN17_DOOR_W, 0, ATN17_DOOR_H, 0.1, wood)
  F(-ATN17_DOOR_W + 0.15, ATN17_DOOR_W - 0.15, ATN17_DOOR_H - 0.9, ATN17_DOOR_H - 0.15, 0.12, glass)
  F(-0.03, 0.03, 0, ATN17_DOOR_H - 0.9, 0.12, iron)
  // plinth stripe and the railing along the passage
  F(-hw, hw, 0, 0.5, 0.03, hex('#7d3f2c'), BRK)
  const rv0 = vc - hw - 0.6, rv1 = vc + hw + 0.6, du = ATN17_FENCE_D, uf = uF + fs * du
  for (let v = rv0; v <= rv1 + 0.01; v += 0.2) bx(uf - 0.015, uf + 0.015, v - 0.012, v + 0.012, 0, ATN17_FENCE_H, iron, MET)
  bx(uf - 0.02, uf + 0.02, rv0, rv1, ATN17_FENCE_H - 0.06, ATN17_FENCE_H, iron, MET)
  bx(uf - 0.02, uf + 0.02, rv0, rv1, 0.12, 0.17, iron, MET)
  void box; void block; void roof; void pane; void archedPane; void shade; void prism
}

// Temple Antoiniste, rue du Pré-Saint-Gervais (19e, way/63234870): a plain two-storey hall front, 5 bays of buff brick with cream
// pilasters, string course and cornice, a central arched door under a "CULTE ANTOINISTE" panel and a triple window, a raised
// cream attic over the centre bay, low slate roof behind. The ring is a rectangle ~19 x 15 m skewed to the north; the street
// lies to its south-east, which the loader turns to local +z (ATN19_STREET_X/Z): the builder takes the rectangle side nearest that. Photos: Commons
// 'Temple Antoiniste Rue Pré Saint Gervais - Paris XIX (FR75) - 2022-01-01 - 2.jpg'.
const ATN19_STREET_X = 0       // street side in the MODEL frame: the loader turns the model so its entry `front` (bearing 147) puts rue du Pré-Saint-Gervais at local +z (checked with model-shots --front=147)
const ATN19_STREET_Z = 1
const ATN19_EAVES = 7.3        // cornice top
const ATN19_RIDGE = 9.0        // slate ridge
const ATN19_ATTIC = 8.8        // top of the raised centre attic
const ATN19_PLINTH = 0.8
const ATN19_BAYS = 5
const ATN19_PIL_W = 0.5        // pilaster width
const ATN19_PIL_D = 0.14       // pilaster projection
const ATN19_STRING_Y = 3.5     // string course height (floor line)
const ATN19_WIN_W = 1.05       // single window width
const ATN19_WIN_LO_Y = 1.2     // ground-floor sill
const ATN19_WIN_LO_H = 1.6
const ATN19_WIN_UP_Y = 4.4     // first-floor sill
const ATN19_WIN_UP_H = 1.9
const ATN19_DOOR_W = 1.7       // door width
const ATN19_DOOR_H = 3.0       // door apex
const ATN19_SIGN_Y = 3.75      // sign panel bottom
const ATN19_SIGN_W = 3.0

export function templeAntoiniste19(out: MeshBuilder, fit: Fit): void {
  const buff = hex('#c9a468'), cream = hex('#ebe3cd'), redbrick = hex('#9a4a35'), slate = hex('#4f5560'), glass = hex('#2b3036'),
    wood = hex('#2f4a40'), dark = hex('#3a3a3c'), plinth = hex('#a79c86')
  const BRK = surfaceTag('brick'), STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const wring = area < 0 ? [...ring0].reverse() : ring0
  const n = wring.length
  // minimum-area rectangle frame, then turn it so that the -v side faces the street
  let th0 = 0, best = Infinity
  for (let a = 0; a < 90; a += 1) {
    const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of wring) { const x = p.x * c + p.z * s, z = -p.x * s + p.z * c; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z) }
    if ((x1 - x0) * (z1 - z0) < best) { best = (x1 - x0) * (z1 - z0); th0 = r }
  }
  let th = th0, bd = -Infinity
  for (let k = 0; k < 4; k++) {
    const t = th0 + (k * Math.PI) / 2, d = Math.sin(t) * ATN19_STREET_X - Math.cos(t) * ATN19_STREET_Z   // world dir of frame -v = (sin t, -cos t)... dotted with the street
    if (d > bd) { bd = d; th = t }
  }
  const ct = Math.cos(th), st = Math.sin(th)
  const toW = (a: number, b: number): [number, number] => [a * ct - b * st, a * st + b * ct]
  const ring = wring.map((r) => ({ x: r.x * ct + r.z * st, z: -r.x * st + r.z * ct }))
  let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity
  for (const r of ring) { umin = Math.min(umin, r.x); umax = Math.max(umax, r.x); vmin = Math.min(vmin, r.z); vmax = Math.max(vmax, r.z) }
  const W = umax - umin, vc = (vmin + vmax) / 2
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    const Wv = (v: V3): V3 => { const [x, z] = toW(v[0], v[2]); return [x, v[1], z] }
    const [ox, oz] = toW(o[0], o[2])
    out.quad(pts.map(Wv), [ox, o[1], oz], [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // 1 · ring walls in buff brick up to the eaves (the ring is in world axes, so use the framed copy), plinth
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L], k = 0.05
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, ATN19_EAVES, q.z], [p.x, ATN19_EAVES, p.z]], o, buff, BRK)
    quad([[p.x + o[0] * k, 0, p.z + o[2] * k], [q.x + o[0] * k, 0, q.z + o[2] * k], [q.x + o[0] * k, ATN19_PLINTH, q.z + o[2] * k], [p.x + o[0] * k, ATN19_PLINTH, p.z + o[2] * k]], o, plinth, STU)
  }
  // 2 · slate roof: ridge along u at the middle of the plot, hipped-free gables
  const ov = 0.3, hv = (vmax - vmin) / 2 + ov
  const run = hv, rise = ATN19_RIDGE - ATN19_EAVES, ln = Math.hypot(run, rise)
  for (const sg of [-1, 1]) {
    quad([[umin - ov, ATN19_EAVES - 0.15, vc + sg * hv], [umax + ov, ATN19_EAVES - 0.15, vc + sg * hv], [umax + ov, ATN19_RIDGE, vc], [umin - ov, ATN19_RIDGE, vc]], [0, run / ln, sg * rise / ln], slate, MET)
  }
  for (const [u, o] of [[umin, -1], [umax, 1]] as [number, number][])
    quad([[u, ATN19_EAVES, vmin], [u, ATN19_EAVES, vmax], [u, ATN19_RIDGE, vc], [u, ATN19_RIDGE, vc]], [o, 0, 0], buff, BRK)
  // 3 · the street façade at v = vmin
  const vF = vmin
  const F = (u0: number, u1: number, y0: number, y1: number, d: number, col: V3, tag = 0): void =>
    quad([[u0, y0, vF - d], [u1, y0, vF - d], [u1, y1, vF - d], [u0, y1, vF - d]], [0, 0, -1], col, tag)
  const arch = (cx: number, w: number, y0: number, h: number, d: number, col: V3, tag = 0): void => {
    const r = w / 2, yb = y0 + h - r
    F(cx - r, cx + r, y0, yb, d, col, tag)
    const m = 10
    for (let i = 0; i < m; i++) {
      const x0 = -r + (2 * r * i) / m, x1 = -r + (2 * r * (i + 1)) / m, xm = Math.abs((x0 + x1) / 2)
      F(cx + x0, cx + x1, yb, yb + Math.sqrt(Math.max(r * r - xm * xm, 0)), d, col, tag)
    }
  }
  const bw = (W - ATN19_PIL_W) / ATN19_BAYS
  const bayC = (b: number): number => umin + ATN19_PIL_W / 2 + bw * (b + 0.5)
  // plinth, string course, cornice, red-brick base course
  F(umin, umax, 0, ATN19_PLINTH, 0.06, plinth, STU)
  F(umin, umax, ATN19_PLINTH, ATN19_PLINTH + 0.2, 0.05, redbrick, BRK)
  F(umin, umax, ATN19_STRING_Y - 0.15, ATN19_STRING_Y + 0.15, 0.1, cream, STU)
  F(umin - 0.1, umax + 0.1, ATN19_EAVES - 0.45, ATN19_EAVES, 0.22, cream, STU)
  // pilasters at the corners and between bays
  for (let b = 0; b <= ATN19_BAYS; b++) {
    const uc2 = umin + ATN19_PIL_W / 2 + bw * b
    F(uc2 - ATN19_PIL_W / 2, uc2 + ATN19_PIL_W / 2, ATN19_PLINTH, ATN19_EAVES - 0.45, ATN19_PIL_D, cream, STU)
  }
  const mid = Math.floor(ATN19_BAYS / 2)
  const win = (cx: number, y0: number, h: number, w: number): void => {
    F(cx - w / 2 - 0.12, cx + w / 2 + 0.12, y0 - 0.12, y0 + h + 0.12, 0.05, cream, STU)
    F(cx - w / 2, cx + w / 2, y0, y0 + h, 0.09, glass)
    F(cx - 0.025, cx + 0.025, y0, y0 + h, 0.11, cream)
    F(cx - w / 2, cx + w / 2, y0 + h * 0.62, y0 + h * 0.62 + 0.05, 0.11, cream)
    F(cx - w / 2 - 0.2, cx + w / 2 + 0.2, y0 - 0.2, y0 - 0.1, 0.18, cream, STU)   // sill
  }
  for (let b = 0; b < ATN19_BAYS; b++) {
    const cx = bayC(b)
    if (b === mid) continue
    for (const dx of b === 0 || b === ATN19_BAYS - 1 ? [0] : [-0.7, 0.7]) win(cx + dx * 1.0, ATN19_WIN_LO_Y, ATN19_WIN_LO_H, b === 0 || b === ATN19_BAYS - 1 ? ATN19_WIN_W : ATN19_WIN_W * 0.8)
    for (const dx of b === 0 || b === ATN19_BAYS - 1 ? [-0.5, 0.5] : [-0.8, 0.8]) win(cx + dx, ATN19_WIN_UP_Y, ATN19_WIN_UP_H, ATN19_WIN_W * 0.72)
  }
  // central bay: arched door, red-brick archivolt, sign panel, triple window
  const cx = bayC(mid)
  arch(cx, ATN19_DOOR_W + 1.0, 0, ATN19_DOOR_H + 0.5, 0.06, cream, STU)
  arch(cx, ATN19_DOOR_W + 0.7, 0, ATN19_DOOR_H + 0.35, 0.08, redbrick, BRK)
  arch(cx, ATN19_DOOR_W, 0, ATN19_DOOR_H, 0.12, wood)
  const dyb = ATN19_DOOR_H - ATN19_DOOR_W / 2
  F(cx - ATN19_DOOR_W / 2, cx + ATN19_DOOR_W / 2, dyb - 0.08, dyb, 0.15, dark)    // transom bar
  F(cx - 0.03, cx + 0.03, 0, dyb, 0.15, dark)                                      // meeting stile
  F(cx - ATN19_SIGN_W / 2, cx + ATN19_SIGN_W / 2, ATN19_SIGN_Y, ATN19_SIGN_Y + 0.5, 0.11, cream, STU)
  F(cx - ATN19_SIGN_W / 2 + 0.2, cx + ATN19_SIGN_W / 2 - 0.2, ATN19_SIGN_Y + 0.17, ATN19_SIGN_Y + 0.33, 0.13, dark)   // lettering band
  for (const dx of [-1.15, 0, 1.15]) win(cx + dx, ATN19_WIN_UP_Y + 0.5, ATN19_WIN_UP_H - 0.2, ATN19_WIN_W * 0.7)
  // raised cream attic with a small pediment over the centre bay
  const aw = bw * 1.1
  for (const [u, o] of [[cx - aw / 2, -1], [cx + aw / 2, 1]] as [number, number][])
    quad([[u, ATN19_EAVES, vF], [u, ATN19_EAVES, vF + 0.5], [u, ATN19_ATTIC, vF + 0.5], [u, ATN19_ATTIC, vF]], [o, 0, 0], cream, STU)
  F(cx - aw / 2, cx + aw / 2, ATN19_EAVES, ATN19_ATTIC, 0.18, cream, STU)
  quad([[cx - aw / 2, ATN19_ATTIC, vF - 0.18], [cx + aw / 2, ATN19_ATTIC, vF - 0.18], [cx + aw / 2, ATN19_ATTIC, vF + 0.5], [cx - aw / 2, ATN19_ATTIC, vF + 0.5]], [0, 1, 0], cream, STU)
  F(cx - aw / 2 + 0.3, cx + aw / 2 - 0.3, ATN19_EAVES + 0.3, ATN19_ATTIC - 0.3, 0.2, buff, BRK)
}

// ───────────────────────────── Les portes de la paix (way/94743989), 72 boulevard Gallieni, Issy-les-Moulineaux ─────────────────────────────
// Community centre and synagogue, 1994. Read off Google Images (KosherWorld / Mapcarta street shots, 2026-11-04;
// docs/landmarks/refs/worship/portes-de-la-paix.png): a pale grey, panel-clad concrete block of ~4 storeys, nearly
// windowless to the street, stepped in setbacks, with a rounded, horizontally-panelled corner drum at one end and a
// blue double door carrying a gold menorah in a low recess. The street wall is taken as the longest ring edge.
const PP_H = 13.6            // main eaves
const PP_STEP_H = 10.2       // the stepped lower tier
const PP_STEP_FRAC = 0.4     // share of the street wall the lower tier takes (at the far end from the drum)
const PP_DRUM_R = 4.6        // radius of the rounded panelled corner
const PP_DRUM_H = 15.2       // drum top
const PP_PANEL_H = 1.15      // horizontal panel module on the drum
const PP_DOOR_W = 2.8        // blue door width
const PP_DOOR_H = 3.2
const PP_RECESS = 0.5        // door recess depth
const PP_WIN_W = 1.3         // the few slot windows
const PP_WIN_H = 2.4

export function synagogueLesPortesDeLaPaix(out: MeshBuilder, fit: Fit): void {
  const wall = hex('#d3d4d2'), panel = hex('#c6c8c8'), joint = hex('#9a9c9d'), blue = hex('#5c78a8'), gold = hex('#c9a443'),
    glass = hex('#4b5560'), roofc = hex('#8c8d8c')
  const CON = surfaceTag('concrete'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  let cx = 0, cz = 0
  for (const r of ring) { cx += r.x / n; cz += r.z / n }
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  const frame = (p: { x: number; z: number }, q: { x: number; z: number }) => {
    const L = Math.hypot(q.x - p.x, q.z - p.z), ux = (q.x - p.x) / L, uz = (q.z - p.z) / L
    let nx = -uz, nz = ux
    if (((p.x + q.x) / 2 - cx) * nx + ((p.z + q.z) / 2 - cz) * nz < 0) { nx = -nx; nz = -nz }
    const O: V3 = [nx, 0, nz]
    const P = (s: number, y: number, d: number): V3 => [p.x + ux * s + nx * d, y, p.z + uz * s + nz * d]
    const F = (s0: number, s1: number, y0: number, y1: number, d: number, col: V3, tag: number): void =>
      quad([P(s0, y0, d), P(s1, y0, d), P(s1, y1, d), P(s0, y1, d)], O, col, tag)
    return { L, ux, uz, nx, nz, O, P, F }
  }
  let bi = 0, bl = 0
  for (let i = 0; i < n; i++) { const p = ring[i]!, q = ring[(i + 1) % n]!; const L = Math.hypot(q.x - p.x, q.z - p.z); if (L > bl) { bl = L; bi = i } }
  const st = frame(ring[bi]!, ring[(bi + 1) % n]!)
  const L = st.L
  // walls: street edge tiered (lower part toward the start), the rest at full height
  for (let i = 0; i < n; i++) {
    const f = frame(ring[i]!, ring[(i + 1) % n]!)
    if (i === bi) {
      const sp = L * PP_STEP_FRAC
      f.F(0, sp, 0, PP_STEP_H, 0, wall, CON)
      f.F(sp, L, 0, PP_H, 0, wall, CON)
      f.F(0, sp, PP_STEP_H, PP_H, PP_RECESS * 2, wall, CON)       // the upper tier stands back over the lower
    } else f.F(0, f.L, 0, PP_H, 0, wall, CON)
  }
  capPolygon(out, ring, PP_H, roofc, CON)
  // panel joints on the street wall
  for (let y = PP_PANEL_H * 2; y < PP_H; y += PP_PANEL_H * 2) st.F(0, L, y - 0.02, y + 0.02, 0.03, joint, CON)
  // the rounded panelled corner drum at the far end of the street wall (centre inside the wall by the radius)
  {
    const sc = L - PP_DRUM_R, seg = 14
    const c0 = st.P(sc, 0, -PP_DRUM_R * 0.35)
    for (let i = 0; i < seg; i++) {
      const a0 = (-Math.PI / 2) + (i / seg) * (Math.PI / 2), a1 = (-Math.PI / 2) + ((i + 1) / seg) * (Math.PI / 2)
      const dir = (a: number): [number, number] => [st.ux * Math.cos(a + Math.PI / 2) + st.nx * Math.sin(a + Math.PI / 2), st.uz * Math.cos(a + Math.PI / 2) + st.nz * Math.sin(a + Math.PI / 2)]
      const d0 = dir(a0), d1 = dir(a1)
      const mid = dir((a0 + a1) / 2)
      for (let y = 0, k = 0; y < PP_DRUM_H; y += PP_PANEL_H, k++) {
        const y1 = Math.min(PP_DRUM_H, y + PP_PANEL_H)
        quad([[c0[0] + d0[0] * PP_DRUM_R, y, c0[2] + d0[1] * PP_DRUM_R], [c0[0] + d1[0] * PP_DRUM_R, y, c0[2] + d1[1] * PP_DRUM_R],
          [c0[0] + d1[0] * PP_DRUM_R, y1, c0[2] + d1[1] * PP_DRUM_R], [c0[0] + d0[0] * PP_DRUM_R, y1, c0[2] + d0[1] * PP_DRUM_R]],
        [mid[0], 0, mid[1]], k % 2 ? panel : wall, CON)
      }
    }
    // flat top of the drum
    const disc: { x: number; z: number }[] = [{ x: c0[0], z: c0[2] }]
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * (Math.PI / 2) + 0
      disc.push({ x: c0[0] + (st.ux * Math.cos(a) + st.nx * Math.sin(a)) * PP_DRUM_R, z: c0[2] + (st.uz * Math.cos(a) + st.nz * Math.sin(a)) * PP_DRUM_R })
    }
    let da = 0
    for (let i = 0; i < disc.length; i++) { const p = disc[i]!, q = disc[(i + 1) % disc.length]!; da += p.x * q.z - q.x * p.z }
    capPolygon(out, da < 0 ? disc.reverse() : disc, PP_DRUM_H, roofc, CON)
  }
  // the blue door with its gold menorah, recessed at the lower tier
  {
    const s = Math.min(L * PP_STEP_FRAC * 0.55, L * 0.25)
    st.F(s - PP_DOOR_W * 0.75, s + PP_DOOR_W * 0.75, 0, PP_DOOR_H + 0.9, 0.06, glass, MET)
    st.F(s - PP_DOOR_W / 2, s, 0, PP_DOOR_H, 0.1, blue, MET)
    st.F(s, s + PP_DOOR_W / 2, 0, PP_DOOR_H, 0.1, blue, MET)
    for (let k = -3; k <= 3; k++) st.F(s + k * 0.2 - 0.04, s + k * 0.2 + 0.04, 1.4 + (Math.abs(k) / 3) ** 2 * 0.4, 2.8, 0.14, gold, MET)
    st.F(s - 0.9, s + 0.9, PP_DOOR_H + 0.5, PP_DOOR_H + 0.62, 0.12, gold, MET)
  }
  // a few tall slot windows on the upper wall
  for (const f of [0.5, 0.72]) st.F(L * f - PP_WIN_W / 2, L * f + PP_WIN_W / 2, PP_H - 4.2, PP_H - 4.2 + PP_WIN_H, 0.05, glass, MET)
}

// ───────────────────────────── Synagogue Rashi, 6 rue Ambroise-Thomas (9e, way/69221039) ─────────────────────────────
// A narrow 1950s concrete synagogue, ~12 m wide on the street and ~21 m deep, about 4 storeys. Street wall (Commons 'Paris
// Synagogue Rachi 32/33.JPG', docs/landmarks/refs/worship/rashi/): a limestone base with a double dark door, above it a
// painted concrete wall of vertical bands, olive green / pale weathered concrete, a few barred slit windows, one big
// wood-framed window, a pair of white-shuttered windows under a green parapet carrying a pale Star of David panel.
// The street (rue Ambroise-Thomas, a living street found with osmium on the pbf) is the SHORT WEST edge; the loader turns
// the model so entry `front` -83 puts it at local +z, and the builder takes the min-area-rectangle side nearest that.
// Bands are in fractions of the façade width, left to right as seen from the street.
const RSH_STREET_X = 0
const RSH_STREET_Z = 1
const RSH_H = 15.8             // parapet top
const RSH_BASE_H = 3.2         // limestone base
const RSH_DOOR_U0 = 0.2        // door span, fraction of width
const RSH_DOOR_U1 = 0.59
const RSH_DOOR_H = 3.0
const RSH_STAR_U0 = 0.65       // star panel, fraction of width
const RSH_STAR_U1 = 0.78
const RSH_STAR_Y0 = 14.0
const RSH_BANDS: [number, number, number][] = [[0, 0.25, 0], [0.25, 0.7, 1], [0.7, 0.92, 0], [0.92, 1, 1]]   // [u0, u1, 0 green | 1 pale]
const RSH_BAND_TOP = 12.6      // the bands stop here; green parapet above
const RSH_BAND_D = 0.08        // relief of the pale bands over the green
// [u0, u1, y0, y1, kind]: kind 0 barred slit, 1 wood-framed big window, 2 white shuttered
const RSH_WINDOWS: [number, number, number, number, number][] = [
  [0.09, 0.16, 2.9, 4.2, 0], [0.11, 0.17, 6.5, 7.9, 0],
  [0.34, 0.46, 9.8, 11.3, 1], [0.36, 0.49, 12.7, 13.8, 2], [0.51, 0.64, 12.7, 13.8, 2],
  [0.8, 0.9, 3.4, 4.8, 0], [0.9, 0.99, 5.6, 7.0, 0], [0.9, 0.99, 8.3, 9.8, 0], [0.85, 0.94, 11.4, 12.8, 0], [0.82, 0.9, 14.2, 15.1, 0],
]

export function synagogueRashi(out: MeshBuilder, fit: Fit): void {
  const green = hex('#8a9a7e'), pale = hex('#d2cebd'), stone = hex('#b5ad9b'), dark = hex('#3b2d29'), glass = hex('#2c3238'),
    wood = hex('#b78b4c'), white = hex('#e6e4da'), iron = hex('#2a2a2c'), roofc = hex('#7e7f7c'), side = hex('#a8a597')
  const CON = surfaceTag('concrete'), STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const wring = area < 0 ? [...ring0].reverse() : ring0
  const n = wring.length
  let th0 = 0, best = Infinity
  for (let a = 0; a < 90; a += 1) {
    const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of wring) { const x = p.x * c + p.z * s, z = -p.x * s + p.z * c; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z) }
    if ((x1 - x0) * (z1 - z0) < best) { best = (x1 - x0) * (z1 - z0); th0 = r }
  }
  let th = th0, bd = -Infinity
  for (let k = 0; k < 4; k++) {
    const t = th0 + (k * Math.PI) / 2, d = Math.sin(t) * RSH_STREET_X - Math.cos(t) * RSH_STREET_Z
    if (d > bd) { bd = d; th = t }
  }
  const ct = Math.cos(th), st = Math.sin(th)
  const toW = (a: number, b: number): [number, number] => [a * ct - b * st, a * st + b * ct]
  const ring = wring.map((r) => ({ x: r.x * ct + r.z * st, z: -r.x * st + r.z * ct }))
  let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity
  for (const r of ring) { umin = Math.min(umin, r.x); umax = Math.max(umax, r.x); vmin = Math.min(vmin, r.z); vmax = Math.max(vmax, r.z) }
  const W = umax - umin
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    const Wv = (v: V3): V3 => { const [x, z] = toW(v[0], v[2]); return [x, v[1], z] }
    const [ox, oz] = toW(o[0], o[2])
    out.quad(pts.map(Wv), [ox, o[1], oz], [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // 1 · the ring walls in pale concrete to the parapet; the street edge gets the façade below instead
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L]
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, RSH_H, q.z], [p.x, RSH_H, p.z]], o, side, CON)
  }
  capPolygon(out, ring.map((r) => { const [x, z] = toW(r.x, r.z); return { x, z } }), RSH_H, roofc, CON)
  // 2 · the street façade at v = vmin, built as layers standing proud of the ring wall
  const vF = vmin
  const F = (u0: number, u1: number, y0: number, y1: number, d: number, col: V3, tag = 0): void =>
    quad([[umin + u0 * W, y0, vF - d], [umin + u1 * W, y0, vF - d], [umin + u1 * W, y1, vF - d], [umin + u0 * W, y1, vF - d]], [0, 0, -1], col, tag)
  for (const [a, b, k] of RSH_BANDS) F(a, b, RSH_BASE_H, RSH_BAND_TOP, k ? RSH_BAND_D : 0.03, k ? pale : green, CON)
  F(0, 1, RSH_BAND_TOP, RSH_H, 0.03, green, CON)
  F(0, 1, 0, RSH_BASE_H, 0.1, stone, STU)
  for (let y = 0.8; y < RSH_BASE_H; y += 0.8) F(0, 1, y - 0.015, y + 0.015, 0.115, hex('#8d867a'), STU)   // ashlar joints
  F(0, 1, RSH_H - 0.2, RSH_H, 0.12, pale, CON)   // coping
  // star panel
  F(RSH_STAR_U0, RSH_STAR_U1, RSH_STAR_Y0, RSH_H - 0.2, 0.1, pale, CON)
  {
    const cu = (RSH_STAR_U0 + RSH_STAR_U1) / 2, cy = (RSH_STAR_Y0 + RSH_H - 0.2) / 2, r = 0.4 * Math.min((RSH_STAR_U1 - RSH_STAR_U0) * W, RSH_H - 0.2 - RSH_STAR_Y0)
    for (const s of [1, -1]) {
      const pts: V3[] = []
      for (let k = 0; k < 3; k++) { const a = s * Math.PI / 2 + (k * 2 * Math.PI) / 3; pts.push([umin + cu * W + Math.cos(a) * r, cy + Math.sin(a) * r, vF - 0.13]) }
      quad([pts[0]!, pts[1]!, pts[2]!, pts[2]!], [0, 0, -1], hex('#8d8878'), CON)
    }
  }
  // door: stone surround, two dark leaves
  const du = (RSH_DOOR_U0 + RSH_DOOR_U1) / 2
  F(RSH_DOOR_U0 - 0.015, RSH_DOOR_U1 + 0.015, 0, RSH_DOOR_H + 0.15, 0.12, hex('#9b9486'), STU)
  F(RSH_DOOR_U0, du - 0.004, 0, RSH_DOOR_H, 0.15, dark, MET)
  F(du + 0.004, RSH_DOOR_U1, 0, RSH_DOOR_H, 0.15, dark, MET)
  F(RSH_DOOR_U0 + 0.03, RSH_DOOR_U0 + 0.06, 1.0, 1.3, 0.17, iron, MET)
  // windows
  for (const [a, b, y0, y1, kind] of RSH_WINDOWS) {
    const fr = kind === 1 ? wood : kind === 2 ? white : pale
    F(a - 0.008, b + 0.008, y0 - 0.1, y1 + 0.1, 0.1, fr, kind === 1 ? MET : STU)
    F(a, b, y0, y1, 0.13, glass)
    if (kind === 0) for (let k = 1; k < 5; k++) F(a + ((b - a) * k) / 5 - 0.002, a + ((b - a) * k) / 5 + 0.002, y0, y1, 0.15, iron, MET)
    else F((a + b) / 2 - 0.003, (a + b) / 2 + 0.003, y0, y1, 0.15, fr, MET)
  }
  void MET
}

// ───────────────────────────── Synagogue Michkenot Yaacov, 118 boulevard de Belleville (20e, way/329195478) ─────────────────────────────
// A plain two-storey house front turned synagogue (Commons 'Paris 20e Synagogue Michkenot Yaacov 629/630.jpg',
// docs/landmarks/refs/worship/michkenot-yaacov/): ochre rusticated ground floor with a cornice, cream plastered upper wall,
// three white-framed windows with railings, a tall double door of pale wood with wrought-iron grilles, a small side door,
// the Star of David and the black name letters over the door. Behind it a metal-roofed block. The street (Boulevard de
// Belleville, a primary road found with osmium on the pbf) lies SW of the footprint, off its 4-5 m chamfered corner
// edges; the builder picks the chain of ring edges whose outward normal faces MKY_STREET and builds the façade on its chord.
// MKY_STREET is in the model's own frame: with entry `front` = the street bearing (234) the street is local +z (checked
// with tools/model-shots.ts; fitSnug may turn the frame up to 40 deg, the chain test tolerates that).
const MKY_STREET_X = 0
const MKY_STREET_Z = 1
const MKY_CHORD_DOT = 0.8      // an edge joins the façade chord if its outward normal is this close to the street's
const MKY_EAVES = 8.2          // wall top
const MKY_RIDGE = 1.4          // metal roof rise above the eaves (a shrunk second cap)
const MKY_ROOF_INSET = 0.45    // the upper cap's shrink toward the centroid
const MKY_GROUND_H = 3.5       // ochre ground floor up to the cornice
const MKY_CORNICE_D = 0.22
// [u0, u1] as fractions of the chord
const MKY_DOOR_U0 = 0.37
const MKY_DOOR_U1 = 0.6
const MKY_DOOR_H = 3.2
const MKY_SIDE_U0 = 0.04
const MKY_SIDE_U1 = 0.12
const MKY_SIDE_H = 2.2
const MKY_WINDOW_UC = [0.2, 0.48, 0.76]  // window centres
const MKY_WINDOW_W = 0.13
const MKY_WINDOW_Y0 = 4.4
const MKY_WINDOW_Y1 = 6.3
const MKY_SIGN_Y = 3.85        // letters' base height

export function synagogueMichkenotYaacov(out: MeshBuilder, fit: Fit): void {
  const ochre = hex('#e2cd94'), cream = hex('#e4dfc8'), jointc = hex('#c9b479'), white = hex('#ecebe4'), glass = hex('#2c3338'),
    wood = hex('#dcc79c'), iron = hex('#24211f'), side = hex('#dcd6bd'), roofc = hex('#6d7176'), rail = hex('#cfd0cc')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  const sl = Math.hypot(MKY_STREET_X, MKY_STREET_Z), sx = MKY_STREET_X / sl, sz = MKY_STREET_Z / sl
  const edge = (i: number) => { const p = ring[i % n]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z) || 1; return { p, q, L, nx: (q.z - p.z) / L, nz: -(q.x - p.x) / L } }
  const dotE = (i: number): number => { const e = edge(i); return e.nx * sx + e.nz * sz }
  // the street chain: seed = best length-weighted facing edge, the best-facing edge (length only breaks ties), grown both ways while the edges still face the street
  let seed = 0, bs = -Infinity
  for (let i = 0; i < n; i++) { const s = Math.round(dotE(i) * 20) * 1000 + edge(i).L; if (s > bs) { bs = s; seed = i } }
  let a = seed, b = seed
  for (let k = 0; k < n && dotE(a - 1 + n) >= MKY_CHORD_DOT && a - 1 + n !== b + n; k++) a = (a - 1 + n) % n
  for (let k = 0; k < n && dotE(b + 1) >= MKY_CHORD_DOT && (b + 1) % n !== a; k++) b = (b + 1) % n
  const A = edge(a).p
  const B = edge(b).q
  const W = Math.hypot(B.x - A.x, B.z - A.z)
  const ux = (B.x - A.x) / W, uz = (B.z - A.z) / W
  const nx = uz, nz = -ux                       // outward normal of the chord
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ax = p[1]![0] - p[0]![0], ay = p[1]![1] - p[0]![1], az = p[1]![2] - p[0]![2]
    const bx = p[2]![0] - p[0]![0], by = p[2]![1] - p[0]![1], bz = p[2]![2] - p[0]![2]
    const c: V3 = [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // 1 · every ring wall to the eaves, then a metal cap and a shrunk upper cap
  for (let i = 0; i < n; i++) {
    const { p, q, nx: wx, nz: wz } = edge(i)
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, MKY_EAVES, q.z], [p.x, MKY_EAVES, p.z]], [wx, 0, wz], side, STU)
  }
  capPolygon(out, ring, MKY_EAVES, roofc, MET)
  let cx = 0, cz = 0
  for (const r of ring) { cx += r.x / n; cz += r.z / n }
  const inner = ring.map((r) => { const dx = cx - r.x, dz = cz - r.z, d = Math.hypot(dx, dz) || 1, k = Math.min(MKY_ROOF_INSET, d * 0.45) / d; return { x: r.x + dx * k, z: r.z + dz * k } })
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, p2 = inner[i]!, q2 = inner[(i + 1) % n]!
    const L = Math.hypot(q.x - p.x, q.z - p.z) || 1
    quad([[p.x, MKY_EAVES, p.z], [q.x, MKY_EAVES, q.z], [q2.x, MKY_EAVES + MKY_RIDGE, q2.z], [p2.x, MKY_EAVES + MKY_RIDGE, p2.z]], [(q.z - p.z) / L, 0.5, -(q.x - p.x) / L], roofc, MET)
  }
  capPolygon(out, inner, MKY_EAVES + MKY_RIDGE, roofc, MET)
  // 2 · the street façade on the chord, layers standing proud of the ring walls
  const F = (u0: number, u1: number, y0: number, y1: number, d: number, col: V3, tag = 0): void => {
    const g = (u: number, y: number): V3 => [A.x + ux * u * W + nx * d, y, A.z + uz * u * W + nz * d]
    quad([g(u0, y0), g(u1, y0), g(u1, y1), g(u0, y1)], [nx, 0, nz], col, tag)
  }
  F(0, 1, MKY_GROUND_H, MKY_EAVES, 0.06, cream, STU)
  F(0, 1, 0, MKY_GROUND_H, 0.1, ochre, STU)
  for (let y = 0.7; y < MKY_GROUND_H - 0.3; y += 0.7) F(0, 1, y - 0.015, y + 0.015, 0.115, jointc, STU)   // rusticated joints
  F(0, 1, MKY_GROUND_H - 0.05, MKY_GROUND_H + 0.15, MKY_CORNICE_D, ochre, STU)                              // cornice
  F(0, 1, MKY_EAVES - 0.25, MKY_EAVES, 0.14, white, STU)
  // main door: pale wood leaves, iron-grilled panes up top, two iron rosettes below
  const du = (MKY_DOOR_U0 + MKY_DOOR_U1) / 2, dw = (MKY_DOOR_U1 - MKY_DOOR_U0)
  F(MKY_DOOR_U0 - 0.012, MKY_DOOR_U1 + 0.012, 0, MKY_DOOR_H + 0.18, 0.14, white, STU)
  F(MKY_DOOR_U0, du - 0.003, 0, MKY_DOOR_H, 0.17, wood, MET)
  F(du + 0.003, MKY_DOOR_U1, 0, MKY_DOOR_H, 0.17, wood, MET)
  for (const s of [-1, 1]) {
    const c = du + s * dw * 0.25
    F(c - dw * 0.17, c + dw * 0.17, MKY_DOOR_H - 1.15, MKY_DOOR_H - 0.3, 0.19, glass)
    F(c - dw * 0.15, c + dw * 0.15, MKY_DOOR_H - 1.0, MKY_DOOR_H - 0.45, 0.21, iron, MET)
    F(c - dw * 0.15, c + dw * 0.15, 1.2, 1.9, 0.19, iron, MET)
    F(c - dw * 0.15, c + dw * 0.15, 0.3, 0.9, 0.19, iron, MET)
  }
  // side door
  F(MKY_SIDE_U0 - 0.008, MKY_SIDE_U1 + 0.008, 0, MKY_SIDE_H + 0.1, 0.12, white, STU)
  F(MKY_SIDE_U0, MKY_SIDE_U1, 0, MKY_SIDE_H, 0.15, hex('#d5c196'), MET)
  // three white-framed windows with a railing across the lower pane
  for (const c of MKY_WINDOW_UC) {
    const u0 = c - MKY_WINDOW_W / 2, u1 = c + MKY_WINDOW_W / 2, e = 0.012
    F(u0 - e, u1 + e, MKY_WINDOW_Y0 - 0.1, MKY_WINDOW_Y1 + 0.12, 0.1, white, STU)
    F(u0, u1, MKY_WINDOW_Y0, MKY_WINDOW_Y1, 0.13, glass)
    F(c - 0.003, c + 0.003, MKY_WINDOW_Y0, MKY_WINDOW_Y1, 0.15, white, MET)
    F(u0, u1, MKY_WINDOW_Y0 + 0.45, MKY_WINDOW_Y0 + 0.52, 0.17, rail, MET)
    F(u0, u1, MKY_WINDOW_Y0 + 0.9, MKY_WINDOW_Y0 + 0.97, 0.17, rail, MET)
  }
  // black name letters (a band of blocks) and the star over the door
  F(du - 0.17, du + 0.17, MKY_SIGN_Y, MKY_SIGN_Y + 0.28, 0.12, iron, MET)
  for (const s of [1, -1]) {
    const r = 0.3, pts: V3[] = []
    for (let k = 0; k < 3; k++) { const t = s * Math.PI / 2 + (k * 2 * Math.PI) / 3; pts.push([A.x + ux * du * W + nx * 0.13 + ux * Math.cos(t) * r, MKY_SIGN_Y + 0.75 + Math.sin(t) * r, A.z + uz * du * W + nz * 0.13 + uz * Math.cos(t) * r]) }
    quad([pts[0]!, pts[1]!, pts[2]!, pts[2]!], [nx, 0, nz], iron, MET)
  }
}

// ───────────────────── Église arménienne Sainte-Marie-Mère-de-Dieu (way/107530891), av. Bourgain, Issy ─────────────────────
// Henri Kandjian, 1975. Commons photo (Église apostolique arménienne Sainte-Marie-Mère-de-Dieu (Issy-les-Moulineaux).jpg,
// docs/landmarks/refs/worship/sainte-marie-issy.jpg): a slate-clad truncated block — the end walls lean in, the long wall
// is pierced by ranks of narrow slit windows — split by a beige stone pier carrying a cross over a stair and the door; two
// small stone lanterns stand up behind it. The footprint is a skewed quad whose street side is the chain of three collinear
// edges (the cadastre kinks the other, rear side as one long edge); the Bourgain side was fixed from the OSM highways:
// avenue Bourgain lies ~38 m off that chain's outward normal, the north side meets only a back lane.
const KAN_W_MAX = 17        // frame width cap (m); the chain's own length is used when shorter
const KAN_D_MAX = 13.4      // depth cap
const KAN_H = 9.6           // slate roof edge / flat top
const KAN_INSET_SIDE = 3.0  // how far each end wall leans in by the top
const KAN_INSET_FRONT = 0.7
const KAN_INSET_BACK = 1.0
const KAN_PIER_U0 = 0.30    // pier span as fractions of the width
const KAN_PIER_U1 = 0.47
const KAN_PIER_H = 11.2
const KAN_PIER_OUT = 0.5
const KAN_TOWER_H = 12.8
const KAN_STAIR_N = 5
const KAN_STAIR_RISE = 0.2
const KAN_STAIR_RUN = 0.5
const KAN_WIN_W = 0.42
const KAN_WIN_PITCH = 1.05

export function egliseArmenienneIssy(out: MeshBuilder, fit: Fit): void {
  const slate = hex('#4b5058'), slateD = hex('#3c4148'), roofC = hex('#565b63'), stone = hex('#d3c7a8'), stoneD = hex('#bfb392'),
    glass = hex('#26364a'), dark = hex('#1f1c1a'), gold = hex('#b9953a')
  const MET = surfaceTag('metal'), CON = surfaceTag('concrete')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // street side = the longest run of consecutive near-collinear edges (most vertices; ties by length)
  const dir = (i: number): number => { const p = ring[i % n]!, q = ring[(i + 1) % n]!; return Math.atan2(q.z - p.z, q.x - p.x) }
  const angDiff = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)))
  let best = { start: 0, count: 1, len: 0 }
  for (let s = 0; s < n; s++) {
    let cnt = 1, len = Math.hypot(ring[(s + 1) % n]!.x - ring[s]!.x, ring[(s + 1) % n]!.z - ring[s]!.z)
    while (cnt < n - 1 && angDiff(dir(s + cnt), dir(s)) < 0.14) { const p = ring[(s + cnt) % n]!, q = ring[(s + cnt + 1) % n]!; len += Math.hypot(q.x - p.x, q.z - p.z); cnt++ }
    if (cnt > best.count || (cnt === best.count && len > best.len)) best = { start: s, count: cnt, len }
  }
  const A = ring[best.start]!, B = ring[(best.start + best.count) % n]!
  const Lab = Math.hypot(B.x - A.x, B.z - A.z)
  const ux = (B.x - A.x) / Lab, uz = (B.z - A.z) / Lab
  const ox = uz, oz = -ux                       // outward (street) normal; inward is its negative
  let dMax = 0
  for (const r of ring) dMax = Math.max(dMax, -((r.x - A.x) * ox + (r.z - A.z) * oz))
  const W = Math.min(Lab, KAN_W_MAX), D = Math.min(dMax - 0.3, KAN_D_MAX), H = KAN_H
  const P = (u: number, y: number, v: number): V3 => [A.x + ux * u - ox * v, y, A.z + uz * u - oz * v]   // v: metres back from the street line
  const oS: V3 = [ox, 0, oz], oB: V3 = [-ox, 0, -oz], oL: V3 = [-ux, 0, -uz], oR: V3 = [ux, 0, uz]
  // 1 · the slate truncated block: vertical base course, then leaning walls up to a flat slate roof
  const iS = KAN_INSET_SIDE, iF = KAN_INSET_FRONT, iB = KAN_INSET_BACK
  const Y0 = 0, Y1 = 2.6
  quad([P(0, Y0, 0), P(W, Y0, 0), P(W, Y1, 0), P(0, Y1, 0)], oS, slate, MET)
  quad([P(0, Y0, D), P(W, Y0, D), P(W, Y1, D), P(0, Y1, D)], oB, slate, MET)
  quad([P(0, Y0, 0), P(0, Y0, D), P(0, Y1, D), P(0, Y1, 0)], oL, slate, MET)
  quad([P(W, Y0, 0), P(W, Y0, D), P(W, Y1, D), P(W, Y1, 0)], oR, slate, MET)
  quad([P(0, Y1, 0), P(W, Y1, 0), P(W - iS, H, iF), P(iS, H, iF)], [ox, 0.3, oz], slate, MET)       // street wall, leaning
  quad([P(0, Y1, D), P(W, Y1, D), P(W - iS, H, D - iB), P(iS, H, D - iB)], [-ox, 0.3, -oz], slateD, MET)
  quad([P(0, Y1, 0), P(0, Y1, D), P(iS, H, D - iB), P(iS, H, iF)], [-ux - 0.0, 0.6, -uz], slateD, MET)
  quad([P(W, Y1, 0), P(W, Y1, D), P(W - iS, H, D - iB), P(W - iS, H, iF)], [ux, 0.6, uz], slateD, MET)
  quad([P(iS, H, iF), P(W - iS, H, iF), P(W - iS, H, D - iB), P(iS, H, D - iB)], [0, 1, 0], roofC, MET)
  // window slits on the street wall, positioned on the leaning plane
  const slit = (u: number, y0: number, y1: number): void => {
    const f = (y: number): number => (y <= Y1 ? 0 : (y - Y1) / (H - Y1))
    const uu = (y: number): number => u * (1 - (2 * iS * f(y)) / W) + iS * f(y)
    const vv = (y: number): number => iF * f(y) + 0.05
    const a = (y: number): V3 => P(uu(y) - KAN_WIN_W / 2, y, vv(y)), b = (y: number): V3 => P(uu(y) + KAN_WIN_W / 2, y, vv(y))
    quad([a(y0), b(y0), b(y1), a(y1)], [ox, 0.3, oz], glass, 0)
  }
  const pierU0 = W * KAN_PIER_U0, pierU1 = W * KAN_PIER_U1
  for (let u = 1.2; u < W - 1.0; u += KAN_WIN_PITCH) {
    if (u > pierU0 - 0.6 && u < pierU1 + 0.6) continue
    const rightWing = u > pierU1
    for (const [y0, y1] of rightWing ? [[0.5, 2.4], [3.6, 6.6]] : [[3.6, 6.4]]) if (!(rightWing === false && u > 3.6 && y0 < 1)) slit(u, y0!, y1!)
  }
  for (const [u, y0, y1] of [[1.4, 0.5, 2.4], [2.6, 0.5, 2.4]] as [number, number, number][]) slit(u, y0, y1)
  // 2 · the stone pier: cross, door, stair, plaques, lanterns behind
  const pw = pierU1 - pierU0
  const sbox = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, col: V3): void => {
    quad([P(u0, y0, v0), P(u1, y0, v0), P(u1, y1, v0), P(u0, y1, v0)], oS, col, CON)
    quad([P(u0, y0, v1), P(u1, y0, v1), P(u1, y1, v1), P(u0, y1, v1)], oB, col, CON)
    quad([P(u0, y0, v0), P(u0, y0, v1), P(u0, y1, v1), P(u0, y1, v0)], oL, col, CON)
    quad([P(u1, y0, v0), P(u1, y0, v1), P(u1, y1, v1), P(u1, y1, v0)], oR, col, CON)
    quad([P(u0, y1, v0), P(u1, y1, v0), P(u1, y1, v1), P(u0, y1, v1)], [0, 1, 0], col, CON)
  }
  sbox(pierU0, pierU1, -KAN_PIER_OUT, 2.4, 0, KAN_PIER_H, stone)
  sbox(pierU0 - 0.15, pierU1 + 0.15, -KAN_PIER_OUT - 0.1, 2.4, KAN_PIER_H - 0.25, KAN_PIER_H + 0.1, stoneD)
  const fz = -KAN_PIER_OUT - 0.04, uc = (pierU0 + pierU1) / 2
  quad([P(uc - 0.9, 1.0, fz), P(uc + 0.9, 1.0, fz), P(uc + 0.9, 3.4, fz), P(uc - 0.9, 3.4, fz)], oS, dark, 0)               // door
  quad([P(uc - 0.06 - 0.12, 7.0, fz), P(uc + 0.18, 7.0, fz), P(uc + 0.18, 10.0, fz), P(uc - 0.18, 10.0, fz)], oS, stoneD, CON)   // cross shaft
  quad([P(uc - 0.9, 8.6, fz), P(uc + 0.9, 8.6, fz), P(uc + 0.9, 9.0, fz), P(uc - 0.9, 9.0, fz)], oS, stoneD, CON)                // cross arm
  for (const [a, b] of [[uc - pw * 0.4, uc - 0.2], [uc + 0.2, uc + pw * 0.4]] as [number, number][])
    quad([P(a, 4.0, fz), P(b, 4.0, fz), P(b, 5.0, fz), P(a, 5.0, fz)], oS, gold, 0)                                                // plaques
  for (let s = 0; s < KAN_STAIR_N; s++) {
    const v0 = -KAN_PIER_OUT - (KAN_STAIR_N - s) * KAN_STAIR_RUN
    sbox(uc - 1.3, uc + 1.3, v0, -KAN_PIER_OUT + 0.02, 0, (s + 1) * KAN_STAIR_RISE, stoneD)
  }
  sbox(pierU0 - 2.0, pierU0 - 0.2, D - 4.5, D - 2.3, H - 0.1, KAN_TOWER_H, stone)
  sbox(pierU1 + 2.2, pierU1 + 4.0, D - 4.5, D - 2.5, H - 0.1, KAN_TOWER_H - 0.6, stone)
  // 3 · footprint cap beneath: low plinth ring so nothing floats over a skewed outline
  capPolygon(out, ring, 0.05, slateD, CON)
}

// ───────────────────────────── Église orthodoxe russe Saint-Nicolas (way/74333366), 132 bis rue du Point-du-Jour ─────────────────────────────
// Boulogne-Billancourt's "hidden" Russian chapel (photos: Wikipedia / Le Village de Billancourt / Paris-bise-art, Google Images 2026-11-04,
// docs/landmarks/refs/worship/saint-nicolas-boulogne.png): a ~7 x 17 m cream-stucco shed under a steep gable, the end wall carrying a
// scalloped carved-timber kokoshnik arch round a glazed gable window over a double brown door on a low stone stair; a small teal onion dome
// with a cross on the front of the ridge. Stands in a courtyard behind the street (rue du Point-du-Jour lies ~37 m south-east).
const SNB_STREET_X = 0       // street side in the MODEL frame (the loader turns the model so `front` 150 faces the street; the builder turns its own frame, checked with model-shots)
const SNB_STREET_Z = 1
const SNB_EAVES = 3.5        // wall height
const SNB_RIDGE = 6.6        // ridge height
const SNB_OVER = 0.35        // roof overhang
const SNB_DOOR_W = 1.7       // double door width
const SNB_DOOR_H = 2.6       // door height
const SNB_WIN_W = 1.5        // gable window width
const SNB_WIN_Y0 = 3.0       // gable window sill
const SNB_WIN_Y1 = 5.0       // gable window head
const SNB_ARCH_T = 0.28      // kokoshnik frame thickness
const SNB_STEPS = 3          // stair risers
const SNB_STEP_D = 0.32      // stair tread
const SNB_DOME_R = 0.55      // onion dome radius
const SNB_DOME_U = 1.0       // dome position back from the front gable (m)

export function egliseSaintNicolasBoulogne(out: MeshBuilder, fit: Fit): void {
  const cream = hex('#d8c9a2'), roofC = hex('#5a4a3c'), brown = hex('#6a3a22'), wood = hex('#b98a52'), glass = hex('#6a7a8a'),
    teal = hex('#4a9aa0'), gold = hex('#d6b04a'), stone = hex('#9a958a')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal'), PLK = surfaceTag('planks')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const wring = area < 0 ? [...ring0].reverse() : ring0
  // minimum-area rectangle frame: u along the long side; the end facing the street (the street edge is found here, fitSnug ignores `front`)
  let th0 = 0, best = Infinity
  for (let a = 0; a < 90; a += 1) {
    const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of wring) { const x = p.x * c + p.z * s, z = -p.x * s + p.z * c; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z) }
    if ((x1 - x0) * (z1 - z0) < best) { best = (x1 - x0) * (z1 - z0); th0 = r }
  }
  const spanU = (t: number): number => { const c = Math.cos(t), s = Math.sin(t); const us = wring.map((p) => p.x * c + p.z * s); return Math.max(...us) - Math.min(...us) }
  if (spanU(th0) < spanU(th0 + Math.PI / 2)) th0 += Math.PI / 2          // long side along u
  // front end: +u end (fs = +1) or −u end, whichever faces the street
  const sd = Math.cos(th0) * SNB_STREET_X + Math.sin(th0) * SNB_STREET_Z
  const fs = sd >= 0 ? 1 : -1
  const ct = Math.cos(th0), st = Math.sin(th0)
  const toW = (a: number, b: number): [number, number] => [a * ct - b * st, a * st + b * ct]
  const ring = wring.map((r) => ({ x: r.x * ct + r.z * st, z: -r.x * st + r.z * ct }))
  const umin = Math.min(...ring.map((p) => p.x)), umax = Math.max(...ring.map((p) => p.x))
  const vmin = Math.min(...ring.map((p) => p.z)), vmax = Math.max(...ring.map((p) => p.z))
  const vc = (vmin + vmax) / 2, uF = fs > 0 ? umax : umin, hw = (vmax - vmin) / 2, nF = fs
  const uAt = (t: number): number => uF - fs * t
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    const W = (v: V3): V3 => { const [x, z] = toW(v[0], v[2]); return [x, v[1], z] }
    const [ox, oz] = toW(o[0], o[2])
    out.quad(pts.map(W), [ox, o[1], oz], [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, SNB_EAVES, q.z], [p.x, SNB_EAVES, p.z]], [(q.z - p.z) / L, 0, -(q.x - p.x) / L], cream, STU)
  }
  capPolygon(out, wring, SNB_EAVES, roofC, MET)
  // gable roof, ridge along u
  const rhw = hw + SNB_OVER, ru0 = umin - SNB_OVER, ru1 = umax + SNB_OVER, rise = SNB_RIDGE - SNB_EAVES, sl = Math.hypot(rhw, rise)
  quad([[ru0, SNB_EAVES - 0.1, vc - rhw], [ru1, SNB_EAVES - 0.1, vc - rhw], [ru1, SNB_RIDGE, vc], [ru0, SNB_RIDGE, vc]], [0, rhw / sl, -rise / sl], roofC, MET)
  quad([[ru0, SNB_EAVES - 0.1, vc + rhw], [ru1, SNB_EAVES - 0.1, vc + rhw], [ru1, SNB_RIDGE, vc], [ru0, SNB_RIDGE, vc]], [0, rhw / sl, rise / sl], roofC, MET)
  for (const ue of [umin, umax]) {          // the two stucco gable triangles
    const nx = ue === umin ? -1 : 1
    quad([[ue + nx * 0.02, SNB_EAVES, vc - hw], [ue + nx * 0.02, SNB_EAVES, vc + hw], [ue + nx * 0.02, SNB_RIDGE, vc], [ue + nx * 0.02, SNB_RIDGE, vc]], [nx, 0, 0], cream, STU)
  }
  // front: double door, glazed gable window, scalloped timber kokoshnik round it, stone stair
  const fu = uF + nF * 0.04, fu2 = uF + nF * 0.07
  quad([[fu, 0.3, vc - SNB_DOOR_W / 2], [fu, 0.3, vc + SNB_DOOR_W / 2], [fu, 0.3 + SNB_DOOR_H, vc + SNB_DOOR_W / 2], [fu, 0.3 + SNB_DOOR_H, vc - SNB_DOOR_W / 2]], [nF, 0, 0], brown, PLK)
  quad([[fu2, 0.3, vc - 0.03], [fu2, 0.3, vc + 0.03], [fu2, 0.3 + SNB_DOOR_H, vc + 0.03], [fu2, 0.3 + SNB_DOOR_H, vc - 0.03]], [nF, 0, 0], stone, 0)
  quad([[fu, SNB_WIN_Y0, vc - SNB_WIN_W / 2], [fu, SNB_WIN_Y0, vc + SNB_WIN_W / 2], [fu, SNB_WIN_Y1, vc + SNB_WIN_W / 2], [fu, SNB_WIN_Y1, vc - SNB_WIN_W / 2]], [nF, 0, 0], glass, 0)
  // kokoshnik: two rising timber bands meeting over the window (a stepped ogee read as a pointed arch), plus side drops to the door
  const arch = (sg: number): void => {
    const pts: [number, number][] = [[SNB_DOOR_H + 0.35, SNB_WIN_W / 2 + 0.55], [SNB_WIN_Y0 + 0.6, SNB_WIN_W / 2 + 0.7], [SNB_WIN_Y1 - 0.3, SNB_WIN_W / 2 + 0.3], [SNB_WIN_Y1 + 0.5, SNB_WIN_W / 2 - 0.1], [SNB_WIN_Y1 + 0.95, 0.12]]
    for (let k = 0; k + 1 < pts.length; k++) {
      const [y0, w0] = pts[k]!, [y1, w1] = pts[k + 1]!
      quad([[fu2, y0, vc + sg * w0], [fu2, y0, vc + sg * (w0 + SNB_ARCH_T)], [fu2, y1, vc + sg * (w1 + SNB_ARCH_T)], [fu2, y1, vc + sg * w1]], [nF, 0, 0], wood, PLK)
    }
    quad([[fu2, 0.3 + SNB_DOOR_H - 0.2, vc + sg * (SNB_DOOR_W / 2)], [fu2, 0.3 + SNB_DOOR_H - 0.2, vc + sg * (SNB_DOOR_W / 2 + SNB_ARCH_T)], [fu2, SNB_DOOR_H + 0.35, vc + sg * (SNB_WIN_W / 2 + 0.55 + SNB_ARCH_T)], [fu2, SNB_DOOR_H + 0.35, vc + sg * (SNB_WIN_W / 2 + 0.55)]], [nF, 0, 0], wood, PLK)
  }
  arch(-1); arch(1)
  for (let k = 0; k < SNB_STEPS; k++) {                       // stone stair
    const a = uF, b = uF + nF * SNB_STEP_D * (SNB_STEPS - k)
    const lo = Math.min(a, b), hi = Math.max(a, b), h = 0.3 * (SNB_STEPS - k) / SNB_STEPS
    quad([[lo, h, vc - 1.6], [hi, h, vc - 1.6], [hi, h, vc + 1.6], [lo, h, vc + 1.6]], [0, 1, 0], stone, 0)
    quad([[b, 0, vc - 1.6], [b, 0, vc + 1.6], [b, h, vc + 1.6], [b, h, vc - 1.6]], [nF, 0, 0], stone, 0)
  }
  // teal onion dome with a gold cross on the front of the ridge
  {
    const [wx, wz] = toW(uAt(SNB_DOME_U), vc), y0 = SNB_RIDGE - 0.2
    prism(out, wx, wz, y0, y0 + 0.5, SNB_DOME_R * 0.45, 8, cream, STU)
    prism(out, wx, wz, y0 + 0.5, y0 + 0.9, SNB_DOME_R * 0.9, 12, teal, MET, SNB_DOME_R)
    prism(out, wx, wz, y0 + 0.9, y0 + 1.7, SNB_DOME_R, 12, teal, MET, 0.05)
    prism(out, wx, wz, y0 + 1.7, y0 + 2.7, 0.04, 4, gold, MET)
    prism(out, wx, wz, y0 + 2.2, y0 + 2.28, 0.28, 4, gold, MET)
  }
}

// ───────────────────────────── Église orthodoxe Saint-Séraphin-de-Sarov (way/80237345), 91 rue Lecourbe ─────────────────────────────
// A 1930s White-Russian shed-chapel at the back of a courtyard in the 15e (photos: Commons 'Église Saint-Séraphin-de-Sarov (Paris) - 1/2/5.jpg',
// docs/landmarks/refs/worship/seraphin-sarov-*.jpg): dark-brown vertical timber boarding, grey zinc roofs with standing seams, a pale-blue onion
// dome on a short white drum with a gold cross over the hall, and a polygonal apse under a low zinc pyramid with a small cross. Rue Lecourbe lies
// ~60 m to the north-north-west; the end facing it is chosen in-builder (fitSnug ignores `front`).
const SSS_STREET_X = 0       // street side in the MODEL frame (checked with model-shots)
const SSS_STREET_Z = 1
const SSS_EAVES = 3.0        // wall height
const SSS_RIDGE = 4.9        // hall ridge height
const SSS_OVER = 0.4         // roof overhang
const SSS_HALL = 0.62        // fraction of the length given to the gabled hall (rest = apse)
const SSS_APEX = 4.4         // apse pyramid apex height
const SSS_DOOR_W = 1.0       // door width
const SSS_DOOR_H = 2.1       // door height
const SSS_DRUM_R = 0.6       // drum radius
const SSS_DRUM_H = 0.9       // drum height
const SSS_DOME_R = 1.05      // onion dome radius
const SSS_DOME_U = 0.4       // dome position along the hall, fraction from the front
export function egliseSaintSeraphinSarov(out: MeshBuilder, fit: Fit): void {
  const brown = hex('#5a3420'), zinc = hex('#4c5258'), white = hex('#e8e6df'), blue = hex('#8fa6c4'), gold = hex('#d6b04a'), glass = hex('#4a5a66')
  const PLK = surfaceTag('planks'), MET = surfaceTag('metal'), STU = surfaceTag('stucco')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const wring = area < 0 ? [...ring0].reverse() : ring0
  let th0 = 0, best = Infinity
  for (let a = 0; a < 90; a += 1) {
    const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of wring) { const x = p.x * c + p.z * s, z = -p.x * s + p.z * c; x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z) }
    if ((x1 - x0) * (z1 - z0) < best) { best = (x1 - x0) * (z1 - z0); th0 = r }
  }
  const spanU = (t: number): number => { const c = Math.cos(t), s = Math.sin(t); const us = wring.map((p) => p.x * c + p.z * s); return Math.max(...us) - Math.min(...us) }
  if (spanU(th0) < spanU(th0 + Math.PI / 2)) th0 += Math.PI / 2          // long side along u
  const fs = Math.cos(th0) * SSS_STREET_X + Math.sin(th0) * SSS_STREET_Z >= 0 ? 1 : -1
  const ct = Math.cos(th0), st = Math.sin(th0)
  const toW = (a: number, b: number): [number, number] => [a * ct - b * st, a * st + b * ct]
  const ring = wring.map((r) => ({ x: r.x * ct + r.z * st, z: -r.x * st + r.z * ct }))
  const umin = Math.min(...ring.map((p) => p.x)), umax = Math.max(...ring.map((p) => p.x))
  const vmin = Math.min(...ring.map((p) => p.z)), vmax = Math.max(...ring.map((p) => p.z))
  const vc = (vmin + vmax) / 2, uF = fs > 0 ? umax : umin, uB = fs > 0 ? umin : umax, hw = (vmax - vmin) / 2
  const uAt = (t: number): number => uF - fs * t * (umax - umin)
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    const W = (v: V3): V3 => { const [x, z] = toW(v[0], v[2]); return [x, v[1], z] }
    const [ox, oz] = toW(o[0], o[2])
    out.quad(pts.map(W), [ox, o[1], oz], [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, SSS_EAVES, q.z], [p.x, SSS_EAVES, p.z]], [(q.z - p.z) / L, 0, -(q.x - p.x) / L], brown, PLK)
  }
  capPolygon(out, wring, SSS_EAVES, zinc, MET)
  // hall: gable along u from the front to the apse junction
  const uJ = uAt(SSS_HALL), lo = Math.min(uF, uJ) - (fs > 0 ? 0 : 0), hi = Math.max(uF, uJ)
  const ru0 = lo - (uF < uJ ? SSS_OVER : 0), ru1 = hi + (uF > uJ ? SSS_OVER : 0)
  const rhw = hw + SSS_OVER, rise = SSS_RIDGE - SSS_EAVES, sl = Math.hypot(rhw, rise)
  quad([[ru0, SSS_EAVES - 0.1, vc - rhw], [ru1, SSS_EAVES - 0.1, vc - rhw], [ru1, SSS_RIDGE, vc], [ru0, SSS_RIDGE, vc]], [0, rhw / sl, -rise / sl], zinc, MET)
  quad([[ru0, SSS_EAVES - 0.1, vc + rhw], [ru1, SSS_EAVES - 0.1, vc + rhw], [ru1, SSS_RIDGE, vc], [ru0, SSS_RIDGE, vc]], [0, rhw / sl, rise / sl], zinc, MET)
  // front gable triangle (boarded) with a small glazed light, and a door
  const nF = fs, fu = uF + nF * 0.03
  quad([[fu, SSS_EAVES, vc - hw], [fu, SSS_EAVES, vc + hw], [fu, SSS_RIDGE, vc], [fu, SSS_RIDGE, vc]], [nF, 0, 0], brown, PLK)
  quad([[fu, 0, vc - SSS_DOOR_W / 2], [fu, 0, vc + SSS_DOOR_W / 2], [fu, SSS_DOOR_H, vc + SSS_DOOR_W / 2], [fu, SSS_DOOR_H, vc - SSS_DOOR_W / 2]], [nF, 0, 0], hex('#7a4a2a'), PLK)
  quad([[fu + nF * 0.01, 1.4, vc - 0.3], [fu + nF * 0.01, 1.4, vc + 0.3], [fu + nF * 0.01, 1.9, vc + 0.3], [fu + nF * 0.01, 1.9, vc - 0.3]], [nF, 0, 0], glass, 0)
  // apse: low zinc pyramid over the rear end, a small gold cross on the apex
  {
    const a0 = uB, a1 = uJ, aw = hw + SSS_OVER
    const ex = (a: number): number => a + (a0 < a1 ? -1 : 1) * SSS_OVER * (a === a0 ? 1 : 0)
    const um = (a0 + a1) / 2, e0 = ex(a0), e1 = a1
    const c4: [number, number][] = [[e0, vc - aw], [e1, vc - aw], [e1, vc + aw], [e0, vc + aw]]
    for (let i = 0; i < 4; i++) {
      const p = c4[i]!, q = c4[(i + 1) % 4]!, L = Math.hypot(q[0] - p[0], q[1] - p[1])
      quad([[p[0], SSS_EAVES - 0.1, p[1]], [q[0], SSS_EAVES - 0.1, q[1]], [um, SSS_APEX, vc], [um, SSS_APEX, vc]], [(q[1] - p[1]) / L, 0.5, -(q[0] - p[0]) / L], zinc, MET)
    }
    const [wx, wz] = toW(um, vc)
    prism(out, wx, wz, SSS_APEX, SSS_APEX + 0.9, 0.035, 4, gold, MET)
    prism(out, wx, wz, SSS_APEX + 0.55, SSS_APEX + 0.6, 0.22, 4, gold, MET)
  }
  // white drum and pale-blue onion dome with a gold cross on the hall ridge
  {
    const [wx, wz] = toW(uAt(SSS_DOME_U * SSS_HALL), vc), y0 = SSS_RIDGE - 0.1
    prism(out, wx, wz, y0, y0 + SSS_DRUM_H, SSS_DRUM_R, 12, white, STU)
    prism(out, wx, wz, y0 + SSS_DRUM_H, y0 + SSS_DRUM_H + 0.6, SSS_DOME_R * 0.9, 14, blue, MET, SSS_DOME_R)
    prism(out, wx, wz, y0 + SSS_DRUM_H + 0.6, y0 + SSS_DRUM_H + 1.4, SSS_DOME_R, 14, blue, MET, 0.06)
    prism(out, wx, wz, y0 + SSS_DRUM_H + 1.4, y0 + SSS_DRUM_H + 2.5, 0.04, 4, gold, MET)
    prism(out, wx, wz, y0 + SSS_DRUM_H + 2.0, y0 + SSS_DRUM_H + 2.08, 0.3, 4, gold, MET)
  }
}

// ───────────────────── Amicale des Teo Chew en France (node/533756945), Olympiades, Paris 13e ─────────────────────
// A Buddhist temple in the Galerie Oslo block (way/625919256 is the whole mall, so this is a point entry with a size, not
// a footprint). Read off the Commons photo "Paris 13e - Olympiades - temple bouddhique 1" (docs/landmarks/refs/worship/
// teochew-1.jpg, 2026-11-04): a glazed shopfront under TWO tiers of green glazed-tile eaves with red fascias and gilt
// bosses; gold hanzi on a brown band between the tiers; red lettering "AMICALE DES TEOCHEW EN FRANCE" over the doors;
// two black bronze incense burners with pagoda lids on the paving. Local −z is the street front.
const TC_W = 8.0             // frontage width
const TC_EAVE0_Y = 3.1       // lower eave root
const TC_EAVE1_Y = 4.9       // upper eave root
const TC_EAVE_RISE = 0.7     // how much each eave tile slope rises
const TC_EAVE_OUT = 1.5      // eave projection from the wall
const TC_BAND_H = 1.5        // brown sign band between the tiers
const TC_BURNER_GAP = 2.6    // burner offset from the frontage edge

export function templeTeoChew(out: MeshBuilder, fit: Fit): void {
  const wall = hex('#e6dfd0'), brown = hex('#7a4a30'), green = hex('#2f8a78'), red = hex('#b02a20'), gold = hex('#d9b13c')
  const glass = hex('#3a4a48'), frame = hex('#4a3320'), bronze = hex('#25262a'), paving = hex('#a6a29a')
  const hw = Math.min(fit.hx, TC_W / 2), zw = -fit.hz + TC_EAVE_OUT + 0.2   // wall plane
  block(out, -hw, hw, -fit.hz - 0.5, fit.hz, -0.1, 0.05, paving)
  block(out, -hw, hw, zw, zw + 1.2, 0, TC_EAVE1_Y + TC_BAND_H + 0.5, wall)
  // glazed shopfront: three door pairs of dark glass in timber frames, red lettering band over them
  const gw = (2 * hw - 1.0) / 6
  for (let i = 0; i < 6; i++) {
    const t = -hw + 0.5 + (i + 0.5) * gw
    pane(out, '-z', zw - 0.04, t, 0, gw - 0.12, TC_EAVE0_Y - 0.2, glass, 0.04)
    pane(out, '-z', zw - 0.08, t, 0, 0.07, TC_EAVE0_Y - 0.2, frame, 0.04)
  }
  pane(out, '-z', zw - 0.06, 0, TC_EAVE0_Y - 0.55, 2 * hw - 1, 0.5, red, 0.04)
  // the sign band (brown, with a run of gold characters) between the two eave tiers
  block(out, -hw, hw, zw - 0.15, zw, TC_EAVE0_Y, TC_EAVE1_Y + TC_BAND_H, brown)
  for (let k = 0; k < 5; k++) pane(out, '-z', zw - 0.18, (k - 2) * 0.95, TC_EAVE1_Y + 0.35, 0.55, 0.8, gold, 0.05)
  // the two eave tiers: green tile slope, red fascia, gilt bosses along the lip
  const eave = (y0: number, ext: number): void => {
    roof(out, -hw - 0.3, hw + 0.3, zw - ext, zw + 0.1, y0, TC_EAVE_RISE, 0.05, ext - 0.15, green)
    block(out, -hw - 0.3, hw + 0.3, zw - ext - 0.04, zw - ext + 0.08, y0 - 0.14, y0 + 0.02, red)
    for (let k = 0; k < 12; k++) block(out, -hw + 0.1 + k * ((2 * hw - 0.2) / 11) - 0.07, -hw + 0.1 + k * ((2 * hw - 0.2) / 11) + 0.07,
      zw - ext - 0.07, zw - ext, y0 - 0.06, y0 + 0.08, gold)
  }
  eave(TC_EAVE0_Y, TC_EAVE_OUT)
  eave(TC_EAVE1_Y + TC_BAND_H, TC_EAVE_OUT - 0.2)
  // incense burners: legs, drum bowl, pagoda lid
  for (const sx of [-1, 1]) {
    const bx = sx * (hw + TC_BURNER_GAP * 0.3), bz = zw - TC_EAVE_OUT - 0.5 + 0.0
    block(out, bx - 0.5, bx + 0.5, bz - 0.5, bz + 0.5, 0, 0.25, bronze)
    block(out, bx - 0.6, bx + 0.6, bz - 0.6, bz + 0.6, 0.25, 1.15, bronze)
    block(out, bx - 0.2, bx + 0.2, bz - 0.2, bz + 0.2, 1.15, 1.9, bronze)
    roof(out, bx - 0.7, bx + 0.7, bz - 0.7, bz + 0.7, 1.9, 0.5, 0.45, 0.45, bronze)
    block(out, bx - 0.04, bx + 0.04, bz - 0.04, bz + 0.04, 2.4, 2.8, gold)
  }
}

// Chapelle de l'Humanité (positivist, 5 rue Payenne, 3e, way/57781663, MH 1982): the street front of a 17th-c. house, two
// storeys over a rusticated buff ground floor with three arched openings; the white upper storey carries two tall
// iron-balconied windows with a gothic niche and bronze bust of Comte between them, and two lines of incised capitals
// ("RELIGION DE L'HUMANITE", "L'AMOUR POUR PRINCIPE ...") across the frieze. Photo: Commons 'Payenne-chapelle-humanite.jpg'
// (docs/landmarks/refs/worship/chapelle-humanite.jpg). The ring is the whole house; the facade goes on its ring edge whose
// outward normal looks furthest toward local +z (the street side once the loader turns the model by the entry front 210; checked with model-shots --front=210). Rear walls plain.
const CH_EAVES = 10.2        // cornice top
const CH_GROUND_H = 3.5      // rusticated ground floor top
const CH_WIN_W = 2.0         // tall window width
const CH_WIN_Y0 = 4.35       // upper window sill (balcony at its foot)
const CH_WIN_H = 3.0         // upper window height
const CH_WIN_GAP = 0.3       // window centres from the middle, as a share of the facade length
const CH_NICHE_W = 1.0       // gothic niche width
const CH_NICHE_Y0 = 5.0      // niche floor
const CH_NICHE_H = 2.6       // niche height to its apex
const CH_TEXT_Y = 8.6        // lower inscription line
const CH_TITLE_Y = 9.35      // upper title line
const CH_DOORS = 3           // ground arches

export function chapelleHumanite(out: MeshBuilder, fit: Fit): void {
  const stucco = hex('#ece6d6'), buff = hex('#d9c08a'), dark = hex('#33383a'), glass = hex('#1f2a30'), iron = hex('#26282a'),
    bronze = hex('#6b5a3c'), slate = hex('#555a62'), side = hex('#d8cfbb'), ink = hex('#4a4a46')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal'), BRK = surfaceTag('brick')
  type V3 = [number, number, number]
  const r0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < r0.length; i++) { const p = r0[i]!, q = r0[(i + 1) % r0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...r0].reverse() : r0
  const n = ring.length
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // facade edge: the longest edge facing local +z
  let fi = 0, fb = -Infinity
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.5) continue
    const sc = q.x - p.x   // outward normal z = -dx/L, so a long negative dx faces +z (the street)
    if (-sc > fb) { fb = -sc; fi = i }
  }
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L]
    if (i === fi) continue
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, CH_EAVES, q.z], [p.x, CH_EAVES, p.z]], o, side, STU)
  }
  capPolygon(out, ring, CH_EAVES + 0.05, slate, MET)
  // the facade, in (u along the edge, y, d out)
  const p = ring[fi]!, q = ring[(fi + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
  const ex = (q.x - p.x) / L, ez = (q.z - p.z) / L, nx = ez, nz2 = -ex
  const o: V3 = [nx, 0, nz2]
  const P = (u: number, y: number, d: number): V3 => [p.x + ex * u + nx * d, y, p.z + ez * u + nz2 * d]
  const F = (u0: number, u1: number, y0: number, y1: number, d: number, col: V3, tag = 0): void =>
    quad([P(u0, y0, d), P(u1, y0, d), P(u1, y1, d), P(u0, y1, d)], o, col, tag)
  const cx = L / 2
  F(0, L, 0, CH_EAVES, 0, stucco, STU)
  F(0, L, 0, CH_GROUND_H, 0.03, buff, BRK)
  for (let y = 0.9; y < CH_GROUND_H; y += 0.9) F(0, L, y - 0.02, y + 0.02, 0.05, ink, BRK)   // rustication joints
  F(-0.1, L + 0.1, CH_GROUND_H, CH_GROUND_H + 0.3, 0.2, stucco, STU)                           // string course
  F(-0.15, L + 0.15, CH_EAVES - 0.4, CH_EAVES, 0.3, stucco, STU)                                // cornice
  const aw = Math.min(2.0, L / (CH_DOORS + 1) * 0.8)
  for (let k = 0; k < CH_DOORS; k++) {
    const c = L * (k + 0.5) / CH_DOORS, r = aw / 2, yb = 2.4 - r
    F(c - r, c + r, 0, yb, 0.08, dark)
    const m = 8
    for (let i = 0; i < m; i++) {
      const a0 = -r + (2 * r * i) / m, a1 = -r + (2 * r * (i + 1)) / m, am = Math.abs((a0 + a1) / 2)
      F(c + a0, c + a1, yb, yb + Math.sqrt(Math.max(r * r - am * am, 0)), 0.08, dark)
    }
  }
  for (const sg of [-1, 1]) {
    const c = cx + sg * L * CH_WIN_GAP, w = CH_WIN_W
    F(c - w / 2 - 0.1, c + w / 2 + 0.1, CH_WIN_Y0 - 0.1, CH_WIN_Y0 + CH_WIN_H + 0.1, 0.06, stucco, STU)
    F(c - w / 2, c + w / 2, CH_WIN_Y0, CH_WIN_Y0 + CH_WIN_H, 0.1, glass)
    F(c - 0.025, c + 0.025, CH_WIN_Y0, CH_WIN_Y0 + CH_WIN_H, 0.12, stucco)
    F(c - w / 2, c + w / 2, CH_WIN_Y0 + CH_WIN_H * 0.62, CH_WIN_Y0 + CH_WIN_H * 0.62 + 0.04, 0.12, stucco)
    F(c - w / 2 - 0.25, c + w / 2 + 0.25, CH_WIN_Y0 - 0.02, CH_WIN_Y0 + 0.08, 0.3, iron, MET)
    F(c - w / 2 - 0.25, c + w / 2 + 0.25, CH_WIN_Y0 + 0.9, CH_WIN_Y0 + 0.96, 0.3, iron, MET)
    for (let u = c - w / 2 - 0.2; u <= c + w / 2 + 0.2; u += 0.16) F(u - 0.015, u + 0.015, CH_WIN_Y0, CH_WIN_Y0 + 0.9, 0.3, iron, MET)
  }
  {
    const r = CH_NICHE_W / 2, yb = CH_NICHE_Y0 + CH_NICHE_H - r * 1.5, ya = CH_NICHE_Y0 + CH_NICHE_H
    F(cx - r - 0.12, cx + r + 0.12, CH_NICHE_Y0 - 0.2, yb, 0.07, stucco, STU)
    F(cx - r, cx + r, CH_NICHE_Y0, yb, 0.1, side, STU)
    quad([P(cx - r - 0.12, yb, 0.07), P(cx + r + 0.12, yb, 0.07), P(cx, ya + 0.15, 0.07), P(cx, ya + 0.15, 0.07)], o, stucco, STU)
    quad([P(cx - r, yb, 0.1), P(cx + r, yb, 0.1), P(cx, ya, 0.1), P(cx, ya, 0.1)], o, side, STU)
    F(cx - r - 0.15, cx + r + 0.15, CH_NICHE_Y0 - 0.12, CH_NICHE_Y0, 0.28, stucco, STU)
    F(cx - 0.12, cx + 0.12, CH_NICHE_Y0, CH_NICHE_Y0 + 0.4, 0.22, bronze, MET)
    F(cx - 0.09, cx + 0.09, CH_NICHE_Y0 + 0.4, CH_NICHE_Y0 + 0.62, 0.24, bronze, MET)
  }
  F(cx - L * 0.43, cx + L * 0.43, CH_TEXT_Y, CH_TEXT_Y + 0.14, 0.12, ink)
  F(cx - L * 0.36, cx + L * 0.36, CH_TITLE_Y, CH_TITLE_Y + 0.26, 0.12, ink)
}

// ───────────────────────────── Union libérale israélite de France, 24 rue Copernic (16e, way/80263653) ─────────────────────────────
// A narrow Haussmann-era stone front (Commons 'Union libérale israélite de France, 24 rue Copernic, Paris 16.jpg' and
// 'Paris Synagogue Copernic Schild1433.JPG', docs/landmarks/refs/worship/copernic-*.jpg): three storeys of pale limestone over a
// ground floor with a tall navy double door in a stone surround under a flat cornice hood carrying the red-granite name plate,
// heavy rusticated quoins at the left, grey-shuttered windows in stone surrounds, then a cream plastered attic pair of storeys.
// The street (Rue Copernic, found with osmium on the pbf) lies SSW of the footprint (~190 deg); the south edge is two almost
// collinear segments, so the builder takes the chain of ring edges facing local +z (the entry's `front` = street bearing).
const CPN_STREET_DOT = 0.85    // an edge joins the façade chain if its outward normal is this close to +z
const CPN_H = 19.5             // roof
const CPN_STONE_H = 14.2       // top of the limestone front (cornice)
const CPN_PLINTH_H = 1.0       // base course with the basement slit lights
const CPN_GROUND_H = 4.7       // door / ground storey top
const CPN_FLOORS = [[5.4, 7.7], [8.5, 10.7], [11.4, 13.4]]  // upper windows [sill, head]
const CPN_ATTIC = [[15.0, 16.9], [17.7, 19.0]]
const CPN_QUOIN_W = 1.0        // left quoin pilaster width
const CPN_QUOIN_R = 0.45       // right quoin
const CPN_QUOIN_COURSE = 0.55
const CPN_DOOR_U0 = 0.14       // fractions of the chord, from the quoined end
const CPN_DOOR_U1 = 0.31
const CPN_DOOR_H = 3.7
const CPN_WIN_U = [0.22, 0.44, 0.64, 0.84]   // window centres (the first is not on the ground floor)
const CPN_WIN_W = 1.2
const CPN_LEFT_IS_START = 1   // 1: the quoined end is the chain's start, 0: its end (flip after a trial shot)

export function synagogueCopernic(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cfc7b2'), stoneD = hex('#b9b09a'), cream = hex('#ece4cc'), navy = hex('#1d2766'), shut = hex('#d9d8cf'),
    glass = hex('#2a3036'), granite = hex('#6e4a44'), gold = hex('#c9a24a'), iron = hex('#26282a'), side = hex('#e3dcc6'), roofc = hex('#6c6e70')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal'), CON = surfaceTag('concrete')
  type V3 = [number, number, number]
  const r0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < r0.length; i++) { const p = r0[i]!, q = r0[(i + 1) % r0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...r0].reverse() : r0
  const n = ring.length
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // street chain: edges whose outward normal faces +z, grown from the best one
  const nrm = (i: number): number => { const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z) || 1; return -(q.x - p.x) / L }
  let fi = 0, fb = -Infinity
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L * nrm(i) > fb) { fb = L * nrm(i); fi = i }
  }
  let a = fi, b = fi
  while (nrm((a + n - 1) % n) > CPN_STREET_DOT && (a + n - 1) % n !== b) a = (a + n - 1) % n
  while (nrm((b + 1) % n) > CPN_STREET_DOT && (b + 1) % n !== a) b = (b + 1) % n
  const inChain = (i: number): boolean => { for (let k = a; ; k = (k + 1) % n) { if (k === i) return true; if (k === b) return false } }
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05 || inChain(i)) continue
    const o: V3 = [(q.z - p.z) / L, 0, -(q.x - p.x) / L]
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, CPN_H, q.z], [p.x, CPN_H, p.z]], o, side, STU)
  }
  capPolygon(out, ring, CPN_H, roofc, MET)
  const p = ring[a]!, q = ring[(b + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
  const ex = (q.x - p.x) / L, ez = (q.z - p.z) / L, nx = ez, nz = -ex
  const o: V3 = [nx, 0, nz]
  const flip = CPN_LEFT_IS_START ? 0 : 1
  const P = (u: number, y: number, d: number): V3 => { const uu = flip ? L - u : u; return [p.x + ex * uu + nx * d, y, p.z + ez * uu + nz * d] }
  const F = (u0: number, u1: number, y0: number, y1: number, d: number, col: V3, tag = 0): void =>
    quad([P(u0, y0, d), P(u1, y0, d), P(u1, y1, d), P(u0, y1, d)], o, col, tag)
  // the chain's wall: cream attic, limestone front, plinth
  F(0, L, 0, CPN_H, 0, cream, STU)
  F(0, L, 0, CPN_STONE_H, 0.04, stone, STU)
  F(0, L, 0, CPN_PLINTH_H, 0.1, stoneD, STU)
  for (let y = 1.3; y < CPN_STONE_H - 0.5; y += 1.0) F(0, L, y - 0.012, y + 0.012, 0.055, stoneD, STU)   // ashlar joints
  F(-0.05, L + 0.05, CPN_STONE_H - 0.9, CPN_STONE_H - 0.5, 0.25, stone, STU)      // frieze band
  F(-0.1, L + 0.1, CPN_STONE_H - 0.5, CPN_STONE_H, 0.5, stone, STU)               // cornice
  F(-0.1, L + 0.1, CPN_STONE_H, CPN_STONE_H + 0.12, 0.55, stoneD, STU)
  F(0, L, 4.55, CPN_GROUND_H, 0.12, stoneD, STU)                                 // string course under the first floor
  // quoins
  const qlh = CPN_QUOIN_COURSE
  for (let y = CPN_PLINTH_H, k = 0; y < CPN_STONE_H - 0.9; y += qlh, k++) {
    F(0, CPN_QUOIN_W - (k % 2) * 0.25, y, Math.min(y + qlh - 0.02, CPN_STONE_H - 0.9), 0.2, stone, STU)
    F(L - CPN_QUOIN_R + (k % 2) * 0.12, L, y, Math.min(y + qlh - 0.02, CPN_STONE_H - 0.9), 0.14, stone, STU)
  }
  // door: stone surround, hood cornice, name plate, navy leaves
  const du0 = L * CPN_DOOR_U0, du1 = L * CPN_DOOR_U1, dm = (du0 + du1) / 2
  F(du0 - 0.35, du1 + 0.35, 0, CPN_DOOR_H + 0.45, 0.26, stone, STU)
  F(du0 - 0.1, du1 + 0.1, 0, CPN_DOOR_H + 0.1, 0.18, hex('#12162f'), STU)
  F(du0, dm - 0.01, 0, CPN_DOOR_H, 0.28, navy, MET)
  F(dm + 0.01, du1, 0, CPN_DOOR_H, 0.28, navy, MET)
  for (const [x0, x1] of [[du0, dm - 0.01], [dm + 0.01, du1]] as const) {
    F(x0 + 0.18, x1 - 0.18, 0.4, 1.75, 0.31, hex('#2a3580'), MET)
    F(x0 + 0.18, x1 - 0.18, 2.0, CPN_DOOR_H - 0.3, 0.31, hex('#2a3580'), MET)
  }
  F(du0 - 0.6, du1 + 0.6, CPN_DOOR_H + 0.45, CPN_DOOR_H + 0.75, 0.5, stone, STU)   // hood cornice
  F(du0 - 0.5, du1 + 0.5, CPN_DOOR_H + 0.75, CPN_DOOR_H + 0.85, 0.45, stoneD, STU)
  F(dm - 1.25, dm + 1.25, CPN_DOOR_H + 0.9, CPN_DOOR_H + 1.28, 0.3, granite, STU)  // red granite plaque
  F(dm - 1.0, dm + 1.0, CPN_DOOR_H + 1.0, CPN_DOOR_H + 1.04, 0.31, gold, MET)
  F(dm - 0.8, dm + 0.8, CPN_DOOR_H + 1.12, CPN_DOOR_H + 1.16, 0.31, gold, MET)
  // windows: ground floor three shuttered, upper floors four, in stone surrounds
  const win = (c: number, y0: number, y1: number, w: number, sh: boolean): void => {
    F(c - w / 2 - 0.25, c + w / 2 + 0.25, y0 - 0.2, y1 + 0.25, 0.1, stoneD, STU)
    F(c - w / 2, c + w / 2, y0, y1, 0.05, sh ? shut : glass, sh ? MET : 0)
    if (sh) for (let y = y0 + 0.1; y < y1; y += 0.14) F(c - w / 2 + 0.03, c + w / 2 - 0.03, y, y + 0.03, 0.12, stoneD, MET)
    else { F(c - 0.02, c + 0.02, y0, y1, 0.1, iron, MET); F(c - w / 2, c + w / 2, (y0 + y1) / 2, (y0 + y1) / 2 + 0.04, 0.1, iron, MET) }
  }
  for (const f of CPN_WIN_U.slice(1)) {
    const c = L * f
    win(c, 1.3, 4.3, CPN_WIN_W, true)
    F(c - CPN_WIN_W / 2 - 0.35, c + CPN_WIN_W / 2 + 0.35, 4.3, 4.55, 0.3, stone, STU)   // sill ledge on corbels
  }
  for (const [y0, y1] of CPN_FLOORS) for (const f of CPN_WIN_U) win(L * f, y0, y1, CPN_WIN_W, true)
  F(0.0, L, CPN_FLOORS[0]![0] - 0.45, CPN_FLOORS[0]![0] - 0.35, 0.14, stoneD, STU)
  // attic: white-framed glazed windows in the cream wall
  for (const [y0, y1] of CPN_ATTIC) for (const f of [0.3, 0.55, 0.8]) {
    const c = L * f, w = 1.3
    F(c - w / 2 - 0.12, c + w / 2 + 0.12, y0 - 0.1, y1 + 0.1, 0.06, hex('#f4efe0'), STU)
    F(c - w / 2, c + w / 2, y0, y1, 0.09, glass)
    F(c - 0.02, c + 0.02, y0, y1, 0.11, hex('#f4efe0'), MET)
  }
  // basement slit lights in the plinth
  for (const f of [0.44, 0.64, 0.84]) F(L * f - 0.5, L * f + 0.5, 0.35, 0.8, 0.12, iron, MET)
  void CON
}

// ───────────────────────────── Crématorium du Père-Lachaise (way/24781731), 71 rue des Rondeaux ─────────────────────────────
// Jean-Camille Formigé, 1889. Commons 'Crématorium du Père-Lachaise.jpg' and '…2024-08-18 - 1.jpg'
// (docs/landmarks/refs/worship/crematorium-*.jpg): neo-Byzantine hall in banded limestone and grey stone, a recessed
// loggia of two columns and three black doors on a flight of steps under a carved tympanum, a gabled front arm,
// a ribbed gilt-tan dome on an eight-sided drum, and a tall banded chimney behind to one side.
// The front is the ring edge whose outward normal best matches CRE_FRONT (local x east, z south), weighted by length.
const CRE_FRONT: [number, number] = [-0.48, -0.88]
const CRE_WALL = 11.0        // eaves height of the hall
const CRE_COURSE = 0.62      // banding course height (light / grey alternate)
const CRE_PLINTH = 1.1
const CRE_LOGGIA_HW = 3.7    // half-width of the recessed loggia
const CRE_LOGGIA_D = 2.4     // loggia depth
const CRE_OPEN_H = 7.4       // top of the loggia opening
const CRE_STEPS = 6
const CRE_RISER = 0.2
const CRE_TREAD = 0.46
const CRE_GABLE_H = 4.2
const CRE_ARM = 9.5          // depth of the gabled front arm
const CRE_DOME_R = 6.4
const CRE_DRUM_H = 3.2
const CRE_DOME_H = 6.2
const CRE_DOME_SEG = 16
const CRE_CHIMNEY_H = 31
const CRE_CHIMNEY_R = 1.15
const CRE_CHIMNEY_U = 0.3    // chimney position as a fraction of the half-extent along the front, +right
const CRE_CHIMNEY_D = -0.55  // …and of the half-depth, − = rear

export function cremationPereLachaise(out: MeshBuilder, fit: Fit): void {
  const light = hex('#d8d0bb'), grey = hex('#8d8b86'), pale = hex('#cfc7b0'), black = hex('#15161a'), lead = hex('#6a6d70'),
    tan = hex('#c3a870'), tanL = hex('#dccb9c'), chim = hex('#a8a193'), relief = hex('#bdb49c')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const r0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < r0.length; i++) { const p = r0[i]!, q = r0[(i + 1) % r0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...r0].reverse() : r0
  const n = ring.length
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  const fl = Math.hypot(CRE_FRONT[0], CRE_FRONT[1])
  let fi = 0, fb = -Infinity
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z) || 1
    const dot = ((q.z - p.z) * CRE_FRONT[0] - (q.x - p.x) * CRE_FRONT[1]) / (L * fl)
    const s = dot > 0.5 ? L * dot : -1
    if (s > fb) { fb = s; fi = i }
  }
  const pF = ring[fi]!, qF = ring[(fi + 1) % n]!, L = Math.hypot(qF.x - pF.x, qF.z - pF.z)
  const ex = (qF.x - pF.x) / L, ez = (qF.z - pF.z) / L, nx = ez, nz = -ex
  const o: V3 = [nx, 0, nz]
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x / n; cz += p.z / n }
  // extents of the ring in the front frame (u along, d outward) about the centroid
  let umin = Infinity, umax = -Infinity, dmin = Infinity, dmax = -Infinity
  for (const p of ring) {
    const u = (p.x - cx) * ex + (p.z - cz) * ez, d = (p.x - cx) * nx + (p.z - cz) * nz
    umin = Math.min(umin, u); umax = Math.max(umax, u); dmin = Math.min(dmin, d); dmax = Math.max(dmax, d)
  }
  // the dome stands on the centroid; world point from (u along the front, d outward) about the front edge's midpoint
  const mx = (pF.x + qF.x) / 2, mz = (pF.z + qF.z) / 2
  const W = (u: number, y: number, d: number): V3 => [mx + ex * u + nx * d, y, mz + ez * u + nz * d]
  const FF = (u0: number, u1: number, y0: number, y1: number, d: number, col: V3, tag = STU): void =>
    quad([W(u0, y0, d), W(u1, y0, d), W(u1, y1, d), W(u0, y1, d)], o, col, tag)
  const band = (u0: number, u1: number, y0: number, y1: number, d: number): void => {
    for (let y = y0, k = 0; y < y1 - 1e-6; y += CRE_COURSE, k++) FF(u0, u1, y, Math.min(y + CRE_COURSE, y1), d, k % 2 ? grey : light)
  }
  const boxF = (u0: number, u1: number, d0: number, d1: number, y0: number, y1: number, col: V3, tag = STU): void => {
    FF(u0, u1, y0, y1, d1, col, tag)
    quad([W(u0, y1, d1), W(u1, y1, d1), W(u1, y1, d0), W(u0, y1, d0)], [0, 1, 0], col, tag)
    quad([W(u0, y0, d0), W(u0, y0, d1), W(u0, y1, d1), W(u0, y1, d0)], [-ex, 0, -ez], col, tag)
    quad([W(u1, y0, d0), W(u1, y0, d1), W(u1, y1, d1), W(u1, y1, d0)], [ex, 0, ez], col, tag)
  }
  // side and rear walls: banded courses on a pale plinth
  for (let i = 0; i < n; i++) {
    if (i === fi) continue
    const p = ring[i]!, q = ring[(i + 1) % n]!, l = Math.hypot(q.x - p.x, q.z - p.z)
    if (l < 0.05) continue
    const oo: V3 = [(q.z - p.z) / l, 0, -(q.x - p.x) / l]
    for (let y = 0, k = 0; y < CRE_WALL - 1e-6; y += CRE_COURSE, k++) {
      const y1 = Math.min(y + CRE_COURSE, CRE_WALL), col = y < CRE_PLINTH ? pale : k % 2 ? grey : light
      quad([[p.x, y, p.z], [q.x, y, q.z], [q.x, y1, q.z], [p.x, y1, p.z]], oo, col, STU)
    }
    // tall narrow arched lights on the longer flanks
    if (l > 8) for (const f of [0.3, 0.5, 0.7]) {
      const ux = p.x + (q.x - p.x) * f, uz = p.z + (q.z - p.z) * f, ax = (q.x - p.x) / l, az = (q.z - p.z) / l
      const hw = 0.45
      quad([[ux - ax * hw + oo[0] * 0.05, 3.2, uz - az * hw + oo[2] * 0.05], [ux + ax * hw + oo[0] * 0.05, 3.2, uz + az * hw + oo[2] * 0.05],
        [ux + ax * hw + oo[0] * 0.05, 7.4, uz + az * hw + oo[2] * 0.05], [ux - ax * hw + oo[0] * 0.05, 7.4, uz - az * hw + oo[2] * 0.05]], oo, black, 0)
    }
  }
  // flat lead roof over the hall (the dome and the gabled arm sit on it)
  capPolygon(out, ring, CRE_WALL, lead, MET)
  // eaves cornice round the ring
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, l = Math.hypot(q.x - p.x, q.z - p.z)
    if (l < 0.05) continue
    const oo: V3 = [(q.z - p.z) / l, 0, -(q.x - p.x) / l], k = 0.35
    quad([[p.x + oo[0] * k, CRE_WALL - 0.45, p.z + oo[2] * k], [q.x + oo[0] * k, CRE_WALL - 0.45, q.z + oo[2] * k],
      [q.x + oo[0] * k, CRE_WALL + 0.15, q.z + oo[2] * k], [p.x + oo[0] * k, CRE_WALL + 0.15, p.z + oo[2] * k]], oo, pale, STU)
  }

  // ── front: banded piers either side of the recessed loggia, gable above
  const hw = CRE_LOGGIA_HW
  band(-L / 2, -hw, 0, CRE_WALL, 0); band(hw, L / 2, 0, CRE_WALL, 0)
  band(-hw, hw, CRE_OPEN_H + 0.6, CRE_WALL, 0)                         // frieze band over the opening
  boxF(-hw - 0.5, hw + 0.5, 0, 0.55, CRE_OPEN_H, CRE_OPEN_H + 0.6, pale)   // cornice over the loggia
  band(-hw, hw, 0, CRE_OPEN_H, -CRE_LOGGIA_D)                          // loggia back wall
  for (const s of [-1, 1]) {                                           // loggia reveals
    const u = s * hw
    for (let y = 0, k = 0; y < CRE_OPEN_H - 1e-6; y += CRE_COURSE, k++)
      quad([W(u, y, 0), W(u, y, -CRE_LOGGIA_D), W(u, Math.min(y + CRE_COURSE, CRE_OPEN_H), -CRE_LOGGIA_D), W(u, Math.min(y + CRE_COURSE, CRE_OPEN_H), 0)], [-s * ex, 0, -s * ez], k % 2 ? grey : light, STU)
  }
  for (const c of [-2.4, 0, 2.4]) {                                    // three black doors with arched lights over
    FF(c - 0.95, c + 0.95, 0, 5.0, -CRE_LOGGIA_D + 0.06, black, MET)
    FF(c - 0.8, c + 0.8, 5.4, 6.6, -CRE_LOGGIA_D + 0.06, black, MET)
    FF(c - 0.04, c + 0.04, 0, 5.0, -CRE_LOGGIA_D + 0.1, grey, MET)
  }
  for (const c of [-1.25, 1.25]) {                                     // two columns, octagonal in section
    const seg = 8, r = 0.42, d0 = -0.9
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2, am = (a0 + a1) / 2
      quad([W(c + Math.cos(a0) * r, 0.9, d0 + Math.sin(a0) * r), W(c + Math.cos(a1) * r, 0.9, d0 + Math.sin(a1) * r),
        W(c + Math.cos(a1) * r, CRE_OPEN_H - 0.5, d0 + Math.sin(a1) * r), W(c + Math.cos(a0) * r, CRE_OPEN_H - 0.5, d0 + Math.sin(a0) * r)],
        [ex * Math.cos(am) + nx * Math.sin(am), 0, ez * Math.cos(am) + nz * Math.sin(am)], light, STU)
    }
    boxF(c - 0.6, c + 0.6, d0 - 0.6, d0 + 0.6, CRE_OPEN_H - 0.5, CRE_OPEN_H, pale)   // capital
    boxF(c - 0.55, c + 0.55, d0 - 0.55, d0 + 0.55, 0.3, 0.9, pale)                   // base
  }
  // steps
  for (let k = 0; k < CRE_STEPS; k++) boxF(-hw - 1.6, hw + 1.6, 0, 0.35 + (CRE_STEPS - k) * CRE_TREAD, 0, (k + 1) * CRE_RISER, pale)
  // gable over the whole front, its rake, and the tympanum relief
  const gu0 = -L * 0.42, gu1 = L * 0.42, apex = CRE_WALL + CRE_GABLE_H
  quad([W(gu0, CRE_WALL, 0.02), W(gu1, CRE_WALL, 0.02), W(0, apex, 0.02), W(0, apex, 0.02)], o, light, STU)
  for (const s of [-1, 1]) {
    const ue = s * L * 0.42
    quad([W(ue, CRE_WALL, 0.02), W(0, apex, 0.02), W(0, apex + 0.35, 0.5), W(ue, CRE_WALL + 0.35, 0.5)], [0, 1, 0], pale, STU)
    quad([W(ue, CRE_WALL, -CRE_ARM), W(0, apex, -CRE_ARM), W(0, apex, 0.02), W(ue, CRE_WALL, 0.02)], [s * 0.35 * ex, 1, s * 0.35 * ez], lead, MET)
  }
  boxF(-2.2, 2.2, 0.02, 0.4, CRE_WALL + 0.5, CRE_WALL + 2.4, relief)
  boxF(-3.4, 3.4, 0.02, 0.3, CRE_WALL + 0.3, CRE_WALL + 0.5, pale)

  // ── dome on an eight-sided drum at the centroid
  const dcx = cx, dcz = cz, y0 = CRE_WALL
  const drum = 8, rd = CRE_DOME_R + 0.4
  for (let i = 0; i < drum; i++) {
    const a0 = ((i + 0.5) / drum) * Math.PI * 2, a1 = ((i + 1.5) / drum) * Math.PI * 2, am = (a0 + a1) / 2
    const P0: V3 = [dcx + Math.cos(a0) * rd, y0, dcz + Math.sin(a0) * rd], P1: V3 = [dcx + Math.cos(a1) * rd, y0, dcz + Math.sin(a1) * rd]
    const oo: V3 = [Math.cos(am), 0, Math.sin(am)]
    for (let y = y0, k = 0; y < y0 + CRE_DRUM_H - 1e-6; y += CRE_COURSE, k++) {
      const yy = Math.min(y + CRE_COURSE, y0 + CRE_DRUM_H)
      quad([[P0[0], y, P0[2]], [P1[0], y, P1[2]], [P1[0], yy, P1[2]], [P0[0], yy, P0[2]]], oo, k % 2 ? grey : light, STU)
    }
    const mx2 = (P0[0] + P1[0]) / 2, mz2 = (P0[2] + P1[2]) / 2, tx = (P1[0] - P0[0]) / 2 * 0.22, tz = (P1[2] - P0[2]) / 2 * 0.22
    quad([[mx2 - tx + oo[0] * 0.05, y0 + 0.8, mz2 - tz + oo[2] * 0.05], [mx2 + tx + oo[0] * 0.05, y0 + 0.8, mz2 + tz + oo[2] * 0.05],
      [mx2 + tx + oo[0] * 0.05, y0 + 2.5, mz2 + tz + oo[2] * 0.05], [mx2 - tx + oo[0] * 0.05, y0 + 2.5, mz2 - tz + oo[2] * 0.05]], oo, black, 0)
  }
  capPolygon(out, Array.from({ length: drum }, (_, i) => ({ x: dcx + Math.cos(((i + 0.5) / drum) * Math.PI * 2) * rd, z: dcz + Math.sin(((i + 0.5) / drum) * Math.PI * 2) * rd })), y0 + CRE_DRUM_H, pale, STU)
  const yd = y0 + CRE_DRUM_H, rings = 7
  const prof = (k: number): [number, number] => { const t = (k / rings) * (Math.PI / 2) * 0.93; return [CRE_DOME_R * Math.cos(t), yd + CRE_DOME_H * Math.sin(t)] }
  for (let k = 0; k < rings; k++) {
    const [r1, h1] = prof(k), [r2, h2] = prof(k + 1)
    for (let i = 0; i < CRE_DOME_SEG; i++) {
      const a0 = (i / CRE_DOME_SEG) * Math.PI * 2, a1 = ((i + 1) / CRE_DOME_SEG) * Math.PI * 2, am = (a0 + a1) / 2
      quad([[dcx + Math.cos(a0) * r1, h1, dcz + Math.sin(a0) * r1], [dcx + Math.cos(a1) * r1, h1, dcz + Math.sin(a1) * r1],
        [dcx + Math.cos(a1) * r2, h2, dcz + Math.sin(a1) * r2], [dcx + Math.cos(a0) * r2, h2, dcz + Math.sin(a0) * r2]],
        [Math.cos(am), 0.6, Math.sin(am)], i % 2 ? tan : tanL, MET)
    }
  }
  const [rt, ht] = prof(rings)
  capPolygon(out, Array.from({ length: CRE_DOME_SEG }, (_, i) => ({ x: dcx + Math.cos((i / CRE_DOME_SEG) * Math.PI * 2) * rt, z: dcz + Math.sin((i / CRE_DOME_SEG) * Math.PI * 2) * rt })), ht, tan, MET)
  // lantern and finial
  const lant = (r: number, ya: number, yb: number, col: V3): void => {
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2, am = (a0 + a1) / 2
      quad([[dcx + Math.cos(a0) * r, ya, dcz + Math.sin(a0) * r], [dcx + Math.cos(a1) * r, ya, dcz + Math.sin(a1) * r],
        [dcx + Math.cos(a1) * r, yb, dcz + Math.sin(a1) * r], [dcx + Math.cos(a0) * r, yb, dcz + Math.sin(a0) * r]], [Math.cos(am), 0, Math.sin(am)], col, MET)
    }
  }
  lant(0.9, ht, ht + 1.5, pale); lant(0.55, ht + 1.5, ht + 2.4, tan); lant(0.18, ht + 2.4, ht + 3.2, tan)

  // ── chimney behind, to the right of the dome, banded with two collars and a dark cap
  const chu = umax * CRE_CHIMNEY_U
  const chx = cx + ex * chu + nx * (dmin * Math.abs(CRE_CHIMNEY_D)), chz = cz + ez * chu + nz * (dmin * Math.abs(CRE_CHIMNEY_D))
  const shaft = (r0_: number, r1_: number, ya: number, yb: number, col: V3): void => {
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2, am = (a0 + a1) / 2
      quad([[chx + Math.cos(a0) * r0_, ya, chz + Math.sin(a0) * r0_], [chx + Math.cos(a1) * r0_, ya, chz + Math.sin(a1) * r0_],
        [chx + Math.cos(a1) * r1_, yb, chz + Math.sin(a1) * r1_], [chx + Math.cos(a0) * r1_, yb, chz + Math.sin(a0) * r1_]], [Math.cos(am), 0, Math.sin(am)], col, STU)
    }
  }
  shaft(CRE_CHIMNEY_R * 1.5, CRE_CHIMNEY_R * 1.2, CRE_WALL, CRE_WALL + 4, chim)
  shaft(CRE_CHIMNEY_R * 1.2, CRE_CHIMNEY_R * 0.85, CRE_WALL + 4, CRE_CHIMNEY_H - 2.4, chim)
  shaft(CRE_CHIMNEY_R * 1.1, CRE_CHIMNEY_R * 1.1, CRE_WALL + 13, CRE_WALL + 13.6, pale)
  shaft(CRE_CHIMNEY_R * 1.2, CRE_CHIMNEY_R * 1.2, CRE_CHIMNEY_H - 2.4, CRE_CHIMNEY_H - 1.6, pale)
  shaft(CRE_CHIMNEY_R * 1.0, CRE_CHIMNEY_R * 1.0, CRE_CHIMNEY_H - 1.6, CRE_CHIMNEY_H, black)
}

// ── Temple de l'Amitié, 20 rue Jacob (Barney's garden temple, c.1800): tetrastyle Doric portico, pediment, double door ──
// Photos: Commons 'Le temple de l'Amitié, rue Jacob, nº20, D.1356' (docs/landmarks/refs/worship/amitie-1.jpg). The portico is
// on a short side, looking along the garden toward the house to the west-north-west (entry front 285; the loader turns the model so the front is local -z, AMI_FRONT).
const AMI_FRONT: [number, number] = [0, -1]
const AMI_PLINTH = 0.55       // stone podium height
const AMI_STEPS = 3           // risers of the front flight
const AMI_STEP_D = 0.32       // tread depth
const AMI_STEP_HW = 1.1       // half-width of the flight
const AMI_COL_H = 3.0         // column shaft height (to the echinus)
const AMI_COL_R = 0.23        // shaft radius at the base
const AMI_COL_TAPER = 0.85    // top radius / base radius
const AMI_COL_IN = 0.28       // outer column centre inset from the side
const AMI_COL_D = 0.7         // column axis, back from the front edge
const AMI_PORT = 1.75         // portico depth (front edge to cella door wall)
const AMI_ENTAB = 0.55        // architrave + frieze height
const AMI_CORNICE = 0.14
const AMI_PED_H = 0.95        // pediment rise
const AMI_WALL_IN = 0.12      // cella wall inset from the podium edge
const AMI_DOOR_W = 1.1
const AMI_DOOR_H = 2.5

export function templeAmitie(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#c4b79a'), cream = hex('#d9cdb0'), col = hex('#d7ccb3'), slate = hex('#555a62'), wood = hex('#5b3a26'),
    dark = hex('#2c2a28'), shadow = hex('#a89c80'), bust = hex('#ece6d6')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const r0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < r0.length; i++) { const p = r0[i]!, q = r0[(i + 1) % r0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...r0].reverse() : r0
  const n = ring.length
  const quad = (p: V3[], o: V3, c: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const cr: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = cr[0] * o[0] + cr[1] * o[1] + cr[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
  // the front edge: the ring edge whose outward normal best matches AMI_FRONT
  const fl = Math.hypot(AMI_FRONT[0], AMI_FRONT[1])
  let fi = 0, fb = -Infinity
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z) || 1
    const dot = ((q.z - p.z) * AMI_FRONT[0] - (q.x - p.x) * AMI_FRONT[1]) / (L * fl)
    const s = dot > 0.3 ? L * dot : -1
    if (s > fb) { fb = s; fi = i }
  }
  const pF = ring[fi]!, qF = ring[(fi + 1) % n]!, L = Math.hypot(qF.x - pF.x, qF.z - pF.z)
  const ex = (qF.x - pF.x) / L, ez = (qF.z - pF.z) / L, nx = ez, nz = -ex
  let dmin = Infinity
  for (const p of ring) dmin = Math.min(dmin, (p.x - pF.x) * nx + (p.z - pF.z) * nz)
  const DEP = -dmin, HW = L / 2
  const mx = (pF.x + qF.x) / 2, mz = (pF.z + qF.z) / 2
  const W = (u: number, y: number, d: number): V3 => [mx + ex * u + nx * d, y, mz + ez * u + nz * d]
  const FF = (u0: number, u1: number, y0: number, y1: number, d: number, c: V3, tag = STU): void =>
    quad([W(u0, y0, d), W(u1, y0, d), W(u1, y1, d), W(u0, y1, d)], [nx, 0, nz], c, tag)
  const boxF = (u0: number, u1: number, d0: number, d1: number, y0: number, y1: number, c: V3, tag = STU): void => {
    FF(u0, u1, y0, y1, d1, c, tag)
    quad([W(u0, y1, d1), W(u1, y1, d1), W(u1, y1, d0), W(u0, y1, d0)], [0, 1, 0], c, tag)
    quad([W(u0, y0, d0), W(u0, y0, d1), W(u0, y1, d1), W(u0, y1, d0)], [-ex, 0, -ez], c, tag)
    quad([W(u1, y0, d0), W(u1, y0, d1), W(u1, y1, d1), W(u1, y1, d0)], [ex, 0, ez], c, tag)
    quad([W(u0, y0, d0), W(u1, y0, d0), W(u1, y1, d0), W(u0, y1, d0)], [-nx, 0, -nz], c, tag)
  }
  // podium and steps
  boxF(-HW, HW, -DEP, 0, 0, AMI_PLINTH, stone)
  for (let s = 0; s < AMI_STEPS; s++) boxF(-AMI_STEP_HW, AMI_STEP_HW, 0, AMI_STEP_D * (AMI_STEPS - s), 0, AMI_PLINTH * (s + 0.5) / AMI_STEPS, stone)
  // cella: a cream box behind the portico
  const cu = HW - AMI_WALL_IN, yw = AMI_PLINTH + AMI_COL_H + AMI_ENTAB
  boxF(-cu, cu, -DEP + AMI_WALL_IN, -AMI_PORT, AMI_PLINTH, yw, cream)
  // door wall: double door in a dark reveal, bust niches either side, two small side doors
  const dF = -AMI_PORT + 0.03
  FF(-AMI_DOOR_W / 2 - 0.08, AMI_DOOR_W / 2 + 0.08, AMI_PLINTH, AMI_PLINTH + AMI_DOOR_H + 0.08, dF, shadow)
  FF(-AMI_DOOR_W / 2, AMI_DOOR_W / 2, AMI_PLINTH, AMI_PLINTH + AMI_DOOR_H, dF + 0.02, wood)
  FF(-0.02, 0.02, AMI_PLINTH, AMI_PLINTH + AMI_DOOR_H, dF + 0.03, dark)
  for (const sg of [-1, 1]) {
    FF(sg * 1.05 - 0.2, sg * 1.05 + 0.2, AMI_PLINTH + 1.55, AMI_PLINTH + 2.25, dF + 0.01, shadow)
    FF(sg * 1.05 - 0.1, sg * 1.05 + 0.1, AMI_PLINTH + 1.7, AMI_PLINTH + 2.1, dF + 0.02, bust)
    FF(sg * 1.6 - 0.28, sg * 1.6 + 0.28, AMI_PLINTH, AMI_PLINTH + 1.65, dF + 0.01, wood)
  }
  // columns: four Doric shafts with echinus and abacus, on square plinths
  const cuo = HW - AMI_COL_IN
  for (const u of [-cuo, -cuo / 3, cuo / 3, cuo]) {
    const [cx, , cz] = W(u, 0, -AMI_COL_D)
    prism(out, cx, cz, AMI_PLINTH, AMI_PLINTH + AMI_COL_H, AMI_COL_R, 14, col, STU, AMI_COL_R * AMI_COL_TAPER)
    prism(out, cx, cz, AMI_PLINTH + AMI_COL_H, AMI_PLINTH + AMI_COL_H + 0.1, AMI_COL_R * 1.2, 14, col, STU, AMI_COL_R * 1.2)
    boxF(u - AMI_COL_R * 1.3, u + AMI_COL_R * 1.3, -AMI_COL_D - AMI_COL_R * 1.3, -AMI_COL_D + AMI_COL_R * 1.3, AMI_PLINTH + AMI_COL_H + 0.1, AMI_PLINTH + AMI_COL_H + 0.18, col)
  }
  // entablature all round, with the inscription band on the front, and the cornice
  const yE = yw
  boxF(-HW + 0.04, HW - 0.04, -DEP + 0.04, -0.04, yE - AMI_ENTAB, yE, cream)
  boxF(-HW - 0.05, HW + 0.05, -DEP - 0.05, 0.05, yE, yE + AMI_CORNICE, cream)
  FF(-1.3, 1.3, yE - AMI_ENTAB * 0.8, yE - AMI_ENTAB * 0.25, 0.0, shadow)
  // pediment, front and back, and the slate roof
  const run = HW + 0.05, ridge = yE + AMI_CORNICE + AMI_PED_H, ln = Math.hypot(run, AMI_PED_H)
  for (const d of [0.05, -DEP - 0.05]) {
    const sgn = d > 0 ? 1 : -1
    quad([W(-run, yE + AMI_CORNICE, d), W(run, yE + AMI_CORNICE, d), W(0, ridge, d), W(0, ridge, d)], [nx * sgn, 0, nz * sgn], cream, STU)
  }
  FF(-0.5, 0.5, yE + AMI_CORNICE + 0.12, yE + AMI_CORNICE + 0.5, 0.06, shadow)   // the medallion
  FF(-0.25, 0.25, yE + AMI_CORNICE + 0.22, yE + AMI_CORNICE + 0.42, 0.07, bust)
  for (const sg of [-1, 1]) {
    const o: V3 = [ex * sg * AMI_PED_H / ln, run / ln, ez * sg * AMI_PED_H / ln]
    quad([W(sg * run, yE + AMI_CORNICE - 0.05, 0.2), W(sg * run, yE + AMI_CORNICE - 0.05, -DEP - 0.2), W(0, ridge + 0.03, -DEP - 0.2), W(0, ridge + 0.03, 0.2)], o, slate, MET)
  }
}

// ── Temple de l'Amour, Île de la Jatte (Neuilly, 1830s rotunda): ten fluted Corinthian columns, ribbed lead dome, stepped stone base ──
// Photo: Commons 'Temple de l'Amour Neuilly 003' (docs/landmarks/refs/worship/amour-1.jpg). Round, so no street front: centred on the footprint.
const AMR_R_FILL = 0.96       // temple radius as a fraction of the footprint's smaller half-extent
const AMR_COLS = 10
const AMR_BASE_H = 1.3        // stepped base height
const AMR_STEPS = 7
const AMR_COL_H = 4.3
const AMR_COL_R = 0.27        // shaft base radius, metres
const AMR_COL_RING = 0.84     // column circle radius / temple radius
const AMR_ENTAB = 0.75
const AMR_DOME_H = 2.6
const AMR_DOME_RINGS = 8
const AMR_FINIAL_H = 0.9

export function templeAmour(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#c9bfa8'), pale = hex('#d6cdb8'), lead = hex('#7d8794'), dark = hex('#4a4d52'), statue = hex('#ece8dc')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  const R = Math.min(fit.hx, fit.hz) * AMR_R_FILL
  const seg = 28
  // stepped base: concentric drums, widest at the bottom
  for (let s = 0; s < AMR_STEPS; s++) {
    const r = R * (0.9 + 0.1 * (AMR_STEPS - 1 - s) / (AMR_STEPS - 1))
    const y0 = AMR_BASE_H * s / AMR_STEPS, y1 = AMR_BASE_H * (s + 1) / AMR_STEPS
    prism(out, 0, 0, y0, y1, r, seg, stone, STU, r)
  }
  const y0 = AMR_BASE_H
  // central statue pedestal
  prism(out, 0, 0, y0, y0 + 1.1, 0.35, 4, stone, STU, 0.3)
  prism(out, 0, 0, y0 + 1.1, y0 + 2.2, 0.2, 10, statue, STU, 0.14)
  // columns: fluted shafts (many-sided), plinth, capital
  const cr = R * AMR_COL_RING
  for (let i = 0; i < AMR_COLS; i++) {
    const a = (i / AMR_COLS) * Math.PI * 2, cx = Math.cos(a) * cr, cz = Math.sin(a) * cr
    prism(out, cx, cz, y0, y0 + 0.35, AMR_COL_R * 1.5, 4, stone, STU, AMR_COL_R * 1.4)
    prism(out, cx, cz, y0 + 0.35, y0 + AMR_COL_H - 0.35, AMR_COL_R, 12, pale, STU, AMR_COL_R * 0.84)
    prism(out, cx, cz, y0 + AMR_COL_H - 0.35, y0 + AMR_COL_H, AMR_COL_R * 0.95, 8, pale, STU, AMR_COL_R * 1.35)
    prism(out, cx, cz, y0 + AMR_COL_H, y0 + AMR_COL_H + 0.08, AMR_COL_R * 1.5, 4, pale, STU, AMR_COL_R * 1.5)
  }
  // entablature ring: architrave+frieze drum and a cornice
  const ye = y0 + AMR_COL_H + 0.08
  prism(out, 0, 0, ye, ye + AMR_ENTAB, R * 0.95, seg, pale, STU, R * 0.95)
  prism(out, 0, 0, ye + AMR_ENTAB, ye + AMR_ENTAB + 0.18, R * 1.04, seg, stone, STU, R * 1.04)
  prism(out, 0, 0, ye + AMR_ENTAB + 0.18, ye + AMR_ENTAB + 0.3, R * 0.98, seg, dark, MET, R * 0.98)
  // ribbed lead dome, stacked rings on a quarter-ellipse profile with a finial
  const yd = ye + AMR_ENTAB + 0.3
  for (let k = 0; k < AMR_DOME_RINGS; k++) {
    const t0 = k / AMR_DOME_RINGS, t1 = (k + 1) / AMR_DOME_RINGS
    const r0 = R * 0.98 * Math.cos(t0 * Math.PI / 2), r1 = R * 0.98 * Math.cos(t1 * Math.PI / 2)
    prism(out, 0, 0, yd + AMR_DOME_H * Math.sin(t0 * Math.PI / 2), yd + AMR_DOME_H * Math.sin(t1 * Math.PI / 2), r0, 20, lead, MET, Math.max(r1, 0.12))
  }
  const yt = yd + AMR_DOME_H
  prism(out, 0, 0, yt, yt + 0.25, 0.28, 10, dark, MET, 0.18)
  prism(out, 0, 0, yt + 0.25, yt + AMR_FINIAL_H, 0.1, 8, dark, MET, 0.03)
}

// Hôtel du Grand Orient de France, 16 rue Cadet (9e): a Haussmann-height block whose street front is a bowed screen of silver fluted
// fins over a glazed shopfront (Commons 'P1280244 Paris IX rue Cadet N16 rwk'). Outward normal of the street edge in the fit frame (the fit turns the model so its front is local -z).
const GOF_FRONT: [number, number] = [0, -1]
const GOF_H = 24            // eaves height of the block, metres
const GOF_SHOP_H = 4.6      // glazed ground storey
const GOF_FINS = 22         // fluted fins across the front
const GOF_FIN_FILL = 0.74   // fin width / pitch (the rest is the dark glazed slot)
const GOF_BOW = 1.5         // how far the screen bellies out at its middle, metres
const GOF_FLARE = 0.9       // extra outward lean at the top
const GOF_MULLION = 1.6     // shopfront mullion pitch
export function hotelGrandOrient(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cbc3ae'), roofc = hex('#8d8e8c'), alu = hex('#c9ced3'), aluD = hex('#a9afb6'), glass = hex('#2a3238'), dark = hex('#1d2124'), frame = hex('#3a3f44')
  const STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const r0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < r0.length; i++) { const p = r0[i]!, q = r0[(i + 1) % r0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...r0].reverse() : r0
  const n = ring.length
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  const fl = Math.hypot(GOF_FRONT[0], GOF_FRONT[1]), nx = GOF_FRONT[0] / fl, nz = GOF_FRONT[1] / fl, ex = -nz, ez = nx
  let dmax = -Infinity
  for (const p of ring) dmax = Math.max(dmax, p.x * nx + p.z * nz)
  let u0 = Infinity, u1 = -Infinity
  for (const p of ring) if (p.x * nx + p.z * nz > dmax - 2.5) { const u = p.x * ex + p.z * ez; u0 = Math.min(u0, u); u1 = Math.max(u1, u) }
  const span = u1 - u0
  const W = (u: number, y: number, d: number): V3 => [ex * u + nx * (dmax + d), y, ez * u + nz * (dmax + d)]
  // side and rear walls in pale stone, flat zinc roof
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, l = Math.hypot(q.x - p.x, q.z - p.z)
    if (l < 0.05) continue
    quad([[p.x, 0, p.z], [q.x, 0, q.z], [q.x, GOF_H, q.z], [p.x, GOF_H, p.z]], [(q.z - p.z) / l, 0, -(q.x - p.x) / l], stone, STU)
  }
  capPolygon(out, ring, GOF_H, roofc, MET)
  if (span < 2) return
  const o: V3 = [nx, 0, nz]
  const bow = (t: number): number => GOF_BOW * (1 - (2 * t - 1) ** 2)
  const F = (a: number, b: number, y0: number, y1: number, d0: number, d1: number, col: V3, tag: number, flare = 0): void => {
    const f = (y: number): number => flare * ((y - GOF_SHOP_H) / (GOF_H - GOF_SHOP_H))
    quad([W(u0 + a * span, y0, d0 + f(y0)), W(u0 + b * span, y0, d1 + f(y0)), W(u0 + b * span, y1, d1 + f(y1)), W(u0 + a * span, y1, d0 + f(y1))], o, col, tag)
  }
  // glazed shopfront: dark base wall, glass between slim mullions, transom band
  F(0, 1, 0, GOF_SHOP_H, 0.02, 0.02, glass, 0)
  F(0, 1, GOF_SHOP_H - 0.5, GOF_SHOP_H, 0.06, 0.06, dark, MET)
  F(0, 1, 0, 0.5, 0.06, 0.06, dark, MET)
  const nm = Math.max(2, Math.round(span / GOF_MULLION))
  for (let k = 0; k <= nm; k++) {
    const t = k / nm, a = Math.max(0, t - 0.5 / span), b = Math.min(1, t + 0.5 / span)
    F(a, b, 0, GOF_SHOP_H, 0.07, 0.07, frame, MET)
  }
  // the silver screen: dark slot behind, fluted fins on top, each fin a pair of facets so the flutes catch light
  F(0, 1, GOF_SHOP_H, GOF_H, 0.02, 0.02, glass, 0)
  for (let k = 0; k < GOF_FINS; k++) {
    const ta = k / GOF_FINS, tb = (k + GOF_FIN_FILL) / GOF_FINS, tm = (ta + tb) / 2
    const da = bow(ta) + 0.1, db = bow(tb) + 0.1, dm = bow(tm) + 0.1 + 0.08
    F(ta, tm, GOF_SHOP_H, GOF_H, da, dm, alu, MET, GOF_FLARE)
    F(tm, tb, GOF_SHOP_H, GOF_H, dm, db, aluD, MET, GOF_FLARE)
  }
  // projecting sill over the shopfront and a thin parapet cap
  F(0, 1, GOF_SHOP_H, GOF_SHOP_H + 0.25, 0.3, 0.3, dark, MET)
}

// ───────────────────────────── Immeuble de la Société théosophique, 4 square Rapp (7e, way/69073401) ─────────────────────────────
// Not no. 3 (Lavirotte). Commons 'Immeuble de la Société théosophique, Paris 7e 001' and 'Immeuble Société Théosophique … 2'
// (docs/landmarks/refs/worship/theosophique-*): a 1920s street front of ochre brick laid with a lozenge pattern of paler brick
// over a cream stone base; a tall pointed-arch window with tracery in a moulded stone surround; a slim corner turret on
// corbels with a conical slate cap; arched windows with small iron balconies; a slate mansard with brick dormers.
// The street (square Rapp, a cul-de-sac N of the building) is the straight ~22 m chain of edges facing local +z.
const THS_STREET_X = 0
const THS_STREET_Z = -1
const THS_EAVES = 17.8         // cornice height
const THS_MANSARD = 4.2        // mansard rise
const THS_MANSARD_K = 0.88     // mansard top ring: footprint scaled towards its centroid
const THS_BASE_H = 4.4         // cream stone base
const THS_STOREY = 2.9
const THS_WIN_Y0 = 5.4         // first upper window sill
const THS_WIN_PITCH = 2.7
const THS_WIN_W = 1.0
const THS_WIN_H = 1.9
const THS_LOZ = 1.25           // lozenge pitch on the front
const THS_ARCH_S = 0.62        // great window centre along the front chain (fraction)
const THS_ARCH_W = 4.6
const THS_ARCH_Y0 = 4.6
const THS_ARCH_YS = 7.0        // springing
const THS_TURRET_S = 0.27      // turret position along the chain (fraction)
const THS_TURRET_R = 0.95
const THS_DOOR_S = 0.1         // entrance bay west of the turret (fraction)
const THS_DORMER_PITCH = 3.0

export function immeubleTheosophique(out: MeshBuilder, fit: Fit): void {
  const brick = hex('#bf6a3a'), loz = hex('#e2b183'), stone = hex('#d8cdb2'), stoneD = hex('#b9ad92'), glass = hex('#35404c'),
    slate = hex('#55595f'), dormer = hex('#c0693a'), dark = hex('#2e2219'), gold = hex('#c9a24a'), iron = hex('#26272a'), chim = hex('#a95b36')
  const BRK = surfaceTag('brick'), STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x / n; cz += p.z / n }
  const inset = ring.map((p) => ({ x: cx + (p.x - cx) * THS_MANSARD_K, z: cz + (p.z - cz) * THS_MANSARD_K }))
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // the street chain: the edge with most length facing the street, grown along while it stays straight
  let bi = 0, bs = -1
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    const d = ((q.z - p.z) * THS_STREET_X - (q.x - p.x) * THS_STREET_Z) / L
    const s = d > 0.5 ? L * d : 0
    if (s > bs) { bs = s; bi = i }
  }
  const dirOf = (i: number): [number, number] => {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z) || 1
    return [(q.x - p.x) / L, (q.z - p.z) / L]
  }
  const d0 = dirOf(bi)
  let a = bi, b = bi
  for (let k = 0; k < n; k++) { const j = (a + n - 1) % n, dj = dirOf(j); if (dj[0] * d0[0] + dj[1] * d0[1] > 0.995 && j !== b) a = j; else break }
  for (let k = 0; k < n; k++) { const j = (b + 1) % n, dj = dirOf(j); if (dj[0] * d0[0] + dj[1] * d0[1] > 0.995 && j !== a) b = j; else break }
  const inChain = (i: number): boolean => { let j = a; for (let k = 0; k < n; k++) { if (j === i) return true; if (j === b) return false; j = (j + 1) % n } return false }
  const P = ring[a]!, Q = ring[(b + 1) % n]!

  // a wall frame: u along p→q, outward normal o; F lays a layer d proud of the wall, T(s, y, d) a point
  const frame = (p: { x: number; z: number }, q: { x: number; z: number }) => {
    const L = Math.hypot(q.x - p.x, q.z - p.z), ux = (q.x - p.x) / L, uz = (q.z - p.z) / L
    const o: V3 = [uz, 0, -ux]
    const T = (s: number, y: number, d: number): V3 => [p.x + ux * s + o[0] * d, y, p.z + uz * s + o[2] * d]
    const F = (s0: number, s1: number, y0: number, y1: number, d: number, col: V3, tag = 0): void =>
      quad([T(s0, y0, d), T(s1, y0, d), T(s1, y1, d), T(s0, y1, d)], o, col, tag)
    return { L, o, T, F }
  }
  const windows = (fr: ReturnType<typeof frame>, s0: number, s1: number, skip: (s: number) => boolean): void => {
    for (let s = s0 + THS_WIN_PITCH / 2; s < s1 - THS_WIN_W; s += THS_WIN_PITCH) {
      if (skip(s)) continue
      for (let k = 0; THS_WIN_Y0 + k * THS_STOREY + THS_WIN_H < THS_EAVES - 0.4; k++) {
        const y = THS_WIN_Y0 + k * THS_STOREY
        fr.F(s - THS_WIN_W / 2 - 0.12, s + THS_WIN_W / 2 + 0.12, y - 0.1, y + THS_WIN_H + 0.12, 0.05, stone, STU)
        fr.F(s - THS_WIN_W / 2, s + THS_WIN_W / 2, y, y + THS_WIN_H, 0.09, glass)
        fr.F(s - THS_WIN_W / 2 - 0.08, s + THS_WIN_W / 2 + 0.08, y + 0.35, y + 0.45, 0.2, iron, MET)   // balcony rail
      }
    }
  }
  // 1 · walls: the other edges in plain brick over a stone base; the chain handled below
  for (let i = 0; i < n; i++) {
    if (inChain(i)) continue
    const p = ring[i]!, q = ring[(i + 1) % n]!, fr = frame(p, q)
    if (fr.L < 0.05) continue
    fr.F(0, fr.L, 0, THS_EAVES, 0, brick, BRK)
    fr.F(0, fr.L, 0, THS_BASE_H, 0.06, stone, STU)
    fr.F(0, fr.L, THS_EAVES - 0.4, THS_EAVES, 0.22, stone, STU)
    if (fr.L > 3) windows(fr, 0, fr.L, () => false)
  }
  // 2 · the street front
  const fc = frame(P, Q), LCf = fc.L
  fc.F(0, LCf, 0, THS_EAVES, 0, brick, BRK)
  const winS = (s: number, y: number): boolean => {            // does a window stand here (to keep lozenges off the glass)?
    for (let sx = THS_WIN_PITCH / 2; sx < LCf - THS_WIN_W; sx += THS_WIN_PITCH) {
      if (Math.abs(s - sx) < THS_WIN_W / 2 + 0.3) for (let k = 0; THS_WIN_Y0 + k * THS_STOREY + THS_WIN_H < THS_EAVES - 0.4; k++) {
        const yy = THS_WIN_Y0 + k * THS_STOREY
        if (y > yy - 0.4 && y < yy + THS_WIN_H + 0.4) return true
      }
    }
    return false
  }
  const sArch = THS_ARCH_S * LCf, sTur = THS_TURRET_S * LCf, sDoor = THS_DOOR_S * LCf
  const inArch = (s: number, y: number): boolean => Math.abs(s - sArch) < THS_ARCH_W / 2 + 0.9 && y < THS_ARCH_YS + 5.5 && y > THS_ARCH_Y0 - 0.3
  const nearTur = (s: number): boolean => Math.abs(s - sTur) < THS_TURRET_R + 0.5
  // lozenges: a pale diamond in every other lattice cell
  for (let j = 0, y = THS_BASE_H + 0.9; y < THS_EAVES - 1; j++, y += THS_LOZ * 0.5) {
    for (let s = THS_LOZ * (j % 2 ? 0.5 : 1) ; s < LCf - 0.6; s += THS_LOZ) {
      if (winS(s, y) || inArch(s, y) || nearTur(s)) continue
      const h = THS_LOZ * 0.28
      quad([fc.T(s - h, y, 0.03), fc.T(s, y - h, 0.03), fc.T(s + h, y, 0.03), fc.T(s, y + h, 0.03)], fc.o, loz, BRK)
    }
  }
  // stone base, plinth lines, cornice, stringcourse
  fc.F(0, LCf, 0, THS_BASE_H, 0.1, stone, STU)
  for (let y = 0.7; y < THS_BASE_H; y += 0.7) fc.F(0, LCf, y - 0.015, y + 0.015, 0.115, stoneD, STU)
  fc.F(0, LCf, THS_BASE_H, THS_BASE_H + 0.3, 0.2, stone, STU)
  fc.F(0, LCf, THS_EAVES - 0.45, THS_EAVES, 0.3, stone, STU)
  fc.F(0, LCf, THS_EAVES - 0.9, THS_EAVES - 0.5, 0.15, stoneD, STU)
  windows(fc, 0, LCf, (s) => Math.abs(s - sArch) < THS_ARCH_W / 2 + 0.9 || nearTur(s))
  // ground storey: small arched lights under the great window and an entrance bay beside the turret
  for (const sw of [-1.4, -0.7, 0.7, 1.4]) {
    const s = sArch + sw * 1.1
    fc.F(s - 0.4, s + 0.4, 1.9, 3.5, 0.14, glass)
    fc.F(s - 0.5, s + 0.5, 3.5, 3.6, 0.16, stoneD, STU)
  }
  fc.F(sDoor - 1.1, sDoor + 1.1, 0, 3.1, 0.14, dark)
  fc.F(sDoor - 1.3, sDoor + 1.3, 3.1, 3.4, 0.18, stoneD, STU)
  fc.F(sDoor - 1.0, sDoor + 1.0, 3.55, 4.05, 0.16, gold, MET)             // name board
  fc.F(sArch - 1.4, sArch + 1.4, 0, 2.7, 0.14, dark)                     // second door
  fc.F(sArch - 1.4, sArch + 1.4, 2.7, 2.8, 0.18, gold, MET)
  // the pointed great window in a moulded surround
  const pointed = (w: number, y0: number, ys: number, d: number, col: V3, tag: number): void => {
    const M = 12
    const top = (x: number): number => ys + Math.sqrt(Math.max(w * w - (Math.abs(x) + w / 2) ** 2, 0))
    for (let i = 0; i < M; i++) {
      const xa = -w / 2 + (w * i) / M, xb = -w / 2 + (w * (i + 1)) / M
      const ya = Math.min(top(xa), top(xb)) * 0.5 + Math.max(top(xa), top(xb)) * 0.5
      quad([fc.T(sArch + xa, y0, d), fc.T(sArch + xb, y0, d), fc.T(sArch + xb, ya, d), fc.T(sArch + xa, ya, d)], fc.o, col, tag)
    }
  }
  pointed(THS_ARCH_W + 1.6, THS_ARCH_Y0 - 0.5, THS_ARCH_YS - 0.2, 0.12, stone, STU)
  pointed(THS_ARCH_W + 0.7, THS_ARCH_Y0 - 0.3, THS_ARCH_YS - 0.1, 0.17, stoneD, STU)
  pointed(THS_ARCH_W, THS_ARCH_Y0, THS_ARCH_YS, 0.22, glass, 0)
  for (const f of [-0.5, -0.17, 0.17, 0.5]) {                              // tracery mullions
    const s = sArch + f * THS_ARCH_W * 0.5 * (Math.abs(f) > 0.3 ? 1.55 : 0.9)
    fc.F(s - 0.05, s + 0.05, THS_ARCH_Y0, THS_ARCH_YS + 2.5 - Math.abs(f) * 4, 0.26, stone, STU)
  }
  fc.F(sArch - THS_ARCH_W / 2, sArch + THS_ARCH_W / 2, THS_ARCH_YS - 0.05, THS_ARCH_YS + 0.05, 0.26, stone, STU)   // transom
  // 3 · the turret on corbels, conical slate cap
  {
    const [tx, , tz] = fc.T(sTur, 0, THS_TURRET_R * 0.45)
    prism(out, tx, tz, THS_BASE_H + 0.6, THS_EAVES + 1.2, THS_TURRET_R, 8, brick, BRK, THS_TURRET_R)
    prism(out, tx, tz, THS_BASE_H - 0.4, THS_BASE_H + 0.6, THS_TURRET_R * 0.7, 8, stone, STU, THS_TURRET_R)
    prism(out, tx, tz, THS_EAVES + 1.0, THS_EAVES + 1.3, THS_TURRET_R * 1.15, 8, stone, STU, THS_TURRET_R * 1.15)
    prism(out, tx, tz, THS_EAVES + 1.3, THS_EAVES + THS_MANSARD + 0.6, THS_TURRET_R * 1.1, 8, slate, MET, 0.05)
    for (let y = THS_WIN_Y0; y < THS_EAVES - 1; y += THS_STOREY) {
      const [wx, , wz] = fc.T(sTur, y, THS_TURRET_R * 0.45 + THS_TURRET_R + 0.04)
      quad([[wx - 0.18, y, wz], [wx + 0.18, y, wz], [wx + 0.18, y + 1.5, wz], [wx - 0.18, y + 1.5, wz]], fc.o, glass, 0)
    }
  }
  // 4 · mansard: a sloping skirt to a flat zinc top, brick dormers on the outward slopes
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, p2 = inset[i]!, q2 = inset[(i + 1) % n]!
    const L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.05) continue
    const o: V3 = [(q.z - p.z) / L, 0.55, -(q.x - p.x) / L]
    const m = Math.hypot(o[0], o[1], o[2])
    const on: V3 = [o[0] / m, o[1] / m, o[2] / m]
    quad([[p.x, THS_EAVES, p.z], [q.x, THS_EAVES, q.z], [q2.x, THS_EAVES + THS_MANSARD, q2.z], [p2.x, THS_EAVES + THS_MANSARD, p2.z]], on, slate, MET)
    if (L < 3.5) continue
    for (let t = THS_DORMER_PITCH * 0.6; t < L - 1; t += THS_DORMER_PITCH) {
      const f = t / L, hx = p.x + (q.x - p.x) * f, hz = p.z + (q.z - p.z) * f, ix = p2.x + (q2.x - p2.x) * f, iz = p2.z + (q2.z - p2.z) * f
      const k = 0.38, ox = hx + (ix - hx) * k - on[0] * 0.5, oz = hz + (iz - hz) * k - on[2] * 0.5
      const ux = (q.x - p.x) / L, uz = (q.z - p.z) / L, y0 = THS_EAVES + THS_MANSARD * k, w = 0.65
      const A: V3 = [ox - ux * w, y0, oz - uz * w], B: V3 = [ox + ux * w, y0, oz + uz * w]
      const nrm: V3 = [on[0], 0, on[2]]
      quad([A, B, [B[0], y0 + 1.55, B[2]], [A[0], y0 + 1.55, A[2]]], nrm, dormer, BRK)
      quad([[A[0] + ux * 0.2 + on[0] * 0.03, y0 + 0.3, A[2] + uz * 0.2 + on[2] * 0.03], [B[0] - ux * 0.2 + on[0] * 0.03, y0 + 0.3, B[2] - uz * 0.2 + on[2] * 0.03],
        [B[0] - ux * 0.2 + on[0] * 0.03, y0 + 1.35, B[2] - uz * 0.2 + on[2] * 0.03], [A[0] + ux * 0.2 + on[0] * 0.03, y0 + 1.35, A[2] + uz * 0.2 + on[2] * 0.03]], nrm, glass, 0)
      const rh = 0.45, ob = -0.9    // pent roof back to the slope
      quad([[A[0] - ux * 0.1, y0 + 1.55, A[2] - uz * 0.1], [B[0] + ux * 0.1, y0 + 1.55, B[2] + uz * 0.1],
        [B[0] + on[2] * 0 + (-on[0]) * 0.9 + ux * 0.1, y0 + 1.55 + rh, B[2] + (-on[2]) * 0.9 + uz * 0.1], [A[0] + (-on[0]) * 0.9 - ux * 0.1, y0 + 1.55 + rh, A[2] + (-on[2]) * 0.9 - uz * 0.1]], [0, 1, 0], slate, MET)
      void ob
    }
  }
  capPolygon(out, inset, THS_EAVES + THS_MANSARD, slate, MET)
  for (const [fx, fz] of [[0.3, 0.2], [-0.2, 0.5], [0.6, -0.3], [-0.5, -0.4]] as [number, number][]) {
    const x = cx + fx * fit.hx * 0.6 * THS_MANSARD_K, z = cz + fz * fit.hz * 0.6 * THS_MANSARD_K
    block(out, x - 0.5, x + 0.5, z - 0.35, z + 0.35, THS_EAVES + THS_MANSARD - 0.1, THS_EAVES + THS_MANSARD + 1.3, chim)
  }
}

// ───────────────────────────── Pagode asiatique rouge (way/1333317934), Parc des Cinq Continents, Levallois ─────────────────────────────
// A small open red-lacquer Chinese pavilion in the park (Adobe Stock 'Parc de la Planchette', Google Images 2026-11-04,
// docs/landmarks/refs/worship/pagode-asiatique-rouge.png): timber deck on a low stone plinth, red columns with a
// rail between them, cross-beams, a two-tier hip roof with upturned eaves. The footprint is about 10 × 7 m.
const PAR_INSET = 0.3         // deck inset from the footprint
const PAR_PLINTH_H = 0.45     // stone plinth
const PAR_COL_H = 3.3         // column height above the deck
const PAR_COL_W = 0.32        // column width
const PAR_COL_PITCH = 2.4     // target column spacing along a side
const PAR_RAIL_Y = 0.9        // low rail height above the deck
const PAR_BEAM_H = 0.55       // eaves beam depth
const PAR_ROOF_OVER = 0.9     // lower roof overhang beyond the columns
const PAR_ROOF_RISE = 1.1     // lower tier rise
const PAR_TIER2_INSET = 0.34  // upper tier base inset fraction of the half-extent
const PAR_TIER2_RISE = 1.3    // upper tier rise
const PAR_CURL = 0.35         // upturn of the eaves tips

export function pagodeAsiatiqueRouge(out: MeshBuilder, fit: Fit): void {
  const red = hex('#b3201a'), redD = hex('#8a1713'), stone = hex('#a8a49a'), deck = hex('#7a5a3c'), tile = hex('#4a4f4a'), gold = hex('#c79b45')
  const x0 = -fit.hx + PAR_INSET, x1 = fit.hx - PAR_INSET, z0 = -fit.hz + PAR_INSET, z1 = fit.hz - PAR_INSET
  block(out, x0, x1, z0, z1, 0, PAR_PLINTH_H, stone)
  block(out, x0 + 0.2, x1 - 0.2, z0 + 0.2, z1 - 0.2, PAR_PLINTH_H, PAR_PLINTH_H + 0.05, deck)
  const yb = PAR_PLINTH_H + 0.05, yt = yb + PAR_COL_H
  const cx0 = x0 + 0.7, cx1 = x1 - 0.7, cz0 = z0 + 0.7, cz1 = z1 - 0.7
  const nx = Math.max(2, Math.round((cx1 - cx0) / PAR_COL_PITCH)), nz = Math.max(1, Math.round((cz1 - cz0) / PAR_COL_PITCH))
  const col = (x: number, z: number): void => block(out, x - PAR_COL_W / 2, x + PAR_COL_W / 2, z - PAR_COL_W / 2, z + PAR_COL_W / 2, yb, yt, red)
  for (let i = 0; i <= nx; i++) { const x = cx0 + ((cx1 - cx0) * i) / nx; col(x, cz0); col(x, cz1) }
  for (let j = 1; j < nz; j++) { const z = cz0 + ((cz1 - cz0) * j) / nz; col(cx0, z); col(cx1, z) }
  // rails and eaves beams round the perimeter
  const ring = (ya: number, yc: number, t: number, c: [number, number, number]): void => {
    block(out, cx0 - t, cx1 + t, cz0 - t, cz0 + t, ya, yc, c); block(out, cx0 - t, cx1 + t, cz1 - t, cz1 + t, ya, yc, c)
    block(out, cx0 - t, cx0 + t, cz0, cz1, ya, yc, c); block(out, cx1 - t, cx1 + t, cz0, cz1, ya, yc, c)
  }
  ring(yb + PAR_RAIL_Y, yb + PAR_RAIL_Y + 0.12, 0.08, redD)
  ring(yt - PAR_BEAM_H, yt, 0.2, redD)
  ring(yt - PAR_BEAM_H - 0.3, yt - PAR_BEAM_H - 0.12, 0.1, gold)
  // two-tier hip roof, eaves curled up by a flared outer skirt
  const rx0 = cx0 - PAR_ROOF_OVER, rx1 = cx1 + PAR_ROOF_OVER, rz0 = cz0 - PAR_ROOF_OVER, rz1 = cz1 + PAR_ROOF_OVER
  block(out, rx0, rx1, rz0, rz1, yt, yt + 0.12, redD)
  const hx = (rx1 - rx0) / 2, hz = (rz1 - rz0) / 2
  roof(out, rx0 - PAR_CURL, rx1 + PAR_CURL, rz0 - PAR_CURL, rz1 + PAR_CURL, yt + 0.12 + PAR_CURL * 0.0, PAR_CURL, PAR_CURL, PAR_CURL, tile)
  roof(out, rx0, rx1, rz0, rz1, yt + 0.12, PAR_ROOF_RISE, hx * PAR_TIER2_INSET * 2 - 0.2 > 0 ? hx * 0.4 : 0.4, hz * 0.4, tile)
  const ux0 = rx0 + hx * 0.4 + 0.2, ux1 = rx1 - hx * 0.4 - 0.2, uz0 = rz0 + hz * 0.4 + 0.2, uz1 = rz1 - hz * 0.4 - 0.2
  const yu = yt + 0.12 + PAR_ROOF_RISE
  block(out, ux0, ux1, uz0, uz1, yu - 0.1, yu + 0.3, redD)
  roof(out, ux0 - 0.35, ux1 + 0.35, uz0 - 0.35, uz1 + 0.35, yu + 0.2, PAR_TIER2_RISE, Math.min((ux1 - ux0) / 2 - 0.1, 1.0) + 0.35, 0.35, tile)
  block(out, (ux0 + ux1) / 2 - 0.08, (ux0 + ux1) / 2 + 0.08, -0.08, 0.08, yu + 0.2 + PAR_TIER2_RISE, yu + 0.2 + PAR_TIER2_RISE + 0.7, gold)
}

// ───────────────────────────── Théâtre de la Tour Eiffel, 3 square Rapp (7e, way/69073411) ─────────────────────────────
// West neighbour of the Société théosophique (shares its west party wall). Owner's Street View (Jul 2022): same style,
// ~6 storeys; cream ashlar ground + first floor with a dark show-banner, brown double doors with diamond glazing under a black
// sign, tall barred arch window, iron-grilled lights; red-and-cream lozenge brick above in stone bands, segmental-arched
// windows with iron balconies on floors 3-4, a big arched window at the west end, cornice, slate mansard with dormers.
// A slim stone oriel column on corbels rises from above the door (east end, against the théosophique) to a pinnacle.
const TTE_EAVES = 18.0         // cornice height
const TTE_MANSARD = 4.0
const TTE_MANSARD_K = 0.88
const TTE_BASE_H = 7.3         // cream stone: ground + first floor
const TTE_WIN_Y0 = 8.4         // first brick-storey window sill
const TTE_STOREY = 2.9
const TTE_WIN_W = 1.05
const TTE_WIN_H = 1.9
const TTE_BAYS = 4             // window bays across the front
const TTE_LOZ = 1.25
const TTE_DOOR_FROM_E = 3.4    // door centre, metres from the east end
const TTE_ARCH_FROM_W = 2.3    // big arched window centre, metres from the west end
const TTE_ORIEL_FROM_E = 1.3   // oriel centre, metres from the east end
const TTE_ORIEL_W = 1.5
const TTE_ORIEL_D = 0.85       // projection
const TTE_ORIEL_Y0 = 4.4       // corbel top
const TTE_DORMER_PITCH = 3.0

export function theatreTourEiffel(out: MeshBuilder, fit: Fit): void {
  const brick = hex('#bf6a3a'), loz = hex('#e2b183'), stone = hex('#d8cdb2'), stoneD = hex('#b9ad92'), glass = hex('#35404c'),
    slate = hex('#55595f'), dormer = hex('#c0693a'), dark = hex('#2e2219'), wood = hex('#5a3a22'), iron = hex('#26272a'),
    black = hex('#15151a'), banner = hex('#3a2a2a'), chim = hex('#a95b36')
  const BRK = surfaceTag('brick'), STU = surfaceTag('stucco'), MET = surfaceTag('metal')
  type V3 = [number, number, number]
  const ring0 = fit.ring ?? [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < ring0.length; i++) { const p = ring0[i]!, q = ring0[(i + 1) % ring0.length]!; area += p.x * q.z - q.x * p.z }
  const ring = area < 0 ? [...ring0].reverse() : ring0
  const n = ring.length
  let cx = 0, cz = 0
  for (const p of ring) { cx += p.x / n; cz += p.z / n }
  const inset = ring.map((p) => ({ x: cx + (p.x - cx) * TTE_MANSARD_K, z: cz + (p.z - cz) * TTE_MANSARD_K }))
  const quad = (p: V3[], o: V3, col: V3, tag: number): void => {
    const ux = p[1]![0] - p[0]![0], uy = p[1]![1] - p[0]![1], uz = p[1]![2] - p[0]![2]
    const vx = p[2]![0] - p[0]![0], vy = p[2]![1] - p[0]![1], vz = p[2]![2] - p[0]![2]
    const c: V3 = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
    const pts = c[0] * o[0] + c[1] * o[1] + c[2] * o[2] > 0 ? [p[3]!, p[2]!, p[1]!, p[0]!] : p
    out.quad(pts, o, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
  }
  // the square Rapp front: the edge facing north (-z) with the most length
  let bi = 0, bs = -1
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, L = Math.hypot(q.x - p.x, q.z - p.z)
    const d = (q.x - p.x) / L
    const s = d > 0.5 ? L * d : 0
    if (s > bs) { bs = s; bi = i }
  }
  const frame = (p: { x: number; z: number }, q: { x: number; z: number }) => {
    const L = Math.hypot(q.x - p.x, q.z - p.z), ux = (q.x - p.x) / L, uz = (q.z - p.z) / L
    const o: V3 = [uz, 0, -ux]
    const T = (s: number, y: number, d: number): V3 => [p.x + ux * s + o[0] * d, y, p.z + uz * s + o[2] * d]
    const F = (s0: number, s1: number, y0: number, y1: number, d: number, col: V3, tag = 0): void =>
      quad([T(s0, y0, d), T(s1, y0, d), T(s1, y1, d), T(s0, y1, d)], o, col, tag)
    return { L, o, T, F, ux, uz }
  }
  // the model frame is turned half a circle from north-up (landmarks.ts fitAt), so s runs EAST -> west along the front
  const fc = frame(ring[bi]!, ring[(bi + 1) % n]!), L = fc.L
  const sDoor = TTE_DOOR_FROM_E, sArch = L - TTE_ARCH_FROM_W, sOr = TTE_ORIEL_FROM_E
  const bayS: number[] = []
  for (let k = 0; k < TTE_BAYS; k++) { const a0 = sOr + TTE_ORIEL_W / 2 + 1.2 + 0.5, a1 = sArch - 2.4; bayS.push(a0 + ((a1 - a0) * k) / Math.max(1, TTE_BAYS - 1)) }
  const onWin = (s: number, y: number): boolean => {
    for (const bs2 of bayS) if (Math.abs(s - bs2) < TTE_WIN_W / 2 + 0.3) for (let k = 0; TTE_WIN_Y0 + k * TTE_STOREY + TTE_WIN_H < TTE_EAVES - 0.4; k++) {
      const yy = TTE_WIN_Y0 + k * TTE_STOREY
      if (y > yy - 0.4 && y < yy + TTE_WIN_H + 0.4) return true
    }
    return Math.abs(s - sArch) < 1.6 && y > TTE_BASE_H - 0.3 && y < TTE_BASE_H + 7.3 || Math.abs(s - sOr) < TTE_ORIEL_W / 2 + 0.5
  }
  // other walls: plain brick on a stone base, a few windows
  for (let i = 0; i < n; i++) {
    if (i === bi) continue
    const p = ring[i]!, q = ring[(i + 1) % n]!, f = frame(p, q)
    if (f.L < 0.05) continue
    f.F(0, f.L, 0, TTE_EAVES, 0, brick, BRK)
    f.F(0, f.L, 0, TTE_BASE_H, 0.06, stone, STU)
    f.F(0, f.L, TTE_EAVES - 0.4, TTE_EAVES, 0.22, stone, STU)
  }
  // front: brick with lozenges
  fc.F(0, L, 0, TTE_EAVES, 0, brick, BRK)
  for (let j = 0, y = TTE_BASE_H + 0.9; y < TTE_EAVES - 1; j++, y += TTE_LOZ * 0.5) {
    for (let s = TTE_LOZ * (j % 2 ? 0.5 : 1); s < L - 0.6; s += TTE_LOZ) {
      if (onWin(s, y)) continue
      const h = TTE_LOZ * 0.28
      quad([fc.T(s - h, y, 0.03), fc.T(s, y - h, 0.03), fc.T(s + h, y, 0.03), fc.T(s, y + h, 0.03)], fc.o, loz, BRK)
    }
  }
  // cream ashlar ground + first floor with courses, string courses, cornice
  fc.F(0, L, 0, TTE_BASE_H, 0.1, stone, STU)
  for (let y = 0.7; y < TTE_BASE_H; y += 0.7) fc.F(0, L, y - 0.015, y + 0.015, 0.115, stoneD, STU)
  fc.F(0, L, TTE_BASE_H, TTE_BASE_H + 0.3, 0.22, stone, STU)
  fc.F(0, L, TTE_EAVES - 0.45, TTE_EAVES, 0.3, stone, STU)
  fc.F(0, L, TTE_EAVES - 0.9, TTE_EAVES - 0.5, 0.15, stoneD, STU)
  for (let k = 1; TTE_WIN_Y0 + k * TTE_STOREY < TTE_EAVES - 1; k++) fc.F(0, L, TTE_WIN_Y0 + k * TTE_STOREY - 0.55, TTE_WIN_Y0 + k * TTE_STOREY - 0.4, 0.14, stone, STU)
  // show-banner across the first floor
  fc.F(sOr + TTE_ORIEL_W / 2 + 0.3, L - 1.0, 4.6, 6.4, 0.14, banner, 0)
  // double doors with diamond glazing under the black sign
  fc.F(sDoor - 1.15, sDoor + 1.15, 0, 3.0, 0.14, wood, STU)
  for (const sd of [-0.55, 0.55]) for (let k = 0; k < 3; k++) fc.F(sDoor + sd - 0.3, sDoor + sd + 0.3, 0.8 + k * 0.7, 1.35 + k * 0.7, 0.17, glass, 0)
  fc.F(sDoor - 1.35, sDoor + 1.35, 3.0, 3.25, 0.18, stoneD, STU)
  fc.F(sDoor - 1.6, sDoor + 1.6, 3.4, 4.2, 0.2, black, MET)
  // tall barred arched window and a grilled light, a diamond stone panel
  const sBar = sDoor + 3.2
  fc.F(sBar - 0.6, sBar + 0.6, 0.9, 3.9, 0.14, glass, 0)
  for (let k = -2; k <= 2; k++) fc.F(sBar + k * 0.22 - 0.025, sBar + k * 0.22 + 0.025, 0.9, 3.9, 0.18, iron, MET)
  fc.F(sBar - 0.7, sBar + 0.7, 3.9, 4.1, 0.16, stoneD, STU)
  fc.F(sBar + 1.1, sBar + 1.9, 1.6, 2.6, 0.14, glass, 0)
  for (let k = 0; k < 3; k++) fc.F(sBar + 1.1 + k * 0.27, sBar + 1.1 + k * 0.27 + 0.03, 1.6, 2.6, 0.18, iron, MET)
  const sDia = sBar + 3.0
  const dia = (s: number, y: number, h: number): void => quad([fc.T(s - h, y, 0.16), fc.T(s, y - h, 0.16), fc.T(s + h, y, 0.16), fc.T(s, y + h, 0.16)], fc.o, stoneD, STU)
  dia(sDia, 2.6, 0.7)
  // first-floor tall arched lights
  for (const s of [bayS[0]!, bayS[Math.floor(TTE_BAYS / 2)]!]) {
    fc.F(s - 0.5, s + 0.5, 4.6 > 0 ? 6.4 : 0, 7.1, 0.14, glass, 0)
  }
  // the big arched window at the west end (right of the viewer), tall across three storeys
  fc.F(sArch - 1.45, sArch + 1.45, TTE_BASE_H + 0.9, TTE_BASE_H + 7.0, 0.12, stone, STU)
  fc.F(sArch - 1.2, sArch + 1.2, TTE_BASE_H + 1.1, TTE_BASE_H + 6.4, 0.18, glass, 0)
  fc.F(sArch - 1.2, sArch + 1.2, TTE_BASE_H + 6.4, TTE_BASE_H + 6.6, 0.2, stoneD, STU)
  for (const f of [-0.4, 0.4]) fc.F(sArch + f * 1.2 - 0.04, sArch + f * 1.2 + 0.04, TTE_BASE_H + 1.1, TTE_BASE_H + 6.4, 0.22, stone, STU)
  // segmental-arched windows with small iron balconies
  for (const s of bayS) for (let k = 0; TTE_WIN_Y0 + k * TTE_STOREY + TTE_WIN_H < TTE_EAVES - 0.4; k++) {
    const y = TTE_WIN_Y0 + k * TTE_STOREY
    fc.F(s - TTE_WIN_W / 2 - 0.12, s + TTE_WIN_W / 2 + 0.12, y - 0.1, y + TTE_WIN_H + 0.14, 0.05, stone, STU)
    fc.F(s - TTE_WIN_W / 2, s + TTE_WIN_W / 2, y, y + TTE_WIN_H, 0.09, glass, 0)
    fc.F(s - TTE_WIN_W / 2 - 0.08, s + TTE_WIN_W / 2 + 0.08, y + 0.35, y + 0.45, 0.2, iron, MET)
  }
  // the oriel column: corbels, four faces, stacked small windows, cornice, pinnacle
  {
    const so = sOr, w = TTE_ORIEL_W / 2, D = TTE_ORIEL_D, top = TTE_EAVES + 1.4
    fc.F(so - w, so + w, TTE_ORIEL_Y0 - 0.7, TTE_ORIEL_Y0, D * 0.4, stoneD, STU)
    fc.F(so - w * 0.7, so + w * 0.7, TTE_ORIEL_Y0 - 1.3, TTE_ORIEL_Y0 - 0.7, D * 0.2, stoneD, STU)
    fc.F(so - w, so + w, TTE_ORIEL_Y0, top, D, stone, STU)
    for (const sg of [-1, 1]) {
      const sx = so + sg * w, a = fc.T(sx, TTE_ORIEL_Y0, 0), b = fc.T(sx, TTE_ORIEL_Y0, D), c2 = fc.T(sx, top, D), d2 = fc.T(sx, top, 0)
      quad([a, b, c2, d2], [fc.ux * sg, 0, fc.uz * sg], stone, STU)
    }
    for (let y = TTE_ORIEL_Y0 + 0.8; y < top - 1.4; y += 1.5) {
      fc.F(so - 0.28, so + 0.28, y, y + 0.9, D + 0.03, glass, 0)
      fc.F(so - 0.36, so + 0.36, y + 0.9, y + 1.0, D + 0.05, stoneD, STU)
    }
    fc.F(so - w - 0.1, so + w + 0.1, top - 0.1, top + 0.15, D + 0.1, stoneD, STU)
    const [px, , pz] = fc.T(so, 0, D * 0.5)
    prism(out, px, pz, top + 0.15, top + 2.0, w * 0.8, 4, slate, MET, 0.05)
  }
  // mansard with brick dormers
  for (let i = 0; i < n; i++) {
    const p = ring[i]!, q = ring[(i + 1) % n]!, p2 = inset[i]!, q2 = inset[(i + 1) % n]!
    const Li = Math.hypot(q.x - p.x, q.z - p.z)
    if (Li < 0.05) continue
    const o: V3 = [(q.z - p.z) / Li, 0.55, -(q.x - p.x) / Li]
    const m = Math.hypot(o[0], o[1], o[2])
    const on: V3 = [o[0] / m, o[1] / m, o[2] / m]
    quad([[p.x, TTE_EAVES, p.z], [q.x, TTE_EAVES, q.z], [q2.x, TTE_EAVES + TTE_MANSARD, q2.z], [p2.x, TTE_EAVES + TTE_MANSARD, p2.z]], on, slate, MET)
    if (Li < 3.5 || i !== bi) continue
    for (let t = TTE_DORMER_PITCH * 0.6; t < Li - 1; t += TTE_DORMER_PITCH) {
      const f = t / Li, hx = p.x + (q.x - p.x) * f, hz = p.z + (q.z - p.z) * f, ix = p2.x + (q2.x - p2.x) * f, iz = p2.z + (q2.z - p2.z) * f
      const k = 0.38, ox = hx + (ix - hx) * k - on[0] * 0.5, oz = hz + (iz - hz) * k - on[2] * 0.5
      const ux = (q.x - p.x) / Li, uz = (q.z - p.z) / Li, y0 = TTE_EAVES + TTE_MANSARD * k, w = 0.65
      const A: V3 = [ox - ux * w, y0, oz - uz * w], B: V3 = [ox + ux * w, y0, oz + uz * w]
      const nrm: V3 = [on[0], 0, on[2]]
      quad([A, B, [B[0], y0 + 1.55, B[2]], [A[0], y0 + 1.55, A[2]]], nrm, dormer, BRK)
      quad([[A[0] + ux * 0.2 + on[0] * 0.03, y0 + 0.3, A[2] + uz * 0.2 + on[2] * 0.03], [B[0] - ux * 0.2 + on[0] * 0.03, y0 + 0.3, B[2] - uz * 0.2 + on[2] * 0.03],
        [B[0] - ux * 0.2 + on[0] * 0.03, y0 + 1.35, B[2] - uz * 0.2 + on[2] * 0.03], [A[0] + ux * 0.2 + on[0] * 0.03, y0 + 1.35, A[2] + uz * 0.2 + on[2] * 0.03]], nrm, glass, 0)
      quad([[A[0] - ux * 0.1, y0 + 1.55, A[2] - uz * 0.1], [B[0] + ux * 0.1, y0 + 1.55, B[2] + uz * 0.1],
        [B[0] - on[0] * 0.9 + ux * 0.1, y0 + 2.0, B[2] - on[2] * 0.9 + uz * 0.1], [A[0] - on[0] * 0.9 - ux * 0.1, y0 + 2.0, A[2] - on[2] * 0.9 - uz * 0.1]], [0, 1, 0], slate, MET)
    }
  }
  capPolygon(out, inset, TTE_EAVES + TTE_MANSARD, slate, MET)
  for (const [fx, fz] of [[0.3, 0.2], [-0.2, 0.5], [0.0, -0.3]] as [number, number][]) {
    const x = cx + fx * fit.hx * 0.6 * TTE_MANSARD_K, z = cz + fz * fit.hz * 0.6 * TTE_MANSARD_K
    block(out, x - 0.5, x + 0.5, z - 0.35, z + 0.35, TTE_EAVES + TTE_MANSARD - 0.1, TTE_EAVES + TTE_MANSARD + 1.3, chim)
  }
  void dark
}
