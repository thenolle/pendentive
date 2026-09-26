import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/svg/index.ts'],
  format: ['esm', 'cjs'],
  dts: false,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  splitting: false,
  minify: false,
  outDir: 'dist'
})