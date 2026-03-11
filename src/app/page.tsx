"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  keyword: string;
  theme: string;
  count7d: number;
  countPrev7d: number;
  share7d: number;
  sharePrev7d: number;
  score: number;
};

type SignalResponse = {
  mode: string;
  updatedAt: string;
  windows?: {
    current: string;
    previous: string;
    papers7d: number;
    papersPrev7d: number;
  };
  items: Row[];
};

export default function Home() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [meta, setMeta] = useState<SignalResponse["windows"]>();

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/signals", { cache: "no-store" });
      const data: SignalResponse = await res.json();
      setRows(data.items ?? []);
      setUpdatedAt(data.updatedAt ?? "");
      setMeta(data.windows);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      q ? r.keyword.includes(q.toLowerCase()) || r.theme.includes(q.toLowerCase()) : true,
    );
  }, [q, rows]);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Signal Explorer (live arXiv mode)</h2>
          <input
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm"
            placeholder="Filter keyword/theme"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <p className="mt-2 text-xs text-black/60">
          {updatedAt ? `Updated: ${new Date(updatedAt).toLocaleString()}` : "Loading..."}
          {meta
            ? ` • Papers: ${meta.papers7d} (last 7d) vs ${meta.papersPrev7d} (prior 7d)`
            : ""}
        </p>

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
              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-black/50">
                    No rows yet. Try again in a moment or clear filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
