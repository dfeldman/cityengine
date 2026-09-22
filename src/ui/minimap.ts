/**
 * The minimap.
 *
 * A rider steering through a real city needs to know what is coming, and the 3D view cannot tell them: from
 * the saddle you cannot see round the corner of a five-storey building. Without a map, choosing a turn is
 * guessing, and a game about choosing where to go reduces to pressing a button and finding out.
 *
 * So it draws the streets around the rider, heading **up** — rotated with them rather than north-up, because
 * a turn you are about to make should be a turn on the map too — with the junction ahead marked and the
 * streets that have names labelled.
 *
 * A 2D canvas rather than a second Babylon view: a top-down render of the city would cost a whole extra pass
 * of the scene for something that is thirty lines of `moveTo`/`lineTo`.
 */
import type { CityGraph } from '../city/graph.ts'
import type { Point } from '../city/geo.ts'

export interface MinimapOptions {
  /** metres from the rider to the edge of the map */
  range: number
  size: number
}

export class Minimap {
  private readonly ctx: CanvasRenderingContext2D
  private readonly g: CityGraph
  private readonly opts: MinimapOptions
  /** every edge bucketed by 200 m cell, so a frame touches a handful rather than seven thousand */
  private readonly grid = new Map<string, number[]>()
  private visible = true
  private readonly canvas: HTMLCanvasElement

  /** map edges the rider can actually be steered along (the ride graph covers them); drawn brighter */
  private readonly ride: Set<number> | null
  /** named buildings, a dot each (item K) */
  landmarks: { x: number; z: number; name: string; tier: 1 | 2 }[] = []

  /** the large reference map (M): most of the screen, north up, the whole city */
  private large = false
  private dpr = 1

  constructor(canvas: HTMLCanvasElement, graph: CityGraph, opts: Partial<MinimapOptions> = {}, ride: Set<number> | null = null) {
    this.g = graph
    this.ride = ride
    this.opts = { range: 260, size: 210, ...opts }
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('no 2d context for the minimap')
    this.ctx = ctx
    this.resize()
    addEventListener('resize', () => { if (this.large) this.resize() })
    this.listen()

    this.addEdges([...graph.edges.values()])
  }

  /** Streets arriving with a streamed tile (they are in the graph already): filed for drawing. */
  addEdges(edges: { id: number; points: { x: number; z: number }[] }[]): void {
    for (const e of edges) {
      const id = e.id
      if (this.filed.has(id)) continue
      this.filed.add(id)
      for (const p of e.points) {
        const k = `${Math.floor(p.x / 200)},${Math.floor(p.z / 200)}`
        const list = this.grid.get(k)
        if (list) { if (list[list.length - 1] !== id) list.push(id) } else this.grid.set(k, [id])
      }
    }
  }
  private readonly filed = new Set<number>()

  /** the size and range of the view in its current mode */
  private get size(): number { return this.large ? Math.floor(Math.min(innerWidth, innerHeight) * 0.86) : this.opts.size }
  private get range(): number { return this.large ? this.zoom : this.opts.range }

  private resize(): void {
    this.dpr = Math.min(3, devicePixelRatio || 1)
    const s = this.size
    this.canvas.width = s * this.dpr
    this.canvas.height = s * this.dpr
    this.canvas.style.width = `${s}px`
    this.canvas.style.height = `${s}px`
    this.canvas.classList.toggle('large', this.large)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  /**
   * M: the minimap is always there; M swaps it for a large map across most of the screen — north up, the whole
   * city, more names — for a quick look at where everything is, and M again puts the minimap back.
   */
  toggle(): void {
    this.large = !this.large
    this.panX = 0
    this.panZ = 0
    this.zoom = 760
    this.resize()
  }

  /** the large map's own view: offset from the rider, and its range (drag to pan, wheel to zoom) */
  private panX = 0
  private panZ = 0
  private zoom = 760
  /** the whole ride graph, to draw the city beyond the streamed streets when zoomed out */
  private rideLines: Point[][] = []
  setRide(lines: Point[][]): void { this.rideLines = lines }
  /** a click on the large map: the world point clicked; `jump` with shift held (the game goes there),
   *  else the game sets it as the GPS destination */
  onPick: ((p: Point, jump: boolean) => void) | null = null
  /** the GPS route and its destination (PARIS_EXPAND §6 item 11), drawn over the streets */
  route: Point[] | null = null
  destination: Point | null = null

  private listen(): void {
    let down: { x: number; y: number; px: number; pz: number } | null = null
    let moved = false
    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.large) return
      down = { x: e.clientX, y: e.clientY, px: this.panX, pz: this.panZ }
      moved = false
      this.canvas.setPointerCapture(e.pointerId)
    })
    this.canvas.addEventListener('pointermove', (e) => {
      if (!down) return
      const k = this.zoom / (this.size / 2)
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) moved = true
      this.panX = down.px - (e.clientX - down.x) * k
      this.panZ = down.pz + (e.clientY - down.y) * k
    })
    this.canvas.addEventListener('pointerup', (e) => {
      if (!down) return
      const start = down
      down = null
      if (moved || !this.onPick) return
      const rect = this.canvas.getBoundingClientRect()
      const k = this.zoom / (this.size / 2)
      const cx = e.clientX - rect.left - rect.width / 2
      const cy = e.clientY - rect.top - rect.height / 2
      void start
      this.onPick({ x: this.lastAt.x + this.panX + cx * k, z: this.lastAt.z + this.panZ - cy * k }, e.shiftKey)
    })
    /*
     * Double-click goes there. Shift-click did it from the start, but nobody could be expected to guess that
     * (user, 2026-09-22: "i don't know how to click to travel on map. when i click, it sets a destination"), and
     * a jump no longer reloads the page (BUGS.md #61), so it is worth having a plain way to ask for it.
     */
    this.canvas.addEventListener('dblclick', (e) => {
      if (!this.large || !this.onPick) return
      e.preventDefault()
      const rect = this.canvas.getBoundingClientRect()
      const k = this.zoom / (this.size / 2)
      const cx = e.clientX - rect.left - rect.width / 2
      const cy = e.clientY - rect.top - rect.height / 2
      this.onPick({ x: this.lastAt.x + this.panX + cx * k, z: this.lastAt.z + this.panZ - cy * k }, true)
    })
    this.canvas.addEventListener('wheel', (e) => {
      if (!this.large) return
      e.preventDefault()
      this.zoom = Math.max(150, Math.min(5000, this.zoom * Math.exp(e.deltaY * 0.0015)))
    }, { passive: false })
  }
  private lastAt: Point = { x: 0, z: 0 }
  get shown(): boolean { return this.visible }
  get isLarge(): boolean { return this.large }

  /** `heading` is the rider's bearing; the map is drawn rotated so that it points up. */
  draw(at: Point, heading: number, nextJunction: Point | null): void {
    const { ctx } = this
    const s = this.size
    const r = s / 2
    const scale = r / this.range
    // the minimap turns with the rider; the large map is north up, with the rider's arrow turning instead
    const rot = this.large ? 0 : heading
    const inFrame = (x: number, y: number, pad: number, cx0: number, cy0: number): boolean => this.large
      ? Math.abs(x - cx0) + pad < r - 6 && Math.abs(y - cy0) + 6 < r - 6
      : Math.hypot(x - cx0, y - cy0) + pad < r - 1

    ctx.clearRect(0, 0, s, s)
    // Nothing at all when hidden — the frame used to be drawn after this, so switching the map off left a
    // circle floating in the corner with nothing in it.
    if (!this.visible) return

    ctx.save()
    ctx.beginPath()
    if (this.large) ctx.roundRect(0, 0, s, s, 14)
    else ctx.arc(r, r, r - 1, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = this.large ? 'rgba(13,17,42,0.92)' : 'rgba(13,17,42,0.8)'
    ctx.fillRect(0, 0, s, s)

    this.lastAt = at
    // the large map looks where it was panned to
    const rider = at
    if (this.large) at = { x: at.x + this.panX, z: at.z + this.panZ }
    ctx.translate(r, r)
    ctx.rotate(rot)              // heading up: +z (north) is up at heading 0, and the map turns with the rider
    ctx.translate(-at.x * scale, at.z * scale)
    // canvas y grows downward and world z grows "up" the map, so z is negated by the scale below
    const px = (p: Point): [number, number] => [p.x * scale, -p.z * scale]

    // zoomed out on the large map, the whole city from the ride graph (the streets streamed so far are near only)
    if (this.large && this.zoom > 900) {
      ctx.strokeStyle = 'rgba(236,234,228,0.75)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      for (const line of this.rideLines) {
        const p0 = line[0]
        if (Math.abs(p0.x - at.x) > this.zoom * 1.5 || Math.abs(p0.z - at.z) > this.zoom * 1.5) continue
        line.forEach((p, i) => (i === 0 ? ctx.moveTo(...px(p)) : ctx.lineTo(...px(p))))
      }
      ctx.stroke()
    }
    const cells: number[] = []
    const reach = Math.ceil(this.range / 200) + 1
    for (let dz = -reach; dz <= reach; dz++) {
      for (let dx = -reach; dx <= reach; dx++) {
        const got = this.grid.get(`${Math.floor(at.x / 200) + dx},${Math.floor(at.z / 200) + dz}`)
        if (got) cells.push(...got)
      }
    }

    const seen = new Set<number>()
    const named = new Map<string, { at: Point; text: string; angle: number; d: number }>()
    for (const id of cells) {
      if (seen.has(id)) continue
      seen.add(id)
      const e = this.g.edges.get(id)
      if (!e) continue
      // wider streets are drawn heavier, which is what makes a map readable at a glance
      ctx.lineWidth = Math.max(1, Math.min(5, e.width * 0.42 * scale * 3))
      // the streets the rider can take stand out; the rest of the map is there for orientation
      const rideable = this.ride ? this.ride.has(id) : !e.foot
      ctx.strokeStyle = rideable ? 'rgba(236,234,228,0.9)' : e.foot ? 'rgba(150,150,160,0.4)' : 'rgba(170,170,176,0.55)'
      ctx.beginPath()
      e.points.forEach((p, i) => (i === 0 ? ctx.moveTo(...px(p)) : ctx.lineTo(...px(p))))
      ctx.stroke()

      // Only the major streets get a name. Labelling every alley in the Marais would be unreadable, and the
      // point of a name is to answer "which street is that", which only matters for ones worth turning onto.
      /*
       * ONE label per name, not one per edge. A street is split at every junction it has, so Pine Street
       * arrives as a dozen separate edges all called "Pine Street", and labelling each of them printed the
       * name over and over down the same line. The nearest piece wins, since that is the piece of it the
       * rider can actually see.
       */
      // (and none zoomed far out, where they would pile up; the landmarks carry the names there)
      if (e.name && (e.width >= 7 || (this.large && e.width >= 5)) && e.length > 45 && this.range <= 1500) {
        const mid = e.points[Math.floor(e.points.length / 2)]
        const d = Math.hypot(mid.x - at.x, mid.z - at.z)
        const held = named.get(e.name)
        if (d < this.range * 0.95 && (!held || d < held.d)) {
          const a = e.points[0]
          const b = e.points[e.points.length - 1]
          named.set(e.name, { at: mid, text: e.name, angle: Math.atan2(-(b.z - a.z), b.x - a.x), d })
        }
      }
    }

    // the GPS route, over the streets and under the names; and the destination's pin
    if (this.route && this.route.length > 1) {
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(12,14,18,0.8)'
      ctx.lineWidth = this.large ? 7 : 6
      ctx.beginPath()
      this.route.forEach((p, i) => (i === 0 ? ctx.moveTo(...px(p)) : ctx.lineTo(...px(p))))
      ctx.stroke()
      ctx.strokeStyle = '#ff9a3c'
      ctx.lineWidth = this.large ? 4 : 3.5
      ctx.stroke()
    }
    if (this.destination) {
      const [x, y] = px(this.destination)
      ctx.beginPath()
      ctx.arc(x, y, this.large ? 7 : 5, 0, Math.PI * 2)
      ctx.fillStyle = '#ff5a3c'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#fff'
      ctx.stroke()
    }

    ctx.font = this.large ? '600 11px -apple-system, system-ui, sans-serif' : '600 9px -apple-system, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const placed: [number, number][] = []
    const labels = [...named.values()].sort((a, b) => a.d - b.d)
    // the centre of the clip circle, in the coordinates this context is currently drawing in
    const [cx, cy] = px(at)
    for (const l of labels.slice(0, this.large ? 60 : 14)) {
      const [x, y] = px(l.at)
      // do not stack two labels on top of each other
      if (placed.some(([qx, qy]) => Math.hypot(qx - x, qy - y) < 34)) continue
      /*
       * It has to FIT, not just start inside. The map is clipped to its circle, so a name whose midpoint is
       * near the rim was sliced through the middle of a word and "California Street" appeared on the map as
       * "aliforniaStreet". Half the text's width is the worst case, whichever way the label is turned.
       */
      if (!inFrame(x, y, ctx.measureText(l.text).width / 2 + 3, cx, cy)) continue
      placed.push([x, y])
      ctx.save()
      ctx.translate(x, y)
      // Keep text upright whichever way the map is turned. The label's angle on SCREEN is its angle in the
      // map plus the map's own rotation; flip it by π until it reads left-to-right, then subtract the map
      // rotation again, because this context is already rotated and rotating by the screen angle would
      // apply the heading twice — which is what printed half the street names upside down.
      let screenAngle = l.angle + rot
      while (screenAngle > Math.PI / 2) screenAngle -= Math.PI
      while (screenAngle < -Math.PI / 2) screenAngle += Math.PI
      ctx.rotate(screenAngle - rot)
      ctx.lineWidth = 3
      ctx.strokeStyle = 'rgba(12,14,18,0.92)'
      ctx.strokeText(l.text, 0, 0)
      ctx.fillStyle = '#efece4'
      ctx.fillText(l.text, 0, 0)
      ctx.restore()
    }

    // landmarks: a dot for each, and the names of the nearest top-tier ones
    const near = this.landmarks
      .map((l) => ({ l, d: Math.hypot(l.x - at.x, l.z - at.z) }))
      .filter((q) => q.d < this.range * (this.large ? 1.4 : 0.9))
      .sort((p, q) => p.d - q.d)
    let labelled = 0
    for (const { l } of near) {
      const [x, y] = px(l)
      ctx.beginPath()
      ctx.arc(x, y, l.tier === 1 ? 2.8 : 2, 0, Math.PI * 2)
      ctx.fillStyle = l.tier === 1 ? '#f0b8ff' : 'rgba(220,190,230,0.7)'
      ctx.fill()
      if (l.tier === 1 && labelled < (this.large ? (this.range > 1500 ? 18 : 40) : 3)) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(-rot)
        ctx.font = this.large ? '600 10px ui-sans-serif, Helvetica, Arial, sans-serif' : '600 8px ui-sans-serif, Helvetica, Arial, sans-serif'
        const text = l.name.length > 22 ? `${l.name.slice(0, 21)}…` : l.name
        const w = ctx.measureText(text).width
        // never over another label: two names printed across each other read as neither
        const clear = !placed.some(([qx, qy]) => Math.abs(qx - x) < (w + 60) / 2 && Math.abs(qy - (y - 8)) < 13)
        if (clear && inFrame(x, y, w / 2 + 4, cx, cy)) {
          placed.push([x, y - 8])
          ctx.lineWidth = 3
          ctx.strokeStyle = 'rgba(12,14,18,0.92)'
          ctx.strokeText(text, 0, -8)
          ctx.fillStyle = '#f0d8f6'
          ctx.fillText(text, 0, -8)
          labelled++
        }
        ctx.restore()
      }
    }

    if (nextJunction) {
      const [x, y] = px(nextJunction)
      ctx.beginPath()
      ctx.arc(x, y, 3.6, 0, Math.PI * 2)
      ctx.fillStyle = '#ffd479'
      ctx.fill()
    }
    ctx.restore()

    // the rider, always at the centre: pointing up on the minimap, along their heading on the large map (where
    // the map may be panned away from them)
    ctx.save()
    ctx.translate(r + (rider.x - at.x) * scale, r - (rider.z - at.z) * scale)
    if (this.large) ctx.rotate(-heading)
    if (this.large) ctx.scale(1.5, 1.5)
    ctx.beginPath()
    ctx.moveTo(0, -7)
    ctx.lineTo(5, 6)
    ctx.lineTo(0, 3)
    ctx.lineTo(-5, 6)
    ctx.closePath()
    ctx.fillStyle = '#8ef2a0'
    ctx.fill()
    ctx.restore()

    ctx.beginPath()
    if (this.large) ctx.roundRect(0.5, 0.5, s - 1, s - 1, 14)
    else ctx.arc(r, r, r - 1, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth = 1
    ctx.stroke()

    // what a click does, said on the map itself: nobody guesses shift-click
    if (this.large) {
      ctx.font = '600 11px -apple-system, system-ui, sans-serif'
      const hint = 'click: set destination · double-click or shift-click: go there'
      const w = ctx.measureText(hint).width
      ctx.fillStyle = 'rgba(12,14,18,0.66)'
      ctx.beginPath()
      ctx.roundRect(s / 2 - w / 2 - 10, s - 30, w + 20, 20, 10)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.86)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(hint, s / 2, s - 20)
      ctx.textAlign = 'start'
    }
  }
}

export const MINIMAP_CSS = `
#minimap { position: fixed; right: 18px; top: 18px; border-radius: 50%; pointer-events: none;
  box-shadow: var(--shadow, 0 4px 18px rgba(0,0,0,.45)); outline: 2px solid var(--border, transparent); outline-offset: -1px; z-index: 4; }
#minimap.large { right: auto; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: var(--radius, 14px); z-index: 6;
  pointer-events: auto; cursor: crosshair; touch-action: none; }
`
