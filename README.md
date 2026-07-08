# AVP Virtual Environment Maker

Blenderでレンダリングした360°パノラマ（等距円筒 / Equirectangular）TIFF画像を、**写真アプリがパノラマとして認識しやすい JPEG / HEIC** に変換するブラウザツールです。

[visionOS 27](https://www.apple.com/os/visionos/) では、パノラマ写真を空間シーンに変換し、カスタム **Environment（没入型背景）** として使えるようになります。このツールは、Blenderで作成したバーチャル空間をその機能で利用するためのものです。

**ライブデモ:** https://holomoto.github.io/AVP_virtuaEnvironment_Maker/

## 機能

- TIFF / PNG / JPEG のアップロード（ドラッグ＆ドロップ対応）
- **Blender TIFF向けの上下反転**（プレビューで確認可能、デフォルトON）
- **JPEG（推奨）** または HEIC で出力
- ブラウザ内完結（サーバーへのアップロードなし）
- `CustomRendered=6` と **GPano XMP** メタデータを自動埋め込み
- **iPhoneパノラマテンプレート**（任意）で MakerNotes をコピーし認識率を向上

## 埋め込まれるメタデータ

| タグ | 値 |
|------|-----|
| `EXIF:CustomRendered` | `6`（Panorama） |
| `EXIF:Make` | `Apple` |
| `EXIF:Model` | 選択した iPhone モデル |
| `GPano:UsePanoramaViewer` | `True` |
| `GPano:ProjectionType` | `equirectangular` |
| `GPano:FullPanoWidthPixels` | 画像幅 |
| `GPano:FullPanoHeightPixels` | 画像高さ |
| `GPano:CroppedAreaImageWidthPixels` | 画像幅 |
| `GPano:CroppedAreaImageHeightPixels` | 画像高さ |

## Blender での推奨設定

1. カメラの投影を **Panoramic → Equirectangular** に設定
2. 解像度は **2:1** のアスペクト比（例: 8192×4096, 4096×2048）
3. TIFF または PNG でレンダリング

## visionOS での使い方

1. **JPEG（推奨）** で変換し、AirDrop / iCloud 経由で Vision Pro または iPhone の写真アプリへ取り込む
2. 写真アプリで **横スワイプのパノラマ表示** になるか確認
3. visionOS 27: **空間シーンに変換** → **Environment として設定**

### パノラマとして認識されない場合（Mac + ExifTool）

iPhone で実際に撮影したパノラマ1枚（`template.heic`）がある場合、変換後のファイルにタグをコピーできます。

```bash
exiftool -overwrite_original -P \
  -TagsFromFile template.heic -MakerNotes -Make -Model -HostComputer \
  -CustomRendered=Panorama \
  -XMP-GPano:UsePanoramaViewer=True \
  -XMP-GPano:ProjectionType=equirectangular \
  your_panorama.jpg
```

その後、写真アプリへ再取り込みしてください。

## ローカル開発

```bash
npm install
npm run dev
```

## デプロイ（GitHub Pages）

公開URL: https://holomoto.github.io/AVP_virtuaEnvironment_Maker/

### GitHub Pages 設定

**方法A（推奨）:** Settings → Pages → Source: **Deploy from a branch** → Branch: `main` / Folder: **`/ (root)`**

ビルド時に `index.html` と `assets/` がリポジトリルートへ自動同期されます。

**方法B:** Branch: `main` / Folder: **`/docs`**

**方法C:** Branch: **`gh-pages`** / Folder: **`/ (root)`**（`main` push 時に Actions が自動デプロイ）

## ビルド

```bash
npm run build
```

`docs/` にビルド後、ルートの `index.html` / `assets/` へ同期されます。

## 要件

- WebAssembly SIMD 対応ブラウザ（Chrome / Edge / Safari 最新版）
- 大きな画像（8K パノラマ等）はメモリとエンコード時間に注意

## ライセンス

MIT
