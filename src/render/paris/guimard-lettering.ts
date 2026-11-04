/**
 * GUIMARD'S LETTERING, drawn: "METROPOLITAIN" in the manner of the entrance panels without the commercial font (the
 * owner, 2026-11-03: "I would prefer not to buy it"). What makes it read as Guimard's:
 *
 * - every stem an hourglass — swelling at the head and the foot, pinched in the middle;
 * - bowls (O, P, R) egg-shaped, the weight low, the counters tall and narrow;
 * - arms that flick up at their ends (E, L), the T's bar drooping at both ends;
 * - the M's middle hanging down between its stems like a drape, the A an arch with its bar set low;
 * - no two letters alike: each gets a fixed swell, drop and lean, as the hand-painted panels have.
 *
 * Glyphs are drawn in a unit cell (y 0 at the cap line, 1 at the baseline; x 0..width), filled, in the caller's colour.
 */
type Ctx = CanvasRenderingContext2D

const STEM = 0.11            // half the stem's width at head and foot, in em
const PINCH = 0.062          // half its width at the waist

/** An hourglass stem from (x, y0) to (x, y1), optionally leaning (dx at the top). */
function stem(c: Ctx, x: number, y0: number, y1: number, dx = 0): void {
  const ym = (y0 + y1) / 2
  const xt = x + dx, xm = x + dx / 2
  c.beginPath()
  c.moveTo(xt - STEM, y0)
  c.lineTo(xt + STEM, y0)
  c.quadraticCurveTo(xm + PINCH, ym, x + STEM * 1.45, y1)
  c.lineTo(x - STEM * 1.45, y1)
  c.quadraticCurveTo(xm - PINCH, ym, xt - STEM, y0)
  c.fill()
}

/** A stroke along a path of quadratic pieces, thick `w`, round ends: [x0,y0, cx,cy,x1,y1, cx,cy,x2,y2 …]. */
function curve(c: Ctx, w: number, p: number[]): void {
  c.lineWidth = w
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.beginPath()
  c.moveTo(p[0], p[1])
  for (let i = 2; i + 3 < p.length; i += 4) c.quadraticCurveTo(p[i], p[i + 1], p[i + 2], p[i + 3])
  c.stroke()
}

/** An egg: a ring between an outer and an inner ellipse, the weight at the bottom (the inner one set high). */
function egg(c: Ctx, cx: number, cy: number, rx: number, ry: number, t: number): void {
  c.beginPath()
  c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  c.ellipse(cx, cy - t * 0.35, rx - t, ry - t * 1.15, 0, 0, Math.PI * 2, true)
  c.fill('evenodd')
}

/** Each glyph: its advance width, and how to draw it in its cell. */
const GLYPHS: Record<string, { w: number; draw: (c: Ctx) => void }> = {
  M: { w: 0.92, draw: (c) => {
    stem(c, 0.14, 0.02, 1)
    stem(c, 0.78, 0.02, 1)
    // the drape: down from each stem's head to a rounded point low in the middle
    curve(c, 0.1, [0.16, 0.08, 0.28, 0.72, 0.46, 0.8, 0.64, 0.72, 0.76, 0.08])
  } },
  E: { w: 0.6, draw: (c) => {
    stem(c, 0.15, 0.02, 1)
    curve(c, 0.1, [0.16, 0.06, 0.38, 0.0, 0.52, 0.1])          // the head arm, flicking up then over
    curve(c, 0.09, [0.18, 0.5, 0.3, 0.46, 0.42, 0.5])           // the short middle arm
    curve(c, 0.11, [0.16, 0.95, 0.42, 0.98, 0.54, 0.8])         // the foot arm, curling up
  } },
  T: { w: 0.66, draw: (c) => {
    stem(c, 0.33, 0.1, 1)
    curve(c, 0.11, [0.04, 0.2, 0.1, 0.02, 0.33, 0.05, 0.56, 0.02, 0.62, 0.2])   // the bar drooping at both ends
  } },
  R: { w: 0.68, draw: (c) => {
    stem(c, 0.15, 0.02, 1)
    curve(c, 0.11, [0.17, 0.06, 0.58, 0.04, 0.54, 0.3, 0.5, 0.52, 0.2, 0.52])     // the bowl
    curve(c, 0.12, [0.3, 0.52, 0.52, 0.6, 0.54, 0.84, 0.56, 0.98, 0.66, 0.96])    // the leg kicking out
  } },
  O: { w: 0.7, draw: (c) => egg(c, 0.35, 0.53, 0.3, 0.48, 0.14) },
  P: { w: 0.62, draw: (c) => {
    stem(c, 0.15, 0.02, 1)
    egg(c, 0.34, 0.33, 0.24, 0.3, 0.11)
  } },
  L: { w: 0.56, draw: (c) => {
    stem(c, 0.15, 0.02, 1)
    curve(c, 0.11, [0.16, 0.95, 0.4, 0.99, 0.52, 0.78])
  } },
  I: { w: 0.32, draw: (c) => stem(c, 0.16, 0.02, 1) },
  A: { w: 0.74, draw: (c) => {
    // an arch: two legs, rounded together at the head, the bar set low
    curve(c, 0.11, [0.13, 0.5, 0.12, 0.12, 0.37, 0.02, 0.62, 0.12, 0.61, 0.5])
    stem(c, 0.13, 0.35, 1)
    stem(c, 0.61, 0.35, 1)
    curve(c, 0.09, [0.14, 0.7, 0.37, 0.64, 0.6, 0.7])
  } },
  N: { w: 0.74, draw: (c) => {
    stem(c, 0.14, 0.02, 1)
    stem(c, 0.6, 0.02, 1)
    curve(c, 0.1, [0.16, 0.08, 0.22, 0.6, 0.6, 0.96])
  } },
}

/*
 * The hand: a fixed set per letter of the word — [swell, drop, lean, width, kern] — so the panel is the same every
 * time but no two letters agree. Swell stretches the letter taller, drop sinks it, lean tilts it (radians), width
 * squeezes or fattens it, and kern is the gap to the next letter in em: mostly negative, so neighbours run into each
 * other the way the painted panels' letters crowd and touch (T into R, the O tucked under the P's bowl, A into I).
 */
const HAND: [number, number, number, number, number][] = [
  [0.08, 0.0, -0.05, 1.05, -0.032],   // M
  [-0.06, 0.03, 0.04, 0.95, -0.009],  // E
  [0.1, -0.03, -0.02, 1.0, -0.059],   // T, over the R
  [0.0, 0.02, 0.05, 1.04, -0.018],    // R
  [-0.1, 0.05, -0.03, 0.9, -0.036],   // O, small and low
  [0.07, -0.02, 0.03, 1.0, -0.045],    // P, its bowl over the O
  [-0.04, 0.03, -0.04, 0.92, -0.013], // O
  [0.12, -0.04, 0.02, 0.98, 0.03],  // L, kept clear of the I or the pair reads as U
  [0.05, -0.02, -0.03, 1.0, -0.009],  // I
  [0.14, -0.05, 0.03, 1.02, -0.050],  // T
  [-0.02, 0.02, -0.05, 1.06, 0.0],  // A, its bar clear of the I
  [0.06, -0.01, 0.04, 1.0, -0.013],   // I
  [0.03, 0.01, -0.02, 1.04, 0],      // N
]

/**
 * The word, centred in the box (x, y, w, h), as tall as fits. `fill` is the letters' colour. Each letter is laid twice,
 * the second a hair off and a shade off, for the brush's uneven edge. Unknown letters are skipped.
 */
export function drawGuimardWord(c: Ctx, word: string, x: number, y: number, w: number, h: number, fill: string): void {
  const hand = (i: number) => HAND[i % HAND.length]
  const adv = (i: number): number => (GLYPHS[word[i]]?.w ?? 0.5) * hand(i)[3] + (i < word.length - 1 ? hand(i)[4] : 0)
  let em = 0
  for (let i = 0; i < word.length; i++) em += adv(i)
  const size = Math.min(h * 0.8, w / em)
  let cx = x + (w - em * size) / 2
  const base = y + (h - size) / 2
  c.save()
  for (let i = 0; i < word.length; i++) {
    const g = GLYPHS[word[i]]
    const [swell, drop, lean, wide] = hand(i)
    if (g) {
      for (const pass of [0, 1]) {
        c.save()
        c.fillStyle = c.strokeStyle = pass ? shadeHex(fill, 1.18) : fill
        c.globalAlpha = pass ? 0.35 : 1
        const gw = g.w * wide * size
        c.translate(cx + gw / 2 + pass * size * 0.006, base + size * (1 + drop) - pass * size * 0.005)
        c.rotate(lean + pass * 0.01)
        c.scale(size * wide, size * (1 + swell))
        c.translate(-g.w / 2, -1)
        g.draw(c)
        c.restore()
      }
    }
    cx += adv(i) * size
  }
  c.restore()
}

function shadeHex(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number): string => Math.min(255, Math.round(v * k)).toString(16).padStart(2, '0')
  return `#${ch(n >> 16)}${ch((n >> 8) & 255)}${ch(n & 255)}`
}
