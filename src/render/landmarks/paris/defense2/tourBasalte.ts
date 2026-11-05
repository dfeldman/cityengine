/**
 * Tour Basalte (Immeuble Basalte, Puteaux, Ateliers 123 / Mas & Roux, Société Générale; OSM way/298132587, no parts, 54 m):
 * a long curving office block on OSM's ring, a dark basalt-grey glazed skin with thin pale mullions, a recessed dark
 * glazed lobby and a flat roof with a low parapet. OSM's building:levels=7 is far too few for 54 m, so the floor
 * height is a guess; the tones are guesses too, to check against a street view.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { tower } from '../../tower.ts'

const HEIGHT = 54
const LOBBY_H = 5
const WALL = '#4a4e52', GLASS = '#2c3640', ROOF = '#5a5d60', LOBBY = '#242b31', PARAPET = '#6a6d70'
const FLOOR = 3.6, PITCH = 1.5, SOLID = 0.3, PARAPET_H = 1.2

export const tourBasalte = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: HEIGHT, roof: hex(ROOF),
  base: { height: LOBBY_H, face: { kind: 'blank', wall: hex(LOBBY), material: 'concrete' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex(WALL), glass: hex(GLASS), floor: FLOOR, pitch: PITCH, solid: SOLID, material: 'concrete' } }],
  crown: { kind: 'parapet', height: PARAPET_H, colour: hex(PARAPET) },
})
