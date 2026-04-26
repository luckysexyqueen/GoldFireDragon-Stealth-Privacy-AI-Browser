import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FIREDRAGON_UA = "Mozilla/9.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 FireDragon/135.0 stealth privatebrowsing incognito windowedfullscreen";
const JAPAN_IP = "109.123.230.28";

const ALLOWED = [
  "hitomi.la", "toon.kor", "toonkor", "hiyobi.me", "nhentai.net",
  "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com",
  "onlyfans.com", "chaturbate.com", "bongacams.com", "stripchat.com",
  "youporn.com", "redtube.com", "spankbang.com", "eporner.com"
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const url = new URL(req.url);
    let target = url.searchParams.get("url");

    if (!target) return new Response("URL missing", { status: 400 });

    const targetUrl = new URL(target);
    const hostname = targetUrl.hostname.toLowerCase();

    if (!ALLOWED.some(d => hostname.includes(d))) {
      return new Response("Not allowed", { status: 403 });
    }

    const proxyReq = new Request(target, {
      method: req.method,
      headers: {
        ...Object.fromEntries(req.headers),
        "User-Agent": FIREDRAGON_UA,
        "Accept-Language": "ko-KR,ko;q=0.9,ja;q=0.8",
        "X-Forwarded-For": JAPAN_IP,
        "X-Real-IP": JAPAN_IP,
        "Referer": targetUrl.origin,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Upgrade-Insecure-Requests": "1",
      },
      body: req.body,
      redirect: "follow",
    });

    const response = await fetch(proxyReq);

    // 무검열 강제 활성화 — 모든 검열 헤더 완전 제거
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    newHeaders.set("Access-Control-Allow-Headers", "*");

    // 검열 관련 모든 헤더 강제 무효화
    newHeaders.delete("Content-Security-Policy");
    newHeaders.delete("X-Frame-Options");
    newHeaders.delete("X-Content-Type-Options");
    newHeaders.delete("Strict-Transport-Security");
    newHeaders.delete("Referrer-Policy");
    newHeaders.delete("X-XSS-Protection");
    newHeaders.delete("Cross-Origin-Opener-Policy");
    newHeaders.delete("Cross-Origin-Embedder-Policy");
    newHeaders.delete("Cross-Origin-Resource-Policy");
    newHeaders.delete("Permissions-Policy");

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (e) {
    return new Response("Proxy Error", { status: 502 });
  }
});