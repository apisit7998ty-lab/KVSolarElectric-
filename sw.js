// KV Solar Electric — Service Worker (เวอร์ชันเรียบง่าย ปลอดภัย)
// หน้าที่หลัก: ทำให้เว็บ "ติดตั้งลงหน้าจอ" ได้ (PWA installability requirement)
// และเก็บหน้า shell ไว้ใช้ตอนไม่มีเน็ตชั่วคราว — ไม่แคช API/ข้อมูล Supabase เด็ดขาด
// เพื่อให้ข้อมูลงาน/สถานะลูกค้าอัปเดตสดใหม่ทุกครั้งที่มีเน็ต

const CACHE_NAME = "kvsolar-shell-v1";
const SHELL_URL = "./";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(SHELL_URL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // จัดการแค่การเปิดหน้าเว็บหลัก (navigation) เท่านั้น
  // ปล่อยทุก request อื่น (Supabase, รูปภาพ, API) ให้วิ่งผ่าน network ตามปกติ ไม่แตะเลย
  if (req.mode !== "navigate") return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, res.clone())).catch(() => {});
        return res;
      })
      .catch(() => caches.match(SHELL_URL))
  );
});
