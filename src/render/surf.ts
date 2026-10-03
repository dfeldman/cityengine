/**
 * SURF on the rocks (owner, 2026-10-02: "There are huge waves crashing on the rough cliffs. We should add that as a
 * style zone option and add rendering behavior for it"). Zones with `water: 'waves'` (data/zones/<city>.json: Lands End
 * and Sutro Baths, Fort Point) get, along every metre of shore inside them:
 *
 *   - FOAM: white water lying on the sea in three bands off the shore, each lighting up in turn as a wave runs in;
 *   - SPRAY: upright sheets of white against the rocks that burst when the wave arrives and hang, fading.
 *
 * The shore is found from the ground itself — where the terrain crosses the sea's level — so it needs no coastline
 * data, and follows the cliffs and coves exactly as they are drawn. The animation is in the MATERIALS (alpha over a
 * seven-second set), two phase groups so the coast does not pulse in step; the geometry is built once per tile.
 */
import type { Scene } from '@babylonjs/core/scene'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { MeshBuilder } from './buildings.ts'
import type { Terrain } from '../city/terrain.ts'
import type { TileLayer } from './city.ts'
import { inRing } from '../map/zones.ts'

interface Zone { ring: number[]; bbox: [number, number, number, number]; props: { water?: string } }

const PERIOD = 7
const STEP = 3

export function surfLayer(scene: Scene, zones: Zone[], terrain: Terrain, sea: number): TileLayer | null {
  const surf = zones.filter((z) => z.props.water === 'waves')
  if (!surf.length) return null
  // materials: [group][band 0..2 foam, 3 spray]
  const mats: StandardMaterial[][] = [0, 1].map((g) => [0, 1, 2, 3].map((k) => {
    const m = new StandardMaterial(`surf:${g}:${k}`, scene)
    m.disableLighting = true
    m.emissiveColor = k === 3 ? new Color3(0.93, 0.95, 0.96) : new Color3(0.9, 0.93, 0.94)
    m.diffuseColor = Color3.Black()
    m.specularColor = Color3.Black()
    m.backFaceCulling = false
    m.alpha = 0
    m.needDepthPrePass = false
    return m
  }))
  scene.onBeforeRenderObservable.add(() => {
    const t = performance.now() / 1000
    for (let g = 0; g < 2; g++) {
      const ph = ((t / PERIOD + g * 0.43) % 1 + 1) % 1
      // the wave runs in: the outer band first, the spray as it hits, the inner bands as it washes back
      const pulse = (c: number, w: number): number => { const d = Math.abs(((ph - c + 1.5) % 1) - 0.5); return Math.max(0, 1 - d / w) }
      mats[g][2].alpha = 0.7 * pulse(0.10, 0.25)
      mats[g][1].alpha = 0.85 * pulse(0.22, 0.25)
      mats[g][0].alpha = 0.45 + 0.5 * pulse(0.30, 0.3)
      mats[g][3].alpha = 0.85 * pulse(0.30, 0.16)
    }
  })

  /*
   * The shore is where the DRAWN water ends, not where the terrain crosses the sea's level: offshore the terrain under
   * the water plane rises above it in places, and a terrain test drew surf lines across open sea (2026-10-03). Each
   * tile's water pieces decide what is water; land is outside them and standing above the sea.
   */
  const inRingFlat = (r: number[], x: number, z: number): boolean => {
    let o = false
    for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
    }
    return o
  }
  return {
    name: 'surf',
    range: 3,
    build(near, rect) {
      const here = surf.filter((zn) => zn.bbox[0] < rect.x1 && zn.bbox[2] > rect.x0 && zn.bbox[1] < rect.z1 && zn.bbox[3] > rect.z0)
      if (!here.length) return []
      const wet = near.around.areas.filter((a) => a.kind === 'water').map((a) => a.ring)
      const isWater = (x: number, z: number): boolean => wet.some((r) => inRingFlat(r, x, z))
      const isLand = (x: number, z: number): boolean => !isWater(x, z) && terrain.heightAt(x, z) > sea - 0.5
      const mb: MeshBuilder[][] = [0, 1].map(() => [0, 1, 2, 3].map(() => new MeshBuilder()))
      const up: [number, number, number] = [0, 1, 0]
      const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
      const white: [number, number, number] = [1, 1, 1]
      for (let z = rect.z0; z < rect.z1; z += STEP) {
        for (let x = rect.x0; x < rect.x1; x += STEP) {
          if (!isWater(x, z) || !here.some((zn) => inRing(zn.ring, x, z))) continue
          // land within a step: the way to it is the shore's inward normal
          let lx = 0, lz = 0, n = 0
          for (const k of [1, 2]) for (const [dx, dz] of [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP], [STEP, STEP], [-STEP, -STEP], [STEP, -STEP], [-STEP, STEP]]) {
            if (isLand(x + dx * k, z + dz * k)) { lx += dx; lz += dz; n++ }
          }
          if (!n) continue
          const L = Math.hypot(lx, lz) || 1
          const ux = lx / L, uz = lz / L                  // towards the land
          const g = (Math.floor(x / 37) + Math.floor(z / 41)) & 1
          const y = sea + 0.06
          // the three foam bands, seaward of the shore: each piece TURNED ALONG the shore (tangent tx,tz) and jittered, so
          // the bands read as broken white water, not as the 3 m grid they are sampled on (a blocky checkerboard round
          // Seal Rocks, 2026-10-03)
          const tx0 = -uz, tz0 = ux
          const j = (Math.abs(Math.sin(x * 12.9898 + z * 78.233)) * 43758.5) % 1
          for (let k = 0; k < 3; k++) {
            const d = 0.8 + k * 3.6 + j * 1.2
            const cx = x - ux * d + tx0 * (j - 0.5) * 1.4, cz = z - uz * d + tz0 * (j - 0.5) * 1.4
            const a = 2.2 + k * 0.5, b = 0.9 + k * 0.35
            const yy = y + k * 0.01
            mb[g][k].quad([[cx - tx0 * a - ux * b, yy, cz - tz0 * a - uz * b], [cx + tx0 * a - ux * b, yy, cz + tz0 * a - uz * b],
              [cx + tx0 * a + ux * b, yy, cz + tz0 * a + uz * b], [cx - tx0 * a + ux * b, yy, cz - tz0 * a + uz * b]], up, uv, white, 0)
          }
          // the spray: an upright sheet across the shore's normal, 3-7 m high
          const tx = -uz, tz = ux
          const h = 3 + ((Math.abs(Math.sin(x * 12.9898 + z * 78.233)) * 43758.5) % 1) * 4
          const w = 2.2
          mb[g][3].quad([[x - tx * w, sea, z - tz * w], [x + tx * w, sea, z + tz * w], [x + tx * w * 1.4, sea + h, z + tz * w * 1.4], [x - tx * w * 1.4, sea + h, z - tz * w * 1.4]], [-ux, 0, -uz], uv, white, 0)
        }
      }
      const out: Mesh[] = []
      for (let g = 0; g < 2; g++) {
        for (let k = 0; k < 4; k++) {
          if (mb[g][k].triangles === 0) continue
          const m = new Mesh(`surf:${rect.x0},${rect.z0}:${g}:${k}`, scene)
          mb[g][k].toVertexData().applyToMesh(m)
          m.material = mats[g][k]
          m.isPickable = false
          m.renderingGroupId = 3
          out.push(m)
        }
      }
      return out
    },
  }
}
