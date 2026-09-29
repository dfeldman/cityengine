/**
 * San Francisco's named stairways that are built as landmarks rather than by the generic `highway=steps`
 * treatment (BUGS.md #213a, docs/PARKS.md B). Keyed by the OSM `name` on the way, which is how the city maps
 * them: the Lyon Street Steps are six ways all called simply "Lyon Street".
 *
 * Only Lyon Street is here so far, deliberately. It is the one the owner scored, and one convincing Lyon
 * Street is worth more than six generic stairways — Filbert, Greenwich, Hidden Garden, Lincoln Park, Bancroft
 * and Saturn are all mapped and named and are all reachable from the same kit, once Lyon Street is shot and
 * passes.
 */
import type { NamedStairway } from '../stairway.ts'
import { LYON_STYLE, decorateLyon } from './lyon-steps.ts'

export const SF_STAIRWAYS: Record<string, NamedStairway> = {
  // the six `highway=steps` ways between Broadway and Green on the Presidio wall, all named "Lyon Street"
  'Lyon Street': { style: LYON_STYLE, width: 4.4, decorate: decorateLyon },
}
