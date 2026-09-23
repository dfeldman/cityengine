/**
 * Experiment 10 of MODELING_IMPROVEMENT_1.md — the DOCUMENTATION test.
 *
 * Across nine runs, `arcade()` went unused by every one of them and `colonnade()` was used only by the four
 * whose brief gave its signature inline. So the hypothesis is that the failures on Leidesdorff Place, the
 * Curb Exchange and the Pacific Exchange are a documentation gap rather than a capability one. This run gets
 * the same model, buildings and photographs as E7, and a brief that documents the shared parts properly.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'

export const EXP_10: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
}
