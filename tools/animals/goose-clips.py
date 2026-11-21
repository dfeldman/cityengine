# Blender headless: Tripo's Canada goose has NO rig. This builds two legs (shank, foot), a body, a two-bone neck and
# the head, skins it (legs by where each vertex is, the neck by distance to its centreline), and writes the clips
# render/zoo.ts plays:
#   blender -b -P tools/animals/goose-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — standing: the head turning and tilting, now and then a stretch of the neck up
#   browse — GRAZING: the body tips forward, the neck bends down to the grass, the bill crops, back up
#   walk   — one stride of a waddle, the feet half a stride apart, the body rolling side to side; baked in place, the
#            game moves the bird at WALK_SPEED. In water the herd's `sink` hides the legs and it reads as swimming.
#
# Faces −y, z up, normalised 0.966 tall, 0.98 long. Measured (2026-11-20): shanks at |x| 0.05–0.095, y −0.07 to
# −0.025, from the body's underside at z 0.21 down to the ankle at 0.05; webbed feet below that, forward to y −0.20,
# |x| 0.04–0.14. The neck rises nearly straight from the breast (y −0.30, z 0.56) to (−0.28, 0.80), the head on top
# with the bill forward to (−0.49, 0.88).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigkit import *

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview_dir = a[2] if len(a) > 2 else None

TRIS = 12000
FPS = 24
SIZE = 0.95                # metres per model unit (render/zoo.ts SPECIES.goose.size): ~0.9 m to the crown
IDLE_S = 10.0
GRAZE_S = 8.0
WALK_PERIOD = 0.55
WALK_SPEED = 0.4
DUTY = 0.6
LIFT = 0.5                 # the shank's swing back in the swing phase (rad)
CURL = 0.6                 # the web folding as the foot lifts
WADDLE = 0.08              # the body's roll per step (rad)
PITCH = 0.3                # the body's forward tip grazing (rad)
# grazing: where each neck bone points (degrees from forward, 90 up) before the body's tip adds PITCH
GRAZE_DIR = {'Neck0': -20, 'Neck1': -60, 'Head': -75}
BLEND = 0.025

HIP_Z, ANKLE_Z = 0.21, 0.05
LEG_X, LEG_Y = 0.072, -0.048
TOE = (-0.19, 0.01)        # (y, z) the toes' tip
NECK = [('Neck0', (-0.30, 0.56), (-0.30, 0.68), 0.05), ('Neck1', (-0.30, 0.68), (-0.28, 0.80), 0.045),
        ('Head', (-0.28, 0.80), (-0.47, 0.88), 0.06)]
HEAD_Z, HEAD_Y = 0.83, -0.22  # above and ahead of this, all head
NECK_BASE_Z = 0.54
V = lambda p: (0, p[0], p[1])

mesh = load(src, TRIS)
bones = [('Root', (0, 0, 0), (0, -0.05, 0), None), ('Body', (0, LEG_Y, HIP_Z + 0.1), (0, LEG_Y, 0.5), 'Root')]
for side, sx in (('L', -1), ('R', 1)):
    x = sx * LEG_X
    bones += [(f'Leg_{side}_0', (x, LEG_Y, HIP_Z), (x, LEG_Y, ANKLE_Z), 'Body'),
              (f'Leg_{side}_1', (x, LEG_Y, ANKLE_Z), (x, TOE[0], TOE[1]), f'Leg_{side}_0')]
bones += [(n, V(h), V(t), 'Body' if i == 0 else NECK[i - 1][0]) for i, (n, h, t, r) in enumerate(NECK)]
arm = armature('goose', bones)
segs = [(n, V(h), V(t), r) for n, h, t, r in NECK]
REST = [(n, deg(h, t)) for n, h, t, r in NECK]

def weights(p):
    if p.z < HIP_Z + 0.02 and 0.025 < abs(p.x) < 0.16 and -0.22 < p.y < 0.01:
        side = 'L' if p.x < 0 else 'R'
        leg = 1 - smooth((p.z - (HIP_Z - 0.015)) / 0.03)       # into the body's underside
        foot = 1 - smooth((p.z - (ANKLE_Z - 0.01)) / 0.02)
        return {f'Leg_{side}_1': leg * foot, f'Leg_{side}_0': leg * (1 - foot), 'Body': 1 - leg}
    w, near = chain(p, segs, BLEND)
    if p.z > HEAD_Z and p.y < HEAD_Y: w, near = {'Head': 1}, -1
    member = (1 - smooth(near / 0.02)) * smooth((p.z - NECK_BASE_Z) / 0.04) * smooth((-p.y - 0.18) / 0.04)
    out = {k: x * member for k, x in w.items()}
    out['Body'] = 1 - member
    return out
skin(mesh, arm, weights)

leg_len = (HIP_Z - TOE[1]) * SIZE
SWEEP = math.asin(min(0.8, WALK_SPEED * WALK_PERIOD * DUTY / (2 * leg_len)))
print('leg', round(leg_len, 3), 'm  sweep', round(math.degrees(SWEEP), 1), 'deg')

def pose_idle(t):
    s = t / IDLE_S
    stretch = bump(s, 0.6, 0.66, 0.74, 0.8)
    return {
        'Body': [(UP, 0.04 * math.sin(TAU * s))],
        'Neck0': [(UP, 0.2 * math.sin(TAU * s + 0.4) ** 3), (SIDE, -0.12 * stretch)],
        'Neck1': [(SIDE, 0.05 * math.sin(TAU * 2 * s)), (UP, 0.1 * math.sin(TAU * s + 0.4) ** 3)],
        'Head': [(UP, 0.3 * math.sin(TAU * 3 * s + 1.1) ** 3), (FWD, 0.15 * math.sin(TAU * 2 * s + 2) ** 5), (SIDE, 0.15 * stretch)],
    }, 0

def pose_graze(t):
    s = t / GRAZE_S
    down = bump(s, 0.0, 0.15, 0.85, 1.0)
    crop = math.sin(TAU * 16 * s) * bump(s, 0.15, 0.17, 0.83, 0.85)
    b = bends(REST, GRAZE_DIR, down)
    return {
        'Body': [(SIDE, PITCH * down)],
        # the legs stay upright while the body tips over them
        'Leg_L_0': [(SIDE, -PITCH * down)], 'Leg_R_0': [(SIDE, -PITCH * down)],
        'Neck0': [(SIDE, b['Neck0']), (UP, 0.15 * down * math.sin(TAU * 1.5 * s))],
        'Neck1': [(SIDE, b['Neck1'])],
        'Head': [(SIDE, b['Head'] + 0.08 * crop)],
    }, 0

def leg(r, side, ph):
    ph %= 1
    if ph < DUTY:
        th = SWEEP - 2 * SWEEP * ph / DUTY; flex = 0
    else:
        u = (ph - DUTY) / (1 - DUTY)
        th = -SWEEP + 2 * SWEEP * (0.5 - 0.5 * math.cos(math.pi * u)); flex = math.sin(math.pi * u)
    # stance: the shank pushes back, the foot stays flat; swing: the shank comes forward, the web folds and lifts
    r[f'Leg_{side}_0'] = [(SIDE, -th - LIFT * flex * 0.3)]
    r[f'Leg_{side}_1'] = [(SIDE, th + CURL * flex)]

def pose_walk(t):
    s = t / WALK_PERIOD
    r = {}
    leg(r, 'L', s)
    leg(r, 'R', s - 0.5)
    roll = WADDLE * math.sin(TAU * s)
    r['Body'] = [(FWD, roll), (UP, 0.04 * math.sin(TAU * s))]
    r['Neck0'] = [(FWD, -0.8 * roll), (SIDE, 0.05 * math.sin(TAU * 2 * s))]
    r['Head'] = [(SIDE, -0.05 * math.sin(TAU * 2 * s))]
    return r, 0.006 * math.cos(TAU * 2 * s)

CLIPS = [('idle', IDLE_S, pose_idle), ('browse', GRAZE_S, pose_graze), ('walk', WALK_PERIOD, pose_walk)]
bake(arm, CLIPS, FPS)
export(dst)
if preview_dir: preview(arm, CLIPS, FPS, preview_dir, 0.5, 1.2)
