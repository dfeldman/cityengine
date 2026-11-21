# Blender headless: Tripo's elephant has NO rig. This builds a body, a head, a five-bone trunk, an ear bone each side
# and a two-bone leg at each corner (hip->knee->foot, solved by a 2-bone IK each frame), skins it by where each vertex
# is, and writes the clips render/zoo.ts plays:
#   blender -b -P tools/animals/elephant-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — standing: the ears flapping slowly, the trunk swaying and now and then curling, weight shifting
#   browse — the trunk reaches down to the grass, curls up to the mouth, again (the head dips to help)
#   walk   — one stride of the slow four-beat walk (LH, LF, RH, RF a quarter stride apart), baked in place; the game
#            moves the animal at WALK_SPEED
#
# Faces −y, z up, normalised 0.659 tall (shoulder), 0.98 long. Measured (2026-11-20): the head and trunk at the −y end,
# the trunk hanging from (−0.33, 0.54) to a curled tip near (−0.34, 0.06), tusks at |x| 0.06–0.1 out to y −0.49; ears
# at |x| 0.12–0.31, y −0.27…−0.15; the pose is mid-stride: the feet at FR (0.085,−0.25) FL (−0.075,−0.06)
# HR (0.09,0.25) HL (−0.085,0.30).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigkit import *

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview_dir = a[2] if len(a) > 2 else None

TRIS = 15000
FPS = 24
SIZE = 4.75                # metres per model unit (render/zoo.ts SPECIES.elephant.size): ~3.1 m at the shoulder
IDLE_S = 10.0
BROWSE_S = 9.0
WALK_PERIOD = 2.6
WALK_SPEED = 0.4           # m/s the game moves it; the stance's foot travel is matched to it
DUTY = 0.75                # four-beat walk: three feet down at a time
LIFT = 0.04                # the swinging foot's height (units)
CROUCH = 0.005             # the hips sit this low in the walk so the legs can reach (units)
EAR_FLAP = 0.22            # rad
CURL = 0.3                # idle: the trunk's tip curling forward, rad per bone
EAR_CYCLES = 4             # per idle loop
ROLL = 0.03                # idle weight shift (rad)
BLEND = 0.03
# browse: where each trunk bone points (degrees from forward, 90 up; hanging is -90): reach, then curl to the mouth
REACH_DIR = {'T0': -58, 'T1': -60, 'T2': -66, 'T3': -72, 'T4': -78}
CURL_DIR = {'T0': -65, 'T1': -15, 'T2': 45, 'T3': 110, 'T4': 175}
HEAD_DIP = 0.18            # the head's bow when reaching (rad)

HIP_Z = 0.40
ANKLE_Z = 0.07            # the foot bone starts here; it stays flat on the ground
TOE = 0.05                # the foot bone reaches this far forward (units)
TOE_DOWN = 0.2            # rad the toe dips in mid-swing
HIP_Y = {'F': -0.16, 'H': 0.24}
HIP_X = 0.12
FEET = {'FR': (0.085, -0.25), 'FL': (-0.075, -0.06), 'HR': (0.09, 0.25), 'HL': (-0.085, 0.30)}
LEG_E = (0.072, 0.11)     # the leg column's half-width in x and in y
JOINT = 0.08               # the skin blends over this much height at the knee and ankle (units)
LEG_TOP = (0.16, 0.34)      # the skin eases from the leg to the body between HIP_Z-this[0] ... and this[1] further up
TRUNK = [('T0', (-0.33, 0.54), (-0.352, 0.44), 0.05), ('T1', (-0.352, 0.44), (-0.372, 0.34), 0.046),
         ('T2', (-0.372, 0.34), (-0.38, 0.24), 0.042), ('T3', (-0.38, 0.24), (-0.376, 0.14), 0.04),
         ('T4', (-0.376, 0.14), (-0.27, 0.09), 0.05)]
EAR_X0 = 0.115             # ears start here (|x|)
EAR_ROOT_Y, EAR_ROOT_Z = -0.19, 0.55
EAR_TIP = (0.31, -0.19, 0.5)
HEAD_Y0 = -0.14            # the head starts to take over from the body between here and 0.06 further forward
V = lambda p: (0, p[0], p[1])

mesh = load(src, TRIS)
bones = [('Root', (0, 0, 0), (0, -0.05, 0), None), ('Body', (0, 0.05, HIP_Z), (0, 0.05, HIP_Z + 0.12), 'Root'),
         ('Head', (0, -0.2, 0.52), (0, -0.36, 0.55), 'Body')]
for i, (n, h, t, r) in enumerate(TRUNK): bones.append((n, V(h), V(t), 'Head' if i == 0 else TRUNK[i - 1][0]))
for side, sx in (('L', -1), ('R', 1)):
    bones.append((f'Ear_{side}', (sx * EAR_X0 * 0.9, EAR_ROOT_Y, EAR_ROOT_Z), (sx * EAR_TIP[0], EAR_TIP[1], EAR_TIP[2]), 'Head'))
LEGS = {}
for k, (fx, fy) in FEET.items():
    hx, hy = math.copysign(HIP_X, fx), HIP_Y[k[0]]
    hip, foot = (hx, hy, HIP_Z), (fx, fy, ANKLE_Z)
    knee = ((hx + fx) / 2, (hy + fy) / 2, (HIP_Z + ANKLE_Z) / 2)
    LEGS[k] = (hip, knee, foot)
    bones += [(f'{k}_0', hip, knee, 'Body'), (f'{k}_1', knee, foot, f'{k}_0'), (f'{k}_F', foot, (fx, fy - TOE, 0.0), f'{k}_1')]
arm = armature('elephant', bones)
segs = [(n, V(h), V(t), r) for n, h, t, r in TRUNK]
REST = [(n, deg(h, t)) for n, h, t, r in TRUNK]
earlen = lambda sx: Vector((sx * EAR_X0, EAR_ROOT_Y, EAR_ROOT_Z))

def weights(p):
    rem, out = 1.0, {}
    w, near = chain(p, segs, BLEND)
    tm = (1 - smooth(near / 0.008)) * smooth((0.60 - p.z) / 0.07)
    if p.z < 0.5: tm *= 1 - smooth((abs(p.x) - 0.052) / 0.012)   # the tusks stay on the head
    if p.y > -0.2: tm = 0
    for k, x in w.items(): out[k] = x * tm
    rem -= tm
    em = smooth((abs(p.x) - EAR_X0) / 0.04) * smooth((p.z - 0.34) / 0.06) * smooth((-p.y - 0.04) / 0.05)
    em = min(rem, em)
    if em > 0: out['Ear_L' if p.x < 0 else 'Ear_R'] = em; rem -= em
    for k, (hip, knee, foot) in LEGS.items():
        if (p.x < 0) != (foot[0] < 0): continue
        # the leg's column: its centre line in plan at this height, an ellipse (the legs are deeper than wide)
        f = min(1, max(0, (HIP_Z - p.z) / (HIP_Z - ANKLE_Z)))
        e = math.hypot((p.x - (hip[0] + f * (foot[0] - hip[0]))) / LEG_E[0], (p.y - (hip[1] + f * (foot[1] - hip[1]))) / LEG_E[1])
        lm = min(rem, (1 - smooth((e - 1) / 0.3)) * (1 - smooth((p.z - (HIP_Z - LEG_TOP[0])) / LEG_TOP[1])))
        if lm > 0:
            # keep the foot and the lower leg together: they follow the lower bone from its knee down
            fw = 1 - smooth((p.z - (ANKLE_Z - JOINT / 2)) / JOINT)
            kw = smooth(((HIP_Z + ANKLE_Z) / 2 + JOINT / 2 - p.z) / JOINT)
            out[f'{k}_F'] = lm * fw; out[f'{k}_1'] = lm * (1 - fw) * kw; out[f'{k}_0'] = lm * (1 - fw) * (1 - kw); rem -= lm
    hm = smooth((-p.y + HEAD_Y0) / 0.06) * smooth((p.z - 0.33) / 0.05)
    out['Head'] = rem * hm; out['Body'] = rem * (1 - hm)
    return out
skin(mesh, arm, weights)

# ---- legs: 2-bone IK in the y–z plane; angles are from straight down, positive swinging the tip BACK (+y)
LG = {}
for k, (hip, knee, foot) in LEGS.items():
    L1 = math.hypot(knee[1] - hip[1], knee[2] - hip[2]); L2 = math.hypot(foot[1] - knee[1], foot[2] - knee[2])
    a0 = math.atan2(knee[1] - hip[1], hip[2] - knee[2]); b0 = math.atan2(foot[1] - knee[1], knee[2] - foot[2])
    LG[k] = (L1, L2, a0, b0)
D0 = HIP_Z - CROUCH - ANKLE_Z       # hip-to-ground when crouched
print('leg', round(LG['FR'][0] + LG['FR'][1], 3), 'units  hip height', D0)
SWEEP = WALK_SPEED * WALK_PERIOD * DUTY / 2 / SIZE   # half the stance's foot travel, units
print('half stride', round(SWEEP, 3), 'units; max reach', round(math.sqrt((LG['FR'][0] + LG['FR'][1]) ** 2 - D0 ** 2), 3))

def ik(k, ty, d, toe=0.0):
    """leg k with the foot `ty` behind the hip and `d` below it → {bone: rotation about SIDE}"""
    L1, L2, a0, b0 = LG[k]
    D = min(math.hypot(ty, d), (L1 + L2) * 0.999)
    A = math.acos(max(-1, min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))))
    a1 = math.atan2(ty, d) - A                       # the knee forward
    ky, kz = L1 * math.sin(a1), L1 * math.cos(a1)
    b1 = math.atan2(ty - ky, d - kz)
    return {f'{k}_0': [(SIDE, a1 - a0)], f'{k}_1': [(SIDE, (b1 - b0) - (a1 - a0))], f'{k}_F': [(SIDE, -(b1 - b0) + toe)]}

def leg_stand_rest(r, roll=0.0):
    """each leg back to its rest pose (the mesh's own stance), the body's roll cancelled at the hip"""
    for k in LEGS: r[f'{k}_0'] = [(FWD, -roll)]
    return r

def sway(s, ph, n=1): return math.sin(TAU * n * s + ph)

def pose_idle(t):
    s = t / IDLE_S
    r = leg_stand_rest({}, ROLL * sway(s, 0))
    r['Body'] = [(FWD, ROLL * sway(s, 0)), (UP, 0.01 * sway(s, 1))]
    r['Head'] = [(UP, 0.07 * sway(s, 0.5)), (SIDE, 0.04 * sway(s, 1.5, 2))]
    curl = bump(s, 0.55, 0.65, 0.75, 0.85)
    swing = {'T0': 0.10, 'T1': 0.14, 'T2': 0.16, 'T3': 0.16, 'T4': 0.14}
    for i, (n, _, _, _) in enumerate(TRUNK):
        r[n] = [(SIDE, swing[n] * sway(s, -0.7 * i, 1) + -CURL * curl * max(0, i - 1)),
                (UP, 0.18 * sway(s, -0.8 * i + 1.0, 2) * (0.5 + 0.2 * i))]
    f = EAR_FLAP * math.sin(TAU * EAR_CYCLES * s)
    r['Ear_R'] = [(UP, -f), (FWD, 0.05 * f)]; r['Ear_L'] = [(UP, f), (FWD, -0.05 * f)]
    return r, 0.004 * sway(s, 0, 2)

def pose_browse(t):
    s = t / BROWSE_S
    # two reach/curl rounds per loop: reach down (0..0.2), hold at the grass, curl up to the mouth (0.3..0.45), eat, back
    def round_(u):
        reach = bump(u, 0.0, 0.2, 0.3, 0.45)
        curl = bump(u, 0.3, 0.45, 0.75, 0.92)
        return reach, curl
    reach, curl = round_((s * 2) % 1)
    r = leg_stand_rest({}, 0)
    rt = bends(REST, REACH_DIR, reach); cu = bends(REST, CURL_DIR, curl)
    # reach first, curl on top of it
    r['Head'] = [(SIDE, HEAD_DIP * reach * (1 - curl * 0.6))]
    for i, (n, _, _, _) in enumerate(TRUNK):
        r[n] = [(SIDE, rt[n] * (1 - curl) + cu[n] * curl), (UP, 0.08 * math.sin(TAU * 3 * s + i) * (reach + curl))]
    f = 0.5 * EAR_FLAP * math.sin(TAU * 3 * s)
    r['Ear_R'] = [(UP, -f)]; r['Ear_L'] = [(UP, f)]
    r['Body'] = [(UP, 0.01 * sway(s, 0))]
    return r, 0.0

def pose_walk(t):
    s = t / WALK_PERIOD
    r = {}
    PH = {'HL': 0.0, 'FL': 0.25, 'HR': 0.5, 'FR': 0.75}
    for k in LEGS:
        ph = (s - PH[k]) % 1
        if ph < DUTY:
            ty = -SWEEP + 2 * SWEEP * ph / DUTY; lift = 0
        else:
            u = (ph - DUTY) / (1 - DUTY)
            ty = SWEEP - 2 * SWEEP * (0.5 - 0.5 * math.cos(math.pi * u)); lift = math.sin(math.pi * u) * LIFT
        r.update(ik(k, ty, D0 - lift, TOE_DOWN * lift / LIFT))
    roll = 0.025 * sway(s, 0, 2)
    r['Body'] = [(FWD, roll), (UP, 0.025 * sway(s, 0.5, 1))]
    for k in LEGS: r[f'{k}_0'] = r[f'{k}_0'] + [(FWD, -roll)]
    r['Head'] = [(SIDE, 0.04 * sway(s, 0.3, 2)), (UP, -0.03 * sway(s, 0.5, 1))]
    for i, (n, _, _, _) in enumerate(TRUNK):
        r[n] = [(SIDE, 0.07 * sway(s, -0.9 * i, 2)), (UP, 0.1 * sway(s, -0.6 * i, 1))]
    f = 0.6 * EAR_FLAP * math.sin(TAU * 2 * s)
    r['Ear_R'] = [(UP, -f)]; r['Ear_L'] = [(UP, f)]
    return r, -CROUCH + 0.006 * sway(s, 0, 4)

CLIPS = [('idle', IDLE_S, pose_idle), ('browse', BROWSE_S, pose_browse), ('walk', WALK_PERIOD, pose_walk)]
bake(arm, CLIPS, FPS)
export(dst)
if preview_dir: preview(arm, CLIPS, FPS, preview_dir, 0.33, float(os.environ.get('PV_SCALE', 1.3)), per=int(os.environ.get('PV_PER', 6)), res=int(os.environ.get('PV_RES', 200)))
