import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SEARX_INSTANCES = [
  "https://searx.be",
  "https://search.mdosch.de",
  "https://searx.tiekoetter.com",
  "https://searx.fmac.xyz",
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const page = url.searchParams.get("page") ?? "1";
    const safe = url.searchParams.get("safe") === "active" ? "1" : "0";

    if (!q.trim()) {
      return new Response(JSON.stringify({ error: "검색어를 입력하세요." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let lastError = "";

    for (const instance of SEARX_INSTANCES) {
      try {
        const searchParams = new URLSearchParams({
          q: q.trim(),
          format: "json",
          language: "ko-KR",
          locale: "ko",
          safesearch: safe,
          pageno: page,
          categories: "general",
          time_range: "",
        });

        const resp = await fetch(`${instance}/search?${searchParams.toString()}`, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
            "Accept-Language": "ko-KR,ko;q=0.9",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!resp.ok) {
          lastError = `${instance}: HTTP ${resp.status}`;
          continue;
        }

        const data = await resp.json();

        const results = (data.results ?? []).slice(0, 10).map((r: Record<string, unknown>) => ({
          title: r.title ?? "",
          url: r.url ?? "",
          displayUrl: (() => {
            try { return new URL(String(r.url ?? "")).hostname; } catch { return String(r.url ?? ""); }
          })(),
          desc: r.content ?? r.description ?? "",
          score: r.score ?? 0,
        }));

        return new Response(
          JSON.stringify({
            success: true,
            query: q,
            results,
            total: data.number_of_results ?? results.length,
            instance,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        lastError = `${instance}: ${e}`;
        continue;
      }
    }

    return new Response(
      JSON.stringify({ error: "모든 검색 서버에 연결 실패", detail: lastError }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
