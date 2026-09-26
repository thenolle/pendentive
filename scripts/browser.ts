import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'iife',
  globalName: 'Linteau',
  target: 'es2022',
  platform: 'browser',
  outfile: 'dist/linteau.global.js'
})

console.log('[linteau] browser bundle built -> dist/linteau.global.js')