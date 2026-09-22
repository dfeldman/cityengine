/** What a procedural landmark is fitted to (render/landmarks.ts places it). */
/** A footprint the builder is fitted to: its long axis, its size, and which way is east. */
export interface Fit {
  /** half-length along the long axis (local x) and half-width across it (local z), metres */
  hx: number
  hz: number
  height: number
  /** the footprint itself (or the courtyard, for a `court` entry), in the model's own frame, anticlockwise */
  ring?: { x: number; z: number }[]
}
