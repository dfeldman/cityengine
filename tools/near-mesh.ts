/** Which meshes have vertices near a point, and at what heights — for "why is this not drawn". */
import { chromium } from 'playwright'
const arg = (n: string, f = ''): string => {
  const h = process.argv.slice(2).find((a) => a.startsWith(`--${n}=`))
  return h ? h.slice(n.length + 3) : f
}
const [px, pz] = arg('at').split(',').map(Number)
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1000, height: 600 } })
await page.goto(`http://localhost:5200/?city=${arg('city', 'paris-marais')}&start=${arg('edge')}&freeze=1`)
await page.waitForFunction('window.riderReady === true', null, { timeout: 90_000 })
await page.waitForTimeout(2500)
const r = await page.evaluate(`(() => {
  const out = []
  for (const m of window.__scene.meshes) {
    const pos = m.getVerticesData && m.getVerticesData('position')
    if (!pos || m.hasThinInstances) continue
    let n = 0, lo = 1e9, hi = -1e9
    for (let i = 0; i < pos.length; i += 3) {
      if (Math.hypot(pos[i] - ${px}, pos[i + 2] - ${pz}) < ${arg('r', '4')}) { n++; lo = Math.min(lo, pos[i + 1]); hi = Math.max(hi, pos[i + 1]) }
    }
    if (n > 0) out.push(m.name + ' g' + m.renderingGroupId + ' en=' + m.isEnabled() + ' n=' + n + ' y ' + lo.toFixed(1) + '..' + hi.toFixed(1))
  }
  return out
})()`)
console.log((r as string[]).join('\n'))
await browser.close()
