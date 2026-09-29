/**
 * Photo mode: fog off, and a draw distance you can push out — for taking clean aerial screenshots.
 *
 * The owner asked for this after flying the camera up for screenshots and finding the city dissolving into
 * haze: *"I'd like to have an option to turn off fog to take nice aerial views for screenshots. Also perhaps
 * to set the draw distance, although that is dangerous since we may be hitting poly limits."*
 *
 * HOW FOG WORKS HERE, because it is not Babylon's built-in fog. Every material in this renderer is a
 * hand-written `ShaderMaterial` carrying its own `fogDensity` uniform, applied from a `SkyLook`
 * (`facade-material.ts`) at creation: `cartoon-material`, `facade-material`, `road-material` and
 * `sign-plates` all do `mat.setFloat('fogDensity', look.fogDensity)`. There is no single scene-level switch,
 * so turning fog off means walking the scene's materials and rewriting that uniform. Setting a uniform a
 * material does not declare is harmless in Babylon — it simply never binds — so the walk does not need to
 * know which materials have fog.
 *
 * THE DRAW DISTANCE IS SAFER THAN IT SOUNDS, and the owner's worry is worth answering precisely. `maxZ` is
 * the camera's far plane: it decides what is CLIPPED, not what is LOADED. Raising it does not pull in more
 * tiles and does not add a single triangle to the scene — it only stops discarding geometry that is already
 * there. What you gain is seeing the far side of the city; what you risk is depth precision, since the
 * depth buffer is distributed between `minZ` and `maxZ` and stretching the far plane gives the near ground
 * layers (which sit centimetres apart) less to work with. That shows up as z-fighting on the road markings
 * before it shows up as a frame rate problem.
 *
 * The default `maxZ` is 1400, chosen to sit comfortably outside SKY_RADIUS so the sky dome is not clipped.
 * Going BELOW the sky radius will clip the dome and show the void behind it, so the floor here is deliberate.
 */
import type { Scene } from '@babylonjs/core/scene'
import type { Camera } from '@babylonjs/core/Cameras/camera'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'

/** The shipped far plane (`game.ts`), just outside the sky dome. */
export const DEFAULT_FAR = 1400
/** Below the sky radius the dome itself gets clipped, so this is the floor. */
const MIN_FAR = 900
/** Past this, depth precision on the near ground layers starts to cost more than the view is worth. */
const MAX_FAR = 12000

/** Each material's own fog density, remembered the first time we touch it so fog can be restored exactly. */
const original = new WeakMap<ShaderMaterial, number>()
let fogOff = false

function eachShader(scene: Scene, f: (m: ShaderMaterial) => void): void {
  for (const m of scene.materials) if (m instanceof ShaderMaterial) f(m)
}

/**
 * Turn fog off or on. Remembers each material's shipped density on the first call, so restoring is exact
 * rather than a guess at the default — materials do not all share one value, and a night look differs again.
 */
export function setFog(scene: Scene, on: boolean): void {
  fogOff = !on
  eachShader(scene, (m) => {
    // `floats` is Babylon's own record of what has been set on a ShaderMaterial; read the shipped value once
    const current = (m as unknown as { _floats?: Record<string, number> })._floats?.fogDensity
    if (current !== undefined && !original.has(m)) original.set(m, current)
    const base = original.get(m)
    if (base === undefined) return          // this material has no fog to turn off
    m.setFloat('fogDensity', on ? base : 0)
  })
}

export const fogIsOff = (): boolean => fogOff

/**
 * Fog as a PLACE's property rather than a debug key — the park's air, not the city's (docs/PARKS.md).
 *
 * The owner: *"There are almost no long sight lines, due to hills or trees."* In Golden Gate Park the road
 * disappears into trunks within a hundred metres, and the view on MLK Drive ends at the next stand of
 * eucalyptus. Drawing that as the city's thin air is not neutral — it is wrong, and it shows the far side of
 * a park nobody can see the far side of.
 *
 * `null` restores each material's shipped density exactly (the same remembered value `setFog` uses), so
 * riding out of the park's gate puts the city's air back rather than a guess at it. Called only when the
 * rider CROSSES between the two, not per frame: the walk is a few dozen materials.
 *
 * This is deliberately fog and not a shorter far plane, though the far plane is where the frame time is.
 * `MIN_FAR` above is a hard floor — below the sky radius the dome itself is clipped and the void shows
 * behind it — so a park far plane of a few hundred metres needs the sky dome pulled in with it. That is a
 * separate change and is written up rather than half-made here.
 */
export function setRegionFog(scene: Scene, density: number | null): void {
  if (fogOff) return                        // photo mode wins; it was asked for explicitly
  eachShader(scene, (m) => {
    const current = (m as unknown as { _floats?: Record<string, number> })._floats?.fogDensity
    if (current !== undefined && !original.has(m)) original.set(m, current)
    const base = original.get(m)
    if (base === undefined) return
    m.setFloat('fogDensity', density ?? base)
  })
}

/** Clamp and apply a far plane. Returns what was actually set, so a caller can report it honestly. */
export function setFar(camera: Camera, metres: number): number {
  const far = Math.max(MIN_FAR, Math.min(MAX_FAR, Math.round(metres)))
  camera.maxZ = far
  return far
}

/**
 * Wire photo mode up: `P` toggles fog, `[` and `]` pull the far plane in and push it out, and the URL can
 * set both up front (`?fog=off&far=6000`) so a screenshot run does not need a keypress.
 *
 * Materials are created lazily as tiles arrive, so a fog toggle made early would not reach a material built
 * later. Re-applying on a timer while fog is off is the cheap fix: the walk is a few dozen materials and only
 * runs in photo mode.
 */
export function photoMode(scene: Scene, camera: Camera, onStatus?: (s: string) => void): void {
  const params = new URLSearchParams(location.search)
  if (params.get('fog') === 'off') setFog(scene, false)
  const farParam = Number(params.get('far'))
  if (Number.isFinite(farParam) && farParam > 0) setFar(camera, farParam)

  addEventListener('keydown', (e) => {
    if (e.code === 'KeyP' && !e.ctrlKey && !e.metaKey) {
      setFog(scene, fogOff)
      onStatus?.(fogOff ? 'fog off' : 'fog on')
    } else if (e.code === 'BracketRight') {
      onStatus?.(`draw distance ${setFar(camera, camera.maxZ * 1.5)} m`)
    } else if (e.code === 'BracketLeft') {
      onStatus?.(`draw distance ${setFar(camera, camera.maxZ / 1.5)} m`)
    }
  })

  // catch materials created after the toggle (tiles stream in continuously)
  setInterval(() => { if (fogOff) setFog(scene, false) }, 2000)
}
