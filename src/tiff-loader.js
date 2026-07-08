import UTIF from 'utif';

/**
 * TIFFファイルをRGBA ImageDataにデコードする
 * @param {ArrayBuffer} buffer
 * @returns {Promise<ImageData>}
 */
export async function decodeTiff(buffer) {
  const ifds = UTIF.decode(buffer);
  if (!ifds.length) {
    throw new Error('TIFF画像を読み込めませんでした。');
  }

  const ifd = ifds[0];
  UTIF.decodeImage(buffer, ifd);

  const rgba = UTIF.toRGBA8(ifd);
  const { width, height } = ifd;

  if (!width || !height) {
    throw new Error('TIFFの解像度情報が不正です。');
  }

  const imageData = new ImageData(width, height);
  imageData.data.set(rgba);
  return imageData;
}

/**
 * ブラウザが直接読める画像形式かどうか
 * @param {File} file
 */
export function isTiffFile(file) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith('.tif') ||
    name.endsWith('.tiff') ||
    file.type === 'image/tiff'
  );
}

/**
 * PNG/JPEG等をImageDataに変換
 * @param {File} file
 * @returns {Promise<ImageData>}
 */
export async function decodeRasterImage(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * 任意の画像ファイルをImageDataに変換
 * @param {File} file
 * @returns {Promise<ImageData>}
 */
export async function loadImageFile(file) {
  if (isTiffFile(file)) {
    const buffer = await file.arrayBuffer();
    return decodeTiff(buffer);
  }
  return decodeRasterImage(file);
}
