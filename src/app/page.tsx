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

function themeLabel(theme: string) {
  return theme.replaceAll("_", " ");
}

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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-10 text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-500">Live Prototype</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Data Pipeline Lab</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            arXiv Research Signal Intelligence — real-time keyword acceleration for early trend detection.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-emerald-300/60 bg-emerald-100 px-3 py-1 text-emerald-700 dark:border-emerald-700/70 dark:bg-emerald-900/30 dark:text-emerald-300">
              API: live-arXiv
            </span>
            <span className="rounded-full border border-slate-300/60 bg-slate-100 px-3 py-1 text-slate-700 dark:border-slate-700/70 dark:bg-slate-800 dark:text-slate-300">
              Updated: {updatedAt ? new Date(updatedAt).toLocaleString() : "loading..."}
            </span>
            {meta ? (
              <span className="rounded-full border border-indigo-300/60 bg-indigo-100 px-3 py-1 text-indigo-700 dark:border-indigo-700/70 dark:bg-indigo-900/30 dark:text-indigo-300">
                Sampled papers {meta.papers7d} vs {meta.papersPrev7d}
              </span>
            ) : null}
            {meta && (meta.papers7d >= 2000 || meta.papersPrev7d >= 2000) ? (
              <span className="rounded-full border border-amber-300/60 bg-amber-100 px-3 py-1 text-amber-700 dark:border-amber-700/70 dark:bg-amber-900/30 dark:text-amber-300">
                capped sample (max 2000/window)
              </span>
            ) : null}
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Pipeline Scope</h2>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
            <li>• Bronze: ingest arXiv metadata (title, abstract, categories, publish date)</li>
            <li>• Silver: normalize text and publication dimensions</li>
            <li>• Gold: keyword daily metrics + trend acceleration score</li>
            <li>• Ops: Prefect orchestration + dbt transforms + quality checks</li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Signal Explorer</h2>
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-indigo-500 placeholder:text-slate-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-950"
              placeholder="Filter keyword/theme"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Keyword</th>
                  <th className="px-4 py-3">Theme</th>
                  <th className="px-4 py-3">7d</th>
                  <th className="px-4 py-3">Prev 7d</th>
                  <th className="px-4 py-3">Share 7d</th>
                  <th className="px-4 py-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr
                    key={r.keyword}
                    className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-950/60"}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{r.keyword}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-indigo-300/70 bg-indigo-50 px-2 py-1 text-xs text-indigo-700 dark:border-indigo-700/60 dark:bg-indigo-900/20 dark:text-indigo-300">
                        {themeLabel(r.theme)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.count7d}</td>
                    <td className="px-4 py-3">{r.countPrev7d}</td>
                    <td className="px-4 py-3">{(r.share7d * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">{r.score.toFixed(3)}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No rows yet. Try again in a moment or clear filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
