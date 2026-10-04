/**
 * THE SPEAKER TOWERS at Aquatic Park (1930s WPA, Streamline Moderne; ways 288388248, 564206112, "Speaker Tower"),
 * found on the museums audit, 2026-10-04: OSM's 5 × 4 m, 11 m buildings were drawn as two narrow Victorian houses
 * standing on the lawn, one red, one pink. From Commons ("StreamlineModerneTower.jpg"): white concrete, a slender
 * fluted column flaring at the top into a round drum ringed by horizontal louvres, a thin lip over it.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const WHITE: Rgb = [0.92, 0.92, 0.9]
const SLOT: Rgb = [0.3, 0.32, 0.34]

function speakerTower(out: MeshBuilder, _fit: Fit): void {
  const c = surfaceTag('concrete')
  prism(out, 0, 0, 0, 7.4, 0.8, 12, WHITE, c, 0.75)
  // the flare, the drum and its louvres: white rings with dark slots between them
  prism(out, 0, 0, 7.4, 8.3, 0.75, 20, WHITE, c, 2.1)
  prism(out, 0, 0, 8.3, 8.6, 2.15, 24, WHITE, c)
  for (let k = 0; k < 4; k++) {
    const y = 8.6 + k * 0.55
    prism(out, 0, 0, y, y + 0.35, 1.95, 24, SLOT, 0)
    prism(out, 0, 0, y + 0.35, y + 0.55, 2.15, 24, WHITE, c)
  }
  prism(out, 0, 0, 10.8, 11, 2.25, 24, WHITE, c)
}

/**
 * THE POTRERO POWER STATION STACK (way/678950945, `man_made=smoke_stack`, 91.44 m — the 300 ft stack kept as the
 * centrepiece of the Power Station redevelopment in Dogpatch), 2026-10-04: drawn as an 11 × 11 m glass skyscraper,
 * since the bake's infrastructure filter knows `chimney` but not `smoke_stack`. A slender tapering concrete column,
 * a band of darker concrete at its lip, the ring of the platform near the top.
 */
function potreroStack(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 40 ? fit.height : 91.44
  const R0 = Math.max(3.5, Math.min(fit.hx, fit.hz)), R1 = R0 * 0.55
  const c = surfaceTag('concrete')
  const at = (y: number): number => R0 + (R1 - R0) * (y / H)
  prism(out, 0, 0, 0, H - 4, R0, 20, [0.72, 0.71, 0.68], c, at(H - 4))
  prism(out, 0, 0, H - 4, H, at(H - 4), 20, [0.36, 0.34, 0.32], c, R1)
  prism(out, 0, 0, H - 9, H - 8.5, at(H - 9) + 0.9, 20, [0.3, 0.3, 0.3], surfaceTag('metal'), at(H - 8.5) + 0.9)
}

/**
 * THE AUXILIARY WATER SUPPLY TANKS (1909–1913, the fire department's high-pressure system): the Ashbury tank
 * (way/247759532) and the Jones Street tank (way/247759163) on Nob Hill, drawn as 12 m apartment blocks with windows.
 * Commons ("Ashbury Heights tank, circa 1915", "Entrance to Jones Street tank"): a round riveted STEEL tank, painted,
 * under a low conical roof with a deep eave and a small cupola at its peak.
 */
function waterTank(out: MeshBuilder, fit: Fit): void {
  const R = Math.max(5, Math.min(fit.hx, fit.hz) - 0.3)
  const H = fit.height > 6 && fit.height < 20 ? fit.height : 11
  const STEEL: Rgb = [0.72, 0.72, 0.68], ROOF: Rgb = [0.36, 0.36, 0.35], m = surfaceTag('metal')
  prism(out, 0, 0, 0, H, R, 24, STEEL, m)
  for (let k = 1; k < 4; k++) prism(out, 0, 0, (H * k) / 4 - 0.08, (H * k) / 4 + 0.08, R + 0.05, 24, [0.6, 0.6, 0.57], m)
  prism(out, 0, 0, H, H + 0.5, R + 0.9, 24, ROOF, m, R + 0.9)
  prism(out, 0, 0, H + 0.5, H + 0.5 + R * 0.35, R + 0.9, 24, ROOF, m, 1.2)
  prism(out, 0, 0, H + 0.5 + R * 0.33, H + 1.6 + R * 0.35, 1.1, 8, ROOF, m, 0.9)
}

/** one name per tower (a builder named by two entries reads as a dead duplicate to the audits) */
export const SPEAKER_TOWERS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { speakerTowerEast: speakerTower, speakerTowerWest: speakerTower, potreroStack, ashburyTank: waterTank, jonesStreetTank: waterTank }
