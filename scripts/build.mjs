import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const dest = join(root, 'dist');
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest);
for (const name of readdirSync(root)) {
  if (name === 'index.html' || name === 'cards.md' || /\.(css|mjs)$/.test(name)) cpSync(join(root, name), join(dest, name));
}
cpSync(join(root, 'assets'), join(dest, 'assets'), {
  recursive: true,
  filter: source => !source.split('/').some(part => part.startsWith('.'))
});
writeFileSync(join(dest, '.nojekyll'), '');
console.log('Игра собрана в dist/');
