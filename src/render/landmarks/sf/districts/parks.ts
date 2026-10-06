/**
 * Golden Gate Park and the Presidio: "Golden Gate Park is FULL of plants, with just a few big buildings in the
 * park" (project owner). Almost none of these are footprint-extrusions — the shape IS the point (a dome, an
 * undulating green roof, a windmill's sails, a bandshell's colonnade) — so most are hand-built on the shared
 * parts rather than a recipe.
 */
import { capPolygon, MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { tower, towerRing, insetRing } from '../../tower.ts'
import { boxAlong, edgeAt, edgeFacing, arcade, roundRing } from '../../parts.ts'
import { beam } from '../golden-gate.ts'
import { calAcademy } from '../cal-academy.ts'

/**
 * `strut`/`beam` (models.ts/golden-gate.ts) pick their own cross-section axes from the beam's direction: when
 * the beam is near-vertical the wide axis lands in X and the thin axis in Z, but when the beam is more
 * horizontal that flips — the wide axis lands in Z (depth, out of the sail's plane) and the thin axis in Y
 * (vertical). Passed a fixed (wide, thin) pair, a windmill sail pointing sideways from the hub therefore comes
 * out as a flat plank bulging toward the camera instead of a blade standing in the vertical plane — this was
 * bug #(see BUGS.md). `orientedBeam` swaps the two arguments for the more-horizontal beams so `wide` always
 * ends up in-plane (spanning the sail's face) and `thin` always ends up along Z (the sail's paper-thin depth).
 */
function orientedBeam(out: MeshBuilder, a: [number, number, number], b: [number, number, number], wide: number, thin: number, colour: Rgb): void {
  const dy = Math.abs(b[1] - a[1])
  const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const vertical = d < 1e-6 || dy / d > 0.98
  beam(out, a, b, vertical ? wide : thin, vertical ? thin : wide, colour)
}

const centroidP2 = (ring: { x: number; z: number }[]): { x: number; z: number } =>
  ring.reduce((a, p) => ({ x: a.x + p.x / ring.length, z: a.z + p.z / ring.length }), { x: 0, z: 0 })

/** Uniform scale of `ring` toward its own centroid by `k` (1 = unchanged, <1 = smaller) — a TRUE proportional
 * shrink, unlike `insetRing`'s constant-distance one, so a ring built this way from a base ring gives a
 * dead-straight taper with no per-tier stepping when the two are joined by `frustumBand`. */
function scaleRing(ring: { x: number; z: number }[], k: number): { x: number; z: number }[] {
  const c = centroidP2(ring)
  return ring.map((p) => ({ x: c.x + (p.x - c.x) * k, z: c.z + (p.z - c.z) * k }))
}

/** One tapering band of wall between two same-length rings at different heights and (generally) different
 * radii — a smooth cone frustum, not a stack of stepped cylinders. Also used, ring-widening, for the cap's
 * overhang. This is `tower.ts`'s own (unexported) `frustum` helper, copied rather than exported for one caller. */
function frustumBand(out: MeshBuilder, ring0: { x: number; z: number }[], y0: number, ring1: { x: number; z: number }[], y1: number, colour: Rgb, tag: number): void {
  for (let i = 0; i < ring0.length; i++) {
    const j = (i + 1) % ring0.length
    const a = ring0[i]
    const b = ring0[j]
    const e = { x: b.x - a.x, z: b.z - a.z }
    const L = Math.hypot(e.x, e.z) || 1
    const up = Math.max(0.2, (y1 - y0) / Math.max(0.5, Math.hypot(ring1[i].x - a.x, ring1[i].z - a.z)))
    const n: [number, number, number] = [e.z / L, 1 / up, -e.x / L]
    const nl = Math.hypot(n[0], n[1], n[2]) || 1
    out.quad(
      [[a.x, y0, a.z], [b.x, y0, b.z], [ring1[j].x, y1, ring1[j].z], [ring1[i].x, y1, ring1[i].z]],
      [n[0] / nl, n[1] / nl, n[2] / nl], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, tag,
    )
  }
}

/** A simple cone from `ring` at `y0` up to a point above its centroid at `y1` — the windmill cap's tip. Each
 * face is a degenerate quad (its top two corners collapsed onto the apex): `frustumBand` with `ring1`
 * replaced by the repeated apex. */
function frustumCap(out: MeshBuilder, ring: { x: number; z: number }[], y0: number, y1: number, colour: Rgb, tag: number): void {
  const c = centroidP2(ring)
  const apex = ring.map(() => c)
  frustumBand(out, ring, y0, apex, y1, colour, tag)
}

/**
 * A smock-mill tower: a round tower tapering in ONE continuous straight cone from base to gallery (no
 * stepped tiers — `frustumBand` between a base ring and a proportionally-scaled top ring), a thin, DARK,
 * near-flush gallery deck where the cap meets the shaft, and a broad dark cap standing proud of the shaft —
 * flared out wider than the tower first (the boat-like overhang in the reference photo), then tapered to a
 * point. Returns the hub position for `sailAssembly` to mount on: at gallery height, out in front of the cap.
 */
function smockTower(height: number, capHeight: number, taper: number, wall: Rgb, capColour: Rgb) {
  return (out: MeshBuilder, fit: Fit): { hub: [number, number, number] } => {
    const baseR = Math.min(fit.hx, fit.hz) * 0.95
    const ring0 = roundRing(towerRing(fit), baseR, 8)
    const galleryY = height
    const topRing = scaleRing(ring0, taper)
    const wallTag = surfaceTag('stucco')
    frustumBand(out, ring0, 0, topRing, galleryY, wall, wallTag)
    // the gallery: a thin, dark band standing only slightly proud of the shaft (not a bright overhanging
    // ledge — see BUGS.md #134a/#162 — pale or oversized bands here read as a glowing picket fence)
    const DARK_TIMBER: Rgb = [0.16, 0.14, 0.12]
    const galleryRing = insetRing(topRing, -0.35)
    frustumBand(out, topRing, galleryY, galleryRing, galleryY + 0.15, DARK_TIMBER, surfaceTag('clapboard'))
    frustumBand(out, galleryRing, galleryY + 0.15, galleryRing, galleryY + 0.55, DARK_TIMBER, surfaceTag('clapboard'))
    capPolygon(out, galleryRing, galleryY + 0.55, DARK_TIMBER, surfaceTag('clapboard'))
    // the cap: flares out wider than the gallery (the boat/ogee overhang), then narrows to a point
    const capBaseY = galleryY + 0.55
    const flareRing = scaleRing(galleryRing, 1.4)
    const midRing = scaleRing(galleryRing, 0.85)
    const capTag = surfaceTag('tile')
    frustumBand(out, galleryRing, capBaseY, flareRing, capBaseY + capHeight * 0.18, capColour, capTag)
    frustumBand(out, flareRing, capBaseY + capHeight * 0.18, midRing, capBaseY + capHeight * 0.55, capColour, capTag)
    frustumCap(out, midRing, capBaseY + capHeight * 0.55, capBaseY + capHeight, capColour, capTag)
    const c = centroidP2(galleryRing)
    const hubOut = Math.max(...flareRing.map((p) => Math.hypot(p.x - c.x, p.z - c.z))) + 1.5
    return { hub: [c.x, galleryY + 0.35, c.z + hubOut] }
  }
}

/**
 * Four sails crossed at a hub, each a main spar (`beam`, hub to tip) with ONE crossbar batten near the tip,
 * standing in the vertical plane of constant Z through the hub, swept in a full circle (an arm above the
 * hub, one below, one each side) face-on to a camera looking along Z. The crossbar's offset from the arm's
 * own axis is computed with the PERPENDICULAR unit vector in the X-Y plane, not a fixed Y offset — a fixed Y
 * offset is perpendicular to a sideways arm but nearly PARALLEL to an up/down one, which is what silently
 * turned the up/down sails into bare poles with no crosspiece (BUGS.md #162, round 2).
 */
function sailAssembly(out: MeshBuilder, hub: [number, number, number], armLen: number, spar: number, sparThin: number, _crossAt: number, _crossHalf: number, cross: number, crossThin: number, rpm = 8): void {
  /*
   * The sails TURN (owner, 2026-10-06: "they should really turn"): drawn about the hub at the origin into a builder of
   * their own and handed to the model as a rotor (render/rotors.ts), which spins it about the hub's axis (local +z,
   * the way the cap faces). And each is a LATTICE SAIL now, as the park's mills carry: the whip (the main spar) from
   * the hub to the tip, and from a fifth of the way out a frame of sail bars across it between two rails, a narrow
   * strip on the leading side of the whip and the broad part trailing.
   */
  const sails = new MeshBuilder()
  const O: [number, number, number] = [0, 0, 0]
  const W = armLen * 0.21
  for (const a of [0, 90, 180, 270]) {
    const rad = (a * Math.PI) / 180
    const dx = Math.sin(rad), dy = Math.cos(rad)
    const px = dy, py = -dx    // across the sail, in the plane of the sails
    const P = (along: number, acrossW: number, z = 0): [number, number, number] => [dx * along + px * acrossW * W, dy * along + py * acrossW * W, z]
    orientedBeam(sails, O, P(armLen, 0), spar, sparThin, SAIL_WOOD)
    const r0 = armLen * 0.2
    // the two rails, the leading one close by the whip, the trailing one out at the sail's full width
    orientedBeam(sails, P(r0, -0.28, 0.06), P(armLen, -0.28, 0.06), cross * 1.1, crossThin, SAIL_WOOD)
    orientedBeam(sails, P(r0, 0.72, 0.06), P(armLen, 0.72, 0.06), cross * 1.1, crossThin, SAIL_WOOD)
    // the sail bars, about a metre apart
    const n = Math.max(6, Math.round((armLen - r0) / 1.0))
    for (let k = 0; k <= n; k++) {
      const r = r0 + ((armLen - r0) * k) / n
      orientedBeam(sails, P(r, -0.28, 0.08), P(r, 0.72, 0.08), cross * 0.7, crossThin, SAIL_WOOD)
    }
  }
  // the hub's boss, and the stock it is fixed to
  orientedBeam(sails, [0, 0, -1.2], [0, 0, 0.5], spar * 1.6, spar * 1.6, [0.2, 0.18, 0.16])
  out.rotors.push({ x: hub[0], y: hub[1], z: hub[2], nx: 0, nz: 1, mb: sails, rpm })
}

const WHITE: Rgb = [0.93, 0.92, 0.88]
/** the Conservatory's panes are WHITEWASHED (the shading paint on a Victorian glasshouse): milky white, not clear glass
 *  — drawn as glass they took the sky and the whole house came out blue-grey (views audit, 2026-10-04) */
const SAIL_WOOD: Rgb = [0.58, 0.56, 0.51]
/** pale cream-grey smock-mill stucco (Dutch/Murphy Windmill) — deliberately lighter and greyer than `CREAM`
 * so it reads distinctly against the dark cap and dark sails at any lighting angle. */
const MILL_STUCCO: Rgb = [0.83, 0.8, 0.72]
const MILL_CAP: Rgb = [0.15, 0.14, 0.13]

export const PARKS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** California Academy of Sciences: sf/cal-academy.ts (rebuilt 2026-10-04, the seven hills, portholes, canopy) */
  californiaAcademyOfSciences: calAcademy,

  /**
   * Dutch Windmill (1902/1981) and Murphy Windmill (1907): smock-style windmills at the park's ocean end — a
   * PALE CREAM-GREY tower in ONE continuous taper (no steps) from a wide base to a narrow neck, a thin dark
   * gallery deck where the cap meets the shaft, and a broad, dark, boat-profiled cap standing proud of the
   * shaft, with four sails, EACH SEVERAL TIMES THE TOWER'S DIAMETER, crossed at a hub mounted out in front of
   * the cap and swept in a full circle (up, down, and both sides). Mapillary way/287921407
   * (docs/shots/refs/sf-mapillary/way-287921407-01.jpg) is the reference for all of this — the taper, the
   * gallery, the dark cap, and the huge sails relative to the tower. Murphy is the larger of the two, with
   * even longer sails relative to its (taller) tower. The sails are diagonal beams, not boxes turned to a
   * wall, so `beam` (golden-gate.ts) draws them via `sailAssembly` above.
   */
  dutchWindmill: (() => {
    const tow = smockTower(20, 6, 0.55, MILL_STUCCO, MILL_CAP)
    return (out: MeshBuilder, fit: Fit): void => {
      const cap = tow(out, fit)
      sailAssembly(out, cap.hub, 17, 0.55, 0.14, 14, 1.4, 0.22, 0.1, 9)
    }
  })(),
  murphyWindmill: (() => {
    const tow = smockTower(24, 7, 0.52, MILL_STUCCO, MILL_CAP)
    return (out: MeshBuilder, fit: Fit): void => {
      const cap = tow(out, fit)
      sailAssembly(out, cap.hub, 22, 0.6, 0.16, 18, 1.7, 0.26, 0.12, 7)
    }
  })(),


  /**
   * Spreckels Temple of Music (1900, Reid Brothers): the Music Concourse bandshell, facing EAST across the bowl — a
   * tall central pavilion of Colusa sandstone with a great round arch opening onto the deep stage shell, an attic
   * and pediment over it with statuary, and on either side a curving Corinthian colonnade wing ending in a smaller
   * pavilion. Rebuilt 2026-10-04 (views audit): it was a walled drum, an L of plain stone seen from the Concourse.
   */
  spreckelsTempleOfMusic: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    const e = edgeAt(ring, edgeFacing(ring))
    const st = surfaceTag('ashlar')
    const at = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
    const SHADE: Rgb = [0.22, 0.2, 0.18]
    // warm Colusa sandstone, not the park's pale grey stone (2026-10-05)
    const SAND: Rgb = [0.8, 0.7, 0.55]
    // the central pavilion, set back from the front: a tall block with the arch in it
    const pw = 9, pd = 5, ph = 21
    let [x, z] = at(0, -8)
    boxAlong(out, x, ph / 2, z, pw, ph / 2, pd, e.heading, SAND, st)
    // the arch: a dark opening, square below and round above, a raised surround
    ;[x, z] = at(0, -8 + pd + 0.05)
    boxAlong(out, x, 6.5, z, 5.6, 6.5, 0.05, e.heading, SHADE, 0)
    for (let k = 0; k < 8; k++) {
      const t = (k + 0.5) / 8, w = 5.6 * Math.sqrt(1 - t * t)
      boxAlong(out, x, 13 + t * 5.6, z, w, 5.6 / 16, 0.05, e.heading, SHADE, 0)
    }
    ;[x, z] = at(0, -8 + pd + 0.3)
    boxAlong(out, x, ph - 0.8, z, pw + 0.4, 0.8, 0.3, e.heading, [0.84, 0.81, 0.74], st)
    // the attic's pediment and the statuary group on top
    for (let k = 0; k < 4; k++) {
      ;[x, z] = at(0, -8)
      boxAlong(out, x, ph + 0.4 + k * 0.7, z, pw - k * 1.8, 0.35, pd - 0.5, e.heading, SAND, st)
    }
    ;[x, z] = at(0, -4)
    prism(out, x, z, ph + 3, ph + 5.2, 0.8, 8, [0.8, 0.77, 0.7], st, 0.4)
    // the stage floor in front of the arch, and the two colonnade wings swinging forward to small end pavilions
    ;[x, z] = at(0, -4)
    boxAlong(out, x, 0.6, z, pw - 0.5, 0.6, 3, e.heading, SAND, st)
    for (const s of [-1, 1]) {
      const pts: [number, number][] = []
      for (let k = 0; k <= 6; k++) {
        const a = (k / 6) * (Math.PI / 2.6)
        pts.push(at(s * (pw + 1 + Math.sin(a) * 12), -8 + Math.cos(a) * 0 + (1 - Math.cos(a)) * 10))
      }
      for (let k = 0; k < pts.length; k++) prism(out, pts[k][0], pts[k][1], 0, 7.5, 0.42, 10, SAND, st, 0.36)
      for (let k = 1; k < pts.length; k++) {
        const [ax, az] = pts[k - 1], [bx, bz] = pts[k]
        boxAlong(out, (ax + bx) / 2, 8.1, (az + bz) / 2, 0.6, 0.6, Math.hypot(bx - ax, bz - az) / 2 + 0.4, Math.atan2(bx - ax, bz - az), SAND, st)
      }
      const [ex, ez] = pts[pts.length - 1]
      box(out, ex, 5, ez, 2.2, 5, 2.2, SAND, st)
      prism(out, ex, ez, 10, 11.4, 0.7, 10, [0.8, 0.77, 0.7], st, 0.35)
    }
  },

  /** Presidio Officers' Club (adobe origins, 1930s remodel): white Spanish colonial, arcaded along the front. */
  presidioOfficersClub: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    tower(out, fit, {
      height: 7,
      tiers: [{ to: 1, face: { kind: 'blank', wall: WHITE, material: 'stucco' } }],
      roof: [0.5, 0.3, 0.24],
      crown: { kind: 'hip', height: 2.6, inset: 1, colour: [0.55, 0.32, 0.24], material: 'tile' },
    })
    const front = edgeFacing(ring, 0)
    const e = edgeAt(ring, front)
    arcade(out, e.a, e.b, 0.2, 3.2, Math.max(3, Math.round(e.L / 3.5)), { colour: WHITE, material: 'stucco', depth: 0.5 })
  },
}
