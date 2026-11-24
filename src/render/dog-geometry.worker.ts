/** Builds dogkit dog geometry off the main thread (render/dog-walks.ts): a low-quality dog takes ~0.25 s to mesh. */
import { buildDogGeometry, type DogGeometry, type Quality } from 'dogkit/geometry'
import type { DogSpec } from 'dogkit'

self.onmessage = (e: MessageEvent<{ id: number; spec: DogSpec; quality: Quality }>) => {
  const { id, spec, quality } = e.data
  const g: DogGeometry = buildDogGeometry(spec, { quality })
  const buffers = [g.body, g.eyes, g.mouth].flatMap((m) => Object.values(m).filter((v) => ArrayBuffer.isView(v)).map((v) => (v as Float32Array).buffer))
  ;(self as unknown as Worker).postMessage({ id, geometry: g }, buffers)
}
