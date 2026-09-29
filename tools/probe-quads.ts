/**
 * One-off: what is drawn at a given screen pixel of a stored view?
 *
 *   node --experimental-strip-types tools/probe-quads.ts --city=san-francisco --only="Presidio forest" --at=700,470
 *
 * Picks with a predicate that overrides isPickable, so depth-only and shadow meshes answer too, and reports
 * everything along the ray with its mesh, material and height above the terrain.
 */
import { chromium } from 'playwright'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a === `--${n}` || a.startsWith(`--${n}=`))
  if (!h) return f
  return h.includes('=') ? h.slice(n.length + 3) : 'true'
}
const ROOT = resolve(import.meta.dirname, '..')
const city = arg('city', 'san-francisco')
const port = arg('port', '5200')
const file = resolve(ROOT, 'views', `${city}.json`)
const views = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : []
const want = arg('only').toLowerCase()
const view = views.find((v: { name: string }) => v.name.toLowerCase().includes(want))
if (!view) throw new Error(`no view matching ${want}`)
const pts = arg('at').split(';').map((p) => p.split(',').map(Number))

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } })
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)) })
page.on('pageerror', (e) => console.log('page error:', e.message.slice(0, 200)))
await page.goto(`http://localhost:${port}/?city=${city}&freeze=1&without=life&pick=1`)
await page.waitForFunction('window.gameReady === true && window.riderReady === true', null, { timeout: 180_000 })
await page.waitForFunction('window.treesReady === true', null, { timeout: 120_000 }).catch(() => {})
await page.evaluate(`window.__view(${JSON.stringify(view.from)}, ${JSON.stringify(view.to)})`)
await page.waitForTimeout(3000)
await page.waitForFunction('window.__cityIdle && window.__cityIdle()', null, { timeout: 60_000 }).catch(() => {})
await page.waitForTimeout(1500)

if (arg('hide')) {
  await page.evaluate(`(() => { const re = new RegExp(${JSON.stringify(JSON.stringify(arg('hide')))}.slice(1, -1)); let n = 0; for (const m of window.__scene.meshes) if (re.test(m.name)) { m.setEnabled(false); n++ } return n })()`)
  await page.waitForTimeout(600)
}
await page.screenshot({ path: arg('shot', '/tmp/probe.png') })
const cam = await page.evaluate(`(() => { const sc = window.__scene; const c = sc.activeCamera; return { pos: [c.position.x, c.position.y, c.position.z], target: c.getTarget ? [c.getTarget().x, c.getTarget().y, c.getTarget().z] : null, meshes: sc.meshes.length, enabled: sc.meshes.filter((m) => m.isEnabled() && m.isVisible).length, names: sc.meshes.filter((m) => m.isEnabled() && m.isVisible).slice(0, 15).map((m) => m.name) } })()`)
console.log(JSON.stringify(cam))
const near = await page.evaluate(`(() => {
  const sc = window.__scene
  const c = sc.activeCamera.position
  const out = []
  for (const m of sc.meshes) {
    if (!m.isEnabled() || !m.isVisible) continue
    const bb = m.getBoundingInfo().boundingBox
    const d = bb.centerWorld.subtract(c).length()
    if (d > 300) continue
    if (/^LOD\\d|^sky$/.test(m.name)) continue
    const e = bb.extendSizeWorld
    out.push({ name: m.name, mat: m.material && m.material.name, g: m.renderingGroupId, d: Math.round(d),
      c: [Math.round(bb.centerWorld.x), Math.round(bb.centerWorld.y*10)/10, Math.round(bb.centerWorld.z)],
      size: [Math.round(e.x*2*10)/10, Math.round(e.y*2*10)/10, Math.round(e.z*2*10)/10],
      thin: m.thinInstanceCount || 0, verts: m.getTotalVertices() })
  }
  out.sort((a, b) => a.d - b.d)
  return out.slice(0, 80)
})()`)
console.log(JSON.stringify(near))
if (arg('dump')) {
  const d = await page.evaluate(`(() => {
    const sc = window.__scene
    const c = sc.activeCamera.position
    const re = new RegExp(${JSON.stringify(JSON.stringify(arg('dump')))}.slice(1, -1))
    const out = []
    for (const m of sc.meshes) {
      if (!re.test(m.name)) continue
      const p = m.getVerticesData('position')
      if (!p) continue
      const cells = new Map()
      for (let i = 0; i < p.length; i += 3) {
        const dx = p[i] - c.x, dz = p[i + 2] - c.z
        if (dx * dx + dz * dz > 160 * 160) continue
        const key = Math.round(p[i] / 10) + ',' + Math.round(p[i + 2] / 10)
        const g = window.__heightAt(p[i], p[i + 2])
        const e = cells.get(key) || { key, lo: 1e9, hi: -1e9, ground: Math.round(g * 10) / 10, d: Math.round(Math.hypot(dx, dz)) }
        e.lo = Math.min(e.lo, p[i + 1]); e.hi = Math.max(e.hi, p[i + 1])
        cells.set(key, e)
      }
      for (const e of cells.values()) out.push({ mesh: m.name, ...e, lo: Math.round(e.lo * 10) / 10, hi: Math.round(e.hi * 10) / 10, tall: Math.round((e.hi - e.lo) * 10) / 10 })
    }
    out.sort((a, b) => b.tall - a.tall)
    const seen = sc.meshes.filter((m) => re.test(m.name)).map((m) => [m.name, m.getVerticesData('position') ? m.getVerticesData('position').length : -1, Math.round(m.getBoundingInfo().boundingBox.centerWorld.subtract(c).length())])
    return { seen: seen.slice(0, 12), cam: [Math.round(c.x), Math.round(c.z)], cells: out.slice(0, 25) }
  })()`)
  console.log('DUMP ' + JSON.stringify(d))
}
if (arg('profile')) {
  const x = await page.evaluate(`(() => {
    const t = window.__cityObj.terrain
    const tiles = window.__tiles
    const c = window.__scene.activeCamera.position
    const rows = []
    const seen = new Set()
    for (const [k, tl] of (tiles.entries ? tiles.entries() : Object.entries(tiles))) {
      for (const e of (tl.edges || [])) {
        if (!e.heights || e.name !== 'First Drive West' || seen.has(e.id)) continue
        seen.add(e.id)
        for (let i = 0; i < e.points.length; i += 2) {
          const x = e.points[i], z = e.points[i + 1]
          rows.push({ d: Math.round(Math.hypot(x - c.x, z - c.z)), road: Math.round(e.heights[i / 2] * 10) / 10,
            raw: Math.round(t.rawHeightAt(x, z) * 10) / 10, grade: t.grade ? t.grade(x, z) : null })
        }
      }
    }
    rows.sort((a, b) => a.d - b.d)
    return rows
  })()`)
  console.log('PROFILE ' + JSON.stringify(x))
}
if (arg('cross')) {
  const x = await page.evaluate(`(() => {
    const t = window.__cityObj.terrain
    const tiles = window.__tiles
    const c = window.__scene.activeCamera.position
    let best = null
    for (const [k, tl] of (tiles.entries ? tiles.entries() : Object.entries(tiles))) {
      for (const e of (tl.edges || [])) {
        if (!e.heights || e.name !== 'First Drive West') continue
        const pts = []
        for (let i = 0; i < e.points.length; i += 2) pts.push({ x: e.points[i], z: e.points[i + 1] })
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i]
          const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2
          const d = Math.abs(Math.hypot(mx - c.x, mz - c.z) - ${Number(arg('cross')) || 0})
          if (best && best.cost < d) continue
          const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
          const nx = -(b.z - a.z) / l, nz = (b.x - a.x) / l
          const prof = []
          for (let s = -30; s <= 30; s += 5) prof.push([s, Math.round(t.rawHeightAt(mx + nx * s, mz + nz * s) * 10) / 10])
          best = { cost: d, d: Math.round(Math.hypot(mx - c.x, mz - c.z)), road: Math.round(e.heights[i] * 10) / 10, width: e.width, walk: e.walk, prof }
        }
      }
    }
    return best
  })()`)
  console.log('CROSS ' + JSON.stringify(x))
}
if (arg('edges')) {
  const e = await page.evaluate(`(() => {
    const sc = window.__scene
    const c = sc.activeCamera.position
    const terrain = window.__cityObj.terrain
    const tiles = window.__tiles
    const out = []
    const seen = new Set()
    for (const [k, t] of (tiles.entries ? tiles.entries() : Object.entries(tiles))) {
      for (const e of (t.edges || [])) {
        if (!e.heights || seen.has(e)) continue
        seen.add(e)
        const pts = []
        for (let i = 0; i < e.points.length; i += 2) pts.push({ x: e.points[i], z: e.points[i + 1] })
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], b = pts[i]
          const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2
          if (Math.hypot(mx - c.x, mz - c.z) > 140) continue
          const half = (e.foot ? e.width / 2 : e.width / 2 + Math.max(e.walk, 0.6)) + 0.3
          const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
          const ux = (b.x - a.x) / l, uz = (b.z - a.z) / l
          for (const side of [-1, 1]) {
            const nx = -uz * side, nz = ux * side
            const ga = terrain.rawHeightAt(a.x + nx * (half + 0.6), a.z + nz * (half + 0.6))
            const gb = terrain.rawHeightAt(b.x + nx * (half + 0.6), b.z + nz * (half + 0.6))
            const drop = Math.max(e.heights[i - 1] - ga, e.heights[i] - gb)
            if (drop < 0.6) continue
            out.push({ name: e.name || '', kind: e.kind, foot: !!e.foot, w: e.width, side, seg: i,
              drop: Math.round(drop * 10) / 10, h: Math.round(e.heights[i - 1] * 10) / 10,
              g: Math.round(ga * 10) / 10, d: Math.round(Math.hypot(mx - c.x, mz - c.z)) })
          }
        }
      }
    }
    out.sort((a, b) => b.drop - a.drop)
    return out.slice(0, 30)
  })()`)
  console.log('EDGES ' + JSON.stringify(e))
}
const res = await page.evaluate(`(() => {
  const sc = window.__scene
  for (const m of sc.meshes) { try { m.thinInstanceEnablePicking = true } catch (e) {} }
  const pts = ${JSON.stringify(pts)}
  const out = []
  for (const [x, y] of pts) {
    const hits = sc.multiPick(x, y, () => true) || []
    out.push({ at: [x, y], hits: hits.slice(0, 6).map((h) => ({
      mesh: h.pickedMesh && h.pickedMesh.name,
      thin: h.thinInstanceIndex,
      material: h.pickedMesh && h.pickedMesh.material && h.pickedMesh.material.name,
      group: h.pickedMesh && h.pickedMesh.renderingGroupId,
      visible: h.pickedMesh && h.pickedMesh.isVisible && h.pickedMesh.isEnabled(),
      point: h.pickedPoint && [Math.round(h.pickedPoint.x*10)/10, Math.round(h.pickedPoint.y*100)/100, Math.round(h.pickedPoint.z*10)/10],
      ground: h.pickedPoint && window.__heightAt ? Math.round(window.__heightAt(h.pickedPoint.x, h.pickedPoint.z)*100)/100 : null,
      dist: Math.round(h.distance*10)/10,
    })) })
  }
  return out
})()`)
console.log(JSON.stringify(res, null, 1))
await browser.close()
