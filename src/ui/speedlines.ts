/**
 * SPEED, FELT (2026-10-01, for the demo's California Street descent: "very fast motion"). Two cues that cost
 * nothing to the scene and do not move the picture about — fast descents must stay smooth:
 *
 * - the field of view opens with speed (`fovFor`), the classic racing-game widening, eased in game.ts;
 * - SPEED LINES: faint streaks rushing out from the middle, only round the edges of the screen, fading in above
 *   ~45 km/h. A 2D canvas over the picture, cleared and drawn only while there is something to draw.
 *
 * `?without=speedlines` leaves both out.
 */

/** the camera's field of view, radians, at `v` m/s (world speed): 1.02 standing, ~1.22 at 25 m/s and over */
export function fovFor(v: number): number {
  const t = Math.max(0, Math.min(1, (v - 8) / 17))
  return 1.02 + 0.2 * t * t * (3 - 2 * t)
}

interface Streak { a: number; r: number; len: number; w: number }

export class SpeedLines {
  private readonly canvas: HTMLCanvasElement
  private readonly g: CanvasRenderingContext2D | null
  private readonly streaks: Streak[] = []
  private strength = 0
  private drawn = false

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2'
    document.body.appendChild(this.canvas)
    this.g = this.canvas.getContext('2d')
    for (let i = 0; i < 70; i++) this.streaks.push(this.fresh(Math.random()))
  }

  private fresh(r = 0.25 + Math.random() * 0.1): Streak {
    return { a: Math.random() * Math.PI * 2, r, len: 0.05 + Math.random() * 0.12, w: 0.6 + Math.random() * 1.6 }
  }

  /** every frame: `v` the world speed, m/s */
  update(dt: number, v: number): void {
    const want = Math.max(0, Math.min(1, (v - 12.5) / 10))
    this.strength += (want - this.strength) * Math.min(1, dt * 3)
    const g = this.g
    if (!g) return
    if (this.strength < 0.02) {
      if (this.drawn) { g.clearRect(0, 0, this.canvas.width, this.canvas.height); this.drawn = false }
      return
    }
    const dpr = Math.min(1.5, devicePixelRatio || 1)
    const W = Math.round(innerWidth * dpr)
    const H = Math.round(innerHeight * dpr)
    if (this.canvas.width !== W || this.canvas.height !== H) { this.canvas.width = W; this.canvas.height = H }
    g.clearRect(0, 0, W, H)
    this.drawn = true
    // the vanishing point a little above the middle: where the road goes
    const cx = W / 2
    const cy = H * 0.45
    const R = Math.hypot(W, H) / 2
    g.lineCap = 'round'
    for (let i = 0; i < this.streaks.length; i++) {
      const s = this.streaks[i]
      s.r += dt * (0.5 + v / 18) * (0.6 + s.r)
      if (s.r > 1.05) { this.streaks[i] = this.fresh(); continue }
      // only round the edges: nothing over the rider and the road ahead
      const fade = Math.min(1, Math.max(0, (s.r - 0.32) / 0.2)) * Math.min(1, (1.05 - s.r) / 0.15)
      if (fade <= 0) continue
      const c = Math.cos(s.a)
      const sn = Math.sin(s.a)
      const r0 = s.r * R
      const r1 = (s.r + s.len * (0.5 + this.strength)) * R
      g.strokeStyle = `rgba(255,255,255,${(0.3 * fade * this.strength).toFixed(3)})`
      g.lineWidth = s.w * dpr
      g.beginPath()
      g.moveTo(cx + c * r0, cy + sn * r0 * 0.8)
      g.lineTo(cx + c * r1, cy + sn * r1 * 0.8)
      g.stroke()
    }
  }
}
