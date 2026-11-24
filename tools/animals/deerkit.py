# What doe-clips.py and fawn-clips.py share (deer-clips.py, the stag, keeps its own copy): a rig for a Tripo deer that
# faces −y — body, chest, a three-bone neck, a head, two ears, a tail and a hip->knee->foot->toe chain at each corner
# solved by a 2-bone IK each frame (fore knees forward, hind hocks backward) — skinned by where each vertex is, and
# the clips idle, browse and walk. `run(C)` takes a config object (the caller's module-level constants) with:
#   src dst preview_dir TRIS FPS SIZE IDLE_S BROWSE_S WALK_PERIOD WALK_SPEED DUTY LIFT CROUCH BOUNCE TOE_DOWN HEAD_TURN ALERT
#   EAR_FLICK EAR_AX TAIL_FLICK BLEND BROWSE_NECK BROWSE_HEAD BROWSE_CHEST CROP CROP_CYC BOB HIP_Z ANKLE_Z XC FEET ANKLE KNEE HIP_Y
#   TOEP STANCE LEG_R LEG_TOP CHEST_PIV BODY_PIV CHEST_Y NECK_PTS NECK_YMAX NECK_Z0 HEAD_TIP KNOTS EARS EAR_R EAR_ROOT TAILB
#   TAIL_YZ REST_TURN HOOF_C FLICKS (idle ear/tail event times) PV (preview z, scale), SHIFT (x shift applied to the mesh), TURN
# Rotations are about world axes (rigkit.py); the rest posture of a Tripo deer is whatever it was modelled in (a head
# turned sideways, a leg mid-stride), so REST_TURN straightens the neck and head and the IK puts every foot on its
# STANCE spot in idle and browse.
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rigkit import *


def run(C):
    mesh = load(C.src, C.TRIS, pick=lambda n: True, turn=C.TURN)
    if C.SHIFT:
        mesh.location.x += C.SHIFT; bpy.ops.object.transform_apply(location=True)
    V = lambda p: (C.XC, p[0], p[1])
    NP = C.NECK_PTS
    bones = [('Root', (0, 0, 0), (0, -0.05, 0), None), ('Body', V(C.BODY_PIV), (C.XC, C.BODY_PIV[0] + 0.1, C.BODY_PIV[1]), 'Root'),
             ('Chest', V(C.CHEST_PIV), NP[0], 'Body')]
    for i in range(3): bones.append((f'N{i}', NP[i], NP[i + 1], 'Chest' if i == 0 else f'N{i - 1}'))
    bones.append(('Head', NP[3], C.HEAD_TIP, 'N2'))
    for s, (h, t) in C.EARS.items(): bones.append((f'Ear_{s}', h, t, 'Head'))
    bones.append(('Tail', C.TAILB[0], C.TAILB[1], 'Body'))
    LEGS = {}
    for k, (fx, fy) in C.FEET.items():
        hip = (fx, C.HIP_Y[k[0]], C.HIP_Z); kn = C.KNEE[k]; knee = (fx, kn[0], kn[1]); foot = (fx, fy, C.ANKLE[k])
        toe = (fx, fy + C.TOEP[k][0], C.ANKLE[k] + C.TOEP[k][1])
        LEGS[k] = (hip, knee, foot, toe)
        bones += [(f'{k}_0', hip, knee, 'Chest' if k[0] == 'F' else 'Body'), (f'{k}_1', knee, foot, f'{k}_0'),
                  (f'{k}_F', foot, toe, f'{k}_1')]
    arm = armature('deer', bones)

    nax = Vector(NP[3]) - Vector(NP[0]); NL2 = nax.length_squared

    def knot_w(u):
        names = ['Chest', 'N0', 'N1', 'N2', 'Head']
        K = C.KNOTS
        if u <= K[0]: return {'Chest': 1.0}
        if u >= K[-1]: return {'Head': 1.0}
        for i in range(4):
            if u <= K[i + 1]:
                f = smooth((u - K[i]) / (K[i + 1] - K[i])); return {names[i]: 1 - f, names[i + 1]: f}

    def weights(p):
        rem, out = 1.0, {}
        d = seg_dist(p, *C.TAILB)
        tm = (1 - smooth((d - 0.02) / 0.03)) * smooth((p.y - C.TAIL_YZ[0]) / 0.03) * smooth((p.z - C.TAIL_YZ[1]) / 0.04)
        if tm > 0: out['Tail'] = tm; rem -= tm
        best = None
        for s, (h, t) in C.EARS.items():
            _, f = intersect_point_line(p, Vector(h), Vector(t))
            em = (1 - smooth((seg_dist(p, h, t) - C.EAR_R) / 0.03)) * smooth((f - C.EAR_ROOT[0]) / C.EAR_ROOT[1])
            if best is None or em > best[0]: best = (em, s)
        if best[0] > 0:
            em = min(rem, best[0]); out[f'Ear_{best[1]}'] = em; rem -= em
        best = None
        for k, (hip, knee, foot, toe) in LEGS.items():
            if (p.x < C.XC) != (foot[0] < C.XC): continue
            if (k[0] == 'F') != (p.y < C.FH_Y): continue
            r = C.LEG_R[k[0]]
            w, near = chain(p, [(f'{k}_0', hip, knee, r[0]), (f'{k}_1', knee, foot, r[1]), (f'{k}_F', foot, toe, r[2])], C.BLEND)
            lm = (1 - smooth(near / 0.03)) * (1 - smooth((p.z - (C.HIP_Z - C.LEG_TOP[0])) / C.LEG_TOP[1]))
            if best is None or lm > best[0]: best = (lm, w)
        if best and best[0] > 0:
            lm = min(rem, best[0])
            for kk, x in best[1].items(): out[kk] = out.get(kk, 0) + x * lm
            rem -= lm
        if p.y < C.NECK_YMAX:
            u = (p - Vector(NP[0])).dot(nax) / NL2
            nm = smooth((p.z - C.NECK_Z0) / 0.06)
            for kk, x in knot_w(u).items(): out[kk] = out.get(kk, 0) + rem * nm * x
            rem *= 1 - nm
        cm = smooth((C.CHEST_Y[0] - p.y) / (C.CHEST_Y[0] - C.CHEST_Y[1]))
        out['Chest'] = out.get('Chest', 0) + rem * cm
        out['Body'] = rem * (1 - cm)
        return out
    skin(mesh, arm, weights)

    # ---- legs: 2-bone IK in the y–z plane; angles are from straight down, positive swinging the tip BACK (+y)
    LG = {}
    for k, (hip, knee, foot, toe) in LEGS.items():
        L1 = math.hypot(knee[1] - hip[1], knee[2] - hip[2]); L2 = math.hypot(foot[1] - knee[1], foot[2] - knee[2])
        a0 = math.atan2(knee[1] - hip[1], hip[2] - knee[2]); b0 = math.atan2(foot[1] - knee[1], knee[2] - foot[2])
        c0 = math.atan2(toe[1] - foot[1], foot[2] - toe[2])
        LG[k] = (L1, L2, a0, b0, c0)
    SWEEP = C.WALK_SPEED * C.WALK_PERIOD * C.DUTY / 2 / C.SIZE
    print('leg', {k: round(LG[k][0] + LG[k][1], 3) for k in LG}, 'stand drop', C.HIP_Z - C.ANKLE_Z, 'half stride', round(SWEEP, 3))

    def ik(k, ty, d, tilt=0.0, parent=0.0):
        """the ankle at ty (+ back of the hip) and d below it; the hoof's own pitch is C.HOOF_C + tilt"""
        L1, L2, a0, b0, c0 = LG[k]
        D = min(math.hypot(ty, d), (L1 + L2) * 0.999)
        A = math.acos(max(-1, min(1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))))
        a1 = math.atan2(ty, d) + (A if k[0] == 'H' else -A)   # the fore knee forward, the hind hock BACKWARD
        ky, kz = L1 * math.sin(a1), L1 * math.cos(a1)
        b1 = math.atan2(ty - ky, d - kz)
        return {f'{k}_0': [(SIDE, a1 - a0 - parent)], f'{k}_1': [(SIDE, (b1 - b0) - (a1 - a0) + parent)],
                f'{k}_F': [(SIDE, -(b1 - b0) + (C.HOOF_C - c0) + tilt)]}

    def stand(r, lift=0.0, chest=0.0):
        """every foot on its stance spot (the fore legs hang from the chest, so they undo its bend)"""
        for k, (hip, knee, foot, toe) in LEGS.items():
            r.update(ik(k, C.STANCE[k] - hip[1], C.HIP_Z + lift - C.ANKLE_Z, 0.0, chest if k[0] == 'F' else 0.0))

    def sway(s, ph, n=1): return math.sin(TAU * n * s + ph)

    def neck(r, bend, turn, rest=1.0):
        """bend: per-bone SIDE rads (N0, N1, N2); turn: UP rads shared along the neck; rest: how much of the modelled
        sideways lean/turn (REST_TURN) is straightened out"""
        for i, w in enumerate((0.15, 0.3, 0.55)):
            r[f'N{i}'] = [(SIDE, bend[i]), (UP, turn * w + C.REST_TURN[i] * rest)]

    def head(r, side, turn, roll=0.0, rest=1.0):
        r['Head'] = [(SIDE, side), (UP, turn + C.REST_TURN[3] * rest)] + ([(FWD, roll)] if roll else [])

    def ear(name, f, amp):
        return [(ax, c * amp * f) for ax, c in C.EAR_AX[name]]

    def tail_flick(r, f, s):
        r['Tail'] = [(SIDE, -C.TAIL_FLICK * f), (FWD, 0.25 * f * sway(s, 0, 9))]

    def pose_idle(t):
        s = t / C.IDLE_S
        up = bump(s, 0.04, 0.12, 0.9, 0.97)
        look = bump(s, 0.18, 0.3, 0.36, 0.46) - bump(s, 0.56, 0.68, 0.74, 0.86)
        r = {}
        neck(r, (-C.ALERT * 0.3 * up, -C.ALERT * 0.4 * up, -C.ALERT * 0.3 * up), C.HEAD_TURN * 0.6 * look)
        r['N1'] = r['N1'] + [(FWD, 0.04 * sway(s, 0, 3))]
        head(r, -0.12 * up + 0.05 * sway(s, 0.5, 3) * up, C.HEAD_TURN * 0.4 * look, 0.08 * look)
        a, b = C.FLICKS['idle']
        f1 = sum(bump(s, x - 0.02, x, x + 0.02, x + 0.05) for x in a)
        f2 = sum(bump(s, x - 0.02, x, x + 0.02, x + 0.05) for x in b)
        r['Ear_L'] = ear('L', f1, C.EAR_FLICK); r['Ear_R'] = ear('R', f2, C.EAR_FLICK)
        tail_flick(r, sum(bump(s, x - 0.03, x, x + 0.03, x + 0.07) for x in C.FLICKS['tail']), s)
        r['Chest'] = [(SIDE, 0.01 * sway(s, 0, 5))]
        stand(r)
        return r, 0.002 * sway(s, 0, 5)

    def pose_browse(t):
        s = t / C.BROWSE_S
        down = bump(s, 0.06, 0.2, 0.40, 0.50) + bump(s, 0.66, 0.78, 0.93, 0.99) - bump(s, 0.06, 0.2, 0.40, 0.50) * bump(s, 0.66, 0.78, 0.93, 0.99)
        down = min(1.0, down)
        turn = (bump(s, 0.5, 0.54, 0.56, 0.6) - bump(s, 0.58, 0.62, 0.64, 0.66)) * 0.7
        crop = 0.5 * (1 - math.cos(TAU * C.CROP_CYC * s)) * (1 if down > 0.95 else 0)
        r = {}
        neck(r, [b * down for b in C.BROWSE_NECK], turn * (1 - down))
        r['Chest'] = [(SIDE, C.BROWSE_CHEST * down)]
        head(r, C.BROWSE_HEAD * down + C.CROP * crop - 0.05 * (1 - down), turn * 0.4 * (1 - down) + 0.1 * sway(s, 0, 6) * down)
        f = sum(bump(s, x - 0.02, x, x + 0.02, x + 0.05) for x in C.FLICKS['browse'][0])
        g = sum(bump(s, x - 0.02, x, x + 0.02, x + 0.05) for x in C.FLICKS['browse'][1])
        r['Ear_L'] = ear('L', f, C.EAR_FLICK); r['Ear_R'] = ear('R', g, C.EAR_FLICK * 0.8)
        tail_flick(r, sum(bump(s, x - 0.03, x, x + 0.03, x + 0.07) for x in C.FLICKS['browse'][2]), s)
        stand(r, 0.0, C.BROWSE_CHEST * down)
        return r, 0.0

    def pose_walk(t):
        s = t / C.WALK_PERIOD
        r = {}
        PH = {'HL': 0.0, 'FL': 0.25, 'HR': 0.5, 'FR': 0.75}
        lift0 = -C.CROUCH + C.BOUNCE * (0.5 - 0.5 * math.cos(TAU * 2 * s))   # the whole animal's rise, twice a stride
        for k, (hip, knee, foot, toe) in LEGS.items():
            ph = (s - PH[k]) % 1
            ty0 = C.STANCE[k] - hip[1]
            if ph < C.DUTY:
                ty = -SWEEP + 2 * SWEEP * ph / C.DUTY; lift = 0
            else:
                u = (ph - C.DUTY) / (1 - C.DUTY)
                ty = SWEEP - 2 * SWEEP * (0.5 - 0.5 * math.cos(math.pi * u)); lift = math.sin(math.pi * u) * C.LIFT
            r.update(ik(k, ty0 + ty, C.HIP_Z + lift0 - C.ANKLE_Z - lift, C.TOE_DOWN * lift / C.LIFT))
        roll = 0.02 * sway(s, 0, 2)
        r['Body'] = [(FWD, roll), (UP, -0.025 * sway(s, 0.4))]
        r['Chest'] = [(FWD, -0.5 * roll), (UP, 0.04 * sway(s, 0.4)), (SIDE, 0.01 * sway(s, 0.6, 2))]
        neck(r, (-0.04, -0.05, -0.05), -0.05 * sway(s, 0.4))
        for i in range(3): r[f'N{i}'] = r[f'N{i}'] + [(SIDE, C.BOB * 0.5 * sway(s, 0.9, 2))]
        head(r, 0.08 + C.BOB * sway(s, 1.2, 2), 0.03 * sway(s, 1))
        f = bump(s, 0.62, 0.64, 0.66, 0.7)
        r['Ear_L'] = ear('L', f, 0.2); r['Ear_R'] = ear('R', bump(s, 0.12, 0.14, 0.16, 0.2), 0.2)
        tail_flick(r, 0.0, s)
        return r, lift0

    CLIPS = [('idle', C.IDLE_S, pose_idle), ('browse', C.BROWSE_S, pose_browse), ('walk', C.WALK_PERIOD, pose_walk)]
    bake(arm, CLIPS, C.FPS)
    export(C.dst)
    if C.preview_dir:
        pv = [c for c in CLIPS if c[0] in os.environ.get('PV_CLIP', 'idle,browse,walk').split(',')]
        preview(arm, pv, C.FPS, C.preview_dir, C.PV[0], float(os.environ.get('PV_SCALE', C.PV[1])),
                per=int(os.environ.get('PV_PER', 6)), res=int(os.environ.get('PV_RES', 200)))
