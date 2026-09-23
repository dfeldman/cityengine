/**
 * Get a Mapillary access token, once, and write it where the other tools look for it.
 *
 * Mapillary v4 has no "copy your token" button: an application has to be registered and then authorised, and
 * the authorisation comes back as a code in a browser redirect which is exchanged for a token. This does the
 * fiddly half — it listens on a local port for the redirect, makes the exchange, and writes .mapillary-token.
 *
 * FIRST, once, by hand:
 *   1. mapillary.com → sign in → Developers → Register application.
 *      Give it any name. Under "Callback URL" (or "Redirect URI") put exactly:  http://localhost:8234/callback
 *      Tick the read scope ("read user data" / public data).
 *   2. It shows a Client ID and a Client Secret. Put them in a file this reads — they never go through a chat,
 *      and .mapillary-app is gitignored like the token:
 *
 *        printf 'CLIENT_ID\nCLIENT_SECRET\n' > .mapillary-app
 *
 * THEN:
 *   node --experimental-strip-types tools/mapillary-login.ts
 *
 * It prints a URL to open, waits for you to approve, and writes .mapillary-token. If your account already
 * shows a client token of the form MLY|<id>|<secret>, none of this is needed — write that to .mapillary-token
 * directly and the tools will use it.
 */
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const appFile = resolve(ROOT, '.mapillary-app')
if (!existsSync(appFile)) {
  console.error(`no ${appFile} — see the header of this file: register an application, then\n  printf 'CLIENT_ID\\nCLIENT_SECRET\\n' > .mapillary-app`)
  process.exit(1)
}
const [clientId, clientSecret] = readFileSync(appFile, 'utf8').trim().split('\n').map((l) => l.trim())
if (!clientId || !clientSecret) {
  console.error('.mapillary-app wants two lines: the client id, then the client secret')
  process.exit(1)
}

const PORT = 8234
const redirect = `http://localhost:${PORT}/callback`
const state = Math.random().toString(36).slice(2)
const authUrl = `https://www.mapillary.com/connect?client_id=${encodeURIComponent(clientId)}&response_type=code&scope=read&redirect_uri=${encodeURIComponent(redirect)}&state=${state}`

console.log(`\nOpen this in a browser and approve:\n\n  ${authUrl}\n\nwaiting for the redirect on ${redirect} …`)

const code: string = await new Promise((done, fail) => {
  const server = createServer((req, res) => {
    const u = new URL(req.url ?? '/', `http://localhost:${PORT}`)
    if (u.pathname !== '/callback') { res.writeHead(404).end(); return }
    const got = u.searchParams.get('code')
    const err = u.searchParams.get('error_description') ?? u.searchParams.get('error')
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(got ? 'Thank you — you can close this tab.' : `Mapillary said: ${err ?? 'no code'}`)
    server.close()
    if (u.searchParams.get('state') !== state) fail(new Error('the redirect came back with the wrong state'))
    else if (got) done(got)
    else fail(new Error(err ?? 'no code in the redirect'))
  })
  server.listen(PORT)
  setTimeout(() => { server.close(); fail(new Error('nothing came back within five minutes')) }, 300_000)
})

// the exchange: the application authenticates itself with its own id and secret, and hands back the code
const r = await fetch('https://graph.mapillary.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `OAuth MLY|${clientId}|${clientSecret}` },
  body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: redirect, client_id: clientId }),
})
const body = await r.text()
if (!r.ok) {
  console.error(`the token exchange failed (${r.status}): ${body.slice(0, 400)}`)
  process.exit(1)
}
const token = (JSON.parse(body) as { access_token?: string }).access_token
if (!token) {
  console.error(`no access_token in the reply: ${body.slice(0, 400)}`)
  process.exit(1)
}
writeFileSync(resolve(ROOT, '.mapillary-token'), token + '\n')
console.log('\nwrote .mapillary-token — try it with:\n  node --experimental-strip-types tools/photo.ts 37.786127 -122.398426')
