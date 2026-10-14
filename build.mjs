import { mkdir, copyFile, cp } from 'node:fs/promises';
await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
for (const file of ['index.html', 'style.css', 'audio.js', 'app.js', 'themes.css', 'theme.js']) {
  await copyFile(new URL(file, import.meta.url), new URL('dist/' + file, import.meta.url));
}
console.log('Built standalone page: dist/index.html');

await cp(new URL('./assets/', import.meta.url), new URL('./dist/assets/', import.meta.url), { recursive: true });
