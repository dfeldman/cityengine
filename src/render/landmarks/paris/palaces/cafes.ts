import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, roof, windows } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from './common.ts'
import { cafeFront } from '../kit/cafe.ts'

/** Tunable: the generic Haussmann block above a café, per café */
interface Above { hx: number; hz: number; eaves: number; wall: string; slate: string; bay: number; floors: number[] }

function above(out: MeshBuilder, a: Above, ground: number): void {
  const wall = hex(a.wall)
  const glass = hex('#2b3036')
  const frame = hex('#b9b09a')
  block(out, -a.hx, a.hx, -a.hz, a.hz, 0, a.eaves, wall)
  block(out, -a.hx - 0.1, a.hx + 0.1, -a.hz - 0.1, a.hz + 0.1, ground, ground + 0.35, hex('#cfc6b0'))
  for (const y of a.floors) {
    windows(out, '-z', -a.hz, -a.hx + 0.8, a.hx - 0.8, y, 1.0, 2.0, a.bay, glass, frame)
    windows(out, '+x', a.hx, -a.hz + 0.8, a.hz - 0.8, y, 1.0, 2.0, a.bay, glass, frame)
    windows(out, '-x', -a.hx, -a.hz + 0.8, a.hz - 0.8, y, 1.0, 2.0, a.bay, glass, frame)
    windows(out, '+z', a.hz, -a.hx + 0.8, a.hx - 0.8, y, 1.0, 2.0, a.bay, glass, frame)
  }
  block(out, -a.hx - 0.15, a.hx + 0.15, -a.hz - 0.15, a.hz + 0.15, a.eaves - 0.3, a.eaves, hex('#cfc6b0'))
  roof(out, -a.hx, a.hx, -a.hz, a.hz, a.eaves, 4.2, 2.2, 2.2, hex(a.slate))
}

// ---------------------------------------------------------------- Café de Flore
/** OSM way 124592808's box turned to the Boulevard Saint-Germain (local −z faces bearing 190.8; +x toward the Rue Saint-Benoît) */
const FLORE = { hx: 7.75, hz: 4.9 }
const FLORE_UP: Above = { ...FLORE, eaves: 19, wall: '#d9cfb6', slate: '#4f565b', bay: 2.7, floors: [5.2, 8.3, 11.4, 14.5] }

/** Café de Flore, 172 boulevard Saint-Germain: dark green wood front, gold lettering, wicker chairs on the pavement, awnings. */
export function cafeDeFlore(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, FLORE.hx, FLORE.hz, (q) => {
    above(q, FLORE_UP, 4.4)
    const style = { wood: hex('#2c4a3a'), fascia: hex('#2c4a3a'), fasciaText: 'CAFE DE FLORE', height: 4.4, awning: [hex('#6e1f24'), hex('#e9e1cc')],
      awningText: '', chairs: hex('#b87a3d'), rows: 1, terraceDepth: 3.2 }
    cafeFront(q, '-z', -FLORE.hz, -FLORE.hx + 0.2, FLORE.hx - 0.2, style)
    cafeFront(q, '+x', FLORE.hx, -FLORE.hz + 0.3, 1.5, { ...style, fasciaText: '' })
  })
}

// ---------------------------------------------------------------- Les Deux Magots
/** OSM way 124592746's box turned to the Place Saint-Germain-des-Prés (−z bearing 196.4; +x toward the Rue Bonaparte) */
const MAGOTS = { hx: 12.45, hz: 17.75 }
const MAGOTS_UP: Above = { ...MAGOTS, eaves: 21, wall: '#d6cbb0', slate: '#4a5156', bay: 2.8, floors: [5.0, 8.1, 11.2, 14.3, 17.4] }

/** Les Deux Magots, 6 place Saint-Germain-des-Prés: green front with gold lettering, green awnings, wicker terrace to the square. */
export function lesDeuxMagots(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, MAGOTS.hx, MAGOTS.hz, (q) => {
    above(q, MAGOTS_UP, 4.6)
    const style = { wood: hex('#264a34'), fascia: hex('#264a34'), fasciaText: 'LES DEUX MAGOTS', height: 4.6, fasciaLetter: 0.55,
      awning: [hex('#2f5a3f')], awningText: 'LES DEUX MAGOTS', awningLetter: hex('#efe8d2'), chairs: hex('#a8692f'), rows: 2, terraceDepth: 4.4 }
    cafeFront(q, '-z', -MAGOTS.hz, -MAGOTS.hx + 0.2, MAGOTS.hx - 0.2, style)
    cafeFront(q, '+x', MAGOTS.hx, -MAGOTS.hz + 0.3, -MAGOTS.hz + 10, { ...style, fasciaText: '', awningText: '', rows: 1, terraceDepth: 3 })
  })
}

// ---------------------------------------------------------------- Fouquet's
/** OSM ways 138208766 + 138208828 turned to the Champs-Élysées (−z faces bearing 19; −x toward the Avenue George V) */
const FOUQUET = { hx: 18.8, hz: 17 }
const FOUQUET_UP: Above = { ...FOUQUET, eaves: 20, wall: '#ddd3bb', slate: '#4a5156', bay: 3, floors: [5.4, 8.6, 11.8, 15] }

/** Fouquet's, 99 avenue des Champs-Élysées at the Avenue George V: red awnings round the corner, red rattan, gold sign. */
export function fouquets(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, FOUQUET.hx, FOUQUET.hz, (q) => {
    above(q, FOUQUET_UP, 4.8)
    const red = hex('#a3141c')
    const style = { wood: hex('#5a1218'), fascia: hex('#5a1218'), fasciaText: "FOUQUET'S", height: 4.8, fasciaLetter: 0.6, awning: [red],
      awningText: "FOUQUET'S", awningLetter: hex('#f1e7cf'), awningDepth: 2.4, awningDrop: 0.8, awningBay: 4, valance: 0.45,
      chairs: red, rows: 2, terraceDepth: 5 }
    cafeFront(q, '-z', -FOUQUET.hz, -FOUQUET.hx + 0.2, FOUQUET.hx - 0.2, style)
    cafeFront(q, '-x', -FOUQUET.hx, -FOUQUET.hz + 0.3, FOUQUET.hz - 0.3, { ...style, awningText: '' })
  })
}

// ---------------------------------------------------------------- Montparnasse: La Coupole, Le Dôme, La Rotonde
/**
 * OSM way 79621186 (La Coupole, 102 boulevard du Montparnasse, listed MH), its north-east face on the boulevard
 * (−z bearing 27; +x toward the Rue Delambre side, bearing 117, along the boulevard).
 */
const COUPOLE = { hx: 24, hz: 14 }
const COUPOLE_UP: Above = { ...COUPOLE, eaves: 22, wall: '#cfc4a8', slate: '#4a5156', bay: 2.8, floors: [6.2, 9.3, 12.4, 15.5, 18.6] }

/** La Coupole: the long low Art Deco front, a tall gold-lettered sign board over dark wood and piers, a red awning the length of it. */
export function laCoupole(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, COUPOLE.hx, COUPOLE.hz, (q) => {
    above(q, COUPOLE_UP, 5.2)
    const red = hex('#a3141c')
    cafeFront(q, '-z', -COUPOLE.hz, -COUPOLE.hx + 0.2, COUPOLE.hx - 0.2, {
      wood: hex('#3a2418'), fascia: hex('#3a2418'), fasciaText: '', height: 4.2, glass: hex('#2a2b2a'), mullion: 2.4,
      signText: 'LA COUPOLE', signLetter: 1.1, signBoard: hex('#16231d'), signHeight: 1.7, signRise: 0.15,
      pierStep: 4.8, pierWidth: 0.45, awning: [red], awningText: 'LA COUPOLE', awningDepth: 2.3, awningDrop: 0.9,
      awningBay: 4.8, valance: 0.45, chairs: hex('#7a1d1d'), rows: 2, terraceDepth: 4.4,
    })
  })
}

/** OSM way 79621503 (Le Dôme, 108 boulevard du Montparnasse) turned to the boulevard (−z bearing 27; +x toward the Boulevard Raspail corner, bearing 117). */
const DOME = { hx: 15, hz: 12 }
const DOME_UP: Above = { ...DOME, eaves: 24, wall: '#d4c8aa', slate: '#4f565b', bay: 2.8, floors: [5.6, 8.7, 11.8, 14.9, 18, 21] }

/** Le Dôme: a cream Art Deco front, dark-green awnings round the Raspail corner. */
export function leDome(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, DOME.hx, DOME.hz, (q) => {
    above(q, DOME_UP, 4.6)
    const green = hex('#1f4a3a')
    const style = { wood: hex('#d9cfae'), fascia: hex('#1f4a3a'), fasciaText: 'LE DOME', height: 4.4, fasciaLetter: 0.6, signText: '',
      pierStep: 3.6, pierWidth: 0.35, awning: [green], awningText: 'LE DOME', awningDepth: 2.2, awningDrop: 0.8, awningBay: 3.6,
      chairs: hex('#9a5f2c'), rows: 2, terraceDepth: 4 }
    cafeFront(q, '-z', -DOME.hz, -DOME.hx + 0.2, DOME.hx - 0.2, style)
    cafeFront(q, '+x', DOME.hx, -DOME.hz + 0.3, DOME.hz - 0.3, { ...style, fasciaText: '', awningText: '', rows: 1, terraceDepth: 3 })
  })
}

/** OSM way 64113838 (La Rotonde, 105 boulevard du Montparnasse, the corner of the Boulevard Raspail) turned to the boulevard (−z bearing 206; +x toward Raspail, bearing 116). */
const ROTONDE = { hx: 15, hz: 12 }
const ROTONDE_UP: Above = { ...ROTONDE, eaves: 22, wall: '#d8cdb0', slate: '#4f565b', bay: 2.8, floors: [5.6, 8.7, 11.8, 14.9, 18] }

/** La Rotonde: red awnings and red wicker on the corner terrace, red-lettered fascia. */
export function laRotonde(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, ROTONDE.hx, ROTONDE.hz, (q) => {
    above(q, ROTONDE_UP, 4.6)
    const red = hex('#b3171f')
    const style = { wood: hex('#4a1a1c'), fascia: hex('#4a1a1c'), fasciaText: 'LA ROTONDE', height: 4.4, fasciaLetter: 0.6, signText: '',
      pierStep: 3.6, pierWidth: 0.3, awning: [red], awningText: 'LA ROTONDE', awningDepth: 2.3, awningDrop: 0.85, awningBay: 3.7,
      chairs: red, rows: 2, terraceDepth: 4.2 }
    cafeFront(q, '-z', -ROTONDE.hz, -ROTONDE.hx + 0.2, ROTONDE.hx - 0.2, style)
    cafeFront(q, '+x', ROTONDE.hx, -ROTONDE.hz + 0.3, ROTONDE.hz - 0.3, { ...style, fasciaText: '', awningText: '', rows: 1, terraceDepth: 3 })
  })
}

// ---------------------------------------------------------------- Maxim's, Bouillon Chartier, Ladurée Champs-Élysées
/** OSM way 67109756's street frontage on the west side of the Rue Royale (−z faces bearing 115, toward the street; +x runs north up it) */
const MAXIMS = { hx: 8, hz: 6 }
const MAXIMS_UP: Above = { ...MAXIMS, eaves: 21, wall: '#d8cdb2', slate: '#4a5156', bay: 2.8, floors: [5.4, 8.5, 11.6, 14.7, 17.8] }

/** Maxim's, 3 rue Royale: the Art Nouveau front in dark red mahogany, gold lettering on the fascia, a red awning, a few chairs. */
export function maxims(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, MAXIMS.hx, MAXIMS.hz, (q) => {
    above(q, MAXIMS_UP, 4.6)
    const style = { wood: hex('#4a1512'), fascia: hex('#3a0f0e'), fasciaText: "MAXIM'S", height: 4.6, fasciaLetter: 0.7, mullion: 1.2,
      awning: [hex('#8f1a20')], awningText: "MAXIM'S", awningLetter: hex('#e7c768'), awningDepth: 1.8, awningDrop: 0.8, awningBay: 4,
      chairs: hex('#6b2420'), rows: 1, terraceDepth: 2.6 }
    cafeFront(q, '-z', -MAXIMS.hz, -MAXIMS.hx + 0.2, MAXIMS.hx - 0.2, style)
  })
}

/** OSM way 1085278's front on the Rue du Faubourg-Montmartre (the strip runs 50 m back; only the street end is drawn; −z faces bearing 90, east) */
const CHARTIER = { hx: 5.5, hz: 6 }
const CHARTIER_UP: Above = { ...CHARTIER, eaves: 17, wall: '#cfc4a6', slate: '#4a5156', bay: 2.7, floors: [5.6, 8.6, 11.6, 14.4] }
/** Tunable: the passage entry's width, the lamps' height and spacing on the Chartier front */
const CHARTIER_DOOR = 2.6
const CHARTIER_LAMP = { y: 4.2, step: 3.6, size: 0.45 }

/** Bouillon Chartier, 7 rue du Faubourg-Montmartre: brown painted front, the big lettered sign over a dark passage entry, globe lamps. */
export function bouillonChartier(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, CHARTIER.hx, CHARTIER.hz, (q) => {
    above(q, CHARTIER_UP, 4.9)
    const style = { wood: hex('#4b2e1c'), fascia: hex('#4b2e1c'), fasciaText: '', height: 4.9, mullion: 1.4,
      signText: 'BOUILLON CHARTIER', signLetter: 0.55, signBoard: hex('#e4d29a'), signGold: hex('#3a2012'), signHeight: 1.2, signRise: 0.1,
      awning: [hex('#6a1f1c')], awningText: '', awningDepth: 1.0, awningDrop: 0.5, awningBay: 3.6, valance: 0.3,
      chairs: hex('#3a2012'), rows: 0, terraceDepth: 1.5 }
    cafeFront(q, '-z', -CHARTIER.hz, -CHARTIER.hx + 0.2, CHARTIER.hx - 0.2, style)
    const z = -CHARTIER.hz
    block(q, -CHARTIER_DOOR / 2, CHARTIER_DOOR / 2, z - 0.12, z + 0.1, 0, 3.4, hex('#15100c'))
    for (let x = -CHARTIER.hx + 1.4; x <= CHARTIER.hx - 1.3; x += CHARTIER_LAMP.step) {
      const s = CHARTIER_LAMP.size / 2
      block(q, x - 0.04, x + 0.04, z - 0.5, z - 0.1, CHARTIER_LAMP.y + 0.3, CHARTIER_LAMP.y + 0.38, hex('#1a1a1a'))
      block(q, x - s, x + s, z - 0.5 - s, z - 0.5 + s, CHARTIER_LAMP.y - 0.3, CHARTIER_LAMP.y + 0.3, hex('#f3e2a6'))
    }
  })
}

/** OSM way 926307484's end on the Champs-Élysées (−z faces bearing 25 toward the avenue; +x runs along it, east) */
const LADUREE = { hx: 5.6, hz: 6 }
const LADUREE_UP: Above = { ...LADUREE, eaves: 18, wall: '#dcd2b8', slate: '#4a5156', bay: 2.8, floors: [5.4, 8.4, 11.4, 14.4] }

/** Ladurée, 75 avenue des Champs-Élysées: pale-green painted front, gold lettering, green awnings, a few chairs. */
export function laduree(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, LADUREE.hx, LADUREE.hz, (q) => {
    above(q, LADUREE_UP, 4.6)
    const green = hex('#6f9c80')
    cafeFront(q, '-z', -LADUREE.hz, -LADUREE.hx + 0.2, LADUREE.hx - 0.2, {
      wood: hex('#b7d0bd'), fascia: hex('#a9c7b2'), fasciaText: 'LADUREE', height: 4.6, fasciaLetter: 0.7, mullion: 1.3,
      awning: [green], awningText: 'LADUREE', awningLetter: hex('#f1e9cf'), awningDepth: 1.9, awningDrop: 0.75, awningBay: 2.8,
      chairs: hex('#8fb39b'), tableTop: hex('#efe9d6'), rows: 1, terraceDepth: 2.8 })
  })
}
