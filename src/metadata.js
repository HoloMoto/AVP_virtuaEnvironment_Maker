/**
 * 等距円筒パノラマの推奨アスペクト比（2:1）を検証
 * @param {number} width
 * @param {number} height
 */
export function validatePanoramaAspect(width, height) {
  const ratio = width / height;
  const target = 2;
  const tolerance = 0.02;

  if (Math.abs(ratio - target) <= tolerance) {
    return { ok: true, ratio, message: '推奨の2:1アスペクト比です。' };
  }

  return {
    ok: false,
    ratio,
    message: `アスペクト比は ${ratio.toFixed(2)}:1 です。360°パノラマには 2:1（例: 8192×4096）が推奨されます。`,
  };
}
