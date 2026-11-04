"""
select.py for a region outside Paris, from the local pbf instead of Overpass: candidates in the named communes,
with select.py's tag filter and dedup, the building-footprint test done against the extract's own buildings, and
each candidate's commune recorded (`commune`). Ids already in assets_to_model are skipped.

  osmium extract -b 2.04,48.77,2.28,48.875 tools/cache/osm/ile-de-france-latest.osm.pbf -o west.pbf -s smart
  osmium tags-filter west.pbf nwr/tourism=artwork nwr/historic=memorial,monument,statue nwr/amenity=fountain -o art.pbf
  osmium export art.pbf -f geojsonseq -o art.geojsonseq -a type,id
  osmium tags-filter west.pbf r/admin_level=8 -o adm.pbf && osmium export adm.pbf -f geojsonseq -o adm.geojsonseq
  osmium tags-filter west.pbf w/building r/building -o bld.pbf && osmium export bld.pbf -f geojsonseq -o bld.geojsonseq --geometry-types=polygon
  python3 -I tools/assets-to-model/region.py work_dir assets_to_model candidates.json
"""
import importlib.util, json, os, re, sys

# tools/assets-to-model/select.py, loaded by path: `import select` would give the stdlib module
_spec = importlib.util.spec_from_file_location('a2m_select', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'select.py'))
_sel = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_sel)
first_pass, norm, dist, inside, area = _sel.first_pass, _sel.norm, _sel.dist, _sel.inside, _sel.area

# the Paris → Versailles corridor
COMMUNES = ['Boulogne-Billancourt', 'Saint-Cloud', 'Sèvres', 'Meudon', 'Chaville', 'Viroflay', "Ville-d'Avray",
            'Marnes-la-Coquette', 'Garches', 'Vaucresson', 'Versailles', 'Le Chesnay-Rocquencourt', "Saint-Cyr-l'École"]
CELL = 0.002  # building grid, degrees
# the estates whose garden statues are a group of their own in the index (zone); anything else is `town`
ESTATES = {'Parc de Versailles': 'Versailles gardens', 'Le jardin de Versailles': 'Versailles gardens',
           'Domaine de Trianon': 'Trianon', 'Domaine national de Saint-Cloud': 'Saint-Cloud estate',
           'Domaine national de Meudon': 'Meudon estate'}
# historic=monument here is often a whole building: a school, an abbey, a battery
BUILDINGISH = re.compile(r"\b([eé]cole|abbaye|h[oô]pital|batterie|site historique|ch[aâ]teau|caserne|[eé]glise|chapelle|"
                         r"lavoir|aqueduc|pavillon|ferme|maison|temple)\b", re.I)


def feats(path):
    for line in open(path):
        line = line.strip('\x1e\n')
        if line:
            yield json.loads(line)


def outers(g):
    polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates'] if g['type'] == 'MultiPolygon' else []
    return [[(la, lo) for lo, la in p[0]] for p in polys]


def center(g):
    if g['type'] == 'Point':
        return g['coordinates'][1], g['coordinates'][0]
    pts = [c for r in outers(g) for c in r] or [(c[1], c[0]) for c in (g['coordinates'] if g['type'] == 'LineString' else [])]
    return sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)


def main(work, dest, dst):
    comm = []
    for f in feats(os.path.join(work, 'adm.geojsonseq')):
        p = f['properties']
        if p.get('admin_level') == '8' and p.get('name') in COMMUNES:
            comm.append((p['name'], outers(f['geometry'])))
    els = []
    for f in feats(os.path.join(work, 'art.geojsonseq')):
        p = dict(f['properties'])
        ty, oid = p.pop('@type'), p.pop('@id')
        lat, lon = center(f['geometry'])
        els.append({'type': {'node': 'node', 'way': 'way', 'relation': 'relation'}[ty], 'id': oid, 'lat': lat, 'lon': lon, 'tags': p})
    cands = [c for c in first_pass(els) if not (c['kind'] == 'monument' and (
        'ruins' in c['tags'] or c['tags'].get('building') or BUILDINGISH.search(c['name'])))]
    parks, cems = [], []
    for f in feats(os.path.join(work, 'parks.geojsonseq')):
        p = f['properties']
        if p.get('landuse') == 'cemetery':
            cems += outers(f['geometry'])
        elif p.get('name') in ESTATES:
            parks.append((ESTATES[p['name']], outers(f['geometry'])))
    have = set()
    for d in (dest, os.path.join(dest, '_nophoto'), os.path.join(dest, '_dropped')):
        for folder in os.listdir(d):
            mp = os.path.join(d, folder, 'meta.json')
            if os.path.exists(mp):
                have.add(json.load(open(mp))['id'])
    out = []
    for c in cands:
        town = next((n for n, rs in comm if any(inside(c['lat'], c['lon'], r) for r in rs)), None)
        if town and c['id'] not in have:
            c['commune'] = town
            out.append(c)
    print('tag filter in corridor', len(out))
    out.sort(key=lambda c: -c['score'])
    keep, seen = [], set()
    for c in out:
        if c['wikidata'] and c['wikidata'] in seen:
            continue
        if any(norm(c['name']) == norm(k['name']) and dist(c['lat'], c['lon'], k['lat'], k['lon']) < 50 for k in keep):
            continue
        seen.add(c['wikidata'])
        keep.append(c)
    print('dedup', len(keep))
    # Wikidata artworks (work_dir/wd.json, the corridor SPARQL) that no OSM candidate or folder already is
    wdp = os.path.join(work, 'wd.json')
    if os.path.exists(wdp):
        qs = {c['wikidata'] for c in keep} | {i[3:] for i in have if i.startswith('wd/')} | {c['wikidata'] for c in cands if c['wikidata']}
        added = 0
        for b in json.load(open(wdp))['results']['bindings']:
            q = b['item']['value'].rsplit('/', 1)[1]
            lon, lat = map(float, b['coord']['value'][6:-1].split())
            name = b.get('itemLabel', {}).get('value', q)
            town = next((n for n, rs in comm if any(inside(lat, lon, r) for r in rs)), None)
            if q in qs or not town or name == q or 'wd/' + q in have:
                continue
            if any(set(norm(name).split()) & set(norm(k['name']).split()) - {'de', 'la', 'le', 'du', 'des', 'l', 'd'}
                   and dist(lat, lon, k['lat'], k['lon']) < 40 for k in keep):
                continue
            qs.add(q)
            keep.append(dict(id='wd/' + q, kind='wikidata', sub=b['cls']['value'].rsplit('/', 1)[1], name=name, lat=lat,
                             lon=lon, score=5, wikidata=q, artist=None, height=None, tags={}, commune=town))
            added += 1
        print('wikidata only', added)
    want = {(int(c['lat'] / CELL), int(c['lon'] / CELL)) for c in keep}
    grid = {}
    for f in feats(os.path.join(work, 'bld.geojsonseq')):
        for r in outers(f['geometry']):
            la, lo = [p[0] for p in r], [p[1] for p in r]
            for y in range(int(min(la) / CELL), int(max(la) / CELL) + 1):
                for x in range(int(min(lo) / CELL), int(max(lo) / CELL) + 1):
                    if (y, x) in want:
                        grid.setdefault((y, x), []).append(r)
    final = []
    for c in keep:
        rs = grid.get((int(c['lat'] / CELL), int(c['lon'] / CELL)), [])
        if c['tags'].get('building') is None and any(area(r) > 150 and inside(c['lat'], c['lon'], r) for r in rs):
            continue
        c['cemetery'] = any(inside(c['lat'], c['lon'], r) for r in cems)
        if c['cemetery']:
            c['score'] -= 6
        c['zone'] = next((z for z, rs in parks if any(inside(c['lat'], c['lon'], r) for r in rs)), 'town')
        final.append(c)
    final.sort(key=lambda c: (c['zone'] != 'town', -c['score']))  # town first: the pick runs in this order
    print('not in buildings', len(final), 'cemetery', sum(c['cemetery'] for c in final))
    print({z: sum(c['zone'] == z for c in final) for z in {c['zone'] for c in final}})
    json.dump(final, open(dst, 'w'), ensure_ascii=False, indent=0)
    # the commune and estate outlines, for region_index.py to place folders made by earlier passes
    rnd = lambda rs: [[[round(a, 5), round(b, 5)] for a, b in r[::2]] for r in rs]
    json.dump({'communes': {n: rnd(rs) for n, rs in comm}, 'estates': [[z, rnd(rs)] for z, rs in parks]},
              open(os.path.join(os.path.dirname(os.path.abspath(dst)), 'outlines.json'), 'w'))


if __name__ == '__main__':
    main(*sys.argv[1:4])
