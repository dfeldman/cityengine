type P = { x: number; z: number }

/** words too common in place names to say two names are the same thing */
const COMMON = new Set(['place', 'palais', 'saint', 'sainte', 'notre', 'église', 'musée', 'jardin', 'fontaine', 'avenue', 'square', 'grand', 'grande', 'tower', 'their'])
const words = (n: string): string[] => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z]+/).filter((w) => w.length >= 5 && !COMMON.has(w))
/** a tour stop's name and a landmark note's for one thing ("The Eiffel Tower", "Tour Eiffel"): near each other, sharing a name word */
export const sameThing = (a: { name: string } & P, b: { name: string } & P, within = 300): boolean =>
  Math.hypot(a.x - b.x, a.z - b.z) < within && words(a.name).some((w) => words(b.name).includes(w))

