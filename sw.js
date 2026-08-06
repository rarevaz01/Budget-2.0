importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDH7z9MvtNHUf0LGBf_aRRDBCU5ij5Cz3A",
  authDomain: "finansy-app-d298b.firebaseapp.com",
  projectId: "finansy-app-d298b",
  storageBucket: "finansy-app-d298b.firebasestorage.app",
  messagingSenderId: "1094409922442",
  appId: "1:1094409922442:web:a47726de701a83d4388a73"
});

// Shows the evening reminder (and any other data-only push) while the app
// isn't in the foreground. Pushes with a "notification" payload are shown
// automatically by the browser, so this only fires for data-only messages.
firebase.messaging().onBackgroundMessage((payload) => {
  const { title, body } = payload.data || {};
  if (!title) return;
  self.registration.showNotification(title, {
    body,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
  });
});

const CACHE_NAME = 'finansy-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './logic.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

// Only handle our own app-shell files. Firestore/Firebase requests go straight
// to the network untouched, so sync always uses live data when online.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
