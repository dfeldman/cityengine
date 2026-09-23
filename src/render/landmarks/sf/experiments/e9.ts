/**
 * Experiment 9 of MODELING_IMPROVEMENT_1.md — the batch-of-TWENTY test.
 *
 * Batching ten buildings into one session cost 11-14k tokens each against 82k for a building on its own,
 * so the obvious question is whether twenty is cheaper still, or whether quality falls away as the list
 * gets long. Builders are named `e9_*` to keep the flat PROCEDURAL keyspace collision-free (BUGS.md #92).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'

export const EXP_9: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
}
