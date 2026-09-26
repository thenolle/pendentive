import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'iife',
  globalName: 'Socle',
  target: 'es2022',
  platform: 'browser',
  outfile: 'dist/socle.global.js'
})

console.log('[socle] browser bundle built -> dist/socle.global.js')