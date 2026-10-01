/**
 * Watch the JS heap, because Chrome's ceiling here is hard and fatal.
 *
 * The owner: *"We also have a very strict 3GB heap limit. If we exceed it, Chrome kills us every time."* That
 * is not a performance problem that degrades, it is a cliff: the tab dies with no warning and no stack, and
 * the only evidence is that the game was there a moment ago. BUGS.md #121 was exactly this — `TileStore`
 * retained the parsed JSON of every tile ever visited, riding hid it because a rider crosses tiles slowly,
 * and JUMPING exposed it because `__jump` sweeps tiles from all over the city in seconds.
 *
 * So the useful thing is not a fix, it is VISIBILITY: something that says "we are at 2.1 GB and climbing"
 * while there is still a session to look at. `performance.memory` is Chrome-only and non-standard, and it
 * reports the whole isolate rather than this page alone, but it is the only number available and it is the
 * one that decides whether the tab lives.
 *
 * It deliberately does NOT try to free anything. Dropping data under pressure would mask the leak that
 * caused it, and the ring-dropping in `game.ts` is already the designed answer for tiles.
 */

import type { Scene } from '@babylonjs/core/scene'

interface ChromeMemory { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number }

const memory = (): ChromeMemory | null =>
  (performance as unknown as { memory?: ChromeMemory }).memory ?? null

export const heapMB = (): number | null => {
  const m = memory()
  return m ? Math.round(m.usedJSHeapSize / 1048576) : null
}

/** The ceiling Chrome will actually enforce, in MB — its own figure where offered, else the owner's 3 GB. */
export const heapLimitMB = (): number => {
  const m = memory()
  return m && m.jsHeapSizeLimit > 0 ? Math.round(m.jsHeapSizeLimit / 1048576) : 3072
}

/**
 * Report heap use as it crosses each tenth of the limit, once per step, and shout past 80%.
 *
 * Once per step rather than on a timer: a message every few seconds is noise nobody reads, while "we just
 * crossed 60%" arrives exactly when something changed. The step is remembered so a heap that sits at 61%
 * says nothing more, and a heap that falls back and climbs again reports the crossing again.
 */
export function watchHeap(onWarn?: (msg: string) => void, everyMs = 4000): void {
  if (!memory()) return                       // not Chrome, or the flag is off: nothing to watch
  const limit = heapLimitMB()
  let lastStep = -1
  setInterval(() => {
    const used = heapMB()
    if (used === null) return
    const step = Math.floor((used / limit) * 10)
    if (step <= lastStep) { lastStep = Math.min(lastStep, step); return }
    lastStep = step
    if (step >= 8) {
      const msg = `heap ${used} MB of ${limit} MB — Chrome kills the tab at the limit`
      console.warn(`[heap] ${msg}`)
      onWarn?.(msg)
    } else if (step >= 5) {
      console.info(`[heap] ${used} MB of ${limit} MB (${step * 10}%)`)
    }
  }, everyMs)
}

/**
 * What the scene holds on the GPU, estimated from Babylon's own records (BUGS.md #242): every geometry's vertex
 * and index buffers, every loaded texture with its mip chain. Safari has no `performance.memory`, so on an iPhone
 * this is the number there is — `?mem=1` shows it in a corner, beside the tier and the canvas size.
 */
export function gpuMB(scene: Scene): { buffers: number; textures: number } {
  let buffers = 0
  for (const g of scene.geometries) {
    const n = g.getTotalVertices()
    for (const vb of Object.values(g.getVertexBuffers() ?? {})) if (!vb.getIsInstanced()) buffers += n * vb.getSize() * 4
    // (16-bit indices where the mesh has few enough vertices: counting them all as 32-bit overstated a phone by ~40 MB)
    buffers += g.getTotalIndices() * ((g.getIndexBuffer() as { is32Bits?: boolean } | null)?.is32Bits === false ? 2 : 4)
  }
  let textures = 0
  for (const t of scene.getEngine().getLoadedTexturesCache()) {
    const bpp = t.type === 1 ? 16 : t.type === 2 ? 8 : 4
    textures += t.width * t.height * Math.max(1, t.depth) * (t.isCube ? 6 : 1) * bpp * (t.generateMipMaps ? 4 / 3 : 1)
  }
  return { buffers: Math.round(buffers / 1048576), textures: Math.round(textures / 1048576) }
}

/** `?mem=1`: the tier, the canvas, the GPU estimate and (in Chrome) the heap, in a corner, every two seconds. */
export function showMemory(scene: Scene, tier: string): void {
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99;font:11px/1.3 ui-monospace,monospace;color:#fff;'
    + 'background:rgba(0,0,0,.6);padding:4px 6px;border-radius:4px;pointer-events:none;white-space:pre'
  document.body.appendChild(el)
  const tick = (): void => {
    const g = gpuMB(scene)
    const c = scene.getEngine().getRenderingCanvas()
    const h = heapMB()
    el.textContent = `${tier} · canvas ${c?.width}x${c?.height}\nGPU ~${g.buffers} MB buffers + ${g.textures} MB textures`
      + (h === null ? '' : `\nheap ${h} MB`) + `\n${scene.meshes.length} meshes · ${scene.textures.length} textures`
  }
  tick()
  setInterval(tick, 2000)
}
