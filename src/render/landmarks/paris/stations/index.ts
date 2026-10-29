/**
 * The great railway termini and their sheds (PARIS_PARITY.md: "There are a whole lot of train stations, with their trains"). One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/stations.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'

export const PARIS_STATIONS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
}
