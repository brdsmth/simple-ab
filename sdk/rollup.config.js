import typescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

const production = !process.env.ROLLUP_WATCH

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/simpleab.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        sourceMap: true,
        declaration: true,
        declarationDir: 'dist'
      }),
      production && terser()
    ].filter(Boolean)
  },
  
  // UMD build for script tags
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/simpleab.js',
      format: 'umd',
      name: 'SimpleAB',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        sourceMap: true
      }),
      production && terser()
    ].filter(Boolean)
  },
  
  // Minified UMD build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/simpleab.min.js',
      format: 'umd',
      name: 'SimpleAB',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        sourceMap: true
      }),
      terser()
    ]
  }
]
