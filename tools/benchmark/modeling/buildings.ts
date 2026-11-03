/**
 * The benchmark set (buildings.json), typed. Twenty buildings, ten in each city: distinctive enough that a generic
 * box is plainly wrong, ordinary enough in type (stadium, arena, museum, station, church, civic hall) that the
 * primitives can say them. Each one is already modelled in the game, by hand or by Opus — `reference` names that
 * builder, so `?model=<reference>` puts the bar beside a contestant's attempt.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const HERE = import.meta.dirname

/** one thing a person checking the render looks for; `check` is the part of it the scorer can test from the parts */
export interface Feature {
  label: string
  check?: {
    /** count only these part types */
    types?: string[]
    material?: string
    /** how many matching parts (default 1) */
    min?: number
    /** columns contributed in total (a colonnade's count, each slender cylinder) */
    minColumns?: number
    /** arcade openings in total */
    minArches?: number
    /** the part reaches at least this high, metres */
    minTop?: number
    /** the part stays at or below this height, metres (a plinth, a podium, a low wing) */
    maxTop?: number
    minRadius?: number
  }
}

export interface Photo {
  /** the Commons file */
  title: string
  /** which side it shows, written from the photograph */
  view: string
  license: string
  artist: string
  width: number
  height: number
}

export interface Building {
  id: string
  name: string
  city: 'San Francisco' | 'Paris'
  type: string
  /** 1 a few masses and one signature feature … 3 many parts that must meet properly */
  difficulty: 1 | 2 | 3
  wiki: string
  /** compass bearing the front faces, degrees */
  front: number
  /** what the front is, in words the prompt can use */
  frontIs: string
  /** the highest point, metres */
  height: number
  osm: string[]
  /** a measured rectangle [x, z] used instead of OSM, where OSM's outline is not the building (with why, in `scope`) */
  rect?: [number, number]
  /** a sentence the prompt passes on when the footprint needs explaining */
  scope?: string
  /** the game's builder for it: open `?model=<reference>` */
  reference: string
  /** the game's manifest entry that places that builder, for reference.ts to build it on its own footprint */
  referenceEntry: { name: string; city: string }
  features: Feature[]
  photos: Photo[]
}

export function loadBuildings(): Building[] {
  return JSON.parse(readFileSync(resolve(HERE, 'buildings.json'), 'utf8')).buildings as Building[]
}
