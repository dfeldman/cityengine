# Cemeteries

Every cemetery except the SF National Cemetery (`src/render/sf/cemetery.ts`) and Puteaux (landmark builder) is drawn by
`src/render/cemeteries.ts` from `public/landmarks/<region>-cemeteries.json`, written by

    node --experimental-strip-types tools/cemeteries.ts --city=paris-centre    # 31 cemeteries
    node --experimental-strip-types tools/cemeteries.ts --city=san-francisco   # Mission Dolores, Presidio pet cemetery

No bake needed. Style comes from a rule on the name (`STYLE_RULES` in the tool):

| style | where | look |
|---|---|---|
| paris-old | Père-Lachaise, Montmartre, Passy, Belleville, Charonne, Picpus, Saint-Vincent, Calvaire | chapels in runs, statues, obelisks, mossy limestone, overgrown corners |
| paris-classic | Montparnasse, Vaugirard, Grenelle, Auteuil, Bercy, La Villette | black/grey granite family slabs, chapel runs |
| paris-suburban | everything else in Paris | polished granite slabs on gravel, the odd chapel, a carré militaire |
| military-cross | Suresnes American cemetery | white Latin crosses in rows on lawn |
| military-tablet | (any other military) | the SF National Cemetery's rounded tablets |
| us-old | Mission Dolores | scattered weathered headstones, kerbs, an obelisk |
| pet | Presidio pet cemetery | tiny markers |

Each style is a set of MOODS; a PATCH-metre square takes one mood, so plots cluster ("chaotic in little patches").
Sizes and colours come from 20 Commons reference photos read by Haiku (2026-11-15), ±30%. Tunables at the top of the
renderer: NEAR/FAR, BUDGET_MS (layout slice per frame), CLEAR, EDGE, PLATE, and per style across/gap/path/jitter/patch.
