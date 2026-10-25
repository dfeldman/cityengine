/**
 * DOWNTOWN, TIER 4 — the most prominent buildings still drawn generic or refaced in SoMa by Market, Union Square, the
 * Tenderloin, Civic Center, Chinatown, the FiDi's north edge and lower Nob Hill (docs/TIER4-QUEUE.md; owner,
 * 2026-10-25: "All 158. Do one subagent at a time"). Each builder replaces a `restyle` (reface) or nothing; its manifest
 * entry is in public/landmarks/san-francisco/downtown-t4.json, and its notes say which photographs it was drawn from.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing, type Face } from '../tower.ts'
import { boxAlong, colonnade, edgeAt, signText } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { box, prism, type Rgb } from '../../models.ts'

void tower; void towerRing; void boxAlong; void colonnade; void edgeAt; void signText; void surfaceTag; void box; void prism
export type { Face, Rgb }

export const DOWNTOWN_T4: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
}
