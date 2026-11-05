import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MeshBuilder } from '../src/render/buildings.ts'
import { hotelRoquelaure, HOTEL_ROQUELAURE_REFS } from '../src/render/landmarks/paris/hotel-roquelaure.ts'

describe('Hôtel de Roquelaure', () => {
  const out = new MeshBuilder()
  hotelRoquelaure(out)
  it('builds finite, affordable geometry on its block', () => {
    console.log('hotel-roquelaure triangles', out.triangles)
    expect(out.triangles).toBeGreaterThan(1_500)
    expect(out.triangles).toBeLessThan(12_000)
    for (const v of out.positions) expect(Number.isFinite(v)).toBe(true)
    let r = 0, top = 0
    for (let i = 0; i < out.positions.length; i += 3) { r = Math.max(r, Math.hypot(out.positions[i], out.positions[i + 2])); top = Math.max(top, out.positions[i + 1]) }
    expect(r).toBeLessThan(80)
    expect(top).toBeGreaterThan(14)
    expect(top).toBeLessThan(20)
  })
  it('claims its OSM building once, with no civic entry shadowing it', () => {
    const lm = JSON.parse(readFileSync('public/landmarks/paris.json', 'utf8')) as { procedural?: string; osm?: string[]; madeBy?: string }[]
    const e = lm.find((x) => x.procedural === 'hotelRoquelaure')
    expect(e).toBeTruthy()
    expect([...(e!.osm ?? [])].sort()).toEqual([...HOTEL_ROQUELAURE_REFS].sort())
    expect(e!.madeBy).toBeTruthy()
    const civic = JSON.parse(readFileSync('public/landmarks/paris/civic.json', 'utf8')) as { osm?: string[] }[]
    for (const x of civic) for (const ref of x.osm ?? []) expect(HOTEL_ROQUELAURE_REFS.includes(ref), ref).toBe(false)
  })
})
