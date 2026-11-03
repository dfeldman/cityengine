/**
 * KTX2 textures (glTF KHR_texture_basisu) with no CDN: Babylon's transcoder, served by the game itself.
 *
 * A KTX2 texture stays compressed on the GPU, about a quarter of the memory a WebP decoded to RGBA takes, which is
 * what a phone runs out of first (owner, 2026-11-02: "we do want to run on mobile so ktx2 is desirable"). It is
 * stored in Basis Universal's intermediate form and turned into whatever the device reads (ASTC, BC7, ETC) as it
 * loads, by a small decoder and its WASM transcoders. Babylon fetches those from cdn.babylonjs.com by default; the
 * game must run offline, so they are bundled here instead:
 *
 * - the decoder: `src/vendor/babylon-ktx2decoder/babylon.ktx2Decoder.js`, the UMD build Babylon's workers load with
 *   importScripts (from the `babylonjs-ktx2decoder` package, whose 106 MB `babylonjs` dependency is not wanted);
 * - the transcoders: `@babylonjs/ktx2decoder/wasm/`, pinned to the same version as `@babylonjs/core`.
 *
 * Vite emits each as an asset (hashed in a build, under any `base`), and the URLs are made absolute because the
 * decoder runs in a worker started from a blob. Importing this module is enough; it must run before the first KTX2
 * texture loads, as Babylon reads the URLs once. tests/ktx2.test.ts keeps the three versions in step.
 */
import { KhronosTextureContainer2 } from '@babylonjs/core/Misc/khronosTextureContainer2'
import decoder from '../vendor/babylon-ktx2decoder/babylon.ktx2Decoder.js?url'
import uastcAstc from '@babylonjs/ktx2decoder/wasm/uastc_astc.wasm?url'
import uastcBc7 from '@babylonjs/ktx2decoder/wasm/uastc_bc7.wasm?url'
import uastcRgbaUnorm from '@babylonjs/ktx2decoder/wasm/uastc_rgba8_unorm_v2.wasm?url'
import uastcRgbaSrgb from '@babylonjs/ktx2decoder/wasm/uastc_rgba8_srgb_v2.wasm?url'
import uastcR8 from '@babylonjs/ktx2decoder/wasm/uastc_r8_unorm.wasm?url'
import uastcRg8 from '@babylonjs/ktx2decoder/wasm/uastc_rg8_unorm.wasm?url'
import mscJs from '@babylonjs/ktx2decoder/wasm/msc_basis_transcoder.js?url'
import mscWasm from '@babylonjs/ktx2decoder/wasm/msc_basis_transcoder.wasm?url'
import zstd from '@babylonjs/ktx2decoder/wasm/zstddec.wasm?url'

const abs = (url: string): string => new URL(url, document.baseURI).href

KhronosTextureContainer2.URLConfig = {
  jsDecoderModule: abs(decoder),
  wasmUASTCToASTC: abs(uastcAstc),
  wasmUASTCToBC7: abs(uastcBc7),
  wasmUASTCToRGBA_UNORM: abs(uastcRgbaUnorm),
  wasmUASTCToRGBA_SRGB: abs(uastcRgbaSrgb),
  wasmUASTCToR8_UNORM: abs(uastcR8),
  wasmUASTCToRG8_UNORM: abs(uastcRg8),
  jsMSCTranscoder: abs(mscJs),
  wasmMSCTranscoder: abs(mscWasm),
  wasmZSTDDecoder: abs(zstd),
}
