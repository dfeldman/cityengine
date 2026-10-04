import { describe, expect, it } from 'vitest'
import { MeshBuilder } from '../src/render/buildings.ts'
import { box } from '../src/render/models.ts'
import { dropCoincidentFaces } from '../src/render/landmarks/coplanar.ts'

describe('coincident landmark faces (Union Square z-fighting, 2026-10-03)', () => {
  it("drops a box's floor lying on the deck under it, and nothing else", () => {
    const mb = new MeshBuilder()
    box(mb, 0, -0.5, 0, 20, 0.5, 20, [1, 1, 1])     // a deck, its top at y 0
    box(mb, 3, 1, -2, 1.5, 1, 1.5, [1, 0, 0])       // a pavilion standing on it, off the deck's diagonal
    const before = mb.triangles
    const dropped = dropCoincidentFaces(mb)
    expect(dropped).toBe(2)                         // the pavilion's floor (two triangles)
    expect(mb.triangles).toBe(before - 2)
  })
  it('keeps one of two identical faces, and leaves faces 4 cm apart alone', () => {
    const mb = new MeshBuilder()
    box(mb, 0, 0, 0, 2, 2, 2, [1, 1, 1])
    box(mb, 0, 0, 0, 2, 2, 2, [1, 1, 1])
    expect(dropCoincidentFaces(mb)).toBe(12)
    const mb2 = new MeshBuilder()
    box(mb2, 0, -0.5, 0, 20, 0.5, 20, [1, 1, 1])
    box(mb2, 0, 1.04, 0, 1, 1, 1, [1, 0, 0])
    expect(dropCoincidentFaces(mb2)).toBe(0)
  })
  it('does not punch a hole: a wall only partly against another stays; a floor partly on a top goes', () => {
    const mb = new MeshBuilder()
    box(mb, 0, 1, 0, 2, 1, 2, [1, 1, 1])            // a block, its east wall at x 2
    box(mb, 3, 2, 0, 1, 2, 1, [1, 0, 0])            // a taller one against it: its west wall at x 2 rises above the block
    expect(dropCoincidentFaces(mb)).toBe(0)
    const mb2 = new MeshBuilder()
    box(mb2, 0, -0.5, 0, 2, 0.5, 2, [1, 1, 1])
    box(mb2, 2, 1, 0, 1, 1, 1, [1, 0, 0])           // half over the deck's edge: its floor still fights the deck top
    expect(dropCoincidentFaces(mb2)).toBe(2)
  })
})
