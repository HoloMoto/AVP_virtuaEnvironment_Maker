import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs');

function findBuiltHtml() {
  for (const name of ['index.html', 'index.dev.html']) {
    const candidate = path.join(docsDir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  throw new Error('ビルド済みHTMLが見つかりません。先に npm run build を実行してください。');
}

const builtHtml = findBuiltHtml();
const rootIndex = path.join(root, 'index.html');
const docsIndex = path.join(docsDir, 'index.html');

fs.copyFileSync(builtHtml, rootIndex);
fs.copyFileSync(builtHtml, docsIndex);

const assetsSrc = path.join(docsDir, 'assets');
const assetsDest = path.join(root, 'assets');
fs.rmSync(assetsDest, { recursive: true, force: true });
fs.cpSync(assetsSrc, assetsDest, { recursive: true });

for (const file of ['.nojekyll']) {
  const src = path.join(docsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(root, file));
  }
}

console.log('GitHub Pages (main/root) 用にルートへ同期しました');
