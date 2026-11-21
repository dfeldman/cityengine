# Blender headless: Tripo's red deer stag (buck.glb, unrigged). This turns the mesh to face −y, builds a body, a chest,
# a three-bone neck, a head, two ears, a tail and a two-bone leg + hoof at each corner (hip->knee->foot, solved by a
# 2-bone IK each frame), skins it by where each vertex is, and writes the clips render/zoo.ts plays:
#   blender -b -P tools/animals/deer-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — standing alert: the head comes up, the neck and head turn to look left, then right, the ears flick one at
#            a time and the white tail flicks now and then
#   browse — grazing: the bend is spread over the three neck bones (and the head) so the muzzle reaches the grass,
#            it crops (small chews), the head comes up to look round and goes back down; the legs stay planted
#   walk   — one stride of a deliberate four-beat walk (LH, LF, RH, RF a quarter stride apart), baked in place; the
#            game moves the animal at WALK_SPEED, and the stance's foot travel is matched to it; a slight head bob
#
# As imported (2026-11-20): head toward +x, 0.98 long, 0.98 tall to the antler tips (0.54 at the back, ~0.55 at the
# withers), body 0.22 wide. Turned −90° about z to face −y. Legs: fore feet at y −0.15 (x +0.10, −0.07) and hind feet at
# y 0.38 (x +0.12, −0.13); fore knee z ~0.26, hind hock z ~0.20 and back at y 0.43. Neck rises from the shoulder
# (y −0.10, z 0.50) to the poll (y −0.27, z 0.73); the muzzle is at y −0.49, z ~0.55; the ears spread to x ±0.3 at z 0.62…0.8;
# the antlers fill z 0.8…0.98, y −0.37…−0.11, x ±0.36 (weighted 100% to Head, so they move rigidly).
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigkit import *

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview_dir = a[2] if len(a) > 2 else None

TRIS = 12000
FPS = 24
SIZE = 2.25                # metres per model unit (render/zoo.ts SPECIES.deer.size): ~1.25 m at the shoulder, 2.2 m long
IDLE_S = 10.0
BROWSE_S = 10.0
WALK_PERIOD = 1.6
WALK_SPEED = 0.7           # m/s the game moves it; the stance's foot travel is matched to it
DUTY = 0.68                # four-beat walk: three feet down at a time
LIFT = 0.05                # the swinging hoof's height (units)
CROUCH = 0.04              # the hips sit this low in the walk so the legs can reach (units)
TOE_DOWN = 0.3             # rad the hoof dips in mid-swing
HEAD_TURN = 0.8            # idle: how far the head looks round (rad), shared along the neck and head
ALERT = 0.2                # idle: the neck lifts this much (rad) when the head comes up
EAR_FLICK = 0.5
TAIL_FLICK = 0.5
BLEND = 0.04
# browse
BROWSE_NECK = (0.75, 0.7, 0.6)  # each neck bone's bend (rad) when the head is down: the neck reaches down to the grass
BROWSE_HEAD = -0.75             # and the head, back against the neck's bend so the muzzle points down, not tucked (rad)
BROWSE_CHEST = 0.14
CROP = 0.07                     # the head's cropping bob (rad)
# walk
BOB = 0.035                # the head's bob (rad)

HIP_Z = 0.50
ANKLE_Z = 0.04
TOE = 0.04
FEET = {'FR': (0.10, -0.14), 'FL': (-0.07, -0.15), 'HR': (0.12, 0.38), 'HL': (-0.13, 0.38)}
HIP_Y = {'F': -0.14, 'H': 0.33}
KNEE = {'F': (-0.115, 0.26), 'H': (0.43, 0.20)}     # (y, z)
LEG_R = {'F': (0.055, 0.03, 0.03), 'H': (0.075, 0.03, 0.03)}
LEG_TOP = (0.12, 0.14)     # leg skin fades out between HIP_Z-this[0] and this[1] higher
CHEST_PIV = (-0.02, 0.45)
BODY_PIV = (0.30, 0.45)
CHEST_Y = (0.18, -0.06)    # body hands over to chest between these y
NECK0 = (-0.10, 0.50)
NECK_PTS = [NECK0, (-0.16, 0.58), (-0.22, 0.66), (-0.27, 0.73)]
HEAD_TIP = (-0.49, 0.56)
KNOTS = [-0.25, 0.05, 0.37, 0.68, 1.0]   # along-neck position of Chest, N0, N1, N2, Head influence
EAR = {'L': ((-0.16, -0.36, 0.67), (-0.29, -0.35, 0.78)), 'R': ((0.16, -0.36, 0.67), (0.29, -0.35, 0.78))}
EAR_R = 0.035
TAILB = ((0.0, 0.43, 0.50), (0.0, 0.50, 0.42))
V = lambda p: (0, p[0], p[1])

mesh = load(src, TRIS, pick=lambda n: True, turn=-90)
bones = [('Root', (0, 0, 0), (0, -0.05, 0), None), ('Body', V(BODY_PIV), (0, 0.40, 0.45), 'Root'),
         ('Chest', V(CHEST_PIV), V((-0.10, 0.50)), 'Body')]
for i in range(3): bones.append((f'N{i}', V(NECK_PTS[i]), V(NECK_PTS[i + 1]), 'Chest' if i == 0 else f'N{i - 1}'))
bones.append(('Head', V(NECK_PTS[3]), V(HEAD_TIP), 'N2'))
for s, (h, t) in EAR.items(): bones.append((f'Ear_{s}', h, t, 'Head'))
bones.append(('Tail', TAILB[0], TAILB[1], 'Body'))
LEGS = {}
for k, (fx, fy) in FEET.items():
    hip = (fx, HIP_Y[k[0]], HIP_Z); knee = (fx, KNEE[k[0]][0], KNEE[k[0]][1]); foot = (fx, fy, ANKLE_Z)
    LEGS[k] = (hip, knee, foot)
    bones += [(f'{k}_0', hip, knee, 'Chest' if k[0] == 'F' else 'Body'), (f'{k}_1', knee, foot, f'{k}_0'),
              (f'{k}_F', foot, (fx, fy - TOE, 0.0), f'{k}_1')]
arm = armature('deer', bones)

def seg_dir():
    p = Vector(NECK_PTS[3]) - Vector(NECK_PTS[0]); n = (p[0] ** 2 + p[1] ** 2) ** 0.5
    return (p[0] / n, p[1] / n, n)
ND = seg_dir()

def knot_w(u):
    """tent weights over KNOTS, smoothed → {bone: w}"""
    names = ['Chest', 'N0', 'N1', 'N2', 'Head']
    if u <= KNOTS[0]: return {'Chest': 1.0}
    if u >= KNOTS[-1]: return {'Head': 1.0}
    for i in range(4):
        if u <= KNOTS[i + 1]:
            f = smooth((u - KNOTS[i]) / (KNOTS[i + 1] - KNOTS[i])); return {names[i]: 1 - f, names[i + 1]: f}

def weights(p):
    rem, out = 1.0, {}
    # antlers and the crown: rigid on the Head
    if p.z > 0.79 and p.y < -0.08: return {'Head': 1.0}
    # the tail
    d = seg_dist(p, *TAILB)
    tm = (1 - smooth((d - 0.02) / 0.03)) * smooth((p.y - 0.40) / 0.03) * smooth((p.z - 0.33) / 0.04)
    if tm > 0: out['Tail'] = tm; rem -= tm
    # the ears
    for s, (h, t) in EAR.items():
        if (p.x < 0) != (h[0] < 0): continue
        d = seg_dist(p, h, t)
        em = min(rem, (1 - smooth((d - EAR_R) / 0.03)) * smooth((abs(p.x) - 0.09) / 0.04) * (p.y < -0.25))
        if em > 0: out[f'Ear_{s}'] = em; rem -= em
    # the legs: capsule chain, nearest same-side leg, fading into the body above the hip
    best = None
    for k, (hip, knee, foot) in LEGS.items():
        if (p.x < 0) != (foot[0] < 0): continue
        if (k[0] == 'F') != (p.y < 0.10): continue
        r = LEG_R[k[0]]
        w, near = chain(p, [(f'{k}_0', hip, knee, r[0]), (f'{k}_1', knee, foot, r[1]),
                            (f'{k}_F', foot, (foot[0], foot[1] - TOE, 0.0), r[2])], BLEND)
        lm = (1 - smooth(near / 0.03)) * (1 - smooth((p.z - (HIP_Z - LEG_TOP[0])) / LEG_TOP[1]))
        if best is None or lm > best[0]: best = (lm, w)
    if best and best[0] > 0:
        lm = min(rem, best[0])
        for kk, x in best[1].items(): out[kk] = out.get(kk, 0) + x * lm
        rem -= lm
    if p.y < -0.06:
        u = ((p.y - NECK0[0]) * ND[0] + (p.z - NECK0[1]) * ND[1]) / ND[2]
        nm = smooth((p.z - 0.47) / 0.06)
        for kk, x in knot_w(u).items():
            out[kk] = out.get(kk, 0) + rem * nm * x
        rem *= 1 - nm
    cm = smooth((CHEST_Y[0] - p.y) / (CHEST_Y[0] - CHEST_Y[1]))
    out['Chest'] = out.get('Chest', 0) + rem * cm
    out['Body'] = rem * (1 - cm)
    return out
skin(mesh, arm, weights)

# ---- legs: 2-bone IK in the y–z plane; angles are from straight down, positive swinging the tip BACK (+y)
LG = {}
for k, (hip, knee, foot) in LEGS.items():
    L1 = math.hypot(knee[1] - hip[1], knee[2] - hip[2]); L2 = math.hypot(foot[1] - knee[1], foot[2] - knee[2])
    a0 = math.atan2(knee[1] - hip[1], hip[2] - knee[2]); b0 = math.atan2(foot[1] - knee[1], knee[2] - foot[2])
    LG[k] = (L1, L2, a0, b0)
D0 = HIP_Z - CROUCH - ANKLE_Z
SWEEP = WALK_SPEED * WALK_PERIOD * DUTY / 2 / SIZE
print('leg', {k: round(LG[k][0] + LG[k][1], 3) for k in LG}, 'hip height', D0, 'half stride', round(SWEEP, 3))

def ik(k, ty, d, toe=0.0):
    L1, L2, a0, b0 = LG[k]
    D = min(math.hypot(ty, d), (L1 + L2) * 0.999)
    A = math.acos(max(-1, min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))))
    a1 = math.atan2(ty, d) + (A if k[0] == 'H' else -A)   # the fore knee forward, the hind hock BACKWARD
    ky, kz = L1 * math.sin(a1), L1 * math.cos(a1)
    b1 = math.atan2(ty - ky, d - kz)
    return {f'{k}_0': [(SIDE, a1 - a0)], f'{k}_1': [(SIDE, (b1 - b0) - (a1 - a0))], f'{k}_F': [(SIDE, -(b1 - b0) + toe)]}

def sway(s, ph, n=1): return math.sin(TAU * n * s + ph)

def neck(r, bend, turn, nodw=0.0):
    """bend: per-bone SIDE rads (N0, N1, N2); turn: UP rads shared along the neck (more at the top)"""
    for i, w in enumerate((0.15, 0.3, 0.55)):
        r[f'N{i}'] = [(SIDE, bend[i]), (UP, turn * w)]

def tail_flick(r, f, s):
    r['Tail'] = [(SIDE, -TAIL_FLICK * f), (FWD, 0.25 * f * sway(s, 0, 9))]

def pose_idle(t):
    s = t / IDLE_S
    up = bump(s, 0.04, 0.12, 0.9, 0.97)                  # the head comes up and stays up
    look = bump(s, 0.18, 0.3, 0.36, 0.46) - bump(s, 0.56, 0.68, 0.74, 0.86)
    r = {}
    neck(r, (-ALERT * 0.3 * up, -ALERT * 0.4 * up, -ALERT * 0.3 * up), HEAD_TURN * 0.6 * look)
    r['N1'] = r['N1'] + [(FWD, 0.04 * sway(s, 0, 3))]
    r['Head'] = [(UP, HEAD_TURN * 0.4 * look), (SIDE, -0.12 * up + 0.05 * sway(s, 0.5, 3) * up), (FWD, 0.08 * look)]
    f1 = bump(s, 0.1, 0.12, 0.14, 0.17) + bump(s, 0.62, 0.64, 0.66, 0.69) + bump(s, 0.9, 0.915, 0.93, 0.95)
    f2 = bump(s, 0.5, 0.52, 0.54, 0.57) + bump(s, 0.28, 0.295, 0.31, 0.33)
    r['Ear_L'] = [(FWD, EAR_FLICK * f1), (UP, -0.3 * f1)]; r['Ear_R'] = [(FWD, -EAR_FLICK * f2), (UP, 0.3 * f2)]
    tail_flick(r, bump(s, 0.22, 0.25, 0.28, 0.32) + bump(s, 0.74, 0.77, 0.8, 0.83), s)
    r['Chest'] = [(SIDE, 0.01 * sway(s, 0, 5))]
    return r, 0.002 * sway(s, 0, 5)

def pose_browse(t):
    s = t / BROWSE_S
    down = bump(s, 0.06, 0.2, 0.40, 0.50) + bump(s, 0.66, 0.78, 0.93, 0.99) - bump(s, 0.06, 0.2, 0.40, 0.50) * bump(s, 0.66, 0.78, 0.93, 0.99)
    down = min(1.0, down)
    look = bump(s, 0.5, 0.56, 0.6, 0.64) - bump(s, 0.6, 0.64, 0.64, 0.66) * 0   # the head is up, looking round
    turn = (bump(s, 0.5, 0.54, 0.56, 0.6) - bump(s, 0.58, 0.62, 0.64, 0.66)) * 0.7
    crop = 0.5 * (1 - math.cos(TAU * 3 * s * 2)) * down * (1 if (down > 0.95) else 0)
    r = {}
    neck(r, [b * down for b in BROWSE_NECK], turn * (1 - down))
    r['Chest'] = [(SIDE, BROWSE_CHEST * down)]
    r['Head'] = [(SIDE, BROWSE_HEAD * down + CROP * crop - 0.05 * (1 - down)), (UP, turn * 0.4 * (1 - down) + 0.1 * sway(s, 0, 6) * down)]
    f = bump(s, 0.3, 0.32, 0.34, 0.37) + bump(s, 0.82, 0.84, 0.86, 0.88)
    r['Ear_L'] = [(FWD, EAR_FLICK * f)]; r['Ear_R'] = [(FWD, -EAR_FLICK * 0.8 * (bump(s, 0.15, 0.17, 0.19, 0.22) + bump(s, 0.88, 0.9, 0.92, 0.95)))]
    tail_flick(r, bump(s, 0.7, 0.72, 0.75, 0.78), s)
    return r, 0.0

def pose_walk(t):
    s = t / WALK_PERIOD
    r = {}
    PH = {'HL': 0.0, 'FL': 0.25, 'HR': 0.5, 'FR': 0.75}
    for k in LEGS:
        ph = (s - PH[k]) % 1
        ty0 = LEGS[k][2][1] - LEGS[k][0][1]
        if ph < DUTY:
            ty = -SWEEP + 2 * SWEEP * ph / DUTY; lift = 0
        else:
            u = (ph - DUTY) / (1 - DUTY)
            ty = SWEEP - 2 * SWEEP * (0.5 - 0.5 * math.cos(math.pi * u)); lift = math.sin(math.pi * u) * LIFT
        r.update(ik(k, ty0 + ty, D0 - lift, TOE_DOWN * lift / LIFT))
    roll = 0.02 * sway(s, 0, 2)
    r['Body'] = [(FWD, roll), (UP, -0.025 * sway(s, 0.4))]
    r['Chest'] = [(FWD, -0.5 * roll), (UP, 0.04 * sway(s, 0.4)), (SIDE, 0.01 * sway(s, 0.6, 2))]
    neck(r, (-0.04, -0.05, -0.05), -0.05 * sway(s, 0.4))
    for i in range(3): r[f'N{i}'] = r[f'N{i}'] + [(SIDE, BOB * 0.5 * sway(s, 0.9, 2))]
    r['Head'] = [(SIDE, 0.08 + BOB * sway(s, 1.2, 2)), (UP, 0.03 * sway(s, 1))]
    f = bump(s, 0.62, 0.64, 0.66, 0.7)
    r['Ear_L'] = [(FWD, 0.2 * f)]
    tail_flick(r, 0.0, s)
    return r, -CROUCH

CLIPS = [('idle', IDLE_S, pose_idle), ('browse', BROWSE_S, pose_browse), ('walk', WALK_PERIOD, pose_walk)]
bake(arm, CLIPS, FPS)
export(dst)
if preview_dir: preview(arm, CLIPS, FPS, preview_dir, 0.5, float(os.environ.get('PV_SCALE', 1.25)), per=int(os.environ.get('PV_PER', 6)), res=int(os.environ.get('PV_RES', 200)))
