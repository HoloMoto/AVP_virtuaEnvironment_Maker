import { MemoryFileSystem, ZeroPerl } from '@6over3/zeroperl-ts';
import exiftoolScript from './vendor/exiftool.pl?raw';
import { createExiftoolFetch } from './exiftool-fetch.js';

const decoder = new TextDecoder();
let cachedPerlRef = null;
let cachedFileSystemRef = null;
let stdout = '';
let stderr = '';

const IGNORABLE_STDERR = [
  /Error setting file time/i,
  /\[minor\]/i,
  /Item info entries are out of order/i,
  /Can't convert ExifIFD:CustomRendered/i,
];

async function getRuntime(fetchFn) {
  let perl = cachedPerlRef?.deref();
  let fileSystem = cachedFileSystemRef?.deref();

  if (!perl || !fileSystem) {
    fileSystem = new MemoryFileSystem({ '/': '' });
    fileSystem.addFile('/exiftool', exiftoolScript);
    perl = await ZeroPerl.create({
      fileSystem,
      stdout: (data) => {
        stdout += typeof data === 'string' ? data : decoder.decode(data);
      },
      stderr: (data) => {
        stderr += typeof data === 'string' ? data : decoder.decode(data);
      },
      fetch: fetchFn,
    });
    cachedPerlRef = new WeakRef(perl);
    cachedFileSystemRef = new WeakRef(fileSystem);
  }

  return { perl, fileSystem };
}

function cleanupTempFiles(fileSystem, paths) {
  for (const path of paths) {
    try {
      fileSystem.removeFile(path);
    } catch {
      // ignore
    }
  }
}

function tagsToArgs(tags) {
  return Object.entries(tags).flatMap(([name, value]) =>
    Array.isArray(value) ? value.map((v) => `-${name}=${v}`) : [`-${name}=${value}`],
  );
}

function getBlockingStderr(text) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.filter((line) => !IGNORABLE_STDERR.some((re) => re.test(line))).join('\n');
}

/**
 * パノラマメタデータを画像に書き込む（JPEG / HEIC）
 * MakerNotes はコピーしない（通常写真のタグがパノラマ判定を妨げるため）
 * @param {Uint8Array} imageBytes
 * @param {Record<string, string | number | boolean>} tags
 * @param {{ filename?: string, fetch?: typeof fetch }} [options]
 */
export async function writePanoramaMetadata(imageBytes, tags, options = {}) {
  const fetchFn = options.fetch ?? createExiftoolFetch();
  const filename = options.filename ?? 'panorama.jpg';
  const { perl, fileSystem } = await getRuntime(fetchFn);
  const tempFiles = [];
  stdout = '';
  stderr = '';
  await perl.reset();

  try {
    const inputPath = `/${filename}`;
    const outputPath = `/${crypto.randomUUID().replace(/-/g, '')}.tmp`;

    fileSystem.addFile(inputPath, imageBytes);
    tempFiles.push(inputPath, outputPath);

    const args = [
      '-P',
      ...tagsToArgs(tags),
      '-o', outputPath,
      inputPath,
    ];

    const result = await perl.runFile('/exiftool', args);
    perl.flush();

    if (!result.success || result.exitCode !== 0) {
      return {
        success: false,
        error: perl.getLastError() || stderr || 'ExifToolの実行に失敗しました',
      };
    }

    const node = fileSystem.lookup(outputPath);
    if (!node || node.type !== 'file') {
      const blockingStderr = getBlockingStderr(stderr);
      return {
        success: false,
        error: blockingStderr || 'メタデータ書き込み後のファイルが見つかりません',
      };
    }

    const blockingStderr = getBlockingStderr(stderr);
    if (blockingStderr) {
      // 出力ファイルがあれば警告のみとして続行
      console.warn('ExifTool warnings:', blockingStderr);
    }

    const outputData = node.content instanceof Blob
      ? new Uint8Array(await node.content.arrayBuffer())
      : new Uint8Array(node.content);

    return { success: true, data: outputData };
  } finally {
    cleanupTempFiles(fileSystem, tempFiles);
  }
}
