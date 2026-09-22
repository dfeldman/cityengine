// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {VectorNodeDescriptor} from "../descriptors.ts";

const treeTypeMap: Record<string, VectorNodeDescriptor['treeType']> = {
	beech: 'beech',
	fir: 'fir',
	linden: 'linden',
	oak: 'oak'
};

export default function getTreeTypeFromTags(tags: Record<string, string>): VectorNodeDescriptor['treeType'] {
	const typeFromGenus = treeTypeMap[tags.genus];
	if (typeFromGenus) {
		return typeFromGenus;
	}

	const typeFromGenusEn = treeTypeMap[tags['genus:en']];
	if (typeFromGenusEn) {
		return typeFromGenusEn;
	}

	if (tags.leaf_type === 'needleleaved') {
		return 'genericNeedleleaved';
	}

	return 'genericBroadleaved';
}