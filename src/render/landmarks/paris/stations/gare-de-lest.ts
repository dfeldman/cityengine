import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { archedPane, block, hex, pediment, shade } from '../../kit.ts'
import { clockFace, simplifyRing } from '../../parts.ts'
import { faceBand, type Face } from '../../tower.ts'
import { archBand, clipBox, engraved, frontOr, glazedArch, range, statue } from './front.ts'
import { mansard } from './gare-de-lyon.ts'
import { canopies, trainShed } from './shed.ts'
import { EST_PARTS, EST_SHED } from './data.ts'

type P2 = { x: number; z: number }
const toP = (r: [number, number][]): P2[] => r.map(([x, z]) => ({ x, z }))

/**
 * The Gare de l'Est (Duquesney, 1849; doubled to the east in 1931 to the same design), on the Place du
 * 11-Novembre-1918 at the head of the Boulevard de Strasbourg (references: Wikimedia Commons "Gare de l'Est, Paris
 * 22 August 2016", and the 1930s aerial "Vue aérienne de Paris la gare de l'Est … PH344-1211"). The gist:
 *
 * - its two great ROSES: each the glazed half-wheel closing a barrel-vaulted hall, framed in the gable of a pediment,
 *   Strasbourg (west) and Verdun (east) standing on the apexes;
 * - the arcaded portico the whole length of the ground floor, the stone pavilions either side of each rose, the
 *   three-storey range between the two with its mansard and the clock;
 * - behind, the two halls, and the long platform canopies running out over the track fan to the north.
 *
 * One model at its own point: OSM's outline (way 280670907, one way for head and halls) and the platforms, in this
 * entry's frame (stations/data.ts), front −z to the place (bearing 201°).
 */
export function gareDeLest(out: MeshBuilder): void {
  const stone = hex('#ddd3be')
  const deep = shade(stone, 0.85)
  const pale = shade(stone, 1.04)
  const slate = hex('#535b64')
  const glass: Rgb = [0.2, 0.24, 0.27]
  const bars: Rgb = [0.25, 0.28, 0.27]
  const face: Face = { kind: 'punched', wall: stone, glass, floor: 5, pitch: 4.4, solid: 0.55, arched: true, material: 'ashlar' }
  // (OSM's outline is surveyed to the pilaster — 600 points — and dressed as it is, every jog took a band of its own)
  const ring = simplifyRing(toP(EST_PARTS.outline[0].ring), 2, 0.12)
  const zBack = -163                         // the head range's depth, to the halls
  // ---- the body: the head range (three storeys and a mansard), and the low concourse behind it
  const head = clipBox(ring, -200, 200, -200, zBack)
  const frontEdges = head.map((_, i) => i).filter((i) => {
    const a = head[i], b = head[(i + 1) % head.length], L = Math.hypot(b.x - a.x, b.z - a.z) || 1
    return (b.x - a.x) / L > 0.9 && a.z < zBack - 8
  })
  mansard(out, head, 20, 26, face, slate, 2.8, frontEdges)
  const rest = clipBox(ring, -200, 200, zBack, 200)
  faceBand(out, rest, 0, 12.5, { ...face, floor: 6.2 })
  capPolygon(out, rest, 12.5, hex('#666b6e'), surfaceTag('metal'))
  const zAt = frontOr(head, -182.5)

  // ---- the portico the length of the front: arches between piers, the marquise's glass roof over it
  const zp = -187.6
  const px0 = -88, px1 = 88
  const n = Math.round((px1 - px0) / 5.6)
  for (let i = 0; i <= n; i++) {
    const x = px0 + ((px1 - px0) * i) / n
    block(out, x - 0.55, x + 0.55, zp, zp + 0.9, 0, 7.4, shade(stone, 0.97))
    if (i < n) archBand(out, zp - 0.02, x + (px1 - px0) / n / 2, 5.4, (px1 - px0) / n / 2 - 0.55, (px1 - px0) / n / 2 + 0.05, pale, 8)
  }
  block(out, px0 - 0.6, px1 + 0.6, zp - 0.3, zp + 1, 7.4, 9.4, deep)
  block(out, px0 - 0.6, px1 + 0.6, zp - 0.4, zp + 0.6, 9.4, 10.2, pale)
  block(out, px0, px1, zp, -182.4, 9.2, 9.4, [0.42, 0.5, 0.53])
  engraved(out, "GARE DE L'EST", 0, 8.4, zp - 0.36, 0.9, 20)

  // ---- the range between the roses, and its clock
  range(out, -24.6, 24.1, zAt, { stone, glass, eaves: 20, arcade: 9.4, dormers: true })
  clockFace(out, 0, 17.2, zAt(0) - 0.4, 0, -1, 1.2)

  // ---- the stone pavilions either side of each rose: two storeys of arched windows, a balustrade
  for (const [a, b] of [[-88.1, -76.4], [-38.1, -26.8], [26.1, 37.7], [75.9, 87.6]]) {
    const z = Math.min(zAt((a + b) / 2), -186)
    block(out, a, b, z, zBack, 0, 22, stone)
    for (const y of [11, 16.2]) for (const f of [0.3, 0.7]) archedPane(out, z - 0.05, a + (b - a) * f, y, 1.8, 3.6, glass)
    block(out, a - 0.4, b + 0.4, z - 0.7, zBack, 20.6, 22, deep)
    block(out, a, b, z - 0.3, zBack, 22, 23.3, pale)
  }

  // ---- the roses: the hall's glazed end in the pediment, with its statue on the apex
  for (const [cx, who] of [[-57.2, 'STRASBOURG'], [57, 'VERDUN']] as const) {
    const w = 34, z = zAt(cx) - 0.2
    block(out, cx - w / 2, cx + w / 2, z, zBack, 0, 12.6, stone)
    pediment(out, cx - w / 2 - 0.4, cx + w / 2 + 0.4, z - 0.4, 12.6, 16.5, zBack - z, stone)
    glazedArch(out, z - 0.45, cx, 13.4, 25, 12.5, glass, bars, { pitch: 1.8, fan: true, transoms: [] })
    archBand(out, z - 0.5, cx, 13.4, 12.5, 14, pale, 20)
    // its raking cornices, and the frieze of the gable's base
    block(out, cx - w / 2 - 0.6, cx + w / 2 + 0.6, z - 1.1, z, 12.2, 13.4, deep)
    statue(out, cx, 29.1, z + 0.8, 4.4, pale)
    // the arches of the ground floor behind the portico
    for (const f of [-0.33, 0, 0.33]) archedPane(out, z - 0.05, cx + f * w, 0.4, 6, 8, glass)
    engraved(out, who, cx, 11.4, z - 1.16, 0.7, 12)
  }

  // ---- the two halls behind the roses: barrel vaults over the concourse and the platforms' heads
  trainShed(out, EST_SHED, {
    spans: [
      { a: -72.2, b: -42.2, kind: 'arch', eaves: 12.6, rise: 14.5, z0: zBack },
      { a: 42, b: 72, kind: 'arch', eaves: 12.6, rise: 14.5, z0: zBack },
    ],
    roof: hex('#5a6166'),
    glass: [0.5, 0.58, 0.62],
    iron: [0.24, 0.27, 0.27],
    bay: 8,
    glazed: 0.6,
    ends: { head: false, throat: true },
    snap: 0,
  })
  // ---- and the canopies down the platforms, out over the track fan
  canopies(out, EST_SHED, -98, 190, { colour: hex('#5d6660') })
}
