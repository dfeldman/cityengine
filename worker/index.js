/**
 * Cycle Dash on Cloudflare: serves the R2 bucket `dash` (the production build, `npm run build` then
 * `sh tools/r2-upload.sh`) as a website. `/`, and any path without a file extension, is the game's index.html; the
 * rest is the object of that name. Hashed bundles (assets/) and the big city data are cached hard; index.html is
 * revalidated so a new build shows at once.
 *
 *   cd worker && npx wrangler deploy
 */
const TYPES = {
  html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8', json: 'application/json', webmanifest: 'application/manifest+json',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif', gif: 'image/gif',
  svg: 'image/svg+xml', ico: 'image/x-icon', ktx2: 'image/ktx2',
  glb: 'model/gltf-binary', gltf: 'model/gltf+json', bin: 'application/octet-stream',
  wasm: 'application/wasm', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', mp4: 'video/mp4', txt: 'text/plain; charset=utf-8',
}

export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } })
    const url = new URL(request.url)
    let key = decodeURIComponent(url.pathname.replace(/^\/+/, ''))
    // the default document: the root, a directory, or a path with no extension (the game is one page)
    const last = key.split('/').pop() ?? ''
    if (key === '' || key.endsWith('/') || !last.includes('.')) key = 'index.html'

    const obj = await env.BUCKET.get(key, { onlyIf: request.headers, range: request.headers })
    if (obj === null) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } })

    const headers = new Headers()
    obj.writeHttpMetadata(headers)
    headers.set('etag', obj.httpEtag)
    const ext = (key.split('.').pop() ?? '').toLowerCase()
    if (TYPES[ext]) headers.set('content-type', TYPES[ext])
    headers.set('cache-control', key === 'index.html' ? 'no-cache'
      : key.startsWith('assets/') ? 'public, max-age=31536000, immutable'
      : 'public, max-age=86400')
    headers.set('access-control-allow-origin', '*')

    // a conditional request the object already satisfies: no body
    if (!('body' in obj)) return new Response(null, { status: 304, headers })
    if (obj.range && request.headers.has('range')) {
      const r = obj.range
      const start = 'offset' in r ? r.offset : 'suffix' in r ? obj.size - r.suffix : 0
      const len = 'length' in r ? r.length : obj.size - start
      headers.set('content-range', `bytes ${start}-${start + len - 1}/${obj.size}`)
      return new Response(request.method === 'HEAD' ? null : obj.body, { status: 206, headers })
    }
    return new Response(request.method === 'HEAD' ? null : obj.body, { headers })
  },
}
