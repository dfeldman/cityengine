/**
 * Somebody to ride against, and a voice for the ride (dandyhorse PLAN.md §18.3).
 *
 * The platform picks a past session by another player a little stronger than this one and hands over their
 * second-by-second record. The work is all gamekit's; what Cycle Dash adds is what it knows about a ride —
 * how far, how many parcels, how much earned — and the words for the end of it.
 *
 * Nobody is guaranteed. On a new platform, or a new city, `startRival` comes back with a voice and no rival,
 * and the ride is exactly what it was before.
 */
import {
  banner, competitorBox, competitorName, CompetitorTracker, Encouragement, flagOrCode, loadCompetitor,
  type CompetitorBox, type UnitSystem,
} from '@dandyhorse/gamekit'

export interface RideNow {
  elapsed: number
  distance: number
  deliveries: number
  earned: number
}

export interface RivalHud {
  /** About once a second, with where the ride has got to. */
  update: (now: RideNow) => void
  /** The line for the player's timeline when the session ends, or null without a rival. */
  verdict: (now: RideNow, collisions: number) => string | null
  remove: () => void
}

export async function startRival(sessionId: string, unitSystem: UnitSystem, city: string | null,
                                 plannedSeconds: number | null,
                                 log: (line: string) => void = () => {}): Promise<RivalHud> {
  const imperial = unitSystem !== 'metric'
  const say = banner(document.body)
  // The city is the route, so a rival is somebody who rode the same streets.
  const rival = await loadCompetitor({ session: sessionId, route: city ?? undefined },
                                     (e) => log(`competitor: ${String(e)}`))
  const name = rival ? competitorName(rival.player) : undefined
  const flag = rival ? flagOrCode(rival.player.country) : ''
  const voice = new Encouragement({
    imperial, rivalName: name, plannedSeconds,
    progressWords: { deliveries: 'delivery', earned: 'dollar' },
  })

  if (!rival) {
    log('no competitor for this city yet — riding alone')
    return {
      update: ({ elapsed, distance, deliveries }) => {
        const line = voice.update({ elapsed, distance, progress: { deliveries } })
        if (line) say(line)
      },
      verdict: () => null,
      remove: () => {},
    }
  }

  const tracker = new CompetitorTracker(rival)
  log(`riding against ${name}${flag ? ` ${flag}` : ''} at ${Math.round(rival.player.fitness)} W`)
  const box: CompetitorBox = competitorBox(document.body, tracker, {
    imperial, corner: 'left',
    title: 'Their distance',
  })

  const money = (n: number): string => `$${n.toFixed(2)}`
  const far = (m: number): string => imperial ? `${(m / 1609.344).toFixed(1)} mi` : `${(m / 1000).toFixed(1)} km`

  return {
    update(now) {
      const mine = { distance: now.distance, progress: { deliveries: now.deliveries, earned: now.earned } }
      box.update(now.elapsed, mine)
      const line = voice.update({
        elapsed: now.elapsed, distance: now.distance,
        progress: { deliveries: now.deliveries },
        rival: tracker.at(now.elapsed),
      })
      if (line) say(line)
    },
    verdict(now, collisions) {
      const them = tracker.at(tracker.finishElapsed)
      const theirParcels = them.progress.deliveries ?? 0
      const bumps = collisions > 0
        ? ` ${collisions} car${collisions === 1 ? '' : 's'} found the hard way.` : ' Not a scratch.'
      if (now.deliveries > theirParcels) {
        return `${now.deliveries} parcels to ${name}'s ${theirParcels}, ${money(now.earned)} earned.${bumps}`
      }
      if (now.deliveries < theirParcels) {
        return `${now.deliveries} parcels across town — ${name} managed ${theirParcels}.${bumps}`
      }
      const gap = now.distance - them.distance
      return gap > 0
        ? `Level with ${name} on ${now.deliveries} parcels, but ${far(gap)} further.${bumps}`
        : `${now.deliveries} parcels each with ${name}. Too close to call.${bumps}`
    },
    remove() { box.remove() },
  }
}

/** The line when nobody was raced: what the ride itself was. */
export function soloMessage(now: RideNow, collisions: number, streets: number, imperial: boolean,
                            place: string | null, tours: string[] = []): string {
  const far = (m: number): string => imperial ? `${(m / 1609.344).toFixed(1)} mi` : `${(m / 1000).toFixed(1)} km`
  const where = place ? ` of ${place}` : ''
  // tour mode: the tours finished ("Golden Gate Park and The Embarcadero, toured. 21.4 km of pedalling.")
  if (tours.length) {
    const names = tours.length === 1 ? tours[0] : `${tours.slice(0, -1).join(', ')} and ${tours[tours.length - 1]}`
    return `${names}, toured. ${far(now.distance)} of pedalling.`
  }
  if (now.deliveries > 0) {
    const bumps = collisions > 0 ? `, and ${collisions} car${collisions === 1 ? '' : 's'} found the hard way` : ''
    return `${now.deliveries} parcel${now.deliveries === 1 ? '' : 's'} delivered for `
      + `$${now.earned.toFixed(2)}${bumps}. ${far(now.distance)} of pedalling.`
  }
  if (streets > 0) return `${far(now.distance)} through the streets${where}. ${streets} of them, this ride.`
  return `${far(now.distance)} through the streets${where}.`
}
