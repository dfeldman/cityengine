/**
 * Immeuble Basalte (2013, Ateliers 234 — Jean Mas & Franck Tillequin, for Société Générale; OSM way/298132587): a long
 * blade of blue-green glass striped by projecting sunshade shelves at every floor, a white upturned canopy podium
 * and a white end fin. Height 52 m from BD TOPO; look from the fr.wikipedia infobox photo (L. Blossier).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { block, hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 52, LOBBY_H = 6, FLOOR = 4, PITCH = 1.5, SOLID = 0.12, CANOPY = 3, PARAPET_H = 2.5
// white end fin (proud of the +x end, full height) and the upturned podium canopy (rises toward -x)
const FIN_T = 2.2, FIN_PROUD = 1.2, FIN_OVER = 3, FIN_WIDE = 1.1
const CAN_Y = 6.5, CAN_RISE = 4, CAN_OUT = 6, CAN_T = 0.7, CAN_STEPS = 6
const SHELF = '#b9c4c4', GLASS = '#5f8a8c', LOBBY = '#3f5459', PODIUM = '#eeeeea', ROOF = '#7f8587', PARAPET = '#e8e9e6'

export const tourBasalte = (out: MeshBuilder, fit: Fit): void => {
  tower(out, fit, SPEC)
  const { hx, hz } = fit, h = fit.height > 0.6 * HEIGHT && fit.height < 1.6 * HEIGHT ? fit.height : HEIGHT, white = hex(PODIUM)
  block(out, hx - FIN_T + FIN_PROUD, hx + FIN_PROUD, -hz * FIN_WIDE, hz * FIN_WIDE, 0, h + FIN_OVER, white)
  for (let i = 0; i < CAN_STEPS; i++) {
    const x0 = -hx - CAN_OUT + (i * (2 * hx + CAN_OUT)) / CAN_STEPS, x1 = -hx - CAN_OUT + ((i + 1) * (2 * hx + CAN_OUT)) / CAN_STEPS
    const y = CAN_Y + CAN_RISE * (1 - (i + 0.5) / CAN_STEPS)
    block(out, x0, x1, -hz - CAN_OUT, -hz, y, y + CAN_T, white)
  }
}
const SPEC: Parameters<typeof tower>[2] = {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'curtain', wall: hex(PODIUM), glass: hex(LOBBY), floor: LOBBY_H, pitch: 4, material: 'glass' }, canopy: { depth: CANOPY, colour: hex(PODIUM) } },
  tiers: [{ to: 1, face: { kind: 'curtain', wall: hex(SHELF), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, depth: 0.5, material: 'glass' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET), material: 'panel' },
}
