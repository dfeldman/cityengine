/**
 * Batch 12 (2026-10-31): the Opus trial, four buildings cheaper models failed on. Written by claude-opus-5-5 (every entry says so).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { perretFranklin, maisonCambodge, palatino, malakoffSlab } from './buildings.ts'

export const PARIS_BATCH12: Record<string, (out: MeshBuilder, fit: Fit) => void> = { perretFranklin, maisonCambodge, palatino, malakoffSlab }
