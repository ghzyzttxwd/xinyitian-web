// V0.23.6: 暂停离线资源代理。此前对任意失败 GET 回退 index.html，
// 会把 HTML 错当成 JS/CSS 返回，造成混合版本、按钮失效和页面回退。
// 当前 worker 只负责清理旧缓存，不再拦截 fetch。
const CACHE_PREFIX = 'xinyitian-';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
