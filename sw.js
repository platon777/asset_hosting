// Nom du cache dynamique (changer le numéro pour forcer une mise à jour globale)
const CACHE_NAME = 'dynamic-cache-v8';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting(); // Active immédiatement le SW
});

// Activation du Service Worker (supprime les anciens caches)
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l'ancien cache :', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Prend immédiatement le contrôle des clients
});

// Gestion des requêtes réseau avec vérification explicite
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Vérifier si la requête concerne un fichier CSS ou JavaScript
  if (requestUrl.pathname.endsWith('.css') || requestUrl.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' }) // Toujours récupérer les fichiers CSS et JS depuis le réseau
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            // Si la réponse est valide, mettre à jour le cache
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              console.log('Mise à jour forcée du cache pour :', event.request.url);
            });
          }
          return networkResponse; // Retourne la réponse réseau
        })
        .catch(() => {
          console.log('Ressource non disponible hors ligne :', event.request.url);
          return caches.match(event.request); // Retourne la version en cache si disponible
        })
    );
  } else {
    // Pour les autres ressources, utiliser la stratégie de cache habituelle
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('Retour depuis le cache pour :', event.request.url);
          return cachedResponse;
        }
        
        return fetch(event.request, { cache: 'no-cache' })
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
                console.log('Mise à jour forcée du cache pour :', event.request.url);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            console.log('Ressource non disponible hors ligne :', event.request.url);
            return new Response('', { status: 200 });
          });
      })
    );
  }
});
