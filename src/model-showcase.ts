/**
 * One procedural landmark on its own (render/landmarks/procedural.ts), to be judged against its reference
 * photographs before it goes into a city:
 *
 *     ?model=goldenGateBridge          the model on water, in daylight
 *
 * `window.__modelView(alpha, beta, radius, tx, ty, tz)` moves the camera for tools/model-shots.ts, and
 * `window.__rebuild(fit)` builds the model again to a given fit — a real footprint (a tower-grammar building is
 * its own outline raised), which the tool reads from the Overpass cache — and returns its bounds.
 */
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Engine } from '@babylonjs/core/Engines/engine'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { MeshBuilder } from './render/buildings.ts'
import { flatSignMesh } from './render/sign-plates.ts'
import { box } from './render/models.ts'
import { PROCEDURAL } from './render/landmarks/procedural.ts'
import { SF_VEHICLES } from './render/sf/trains.ts'
import { bartEntrance } from './render/sf/furniture.ts'
import { bench } from './render/models.ts'
import { court } from './render/sports.ts'
import { fitCourt, type CourtSport } from './city/sports.ts'
import { cartoonMaterial, updateCartoonEye } from './render/cartoon-material.ts'
import { DAYLIGHT, setTimeOfDay, type TimeOfDay } from './render/facade-material.ts'

export async function modelShowcase(canvas: HTMLCanvasElement, name: string, size: number, time: TimeOfDay = 'day'): Promise<void> {
  // (the hour first: the landmark material reads it when it is made)
  setTimeOfDay(time)
  const engine = new Engine(canvas, true, { antialias: true, preserveDrawingBuffer: true }, true)
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0.6, 0.73, 0.88, 1)
  const sky = new HemisphericLight('sky', new Vector3(0, 1, 0), scene)
  sky.intensity = 0.7
  sky.groundColor = new Color3(0.3, 0.32, 0.34)
  const sun = new DirectionalLight('sun', new Vector3(-0.45, -0.75, 0.5), scene)
  sun.intensity = 1.3
  sun.diffuse = new Color3(1, 0.96, 0.9)
  // a landmark builder, or a vehicle (the rolling stock's models, which take no fit)
  const vehicle = (SF_VEHICLES as Record<string, ((o: MeshBuilder) => void) | undefined>)[name]
  // (and street furniture, drawn in the game's own static material: `?model=bartEntrance`)
  const FURNITURE: Record<string, (o: MeshBuilder) => void> = { bartEntrance, bench }
  /*
   * THE SPORTS COURTS (BUGS.md #214). Each is built on a ROTATED, slightly off-square ring — the polygon a
   * mapper actually draws — rather than an axis-aligned rectangle, because an axis-aligned shot would prove
   * neither of #214's two cautions: that the court is fitted inside the trace with the right proportions,
   * and that its orientation comes from the polygon's longest edge. The ring is drawn too, in white, so a
   * shot shows the court AND the polygon it had to fit in.
   */
  const COURT_RINGS: Record<string, [CourtSport, number, number]> = {
    courtTennis: ['tennis', 24.4, 11.6],
    courtPickleball: ['pickleball', 14.2, 6.8],
    courtBasketball: ['basketball', 18.4, 12.0],
    courtBasketballFull: ['basketball', 29.0, 16.0],
    courtFourSquare: ['four_square', 5.1, 4.9],
    courtVolleyball: ['volleyball', 18.6, 9.4],
  }
  const courtBuild = (spec: [CourtSport, number, number]): ((o: MeshBuilder) => void) => (o) => {
    const [sport, len, wid] = spec
    const ang = 0.7
    const c = Math.cos(ang)
    const sn = Math.sin(ang)
    // one corner pulled in and one edge nudged: a trace, not a CAD drawing
    const ring = ([[-len / 2, -wid / 2], [len / 2 - 0.3, -wid / 2 + 0.2], [len / 2, wid / 2], [-len / 2 + 0.2, wid / 2 - 0.15]] as [number, number][])
      .map(([a, b]) => ({ x: a * c - b * sn, z: a * sn + b * c }))
    for (let i = 0; i < ring.length; i++) {
      const p = ring[i]
      const q = ring[(i + 1) % ring.length]
      const dx = q.x - p.x, dz = q.z - p.z
      const l = Math.hypot(dx, dz)
      const hx = (-dz / l) * 0.06, hz = (dx / l) * 0.06
      o.quad([[p.x + hx, 0.02, p.z + hz], [p.x - hx, 0.02, p.z - hz], [q.x - hx, 0.02, q.z - hz], [q.x + hx, 0.02, q.z + hz]],
        [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.95, 0.95, 0.95], 0)
    }
    const fit = fitCourt(ring, sport)
    if (fit) court(o, fit)
  }
  const build = PROCEDURAL[name] ?? (vehicle ? (o: MeshBuilder) => vehicle(o)
    : COURT_RINGS[name] ? courtBuild(COURT_RINGS[name])
    : FURNITURE[name] ? (o: MeshBuilder) => FURNITURE[name](o) : undefined)
  let mb = new MeshBuilder()
  if (build) build(mb, { hx: size / 2, hz: size / 2, height: size })
  const m = new Mesh(name, scene)
  mb.toVertexData().applyToMesh(m, true)
  /*
   * The model's SIGNS (render/landmarks/signage.ts) are not part of its geometry — they are their own
   * textured, alpha-blended meshes, so that the city can gate them by distance. `?model=` is the cheap way to
   * look at a sign, so it has to raise them exactly as render/landmarks.ts does: parented to the model, no
   * LOD (there is only one thing here and the camera is on top of it).
   */
  let signs: Mesh[] = []
  const raiseSigns = (): number => {
    for (const s of signs) s.dispose()
    signs = mb.signs.flatMap((p) => {
      if (p.spec.type !== 'flat') return []
      const sm = flatSignMesh(scene, p, `sign:${p.spec.text}`)
      if (sm) sm.parent = m
      return sm ? [sm] : []
    })
    // two triangles each, which is the whole point of the flat path
    return signs.length * 2
  }
  let signTris = raiseSigns()
  // vertex colours, the tag in alpha ignored
  // (a BODY-tagged panel — alpha 1 — takes a copy's livery in the game; here a maroon stands in for it)
  if (vehicle) {
    const cols = m.getVerticesData('color')
    if (cols) {
      for (let i = 0; i < cols.length; i += 4) {
        if (cols[i + 3] > 0.9) { cols[i] *= 0.52; cols[i + 1] *= 0.14; cols[i + 2] *= 0.14 }
        cols[i + 3] = 1
      }
      m.setVerticesData('color', cols)
    }
    const mat = new StandardMaterial('model', scene)
    mat.specularColor = new Color3(0.08, 0.08, 0.08)
    m.material = mat
    m.useVertexColors = true
  } else {
    // a landmark in the game's own landmark material: its stone, its surfaces (brick, glass…), its lit windows
    m.material = cartoonMaterial(scene, 'cartoonLandmark', false)
    scene.clearColor = new Color4(DAYLIGHT.horizon.r, DAYLIGHT.horizon.g, DAYLIGHT.horizon.b, 1)
  }
  const g = new MeshBuilder()
  box(g, 0, -0.5, 0, 6000, 0.5, 6000, [0.2, 0.32, 0.4], 0)
  const gm = new Mesh('water', scene)
  g.toVertexData().applyToMesh(gm)
  const gmat = new StandardMaterial('water', scene)
  /*
   * NO SPECULAR. The ground here is a 6 km box, so a specular highlight on it is a huge soft ellipse sitting
   * in the middle of every shot — it appeared in every `?model=` render taken on 2026-09-23 and was mistaken
   * (by me, repeatedly) for a cloud. It is a stage, not water; it should not shine.
   */
  gmat.specularColor = new Color3(0, 0, 0)
  gm.material = gmat
  gm.useVertexColors = true
  const camera = new ArcRotateCamera('cam', -2.2, 1.3, size * 3, new Vector3(0, size * 0.3, 0), scene)
  camera.attachControl(canvas, true)
  camera.minZ = 0.5
  camera.maxZ = 20000
  ;(window as unknown as Record<string, unknown>).__modelView = (alpha: number, beta: number, radius: number, tx = 0, ty = 0, tz = 0) => {
    camera.target = new Vector3(tx, ty, tz); camera.alpha = alpha; camera.beta = beta; camera.radius = radius
  }
  ;(window as unknown as Record<string, unknown>).__modelTris = mb.triangles + signTris
  ;(window as unknown as Record<string, unknown>).__rebuild = (fit: { hx: number; hz: number; height: number; ring?: { x: number; z: number }[] }) => {
    mb = new MeshBuilder()
    if (build) build(mb, fit)
    mb.toVertexData().applyToMesh(m, true)
    signTris = raiseSigns()
    m.refreshBoundingInfo()
    const b = m.getBoundingInfo().boundingBox
    // the signs count: a catalogue that labelled a flat sign "0 tris" would be lying in the useful direction
    const tris = mb.triangles + signTris
    ;(window as unknown as Record<string, unknown>).__modelTris = tris
    const lo = b.minimumWorld.asArray()
    const hi = b.maximumWorld.asArray()
    for (const s of signs) {
      s.refreshBoundingInfo()
      const sb = s.getBoundingInfo().boundingBox
      for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], sb.minimumWorld.asArray()[i]); hi[i] = Math.max(hi[i], sb.maximumWorld.asArray()[i]) }
    }
    return { min: lo, max: hi, triangles: tris }
  }
  /*
   * `window.__rebuildGroup(entries)` — for tools/group-shots.ts. A single `?model=` only ever shows one
   * builder at its own local origin, which is useless for verifying a structure that spans several manifest
   * entries (Embarcadero's four plaza decks, Yerba Buena's terraces): each entry looks fine alone and the
   * whole point is to see whether they AGREE with each other and with the towers between them. This merges
   * several builders' geometry into the one mesh `m` already on stage, each translated by its own (dx, dy,
   * dz) offset from a shared origin — the offsets the tool computes from each entry's own lat/lon, the same
   * way `render/landmarks.ts` places them in the real city. No signs (out of scope for a group check).
   */
  ;(window as unknown as Record<string, unknown>).__rebuildGroup = (
    entries: { model: string; fit: { hx: number; hz: number; height: number; ring?: { x: number; z: number }[] }; dx: number; dy?: number; dz: number }[],
  ) => {
    const merged = new MeshBuilder()
    for (const e of entries) {
      const b = PROCEDURAL[e.model] ?? (FURNITURE[e.model] ? (o: MeshBuilder) => FURNITURE[e.model](o) : undefined)
      if (!b) continue
      const one = new MeshBuilder()
      b(one, e.fit)
      const base = merged.positions.length / 3
      const dx = e.dx
      const dy = e.dy ?? 0
      const dz = e.dz
      for (let i = 0; i < one.positions.length; i += 3) {
        merged.positions.push(one.positions[i] + dx, one.positions[i + 1] + dy, one.positions[i + 2] + dz)
      }
      merged.normals.push(...one.normals)
      merged.uvs.push(...one.uvs)
      merged.colors.push(...one.colors)
      for (const idx of one.indices) merged.indices.push(idx + base)
    }
    mb = merged
    mb.toVertexData().applyToMesh(m, true)
    for (const s of signs) s.dispose()
    signs = []
    m.refreshBoundingInfo()
    const b = m.getBoundingInfo().boundingBox
    const tris = mb.triangles
    ;(window as unknown as Record<string, unknown>).__modelTris = tris
    return { min: b.minimumWorld.asArray(), max: b.maximumWorld.asArray(), triangles: tris }
  }
  engine.runRenderLoop(() => { updateCartoonEye(scene, camera.position); scene.render() })
  addEventListener('resize', () => engine.resize())
  await scene.whenReadyAsync()
  ;(window as unknown as { modelReady?: boolean }).modelReady = true
}
