/**
 * Screenshot size for the shot tools (image tokens ≈ w×h/750 when a model reads it):
 *   (default)                     175×100   ~25    finding a camera angle that frames the building
 *   --lowres   / SHOTS_LOWRES=1   350×200   ~95    silhouette, placement
 *   --medres   / SHOTS_MEDRES=1   700×400   ~375   normal checks
 *   --hires    / SHOTS_HIRES=1    1400×800  ~1.5K  fine detail only
 * The largest one asked for wins. Each run ends with a one-line reminder of the sizes (SHOTS_NOTE=0 hides it).
 */
const want = (flag: string, env: string): boolean => process.argv.includes(`--${flag}`) || process.env[env] === '1'
const SIZES = [
  ['hires', 'SHOTS_HIRES', 1400, 800],
  ['medres', 'SHOTS_MEDRES', 700, 400],
  ['lowres', 'SHOTS_LOWRES', 350, 200],
] as const
const picked = SIZES.find(([f, e]) => want(f, e))
export const SHOT_RES = picked?.[0] ?? 'tinyres'
export const VIEWPORT = picked ? { width: picked[2], height: picked[3] } : { width: 175, height: 100 }
export const SHOT_NOTE = `shots ${VIEWPORT.width}×${VIEWPORT.height} (${SHOT_RES}). Default tinyres is for finding the angle; once framed, re-shoot that view with --lowres (350×200, ~95 tokens) or --medres (700×400, ~375); --hires (1400×800, ~1.5K) only for fine detail.`
if (process.env.SHOTS_NOTE !== '0') process.on('exit', () => console.log(SHOT_NOTE))
