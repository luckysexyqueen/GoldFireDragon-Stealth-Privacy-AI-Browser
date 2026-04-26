export const config = { runtime: 'edge' };

const FIREDRAGON_UA = "Mozilla/9.0 (Windows NT 10.0; Win64; x64) Gecko/20100101 FireDragon/135.0 stealth privatebrowsing incognito windowedfullscreen/complate";
const JAPAN_IP = "109.123.230.28";

const ALLOWED = ["hitomi.la","toon.kor","toonkor","hiyobi.me","nhentai.net","pornhub.com","xvideos.com","xnxx.com","xhamster.com"];

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  try {
    const url = new URL(req.url);
    let target = url.searchParams.get("url");

    if (!target) return new Response("URL missing", { status: 400 });

    const targetUrl = new URL(target);
    if (!ALLOWED.some(d => targetUrl.hostname.includes(d))) {
      return new Response("Not allowed", { status: 403 });
    }

    const proxyReq = new Request(target, {
      method: req.method,
      headers: {
        ...Object.fromEntries(req.headers),
        "User-Agent": FIREDRAGON_UA,
        "Accept-Language": "ko-KR,ko;q=0.9",
        "X-Forwarded-For": JAPAN_IP,
        "Referer": targetUrl.origin,
      },
      body: req.body,
      redirect: "follow",
    });

    const resp = await fetch(proxyReq);
    return new Response(resp.body, {
      status: resp.status,
      headers: { "Access-Control-Allow-Origin": "*" }
    });
  } catch (e) {
    return new Response("Proxy Error", { status: 502 });
  }
}