import { encode, loadEncoder } from 'icodec/heic-only';
import heicEncWasmUrl from 'icodec/heic-enc.wasm?url';

let encoderReady = false;

async function ensureEncoder() {
  if (!encoderReady) {
    await loadEncoder(heicEncWasmUrl);
    encoderReady = true;
  }
}

self.onmessage = async (event) => {
  const { type, id, imageData, options } = event.data;

  if (type !== 'encode') return;

  try {
    await ensureEncoder();

    const payload = {
      width: imageData.width,
      height: imageData.height,
      depth: 8,
      data: new Uint8Array(imageData.data.buffer),
    };

    const heicBytes = encode(payload, {
      quality: options?.quality ?? 85,
      preset: 'medium',
      tune: 'ssim',
      chroma: '444',
    });

    self.postMessage({ id, ok: true, heicBytes }, [heicBytes.buffer]);
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
