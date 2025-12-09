# PWA（Progressive Web App）セットアップガイド

このドキュメントでは、このサイトをPWA対応にするための設定内容と、動作確認方法を説明します。

## 追加されたファイル

### 1. PWA関連設定ファイル

- **manifest.json** - PWAのマニフェストファイル（アプリ名、アイコン、表示設定など）
- **service-worker.js** - Service Worker（PWAの基本要件）
- **pwa-register.js** - Service Worker登録スクリプト

### 2. アイコン画像ファイル

以下のアイコンファイルが必要です（現在は仮でlogo.pngをコピーしています）：

- **icon-192.png** (192x192px) - Android用PWAアイコン
- **icon-512.png** (512x512px) - Android用PWAアイコン（高解像度）
- **apple-touch-icon.png** (180x180px推奨) - iOS用ホーム画面アイコン

#### アイコン画像の作成方法

1. 既存の `logo.png` を元に、以下のサイズのPNG画像を作成してください：
   - 192x192px → `icon-192.png`
   - 512x512px → `icon-512.png`
   - 180x180px → `apple-touch-icon.png`

2. オンラインツールを使用する場合：
   - [Favicon Generator](https://realfavicongenerator.net/)
   - [PWA Asset Generator](https://progressier.com/pwa-icons-and-ios-splash-screen-generator)

3. 作成した画像ファイルをルートディレクトリに配置してください

## 変更されたファイル

### HTMLファイル（index.html, song.html, notices.html）

各HTMLファイルの `<head>` タグ内に以下を追加：

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#E8C2D8" />

<!-- iOS PWA Support -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="セルフラブ協会" />
```

各HTMLファイルの `</body>` 閉じタグ前に以下を追加：

```html
<!-- PWA Service Worker Registration -->
<script src="/pwa-register.js"></script>
```

## カスタマイズ可能な設定

### manifest.json

アプリ名やテーマカラーを変更したい場合は、`manifest.json` を編集してください：

```json
{
  "name": "セルフラブ協会 会員証",           // ← アプリ名（フル）
  "short_name": "セルフラブ協会",           // ← アプリ名（短縮版）
  "description": "一般社団法人セルフラブ協会の会員証アプリ",
  "theme_color": "#E8C2D8",               // ← テーマカラー
  "background_color": "#ffffff",          // ← 背景色
  // ...
}
```

### HTML内のapple-mobile-web-app-title

各HTMLファイルの以下の部分を変更できます：

```html
<meta name="apple-mobile-web-app-title" content="セルフラブ協会" />
<!-- ↑ iOSホーム画面でのアプリ名 -->
```

## 動作確認方法

### Android (Chrome) での確認

1. **Chrome DevTools での確認**
   ```
   1. Chromeでサイトを開く
   2. F12でDevToolsを開く
   3. 「Application」タブ → 「Manifest」を選択
   4. マニフェストが正しく読み込まれているか確認
   5. 「Service Workers」セクションでService Workerが登録されているか確認
   ```

2. **実機での確認**
   ```
   1. Android端末のChromeでサイトを開く
   2. 右上のメニュー（⋮）をタップ
   3. 「アプリをインストール」または「ホーム画面に追加」が表示される
   4. タップしてインストール
   5. ホーム画面にアイコンが追加される
   6. アイコンをタップして起動
   7. フルスクリーン（standalone）で表示される
   ```

3. **確認ポイント**
   - アドレスバーが非表示になっている
   - アプリのように動作している
   - アイコンが正しく表示されている

### iOS (Safari) での確認

1. **実機での確認**
   ```
   1. iPhone/iPadのSafariでサイトを開く
   2. 画面下部の「共有」ボタン（□↑）をタップ
   3. 「ホーム画面に追加」を選択
   4. アプリ名とアイコンを確認
   5. 「追加」をタップ
   6. ホーム画面にアイコンが追加される
   7. アイコンをタップして起動
   ```

2. **確認ポイント**
   - アドレスバーが非表示になっている
   - ステータスバーが表示されている
   - アイコンが正しく表示されている
   - アプリ名が「セルフラブ協会」と表示されている

### デスクトップ (Chrome) での確認

1. **PWAインストール**
   ```
   1. Chrome（デスクトップ版）でサイトを開く
   2. アドレスバー右側の「インストール」アイコンをクリック
   3. 「インストール」をクリック
   4. デスクトップにショートカットが作成される
   5. 独立したウィンドウでアプリが起動する
   ```

## トラブルシューティング

### インストールボタンが表示されない場合

1. **HTTPSが有効か確認**
   - PWAはHTTPS環境が必須です
   - localhost では HTTP でも動作します

2. **manifest.json が正しく読み込まれているか確認**
   - DevToolsの「Application」→「Manifest」で確認

3. **Service Worker が登録されているか確認**
   - DevToolsの「Application」→「Service Workers」で確認

4. **アイコン画像が存在するか確認**
   - icon-192.png, icon-512.png が存在し、アクセス可能か確認

### iOS でアイコンが表示されない場合

1. **apple-touch-icon.png が存在するか確認**
   - 180x180px の画像が推奨されます

2. **キャッシュをクリア**
   - Safari の設定 → 履歴とWebサイトデータを消去

## 参考リンク

- [PWA Documentation (MDN)](https://developer.mozilla.org/ja/docs/Web/Progressive_web_apps)
- [Web App Manifest (MDN)](https://developer.mozilla.org/ja/docs/Web/Manifest)
- [Service Worker API (MDN)](https://developer.mozilla.org/ja/docs/Web/API/Service_Worker_API)
