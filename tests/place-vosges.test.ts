import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MeshBuilder } from '../src/render/buildings.ts'
import { placeVosges, VOSGES_REFS, VOSGES_HOUSES } from '../src/render/landmarks/paris/place-vosges.ts'

describe('Place des Vosges', () => {
  const out = new MeshBuilder()
  placeVosges(out)
  it('builds finite, affordable geometry on the square', () => {
    console.log('place-vosges triangles', out.triangles)
    expect(VOSGES_HOUSES).toBe(36)
    expect(out.triangles).toBeGreaterThan(15_000)
    expect(out.triangles).toBeLessThan(40_000)
    for (const v of out.positions) expect(Number.isFinite(v)).toBe(true)
    // the garden's frame: the square is 140 m across, the roofs and backs reach a block beyond it
    let r = 0, top = 0
    for (let i = 0; i < out.positions.length; i += 3) { r = Math.max(r, Math.hypot(out.positions[i], out.positions[i + 2])); top = Math.max(top, out.positions[i + 1]) }
    expect(r).toBeLessThan(200)
    expect(top).toBeGreaterThan(26)
    expect(top).toBeLessThan(32)
  })
  it('claims every building it draws, once, and no civic entry shadows them', () => {
    const lm = JSON.parse(readFileSync('public/landmarks/paris.json', 'utf8')) as { procedural?: string; osm?: string[]; madeBy?: string }[]
    const e = lm.find((x) => x.procedural === 'placeVosges')
    expect(e).toBeTruthy()
    expect([...(e!.osm ?? [])].sort()).toEqual([...VOSGES_REFS].sort())
    expect(new Set(VOSGES_REFS).size).toBe(VOSGES_REFS.length)
    expect(e!.madeBy).toBeTruthy()
    const civic = JSON.parse(readFileSync('public/landmarks/paris/civic.json', 'utf8')) as { osm?: string[] }[]
    const claimed = new Set(civic.flatMap((x) => x.osm ?? []))
    for (const ref of VOSGES_REFS) expect(claimed.has(ref), ref).toBe(false)
  })
})
