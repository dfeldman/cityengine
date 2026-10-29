/**
 * The palaces and the government's great houses, anywhere in the box (owner: "We should do the palace and monuments tho"). One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/palaces.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { luxembourgPalace } from './luxembourg.ts'
import { medicisFountain } from './medicis-fountain.ts'

export const PARIS_PALACES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  luxembourgPalace,
  medicisFountain,
}
