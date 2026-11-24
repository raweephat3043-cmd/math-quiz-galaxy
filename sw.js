
const CACHE_NAME = "math-quiz-galaxy-v2";

const GAME_FILE = "./math_quiz_game_galaxy.html";

const FILES_TO_CACHE = [
  GAME_FILE,
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// ติดตั้งเวอร์ชันใหม่
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// เปิดใช้งานและล้าง Cache เวอร์ชันเก่า
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith("math-quiz-galaxy-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// โหลดหน้าเกมและไฟล์ต่าง ๆ
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // ไม่จัดการเว็บไซต์ภายนอก
  if (url.origin !== self.location.origin) return;

  // โหลดหน้าเกม: พยายามโหลดออนไลน์ก่อน
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(GAME_FILE, copy));

          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(GAME_FILE);
          return cached || Response.error();
        })
    );
    return;
  }

  // ไฟล์อื่น: Cache ก่อน ถ้าไม่มีจึงโหลดออนไลน์
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy));
        }

        return response;
      });
    })
  );
});
