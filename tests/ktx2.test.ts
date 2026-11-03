import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// src/render/ktx2.ts serves Babylon's KTX2 decoder and transcoders from the game: the vendored decoder, the
// @babylonjs/ktx2decoder WASM and @babylonjs/core must be the same release, or textures fail to decode at run time
const root = resolve(import.meta.dirname, '..')
const read = (p: string): string => readFileSync(resolve(root, p), 'utf8')
const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }
const installed = (name: string): string => (JSON.parse(read(`node_modules/${name}/package.json`)) as { version: string }).version
const vendorReadme = read('src/vendor/babylon-ktx2decoder/README.md')

describe('KTX2 transcoder bundled for offline play', () => {
  it('pins the WASM transcoders to the core version', () => {
    expect(pkg.dependencies['@babylonjs/ktx2decoder']).toBe(pkg.dependencies['@babylonjs/core'])
    expect(installed('@babylonjs/ktx2decoder')).toBe(installed('@babylonjs/core'))
  })

  it('vendors the decoder of the same version, unchanged', () => {
    const version = /babylonjs-ktx2decoder` \*\*([\d.]+)\*\*/.exec(vendorReadme)?.[1]
    expect(version).toBe(installed('@babylonjs/core'))
    const hash = createHash('sha256').update(readFileSync(resolve(root, 'src/vendor/babylon-ktx2decoder/babylon.ktx2Decoder.js'))).digest('hex')
    expect(vendorReadme).toContain(hash)
  })

  it('points every Babylon URL at the bundled files, none at the CDN', () => {
    const src = read('src/render/ktx2.ts')
    const keys = ['jsDecoderModule', 'wasmUASTCToASTC', 'wasmUASTCToBC7', 'wasmUASTCToRGBA_UNORM', 'wasmUASTCToRGBA_SRGB',
      'wasmUASTCToR8_UNORM', 'wasmUASTCToRG8_UNORM', 'jsMSCTranscoder', 'wasmMSCTranscoder', 'wasmZSTDDecoder']
    for (const k of keys) expect(src).toMatch(new RegExp(`${k}: abs\\(`))
    expect(src).not.toContain('cdn.babylonjs.com/')
  })
})
