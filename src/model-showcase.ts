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
import { afficheMeshes } from './render/affiches.ts'
import { amphib, carrier, destroyer, queenMary2 } from './render/sf/big-ships.ts'
import { SF_MOORED, SF_SIZES, sailboat, type SfKind } from './render/sf/moored.ts'
import type { KitArgs } from './render/landmarks/paris/kit/recipes.ts'
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
import { sfFireAlarmBox, nycFireAlarmBox, utilityPole, pathOfGold } from './render/us-furniture.ts'
import { topiaryBall, topiaryBox, topiaryCone, topiaryStandard } from './render/topiary.ts'
import { cobraHeadArm, sfConcreteLight, sfSteelLight, dragonLamp } from './render/sf/street-lights.ts'
import { bench, bikeParking, guimardEntrance, parisEntrance, parisNewsstand } from './render/models.ts'
import { parisStreetModel } from './render/paris/street.ts'
import { cafeBoard, stoneBench, laPosteBox, parisPanel, boxwoodPot, horodateur, jardiniere, parisBench, parisBusStop, parisLamp, parisLampConsole, parisWallLamp, sucette, treePit, wallaceFountain } from './render/paris/furniture.ts'
import { champsElyseesMast, marechauxMast } from './render/paris/famous-lamps.ts'
import { court } from './render/sports.ts'
import { fitCourt, type CourtSport } from './city/sports.ts'
import { cartoonMaterial, updateCartoonEye } from './render/cartoon-material.ts'
import { DAYLIGHT, setTimeOfDay, type TimeOfDay } from './render/facade-material.ts'
import { Water } from './render/water.ts'
import { MOORED, MOORED_SIZES, type MooredKind } from './render/paris/moored.ts'
import { NAMED_BOATS } from './render/paris/named-boats.ts'
import { containerShip, cruiseShip, SHIP_SIZES } from './render/ships.ts'

/** every moored kind at seeds 1–6, and the famous boats at their real sizes (name → L, B) */
const NAMED_SIZES: Record<string, [string, number, number]> = {
  Batofar: ['Le Bateau phare', 41, 7.6], Asile: ['Asile Flottant', 70, 8], PetitBain: ['Petit Bain', 40, 10.5], DameDeCanton: ['La Dame De Canton', 25, 7],
  OffParisSeine: ['Off Paris Seine', 82, 20], Fluctuart: ['Fluctuart', 40, 11.4], AnnetteK: ['Annette K', 108, 16.7], BrigadeFluviale: ['Brigade fluviale', 30, 8],
  CentreDeSecours: ['Centre de Secours La Monnaie', 28, 8], Ilot: ["L'île prairie", 12, 6],
}
const BOAT_MODELS: Record<string, (o: MeshBuilder) => void> = {}
for (const k of Object.keys(MOORED) as MooredKind[]) for (let s = 1; s <= 6; s++) {
  const z = MOORED_SIZES[k]
  BOAT_MODELS[`boat_${k}_${s}`] = (o) => { MOORED[k](o, (z.L[0] + z.L[1]) / 2, z.B, s * 7919) }
}
// the big ships at each size, seeds 1–3: `?model=ship_panamax_2`, `?model=ship_cruiseMega_1`
for (const [k, z] of Object.entries(SHIP_SIZES)) for (let s = 1; s <= 3; s++) {
  BOAT_MODELS[`ship_${k}_${s}`] = (o) => { (k.startsWith('cruise') || k === 'expedition' ? cruiseShip : containerShip)(o, z.L, z.B, s * 7919) }
}
// the Bay's small craft, seeds 1–6: `?model=sf_houseboat_3`, `?model=sf_sailing_2` (sails set)
for (const k of Object.keys(SF_MOORED) as SfKind[]) for (let s = 1; s <= 6; s++) {
  const z = SF_SIZES[k]
  BOAT_MODELS[`sf_${k}_${s}`] = (o) => { SF_MOORED[k](o, z.L[0] + (z.L[1] - z.L[0]) * ((s % 3) / 2), z.B * (k === 'houseboat' ? 0.8 + (s % 3) * 0.2 : 1), s * 7919) }
}
BOAT_MODELS.ship_qm2 = (o) => { queenMary2(o) }
BOAT_MODELS.ship_destroyer = (o) => { destroyer(o) }
BOAT_MODELS.ship_carrier = (o) => { carrier(o) }
BOAT_MODELS.ship_amphib = (o) => { amphib(o) }
for (let s = 1; s <= 6; s++) BOAT_MODELS[`sf_sailing_${s}`] = (o) => { sailboat(o, 9 + s, 3.4, s * 7919, true) }
BOAT_MODELS.ship_classic_1 = (o) => { cruiseShip(o, 270, 32, 11, 'classic') }
for (const [key, [name, L, B]] of Object.entries(NAMED_SIZES)) {
  const n = NAMED_BOATS.find((e) => e.re.test(name))
  if (n?.build) BOAT_MODELS[`boat_${key}`] = (o) => { n.build!(o, L, B, 1) }
}

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
  const FURNITURE: Record<string, (o: MeshBuilder) => void> = {
    cobraOnPole: (o) => { utilityPole(o, 3); cobraHeadArm(o) }, sfConcreteLight, sfSteelLight, dragonLamp, pathOfGold,
    topiaryTrio: (o) => { const y: [number, number, number] = [0.05, 0.11, 0.055]; topiaryBall(o, -2.2, 0, 0, 0.75, y, { seed: 1 }); topiaryCone(o, 0, 0, 0, 3.2, 0.8, y, { seed: 2 }); topiaryBox(o, 2.2, 0, 0, 1.3, 1.3, 1.3, y, { seed: 3 }); topiaryStandard(o, 0, 0, 2.4, 1.2, 0.5, y, [0.17, 0.13, 0.1], { seed: 4 }) },
    bartEntrance, bench, sfFireAlarmBox, nycFireAlarmBox, guimardEntrance, parisEntrance,
    // Paris's pavement (render/paris/furniture.ts): `?model=parisBench`
    parisBench, parisLamp, parisLampConsole, parisWallLamp, champsElyseesMast, marechauxMast, wallaceFountain, parisNewsstand, horodateur, treePit: treePit(true),
    parisBusStop: (o) => parisBusStop(o, true, 3), parisStopPost: (o) => parisBusStop(o, false, 5),
    sanisette: (o) => parisStreetModel('sanisette', 1)!(o),
    bikeRack: (o) => bikeParking(6, 11)(o), bikeRackEmpty: (o) => bikeParking(6, 4)(o),
    cageBin: (o) => parisStreetModel('litter', 1)!(o), litterHoop: (o) => parisStreetModel('litter', 7)!(o), laPosteBox, parisPanel: (o) => parisPanel(o, 2),
    // the moored boat library (render/paris/moored.ts, named-boats.ts): `?model=boat_peniche_3` (kind, seed), `?model=boat_Batofar`
    ...BOAT_MODELS,
    sucette: (o) => sucette(o, 4), sucetteTall: (o) => sucette(o, 1), cafeBoard: (o) => cafeBoard(o, 2), cafeBoardPoster: (o) => cafeBoard(o, 3), stoneBench, jardiniere: (o) => jardiniere(o, 2), jardiniereConcrete: (o) => jardiniere(o, 7), boxwoodPot: (o) => boxwoodPot(o, 1),
  }
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
    courtSoccer: ['soccer', 92, 62],
    courtRugby: ['rugby', 102, 71],
    courtHandball: ['handball', 41, 21],
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
    // the street ads it carries (render/affiches.ts), on flat ground, Paris's set for a Paris piece (or `?region=`)
    if (mb.affiches.length) {
      const region = new URLSearchParams(location.search).get('region') ?? (/paris|sucette|morris|abribus|velib|wallace|guimard|horodateur/i.test(name) ? 'paris' : undefined)
      for (const am of afficheMeshes(`affiches:${name}`, scene, mb.affiches, region, () => 0, m.renderingGroupId)) { am.parent = m; signs.push(am) }
    }
    // two triangles each, which is the whole point of the flat path
    return signs.length * 2
  }
  let signTris = raiseSigns()
  // the model's MOVING WATER (render/water.ts), raised as render/landmarks.ts does: parented to the model
  const water = new Water(scene)
  const raiseWater = (): void => {
    for (const w of scene.meshes.filter((q) => q.name.startsWith('water:'))) w.dispose()
    if (mb.water.length) water.raise(mb.water, m, name)
  }
  raiseWater()
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
    if (build) build(mb, fit, (fit as { kit?: KitArgs }).kit)
    mb.toVertexData().applyToMesh(m, true)
    signTris = raiseSigns()
    raiseWater()
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
