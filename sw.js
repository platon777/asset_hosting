// Nom du cache (changer la version pour forcer une mise à jour)
const CACHE_NAME = 'dynamic-cache-v9';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting(); // Active immédiatement le Service Worker
});

// Activation du Service Worker (supprime les anciens caches)
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Suppression de l’ancien cache :', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Prend immédiatement le contrôle des pages
});

// Gestion des requêtes réseau avec stratégie "Cache First"
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Retour depuis le cache pour :', event.request.url);

        // Mettre à jour le cache en arrière-plan
        fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
                console.log('Mise à jour du cache pour :', event.request.url);
              });
            }
          })
          .catch((error) => {
            console.warn('Échec de la mise à jour réseau :', error);
          });

        return cachedResponse; // Retourne la version en cache
      }

      // Si la ressource n'est pas dans le cache, essaye le réseau
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          // Ajouter la ressource téléchargée au cache
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
            console.log('Ajout au cache de :', event.request.url);
          });

          return networkResponse; // Retourne la réponse réseau
        })
        .catch((error) => {
          console.error('Erreur réseau, aucune ressource disponible pour :', event.request.url, error);
        });
    })
  );
});
