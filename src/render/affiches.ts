/**
 * THE STREET ADS (owner, 2026-11-26: "both paris and SF have many, many billboards posters and other small
 * advertisements… a library of these, NOT real… funny and interesting — out of the corner of your eye"). The library
 * is src/city/affiches/<set>.json, painted once into public/affiches/<set>.webp by tools/affiches/render.ts; here
 * its cells are pasted onto the furniture that carries them.
 *
 * A model asks for an ad the way it asks for a sign: `affiche()` records a face — its centre, the way it looks, its
 * size, its family — in the builder's `affiches`, in the model's own frame. render/city.ts `placeModel` carries the
 * faces with the model (turned, moved, the ad picked by where it stands so two sucettes side by side differ), and
 * the tile's furniture pass turns them into one textured mesh: four vertices an ad, one draw a tile.
 *
 * Re-render the pages after editing the copy:  npx vite-node tools/affiches/render.ts
 */
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import type { Scene } from '@babylonjs/core/scene'
import paris from '../city/affiches/paris.json' with { type: 'json' }
import sf from '../city/affiches/sf.json' with { type: 'json' }
import { NIGHT } from './facade-material.ts'
import { FAMILIES, PAGE_W, afficheSet, packAffiches, type AfficheFamily, type AfficheRect } from './affiches-layout.ts'

export interface AfficheFace {
  /** the face's centre, and the horizontal way it looks */
  x: number; y: number; z: number; nx: number; nz: number
  /** half its width and height, metres */
  hw: number; hh: number
  family: AfficheFamily
  /** lit from inside (a sucette, a shelter, a bulletin's lamps) or plain paper (the Morris ring, a flyer) */
  lit: boolean
  /** the picking seed; and the face's place in its model, so a model's faces never repeat each other */
  seed: number; k: number
  /** only this kind of ad, where the set has some (the Morris columns: events) */
  kind?: string
  /** turned this far about its own normal, radians (a flyer taped up in a hurry) */
  tilt?: number
  /** the ground under the model's anchor is added at the end (render/city.ts drapeRigid's rule) */
  ax?: number; az?: number
}

/** Record an ad face in a model's frame; the face, for a caller that wants to tilt it or repeat its neighbour (same k). */
export function affiche(out: { affiches: AfficheFace[] }, family: AfficheFamily, x: number, y: number, z: number, nx: number, nz: number,
                        hw: number, hh: number, seed: number, lit = true, kind?: string): AfficheFace {
  const f: AfficheFace = { x, y, z, nx, nz, hw, hh, family, lit, seed, k: out.affiches.length, kind }
  out.affiches.push(f)
  return f
}

/** brightness by day and at full night (NIGHT, fixed before the city is built), lit panels and plain paper */
const GLOW = { litDay: 0.9, litNight: 1.0, paperDay: 0.7, paperNight: 0.22 }
/** which way an ad's text runs on its face: flip if the type reads mirrored */
const RIGHT = -1
/** how far a face stands off the panel behind it, metres */
export const AFFICHE_LIFT = 0.012

interface Entry { family: AfficheFamily; kind: string }
const SETS: Record<'paris' | 'sf', Entry[]> = { paris: paris as Entry[], sf: sf as Entry[] }

const pages = new Map<string, { rects: Record<AfficheFamily, AfficheRect[]>; height: number; byKind: Map<string, number[]> }>()
function pageOf(set: 'paris' | 'sf') {
  let p = pages.get(set)
  if (p) return p
  const entries = SETS[set]
  const counts = Object.fromEntries(FAMILIES.map((f) => [f, entries.filter((e) => e.family === f).length])) as Record<AfficheFamily, number>
  const { rects, height } = packAffiches(counts)
  // every family's cells, and each family's cells of one kind, as indices into its rects
  const byKind = new Map<string, number[]>()
  const seen: Record<string, number> = {}
  for (const e of entries) {
    const i = seen[e.family] = (seen[e.family] ?? -1) + 1
    for (const key of [e.family, `${e.family}:${e.kind}`]) { if (!byKind.has(key)) byKind.set(key, []); byKind.get(key)!.push(i) }
  }
  p = { rects, height, byKind }
  pages.set(set, p)
  return p
}

/** The UV rectangle [u0, v0, u1, v1] of the ad a face with this seed wears (v up, as Babylon samples a loaded picture). */
export function afficheCell(region: string | undefined, family: AfficheFamily, seed: number, kind?: string): [number, number, number, number] {
  const page = pageOf(afficheSet(region))
  const list = (kind && page.byKind.get(`${family}:${kind}`)) || page.byKind.get(family) || page.byKind.get('portrait')!
  const fam = page.byKind.has(family) ? family : 'portrait'
  const r = page.rects[fam][list[(seed >>> 0) % list.length]]
  return [r.x / PAGE_W, 1 - (r.y + r.h) / page.height, (r.x + r.w) / PAGE_W, 1 - r.y / page.height]
}

const mats = new Map<string, StandardMaterial>()
const texs = new Map<string, Texture>()
/** the set's page as a material: unlit, its own glow, mipmapped and anisotropic so small type holds at a slant */
export function afficheMaterial(scene: Scene, region: string | undefined, lit: boolean): StandardMaterial {
  const set = afficheSet(region)
  const key = `${set}:${lit}`
  let m = mats.get(key)
  if (m && m.getScene() === scene) return m
  // (one page a set, shared by the lit and the paper material: two copies would be 40 MB of GPU)
  let tex = texs.get(set)
  if (!tex || tex.getScene() !== scene) {
    tex = new Texture(new URL(`affiches/${set}.webp`, document.baseURI).href, scene, false, true, Texture.TRILINEAR_SAMPLINGMODE)
    tex.anisotropicFilteringLevel = 8
    tex.wrapU = tex.wrapV = Texture.CLAMP_ADDRESSMODE
    texs.set(set, tex)
  }
  m = new StandardMaterial(`affiches:${key}`, scene)
  m.diffuseTexture = tex
  m.disableLighting = true
  const g = lit ? GLOW.litDay + (GLOW.litNight - GLOW.litDay) * NIGHT : GLOW.paperDay + (GLOW.paperNight - GLOW.paperDay) * NIGHT
  m.emissiveColor = new Color3(g, g, g * 0.97)
  m.backFaceCulling = false
  m.zOffset = -2
  m.freeze()
  mats.set(key, m)
  return m
}

/** A tile's ad faces as meshes (one for the lit, one for the paper), each face on the ground under its anchor. */
export function afficheMeshes(name: string, scene: Scene, faces: AfficheFace[], region: string | undefined,
                              ground: (x: number, z: number) => number, group: number): Mesh[] {
  const out: Mesh[] = []
  for (const lit of [true, false]) {
    const pos: number[] = [], nrm: number[] = [], uv: number[] = [], idx: number[] = []
    for (const f of faces) {
      if (f.lit !== lit) continue
      const g = ground(f.ax ?? f.x, f.az ?? f.z)
      const [u0, v0, u1, v1] = afficheCell(region, f.family, f.seed + f.k * 7, f.kind)
      // (the face's right, seen from in front: the normal turned a quarter about the vertical)
      const rx = f.nz * RIGHT, rz = -f.nx * RIGHT
      // (and tilted about the normal: right and up both turned in the face's plane)
      const c = Math.cos(f.tilt ?? 0), sn = Math.sin(f.tilt ?? 0)
      const b = pos.length / 3
      for (const [s, t, u, v] of [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, 1, u0, v1]]) {
        const a = f.hw * s * c - f.hh * t * sn, h = f.hw * s * sn + f.hh * t * c
        pos.push(f.x + rx * a, g + f.y + h, f.z + rz * a)
        nrm.push(f.nx, 0, f.nz)
        uv.push(u, v)
      }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3)
    }
    if (!idx.length) continue
    const vd = new VertexData()
    vd.positions = pos; vd.normals = nrm; vd.uvs = uv; vd.indices = idx
    const m = new Mesh(`${name}:${lit ? 'lit' : 'paper'}`, scene)
    vd.applyToMesh(m)
    m.material = afficheMaterial(scene, region, lit)
    m.renderingGroupId = group
    m.isPickable = false
    m.freezeWorldMatrix()
    out.push(m)
  }
  return out
}
