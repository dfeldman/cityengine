// @ts-nocheck -- vendored from streets-gl, which compiles without `strictNullChecks`; see README.md.
// The logic is untouched. Streetrunner's own code consumes it through descriptors.ts, which IS strict.
import type {Qualifier} from "./Qualifier.ts";

export default abstract class AbstractQualifierFactory<T, K> {
	public abstract fromTags(tags: K): Qualifier<T>[];
}