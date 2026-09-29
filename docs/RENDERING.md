# Rendering: one tool per job, and renders are DELIVERABLES

Owner, 2026-09-23: *"We should make agents always save renders where we can see them, also that they all use
the same render script for consistency."*

Two rules, and the reason for each is a failure that already happened today.

## 1. A render is a deliverable, not scratch

**If you rendered something to judge it, the render belongs in the repository.** Two agents on 2026-09-23
reported renders in detail — *"front, corner and top views all read correctly"*, *"no changes needed after
inspection"* — and **left nothing on disk**. Both had to be re-rendered centrally to check, and in one case
the description did not match what the tool produced.

A report about an image nobody can see is **self-assessment**, which is explicitly not evidence here
(BUGS.md #123). The image is the evidence. Without it the claim cannot be checked, and the agent's own
opinion is the only thing left — which is the loop the review process exists to break.

**Where they go:**

| what you rendered | directory |
|---|---|
| a manifest entry / a production landmark | `docs/shots/models/` |
| an experiment's builders | `docs/shots/exp/e<N>/` |
| a kit part or demo | `docs/shots/kit/` |
| a named city view | `docs/shots/views/<city>/` |
| a specific bug's before/after | `docs/shots/<bug-slug>/` |

**Never** `/tmp`, never a scratchpad, never "I looked and it was fine". If a render is worth making it is
worth keeping: the next agent to touch that building starts from it, and the owner scans them.

## 2. One tool per job — do not write a new one

There are **thirteen** shot scripts in `tools/` today (`shots`, `model-shots`, `entry-shots`, `exp-shots`,
`kit-shots`, `views`, `sft-shots`, `compare-shots`, `blade-shots`, `boat-shots`, `palm-shots`, `train-shots`,
`tree-shots`), several written because an existing one was broken rather than fixed. `entry-shots.ts` exists
solely because `model-shots.ts` is wrong for entries with a numeric `front` (BUGS.md #117) — **the bug is
still there and now two tools disagree.**

Use the one that matches the job:

- **`tools/model-shots.ts --entry="<name>"`** or `--model=<builder>` — a production landmark on its real
  footprint. **The canonical tool.** Beware #117 for numeric-`front` entries.
- **`tools/exp-shots.ts --exp=<N> [--only=<way id>]`** — experiment builders, on real footprints via
  `tools/footprint.ts`. Writes a per-building PNG and a contact sheet.
- **`tools/kit-shots.ts`** — the `kit_*` demos for the catalogue.
- **`tools/views.ts --city=<city> --group=<g>`** — named views of the city in context.

**If none fits, say so and ask.** Writing a fourteenth is how we got here. If an existing tool is broken,
**fix it and note the fix**, do not fork it.

### Fixes noted, 2026-09-23 — `model-shots.ts` learned to aim

Three changes, made rather than forked, by the Moscone South park run. The park is 185 m long and every
interesting thing in it is a change of LEVEL, which the four auto views — all framed on the bounding box from
outside — cannot show: from up there a flat plane and a terraced park look the same.

- **an explicit `--views` is now honoured with `--entry`.** It used to be silently discarded, so a landmark
  entry could only ever be photographed by the auto set. (The model is still rebuilt on its own footprint
  either way; that was inside the same branch.)
- **`--views=rider`** — a new set: four LOW cameras at about eye height, close, targeting the model's own
  ORIGIN, which is where a builder of a piece of landscape puts the thing the landscape is about. `bowl`,
  `wall`, `walk`, `along`.
- **`--view=<name>:<alpha>,<beta>,<radius>[,<tx>,<ty>,<tz>]`** — ONE camera, said outright, for the part
  that is neither the centre nor the bounding box: a ramp off a wall, a stair between two decks. This is
  what proved the Moscone ramp existed; it was invisible in all eight other views.

## 3. Practical notes

- **`?model=` loads no city** (`src/main.ts:26` branches before any city path), so it is cheap and safe to
  run while a city render is in flight. A full-city view is not: the machine holds one or two city instances,
  and four concurrent headless Chromiums exhausted memory and killed batches on 2026-09-23.
- **Open every render you take.** Five separate bugs today were invisible in code and obvious on screen —
  `arcade()` drawing no arches (#96), a pediment rotated 180° (#101), an aedicule gable drawn flat in the
  wall plane, dentils enclosed inside their own cornice, and a church portal cut behind a solid wall.
  **A triangle count proves nothing.**
- **A fixed camera can hide a correct feature.** `exp-shots` shoots one direction; a colonnade on the wrong
  edge is invisible even when the builder is right. Check more than one angle before concluding something is
  missing.
- **There is a pale ellipse in every `?model=` render** (BUGS.md #122, cause not yet found). It is not your
  building.

## 4. Concurrent runs make tests lie

2026-09-23: a kit run saw six landmark tests fail, re-ran them clean, and traced the failures to **two other
agents writing `sf/ybca.ts` and `sf/yerba-buena.ts` mid-run, with 26 vitest processes on the machine**.

With several agents in flight, a red test is **not** evidence your change broke something, and a typecheck
error in a file you never touched is expected. Before reporting a failure as yours:

1. **Is the failing file one you edited, or one another run owns?** Say whose it is.
2. **Could your change reach it at all?** The kit run showed it could not — its one new import
   (`parts.ts → buildings.ts`) was an edge that already existed. That argument is worth more than a re-run.
3. **Re-run the failing test alone**, after the other run settles.

Report pre-existing failures **by name and owner** rather than silently passing or silently blaming. The
converse also holds: a green run while another agent is mid-write proves less than usual.

## 5. A STALE BUILD MAKES A RENDER LIE — and an agent will believe it

2026-09-23. Kit batch 2 reported `arcade()` drawing *"a flat, opening-less wall"* and, reasonably, worked
around it: two buildings that ARE arcades in their photographs were deliberately given `shopfronts` and a
plain ground instead, with a note blaming BUGS.md #96.

**`arcade()` was working.** A later run re-rendered the whole arcade set from a clean build and found correct
round-headed openings with filled tympana and piers, from both entry points (`arcade()` directly, and
`facade()`'s `ground: 'arcade'` — which calls the same function; there is only one implementation). Tests
pass. The proof image `docs/shots/kit/kit_arcade_vs_colonnade.png` shows arcade and colonnade side by side
and plainly different.

The likely cause is a **stale Vite dep chunk** — a known failure mode in this project — or a dev server
started before the #96 fix landed.

### Why this matters more than one part

Everything in this document says *trust the render, not your opinion*. That is still right. But a render is
only evidence of **what the running build draws**, and a long session with several agents and a shared dev
server can leave that build behind the source.

**The cost here was real and silent**: two buildings were modelled wrong ON PURPOSE, against good
photographs, and the reason lived only in a batch report.

### What to do

- **Before concluding that a shared kit part is broken, restart the dev server or render from a fresh one.**
  A defect in `parts.ts` or `facade.ts` affects ~400 builders — if one were genuinely broken, far more than
  one batch would be failing.
- **Never silently substitute a slot to dodge a suspected kit bug.** Use the correct slot, say in the report
  that it may render wrong, and let the next run confirm. Batch 3's brief now instructs exactly this.
- **If a bug is marked FIXED and you appear to hit it, suspect your build first**, then reopen the bug with
  a render from a clean start.

### 5b. Three ways a render misleads — all three happened on 2026-09-23/24

| failure | what it looks like | the tell |
|---|---|---|
| **stale build** | a shared kit part appears broken | a defect in `parts.ts`/`facade.ts` would break ~400 builders, not one batch |
| **partial render, agent mid-run** | a building looks half-built or wrong | the file's mtime is minutes old and an agent is still working in it |
| **fixed camera** | a real feature is invisible | front elevations hide floating steps; corner views hide one-edge arcades |

The second is the newest and cost the most. The owner reviewed the Hyatt Regency while an agent was mid-run
and concluded it had *"hallucinated a nice fake building"*. **`git diff` showed one changed line** — a loop
bound, `j = 2` → `j = 4`, plus a comment. `HYATT_RING`, the slabs, the fifteen atrium treads, the service
tower and the Equinox were untouched. The agent said so plainly and was right; **I relayed the accusation
without checking the diff, and had to retract.**

**Rules:**

1. **`git diff` BEFORE accusing an agent of rewriting something.** It takes one command and it is dispositive.
   (Note: this environment reports "Is a git repository: false" for `~/streetrunner`. **That is wrong** —
   `git status` works. Do not conclude there is no revert available.)
2. **Do not judge a model while its agent is still running.** The renders on disk are whatever the last
   iteration produced, not the result.
3. When something looks wildly wrong, **the build, the camera and the timing are all likelier than a rogue
   agent** — check those three first.

## 6. ONE BAKE AT A TIME — and it is slow and silent

2026-09-24. Three agents independently started `tools/bake.ts san-francisco` within an hour. One overwrote
another's log file, three earlier runs appeared to "stall at the same stage", and an agent deferred its
renders to avoid a concurrent-memory failure. A full San Francisco bake:

- takes **many minutes**, and has **long silent stages** — the street-tree and area passes log nothing while
  they work over an 85 km² box, so a quiet log is NOT evidence of a hang;
- loads the tool code **once, at start**. A fix landing mid-bake does **not** appear in that run. The freeway
  fix on 2026-09-24 landed during a bake and needed another;
- competes for memory with headless Chromium, so **renders taken during a bake are unreliable** (§5) and a
  city view started alongside one risks exhausting memory (§3).

**A bake's log LAGS — Node block-buffers stdout when it is a file.** On 2026-09-24 a bake sat at 99% CPU
for 44 minutes with its log frozen on one line, and three earlier runs all appeared to "die" at the *same*
line. That is buffering, not a stall: output only reaches the file in chunks. **Judge a bake by its CPU
(`ps ax -o pcpu=,etime= | grep bake`), never by its log's last line.** If you need live progress, pipe it
through `stdbuf -oL` or write the log through `tee`.

**Rules:**
1. **Check for a running bake before starting one**: `ps ax | grep bake.ts`. If one is running, wait.
2. **Do not judge a bake stalled from a quiet log.** Compare the log's mtime against the process's elapsed
   time, and give the silent stages several minutes.
3. **Redirect stderr**, not just stdout — three runs "died silently" because only stdout was captured, and
   the real diagnosis was hidden.
4. **Say in your report whether your change needs a re-bake**, so the next one can batch several fixes.
   Five fixes rode one run today; a sixth missed it by minutes.
