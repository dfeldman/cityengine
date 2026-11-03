/**
 * Render an answer from the judging views, from node: one headless browser on viewer.html (through the dev server
 * on :5200, or SHOTS_BASE), opened on first use and shared. Calls are queued, because the page holds one scene —
 * run.ts's parallel workers would otherwise draw over each other's models.
 *
 * run.ts uses it for the feedback turn (the model sees its own answer beside the photographs).
 */
import { chromium, type Browser, type Page } from 'playwright'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const BASE = process.env.SHOTS_BASE ?? 'http://localhost:5200'
export type View = 'front34' | 'rear34' | 'top' | 'front'

let browser: Browser | null = null
let page: Page | null = null
let queue: Promise<unknown> = Promise.resolve()

async function open(w: number, h: number): Promise<Page> {
  if (page) return page
  browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'] })
  page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.goto(`${BASE}/tools/benchmark/modeling/viewer.html`)
  await page.waitForFunction('window.__ready === true', null, { timeout: 120_000 })
  return page
}

/** JPEG renders of `json` on the footprint, one per view, `w`×`h` */
export function renderViews(json: unknown, outline: [number, number][], height: number, views: View[], w = 640, h = 480): Promise<Buffer[]> {
  const job = queue.then(async () => {
    const p = await open(w, h)
    await p.evaluate(([m, o, ht]) => (window as unknown as { __show: (a: unknown, b: unknown, c: unknown) => unknown }).__show(m, o, ht), [json, outline, height] as const)
    const sharp = require('sharp')
    const out: Buffer[] = []
    for (const v of views) {
      const url = await p.evaluate((view) => (window as unknown as { __shoot: (v: string) => Promise<string> }).__shoot(view), v) as string
      out.push(await sharp(Buffer.from(url.split(',')[1], 'base64')).jpeg({ quality: 85 }).toBuffer())
    }
    return out
  })
  queue = job.catch(() => undefined)
  return job
}

export async function closeRenderer(): Promise<void> {
  await queue
  await browser?.close()
  browser = null
  page = null
}
