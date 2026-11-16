/**
 * RIDE-BY SIGHTS (owner, 2026-11-15: "on a long tour it is boring to only have a few info boxes for the entire tour …
 * add more sights"): short notes on what a tour passes between its stops, shown as an "On the way" card when the rider
 * goes by (game/tour.ts `Sights`), during a tour and in free ride. Candidates come from tools/tour-sights.ts; each point is
 * where the thing stands (or the middle of the side facing the street, for something big).
 */
import { PARIS_SIGHTS } from './paris/sights.ts'
import { SF_SIGHTS } from './sf/sights.ts'

export interface RideBySight { lat: number; lon: number; name: string; text: string; meta?: string }

export function sightsFor(city: string): RideBySight[] {
  return city === 'san-francisco' ? SF_SIGHTS : city === 'paris-centre' ? PARIS_SIGHTS : []
}
