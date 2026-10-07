/**
 * THE SPORTS-PITCH KIT — the drawing half (BUGS.md #214). `city/sports.ts` decides where a court goes and
 * how big it is; this draws it.
 *
 * One part, `court`, covers basketball, four-square, tennis and pickleball — 779 of the 1,421 sports areas
 * in the box, 55%, from a single builder driven by a markings table. Everything here is flat: the surface,
 * the lines, and a very small amount of furniture (net posts, a backboard) standing on it. No reference
 * photographs were needed or used; a tennis court is a tennis court everywhere, and the dimensions are
 * published.
 *
 * **The court is built in its OWN frame and mapped out**: local `lx` runs along the court's length,
 * `lz` across it, both from the centre. That is what keeps the markings table readable — a service line is
 * at 6.40 m from the net, and it says so — and it is what makes orientation a single rotation rather than a
 * property of every line.
 *
 * **Lines are drawn wider than they are.** A tennis line is 50 mm; at rider speed and at the distance a
 * court is usually seen from, 50 mm of white is one fading pixel. They are drawn at 0.10 m, which is the
 * smallest width that survives, and the court reads correctly because the LAYOUT is right even when the
 * stroke is not.
 */
import type { MeshBuilder } from './buildings.ts'
import type { CourtFit, CourtSport } from '../city/sports.ts'
import { box } from './models.ts'
import { FIXED } from './models.ts'
import { playground } from './playground.ts'

type Rgb = [number, number, number]

/** The painted surface, per sport. Asphalt for the park games; the coloured hard court for the net games. */
const SURFACE: Record<CourtSport, Rgb> = {
  tennis: [0.16, 0.33, 0.26],
  pickleball: [0.17, 0.30, 0.42],
  padel: [0.20, 0.45, 0.27],
  american_football: [0.16, 0.35, 0.17],
  basketball: [0.26, 0.28, 0.31],
  four_square: [0.30, 0.31, 0.33],
  volleyball: [0.44, 0.38, 0.30],
  playground: [0.6, 0.3, 0.24],
}
const LINE: Rgb = [0.88, 0.88, 0.85]
const LINE_W = 0.10
/** Above the pitch area's own cap (which sits at 0.02): high enough not to fight it, low enough to drape. */
const SURFACE_Y = 0.035
const LINE_Y = 0.06   // 2.5 cm over the surface: at 1.5 cm the lines shimmered from a distance

/**
 * A court's geometry, in its own frame, mapped into local metres on the way out. Everything below pushes
 * through `quadLocal`/`stripe`, so the whole markings table is written in court coordinates.
 */
function frame(fit: CourtFit): (lx: number, ly: number, lz: number) => [number, number, number] {
  const c = Math.cos(fit.heading)
  const s = Math.sin(fit.heading)
  return (lx, ly, lz) => [fit.x + lx * c - lz * s, ly, fit.z + lx * s + lz * c]
}

function quadLocal(out: MeshBuilder, to: (lx: number, ly: number, lz: number) => [number, number, number],
                   x0: number, z0: number, x1: number, z1: number, y: number, colour: Rgb): void {
  out.quad([to(x0, y, z0), to(x1, y, z0), to(x1, y, z1), to(x0, y, z1)],
    [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, FIXED)
}

/** A painted stripe from (x0,z0) to (x1,z1) in court coordinates, `LINE_W` wide, centred on the line. */
function stripe(out: MeshBuilder, to: (lx: number, ly: number, lz: number) => [number, number, number],
                x0: number, z0: number, x1: number, z1: number, w = LINE_W): void {
  const dx = x1 - x0
  const dz = z1 - z0
  const len = Math.hypot(dx, dz)
  if (len < 1e-3) return
  const hx = (-dz / len) * (w / 2)
  const hz = (dx / len) * (w / 2)
  out.quad([to(x0 + hx, LINE_Y, z0 + hz), to(x0 - hx, LINE_Y, z0 - hz), to(x1 - hx, LINE_Y, z1 - hz), to(x1 + hx, LINE_Y, z1 + hz)],
    [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], LINE, FIXED)
}

/** A rectangle's four sides as stripes. */
function outline(out: MeshBuilder, to: (lx: number, ly: number, lz: number) => [number, number, number],
                 hl: number, hw: number): void {
  stripe(out, to, -hl, -hw, hl, -hw)
  stripe(out, to, -hl, hw, hl, hw)
  stripe(out, to, -hl, -hw, -hl, hw)
  stripe(out, to, hl, -hw, hl, hw)
}

/** An arc of painted line, centred at (cx, cz), from `a0` to `a1` radians (0 = +lx). */
function arc(out: MeshBuilder, to: (lx: number, ly: number, lz: number) => [number, number, number],
             cx: number, cz: number, r: number, a0: number, a1: number, segs: number): void {
  for (let i = 0; i < segs; i++) {
    const t0 = a0 + ((a1 - a0) * i) / segs
    const t1 = a0 + ((a1 - a0) * (i + 1)) / segs
    stripe(out, to, cx + r * Math.cos(t0), cz + r * Math.sin(t0), cx + r * Math.cos(t1), cz + r * Math.sin(t1))
  }
}

/**
 * A net across the court at `lx`, with its posts. Two quads back to back (a `quad` faces one way only) and
 * two thin posts — the whole thing about 30 triangles, which is all a net is worth at the size it is seen.
 */
function net(out: MeshBuilder, to: (lx: number, ly: number, lz: number) => [number, number, number],
             atX: number, half: number, hCentre: number, hPost: number): void {
  const mesh: Rgb = [0.13, 0.14, 0.15]
  const tape: Rgb = [0.85, 0.85, 0.83]
  // the sag: three panels, the middle one lower — a straight net across a court looks like a fence
  const steps = 6
  for (let i = 0; i < steps; i++) {
    const z0 = -half + (2 * half * i) / steps
    const z1 = -half + (2 * half * (i + 1)) / steps
    const t0 = Math.abs(z0) / half
    const t1 = Math.abs(z1) / half
    const y0 = hCentre + (hPost - hCentre) * t0 * t0
    const y1 = hCentre + (hPost - hCentre) * t1 * t1
    for (const n of [[0, 0, 1], [0, 0, -1]] as [number, number, number][]) {
      out.quad([to(atX, 0.02, z0), to(atX, 0.02, z1), to(atX, y1, z1), to(atX, y0, z0)],
        [n[0], n[1], n[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], mesh, FIXED)
      // the white tape along the top, which is most of what is actually visible from a distance
      out.quad([to(atX, y0 - 0.06, z0), to(atX, y1 - 0.06, z1), to(atX, y1, z1), to(atX, y0, z0)],
        [n[0], n[1], n[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], tape, FIXED)
    }
  }
  for (const side of [-1, 1]) {
    const p = to(atX, 0, side * half)
    box(out, p[0], hPost / 2, p[2], 0.06, hPost / 2, 0.06, [0.20, 0.22, 0.24], FIXED)
  }
}

/**
 * A basketball hoop at the baseline `atX` (facing in `dir`): the pole behind the line, the arm, the
 * backboard and the rim. Real dimensions — backboard 1.80 x 1.05, its face 1.20 m inside the baseline, the
 * rim 3.05 m up and 0.45 m in diameter — because they are published and free.
 */
function hoop(out: MeshBuilder, to: (lx: number, ly: number, lz: number) => [number, number, number],
              atX: number, dir: number): void {
  const grey: Rgb = [0.34, 0.36, 0.38]
  const white: Rgb = [0.90, 0.90, 0.88]
  const orange: Rgb = [0.82, 0.36, 0.14]
  /*
   * The FORWARD vector in world metres — the way the board faces. `box()` is axis-aligned in world, so it
   * is only used where the piece is square in plan (the pole); everything with a direction goes through
   * `to()` and gets the court's own rotation, which a rotated court makes very visible.
   */
  const o = to(0, 0, 0)
  const f = to(1, 0, 0)
  const fx = (f[0] - o[0]) * dir
  const fz = (f[2] - o[2]) * dir
  // the pole, 1.2 m behind the baseline, and the arm reaching forward to the board
  const pole = to(atX + dir * 1.2, 0, 0)
  box(out, pole[0], 1.7, pole[2], 0.09, 1.7, 0.09, grey, FIXED)
  for (const n of [[0, 1, 0], [0, -1, 0]] as [number, number, number][]) {
    out.quad([to(atX, 3.35, -0.07), to(atX + dir * 1.2, 3.35, -0.07), to(atX + dir * 1.2, 3.35, 0.07), to(atX, 3.35, 0.07)],
      n, [[0, 0], [1, 0], [1, 1], [0, 1]], grey, FIXED)
  }
  // the backboard: 1.80 x 1.05, its face on the baseline, drawn both sides
  for (const s of [1, -1]) {
    out.quad([to(atX, 2.9, -0.9), to(atX, 2.9, 0.9), to(atX, 3.95, 0.9), to(atX, 3.95, -0.9)],
      [fx * s, 0, fz * s], [[0, 0], [1, 0], [1, 1], [0, 1]], white, FIXED)
  }
  // the rim: a ring of eight short facets at 3.05 m, 0.225 m radius, hung in front of the board
  const cxr = atX - dir * 0.30
  for (let i = 0; i < 8; i++) {
    const t0 = (i / 8) * Math.PI * 2
    const t1 = ((i + 1) / 8) * Math.PI * 2
    const r = 0.225
    const a = to(cxr + r * Math.cos(t0), 3.05, r * Math.sin(t0))
    const b = to(cxr + r * Math.cos(t1), 3.05, r * Math.sin(t1))
    out.quad([[a[0], 3.05, a[2]], [b[0], 3.05, b[2]], [b[0], 3.0, b[2]], [a[0], 3.0, a[2]]],
      [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], orange, FIXED)
  }
}

/**
 * THE MARKINGS TABLE. Every number is the published one, scaled by how much the fit had to shrink the
 * court — so a park half-court a third of the size keeps its key and its arc in proportion instead of
 * getting a full-size key painted over the whole of it.
 */
export function court(out: MeshBuilder, fit: CourtFit, glass?: MeshBuilder): void {
  // a playground is furnished, not painted (render/playground.ts)
  if (fit.sport === 'playground') { playground(out, fit); return }
  const to = frame(fit)
  const hl = fit.len / 2
  const hw = fit.wid / 2
  if (fit.sport === 'padel') { padel(out, glass ?? out, fit, to, hl, hw); return }
  if (fit.sport === 'american_football') { football(out, fit, to, hl, hw); return }
  // the surface itself, a little proud of the pitch area it stands on
  quadLocal(out, to, -hl - 0.25, -hw - 0.25, hl + 0.25, hw + 0.25, SURFACE_Y, SURFACE[fit.sport])

  if (fit.sport === 'tennis' || fit.sport === 'pickleball') {
    const full = fit.sport === 'tennis' ? 23.77 : 13.41
    const k = fit.len / full
    outline(out, to, hl, hw)
    if (fit.sport === 'tennis') {
      // the singles sidelines, the service lines 6.40 m from the net, and the centre service line
      const singles = 4.115 * k
      const svc = 6.40 * k
      stripe(out, to, -hl, -singles, hl, -singles)
      stripe(out, to, -hl, singles, hl, singles)
      stripe(out, to, -svc, -singles, -svc, singles)
      stripe(out, to, svc, -singles, svc, singles)
      stripe(out, to, -svc, 0, svc, 0)
      // the centre marks on the baselines
      for (const s of [-1, 1]) stripe(out, to, s * hl, 0, s * (hl - 0.1 * k), 0)
      net(out, to, 0, hw + 0.914 * k, 0.914 * k, 1.07 * k)
    } else {
      // pickleball: the non-volley zone 2.13 m either side of the net, centre line to the baseline
      const nvz = 2.13 * k
      stripe(out, to, -nvz, -hw, -nvz, hw)
      stripe(out, to, nvz, -hw, nvz, hw)
      stripe(out, to, -hl, 0, -nvz, 0)
      stripe(out, to, hl, 0, nvz, 0)
      net(out, to, 0, hw, 0.864 * k, 0.914 * k)
    }
    return
  }

  if (fit.sport === 'volleyball') {
    outline(out, to, hl, hw)
    const k = fit.len / 18
    stripe(out, to, -3 * k, -hw, -3 * k, hw)
    stripe(out, to, 3 * k, -hw, 3 * k, hw)
    net(out, to, 0, hw + 0.4, 2.35 * k, 2.43 * k)
    return
  }

  if (fit.sport === 'four_square') {
    // the square and its cross — that is the whole game, and four numbered quadrants would not read
    outline(out, to, hl, hw)
    stripe(out, to, 0, -hw, 0, hw)
    stripe(out, to, -hl, 0, hl, 0)
    return
  }

  // ---- basketball
  const k = fit.wid / 15
  outline(out, to, hl, hw)
  const keyHalf = 2.45 * k          // the key is 4.9 m wide
  const keyLen = 5.8 * k            // …and 5.8 m from the baseline to the free-throw line
  const ftR = 1.8 * k
  const arcR = 6.75 * k             // the three-point arc, from a point 1.575 m inside the baseline
  const arcO = 1.575 * k
  const corner = 0.9 * k            // …and its straight section along each sideline
  const ends: number[] = fit.half ? [1] : [-1, 1]
  for (const s of ends) {
    const base = s * hl
    stripe(out, to, base, -keyHalf, base - s * keyLen, -keyHalf)
    stripe(out, to, base, keyHalf, base - s * keyLen, keyHalf)
    stripe(out, to, base - s * keyLen, -keyHalf, base - s * keyLen, keyHalf)
    // the free-throw circle: solid half towards the centre, and the arc back towards the basket
    arc(out, to, base - s * keyLen, 0, ftR, -Math.PI / 2, Math.PI / 2, 8)
    arc(out, to, base - s * keyLen, 0, ftR, Math.PI / 2, (3 * Math.PI) / 2, 8)
    // the three-point line: two straights along the sidelines, then the arc between them
    const cx = base - s * arcO
    const zEnd = Math.min(hw - corner, arcR * 0.999)
    const aEnd = Math.asin(zEnd / arcR)
    // where the arc meets the straight, measured back from the arc's centre towards the basket
    const xArc = cx - s * arcR * Math.cos(aEnd)
    for (const zs of [-1, 1]) stripe(out, to, base, zs * zEnd, xArc, zs * zEnd)
    const a0 = s > 0 ? Math.PI - aEnd : aEnd
    const a1 = s > 0 ? Math.PI + aEnd : -aEnd
    arc(out, to, cx, 0, arcR, a0, a1, 14)
    // `dir` points OUTWARD, away from the court: the pole stands behind the baseline and the rim hangs
    // back over the key
    hoop(out, to, base, s)
  }
  if (!fit.half) {
    stripe(out, to, 0, -hw, 0, hw)
    arc(out, to, 0, 0, 1.8 * k, 0, Math.PI * 2, 16)
  }
}

/**
 * A PADEL court (owner, 2026-10-06, at Embarcadero Plaza: "the pickleball courts in the plaza are wrapped in glass"):
 * 20 x 10 m of green turf inside its cage — black steel posts every 2 m, glass to 3 m at the ends with mesh above to
 * 4 m, the side walls glass to 3 m for the first 2 m, then to 2 m, then mesh in the middle; the service lines 6.95 m
 * from the net; a tall curved light pole over each corner. The glass and the mesh go to `glass`, which the city draws
 * see-through, so the court and its players show through the walls as they do.
 */
function padel(out: MeshBuilder, glass: MeshBuilder, fit: CourtFit, to: (lx: number, ly: number, lz: number) => [number, number, number],
               hl: number, hw: number): void {
  const k = fit.len / 20
  quadLocal(out, to, -hl, -hw, hl, hw, SURFACE_Y, SURFACE.padel)
  const svc = 6.95 * k
  stripe(out, to, -svc, -hw, -svc, hw)
  stripe(out, to, svc, -hw, svc, hw)
  stripe(out, to, -svc, 0, svc, 0)
  net(out, to, 0, hw, 0.88, 0.92)
  const STEEL: Rgb = [0.07, 0.07, 0.08]
  const GLASS: Rgb = [0.62, 0.78, 0.8]
  const MESH: Rgb = [0.1, 0.1, 0.11]
  // a wall panel from (ax,az) to (bx,bz) between heights y0 and y1, one quad (the see-through material draws both faces)
  const pane = (ax: number, az: number, bx: number, bz: number, y0: number, y1: number, c: Rgb): void => {
    const nx = -(bz - az), nz = bx - ax, L = Math.hypot(nx, nz) || 1
    const [p0, p1, p2, p3] = [to(ax, y0, az), to(bx, y0, bz), to(bx, y1, bz), to(ax, y1, az)]
    const c0 = to(0, 0, 0), cn = to(nx / L, 0, nz / L)
    glass.quad([p0, p1, p2, p3], [cn[0] - c0[0], 0, cn[2] - c0[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
  const post = (lx: number, lz: number, h: number): void => {
    const p = to(lx, 0, lz)
    box(out, p[0], h / 2, p[2], 0.05, h / 2, 0.05, STEEL, FIXED)
  }
  const beam = (ax: number, az: number, bx: number, bz: number, y: number): void => {
    const a = to(ax, y, az), b = to(bx, y, bz)
    const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz)
    const ang = Math.atan2(dz, dx), c = Math.cos(ang), sn = Math.sin(ang), w = 0.04, hgt = 0.04
    const corners = [[-len / 2, -w], [len / 2, -w], [len / 2, w], [-len / 2, w]].map(([u, v]) => [(a[0] + b[0]) / 2 + u * c - v * sn, (a[2] + b[2]) / 2 + u * sn + v * c])
    out.quad(corners.map(([x, z]) => [x, y + hgt, z]) as [number, number, number][], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], STEEL, FIXED)
    for (const sd of [-1, 1]) {
      const [q0, q1] = sd < 0 ? [corners[0], corners[1]] : [corners[2], corners[3]]
      out.quad([[q0[0], y - hgt, q0[1]], [q1[0], y - hgt, q1[1]], [q1[0], y + hgt, q1[1]], [q0[0], y + hgt, q0[1]]], [-sn * sd, 0, c * sd], [[0, 0], [1, 0], [1, 1], [0, 1]], STEEL, FIXED)
    }
  }
  // the ends: glass to 3 m, mesh to 4 m, a post every 2 m
  for (const e of [-1, 1]) {
    const x = e * hl
    pane(x, -hw, x, hw, 0.04, 3, GLASS)
    pane(x, -hw, x, hw, 3, 4, MESH)
    for (let z = -hw; z <= hw + 1e-6; z += 2 * k) post(x, z, 4)
    beam(x, -hw, x, hw, 3)
    beam(x, -hw, x, hw, 4)
  }
  // the sides, in 2 m bays from each end in: [glass top, mesh top] per bay
  const bays: [number, number][] = [[3, 4], [2, 3], [0, 3], [0, 3], [0, 3]]
  for (const sz of [-1, 1]) {
    const z = sz * hw
    for (const e of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const xa = e * (hl - i * 2 * k), xb = e * (hl - (i + 1) * 2 * k)
        const [gTop, mTop] = bays[i]
        // the door gap: the middle bay's outer half on each side, where the players come in
        if (i === 4 && e > 0) { post(xb, z, mTop); continue }
        if (gTop > 0) pane(xa, z, xb, z, 0.04, gTop, GLASS)
        pane(xa, z, xb, z, gTop || 0.04, mTop, MESH)
        post(xa, z, i === 0 ? 4 : bays[i - 1][1])
        beam(xa, z, xb, z, mTop)
        if (gTop > 0) beam(xa, z, xb, z, gTop)
      }
    }
  }
  // the light poles: tall, curving in over each corner
  for (const ex of [-1, 1]) for (const ez of [-1, 1]) {
    const bx = ex * (hl - 3.5 * k), bz = ez * (hw + 0.6)
    const H = 7, R = 1.2
    post(bx, bz, H - R)
    // the arm: a quarter circle from the top of the pole over toward the court
    let prev = to(bx, H - R, bz)
    for (let i = 1; i <= 5; i++) {
      const a = (i / 5) * Math.PI / 2
      const cur = to(bx, H - R + R * Math.sin(a), bz - ez * R * (1 - Math.cos(a)))
      box(out, (prev[0] + cur[0]) / 2, (prev[1] + cur[1]) / 2, (prev[2] + cur[2]) / 2,
        0.05 + Math.abs(cur[0] - prev[0]) / 2, 0.05 + Math.abs(cur[1] - prev[1]) / 2, 0.05 + Math.abs(cur[2] - prev[2]) / 2, STEEL, FIXED)
      prev = cur
    }
    // the lamp head, its face down over the court
    box(out, prev[0], prev[1] - 0.06, prev[2], 0.35, 0.06, 0.2, [0.15, 0.15, 0.16], FIXED)
    box(out, prev[0], prev[1] - 0.13, prev[2], 0.3, 0.01, 0.16, [0.95, 0.95, 0.88], FIXED)
  }
}

/**
 * An AMERICAN FOOTBALL field (owner, 2026-10-06: Galileo High School's field, "add that as a type of court, much larger
 * than the others"): 120 x 53 1/3 yd of turf, the 10-yard end zones in the school's colour, a line every 5 yards, the
 * hash marks between, and a yellow goalpost on each end line.
 */
function football(out: MeshBuilder, fit: CourtFit, to: (lx: number, ly: number, lz: number) => [number, number, number],
                  hl: number, hw: number): void {
  const yd = fit.len / 120
  // (in cells and short pieces, every one draped: a field is 110 m across, and one quad corner to corner cut under the
  //  ground's own rise and fall, where the ground occluder hid it)
  const grid = (x0: number, z0: number, x1: number, z1: number, y: number, c: Rgb): void => {
    const nx = Math.max(1, Math.ceil((x1 - x0) / 6)), nz = Math.max(1, Math.ceil((z1 - z0) / 6))
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      quadLocal(out, to, x0 + ((x1 - x0) * i) / nx, z0 + ((z1 - z0) * j) / nz, x0 + ((x1 - x0) * (i + 1)) / nx, z0 + ((z1 - z0) * (j + 1)) / nz, y, c)
    }
  }
  const line = (x0: number, z0: number, x1: number, z1: number, w = LINE_W): void => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 5))
    for (let i = 0; i < n; i++) stripe(out, to, x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, x0 + ((x1 - x0) * (i + 1)) / n, z0 + ((z1 - z0) * (i + 1)) / n, w)
  }
  // a margin of turf beyond the lines, then the field
  for (const [x0, z0, x1, z1] of [[-hl - 3, -hw - 3, hl + 3, -hw], [-hl - 3, hw, hl + 3, hw + 3], [-hl - 3, -hw, -hl, hw], [hl, -hw, hl + 3, hw]]) grid(x0, z0, x1, z1, SURFACE_Y, [0.15, 0.31, 0.16])
  const END: Rgb = [0.14, 0.2, 0.42]
  grid(-hl + 10 * yd, -hw, hl - 10 * yd, hw, SURFACE_Y, SURFACE.american_football)
  grid(-hl, -hw, -hl + 10 * yd, hw, SURFACE_Y, END)
  grid(hl - 10 * yd, -hw, hl, hw, SURFACE_Y, END)
  line(-hl, -hw, hl, -hw, 0.2); line(-hl, hw, hl, hw, 0.2)
  for (let k = -50; k <= 50; k += 5) {
    const x = k * yd
    line(x, -hw, x, hw, k === 0 || Math.abs(k) === 50 ? 0.2 : 0.14)
  }
  // the hash marks, a yard apart, 70' 9" in from each sideline (high school: 53' 4")
  const hash = hw - 16.26
  for (let k = -49; k <= 49; k++) {
    if (k % 5 === 0) continue
    const x = k * yd
    for (const zs of [-1, 1]) {
      stripe(out, to, x, zs * hash - 0.3, x, zs * hash + 0.3)
      stripe(out, to, x, zs * (hw - 0.3), x, zs * (hw - 0.9))
    }
  }
  // the goalposts: a post behind the end line, the crossbar 3.05 m up, uprights 5.64 m apart and 6 m tall
  const Y: Rgb = [0.95, 0.8, 0.15]
  for (const s of [-1, 1]) {
    const x = s * (hl + 0.6)
    const base = to(x, 0, 0)
    box(out, base[0], 1.52, base[2], 0.1, 1.52, 0.1, Y, FIXED)
    const a = to(x, 3.05, -2.82), b = to(x, 3.05, 2.82)
    const steps = 8
    for (let i = 0; i < steps; i++) {
      const p = to(x, 3.05, -2.82 + (5.64 * (i + 0.5)) / steps)
      box(out, p[0], 3.05, p[2], 0.07 + Math.abs(b[0] - a[0]) / (2 * steps), 0.07, 0.07 + Math.abs(b[2] - a[2]) / (2 * steps), Y, FIXED)
    }
    for (const zs of [-1, 1]) {
      const u = to(x, 0, zs * 2.82)
      box(out, u[0], 3.05 + 3, u[2], 0.06, 3, 0.06, Y, FIXED)
    }
  }
}
