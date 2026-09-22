/**
 * The one thing the vendored streets-gl tag layer wanted from its host app. Lifted verbatim from
 * streets-gl's `src/app/Utils.ts` (MIT) so that the vendored folder has no imports leaving it.
 */
export default class Utils {
  public static hexToRgb(hex: string): number[] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null
  }
}
