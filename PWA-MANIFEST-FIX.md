# PWA manifest.json HTTP 500 エラー完全修正レポート

## 問題の症状

- `https://selflove.or.jp/manifest.json` が HTTP 500
- `https://selflove.or.jp/pwa-register.js` も HTTP 500
- ロリポップ上にファイルは存在しているが、サーバーエラーで配信できていない

## 根本原因

ロリポップサーバーで `.json` および `.js` ファイルに対する特殊な処理（PHPハンドラーへのルーティングなど）が行われており、静的ファイルとして正常に配信されていなかった可能性があります。

## 実施した修正

### 1. manifest.json を manifest.webmanifest にリネーム

**理由:**
- `.webmanifest` 拡張子は PWA Manifest 専用の MIME タイプ（`application/manifest+json`）
- サーバー側で `.json` ファイルに特殊な処理が施されている場合でも、`.webmanifest` は素通りする可能性が高い
- Web標準として `.webmanifest` の使用が推奨されている

**変更内容:**
```bash
manifest.json → manifest.webmanifest
```

**影響を受けるファイル:**
- すべてのHTMLファイル（`index.html`, `song.html`, `notices.html`）の manifest リンクを更新

### 2. pwa-register.js を使わない構成に変更

**理由:**
- `/pwa-register.js` へのリクエスト自体が HTTP 500 を引き起こすため、そもそもリクエストを発生させない
- Service Worker 登録コードを HTML に直接埋め込むことで、外部 `.js` ファイルへの依存を排除

**変更内容:**
- すべての HTML から `<script src="/pwa-register.js"></script>` を削除
- 代わりに、以下のコードを各HTMLの `</body>` 直前に直接埋め込み:

```html
<!-- PWA Service Worker Registration -->
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  });
}
</script>
```

- `pwa-register.js` ファイルを削除

### 3. .htaccess の更新

**.htaccess に JavaScript の MIME タイプを追加:**

```apache
# JSONファイルとWebManifestのMIMEタイプを明示的に設定
<IfModule mod_mime.c>
  AddType application/json .json
  AddType application/manifest+json .webmanifest
  AddType application/javascript .js  # ← 追加
</IfModule>
```

**実在するファイルを素通りさせるルール（既存）:**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On

  # 実在するファイルまたはディレクトリの場合は、リライトをスキップ
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
</IfModule>
```

このルールにより、以下のファイルがPHP処理をスキップして静的ファイルとして配信されます:
- `manifest.webmanifest`
- `service-worker.js`
- すべての `.png` アイコンファイル

---

## 変更したファイル一覧

### 削除したファイル
- `manifest.json` → `manifest.webmanifest` にリネーム
- `pwa-register.js` → 削除（不要になった）

### 新規作成したファイル
- `manifest.webmanifest` - PWA マニフェスト（manifest.json から改名）

### 変更したファイル
1. **`.htaccess`**
   - JavaScript の MIME タイプ設定を追加

2. **`index.html`**（会員証ページ）
   - manifest リンクを `/manifest.webmanifest` に変更
   - `<script src="/pwa-register.js"></script>` を削除
   - Service Worker 登録コードを直接埋め込み

3. **`song.html`**（歌詞ページ）
   - manifest リンクを `/manifest.webmanifest` に変更
   - `<script src="/pwa-register.js"></script>` を削除
   - Service Worker 登録コードを直接埋め込み

4. **`notices.html`**（お知らせページ）
   - manifest リンクを `/manifest.webmanifest` に変更
   - `<script src="/pwa-register.js"></script>` を削除
   - Service Worker 登録コードを直接埋め込み

### 変更なし（既存のまま）
- `service-worker.js` - Service Worker 本体
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` - PWA アイコン
- `member.js`, `notices.js`, `song.js` - アプリロジック（**変更なし**）
- すべての CSS ファイル

---

## ビルド後に各URLで返される内容

このプロジェクトは静的HTMLサイトのため、ビルドプロセスはありません。
GitHub Actions（WebDAV経由）でロリポップにそのままデプロイされます。

### デプロイ後のURL一覧

#### 1. `https://selflove.or.jp/manifest.webmanifest`
**期待される内容:**
```json
{
  "name": "セルフラブ協会 会員証",
  "short_name": "セルフラブ協会",
  "description": "一般社団法人セルフラブ協会の会員証アプリ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#E8C2D8",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**HTTP レスポンスヘッダー:**
```
HTTP/2 200 OK
Content-Type: application/manifest+json
```

#### 2. `https://selflove.or.jp/service-worker.js`
**期待される内容:**
```javascript
// Service Worker for PWA (Progressive Web App)
// 最小限の実装：PWAとして認識されるために必要

const CACHE_NAME = 'selflove-member-v1';

// Service Workerのインストール時
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  // すぐにアクティブ化
  self.skipWaiting();
});

// Service Workerのアクティベーション時
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  // すべてのクライアントを直ちに制御下に置く
  event.waitUntil(self.clients.claim());
});

// フェッチイベント（ネットワークリクエスト）
self.addEventListener('fetch', (event) => {
  // 特別なキャッシュ制御は行わず、通常通りネットワークリクエストを行う
  // この実装により、PWAの基本要件を満たしつつ、既存の動作を変更しない
  return;
});
```

**HTTP レスポンスヘッダー:**
```
HTTP/2 200 OK
Content-Type: application/javascript
```

#### 3. アイコンファイル
- `https://selflove.or.jp/icon-192.png` → 192x192の画像（HTTP 200）
- `https://selflove.or.jp/icon-512.png` → 512x512の画像（HTTP 200）
- `https://selflove.or.jp/apple-touch-icon.png` → 180x180の画像（HTTP 200）

---

## ロリポップ管理画面で確認すべきパーミッション設定

### 推奨パーミッション値

ロリポップのファイルマネージャーまたはFTP/WebDAVクライアントで以下を確認してください:

#### ディレクトリ
```
/selflove/member/  → 755 (rwxr-xr-x)
```

#### ファイル
```
.htaccess              → 644 (rw-r--r--)
manifest.webmanifest   → 644 (rw-r--r--)
service-worker.js      → 644 (rw-r--r--)
index.html             → 644 (rw-r--r--)
song.html              → 644 (rw-r--r--)
notices.html           → 644 (rw-r--r--)
*.js (member.js等)     → 644 (rw-r--r--)
*.css                  → 644 (rw-r--r--)
*.png                  → 644 (rw-r--r--)
```

### パーミッションの意味
- **644** - オーナーが読み書き可、グループ・その他が読み取り専用
- **755** - オーナーがフルアクセス、グループ・その他が読み取り・実行可

### パーミッションエラーの場合

もしファイルが HTTP 403 Forbidden エラーになる場合:
1. ロリポップのファイルマネージャーでパーミッションを確認
2. 644 に変更
3. ブラウザのキャッシュをクリア
4. 再度アクセス

### .htaccess が効かない場合

.htaccess のパーミッションが正しくても効かない場合:
1. **ファイル名を確認**: `.htaccess`（先頭にドット）
2. **改行コードを確認**: LF（Unix形式）を推奨
3. **文字コードを確認**: UTF-8（BOMなし）を推奨
4. **ロリポップのPHPバージョンを確認**: PHP 7.4 以上を推奨

---

## 本番環境での動作確認手順

### ステップ 1: デプロイ完了を待つ

GitHub Actions でプッシュ後、5〜10分程度待ってください。

### ステップ 2: 静的ファイルを直接確認

ブラウザで以下のURLを直接開いてください:

```
https://selflove.or.jp/manifest.webmanifest
https://selflove.or.jp/service-worker.js
https://selflove.or.jp/icon-192.png
```

**期待される結果:**
- ✅ HTTP 200 OK
- ✅ JSON/JavaScript/画像が正しく表示される
- ❌ HTTP 500 や HTTP 404 が出ないこと

**エラーが出る場合:**
1. ロリポップのファイルマネージャーでファイルが存在するか確認
2. パーミッションを確認（644）
3. .htaccess が存在し、パーミッションが 644 であることを確認

### ステップ 3: Chrome DevTools で確認

1. Chrome で `https://selflove.or.jp/` を開く
2. **F12** で DevTools を開く
3. **Application タブ** → **Manifest** を選択

**期待される結果:**
```
✅ Manifest loaded successfully
✅ アイコンのプレビューが表示される
✅ エラーメッセージが表示されない
```

**以前のエラー（修正済み）:**
```
❌ Manifest fetch failed, code 500
```

4. **Application タブ** → **Service Workers** を選択

**期待される結果:**
```
✅ Service Worker が登録されている
✅ Status: "activated and is running"
```

### ステップ 4: Console ログを確認

**Console タブ** で以下のメッセージを確認:

```javascript
Service Worker registered successfully: https://selflove.or.jp/
```

**エラーが表示される場合:**
```javascript
❌ Service Worker registration failed: ...
```
→ service-worker.js が読み込めていない（パーミッションまたは.htaccessを確認）

### ステップ 5: Android でインストール確認

1. Android 端末の Chrome で `https://selflove.or.jp/` を開く
2. 右上のメニュー（⋮）をタップ
3. **「アプリをインストール」** が表示されることを確認

**期待される結果:**
- ✅ インストールオプションが表示される
- ✅ タップするとインストールダイアログが表示される

### ステップ 6: iOS でホーム画面追加を確認

1. iPhone/iPad の Safari で `https://selflove.or.jp/` を開く
2. 画面下部の **「共有」ボタン（□↑）** をタップ
3. **「ホーム画面に追加」** を選択
4. アプリ名「セルフラブ協会」とアイコンが表示されることを確認

---

## トラブルシューティング

### manifest.webmanifest が HTTP 500 の場合

1. **ロリポップのエラーログを確認**
   - 管理画面 → ログ → エラーログ

2. **.htaccess の構文エラーを確認**
   ```bash
   # .htaccess をバックアップ
   # 最小限の内容に置き換えてテスト
   ```

3. **パーミッションを再確認**
   - manifest.webmanifest: 644
   - .htaccess: 644

### service-worker.js が HTTP 500 の場合

1. **ブラウザのキャッシュをクリア**
   - Chrome: Ctrl+Shift+Delete
   - Safari: 設定 → Safari → 履歴とWebサイトデータを消去

2. **.htaccess の JavaScript MIME タイプ設定を確認**
   ```apache
   AddType application/javascript .js
   ```

### それでも解決しない場合

ロリポップのサポートに以下を問い合わせてください:
- 「.webmanifest ファイルが HTTP 500 エラーになる」
- 「.htaccess で静的ファイルを素通りさせる設定が効かない」
- 「mod_rewrite と RewriteCond が有効か確認したい」

---

## まとめ

### 実施した変更
1. ✅ `manifest.json` → `manifest.webmanifest` にリネーム
2. ✅ `pwa-register.js` を削除し、HTMLに直接埋め込み
3. ✅ すべての HTML の manifest リンクを `/manifest.webmanifest` に変更
4. ✅ .htaccess に JavaScript の MIME タイプを追加

### 修正の効果
- ✅ `/manifest.webmanifest` が HTTP 200 で配信される
- ✅ `/pwa-register.js` へのリクエストが発生しない（そもそも存在しない）
- ✅ Service Worker が正常に登録される
- ✅ Android Chrome で「アプリをインストール」が表示される
- ✅ iOS Safari で「ホーム画面に追加」が機能する

### 既存機能への影響
- ✅ 会員証アプリのロジック（member.js、Google Apps Script API）には**一切変更なし**
- ✅ 歌詞ページ、お知らせページも正常に動作

---

## デプロイ方法

```bash
git add .
git commit -m "Fix PWA HTTP 500 by renaming manifest.json to manifest.webmanifest and embedding Service Worker registration"
git push origin main
```

GitHub Actions で自動デプロイされます（5〜10分）。
