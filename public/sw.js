const CACHE_NAME = "medtracker-v2"
const urlsToCache = [
  "/",
  "/add-medicine",
  "/medicines",
  "/contacts",
  "/history",
  "/settings",
  "/app/manifest.json",
  "/manifest.json", // Include both paths for compatibility
  "/icon-192x192.png",
  "/icon-512x512.png",
]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    }),
  )
})

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Push notification event
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Time to take your medicine!",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200, 200, 100, 400],
    sound: "/alarm-sound.mp3",
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "taken",
        title: "I took it",
        icon: "/icon-192x192.png",
      },
      {
        action: "snooze",
        title: "Remind me later",
        icon: "/icon-192x192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("MedTracker Reminder", options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "taken") {
    event.waitUntil(clients.openWindow("/"))
  } else if (event.action === "snooze") {
    event.waitUntil(clients.openWindow("/"))
  } else {
    event.waitUntil(clients.openWindow("/"))
  }
})
