"""
Photo pools for the vision pick: up to six Commons photos per candidate, from precise sources only, with
picking sheets of five candidates a row each.

Sources, in rank order: files whose structured data DEPICTS the statue's own Wikidata item (P180), its P18, its
Commons category (P373, or OSM wikimedia_commons=Category:…), OSM image tags. Geosearch only when those are all
empty — the pick rejects what is not the object. A candidate without an artwork item of its own borrows one from
the Paris SPARQL list (wd.json) within 40 m with a shared name word. No free-text search: it found portraits,
signs and the wrong town.

  python3 -I tools/assets-to-model/pool.py candidates.json[,more.json] wd.json skip.json out_dir
Writes out_dir/pool.json, out_dir/thumbs/, out_dir/pick-NN.jpg and out_dir/pick.json (sheet rows → ids).
"""
import json, math, os, re, sys, time, urllib.parse
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_photos import API, WD, IMG_EXT, commons_title, get, words  # noqa: E402

ARTWORK = {'Q860861', 'Q179700', 'Q483453', 'Q4989906', 'Q241045', 'Q5003624', 'Q17489160', 'Q1779653', 'Q2143825',
           'Q575759', 'Q20437094', 'Q3476533', 'Q173387', 'Q838948', 'Q4502142', 'Q1640824', 'Q11060274'}
THUMB, PER_ROW, ROWS = 360, 6, 5


def claims(qids):
    out = {}
    qids = sorted(qids)
    for i in range(0, len(qids), 50):
        r = get(WD, {'action': 'wbgetentities', 'ids': '|'.join(qids[i:i + 50]), 'props': 'claims'})
        time.sleep(1)
        for q, e in (r or {}).get('entities', {}).items():
            c = e.get('claims', {})
            val = lambda p: [s['mainsnak'].get('datavalue', {}).get('value') for s in c.get(p, [])]
            out[q] = {'p31': [v.get('id') for v in val('P31') if v], 'p18': [v for v in val('P18') if v],
                      'p373': [v for v in val('P373') if v]}
    return out


def dist(a, b, c, d):
    return math.hypot((a - c) * 111320, (b - d) * 111320 * math.cos(math.radians(a)))


def sparql_items(path):
    items = {}
    for b in json.load(open(path))['results']['bindings']:
        q = b['item']['value'].rsplit('/', 1)[1]
        lon, lat = map(float, re.findall(r'[-0-9.]+', b['coord']['value']))
        items[q] = {'q': q, 'name': b.get('itemLabel', {}).get('value', q), 'lat': lat, 'lon': lon}
    return list(items.values())


def depicts(q):
    r = get(API, {'action': 'query', 'list': 'search', 'srsearch': f'haswbstatement:P180={q}', 'srnamespace': 6, 'srlimit': 30})
    return [s['title'] for s in (r or {}).get('query', {}).get('search', []) if IMG_EXT.search(s['title'])]


def category(cat):
    r = get(API, {'action': 'query', 'list': 'categorymembers', 'cmtitle': 'Category:' + cat, 'cmtype': 'file', 'cmlimit': 50})
    return [m['title'] for m in (r or {}).get('query', {}).get('categorymembers', []) if IMG_EXT.search(m['title'])]


def geo(lat, lon):
    r = get(API, {'action': 'query', 'list': 'geosearch', 'gscoord': f'{lat}|{lon}', 'gsradius': 30, 'gsnamespace': 6, 'gslimit': 12})
    return [g['title'] for g in (r or {}).get('query', {}).get('geosearch', []) if IMG_EXT.search(g['title'])]


def imageinfo(titles):
    out = {}
    titles = list(dict.fromkeys(titles))
    for i in range(0, len(titles), 50):
        r = get(API, {'action': 'query', 'titles': '|'.join(titles[i:i + 50]), 'prop': 'imageinfo',
                      'iiprop': 'url|size|extmetadata', 'iiurlwidth': THUMB, 'iiextmetadatafilter': 'Artist|LicenseShortName'})
        q = (r or {}).get('query', {})
        norm = {n['to']: n['from'] for n in q.get('normalized', [])}
        for p in q.get('pages', {}).values():
            ii = (p.get('imageinfo') or [None])[0]
            if not ii:
                continue
            md = ii.get('extmetadata', {})
            strip = lambda k: re.sub('<[^>]+>', '', md.get(k, {}).get('value', '')).strip()
            info = {'title': p['title'], 'w': ii['width'], 'h': ii['height'], 'url': ii['url'], 'thumb': ii.get('thumburl'),
                    'page': ii.get('descriptionurl'), 'author': strip('Artist'), 'license': strip('LicenseShortName')}
            out[p['title']] = info
            out[norm.get(p['title'], p['title'])] = info
    return out


def main(cand_paths, wd_path, skip_path, out):
    cands = [c for p in cand_paths.split(',') for c in json.load(open(p))]
    skip = set(json.load(open(skip_path)))
    cands = [c for c in cands if c['id'] not in skip]
    sparql = sparql_items(wd_path)
    cl = claims({c['wikidata'] for c in cands if c.get('wikidata')})
    for c in cands:
        own = c.get('wikidata')
        if own and ARTWORK & set(cl.get(own, {}).get('p31', [])):
            c['art'] = own
            continue
        near = [s for s in sparql if dist(c['lat'], c['lon'], s['lat'], s['lon']) < 40 and words(s['name']) & words(c['name'])]
        c['art'] = min(near, key=lambda s: dist(c['lat'], c['lon'], s['lat'], s['lon']))['q'] if near else None
    cl.update(claims({c['art'] for c in cands if c['art'] and c['art'] not in cl}))
    print(len(cands), 'candidates;', sum(bool(c['art']) for c in cands), 'with an artwork item', flush=True)

    for n, c in enumerate(cands):
        src = {}
        a = cl.get(c['art'] or '', {})
        for t in depicts(c['art']) if c['art'] else []:
            src.setdefault(t, 'depicts')
        for f in a.get('p18', []):
            src.setdefault('File:' + f.replace('_', ' '), 'p18')
        cats = list(a.get('p373', []))
        wc = c['tags'].get('wikimedia_commons') or ''
        if wc.startswith('Category:'):
            cats.append(wc[9:])
        for k in cats[:2]:
            for t in category(k):
                src.setdefault(t, 'category')
        for k in ('image', 'wikimedia_commons'):
            t = commons_title(c['tags'].get(k))
            if t:
                src.setdefault(t, 'osm')
        if not src:
            for t in geo(c['lat'], c['lon']):
                src.setdefault(t, 'geo')
        c['src'] = src
        time.sleep(0.2)
        if n % 100 == 0:
            print(f'pools {n}/{len(cands)}', flush=True)

    info = imageinfo([t for c in cands for t in c['src']])
    rank = {'depicts': 3, 'p18': 3, 'category': 2, 'osm': 2, 'geo': 0}
    for c in cands:
        opts = []
        for t, s in c['src'].items():
            i = info.get(t)
            if not i or min(i['w'], i['h']) < 800 or not i.get('thumb'):
                continue
            score = rank[s] + bool(words(c['name']) & words(t)) + (i['h'] >= i['w']) + min(i['w'] * i['h'] / 12e6, 1)
            opts.append({**i, 'src': s, 'rank': round(score, 2)})
        c['opts'] = sorted(opts, key=lambda o: -o['rank'])[:PER_ROW]
    cands = [c for c in cands if c['opts']]
    print(len(cands), 'with options', flush=True)

    os.makedirs(os.path.join(out, 'thumbs'), exist_ok=True)
    jobs = [(c['opts'][k]['thumb'], os.path.join(out, 'thumbs', f"{c['id'].replace('/', '')}-{k + 1}.jpg"))
            for c in cands for k in range(len(c['opts']))]

    def fetch(job):
        if not os.path.exists(job[1]):
            b = get(job[0], raw=True)
            if b:
                open(job[1], 'wb').write(b)
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(fetch, jobs))
    json.dump(cands, open(os.path.join(out, 'pool.json'), 'w'), ensure_ascii=False, indent=0)
    sheets(cands, out)


def sheets(cands, out):
    from PIL import Image, ImageDraw, ImageFont, ImageOps
    big, small = ImageFont.load_default(size=22), ImageFont.load_default(size=15)
    W, H, LBL = THUMB, THUMB, 26
    index = {}
    for s in range(0, len(cands), ROWS):
        rows = cands[s:s + ROWS]
        sheet = Image.new('RGB', (PER_ROW * W, len(rows) * (H + LBL)), 'white')
        d = ImageDraw.Draw(sheet)
        for r, c in enumerate(rows):
            y = r * (H + LBL)
            d.text((4, y + 3), f"{'ABCDE'[r]}  {c['name'][:70]}  ({c['sub'] or c['kind']})", fill='black', font=small)
            for k in range(len(c['opts'])):
                p = os.path.join(out, 'thumbs', f"{c['id'].replace('/', '')}-{k + 1}.jpg")
                try:
                    im = ImageOps.exif_transpose(Image.open(p)).convert('RGB')
                    im.thumbnail((W - 6, H - 4))
                except Exception:
                    continue
                sheet.paste(im, (k * W + 3, y + LBL))
                d.text((k * W + 6, y + LBL + 2), str(k + 1), fill='red', font=big, stroke_width=2, stroke_fill='white')
        name = f'pick-{s // ROWS + 1:03d}.jpg'
        sheet.save(os.path.join(out, name), quality=80)
        index[name] = [c['id'] for c in rows]
    json.dump(index, open(os.path.join(out, 'pick.json'), 'w'), indent=0)
    print(len(index), 'picking sheets')


if __name__ == '__main__':
    main(*sys.argv[1:5])
