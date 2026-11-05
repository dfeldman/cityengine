/**
 * Paris's DETAIL REGIONS outside the detail box that are not on the Versailles ride (owner, 2026-11-04): the Cité
 * Universitaire, whose south half the detail box cuts, and the Bois and Château de Vincennes past the box's old east
 * edge. Outlines from the local pbf, simplified to 40 m; tune by hand here.
 */
import type { DetailRegion } from '../cities.ts'

export const PARIS_EXTRA_REGIONS: DetailRegion[] = [
  {
    name: 'Cité Internationale Universitaire',
    // the campus (amenity=university) down to the Périphérique; Parc Montsouris across the boulevard is already in
    margin: 40,
    rings: [
      [[48.81858, 2.33308], [48.81694, 2.33614], [48.81674, 2.34275], [48.8173, 2.34379], [48.81927, 2.34411], [48.82107, 2.33446], [48.81948, 2.33355]],
      [[48.81754, 2.33251], [48.81726, 2.33382], [48.818, 2.33271]],
      // the Fondation Hellénique, west of the main ring
      [[48.82095, 2.3319], [48.82095, 2.3328], [48.8204, 2.3328], [48.8204, 2.3319]],
    ],
  },
  {
    name: 'Bois de Vincennes',
    // the wood: the lakes, the Parc Floral, the zoo, the hippodrome; its west tip meets the detail box at the Porte Dorée
    margin: 40,
    rings: [
      [[48.83067, 2.39976], [48.8289, 2.40427], [48.82512, 2.41052], [48.82357, 2.42975], [48.82162, 2.43219], [48.82169, 2.43289], [48.82142, 2.43247], [48.82016, 2.4343], [48.81928, 2.43418], [48.81936, 2.43697], [48.81822, 2.43735], [48.81796, 2.44964], [48.81709, 2.45817], [48.81924, 2.46267], [48.82613, 2.46585], [48.82451, 2.46368], [48.82152, 2.46246], [48.82062, 2.46147], [48.82096, 2.46091], [48.82208, 2.4621], [48.82573, 2.46278], [48.82615, 2.46459], [48.83145, 2.46534], [48.83424, 2.46909], [48.83692, 2.46941], [48.84089, 2.46537], [48.8423, 2.46276], [48.84493, 2.44641], [48.84574, 2.44655], [48.84592, 2.44077], [48.84435, 2.44051], [48.84457, 2.43794], [48.84089, 2.43719], [48.84176, 2.42473], [48.84431, 2.42173], [48.84357, 2.42018], [48.84231, 2.41948], [48.83576, 2.42221], [48.83356, 2.41459], [48.83399, 2.41036], [48.83476, 2.40833], [48.83136, 2.40258]],
    ],
  },
  {
    name: 'Château de Vincennes',
    // drawn by hand round the enceinte (the donjon, the Sainte-Chapelle, the pavilions) just north of the wood
    margin: 30,
    rings: [
      [[48.84090, 2.43180], [48.84090, 2.43900], [48.84560, 2.43900], [48.84560, 2.43180]],
    ],
  },
]
