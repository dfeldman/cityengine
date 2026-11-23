// One shot at a time on this machine: two headless browsers rendering the city at once crash each other, and several
// agents shoot at once. shotLock() waits for tools/cache/shot.lock (holds the pid; a dead holder's lock is taken over)
// and releases it when the process exits. SHOT_LOCK=0 skips it.
import { mkdirSync, openSync, readFileSync, unlinkSync, writeSync, closeSync } from 'node:fs'
import { resolve } from 'node:path'

const LOCK = resolve(import.meta.dirname, 'cache', 'shot.lock')
const POLL_MS = 2000
const WAIT_MS = Number(process.env.SHOT_LOCK_WAIT_MS ?? 45 * 60_000)

const alive = (pid: number) => { try { process.kill(pid, 0); return true } catch (e) { return (e as { code?: string }).code === 'EPERM' } }

export async function shotLock(): Promise<void> {
  if (process.env.SHOT_LOCK === '0') return
  mkdirSync(resolve(LOCK, '..'), { recursive: true })
  const t0 = Date.now()
  let told = false
  for (;;) {
    try {
      const fd = openSync(LOCK, 'wx')
      writeSync(fd, `${process.pid} ${process.argv.slice(2).join(' ')}\n`)
      closeSync(fd)
      process.on('exit', () => { try { if (readFileSync(LOCK, 'utf8').startsWith(`${process.pid} `)) unlinkSync(LOCK) } catch {} })
      for (const s of ['SIGINT', 'SIGTERM'] as const) process.on(s, () => process.exit(130))
      return
    } catch (e) {
      if ((e as { code?: string }).code !== 'EEXIST') throw e
    }
    let held = ''
    try { held = readFileSync(LOCK, 'utf8') } catch { continue }
    const pid = Number(held.split(' ')[0])
    if (!pid || !alive(pid)) { try { unlinkSync(LOCK) } catch {} continue }
    if (!told) { console.error(`waiting for the shot lock, held by ${held.trim().slice(0, 120)}`); told = true }
    if (Date.now() - t0 > WAIT_MS) throw new Error(`shot lock still held after ${WAIT_MS / 60000} min by pid ${pid}`)
    await new Promise(r => setTimeout(r, POLL_MS))
  }
}
