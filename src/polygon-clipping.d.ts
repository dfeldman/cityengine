declare module 'polygon-clipping' {
  type Ring = [number, number][]
  type Poly = Ring[]
  type Multi = Poly[]
  type Geom = Poly | Multi
  const pc: {
    union(geom: Geom, ...geoms: Geom[]): Multi
    intersection(geom: Geom, ...geoms: Geom[]): Multi
    difference(geom: Geom, ...geoms: Geom[]): Multi
    xor(geom: Geom, ...geoms: Geom[]): Multi
  }
  export default pc
}
