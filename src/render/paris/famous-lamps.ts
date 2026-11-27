/**
 * Paris's signature street lamps (owner, 2026-11-26: "famous lamps"), beyond the everyday candelabra of furniture.ts.
 * Placed by the rows in render/lamp-rules.ts. Frames are the lamp loop's: foot at the origin, +z along the street,
 * local −x towards the road, so the arms reach to −x.
 *
 * CHAMPS-ÉLYSÉES: the 1994 renovation (Bernard Huet, furniture by Jean-Michel Wilmotte) set "grands candélabres de douze
 * mètres de hauteur" along the avenue, alternating with replicas of Hittorff's old lamps (Larousse, Journal de l'année
 * 1995, https://www.larousse.fr/archives/journaux_annee/1995/215/bd). The slender black mast with its single curved
 * arm over the carriageway is drawn from memory of that view (photos: Commons "Champs-Élysées, 2 August 2015 001.jpg");
 * the Hittorff replicas (a ~4 m cast column and lantern, Fontes de Paris "Champs Élysées" candélabre) are not modelled.
 *
 * BOULEVARDS DES MARÉCHAUX: the outer ring's tram boulevards carry plain modern masts, a tapered steel pole, one arm
 * over the road and a flat LED head, in a grey-green. Dimensions are typical of EN 40 road lighting, not measured.
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, EMIT, FIXED, LAMP_LIGHTS, lathe, tube, type Rgb } from '../models.ts'

const IRON: Rgb = [0.1, 0.14, 0.12]
const MAST_GREY: Rgb = [0.3, 0.34, 0.32]
const GLASS: Rgb = [0.95, 0.9, 0.78]
const LED: Rgb = [0.92, 0.95, 1]

/** tunables (metres) */
export const CE = { h: 12, arm: 1.7, rise: 0.75, baseR: 0.2, mastR0: 0.1, mastR1: 0.05 }
export const MAR = { h: 9, arm: 1.9, mastR0: 0.1, mastR1: 0.055 }

/** Champs-Élysées Wilmotte mast: moulded base, long taper, a swan-neck arm and a round hooded luminaire */
export function champsElyseesMast(out: MeshBuilder): void {
  const H = CE.h
  // base: plinth, moulded cap, then the foot sleeve
  lathe(out, 0, 0, [[CE.baseR, 0], [CE.baseR, 0.18], [0.14, 0.24], [0.14, 1.0], [0.12, 1.06], [CE.mastR0 + 0.01, 1.12]], 8, IRON, FIXED)
  // the mast: one long taper, with a collar at two-thirds
  lathe(out, 0, 0, [[CE.mastR0, 1.12], [0.075, H * 0.62], [0.088, H * 0.62], [0.088, H * 0.62 + 0.06], [0.07, H * 0.62 + 0.1], [CE.mastR1, H - 0.1]], 6, IRON, FIXED)
  // swan-neck arm over the road (to −x), rising then dipping to the luminaire's seat
  const a = CE.arm, y0 = H - 0.15
  tube(out, [[0, y0, 0], [-0.1, y0 + 0.35, 0], [-0.45, y0 + CE.rise, 0], [-a * 0.8, y0 + CE.rise - 0.06, 0], [-a, y0 + CE.rise - 0.3, 0]],
    [0.052, 0.045, 0.04, 0.034, 0.03], 5, IRON)
  // a finial cap on the mast top
  lathe(out, 0, 0, [[0.06, H - 0.1], [0.045, H + 0.02], [0, H + 0.2]], 4, IRON, FIXED)
  // luminaire: a round hood over a glowing lens
  const lx = -a, ly = y0 + CE.rise - 0.38
  lathe(out, lx, 0, [[0.05, ly + 0.34], [0.2, ly + 0.28], [0.3, ly + 0.12], [0.3, ly + 0.04]], 8, IRON, FIXED, { capBottom: false })
  lathe(out, lx, 0, [[0.29, ly + 0.05], [0.2, ly - 0.02], [0.0, ly - 0.05]], 8, GLASS, EMIT)
}
LAMP_LIGHTS.set(champsElyseesMast, [{ at: [-CE.arm, CE.h + CE.rise - 0.45, 0], r: 11 }])

/** Maréchaux masts: tapered grey-green steel pole, one arm over the carriageway, a flat LED head */
export function marechauxMast(out: MeshBuilder): void {
  const H = MAR.h, a = MAR.arm
  lathe(out, 0, 0, [[0.16, 0], [0.16, 0.5], [0.12, 0.55], [MAR.mastR0, 0.6], [MAR.mastR1, H]], 8, MAST_GREY, FIXED)
  // the arm: a short rise and a straight run, tilted slightly up
  tube(out, [[0, H - 0.2, 0], [-0.25, H + 0.1, 0], [-a * 0.6, H + 0.28, 0], [-a, H + 0.36, 0]], [0.05, 0.042, 0.035, 0.03], 5, MAST_GREY)
  // the head: a long flat casing with its lens underneath, along the street (z)
  box(out, -a - 0.1, H + 0.38, 0, 0.3, 0.06, 0.12, MAST_GREY, FIXED)
  box(out, -a - 0.1, H + 0.31, 0, 0.27, 0.012, 0.1, LED, EMIT)
}
LAMP_LIGHTS.set(marechauxMast, [{ at: [-MAR.arm - 0.1, MAR.h + 0.3, 0], r: 10 }])
