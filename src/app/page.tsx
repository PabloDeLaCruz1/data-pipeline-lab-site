"use client";

import { useMemo, useState } from "react";

type Row = {
  keyword: string;
  theme: string;
  count7d: number;
  countPrev7d: number;
  share7d: number;
  sharePrev7d: number;
};

const sampleRows: Row[] = [
  { keyword: "agent", theme: "agentic_systems", count7d: 52, countPrev7d: 31, share7d: 0.17, sharePrev7d: 0.11 },
  { keyword: "multimodal", theme: "multimodal", count7d: 38, countPrev7d: 24, share7d: 0.13, sharePrev7d: 0.09 },
  { keyword: "rag", theme: "retrieval_knowledge", count7d: 29, countPrev7d: 21, share7d: 0.1, sharePrev7d: 0.08 },
  { keyword: "transformer", theme: "foundation_models", count7d: 64, countPrev7d: 60, share7d: 0.2, sharePrev7d: 0.19 },
];

function accel(r: Row) {
  const growth = (r.count7d - r.countPrev7d) / Math.max(r.countPrev7d, 1);
  const shareDelta = r.share7d - r.sharePrev7d;
  return 0.6 * growth + 0.4 * shareDelta;
}

export default function Home() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const rows = sampleRows
      .filter((r) => (q ? r.keyword.includes(q.toLowerCase()) || r.theme.includes(q.toLowerCase()) : true))
      .map((r) => ({ ...r, score: accel(r) }))
      .sort((a, b) => b.score - a.score);
    return rows;
  }, [q]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-4xl font-bold">Data Pipeline Lab</h1>
      <p className="mt-2 text-black/70">
        Website prototype for testing our arXiv Research Signal Intelligence pipeline.
      </p>

      <section className="mt-8 rounded-xl border border-black/10 p-5">
        <h2 className="text-xl font-semibold">Pipeline Scope</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-black/75">
          <li>Bronze: ingest arXiv metadata (title, abstract, categories, publish date)</li>
          <li>Silver: normalize text and publication dimensions</li>
          <li>Gold: keyword daily metrics + trend acceleration score</li>
          <li>Ops: Prefect orchestration + dbt transforms + quality checks</li>
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-black/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Signal Explorer (test mode)</h2>
          <input
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm"
            placeholder="Filter keyword/theme"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-black/60">
                <th className="py-2">Keyword</th>
                <th>Theme</th>
                <th>7d</th>
                <th>Prev 7d</th>
                <th>Share 7d</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.keyword} className="border-b border-black/5">
                  <td className="py-2 font-medium">{r.keyword}</td>
                  <td>{r.theme}</td>
                  <td>{r.count7d}</td>
                  <td>{r.countPrev7d}</td>
                  <td>{(r.share7d * 100).toFixed(1)}%</td>
                  <td>{r.score.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
