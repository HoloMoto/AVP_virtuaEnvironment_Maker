# AVP Virtual Environment Maker

Blenderでレンダリングした360°パノラマ（等距円筒 / Equirectangular）TIFF画像を、**iPhoneで撮影したパノラマとして認識されるHEIC**に変換するブラウザツールです。

[visionOS 27](https://www.apple.com/os/visionos/) では、パノラマ写真を空間シーンに変換し、カスタム **Environment（没入型背景）** として使えるようになります。このツールは、Blenderで作成したバーチャル空間をその機能で利用するためのものです。

**ライブデモ:** https://holomoto.github.io/AVP_virtuaEnvironment_Maker/

## 機能

- TIFF / PNG / JPEG のアップロード（ドラッグ＆ドロップ対応）
- ブラウザ内での HEIC エンコード（サーバーへのアップロードなし）
- iPhone パノラマ互換の **GPano XMP メタデータ** を自動埋め込み
- HEIC ファイルのダウンロード

## 埋め込まれるメタデータ

| タグ | 値 |
|------|-----|
| `GPano:UsePanoramaViewer` | `True` |
| `GPano:ProjectionType` | `equirectangular` |
| `GPano:FullPanoWidthPixels` | 画像幅 |
| `GPano:FullPanoHeightPixels` | 画像高さ |
| `GPano:CroppedAreaImageWidthPixels` | 画像幅 |
| `GPano:CroppedAreaImageHeightPixels` | 画像高さ |
| `GPano:CaptureSoftware` | `iPhone` |
| `GPano:StitchingSoftware` | `iPhone` |

## Blender での推奨設定

1. カメラの投影を **Panoramic → Equirectangular** に設定
2. 解像度は **2:1** のアスペクト比（例: 8192×4096, 4096×2048）
3. TIFF または PNG でレンダリング

## visionOS での使い方

1. 変換した HEIC を AirDrop / iCloud 経由で Vision Pro または iPhone の写真アプリへ取り込む
2. 写真アプリでパノラマを開く
3. visionOS 27: **空間シーンに変換** → **Environment として設定**

## ローカル開発

```bash
npm install
npm run dev
```

## ビルド（GitHub Pages 用）

```bash
npm run build
```

`docs/` ディレクトリに静的ファイルが出力されます。`main` ブランチへの push で GitHub Actions により自動デプロイされます。

## 要件

- WebAssembly SIMD 対応ブラウザ（Chrome / Edge / Safari 最新版）
- 大きな画像（8K パノラマ等）はメモリとエンコード時間に注意

## ライセンス

MIT
