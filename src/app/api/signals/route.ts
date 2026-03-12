import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CACHE_PATH = path.join(process.cwd(), "public", "signals-cache.json");

export async function GET() {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw);

    return NextResponse.json(
      {
        mode: parsed.mode ?? "cached-arxiv-incremental",
        updatedAt: parsed.updatedAt,
        windows: parsed.windows,
        items: parsed.items ?? [],
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
        note: "signals cache not initialized; run refresh_signals_cache.py",
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
}
