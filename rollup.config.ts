// rollup.config.ts
// @ts-ignore
import { terser } from '@rollup/plugin-terser';

export default {
  input: 'dist/index.js',
  output: {
    file: 'dist/uni-memory-cache.browser.js',
    format: 'umd',
    name: 'InMemoryCache',
    plugins: [terser()],
  },
};
