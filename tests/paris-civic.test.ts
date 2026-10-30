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
      const key = `${e.kit.kind}/${e.kit.p}/${e.kit.word && e.kit.kind === 'eglise' ? e.kit.word : ''}`
      if (seen.has(key)) continue
      seen.add(key)
      const out = new MeshBuilder()
      parisCivic(out, { hx: 20, hz: 12, height: e.height, ring: rect(20, 12) }, e.kit)
      worst = Math.max(worst, out.triangles)
      expect(out.triangles).toBeGreaterThan(50)
    }
    expect(worst).toBeLessThan(25000)
  })
})
