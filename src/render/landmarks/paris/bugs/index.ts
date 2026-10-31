/**
 * What PARIS_BUGS.md's open items wanted modelled, none of them a batch's (docs/landmarks/PARIS-BATCHES.md). Each is named by an entry in public/landmarks/paris/bugs.json (included from paris.json ahead of civic.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { vendomeFronts } from './vendome.ts'

export const PARIS_BUGS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { vendomeFronts }
