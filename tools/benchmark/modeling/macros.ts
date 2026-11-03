/**
 * v3's larger parts — block, court, rotunda, tower — written out as the ordinary parts dsl.ts already draws.
 *
 * Haiku places one bold element well and fails at assembling many (runs/compare-2026-11-02.md): a court comes out
 * as a solid block, an open rotunda as a closed drum, a Beaux-Arts front as an office block under a grey lid. These
 * macros turn each arrangement into one part with a handful of fields, the way the game's `facade()` turns a
 * building into slots (docs/KIT.md). Because they expand to box/colonnade/arcade/roof/dome/cylinder parts, the
 * renderer is unchanged and the scorer's feature checks (a dome, columns, arches) see what they always saw.
 *
 * No imports, like dsl.ts: it runs in node and in the browser.
 */

type Raw = Record<string, unknown>
type XZ = [number, number]

export const MACRO_TYPES = ['block', 'court', 'rotunda', 'tower'] as const
export type MacroType = (typeof MACRO_TYPES)[number]

export const MACRO_FIELDS: Record<MacroType, string[]> = {
  block: ['center', 'size', 'rotate', 'y0', 'storeys', 'bay', 'faces', 'cornice', 'roof', 'trim'],
  court: ['center', 'size', 'rotate', 'y0', 'wing', 'open', 'courtColonnade', 'storeys', 'bay', 'cornice', 'roof', 'trim'],
  rotunda: ['center', 'radius', 'y0', 'base', 'height', 'count', 'columnRadius', 'open', 'arches', 'entablature', 'drum', 'dome', 'lantern', 'trim'],
  tower: ['center', 'y0', 'rotate', 'stages', 'top', 'trim'],
}

export const STOREY_KINDS = ['blank', 'punched', 'arched', 'rusticated', 'arcade', 'columns', 'pilasters', 'bands', 'curtain'] as const
const FACES = ['front', 'back', 'left', 'right'] as const
type Face = (typeof FACES)[number]

/** a numeric field: the default when absent, clamped to its range when wild (macros are always lenient) */
function n(o: Raw, k: string, def: number, min = -Infinity, max = Infinity): number {
  let v = o[k]
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) v = Number(v)
  if (typeof v !== 'number' || !Number.isFinite(v)) return def
  return Math.min(max, Math.max(min, v))
}
const pair = (o: Raw, k: string, def: XZ): XZ => {
  const v = o[k]
  return Array.isArray(v) && v.length === 2 && v.every((x) => typeof x === 'number' && Number.isFinite(x)) ? [v[0], v[1]] : def
}
const str = (o: Raw, k: string, def: string): string => (typeof o[k] === 'string' ? (o[k] as string) : def)

/** a colour lighter (f > 0) or darker (f < 0) than `hex`, for trim and recesses */
function shade(hex: string, f: number): string {
  const h = /^#?([0-9a-f]{6})$/i.exec(hex.trim())?.[1] ?? 'd8d2c4'
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  const m = c.map((v) => Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))
  return '#' + m.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
}

const rotP = (p: XZ, c: XZ, deg: number): XZ => {
  const a = (deg * Math.PI) / 180, s = Math.sin(a), co = Math.cos(a)
  return [c[0] + p[0] * co - p[1] * s, c[1] + p[0] * s + p[1] * co]
}

interface Look { colour: string; material: string; trim: string }

function look(o: Raw): Look {
  const colour = str(o, 'colour', str(o, 'color', '#d8d2c4'))
  return { colour, material: str(o, 'material', 'stone'), trim: str(o, 'trim', shade(colour, 0.25)) }
}

// ———————————————————————————————————————————————— block: the facade grammar

interface Storey { height: number; kind: (typeof STOREY_KINDS)[number]; floors: number; blind: boolean }

function storeysOf(o: Raw, warn: (s: string) => void, at: string): Storey[] {
  const raw = Array.isArray(o.storeys) ? o.storeys : []
  if (raw.length === 0) warn(`${at}.storeys: missing; one plain 12 m storey used`)
  const list = raw.length ? raw : [{ height: 12, kind: 'punched' }]
  return list.slice(0, 12).map((s, i) => {
    const r = (s && typeof s === 'object' ? s : {}) as Raw
    let kind = str(r, 'kind', 'punched') as Storey['kind']
    if (!STOREY_KINDS.includes(kind)) { warn(`${at}.storeys[${i}].kind: "${kind}" unknown; "punched" used`); kind = 'punched' }
    const height = n(r, 'height', 5, 1.5, 60)
    // `windows: false`: the storey's pilasters, rustication or arcade without any windows (temples, museums, blank attics)
    return { height, kind, floors: Math.round(n(r, 'floors', Math.max(1, Math.round(height / 5)), 1, 20)), blind: r.windows === false }
  })
}

/**
 * One block: storeys from the bottom up, string courses between them, a cornice, a roof. The front is the side
 * facing local −z before `rotate`; `faces` says which sides carry the storeys' columns, arcades and pilasters
 * (the others are plain walls with the storey's windows).
 */
function block(o: Raw, warn: (s: string) => void, at: string): Raw[] {
  const c = pair(o, 'center', [0, 0]), [W, D] = pair(o, 'size', [30, 20]).map((v) => Math.max(2, v)) as XZ
  const deg = n(o, 'rotate', 0), y0 = n(o, 'y0', 0), bay = n(o, 'bay', 4.5, 1.5, 20)
  const L = look(o)
  const facesRaw = o.faces
  const faces: Face[] = facesRaw === 'all' || facesRaw === undefined ? [...FACES]
    : typeof facesRaw === 'string' ? (FACES.includes(facesRaw as Face) ? [facesRaw as Face] : [...FACES])
    : Array.isArray(facesRaw) ? facesRaw.filter((f): f is Face => FACES.includes(f as Face)) : [...FACES]
  const P = (x: number, z: number): XZ => rotP([x, z], c, deg)
  // each side as a line from its left end to its right end seen from outside, and its outward normal (local)
  const side = (f: Face, inset: number): { a: XZ; b: XZ } => {
    const w = W / 2 - inset, d = D / 2 - inset
    return f === 'front' ? { a: P(-w, -d), b: P(w, -d) } : f === 'back' ? { a: P(w, d), b: P(-w, d) }
      : f === 'left' ? { a: P(-w, d), b: P(-w, -d) } : { a: P(w, -d), b: P(w, d) }
  }
  const len = (f: Face): number => (f === 'front' || f === 'back' ? W : D)
  const out: Raw[] = []
  const mat = { material: L.material }
  let y = y0
  const storeys = storeysOf(o, warn, at)
  storeys.forEach((s, i) => {
    const y1 = y + s.height, floor = s.height / s.floors
    const win = (kind: string, solid = 0.55): Raw => ({ kind, floor, pitch: bay, solid })
    if (s.kind === 'arcade' || s.kind === 'columns') {
      // a recessed dark wall behind, the arches or columns on the outer line of each listed side
      const t = s.kind === 'arcade' ? 1.6 : 2.6
      out.push({ type: 'box', center: c, size: [W - 2 * t, D - 2 * t], rotate: deg, y0: y, y1, colour: shade(L.colour, -0.45), ...mat })
      for (const f of FACES) {
        const { a, b } = side(f, 0)
        if (!faces.includes(f)) {
          const m = side(f, t / 2)
          const fw = f === 'front' || f === 'back'
          out.push({ type: 'box', center: [(m.a[0] + m.b[0]) / 2, (m.a[1] + m.b[1]) / 2], size: fw ? [W, t] : [t, D - 2 * t], rotate: deg, y0: y, y1, colour: L.colour, ...mat, ...(s.blind ? {} : { windows: win('punched') }) })
          continue
        }
        const count = Math.max(1, Math.round(len(f) / bay))
        if (s.kind === 'arcade') out.push({ type: 'arcade', from: a, to: b, y0: y, height: s.height, count, thickness: 0.9, colour: L.colour, ...mat })
        else out.push({ type: 'colonnade', from: a, to: b, y0: y, height: s.height, count: count + 1, radius: Math.min(1.1, Math.max(0.3, s.height / 20)), entablature: Math.min(1.5, s.height * 0.1), colour: L.trim, ...mat })
      }
    } else {
      const windows = s.kind === 'blank' || s.blind ? undefined : s.kind === 'pilasters' ? win('punched', 0.6) : win(s.kind)
      out.push({ type: 'box', center: c, size: [W, D], rotate: deg, y0: y, y1, colour: L.colour, ...mat, ...(windows ? { windows } : {}) })
      if (s.kind === 'pilasters') for (const f of faces) {
        const { a, b } = side(f, -0.3)
        const count = Math.max(1, Math.round(len(f) / bay))
        const fw = f === 'front' || f === 'back'
        for (let k = 0; k <= count; k++) {
          const u = k / count
          out.push({ type: 'box', center: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], size: fw ? [0.9, 0.6] : [0.6, 0.9], rotate: deg, y0: y, y1, colour: L.trim, ...mat })
        }
      }
    }
    if (i < storeys.length - 1) out.push({ type: 'box', center: c, size: [W + 0.5, D + 0.5], rotate: deg, y0: y1 - 0.25, y1: y1 + 0.25, colour: L.trim, ...mat })
    y = y1
  })
  const cornice = n(o, 'cornice', 1, 0, 6)
  if (cornice > 0) { out.push({ type: 'box', center: c, size: [W + 1.6, D + 1.6], rotate: deg, y0: y, y1: y + cornice, colour: L.trim, ...mat }); y += cornice }
  out.push(...roofOf(o.roof, c, [W, D], deg, y, bay, L, warn, at))
  return out
}

/** the roof over a block: flat, balustrade, gable, hip, pyramid, mansard, pavilion or dome, with dormers if asked */
function roofOf(r0: unknown, c: XZ, [W, D]: XZ, deg: number, y: number, bay: number, L: Look, warn: (s: string) => void, at: string): Raw[] {
  const r = (r0 && typeof r0 === 'object' ? r0 : typeof r0 === 'string' ? { kind: r0 } : { kind: 'flat' }) as Raw
  const kinds = ['flat', 'balustrade', 'gable', 'hip', 'pyramid', 'mansard', 'pavilion', 'dome']
  let kind = str(r, 'kind', 'flat')
  if (!kinds.includes(kind)) { warn(`${at}.roof.kind: "${kind}" unknown; "flat" used`); kind = 'flat' }
  const colour = str(r, 'colour', str(r, 'color', '#4f5862')), material = str(r, 'material', 'tile')
  const rise = n(r, 'rise', kind === 'pavilion' ? Math.min(W, D) * 0.45 : kind === 'mansard' ? 6 : kind === 'dome' ? Math.min(W, D) * 0.4 : Math.min(W, D) * 0.25, 0.3, 80)
  const out: Raw[] = []
  if (kind === 'flat') return out
  if (kind === 'balustrade') {
    const t = 0.4, h = 1.2
    const P = (x: number, z: number): XZ => rotP([x, z], c, deg)
    out.push({ type: 'box', center: P(0, -D / 2 + t / 2), size: [W, t], rotate: deg, y0: y, y1: y + h, colour: L.trim, material: L.material })
    out.push({ type: 'box', center: P(0, D / 2 - t / 2), size: [W, t], rotate: deg, y0: y, y1: y + h, colour: L.trim, material: L.material })
    out.push({ type: 'box', center: P(-W / 2 + t / 2, 0), size: [t, D], rotate: deg, y0: y, y1: y + h, colour: L.trim, material: L.material })
    out.push({ type: 'box', center: P(W / 2 - t / 2, 0), size: [t, D], rotate: deg, y0: y, y1: y + h, colour: L.trim, material: L.material })
    return out
  }
  if (kind === 'dome') return [{ type: 'dome', center: c, radius: Math.min(W, D) / 2 * 0.92, y0: y, height: rise, colour, material }]
  out.push({ type: 'roof', kind, center: c, size: [W, D], rotate: deg, y0: y, rise, colour, material })
  if (r.dormers && (kind === 'mansard' || kind === 'hip' || kind === 'pavilion' || kind === 'gable')) {
    // a dormer every other bay on the two long sides, set on the steep lower slope
    const long: 'x' | 'z' = W >= D ? 'x' : 'z'
    const runLen = long === 'x' ? W : D, across = long === 'x' ? D : W
    const count = Math.max(1, Math.floor(runLen / (bay * 2)))
    const inset = kind === 'mansard' ? Math.min(W, D) * 0.25 * 0.45 : across * 0.18
    const dh = Math.max(1.2, Math.min(rise * 0.5, 3)), dw = Math.min(2.2, bay * 0.5)
    for (const s of [-1, 1]) for (let k = 0; k < count; k++) {
      const u = -runLen / 2 + (k + 0.5) * (runLen / count)
      const v = s * (across / 2 - inset)
      const local: XZ = long === 'x' ? [u, v] : [v, u]
      const p = rotP(local, c, deg)
      const size: XZ = long === 'x' ? [dw, 1.6] : [1.6, dw]
      out.push({ type: 'box', center: p, size, rotate: deg, y0: y + rise * 0.1, y1: y + rise * 0.1 + dh, colour: L.trim, material: L.material, windows: { kind: 'punched', floor: dh, pitch: dw, solid: 0.35 } })
      out.push({ type: 'roof', kind: 'gable', center: p, size, rotate: deg, y0: y + rise * 0.1 + dh, rise: 0.9, ridge: long === 'x' ? 'z' : 'x', colour, material })
    }
  }
  return out
}

// ———————————————————————————————————————————————— court: wings round an open court

function court(o: Raw, warn: (s: string) => void, at: string): Raw[] {
  const c = pair(o, 'center', [0, 0]), [W, D] = pair(o, 'size', [80, 60]).map((v) => Math.max(6, v)) as XZ
  const deg = n(o, 'rotate', 0), wing = n(o, 'wing', Math.min(W, D) * 0.22, 3, Math.min(W, D) / 2.2)
  let open = str(o, 'open', 'front')
  if (![...FACES, 'none'].includes(open)) { warn(`${at}.open: "${open}" unknown; "front" used`); open = 'front' }
  const has = (f: Face): boolean => open !== f
  const P = (x: number, z: number): XZ => rotP([x, z], c, deg)
  const base: Raw = { ...o, rotate: deg }
  delete base.wing; delete base.open; delete base.courtColonnade; delete base.size; delete base.center
  const out: Raw[] = []
  // left and right wings run the full depth; front and back wings fill between them
  const xl = has('left') ? -W / 2 + wing : -W / 2, xr = has('right') ? W / 2 - wing : W / 2
  if (has('left')) out.push(...block({ ...base, center: P(-W / 2 + wing / 2, 0), size: [wing, D] }, warn, `${at}(left wing)`))
  if (has('right')) out.push(...block({ ...base, center: P(W / 2 - wing / 2, 0), size: [wing, D] }, warn, `${at}(right wing)`))
  if (has('back')) out.push(...block({ ...base, center: P((xl + xr) / 2, D / 2 - wing / 2), size: [xr - xl, wing] }, warn, `${at}(back wing)`))
  if (has('front')) out.push(...block({ ...base, center: P((xl + xr) / 2, -D / 2 + wing / 2), size: [xr - xl, wing] }, warn, `${at}(front wing)`))
  if (o.courtColonnade) {
    // colonnades standing in the court, along the inner face of each wing, one storey high
    const first = storeysOf(o, () => undefined, at)[0]
    const h = Math.min(first?.height ?? 8, 14), L = look(o), gap = 3
    const zf = has('front') ? -D / 2 + wing + gap : -D / 2 + gap, zb = has('back') ? D / 2 - wing - gap : D / 2 - gap
    const cols = (a: XZ, b: XZ): Raw => ({ type: 'colonnade', from: P(...a), to: P(...b), y0: n(o, 'y0', 0), height: h, count: Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4) + 1), colour: L.trim, material: L.material })
    if (has('left')) out.push(cols([xl + gap, zf], [xl + gap, zb]))
    if (has('right')) out.push(cols([xr - gap, zf], [xr - gap, zb]))
    if (has('back')) out.push(cols([xl + gap, zb], [xr - gap, zb]))
    if (has('front')) out.push(cols([xl + gap, zf], [xr - gap, zf]))
  }
  return out
}

// ———————————————————————————————————————————————— rotunda: a ring of columns under a dome

function rotunda(o: Raw, warn: (s: string) => void, at: string): Raw[] {
  void warn; void at
  const c = pair(o, 'center', [0, 0]), R = n(o, 'radius', 12, 1, 80), y0 = n(o, 'y0', 0)
  const base = n(o, 'base', Math.min(2, R * 0.12), 0, 30), H = n(o, 'height', R * 1.3, 1, 120)
  const count = Math.round(n(o, 'count', Math.max(6, Math.round((2 * Math.PI * R) / 4)), 3, 120))
  const cr = n(o, 'columnRadius', Math.min(R * 0.08, H / 16), 0.1, 4)
  const ent = n(o, 'entablature', H * 0.14, 0, 20), drum = n(o, 'drum', 0, 0, 80)
  const open = o.open !== false
  const L = look(o), mat = { material: L.material }
  const out: Raw[] = []
  let y = y0
  if (base > 0) { out.push({ type: 'cylinder', center: c, radius: R + cr * 1.5, y0: y, y1: y + base, colour: L.colour, ...mat }); y += base }
  const rc = R - cr * 1.2
  const arches = Math.round(n(o, 'arches', 0, 0, 16))
  if (arches >= 3) {
    // a ring of great open arches between piers (an octagon of arches you see through), with paired columns at each pier
    const P = (k: number, r: number): XZ => { const a = ((k + 0.5) / arches) * Math.PI * 2; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r] }
    for (let k = 0; k < arches; k++) out.push({ type: 'arcade', from: P(k, R * 0.92), to: P(k + 1, R * 0.92), y0: y, height: H - ent, count: 1, thickness: Math.max(1.5, R * 0.12), colour: L.colour, ...mat })
    if (o.count !== 0) for (let k = 0; k < arches; k++) for (const side of [-1, 1]) {
      const a = ((k + 0.5) / arches) * Math.PI * 2 + side * Math.min(0.12, (Math.PI / arches) * 0.3)
      out.push({ type: 'cylinder', center: [c[0] + Math.cos(a) * (R + cr * 0.6), c[1] + Math.sin(a) * (R + cr * 0.6)], radius: cr, radiusTop: cr * 0.88, y0: y, y1: y + H - ent, sides: 12, colour: L.trim, ...mat })
    }
  } else for (let k = 0; k < count; k++) {
    const a = (k / count) * Math.PI * 2
    out.push({ type: 'cylinder', center: [c[0] + Math.cos(a) * rc, c[1] + Math.sin(a) * rc], radius: cr, radiusTop: cr * 0.88, y0: y, y1: y + H - ent, sides: 12, colour: L.trim, ...mat })
  }
  // closed: a solid cella inside the columns (a drum ringed with columns); open: you see through
  if (!open && arches < 3) out.push({ type: 'cylinder', center: c, radius: Math.max(0.5, rc - cr * 2.2), y0: y, y1: y + H - ent, colour: L.colour, ...mat })
  y += H - ent
  const hollow = open || arches >= 3
  if (ent > 0) { out.push({ type: 'ring', center: c, radius: R + cr * (arches >= 3 ? 1.8 : 0) + 0.3, inner: hollow ? Math.max(0.3, R - cr * 3.5 - (arches >= 3 ? R * 0.12 : 0)) : 0, y0: y, y1: y + ent, colour: L.colour, ...mat }); y += ent }
  const domeR = drum > 0 ? R * 0.88 : R
  if (drum > 0) { out.push({ type: 'ring', center: c, radius: domeR, inner: hollow ? Math.max(0.3, domeR - 1.5) : 0, y0: y, y1: y + drum, colour: L.colour, ...mat }); y += drum }
  const d = (o.dome && typeof o.dome === 'object' ? o.dome : {}) as Raw
  if (o.dome !== false) {
    const dh = n(d, 'height', domeR * 0.75, 0.5, 120)
    out.push({ type: 'dome', center: c, radius: domeR, y0: y, height: dh, colour: str(d, 'colour', str(d, 'color', shade(L.colour, -0.05))), material: str(d, 'material', L.material) })
    y += dh
  }
  if (o.lantern) {
    const lr = Math.max(0.5, domeR * 0.16)
    out.push({ type: 'cylinder', center: c, radius: lr, y0: y - 0.3, y1: y + lr * 1.8, colour: L.colour, ...mat, windows: { kind: 'arched', floor: lr * 1.8, pitch: lr, solid: 0.5 } })
    out.push({ type: 'dome', center: c, radius: lr, y0: y + lr * 1.8, colour: str(d, 'colour', str(d, 'color', L.colour)), material: str(d, 'material', L.material) })
  }
  return out
}

// ———————————————————————————————————————————————— tower: stages and a top

function tower(o: Raw, warn: (s: string) => void, at: string): Raw[] {
  const c = pair(o, 'center', [0, 0]), deg = n(o, 'rotate', 0)
  const L = look(o), mat = { material: L.material }
  const stages = (Array.isArray(o.stages) ? o.stages : []).slice(0, 10)
  if (stages.length === 0) { warn(`${at}.stages: missing; one 30 m square stage used`); stages.push({ shape: 'square', width: 8, height: 30 }) }
  const out: Raw[] = []
  let y = n(o, 'y0', 0), w = 8, shape = 'square'
  stages.forEach((s0, i) => {
    const s = (s0 && typeof s0 === 'object' ? s0 : {}) as Raw
    shape = ['square', 'round', 'octagon'].includes(str(s, 'shape', shape)) ? str(s, 'shape', shape) : shape
    w = n(s, 'width', w, 0.5, 80)
    const h = n(s, 'height', 10, 0.5, 300)
    const kind = str(s, 'kind', 'blank')
    const windows = kind === 'punched' ? { kind: 'punched', floor: Math.min(h, 4), pitch: Math.max(1.5, w / 3) }
      : kind === 'arched' ? { kind: 'arched', floor: Math.min(h, 6), pitch: Math.max(1.5, w / 3) }
      : kind === 'open' ? { kind: 'arched', floor: h, pitch: Math.max(1.5, w / 2), solid: 0.35 } : undefined
    const colour = str(s, 'colour', L.colour)
    if (shape === 'square') out.push({ type: 'box', center: c, size: [w, w], rotate: deg, y0: y, y1: y + h, colour, ...mat, ...(windows ? { windows } : {}) })
    else out.push({ type: 'cylinder', center: c, radius: w / 2, y0: y, y1: y + h, sides: shape === 'octagon' ? 8 : 24, colour, ...mat, ...(windows ? { windows } : {}) })
    if (kind === 'clock') {
      // a clock face on each of the four sides, at mid-height
      const r = Math.min(w * 0.36, h * 0.4)
      for (const f of FACES) out.push({ type: 'disc', center: clockAt(c, deg, f, w / 2 + 0.1, y + h / 2), facing: f, rotate: deg, radius: r, colour: '#f2efe6' })
    }
    // a cornice between stages, a little wider
    if (i < stages.length - 1 || !o.top) {
      if (shape === 'square') out.push({ type: 'box', center: c, size: [w + 0.8, w + 0.8], rotate: deg, y0: y + h, y1: y + h + 0.6, colour: L.trim, ...mat })
      else out.push({ type: 'cylinder', center: c, radius: w / 2 + 0.4, y0: y + h, y1: y + h + 0.6, sides: shape === 'octagon' ? 8 : 24, colour: L.trim, ...mat })
      y += 0.6
    }
    y += h
  })
  const t = (o.top && typeof o.top === 'object' ? o.top : typeof o.top === 'string' ? { kind: o.top } : null) as Raw | null
  if (t) {
    const kind = str(t, 'kind', 'pyramid'), th = n(t, 'height', w * 1.2, 0.3, 200)
    const colour = str(t, 'colour', str(t, 'color', '#59626a')), material = str(t, 'material', 'metal')
    if (kind === 'spire' || kind === 'pyramid') {
      if (shape === 'square') out.push({ type: 'roof', kind: 'pyramid', center: c, size: [w, w], rotate: deg, y0: y, rise: th, colour, material })
      else out.push({ type: 'cylinder', center: c, radius: w / 2, radiusTop: 0, y0: y, y1: y + th, sides: shape === 'octagon' ? 8 : 24, colour, material })
    } else if (kind === 'dome') out.push({ type: 'dome', center: c, radius: w / 2, y0: y, height: th, colour, material })
    else if (kind === 'cupola') {
      const ch = th * 0.55
      out.push(...rotunda({ center: c, radius: w * 0.38, y0: y, base: 0, height: ch, count: 8, colour: L.colour, trim: L.trim, material: L.material, dome: { height: th - ch, colour, material } }, warn, at))
    } else if (kind !== 'flat') warn(`${at}.top.kind: "${kind}" unknown; left flat`)
  }
  return out
}

function clockAt(c: XZ, deg: number, f: Face, d: number, y: number): [number, number, number] {
  const local: XZ = f === 'front' ? [0, -d] : f === 'back' ? [0, d] : f === 'left' ? [-d, 0] : [d, 0]
  const p = rotP(local, c, deg)
  return [p[0], y, p[1]]
}

/** a macro written out as ordinary parts; `warn` collects what was defaulted or clamped */
export function expandMacro(type: MacroType, o: Raw, warn: (s: string) => void, at: string): Raw[] {
  switch (type) {
    case 'block': return block(o, warn, at)
    case 'court': return court(o, warn, at)
    case 'rotunda': return rotunda(o, warn, at)
    case 'tower': return tower(o, warn, at)
  }
}
