const CACHE_NAME = "medtracker-v3"
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
  "/alarm-sound.mp3",
  "/success-sound.mp3",
]

// Install event
self.addEventListener("install", (event) => {
  console.log('Service Worker installing.')
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
  console.log('Service Worker activating.')
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

// Store for pending reminders
const pendingReminders = new Map()

// Push notification event
self.addEventListener("push", (event) => {
  console.log('Push notification received:', event)
  
  let notificationData = {
    title: "MedTracker Reminder",
    body: "Time to take your medicine!",
    medicineName: "",
    dosage: "",
    scheduleId: "",
    medicineId: ""
  }
  
  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        ...notificationData,
        ...data
      }
    } catch (e) {
      // If not JSON, use as text
      notificationData.body = event.data.text()
    }
  }
  
  // Store the reminder data for later use
  if (notificationData.scheduleId) {
    pendingReminders.set(notificationData.scheduleId, notificationData)
  }
  
  const options = {
    body: notificationData.body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200, 200, 100, 400],
    tag: notificationData.scheduleId || 'medicine-reminder',
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      ...notificationData,
      dateOfArrival: Date.now(),
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

  // Play sound with the notification
  self.registration.showNotification(notificationData.title, options)
  
  // Attempt to play sound
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      if (clients.length === 0) {
        // If no clients are open, we can't play sound directly
        // The notification will have to rely on the device's notification sound
        return
      }
      
      // Send message to client to play sound
      clients.forEach(client => {
        client.postMessage({
          type: 'PLAY_ALARM_SOUND'
        })
      })
    })
  )
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log('Notification clicked:', event)
  
  const notification = event.notification
  const action = event.action
  const notificationData = notification.data || {}
  
  notification.close()
  
  let promise
  
  if (action === "taken") {
    // Handle "taken" action
    promise = handleMedicineTaken(notificationData)
  } else if (action === "snooze") {
    // Handle "snooze" action
    promise = handleMedicineSnooze(notificationData)
  } else {
    // Default action - open the app
    promise = self.clients.openWindow("/")
  }
  
  event.waitUntil(promise)
})

// Function to handle medicine taken action
async function handleMedicineTaken(data) {
  try {
    // First try to find an existing window client
    const clients = await self.clients.matchAll({ type: 'window' })
    
    if (clients.length > 0) {
      // Send message to client to mark medicine as taken
      clients[0].postMessage({
        type: 'MEDICINE_TAKEN',
        scheduleId: data.scheduleId,
        medicineId: data.medicineId
      })
      
      // Focus the client
      await clients[0].focus()
      return
    }
    
    // If no client is open, open a new window
    await self.clients.openWindow(`/?action=taken&scheduleId=${data.scheduleId}`)
  } catch (error) {
    console.error('Error handling medicine taken:', error)
    // Fallback to just opening the app
    return self.clients.openWindow('/')
  }
}

// Function to handle medicine snooze action
async function handleMedicineSnooze(data) {
  // Schedule a new notification after 30 seconds
  const snoozeTime = 30 * 1000 // 30 seconds
  
  setTimeout(() => {
    const options = {
      body: `Reminder: Time to take ${data.medicineName} ${data.dosage}`,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      vibrate: [200, 100, 200, 200, 100, 400],
      tag: data.scheduleId || 'medicine-reminder-snoozed',
      renotify: true,
      requireInteraction: true,
      silent: false,
      data: data,
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
    
    self.registration.showNotification("Snoozed Reminder", options)
    
    // Also try to play sound
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PLAY_ALARM_SOUND'
        })
      })
    })
  }, snoozeTime)
  
  try {
    // Try to find an existing window client to inform about the snooze
    const clients = await self.clients.matchAll({ type: 'window' })
    
    if (clients.length > 0) {
      // Send message to client about the snooze
      clients[0].postMessage({
        type: 'MEDICINE_SNOOZED',
        scheduleId: data.scheduleId,
        medicineId: data.medicineId,
        snoozeTime: snoozeTime
      })
      
      await clients[0].focus()
      return
    }
  } catch (error) {
    console.error('Error handling medicine snooze:', error)
  }
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  console.log('Message received in SW:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
