# Paris: the owner's overnight plan (2026-10-30)

The owner, going to bed: "Continue to work on 7 more batches of landmarks in roughly priority order, one group of 25 at a time. A special focus should be park gardens, since in a cycling game they are very obvious, and Paris has a lot of them. As you encounter monuments that need a GLB model, be sure to note them so I can make them later in Tripo. Landmarks include famous buildings of course, but may in some cases just be a high-rise or shopping center that is highly visible and unusual even if it is not a conventional destination. Virtually all museums, hospitals, and university buildings count. Take as much time as you need but only run one or two agents at a time." And: "Also fix as many outstanding bugs as possible."

Order of work: Seine bridges and top 25 (audits) → train tracks → batches 1–7, with bugs (PARIS_BUGS.md, docs/PARIS_MINOR_BUGS.md) between them. After each batch: claims, civic, tests, commit exact files, push; bake, build and upload every batch or two.

`paris-candidates.json` is every named museum, hospital, university, theatre, church, station, shop and monument in the box that no model's name matched, scored by fame and size. The name match is loose (it has the Louvre and the Garnier, which are modelled): check before building. Gardens go in tools/gardens/ as plans; buildings as models or restyles, whichever is cheapest for the result.

Tripo candidates go in PARIS-TRIPO-NOTES.md as they turn up.

Each batch is 25: about 9 gardens and 16 buildings. Names are the plan, not a contract: skip what is already good, and take the next from the candidates.

## Batch 1
Gardens: Parc Monceau; Parc des Buttes-Chaumont; Parc Montsouris; Parc André-Citroën; Parc de Bercy; Parc de la Villette; Parc Georges-Brassens; Jardin des Plantes (beyond the perspective); Jardin du Ranelagh.
Buildings: Pitié-Salpêtrière and its chapel; Hôtel-Dieu; La Sorbonne; Institut de France; Hôtel de la Monnaie; Hôpital Necker; Hôpital européen Georges-Pompidou; Hôpital Cochin and Port-Royal; Lariboisière; Hôpital Saint-Louis; École normale supérieure; Jussieu and the Tour Zamansky; Gare de Bercy; Musée Picasso; Musée Marmottan; Fondation Cartier.

## Batch 2
Gardens: Parc de Belleville; Jardin d'Acclimatation; Parc Clichy-Batignolles; Square des Batignolles; Jardin Atlantique; Coulée verte René-Dumont; Jardin des Serres d'Auteuil's remainder; Cité Universitaire, Parc Est and Ouest; Jardin Charles-Aznavour.
Buildings: Cité Internationale's great houses (Maison Internationale, Fondation Suisse, Maison du Brésil); Tenon; Rothschild; Robert-Debré; Trousseau; Foch; Dauphine; ENSAM; Sciences Po; Collège de France; Institut Catholique; ESPCI; École militaire; UNESCO; Maison de la Radio; Institut du Monde Arabe.

## Batch 3
Gardens: Parc Kellermann; Parc de Choisy; Jardins d'Éole; Square René-Le Gall; Square du Temple; Square Louise-Michel; Parc Suzanne-Lenglen; Parc de la Butte du Chapeau Rouge; Square Saint-Lambert.
Buildings: Printemps; Galeries Lafayette; Le Bon Marché; La Samaritaine; BHV; Beaugrenelle; Italie Deux; Bercy 2; Tour Totem; Tours de Beaugrenelle; Les Olympiades; Tour Zamansky's neighbours; Tour Montparnasse's base and the Gare Montparnasse; Tripode; Tour Super-Italie; Les Orgues de Flandre.

## Batch 4
Gardens: Bois de Vincennes's Parc Floral; Lac Daumesnil and its island; Jardin d'Agronomie Tropicale; Pelouse de Reuilly; Bois de Boulogne's lakes; Pré Catelan; Île de Puteaux; Parc de l'Île Saint-Germain; Parc de Boulogne Edmond-de-Rothschild.
Buildings: Musée d'Art moderne and the Palais de Tokyo; Musée Guimet; Musée Cernuschi; Musée Jacquemart-André; Musée Nissim-de-Camondo; Musée de Cluny; Musée Carnavalet; Musée de l'Armée's courts; Musée des Arts et Métiers; Maison de Balzac; Maison de Victor Hugo; Musée de la Vie romantique; Musée Gustave-Moreau; Musée Bourdelle; Musée Zadkine; Musée de la Libération and the Catacombes.

## Batch 5
Gardens: Square Georges-Cain; Jardin Anne-Frank; Square de la Tour Saint-Jacques; Square Viviani; Square Jean-XXIII's remainder; Square Boucicaut; Square d'Ajaccio; Jardin de l'Arsenal; Jardin Tino-Rossi.
Buildings: Saint-Germain-des-Prés; Saint-Étienne-du-Mont; Saint-Roch; La Madeleine; Saint-Augustin; La Trinité; Saint-Vincent-de-Paul; Sainte-Clotilde; Saint-Gervais; Saint-Paul-Saint-Louis; Saint-Séverin; Saint-Julien-le-Pauvre; Grande Synagogue; Mosquée; Cathédrale américaine; Saint-Germain-l'Auxerrois's remainder.

## Batch 6
Gardens: Parc Georges-Brassens's vines and market halls; Jardin de Reuilly; Parc de Bagatelle's remainder; Jardin Albert-Kahn's Japanese village; Square des Arènes de Lutèce; Jardin des Grandes-Explorations; Parc de Saint-Cloud if the box reaches it; Parc André-Malraux; Parc de Billancourt.
Buildings: Théâtre du Châtelet; Théâtre de la Ville; Comédie-Française; Odéon's square; Olympia; Bataclan; Cité de la Musique; Philharmonie; Théâtre des Champs-Élysées; Salle Pleyel; Ministère des Finances's other wings; Assemblée nationale; Quai d'Orsay; Conseil constitutionnel; Bourse; Banque de France.

## Batch 7
Gardens: whichever of the 330 gardens over 0.3 ha still reads as lawn and scattered trees, largest first; the ordinary squares' common planting.
Buildings: remaining hospitals and universities by size (Paris-Dauphine's annexes, Paris-Saclay's Paris sites, Saint-Antoine, Bichat, Beaujon, Sainte-Anne, Quinze-Vingts, Saint-Joseph, Pompidou's Ircam, Institut Pasteur, Institut Curie); La Défense's unusual towers; Front de Seine; Quartier des Halles's Forum; Gare de l'Est; Gare d'Austerlitz; Gare Saint-Lazare's front.
