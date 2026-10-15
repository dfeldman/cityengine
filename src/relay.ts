/**
 * THE PLATFORM'S API, FROM ANOTHER ORIGIN (owner, 2026-10-14: "cityengine can remain entirely separate from Dandyhorse,
 * it just needs the thin API connection and a metadata.json file").
 *
 * Dandyhorse serves its games from its own origin, and gamekit talks to `/gameapi/*` there with the session cookie.
 * City Dash is served from its own site instead (dash.dfeldman.org, or this repo's dev server), inside a small page
 * that Dandyhorse does serve — `games/citydash/index.html` in the dandyhorse repo, the "shim" — which frames it.
 * A cookie does not cross that boundary (and a third-party one is blocked anyway), so the game does not call the API
 * itself: gamekit's transport (`setFetch`) is swapped for this one, which hands each request to the shim by
 * postMessage; the shim, same-origin with the API, makes it and posts back the answer.
 *
 *   game ── {dh:'fetch', id, method, path, body} ──► shim (Dandyhorse's origin) ── fetch /gameapi/… ──► server
 *   game ◄─ {dh:'reply', id, status, text} ───────── shim
 *
 * The shim says who it is with `?host=<its origin>` on the game's URL. Messages go only to that origin (the browser
 * drops them if the parent is anyone else) and replies are taken only from the parent window at that origin. The shim
 * in turn takes requests only from the City Dash origins it lists, and only for `/gameapi/`.
 */
type Pending = { resolve: (r: Response) => void; reject: (e: unknown) => void }

/** The origin the shim gave, if this page is framed by one: `?host=` on the URL, a well-formed http(s) origin. */
export function relayHost(params: URLSearchParams): string | null {
  const host = params.get('host')
  if (!host || window.parent === window) return null
  try {
    const u = new URL(host)
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.origin === host ? host : null
  } catch { return null }
}

/** A `fetch` for gamekit's `setFetch`, carried by the shim at `host`. */
export function relayFetch(host: string): typeof fetch {
  const pending = new Map<number, Pending>()
  let next = 1
  addEventListener('message', (ev: MessageEvent) => {
    if (ev.source !== window.parent || ev.origin !== host) return
    const m = ev.data as { dh?: string; id?: number; status?: number; text?: string; error?: string } | null
    if (!m || m.dh !== 'reply' || typeof m.id !== 'number') return
    const p = pending.get(m.id)
    if (!p) return
    pending.delete(m.id)
    if (m.error) p.reject(new TypeError(m.error))
    // (a 204 or a 304 may not have a body)
    else p.resolve(new Response(m.status === 204 || m.status === 304 ? null : (m.text ?? ''), { status: m.status ?? 500 }))
  })
  return (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const path = typeof input === 'string' ? input : input instanceof URL ? input.pathname + input.search : input.url
    const id = next++
    const signal = init?.signal
    return new Promise<Response>((resolve, reject) => {
      if (signal?.aborted) { reject(new DOMException('aborted', 'AbortError')); return }
      pending.set(id, { resolve, reject })
      // (the long poll is aborted when the session ends: the shim aborts its own request too)
      signal?.addEventListener('abort', () => {
        if (!pending.delete(id)) return
        window.parent.postMessage({ dh: 'abort', id }, host)
        reject(new DOMException('aborted', 'AbortError'))
      }, { once: true })
      window.parent.postMessage({
        dh: 'fetch', id, method: init?.method ?? 'GET', path,
        body: typeof init?.body === 'string' ? init.body : undefined,
      }, host)
    })
  }
}
