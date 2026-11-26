
const CACHE_NAME = "math-quiz-galaxy-v8";

const CORE_FILES = [
  "./index.html",
  "./math_quiz_game_galaxy.html"
];

const OPTIONAL_FILES = [
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

const GAME_FILE = "./math_quiz_game_galaxy.html";
const INDEX_FILE = "./index.html";

// ติดตั้ง Cache รุ่นใหม่
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // ไฟล์หลักต้องมีอยู่จริง
      await cache.addAll(CORE_FILES);

      // ไฟล์เสริม ถ้าไม่มีจะไม่ทำให้การติดตั้งล้มเหลว
      await Promise.all(
        OPTIONAL_FILES.map(file =>
          cache.add(file).catch(error => {
            console.warn("ไม่สามารถเก็บไฟล์:", file, error);
          })
        )
      );

      await self.skipWaiting();
    })
  );
});

// เปิดใช้งานและลบ Cache รุ่นเก่า
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      await Promise.all(
        keys
          .filter(key =>
            key.startsWith("math-quiz-galaxy-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })
  );
});

// จัดการการโหลดไฟล์
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // หน้าเว็บ: โหลดออนไลน์ก่อน
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async response => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }

          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);

          return (
            await cache.match(request) ||
            await cache.match(INDEX_FILE) ||
            await cache.match(GAME_FILE) ||
            Response.error()
          );
        })
    );

    return;
  }

  // ไฟล์ทั่วไป: ใช้ Cache ก่อน
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request);

      if (cached) return cached;

      try {
        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        return Response.error();
      }
    })
  );
});
