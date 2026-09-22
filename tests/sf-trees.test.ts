import { describe, expect, it } from 'vitest'
import { packPlantings, unpackPlantings } from '../src/city/plantings.ts'
import { sfForm, sfHeight } from '../src/city/sf/trees.ts'
import { formCode, formOf, TREE_FORMS } from '../src/city/tree-forms.ts'

describe('tree forms', () => {
  it('packs a form with the park flag, and an old package reads as form 0', () => {
    const ps = [{ x: 1, z: 2, height: 7, spin: 1, park: true, form: formCode('ficus') }, { x: 3, z: 4, height: 9, spin: 2, park: false, form: formCode('canary') }]
    const back = unpackPlantings(packPlantings(ps))
    expect(back.map((p) => [p.park, formOf(p.form ?? 0)])).toEqual([[true, 'ficus'], [false, 'canary']])
    expect(unpackPlantings([0, 0, 7, 0, 1])[0]).toMatchObject({ park: true, form: 0 })
  })
  it('names are unique', () => expect(new Set(TREE_FORMS).size).toBe(TREE_FORMS.length))
})

describe('SF species', () => {
  it('maps the commonest street trees', () => {
    expect(sfForm('Platanus x hispanica')).toBe('plane')
    expect(sfForm("Ficus microcarpa nitida 'Green Gem'")).toBe('ficus')
    expect(sfForm('Lophostemon confertus')).toBe('evergreen')
    expect(sfForm('Metrosideros excelsa')).toBe('myrtle')
    expect(sfForm('Prunus cerasifera')).toBe('plum')
    expect(sfForm("Prunus serrulata 'Kwanzan'")).toBe('blossom')
    expect(sfForm('Pyrus calleryana')).toBe('pear')
    expect(sfForm('Phoenix canariensis')).toBe('canary')
    expect(sfForm('Syagrus romanzoffianum')).toBe('queen')
    expect(sfForm('Quercus agrifolia')).toBe('evergreen')
    expect(sfForm('Quercus shumardii')).toBe('deciduous')
  })
  it('skips sites with no tree, and keeps unknowns', () => {
    expect(sfForm('Planting site (plant)')).toBeNull()
    expect(sfForm('Stump (use Grinder)')).toBeNull()
    expect(sfForm('')).toBeNull()
    expect(sfForm('Tree(s)')).toBe('evergreen')
  })
  it('sizes by trunk, within reason', () => {
    expect(sfHeight('plane', 10, 0)).toBeCloseTo(8, 0)
    expect(sfHeight('plane', 500, 0.5)).toBeLessThan(17)       // a typo in the list is not a 200 m tree
    expect(sfHeight('flowering', 40, 0)).toBeLessThanOrEqual(9)
  })
})
