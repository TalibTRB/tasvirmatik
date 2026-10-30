const CACHE_NAME = 'tasvirmatik-offline-v27';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// 1. KURULUM: Uygulama ilk açıldığında temel dosyaları telefonun hafızasına (Cache) kazı
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. TEMİZLİK: Eğer ileride CACHE_NAME'i v2 yaparsan, eski önbelleği siler (Hafıza şişmez)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. ÇEVRİMDIŞI MOTORU: İnternet kopsa bile her şeyi hafızadan getir
self.addEventListener('fetch', (event) => {
  // Sadece sayfa ve dosya getirme (GET) isteklerine karış
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Eğer dosya (veya font) önbellekte varsa, interneti hiç yormadan direkt hafızadan ver
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Eğer önbellekte yoksa internetten çek
      return fetch(event.request).then((networkResponse) => {
        // Geçerli bir yanıt değilse (örneğin 404 hatası) dokunma
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }
        
        // Gelen yeni dosyayı (örn: Google Fontu) klonla ve bir dahaki sefere offline çalışması için hafızaya at
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // Hem hafızada yok hem internet yoksa sessizce bekle (Sayfa zaten çökmeyecektir)
      });
    })
  );
});
