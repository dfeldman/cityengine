"""
Puts each candidate's PICKED photo (pick labels: best option per sheet row) into assets_to_model/<folder>/photo.jpg
at 1920 px, with meta.json carrying the pick's review labels and the unpicked options as `alternates`. Rows the
pick rejected (best 0), or whose object it dropped, move to _nophoto/ or _dropped/ and are listed in needs-photo.md.

  python3 -I tools/assets-to-model/finalize.py pick_dir assets_to_model
Labels: pick_dir/labels-*.json — {"sheet","row","best","issues","parts","material","plinth","note"}.
"""
import glob, json, os, re, shutil, sys, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_photos import get, slug  # noqa: E402

WIDTH = 1920  # a standard thumbnail step: upload.wikimedia.org answers 400 to 2048
OBJECT_DROPS = {'relief', 'building-sized', 'procedural-fountain', 'indoor', 'blocklist'}
# already modelled, flat in the pavement, or not sculpture
NAME_DROPS = re.compile(r'wallace|arago|ballon', re.I)


def big(o):
    if o['w'] <= WIDTH and not o['title'].lower().endswith(('.tif', '.tiff')):
        return o['url']
    return re.sub(r'/(lossy-page1-)?\d+px-', lambda m: f"/{m.group(1) or ''}{WIDTH}px-", o['thumb'])


def main(pick, dest):
    pool = {c['id']: c for c in json.load(open(os.path.join(pick, 'pool.json')))}
    rows = json.load(open(os.path.join(pick, 'pick.json')))
    labels = {}
    for f in sorted(glob.glob(os.path.join(pick, 'labels-*.json'))):
        for l in json.load(open(f)):
            try:
                labels[rows[l['sheet']]['ABCDE'.index(str(l['row']).upper())]] = l
            except (KeyError, IndexError, ValueError):
                pass
    for sub in ('_dropped', '_nophoto'):
        os.makedirs(os.path.join(dest, sub), exist_ok=True)
    existing = {f.split('--')[-1]: f for f in os.listdir(dest) if '--' in f}
    kept, nophoto = 0, []
    for cid, c in pool.items():
        l = labels.get(cid)
        if not l:
            continue
        key = cid.replace('/', '')
        folder = existing.get(key) or f"{slug(c['name'])}--{key}"
        path = os.path.join(dest, folder)
        os.makedirs(path, exist_ok=True)
        best = int(l.get('best') or 0)
        review = {k: l.get(k) for k in ('issues', 'parts', 'material', 'plinth', 'note')}
        if NAME_DROPS.search(c['name']):
            l = {**l, 'issues': list(l.get('issues') or []) + ['blocklist']}
        meta = {k: c.get(k) for k in ('id', 'name', 'kind', 'sub', 'lat', 'lon', 'wikidata', 'artist', 'height', 'score', 'commune', 'zone') if k in c}
        meta.update(art=c.get('art'), osm=None if cid.startswith('wd/') else f'https://www.openstreetmap.org/{cid}', review=review)
        for f in glob.glob(os.path.join(path, 'rejected-*.jpg')):
            os.remove(f)
        if OBJECT_DROPS & set(l.get('issues') or []) or not 1 <= best <= len(c['opts']):
            meta['review']['verdict'] = 'drop' if OBJECT_DROPS & set(l.get('issues') or []) else 'no-photo'
            json.dump(meta, open(os.path.join(path, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
            sub = '_dropped' if meta['review']['verdict'] == 'drop' else '_nophoto'
            shutil.rmtree(os.path.join(dest, sub, folder), ignore_errors=True)
            shutil.move(path, os.path.join(dest, sub, folder))
            if sub == '_nophoto':
                nophoto.append(c)
            continue
        o = c['opts'][best - 1]
        b = get(big(o), raw=True)
        if not b:
            continue
        open(os.path.join(path, 'photo.jpg'), 'wb').write(b)
        meta['review']['verdict'] = 'ok'
        meta['photo'] = {k: o[k] for k in ('title', 'w', 'h', 'page', 'author', 'license', 'src')}
        meta['alternates'] = [{k: a[k] for k in ('title', 'w', 'h', 'page', 'src')} for a in c['opts'] if a is not o]
        json.dump(meta, open(os.path.join(path, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
        kept += 1
        time.sleep(0.2)
    print(kept, 'photos;', len(nophoto), 'rows with no usable photo')
    json.dump([c['id'] for c in nophoto], open(os.path.join(dest, 'nophoto.json'), 'w'), indent=0)


if __name__ == '__main__':
    main(*sys.argv[1:3])
