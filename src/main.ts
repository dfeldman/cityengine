/**
 * Entry point.
 *
 *   /                          ride Le Marais
 *   /?city=brooklyn-heights    somewhere else
 *   /?device=treadmill         run it instead
 *   /?showcase=1               the facade showcase, one building per style
 *   /?showcase=1&style=brick   eight of one style
 */
import { goTo, parseLatLon, type CityRef } from './ui/goto.ts'
import { HUD_CSS } from './ui/hud.ts'
import { MINIMAP_CSS } from './ui/minimap.ts'

const params = new URLSearchParams(location.search)
const canvas = document.getElementById('view') as HTMLCanvasElement

const style = document.createElement('style')
style.textContent = HUD_CSS + MINIMAP_CSS
document.head.appendChild(style)

if (params.get('showcase')) {
  const { showcase } = await import('./showcase.ts')
  void showcase(canvas, params.get('style') ?? undefined)
} else {
  /*
   * Which cities exist, from the list the bake writes. A city that is not on it gets a page saying so and
   * naming the real ones: asking Vite for a package that does not exist returns its index.html with a 200,
   * and the game then died trying to read a web page as a city ("Unexpected token '<'").
   */
  const cities = await fetch(new URL('cities/index.json', document.baseURI).href)
    .then((r) => r.json() as Promise<CityRef[]>)
    .catch(() => [] as CityRef[])
  const city = params.get('city') ?? 'paris-marais'
  const link = (id: string): string => {
    const q = new URLSearchParams(location.search)
    q.set('city', id)
    q.delete('start')
    q.delete('at')
    return `?${q}`
  }
  if (cities.length > 0 && !cities.some((c) => c.id === city)) {
    const box = document.createElement('div')
    box.className = 'sr-nocity'
    box.innerHTML = `<h1>No city called “${city.replace(/[<>&"]/g, '')}”</h1><p>These are baked:</p><ul>`
      + cities.map((c) => `<li><a href="${link(c.id)}">${c.name}</a> <code>${c.id}</code></li>`).join('')
      + '</ul>'
    document.body.appendChild(box)
    document.getElementById('label')!.textContent = ''
    throw new Error(`unknown city ${city}`)
  }
  // the city menu, top centre
  if (cities.length > 1) {
    const pick = document.createElement('select')
    pick.className = 'sr-city'
    pick.title = 'city'
    for (const c of cities) pick.add(new Option(c.name, c.id, c.id === city, c.id === city))
    pick.addEventListener('change', () => { location.search = link(pick.value) })
    // the ride's keys must not also drive the menu
    pick.addEventListener('keydown', (e) => e.stopPropagation())
    document.body.appendChild(pick)
  }
  const { game } = await import('./game.ts')
  void game(canvas, {
    city,
    device: params.get('device') === 'treadmill' ? 'treadmill' : 'bike',
    traffic: (params.get('traffic') as 'none' | 'some' | 'busy') ?? undefined,
    bodies: params.get('bodies') ? Number(params.get('bodies')) : undefined,
    // ?without=sky,life,trees — for isolating which subsystem is drawing something wrong
    without: new Set((params.get('without') ?? '').split(',').filter(Boolean)),
    startEdge: params.get('start') ? Number(params.get('start')) : undefined,
    at: parseLatLon(params.get('at') ?? '') ?? undefined,
    goTo: (text: string, here?: boolean) => goTo(text, cities, here ? city : undefined),
    view: params.get('view') === 'high' ? 'high' : 'ride',
    freeze: params.get('freeze') === '1',
    paths: params.get('paths') === '1',
    time: (params.get('time') as 'dawn' | 'day' | 'dusk' | 'night') ?? undefined,
    weather: (params.get('weather') as 'clear' | 'overcast' | 'rain') ?? undefined,
    advance: params.get('advance') ? Number(params.get('advance')) : undefined,
    cars: params.get('cars') === '1',
    turn: (params.get('turn') as 'left' | 'straight' | 'right') ?? undefined,
  })
}
