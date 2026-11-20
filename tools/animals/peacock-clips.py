# Blender headless: Tripo's peacock (fan up, in display) has NO rig. This cuts it down, builds a small skeleton —
# two legs (shank, foot), body, neck, head, fan — skins it by where each vertex is, and writes the clips
# render/zoo.ts plays:
#   blender -b -P tools/animals/peacock-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — the head turning and bobbing, the fan shivering (the train rattle) now and then
#   browse — PECKING: the neck dips, three or four pecks at the grass, back up
#   walk   — one stride, legs half a stride apart, the foot lifting and curling; the head nodding and the body
#            waddling; baked in place, the game moves the bird at WALK_SPEED
#
# The peacock faces −y (z up), feet at z = 0, normalised to 0.887 units tall with the fan. Measured from the
# decimated mesh (2026-11-20): legs at x = ±0.03 from z 0.02 to 0.105 (the body's underside), feet below 0.02
# reaching forward to y −0.08; neck from (y −0.09, z 0.22) to the head at z 0.40–0.48, beak tip y −0.29; the fan a
# near-vertical sheet at y ≈ 0, |x| up to 0.48, from z 0.12 to the top.
# Rotations are about WORLD axes turned into each bone's frame (as bison-clips.py):
#   about +X: positive swings a downward bone's tip BACK (+y); tips a forward bone (the foot, the head) DOWN
import bpy, sys, math
from mathutils import Quaternion, Vector

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview = a[2] if len(a) > 2 else None

TRIS = 30000
FPS = 24
SIZE = 1.7                 # metres per model unit (render/zoo.ts SPECIES.peacock.size): head at ~0.75 m, fan 1.5 m
IDLE_S = 9.0
PECK_S = 6.0
WALK_PERIOD = 0.8
WALK_SPEED = 0.45
DUTY = 0.58
LIFT = 0.9                 # the shank's fold back in the swing (rad)
CURL = 0.7                 # the toes' droop in the swing
NOD = 0.12
WADDLE = 0.035
SHIVER = 0.035             # the fan's rattle (rad) and its rate (Hz)
SHIVER_HZ = 14

# joints (Blender coordinates, model units)
HIP_Z, ANKLE_Z, TOE_Z = 0.105, 0.055, 0.02
LEG_X, LEG_Y = 0.03, -0.02
NECK0, NECK1 = Vector((0, -0.09, 0.22)), Vector((0, -0.18, 0.40))
HEAD1 = Vector((0, -0.29, 0.41))
FAN0 = Vector((0, 0.02, 0.24))

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
mesh = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.context.view_layer.objects.active = mesh
mesh.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
tris = sum(len(p.vertices) - 2 for p in mesh.data.polygons)
m = mesh.modifiers.new('dec', 'DECIMATE'); m.ratio = min(1, TRIS / tris)
bpy.ops.object.modifier_apply(modifier='dec')
print('tris', tris, '->', sum(len(p.vertices) - 2 for p in mesh.data.polygons))

# the skeleton
arm_data = bpy.data.armatures.new('peacock')
arm = bpy.data.objects.new('peacock', arm_data)
bpy.context.scene.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
E = arm_data.edit_bones
def bone(name, head, tail, parent=None):
    b = E.new(name); b.head = Vector(head); b.tail = Vector(tail); b.roll = 0
    if parent: b.parent = E[parent]
    return b
bone('Root', (0, 0, 0), (0, -0.05, 0))
bone('Body', (0, LEG_Y, HIP_Z), (0, LEG_Y, 0.25), 'Root')
for side, sx in (('L', -1), ('R', 1)):
    x = sx * LEG_X
    bone(f'Leg_{side}_0', (x, LEG_Y, HIP_Z), (x, LEG_Y, ANKLE_Z), 'Body')
    bone(f'Leg_{side}_1', (x, LEG_Y, ANKLE_Z), (x, LEG_Y, TOE_Z), f'Leg_{side}_0')
    bone(f'Leg_{side}_2', (x, LEG_Y, TOE_Z), (x, LEG_Y - 0.06, 0.005), f'Leg_{side}_1')
bone('Neck', NECK0, NECK1, 'Body')
bone('Head', NECK1, HEAD1, 'Neck')
bone('Fan', FAN0, FAN0 + Vector((0, 0, 0.3)), 'Body')
bpy.ops.object.mode_set(mode='OBJECT')

# the skin, by position: legs under the body, the neck and head in front of it, the fan above and to the sides
def smooth(t): t = min(1, max(0, t)); return t * t * (3 - 2 * t)
groups = {n: mesh.vertex_groups.new(name=n) for n in [b.name for b in arm_data.bones]}
for v in mesh.data.vertices:
    x, y, z = v.co
    w = {}
    on_leg = abs(abs(x) - LEG_X) < 0.035 and -0.095 < y < 0.03 and z < HIP_Z + 0.02 and abs(x) < 0.075
    if on_leg:
        side = 'L' if x < 0 else 'R'
        leg = 1 - smooth((z - (HIP_Z - 0.012)) / 0.025)       # into the body's underside
        foot = 1 - smooth((z - (TOE_Z - 0.006)) / 0.012)
        shank = (1 - foot) * (1 - smooth((z - (ANKLE_Z - 0.008)) / 0.016))
        upper = 1 - foot - shank
        w[f'Leg_{side}_2'] = leg * foot
        w[f'Leg_{side}_1'] = leg * shank
        w[f'Leg_{side}_0'] = leg * upper
        w['Body'] = 1 - leg
    else:
        neck = smooth((-y - 0.06) / 0.05) * smooth((z - 0.19) / 0.06) * (1 - smooth((abs(x) - 0.09) / 0.03))
        head = neck * smooth((z - 0.355) / 0.035) * smooth((-y - 0.13) / 0.03)
        fan = (1 - neck) * max(smooth((z - 0.27) / 0.05) * smooth((y + 0.05) / 0.04), smooth((abs(x) - 0.11) / 0.05) * smooth((z - 0.1) / 0.04))
        w['Head'] = head
        w['Neck'] = neck - head
        w['Fan'] = fan
        w['Body'] = max(0, 1 - neck - fan)
    for n, wt in w.items():
        if wt > 0.001: groups[n].add([v.index], wt, 'REPLACE')
mesh.parent = arm
mod = mesh.modifiers.new('arm', 'ARMATURE'); mod.object = arm

P = {b.name: b for b in arm.pose.bones}
for pb in P.values(): pb.rotation_mode = 'QUATERNION'
def q(pb, world_axis, ang):
    rest = pb.bone.matrix_local.to_3x3()
    return Quaternion((rest.inverted() @ Vector(world_axis)).normalized(), ang)

SIDE, FWD, UP = (1, 0, 0), (0, 1, 0), (0, 0, 1)
leg_len = (HIP_Z - TOE_Z) * SIZE
SWEEP = math.asin(min(0.8, WALK_SPEED * WALK_PERIOD * DUTY / (2 * leg_len)))
print('leg', round(leg_len, 3), 'm  sweep', round(math.degrees(SWEEP), 1), 'deg')
def bump(t, a0, a1, b0, b1): return smooth((t - a0) / (a1 - a0)) * (1 - smooth((t - b0) / (b1 - b0)))
TAU = 2 * math.pi

def shiver(r, s, on):
    r['Fan'] = [(FWD, SHIVER * on * math.sin(TAU * SHIVER_HZ * s)), (SIDE, 0.02 * on * math.sin(TAU * SHIVER_HZ * 0.5 * s))]

def pose_idle(t):
    s = t / IDLE_S
    r = {
        'Neck': [(UP, 0.35 * math.sin(TAU * s + 0.4) ** 3), (SIDE, 0.06 * math.sin(TAU * 3 * s))],
        'Head': [(UP, 0.3 * math.sin(TAU * 2 * s + 1.1) ** 3), (SIDE, 0.12 * math.sin(TAU * 4 * s) ** 5)],
        'Body': [(UP, 0.05 * math.sin(TAU * s))],
    }
    shiver(r, t, bump(s, 0.3, 0.33, 0.48, 0.52))
    return r

def pose_peck(t):
    s = t / PECK_S
    down = bump(s, 0.0, 0.2, 0.8, 1.0)
    pecks = max(0, math.sin(TAU * 4 * (s - 0.2) / 0.6)) * bump(s, 0.2, 0.22, 0.78, 0.8)
    r = {
        'Body': [(SIDE, 0.22 * down)],
        'Neck': [(SIDE, (1.0 + 0.25 * pecks) * down), (UP, 0.15 * down * math.sin(TAU * 1.3 * s))],
        'Head': [(SIDE, (0.45 - 0.2 * pecks) * down)],
    }
    shiver(r, t, 0)
    return r

def leg(r, side, ph):
    ph %= 1
    if ph < DUTY:
        th = SWEEP - 2 * SWEEP * ph / DUTY; flex = 0
    else:
        u = (ph - DUTY) / (1 - DUTY)
        th = -SWEEP + 2 * SWEEP * (0.5 - 0.5 * math.cos(math.pi * u)); flex = math.sin(math.pi * u)
    # stance: the foot flat on the ground, the shank pushing back; swing: the shank folds back, the toes droop, the
    # upper leg swings forward a little further so the foot clears the grass
    r[f'Leg_{side}_0'] = [(SIDE, -th - 0.35 * flex)]
    r[f'Leg_{side}_1'] = [(SIDE, LIFT * flex)]
    r[f'Leg_{side}_2'] = [(SIDE, th - LIFT * flex + 0.35 * flex + CURL * flex)]

def pose_walk(t):
    s = t / WALK_PERIOD
    r = {}
    leg(r, 'L', s)
    leg(r, 'R', s - 0.5)
    nod = math.sin(TAU * 2 * s + 0.8)
    r['Body'] = [(FWD, WADDLE * math.sin(TAU * s)), (UP, 0.03 * math.sin(TAU * s))]
    r['Neck'] = [(SIDE, NOD * nod)]
    r['Head'] = [(SIDE, -0.8 * NOD * nod)]
    r['Fan'] = [(FWD, -0.6 * WADDLE * math.sin(TAU * s - 0.4))]
    return r, 0.004 * math.cos(TAU * 2 * s)

CLIPS = [('idle', IDLE_S, lambda t: (pose_idle(t), 0)), ('browse', PECK_S, lambda t: (pose_peck(t), 0)), ('walk', WALK_PERIOD, pose_walk)]
bpy.context.scene.render.fps = FPS
arm.animation_data_create()
names = set()
for name, dur, fn in CLIPS:
    for f in range(int(dur * FPS) + 1): names |= set(fn(f / FPS)[0])
for name, dur, fn in CLIPS:
    act = bpy.data.actions.new(name)
    arm.animation_data.action = act
    frames = int(round(dur * FPS))
    for f in range(frames + 1):
        r, bob = fn((f % frames) / FPS)
        for bn in names:
            pb = P[bn]
            rot = Quaternion()
            for ax, ang in r.get(bn, []): rot = q(pb, ax, ang) @ rot
            pb.rotation_quaternion = rot
            pb.keyframe_insert('rotation_quaternion', frame=f)
        P['Root'].location = P['Root'].bone.matrix_local.to_3x3().inverted() @ Vector((0, 0, bob))
        P['Root'].keyframe_insert('location', frame=f)
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
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.1
    # from the bird's left side (+x… its left is −x facing −y; this is its right), level with the body
    cam.location = (3, 0, 0.42); cam.rotation_euler = (math.radians(90), 0, math.radians(90))
    sc.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.rotation_euler = (0.8, 0.2, 0.6)
    w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0.55, 0.62, 0.7)
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'TEXTURE'
    sc.display.shading.light = 'STUDIO'
    sc.render.resolution_x, sc.render.resolution_y = 360, 360
    for name, dur, fn in CLIPS:
        arm.animation_data.action = bpy.data.actions[name]
        frames = int(round(dur * FPS))
        for i in range(0, frames * (2 if name == 'walk' else 1), 1 if name == 'walk' else 3):
            sc.frame_set(i % frames)
            sc.render.filepath = os.path.join(preview, f'{name}-{i:04d}.png')
            bpy.ops.render.render(write_still=True)
    print('preview', preview)
