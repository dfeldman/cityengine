# The second experiment round — design

Drafted 2026-09-23, to run once the outstanding work lands. **Not yet run.** The point of writing it before
running it is that the first round answered neither of its questions, for reasons that were design faults
rather than bad luck.

## The goal this now serves (owner, 2026-09-23)

> *"We want to get to the point that haiku can make a decent kit model on its own, to massively save cost for
> modeling the remaining 500 or so buildings (not every single one of those needs to be modeled, but most
> do)."*

That narrows the purpose. This is no longer an open enquiry into kits and models — it is a **go/no-go on
Haiku as the workhorse for ~459 pending core buildings**, at LADDER §3c treatment 2.

**Existing evidence, from the owner's review of ~240 renders** — the only rows where the model is actually
recorded:

| | n | failed review |
|---|---|---|
| **haiku + kit models** | **7** | **0** |
| opus models | 5 | 1 (InterContinental) |
| haiku refaces | 9 | 2 |

Seven of seven Haiku models passed, and an *Opus* model failed. So the question is no longer "can Haiku
model at all" — it is **"can Haiku be trusted unsupervised across hundreds of buildings"**, which is a
different and harder question. n=7 is small, the model is recorded for only 94 of 1002 rows, and those seven
may have been easy buildings.

### Bail-out is NOT the deciding risk — the owner has a backstop

I had this wrong. Owner, 2026-09-23:

> *"I'm not worried about bail-out, I'm still doing manual review, so if Haiku does an awful job it'll get
> culled by manual review."*

**Manual review is the safety net**, and it demonstrably works: it has already culled 24 buildings out of
~240 and sent them back up the ladder. A confidently wrong building is caught by a human looking at it beside
a photograph — which is exactly what the review page is for. So "Haiku has never bailed" is a curiosity here,
not a blocker.

**The deciding number is therefore the PASS RATE at review**, not bail correctness. The economics:

    expected cost per ACCEPTED building  =  (batch cost / pass rate)  +  (rework cost x failure rate)

Haiku in a batch is roughly **1/13** the weighted cost of Sonnet. So even a fairly poor pass rate wins: at
50% it is still ~6x cheaper per accepted building than Sonnet at 100%, before counting that Sonnet does not
pass 100% either — the owner's review failed 20 of 80 generators (25%), and one of five *Opus* models.

What would actually change the plan:

- **A pass rate low enough that review time, not tokens, becomes the cost.** A human scan is ~3–10 s a row;
  that is the scarce resource, not Haiku tokens. If Haiku needs more review passes than it saves in model
  cost, it fails — and that is a judgement about the owner's time, not about tokens.
- **Failures that review cannot see.** A wrong-but-plausible building is the one thing the backstop misses,
  and it is the failure mode of every bug found on 2026-09-23. Worth watching for specifically: is Haiku's
  output *wrong in obvious ways* (good — caught) or *plausible and wrong* (bad)?

So still seed the sample with a building whose frames are junk — but score it as **information about the
failure mode**, not as a gate.

### Revised arms

Drop the third arm. E13 (old kit, old brief) answered "is the new kit better", which matters less than the
cost question and is now confounded anyway by the protocol change to self-rendering.

| arm | model | what it decides |
|---|---|---|
| **E11** | Sonnet | the reference: what "good" looks like on this sample, at this cost |
| **E12** | **Haiku** | **the decision**: is treatment 2 safe to run across ~459 buildings |

Same ten buildings, same brief, same self-rendering protocol, batch of 10.

**Seed the sample with two or three buildings whose frames are junk or absent.** Buildings 9 and 10
(Sentinel/Columbus Tower, Pacific Union Club) had no photographs when the sample was chosen; if the backfill
has since covered them, substitute others deliberately. **If E12 models a building it cannot see, that is the
answer regardless of how the geometry looks**, and it is cheaper to learn here than across 459.

### Blocked on

The kit is being changed under it — neoclassical slots (`giant-order` and others) and the signage rework are
both in flight, and both touch what is under test. **Running mid-change would confound the result.** Wait for
both, then run.

## The two questions

1. **Is the new kit better than the old one?**
2. **Is Haiku a capable modelling agent?**

Neither is answered today. E1–E9 and E10 differ in *two* ways — the kit gained `facade()`, and the brief
gained triage — so E10 being better says nothing about which change did it. And E5/E6 tested Haiku on a
single building under a brief that forbade the right answer for that building.

## Why the first round could not answer them

Three defects, all now fixed, all of which would have spoiled a rerun:

- **`arcade()` drew no arches** (#96) and **`classicalColumn` discarded its order** (#97). Three of E9's
  arcade calls were *correct readings* ruined by a broken part. Models were scored for the kit's failures.
- **The brief had no third path.** Bail was permitted only for missing *information*, never missing *tools*,
  so a model facing a temple front could only bail or box. Both were legal; neither was right.
- **The buildings were mostly kit-shaped.** Seven of the ten were flat-walled masonry, so the sample barely
  exercised the thing in question.

## The design

**Three arms, one building set, ten buildings.** Changing one variable at a time is the whole point.

| arm | model | brief | what it isolates |
|---|---|---|---|
| **E11** | Sonnet | `MODEL-A-BATCH-SLOTS.md` (new kit + triage) | the reference arm |
| **E12** | Haiku | `MODEL-A-BATCH-SLOTS.md` | **model** — E12 vs E11 answers question 2 |
| **E13** | Sonnet | `MODEL-A-BATCH-DOC.md` (old kit, old brief) | **kit + brief** — E13 vs E11 answers question 1 |

E13 is the arm it would be tempting to skip, and it is the only thing that makes question 1 answerable. It
must run on the *same* buildings as E11, at the same time, with the fixed parts — otherwise it is just E9
again with a different sample.

**Batch size 10 throughout.** Batching is the dominant cost lever (82k tokens per building at batch 1, 7.1k
at batch 20) but it is not under test here; holding it constant keeps the arms comparable.

## The buildings

**Previously unmodelled, and chosen before the arms are written** — ten from
`docs/review/san-francisco-uncovered.txt` (485 core buildings with only the classifier) and the 34 tall
buildings added to the queue on 2026-09-23 (BUGS.md #105).

Two selection rules:

- **Only buildings with usable photographs.** The backfill is running; pick from what it lands, or the test
  measures photograph luck. Check the frames by eye first — about a third of Mapillary frames are junk, and
  a junk reference makes a correct model look wrong.
- **Deliberately mixed shapes.** Target roughly 6 kit-shaped, 3 that `ring-forms` flags (`arc`/`stair`/`saw`)
  and 1 whose defining feature is a temple front or a vault. The first round's sample was 7/10 kit-shaped
  and therefore silent on triage. **Do not tell the models which is which** — choosing the path is what is
  being tested.

## The chosen ten — selected 2026-09-23, before any arm was written

From `docs/review/san-francisco-uncovered.txt` (the 485 core buildings with no model, LADDER §3a). **124 of
those 485 have two or more photographs on disk**; shape scores are from
`tools/ring-forms.ts --box=37.780,-122.412,37.800,-122.390`.

**Excluded on principle:** every way in `BUILDINGS-20.md`. Several appear in the uncovered list — `944039725`
(300 Montgomery) and `243794014` (550 California) among them — because the experiment manifests live in
`docs/sf-batches/exp/` and not in `public/landmarks/`, so the audit rightly calls them unmodelled. They are
contaminated by nine previous runs and must not be reused.

| # | way | height | shape | photos | why it is in the sample |
|---|---|---|---|---|---|
| 1 | `149840694` | 103 m | plain | 3 | the tallest unmodelled thing in the core |
| 2 | `260298022` | 98 m | plain | 3 | tall on a small 271 m² plot — a slender tower |
| 3 | `32965865` | 72 m | plain, `classical` | 3 | already refaced classical: does a model agree? |
| 4 | `563104192` | 68 m | plain | 2 | 3131 m² slab, the ordinary case |
| 5 | `1258806534` | 68 m | plain, `towerblock` | 2 | ordinary; control for the refaced style |
| 6 | `197354891` | 64 m | plain, `chicago` | 2 | small-plan tower, refaced chicago |
| 7 | `260320985` | 54 m | **arc 15 m** | 2 | Sailors' Union of the Pacific — curved plan |
| 8 | `151316281` | 52 m | **arc 13 m** | 2 | The Huntington Hotel — curved plan |
| 9 | `288485994` | 29 m | **arc 9 m** | **0** | **Sentinel Building** — the flatiron with the copper-green cupola. No frames yet; the backfill may land some, and if it does not this is a legitimate **bail** and tests that too |
| 10 | `32947069` | 18 m | **arc 17 m** | **0** | **Pacific Union Club** — 52 × 53 m brownstone mansion. Same photograph caveat |

Six plain, four flagged. **The models are not told which is which** — choosing the path is what is under test.

Two honest notes on the selection:

- **Only 124 of 485 uncovered buildings have photographs**, so the sample is drawn from a quarter of the
  population and skews toward well-photographed streets. Say so in the write-up.
- **#9 and #10 have no frames yet.** That is deliberate: the backfill is still running and may cover them,
  and if it does not, a correct `bail` is the right answer and worth measuring — especially for Haiku, which
  has never bailed out in any run.

## The protocol changes: models MUST render and look at their own work

Owner, 2026-09-23, on E10:

> *"I'm not really happy with the results from E10. It kept doing colonnades instead of arcades. I think this
> is because the experiment infra never lets the model see its own render, so it never understands that it is
> potentially making things worse."*

**The no-screenshot rule, in force since E1, was wrong** — it conflated two different things:

- **Self-ASSESSMENT as evidence** — a model reporting "this looks good". Unreliable, and it stays banned: a
  run's quality is judged centrally, from renders, by a human, never from the agent's own account.
- **Self-INSPECTION as feedback** — a model rendering its building, seeing that the ground floor reads as a
  row of posts rather than a row of arches, and changing it. **Necessary, and it was removed by accident.**

Evidence it matters: E10's agent wrote `colonnade` for three ground floors that are arcades. A colonnade is
free-standing columns; an arcade is openings pierced through a wall. On the page they are one word apart;
in a render they are unmistakable. Nothing in the loop ever showed it the difference. The same blindness
explains why six of ten builders came in under the brief's 1,000-triangle floor without anyone noticing.

**So arms E11–E13 render and iterate.** Each agent shoots its own buildings, looks, and fixes what reads
wrong, as many times as it likes. What does not change:

- **Judging stays central.** The agent's opinion of its own work is not recorded and not reported.
- **The triage line is still written BEFORE any code** — `kit | custom | bail`, reason naming a form feature.
  Seeing a render must not become a way to reverse-engineer a path choice after the fact.
- **Cost is still measured**, and now includes the render iterations. If self-inspection doubles the token
  cost it has to earn that, and the comparison against E1–E10 must say so rather than quietly absorbing it.

### A prerequisite, and it is not optional

**`tools/exp-shots.ts` renders every builder on a RECTANGLE.** Its `FIT` table (lines 22–41) carries
hardcoded `hx`/`hz` and passes `ring: []`, so the real plan has never reached a single experiment render —
including building 3, `256067734`, whose brief line reads *"17-corner plan"* and which I judged as "basically
a box". That judgement is withdrawn pending a correct render.

**A model that iterates against a rectangle corrects a building that was never wrong.** The fix (real rings
from the baked tiles, folded through `partOf`, in the model's frame) must land before any arm runs.

## Judging

**Centrally, from renders, by me — never from the agents' self-reports.** `tools/exp-shots.ts --exp=N`
renders a manifest onto real footprints. Agents do not screenshot; that has been the rule since E1 and it
stands.

Score each building on:

- **Path correctness** — was `kit | custom | bail` right, and did the stated reason name a real form feature?
  On a mixed sample this is the single most informative number, and it is the one E10 half-failed (one
  `custom` call, spent on a detail rather than the building's character).
- **Character captured** — is the one thing that makes the building recognisable present?
- **Nothing invented** — no confident detail the photographs do not show.
- **Cost** — tokens per building modelled, and tool calls.

Record **triangle counts**: E10 ignored the brief's 2,000–8,000 floor, with six of ten under 1,000, and that
correlated with the weaker tiles.

## What would make each answer credible

- **Question 2 (Haiku).** Haiku has never bailed out, in any run. If E12 bails correctly even once on a
  building E11 also bailed on, that is meaningful. If E12 models everything including buildings its
  photographs do not show, that is the answer regardless of how the geometry looks — a model that cannot
  decline is not safe at the downtown floor, whatever it costs.
- **Question 1 (the kit).** The comparison is E11 vs E13 on path correctness and character, at equal cost.
  Watch for the new kit producing *more* slot usage but not *better* buildings — that would be the API
  succeeding at being used and failing at being useful.

## Known confounds, stated

- **E11 vs E13 still varies two things** (kit and brief), because the slot brief necessarily documents the
  slot API. Separating them fully would need a slot brief with no triage section, which is a fourth arm and
  probably not worth the cost. **This must be stated in the write-up rather than quietly ignored.**
- **The sample is small.** Ten buildings, one judge. Differences smaller than "obviously better" should not
  be claimed.

---

## E12 result — Haiku, ten core buildings, 2026-09-23

**8 kit, 2 custom, 0 bail.** Ten builders, all on their real footprints (10, 6, 6, 7, 9, 8, 7, 12, 5 and 17
corners), 644–11,752 triangles. Renders: `docs/shots/exp/e12.png`.

### The owner's verdict

> *"5 of the 10 are basic kit rectangular buildings with no customization at all, that should have some. Not
> saying Sonnet would do a better job, but that's not super impressive."*

With three specific misses named, all of which the photographs show:

- **Stevenson Place** — has a gabled roof and a pediment; modelled as a flat-topped punched slab.
- **Argenta** — a complicated corner curve; modelled with square corners. The agent *saw* this and wrote
  `custom` in its path line, then "deferred" it and shipped the kit version anyway.
- **1200 Van Ness** — actually a small neoclassical building, and the site is a photograph trap (#125).

### Why this run does not measure Haiku fairly

Two process faults, both mine as much as the model's:

1. **The manifest schema was wrong.** It wrote `"way": 149840694` where the loader wants
   `"osm": ["way/..."]`. So `exp-shots` could not resolve a footprint and **every render it looked at was a
   fallback rectangle** — it self-inspected against a lie, which is exactly what fixing `exp-shots` was meant
   to prevent. The brief says "create a JSON array" and never shows the schema. **Fix the brief.**
2. **It barely rendered.** Two render invocations for ten buildings, and its own report reads *"renders
   confirmed initial approach was sound… no changes required"* — that is self-assessment, not
   self-inspection. The point of the protocol is iteration and none happened.

### What to change before re-running

- **Show the manifest schema in the brief**, with a worked example entry.
- **Require one render per building, before and after a change**, and ask what each render changed. A run
  that reports "no changes needed" on ten buildings has not used the loop.
- **"Deferred" is not an allowed outcome.** If the path line says `custom`, the building gets custom work or
  an explicit `bail` — shipping a kit version under a `custom` label is the worst case, because it looks
  considered.
- Consider naming the feature to look for per building (*"this one has a gabled roof"*) — but only as a test
  of whether the omission is attention or capability. That is a different experiment.

**Not yet answered:** whether Haiku can carry the ~459 core buildings. On the evidence it produces *legal,
plain* buildings reliably — better than the classifier's box, worse than the owner wants — and the loop that
was supposed to fix exactly that never ran.
