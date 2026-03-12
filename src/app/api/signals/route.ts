import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CACHE_PATH = path.join(process.cwd(), "public", "signals-cache.json");

type CachedPaper = {
  paper_id: string;
  published: string;
  text: string;
};

type SeriesPoint = { date: string; value: number };

type Series = {
  key: string;
  label: string;
  points: SeriesPoint[];
};

const THEME_KEYWORDS: Record<string, string[]> = {
  foundation_models: ["transformer", "attention", "llm", "gpt", "bert"],
  retrieval_knowledge: ["rag", "retrieval", "embedding"],
  agentic_systems: ["agent", "multi-agent", "tool use"],
  multimodal: ["multimodal", "vision-language", "vlm"],
  efficiency_infra: ["lora", "quantization", "distillation"],
  safety_governance: ["alignment", "hallucination", "robustness"],
};

const FOCUS_KEYWORDS = ["attention", "agent", "rag", "multimodal", "transformer"];

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildDateRange(days = 30) {
  const now = new Date();
  const arr: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    arr.push(dayKey(d));
  }
  return arr;
}

function buildKeywordSeries(papers: CachedPaper[], dates: string[]): Series[] {
  return FOCUS_KEYWORDS.map((kw) => {
    const points = dates.map((date) => {
      const value = papers.filter((p) => p.published.slice(0, 10) === date && p.text.includes(kw)).length;
      return { date, value };
    });
    return { key: kw, label: kw, points };
  });
}

function buildThemeSeries(papers: CachedPaper[], dates: string[]): Series[] {
  return Object.entries(THEME_KEYWORDS).map(([theme, keywords]) => {
    const points = dates.map((date) => {
      const dayPapers = papers.filter((p) => p.published.slice(0, 10) === date);
      const value = dayPapers.filter((p) => keywords.some((kw) => p.text.includes(kw))).length;
      return { date, value };
    });
    return { key: theme, label: theme.replaceAll("_", " "), points };
  });
}

export async function GET() {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const papers: CachedPaper[] = parsed.papers ?? [];

    const dates = buildDateRange(30);
    const keywordSeries = buildKeywordSeries(papers, dates);
    const themeSeries = buildThemeSeries(papers, dates);

    return NextResponse.json(
      {
        mode: parsed.mode ?? "cached-arxiv-incremental",
        updatedAt: parsed.updatedAt,
        windows: parsed.windows,
        items: parsed.items ?? [],
        history: {
          days: dates,
          keywords: keywordSeries,
          themes: themeSeries,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        mode: "cached-arxiv-incremental",
        updatedAt: new Date().toISOString(),
        windows: { current: "last_7d", previous: "prior_7d", papers7d: 0, papersPrev7d: 0 },
        items: [],
        history: { days: [], keywords: [], themes: [] },
        note: "signals cache not initialized; run refresh_signals_cache.py",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
