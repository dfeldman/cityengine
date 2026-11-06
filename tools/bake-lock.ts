/**
 * One bake at a time: two at once fight over the work files and run the machine out of memory.
 * The lock holds the owner's pid; a lock whose pid is dead is stale and taken over. BAKE_LOCK=0 skips it.
 */
import { openSync, writeSync, closeSync, readFileSync, unlinkSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const LOCK = resolve(import.meta.dirname, 'cache', 'bake.lock')

const alive = (pid: number): boolean => {
  try { process.kill(pid, 0); return true } catch (e) { return (e as NodeJS.ErrnoException).code === 'EPERM' }
}

function take(): boolean {
  try {
    const fd = openSync(LOCK, 'wx')
    writeSync(fd, `${process.pid}\n${new Date().toISOString()}\n${process.argv.slice(2).join(' ')}\n`)
    closeSync(fd)
    return true
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e
    return false
  }
}

if (process.env.BAKE_LOCK !== '0') {
  mkdirSync(resolve(LOCK, '..'), { recursive: true })
  if (!take()) {
    const [pid, since, args] = readFileSync(LOCK, 'utf8').split('\n')
    if (alive(Number(pid))) {
      console.error(`bake: another bake is running (pid ${pid}, since ${since}, args "${args}"). Lock: ${LOCK}`)
      process.exit(1)
    }
    console.warn(`bake: stale lock from dead pid ${pid}; taking it over`)
    unlinkSync(LOCK)
    if (!take()) { console.error('bake: lost the race for the lock'); process.exit(1) }
  }
  const release = () => {
    try { if (readFileSync(LOCK, 'utf8').startsWith(`${process.pid}\n`)) unlinkSync(LOCK) } catch {}
  }
  process.on('exit', release)
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(sig, () => process.exit(130))
}
