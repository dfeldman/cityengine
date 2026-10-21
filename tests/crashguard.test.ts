/**
 * The crash guard steps the graphics down after a run that did not end cleanly. How far down it is allowed
 * to go depends on the machine, and getting that wrong is expensive and invisible.
 *
 * Owner, 2026-10-21: "Plants are not loading on desktop... on desktop the heap size is 199 MB" — a desktop
 * that had been stepped all the way to the mobile tier and left there in localStorage, which a private
 * window did not reproduce because it had no localStorage to read.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

/*
 * Loaded fresh in each test. `settings()` keeps the settings in a module-level cache, so clearing
 * localStorage between tests is not enough on its own — the second test would read the first one's answer.
 */
const load = async (): Promise<{ recoverFromCrash: () => void; quality: () => string }> => {
  vi.resetModules()
  const { recoverFromCrash } = await import('../src/ui/crashguard.ts')
  const { settings } = await import('../src/ui/settings.ts')
  return { recoverFromCrash, quality: () => settings().quality }
}

/** A run that was never written as `closed` — what a crash, or a force-quit, leaves behind. */
const lastRunCrashed = (crashes: number, tier = 'desktop'): void => {
  localStorage.setItem('cycledash.lastRun', JSON.stringify({ state: 'loading', tier, at: Date.now(), crashes }))
}

const asDevice = (ua: string, touch = 0): void => {
  vi.stubGlobal('navigator', { userAgent: ua, platform: 'x', maxTouchPoints: touch })
}

const lastRunClean = (): void =>
  void localStorage.setItem('cycledash.lastRun', JSON.stringify({ state: 'closed', tier: 'desktop', at: Date.now(), crashes: 3 }))

/** The tests run in node, so the two browser globals the guard touches are stood up by hand. */
const store = new Map<string, string>()
const fakeStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
}

describe('the crash guard', () => {
  beforeEach(() => {
    store.clear()
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', fakeStorage)
    vi.stubGlobal('location', { search: '' })
  })

  it('never puts a desktop on the mobile tier, however many times it has crashed', async () => {
    asDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120')
    let quality = () => 'auto'
    for (let i = 1; i <= 6; i++) {
      const m = await load()
      lastRunCrashed(i)
      m.recoverFromCrash()
      quality = m.quality
      expect(quality()).not.toBe('ultra')
    }
    // it is allowed to go as far as Medium, and then stop there
    expect(quality()).toBe('phone')
  })

  it('does put a phone on the mobile tier, which is what it is for', async () => {
    asDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari')
    const a = await load(); lastRunCrashed(1); a.recoverFromCrash()
    const b = await load(); lastRunCrashed(2); b.recoverFromCrash()
    expect(b.quality()).toBe('ultra')
  })

  it('leaves a clean run alone', async () => {
    asDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120')
    const m = await load()
    lastRunClean()
    m.recoverFromCrash()
    expect(m.quality()).toBe('auto')
  })

  it('does not flip between Auto and Medium on alternate crashes once it has settled', async () => {
    asDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120')
    const first = await load(); lastRunCrashed(2); first.recoverFromCrash()
    const settled = first.quality()
    for (let i = 3; i <= 6; i++) {
      const m = await load()
      lastRunCrashed(i)
      m.recoverFromCrash()
      expect(m.quality()).toBe(settled)
    }
  })
})
