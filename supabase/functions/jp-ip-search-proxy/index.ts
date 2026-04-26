import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const JP_SPOOF_IP = "109.123.230.28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const safe = url.searchParams.get("safe") ?? "off";
    const num = url.searchParams.get("num") ?? "10";

    if (!q.trim()) {
      return new Response(JSON.stringify({ error: "검색어가 없습니다." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 구글 검색 URL 구성
    const googleParams = new URLSearchParams({
      q: q.trim(),
      hl: "ko",
      gl: "jp",
      safe,
      pws: "0",
      nfpr: "1",
      cr: "countryJP",
      near: "Tokyo",
      num,
    });

    const googleUrl = `https://www.google.co.jp/search?${googleParams.toString()}`;

    // X-Forwarded-For 에 일본 IP 주입하여 구글에 요청
    const googleResp = await fetch(googleUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,ja;q=0.8,en;q=0.7",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "X-Forwarded-For": JP_SPOOF_IP,
        "X-Real-IP": JP_SPOOF_IP,
        "Referer": "https://www.google.co.jp/",
      },
      redirect: "follow",
    });

    // 검색 결과 URL (리다이렉트 후 최종 URL) 반환
    const finalUrl = googleResp.url || googleUrl;

    return new Response(
      JSON.stringify({
        success: true,
        spoof_ip: JP_SPOOF_IP,
        search_url: googleUrl,
        final_url: finalUrl,
        status: googleResp.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
