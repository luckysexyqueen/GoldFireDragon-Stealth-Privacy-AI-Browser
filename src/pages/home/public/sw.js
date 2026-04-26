// GoldFireDragon PWA Service Worker v1.2
// Handles: asset caching, offline fallback, dynamic PWA icon generation (OffscreenCanvas)

const CACHE_NAME = 'goldfiredragon-pwa-v1';
const OFFLINE_URL = '/offline.html';
const ICON_CACHE = 'goldfiredragon-icons-v1';

// Core assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// ─────────────────────────────────────────────
// Icon generation via OffscreenCanvas
// Produces a branded GoldFireDragon PNG icon at any size
// ─────────────────────────────────────────────
async function generatePWAIcon(size, maskable) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const pad = maskable ? size * 0.1 : 0; // maskable icons need 10% safe zone

  // ── Background ──
  if (maskable) {
    // Full bleed dark background for maskable
    const bgGrad = ctx.createLinearGradient(0, 0, size, size);
    bgGrad.addColorStop(0, '#1c0a00');
    bgGrad.addColorStop(0.5, '#0f0800');
    bgGrad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);
  } else {
    // Rounded rect background
    const r = size * 0.2;
    const bgGrad = ctx.createLinearGradient(0, 0, size, size);
    bgGrad.addColorStop(0, '#1c0a00');
    bgGrad.addColorStop(1, '#0a0a0a');
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fillStyle = bgGrad;
    ctx.fill();
  }

  // ── Outer glow ring ──
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) * 0.6 - pad;

  const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.4);
  glowGrad.addColorStop(0, 'rgba(245,158,11,0.25)');
  glowGrad.addColorStop(0.5, 'rgba(239,68,68,0.12)');
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, size, size);

  // ── Main circle ──
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  const circleGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  circleGrad.addColorStop(0, '#fbbf24');
  circleGrad.addColorStop(0.45, '#f59e0b');
  circleGrad.addColorStop(1, '#dc2626');
  ctx.fillStyle = circleGrad;
  ctx.fill();

  // ── Inner flame shape (simplified polygon) ──
  const fw = radius * 0.55;
  const fh = radius * 0.7;
  const fx = cx;
  const fy = cy + radius * 0.12;

  ctx.beginPath();
  // Main flame body
  ctx.moveTo(fx, fy - fh);
  ctx.bezierCurveTo(fx + fw * 0.6, fy - fh * 0.7, fx + fw * 0.9, fy - fh * 0.3, fx + fw * 0.5, fy);
  ctx.bezierCurveTo(fx + fw * 0.9, fy - fh * 0.1, fx + fw * 0.6, fy + fh * 0.25, fx, fy + fh * 0.4);
  ctx.bezierCurveTo(fx - fw * 0.6, fy + fh * 0.25, fx - fw * 0.9, fy - fh * 0.1, fx - fw * 0.5, fy);
  ctx.bezierCurveTo(fx - fw * 0.9, fy - fh * 0.3, fx - fw * 0.6, fy - fh * 0.7, fx, fy - fh);
  ctx.closePath();

  const flameGrad = ctx.createLinearGradient(fx, fy - fh, fx, fy + fh * 0.4);
  flameGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
  flameGrad.addColorStop(0.3, 'rgba(255,237,180,0.9)');
  flameGrad.addColorStop(0.7, 'rgba(255,200,50,0.6)');
  flameGrad.addColorStop(1, 'rgba(255,150,0,0.0)');
  ctx.fillStyle = flameGrad;
  ctx.fill();

  // ── "G" letter watermark (tiny, subtle) ──
  if (size >= 96) {
    ctx.font = `bold ${radius * 0.52}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillText('G', cx, cy + radius * 0.05);
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return blob;
}

// ─────────────────────────────────────────────
// Screenshot generation (for App Store UI)
// ─────────────────────────────────────────────
async function generateScreenshot(width, height) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0a0a0a');
  bgGrad.addColorStop(0.5, '#0f0800');
  bgGrad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Glow
  const glow = ctx.createRadialGradient(width/2, height*0.35, 0, width/2, height*0.35, width*0.5);
  glow.addColorStop(0, 'rgba(245,158,11,0.15)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Logo circle
  const lx = width / 2;
  const ly = height * 0.32;
  const lr = Math.min(width, height) * 0.09;
  ctx.beginPath();
  ctx.arc(lx, ly, lr, 0, Math.PI * 2);
  const logoGrad = ctx.createLinearGradient(lx - lr, ly - lr, lx + lr, ly + lr);
  logoGrad.addColorStop(0, '#fbbf24');
  logoGrad.addColorStop(1, '#dc2626');
  ctx.fillStyle = logoGrad;
  ctx.fill();

  // Logo text
  const fontSize = lr * 0.95;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText('G', lx, ly + fontSize * 0.04);

  // Title
  const titleSize = Math.min(width, height) * 0.045;
  ctx.font = `bold ${titleSize}px Arial, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('GoldFireDragon', width/2, ly + lr + titleSize * 1.8);

  // Subtitle
  const subSize = titleSize * 0.55;
  ctx.font = `${subSize}px Arial, sans-serif`;
  ctx.fillStyle = '#888888';
  ctx.fillText('프라이버시 중심 스텔스 브라우저', width/2, ly + lr + titleSize * 1.8 + subSize * 2);

  // Search bar mock
  const sbY = height * 0.52;
  const sbW = width * 0.78;
  const sbH = Math.min(height * 0.065, 52);
  const sbX = (width - sbW) / 2;
  const sbR = sbH / 2;

  ctx.beginPath();
  ctx.moveTo(sbX + sbR, sbY);
  ctx.lineTo(sbX + sbW - sbR, sbY);
  ctx.quadraticCurveTo(sbX + sbW, sbY, sbX + sbW, sbY + sbR);
  ctx.lineTo(sbX + sbW, sbY + sbH - sbR);
  ctx.quadraticCurveTo(sbX + sbW, sbY + sbH, sbX + sbW - sbR, sbY + sbH);
  ctx.lineTo(sbX + sbR, sbY + sbH);
  ctx.quadraticCurveTo(sbX, sbY + sbH, sbX, sbY + sbH - sbR);
  ctx.lineTo(sbX, sbY + sbR);
  ctx.quadraticCurveTo(sbX, sbY, sbX + sbR, sbY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const searchFontSize = sbH * 0.4;
  ctx.font = `${searchFontSize}px Arial`;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('검색어를 입력하세요...', sbX + sbH * 0.6, sbY + sbH / 2);

  // Engine pills
  const engines = ['GoldFireDragon', 'Presearch', 'DDG', 'Brave'];
  const pillH = sbH * 0.62;
  const pillGap = sbW * 0.025;
  const pillFontSize = pillH * 0.52;
  ctx.font = `${pillFontSize}px Arial`;
  let pillX = sbX;
  engines.forEach((e, i) => {
    const pw = ctx.measureText(e).width + pillH * 0.9;
    const py = sbY + sbH + sbH * 0.35;
    const pr = pillH / 2;
    ctx.beginPath();
    ctx.moveTo(pillX + pr, py);
    ctx.lineTo(pillX + pw - pr, py);
    ctx.quadraticCurveTo(pillX + pw, py, pillX + pw, py + pr);
    ctx.lineTo(pillX + pw, py + pillH - pr);
    ctx.quadraticCurveTo(pillX + pw, py + pillH, pillX + pw - pr, py + pillH);
    ctx.lineTo(pillX + pr, py + pillH);
    ctx.quadraticCurveTo(pillX, py + pillH, pillX, py + pillH - pr);
    ctx.lineTo(pillX, py + pr);
    ctx.quadraticCurveTo(pillX, py, pillX + pr, py);
    ctx.closePath();
    ctx.fillStyle = i === 0 ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = i === 0 ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = i === 0 ? '#f59e0b' : '#666';
    ctx.font = `${pillFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e, pillX + pw / 2, py + pillH / 2);
    pillX += pw + pillGap;
  });

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return blob;
}

// ─────────────────────────────────────────────
// SW Lifecycle
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== ICON_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────
// Fetch Interception
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ① Intercept /pwa/icon-*.png → generate with OffscreenCanvas
  const iconMatch = url.pathname.match(/^\/pwa\/icon-(\d+)(\.png)$/);
  if (iconMatch) {
    const size = parseInt(iconMatch[1], 10);
    const maskable = size >= 144; // 144, 192, 512 are maskable
    event.respondWith(
      caches.open(ICON_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const blob = await generatePWAIcon(size, maskable);
          const response = new Response(blob, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
          cache.put(event.request, response.clone());
          return response;
        } catch (err) {
          return new Response('Icon generation failed', { status: 500 });
        }
      })
    );
    return;
  }

  // ② Intercept /pwa/screenshot-*.png → generate with OffscreenCanvas
  const ssMatch = url.pathname.match(/^\/pwa\/screenshot-(narrow|wide)\.png$/);
  if (ssMatch) {
    const isNarrow = ssMatch[1] === 'narrow';
    const w = isNarrow ? 390 : 1280;
    const h = isNarrow ? 844 : 800;
    event.respondWith(
      caches.open(ICON_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const blob = await generateScreenshot(w, h);
          const response = new Response(blob, {
            headers: {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
          cache.put(event.request, response.clone());
          return response;
        } catch (err) {
          return new Response('Screenshot generation failed', { status: 500 });
        }
      })
    );
    return;
  }

  // ③ Skip non-GET
  if (event.request.method !== 'GET') return;

  // ④ Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // ⑤ Navigation: Network-first → offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) => cached || caches.match(OFFLINE_URL)
          )
        )
    );
    return;
  }

  // ⑥ Static assets: Cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && !url.pathname.includes('supabase')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(OFFLINE_URL));
    })
  );
});

// ─────────────────────────────────────────────
// Push Notifications (future)
// ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'GoldFireDragon', {
      body: data.body || '',
      icon: '/pwa/icon-192.png',
      badge: '/pwa/icon-72.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
