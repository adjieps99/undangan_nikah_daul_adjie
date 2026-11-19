import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

await build({
  entryPoints: [path.join(rootDir, 'src', 'firebase.ts')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  outfile: path.join(rootDir, 'static', 'js', 'firebase', 'firebaseClient.bundle.js')
});

console.log('Built static/js/firebase/firebaseClient.bundle.js');
