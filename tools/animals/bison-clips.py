# Blender headless: the bison's motion, written as numbers, onto Tripo's own skeleton and skin (the same scheme as
# giraffe-clips.py; render/zoo.ts plays the clips).
#   blender -b -P tools/animals/bison-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — breathing, the heavy head swaying and turning, a head shake, the tail flicking
#   browse — GRAZING (the clip keeps the name render/zoo.ts plays): the head goes down to the grass, crops, comes up
#   walk   — one stride of a four-beat walk (left hind, left fore, right hind, right fore a quarter apart), the head
#            nodding with the fore legs; baked in place, the game moves the animal at WALK_SPEED
#
# Tripo's bison lies along Blender y and faces −y (z up), normalised to 1 unit LONG. Rotations are about WORLD axes
# of the rest pose, turned into each bone's own frame:
#   about +X: positive swings a downward bone's tip BACK (+y), and tips the forward-reaching head DOWN
#   about +Z: a turn to one side
import bpy, sys, math
from mathutils import Quaternion, Vector

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview = a[2] if len(a) > 2 else None

FPS = 24
SIZE = 3.0                 # metres per model unit (render/zoo.ts SPECIES.bison.size): 3 m long, ~2 m at the hump
IDLE_S = 8.0
GRAZE_S = 10.0
WALK_PERIOD = 1.5
WALK_SPEED = 1.0
DUTY = 0.65
FORE_LAG = 0.25
KNEE = 0.8
NOD = 0.06
TAIL = 0.3

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
bpy.context.scene.render.fps = FPS
P = {b.name.replace('tripo::', ''): b for b in arm.pose.bones}
for pb in P.values(): pb.rotation_mode = 'QUATERNION'

def q(pb, world_axis, ang):
    rest = arm.matrix_world.to_3x3() @ pb.bone.matrix_local.to_3x3()
    return Quaternion((rest.inverted() @ Vector(world_axis)).normalized(), ang)

SIDE, UP = (1, 0, 0), (0, 0, 1)
leg_len = (P['0_Left_Limb_0'].bone.head_local - P['0_Left_Limb_3'].bone.tail_local).length * SIZE
SWEEP = math.asin(min(0.8, WALK_SPEED * WALK_PERIOD * DUTY / (2 * leg_len)))
print('leg', round(leg_len, 2), 'm  sweep', round(math.degrees(SWEEP), 1), 'deg')

def smooth(t): t = min(1, max(0, t)); return t * t * (3 - 2 * t)
def bump(t, a0, a1, b0, b1): return smooth((t - a0) / (a1 - a0)) * (1 - smooth((t - b0) / (b1 - b0)))
TAU = 2 * math.pi

def tail(r, cycles):
    for i, n in enumerate(['bone_29', 'bone_30', 'bone_31']):
        r[n] = [(UP, TAIL * (0.7 + 0.3 * i) * math.sin(TAU * cycles - 0.8 * i))]

def pose_idle(t):
    s = t / IDLE_S
    shake = bump(s, 0.55, 0.58, 0.64, 0.67) * math.sin(TAU * 12 * s)
    r = {
        'Spine_2': [(SIDE, 0.01 * math.sin(TAU * 3 * s))],
        'Head_0': [(UP, 0.18 * math.sin(TAU * s + 0.5) ** 3 + 0.08 * shake), (SIDE, 0.05 * math.sin(TAU * 2 * s))],
        'Head_1': [(UP, 0.08 * math.sin(TAU * s + 0.9) ** 3), (SIDE, 0.06 * shake)],
    }
    tail(r, s * 4)
    return r

def pose_graze(t):
    s = t / GRAZE_S
    down = bump(s, 0.0, 0.18, 0.82, 1.0)
    crop = math.sin(TAU * 14 * s) * down
    r = {
        'Spine_3': [(SIDE, 0.06 * down)],
        'Spine_4': [(SIDE, 0.12 * down)],
        # the neck goes down; the head, which already hangs, turns the OTHER way so the muzzle reaches forward to the
        # grass instead of tucking into the chest
        'Head_0': [(SIDE, 0.95 * down), (UP, 0.12 * down * math.sin(TAU * 1.5 * s))],
        'Head_1': [(SIDE, -0.45 * down + 0.05 * crop)],
        'Head_2': [(SIDE, -0.15 * down)],
    }
    tail(r, s * 5)
    return r

def leg(r, side, front, ph):
    ph %= 1
    if ph < DUTY:
        th = SWEEP - 2 * SWEEP * ph / DUTY; flex = 0
    else:
        u = (ph - DUTY) / (1 - DUTY)
        th = -SWEEP + 2 * SWEEP * (0.5 - 0.5 * math.cos(math.pi * u)); flex = math.sin(math.pi * u)
    n = f"{0 if front else 1}_{side}_Limb_"
    r[n + '0'] = [(SIDE, -th)]
    if front:
        r[n + '1'] = [(SIDE, KNEE * flex)]
        r[n + '2'] = [(SIDE, 0.5 * KNEE * flex)]
    else:
        r[n + '1'] = [(SIDE, 0.2 * KNEE * flex)]
        r[n + '2'] = [(SIDE, -0.8 * KNEE * flex)]
        r[n + '3'] = [(SIDE, 0.6 * KNEE * flex)]

def pose_walk(t):
    s = t / WALK_PERIOD
    r = {}
    leg(r, 'Left', False, s)
    leg(r, 'Left', True, s - FORE_LAG)
    leg(r, 'Right', False, s - 0.5)
    leg(r, 'Right', True, s - 0.5 - FORE_LAG)
    nod = math.sin(TAU * 2 * (s - FORE_LAG) + 0.6)
    r['Head_0'] = [(SIDE, NOD * nod)]
    r['Spine_2'] = [(UP, 0.02 * math.sin(TAU * s))]
    tail(r, 1)
    return r, 0.008 * math.cos(TAU * 2 * s)

CLIPS = [('idle', IDLE_S, lambda t: (pose_idle(t), 0)), ('browse', GRAZE_S, lambda t: (pose_graze(t), 0)), ('walk', WALK_PERIOD, pose_walk)]
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
        P['Root'].location = (0, bob / SIZE, 0)
        P['Root'].keyframe_insert('location', frame=f)
    track = arm.animation_data.nla_tracks.new(); track.name = name
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
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = 1.3
    # from the animal's left side, a little ahead
    cam.location = (2.4, 0.06, 0.3); cam.rotation_euler = (math.radians(88), 0, math.radians(90))
    sc.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sc.collection.objects.link(sun)
    sun.rotation_euler = (0.8, 0.2, 0.6)
    w = bpy.data.worlds.new('w'); sc.world = w; w.color = (0.55, 0.62, 0.7)
    bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0))
    sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.color_type = 'TEXTURE'
    sc.display.shading.light = 'STUDIO'; sc.display.shading.show_shadows = True
    sc.render.resolution_x, sc.render.resolution_y = 480, 300
    for name, dur, fn in CLIPS:
        arm.animation_data.action = bpy.data.actions[name]
        frames = int(round(dur * FPS))
        for i in range(frames * (3 if name == 'walk' else 1)):
            sc.frame_set(i % frames)
            sc.render.filepath = os.path.join(preview, f'{name}-{i:04d}.png')
            bpy.ops.render.render(write_still=True)
    print('preview', preview)
