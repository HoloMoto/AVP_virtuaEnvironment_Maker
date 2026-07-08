import { writeXmpToHeicAsString } from '@aidin36/xmp';
import { buildPanoramaXmp, validatePanoramaAspect } from './metadata.js';
import { loadImageFile } from './tiff-loader.js';
import HeicWorker from './heic-worker.js?worker';
import './styles.css';

const state = {
  file: null,
  imageData: null,
  previewUrl: null,
  worker: null,
  jobId: 0,
};

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (key === 'textContent') node.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    if (typeof child === 'string') node.appendChild(document.createTextNode(child));
    else if (child) node.appendChild(child);
  }
  return node;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function setStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.dataset.type = type;
}

function setProgress(visible, value = 0, label = '') {
  const wrap = document.getElementById('progress-wrap');
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-label');
  wrap.hidden = !visible;
  bar.style.width = `${value}%`;
  text.textContent = label;
}

function updatePreview() {
  const preview = document.getElementById('preview');
  const meta = document.getElementById('image-meta');

  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);

  if (!state.imageData) {
    preview.removeAttribute('src');
    meta.textContent = '画像が選択されていません';
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = state.imageData.width;
  canvas.height = state.imageData.height;
  canvas.getContext('2d').putImageData(state.imageData, 0, 0);
  state.previewUrl = canvas.toDataURL('image/jpeg', 0.6);
  preview.src = state.previewUrl;

  const aspect = validatePanoramaAspect(state.imageData.width, state.imageData.height);
  meta.innerHTML = `
    <span>${state.imageData.width} × ${state.imageData.height} px</span>
    <span class="${aspect.ok ? 'ok' : 'warn'}">${aspect.message}</span>
  `;
}

function getWorker() {
  if (!state.worker) state.worker = new HeicWorker();
  return state.worker;
}

function encodeHeic(imageData) {
  return new Promise((resolve, reject) => {
    const worker = getWorker();
    const id = ++state.jobId;

    const onMessage = (event) => {
      if (event.data.id !== id) return;
      worker.removeEventListener('message', onMessage);
      if (event.data.ok) resolve(event.data.heicBytes);
      else reject(new Error(event.data.error || 'HEICエンコードに失敗しました'));
    };

    worker.addEventListener('message', onMessage);
    worker.postMessage({
      type: 'encode',
      id,
      imageData: {
        width: imageData.width,
        height: imageData.height,
        data: imageData.data,
      },
    });
  });
}

async function handleFile(file) {
  if (!file) return;

  setStatus('画像を読み込んでいます…', 'info');
  setProgress(true, 15, 'TIFF / 画像をデコード中');

  try {
    state.file = file;
    state.imageData = await loadImageFile(file);
    updatePreview();
    document.getElementById('convert-btn').disabled = false;
    setProgress(false);
    setStatus(`${file.name} を読み込みました（${formatBytes(file.size)}）`, 'success');
  } catch (error) {
    state.file = null;
    state.imageData = null;
    updatePreview();
    document.getElementById('convert-btn').disabled = true;
    setProgress(false);
    setStatus(error instanceof Error ? error.message : '読み込みに失敗しました', 'error');
  }
}

async function handleConvert() {
  if (!state.imageData) return;

  const convertBtn = document.getElementById('convert-btn');
  const heading = Number(document.getElementById('heading').value) || 0;
  const filenameBase = (state.file?.name || 'panorama').replace(/\.[^.]+$/, '');

  convertBtn.disabled = true;
  setStatus('HEICにエンコードしています…（大きな画像は数分かかることがあります）', 'info');
  setProgress(true, 35, 'HEICエンコード中…');

  try {
    const heicBytes = await encodeHeic(state.imageData);
    setProgress(true, 75, 'パノラマメタデータを埋め込み中…');

    const xmp = buildPanoramaXmp({
      width: state.imageData.width,
      height: state.imageData.height,
      heading,
    });

    const withXmp = writeXmpToHeicAsString(heicBytes, xmp);
    setProgress(true, 95, 'ダウンロード準備中…');

    const blob = new Blob([withXmp], { type: 'image/heic' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase}_panorama.heic`;
    link.click();
    URL.revokeObjectURL(url);

    setProgress(true, 100, '完了');
    setStatus(`変換完了: ${filenameBase}_panorama.heic（${formatBytes(blob.size)}）`, 'success');
    setTimeout(() => setProgress(false), 1200);
  } catch (error) {
    setProgress(false);
    setStatus(error instanceof Error ? error.message : '変換に失敗しました', 'error');
  } finally {
    convertBtn.disabled = false;
  }
}

function setupDropZone(zone, input) {
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) handleFile(file);
  });
}

function render() {
  const root = document.getElementById('app');
  const fileInput = el('input', { type: 'file', id: 'file-input', accept: '.tif,.tiff,.png,.jpg,.jpeg,image/tiff,image/png,image/jpeg', hidden: true });
  const dropZone = el('div', { className: 'drop-zone', id: 'drop-zone' }, [
    el('div', { className: 'drop-icon', textContent: '📷' }),
    el('p', { className: 'drop-title', textContent: 'TIFF / 画像をドロップ、またはクリックして選択' }),
    el('p', { className: 'drop-hint', textContent: 'Blenderの等距円筒（Equirectangular）レンダー推奨・2:1比率（例: 8192×4096）' }),
  ]);

  root.appendChild(
    el('div', { className: 'page' }, [
      el('header', { className: 'hero' }, [
        el('p', { className: 'eyebrow', textContent: 'Apple Vision Pro / visionOS 27' }),
        el('h1', { textContent: 'AVP Virtual Environment Maker' }),
        el('p', { className: 'subtitle', textContent: 'Blenderでレンダリングした360°パノラマTIFFを、iPhoneで撮影したパノラマとして認識されるHEICに変換します。visionOS 27の「パノラマを空間シーン化してEnvironmentに設定」機能で使えます。' }),
      ]),
      el('main', { className: 'layout' }, [
        el('section', { className: 'card' }, [
          el('h2', { textContent: '1. 画像をアップロード' }),
          fileInput,
          dropZone,
          el('div', { className: 'preview-wrap' }, [
            el('img', { id: 'preview', alt: 'プレビュー' }),
            el('div', { id: 'image-meta', className: 'image-meta', textContent: '画像が選択されていません' }),
          ]),
        ]),
        el('section', { className: 'card' }, [
          el('h2', { textContent: '2. オプション' }),
          el('div', { className: 'field' }, [
            el('label', { for: 'heading', textContent: '初期の向き（PoseHeadingDegrees）' }),
            el('input', { type: 'number', id: 'heading', min: '0', max: '359', value: '0', step: '1' }),
            el('p', { className: 'hint', textContent: 'パノラマの中心が向く方位角（0=北、時計回り）。通常は0のままで問題ありません。' }),
          ]),
          el('div', { className: 'field note-inline' }, [
            el('p', { className: 'hint', textContent: 'HEICエンコードはGitHub Pages互換の方式を使用しています（SharedArrayBuffer不要）。大きな画像ほど時間がかかります。' }),
          ]),
        ]),
        el('section', { className: 'card actions' }, [
          el('h2', { textContent: '3. 変換してダウンロード' }),
          el('button', { id: 'convert-btn', className: 'primary', disabled: true, onClick: handleConvert, textContent: 'HEICに変換してダウンロード' }),
          el('div', { id: 'progress-wrap', hidden: true }, [
            el('div', { className: 'progress-track' }, [el('div', { id: 'progress-bar', className: 'progress-bar' })]),
            el('p', { id: 'progress-label', className: 'progress-label' }),
          ]),
          el('p', { id: 'status', className: 'status', 'data-type': 'info', textContent: 'TIFFファイルを選択してください。すべての処理はブラウザ内で完結し、サーバーへアップロードされません。' }),
        ]),
        el('section', { className: 'card info-card' }, [
          el('h2', { textContent: '使い方（Blender → visionOS）' }),
          el('ol', {}, [
            el('li', { textContent: 'Blender: カメラをパノラマ（等距円筒 / Equirectangular）でレンダリングし、TIFFまたはPNGで書き出す。' }),
            el('li', { textContent: 'このツールでHEICに変換し、AirDropやiCloud経由でiPhone / Vision Proの写真アプリへ取り込む。' }),
            el('li', { textContent: 'visionOS 27: 写真アプリでパノラマを開き、「空間シーンに変換」→ Environmentとして設定。' }),
          ]),
          el('h3', { textContent: '埋め込まれるメタデータ' }),
          el('ul', { className: 'tag-list' }, [
            el('li', { textContent: 'GPano:UsePanoramaViewer = True' }),
            el('li', { textContent: 'GPano:ProjectionType = equirectangular' }),
            el('li', { textContent: 'GPano:FullPano / CroppedArea 各ピクセル寸法' }),
            el('li', { textContent: 'GPano:CaptureSoftware / StitchingSoftware = iPhone' }),
          ]),
          el('p', { className: 'note', textContent: '※ 初回変換時はHEICエンコーダ（約1.5MB）の読み込みに時間がかかります。WebAssembly SIMD対応ブラウザ（Chrome / Edge / Safari 最新版）が必要です。' }),
        ]),
      ]),
      el('footer', { className: 'footer', textContent: 'AVP Virtual Environment Maker — GitHub Pages' }),
    ]),
  );

  setupDropZone(dropZone, fileInput);
}

render();
