import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type KeywordDef = { keyword: string; theme: string };
type Paper = { published: Date; text: string };

const KEYWORDS: KeywordDef[] = [
  { keyword: "agent", theme: "agentic_systems" },
  { keyword: "multi-agent", theme: "agentic_systems" },
  { keyword: "rag", theme: "retrieval_knowledge" },
  { keyword: "retrieval", theme: "retrieval_knowledge" },
  { keyword: "multimodal", theme: "multimodal" },
  { keyword: "vision-language", theme: "multimodal" },
  { keyword: "transformer", theme: "foundation_models" },
  { keyword: "attention", theme: "foundation_models" },
  { keyword: "lora", theme: "efficiency_infra" },
  { keyword: "quantization", theme: "efficiency_infra" },
  { keyword: "alignment", theme: "safety_governance" },
  { keyword: "hallucination", theme: "safety_governance" },
];

function extractEntries(xml: string): Paper[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  return entries
    .map((entry) => {
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
      const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? "";
      const publishedRaw = entry.match(/<published>(.*?)<\/published>/)?.[1];
      if (!publishedRaw) return null;
      const published = new Date(publishedRaw);
      if (Number.isNaN(published.getTime())) return null;
      const clean = `${title} ${summary}`
        .replace(/\s+/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .toLowerCase();
      return { published, text: clean };
    })
    .filter(Boolean) as Paper[];
}

function withinDays(date: Date, days: number) {
  const now = new Date();
  const ms = days * 24 * 60 * 60 * 1000;
  return now.getTime() - date.getTime() <= ms;
}

export async function GET() {
  try {
    const query = "cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:stat.ML";
    const url = `https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&start=0&max_results=500`;

    const res = await fetch(url, { cache: "no-store" });
    const xml = await res.text();
    const papers = extractEntries(xml);

    const papers7d = papers.filter((p) => withinDays(p.published, 7));
    const papers14d = papers.filter((p) => withinDays(p.published, 14));
    const papersPrev7d = papers14d.filter((p) => !withinDays(p.published, 7));

    const items = KEYWORDS.map((k) => {
      const count7d = papers7d.filter((p) => p.text.includes(k.keyword)).length;
      const countPrev7d = papersPrev7d.filter((p) => p.text.includes(k.keyword)).length;
      const share7d = papers7d.length ? count7d / papers7d.length : 0;
      const sharePrev7d = papersPrev7d.length ? countPrev7d / papersPrev7d.length : 0;
      const growthRate = (count7d - countPrev7d) / Math.max(countPrev7d, 1);
      const shareDelta = share7d - sharePrev7d;
      const score = 0.6 * growthRate + 0.4 * shareDelta;
      return {
        ...k,
        count7d,
        countPrev7d,
        share7d,
        sharePrev7d,
        score,
      };
    })
      .filter((r) => r.count7d >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return NextResponse.json(
      {
        mode: "live-arxiv",
        updatedAt: new Date().toISOString(),
        windows: {
          current: "last_7d",
          previous: "prior_7d",
          papers7d: papers7d.length,
          papersPrev7d: papersPrev7d.length,
        },
        items,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { mode: "live-arxiv", updatedAt: new Date().toISOString(), items: [], error: "fetch_failed" },
      { status: 200 },
    );
  }
}
