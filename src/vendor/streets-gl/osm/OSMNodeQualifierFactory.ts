// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import AbstractQualifierFactory from "../AbstractQualifierFactory.ts";
import type {VectorNodeDescriptor} from "../descriptors.ts";
import type {Qualifier} from "../Qualifier.ts";
import {QualifierType} from "../Qualifier.ts";
import isUnderground from "./isUnderground.ts";
import {ModifierType} from "../modifiers.ts";
import {isTagIncludesString, parseDirection, parseHeight} from "./tagHelpers.ts";
import getTreeTypeFromTags from "./getTreeTypeFromTags.ts";
import getTreeHeight from "./getTreeHeight.ts";

export default class OSMNodeQualifierFactory extends AbstractQualifierFactory<VectorNodeDescriptor, Record<string, string>> {
	public fromTags(tags: Record<string, string>): Qualifier<VectorNodeDescriptor>[] {
		if (isUnderground(tags)) {
			return null;
		}

		if (tags.natural === 'tree') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'tree',
					height: getTreeHeight(tags),
					treeType: getTreeTypeFromTags(tags)
				}
			}];
		}

		if (
			tags.emergency === 'fire_hydrant' && (
				tags['fire_hydrant:type'] === 'pillar' || tags['fire_hydrant:type'] === undefined
			)
		) {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'hydrant'
				}
			}];
		}

		if (tags.advertising === 'column') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'adColumn'
				}
			}];
		}

		if (tags.power === 'tower') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'transmissionTower'
				}
			}];
		}

		if (tags.power === 'pole') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'utilityPole'
				}
			}];
		}

		if (tags.natural === 'rock') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'rock'
				}
			}];
		}

		if (tags.amenity === 'bench') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'bench',
					direction: parseDirection(tags.direction, undefined)
				}
			}];
		}

		if (tags.leisure === 'picnic_table') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'picnicTable'
				}
			}];
		}

		if (tags.highway === 'bus_stop') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'busStop'
				}
			}];
		}

		if (tags.power === 'generator' && tags['generator:source'] === 'wind') {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'windTurbine',
					height: parseHeight(tags.height, 150)
				}
			}];
		}

		if (
			tags.historic === 'memorial' && isTagIncludesString(tags, 'memorial', 'statue') ||
			tags.tourism === 'artwork' && isTagIncludesString(tags, 'artwork_type', 'statue')
		) {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'statue'
				}
			}];
		}

		if (
			tags.tourism === 'artwork' && isTagIncludesString(tags, 'artwork_type', 'sculpture') ||
			tags.historic === 'memorial' && isTagIncludesString(tags, 'memorial', 'sculpture')
		) {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'sculpture'
				}
			}];
		}

		if (
			tags.historic === 'memorial' && (
				isTagIncludesString(tags, 'memorial', 'war_memorial') ||
				isTagIncludesString(tags, 'memorial', 'stele') ||
				isTagIncludesString(tags, 'memorial', 'obelisk') ||
				isTagIncludesString(tags, 'memorial', 'memorial')
			)
		) {
			return [{
				type: QualifierType.Descriptor,
				data: {
					type: 'memorial'
				}
			}];
		}

		if (tags.highway === 'turning_circle') {
			return [{
				type: QualifierType.Modifier,
				data: {
					type: ModifierType.CircleArea,
					radius: 10,
					descriptor: {
						type: 'roadwayIntersection',
						intersectionMaterial: 'asphalt'
					}
				}
			}];
		}

		if (tags.aeroway === 'helipad') {
			return [{
				type: QualifierType.Modifier,
				data: {
					type: ModifierType.CircleArea,
					radius: 8,
					descriptor: {
						type: 'helipad'
					}
				}
			}];
		}

		return null;
	}
}