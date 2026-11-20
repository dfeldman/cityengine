# Blender headless: the giraffe's motion, written as numbers, onto Tripo's own skeleton and skin.
#   blender -b -P tools/animals/giraffe-clips.py -- <in.glb> <out.glb> [preview-dir]
#
# Three looping clips, exported as glTF animations (render/zoo.ts plays them):
#   idle   — breathing, a slow neck sway, a look round, ears and tail flicking
#   browse — the neck straightens and the head tilts up to a high branch or feeder, chews, comes down
#   walk   — one stride of a walk: the legs of one side nearly together (a giraffe's near-pace), the neck
#            swinging forward with each step, which is what reads as "giraffe walking" from a distance
# The walk is baked IN PLACE; the game moves the animal at WALK_SPEED, which with WALK_PERIOD and the leg length
# sets the sweep a planted hoof needs to stay still on the ground (render/zoo.ts has the same WALK_SPEED).
#
# Rotations are given about WORLD axes of the rest pose (the model faces +x, z up): each bone's rest frame turns
# the world axis into its own, so Tripo's bone rolls do not matter. Sign conventions (checked on the rest pose):
#   about +Y: positive swings a downward bone's tip BACK (−x), and tips the forward-leaning neck DOWN
#   about +Z: positive turns toward the animal's left (+y)
import bpy, sys, math
from mathutils import Quaternion, Vector

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview = a[2] if len(a) > 2 else None

FPS = 24
# the model is normalised to 1 unit tall; the game scales it to SIZE metres (render/zoo.ts SPECIES.giraffe.size)
SIZE = 4.8
IDLE_S = 8.0
BROWSE_S = 8.0
WALK_PERIOD = 2.0          # seconds per full stride (all four legs)
WALK_SPEED = 1.1           # m/s on the ground, at SIZE
DUTY = 0.66                # share of the stride a hoof is planted
FORE_LAG = 0.1             # the fore leg follows the hind of the same side by this share of a stride
KNEE = 0.9                 # radians of carpus/hock flex at the top of a swing
NECK_SWING = 0.075         # radians the neck swings forward per step
TAIL = 0.35

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
mesh = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
bpy.context.scene.render.fps = FPS

def mirror_leg(src, dst, n):
    """Tripo left one leg short (the giraffe's right hind has 2 bones of 5): rebuild `dst` as the mirror image of
    `src` across the body's centre plane, and give its vertices the weights of their mirror-image vertices."""
    from mathutils.kdtree import KDTree
    mw = arm.matrix_world; mi = mw.inverted()
    flip = lambda v: mi @ (lambda w: Vector((w.x, -w.y, w.z)))(mw @ v)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode='EDIT')
    eb = arm.data.edit_bones
    for k in range(n):
        L = eb['tripo::' + src + str(k)]
        name = 'tripo::' + dst + str(k)
        R = eb.get(name) or eb.new(name)
        R.head, R.tail, R.roll = flip(L.head), flip(L.tail), -L.roll
        R.parent = eb['tripo::' + dst + str(k - 1)] if k else L.parent
        R.use_connect = L.use_connect if k else False
    bpy.ops.object.mode_set(mode='OBJECT')
    vg = mesh.vertex_groups
    for k in range(n):
        if ('tripo::' + dst + str(k)) not in vg: vg.new(name='tripo::' + dst + str(k))
    gname = {g.index: g.name for g in vg}
    side = lambda v, pre: sum(e.weight for e in v.groups if pre in gname[e.group])
    verts = mesh.data.vertices
    world = [mesh.matrix_world @ v.co for v in verts]
    left = [v.index for v in verts if side(v, src) > 0.05]
    right = [v.index for v in verts if side(v, dst) > 0.05]
    kd = KDTree(len(left))
    for i in left: kd.insert(world[i], i)
    kd.balance()
    plan = []
    for i in right:
        p = world[i]
        _, j, _ = kd.find(Vector((p.x, -p.y, p.z)))
        plan.append((i, [(gname[e.group].replace(src, dst), e.weight) for e in verts[j].groups]))
    for i, ws in plan:
        for g in vg: g.remove([i])
        for name, w in ws: vg[name].add([i], w, 'REPLACE')
    print('mirrored', src, '->', dst, len(right), 'vertices')

mirror_leg('1_Left_Limb_', '1_Right_Limb_', 5)
P = {b.name.replace('tripo::', ''): b for b in arm.pose.bones}
for pb in P.values(): pb.rotation_mode = 'QUATERNION'

def rest3(pb):
    return arm.matrix_world.to_3x3() @ pb.bone.matrix_local.to_3x3()

def q(pb, world_axis, ang):
    ax = (rest3(pb).inverted() @ Vector(world_axis)).normalized()
    return Quaternion(ax, ang)

Y, Z, X = (0, 1, 0), (0, 0, 1), (1, 0, 0)
leg_len = (P['0_Left_Limb_0'].bone.head_local - P['0_Left_Limb_4'].bone.tail_local).length * SIZE
stride = WALK_SPEED * WALK_PERIOD
SWEEP = math.asin(min(0.8, stride * DUTY / (2 * leg_len)))
print('leg', round(leg_len, 2), 'm  stride', stride, 'm  sweep', round(math.degrees(SWEEP), 1), 'deg')

def smooth(t): t = min(1, max(0, t)); return t * t * (3 - 2 * t)
def bump(t, a0, a1, b0, b1): return smooth((t - a0) / (a1 - a0)) * (1 - smooth((t - b0) / (b1 - b0)))
TAU = 2 * math.pi

def pose_idle(t):
    s = t / IDLE_S
    r = {
        'Spine_2': [(Y, 0.012 * math.sin(TAU * 3 * s))],
        'Head_0': [(Z, 0.06 * math.sin(TAU * s)), (Y, 0.03 * math.sin(TAU * 2 * s))],
        'Head_1': [(Z, 0.04 * math.sin(TAU * s - 0.6))],
        'Head_2': [(Z, 0.35 * math.sin(TAU * s + 1.0) ** 3), (Y, -0.08 * math.sin(TAU * 2 * s) ** 2)],
        'Head_3': [(Z, 0.12 * math.sin(TAU * s + 1.3) ** 3)],
        'bone_16': [(X, 0.5 * bump(s, 0.30, 0.33, 0.36, 0.40))],
        'Head_4': [(X, -0.5 * bump(s, 0.70, 0.73, 0.76, 0.80))],
    }
    tail(r, s * 4)
    return r

def pose_browse(t):
    s = t / BROWSE_S
    up = bump(s, 0.0, 0.25, 0.75, 1.0)
    chew = math.sin(TAU * 10 * s) * up
    r = {
        'Head_0': [(Y, -0.22 * up)],
        'Head_1': [(Y, -0.12 * up)],
        'Head_2': [(Y, -0.30 * up), (Z, 0.08 * math.sin(TAU * s))],
        'Head_3': [(Y, -0.25 * up + 0.025 * chew)],
        'bone_15': [(Y, 0.04 * chew)],
        'Spine_3': [(Y, -0.03 * up)],
    }
    tail(r, s * 3)
    return r

def tail(r, cycles):
    for i, name in enumerate(['Tail_0', 'Tail_1', 'Tail_2']):
        r[name] = [(Z, TAIL * (0.8 + 0.3 * i) * math.sin(TAU * cycles - 0.7 * i))]

def leg(r, side, front, ph):
    """one leg at phase ph of its own cycle: planted and swept back for DUTY, then swung forward, knee lifted"""
    ph %= 1
    if ph < DUTY:
        th = SWEEP - 2 * SWEEP * ph / DUTY; flex = 0
    else:
        u = (ph - DUTY) / (1 - DUTY)
        th = -SWEEP + 2 * SWEEP * (0.5 - 0.5 * math.cos(math.pi * u)); flex = math.sin(math.pi * u)
    n = f"{0 if front else 1}_{side}_Limb_"
    # th > 0: hoof forward = a NEGATIVE turn about +Y
    r[n + '0'] = [(Y, -th)]
    if front:
        r[n + '2'] = [(Y, KNEE * flex)]                    # carpus folds: the hoof goes back and up
        r[n + '3'] = [(Y, 0.5 * KNEE * flex)]
    else:
        r[n + '1'] = [(Y, 0.25 * KNEE * flex)]
        r[n + '2'] = [(Y, -0.8 * KNEE * flex)]             # hock folds: the cannon comes forward and up
        r[n + '3'] = [(Y, 0.6 * KNEE * flex)]

def pose_walk(t):
    s = t / WALK_PERIOD
    r = {}
    leg(r, 'Left', False, s)
    leg(r, 'Left', True, s - FORE_LAG)
    leg(r, 'Right', False, s - 0.5)
    leg(r, 'Right', True, s - 0.5 - FORE_LAG)
    # the neck swings forward-down as each fore leg reaches, twice a stride
    nod = math.sin(TAU * 2 * (s - FORE_LAG) + 0.6)
    r['Head_0'] = [(Y, NECK_SWING * nod)]
    r['Head_1'] = [(Y, 0.4 * NECK_SWING * nod)]
    r['Head_2'] = [(Y, -0.9 * NECK_SWING * nod)]           # the head stays level while the neck swings
    r['Spine_2'] = [(X, 0.025 * math.sin(TAU * s))]        # a sway side to side with the pace
    tail(r, 1)
    return r, 0.006 * math.cos(TAU * 2 * s)

CLIPS = [('idle', IDLE_S, lambda t: (pose_idle(t), 0)), ('browse', BROWSE_S, lambda t: (pose_browse(t), 0)), ('walk', WALK_PERIOD, pose_walk)]
arm.animation_data_create()
names = set()
for name, dur, fn in CLIPS:
    for f in range(int(dur * FPS) + 1):
        r, bob = fn(f / FPS)
        names |= set(r)
    act = bpy.data.actions.new(name)
    arm.animation_data.action = act
    frames = int(round(dur * FPS))
    for f in range(frames + 1):
        r, bob = fn((f % frames) / FPS)        # the last frame repeats the first: a seamless loop
        for bn in names:
            pb = P[bn]
            rot = Quaternion()
            for ax, ang in r.get(bn, []):
                rot = q(pb, ax, ang) @ rot
            pb.rotation_quaternion = rot
            pb.keyframe_insert('rotation_quaternion', frame=f)
        P['Root'].location = (0, bob / SIZE, 0)   # Root points up: its local y is world z
        P['Root'].keyframe_insert('location', frame=f)
    track = arm.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 0, act)
    arm.animation_data.action = None

bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_animations=True, export_animation_mode='ACTIONS',
                          export_force_sampling=True, export_frame_step=1)
print('exported', dst)

if preview:
    import os
    os.makedirs(preview, exist_ok=True)
    sc = bpy.context.scene
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam)
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.25
    # three-quarter side view from the animal's right, a little above
    cam.location = (0.75, -2.4, 0.52); cam.rotation_euler = (math.radians(88), 0, math.radians(18))
    sc.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.rotation_euler = (0.8, 0.2, 0.6)
    w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0.55, 0.62, 0.7)
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0))
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'TEXTURE'
    sc.display.shading.light = 'STUDIO'; sc.display.shading.show_shadows = True
    sc.render.resolution_x, sc.render.resolution_y = 480, 360
    for name, dur, fn in CLIPS:
        act = bpy.data.actions[name]
        arm.animation_data.action = act
        frames = int(round(dur * FPS))
        reps = 3 if name == 'walk' else 1
        for i in range(frames * reps):
            sc.frame_set(i % frames)
            sc.render.filepath = os.path.join(preview, f'{name}-{i:04d}.png')
            bpy.ops.render.render(write_still=True)
    print('preview', preview)
