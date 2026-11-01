"""Philharmonie de Paris (Nouvel, 2015) as one low-poly textured GLB. One function per part, each its own object.

  blender -b -P tools/blender/philharmonie.py -- --parts=podium,inner,front,waves,slab,canopy --render=DIR --tag=x [--px=420]
  blender -b -P tools/blender/philharmonie.py -- --export=public/models/paris/philharmonie.glb

Working frame while modelling: Blender X = east, Y = north, Z = up, metres, from C below (the bake's local frame less C).
Traced from OSM way/21502894 and IGN's orthophoto (roof positions); heights from the owner's views. The blade runs along
the SOUTH edge of the outline (the orthophoto), leaning north over the roof; seen from the park (W) it is at the right.
Export turns the model into the frame fitSnug(ring, FRONT) gives the loader (src/render/landmarks.ts).
Shell facets are hard-creased planes on the owner's instruction: no subdivision, every fold a flat-shaded edge.
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector

RING = [4497.75,3519.87,4509.38,3439.46,4517.13,3408.21,4531.93,3410.66,4536.91,3411.82,4551.08,3417.04,4565.46,3422.6,
        4599.57,3435.48,4611.28,3439.91,4602.09,3443.27,4602.88,3469.44,4602.32,3481.21,4599.07,3514.39,4596.74,3531.57,
        4593.66,3525.51,4589.1,3552.51,4594.34,3556.95,4587.76,3585.72,4559.99,3568.39]
RING = [(RING[i], RING[i + 1]) for i in range(0, len(RING), 2)]
C = (4555.0, 3497.0)
FRONT = 260.0
OUT = [(x - C[0], y - C[1]) for x, y in RING]

# atlas bands, in v: one texture, one material
TILE = (0.0, 0.74); CONC = (0.76, 0.84); VOID = (0.86, 0.90); GLASS = (0.92, 0.95); SOLAR = (0.97, 0.995)
TILE_W, TILE_H = 120.0, 88.8     # metres the tile band spans
PALE_TOP = 55.0                  # metres of the band that hold the pale gradient; the dark band is above
DARK = "dark"
GRAD = 27.0                      # metres over which the tile gradient goes from near black to pale
rng = np.random.default_rng(7)

def noise(h, w, cells):
    g = rng.random((cells + 2, cells + 2))
    ys, xs = np.linspace(0, cells, h), np.linspace(0, cells, w)
    y0, x0 = ys.astype(int), xs.astype(int)
    fy, fx = (ys - y0)[:, None], (xs - x0)[None, :]
    fy, fx = fy * fy * (3 - 2 * fy), fx * fx * (3 - 2 * fx)
    a = g[np.ix_(y0, x0)]; b = g[np.ix_(y0, x0 + 1)]; c = g[np.ix_(y0 + 1, x0)]; d = g[np.ix_(y0 + 1, x0 + 1)]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy

def tile_texture(size=1024):
    """Slanted tile-sized flecks on a diagonal lattice, not squares: the pale band (a facet's lower edge near black, going
    pale over GRAD metres) and above it the dark band (mostly near black with pale flecks, for the slab)."""
    a = np.zeros((size, size, 4), float); a[..., 3] = 1
    tb = int(TILE[1] * size); pb = int(PALE_TOP / TILE_W * size)
    ppm = size / TILE_W
    yy, xx = np.mgrid[0:tb, 0:size].astype(float)
    # sheared lattice: rows run on a slant, so marks line up the way the cladding's do
    ua = (xx + 0.55 * yy) / 3.0; ub = (yy - 0.25 * xx) / 1.4
    ib = np.floor(ub).astype(int); ia = np.floor(ua + 0.5 * (ib % 2)).astype(int)
    h = 1024
    R2 = rng.random((h, h)); shade = R2[ib % h, ia % h]
    N = noise(h, h, 10)
    st = N[((yy + 0.25 * xx) / 3).astype(int) % h, ((xx - 1.8 * yy) / 8).astype(int) % h]
    st = (st - st.min()) / (st.max() - st.min())
    ramp = np.clip(yy / ppm / GRAD, 0, 1)
    # a broad fade, one tone at a time: flecks only a little either side of it, a few glints (no env map, metallic 0)
    tone = 0.09 + 0.60 * (ramp * ramp * (3 - 2 * ramp))
    tone = np.where(yy >= pb, 0.62 - 0.46 * np.clip((yy - pb) / ppm / 33.0, 0, 1), tone)
    v = tone + 0.10 * (st - .5) + 0.14 * (shade - .5)
    v = np.where(shade > .965, np.minimum(tone + .28, .95), v)
    a[:tb, :, 0] = v * 0.96; a[:tb, :, 1] = v * 0.99; a[:tb, :, 2] = v * 1.04
    def band(b, f):
        y0, y1 = int((b[0] - .01) * size), int((b[1] + .01) * size)
        a[y0:y1, :, :3] = f(y1 - y0)
    band(CONC, lambda h: (0.40 + 0.07 * noise(h, size, 60))[..., None] * np.array([1.0, .99, .96]))
    band(VOID, lambda h: np.array([.012, .014, .018]))
    def metal(h):
        tone = np.linspace(.06, 1.0, size)[None, :] ** 1.5
        warm = np.linspace(0, 1, h)[:, None]
        return np.stack([tone * (.95 + .05 * warm), tone * (.97 - .10 * warm), tone * (1.0 - .32 * warm)], axis=-1)
    band(GLASS, metal)
    band(SOLAR, lambda h: np.array([.03, .05, .11]))
    a = np.clip(a, 0, 1)
    img = bpy.data.images.new("philharmonie", size, size, alpha=False)
    img.colorspace_settings.name = 'sRGB'
    img.pixels.foreach_set(a.ravel().astype(np.float32))
    return img

METAL = 0.0
IMG = None
def material():
    global IMG
    m = bpy.data.materials.get("philharmonie")
    if m: return m
    IMG = tile_texture()
    m = bpy.data.materials.new("philharmonie"); m.use_nodes = True
    n = m.node_tree.nodes; b = n["Principled BSDF"]
    t = n.new("ShaderNodeTexImage"); t.image = IMG
    m.node_tree.links.new(t.outputs[0], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.55; b.inputs["Metallic"].default_value = METAL
    return m

class Part:
    def __init__(self, name):
        self.name = name; self.bm = bmesh.new(); self.uv = self.bm.loops.layers.uv.new("UV")
    def frame(self, pts, band=TILE, d=0.05):
        """A facet's planar UV mapping at true scale; children of a folded facet share it, so no seams show."""
        pts = [Vector(p) for p in pts]
        n = Vector((0, 0, 0))
        for i, p in enumerate(pts):
            q = pts[(i + 1) % len(pts)]
            n += Vector(((p.y - q.y) * (p.z + q.z), (p.z - q.z) * (p.x + q.x), (p.x - q.x) * (p.y + q.y)))
        n = n.normalized() if n.length else Vector((0, 0, 1))
        up = Vector((0, 0, 1)) - n * n.z
        if up.length < 0.05: up = Vector((0, -1, 0))
        up.normalize(); side = up.cross(n)
        us = [side.dot(p) for p in pts]; vs = [up.dot(p) for p in pts]
        u0, v0, u1, v1 = min(us), min(vs), max(us), max(vs)
        if band in (TILE, DARK):
            top = PALE_TOP if band == TILE else TILE_H
            base = 0.0 if band == TILE else PALE_TOP
            start = base + (min(d * GRAD, max(0.0, top - base - (v1 - v0) - .5)) if band == TILE else 0.0)
            off = float(rng.random()) * max(0.0, TILE_W - (u1 - u0) - 0.5)
            return lambda q: ((side.dot(q) - u0 + off) / TILE_W, (up.dot(q) - v0 + start) / TILE_W)
        mid = (band[0] + band[1]) / 2; span = (band[1] - band[0]) * .8
        return lambda q: (((side.dot(q) - u0) % 200) / 200 * .98 + .01, mid + ((up.dot(q) - v0) / max(1e-3, v1 - v0) - .5) * span)
    def face(self, pts, band=None, d=0.05, uvf=None):
        pts = [Vector(p) for p in pts]
        uvf = uvf or self.frame(pts, band or TILE, d)
        f = self.bm.faces.new([self.bm.verts.new(p) for p in pts])
        for l, q in zip(f.loops, pts): l[self.uv].uv = uvf(q)
        return f
    def prism(self, ring, zlo, ztop, band=CONC, d=0.3):
        """ring (x, y) anticlockwise; ztop a function of (x, y) or a number. Sides and a top, no bottom."""
        tz = ztop if callable(ztop) else (lambda x, y: ztop)
        lz = zlo if callable(zlo) else (lambda x, y: zlo)
        n = len(ring)
        for i in range(n):
            a, b = ring[i], ring[(i + 1) % n]
            self.face([(*a, lz(*a)), (*b, lz(*b)), (*b, tz(*b)), (*a, tz(*a))], band, d)
        self.face([(*p, tz(*p)) for p in ring], band, d)
    def finish(self):
        me = bpy.data.meshes.new(self.name); self.bm.normal_update()
        bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        self.bm.to_mesh(me); self.bm.free()
        ob = bpy.data.objects.new(self.name, me); bpy.context.scene.collection.objects.link(ob)
        me.materials.append(material())
        for q in me.polygons: q.use_smooth = getattr(self, "smooth", False)
        return ob

def ccw(r):
    return r if sum(r[i][0] * r[(i + 1) % len(r)][1] - r[(i + 1) % len(r)][0] * r[i][1] for i in range(len(r))) > 0 else r[::-1]
def scaled(r, s, c=(8, -8)):
    return [(c[0] + (x - c[0]) * s, c[1] + (y - c[1]) * s) for x, y in r]

# the shell's cage: eave (clockwise from the north tip), summit, the north ridge point
E = [(30, 74, 17), (46, 20, 26), (50, -40, 27), (-10, -62, 24), (-42, -40, 28), (-52, -2, 27), (-36, 30, 21)]
S = [(-26, -12, 38), (-10, 6, 39.5), (24, 0, 39.5), (38, -32, 38), (-10, -54, 37)]   # the section: roof 36-39.5 over the south ground
R = (14, 40, 30)
W = [(x * .74 + 3, y * .74 - 3, 8 if i not in (0,) else 5) for i, (x, y, z) in enumerate(E)]   # the waist under the eave

def slab(p, a, b, h, t, out, band=TILE, d=0.6):
    """A thin separate slab with visible thickness: from a to b, h tall, t thick outward along out (x, y)."""
    a, b = Vector(a), Vector(b); up = Vector((0, 0, h)); o = Vector((out[0], out[1], 0)).normalized() * t
    f = [a, b, b + up, a + up]; g = [v + o for v in f]
    p.face(g, band, d)
    p.face(f[::-1], band, d)
    for i in range(4):
        j = (i + 1) % 4
        p.face([f[i], f[j], g[j], g[i]], band, d)

# The owner's breakdown, built in this order, each its own object: podium; A inner; B front; waves; C slab; D canopy.
PODIUM = 9.0      # the section says about 13 over the south ground; lowered on the owner's word that the walls looked heavy

def part_podium():
    """Flat paved top, everything stands on it; the straight paved ramp rising north from the south plaza (orthophoto,
    visitors' map) under the slab's cantilever to the front; a lesser ramp up the north-west flank."""
    p = Part("podium")
    p.prism(ccw(OUT), 0, PODIUM)
    def ramp(a, b, w, za, zb):
        dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy); nx, ny = -dy / L * w / 2, dx / L * w / 2
        q = [(a[0] + nx, a[1] + ny), (a[0] - nx, a[1] - ny), (b[0] - nx, b[1] - ny), (b[0] + nx, b[1] + ny)]
        zf = lambda x, y: za + (zb - za) * (((x - a[0]) * dx + (y - a[1]) * dy) / (L * L))
        p.prism(ccw(q), 0, zf)
        return q
    # the owner: from one start, the upper ramp rises straight, turns left and climbs along the eye's lower lip, right to
    # left, to the entrance at the eye's lower left; the lower runs on to a glazed entrance under it; a stone wall between
    ax_pt = lambda sv, ac: SLAB_A + SLAB_AX * sv + SLAB_N * ac
    q = ramp((48, -160), (48, -60), 20, 0.5, PODIUM + .4)
    t0, t1 = ax_pt(100, 4), ax_pt(8, 4)
    ramp((t0.x, t0.y), (t1.x, t1.y), 8.5, PODIUM + .4, PODIUM + 2.6)     # turning left, along under the hole
    # stone-clad parapets: the outer side of the straight run and the turn, and the wall between the two ramps
    for u, v, zu, zv in (((58.2, -160), (58.2, -60), .5, PODIUM + .4),
                         (tuple(ax_pt(100, -.3))[:2], tuple(ax_pt(8, -.3))[:2], PODIUM + .4, PODIUM + 2.6)):
        slab(p, (*u, zu), (*v, zv), 1.2, .5, (1, 0), TILE, .8)
    p.prism(ccw([(21, -160), (37.6, -160), (37.6, -71), (21, -76)]), 0, lambda x, y: .15 + .3 * (y + 160) / 90)   # the lower
    slab(p, (37.6, -160, 0), (37.6, -71, 0), 1.4, .8, (1, 0), TILE, .8)
    slab(p, (37.6, -105, 1.4), (37.6, -71, 1.4), PODIUM - 1.0, .8, (1, 0), TILE, .8)  # the wall rises with the upper ramp
    e0, e1 = ax_pt(62, -.5), ax_pt(79, -.5)
    p.face([(e0.x, e0.y, .4), (e1.x, e1.y, .4), (e1.x, e1.y, PODIUM - .4), (e0.x, e0.y, PODIUM - .4)], VOID)      # glazed entrance
    ramp((30, 84), (-50, 28), 9, 7, PODIUM)
    return p

# ---- A. the conventional building inside, only where it shows at the back (park) and sides
def part_inner():
    p = Part("inner")
    p.prism(scaled(ccw(OUT), .84), PODIUM - 1, 13.0)
    A, B = (-53, -44), (-40, 34)
    out = (-1, -0.16)
    for z0, h in ((13.5, 3.4), (20.5, 3.2)):
        slab(p, (*A, z0 + 7), (*B, z0 - 2 + 3), h, 1.2, out, TILE, .85)
    gl = Vector((1, .16, 0)).normalized() * 1.0
    p.face([Vector((*A, 20.9)) + gl, Vector((*B, 14.9)) + gl, Vector((*B, 21.5)) + gl, Vector((*A, 27.5)) + gl], VOID)
    slab(p, (-44, 22, 24.5), (-36, -62, 38), 1.0, 4, (1, .1), CONC)        # the terrace ramp, rising south
    return p

def chain(p, pts, h, t, out, band=TILE, d=.7):
    """A band with real thickness along a polyline: slab() piece by piece, sharing one UV frame."""
    o = Vector((out[0], out[1], 0)).normalized() * t; up = Vector((0, 0, h))
    P = [Vector(q) for q in pts]
    uv = p.frame([P[0], P[-1], P[-1] + up, P[0] + up], band, d)
    for a, b in zip(P, P[1:]):
        p.face([a + o, b + o, b + o + up, a + o + up], band, d, uv)   # the face
        p.face([a, a + o, b + o, b], band, d)                         # underside, its own mapping: nothing stretched
        p.face([a + up, b + up, b + o + up, a + o + up], band, d)     # top

# the eye's lens on the street front, between E[1] and E[2]
EYE_N = 18
# The eye sits under the slab, facing south up the ramp (the owner's front photos): its frame runs along the slab's axis.
SLAB_A, SLAB_B = Vector((-38.0, -89.0, 0)), Vector((56.0, -57.0, 0))
SLAB_AX = (SLAB_B - SLAB_A).normalized(); SLAB_N = Vector((-SLAB_AX.y, SLAB_AX.x, 0)); SLAB_L = (SLAB_B - SLAB_A).length
UNDER = 28.0
def lean_at(z): return 11.0 * (1 - z / 52)      # the slab leans OUT, south: its top on OSM's edge, its foot further in
S0_, S1_ = .20 * SLAB_L, SLAB_L + 8
def eave_z(u): return UNDER
def eye_at(u, z, back=0.0):
    return SLAB_A + SLAB_AX * (S0_ + (S1_ - S0_) * u) + SLAB_N * (lean_at(z) + back) + Vector((0, 0, z))
EYE_U0, EYE_U1 = .02, .98
def _t(u): return max(0.0, min(1.0, (u - EYE_U0) / (EYE_U1 - EYE_U0)))
def eye_mid(u): return 17.0 + .8 * (_t(u) - .5)
def eye_top(u):
    t = _t(u); return min(UNDER - .9, eye_mid(u) + 9.8 * math.sin(math.pi * t ** .8))
def eye_bot(u):
    t = _t(u); return max(PODIUM + .2, eye_mid(u) - 7.2 * math.sin(math.pi * t ** 1.3))

# the hole, traced from the owner's photo: (metres along the slab's axis, z). Straight edges, hard corners.
HOLE = [(12, 12.5), (30, 29), (49, 32), (75, 26.5), (92, 18), (73, 13)]     # A B C D E(point) F
def under_z(sv):
    return 33.0 if sv < 54 else 33.0 - 6.0 * (sv - 54) / 59
def wall_pt(sv, z, back=0.0):
    return SLAB_A + SLAB_AX * sv + SLAB_N * (lean_at(z) + back) + Vector((0, 0, z))
def hole_bounds(sv):
    def lerp(pts):
        for (a, za), (b, zb) in zip(pts, pts[1:]):
            if a <= sv <= b: return za + (zb - za) * (sv - a) / (b - a)
        return pts[-1][1]
    top = HOLE[:5]; bot = [HOLE[0], HOLE[5], HOLE[4]]
    return lerp(bot), lerp(top)

# ---- B. the metal front under the slab: tile round the angular hole, a thick jutting ledge, dark inside
def part_front():
    p = Part("front")
    OUT_ = (-SLAB_N.x, -SLAB_N.y)
    L0, L1 = 8.0, SLAB_L + 8
    W_ = lambda sv, z: wall_pt(sv, z)
    fr = p.frame([W_(L0, PODIUM), W_(L1, PODIUM), W_(L1, 33), W_(L0, 33)], TILE, .8)
    # round the hole: each hole edge joined to the outer frame by flat tile panels
    outer = [(L0, PODIUM), (L0, under_z(L0)), (30, under_z(30)), (49, under_z(49)), (75, under_z(75)), (L1, under_z(L1)), (L1, PODIUM), (73, PODIUM)]
    inner = [HOLE[0], HOLE[0], HOLE[1], HOLE[2], HOLE[3], HOLE[4], HOLE[4], HOLE[5]]
    n = len(outer)
    for i in range(n):
        j = (i + 1) % n
        q = [W_(*outer[i]), W_(*outer[j]), W_(*inner[j]), W_(*inner[i])]
        if inner[i] == inner[j]: q = [W_(*outer[i]), W_(*outer[j]), W_(*inner[i])]
        p.face(q, TILE, .8, fr)
    # the dark inside
    bk = 10.0
    p.face([wall_pt(L0, PODIUM, bk), wall_pt(L1, PODIUM, bk), wall_pt(L1, 33, bk), wall_pt(L0, 33, bk)], VOID)
    for (a, za), (b, zb) in zip(HOLE, HOLE[1:] + HOLE[:1]):
        p.face([wall_pt(a, za), wall_pt(b, zb), wall_pt(b, zb, bk), wall_pt(a, za, bk)], VOID)
    # the ledge above: thick, real depth, stepped; a lesser one along the lower edge
    top = [wall_pt(a, z) for a, z in HOLE[:5]]
    def ledge(pts, h, t):
        o = Vector((OUT_[0], OUT_[1], 0)).normalized() * t; up = Vector((0, 0, h))
        for u, v in zip(pts, pts[1:]):
            p.face([u + o, v + o, v + o + up, u + o + up], TILE, .9)
            p.face([u, u + o, v + o, v], TILE, .3)
            p.face([u + up, v + up, v + o + up, u + o + up], TILE, .9)
        for u, sgn in ((pts[0], 1), (pts[-1], -1)):
            p.face([u, u + o, u + o + up, u + up][::sgn], TILE, .9)
    ledge(top, 1.6, 6.0)
    ledge([v + Vector((0, 0, 1.6)) for v in top[:4]], .9, 3.2)
    ledge([wall_pt(a, z - .9) for a, z in (HOLE[0], HOLE[5], HOLE[4])], .9, 2.5)
    # the X, on the street side under the eave (the side photo): clean thin slabs, one proud of the other
    n = Vector((1, .07, 0)).normalized()
    A, B = Vector(E[1][:2] + (0,)), Vector(E[2][:2] + (0,))
    B = A.lerp(B, .92)
    for off, z0, z1 in ((.3, PODIUM + .5, 24), (2.0, 24.5, PODIUM + .5)):
        slab(p, A + n * off + Vector((0, 0, z0)), B + n * off + Vector((0, 0, z1)), 1.6, .6, (n.x, n.y), TILE, .8)
    return p

# ---- the waves: a real sheet of long horizontal metal ridges bulging toward the viewer, set back in the hole
RIDGES = 3
def part_waves():
    p = Part("waves"); p.smooth = True
    s0, s1 = HOLE[0][0] + .5, HOLE[4][0] - .5
    cols, rows = 24, RIDGES * 12
    def bulge(i, j):
        """0..1 height of the ridge at this point: troughs 0, tops 1, each ridge with its own swell and taper."""
        u = i / cols; v = j / rows
        phase = v * RIDGES + .25 * math.sin(u * 5)                      # the ridges wander a little along their length
        k = int(phase) % RIDGES
        crest = math.sin(math.pi * (phase % 1.0)) ** 1.2
        c0 = .05 + .05 * k; c1 = 1.0 - .03 * k                           # where this ridge starts and dies out
        t = max(0.0, min(1.0, (u - c0 * .6) / max(.05, c1 - c0 * .6)))
        return crest * math.sin(math.pi * t) ** .35
    def pt(i, j):
        u = i / cols; v = j / rows
        sv = s0 + (s1 - s0) * u
        lo, hi = hole_bounds(sv)
        z = lo + (hi - lo) * v
        return wall_pt(sv, z, 9.0 - 8.0 * bulge(i, j))
    for i in range(cols):
        for j in range(rows):
            idx = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
            f = p.bm.faces.new([p.bm.verts.new(pt(*c)) for c in idx])
            for l, (a, b) in zip(f.loops, idx):
                # u is the tone (silver on the tops, dark in the troughs), v the warmth (warmer toward the top)
                l[p.uv].uv = (.02 + .96 * bulge(a, b) ** .45, GLASS[0] + (GLASS[1] - GLASS[0]) * (.1 + .8 * b / rows))
    return p

# ---- C. the slab: leaning out over its foot at the park end, flat underside, cantilevered over the street end
def part_slab():
    p = Part("slab")
    a, ax, n, L = SLAB_A, SLAB_AX, SLAB_N, SLAB_L
    def P(s, z, across):
        return a + ax * s + n * (across + lean_at(z)) + Vector((0, 0, z))
    # a narrow leg at the park end, then the flat underside over the eye, out past the street end
    prof = [(4, 0), (.16 * L, 0), (.17 * L, 26), (.20 * L, 33), (54, 33), (L + 14, 27), (L + 14, 52), (-9, 49)]
    T = lambda s: 4.5 + 2.5 * max(0, s - .5 * L) / (.5 * L + 14)
    S0 = [P(s, z, 0) for s, z in prof]
    S1 = [P(s, z, T(s)) for s, z in prof]
    # each long side in two pieces at z = 26, so neither outgrows the dark band and nothing is stretched
    def sides(across, rev):
        s26w = 4 - 13 * 26 / 49; e = L + 14
        for prf in ([(4, 0), (.16 * L, 0), (.17 * L, 26), (s26w, 26)], [(s26w, 26), (.17 * L, 26), (.20 * L, 33), (54, 33), (e, 27), (e, 52), (-9, 49)]):
            q = [P(s, z, across(s)) for s, z in prf]
            p.face(q[::-1] if rev else q, DARK)
    sides(lambda s: 0, False); sides(T, True)
    k = len(prof)
    for i in range(k):
        j = (i + 1) % k
        p.face([S0[i], S0[j], S1[j], S1[i]], DARK)
    top = [S0[k - 2], S0[k - 1], S1[k - 1], S1[k - 2]]
    p.face([Vector(top[i]).lerp(Vector(top[(i + 2) % 4]), .05) + Vector((0, 0, .15)) for i in range(4)], SOLAR)
    return p

# ---- D. the canopy over A and B, clear of the slab, hard folded planes, down to the ground at the back right corner
GROUND_CORNER = (-47, -63, 0)
FOLDS = 0
def part_canopy():
    p = Part("canopy")
    e, s, G = E, S, GROUND_CORNER
    facets = [([e[0], e[1], R], 0.0), ([e[0], R, e[6]], 0.0), ([e[6], R, s[1]], .15), ([R, s[2], s[1]], .45), ([R, e[1], s[2]], .1),
              ([e[1], s[3], s[2]], .2), ([e[1], e[2], s[3]], .1), ([e[2], s[4], s[3]], .25), ([e[2], e[3], s[4]], .1),
              ([e[3], e[4], s[4]], .2), ([e[4], s[0], s[4]], .3), ([e[4], e[5], s[0]], .25), ([e[5], e[6], s[0]], .25),
              ([e[6], s[1], s[0]], .3)]
    eave = {tuple(v) for v in e}
    mids = {}
    fold_rng = np.random.default_rng(11)
    def mid(a, b, lvl):
        """An edge's midpoint, nudged once for both facets that share it; creases, so flat shading shows them."""
        k = tuple(sorted((tuple(a), tuple(b))))
        if k not in mids:
            m = (Vector(a) + Vector(b)) / 2
            L = (Vector(a) - Vector(b)).length
            if not (tuple(a) in eave and tuple(b) in eave):
                m.z += float(fold_rng.uniform(-1, 1)) * L * (.055 if lvl >= 3 else .018 if lvl == 2 else .006)
            mids[k] = tuple(m)
        return mids[k]
    def fold(t, lvl, uv, band, d):
        if lvl == 0:
            p.face(t, band, d, uv); return
        a, b, c = t; ab, bc, ca = mid(a, b, lvl), mid(b, c, lvl), mid(c, a, lvl)
        for q in ((a, ab, ca), (ab, b, bc), (ca, bc, c), (ab, bc, ca)): fold(q, lvl - 1, uv, band, d)
    for f, d in facets:
        fold([tuple(v) for v in f], FOLDS, p.frame(f, TILE, d), TILE, d)
    # the summit, a nearly flat polygon, gently folded from its middle
    p.face(list(s), TILE, 1.0)
    # the corner coming to the ground: a curved fold, rows swept from the eave edge E[3]..E[5] down to the point
    A, M, B = Vector(e[3]), Vector(e[4]), Vector(e[5]); Gv = Vector(G)
    rows, cols = 3, 2
    def surf(i, j):
        t = j / cols; x = i / rows
        top = (A.lerp(M, t * 2) if t < .5 else M.lerp(B, t * 2 - 1))
        q = top.lerp(Gv, x ** 1.0)
        q.z = top.z * (1 - x) ** 1.8                    # the curve: steepening as it comes down
        sag = 2.2 * math.sin(math.pi * x) * (1 - x)
        q += Vector((-sag * .6, -sag * .6, 0)) * (1 - abs(t - .5) * 2)
        return q
    uv = p.frame([A, B, Gv], TILE, .3)
    for i in range(rows):
        for j in range(cols):
            a, b, c, dd = surf(i, j), surf(i, j + 1), surf(i + 1, j + 1), surf(i + 1, j)
            p.face([a, b, c], TILE, .3, uv); p.face([a, c, dd], TILE, .3, uv)
    n = len(E)
    for i in range(n):
        j = (i + 1) % n
        p.face([E[i], E[j], W[j], W[i]], TILE, 1.0 if i in (4, 5) else 0.02)
    return p

PARTS = {"podium": part_podium, "inner": part_inner, "front": part_front, "waves": part_waves, "slab": part_slab, "canopy": part_canopy}

# ---- 5. the tile surface is tile_texture() above, one material on every part

def arg(name, dflt=None):
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    for x in a:
        if x.startswith(f"--{name}="): return x.split("=", 1)[1]
    return dflt

# looking bearing, elevation, distance, aim, lens. a: owner's aerial from the park. f: front, from the street side. o: oblique aerial from the east. r: the street, the cantilever and the X. p: the park, the floors and the wedge.
CAMS = {"a": (82, 21, 190, (0, -15, 12), 45), "f": (352, 10, 100, (34, -60, 22), 24), "o": (238, 33, 185, (0, -8, 14), 45),
        "r": (305, 5, 110, (45, -30, 20), 28), "p": (112, 4, 200, (0, -15, 22), 45)}
def render(outdir, tag, px):
    sc = bpy.context.scene
    sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True
    sc.world.node_tree.nodes["Background"].inputs[0].default_value = (.62, .68, .76, 1)
    sc.world.node_tree.nodes["Background"].inputs[1].default_value = 0.8
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", 'SUN')); sc.collection.objects.link(sun)
    sun.data.energy = 2.5; sun.rotation_euler = (math.radians(50), 0, math.radians(-40))
    bpy.ops.mesh.primitive_plane_add(size=900, location=(0, 0, -.1)); go = bpy.context.object
    gm = bpy.data.materials.new("g"); gm.use_nodes = True; gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (.16, .22, .10, 1); go.data.materials.append(gm)
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x = px; sc.render.resolution_y = int(px * .7); sc.render.image_settings.file_format = 'JPEG'
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.clip_end = 3000
    for k, (brg, el, dist, aim, lens) in CAMS.items():
        b, e = math.radians(brg), math.radians(el)
        d = Vector((math.sin(b) * math.cos(e), math.cos(b) * math.cos(e), -math.sin(e)))
        cam.location = Vector(aim) - d * dist
        cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        cam.data.lens = lens
        sc.render.filepath = os.path.join(outdir, f"{tag}_{k}.jpg")
        bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(go); bpy.data.objects.remove(sun); bpy.data.objects.remove(cam)

def fit_snug(bearing):
    def at(brg):
        th = math.radians(brg) + math.pi
        rx, rz, fx, fz = math.cos(th), -math.sin(th), math.sin(th), math.cos(th)
        us = [x * rx + y * rz for x, y in RING]; vs = [x * fx + y * fz for x, y in RING]
        cu, cv = (min(us) + max(us)) / 2, (min(vs) + max(vs)) / 2
        return cu * rx + cv * fx, cu * rz + cv * fz, th, (max(us) - min(us)) / 2, (max(vs) - min(vs)) / 2
    best = given = at(bearing); worst = given[3] * given[4]
    for i in range(-80, 81):
        f = at(bearing + i * .5); worst = max(worst, f[3] * f[4])
        if f[3] * f[4] < best[3] * best[4] - 1e-6: best = f
    return given if worst < best[3] * best[4] * 1.04 else best

def export(path):
    cx, cz, th, hx, hz = fit_snug(FRONT)
    print("fit", cx, cz, math.degrees(th), hx, hz)
    bpy.ops.object.select_all(action='DESELECT')
    obs = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    for o in obs: o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    bpy.ops.object.join(); ob = bpy.context.view_layer.objects.active; ob.name = "philharmonie"
    me = ob.data
    # loadModel sets m.rotation.y, which is ignored while the glTF node keeps its rotationQuaternion (seen in the city: the
    # model stood turned by the fit's angle). So the vertices carry the true orientation: no turn is applied here or there.
    c, s = 1.0, 0.0
    for v in me.vertices:
        u, w = v.co.x + C[0] - cx, v.co.y + C[1] - cz        # world, less the fit's centre
        lx, lz = u * c - w * s, u * s + w * c                # the loader's local x, z
        v.co.z -= 3.0; v.co.x, v.co.y = -lx, -lz                            # Blender's, through glTF's flip (see the note below)
    me.update()
    # loader: babylon local = (-bx, bz, -by), then rotation th. Mesh is flat shaded, so the exporter splits the normals.
    IMG.filepath_raw = os.path.splitext(path)[0] + "_tex.png"; IMG.file_format = 'PNG'; IMG.pack()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_yup=True, export_apply=True, export_image_format='JPEG', export_jpeg_quality=85)
    tris = sum(len(p.vertices) - 2 for p in me.polygons)
    print("TRIS", tris, "hx hz", hx, hz, "size", os.path.getsize(path))

bpy.ops.wm.read_factory_settings(use_empty=True)
want = (arg("parts") or ",".join(PARTS)).split(",")
for k in want: PARTS[k]().finish()
if arg("render"): render(arg("render"), arg("tag", "x"), int(arg("px", "420")))
if arg("export"): export(arg("export"))
