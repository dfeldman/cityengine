import { describe, expect, it } from 'vitest'
import { mapLinks } from '../src/ui/inspector.ts'

describe('the inspector\'s map links', () => {
  it('spells a spot the way Google Earth\'s own links do', () => {
    // (the owner's example: 48°50'07.5"N 2°22'17.7"E)
    expect(mapLinks(48.835417, 2.371583).earth).toBe('https://earth.google.com/web/search/48%C2%B050%2707%2e5%22N+2%C2%B022%2717%2e7%22E')
  })
  it('says south and west, for San Francisco', () => {
    expect(mapLinks(37.7986, -122.4131).earth).toContain('N+122%C2%B024%2747%2e2%22W')
  })
  it('carries a whole minute when the seconds round up', () => {
    expect(mapLinks(48.99999, 2).earth).toContain('49%C2%B000%2700%2e0%22N')
  })
  it('keeps Street View\'s heading in a compass range', () => {
    expect(mapLinks(48.8, 2.3, -90).streetView).toContain('viewpoint=48.800000,2.300000&heading=270')
    expect(mapLinks(48.8, 2.3).mapillary).toBe('https://www.mapillary.com/app/?lat=48.800000&lng=2.300000&z=18')
    expect(mapLinks(48.8, 2.3).maps).toBe('https://www.google.com/maps/search/?api=1&query=48.800000,2.300000')
  })
})
