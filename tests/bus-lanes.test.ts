import { describe, expect, it } from 'vitest'
import { busSide } from '../tools/bake.ts'

describe('bus lanes from OSM tags (2026-10-04)', () => {
  it('reads the forms San Francisco uses', () => {
    expect(busSide({ 'lanes:bus': '1', oneway: 'yes' })).toBe(1)
    expect(busSide({ 'lanes:bus': '2' })).toBe(3)
    expect(busSide({ 'lanes:bus:backward': '1' })).toBe(2)
    expect(busSide({ 'bus:lanes': 'yes|yes|designated', oneway: 'yes' })).toBe(1)
    expect(busSide({ 'busway:left': 'lane', oneway: 'yes' })).toBe(2)
    expect(busSide({ 'busway:both': 'lane' })).toBe(3)
    expect(busSide({ highway: 'primary' })).toBeUndefined()
  })
})
