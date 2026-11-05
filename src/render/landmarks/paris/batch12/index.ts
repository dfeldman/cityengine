/**
 * Batch 12 (2026-10-31): the Opus trial, four buildings cheaper models failed on. Written by claude-opus-5-5 (every entry says so).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { perretFranklin, palatino, malakoffSlab } from './buildings.ts'
import { castelBeranger, hotelMezzara } from './guimard.ts'
import { villaAllatini, villaDreyfus, hotelMartel, villaReifenberg, hotelMalletStevens } from './malletstevens.ts'
import { immeubleLavirotte, ceramicHotel } from './lavirotte.ts'
import { eauxMinerales, sgraffiti } from './decorated.ts'

export const PARIS_BATCH12: Record<string, (out: MeshBuilder, fit: Fit) => void> = { perretFranklin, palatino, malakoffSlab, castelBeranger, hotelMezzara, immeubleLavirotte, ceramicHotel, eauxMinerales, sgraffiti, villaAllatini, villaDreyfus, hotelMartel, villaReifenberg, hotelMalletStevens }
