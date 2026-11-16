/**
 * San Francisco's ride-by sights (src/city/sights.ts): what the tours pass between their stops. Each point is on the
 * tour's route, a little before the thing itself; candidates and gaps from tools/tour-sights.ts.
 */
import type { RideBySight } from '../sights.ts'

export const SF_SIGHTS: RideBySight[] = [
  // ── the north waterfront and the bridge ──
  { lat: 37.80370, lon: -122.43050, name: 'Fort Mason', meta: 'Army post, 1850s',
    text: 'An Army post on the point since the Gold Rush. In the Second World War 1.6 million soldiers sailed for the Pacific from its piers; now they hold theatres and galleries.' },
  { lat: 37.80297, lon: -122.43709, name: 'The Marina', meta: 'Neighbourhood',
    text: 'Built on landfill, part of it rubble from 1906, for the 1915 World\'s Fair. In the 1989 earthquake the made ground shook like jelly, and houses here fell.' },
  { lat: 37.80627, lon: -122.43862, name: 'Marina Green', meta: 'Park',
    text: 'A long lawn on the bay for kites, picnics and the Blue Angels in Fleet Week. At the end of the jetty is the Wave Organ, pipes the tide plays.' },
  { lat: 37.81002, lon: -122.47756, name: 'Fort Point', meta: 'Fort, 1861',
    text: 'The brick fort under the bridge\'s south end, built in the Civil War to guard the Golden Gate. Joseph Strauss arched the bridge over it rather than knock it down.' },
  { lat: 37.81850, lon: -122.47850, name: 'Mid-span', meta: 'Golden Gate Bridge, 1937',
    text: 'Sixty-seven metres above the water, halfway across the 1,280 m main span, the longest in the world until 1964. The colour is International Orange, chosen to show in fog.' },
  { lat: 37.84017, lon: -122.47819, name: 'Fort Baker', meta: 'Army post, 1905',
    text: 'The Army\'s post in the cove under the bridge\'s north end, its officers\' houses round a parade ground. Now a lodge, Cavallo Point, and a children\'s museum.' },
  { lat: 37.80294, lon: -122.42146, name: 'Francisco Park', meta: 'Park, 2022',
    text: 'For 150 years a reservoir, the city\'s first, dug in 1859 to put out fires. Drained, it became a park on the slope of Russian Hill, with the bay below.' },
  // ── SoMa, Hayes Valley and the park ──
  { lat: 37.78583, lon: -122.39944, name: 'SFMOMA', meta: 'Museum, 1995 and 2016',
    text: 'Mario Botta\'s striped brick museum with its round black-and-white skylight, and behind it Snøhetta\'s 2016 extension, white and rippled like the fog over the bay.' },
  { lat: 37.78448, lon: -122.40117, name: 'Yerba Buena Gardens', meta: 'Park, 1993',
    text: 'A park on the roof of the Moscone convention centre. Behind its waterfall is the city\'s memorial to Martin Luther King, his words engraved behind the falling water.' },
  { lat: 37.77583, lon: -122.42380, name: 'Hayes Valley', meta: 'Neighbourhood',
    text: 'The Central Freeway ran overhead here until the 1989 earthquake damaged it. It came down for good, and Octavia Boulevard and its little park took its place.' },
  { lat: 37.77171, lon: -122.47200, name: 'JFK Promenade', meta: 'Car-free since 2020',
    text: 'The park\'s main drive, closed to cars in April 2020 for the pandemic and then for good in 2022: 2.5 km of road for bikes, skaters and walkers.' },
  { lat: 37.76940, lon: -122.49450, name: 'Spreckels Lake', meta: 'Lake, 1904',
    text: 'Built for the San Francisco Model Yacht Club, whose members still sail radio-controlled boats on it. The turtles and the herons were not invited.' },
  { lat: 37.76482, lon: -122.49163, name: 'The Polo Field', meta: 'Stadium, 1906',
    text: 'A stadium in the trees, for polo, bike races and, in January 1967, the Human Be-In, which started the Summer of Love.' },
  { lat: 37.76573, lon: -122.47101, name: 'San Francisco Botanical Garden', meta: 'Garden, 1940',
    text: 'Plants from the world\'s mild, foggy places grow outdoors here, cloud forest from Central America among them. The fog that chills the city suits them.' },
  // ── Union Square to the Richmond ──
  { lat: 37.78825, lon: -122.40276, name: 'Lotta\'s Fountain', meta: 'Fountain, 1875',
    text: 'The singer Lotta Crabtree gave it to the city. After the 1906 earthquake, survivors met here to find each other, and they still gather at 5:12 a.m. every 18 April.' },
  { lat: 37.78610, lon: -122.42500, name: 'St. Mary\'s Cathedral', meta: 'Cathedral, 1971',
    text: 'Pier Luigi Nervi\'s roof is four curved concrete shells that rise 58 m into a cross of windows. San Franciscans call it Our Lady of Maytag, after the washing machine.' },
  { lat: 37.78266, lon: -122.47086, name: 'The Internet Archive', meta: 'Library, since 2009',
    text: 'A Greek-columned church on Funston Avenue holds the Wayback Machine, copies of over 800 billion web pages, and clay figures of its staff in the pews.' },
  { lat: 37.78200, lon: -122.48500, name: 'Holy Virgin Cathedral', meta: 'Russian Orthodox cathedral, 1961',
    text: 'Five gold onion domes over Geary Boulevard. Russians fleeing the revolution came by way of China, and the Richmond became their neighbourhood.' },
  // ── the hills ──
  { lat: 37.76040, lon: -122.44689, name: 'Tank Hill', meta: 'Park',
    text: 'Named for the water tank that stood on top from 1894. The tank is gone and the rock outcrop it stood on gives one of the widest views in the city.' },
  { lat: 37.76334, lon: -122.45838, name: 'UCSF Parnassus', meta: 'University',
    text: 'The university\'s medical school has stood on this hillside since 1898, on land given by Adolph Sutro, the mayor who owned the mountain above it.' },
]
