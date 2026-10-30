import { describe, expect, it } from 'vitest'
import { inferLevels, type TaggedNeighbour } from '../tools/heights.ts'
import { region } from '../src/city/region.ts'

/** a w × d rectangle centred on the origin */
const rect = (w: number, d: number): { x: number; z: number }[] =>
  [{ x: -w / 2, z: -d / 2 }, { x: w / 2, z: -d / 2 }, { x: w / 2, z: d / 2 }, { x: -w / 2, z: d / 2 }]

const paris = region('paris')
const infer = (tags: Record<string, string>, ring = rect(15, 12), near: TaggedNeighbour[] = [], r = paris) =>
  inferLevels(tags, ring, near, r.defaultLevels, r.levelInference)

describe('inferring the height nobody tagged', () => {
  it('leaves a tagged height to the tag layer', () => {
    expect(infer({ building: 'yes', height: '18' })).toBeUndefined()
    expect(infer({ building: 'yes', 'building:levels': '3' })).toBeUndefined()
    expect(infer({ building: 'yes', 'building:height': '9' })).toBeUndefined()
  })

  it('calls a 20 m² shed one storey, whatever stands next to it', () => {
    const towers = Array.from({ length: 5 }, (_, i) => ({ x: i, z: 0, levels: 7 }))
    expect(infer({ building: 'yes' }, rect(5, 4), towers)).toBe(1)
  })

  it('asks the tagged neighbours, and takes their median', () => {
    const near = [6, 6, 7, 5, 6].map((levels, i) => ({ x: 10 * i - 20, z: 15, levels }))
    expect(infer({ building: 'yes' }, rect(15, 12), near)).toBe(6)
  })

  it('ignores neighbours beyond the region radius, and too few of them', () => {
    const far = [6, 6, 7, 5, 6].map((levels, i) => ({ x: 500 + i, z: 0, levels }))
    expect(infer({ building: 'yes' }, rect(15, 12), far)).toBe(paris.defaultLevels.residential)
    const two = [{ x: 5, z: 0, levels: 8 }, { x: -5, z: 0, levels: 8 }]
    expect(infer({ building: 'yes' }, rect(15, 12), two)).toBe(paris.defaultLevels.residential)
  })

  it('falls back to the regional default by kind', () => {
    // (Paris's own default, seven: the ground, five and the mansard — owner, 2026-10-29)
    expect(infer({ building: 'yes' })).toBe(paris.defaultLevels.residential)
    expect(infer({ building: 'office' })).toBe(paris.defaultLevels.commercial)
    expect(infer({ building: 'house' })).toBe(2)
    expect(infer({ building: 'warehouse' })).toBe(2)
    expect(infer({ building: 'garage' })).toBe(1)
    expect(infer({ building: 'church' })).toBe(5)
  })

  it('varies the method by city: the Loop does not turn a walk-up into a tower', () => {
    const chicago = region('chicago')
    // two survivors and five towers within reach: the lower quartile, capped, not the median
    const near = [3, 4, 30, 40, 45, 50, 60].map((levels, i) => ({ x: 8 * i - 24, z: 20, levels }))
    const lv = infer({ building: 'yes' }, rect(15, 12), near, chicago)!
    expect(lv).toBeLessThanOrEqual(chicago.levelInference.maxLevels)
    expect(infer({ building: 'yes' }, rect(15, 12), near, paris)).toBe(paris.levelInference.maxLevels)
  })
})
