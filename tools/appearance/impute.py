#!/usr/bin/env python3
"""
THE APPEARANCE MODEL (appearance research, 2026-10-23; owner: "the goal is not to have to run haiku on every single
building. That's the entire point of xgboost imputation"): every building's appearance answers, predicted from what the
map and the city's records say about it, trained on the street-photo labels.

What it is for decides how it is built and judged. A city that looks right at a glance needs each kind of place to get
the right MIX — the Mission's share of bay windows, Victorians and garages — not each house exactly right, which the
features cannot do for most answers (tools/appearance/learnability.py). So:

  - each answer is a classifier's PROBABILITIES (XGBoost, softprob, no class weighting, so the probabilities keep the
    real frequencies), and a building's answer is a DRAW from them, seeded by its id: the same every run, and in the
    right proportions across a street, where the likeliest answer every time would draw every Sunset house alike;
  - the answers are CHAINED: type first, then the details given the type (bays given type and Victorian style, a
    garage door's colour given that there is one…), each model fed its parents' answers — the photo's in training, the
    draw's in use — so the draws hang together; and a few rules settle what may not go together;
  - it is judged by LOG LOSS against two baselines, the overall frequencies and the frequencies within the district
    (a lookup table), on held-out folds; and by how far the held-out draws' mix sits from the truth's, by district.

Not modelled, from the records instead: storeys (the bake's levels — the photo matches them more often than the roll's
storeys, which leave out a garage storey); a special structure (an OSM auto shop or parking building on the footprint);
the sign (the name of an OSM shop on the building, when the draw gives it a shopfront).

Inputs: data/appearance/dataset/buildings.jsonl and labels/<run>.jsonl (training); the population,
tools/cache/appearance-population.jsonl (tools/appearance/sample.py --all, then assessor.py, context.py, city.py on it).
THE GATE (`public/appearance/gated.json`, `?looks=gated`): the draws were judged no better than the generics, building by
building — an unsure draw often swaps a plausible generic choice for a worse one. So a second table keeps only what the
model is sure of: down the chain by each answer's LIKELIEST value (a child fed its parents' likeliest), an answer is
written only where its confidence, CALIBRATED on held-out folds (how often an answer that sure was right), is at least
--gate and beats by --margin how often the district's commonest answer is right — a stand-in for the generics, which
draw by district and archetype — and a sub-answer (a bay's shape, a garage door's colour) only where its parent was. Everything else is left to the generics.

Output: public/appearance/imputed.json — the field list, each field's answers, and every building's answers as one
character per field (src/city/appearance.ts reads it behind `?looks=imputed`) — and a report on stdout.

Needs xgboost, scikit-learn, pandas and numpy (not the repo's: a venv). On macOS XGBoost wants an OpenMP library; the
one scikit-learn bundles serves: DYLD_LIBRARY_PATH=<venv>/lib/python3.*/site-packages/sklearn/.dylibs.

    python -I tools/appearance/impute.py --run h55-v11-a
"""
import argparse
import collections
import hashlib
import json
import math
import os

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import StratifiedKFold

ap = argparse.ArgumentParser()
ap.add_argument('--run', default='h55-v11-a')
ap.add_argument('--population', default='tools/cache/appearance-population.jsonl')
ap.add_argument('--out', default='public/appearance/imputed.json')
ap.add_argument('--folds', type=int, default=5)
# the gated table: only answers the model is sure of, the generics' elsewhere (owner, 2026-10-23: the draws looked no
# better than the generics) — an answer passes where its calibrated accuracy is at least --gate and beats the district
# lookup's by --margin
ap.add_argument('--out-gated', default='public/appearance/gated.json')
ap.add_argument('--gate', type=float, default=0.75)
ap.add_argument('--margin', type=float, default=0.0)
args = ap.parse_args()

D = 'data/appearance/dataset'
MENUS = json.load(open('data/appearance/research/menus-v11.json'))['attributes']

# ---- the chain: each field, and the answers it is fed (its parents), in the order they are drawn
CHAIN = [
    ('type', []),
    ('homes_above', ['type']),
    ('victorian_kind', ['type']),
    ('shopfronts', ['type', 'homes_above']),
    ('shop_glass', ['shopfronts']),
    ('sign_band', ['shopfronts']),
    ('awnings', ['shopfronts']),
    ('awning_colour', ['awnings']),
    ('service_bays', ['type', 'shopfronts']),
    ('garage_doors', ['type', 'shopfronts']),
    ('garage_door_style', ['garage_doors']),
    ('garage_door_colour', ['garage_doors']),
    ('entrance', ['type', 'garage_doors']),
    ('entrance_arch', ['type']),
    ('bays', ['type', 'victorian_kind']),
    ('bay_shape', ['bays', 'victorian_kind']),
    ('bay_colour', ['bays']),
    ('balconies', ['type']),
    ('fire_escape', ['type']),
    ('ornament', ['type', 'victorian_kind']),
    ('top', ['type', 'victorian_kind']),
    ('roof', ['type', 'top']),
    ('dormers', ['roof']),
    ('windows', ['type']),
    ('surface', ['type']),
    ('colour_panels', ['type', 'surface']),
    ('wall_colour', ['type', 'surface']),
    ('trim_colour', ['wall_colour']),
    ('ground_colour', ['shopfronts', 'wall_colour']),
]
FIELDS = [f for f, _ in CHAIN]
NA = {'cannot_tell', None, ''}
MIN_CLASS = 5  # an answer seen fewer times than this is drawn from the rare answers' own frequencies


def feats(b):
    """the static features a model sees: the bake, the roll, the surroundings, the city's records (learnability.py)"""
    z = str(b.get('zoning') or '')
    f = {'year': b.get('year_built'), 'height': b.get('height_m'), 'levels': b.get('levels'), 'roll_stories': b.get('roll_stories'),
         'units': b.get('roll_units'), 'area': b.get('roll_area_sqft'), 'footprint': b.get('footprint_m2'), 'narrow': b.get('narrow_m'),
         'long': b.get('long_m'), 'frontage_ft': b.get('roll_frontage_ft'), 'lat': b.get('lat'), 'lon': b.get('lon'),
         'use': b.get('roll_use'), 'constr': b.get('roll_construction'), 'arch': b.get('archetype'),
         'district': b.get('district'), 'zone': z.split('-')[0].split('(')[0] or None, 'street': b.get('geo_street_kind')}
    for k in ('geo_party_share', 'geo_touching', 'geo_setback_m', 'geo_frontage_m', 'geo_streets_fronted', 'geo_street_grade_med',
              'geo_ground_m', 'nb_count', 'nb_height_ratio', 'nb_main_street_m', 'nb_same_archetype', 'tree_count', 'poi_on',
              'poi_on_food', 'poi_on_retail', 'poi_on_service', 'poi_on_auto', 'poi_on_civic', 'poi_on_office', 'poi_50', 'poi_150',
              'biz_count', 'biz_retail', 'biz_food_lodging', 'biz_services', 'permit_count', 'permit_storefront', 'permit_sign',
              'permit_awning', 'permit_garage', 'permit_fire_escape', 'permit_restaurant', 'permit_bay_window', 'permit_siding',
              'permit_stucco', 'permit_seismic'):
        f[k] = b.get(k)
    f['hist'] = {'A': 2, 'B': 1, 'C': 0}.get(b.get('hist_ceqa'))
    f['in_district'] = 1 if b.get('hist_district') else 0
    f['soft'] = 1 if b.get('soft_story') else 0
    return f


CATS = ['use', 'constr', 'arch', 'district', 'zone', 'street']


def frame(rows, cats=None):
    X = pd.DataFrame([feats(b) for b in rows])
    for k in X.columns:
        if k in CATS:
            X[k] = pd.Categorical(X[k].map(lambda v: None if v is None else str(v)), categories=cats[k] if cats else None)
        else:
            X[k] = pd.to_numeric(X[k], errors='coerce')
    return X


# ---- training data: the run's usable labels, joined to the sample's features
B = {json.loads(l)['osm']: json.loads(l) for l in open(f'{D}/buildings.jsonl')}
labels = [json.loads(l) for l in open(f'{D}/labels/{args.run}.jsonl')]
labels = [r for r in labels if r.get('target') in ('one', 'best_fit') and r.get('target_hidden') != 'mostly' and r['osm'] in B]
X = frame([B[r['osm']] for r in labels])
cats = {k: list(X[k].cat.categories) for k in CATS}
print(f'{len(labels)} labelled buildings, {X.shape[1]} features')


class Field:
    """one answer's model: the classes it can draw, and how rare answers are folded in and drawn back out"""

    def __init__(self, name, parents):
        self.name, self.parents = name, parents
        menu = MENUS[name]['values']
        self.menu = [v for v in menu if v not in NA]
        ys = [str(r.get(name)) for r in labels]
        seen = collections.Counter(y for y in ys if y not in NA and y in self.menu)
        self.common = sorted(v for v, n in seen.items() if n >= MIN_CLASS)
        self.rare = {v: n for v, n in seen.items() if n < MIN_CLASS}
        self.classes = self.common + (['_rare'] if self.rare else [])
        self.y = np.array([self.classes.index(y if y in self.common else '_rare') if (y in self.common or y in self.rare) else -1 for y in ys])
        self.model = None

    def parent_frame(self, answers):
        """the parents' answers as categorical columns, with the menu's values as the categories"""
        cols = {}
        for p in self.parents:
            cols[f'p_{p}'] = pd.Categorical([a.get(p) if a.get(p) not in NA else None for a in answers], categories=[v for v in MENUS[p]['values'] if v not in NA])
        return pd.DataFrame(cols)

    def design(self, Xs, answers):
        return pd.concat([Xs.reset_index(drop=True), self.parent_frame(answers)], axis=1)

    def fit(self, Xd, y):
        if len(self.classes) < 2:
            return None
        params = dict(objective='multi:softprob', num_class=len(self.classes), max_depth=3, learning_rate=0.05, n_estimators=120,
                      min_child_weight=6, subsample=0.8, colsample_bytree=0.7, reg_lambda=5.0, gamma=0.5, tree_method='hist',
                      enable_categorical=True, max_cat_to_onehot=8, verbosity=0)
        m = xgb.XGBClassifier(**params)
        # (every class must appear in a fold's training rows for a fixed num_class: XGBoost wants labels 0..k-1)
        present = sorted(set(y))
        remap = {c: i for i, c in enumerate(present)}
        m.set_params(num_class=len(present)) if len(present) > 2 else m.set_params(objective='binary:logistic', num_class=None)
        if len(present) < 2:
            return ('const', present[0])
        m.fit(Xd, np.array([remap[c] for c in y]))
        return ('model', m, present)

    @staticmethod
    def proba(fitted, Xd, k):
        out = np.zeros((len(Xd), k))
        if fitted is None:
            return out + 1.0 / k
        if fitted[0] == 'const':
            out[:, fitted[1]] = 1
            return out
        _, m, present = fitted
        p = m.predict_proba(Xd)
        if p.ndim == 1 or p.shape[1] == 1:
            p = np.column_stack([1 - p.ravel(), p.ravel()])
        for j, c in enumerate(present):
            out[:, c] = p[:, j]
        return out

    def draw(self, p, u, ru):
        """an answer from the probabilities `p` with the uniform `u`; `_rare` becomes one of the rare answers by `ru`"""
        c = self.classes[min(int(np.searchsorted(np.cumsum(p), u * p.sum())), len(self.classes) - 1)]
        if c != '_rare':
            return c
        vs, ns = zip(*sorted(self.rare.items()))
        return vs[min(int(np.searchsorted(np.cumsum(ns), ru * sum(ns))), len(vs) - 1)]


fields = [Field(n, ps) for n, ps in CHAIN]
truth = [{f: r.get(f) for f in FIELDS} for r in labels]


def rules(a, b):
    """what may not go together, whatever the draws said"""
    if a.get('bays') == 'none':
        a['bay_shape'] = 'none'
        a['bay_colour'] = 'none'
    if a.get('shopfronts') == 'none':
        a['shop_glass'] = 'little'
        if a.get('sign_band') == 'fascia':
            a['sign_band'] = 'none'
    if a.get('awnings') == 'none':
        a['awning_colour'] = 'none'
    if a.get('garage_doors') == 'none':
        a['garage_door_style'] = 'none'
        a['garage_door_colour'] = 'none'
    if a.get('roof') == 'flat':
        a['dormers'] = 'no'
    # a Victorian front on a building put up after the Victorians were done (the roll dates it): drawn plain
    y = b.get('year_built')
    if a.get('victorian_kind') not in (None, 'none', 'cannot_tell') and y and y > 1925:
        a['victorian_kind'] = 'none'
    return a


def uniform(osm, field, salt=''):
    h = hashlib.sha256(f'{osm}|{field}|{salt}'.encode()).digest()
    return int.from_bytes(h[:8], 'big') / 2 ** 64


# ---- held-out evaluation: train on four fifths, predict the fifth — once with the photo's own parent answers (how good is
#      each model), once down the chain with drawn parents (as the population will be drawn)
print('\nHELD OUT (5-fold): log loss — overall frequencies / district lookup / model given the photo\'s parents / blended')
district = np.array([str(B[r['osm']].get('district')) for r in labels])
kf = StratifiedKFold(args.folds, shuffle=True, random_state=0)
strat = np.array([str(r.get('type')) for r in labels])
strat = np.where(np.isin(strat, [k for k, v in collections.Counter(strat).items() if v < args.folds]), '_', strat)
splits = list(kf.split(X, strat))
oof = {}  # field -> (teacher-forced model probabilities, overall-frequency probabilities, district probabilities), out of fold
for fld in fields:
    k = len(fld.classes)
    if k == 0:
        continue
    PM, PB, PD = np.zeros((len(labels), k)), np.zeros((len(labels), k)), np.zeros((len(labels), k))
    for tr, te in splits:
        ok = tr[fld.y[tr] >= 0]
        fitted = fld.fit(fld.design(X.iloc[ok], [truth[i] for i in ok]), fld.y[ok]) if k > 1 else None
        PM[te] = Field.proba(fitted, fld.design(X.iloc[te], [truth[i] for i in te]), k) if k > 1 else 1
        base = np.bincount(fld.y[ok], minlength=k) + 0.5
        base = base / base.sum()
        PB[te] = base
        for i in te:
            dc = np.bincount(fld.y[ok[district[ok] == district[i]]], minlength=k) + 2 * base
            PD[i] = dc / dc.sum()
    oof[fld.name] = (PM, PB, PD)

# the blend: each field's model probabilities mixed with the overall frequencies, by the weight that scores best held out —
# small data makes the trees too sure, and a draw from too-sure probabilities loses the variety it is for
ll = lambda P, y: float(-np.mean(np.log(np.maximum(P[np.arange(len(y)), y], 1e-6))))
for fld in fields:
    if fld.name not in oof:
        continue
    PM, PB, PD = oof[fld.name]
    m = fld.y >= 0
    y = fld.y[m]
    fld.alpha = min((a / 20 for a in range(21)), key=lambda a: ll(a * PM[m] + (1 - a) * PB[m], y))
    fld.base = np.bincount(y, minlength=len(fld.classes)) + 0.5
    fld.base = fld.base / fld.base.sum()

# down the chain, held out, with the blend: the draws a fold's buildings would get (`held`), and — over REPS draws of
# the parents — each answer's probability averaged, the chain's own per-building forecast (`chainP`), scored below
REPS = 12
held = [dict() for _ in labels]
chainP = {f.name: np.zeros((len(labels), len(f.classes))) for f in fields if len(f.classes)}
for tr, te in splits:
    fits = {}
    for fld in fields:
        k = len(fld.classes)
        if k > 1:
            ok = tr[fld.y[tr] >= 0]
            fits[fld.name] = fld.fit(fld.design(X.iloc[ok], [truth[i] for i in ok]), fld.y[ok])
    for rep in range(REPS):
        drawn = [dict() for _ in te]
        for fld in fields:
            k = len(fld.classes)
            if k == 0:
                continue
            P = Field.proba(fits[fld.name], fld.design(X.iloc[te], drawn), k) if k > 1 else np.ones((len(te), 1))
            P = fld.alpha * P + (1 - fld.alpha) * fld.base
            chainP[fld.name][te] += P / REPS
            salt = '' if rep == 0 else str(rep)
            for j, i in enumerate(te):
                drawn[j][fld.name] = fld.draw(P[j], uniform(labels[i]['osm'], fld.name, salt), uniform(labels[i]['osm'], fld.name, 'rare' + salt))
        if rep == 0:
            for j, i in enumerate(te):
                held[i] = rules(dict(drawn[j]), B[labels[i]['osm']])


def tv(a, b):
    ca, cb = collections.Counter(a), collections.Counter(b)
    na, nb = sum(ca.values()) or 1, sum(cb.values()) or 1
    return 0.5 * sum(abs(ca[k] / na - cb[k] / nb) for k in set(ca) | set(cb))


print(f'{"field":18} {"n":>4} {"freq":>6} {"distr":>6} {"model":>6} {"blend":>6} {"a":>4} {"CHAIN":>6}   mix TV by district: chain / district lookup')
rng = np.random.default_rng(0)
report = {}
for fld in fields:
    if fld.name not in oof:
        continue
    PM, PB, PD = oof[fld.name]
    m = fld.y >= 0
    y = fld.y[m]
    r = {'n': int(m.sum()), 'loss_freq': ll(PB[m], y), 'loss_district': ll(PD[m], y), 'loss_model': ll(PM[m], y),
         'loss_blend': ll(fld.alpha * PM[m] + (1 - fld.alpha) * PB[m], y), 'alpha': fld.alpha,
         'loss_chain': ll(chainP[fld.name][m], y)}
    # the mix: within each district with 15+ labels, the total variation between the held-out draws and the truth, against
    # draws from the district's own frequencies (the lookup table a model has to beat)
    tvs, tvd = [], []
    for d in set(district):
        idx = [i for i in range(len(labels)) if district[i] == d and fld.y[i] >= 0]
        if len(idx) < 15:
            continue
        t = [truth[i][fld.name] for i in idx]
        tvs.append(tv([held[i][fld.name] for i in idx], t))
        tvd.append(tv([fld.draw(PD[i], rng.random(), rng.random()) for i in idx], t))
    r['mix_tv_chain'] = float(np.mean(tvs)) if tvs else None
    r['mix_tv_district'] = float(np.mean(tvd)) if tvd else None
    report[fld.name] = r
    print(f'{fld.name:18} {r["n"]:4} {r["loss_freq"]:6.3f} {r["loss_district"]:6.3f} {r["loss_model"]:6.3f} {r["loss_blend"]:6.3f} {fld.alpha:4.2f} {r["loss_chain"]:6.3f}   '
          + (f'{r["mix_tv_chain"]:.2f} / {r["mix_tv_district"]:.2f}' if tvs else ''))

# ---- the population: every eligible building, drawn down the chain
if not os.path.exists(args.population):
    raise SystemExit(f'no population at {args.population}: tools/appearance/sample.py --all, then assessor/context/city on it')
pop = [json.loads(l) for l in open(args.population)]
XP = frame(pop, cats)
answers = [dict() for _ in pop]
for fld in fields:
    k = len(fld.classes)
    if k == 0:
        continue
    ok = np.where(fld.y >= 0)[0]
    fitted = fld.full = fld.fit(fld.design(X.iloc[ok], [truth[i] for i in ok]), fld.y[ok]) if k > 1 else None
    for s in range(0, len(pop), 20000):
        P = Field.proba(fitted, fld.design(XP.iloc[s:s + 20000], answers[s:s + 20000]), k) if k > 1 else np.ones((min(20000, len(pop) - s), 1))
        P = fld.alpha * P + (1 - fld.alpha) * fld.base
        for j in range(P.shape[0]):
            i = s + j
            answers[i][fld.name] = fld.draw(P[j], uniform(pop[i]['osm'], fld.name), uniform(pop[i]['osm'], fld.name, 'rare'))
    print(f'  drew {fld.name}', flush=True)

CODES = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
out_fields = FIELDS + ['storeys', 'special_structure', 'unusual_kind']
values = [[v for v in MENUS[f]['values'] if v not in NA] for f in out_fields]
rows, signs = {}, {}
for b, a in zip(pop, answers):
    a = rules(a, b)
    lv = b.get('levels')
    a['storeys'] = ('8+' if lv >= 8 else str(int(lv))) if lv else None
    tags = set(b.get('poi_on_tags') or [])
    a['special_structure'] = 'auto_repair_shop' if tags & {'car_repair', 'tyres'} else 'parking_garage' if b.get('osm_building') == 'parking' else 'none'
    a['unusual_kind'] = 'none'
    code = ''
    for f, vs in zip(out_fields, values):
        v = a.get(f)
        code += CODES[vs.index(v)] if v in vs else '.'
    rows[str(b['bake_id'])] = code
    if a.get('shopfronts') not in (None, 'none') and b.get('poi_on_first') and len(b['poi_on_first']) <= 40:
        signs[str(b['bake_id'])] = b['poi_on_first']
assert all(len(vs) <= len(CODES) for vs in values)
os.makedirs(os.path.dirname(args.out), exist_ok=True)
json.dump({'v': 1, 'run': args.run, 'trained_on': len(labels), 'fields': out_fields, 'values': values, 'rows': rows, 'signs': signs},
          open(args.out, 'w'), separators=(',', ':'))
# ---- THE GATE: likeliest answers down the chain, calibrated held out, written only where sure
def likeliest_pass(fits, Xs):
    """each field's likeliest answer (class index) and its probability, a child fed its parents' likeliest"""
    got = [dict() for _ in range(len(Xs))]
    out = {}
    for fld in fields:
        k = len(fld.classes)
        if k == 0:
            continue
        P = Field.proba(fits.get(fld.name), fld.design(Xs, got), k) if k > 1 else np.ones((len(Xs), 1))
        P = fld.alpha * P + (1 - fld.alpha) * fld.base
        c = P.argmax(1)
        out[fld.name] = (c, P.max(1))
        for j in range(len(Xs)):
            v = fld.classes[c[j]]
            got[j][fld.name] = max(fld.rare, key=fld.rare.get) if v == '_rare' else v
    return out, got


# held out: each field's likeliest, its probability, and whether it was right; and the district lookup's commonest
cal = {f.name: [] for f in fields if len(f.classes)}
for tr, te in splits:
    fits = {}
    for fld in fields:
        if len(fld.classes) > 1:
            ok = tr[fld.y[tr] >= 0]
            fits[fld.name] = fld.fit(fld.design(X.iloc[ok], [truth[i] for i in ok]), fld.y[ok])
    out, _ = likeliest_pass(fits, X.iloc[te].reset_index(drop=True))
    for fld in fields:
        if fld.name not in out:
            continue
        c, pm = out[fld.name]
        ok = tr[fld.y[tr] >= 0]
        for j, i in enumerate(te):
            if fld.y[i] < 0:
                continue
            dmask = ok[district[ok] == district[i]]
            dc = np.bincount(fld.y[dmask], minlength=len(fld.classes)) if len(dmask) else np.bincount(fld.y[ok], minlength=len(fld.classes))
            cal[fld.name].append((pm[j], c[j] == fld.y[i], dc.argmax() == fld.y[i], c[j]))


def threshold(rows):
    """the least confidence at which the answers at or above it are right at least --gate of the time (and beat the district
    lookup on the same buildings by --margin); None if no confidence does"""
    rows = sorted(rows, key=lambda r: -r[0])
    best = None
    hit = look = 0
    for n, r in enumerate(rows, 1):
        hit += r[1]
        look += r[2]
        if n >= 15 and hit / n >= args.gate and hit / n >= look / n + args.margin:
            best = r[0]
    return best


# a threshold per ANSWER, not per field: a confident "one shopfront" is calibrated on the shopfronts it predicted, apart from
# the confident "none"s that make up most of the field (and that the generics draw anyway)
gates = {}
print(f'\nTHE GATE (calibrated held out, per answer: written at confidence >= t, where such answers are right >= {args.gate:.0%})')
print(f'{"field":18} {"answer":22} {"t":>5} {"written":>8} {"right":>6} {"lookup":>7}')
for fld in fields:
    crow = cal.get(fld.name) or []
    gates[fld.name] = {}
    w_all = []
    for c in sorted({r[3] for r in crow}):
        rs = [r for r in crow if r[3] == c]
        t = threshold(rs)
        if t is None:
            continue
        gates[fld.name][c] = t
        w = [r for r in rs if r[0] >= t]
        w_all += w
        print(f'{fld.name:18} {fld.classes[c]:22} {t:5.2f} {len(w) / max(1, len(crow)):8.0%} {sum(r[1] for r in w) / len(w):6.0%} {sum(r[2] for r in w) / len(w):7.0%}')
    report.setdefault(fld.name, {})['gate'] = {'thresholds': {fld.classes[c]: t for c, t in gates[fld.name].items()},
                                               'written': len(w_all) / max(1, len(crow)),
                                               'right': sum(r[1] for r in w_all) / max(1, len(w_all)),
                                               'lookup': sum(r[2] for r in w_all) / max(1, len(w_all))}

# the population, gated. Only a true sub-answer waits on its parent (a bay's shape on there being bays, a garage door's
# colour on there being a garage…); the rest may be written over whatever the generics chose for the parent — a garage, or
# no bays, sits on any style
HARD = {'shop_glass': 'shopfronts', 'sign_band': 'shopfronts', 'awning_colour': 'awnings', 'garage_door_style': 'garage_doors',
        'garage_door_colour': 'garage_doors', 'bay_shape': 'bays', 'bay_colour': 'bays', 'dormers': 'roof'}
out, got = likeliest_pass({f.name: getattr(f, 'full', None) for f in fields}, XP)
grows, gsigns = {}, {}
written = collections.Counter()
for i, b in enumerate(pop):
    emitted = {}
    for fld in fields:
        if fld.name not in out:
            continue
        c = out[fld.name][0][i]
        t = gates[fld.name].get(c)
        if t is not None and out[fld.name][1][i] >= t and (fld.name not in HARD or HARD[fld.name] in emitted):
            emitted[fld.name] = got[i][fld.name]
    tags = set(b.get('poi_on_tags') or [])
    sp = 'auto_repair_shop' if tags & {'car_repair', 'tyres'} else 'parking_garage' if b.get('osm_building') == 'parking' else None
    if sp:
        emitted['special_structure'] = sp
    written.update(emitted.keys())
    if not emitted:
        continue
    code = ''.join(CODES[vs.index(emitted[f])] if emitted.get(f) in vs else '.' for f, vs in zip(out_fields, values))
    grows[str(b['bake_id'])] = code
    if emitted.get('shopfronts') not in (None, 'none') and b.get('poi_on_first') and len(b['poi_on_first']) <= 40:
        gsigns[str(b['bake_id'])] = b['poi_on_first']
json.dump({'v': 1, 'run': args.run, 'trained_on': len(labels), 'gate': args.gate, 'margin': args.margin, 'fields': out_fields,
           'values': values, 'rows': grows, 'signs': gsigns}, open(args.out_gated, 'w'), separators=(',', ':'))
print(f'\n{len(grows)} buildings with a written answer -> {args.out_gated} ({os.path.getsize(args.out_gated) / 1e6:.1f} MB), {len(gsigns)} signs')
print('answers written, share of buildings:', {f: f'{n / len(pop):.0%}' for f, n in written.most_common()})
json.dump(report, open('data/appearance/dataset/impute-report.json', 'w'), indent=1)
print(f'\n{len(rows)} buildings -> {args.out} ({os.path.getsize(args.out) / 1e6:.1f} MB), {len(signs)} signs')
for f in ('type', 'victorian_kind', 'shopfronts', 'garage_doors', 'bays', 'wall_colour'):
    print(f, collections.Counter(a.get(f) for a in answers).most_common(8))
