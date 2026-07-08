/**
 * ImageData を高品質 JPEG にエンコード（パノラマメタデータ埋め込み用）
 * @param {ImageData} imageData
 * @param {number} [quality=0.92]
 */
export function encodeJpeg(imageData, quality = 0.92) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('JPEGエンコードに失敗しました'));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      'image/jpeg',
      quality,
    );
  });
}
