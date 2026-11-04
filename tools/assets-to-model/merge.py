"""
One list of everything in assets_to_model: the objects with a photo (top-level folders) and the candidates still
without one (needs-photo*.md rows), with what the game already draws for each:

  GLB          a real model: public/landmarks/paris-statues.json (`model`, or an assetkit `asset`)
  procedural   a hand-built landmark: an entry in public/landmarks/paris*.json whose `osm` claims the object, or
               one within NEAR_M whose name shares a word with it (fountains: paris-fountains.json pieces)
  stand-in     the generic street figure the bake puts on every OSM bust/statue/sculpture (tools/bake.ts
               parisStreetKind) — cheap, low quality
  owner        the owner said it is modelled procedurally (needs-photo mark)

  python3 -I tools/assets-to-model/merge.py assets_to_model "$(ls assets_to_model/_data/*.json | paste -sd, -)" assets_to_model/LIST.md
"""
import glob, json, math, os, re, sys, unicodedata

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
NEAR_M = 25
GLB_NEAR_M = 40
# where the landmarks that carry GLB statues stand (their manifests place them by OSM way, not lat/lon)
ATTACHED = {'Monument à la République': (48.8675, 2.3637), 'Colonne de Juillet': (48.8532, 2.3691),
            "Cirque d'Hiver": (48.8630, 2.3672)}
# a landmark that is a group of figures: anything standing inside its footprint is part of it
GROUP = re.compile(r'fontaine|fountain|monument|statue|bassin|place de la concorde', re.I)
# group landmarks placed by OSM way, so with no lat/lon in their manifest: (lat, lon, radius m)
PLACED = {'placeConcorde': (48.86561, 2.32121, 190, r'^(Lyon|Marseille|Bordeaux|Nantes|Rouen|Brest|Lille|Strasbourg)$|Fleuves|Mers')}
# builders whose figures (people, animals, the thumb) are primitive shapes: a stand-in a GLB should replace. The rest are
# abstract or geometric pieces the primitives can actually say (Calder's plates, Reitzel's lattice, a basin), and the
# Stravinsky fountain's sixteen works (owner, 2026-11-04: "look really good already"): those are done.
FIGURE_STANDINS = {'ajaccioBust', 'ajaccioGroup', 'ajaccioStele', 'boucicautMonument', 'fochTrocadero', 'louisXIV',
                   'triompheRepublique', 'statueLiberte', 'washingtonIena', 'monumentPasteur', 'lionDeBelfort', 'chapeauEve',
                   'fontaineSaintSulpice', 'medicisFountain', 'observatoireFountain', 'batignollesRocks',
                   'vosgesGarden', 'placeConcorde', 'fontaineChateauEau', 'lePouce', 'flammeLiberte', 'institutWings'}
STOP = {'statue', 'statues', 'buste', 'bust', 'monument', 'fontaine', 'fountain', 'paris', 'place', 'square', 'jardin',
        'saint', 'sainte', 'grand', 'grande', 'petit', 'petite', 'avec', 'dans', 'pour', 'memoire', 'the', 'and'}


def words(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    return {w for w in re.findall(r'[a-z]{4,}', s)} - STOP


def dist(a, b, c, d):
    return math.hypot((a - c) * 111320, (b - d) * 111320 * math.cos(math.radians(a)))


def landmarks():
    d = os.path.join(ROOT, 'public', 'landmarks')
    out = []
    for f in [os.path.join(d, 'paris.json')] + sorted(glob.glob(os.path.join(d, 'paris', '*.json'))):
        data = json.load(open(f))
        for e in data if isinstance(data, list) else data.get('landmarks', []):
            if isinstance(e, dict) and e.get('procedural'):
                if e['procedural'] in PLACED:  # placed by an OSM way: its centre and the radius its figures stand within
                    e = {**e, 'lat': PLACED[e['procedural']][0], 'lon': PLACED[e['procedural']][1], 'size': [2 * PLACED[e['procedural']][2]], 'only': PLACED[e['procedural']][3]}
                osm = e.get('osm') or []
                out.append({'name': e.get('name', ''), 'builder': e['procedural'], 'osm': set(osm if isinstance(osm, list) else [osm]),
                            'lat': e.get('lat'), 'lon': e.get('lon'), 'file': os.path.basename(f),
                            'r': max(e.get('size') or [0]) / 2 if GROUP.search(e.get('name', '')) else 0, 'only': e.get('only')})
    for fz in json.load(open(os.path.join(d, 'paris-fountains.json'))):
        if fz.get('landmark'):
            out.append({'name': fz['landmark'], 'builder': 'fountain pieces', 'osm': set(), 'lat': None, 'lon': None,
                        'file': 'paris-fountains.json', 'r': 0})
    glbs = [{'name': e['name'], 'model': e.get('model') or e.get('asset'), 'lat': e.get('lat'), 'lon': e.get('lon'),
             'attach': (e.get('attach') or {}).get('to')} for e in json.load(open(os.path.join(d, 'paris-statues.json')))]
    return out, glbs


def stand_in(t):
    """tools/bake.ts parisStreetKind, for a statue/bust/sculpture."""
    if not t or t.get('indoor') == 'yes' or t.get('tourism') != 'artwork' and t.get('historic') != 'memorial':
        return None
    if 'level' in t or re.search(r'wall|building|facade', f"{t.get('support', '')} {t.get('location', '')}"):
        return None
    what = t.get('artwork_type') or t.get('memorial') or ''
    return what if what in ('bust', 'statue', 'sculpture') else None


def in_game(o, lms, glbs):
    w = words(o['name'])
    for g in glbs:
        if g['lat'] and dist(o['lat'], o['lon'], g['lat'], g['lon']) < GLB_NEAR_M and (w & words(g['name']) or not w):
            return f"GLB ({g['model']})"
        at = ATTACHED.get(g['attach'])
        if at and dist(o['lat'], o['lon'], *at) < GLB_NEAR_M and w & words(g['name'] + ' ' + g['attach']):
            return f"GLB ({g['model']}, on {g['attach']})"
    for l in lms:
        if o['id'] in l['osm']:
            return f"procedural ({l['builder']})"
    for l in lms:
        if l['lat'] and dist(o['lat'], o['lon'], l['lat'], l['lon']) < NEAR_M and w & words(l['name']):
            return f"procedural ({l['builder']})"
        if l.get('r') and l['lat'] and dist(o['lat'], o['lon'], l['lat'], l['lon']) < l['r'] \
                and (not l.get('only') or re.search(l['only'], o['name'])):
            return f"procedural ({l['builder']}, part of {l['name']})"
        if l['file'] == 'paris-fountains.json' and words(l['name']) and words(l['name']) == w:
            return 'procedural (fountain jets)'
    k = stand_in(o.get('tags'))
    return f'stand-in ({k})' if k else ''


def needs_rows(path, area):
    rows = []
    if not os.path.exists(path):
        return rows
    for line in open(path).read().split('\n'):
        f = [s.strip() for s in line.split('|')]
        if len(f) < 8 or not line.startswith('| ') or f[2] in ('Name', '') or f[1].startswith('---'):
            continue
        m = re.search(r'openstreetmap\.org/(\w+)/(\d+)', f[5])
        lat, lon = (float(x) for x in f[6].split(','))
        rows.append({'mark': f[1], 'name': f[2], 'kind': f[3], 'wikidata': f[4], 'id': f'{m[1]}/{m[2]}' if m else None,
                     'lat': lat, 'lon': lon, 'area': area})
    return rows


def main(dest, cand_paths, out):
    cands = {c['id']: c for p in cand_paths.split(',') if os.path.exists(p) for c in json.load(open(p))}
    byq = {c['wikidata']: c for c in cands.values() if c.get('wikidata')}
    lms, glbs = landmarks()
    objs, seen = [], set()
    for f in sorted(os.listdir(dest)):
        mp = os.path.join(dest, f, 'meta.json')
        if f.startswith('_') or not os.path.exists(mp):
            continue
        m = json.load(open(mp))
        r = m.get('review') or {}
        if r.get('verdict') != 'ok' or m.get('commune'):
            continue  # a region pass's folders (meta `commune`) are listed by region_index.py, not here
        src = (m.get('photo') or {}).get('src') or 'commons'
        src = {'google-photos': 'Google', 'openverse': 'Openverse', 'owner': 'owner'}.get(src, 'Commons')
        c = cands.get(m['id']) or {}
        objs.append({**m, 'tags': c.get('tags') or {}, 'score': m.get('score') or c.get('score') or 0, 'folder': f,
                     'status': f'photo ✓ ({src})', 'review': r})
        seen.add(m['id'])
    for path, area in ((os.path.join(dest, '_old-lists', 'needs-photo.md'), 'Paris'), (os.path.join(dest, '_old-lists', 'needs-photo-outside-paris.md'), 'outside')):
        for r in needs_rows(path, area):
            c = cands.get(r['id']) or byq.get(r['wikidata']) or {}
            cid = r['id'] or c.get('id') or f"wd/{r['wikidata']}"
            if cid in seen or any(o['name'] == r['name'] and dist(o['lat'], o['lon'], r['lat'], r['lon']) < 50 for o in objs):
                continue
            seen.add(cid)
            mark = r['mark']
            status = ('procedural (owner)' if 'rocedural' in mark else 'demolished' if 'emolished' in mark
                      else 'duplicate' if 'uplicate' in mark else 'not freestanding' if 'freestanding' in mark
                      else 'needs photo (searched Commons, Google, Openverse)' if 'Openverse' in mark or 'Google' in mark
                      else 'needs photo')
            objs.append({'id': cid, 'name': r['name'], 'sub': r['kind'], 'kind': r['kind'], 'lat': r['lat'], 'lon': r['lon'],
                         'wikidata': r['wikidata'], 'tags': c.get('tags') or {}, 'score': c.get('score') or 0, 'folder': None,
                         'status': status, 'review': {}})
    for g in glbs:  # the GLB statues themselves, left out of the candidates as already made
        lat, lon = (g['lat'], g['lon']) if g['lat'] else ATTACHED.get(g['attach'], (None, None))
        if lat and not any(o['folder'] and dist(o['lat'], o['lon'], lat, lon) < GLB_NEAR_M and words(o['name']) & words(g['name'])
                           for o in objs):
            objs.append({'id': 'glb/' + g['model'], 'name': g['name'], 'sub': 'statue', 'kind': 'statue', 'lat': lat, 'lon': lon,
                         'tags': {}, 'score': 99, 'folder': None, 'status': 'modelled', 'review': {}})
    def label(g):
        m = re.match(r'procedural \((\w+)(.*)\)$', g)
        return f'procedural stand-in ({m[1]}{m[2]})' if m and m[1] in FIGURE_STANDINS else g
    for o in objs:
        o['game'] = f"GLB ({o['id'][4:]})" if o['id'].startswith('glb/') else 'procedural (owner)' if o['status'] == 'procedural (owner)' else label(in_game(o, lms, glbs))
    for o in objs:  # a procedural model that does the piece justice needs no GLB
        if re.match(r'procedural \((?!owner)', o['game']) or o['game'] == 'procedural (owner)':
            o['status'] = 'done (procedural)'
    objs.sort(key=lambda o: (o['status'] != 'modelled', not o['folder'], -(o['score'] or 0), o['name']))
    cell = lambda s: str(s or '').replace('|', '/').replace('\n', ' ')
    link = lambda o: f"[{cell(o['name'])}]({o['folder']}/photo.jpg)" if o['folder'] else cell(o['name'])
    ref = lambda o: o['id'][4:] if o['id'].startswith('glb/') else f"[{o['id']}](https://www.openstreetmap.org/{o['id']})" if not o['id'].startswith(('wd/', 'cm/')) \
        else (o.get('wikidata') or o['id'])
    count = lambda pred: sum(1 for o in objs if pred(o))
    with open(out, 'w') as fh:
        fh.write(f"# Paris statues, sculptures and fountains to model ({len(objs)})\n\n"
                 f"Everything in assets_to_model in one list: {count(lambda o: o['folder'])} with a photo, then "
                 f"{count(lambda o: not o['folder'])} without. **In game** says what the game draws there now — "
                 f"`GLB` a real model ({count(lambda o: o['game'].startswith('GLB'))}), `procedural` a hand-built landmark that does the "
                 f"piece justice ({count(lambda o: re.match(r'procedural \((?!owner)', o['game']))}), `procedural stand-in` one whose figures are "
                 f"primitive shapes a GLB should replace ({count(lambda o: o['game'].startswith('procedural stand-in'))}), "
                 f"`procedural (owner)` what the owner said is modelled ({count(lambda o: o['game'] == 'procedural (owner)')}), `stand-in` the generic street figure every OSM "
                 f"bust/statue/sculpture gets ({count(lambda o: o['game'].startswith('stand-in'))}), blank nothing. "
                 "Parts = GLBs the photo implies; Material = the untextured shader; Plinth `skip` = ordinary, `model` = "
                 "distinctive. Regenerate with tools/assets-to-model/merge.py.\n\n"
                 "| Status | In game | Name | Kind | Parts | Material | Plinth | Issues / note | OSM / Wikidata | Lat, lon |\n"
                 "|---|---|---|---|---|---|---|---|---|---|\n")
        for o in objs:
            r = o['review']
            fh.write(f"| {o['status']} | {cell(o['game'])} | {link(o)} | {cell(o.get('sub') or o.get('kind'))} | "
                     f"{r.get('parts') or (1 if o['folder'] else '')} | {r.get('material') or ''} | {r.get('plinth') or ''} | "
                     f"{cell(', '.join(r.get('issues') or []))} {cell(r.get('note'))} | {ref(o)} | {o['lat']:.5f}, {o['lon']:.5f} |\n")
    print(len(objs), 'objects;', {k: count(lambda o, k=k: o['game'].startswith(k)) for k in ('GLB', 'procedural', 'stand-in')})


if __name__ == '__main__':
    main(*sys.argv[1:4])
