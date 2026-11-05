import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MeshBuilder } from '../src/render/buildings.ts'
import { hotelCastries, HOTEL_CASTRIES_REFS, RING, COUR, STREET, STREET_WING_W, STREET_WING_E, WEST, EAST, MAIN, ANNEX_NORTH, ANNEX_SOUTH } from '../src/render/landmarks/paris/hotel-castries.ts'

describe('Hôtel de Castries', () => {
  const out = new MeshBuilder()
  hotelCastries(out)
  it('builds finite, affordable geometry on its block', () => {
    console.log('hotel-castries triangles', out.triangles)
    expect(out.triangles).toBeGreaterThan(1_500)
    expect(out.triangles).toBeLessThan(12_000)
    for (const v of out.positions) expect(Number.isFinite(v)).toBe(true)
    let r = 0, top = 0
    for (let i = 0; i < out.positions.length; i += 3) { r = Math.max(r, Math.hypot(out.positions[i], out.positions[i + 2])); top = Math.max(top, out.positions[i + 1]) }
    expect(r).toBeLessThan(60)
    expect(top).toBeGreaterThan(17)
    expect(top).toBeLessThan(22)
  })
  it('its parts cover the claimed outline minus the cour: no gap to see the ground through', () => {
    const inside = (p: [number, number], poly: [number, number][]): boolean => {
      let c = false
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, zi] = poly[i], [xj, zj] = poly[j]
        if ((zi > p[1]) !== (zj > p[1]) && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) c = !c
      }
      return c
    }
    let ring = 0, missed = 0
    for (let x = -34; x <= 38; x += 0.5) for (let z = -24; z <= 30; z += 0.5) {
      if (!inside([x, z], RING) || inside([x, z], COUR)) continue
      ring++
      if (![STREET, STREET_WING_W, STREET_WING_E, WEST, EAST, MAIN, ANNEX_NORTH, ANNEX_SOUTH].some((q) => inside([x, z], q))) missed++
    }
    console.log('hotel-castries outline cells', ring, 'uncovered', missed)
    expect(missed / ring).toBeLessThan(0.03)
  })
  it('claims its OSM relation once, with no civic entry shadowing it', () => {
    const lm = JSON.parse(readFileSync('public/landmarks/paris.json', 'utf8')) as { procedural?: string; osm?: string[]; madeBy?: string }[]
    const e = lm.find((x) => x.procedural === 'hotelCastries')
    expect(e).toBeTruthy()
    expect([...(e!.osm ?? [])].sort()).toEqual([...HOTEL_CASTRIES_REFS].sort())
    expect(e!.madeBy).toBeTruthy()
    const civic = JSON.parse(readFileSync('public/landmarks/paris/civic.json', 'utf8')) as { osm?: string[] }[]
    for (const x of civic) for (const ref of x.osm ?? []) expect(HOTEL_CASTRIES_REFS.includes(ref), ref).toBe(false)
  })
})
