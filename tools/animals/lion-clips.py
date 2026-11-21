# Blender headless: Tripo's lion comes with its own rig and a stock "quadruped walk" clip, both thrown away (and a stray
# Icosphere helper). This turns the mesh to face −y, builds a body, a chest, a head, four ear/tail bits and a two-bone leg
# at each corner (hip->knee->foot, solved by a 2-bone IK each frame), skins it by where each vertex is, and writes the
# clips render/zoo.ts plays:
#   blender -b -P tools/animals/lion-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — standing: the head turns slowly round and nods, the ears flick, the tail swishes, the flanks breathe
#            (a lie-down would mean refolding all four legs under a fixed mesh: it tears, so the lion stands)
#   browse — nose to the ground: the front dips, the head sweeps low and sniffs, then comes back up
#   walk   — one stride of an unhurried four-beat walk (LH, LF, RH, RF a quarter stride apart), baked in place; the
#            game moves the animal at WALK_SPEED, and the stance's foot travel is matched to it
#
# As imported (2026-11-20): head toward +x, tail to −x, 0.98 long, 0.33 wide, 0.58 to the top of the mane (the back is
# 0.42–0.44, the belly ~0.23), the mane over y −0.1…−0.4 (after the turn), the face at y −0.49…−0.40, z 0.28…0.41. Turned
# −90° about z to face −y. The tail hangs from the rump at x 0.04, y 0.33 down to z 0.15 and its tuft curls back to y 0.49.
# The pose is mid-stride: the feet at FR (0.087,−0.283) FL (−0.083,−0.192) HR (0.097,0.295) HL (−0.089,0.228).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigkit import *

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview_dir = a[2] if len(a) > 2 else None

TRIS = 8000
FPS = 24
SIZE = 2.75                # metres per model unit (render/zoo.ts SPECIES.lion.size): ~1.25 m at the shoulder, 2.7 m long
IDLE_S = 10.0
BROWSE_S = 8.0
WALK_PERIOD = 1.5
WALK_SPEED = 0.72          # m/s the game moves it; the stance's foot travel is matched to it
DUTY = 0.66                # four-beat walk: three feet down at a time (0.75 is a slow walk, 0.5 a trot)
LIFT = 0.04                # the swinging paw's height (units)
CROUCH = 0.012             # the hips sit this low in the walk so the legs can reach (units)
TOE_DOWN = 0.25            # rad the toe dips in mid-swing
HEAD_TURN = 0.55           # idle: how far the head looks round (rad)
NOD = 0.12
EAR_FLICK = 0.5            # rad
TAIL_SWISH = 0.5           # rad per bone at the swish's peak
BREATH = 0.012             # idle chest pitch (rad)
BLEND = 0.03
# browse
DIP_BODY = 0.05            # the whole front bows about the hind hips (rad); the front legs fold to follow
DIP_CHEST = 0.08           # and the chest bows on top (rad)
DIP_HEAD = 0.45            # and the head (rad)
SNIFF = 0.07               # the head's sniffing bob (rad)

HIP_Z = 0.36
ANKLE_Z = 0.05            # the foot bone starts here; it stays flat on the ground
TOE = 0.06                # the foot bone reaches this far forward (units)
HIP_Y = {'F': -0.24, 'H': 0.26}
HIP_X = 0.085
FEET = {'FR': (0.087, -0.283), 'FL': (-0.083, -0.192), 'HR': (0.097, 0.295), 'HL': (-0.089, 0.228)}
LEG_E = (0.065, 0.095)    # the leg column's half-width in x and in y
JOINT = 0.13               # the skin blends over this much height at the knee and ankle (units)
LEG_TOP = (0.12, 0.16)     # the skin eases from the leg to the body between HIP_Z-this[0] ... and this[1] further up
CHEST_Y = (0.04, -0.14)    # the body hands over to the chest between these y
HEAD_Y = (-0.04, -0.30)    # and the chest to the head
CHEST_PIV = (-0.10, 0.38)
HEAD_PIV = (-0.30, 0.40)
HEAD_TIP = (-0.48, 0.34)
EARS = {'L': (-0.10, -0.43, 0.53), 'R': (0.10, -0.43, 0.53)}
EAR_R = 0.045
TAIL = [('T0', (0.04, 0.33, 0.36), (0.04, 0.36, 0.27), 0.032), ('T1', (0.04, 0.36, 0.27), (0.04, 0.37, 0.19), 0.03),
        ('T2', (0.04, 0.37, 0.19), (0.04, 0.42, 0.15), 0.03), ('T3', (0.04, 0.42, 0.15), (0.04, 0.50, 0.14), 0.045)]
V = lambda p: (0, p[0], p[1])

mesh = load(src, TRIS, pick=lambda n: n.startswith('tripo'), turn=-90)
bones = [('Root', (0, 0, 0), (0, -0.05, 0), None), ('Body', (0, HIP_Y['H'], HIP_Z), (0, 0.05, HIP_Z), 'Root'),
         ('Chest', V(CHEST_PIV), V((-0.24, 0.40)), 'Body'), ('Head', V(HEAD_PIV), V(HEAD_TIP), 'Chest')]
for i, (n, h, t, r) in enumerate(TAIL): bones.append((n, h, t, 'Body' if i == 0 else TAIL[i - 1][0]))
for side, p in EARS.items(): bones.append((f'Ear_{side}', p, (p[0] * 1.25, p[1], p[2] + 0.04), 'Head'))
LEGS = {}
for k, (fx, fy) in FEET.items():
    hx, hy = math.copysign(HIP_X, fx), HIP_Y[k[0]]
    hip, foot = (hx, hy, HIP_Z), (fx, fy, ANKLE_Z)
    knee = ((hx + fx) / 2, (hy + fy) / 2, (HIP_Z + ANKLE_Z) / 2)
    LEGS[k] = (hip, knee, foot)
    bones += [(f'{k}_0', hip, knee, 'Chest' if k[0] == 'F' else 'Body'), (f'{k}_1', knee, foot, f'{k}_0'),
              (f'{k}_F', foot, (fx, fy - TOE, 0.0), f'{k}_1')]
arm = armature('lion', bones)
tail_segs = list(TAIL)

def weights(p):
    rem, out = 1.0, {}
    w, near = chain(p, tail_segs, BLEND)
    tm = (1 - smooth(near / 0.012)) * smooth((p.y - 0.30) / 0.03)
    for k, x in w.items(): out[k] = x * tm
    rem -= tm
    for s, c in EARS.items():
        d = (p - Vector(c)).length
        em = min(rem, 1 - smooth((d - EAR_R * 0.5) / EAR_R))
        if em > 0: out[f'Ear_{s}'] = em; rem -= em
    for k, (hip, knee, foot) in LEGS.items():
        if (p.x < 0) != (foot[0] < 0): continue
        f = min(1, max(0, (HIP_Z - p.z) / (HIP_Z - ANKLE_Z)))
        e = math.hypot((p.x - (hip[0] + f * (foot[0] - hip[0]))) / LEG_E[0], (p.y - (hip[1] + f * (foot[1] - hip[1]))) / LEG_E[1])
        lm = min(rem, (1 - smooth((e - 1) / 0.35)) * (1 - smooth((p.z - (HIP_Z - LEG_TOP[0])) / LEG_TOP[1])))
        if lm > 0:
            fw = 1 - smooth((p.z - (ANKLE_Z - JOINT / 2)) / JOINT)
            kw = smooth(((HIP_Z + ANKLE_Z) / 2 + JOINT / 2 - p.z) / JOINT)
            out[f'{k}_F'] = lm * fw; out[f'{k}_1'] = lm * (1 - fw) * kw; out[f'{k}_0'] = lm * (1 - fw) * (1 - kw); rem -= lm
    hm = smooth((HEAD_Y[0] - p.y) / (HEAD_Y[0] - HEAD_Y[1])) * smooth((p.z - 0.25) / 0.05)
    cm = smooth((CHEST_Y[0] - p.y) / (CHEST_Y[0] - CHEST_Y[1]))
    out['Head'] = rem * hm
    out['Chest'] = rem * (1 - hm) * cm
    out['Body'] = rem * (1 - hm) * (1 - cm)
    return out
skin(mesh, arm, weights)

# ---- legs: 2-bone IK in the y–z plane; angles are from straight down, positive swinging the tip BACK (+y)
LG = {}
for k, (hip, knee, foot) in LEGS.items():
    L1 = math.hypot(knee[1] - hip[1], knee[2] - hip[2]); L2 = math.hypot(foot[1] - knee[1], foot[2] - knee[2])
    a0 = math.atan2(knee[1] - hip[1], hip[2] - knee[2]); b0 = math.atan2(foot[1] - knee[1], knee[2] - foot[2])
    LG[k] = (L1, L2, a0, b0)
D0 = HIP_Z - CROUCH - ANKLE_Z       # hip-to-ground when crouched
SWEEP = WALK_SPEED * WALK_PERIOD * DUTY / 2 / SIZE   # half the stance's foot travel, units
print('leg', round(LG['FR'][0] + LG['FR'][1], 3), 'units  hip height', D0)
print('half stride', round(SWEEP, 3), 'units; max reach', round(math.sqrt((LG['FR'][0] + LG['FR'][1]) ** 2 - D0 ** 2), 3))

def ik(k, ty, d, toe=0.0, cancel=0.0):
    """leg k with the foot `ty` behind the hip and `d` below it → {bone: rotation about SIDE}; `cancel` is the parent's
    pitch the hip bone must undo"""
    L1, L2, a0, b0 = LG[k]
    D = min(math.hypot(ty, d), (L1 + L2) * 0.999)
    A = math.acos(max(-1, min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))))
    a1 = math.atan2(ty, d) + (A if k[0] == 'H' else -A)   # the fore knee forward, the hind hock BACKWARD
    ky, kz = L1 * math.sin(a1), L1 * math.cos(a1)
    b1 = math.atan2(ty - ky, d - kz)
    return {f'{k}_0': [(SIDE, a1 - a0 - cancel)], f'{k}_1': [(SIDE, (b1 - b0) - (a1 - a0))], f'{k}_F': [(SIDE, -(b1 - b0) + toe)]}

def rot_about(pt, c, th):
    y, z = pt[0] - c[0], pt[1] - c[1]
    return (c[0] + y * math.cos(th) - z * math.sin(th), c[1] + y * math.sin(th) + z * math.cos(th))

def stand(r, pb=0.0, pc=0.0, roll=0.0, yaw=0.0):
    """every foot kept where the mesh has it while the body pitches `pb` about the hind hips and the chest `pc` more"""
    for k, (hip, knee, foot) in LEGS.items():
        h = (hip[1], hip[2])
        th = pb
        if k[0] == 'F':
            h = rot_about(h, (HIP_Y['H'], HIP_Z), pb); h = rot_about(h, rot_about(CHEST_PIV, (HIP_Y['H'], HIP_Z), pb), pc); th = pb + pc
        r.update(ik(k, foot[1] - h[0], h[1] - ANKLE_Z, 0.0, th))
        r[f'{k}_0'] = r[f'{k}_0'] + [(FWD, -roll)]
    return r

def sway(s, ph, n=1): return math.sin(TAU * n * s + ph)

def tail_pose(r, s, amp, swish=0.0, freq=1):
    """the tail hangs and drifts; `swish` flicks it side to side"""
    for i, (n, _, _, _) in enumerate(TAIL):
        sw = swish * TAIL_SWISH * math.sin(TAU * 3 * s - 0.9 * i)
        r[n] = [(FWD, amp * 0.5 * sway(s, -0.8 * i, freq) + sw), (SIDE, 0.12 * amp * sway(s, -0.6 * i + 1, 2 * freq)),
                (UP, (0.6 * sw if i >= 2 else 0) + 0.5 * amp * sway(s, -0.8 * i + 2, freq) * (i >= 2))]

def pose_idle(t):
    s = t / IDLE_S
    r = stand({}, 0, 0, 0.012 * sway(s, 0))
    r['Body'] = [(FWD, 0.012 * sway(s, 0)), (SIDE, -BREATH * sway(s, 0, 4)), (UP, 0.01 * sway(s, 1))]
    r['Chest'] = [(SIDE, BREATH * sway(s, 0, 4)), (UP, -0.01 * sway(s, 1))]
    look = bump(s, 0.05, 0.2, 0.3, 0.42) - bump(s, 0.45, 0.58, 0.68, 0.8)       # left, then right
    r['Head'] = [(UP, HEAD_TURN * look + 0.04 * sway(s, 0.5, 3)), (SIDE, NOD * sway(s, 0.4, 2) * 0.7 - 0.05 * abs(look)),
                 (FWD, 0.1 * look)]
    f1 = bump(s, 0.12, 0.15, 0.17, 0.2) + bump(s, 0.7, 0.72, 0.74, 0.77)
    f2 = bump(s, 0.5, 0.52, 0.54, 0.57)
    r['Ear_L'] = [(FWD, EAR_FLICK * f1), (UP, -0.3 * f1)]; r['Ear_R'] = [(FWD, -EAR_FLICK * f2), (UP, 0.3 * f2)]
    tail_pose(r, s, 0.12, swish=bump(s, 0.3, 0.38, 0.5, 0.6) + bump(s, 0.8, 0.85, 0.92, 0.97))
    return r, 0.003 * sway(s, 0, 4)

def pose_browse(t):
    s = t / BROWSE_S
    down = bump(s, 0.08, 0.3, 0.72, 0.92)
    r = stand({}, DIP_BODY * down, DIP_CHEST * down, 0.0)
    r['Body'] = [(SIDE, DIP_BODY * down), (UP, 0.015 * sway(s, 0) * down)]
    r['Chest'] = [(SIDE, DIP_CHEST * down), (UP, 0.04 * sway(s, 0.5, 3) * down)]
    r['Head'] = [(SIDE, DIP_HEAD * down + SNIFF * sway(s, 0, 7) * down), (UP, 0.3 * sway(s, 0.3, 2) * down)]
    f = bump(s, 0.4, 0.42, 0.44, 0.47)
    r['Ear_L'] = [(FWD, 0.3 * f)]; r['Ear_R'] = [(FWD, -0.15 * sway(s, 0, 5) * down)]
    tail_pose(r, s, 0.1, swish=bump(s, 0.45, 0.55, 0.7, 0.8))
    return r, 0.0

def pose_walk(t):
    s = t / WALK_PERIOD
    r = {}
    PH = {'HL': 0.0, 'FL': 0.25, 'HR': 0.5, 'FR': 0.75}
    roll = 0.03 * sway(s, 0, 2)
    cyaw = 0.07 * sway(s, 0.4, 1)         # the shoulders swing against the hips
    byaw = -0.04 * sway(s, 0.4, 1)
    for k in LEGS:
        ph = (s - PH[k]) % 1
        if ph < DUTY:
            ty = -SWEEP + 2 * SWEEP * ph / DUTY; lift = 0
        else:
            u = (ph - DUTY) / (1 - DUTY)
            ty = SWEEP - 2 * SWEEP * (0.5 - 0.5 * math.cos(math.pi * u)); lift = math.sin(math.pi * u) * LIFT
        r.update(ik(k, ty, D0 - lift, TOE_DOWN * lift / LIFT))
        yaw = cyaw + byaw if k[0] == 'F' else byaw
        r[f'{k}_0'] = r[f'{k}_0'] + [(FWD, -roll), (UP, -yaw)]
    r['Body'] = [(FWD, roll), (UP, byaw)]
    r['Chest'] = [(FWD, -0.5 * roll), (UP, cyaw), (SIDE, 0.015 * sway(s, 0.6, 2))]
    r['Head'] = [(UP, -0.6 * cyaw + 0.03 * sway(s, 1, 1)), (SIDE, -0.03 * sway(s, 0.9, 2))]
    f = bump(s, 0.62, 0.64, 0.66, 0.7)
    r['Ear_L'] = [(FWD, 0.2 * f)]; r['Ear_R'] = [(FWD, 0)]
    tail_pose(r, s, 0.2)
    return r, -CROUCH

CLIPS = [('idle', IDLE_S, pose_idle), ('browse', BROWSE_S, pose_browse), ('walk', WALK_PERIOD, pose_walk)]
bake(arm, CLIPS, FPS)
export(dst)
if preview_dir: preview(arm, CLIPS, FPS, preview_dir, 0.3, float(os.environ.get('PV_SCALE', 1.15)), per=int(os.environ.get('PV_PER', 6)), res=int(os.environ.get('PV_RES', 200)))
