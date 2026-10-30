/**
 * Paris's tours (owner, 2026-10-30: "add a few tours of Paris like we have for SF. Just a few is fine, since Paris has less
 * variety in terrain for cyclists"). The same form as San Francisco's (src/city/sf/tours.ts): a list of stops, routed on
 * the ride graph, an announced stop's card coming up as the rider nears it; a stop with no text only shapes the route.
 *   node --experimental-strip-types tools/check-tours.ts --city=paris-centre [--write] [--legs]
 */
import type { Tour } from '../sf/tours.ts'

export const PARIS_TOURS: Tour[] = [
  {
    id: 'paris-seine', name: 'The Seine and its Bridges',
    blurb: 'Along the river from the Eiffel Tower to the Institut du monde arabe, past the bridges and the great museums.',
    stops: [
      { lat: 48.85700, lon: 2.29620, name: 'The Eiffel Tower',
        text: 'Built for the 1889 Exposition and meant to come down after twenty years. The radio mast on top saved it.' },
      { lat: 48.86420, lon: 2.30130, name: 'Pont de l\'Alma',
        text: 'Parisians judge a flood by the stone Zouave on its pier: wet feet close the riverside roads. In 1910 the water reached his shoulders.' },
      { lat: 48.86370, lon: 2.31350, name: 'Pont Alexandre III',
        text: 'One steel arch across the river, opened for the 1900 Exposition, kept low so as not to block the view of the Invalides. The gilded horses stand on its corners.' },
      { lat: 48.86050, lon: 2.32650, name: 'Musée d\'Orsay',
        text: 'A railway station, built for the same Exposition. The two great clocks are still in its walls; the Impressionists moved in in 1986.' },
      { lat: 48.85700, lon: 2.34130, name: 'Pont Neuf',
        text: 'The "new bridge", finished in 1607, is now the oldest standing across the Seine, and the first in Paris built without houses on it.' },
      { lat: 48.85300, lon: 2.34990, name: 'Notre-Dame',
        text: 'Begun in 1163. The spire burned in April 2019 and the cathedral reopened in December 2024, its roof timbers cut from French oak.' },
      { lat: 48.84920, lon: 2.35700, name: 'Institut du monde arabe',
        text: 'Jean Nouvel, 1987. The south wall is thousands of metal irises, a moucharabieh meant to open and close with the sun.' },
    ],
  },
  {
    id: 'paris-right-bank', name: 'Monuments of the Right Bank',
    blurb: 'Down the Champs-Élysées from the Arc de Triomphe, past the Louvre and the Opéra, to the Bastille.',
    stops: [
      { lat: 48.87380, lon: 2.29500, name: 'Arc de Triomphe',
        text: 'Ordered by Napoleon in 1806 and finished in 1836, long after him. Twelve avenues meet round it, and nobody has right of way but those joining.' },
      { lat: 48.86950, lon: 2.30800, name: 'The Champs-Élysées',
        text: 'Almost two kilometres, a gentle rise all the way up to the Arc. The Tour de France has finished on these cobbles since 1975.' },
      { lat: 48.86560, lon: 2.32120, name: 'Place de la Concorde',
        text: 'The obelisk is 3,300 years old, a gift from Egypt raised here in 1836, on the ground where the guillotine had stood.' },
      { lat: 48.86770, lon: 2.32940, name: 'Place Vendôme',
        text: 'The column is sheathed in bronze from cannon captured at Austerlitz. The Commune pulled it down in 1871 and Courbet was billed for putting it back.' },
      { lat: 48.87060, lon: 2.33200, name: 'Palais Garnier',
        text: 'Opened in 1875 over an underground lake, which is real: a water tank in the foundations, and the idea behind The Phantom of the Opera.' },
      { lat: 48.86220, lon: 2.33600, name: 'The Louvre',
        text: 'A fortress from about 1190, a palace for centuries, a museum since 1793. Pei\'s glass pyramid arrived in 1989, to some outrage.' },
      { lat: 48.85650, lon: 2.35220, name: 'Hôtel de Ville',
        text: 'The city hall, burned by the Commune in 1871 and rebuilt to look much as it had, statues of a hundred and more Parisians on its walls.' },
      { lat: 48.85560, lon: 2.36520, name: 'Place des Vosges',
        text: 'Finished in 1612, the oldest planned square in Paris, thirty-six houses of red brick and stone. Victor Hugo lived at number 6.' },
      { lat: 48.85320, lon: 2.36910, name: 'Place de la Bastille',
        text: 'The fortress came down after 1789; its outline is marked in the paving. The column is for the revolution of 1830, and its dead lie underneath.' },
    ],
  },
  {
    id: 'paris-montmartre', name: 'Montmartre and the Stations',
    blurb: 'The one real climb in Paris: up to the Sacré-Cœur, then down past the Gare du Nord to the Place de la République.',
    stops: [
      { lat: 48.87620, lon: 2.32530, name: 'Gare Saint-Lazare',
        text: 'The oldest station in Paris, and the one Monet painted a dozen times in 1877, steam and all.' },
      { lat: 48.88410, lon: 2.33220, name: 'Moulin Rouge',
        text: 'Opened in 1889, the year of the Eiffel Tower. The red windmill has never ground anything. Toulouse-Lautrec had a table.' },
      { lat: 48.88670, lon: 2.34310, name: 'The Sacré-Cœur',
        text: 'Finished in 1914, at the top of the city\'s highest hill. Its stone gives off calcite in the rain, which is why it stays white.' },
      { lat: 48.88090, lon: 2.35530, name: 'Gare du Nord',
        text: 'The busiest station in Europe. The statues along the top of its front are the cities its trains went to.' },
      { lat: 48.87670, lon: 2.35930, name: 'Gare de l\'Est',
        text: 'Trains for the east, the Orient Express among them, left from here from 1883. So did the troops of 1914.' },
      { lat: 48.86740, lon: 2.36360, name: 'Place de la République',
        text: 'Marianne, in bronze, since 1883, the Republic\'s own figure over its largest square. Paris still gathers here to march.' },
    ],
  },
  {
    id: 'paris-bois', name: 'The Bois de Boulogne',
    blurb: 'A loop through Paris\'s great wood: the lakes, the racecourse, Bagatelle and the Fondation Louis Vuitton.',
    stops: [
      { lat: 48.87130, lon: 2.27570, name: 'Porte Dauphine',
        text: 'The gate at the end of the Avenue Foch, and the way in to 846 hectares of woods. The métro entrance is Guimard\'s, one of the few left with its glass roof.' },
      { lat: 48.86310, lon: 2.26650, name: 'Lac Inférieur',
        text: 'Napoléon III had the wood laid out as an English park. The first lake came out too high at one end, so they dug a second.' },
      { lat: 48.86000, lon: 2.25500, name: 'Pré Catelan',
        text: 'A garden in the wood\'s middle, with a Shakespeare garden and a great copper beech over two hundred years old.' },
      { lat: 48.85900, lon: 2.23400, name: 'Hippodrome de Longchamp',
        text: 'Racing since 1857, and home of the Arc. Dominique Perrault\'s new grandstand opened in 2018.' },
      { lat: 48.87050, lon: 2.24750, name: 'Parc de Bagatelle',
        text: 'The château was built in sixty-four days in 1777, to win a bet with Marie Antoinette. The rose garden is the thing to see in June.' },
      { lat: 48.87670, lon: 2.26350, name: 'Fondation Louis Vuitton',
        text: 'Frank Gehry, 2014: twelve sails of curved glass over white blocks, at the edge of the Jardin d\'Acclimatation.' },
    ],
  },
]
