# Street Runner on Dandyhorse

What it takes to run Street Runner on the exercise platform (`~/dandyhorse`). It covers only the points where
the two meet; the game's own rules are in [README.md](README.md). The platform's contract is
`dandyhorse/docs/GAME_AUTHORING.md`.

Nothing here is built yet. As with Trail Trainer it comes down to one new file — plus one genuinely new thing
the platform has not had to carry before, which is §3.

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
  "choices": ["left", "straight", "right", "back"],   // the d-pad's left, up, right and down
  "layout": "dpad",
  "persistent": true
}
```

- **Down is "turn round here"** (`back`, the ↩ button and the U key standalone), so a rider on a trainer can
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

`setstate` carries the street's grade in percent, smoothed and stepped, exactly as Trail Trainer does. Today
the baked package has **no elevation**, so the request is always 0 — the Marais is flat enough that this is
not a lie, but Brooklyn Heights and any hilly city will need terrain before the grade means anything. That is
the first thing to add after the prototype, and it is the same terrarium-tile path Trail Trainer already uses
(`trailtrainer/tools/terrarium.ts`).

Until then, declare the variants as driving grade anyway: the wire format is right and only the values change.

## 5. Save state: a position and a map of where you have been

Like Trail Trainer, what persists is **a position, not a score** — but a city adds a second thing, which is
*where you have already been*:

```json
{ "cities": { "paris-marais": {
    "edgeId": 4182, "s": 61.4, "travelled": 38420, "visited": [4182, 4183, 921] } } }
```

- **`requestedDuration` ends the session, not the city.** A session ends `complete` when the time is up,
  wherever the rider happens to be. That is a success.
- **`visited`** is the list of edge ids ridden. It is what makes "ride every street of the Marais" a real goal
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

`sessionImage()` should use Babylon's `Tools.CreateScreenshotAsync(engine, camera, size)` rather than reading
the canvas directly — `preserveDrawingBuffer` is WebGL-only and a raw `toDataURL` comes back blank under
WebGPU. A good frame is the street ahead with the turn arrows in it.

## 9. Checklist

1. `src/platform.ts`: `DandyhorseControls implements Controls`, including `steering()` off `getstate.inputs`.
2. `main.ts`: use it when `?session=` is present; take the city and the resume point from `startsession`.
3. `vite.config.ts`: `base: '/games/streetrunner/'`, the API proxy.
4. Copy `platform/metadata.json` into place and add a `screenshot.jpg`.
5. Confirm with the platform team that a **persistent d-pad prompt open for a whole session** is within what
   bridges expect, and that `inputs` is delivered reliably at the rate a steering rider generates it.
6. Confirm that a `complete` session part-way through a city is recorded as a success.
