/**
 * ImageData を垂直方向に反転（Blender等距円筒TIFFの座標系補正用）
 * @param {ImageData} imageData
 * @returns {ImageData}
 */
export function flipImageDataVertical(imageData) {
  const { width, height, data } = imageData;
  const flipped = new ImageData(width, height);
  const rowBytes = width * 4;

  for (let y = 0; y < height; y++) {
    const srcOffset = y * rowBytes;
    const dstOffset = (height - 1 - y) * rowBytes;
    flipped.data.set(data.subarray(srcOffset, srcOffset + rowBytes), dstOffset);
  }

  return flipped;
}

/**
 * 変換オプションを適用
 * @param {ImageData} imageData
 * @param {{ flipVertical?: boolean }} [options]
 * @returns {ImageData}
 */
export function applyImageTransforms(imageData, { flipVertical = false } = {}) {
  if (!flipVertical) return imageData;
  return flipImageDataVertical(imageData);
}
