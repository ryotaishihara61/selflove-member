# PWA HTTP 500 エラー修正レポート

## 問題の原因

`https://selflove.or.jp/manifest.json` および `https://selflove.or.jp/pwa-register.js` にアクセスすると HTTP 500 エラーが発生していました。

**推定される原因:**
- サーバー側（ロリポップ）でリライトルールが設定されており、`.json` や `.js` ファイルへのリクエストがPHPなどのスクリプトに転送されていた可能性
- 実在する静的ファイルを素通りさせる設定が不足していた

## 実施した修正

### 1. .htaccess ファイルの作成

**ファイルパス:** `.htaccess`（ルートディレクトリ直下）

**内容:**
```apache
# PWA対応：manifest.json、service-worker.js、pwa-register.jsなどの静的ファイルを素通りさせる

<IfModule mod_rewrite.c>
  RewriteEngine On

  # 実在するファイルまたはディレクトリの場合は、リライトをスキップ
  # これにより、.json, .js, .png などの静的ファイルがそのまま返される
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # その他のリライトルールがある場合はここに追加
  # 例：404ページへのリダイレクトなど
</IfModule>

# JSONファイルのMIMEタイプを明示的に設定
<IfModule mod_mime.c>
  AddType application/json .json
  AddType application/manifest+json .webmanifest
</IfModule>

# セキュリティヘッダー（オプション）
<IfModule mod_headers.c>
  # manifest.jsonにCORSヘッダーを設定（必要に応じて）
  <FilesMatch "\.(json|webmanifest)$">
    Header set Access-Control-Allow-Origin "*"
  </FilesMatch>
</IfModule>
```

**この設定の効果:**
1. `RewriteCond %{REQUEST_FILENAME} -f` - リクエストされたファイルが実在する場合
2. `RewriteCond %{REQUEST_FILENAME} -d` - リクエストされたディレクトリが実在する場合
3. `RewriteRule ^ - [L]` - リライトをスキップして、そのまま静的ファイルを返す

これにより、以下のファイルが正しく配信されます:
- `/manifest.json`
- `/pwa-register.js`
- `/service-worker.js`
- `/icon-192.png`
- `/icon-512.png`
- `/apple-touch-icon.png`

## 追加・変更したファイル一覧

### 新規作成
- **`.htaccess`** - サーバー設定ファイル（静的ファイルを素通りさせる）

### 既存ファイル（変更なし）
以下のファイルは既に正しい位置に配置されており、変更していません:
- `manifest.json` - PWAマニフェスト
- `pwa-register.js` - Service Worker登録スクリプト
- `service-worker.js` - Service Worker
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` - PWAアイコン
- `index.html`, `song.html`, `notices.html` - PWAタグを含むHTMLファイル

## デプロイ構成

### デプロイ方法
- **ホスティング:** ロリポップ（Lolipop）
- **デプロイツール:** GitHub Actions（WebDAV経由）
- **ワークフロー:** `.github/workflows/deploy-member.yml`
- **デプロイ先:** `/selflove/member`

### デプロイされるファイル
`local: "./"` の設定により、リポジトリのルートディレクトリ全体がデプロイされます。
以下のPWA関連ファイルすべてがデプロイ対象です:
- `.htaccess`
- `manifest.json`
- `pwa-register.js`
- `service-worker.js`
- `icon-192.png`
- `icon-512.png`
- `apple-touch-icon.png`

## ビルド後の出力パス

このプロジェクトは静的HTMLサイトのため、ビルドプロセスはありません。
すべてのファイルがそのままデプロイされます。

### 本番環境でのファイルパス
- `https://selflove.or.jp/manifest.json` ← manifest.json
- `https://selflove.or.jp/pwa-register.js` ← pwa-register.js
- `https://selflove.or.jp/service-worker.js` ← service-worker.js
- `https://selflove.or.jp/icon-192.png` ← icon-192.png
- `https://selflove.or.jp/icon-512.png` ← icon-512.png
- `https://selflove.or.jp/apple-touch-icon.png` ← apple-touch-icon.png

## 本番環境での動作確認手順

### 1. 静的ファイルが正しく配信されているか確認

#### ブラウザで直接アクセス
以下のURLをブラウザのアドレスバーに入力して、HTTP 500エラーが出ないことを確認してください:

```
https://selflove.or.jp/manifest.json
https://selflove.or.jp/pwa-register.js
https://selflove.or.jp/service-worker.js
https://selflove.or.jp/icon-192.png
https://selflove.or.jp/icon-512.png
https://selflove.or.jp/apple-touch-icon.png
```

**期待される結果:**
- `manifest.json` - JSON形式のテキストが表示される
- `pwa-register.js` - JavaScriptコードが表示される
- `service-worker.js` - JavaScriptコードが表示される
- `icon-*.png` - 画像が表示される

**エラーの場合:**
- HTTP 500 - サーバーエラー（.htaccessが正しく動作していない）
- HTTP 404 - ファイルが見つからない（デプロイされていない）

#### curlコマンドで確認（オプション）
```bash
curl -I https://selflove.or.jp/manifest.json
curl -I https://selflove.or.jp/pwa-register.js
```

**期待される結果:**
```
HTTP/2 200
content-type: application/json
```

### 2. Chrome DevTools で PWA 認識を確認

1. Chromeで `https://selflove.or.jp/` を開く
2. F12でDevToolsを開く
3. 「Application」タブをクリック
4. 左側メニューから「Manifest」を選択

**期待される結果:**
- マニフェストの内容が表示される
- エラーメッセージが表示されない
- アイコンのプレビューが表示される

**エラーの場合:**
- "Manifest fetch failed, code 500" - .htaccessが機能していない
- "Manifest: Line: 1, column: 1, Syntax error" - manifest.jsonの構文エラー

5. 左側メニューから「Service Workers」を選択

**期待される結果:**
- Service Workerが登録されている
- Status: "activated and is running" と表示される

### 3. Android (Chrome) でインストール可能か確認

1. Android端末のChromeで `https://selflove.or.jp/` を開く
2. 右上のメニュー（⋮）をタップ
3. 「アプリをインストール」または「ホーム画面に追加」が表示されることを確認

**期待される結果:**
- インストールオプションが表示される
- タップするとインストールダイアログが表示される

**表示されない場合:**
- manifest.json が正しく読み込まれていない
- Service Worker が登録されていない
- HTTPS接続に問題がある

### 4. iOS (Safari) でホーム画面追加を確認

1. iPhone/iPadのSafariで `https://selflove.or.jp/` を開く
2. 画面下部の「共有」ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. アプリ名「セルフラブ協会」とアイコンが表示されることを確認

### 5. コンソールログの確認

1. ChromeでDevToolsを開く
2. 「Console」タブを選択
3. 以下のメッセージが表示されることを確認:

```
Service Worker registered successfully: https://selflove.or.jp/
```

**エラーメッセージが表示される場合:**
```
Service Worker registration failed: TypeError: Failed to register a ServiceWorker
```
→ service-worker.js が読み込めていない

## トラブルシューティング

### .htaccess が機能しない場合

ロリポップでは、.htaccessが有効になっているはずですが、念のため以下を確認してください:

1. **ファイル名が正しいか確認**
   - `.htaccess`（先頭にドット）
   - 大文字小文字を区別します

2. **ファイルのパーミッションを確認**
   - パーミッション: 644 または 604

3. **ロリポップのPHPバージョンを確認**
   - 管理画面でPHPバージョンを確認
   - PHP 7.x 以上を推奨

4. **mod_rewrite が有効か確認**
   - ロリポップでは通常有効です
   - 無効の場合はサポートに問い合わせ

### それでも HTTP 500 が出る場合

`.htaccess` の内容を最小限にしてテスト:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]
</IfModule>
```

### キャッシュをクリア

ブラウザのキャッシュが古い可能性があります:

1. Chrome: Ctrl+Shift+Delete → キャッシュをクリア
2. Safari: 設定 → Safari → 履歴とWebサイトデータを消去

### サーバー側のログを確認

ロリポップの管理画面から、エラーログを確認してください:
- アクセスログ
- エラーログ

## コミット方法

```bash
git add .htaccess
git commit -m "Fix PWA HTTP 500 error by adding .htaccess for static file passthrough"
git push origin main
```

デプロイ後、5分程度待ってから動作確認を行ってください。

## 参考情報

- ロリポップ .htaccess リファレンス: https://lolipop.jp/manual/user/htaccess/
- PWA Manifest 仕様: https://developer.mozilla.org/ja/docs/Web/Manifest
- Service Worker API: https://developer.mozilla.org/ja/docs/Web/API/Service_Worker_API
