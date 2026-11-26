
const CACHE_NAME = "math-quiz-galaxy-v5";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./math_quiz_game_galaxy.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const GAME_FILE = "./math_quiz_game_galaxy.html";

// ติดตั้งและเก็บไฟล์พื้นฐาน
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// เปิดใช้งานเวอร์ชันใหม่และล้าง Cache รุ่นเก่า
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith("math-quiz-galaxy-") &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// จัดการการโหลดหน้าเว็บและไฟล์
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // ไม่จัดการเว็บไซต์ภายนอก
  if (url.origin !== self.location.origin) return;

  // หน้าเว็บ: ออนไลน์ก่อน หากไม่มีอินเทอร์เน็ตใช้ Cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy));
          }

          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);

          if (cached) return cached;

          const game = await caches.match(GAME_FILE);

          if (game) return game;

          return Response.error();
        })
    );

    return;
  }

  // ไฟล์ทั่วไป: Cache ก่อน หากไม่มีจึงโหลดออนไลน์
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;

        return fetch(request)
          .then(response => {
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
