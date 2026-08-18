const CACHE = 'xinyitian-v0.21.8';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './scenes.css',
  './jianghu-nav.css',
  './assets/original/hero-bg.jpg',
  './assets/original/jianghu-bg.jpg',
  './assets/original/icon-gems.png',
  './assets/original/icon-copper.png',
  './assets/original/icon-stamina.png',
  './assets/original/figure-player.webp',
  './assets/original/figure-wuji.webp',
  './assets/original/figure-zhangsanfeng.webp',
  './assets/original/formation-bg.webp',
  './assets/original/kungfu-bg.webp',
  './assets/original/challenge-bg.webp',
  './manifest.webmanifest',
  './src/data.js',
  './src/levelstats.js',
  './src/state.js',
  './src/story.js',
  './src/battle.js',
  './src/meridians.js',
  './src/kungfu.js',
  './src/innerpower.js',
  './src/ancienttomb.js',
  './src/awakening.js',
  './src/wudao.js',
  './src/tasks.js',
  './src/power.js',
  './src/vip.js',
  './src/weapons.js',
  './src/app.js',
  './src/jianghu-nav.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html')))
  );
});