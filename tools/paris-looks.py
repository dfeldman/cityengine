"""Label tall/modern Paris generics from Panoramax photos with Haiku, directly (no Claude Code loop): the Paris cousin of
tools/appearance/batch_api.py (plans/paris-restyle-panoramax.md).

  python3 -I tools/paris-looks.py photos <targets.json> [--n 10]   fetch and mark photos (no key), tools/cache/paris-looks/
  python3 -I tools/paris-looks.py label  <targets.json> [--n 10]   ask Haiku per building (Anthropic API; ANTHROPIC_API_KEY or the repo's .env), merge results
                                                                   into src/city/paris-looks.json

Targets come from tools/paris-restyle-list.ts (plans/restyle/<name>.json), which already drops every way a landmark or a
hand look claims: a label never reaches a custom renderer. Each photo is a 360 cut to the building's angular span (its
footprint's corners seen from the camera) plus a margin, with the span's edges drawn as red lines, and its rows cut to
the building's elevation, so a tower is not cropped off at the top.
"""
import base64, io, json, math, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'tools/cache/paris-looks')
OUT = os.path.join(ROOT, 'src/city/paris-looks.json')
BRIEF = os.path.join(ROOT, 'tools/paris-looks-brief.md')
# ---- tunables ----
N_PHOTOS = int(os.environ.get('PL_N', 3))
NEAR, FAR = 25, int(os.environ.get('PL_FAR', 220))         # metres from the building's centre
MARGIN = 12                  # degrees each side of the building's span
MIN_FOV, MAX_FOV = 50, 140   # the window's width, degrees
SKY = 6                      # degrees above the building's top kept
FLOOR = -28                  # degrees below the horizon kept
LONG = 1024                  # px on the long side sent to the model
MODEL = 'claude-haiku-5-5'
RED = (255, 45, 45)
PHOTO_WORKERS, LABEL_WORKERS = 8, 6


def bearing(lat0, lon0, lat1, lon1):
    dx = (lon1 - lon0) * 111320 * math.cos(math.radians(lat0)); dy = (lat1 - lat0) * 110574
    return math.degrees(math.atan2(dx, dy)) % 360, math.hypot(dx, dy)


def span(cam, ring):
    """the building's [left, right] bearings from the camera, unwrapped around its centre bearing, and nearest distance"""
    bs = [bearing(cam[0], cam[1], la, lo) for la, lo in ring]
    c = bs[0][0]
    rel = [((b - c + 180) % 360) - 180 for b, _ in bs]
    return c + min(rel), c + max(rel), min(d for _, d in bs)


def photos(t, n):
    ring = t['ring']; la = sum(p[0] for p in ring) / len(ring); lo = sum(p[1] for p in ring) / len(ring)
    u = f"https://api.panoramax.xyz/api/search?bbox={lo-0.003},{la-0.002},{lo+0.003},{la+0.002}&limit=300"
    fs = json.load(urllib.request.urlopen(u, timeout=40)).get('features', [])
    cand = []
    for f in fs:
        if (f['properties'].get('pers:interior_orientation') or {}).get('field_of_view') != 360: continue
        x, y = f['geometry']['coordinates']
        b, d = bearing(y, x, la, lo)
        if NEAR <= d <= FAR: cand.append((d, f))
    cand.sort(key=lambda a: a[0])
    out, seen, os_dir = [], set(), os.path.join(CACHE, str(t['id']))
    os.makedirs(os_dir, exist_ok=True)
    for d, f in cand:
        x, y = f['geometry']['coordinates']; k = (round(x, 4), round(y, 4))
        if k in seen: continue
        seen.add(k)
        a = f['assets']; href = (a.get('sd') or a.get('thumb'))['href']
        im = Image.open(io.BytesIO(urllib.request.urlopen(href, timeout=60).read())).convert('RGB'); W, H = im.size
        l, r, near = span((y, x), ring)
        az = f['properties'].get('view:azimuth') or 0
        mid, wide = (l + r) / 2, min(MAX_FOV, max(MIN_FOV, r - l + 2 * MARGIN))
        top = math.degrees(math.atan2(max(t['h'] or 20, 12) - 2.5, max(near, 5))) + SKY  # camera ~2.5 m up
        top = min(top, 85)
        # roll so the window's centre is the picture's centre, then cut
        col = lambda brg: ((brg - az) / 360 + 0.5) % 1 * W
        shift = int(W / 2 - col(mid)) % W
        rolled = Image.new('RGB', (W, H)); rolled.paste(im.crop((W - shift, 0, W, H)), (0, 0)); rolled.paste(im.crop((0, 0, W - shift, H)), (shift, 0))
        px = W / 360
        x0, x1 = int(W / 2 - wide / 2 * px), int(W / 2 + wide / 2 * px)
        y0, y1 = int((90 - top) / 180 * H), int((90 - FLOOR) / 180 * H)
        cut = rolled.crop((x0, y0, x1, y1))
        dr = ImageDraw.Draw(cut); lw = max(2, cut.size[0] // 250)
        for e in (l, r):
            ex = int(W / 2 + (e - mid) * px) - x0
            for yy in range(0, cut.size[1], 18): dr.line([(ex, yy), (ex, yy + 10)], fill=RED, width=lw)
        cut.thumbnail((LONG, LONG))
        p = os.path.join(os_dir, f'{len(out)}.jpg'); cut.save(p, quality=85); out.append(p)
        if len(out) >= n: break
    return out


def ask(t, paths, key, brief):
    content = [{'type': 'image', 'source': {'type': 'base64', 'media_type': 'image/jpeg', 'data': base64.b64encode(open(p, 'rb').read()).decode()}} for p in paths]
    content.append({'type': 'text', 'text': f"Target: {t['h'] or 'unknown'} m tall{(', ' + t['levels'] + ' levels') if t['levels'] else ''}"
                    f"{(', named ' + t['name']) if t['name'] else ''}, on {t['street'] or 'a side street'}; OSM says: {t['why']}."})
    body = {'model': MODEL, 'max_tokens': 2000, 'thinking': {'type': 'disabled'}, 'system': [{'type': 'text', 'text': brief, 'cache_control': {'type': 'ephemeral'}}],
            'messages': [{'role': 'user', 'content': content}]}
    rq = urllib.request.Request('https://api.anthropic.com/v1/messages', json.dumps(body).encode(),
                                {'x-api-key': key, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01'})
    m = json.load(urllib.request.urlopen(rq, timeout=180))
    text = ''.join(b.get('text', '') for b in m.get('content', []))
    if '{' not in text: raise ValueError(f"no JSON: {m.get('stop_reason')} {text[:200]!r}")
    raw = text[text.find('{'):text.rfind('}') + 1]
    try: return json.loads(raw), m.get('usage', {})
    except json.JSONDecodeError: raise ValueError(f'bad JSON: {text[:300]!r}')


def main():
    mode, src = sys.argv[1], sys.argv[2]
    n = int(sys.argv[sys.argv.index('--n') + 1]) if '--n' in sys.argv else 10
    # tallest first: they are the ones a rider sees
    ts = sorted(json.load(open(src)), key=lambda t: -(t['h'] or 0))[:n]
    if mode == 'photos':
        def one(t):
            d = os.path.join(CACHE, str(t['id']))
            if os.path.isdir(d) and len(os.listdir(d)) >= N_PHOTOS: return f"{t['id']} cached"
            try: return f"{t['id']} {t['h']} {len(photos(t, N_PHOTOS))}"
            except Exception as e: return f"{t['id']} failed {e}"
        with ThreadPoolExecutor(PHOTO_WORKERS) as ex:
            for line in ex.map(one, ts): print(line, flush=True)
        return
    key = os.environ.get('ANTHROPIC_API_KEY') or next((l.split('=', 1)[1].strip().strip('"').strip("'") for l in open(os.path.join(ROOT, '.env'))
                                                       if l.startswith('ANTHROPIC_API_KEY=')), '')
    brief = open(BRIEF).read()
    looks = json.load(open(OUT)) if os.path.exists(OUT) else {}
    tot = {}
    redo = '--redo' in sys.argv
    def one(t):
        if str(t['id']) in looks and not redo: return t, None, None, 'labelled'
        d = os.path.join(CACHE, str(t['id']))
        paths = sorted(os.path.join(d, f) for f in os.listdir(d)) if os.path.isdir(d) else []
        if not paths: return t, None, None, 'no photos'
        try: lab, use = ask(t, paths, key, brief); return t, lab, use, None
        except Exception as e: return t, None, None, f'failed {e}'
    with ThreadPoolExecutor(LABEL_WORKERS) as ex:
        for t, lab, use, err in ex.map(one, ts):
            if err: print(t['id'], err, flush=True); continue
            for k, v in use.items():
                if isinstance(v, (int, float)): tot[k] = tot.get(k, 0) + v
            lab['src'] = os.path.basename(src)
            if looks.get(str(t['id']), {}).get('paris'): lab['paris'] = True  # Paris proper (APUR): the Haussmann default
            looks[str(t['id'])] = lab
            print(t['id'], t['h'], lab.get('confidence'), lab.get('note', ''), flush=True)
    json.dump(looks, open(OUT, 'w'), indent=1, sort_keys=True)
    print('usage', tot)


if __name__ == '__main__':
    main()
