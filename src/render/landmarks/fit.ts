/** What a procedural landmark is fitted to (render/landmarks.ts places it). */
/** A footprint the builder is fitted to: its long axis, its size, and which way is east. */
export interface Fit {
  /** half-length along the long axis (local x) and half-width across it (local z), metres */
  hx: number
  hz: number
  height: number
  /** the footprint itself (or the courtyard, for a `court` entry), in the model's own frame, anticlockwise */
  ring?: { x: number; z: number }[]
  /**
   * The ground at the middle of the model's front (local (0, −hz)) above the model's base, metres. The base is the
   * LOWEST ground under the footprint, so on a hillside a builder that puts its entrance at y = 0 buries it under the
   * street: the Masonic's California front stood 19 m above its Pine Street corner (2026-10-04). Street-level
   * features go at `grade`; undefined where the loader did not measure it (tests, standalone models).
   */
  grade?: number
  /**
   * The ground at a point of the model's own frame, above the model's base — for what stands on the street along
   * a slope: the Westin St. Francis's awnings, hung at a fixed height over the base, sat on Powell Street's pavement
   * at the Post Street end as "large red cubes in the street" (owner, 2026-10-04). Absent where not measured.
   */
  groundAt?: (x: number, z: number) => number
}
