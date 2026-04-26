import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

async function searchDuckDuckGo(query: string, numResults: number = 10): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
    },
  });

  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const results: SearchResult[] = [];

  // Parse DuckDuckGo HTML results
  const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  let match;
  const titles: { url: string; title: string }[] = [];

  while ((match = resultRegex.exec(html)) !== null) {
    let resultUrl = match[1];
    // DuckDuckGo uses redirect URLs
    if (resultUrl.startsWith("//")) {
      resultUrl = "https:" + resultUrl;
    } else if (resultUrl.startsWith("/")) {
      resultUrl = "https://duckduckgo.com" + resultUrl;
    }

    const titleHtml = match[2];
    const title = titleHtml.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();

    titles.push({ url: resultUrl, title });
  }

  // Extract snippets
  const snippets: string[] = [];
  while ((match = snippetRegex.exec(html)) !== null) {
    const snippetHtml = match[1];
    const snippet = snippetHtml.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
    snippets.push(snippet);
  }

  // Combine titles and snippets
  for (let i = 0; i < Math.min(titles.length, numResults); i++) {
    results.push({
      title: titles[i].title,
      url: titles[i].url,
      description: snippets[i] || "",
    });
  }

  return results;
}

async function searchBing(query: string, numResults: number = 10): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.bing.com/search?q=${encodedQuery}&count=${numResults}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(`Bing search failed: ${response.status}`);
  }

  const html = await response.text();
  const results: SearchResult[] = [];

  // Bing result parsing
  const liRegex = /<li class="b_algo"[^>]*>([\s\S]*?)<\/li>/g;
  let liMatch;

  while ((liMatch = liRegex.exec(html)) !== null && results.length < numResults) {
    const liContent = liMatch[1];

    const titleMatch = liContent.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
    const snippetMatch = liContent.match(/<p[^>]*>([\s\S]*?)<\/p>/);

    if (titleMatch) {
      const url = titleMatch[1].startsWith("http") ? titleMatch[1] : "https://www.bing.com" + titleMatch[1];
      const title = titleMatch[2].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim();
      const description = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").trim() : "";

      results.push({ title, url, description });
    }
  }

  return results;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let query = "";
    let numResults = 10;
    let engine = "duckduckgo";

    if (req.method === "POST") {
      const body = await req.json();
      query = body.query || body.q || "";
      numResults = Math.min(Math.max(parseInt(body.num) || 10, 1), 20);
      engine = body.engine || "duckduckgo";
    } else {
      const url = new URL(req.url);
      query = url.searchParams.get("q") || url.searchParams.get("query") || "";
      numResults = Math.min(Math.max(parseInt(url.searchParams.get("num") || "10"), 1), 20);
      engine = url.searchParams.get("engine") || "duckduckgo";
    }

    if (!query.trim()) {
      return new Response(
        JSON.stringify({ error: "Query parameter is required. Use ?q=your+query or POST body with {query: '...'}" }),
        { status: 400, headers: corsHeaders }
      );
    }

    let results: SearchResult[];

    if (engine === "bing") {
      results = await searchBing(query, numResults);
    } else {
      results = await searchDuckDuckGo(query, numResults);
    }

    // If DuckDuckGo returns empty, fallback to Bing
    if (results.length === 0 && engine === "duckduckgo") {
      results = await searchBing(query, numResults);
    }

    return new Response(
      JSON.stringify({
        query,
        engine: engine === "bing" ? "bing" : "duckduckgo",
        results_count: results.length,
        results,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Search failed",
        query: "",
        results: [],
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
