import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MeshBuilder } from '../src/render/buildings.ts'
import { hotelLandolfoCarcano, HOTEL_CARCANO_REFS, RING, MAIN, WING_SE, WING_NE, BAY } from '../src/render/landmarks/paris/hotel-landolfo-carcano.ts'

const inside = (p: [number, number], poly: [number, number][]): boolean => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j]
    if ((zi > p[1]) !== (zj > p[1]) && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) c = !c
  }
  return c
}

describe('Hôtel Landolfo-Carcano', () => {
  const out = new MeshBuilder()
  hotelLandolfoCarcano(out)
  it('builds finite, affordable geometry on its plot', () => {
    console.log('hotel-landolfo-carcano triangles', out.triangles)
    expect(out.triangles).toBeGreaterThan(2_000)
    expect(out.triangles).toBeLessThan(12_000)
    for (const v of out.positions) expect(Number.isFinite(v)).toBe(true)
    let r = 0, top = 0
    for (let i = 0; i < out.positions.length; i += 3) { r = Math.max(r, Math.hypot(out.positions[i], out.positions[i + 2])); top = Math.max(top, out.positions[i + 1]) }
    expect(r).toBeLessThan(30)
    expect(top).toBeGreaterThan(22)
    expect(top).toBeLessThan(26)
  })
  it('its roofs cover the claimed outline: no gap to see the ground through', () => {
    let cells = 0, missed = 0
    for (let x = -15; x <= 13; x += 0.5) for (let z = -17; z <= 18; z += 0.5) {
      if (!inside([x, z], RING)) continue
      cells++
      if (![MAIN, WING_SE, WING_NE, BAY].some((q) => inside([x, z], q))) missed++
    }
    console.log('hotel-landolfo-carcano outline cells', cells, 'uncovered', missed)
    expect(missed / cells).toBeLessThan(0.03)
  })
  it('claims its OSM way once, with no civic entry shadowing it', () => {
    const lm = JSON.parse(readFileSync('public/landmarks/paris.json', 'utf8')) as { procedural?: string; osm?: string[]; madeBy?: string }[]
    const e = lm.find((x) => x.procedural === 'hotelLandolfoCarcano')
    expect(e).toBeTruthy()
    expect([...(e!.osm ?? [])].sort()).toEqual([...HOTEL_CARCANO_REFS].sort())
    expect(e!.madeBy).toBeTruthy()
    const civic = JSON.parse(readFileSync('public/landmarks/paris/civic.json', 'utf8')) as { osm?: string[] }[]
    for (const x of civic) for (const ref of x.osm ?? []) expect(HOTEL_CARCANO_REFS.includes(ref), ref).toBe(false)
  })
})
