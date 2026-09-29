/**
 * Experiment 13 — the Sonnet custom batch (MODEL-A-BATCH-E13.md).
 *
 * Six buildings the owner's review marked for rebuilding from scratch (verdicts 4 and 5). Production work,
 * kept in the city. Named `e13_<something>`, flat keyspace across the whole city.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { facade, materialColour, materialSurface } from '../../facade.ts'
import { towerRing, faceBand } from '../../tower.ts'
import { edgeAt, longestEdge, boxAlong } from '../../parts.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

export const EXP_13: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * 35182441  kit — The Jay, Autograph Collection. A two-storey Ionic giant order standing over a rusticated
   * ground, an attic storey of small windows above its entablature, and a dentilled cornice under a low
   * parapet. Every part of that is a named slot; nothing here needs a form the kit cannot hold. `on: 'street'`
   * (not the default `'front'`) so the order is drawn on every principal elevation, not just whichever single
   * edge `longestEdge` happens to pick — the first render put the columns on the one edge the fixed camera
   * never sees. Frame 03 of the reference set shows an unrelated glass mid-rise (junk) and was not used.
   */
  e13_theJay_35182441: (out, fit) => {
    facade(out, fit, {
      ground: {
        kind: 'giant-order', columns: 6, storeys: 2, order: 'ionic', windows: 'dressed',
        engaged: false, flanks: false, pediment: false, material: 'limestone', on: 'street',
      },
      shaft: null,
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: null, belowTop: 'string', top: 'dentil' },
      crown: { kind: 'balustrade', height: 1.8, material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 4 },
      material: 'limestone',
    })
  },

  /**
   * 260922316  custom — Hilton San Francisco Financial District. A tall, gently tapering concrete slab whose
   * crown is a jagged, in-and-out zigzag of four stepped notches — not a flat sawtooth silhouette but a
   * profile that steps forward and back in plan as it climbs, which `Crown`'s `sawtooth` (a rim of points at
   * one height) cannot say. The body is vertical concrete piers with punched windows between them.
   */
  e13_hiltonFinancialDistrict_260922316: (out, fit) => {
    const ring = towerRing(fit)
    const wall = materialColour('concrete')
    const tag = surfaceTag(materialSurface('concrete'))
    const crownH = Math.min(14, fit.height * 0.16)
    const bodyH = fit.height - crownH
    // the body: fins face, vertical piers standing proud, punched glass between
    faceBand(out, ring, 0, bodyH, {
      kind: 'fins', wall, glass: [0.16, 0.18, 0.22], floor: 3.2, pitch: 2.6, solid: 0.4, depth: 0.35,
      material: materialSurface('concrete'),
    })
    // the notched crown: on EVERY edge, a short run of merlons that step forward and back as they climb —
    // a zigzag silhouette all round the top, sized to each edge's own length so it never reaches across
    // the whole footprint (the first version used one edge's normal spanning fit.hz and read as a cross
    // punched through the tower, visible from every side rather than sitting on the roofline)
    for (let i = 0; i < ring.length; i++) {
      const e = edgeAt(ring, i)
      if (e.L < 3) continue
      const n = Math.max(2, Math.round(e.L / 5))
      for (let k = 0; k < n; k++) {
        const u0 = (k / n) * e.L
        const u1 = ((k + 1) / n) * e.L
        const mid = (u0 + u1) / 2
        const forward = k % 2 === 0
        const standoff = forward ? 0.5 : 0
        const peakH = crownH * (forward ? 1 : 0.65)
        const cx = e.a.x + e.tx * mid + e.nx * standoff
        const cz = e.a.z + e.tz * mid + e.nz * standoff
        boxAlong(out, cx, bodyH + peakH / 2, cz, (u1 - u0) / 2 - 0.3, peakH / 2, 1.0, e.heading, wall, tag)
      }
    }
    // a low parapet slab under the merlons so the roofline itself reads as closed
    faceBand(out, ring, bodyH, bodyH + crownH * 0.3, { kind: 'blank', wall, material: materialSurface('concrete') })
  },

  /**
   * 32612362  kit — Federal Reserve Bank of San Francisco. A grand giant order (six columns, four storeys)
   * standing over a glazed ground floor, a plain punched shaft above, and a set-back attic. `on: 'street'`
   * for the same reason as The Jay: this is a corner building and the fixed exterior camera does not always
   * land on `longestEdge`'s single pick. Frames 01 and 02 of the reference set show unrelated buildings
   * across the street (junk); only frame 03, looking up Market/Steuart at the granite tower itself, shows
   * this building.
   */
  e13_federalReserveBank_32612362: (out, fit) => {
    facade(out, fit, {
      ground: {
        kind: 'giant-order', columns: 6, storeys: 4, order: 'doric', windows: 'continuous',
        engaged: false, flanks: true, pediment: false, material: 'granite', on: 'street',
      },
      shaft: { storeys: Math.max(1, Math.round((fit.height - 20) / 3.6)), windows: 'balanced', material: 'granite' },
      top: { kind: 'setback', storeys: 1, by: 1.5, material: 'granite' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'cornice' },
      crown: { kind: 'parapet', height: 1.2, material: 'granite' },
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 3 },
      material: 'granite',
    })
  },

  /**
   * 32965865  custom — United States Appraisers Building. Rusticated storeys carried as deep horizontal
   * grooves every course, not `facade()`'s punched-opening rustication, and each principal-storey window
   * carries a small bracketed balconette. Both are named in docs/KIT.md's "what neoclassical still cannot be
   * said" as things no slot draws — the banding and the balconette are the whole identity of this building's
   * base, so they are built by hand; the shaft and crown above are ordinary and go through facade().
   */
  e13_usAppraisersBuilding_32965865: (out, fit) => {
    const ring = towerRing(fit)
    const wall = materialColour('limestone')
    const dark = [wall[0] * 0.82, wall[1] * 0.82, wall[2] * 0.82] as [number, number, number]
    const tag = surfaceTag(materialSurface('limestone'))
    const bandedH = Math.min(fit.height * 0.32, 10)
    // banded rustication: a stack of thin proud courses, alternating a hair forward, round every edge
    const courseH = 0.9
    const n = Math.max(4, Math.round(bandedH / courseH))
    for (let k = 0; k < n; k++) {
      const y0 = k * (bandedH / n)
      const y1 = y0 + bandedH / n
      for (let i = 0; i < ring.length; i++) {
        const e = edgeAt(ring, i)
        const proud = k % 2 === 0 ? 0.12 : 0.0
        boxAlong(out, e.mid.x + e.nx * proud * 0.5, (y0 + y1) / 2, e.mid.z + e.nz * proud * 0.5,
          e.L / 2, (y1 - y0) / 2 - 0.03, 0.15 + proud, e.heading, k % 2 === 0 ? dark : wall, tag)
      }
    }
    // doorways/windows punched through the banded base, each with a small bracketed balconette below the
    // storey above: a shelf on two console brackets standing proud of the wall
    for (let i = 0; i < ring.length; i++) {
      const e = edgeAt(ring, i)
      const bays = Math.max(2, Math.round(e.L / 3.4))
      for (let b = 0; b < bays; b++) {
        const u = ((b + 0.5) / bays) * e.L
        const cx = e.a.x + e.tx * u + e.nx * 0.22
        const cz = e.a.z + e.tz * u + e.nz * 0.22
        // opening
        box(out, cx - e.nx * 0.22, bandedH * 0.45, cz - e.nz * 0.22, 0.7, bandedH * 0.32, 0.05, [0.08, 0.09, 0.1], 0)
        // the balconette: a slab on a single bracket at the sill (kept minimal to stay in budget)
        const sillY = bandedH * 0.78
        boxAlong(out, cx, sillY, cz, 0.6, 0.06, 0.28, e.heading, wall, tag)
        boxAlong(out, cx, sillY - 0.1, cz, 0.4, 0.1, 0.2, e.heading, dark, tag)
      }
    }
    // the rest of the building: an ordinary shaft, cornice and crown through facade(), skipping the ground
    // (already drawn by hand) by giving it a thin plain storey and letting the banded work stand proud of it
    facade(out, fit, {
      ground: { kind: 'plain', storeys: Math.max(1, Math.round(bandedH / 3.6)), material: 'limestone' },
      shaft: { storeys: Math.max(1, Math.round((fit.height - bandedH - 5) / 3.6)), windows: 'balanced', material: 'limestone' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'modillion' },
      crown: { kind: 'parapet', height: 1.2, material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'limestone',
    })
  },

  /**
   * 32863953  custom — San Francisco Federal Building (Morphosis). A thin slab wrapped in an angled,
   * perforated stainless screen that stands forward of, and is partly detached from, the glass curtain wall
   * behind it. No kit slot draws a standoff screen skin, so the screen is a second, leaned wall raised
   * separately from the glass body and left open at the base and along one edge, per the photographs.
   */
  e13_federalBuilding_32863953: (out, fit) => {
    const ring = towerRing(fit)
    const glass = [0.22, 0.26, 0.3] as [number, number, number]
    const screenLight = [0.78, 0.79, 0.78] as [number, number, number]
    const screenDark = [0.58, 0.59, 0.58] as [number, number, number]
    const metalTag = surfaceTag('metal')
    // the glass body, set back — a plain punched/curtain slab, slightly narrower than the fit to leave the
    // screen standing clear of it. Dark glass so it reads as a different material from the pale screen.
    const body = ring.map((p) => ({ x: p.x * 0.88, z: p.z * 0.88 }))
    faceBand(out, body, 0, fit.height, { kind: 'curtain', wall: glass, glass, floor: 4.0, pitch: 1.8, material: 'metal' })
    // the perforated screen: a leaning outer skin standing 1.5–4 m proud of the glass, stopping short of the
    // roofline so the diagrid top of the glass body still shows above it, per the photographs. Alternating
    // light/dark courses stand in for the perforation pattern, which is what tells it apart from a plain
    // metal wall at any distance a rider actually sees it from.
    const i = longestEdge(ring)
    const e = edgeAt(ring, i)
    const lean0 = 1.5
    const lean1 = 4.0
    const screenH = fit.height * 0.82
    const rows = Math.max(8, Math.round(screenH / 3.0))
    for (let r = 0; r < rows; r++) {
      const t = r / rows
      const y0 = t * screenH
      const y1 = y0 + screenH / rows
      const o = lean0 + (lean1 - lean0) * t // leans further out as it climbs
      boxAlong(out, e.mid.x + e.nx * o, (y0 + y1) / 2, e.mid.z + e.nz * o,
        e.L / 2 - 0.4, (y1 - y0) / 2 - 0.06, 0.12, e.heading, r % 2 === 0 ? screenLight : screenDark, metalTag)
    }
    // a few uprights to hint at the screen's own structure, standing between it and the glass
    const posts = 5
    for (let p = 0; p <= posts; p++) {
      const u = (p / posts) * e.L
      const o0 = 0.1
      const o1 = lean0 + (lean1 - lean0) * 0.98
      const cx0 = e.a.x + e.tx * u + e.nx * o0
      const cz0 = e.a.z + e.tz * u + e.nz * o0
      const cx1 = e.a.x + e.tx * u + e.nx * o1
      const cz1 = e.a.z + e.tz * u + e.nz * o1
      out.quad(
        [[cx0, 0, cz0], [cx1, 0, cz1], [cx1, screenH, cz1], [cx0, screenH, cz0]],
        [e.tz, 0, -e.tx], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.4, 0.4, 0.42], metalTag,
      )
    }
  },

  /**
   * 611390934  custom — Park Tower at Transbay. A plain blue-glass curtain tower, but with a diagonal stack
   * of cantilevered notch balconies climbing one corner from about two-thirds height to the top: the depth
   * of the wall changes storey by storey along a diagonal run, which `facade()`'s per-SECTION slots (a whole
   * shaft treated uniformly) cannot express. The body is `facade()`; the notch stack is hand-built after it.
   */
  e13_parkTowerTransbay_611390934: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 1, depth: 1.2, material: 'glass' },
      shaft: { storeys: Math.max(1, Math.round((fit.height - 4) / 3.8)), windows: 'continuous', material: 'glass' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: { kind: 'flat' },
      frame: null,
      entrance: { at: 'corner', kind: 'recessed', steps: 0 },
      material: 'glass',
    })
    const ring = towerRing(fit)
    const wall = [0.55, 0.58, 0.62] as [number, number, number]
    const tag = surfaceTag('metal')
    // the notch stack: starts two-thirds up, climbs to the top, each storey's balcony offset a little further
    // along the edge than the one below — a diagonal run of cantilevered slabs, not a uniform band. Sized
    // as a fraction of the edge's own length/depth so it reads at any real footprint scale, and given a
    // pale metal tone against the dark glass so it is visible rather than lost against the tower. Drawn on
    // every long face, not just `longestEdge`'s single pick — the first render put it on the one edge the
    // fixed exterior camera happened to see edge-on, where a proud slab reads as a sliver rather than a shelf.
    const maxL = Math.max(...ring.map((_, k) => edgeAt(ring, k).L))
    for (let idx = 0; idx < ring.length; idx++) {
      const e = edgeAt(ring, idx)
      if (e.L < maxL * 0.7) continue
      const steps_ = 8
      const startY = fit.height * 0.62
      const stepH = (fit.height - startY) / steps_
      const runStart = e.L * 0.1
      const runSpan = e.L * 0.6
      const depth = Math.max(1.8, fit.hz * 0.35)
      const width = Math.max(2.6, e.L * 0.12)
      for (let k = 0; k < steps_; k++) {
        const y0 = startY + k * stepH
        const u = runStart + (k / (steps_ - 1)) * runSpan
        const cx = e.a.x + e.tx * u + e.nx * (depth / 2)
        const cz = e.a.z + e.tz * u + e.nz * (depth / 2)
        boxAlong(out, cx, y0 + stepH * 0.15, cz, width / 2, 0.1, depth / 2, e.heading, wall, tag)
        // the parapet rail on the cantilevered edge
        boxAlong(out, cx + e.nx * (depth / 2 - 0.03), y0 + stepH * 0.15 + 0.6, cz + e.nz * (depth / 2 - 0.03),
          width / 2, 0.55, 0.04, e.heading, wall, tag)
      }
    }
  },
}
