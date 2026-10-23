#!/usr/bin/env python3
"""
How well the static features predict each photo label (appearance research, 2026-10-23): five-fold cross-validated
gradient boosting (scikit-learn's histogram GBM, the same family as XGBoost), balanced accuracy, three seeds, for the
original 17 static features against those plus the context and city features (tools/appearance/context.py, city.py).
Needs scikit-learn and pandas, which the repo does not install: run it from a venv.

    python -I tools/appearance/learnability.py data/appearance/dataset
"""
import json, sys, collections as C, numpy as np, pandas as pd, warnings
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import balanced_accuracy_score
warnings.filterwarnings('ignore')
D = sys.argv[1]
B = {json.loads(l)['osm']: json.loads(l) for l in open(f'{D}/buildings.jsonl')}
L = [json.loads(l) for l in open(f'{D}/labels/h55-v11-a.jsonl')]
u = [r for r in L if r.get('target') in ('one', 'best_fit') and r.get('target_hidden') != 'mostly']
def feats(b, new):
    z = str(b.get('zoning') or '')
    f = {'year': b.get('year_built'), 'height': b.get('height_m'), 'levels': b.get('levels'), 'roll_stories': b.get('roll_stories'),
         'units': b.get('roll_units'), 'area': b.get('roll_area_sqft'), 'footprint': b.get('footprint_m2'), 'narrow': b.get('narrow_m'),
         'long': b.get('long_m'), 'frontage_ft': b.get('roll_frontage_ft'), 'lat': b.get('lat'), 'lon': b.get('lon'),
         'use': str(b.get('roll_use')), 'constr': str(b.get('roll_construction')), 'arch': str(b.get('archetype')),
         'district': str(b.get('district')), 'zone': z.split('-')[0].split('(')[0]}
    if new:
        f.update({k: b.get(k) for k in ('geo_party_share', 'geo_touching', 'geo_setback_m', 'geo_frontage_m', 'geo_streets_fronted',
                  'geo_street_grade_med', 'geo_ground_m', 'nb_count', 'nb_height_ratio', 'nb_main_street_m', 'nb_same_archetype',
                  'tree_count', 'poi_on', 'poi_on_food', 'poi_on_retail', 'poi_on_service', 'poi_on_auto', 'poi_on_civic',
                  'poi_on_office', 'poi_50', 'poi_150', 'biz_count', 'biz_retail', 'biz_food_lodging', 'biz_services',
                  'permit_count', 'permit_storefront', 'permit_sign', 'permit_awning', 'permit_garage', 'permit_fire_escape',
                  'permit_restaurant', 'permit_bay_window', 'permit_siding', 'permit_stucco', 'permit_seismic')})
        f['hist_A'] = {'A': 2, 'B': 1, 'C': 0}.get(b.get('hist_ceqa'))
        f['in_district'] = 1 if b.get('hist_district') else 0
        f['soft'] = 1 if b.get('soft_story') else 0
        f['street'] = str(b.get('geo_street_kind'))
    return f
def frame(new):
    X = pd.DataFrame([feats(B[r['osm']], new) for r in u])
    for k in X.columns:
        X[k] = X[k].astype('category') if X[k].dtype == object else pd.to_numeric(X[k], errors='coerce')
    return X
X0, X1 = frame(False), frame(True)
print(len(u), 'labels;', X0.shape[1], 'old features ->', X1.shape[1])
F = ['type', 'shopfronts', 'garage_doors', 'homes_above', 'bays', 'ornament', 'top', 'victorian_kind', 'surface', 'windows',
     'roof', 'fire_escape', 'entrance', 'awnings', 'sign_band', 'balconies', 'wall_colour']
m = lambda: HistGradientBoostingClassifier(categorical_features='from_dtype', max_iter=120, learning_rate=0.05, max_depth=3,
                                           min_samples_leaf=12, l2_regularization=2.0, class_weight='balanced', random_state=0)
print(f'{"field":15} {"chance":>6} {"old":>5} {"new":>5}')
for f in F + ['sign_text']:
    if f == 'sign_text':
        y = np.array(['yes' if r.get('sign_text') else 'no' for r in u])
    else:
        y = np.array([str(r.get(f)) for r in u])
    keep = y != 'cannot_tell'
    c = C.Counter(y[keep]); y = np.where(np.isin(y, [k for k, v in c.items() if v < 5]), '_rare', y); yf = y[keep]
    cv = StratifiedKFold(5, shuffle=True, random_state=0)
    def cvs(X):
        X = X[keep].reset_index(drop=True); out = []
        for seed in (0, 1, 2):
            p = np.empty(len(yf), dtype=object)
            for tr, te in StratifiedKFold(5, shuffle=True, random_state=seed).split(X, yf):
                cols = [c for c in X.columns if X.iloc[tr][c].nunique() > 1]
                p[te] = m().fit(X.iloc[tr][cols], yf[tr]).predict(X.iloc[te][cols])
            out.append(balanced_accuracy_score(yf, p.astype(str)))
        return np.mean(out)
    s = [cvs(X0), cvs(X1)]
    print(f'{f:15} {1 / len(set(yf)):6.0%} {s[0]:5.0%} {s[1]:5.0%}')
