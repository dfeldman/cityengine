/**
 * Sports venues and the parks' own structures: the stadiums, Roland-Garros, the Accor Arena, the Bois's pavilions. One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/venues.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'

export const PARIS_VENUES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
}
