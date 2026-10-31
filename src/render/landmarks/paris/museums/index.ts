/**
 * The museums (owner, 2026-10-29: "all train stations, museums, palaces, major government buildings should be done as
 * they are usually all 3" — prominent, unusual and important). One file per builder in this folder; each registered here,
 * and named by an entry in public/landmarks/paris/museums.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { bnfTower } from './bnf-tower.ts'
import { bourseCommerce } from './bourse-commerce.ts'
import { citeDesSciences } from './cite-des-sciences.ts'
import { clunyThermes } from './cluny-thermes.ts'
import { fondationLouisVuitton } from './fondation-louis-vuitton.ts'
import { geode } from './geode.ts'
import { guimetRotunda } from './guimet-rotunda.ts'
import { institutMondeArabe } from './institut-monde-arabe.ts'
import { jeuDePaume, orangerie } from './orangerie.ts'
import { philharmonie } from './philharmonie.ts'
import { quaiBranly } from './quai-branly.ts'
import { chapelleSorbonne } from './chapelle-sorbonne.ts'
import { beauxArts } from './beaux-arts.ts'
import { hopitalSaintLouis } from './hopital-saint-louis.ts'
import { citeDeLaMode } from './cite-de-la-mode.ts'
import { collegeDeFrance } from './college-de-france.ts'
import { hotelDieu } from './hotel-dieu.ts'
import { jacquemartAndre } from './jacquemart-andre.ts'
import { mairie1er } from './mairie-1er.ts'
import { mairie5e } from './mairie-5e.ts'
import { mairie13e } from './mairie-13e.ts'
import { tribunal } from './tribunal.ts'
import { hexagoneBalard } from './hexagone-balard.ts'
import { mobilierNational } from './mobilier-national.ts'
import { reservoirMontsouris } from './reservoir-montsouris.ts'
import { facultePharmacie } from './faculte-pharmacie.ts'
import { faculteMedecine } from './faculte-medecine.ts'
import { ensam } from './ensam.ts'
import { prefecturePolice } from './prefecture-police.ts'
import { bnfRichelieu } from './bnf-richelieu.ts'
import { creditMunicipal } from './credit-municipal.ts'
import { valDeGraceHopital } from './val-de-grace-hopital.ts'
import { pagode } from './pagode.ts'
import { piscineJosephineBaker } from './piscine-josephine-baker.ts'
import { tourZamansky } from './tour-zamansky.ts'
import { zenith } from './zenith.ts'
import { pavillonArsenal } from './pavillon-arsenal.ts'
import { rotondeVillette } from './rotonde-villette.ts'
import { salpetriere } from './salpetriere.ts'
import { sainteGenevieve } from './sainte-genevieve.ts'
import { sorbonne } from './sorbonne.ts'

export const PARIS_MUSEUMS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  orangerie, jeuDePaume, fondationLouisVuitton, quaiBranly, institutMondeArabe, clunyThermes, guimetRotunda, bourseCommerce,
  geode, citeDesSciences, philharmonie, bnfTower,
  sorbonne, chapelleSorbonne, hotelDieu, sainteGenevieve, beauxArts, hopitalSaintLouis, salpetriere, citeDeLaMode, rotondeVillette, pavillonArsenal, collegeDeFrance,
  tourZamansky, pagode, mairie5e, mairie1er, piscineJosephineBaker, zenith, jacquemartAndre,
  mairie13e, tribunal, hexagoneBalard, mobilierNational, reservoirMontsouris, facultePharmacie, faculteMedecine, ensam, prefecturePolice, bnfRichelieu, creditMunicipal, valDeGraceHopital,
}
