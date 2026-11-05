import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MeshBuilder } from '../src/render/buildings.ts'
import { hotelGaillard, HOTEL_GAILLARD_REFS } from '../src/render/landmarks/paris/hotel-gaillard.ts'

describe('Hôtel Gaillard', () => {
  const out = new MeshBuilder()
  hotelGaillard(out)
  it('builds finite, affordable geometry on its block', () => {
    console.log('hotel-gaillard triangles', out.triangles)
    expect(out.triangles).toBeGreaterThan(4_000)
    expect(out.triangles).toBeLessThan(15_000)
    for (const v of out.positions) expect(Number.isFinite(v)).toBe(true)
    let r = 0, top = 0
    for (let i = 0; i < out.positions.length; i += 3) { r = Math.max(r, Math.hypot(out.positions[i], out.positions[i + 2])); top = Math.max(top, out.positions[i + 1]) }
    expect(r).toBeLessThan(50)
    expect(top).toBeGreaterThan(24)
    expect(top).toBeLessThan(30)
  })
  it('claims its OSM building once, with no civic entry shadowing it', () => {
    const lm = JSON.parse(readFileSync('public/landmarks/paris.json', 'utf8')) as { procedural?: string; osm?: string[]; madeBy?: string }[]
    const e = lm.find((x) => x.procedural === 'hotelGaillard')
    expect(e).toBeTruthy()
    expect([...(e!.osm ?? [])].sort()).toEqual([...HOTEL_GAILLARD_REFS].sort())
    expect(e!.madeBy).toBeTruthy()
    const civic = JSON.parse(readFileSync('public/landmarks/paris/civic.json', 'utf8')) as { osm?: string[] }[]
    for (const x of civic) for (const ref of x.osm ?? []) expect(HOTEL_GAILLARD_REFS.includes(ref), ref).toBe(false)
  })
})
