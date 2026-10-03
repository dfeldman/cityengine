/**
 * GRACE CATHEDRAL (Lewis Hobart, 1928–64; way/32946942): French Gothic in reinforced concrete, its west front
 * modelled on Notre-Dame de Paris — twin square towers, the rose window between them, the long buttressed nave and
 * a slender flèche at the crossing. Found in the appearance audit (2026-10-02) as a 53 m "classical" box.
 *
 * So it IS the Paris model (render/landmarks/paris/notre-dame-full.ts), at Grace's size: the manifest scales it
 * 0.75 (Notre-Dame's 69 m towers → Grace's ~52 m; OSM's footprint 96 x 44 m against Notre-Dame's 128 x 48) and
 * turns its west front to Taylor Street. The concrete is a shade greyer than Notre-Dame's limestone, which the
 * shared builder does not take as a parameter; the gist is the silhouette, and the silhouette is the same.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { notreDameFull } from '../paris/notre-dame-full.ts'

export function graceCathedral(out: MeshBuilder, fit: Fit): void {
  notreDameFull(out, fit)
}
