/**
 * EXPO batch (2026-11-05): Porte de Versailles / Balard / Issy (plans/expo-area.md). Distance fidelity: shape, colour, size. One file per builder; each entry's madeBy names its maker.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fountainExpo } from './fountainExpo.ts'
import { pavilion1 } from './pavilion1.ts'
import { pavilion4 } from './pavilion4.ts'
import { pavilion5 } from './pavilion5.ts'
import { pavilion6 } from './pavilion6.ts'
import { pavilion7 } from './pavilion7.ts'

export const PARIS_EXPO: Record<string, (out: MeshBuilder, fit: Fit) => void> = { pavilion5, pavilion7, pavilion1, pavilion4, pavilion6, fountainExpo }
