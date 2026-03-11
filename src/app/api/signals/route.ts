import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type KeywordDef = { keyword: string; theme: string };
type Paper = { text: string };

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

function toArxivDate(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}${hh}${mi}`;
}

function extractEntries(xml: string): Paper[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  return entries
    .map((entry) => {
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
      const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? "";
      const clean = `${title} ${summary}`
        .replace(/\s+/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .toLowerCase();
      return { text: clean };
    })
    .filter((p) => p.text.length > 0);
}

async function fetchWindow(from: Date, to: Date): Promise<Paper[]> {
  const categories = "cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:stat.ML";
  const dateRange = `submittedDate:[${toArxivDate(from)}+TO+${toArxivDate(to)}]`;
  const query = `${categories}+AND+${dateRange}`;
  const url = `https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&start=0&max_results=2000`;

  const res = await fetch(url, { cache: "no-store" });
  const xml = await res.text();
  return extractEntries(xml);
}

export async function GET() {
  try {
    const now = new Date();
    const startCurrent = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startPrevious = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [papers7d, papersPrev7d] = await Promise.all([
      fetchWindow(startCurrent, now),
      fetchWindow(startPrevious, startCurrent),
    ]);

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
      .filter((r) => r.count7d >= 3 || r.countPrev7d >= 3)
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
