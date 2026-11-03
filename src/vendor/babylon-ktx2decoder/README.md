# babylon.ktx2Decoder.js

Babylon.js's KTX2 decoder, the UMD build its texture workers load with `importScripts`, vendored so the game can
decode KTX2 textures offline (src/render/ktx2.ts).

- From the npm package `babylonjs-ktx2decoder` **9.26.0** (`babylon.ktx2Decoder.js`, unchanged), sha256
  `25663f05949aa4b1fd480b5bf49056e6216eab945ee0e5a9f59428b21689b111`. The package itself is not a dependency: it
  pulls in the whole 106 MB `babylonjs` UMD build for nothing.
- Its WASM transcoders come from the `@babylonjs/ktx2decoder` dependency, at the same version.
- Apache License 2.0 (LICENSE.md), copyright Babylon.js contributors.

When `@babylonjs/core` is upgraded, replace this file from the matching `babylonjs-ktx2decoder` version, update the
hash and version here, and pin `@babylonjs/ktx2decoder` to it: tests/ktx2.test.ts fails until all three agree.
