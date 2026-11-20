# Blender headless: Tripo's flamingo has NO rig and stands on TWO straight legs. A flamingo shows one: this cuts it
# down, removes one leg below the body (the other is tucked up out of sight), builds a small skeleton — body, a
# three-bone neck, head — skins it by distance to the neck's centreline, and writes the clips render/zoo.ts plays:
#   blender -b -P tools/animals/flamingo-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — almost still: the head turning now and then, the neck swaying a little, breathing
#   browse — FEEDING: the body tips forward over the leg, the neck uncoils down to the water, the head turns over
#            (beak back, crown down, as flamingos filter), sweeps side to side, comes back up
#   (no walk: on one leg it stays put — zoo.ts SPECIES.flamingo.odds.walk is 0)
#
# The flamingo faces +x (z up), feet at z = 0, normalised to 0.979 units tall. Measured (2026-11-20): legs at
# y ≈ ±0.02, x 0.01–0.03, up to the body's underside at z 0.565; neck from the breast (0.13, 0.63) forward to
# (0.26, 0.665), up and a little back to the head at (0.20–0.34, 0.86–0.975); the bent beak hangs from the head's
# front down to (0.33, 0.745).
# Rotations are about WORLD axes turned into each bone's frame (as bison-clips.py):
#   about +Y: positive tips the bird nose DOWN (+x toward −z)
#   about +Z: a turn to the bird's left
import bpy, bmesh, sys, math
from mathutils import Quaternion, Vector
from mathutils.geometry import intersect_point_line

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview = a[2] if len(a) > 2 else None

TRIS = 30000
FPS = 24
SIZE = 1.3                 # metres per model unit (render/zoo.ts SPECIES.flamingo.size): 1.27 m tall
IDLE_S = 12.0
FEED_S = 11.0
LEG_CUT_Z = 0.565          # the body's underside: the removed leg goes from here down
CUT_SIDE = -1              # which leg goes: the one at y < 0
PITCH = 0.6                # the body's forward tip while feeding (rad)
# while feeding, each bone's direction in the x–z plane (degrees from +x, up positive)
FEED_DIR = {'Neck0': -60, 'Neck1': -80, 'Neck2': -90, 'Head': -105}
DEPTH = 0.6                # how far toward that pose it goes: the full pose tears Tripo's fused neck, a shallow dip doesn't
CUT_BRIDGES = False        # cut the fused neck–shoulder / beak–neck faces (only needed for a deep dip; leaves spikes)
SWEEP = 0.25               # the head's side to side filter sweep (rad) and its rate (Hz)
SWEEP_HZ = 0.9

# the neck chain, (x, z) on the centre plane y = 0
HIP = (0.02, 0.57)
CHAIN = [('Neck0', (0.13, 0.63), (0.26, 0.665)), ('Neck1', (0.26, 0.665), (0.235, 0.77)),
         ('Neck2', (0.235, 0.77), (0.20, 0.86)), ('Head', (0.20, 0.86), (0.30, 0.93))]
BEAK = [(0.31, 0.92), (0.345, 0.80), (0.325, 0.745)]       # skinned to the head
RADIUS = {'Neck0': 0.04, 'Neck1': 0.035, 'Neck2': 0.035, 'Head': 0.065, 'Beak': 0.03}
HEAD_Z, HEAD_X = 0.86, 0.14   # the head's box: above HEAD_Z, ahead of HEAD_X
BLEND = 0.02               # how far the skin blends across a joint (units)

V3 = lambda p: Vector((p[0], 0, p[1]))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
mesh = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# one leg off, before decimating (so the cut edge is fine)
bm = bmesh.new(); bm.from_mesh(mesh.data)
gone = [v for v in bm.verts if v.co.z < LEG_CUT_Z and v.co.y * CUT_SIDE > 0]
bmesh.ops.delete(bm, geom=gone, context='VERTS')
bm.to_mesh(mesh.data); bm.free()
print('leg off:', len(gone), 'verts')

tris = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
m = mesh.modifiers.new('dec', 'DECIMATE'); m.ratio = min(1, TRIS / tris)
bpy.ops.object.modifier_apply(modifier='dec')
print('tris', tris, '->', sum(len(p.vertices) - 2 for p in mesh.data.polygons))

# the skeleton
arm_data = bpy.data.armatures.new('flamingo')
arm = bpy.data.objects.new('flamingo', arm_data)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
E = arm_data.edit_bones
def bone(name, head, tail, parent=None):
    b = E.new(name); b.head = head; b.tail = tail; b.roll = 0
    if parent: b.parent = E[parent]
bone('Root', Vector((0, 0, 0)), Vector((0.05, 0, 0)))
bone('Body', V3(HIP), V3((HIP[0], HIP[1] + 0.2)), 'Root')
parent = 'Body'
for n, h, t in CHAIN:
    bone(n, V3(h), V3(t), parent); parent = n
bpy.ops.object.mode_set(mode='OBJECT')

# the skin: near the neck's centreline → the nearest neck bone (blended across joints), else the body
def smooth(t): t = min(1, max(0, t)); return t * t * (3 - 2 * t)
def seg_dist(p, h, t):
    q, f = intersect_point_line(p, h, t)
    f = min(1, max(0, f))
    return (p - (h + (t - h) * f)).length
segs = [(n, V3(h), V3(t)) for n, h, t in CHAIN] + [('Beak', V3(BEAK[i]), V3(BEAK[i + 1])) for i in range(len(BEAK) - 1)]
groups = {n: mesh.vertex_groups.new(name=n) for n in [b.name for b in arm_data.bones]}
members = []      # each vertex's place down the chain (body 0 … head 4), weighted
RANK = {'Neck0': 1, 'Neck1': 2, 'Neck2': 3, 'Head': 4}
for v in mesh.data.vertices:
    p = v.co.copy()
    d = {}
    for n, h, t in segs:
        k = 'Head' if n == 'Beak' else n
        dist = seg_dist(p, h, t) - RADIUS[n]
        d[k] = min(d.get(k, 9), dist)
    # nothing else is up there: above the neck's top and ahead of the back, it is all head
    if p.z > HEAD_Z and p.x > HEAD_X: d['Head'] = min(d['Head'], -0.05)
    near = min(d.values())
    member = (1 - smooth(near / 0.015)) * smooth((p.z - 0.585) / 0.02)
    raw = {k: math.exp(-max(0, dk - near) / BLEND * 3) for k, dk in d.items()}
    tot = sum(raw.values())
    w = {k: member * r / tot for k, r in raw.items()}
    # the leg stays planted on the root while the body tips over it
    leg = 1 - smooth((p.z - (LEG_CUT_Z - 0.03)) / 0.04)
    w['Body'] = (1 - member) * (1 - leg)
    w['Root'] = (1 - member) * leg
    members.append(sum(wt * RANK.get(n, 0) for n, wt in w.items()))
    for n, wt in w.items():
        if wt > 0.001: groups[n].add([v.index], wt, 'REPLACE')
# Tripo fused the upper neck's back to the shoulder, and the beak's tip to the front of the neck: faces spanning
# bones more than one apart down the chain would stretch into membranes as the neck uncoils, so they go
bm = bmesh.new(); bm.from_mesh(mesh.data)
bridge = [f for f in bm.faces if CUT_BRIDGES and max(members[v.index] for v in f.verts) - min(members[v.index] for v in f.verts) > 1.5]
bmesh.ops.delete(bm, geom=bridge, context='FACES_ONLY')
bm.to_mesh(mesh.data); bm.free()
print('bridges cut:', len(bridge), 'faces')
mesh.parent = arm
mod = mesh.modifiers.new('arm', 'ARMATURE'); mod.object = arm

P = {b.name: b for b in arm.pose.bones}
for pb in P.values(): pb.rotation_mode = 'QUATERNION'
def q(pb, world_axis, ang):
    rest = pb.bone.matrix_local.to_3x3()
    return Quaternion((rest.inverted() @ Vector(world_axis)).normalized(), ang)

SIDE, UP = (0, 1, 0), (0, 0, 1)
def bump(t, a0, a1, b0, b1): return smooth((t - a0) / (a1 - a0)) * (1 - smooth((t - b0) / (b1 - b0)))
TAU = 2 * math.pi

# feeding: each bone's own bend, so the chain ends at FEED_DIR (angles add down the chain; +Y tips nose down)
rest_dir = {n: math.degrees(math.atan2(t[1] - h[1], t[0] - h[0])) for n, h, t in CHAIN}
own, acc = {}, math.degrees(PITCH)
for n, _, _ in CHAIN:
    change = rest_dir[n] - FEED_DIR[n]             # nose-down degrees this bone must turn in all
    own[n] = math.radians(change - acc); acc = change
print('feed bends (deg):', {n: round(math.degrees(r)) for n, r in own.items()})

def pose_idle(t):
    s = t / IDLE_S
    look = math.sin(TAU * s + 0.3) ** 5 + 0.6 * math.sin(TAU * 2 * s + 2.0) ** 7
    return {
        'Body': [(SIDE, 0.012 * math.sin(TAU * 3 * s))],
        'Neck1': [(SIDE, 0.03 * math.sin(TAU * 2 * s)), (UP, 0.08 * look)],
        'Neck2': [(UP, 0.18 * look)],
        'Head': [(UP, 0.3 * look), (SIDE, 0.06 * math.sin(TAU * 3 * s + 1))],
    }

def pose_feed(t):
    s = t / FEED_S
    down = DEPTH * bump(s, 0.0, 0.22, 0.8, 1.0)
    sweep = math.sin(TAU * SWEEP_HZ * t) * bump(s, 0.22, 0.27, 0.75, 0.8) * 0.6
    r = {'Body': [(SIDE, PITCH * down)]}
    for n, _, _ in CHAIN: r[n] = [(SIDE, own[n] * down)]
    r['Neck2'].append((UP, 0.4 * SWEEP * sweep))
    r['Head'].append((UP, SWEEP * sweep))
    return r

CLIPS = [('idle', IDLE_S, pose_idle), ('browse', FEED_S, pose_feed)]
bpy.context.scene.render.fps = FPS
arm.animation_data_create()
names = set()
for name, dur, fn in CLIPS:
    for f in range(int(dur * FPS) + 1): names |= set(fn(f / FPS))
for name, dur, fn in CLIPS:
    act = bpy.data.actions.new(name)
    arm.animation_data.action = act
    frames = int(round(dur * FPS))
    for f in range(frames + 1):
        r = fn((f % frames) / FPS)
        for bn in names:
            pb = P[bn]
            rot = Quaternion()
            for ax, ang in r.get(bn, []): rot = q(pb, ax, ang) @ rot
            pb.rotation_quaternion = rot
            pb.keyframe_insert('rotation_quaternion', frame=f)
    track = arm.animation_data.nla_tracks.new(); track.name = name
    track.strips.new(name, 0, act)
    arm.animation_data.action = None

bpy.ops.object.select_all(action='DESELECT')
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS',
                          export_force_sampling=True, export_frame_step=1)
print('exported', dst)

if preview:
    import os
    os.makedirs(preview, exist_ok=True)
    sc = bpy.context.scene
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam)
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.15
    sc.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.rotation_euler = (0.8, 0.2, 0.6)
    w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0.55, 0.62, 0.7)
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'TEXTURE'
    sc.display.shading.light = 'STUDIO'
    sc.render.resolution_x, sc.render.resolution_y = 360, 360
    views = {'side': ((0, -3, 0.5), (90, 0, 0)), 'front': ((3, 0, 0.5), (90, 0, 90)), 'q': ((2.1, -2.1, 1.0), (75, 0, 45))}
    # the skin: each bone a colour (neck bones and head), the body grey
    col = {'Neck0': (1, 0, 0), 'Neck1': (0, 1, 0), 'Neck2': (0, 0, 1), 'Head': (1, 1, 0), 'Body': (0.5, 0.5, 0.5), 'Root': (0.2, 0.2, 0.2)}
    ca = mesh.data.color_attributes.new('skin', 'FLOAT_COLOR', 'POINT')
    gi = {g.index: g.name for g in mesh.vertex_groups}
    for v in mesh.data.vertices:
        c = Vector((0, 0, 0))
        for g in v.groups: c += Vector(col[gi[g.group]]) * g.weight
        ca.data[v.index].color = (*c, 1)
    mesh.data.color_attributes.active_color = ca
    sc.display.shading.color_type = 'VERTEX'
    arm.animation_data.action = bpy.data.actions['browse']
    for fr in (0, int(FEED_S * FPS / 2)):
        sc.frame_set(fr)
        for vn, (loc, rot) in views.items():
            cam.location = loc; cam.rotation_euler = [math.radians(x) for x in rot]
            sc.render.filepath = os.path.join(preview, f'weights-{vn}-{fr}.png')
            bpy.ops.render.render(write_still=True)
    sc.display.shading.color_type = 'TEXTURE'
    for name, dur, fn in CLIPS:
        arm.animation_data.action = bpy.data.actions[name]
        frames = int(round(dur * FPS))
        for i in range(0, frames, 12):
            sc.frame_set(i)
            for vn, (loc, rot) in views.items():
                cam.location = loc; cam.rotation_euler = [math.radians(x) for x in rot]
                sc.render.filepath = os.path.join(preview, f'{name}-{vn}-{i:04d}.png')
                bpy.ops.render.render(write_still=True)
    print('preview', preview)
