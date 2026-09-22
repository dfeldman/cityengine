/**
 * Babylon layer-mask bits, for lighting one set of meshes differently from another.
 *
 * `PEOPLE` marks the strangers. The trees' lights (vegetation.ts) exclude it and the people's own lights
 * include only it: the trees want a strongly blue sky term, and on a light-skinned face in shade that same
 * blue pushed green above red — strangers came out greenish. Meshes keep the default bits as well, so the
 * camera (0x0FFFFFFF) still draws them.
 */
export const PEOPLE = 0x10000000
