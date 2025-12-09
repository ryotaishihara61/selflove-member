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
