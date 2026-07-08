/**
 * iPhoneパノラマとして認識されるGPano XMPメタデータを生成する
 */

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {object} options
 * @param {number} options.width
 * @param {number} options.height
 * @param {number} [options.heading=0]
 * @param {string} [options.captureSoftware='iPhone']
 * @param {string} [options.stitchingSoftware='iPhone']
 */
export function buildPanoramaXmp({
  width,
  height,
  heading = 0,
  captureSoftware = 'iPhone',
  stitchingSoftware = 'iPhone',
}) {
  const w = Math.round(width);
  const h = Math.round(height);
  const headingValue = ((heading % 360) + 360) % 360;

  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="AVP Virtual Environment Maker 1.0">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:GPano="http://ns.google.com/photos/1.0/panorama/">
      <GPano:UsePanoramaViewer>True</GPano:UsePanoramaViewer>
      <GPano:ProjectionType>equirectangular</GPano:ProjectionType>
      <GPano:FullPanoWidthPixels>${w}</GPano:FullPanoWidthPixels>
      <GPano:FullPanoHeightPixels>${h}</GPano:FullPanoHeightPixels>
      <GPano:CroppedAreaImageWidthPixels>${w}</GPano:CroppedAreaImageWidthPixels>
      <GPano:CroppedAreaImageHeightPixels>${h}</GPano:CroppedAreaImageHeightPixels>
      <GPano:CroppedAreaLeftPixels>0</GPano:CroppedAreaLeftPixels>
      <GPano:CroppedAreaTopPixels>0</GPano:CroppedAreaTopPixels>
      <GPano:PoseHeadingDegrees>${headingValue}</GPano:PoseHeadingDegrees>
      <GPano:CaptureSoftware>${escapeXml(captureSoftware)}</GPano:CaptureSoftware>
      <GPano:StitchingSoftware>${escapeXml(stitchingSoftware)}</GPano:StitchingSoftware>
      <GPano:InitialViewHeadingDegrees>${headingValue}</GPano:InitialViewHeadingDegrees>
      <GPano:InitialViewPitchDegrees>0</GPano:InitialViewPitchDegrees>
      <GPano:InitialViewRollDegrees>0</GPano:InitialViewRollDegrees>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

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
