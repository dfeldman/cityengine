/**
 * Tour Nuages 1 (Nanterre, Cité Pablo-Picasso, Émile Aillaud; OSM way/67865771): one of Aillaud's cloud towers, IGN BD TOPO
 * hauteur 104.7 m. Lobed OSM ring, mottled blue/grey/green/white sky-camouflage mosaic, small punched windows, flat roof —
 * all in nuages-kit.ts; SEED picks this tower's patch layout.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { nuages } from './nuages-kit.ts'

const HEIGHT = 104.7, SEED = 11

export const tourNuages1 = (out: MeshBuilder, fit: Fit): void => nuages(out, fit, HEIGHT, SEED)
