/**
 * PEOPLE PLAYING ON THE COURTS (owner, 2026-10-03: "people realistically playing sports at the sport courts. could just be
 * avatars in our athletic set that are going around on fixed paths, I don't think we need a ball or anything").
 *
 * For each court near the rider (city's `courtsNear`), a few players in athletic kit, as crowd `Walker`s (kind 'run', so
 * the same bodies and gaits as the runners), moving on the court in its own pattern:
 * - tennis and pickleball: one or two at each end, shuffling along the baseline and now and then up toward the net;
 * - basketball: three to six round the key, circling and cutting;
 * - volleyball: two to four a side, small steps near their spots;
 * - four square: four, one in each square, bouncing on the spot;
 * - a playground: two or three children running loops.
 * Deterministic per court (its position seeds it), so a court keeps its players while the rider is near. No ball.
 */
import type { PackedCourt } from '../city/package.ts'
import { dressed, rng, type Walker } from './crowd.ts'

const RANGE = 140

interface Player { w: Walker; court: PackedCourt; spot: [number, number]; amp: [number, number]; rate: number; t: number }

export class CourtPlayers {
  private readonly byCourt = new Map<string, Player[]>()
  private nextId = 2_000_000_000

  /** the players for the courts within range, moved on by `dt`; courts out of range lose theirs */
  update(dt: number, rider: { x: number; z: number }, courts: PackedCourt[]): Walker[] {
    const seen = new Set<string>()
    const out: Walker[] = []
    for (const c of courts) {
      if (Math.hypot(c.x - rider.x, c.z - rider.z) > RANGE) continue
      const key = `${Math.round(c.x * 10)},${Math.round(c.z * 10)}`
      seen.add(key)
      let ps = this.byCourt.get(key)
      if (!ps) { ps = this.spawn(c); this.byCourt.set(key, ps) }
      for (const p of ps) { this.move(p, dt); out.push(p.w) }
    }
    for (const k of [...this.byCourt.keys()]) if (!seen.has(k)) this.byCourt.delete(k)
    return out
  }

  private spawn(c: PackedCourt): Player[] {
    const r = rng(Math.round(c.x * 31) ^ Math.imul(Math.round(c.z * 17), 0x9e3779b9))
    // (an empty court now and then: not every court is in use)
    if (r() < 0.25) return []
    const L = c.len / 2, W = c.wid / 2
    const spots: { spot: [number, number]; amp: [number, number]; rate: number; child?: boolean }[] = []
    switch (c.sport) {
      case 'tennis': case 'pickleball': {
        const doubles = r() < 0.35
        for (const end of [-1, 1]) {
          const n = doubles ? 2 : 1
          for (let k = 0; k < n; k++) {
            const across = n === 1 ? 0 : (k ? 0.45 : -0.45) * W
            spots.push({ spot: [end * L * (doubles && k ? 0.55 : 0.9), across], amp: [L * 0.12, W * (doubles ? 0.3 : 0.7)], rate: 0.9 + r() * 0.5 })
          }
        }
        break
      }
      case 'basketball': {
        const n = 3 + Math.floor(r() * 4)
        const hoop = c.half ? 1 : r() < 0.5 ? 1 : -1
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2
          spots.push({ spot: [hoop * L * 0.55 + Math.cos(a) * 2.5, Math.sin(a) * W * 0.45], amp: [3, W * 0.4], rate: 0.6 + r() * 0.7 })
        }
        break
      }
      case 'volleyball': {
        const n = 2 + Math.floor(r() * 3)
        for (const side of [-1, 1]) for (let k = 0; k < n; k++) {
          spots.push({ spot: [side * L * (0.3 + 0.35 * (k % 2)), (k / Math.max(1, n - 1) - 0.5) * W * 1.2], amp: [1, 1.2], rate: 0.8 + r() * 0.6 })
        }
        break
      }
      case 'four_square': {
        for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) spots.push({ spot: [a * L * 0.5, b * W * 0.5], amp: [0.6, 0.6], rate: 1.2 + r() * 0.6, child: r() < 0.6 })
        break
      }
      case 'playground': {
        const n = 2 + Math.floor(r() * 2)
        for (let k = 0; k < n; k++) spots.push({ spot: [(r() - 0.5) * L, (r() - 0.5) * W], amp: [L * 0.4, W * 0.4], rate: 0.5 + r() * 0.4, child: true })
        break
      }
    }
    return spots.map((s) => {
      const w: Walker = {
        id: this.nextId++, edgeId: -1, s: 0, dir: 1, side: 1, kind: 'run', speed: 0,
        height: s.child ? 0.62 + r() * 0.12 : 0.95 + r() * 0.15, phase: r() * Math.PI * 2,
        at: { x: c.x, z: c.z }, heading: 0, back: 0, across: 0, dodge: 0, ...dressed(r, true),
      }
      return { w, court: c, spot: s.spot, amp: s.amp, rate: s.rate, t: r() * 100 }
    })
  }

  private move(p: Player, dt: number): void {
    p.t += dt * p.rate
    // a Lissajous wander about the spot, in the court's frame: along (cos h, sin h), across (−sin h, cos h)
    const u = p.spot[0] + Math.sin(p.t * 0.7) * p.amp[0]
    const v = p.spot[1] + Math.sin(p.t * 1.3 + 1.1) * p.amp[1]
    const h = p.court.heading
    const x = p.court.x + Math.cos(h) * u - Math.sin(h) * v
    const z = p.court.z + Math.sin(h) * u + Math.cos(h) * v
    const dx = x - p.w.at.x, dz = z - p.w.at.z
    const step = Math.hypot(dx, dz)
    const speed = dt > 0 ? step / dt : 0
    if (step > 1e-3) p.w.heading = Math.atan2(dx, dz)
    p.w.at = { x, z }
    p.w.speed = speed
    p.w.phase += dt * Math.max(0.5, speed) * 3.2
  }
}
