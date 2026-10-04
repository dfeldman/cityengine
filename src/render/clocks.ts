/**
 * THE PUBLIC CLOCKS TELL THE TIME (owner, 2026-10-04: "we should make the huge public clocks at Ferry Building,
 * Ghirardelli Square, and the sidewalk clock at Powell & Stockton actually show correct time … there will be public
 * clocks in every city we ever do").
 *
 * A model draws its dial with `clockFace` (render/landmarks/parts.ts), which records the clock on its MeshBuilder;
 * when the model is placed, each clock gets an hour and a minute hand of its own, parented to the model so they keep
 * its position, turn and scale, and turned about the face's axis to the real time in the city's own time zone
 * (Region `timeZone`). Once a second is plenty: the minute hand of a 3 m dial moves a few millimetres in that time.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import type { Material } from '@babylonjs/core/Materials/material'
import { Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector'
import { MeshBuilder } from './buildings.ts'
import type { Rgb } from './models.ts'

/** The time of day in a time zone, as hours (0–12, fractional) and minutes (0–60, fractional). */
export function clockTime(now: Date, timeZone?: string): { h: number; m: number } {
  let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds()
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' }).formatToParts(now)
      const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value ?? 0)
      h = get('hour'); m = get('minute'); s = get('second')
    } catch { /* an unknown zone: the device's own time */ }
  }
  const minutes = m + s / 60
  return { h: (h % 12) + minutes / 60, m: minutes }
}

/** The hands' angles, clockwise from twelve, in radians. */
export function handAngles(t: { h: number; m: number }): { hour: number; minute: number } {
  return { hour: (t.h / 12) * Math.PI * 2, minute: (t.m / 60) * Math.PI * 2 }
}

interface Hand { mesh: Mesh; axis: Vector3; minute: boolean }

export class Clocks {
  private readonly hands: Hand[] = []
  private last = -Infinity

  constructor(private readonly scene: Scene, private readonly material: Material, private readonly timeZone?: string) {}

  /** The hands for each clock a model asked for, parented to the model (`host`), in its own frame. */
  raise(clocks: MeshBuilder['clocks'], host: Mesh, name: string): void {
    for (const [k, c] of clocks.entries()) {
      const colour: Rgb = c.hands ?? [0.08, 0.08, 0.08]
      const tx = -c.nz, tz = c.nx
      for (const minute of [false, true]) {
        const mb = new MeshBuilder()
        const len = (minute ? 0.86 : 0.56) * c.r, w = (minute ? 0.035 : 0.06) * c.r, d = minute ? 0.04 : 0.02
        // pointing to twelve, about the centre, a hair proud of the dial (the minute hand over the hour)
        const P = (u: number, v: number): [number, number, number] => [tx * u + c.nx * d, v, tz * u + c.nz * d]
        mb.quad([P(-w, -0.12 * c.r), P(w, -0.12 * c.r), P(w * 0.4, len), P(-w * 0.4, len)], [c.nx, 0, c.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, 0)
        const m = new Mesh(`clock:${name}:${k}:${minute ? 'm' : 'h'}`, this.scene)
        mb.toVertexData().applyToMesh(m)
        m.material = this.material
        m.parent = host
        m.position.set(c.x, c.y, c.z)
        m.isPickable = false
        m.renderingGroupId = host.renderingGroupId
        // clockwise as the viewer sees it: about the axis pointing OUT of the face (Babylon's frame is left-handed;
        // the axis into the face ran the hands backwards — 08:49 read as 3:10, 2026-10-04)
        this.hands.push({ mesh: m, axis: new Vector3(c.nx, 0, c.nz), minute })
      }
    }
    this.last = -Infinity
  }

  /** Once a second, every hand to the time. */
  update(nowMs = Date.now()): void {
    if (this.hands.length === 0 || nowMs - this.last < 1000) return
    this.last = nowMs
    const a = handAngles(clockTime(new Date(nowMs), this.timeZone))
    // (a street clock's hands go with its tile)
    for (let i = this.hands.length - 1; i >= 0; i--) if (this.hands[i].mesh.isDisposed()) this.hands.splice(i, 1)
    for (const h of this.hands) h.mesh.rotationQuaternion = Quaternion.RotationAxis(h.axis, h.minute ? a.minute : a.hour)
  }
}
