"""Japanese Tea Garden pagoda (Golden Gate Park; built for the 1915 Panama-Pacific Exposition): the five-storey
square pagoda on its battered rubble-stone plinth, as a flat-coloured low-poly GLB for assetkit-models-sf.

Run headless:  blender -b -P tools/blender/tea_garden_pagoda.py -- out.glb [render_dir]

Read off the owner's four photographs (docs/sf-batches/MODEL-TEA-GARDEN-PAGODA.md). One storey unit, five times,
each eave 5 % narrower than the one below:
  - a deck ringed by a vermilion railing of two tiers: wide-spaced balusters above a mid rail, a close grid below it;
  - the body: the GROUND storey is tall, cream panels between vermilion posts, a cusped-arch lattice window in
    each side bay and a white door with a gilt cloud ornament in the middle; the UPPER storeys are short and
    vermilion, a cream band with a barred vent at its centre and a gilt cloud each side;
  - the eave: two tiers of close-set vermilion rafters fanning out past the body, a corner beam that kicks up, a
    row of white bosses along the fascia, a bronze wind-bell at each corner;
  - a dark tiled hipped roof whose corners curl up; the fifth is a pyramid under a verdigris cap and the sōrin
    (bronze mast, rings, jewel).
Blender Z up, metres, origin at the centre of the plinth's foot; the glTF exporter turns it Y up.
"""
import bpy, bmesh, sys, math, os
from mathutils import Vector

RED = (0.60, 0.11, 0.06, 1); CREAM = (0.90, 0.85, 0.74, 1); WHITE = (0.92, 0.92, 0.90, 1)
TILE = (0.40, 0.29, 0.17, 1)   # weathered cedar shingle, as the sunlit close-up (reads near-black in shade)
STONE = (0.55, 0.52, 0.46, 1); CAP = (0.72, 0.70, 0.66, 1)
GILT = (0.85, 0.60, 0.22, 1); DARK = (0.12, 0.08, 0.07, 1); BRONZE = (0.32, 0.27, 0.18, 1)
VERDIGRIS = (0.35, 0.55, 0.48, 1)

def mat(name, rgba, rough=0.8, metal=0.0):
    m = bpy.data.materials.get(name)
    if m: return m
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = rgba; b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m

bpy.ops.wm.read_factory_settings(use_empty=True)
coll = bpy.context.scene.collection
parts = []
BMS = {}   # material name -> bmesh, so each material becomes one object

def bm_for(material):
    if material.name not in BMS: BMS[material.name] = (bmesh.new(), material)
    return BMS[material.name][0]

def box(m, cx, cy, z0, sx, sy, h, rot=0.0):
    bm = bm_for(m)
    r = bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, h), verts=r["verts"])
    if rot: bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(rot, 3, 'Z'), verts=r["verts"])
    bmesh.ops.translate(bm, vec=(cx, cy, z0 + h / 2), verts=r["verts"])

def frustum(m, z0, z1, r0, r1, n=4, rot=math.pi / 4, cx=0, cy=0):
    bm = bm_for(m)
    lo = [bm.verts.new((cx + r0 * math.cos(rot + 2 * math.pi * i / n), cy + r0 * math.sin(rot + 2 * math.pi * i / n), z0)) for i in range(n)]
    hi = [bm.verts.new((cx + r1 * math.cos(rot + 2 * math.pi * i / n), cy + r1 * math.sin(rot + 2 * math.pi * i / n), z1)) for i in range(n)]
    for i in range(n): bm.faces.new((lo[i], lo[(i + 1) % n], hi[(i + 1) % n], hi[i]))
    bm.faces.new(lo[::-1]); bm.faces.new(hi)

def square_ring(bm, hx, hy, z, lift, n):
    """n points per side, clockwise from (+hx,+hy); z lifted at the corners by `lift` (curling eave)."""
    pts = []
    corners = [(hx, hy), (-hx, hy), (-hx, -hy), (hx, -hy)]
    for i in range(4):
        a, b = corners[i], corners[(i + 1) % 4]
        for j in range(n):
            t = j / n
            u = abs(2 * t - 1)                       # 1 at the corners, 0 mid-side
            k = max(0.0, (u - 0.55) / 0.45) ** 2     # the kick, concentrated at the ends
            pts.append(bm.verts.new((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z + lift * k)))
    return pts

def loft(bm, r0, r1):
    n = len(r0)
    for i in range(n): bm.faces.new((r0[i], r0[(i + 1) % n], r1[(i + 1) % n], r1[i]))

def hip_roof(m, z0, he, rise, lift, ridge_half, thick=0.14, n=8):
    """Dark tiled roof: eave ring (curling corners) → a mid ring → a short ridge (or a point). Returns the apex z."""
    bm = bm_for(m)
    eave = square_ring(bm, he, he, z0, lift, n)
    mid = square_ring(bm, he * 0.52, he * 0.52, z0 + lift * 0.15 + rise * 0.42, lift * 0.1, n)
    top = square_ring(bm, ridge_half, 0.0, z0 + rise, 0.0, n)
    loft(bm, eave, mid); loft(bm, mid, top)
    bm.faces.new(top[::-1]) if ridge_half > 0 else None
    under = square_ring(bm, he, he, z0 - thick, lift, n)
    loft(bm, under, eave)
    bm.faces.new(under[::-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-4)
    return z0 + rise

def fascia(m, z, he, lift, h, n=8):
    """A board following the eave's curve: two rings, one `h` above the other, each curling up at the corners."""
    bm = bm_for(m)
    lo = square_ring(bm, he, he, z, lift, n); hi_ = square_ring(bm, he, he, z + h, lift, n)
    li = square_ring(bm, he - 0.08, he - 0.08, z, lift, n); hi2 = square_ring(bm, he - 0.08, he - 0.08, z + h, lift, n)
    loft(bm, lo, hi_); loft(bm, hi2, li); loft(bm, hi_, hi2); loft(bm, li, lo)

red = mat("vermilion", RED, 0.55); cream = mat("plaster", CREAM, 0.9); white = mat("white", WHITE, 0.6)
tile = mat("tile", TILE, 0.75); stone = mat("stone", STONE, 0.95); cap = mat("cap", CAP, 0.9)
gilt = mat("gilt", GILT, 0.4, 0.6); dark = mat("dark", DARK, 0.7); bronze = mat("bronze", BRONZE, 0.45, 0.7)
verd = mat("verdigris", VERDIGRIS, 0.6)

# ---------------------------------------------------------------- plinth: battered rubble stone, concrete cap
PLINTH_H = 3.0
frustum(stone, 0.0, PLINTH_H, 3.55 * math.sqrt(2), 2.55 * math.sqrt(2))   # 7.1 m square foot → 5.1 m top
box(cap, 0, 0, PLINTH_H, 5.4, 5.4, 0.22)

# ---------------------------------------------------------------- the storey unit
def railing(z, hd, tier_h=0.95):
    post = 0.11
    n = 4                                                   # bays per side
    for i in range(n + 1):
        t = -hd + 2 * hd * i / n
        for x, y in ((t, hd), (t, -hd), (hd, t), (-hd, t)):
            box(red, x, y, z, post, post, tier_h); box(red, x, y, z + tier_h, post + 0.05, post + 0.05, 0.05)
    for sx, sy, rx, ry in ((1, 0, 0.08, 2 * hd), (-1, 0, 0.08, 2 * hd), (0, 1, 2 * hd, 0.08), (0, -1, 2 * hd, 0.08)):
        x, y = sx * hd, sy * hd
        box(red, x, y, z + tier_h - 0.12, rx, ry, 0.08)        # top rail
        box(white, x, y, z + tier_h - 0.19, rx * 0.98, ry * 0.98, 0.03) if rx > 1 or ry > 1 else None
        box(red, x, y, z + tier_h * 0.5, rx, ry, 0.07)         # mid rail
        box(red, x, y, z + 0.04, rx, ry, 0.07)                 # bottom rail
        m = 14
        for j in range(1, m):
            t = -hd + 2 * hd * j / m
            if abs((t + hd) % (2 * hd / n)) < 0.06 or abs((t + hd) % (2 * hd / n) - 2 * hd / n) < 0.06: continue
            box(red, x if sx else t, y if sy else t, z + 0.1, 0.045, 0.045, tier_h * 0.5 - 0.1)   # lower grid slats
            if j % 2 == 0: box(red, x if sx else t, y if sy else t, z + tier_h * 0.5, 0.05, 0.05, tier_h * 0.5 - 0.12)  # upper balusters
        box(red, x, y, z + tier_h * 0.28, rx if sx else 2 * hd, ry if sy else 0.05 if sx else 0.05, 0.04) if False else None
        box(red, x if sx else 0, y if sy else 0, z + tier_h * 0.28, 0.05 if sx else 2 * hd, 2 * hd if sx else 0.05, 0.04)  # grid's middle bar

def lattice_window(face_sx, face_sy, u, z, w, h, hb):
    """A cusped-arch lattice window on the face (sx,sy) at along-face offset u, from z, w wide, h tall to the arch's foot."""
    d = hb + 0.02
    px, py = (face_sx * d, u) if face_sx else (u, face_sy * d)
    rx, ry = (0.06, w) if face_sx else (w, 0.06)
    box(white, px, py, z, rx, ry, h)
    # cusped top: a pointed arch of three faces, white, over the window's head
    bm = bm_for(white)
    def P(a, zz): return (px + (0 if face_sx else a), py + (a if face_sx else 0), zz)
    pts = [P(-w / 2, z + h), P(w / 2, z + h), P(w / 2, z + h + 0.12), P(w * 0.18, z + h + 0.2), P(0, z + h + 0.34), P(-w * 0.18, z + h + 0.2), P(-w / 2, z + h + 0.12)]
    for off in (-0.035, 0.035):
        vs = [bm.verts.new((p[0] + (off if face_sx else 0), p[1] + (0 if face_sx else off), p[2])) for p in pts]
        bm.faces.new(vs if off > 0 else vs[::-1])
    # frame and lattice bars in vermilion
    fr = 0.05
    for a in (-w / 2, w / 2): box(red, px + (0 if face_sx else a), py + (a if face_sx else 0), z, 0.08 if face_sx else fr, fr if face_sx else 0.08, h + 0.12)
    box(red, px, py, z - 0.02, 0.08 if face_sx else w + fr, w + fr if face_sx else 0.08, fr)
    for a in (-w / 4, 0, w / 4): box(dark, px, py + (a if face_sx else 0) if face_sx else py, z + 0.04, 0.07 if face_sx else 0.025, 0.025 if face_sx else 0.07, h - 0.08) if face_sx else box(dark, px + a, py, z + 0.04, 0.025, 0.07, h - 0.08)
    for k in range(1, 4): box(dark, px, py, z + h * k / 4, 0.07 if face_sx else w - 0.02, w - 0.02 if face_sx else 0.07, 0.025)

def cloud(face_sx, face_sy, u, z, s, hb):
    d = hb + 0.03
    px, py = (face_sx * d, u) if face_sx else (u, face_sy * d)
    box(gilt, px, py, z, 0.04 if face_sx else s, s if face_sx else 0.04, s * 0.45)
    box(gilt, px, py, z + s * 0.45, 0.04 if face_sx else s * 0.55, s * 0.55 if face_sx else 0.04, s * 0.25)

def storey(z, s):
    """One storey from its deck's top at z; returns the z of its roof's apex and the next deck's z."""
    k = 0.95 ** s
    ground = s == 0
    hb = 1.55 * k                       # body half-width
    hd = 2.25 * k                       # deck / railing half-width
    he = 3.3 * k                        # eave half-width
    body_h = 2.7 if ground else 1.05
    rail_h = 0.95 if ground else 0.72
    # deck slab and the railing on it
    box(red, 0, 0, z - 0.22, 2 * hd + 0.1, 2 * hd + 0.1, 0.22)
    box(white, 0, 0, z - 0.15, 2 * hd + 0.12, 2 * hd + 0.12, 0.04)   # the deck's white stripe
    railing(z, hd - 0.06, rail_h)
    # body
    box(cream if ground else red, 0, 0, z, 2 * hb, 2 * hb, body_h)
    for x, y in ((hb, hb), (-hb, hb), (-hb, -hb), (hb, -hb)): box(red, x, y, z, 0.2, 0.2, body_h)
    for sx, sy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        rx, ry = (0.1, 2 * hb + 0.1) if sx else (2 * hb + 0.1, 0.1)
        x, y = sx * hb, sy * hb
        box(red, x, y, z, rx, ry, 0.14)                                   # sill
        box(red, x, y, z + body_h - 0.16, rx, ry, 0.16)                   # head beam
        if ground:
            for a in (-hb * 0.34, hb * 0.34):                             # bay posts
                box(red, x if sx else a, y if sy else a, z, 0.12 if sx else 0.12, 0.12, body_h)
            for a in (-hb * 0.67, hb * 0.67):                             # cusped lattice windows in the side bays
                lattice_window(sx, sy, a, z + 0.95, 0.5, 1.0, hb)
            box(white, x + (sx * 0.02), y + (sy * 0.02), z + 0.14, 0.05 if sx else 0.78, 0.78 if sx else 0.05, body_h - 0.45)   # door
            box(red, x + (sx * 0.03), y + (sy * 0.03), z + 0.14 + (body_h - 0.45) * 0.5, 0.04 if sx else 0.8, 0.8 if sx else 0.04, 0.05)
            cloud(sx, sy, 0, z + body_h - 0.7, 0.42, hb)
        else:
            box(cream, x + sx * 0.01, y + sy * 0.01, z + 0.5, 0.05 if sx else 2 * hb - 0.3, 2 * hb - 0.3 if sx else 0.05, body_h - 0.66)   # cream band over the railing
            box(dark, x + sx * 0.03, y + sy * 0.03, z + 0.56, 0.04 if sx else 0.42, 0.42 if sx else 0.04, body_h - 0.78)        # vent
            for j in range(-1, 2): box(red, x + sx * 0.05, y + sy * 0.05, z + 0.35, 0.04 if sx else 0.04, 0.04, body_h - 0.8) if False else None
            for a in (-hb * 0.55, hb * 0.55): cloud(sx, sy, a, z + 0.56, 0.3, hb)
    # the eave: bracket beam on the posts, two tiers of rafters, the corner beams, bosses, bells
    zb = z + body_h
    box(red, 0, 0, zb, 2 * hb + 0.55, 2 * hb + 0.55, 0.22)             # bracket plate
    for x, y in ((hb, hb), (-hb, hb), (-hb, -hb), (hb, -hb)):           # corner bracket blocks
        box(red, x * 1.12, y * 1.12, zb - 0.3, 0.42, 0.42, 0.3)
    for tier, (zt, reach, depth) in enumerate(((zb + 0.22, he - 0.12, 0.09), (zb + 0.45, he - 0.42, 0.08))):
        mcount = 10
        for i in range(mcount + 1):
            t = -hb + 2 * hb * i / mcount
            for sx, sy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ln = reach - hb * 0.9
                cx = sx * (hb * 0.9 + ln / 2) if sx else t
                cy = sy * (hb * 0.9 + ln / 2) if sy else t
                box(red, cx, cy, zt, ln if sx else depth, depth if sx else ln, depth)
        # fan rafters at the corners
        for sx, sy in ((1, 1), (-1, 1), (-1, -1), (1, -1)):
            for j in range(1, 4):
                a = math.atan2(sy, sx) + (j - 2) * 0.2
                ln = (reach - hb * 0.9) * 1.25
                cx = sx * hb * 0.92 + math.cos(a) * ln / 2; cy = sy * hb * 0.92 + math.sin(a) * ln / 2
                box(red, cx, cy, zt + 0.02 * abs(j - 3), ln, depth, depth, rot=a)
    # fascia: a thin red board with white bosses; the corner beam that kicks up, and the bell
    zf = zb + 0.56
    lift = 0.55 * k
    fascia(red, zf, he - 0.04, lift, 0.2)
    for sx, sy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        x, y = sx * (he - 0.05), sy * (he - 0.05)
        nb = 14
        for i in range(nb + 1):
            t = -he + 0.25 + (2 * he - 0.5) * i / nb
            u = abs(t) / he
            kick = lift * max(0.0, (u - 0.55) / 0.45) ** 2
            box(white, x + sx * 0.05, y + sy * 0.05, zf + 0.06 + kick, 0.07, 0.07, 0.07)
    for sx, sy in ((1, 1), (-1, 1), (-1, -1), (1, -1)):
        a = math.atan2(sy, sx)
        ln = (he - hb) * 1.45
        cx = sx * hb + math.cos(a) * ln / 2; cy = sy * hb + math.sin(a) * ln / 2
        bm = bm_for(red); r = bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(ln, 0.16, 0.16), verts=r["verts"])
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(-math.atan2(lift * 1.2, ln), 3, 'Y'), verts=r["verts"])
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=__import__("mathutils").Matrix.Rotation(a, 3, 'Z'), verts=r["verts"])
        bmesh.ops.translate(bm, vec=(cx, cy, zf + 0.2 + lift * 0.5), verts=r["verts"])
        # wind bell under the corner
        bx, by = sx * (he - 0.35), sy * (he - 0.35)
        box(bronze, bx, by, zf - 0.32, 0.02, 0.02, 0.32)
        frustum(bronze, zf - 0.5, zf - 0.32, 0.12, 0.05, n=6, rot=0, cx=bx, cy=by)
    # roof
    z_roof = zf + 0.2
    if s < 4:
        apex = hip_roof(tile, z_roof, he, 1.3 * k, lift, 0.5 * k)
        box(tile, 0, 0, apex - 0.02, 1.0 * k + 0.3, 0.22, 0.12)          # ridge
        return apex, apex - 0.55 * k + 0.22                                 # next deck sits into the roof
    apex = hip_roof(tile, z_roof, he, 1.6 * k, lift, 0.0)
    return apex, apex

z = PLINTH_H + 0.22
for s in range(5):
    apex, z = storey(z, s)

# ---------------------------------------------------------------- the cupola, the cap and the sōrin
box(cap, 0, 0, apex - 0.45, 0.85, 0.85, 0.75)                               # the little square cupola with its vents
for sx, sy in ((1, 0), (-1, 0), (0, 1), (0, -1)): box(dark, sx * 0.43, sy * 0.43, apex - 0.1, 0.03 if sx else 0.3, 0.3 if sx else 0.03, 0.3, rot=0)
box(tile, 0, 0, apex + 0.3, 1.1, 1.1, 0.1)
zt = apex + 0.38
frustum(verd, zt, zt + 0.35, 0.62, 0.45, n=8, rot=0); frustum(verd, zt + 0.35, zt + 0.55, 0.45, 0.18, n=8, rot=0)
frustum(bronze, zt + 0.5, zt + 5.6, 0.10, 0.06, n=8, rot=0)                 # mast
for i in range(11):                                                          # rings
    z0 = zt + 0.85 + i * 0.4
    frustum(bronze, z0, z0 + 0.1, 0.32 - i * 0.017, 0.32 - i * 0.017, n=8, rot=0)
frustum(bronze, zt + 5.6, zt + 5.95, 0.16, 0.03, n=8, rot=0)                 # flame
frustum(gilt, zt + 5.95, zt + 6.2, 0.11, 0.11, n=8, rot=0)                   # jewel

# ---------------------------------------------------------------- finish: one object, consistent normals, export
for name, (bm, m) in BMS.items():
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(m)
    ob = bpy.data.objects.new(name, me); coll.objects.link(ob); parts.append(ob)
for ob in parts: ob.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
root = bpy.context.active_object; root.name = "tea_garden_pagoda"
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.object.mode_set(mode='OBJECT')
tris = sum(len(p.vertices) - 2 for p in root.data.polygons)
hi = max(v.co.z for v in root.data.vertices)
print(f"triangles: {tris}, height: {hi:.2f} m, top roof apex {apex:.2f} m")

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if argv:
    bpy.ops.export_scene.gltf(filepath=argv[0], export_format='GLB', export_yup=True, export_apply=True)
if len(argv) > 1:
    sc = bpy.context.scene; sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = -0.9
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN')); coll.objects.link(sun)
    sun.data.energy = 2.2; sun.rotation_euler = (math.radians(45), math.radians(15), math.radians(-50))
    sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True
    sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.55, 0.68, 0.85, 1)
    sc.world.node_tree.nodes["Background"].inputs[1].default_value = 0.5
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); coll.objects.link(cam); sc.camera = cam
    mid = hi / 2
    # three-quarter from a little below the middle, as the owner's photographs
    sc.render.resolution_x, sc.render.resolution_y = 900, 1500
    d = hi * 1.55; ang = math.radians(32)
    cam.location = (d * math.sin(ang), -d * math.cos(ang), mid * 0.75); cam.data.lens = 40
    cam.rotation_euler = (math.radians(90) - math.atan2(mid * 0.75 - mid, d) * 0.6 - math.radians(1), 0, ang)
    sc.render.filepath = os.path.join(argv[1], "persp.png"); bpy.ops.render.render(write_still=True)
    # orthographic elevation for measuring against the photographs
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = hi * 1.08
    cam.location = (0, -60, mid); cam.rotation_euler = (math.radians(90), 0, 0)
    sc.render.filepath = os.path.join(argv[1], "elev.png"); bpy.ops.render.render(write_still=True)
