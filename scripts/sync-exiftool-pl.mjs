import fs from 'node:fs';
import path from 'node:path';

/**
 * @uswriting/exiftool バンドル内の JS テンプレートリテラルから
 * Perl スクリプトを正しく復元する（生コピーだと正規表現が壊れる）
 */
function extractJsTemplateLiteral(src, varName) {
  const marker = `var ${varName}=\``;
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`exiftool script marker not found: ${marker}`);

  let i = start + marker.length;
  let result = '';
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\') {
      i += 1;
      const esc = src[i];
      switch (esc) {
        case 'n': result += '\n'; break;
        case 'r': result += '\r'; break;
        case 't': result += '\t'; break;
        case '`': result += '`'; break;
        case '$': result += '$'; break;
        case '\\': result += '\\'; break;
        default: result += esc;
      }
      i += 1;
      continue;
    }
    if (ch === '`') break;
    result += ch;
    i += 1;
  }
  return result;
}

const bundlePath = path.join(process.cwd(), 'node_modules/@uswriting/exiftool/dist/esm/index.js');
const outPath = path.join(process.cwd(), 'src/vendor/exiftool.pl');

const bundle = fs.readFileSync(bundlePath, 'utf8');
const script = extractJsTemplateLiteral(bundle, 'y');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, script);
console.log(`exiftool.pl を同期しました (${script.length} bytes)`);
