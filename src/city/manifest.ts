/**
 * A landmark manifest can be split in files (SF_PLAN.md §10: hundreds of buildings, modelled a district at a time,
 * several at once): an entry `{ "include": "san-francisco/financial.json" }` stands for that file's entries, the
 * path relative to public/landmarks/. Includes may nest; each file is read once. Shared by the game (fetch) and
 * the tools (disk), which each pass their own way of reading a file.
 *
 * A file's includes are read all at once, not one after another: San Francisco's manifest is 106 files, and read
 * in turn they were 13 s of a 20 s load at 80 ms round trips (docs/PERFORMANCE.md). Entries keep their order.
 */
export async function expandIncludes<E>(entries: (E | { include: string })[], read: (path: string) => Promise<unknown[] | null>,
                                        seen = new Set<string>()): Promise<E[]> {
  const parts = entries.map((e) => {
    const inc = (e as { include?: string }).include
    if (typeof inc !== 'string') return [e as E]
    if (seen.has(inc)) return []
    seen.add(inc)
    return read(inc).then((got) => (got ? expandIncludes<E>(got as (E | { include: string })[], read, seen) : []))
  })
  return (await Promise.all(parts)).flat()
}

/** For the tools: a manifest from disk, includes expanded. */
export async function readManifestFile<E>(file: string): Promise<E[]> {
  const { readFileSync, existsSync } = await import('node:fs')
  const { dirname, resolve } = await import('node:path')
  const root = dirname(file)
  return expandIncludes<E>(JSON.parse(readFileSync(file, 'utf8')), async (p) => {
    const f = resolve(root, p)
    return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) as unknown[] : null
  })
}
