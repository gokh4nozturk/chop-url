import * as esbuild from 'esbuild';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

await esbuild.build({
  entryPoints: ['src/worker.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'dist/worker.js',
  external: ['__STATIC_CONTENT_MANIFEST'],
  plugins: [
    {
      name: 'workspace-resolver',
      setup(build) {
        build.onResolve({ filter: /^@chop-url\/lib$/ }, (args) => {
          return {
            path: resolve(__dirname, '../lib/src/index.ts'),
          };
        });
      },
    },
  ],
});
