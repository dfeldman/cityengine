# Street Runner on Dandyhorse

What it takes to run Street Runner on the exercise platform (`~/dandyhorse`). It covers only the points where
the two meet; the game's own rules are in [README.md](README.md). The platform's contract is
`dandyhorse/docs/GAME_AUTHORING.md`.

**Status (2026-09-22): the adapter is built and unit-tested; it has not yet run end to end** against a live
server (that needs a logged-in console). `src/platform.ts` implements `Controls` on gamekit's `SessionClient`;
`main.ts` makes it when `?session=` is in the URL (or `?dandyhorse=bike|run` for an ad-hoc debug session) and
never loads the gamekit otherwise. `tests/platform.test.ts` covers the launch options, measured-not-requested,
the d-pad mapping, the tick bodies for both machines, the paused grade and the achievements. The checklist in §9
says what is left.

## 1. The shape of it

```
machine ─► bridge ─► server ─► getstate (1 Hz) ─► DandyhorseControls.measured()  = power / belt speed
game ─► setstate (1 Hz): grade request, x/y/z, score, requestedInput  ─► History, the machine
phone/console buttons ─► getstate.inputs ─► Controls.steering()       ◄── the important one
game ─► putsave: { cities: { <id>: { edgeId, s, travelled, visited } } }
```

- **Location:** `games/streetrunner`, a static Vite build with `base: '/games/streetrunner/'` and the dev proxy
  from `games/rollinghills/vite.config.ts`. Babylon is bundled from npm; the baked cities and the painted
  facade and road pages ship as static files, so it needs no internet at all.
- **The adapter:** one new file, `src/platform.ts`, implementing `Controls` (`src/controls.ts`) on top of
  gamekit's `SessionClient`. `main.ts` uses it when `?session=` is in the URL and keeps `LocalControls`
  otherwise. No other file changes.

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

A draft is in [platform/metadata.json](platform/metadata.json).

- **Variants:** a bike variant and a treadmill variant, both writing grade.
- **Launch options:** `city`, and `traffic` for how alive the streets are — which will be the setting that
  meaningfully costs GPU once there are people and vehicles in them.
- **Capabilities:** `input: true` is not optional here — it is the game. `saveState: true` for the position and
  the visited set. `seed: false`: a real city is the same every time on purpose.

## 8. Session image

`sessionImage()` uses Babylon's `Tools.CreateScreenshotAsync(engine, camera, 640×360, JPEG)` rather than
reading the canvas directly — `preserveDrawingBuffer` is WebGL-only and a raw `toDataURL` comes back blank under
WebGPU. It is taken 20 s in, every two minutes after, and again at the end; gamekit's `sessionImage` callback is
synchronous, so the latest one is kept ready.

## 9. Checklist

1. ✅ `src/platform.ts`: `Platform implements Controls`, `steering()` off the d-pad prompt's answers, save state,
   achievements, pause card with the server's own message, the end of the workout.
2. ✅ `main.ts`: `?session=` (and `?dandyhorse=bike|run` ad hoc); city, options and resume point from startsession;
   the city menu and the Bike/Run switch hidden on the platform. An error card if startsession fails.
3. ✅ Base path: `vite.config.ts` builds with `base: './'`, which serves from `/games/streetrunner/` unchanged. Still
   to add when it moves into `dandyhorse/games/`: the dev proxy for `/gameapi` etc. (as in
   `games/nightracer/vite.config.ts`), so `npm run dev` can talk to a local server. Not added here yet: a
   config change restarts the running dev server.
4. ✅ `platform/metadata.json` and `platform/screenshot.jpg` (1280×720) are ready to copy into place.
5. ☐ Run it end to end: console → bridge (simulated bike, then simulated treadmill) → game → server, and check
   the d-pad, the grade/incline, a pause, a resume from save, the History image.
6. ☐ Confirm with the platform team that a **persistent d-pad prompt open for a whole session** is within what
   bridges expect, and that `inputs` is delivered reliably at the rate a steering rider generates it.
7. ☐ Confirm that a `complete` session part-way through a city is recorded as a success.
