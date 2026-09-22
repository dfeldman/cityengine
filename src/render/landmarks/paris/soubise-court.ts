import { MeshBuilder } from '../../buildings.ts'
import { prism } from '../../models.ts'
import { archedPane, beam, block, column, courtFacade, hex, pediment, placed } from '../kit.ts'
import type { Fit } from '../fit.ts'

/**
 * The Hôtel de Soubise's cour d'honneur (Delamair, 1705): a vast court ringed on three sides by a colonnade
 * of paired columns under a balustraded terrace, rounded at the corners toward the gate — the horseshoe —
 * and at its head the palace front: a two-storey frontispiece of paired columns, Composite over Corinthian,
 * under a pediment, with statues on the pediment and along the balustrade. Drawn in the building's courtyard
 * (`court: true`); the gate end is −z (Rue des Francs-Bourgeois).
 */
export function soubiseCourt(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#cfc2a8')
  const trim = hex('#dacdb3')
  const dark = hex('#2e2d2b')
  const { hx, hz } = fit
  const g = 0.5
  block(out, -hx, hx, -hz, hz, 0, 0.56, hex('#d2c7b0'))                           // the gravel court
  // the palace front at the head of the court
  const q = new MeshBuilder()
  courtFacade(q, 2 * hx, 15, { stone, trim, dark, lucarnes: false })
  // the frontispiece: four pairs of columns in two orders, the pediment, statues on it
  const fw = Math.min(9, hx * 0.4)
  block(q, -fw, fw, -1.6, -0.18, g, 15, stone)
  for (const x of [-fw + 0.8, -fw + 2.0, fw - 2.0, fw - 0.8]) {
    column(q, x, -1.9, g, g + 7, 0.36, trim)
    column(q, x, -1.9, g + 7.4, g + 13.4, 0.32, trim)
  }
  block(q, -fw - 0.3, fw + 0.3, -2.4, -0.18, g + 7, g + 7.4, trim)
  block(q, -fw - 0.3, fw + 0.3, -2.4, -0.18, g + 13.4, g + 14.4, trim)
  pediment(q, -fw - 0.3, fw + 0.3, -2.4, g + 14.4, 3.2, 2.2, trim)
  archedPane(q, -1.62, 0, g, 2.6, 4.6, dark)
  archedPane(q, -1.62, 0, g + 8, 2.2, 4.2, dark)
  for (const x of [-fw, -fw * 0.5, 0, fw * 0.5, fw]) prism(q, x, -1.2, g + 14.4 + (x === 0 ? 3.2 : 1.2 - Math.abs(x) / fw), g + 16.4 + (x === 0 ? 3.2 : 1.2 - Math.abs(x) / fw), 0.3, 8, trim, 0, 0.2)
  // statues along the balustrade of the whole front
  block(q, -hx, hx, -0.8, 0, 15, 15.9, trim)
  for (let x = -hx + 3; x < hx - 2; x += 6) if (Math.abs(x) > fw + 1) prism(q, x, -0.4, 15.9, 17.7, 0.28, 8, trim, 0, 0.18)
  placed(out, q, 0, 0, hz)
  // the colonnade: paired columns 3.5 m in from the walls on both sides and across the gate end, rounded
  // at the gate-end corners, carrying an entablature and a balustraded terrace
  const inset = 3.6
  const path: { x: number; z: number }[] = []
  const r = Math.min(10, hx * 0.35)
  const xs = hx - inset
  const zs = hz - inset
  path.push({ x: -xs, z: zs })
  path.push({ x: -xs, z: -zs + r })
  for (let k = 1; k <= 6; k++) { const a = (k / 6) * (Math.PI / 2); path.push({ x: -xs + r - Math.cos(a) * r, z: -zs + r - Math.sin(a) * r }) }
  path.push({ x: xs - r, z: -zs })
  for (let k = 1; k <= 6; k++) { const a = (k / 6) * (Math.PI / 2); path.push({ x: xs - r + Math.sin(a) * r, z: -zs + r - Math.cos(a) * r }) }
  path.push({ x: xs, z: zs })
  const lengths = [0]
  for (let i = 1; i < path.length; i++) lengths.push(lengths[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z))
  const total = lengths[lengths.length - 1]
  const at = (d: number): { x: number; z: number } => {
    let i = 1
    while (i < lengths.length - 1 && lengths[i] < d) i++
    const t = (d - lengths[i - 1]) / Math.max(1e-6, lengths[i] - lengths[i - 1])
    return { x: path[i - 1].x + (path[i].x - path[i - 1].x) * t, z: path[i - 1].z + (path[i].z - path[i - 1].z) * t }
  }
  const colH = 6.2
  for (let d = 0; d <= total; d += 3.2) {
    const p = at(d)
    // leave the gate open in the middle of the gate end
    if (Math.abs(p.x) < 5 && p.z < -zs + 1) continue
    const p2 = at(Math.min(total, d + 0.8))
    column(out, p.x, p.z, g, g + colH, 0.3, trim)
    column(out, p2.x, p2.z, g, g + colH, 0.3, trim)
  }
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1]
    const b = path[i]
    // the entablature and the terrace's balustrade, straight between the path's points
    beam(out, [a.x, g + colH + 0.45, a.z], [b.x, g + colH + 0.45, b.z], 0.55, stone, 0.45)
    beam(out, [a.x, g + colH + 1.35, a.z], [b.x, g + colH + 1.35, b.z], 0.2, trim, 0.45)
  }
  // and the gate in the middle of the gate end: a rusticated arch under a pediment
  block(out, -5, 5, -zs - 1.2, -zs + 0.6, 0, 10.5, stone)
  archedPane(out, -zs - 1.22, 0, g, 4.4, 7, dark)
  pediment(out, -5.3, 5.3, -zs - 1.4, 10.5, 2.4, 2, trim)
}
