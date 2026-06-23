/* eslint-env serviceworker */
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAJIuiHFAz3lhUHa5vbNVwyV1bJTZJkY3g",
  authDomain: "charistaryogurt.firebaseapp.com",
  projectId: "charistaryogurt",
  storageBucket: "charistaryogurt.firebasestorage.app",
  messagingSenderId: "874957111997",
  appId: "1:874957111997:web:8e6a701bd6422dbe8eedd4"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title || 'Charistar Yogurt';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new update about your order.',
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
