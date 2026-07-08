import { MemoryFileSystem, ZeroPerl } from '@6over3/zeroperl-ts';
import exiftoolScript from './vendor/exiftool.pl?raw';
import templateUrl from '../public/iphone-makernotes-template.heic?url';
import { createExiftoolFetch } from './exiftool-fetch.js';

const decoder = new TextDecoder();
let cachedPerlRef = null;
let cachedFileSystemRef = null;
let stdout = '';
let stderr = '';

const IGNORABLE_STDERR = [
  /Error setting file time/i,
  /\[minor\]/i,
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

let templateBytesPromise = null;

function getTemplateBytes() {
  if (!templateBytesPromise) {
    templateBytesPromise = fetch(templateUrl).then(async (res) => {
      if (!res.ok) throw new Error('iPhoneメタデータテンプレートの読み込みに失敗しました');
      return new Uint8Array(await res.arrayBuffer());
    });
  }
  return templateBytesPromise;
}

/**
 * HEICにAppleパノラマメタデータを書き込む（MakerNotesテンプレート + GPano）
 * @param {Uint8Array} heicBytes
 * @param {Record<string, string | number | boolean>} tags
 * @param {{ fetch?: typeof fetch }} [options]
 */
export async function writePanoramaMetadata(heicBytes, tags, options = {}) {
  const fetchFn = options.fetch ?? createExiftoolFetch();
  const { perl, fileSystem } = await getRuntime(fetchFn);
  const tempFiles = [];
  stdout = '';
  stderr = '';
  await perl.reset();

  try {
    const inputPath = '/panorama.heic';
    const templatePath = '/template.heic';
    const outputPath = `/${crypto.randomUUID().replace(/-/g, '')}.tmp`;

    fileSystem.addFile(inputPath, heicBytes);
    fileSystem.addFile(templatePath, await getTemplateBytes());
    tempFiles.push(inputPath, templatePath, outputPath);

    const args = [
      '-P',
      '-TagsFromFile', templatePath,
      '-MakerNotes', '-Make', '-Model', '-HostComputer', '-Software',
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

    const blockingStderr = getBlockingStderr(stderr);
    if (blockingStderr) {
      return { success: false, error: blockingStderr };
    }

    const node = fileSystem.lookup(outputPath);
    if (!node || node.type !== 'file') {
      return { success: false, error: 'メタデータ書き込み後のファイルが見つかりません' };
    }

    const outputData = node.content instanceof Blob
      ? new Uint8Array(await node.content.arrayBuffer())
      : new Uint8Array(node.content);

    return { success: true, data: outputData };
  } finally {
    cleanupTempFiles(fileSystem, tempFiles);
  }
}
