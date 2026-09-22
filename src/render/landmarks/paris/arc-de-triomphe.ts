import type { MeshBuilder } from '../../buildings.ts'
import { block, hex, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

/**
 * The Arc de Triomphe (Chalgrin, 1806–36) at the centre of the Étoile: 50 m high, 45 m wide, 22 m deep, of pale
 * limestone. The gist:
 *
 * - four massive piers; the GREAT ARCH through each long face (14.6 m wide, 29 m to its crown) and the smaller
 *   arch through each short side (8.4 m wide, 18.7 m), both open — a rider sees the sky and the avenue through
 *   them, and on the Champs-Élysées the arch frames the view;
 * - the four sculpture groups standing proud of the piers on the long faces (the Marseillaise the best known);
 * - the deep cornice, the frieze of figures, the attic with its row of shields, the flat top.
 *
 * Long faces on ±z (the front, −z, down the Champs-Élysées); arches cut by stacking thin slices, so they are
 * real openings. Plain boxes otherwise: the stone treatment (BUGS #8) courses them.
 */
export function arcDeTriomphe(out: MeshBuilder, fit: Fit): void {
  void fit
  const stone = hex('#e4dccb')
  const deep = shade(stone, 0.88)
  const relief = shade(stone, 0.8)
  const hx = 22.5
  const hz = 11
  const gw = 7.3           // half the great arch's width
  const gSpring = 21.9     // where it springs; a semicircle to 29.2
  const tw = 4.2           // half the small arch's width
  const tSpring = 14.5     // to 18.7
  const crown = 29.2
  // the piers, in full up to the springing of the small arches
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      block(out, sx > 0 ? gw : -hx, sx > 0 ? hx : -gw, sz > 0 ? tw : -hz, sz > 0 ? hz : -tw, 0, crown, stone)
    }
  }
  // the small arches' vaults: across each pair of piers, filled above the curve up to the great arch's crown
  const slices = 22
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? gw : -hx
    const x1 = sx > 0 ? hx : -gw
    for (let i = 0; i < slices; i++) {
      const y0 = tSpring + (tw * i) / slices
      const y1 = tSpring + (tw * (i + 1)) / slices
      const w = tw * Math.sqrt(Math.max(0, 1 - Math.pow((y0 + y1) / 2 - tSpring, 2) / (tw * tw)))
      block(out, x0, x1, -tw, -w, y0, y1, stone)
      block(out, x0, x1, w, tw, y0, y1, stone)
    }
    block(out, x0, x1, -tw, tw, tSpring + tw, crown, stone)
  }
  // the great arches' vault: across the full depth between the piers
  for (let i = 0; i < slices; i++) {
    const y0 = gSpring + (gw * i) / slices
    const y1 = gSpring + (gw * (i + 1)) / slices
    const w = gw * Math.sqrt(Math.max(0, 1 - Math.pow((y0 + y1) / 2 - gSpring, 2) / (gw * gw)))
    block(out, -gw, -w, -hz, hz, y0, y1, stone)
    block(out, w, gw, -hz, hz, y0, y1, stone)
  }
  // the archivolt: a band round each great arch, a hand's breadth proud
  for (const sz of [-1, 1]) {
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI
      const x = Math.cos(a) * (gw + 0.6)
      const y = gSpring + Math.sin(a) * (gw + 0.6)
      block(out, x - 0.7, x + 0.7, sz * hz - (sz > 0 ? 0 : 0.25), sz * hz + (sz > 0 ? 0.25 : 0), y - 0.6, y + 0.6, deep)
    }
  }
  // the four sculpture groups on the long faces, standing out from the piers between 4 and 16 m
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cx = sx * (gw + hx) / 2
      const z = sz * hz
      block(out, cx - 5, cx + 5, sz > 0 ? z : z - 1.8, sz > 0 ? z + 1.8 : z, 3.2, 4.2, deep)          // the plinth
      block(out, cx - 3.2, cx + 3.2, sz > 0 ? z : z - 1.5, sz > 0 ? z + 1.5 : z, 4.2, 12.5, relief)    // the group
      block(out, cx - 1.6, cx + 1.6, sz > 0 ? z : z - 1.2, sz > 0 ? z + 1.2 : z, 12.5, 16, relief)     // the winged figure
      // the relief panel above
      block(out, cx - 4.5, cx + 4.5, sz > 0 ? z : z - 0.25, sz > 0 ? z + 0.25 : z, 18.5, 24.5, relief)
    }
  }
  // the entablature: a projecting cornice, the frieze, a second cornice, then the attic with its shields
  block(out, -hx - 0.8, hx + 0.8, -hz - 0.8, hz + 0.8, crown, crown + 1.4, deep)
  block(out, -hx - 0.2, hx + 0.2, -hz - 0.2, hz + 0.2, crown + 1.4, crown + 5.8, shade(stone, 0.95))
  block(out, -hx - 1.3, hx + 1.3, -hz - 1.3, hz + 1.3, crown + 5.8, crown + 7.8, deep)
  block(out, -hx, hx, -hz, hz, crown + 7.8, 49, stone)
  const shields = 15
  for (let i = 0; i < shields; i++) {
    const x = -hx + 1.5 + ((2 * hx - 3) * (i + 0.5)) / shields
    for (const sz of [-1, 1]) block(out, x - 0.8, x + 0.8, sz > 0 ? hz : -hz - 0.3, sz > 0 ? hz + 0.3 : -hz, 41, 43.6, deep)
  }
  block(out, -hx - 0.6, hx + 0.6, -hz - 0.6, hz + 0.6, 49, 50, deep)
}
