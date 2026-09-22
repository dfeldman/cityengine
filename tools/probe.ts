/**
 * Probe a live scene: load a spot, then report what is straight above the camera and what the camera
 * thinks the ground is. For bugs a screenshot shows but cannot explain.
 *   npx tsx tools/probe.ts --city=paris-marais --edge=5448
 */
import { chromium } from 'playwright'

const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : f
}
const BASE = process.env.BASE ?? 'http://localhost:5200'

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 700 } })
await page.goto(`${BASE}/?city=${arg('city', 'paris-marais')}&start=${arg('edge')}&freeze=1`)
await page.waitForFunction('window.gameReady === true', null, { timeout: 60_000 })
await page.waitForTimeout(3000)
const out = await page.evaluate(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scene = (window as any).__scene
  const cam = scene.activeCamera
  const p = cam.position
  const hits: string[] = []
  for (const m of scene.meshes) {
    if (!m.isEnabled() || !m.isVisible || m.getTotalVertices() === 0) continue
    const pos = m.getVerticesData('position')
    if (!pos) continue
    const w = m.getWorldMatrix()
    // any triangle vertex within 200 m horizontally that sits ABOVE the camera
    let above = 0, maxY = -1e9, n = 0
    const ident = w.isIdentity()
    for (let i = 0; i < pos.length; i += 3) {
      let x = pos[i], y = pos[i + 1], z = pos[i + 2]
      if (!ident) {
        const v = (window as any).BABYLON_V3 ?? null
        void v
      }
      if (Math.hypot(x - p.x, z - p.z) < 300) {
        n++
        if (y > p.y + 2) above++
        if (y > maxY) maxY = y
      }
    }
    if (above > 0 && m.renderingGroupId < 3) {
      hits.push(`${m.name} group=${m.renderingGroupId} mat=${m.material?.name} ident=${ident} near=${n} above=${above} maxY=${maxY.toFixed(1)}`)
    }
  }
  return { cam: [p.x.toFixed(1), p.y.toFixed(1), p.z.toFixed(1)], hits: hits.slice(0, 40) }
})
console.log(JSON.stringify(out, null, 1))
await browser.close()
