// Firebase Cloud Messaging Service Worker
/* eslint-disable no-restricted-globals */
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize Firebase app in service worker
try {
  firebase.initializeApp({
    messagingSenderId: '231296455862',
    projectId: 'skilful-cipher-lggh3',
    appId: '1:231296455862:web:1ae1352f625d0b22118217',
    apiKey: 'AIzaSyA8nyAujNx4MAKNftCPq1Rhc9T8XDSVujA',
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'D-mart Order Update';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Your order status has changed.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: payload.data || {},
      tag: payload.data?.orderNumber || 'dmart-order',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Background messaging init skipped:', err);
}

// Handle notification click to open or focus the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
