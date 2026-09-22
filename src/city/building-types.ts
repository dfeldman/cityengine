/**
 * Regional building-type classifiers, run at bake time (tools/bake.ts): where OSM says only `building=yes`, a
 * region that knows its own city says what the building is and which style it wears. Each lives in its
 * region's own files (src/city/sf/btype.ts); a region without one keeps the shared `chooseStyle`.
 */
import type { StyleId } from './facade.ts'
import { classifySF } from './sf/btype.ts'

export interface BuildingFacts {
  tags: Record<string, string>
  /** local metres */
  ring: { x: number; z: number }[]
  height?: number
  levels?: number
  lat: number
  lon: number
  id: number
  area: number
}
export type Classifier = (b: BuildingFacts) => { archetype: string; style: StyleId } | null

const CLASSIFIERS: Record<string, Classifier> = { 'san-francisco': classifySF }

export const classifierFor = (region: string | undefined): Classifier | null => CLASSIFIERS[region ?? ''] ?? null
