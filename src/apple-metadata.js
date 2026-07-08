/**
 * Apple Photos / visionOS がパノラマとして認識しやすい EXIF + XMP タグ
 * GPano XMP だけでは不十分で、CustomRendered=Panorama が重要
 */

/**
 * @param {object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} [options.heading=0]
 * @param {string} [options.model='iPhone 15 Pro']
 */
export function buildApplePanoramaTags({
  width,
  height,
  heading = 0,
  model = 'iPhone 15 Pro',
}) {
  const w = Math.round(width);
  const h = Math.round(height);
  const headingValue = ((heading % 360) + 360) % 360;

  return {
    // Apple がパノラマ判定に使う EXIF（ExifTool 表示名）
    CustomRendered: 'Panorama',
    Make: 'Apple',
    Model: model,
    HostComputer: model,
    Software: '18.5',
    TileWidth: 512,
    TileLength: 512,
    Orientation: 1,
    ColorSpace: 'sRGB',
    // GPano XMP
    'XMP-GPano:UsePanoramaViewer': 'True',
    'XMP-GPano:ProjectionType': 'equirectangular',
    'XMP-GPano:FullPanoWidthPixels': w,
    'XMP-GPano:FullPanoHeightPixels': h,
    'XMP-GPano:CroppedAreaImageWidthPixels': w,
    'XMP-GPano:CroppedAreaImageHeightPixels': h,
    'XMP-GPano:CroppedAreaLeftPixels': 0,
    'XMP-GPano:CroppedAreaTopPixels': 0,
    'XMP-GPano:PoseHeadingDegrees': headingValue,
    'XMP-GPano:InitialViewHeadingDegrees': headingValue,
    'XMP-GPano:InitialViewPitchDegrees': 0,
    'XMP-GPano:InitialViewRollDegrees': 0,
    'XMP-GPano:CaptureSoftware': 'iPhone',
    'XMP-GPano:StitchingSoftware': 'iPhone',
  };
}
