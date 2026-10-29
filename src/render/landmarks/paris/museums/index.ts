/**
 * The museums (owner, 2026-10-29: "all train stations, museums, palaces, major government buildings should be done as
 * they are usually all 3" — prominent, unusual and important). One file per builder in this folder; each registered here,
 * and named by an entry in public/landmarks/paris/museums.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { bnfTower } from './bnf-tower.ts'
import { citeDesSciences } from './cite-des-sciences.ts'
import { clunyThermes } from './cluny-thermes.ts'
import { fondationLouisVuitton } from './fondation-louis-vuitton.ts'
import { geode } from './geode.ts'
import { guimetRotunda } from './guimet-rotunda.ts'
import { institutMondeArabe } from './institut-monde-arabe.ts'
import { jeuDePaume, orangerie } from './orangerie.ts'
import { philharmonie } from './philharmonie.ts'
import { quaiBranly } from './quai-branly.ts'
import { saintMartinDesChamps } from './saint-martin-des-champs.ts'

export const PARIS_MUSEUMS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  orangerie, jeuDePaume, fondationLouisVuitton, quaiBranly, institutMondeArabe, clunyThermes, saintMartinDesChamps, guimetRotunda,
  geode, citeDesSciences, philharmonie, bnfTower,
}
