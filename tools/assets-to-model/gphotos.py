"""
Google Photos shares linked from OSM (image=https://photos.app.goo.gl/…): resolves each public share, downloads
its photos at 1920 px, and makes picking sheets that set them beside the object's current photo (cell 1).

These photos carry no licence: they are the photographer's, kept as private modelling reference only.

  python3 -I tools/assets-to-model/gphotos.py candidates.json[,more.json] assets_to_model out_dir
Writes out_dir/gp.json, out_dir/img/, out_dir/pick-NN.jpg and out_dir/pick.json (sheet rows → ids).
"""
import json, os, re, sys, time, urllib.request

PER_ROW, ROWS, CELL = 6, 5, 300
BROWSER = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'


def fetch(url, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': BROWSER}), timeout=60) as r:
                return r.read()
        except Exception as e:
            if i == tries - 1:
                print('  fail', url[:90], e)
            time.sleep(3 * 2 ** i)


def share_photos(url, limit=PER_ROW - 1):
    """The photo URLs of a public share page, in page order, without their size suffix."""
    page = fetch(url)
    if not page:
        return []
    ids = re.findall(r'https://lh3\.googleusercontent\.com/pw/[A-Za-z0-9_-]{40,}', page.decode('utf8', 'ignore'))
    return list(dict.fromkeys(ids))[:limit]


def main(cand_paths, dest, out):
    cands = [c for p in cand_paths.split(',') for c in json.load(open(p))]
    gp = [c for c in cands if any('photos.app.goo.gl' in v or 'photos.google.com' in v
                                  for k, v in c['tags'].items() if k.startswith('image'))]
    where = {}
    for sub in ('', '_nophoto', '_dropped'):
        for f in os.listdir(os.path.join(dest, sub) if sub else dest):
            if '--' in f:
                where.setdefault(f.split('--')[-1], os.path.join(sub, f) if sub else f)
    os.makedirs(os.path.join(out, 'img'), exist_ok=True)
    rows = []
    for c in gp:
        key = c['id'].replace('/', '')
        link = next(v for k, v in c['tags'].items() if k.startswith('image') and ('photos.google.com' in v or 'goo.gl' in v))
        link = re.split(r'[;\s]', link)[0]
        files = []
        for k, u in enumerate(share_photos(link)):
            p = os.path.join(out, 'img', f'{key}-{k + 2}.jpg')
            if not os.path.exists(p):
                b = fetch(u + '=w1920')
                if not b:
                    continue
                open(p, 'wb').write(b)
            files.append(p)
        cur = where.get(key)
        cur_photo = os.path.join(dest, cur, 'photo.jpg') if cur and os.path.exists(os.path.join(dest, cur, 'photo.jpg')) else None
        rows.append({'id': c['id'], 'name': c['name'], 'sub': c['sub'], 'kind': c['kind'], 'link': link,
                     'folder': cur, 'current': cur_photo, 'gp': files})
        time.sleep(0.5)
    print(len(rows), 'shares;', sum(bool(r['gp']) for r in rows), 'with photos;', sum(len(r['gp']) for r in rows), 'photos')
    rows = [r for r in rows if r['gp']]
    json.dump(rows, open(os.path.join(out, 'gp.json'), 'w'), ensure_ascii=False, indent=0)

    from PIL import Image, ImageDraw, ImageFont, ImageOps
    big, small = ImageFont.load_default(size=22), ImageFont.load_default(size=15)
    index = {}
    for s in range(0, len(rows), ROWS):
        part = rows[s:s + ROWS]
        sheet = Image.new('RGB', (PER_ROW * CELL, len(part) * (CELL + 26)), 'white')
        d = ImageDraw.Draw(sheet)
        for r, row in enumerate(part):
            y = r * (CELL + 26)
            d.text((4, y + 3), f"{'ABCDE'[r]}  {row['name'][:70]}  ({row['sub'] or row['kind']})", fill='black', font=small)
            cells = [(1, row['current'])] + [(int(re.search(r'-(\d+)\.jpg$', p).group(1)), p) for p in row['gp']]
            for n, p in cells:
                if not p:
                    continue
                try:
                    im = ImageOps.exif_transpose(Image.open(p)).convert('RGB')
                    im.thumbnail((CELL - 6, CELL - 4))
                except Exception:
                    continue
                sheet.paste(im, ((n - 1) * CELL + 3, y + 26))
                d.text(((n - 1) * CELL + 6, y + 28), str(n), fill='red', font=big, stroke_width=2, stroke_fill='white')
        name = f'pick-{s // ROWS + 1:02d}.jpg'
        sheet.save(os.path.join(out, name), quality=80)
        index[name] = [row['id'] for row in part]
    json.dump(index, open(os.path.join(out, 'pick.json'), 'w'), indent=0)
    print(len(index), 'picking sheets')


if __name__ == '__main__':
    main(*sys.argv[1:4])
