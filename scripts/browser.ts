import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  sourcemap: true,
  format: 'iife',
  globalName: 'Pendentive',
  target: 'es2022',
  platform: 'browser',
  outfile: 'dist/pendentive.global.js'
})

console.log('[pendentive] browser bundle built -> dist/pendentive.global.js')