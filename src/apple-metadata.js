/**
 * Apple Photos / visionOS がパノラマとして認識しやすい EXIF + XMP タグ
 * CustomRendered=6 (Panorama) + Apple MakerNotes + GPano XMP
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
    // Apple パノラマ判定の核心（数値 6 = Panorama）
    'ExifIFD:CustomRendered': 6,
    CustomRendered: 6,
    Make: 'Apple',
    Model: model,
    HostComputer: model,
    Software: '18.5',
    'IFD0:TileWidth': 512,
    'IFD0:TileLength': 512,
    Orientation: 1,
    ColorSpace: 'sRGB',
    XResolution: 72,
    YResolution: 72,
    ResolutionUnit: 'inches',
    // GPano XMP（パノラマビューア用）
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
    'XMP-GPano:InitialHorizontalFOVDegrees': 75,
    'XMP-GPano:CaptureSoftware': 'iPhone',
    'XMP-GPano:StitchingSoftware': 'iPhone',
  };
}
