"""
Photos for the image-to-GLB queue: one folder per freestanding Paris statue, sculpture, fountain or monument
under assets_to_model/, each with photo.jpg and meta.json (osm id, position, Commons source, author, licence).

Input is candidates.json from select.py. Photo sources, best first: the item's own Wikidata P18 (never the
subject's — that is a portrait of the person), the OSM image / wikimedia_commons tags, the Wikidata P373
Commons category, then a Commons geosearch within 40 m whose title shares a word with the name.

  python3 -I tools/assets-to-model/fetch_photos.py candidates.json assets_to_model
"""
import json, os, re, sys, time, unicodedata, urllib.parse, urllib.request

UA = 'cityengine-assets-to-model/1.0 (https://github.com/dfeldman/cityengine)'
API = 'https://commons.wikimedia.org/w/api.php'
WD = 'https://www.wikidata.org/w/api.php'
WIDTH = 2048
IMG_EXT = re.compile(r'\.(jpe?g|png|tiff?|webp)$', re.I)


def get(url, params=None, raw=False, tries=4, timeout=60):
    if params:
        url += '?' + urllib.parse.urlencode({**params, 'format': 'json'})
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=timeout) as r:
                b = r.read()
                return b if raw else json.loads(b)
        except Exception as e:
            if i == tries - 1:
                print('  fail', url[:120], e)
                return None
            time.sleep(3 * 2 ** i)


def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:60] or 'unnamed'


def words(s):
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    stop = {'de', 'du', 'des', 'la', 'le', 'les', 'et', 'a', 'au', 'aux', 'statue', 'fontaine', 'monument', 'paris', 'jpg', 'file'}
    return {w for w in re.findall(r'[a-z]{3,}', s) if w not in stop}


def commons_title(v):
    """'File:X.jpg' from an OSM image / wikimedia_commons value, or None."""
    if not v:
        return None
    v = urllib.parse.unquote(v.split(';')[0].strip())
    m = re.search(r'(?:File|Fichier):(.+)$', v)
    if m:
        return 'File:' + m.group(1).replace('_', ' ')
    m = re.search(r'upload\.wikimedia\.org/.+/([^/]+\.\w+)$', v)
    if m:
        return 'File:' + m.group(1).replace('_', ' ')
    return None


def wikidata_claims(qids):
    out = {}
    qids = list(qids)
    for i in range(0, len(qids), 50):
        r = get(WD, {'action': 'wbgetentities', 'ids': '|'.join(qids[i:i + 50]), 'props': 'claims'})
        for q, ent in (r or {}).get('entities', {}).items():
            c = ent.get('claims', {})
            val = lambda p: [s['mainsnak'].get('datavalue', {}).get('value') for s in c.get(p, [])]
            out[q] = {'p18': [v for v in val('P18') if v], 'p373': [v for v in val('P373') if v]}
    return out


def category_files(cat, limit=40):
    r = get(API, {'action': 'query', 'list': 'categorymembers', 'cmtitle': 'Category:' + cat, 'cmtype': 'file', 'cmlimit': limit})
    return [m['title'] for m in (r or {}).get('query', {}).get('categorymembers', []) if IMG_EXT.search(m['title'])]


def matches(title, name, artist):
    """A Commons title that names the piece: two of its words (one for a one-word name), or the artist's surname."""
    w, t = words(name), words(title)
    a = words((artist or '').split(';')[0].split()[-1] if artist else '')
    return len(w & t) >= min(2, len(w)) > 0 or bool(a & t)


def geo_files(lat, lon, name, artist=None, radius=80):
    r = get(API, {'action': 'query', 'list': 'geosearch', 'gscoord': f'{lat}|{lon}', 'gsradius': radius, 'gsnamespace': 6, 'gslimit': 50})
    hits = [g['title'] for g in (r or {}).get('query', {}).get('geosearch', []) if IMG_EXT.search(g['title'])]
    return [h for h in hits if matches(h, name, artist)]


def search_files(name, artist=None):
    r = get(API, {'action': 'query', 'list': 'search', 'srsearch': f'{name} Paris filetype:bitmap', 'srnamespace': 6, 'srlimit': 20})
    hits = [g['title'] for g in (r or {}).get('query', {}).get('search', []) if IMG_EXT.search(g['title'])]
    return [h for h in hits if matches(h, name, artist)]


def imageinfo(titles):
    out = {}
    titles = list(dict.fromkeys(titles))
    for i in range(0, len(titles), 50):
        r = get(API, {'action': 'query', 'titles': '|'.join(titles[i:i + 50]), 'prop': 'imageinfo',
                      'iiprop': 'url|size|extmetadata', 'iiurlwidth': WIDTH})
        q = (r or {}).get('query', {})
        norm = {n['to']: n['from'] for n in q.get('normalized', [])}
        for p in q.get('pages', {}).values():
            ii = (p.get('imageinfo') or [None])[0]
            if not ii:
                continue
            md = ii.get('extmetadata', {})
            strip = lambda k: re.sub('<[^>]+>', '', md.get(k, {}).get('value', '')).strip()
            info = {'title': p['title'], 'w': ii['width'], 'h': ii['height'], 'thumb': ii.get('thumburl') or ii['url'],
                    'page': ii.get('descriptionurl'), 'author': strip('Artist'), 'license': strip('LicenseShortName')}
            out[p['title']] = info
            if p['title'] in norm:
                out[norm[p['title']]] = info
    return out


def main(cands_path, dest):
    cands = json.load(open(cands_path))
    wd = wikidata_claims({c['wikidata'] for c in cands if c.get('wikidata')})
    for n, c in enumerate(cands):
        pool = []
        claims = wd.get(c.get('wikidata') or '', {})
        pool += ['File:' + f for f in claims.get('p18', [])]
        for k in ('image', 'wikimedia_commons'):
            t = commons_title(c['tags'].get(k))
            if t:
                pool.append(t)
        cat = claims.get('p373', [])
        if not cat and (c['tags'].get('wikimedia_commons') or '').startswith('Category:'):
            cat = [c['tags']['wikimedia_commons'][9:]]
        if len(pool) < 3:
            for k in cat[:1]:
                pool += category_files(k)
        if not pool:
            pool += geo_files(c['lat'], c['lon'], c['name'], c.get('artist'))
        if not pool and len(words(c['name'])) >= 2:
            pool += search_files(c['name'], c.get('artist'))
        c['pool'] = list(dict.fromkeys(pool))
        if n % 50 == 0:
            print(f'pools {n}/{len(cands)}', flush=True)
    info = imageinfo([t for c in cands for t in c['pool']])

    os.makedirs(dest, exist_ok=True)
    got = 0
    for c in cands:
        # the first-ranked source wins when it is big enough; otherwise the largest of the rest
        opts = [info[t] for t in c['pool'] if t in info and min(info[t]['w'], info[t]['h']) >= 600]
        if not opts:
            c['photo'] = None
            continue
        best = opts[0] if c['pool'] and opts[0]['title'] == c['pool'][0] else max(opts, key=lambda o: o['w'] * o['h'])
        folder = os.path.join(dest, f"{slug(c['name'])}--{c['id'].replace('/', '')}")
        os.makedirs(folder, exist_ok=True)
        jpg = os.path.join(folder, 'photo.jpg')
        if not os.path.exists(jpg):
            b = get(best['thumb'], raw=True)
            if not b:
                continue
            open(jpg, 'wb').write(b)
            time.sleep(0.3)
        meta = {k: c.get(k) for k in ('id', 'name', 'kind', 'sub', 'lat', 'lon', 'wikidata', 'artist', 'height', 'score')}
        meta['osm'] = f"https://www.openstreetmap.org/{c['id']}"
        meta['photo'] = best
        meta['alternates'] = [o for o in opts if o is not best][:4]
        json.dump(meta, open(os.path.join(folder, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
        c['photo'] = folder
        got += 1
    print(f'{got}/{len(cands)} with photos')
    json.dump([{k: c[k] for k in ('id', 'name', 'photo')} for c in cands], open(os.path.join(dest, 'fetched.json'), 'w'), ensure_ascii=False, indent=0)


if __name__ == '__main__':
    main(*sys.argv[1:3])
