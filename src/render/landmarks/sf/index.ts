/**
 * Every San Francisco builder, registered in one place (render/landmarks/procedural.ts spreads this): the big
 * structures, the tower presets, and each district's individually modelled buildings (./districts/), which are
 * worked on a district at a time, several at once, each in its own file.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { goldenGateBridge, goldenGateBridgeNear } from './golden-gate.ts'
import { sutroTower, sutroTowerNear } from './sutro-tower.ts'
import { bayBridge, bayBridgeNear } from './bay-bridge.ts'
import { transamericaPyramid } from './transamerica.ts'
import { salesforceTower } from './salesforce-tower.ts'
import { coitTower } from './coit-tower.ts'
import { ferryBuilding } from './ferry-building.ts'
import { cityHall } from './city-hall.ts'
import { TOWER_PRESETS } from './ring-tower.ts'
import { ghirardelliSign } from './wharf.ts'
import { WHARF_CARNIVAL } from './wharf-carnival.ts'
import { WHARF_SHOPS } from './wharf-shops.ts'
import { WHARF_LANDSIDE } from './wharf-landside.ts'
import { PIER39_FRONTS } from './pier39-fronts.ts'
import { PIER39_STYLE } from './pier39-style.ts'
import { FIDI_1 } from './districts/fidi-1.ts'
import { FIDI_2 } from './districts/fidi-2.ts'
import { FIDI_3 } from './districts/fidi-3.ts'
import { FIDI_4 } from './districts/fidi-4.ts'
import { WATERFRONT_1 } from './districts/waterfront-1.ts'
import { WATERFRONT_2 } from './districts/waterfront-2.ts'
import { CHINATOWN_1 } from './districts/chinatown-1.ts'
import { CHINATOWN_2 } from './districts/chinatown-2.ts'
import { CIVIC_1 } from './districts/civic-1.ts'
import { STATIONS } from './districts/stations.ts'
import { MODEL_TALL } from './districts/model-tall.ts'
import { MANUAL_1 } from './districts/manual-1.ts'
import { MODEL_OPUS } from './districts/model-opus.ts'
import { MODEL_1 } from './districts/model-1.ts'
import { MODEL_2 } from './districts/model-2.ts'
import { MODEL_3 } from './districts/model-3.ts'
import { RUSSIAN_HILL } from './districts/russian-hill.ts'
import { HARD_1 } from './districts/hard-1.ts'
import { TIERA_1 } from './districts/tierA-1.ts'
import { TIERA_2 } from './districts/tierA-2.ts'
import { REBUILD_E15 } from './districts/rebuild-e15.ts'
import { BANK_TEMPLES } from './districts/bank-temples.ts'
import { FEDERAL_CIVIC_1 } from './districts/federal-civic-1.ts'
import { ODDITIES } from './oddities.ts'
import { TIERA_3 } from './districts/tierA-3.ts'
import { TIERA_4 } from './districts/tierA-4.ts'
import { NOTABLE } from './districts/notable.ts'
import { ATRIA } from './districts/atria.ts'
import { TIERA_5 } from './districts/tierA-5.ts'
import { TIERA_6 } from './districts/tierA-6.ts'
import { TIERA_7 } from './districts/tierA-7.ts'
import { EXP_1 } from './experiments/e1.ts'
import { EXP_2 } from './experiments/e2.ts'
import { EXP_3 } from './experiments/e3.ts'
import { EXP_4 } from './experiments/e4.ts'
import { EXP_5 } from './experiments/e5.ts'
import { EXP_6 } from './experiments/e6.ts'
import { EXP_7 } from './experiments/e7.ts'
import { EXP_8 } from './experiments/e8.ts'
import { EXP_9 } from './experiments/e9.ts'
import { EXP_10 } from './experiments/e10.ts'
import { EXP_12 } from './experiments/e12.ts'
import { EXP_13 } from './experiments/e13.ts'
import { EXP_14 } from './experiments/e14.ts'
import { CHURCHES_1 } from './districts/churches-1.ts'
import { CHURCHES_2 } from './churches-2.ts'
import { CHURCHES_3 } from './churches-3.ts'
import { WATERFRONT_2 as WATERFRONT_2_LANDMARKS } from './waterfront-2.ts'
import { CHURCHES_4 } from './churches-4.ts'
import { KIT_DEMO } from './experiments/kit-demo.ts'
import { TIERA_8 } from './districts/tierA-8.ts'
import { TIERA_9 } from './districts/tierA-9.ts'
import { TIERA_10 } from './districts/tierA-10.ts'
import { PIERS } from './piers.ts'
import { MARKET_EAST } from './districts/market-east.ts'
import { MARKET_MID } from './districts/market-mid.ts'
import { MARKET_WEST } from './districts/market-west.ts'
import { UNION_SQUARE } from './districts/union-square.ts'
import { PARKS } from './districts/parks.ts'
import { BATTERIES } from './districts/batteries.ts'
import { TRANSBAY } from './districts/transbay.ts'
import { FOUNDRY } from './foundry.ts'
import { SHIPS } from './ships.ts'
import { marina, mooringField, plazaDeck } from './marina.ts'
import { fortPoint } from './fort-point.ts'
import { countyJailTwo } from './county-jail.ts'
import { lombardGardens } from './lombard.ts'
import { pier27Plaza } from './pier27.ts'
import { PROMINENT } from './prominent.ts'
import { CIVIC_6 } from './civic-6.ts'
import { CHURCHES_5 } from './churches-5.ts'
import { PIER_39 } from './pier39.ts'
import { CHINATOWN_GATE } from './chinatown-gate.ts'
import { SEA_LIONS } from './sea-lions.ts'
import { PARK_SIGHTS } from './park-sights.ts'
import { PAINTED_LADIES } from './painted-ladies.ts'
import { CIVIC_PLAZA } from './civic-plaza.ts'
import { PITSTOP } from './pitstop.ts'
import { GOLDEN_HYDRANT } from './golden-hydrant.ts'
import { SEWARD_SLIDES } from './seward-slides.ts'
import { GG_COMMONS } from './gg-commons.ts'
import { AG_BUILDING } from './ag-building.ts'
import { FOOTBRIDGES } from './footbridges.ts'
import { SUTRO_BASE } from './sutro-base.ts'
import { TEA_GARDEN } from './tea-garden.ts'
import { MISSION_BAY } from './mission-bay.ts'
import { BART_PLAZAS } from './bart-plazas.ts'
import { WOMENS_BUILDING } from './womens-building.ts'
import { HOSPITALS } from './hospitals.ts'
import { CASTRO_THEATRE } from './castro-theatre.ts'
import { KEZAR } from './kezar.ts'
import { LONE_MOUNTAIN } from './lone-mountain.ts'
import { LIBRARIES } from './libraries.ts'
import { SPEAKER_TOWERS } from './speaker-towers.ts'
import { FERRY_GATES } from './ferry-gates.ts'
import { CIVIC_CENTER } from './civic-center.ts'
import { MASONIC } from './masonic.ts'
import { ART_INSTITUTE } from './art-institute.ts'
import { CCSF_MISSION } from './ccsf-mission.ts'
import { SHELL_BUILDING } from './shell-building.ts'
import { SCHOOLS } from './schools.ts'
import { PICKWICK } from './pickwick.ts'
import { YBI_LIGHT } from './ybi-light.ts'
import { MACANG } from './macang.ts'
import { HUA_ZANG_SI } from './hua-zang-si.ts'
import { STRAWBERRY_HILL } from './strawberry-hill.ts'
import { FOUNTAINS } from './fountains.ts'
import { ST_IGNATIUS } from './st-ignatius.ts'
import { BANK_OF_CALIFORNIA } from './bank-of-california.ts'
import { NEW_MISSION } from './new-mission.ts'
import { THIRTY_OTIS } from './thirty-otis.ts'
import { TIBURON_DEPOT } from './tiburon-depot.ts'
import { WEILL } from './weill.ts'
import { FEDERAL_BUILDING } from './federal-building.ts'
import { GGP_BUILDINGS } from './ggp-buildings.ts'
import { SHEDS } from './sheds.ts'
import { MURAL_ALLEYS } from './mural-alleys.ts'
import { POINT_BONITA } from './point-bonita.ts'
import { MONUMENTS } from './monuments.ts'
import { WIGGLE } from './wiggle.ts'
import { PARK_BUILDINGS } from './park-buildings.ts'
import { KIT_CHURCHES } from './kit-churches.ts'
import { seaStacks } from './rocks.ts'
import { tiBuildingOne, tiHangar } from './treasure-island.ts'
import { fireboatStation } from './fireboat-station.ts'
import { oneHundredFirstPlaza, oneHundredFirstPodium } from './first-plaza.ts'
import { stMarysCathedral } from './st-marys.ts'
import { deYoungMuseum } from './de-young.ts'
import { alcatrazCellhouse, alcatrazLighthouse, alcatrazWaterTower } from './alcatraz.ts'
import { graceCathedral } from './grace.ts'
import { legionOfHonor, legionPyramid, legionFountain } from './legion.ts'
import { tunnelPortal, rampPortal } from './portals.ts'
import { presidioChapel, fortMasonChapel, generalsResidence, haskellHouse, brickParkRestaurant, fortMasonBlock, fortMasonGate, windArrows, spreckelsMansion, spreckelsGreenhouse, beachChalet as beachChalet1006, bayModel, tajMahalHouseboat, harneyScience, kalmanovitzHall, kendrickHall, usfGym, alcatrazSmokestack, steppedCondo, BEACH_TOWNHOUSES, angelLight, detentionBarracks, PIER_RESTAURANTS, oneFrontPavilion } from './batch-1006.ts'
import { fremont181 } from './fremont181.ts'
import { EMBARCADERO_PLAZA } from './embarcadero-plaza.ts'
import { EC4_PODIUM } from './ec4-podium.ts'
import { GALILEO } from './galileo.ts'
import { MARINA_LIBRARY } from './marina-library.ts'
import { EMBARCADERO_SOUTH } from './embarcadero-south.ts'
import { CARMELITE } from './carmelite.ts'
import { FIRST_HARRISON } from './first-harrison.ts'
import { HARRISON_WATERFRONT } from './harrison-waterfront.ts'
import { MARKET_FIDI } from './market-fidi.ts'
import { DOGPATCH_CORNER } from './dogpatch-corner.ts'
import { transbayBusRampBridge } from './bus-ramp-bridge.ts'
import { VENUES } from './districts/venues.ts'
import { ART } from './art.ts'
import { yerbaBuenaGardens, mosconeNorth, mosconeSkybridge, mosconeSouthDeck, mosconeOpenBridge } from './yerba-buena.ts'
import { EMBARCADERO } from './embarcadero.ts'
import { sfmoma_151_third } from './sfmoma.ts'
import { metreon_135_fourth } from './metreon.ts'
import { fiveFiveFiveCalifornia } from './five-five-five-california.ts'
import { ica_345_montgomery } from './ica-montgomery.ts'
import { columbusTower_916_kearny } from './columbus-tower.ts'
import { palaceOfFineArts_3301_lyon } from './palace-of-fine-arts.ts'
import { e12_stevensonPlace_149840694 } from './stevenson-place.ts'
import { e12_argenta_940206084 } from './argenta.ts'
import { YBCA } from './ybca.ts'
import { MOSCONE_SOUTH } from './moscone-south.ts'
import { MS_WEST } from './ms-west.ts'
import { MS_GARDENS } from './ms-gardens.ts'
import { MS_EDGES } from './ms-edges.ts'
import { marriottMarquis_missionAt4th } from './marquis.ts'
import { B1 } from './batches/b1.ts'
import { B2 } from './batches/b2.ts'
import { B3 } from './batches/b3.ts'
import { B4 } from './batches/b4.ts'
import { B5 } from './batches/b5.ts'
import { B6 } from './batches/b6.ts'
import { B7 } from './batches/b7.ts'
import { B9 } from './batches/b9.ts'
import { B10 } from './batches/b10.ts'
import { B11 } from './batches/b11.ts'
import { B12 } from './batches/b12.ts'
import { S1 } from './batches/s1.ts'
import { H1 } from './batches/h1.ts'
import { H2 } from './batches/h2.ts'
import { H3 } from './batches/h3.ts'
import { H4 } from './batches/h4.ts'
import { portsmouthSquareDeck, empressOfChina } from './portsmouth.ts'
import { lyonStreetSteps } from './lyon-steps.ts'
import { SCRATCH_1 } from './scratch-1.ts'
import { SCRATCH_2 } from './scratch-2.ts'
import { SCRATCH_3 } from './scratch-3.ts'

export const SF_BUILDERS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  goldenGateBridge, goldenGateBridgeNear, sutroTower, sutroTowerNear, bayBridge, bayBridgeNear, transamericaPyramid, salesforceTower, coitTower, ferryBuilding, cityHall,
  ...TOWER_PRESETS, fiveFiveFiveCalifornia, ...WHARF_CARNIVAL, ...WHARF_SHOPS, ...WHARF_LANDSIDE, ...PIER39_FRONTS, ...PIER39_STYLE, ghirardelliSign, ...PIERS, sfmoma_151_third, metreon_135_fourth, ica_345_montgomery, columbusTower_916_kearny, palaceOfFineArts_3301_lyon,
  e12_stevensonPlace_149840694, e12_argenta_940206084,
  yerbaBuenaGardens, mosconeNorth, mosconeSkybridge, mosconeSouthDeck, mosconeOpenBridge,
  ...EMBARCADERO,
  ...FIDI_1,
  ...FIDI_2,
  ...FIDI_3,
  ...FIDI_4,
  ...WATERFRONT_1,
  ...WATERFRONT_2,
  ...CHINATOWN_1,
  ...CHINATOWN_2,
  ...TIERA_1,
  ...TIERA_2,
  ...REBUILD_E15,
  ...TIERA_3,
  ...TIERA_4,
  ...NOTABLE,
  ...ATRIA,
  ...TIERA_5,
  ...TIERA_6,
  ...TIERA_7,
  ...EXP_1,
  ...EXP_2,
  ...EXP_3,
  ...EXP_4,
  ...EXP_5,
  ...EXP_6,
  ...EXP_7,
  ...EXP_8,
  ...EXP_9,
  ...EXP_10,
  ...EXP_12,
  ...EXP_13,
  ...EXP_14,
  ...CHURCHES_1,
  ...CHURCHES_2,
  ...CHURCHES_3,
  ...WATERFRONT_2_LANDMARKS,
  ...CHURCHES_4,
  ...KIT_DEMO,
  ...TIERA_8,
  ...TIERA_9,
  ...TIERA_10,
  ...HARD_1,
  ...CIVIC_1,
  ...STATIONS,
  ...MODEL_TALL,
  ...MANUAL_1,
  ...MODEL_OPUS,
  ...MODEL_1,
  ...MODEL_2,
  ...MODEL_3,
  ...RUSSIAN_HILL,
  ...MARKET_EAST, ...MARKET_MID, ...MARKET_WEST, ...UNION_SQUARE,
  ...PARKS,
  ...BATTERIES,
  ...TRANSBAY,
  ...FOUNDRY,
  ...SHIPS,
  marina,
  mooringField,
  plazaDeck,
  fortPoint,
  countyJailTwo,
  lombardGardens,
  pier27Plaza,
  ...PROMINENT,
  ...CIVIC_6,
  ...CHURCHES_5,
  ...PIER_39,
  ...CHINATOWN_GATE,
  ...SEA_LIONS,
  ...PARK_SIGHTS,
  ...PAINTED_LADIES,
  ...CIVIC_PLAZA,
  ...PITSTOP,
  ...GOLDEN_HYDRANT,
  ...SEWARD_SLIDES,
  ...GG_COMMONS,
  ...AG_BUILDING,
  ...FOOTBRIDGES,
  ...SUTRO_BASE,
  ...TEA_GARDEN,
  ...MISSION_BAY,
  ...BART_PLAZAS,
  ...WOMENS_BUILDING,
  ...HOSPITALS,
  ...CASTRO_THEATRE,
  ...KEZAR,
  ...LONE_MOUNTAIN,
  ...LIBRARIES,
  ...SPEAKER_TOWERS,
  ...FERRY_GATES,
  ...CIVIC_CENTER,
  ...MASONIC,
  ...ART_INSTITUTE,
  ...CCSF_MISSION,
  ...SHELL_BUILDING,
  ...SCHOOLS,
  ...PICKWICK,
  ...YBI_LIGHT,
  ...MACANG,
  ...HUA_ZANG_SI,
  ...STRAWBERRY_HILL,
  ...FOUNTAINS,
  ...ST_IGNATIUS,
  ...BANK_OF_CALIFORNIA,
  ...NEW_MISSION,
  ...THIRTY_OTIS,
  ...TIBURON_DEPOT,
  ...WEILL,
  ...FEDERAL_BUILDING,
  ...GGP_BUILDINGS,
  ...SHEDS,
  ...MURAL_ALLEYS,
  ...POINT_BONITA,
  ...MONUMENTS,
  ...WIGGLE,
  ...PARK_BUILDINGS,
  ...KIT_CHURCHES,
  seaStacks,
  tiBuildingOne,
  tiHangar,
  fireboatStation,
  oneHundredFirstPlaza,
  oneHundredFirstPodium,
  stMarysCathedral,
  deYoungMuseum,
  alcatrazCellhouse,
  alcatrazLighthouse,
  alcatrazWaterTower,
  graceCathedral,
  legionOfHonor,
  legionPyramid,
  legionFountain,
  tunnelPortal, rampPortal,
  presidioChapel, fortMasonChapel, generalsResidence, haskellHouse, brickParkRestaurant, fortMasonBlock, fortMasonGate, windArrows, spreckelsMansion, spreckelsGreenhouse, beachChalet1006, bayModel, tajMahalHouseboat, harneyScience, kalmanovitzHall, kendrickHall, usfGym, alcatrazSmokestack, steppedCondo, angelLight, detentionBarracks,
  ...BEACH_TOWNHOUSES,
  ...PIER_RESTAURANTS,
  oneFrontPavilion,
  ...EMBARCADERO_PLAZA,
  ...EC4_PODIUM,
  ...GALILEO,
  ...MARINA_LIBRARY,
  ...EMBARCADERO_SOUTH,
  ...CARMELITE,
  ...FIRST_HARRISON,
  ...HARRISON_WATERFRONT,
  ...MARKET_FIDI,
  ...DOGPATCH_CORNER,
  fremont181,
  transbayBusRampBridge,
  ...VENUES,
  ...ART,
  ...YBCA,
  ...MOSCONE_SOUTH,
  ...MS_WEST,
  ...MS_GARDENS,
  ...MS_EDGES,
  marriottMarquis_missionAt4th,
  ...B1,
  ...B2,
  ...B3,
  ...B4,
  ...B5,
  ...BANK_TEMPLES,
  ...FEDERAL_CIVIC_1,
  ...ODDITIES,
  ...B6,
  ...B7,
  ...B9,
  ...B10,
  ...B11,
  ...B12,
  ...S1,
  ...H1,
  ...H2,
  ...H3,
  ...H4,
  portsmouthSquareDeck, empressOfChina,
  // the Lyon Street Steps on their own, for `?model=lyonStreetSteps` (BUGS.md #213a) — in the city they are
  // built from their OSM ways by render/stairs.ts, not placed as a landmark
  lyonStreetSteps,
  ...SCRATCH_1,
  ...SCRATCH_2,
  ...SCRATCH_3,
}
