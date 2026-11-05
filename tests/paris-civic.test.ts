import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MeshBuilder } from '../src/render/buildings.ts'
import { parisCivic, type KitArgs } from '../src/render/landmarks/paris/kit/recipes.ts'

const entries = JSON.parse(readFileSync(resolve(import.meta.dirname, '../public/landmarks/paris/civic.json'), 'utf8')) as { kit: KitArgs; height: number; osm: string[] }[]

describe('the Paris kit', () => {
  it('builds every kind at every date, within a landmark\'s budget', () => {
    const rect = (hx: number, hz: number) => [{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: hz }, { x: -hx, z: hz }]
    const seen = new Set<string>()
    let worst = 0
    for (const e of entries) {
      if (!e.kit) continue
      const key = `${e.kit.kind}/${e.kit.p}/${e.kit.word && e.kit.kind === 'eglise' ? e.kit.word : ''}`
      if (seen.has(key)) continue
      seen.add(key)
      const out = new MeshBuilder()
      parisCivic(out, { hx: 20, hz: 12, height: e.height, ring: rect(20, 12) }, e.kit)
      worst = Math.max(worst, out.triangles)
      expect(out.triangles).toBeGreaterThan(50)
      // and each kind and date across a run of seeds, so every style the seed can draw gets built
      if (e.kit.kind !== 'eglise') for (let seed = 0; seed < 8; seed++) {
        const v = new MeshBuilder()
        parisCivic(v, { hx: 20, hz: 12, height: e.height, ring: rect(20, 12) }, { ...e.kit, seed })
        worst = Math.max(worst, v.triangles)
        expect(v.colors.every(Number.isFinite)).toBe(true)
      }
    }
    expect(worst).toBeLessThan(25000)
  }, 60000)

  it('builds an hôtel particulier on a plain, a U and a courtyard footprint, across seeds, modestly', () => {
    const P = (pts: number[][]) => pts.map(([x, z]) => ({ x, z }))
    const rect = P([[-12, -9], [12, -9], [12, 9], [-12, 9]])
    // a U open to +z (the street), and a closed ring with a courtyard, each 30 x 26
    const u = P([[-15, -13], [15, -13], [15, 13], [6, 13], [6, -2], [-6, -2], [-6, 13], [-15, 13]])
    const closed = P([[-15, -13], [15, -13], [15, 13], [-15, 13]])
    const hole = P([[-8, -3], [8, -3], [8, 8], [-8, 8]]).reverse()
    for (const [name, ring, holes] of [['plain', rect, undefined], ['U', u, undefined], ['court', closed, [hole]]] as const) {
      for (let seed = 0; seed < 24; seed++) {
        const out = new MeshBuilder()
        parisCivic(out, { hx: 15, hz: 13, height: 12 + (seed % 4) * 3, ring: [...ring], holes: holes?.map((h) => [...h]), grade: 0 }, { kind: 'hotel', p: 2, seed })
        expect(out.triangles, `${name} ${seed}`).toBeGreaterThan(200)
        expect(out.triangles, `${name} ${seed}`).toBeLessThan(9000)
        expect(out.positions.every(Number.isFinite)).toBe(true)
      }
    }
  })
})
