[Written by the owner!]

## MODELING BUILDINGS

### Generic buildings (Tier 0)
The vast majority of buildings get only a footprint and height from OSM, and a style, which is imputed based on the district, building type, footprint, and height. This typically covers over 95% of the buildings in a city. These are "generic" buildings.

### Tier 1: Refacing
A smaller group of buildings are custom refaced - this means we refine the style selection with color, accent color, levels (if OSM seems wrong). We do this with images and a VLM subagent.

### Tier 2: Kit modeling

Kit modeling refers to using a kit to write a generator for the building geometry. The kit includes common facades, roofs, elements like stairs and porticos, and color choices. 

We've gotten very good at kit modeling, and it actually isn't much more expensive than refacing. Most buildings that have flat facades (in any floorplan) can be kit modeled. They can also have different vertical segments, such as a pediment that is different from the rest of the building.

#### Special case: Churches

Cities often have dozens of churches. They are easy to identify from OSM, and all tend to have a common design language with a gabled roof, spire, cross, large doors, etc. There is a special kit just for churches. It may be useful for some synagogues and mosques as well, although this is less likely. 

### Tier 3: Custom modeling

In this tier, we write a custom generator function. This is necessary for any building with curved facades, complicated setbacks, twisted floors, multiple towers, cantilevers, etc. 

Buildings that almost always are in this category: museums, university campus buildings, major government offices, libraries, large banks, cathedrals or other major places of worship, historic buildings, hospitals, buildings by famous architects, buildings with utilitarian uses (eg a power plant), less common houses of worship like Muslim or Buddhist, flagship hotels like the main local Westin or Marriott. This is not because the buildings are very important, but because they usually have distinctive architecture which won't be possible to copy reasonably with a kit. 

A typical city may have 300-500 of these buildings, but we might only know in advance that 50 of them will need it based on OSM data.

Parking structures might fit in this category, but as a rule they are not very important and we use kits for them. 

Custom models may or may not need special LOD treatment. A very tall custom building might be visible for miles, meaning it takes up limited GPU space and time anywhere the camera is. That means it should have a low LOD box version to be viewed from afar. A small custom building that is usually occluded anyway likely doesn't need this.

### Tier 4: Detailed custom modeling

This is necessary for any buildings of extreme importance, such as Notre Dame in Paris, or the Chrysler Building in New York.

It is also necessary for complex buildings. Complex means it has many parts that connect in nonstandard ways. For example, Moscone Center in San Francisco has many buildings ON TOP of it, and both the upper buildings and Moscone first level are visible in different areas. These are most common in civic or university buildings since there is one owner. 

It is also necessary for buildings that connect with skybridges, or have pass-through holes. In these cases we may want to adjust the path graph so the user can actually travel on the skybridge or through the hole.

Stadiums are in this category. Note that OSM often codes stadiums oddly, with the field and various parts within the field separate. This requires extra effort. 

Bridges are in this category. The path graph should be adjusted so the user can travel over a bridge.

Buildings with skyparks are in this category. A skypark is any place with plants that are above ground level. These are rare, but not unheard of. Moscone again has a skypark (Yerba Buena Gardens), so is Salesforce Park, or the High Line in New York. Our plant system needs special care to put plants above ground level. Typically you want the user to have some way to GET to the skypark, either through stairs or a special mechanism (gondola ride). 

Detailed custom modeling can take millions of tokens and days of work. Each city can realistically only have a handful of these, so we have to choose wisely.  

### Tier 5: External modeling

This is for buildings we cannot realistically model ourselves. An example is the Statue of Liberty in New York. This is very rare. We have to download models in this case. 

We have not actually used external models at all yet. 

## Non-buildings

Non-buildings are things that must be modeled but are not buildings. Examples include: public art, statues, fountains, bridges, large freestanding signs, public squares, obelisks, pools, relevant boats (eg a maritime museum), trains, trams, streetcars, staircases (when not attached to a building), playground equipment, even a unique plant. 

Each one of these is a special case. Many of them can use the same procedural generation machinery as buildings. One difference is we don't usually have any way to automatically extract good reference images for non-buildings.

Some can be downloaded from outside sources.

Statues are special. The owner has access to Tripo3D, a tool that can automatically make statue GLBs given reference images. It is pretty good quality. 

We have to be careful about where to store GLB assets, since they are not a good fit for Git, but also are not easily reproducible. 

### SIGNS, POSTERS, BILLBOARDS

Signs, posters, and billboards are a distinct part of a city landscape. 

We have machinery for rendering a 3D text sign, used for eg. the Ghirardelli sign in San Francisco. We also have machinery for rendering a 2D sign, for example on a prominent Macy's store. 

In any real city, practically every building has a sign on top. We don't need to go nearly that far. Only the most prominent signs are included.

Billboards and posters are always 2D. We want to have a library of each, and randomly insert them into slots throughout the city. This is not yet implemented.

### FURNITURE

Furniture is stuff that repeatedly appears throughout a city. Traffic lights, street signs, benches, newspaper stands, newsstands (the prefab miniature store ones), vending machines, lamp posts, tables and chairs at outdoor cafes, bus stops, parking signs, parking meters. In some cities this stuff is very cluttered and actually impedes walking on the sidewalk. It is usually a distinct style by country. 

### FLAGS

Most cities have lots of flags. The goal is to have a common flag library with all the needed country and city flags, that we can place on freestanding or built-in flagpoles anywhere we need. This is not yet implemented.

### STRANGERS

After the build, the city is filled with NPCs, or "strangers." Our avatar library can draw all kinds of people on bikes or on foot, wearing a variety of clothes. 

Importantly - it can draw different kinds of people. In a city you might want lots of people in twos and threes, in city clothing. Near a beach you might want more athletic people in athletic clothing.

We currently cannot render children. 

### THE LADDER

This is described in more detail elsewhere. But in brief: 

We assign each building a priority number. The highest priorities go to buildings in areas the user will definitely see (eg. along the biking route) or extreme importance (eg the tallest buildings in the city). 
Museums and churches are given moderate importance. 
Next, we calculate a priority for every building based on distance from the center; whether it has a name or not; whether it is a type of building that always uses custom modeling; its height from OSM (tall buildings are visible for a longer distance); whether it is enclosed in a more complicated polygon according to OSM.

The highest priority buildings go straight to custom modeling. This should be a very small number (dozens). These are the most important, prominent buildings in a city. Usually the tallest skyscrapers, the stadiums, art museums, cathedral. The owner will choose which ones need detailed custom modeling or external modeling among these.

Next, the second priority group goes to kit modeling. This is typically the buildings in the downtown core, high-rises, churches, buildings that are unique in some respect. 

Next, the third priority group goes to refacing. This should be hundreds of buildings. Again, refacing has the option to bail out, and then go up to kit modeling. 

The rest of the buildings, typically 95% or more of buildings in the city, receive generic treatment only. This should include almost all houses, warehouses, commercial buildings, etc. Everything that no casual observer would even ever notice. 
