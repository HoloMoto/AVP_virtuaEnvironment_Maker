import { ensureInitialized, jsEncodeImage } from 'elheif';

let encoderReady = false;

async function ensureEncoder() {
  if (!encoderReady) {
    await ensureInitialized();
    encoderReady = true;
  }
}

self.onmessage = async (event) => {
  const { type, id, imageData } = event.data;

  if (type !== 'encode') return;

  try {
    await ensureEncoder();

    const rgba = new Uint8Array(imageData.data);
    const result = jsEncodeImage(rgba, imageData.width, imageData.height);

    if (result.err) {
      throw new Error(result.err);
    }

    const heicBytes = new Uint8Array(result.data);
    self.postMessage({ id, ok: true, heicBytes }, [heicBytes.buffer]);
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
