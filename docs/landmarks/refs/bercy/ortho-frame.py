import math, sys
from PIL import Image, ImageDraw
# ortho frame printed by tools/ortho.ts
N, W, S, E = 48.842066, 2.373811, 48.837934, 2.380089
LAT, LON = 48.83999, 2.376945
img = Image.open('refs/ortho.jpg').convert('RGB')
pw, ph = img.size
mlat = 111320; mlon = 111320*math.cos(math.radians(LAT))
bu = math.radians(50.5); bv = math.radians(320.5)
UW, VH = 920, 320  # u -240..220, v +80..-80 at 0.5 m/px (as rot.png)
out = Image.new('RGB', (UW, VH))
src = img.load(); dst = out.load()
for py in range(VH):
    v = 80 - py*0.5
    for px in range(UW):
        u = -240 + px*0.5
        e = u*math.sin(bu) + v*math.sin(bv); n = u*math.cos(bu) + v*math.cos(bv)
        lat = LAT + n/mlat; lon = LON + e/mlon
        x = int((lon-W)/(E-W)*pw); y = int((N-lat)/(N-S)*ph)
        if 0 <= x < pw and 0 <= y < ph: dst[px, py] = src[x, y]
d = ImageDraw.Draw(out)
for u in range(-200, 201, 50):
    x = int((u+240)/0.5); d.line([(x,0),(x,VH)], fill=(255,40,40), width=1); d.text((x+2,2), str(u), fill=(255,255,0))
for v in range(-60, 61, 20):
    y = int((80-v)/0.5); d.line([(0,y),(UW,y)], fill=(255,40,40), width=1); d.text((2,y+1), str(v), fill=(255,255,0))
out.save('refs/ortho-rot.png')
lid = Image.open('refs/rot.png').convert('RGB')
both = Image.new('RGB', (UW, VH*2+4)); both.paste(out, (0,0)); both.paste(lid, (0,VH+4)); both.save('refs/both.png')
# a 2x zoom of the river end and of the Bercy end, ortho over lidar
for name, u0 in (('river', -240), ('bercy', 40)):
    x0 = int((u0+240)/0.5); box = (x0, 0, x0+460, VH)
    z = Image.new('RGB', (920, VH*4+8)); z.paste(out.crop(box).resize((920, VH*2)), (0,0)); z.paste(lid.crop(box).resize((920, VH*2)), (0, VH*2+8)); z.save(f'refs/zoom-{name}.png')
print('ok')
