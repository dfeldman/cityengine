# Blender headless: Tripo's fawn (fawn.glb, a spotted fallow-type fawn, unrigged). The shared rig and clips live in deerkit.py;
# this file is the fawn's measurements and tuning constants:
#   blender -b -P tools/animals/fawn-clips.py -- <in.glb> <out.glb> [preview-dir]
#
#   idle   — skittish alert: quick head turns and ear flicks (6 s loop), the tail flicks
#   browse — grazing, but jumpy: shorter loop, quicker cropping and head-ups
#   walk   — four-beat walk baked in place, matched to WALK_SPEED (the doe's, so the fawn keeps up), a shorter, bouncier stride
#
# As imported (2026-11-20): 0.98 TALL to the ear tips (normalised by height), 0.98 long along y, already facing −y (no turn), body
# centred on x 0. Withers/back 0.71 high, belly 0.40, ~0.25 wide. MODELLED MID-STRIDE: the +x fore leg is lifted and folded back
# (fetlock y −0.085, z 0.12, hoof tip y −0.02, z 0.06, pointing down-back), the −x fore leg is planted forward (foot y −0.16),
# the +x hind foot at y 0.32 and the −x hind at y 0.44, both hocks back at y 0.44…0.49, z ~0.3. The IK puts every foot on its STANCE
# spot (fore y −0.16, hind y 0.37) in idle and browse. The head hangs turned ~25° toward −x (muzzle x −0.15, y −0.48, z 0.71;
# poll y −0.29, z 0.84): REST_TURN straightens it. Ears: tips x −0.17 (y −0.14, z 0.98) and x +0.17. SIZE 1.05 → ~0.75 m at the
# withers, ~1.0 m long, 1.03 m to the ear tips.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import deerkit
from rigkit import FWD, UP, SIDE

a = sys.argv[sys.argv.index('--') + 1:]
src, dst = a[0], a[1]
preview_dir = a[2] if len(a) > 2 else None
TURN = 0
SHIFT = 0.0
TRIS = 12000
FPS = 24
SIZE = 1.05                # metres per model unit (render/zoo.ts SPECIES.fawn.size)
IDLE_S = 6.0
BROWSE_S = 7.0
WALK_PERIOD = 0.8
WALK_SPEED = 0.7           # m/s, the doe's: the fawn takes quicker, shorter steps to keep up
DUTY = 0.66
LIFT = 0.06
CROUCH = 0.025
BOUNCE = 0.015             # the whole animal's rise twice a stride
TOE_DOWN = 0.3
HEAD_TURN = 1.0
ALERT = 0.25
EAR_FLICK = 0.8
TAIL_FLICK = 0.7
BLEND = 0.04
BROWSE_NECK = (0.75, 0.75, 0.65)
BROWSE_HEAD = -0.7
BROWSE_CHEST = 0.3
CROP = 0.1
CROP_CYC = 8
BOB = 0.05
REST_TURN = (0.0, 0.0, 0.1, 0.4)   # +z turns the head from toward −x back to −y: N0, N1, N2, Head
HOOF_C = -0.7
HIP_Z = 0.485
ANKLE_Z = 0.045
XC = 0.02
FH_Y = 0.10
FEET = {'FR': (0.09, -0.085), 'FL': (-0.05, -0.143), 'HR': (0.08, 0.34), 'HL': (-0.12, 0.46)}   # (x, ankle y) as modelled
ANKLE = {'FR': 0.12, 'FL': 0.07, 'HR': 0.05, 'HL': 0.05}                                          # ankle z as modelled
HIP_Y = {'F': -0.15, 'H': 0.33}
KNEE = {'FR': (-0.214, 0.264), 'FL': (-0.135, 0.20), 'HR': (0.44, 0.29), 'HL': (0.485, 0.317)}
TOEP = {'FR': (0.061, -0.06), 'FL': (-0.067, -0.07), 'HR': (-0.06, -0.05), 'HL': (-0.05, -0.05)}
STANCE = {'FR': -0.16, 'FL': -0.16, 'HR': 0.37, 'HL': 0.37}
LEG_R = {'F': (0.04, 0.03, 0.025), 'H': (0.06, 0.035, 0.025)}
LEG_TOP = (0.12, 0.14)
CHEST_PIV = (-0.10, 0.55)
BODY_PIV = (0.30, 0.55)
CHEST_Y = (0.15, -0.05)
NECK_PTS = [(0.0, -0.13, 0.56), (-0.01, -0.18, 0.65), (-0.02, -0.23, 0.75), (-0.04, -0.29, 0.84)]
NECK_YMAX = -0.10
NECK_Z0 = 0.52
HEAD_TIP = (-0.15, -0.48, 0.71)
KNOTS = [-0.25, 0.05, 0.37, 0.68, 1.0]
EARS = {'L': ((-0.06, -0.27, 0.87), (-0.17, -0.14, 0.98)), 'R': ((0.05, -0.30, 0.87), (0.17, -0.25, 0.96))}
EAR_AX = {'L': [(FWD, 1.0), (UP, -0.6)], 'R': [(FWD, -1.0), (UP, 0.6)]}
EAR_R = 0.04
EAR_ROOT = (0.0, 0.4)
TAILB = ((-0.03, 0.43, 0.62), (-0.03, 0.50, 0.52))
TAIL_YZ = (0.40, 0.45)
FLICKS = {'idle': ([0.08, 0.3, 0.55, 0.85], [0.17, 0.42, 0.7]), 'tail': [0.2, 0.62, 0.9],
          'browse': ([0.3, 0.55, 0.85], [0.15, 0.45, 0.92], [0.7])}
PV = (0.55, 1.3)
deerkit.run(sys.modules[__name__])
