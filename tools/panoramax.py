"""Street photos of a building from Panoramax (api.panoramax.xyz, etalab-2.0 licence, no key) for a Haiku look.

  python3 -I tools/panoramax.py <outdir> name=lat,lon [name=lat,lon ...]

For each target: searches ±~200 m, keeps pictures 40-260 m away whose camera azimuth points within 35° of the target,
best first, and saves up to N (default 3) as <outdir>/<name>_<i>.jpg shrunk to 900 px (sips). Prints name, pictures
found, pictures kept. Many are 360° panoramas; thumbnails are small, so it reads colour and material, not detail.
"""
import json, math, os, subprocess, sys, urllib.request
from PIL import Image

N = int(os.environ.get('PMX_N', 3))
NEAR, FAR, AIM = 40, 260, 35  # metres, metres, degrees
CROP_FOV, CROP_TOP, CROP_BOT = 100, 0.12, 0.62  # a 360's window toward the target: degrees wide, rows as a share of height

def shots(out, name, la, lo):
    u = f"https://api.panoramax.xyz/api/search?bbox={lo-0.003},{la-0.002},{lo+0.003},{la+0.002}&limit=200"
    fs = json.load(urllib.request.urlopen(u, timeout=30)).get('features', [])
    sc = []
    for f in fs:
        x, y = f['geometry']['coordinates']; az = f['properties'].get('view:azimuth')
        dx = (lo - x) * 111320 * math.cos(math.radians(la)); dy = (la - y) * 110574; d = math.hypot(dx, dy)
        if az is None or d < NEAR or d > FAR: continue
        off = abs((az - math.degrees(math.atan2(dx, dy)) % 360 + 180) % 360 - 180)
        pano = (f['properties'].get('pers:interior_orientation') or {}).get('field_of_view') == 360
        if pano or off < AIM: sc.append(((0 if pano else off) + d / 20, f, math.degrees(math.atan2(dx, dy)) % 360, pano))
    sc.sort(key=lambda a: a[0]); n = 0; seen = set()
    for _, f, brg, pano in sc:
        c = tuple(round(v, 4) for v in f['geometry']['coordinates'])
        if c in seen: continue
        seen.add(c); a = f['assets']; h = (a.get('sd') or a.get('thumb'))['href']
        p = f"{out}/{name}_{n}.jpg"; urllib.request.urlretrieve(h, p)
        if pano:  # equirectangular: column 0.5 is the camera heading; cut the window toward the target
            im = Image.open(p); W, H = im.size
            c = ((brg - (f['properties'].get('view:azimuth') or 0)) / 360 + 0.5) % 1 * W; w = CROP_FOV / 360 * W
            if c - w / 2 < 0 or c + w / 2 > W:  # the window straddles the seam: roll the picture half a turn
                r = Image.new(im.mode, im.size); r.paste(im.crop((W // 2, 0, W, H)), (0, 0)); r.paste(im.crop((0, 0, W // 2, H)), (W - W // 2, 0))
                im, c = r, (c + W / 2) % W
            im.crop((int(c - w / 2), int(H * CROP_TOP), int(c + w / 2), int(H * CROP_BOT))).save(p)
        subprocess.run(['sips', '-Z', '900', p], capture_output=True); n += 1
        if n >= N: break
    print(name, len(fs), n)

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    for t in sys.argv[2:]:
        name, ll = t.split('='); la, lo = map(float, ll.split(','))
        shots(out, name, la, lo)
