# City Dash on Dandyhorse

What it takes to run City Dash (this repo's game) on the exercise platform (`~/dandyhorse`). It covers only the
points where the two meet; the game's own rules are in [README.md](README.md). The platform's contract is
`dandyhorse/docs/GAME_AUTHORING.md`.

**Status (2026-10-15): working end to end.** On a local Dandyhorse server with a simulated bike: the game is listed as
City Dash, launches from the bridge, 200 W moves the rider, the street's grade (−10.9 % to +10.3 %) reaches the
bridge to set the trainer's resistance, a d-pad turn is accepted and taken, 0 W brings the bike to rest, and History
gets its picture. Run against both the local dev server and https://dash.dfeldman.org (the script is described in §9).

## 1. The shape of it

**The game stays its own project, on its own site** (owner, 2026-10-14: "cityengine can remain entirely separate
from Dandyhorse, it just needs the thin API connection and a metadata.json file"). Dandyhorse holds three small files
in `games/citydash/` and nothing else of the game:

```
bridge page ─ iframe ─► dandyhorse /games/citydash/index.html  (the SHIM, Dandyhorse's origin)
                          └ iframe ─► https://dash.dfeldman.org/index.html?session=…&variant=…&host=<dandyhorse origin>
game ── postMessage {dh:'fetch', …} ──► shim ── fetch /gameapi/… (with the session cookie) ──► server
game ◄─ postMessage {dh:'reply', …} ─── shim
```

- **Why a shim, not a redirect:** gamekit talks to `/gameapi/*` with the session cookie, same-origin. A game on
  another origin has no cookie (and a third-party one is blocked anyway), so a redirect would need the server to
  grow CORS and token auth. Instead the shim, which IS on the server's origin, makes the calls: gamekit's transport
  is swapped (`setFetch`) for [src/relay.ts](src/relay.ts), which posts each request to the shim and resolves its
  reply. No server change.
- **Safety:** the shim answers only the City Dash origins it lists (dash.dfeldman.org, and localhost:5200 for a
  development copy), only for `/gameapi/`, only GET/POST/PUT; the game sends only to the origin in `?host=` (the
  browser drops it if the parent is anyone else) and takes replies only from its parent at that origin.
- **A development copy:** `?citydash=http://localhost:5200` on the shim's URL once (remembered in that browser;
  `?citydash=default` forgets).
- **The platform glue:** `src/platform.ts` implements `Controls` on gamekit's `SessionClient`; `main.ts` makes it
  when `?session=` is in the URL (or `?dandyhorse=bike` for an ad-hoc debug session on a local server) and never
  loads the gamekit otherwise. gamekit is not a dependency: the build bundles it from a dandyhorse checkout beside
  this one (`DANDYHORSE_DIR`, vite.config.ts); without one the standalone game still builds.

```
machine ─► bridge ─► server ─► getstate (1 Hz) ─► Platform.measured()  = power / belt speed
game ─► setstate (1 Hz): grade request, x/y/z, score, requestedInput  ─► History, the machine
phone/console buttons ─► getstate.inputs ─► Controls.steering()
game ─► putsave: { cities: { <id>: { at, travelled, visited } } }
```

## 2. Effort → movement

The game reads what the machine **measured**, never what it asked for. `Controls.measured()` returns
`{ power, speed, cadence, heartRate }`, each `null` when there is no reading — never a zero standing in for one.

- **Bike:** `power` in watts drives the force balance in `src/sim/ride.ts`. Zero watts is a legitimate reading:
  the bike coasts. Absolute watts, not gamekit's 0–100 `EffortMeter`.
- **Treadmill:** `speed` in m/s is the runner's speed, and nothing else. Auto-pause stays **on**: a stopped
  belt is a stopped runner.

Rider mass comes from `start.bodyData?.weight` when the platform has it, which changes the climb honestly.

## 3. Steering is the new thing

This is what the platform has not had to carry before, and it is worth being precise about.

Street Runner needs **a persistent left/right input for the whole session** — not a one-shot prompt at each
junction. There are 7 600 junctions in Le Marais and a prompt per junction would be both unusable and a flood
of traffic. So:

```jsonc
// in every setstate, for the whole session
"requestedInput": {
  "promptId": "steer",
  "prompt": "Turn",
  "choices": ["left", "up", "right", "down"],   // RemoteButton names; up = straight, down = turn round
  "layout": "dpad",
  "persistent": true
}
```

- **Down is "turn round here"** (`back` in the game, the ↩ button and the U key standalone; the HUD's ↩ goes out
  through `answerinput` on the platform, so it comes back the phone's way), so a rider on a trainer can
  get out of a wrong turn without a long press or a second control. **Up is straight**, which is the default
  anyway; its use is to cancel a turn already asked for, or to come back to the middle after a nudge.
- **A press means a turn only near a junction** (PLAN item H). With the next junction more than six seconds
  away, left and right NUDGE the rider 1.5 m across the carriageway instead, and the HUD says "← nudge"; within
  six seconds they are the turn request, as before.

- **Persistent, level-triggered.** It is sent in every `setstate` and never closed. The bridge draws a d-pad;
  every tap is delivered.
- **Read `getstate.inputs`, not `getstate.input`.** Taps arrive faster than the game polls — a rider correcting
  themselves presses twice in under a second — and `inputs` is the last 32 answers each with a rising `n`.
  `Controls.steering()` returns everything with `n` greater than the last one handled, oldest first, and
  `Navigator.request()` is called with each. Dropping one loses a turn the rider meant to take.
- **Straight needs no button.** It is the default, so a rider who never touches the d-pad rolls down the street
  they are on. This matters more than it sounds: a game where inattention means stopping at every corner
  cannot be played while out of breath.
- **The 1 Hz poll is why steering is a declared intention rather than a twitch.** A rider at 25 km/h covers
  seven metres between press and poll. The game commits the choice 1.6 seconds before the junction and the HUD
  shows whether it is still changeable — see `src/sim/navigate.ts`. **The platform should not try to make
  steering lower-latency on the game's behalf**; the design already assumes the latency and would be no better
  without it.

The console should show the same three arrows the game does, and `answerinput` from the game's own UI and from
a phone are treated identically.

## 4. The grade request

`setstate` carries the street's grade in percent, smoothed over two seconds, exactly as Trail Trainer does. The
cities are baked with terrain now, so it is real: Montmartre and Nob Hill are hills. A bike asks for `grade` and
sends its virtual `speed` (so the server integrates the distance); a treadmill asks for `incline`, never below
flat, and never sends `speed`. While paused both ease to 0, so a reconnecting machine starts still.

## 5. Save state: a position and a map of where you have been

Like Trail Trainer, what persists is **a position, not a score** — but a city adds a second thing, which is
*where you have already been*:

```json
{ "cities": { "paris-centre": {
    "at": { "lat": 48.857614, "lon": 2.362025 }, "travelled": 38420, "visited": [4182, 4183, 921] } } }
```

- **`at` is a lat/lon, not an edge id**: a rebaked city renumbers its ride edges (BUGS.md #44 did), and a
  position survives that. The game starts the next session there (`?at=`'s own path).

- **`requestedDuration` ends the session, not the city.** A session ends `complete` when the time is up,
  wherever the rider happens to be. That is a success.
- **`visited`** is the list of MAP edge ids ridden (stable across ride-graph rebakes). It is what makes "ride every street of the Marais" a real goal
  and an achievement, and what a future map screen would draw. It is a few thousand integers at most.
- Written every 5 s and on `pagehide`, so a closed tab is a paused ride rather than a lost one.

## 6. x/y/z and the console map

`x`, `y`, `z` are the rider's local metres straight out of `Navigator.at()`, which means the console's map
draws the actual shape of the streets ridden. This is the one game where that map is genuinely interesting,
because the route is the rider's own choices rather than a fixed loop.

## 7. metadata.json

`dandyhorse/games/citydash/metadata.json` (id `citydash`, which `src/platform.ts` `GAME_ID` matches).

- **Variants:** bike only, `controls.bike: grade`. Running is switched off in the game for now (README), so there is no
  treadmill variant until it is back.
- **Launch options:** `traffic`, `time`, `weather`. No `city`: San Francisco is the only city kept current.
- **Capabilities:** `input: true` is not optional here — it is the game. `saveState: true` for the position and
  the visited set. `seed: false`: a real city is the same every time on purpose.
- **Screenshot:** `games/citydash/screenshot.jpg`, in the asset bucket like every game's (index dandyhorse-games).

## 8. Session image

`sessionImage()` uses Babylon's `Tools.CreateScreenshotAsync(engine, camera, 640×360, JPEG)` rather than
reading the canvas directly — `preserveDrawingBuffer` is WebGL-only and a raw `toDataURL` comes back blank under
WebGPU. It is taken 20 s in, every two minutes after, and again at the end; gamekit's `sessionImage` callback is
synchronous, so the latest one is kept ready.

## 9. Checklist

1. ✅ `src/platform.ts`: `Platform implements Controls`, `steering()` off the d-pad prompt's answers, save state,
   achievements, pause card with the server's own message, the end of the workout.
2. ✅ `main.ts`: `?session=` (and `?dandyhorse=bike|run` ad hoc); options and resume point from startsession; with
   `?host=` the API through the shim (`src/relay.ts`).
3. ✅ Dandyhorse's `games/citydash/`: metadata.json, the shim (index.html), README, screenshot (asset bucket).
4. ✅ Run end to end (2026-10-15), local server, simulated bike, both against `localhost:5200` and the live site:
   log in (`POST /api/login {uid}` — the stub), `POST /api/sessions/launch {gameId:'citydash', variant:'bike',
   debug:true}`, be the bridge (`POST /bridgeapi/putstate` every 500 ms with a `sim:` fitness device and
   `actual.power`), open the shim as the bridge does, and read `GET /bridgeapi/getstate` — `requested.grade` is
   what the bridge sets the trainer to; `requestedInput` is the d-pad. End with `{status:'complete'}` and
   `GET /api/sessions/<id>/image` is the History picture (a discard sends none, by design).
5. ☐ A real trainer through a real bridge (Web Bluetooth): the owner's hardware.
6. ☐ Confirm with the platform team that a **persistent d-pad prompt open for a whole session** is within what
   bridges expect (it worked in the run above).
7. ☐ The welcome card and the page title say "Cycle Dash"; the platform lists "City Dash" (the owner's words,
   2026-10-14). One name, the owner's call.
