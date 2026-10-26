const CACHE_NAME = 'tasvirmatik-v1.0.2'; // Kod güncellediğinizde bu versiyon numarasını artırın (örn: v1.0.3)

const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon.png'
];

// 1. Yeni Service Worker yüklendiğinde beklemeden anında aktif olsun
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// 2. Aktifleştiğinde eski önbelleklerin Hepsini silsin
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Açık sekmeleri anında yeni sürüme geçir
    );
});

// 3. Network-First Stratejisi: Önce güncel dosyayı internetten çek, başaramazsa önbellekten sun
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
