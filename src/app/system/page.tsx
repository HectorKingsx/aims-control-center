"use client";
import { useMemo, useState } from "react";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, Badge, LoadingState, ErrorState, fmtDateID } from "@/components/ui";
import type { JobRunRow } from "@/lib/types";

const ERROR_GROUPS: { match: RegExp; label: string }[] = [
  { match: /json tidak valid/i, label: "Invalid JSON" },
  { match: /timeout/i, label: "API Timeout" },
  { match: /rate.?limit/i, label: "Rate limit" },
  { match: /duplicate/i, label: "Duplicate insert" },
  { match: /supabase|postgres/i, label: "Supabase read/write failure" },
  { match: /auth/i, label: "Authentication expired" },
  { match: /fetch|feed/i, label: "Source fetch error" },
];

function classifyError(msg: string | null): string {
  if (!msg) return "Unknown error";
  for (const g of ERROR_GROUPS) if (g.match.test(msg)) return g.label;
  return "Unknown error";
}

export default function SystemOperationsPage() {
  const [stepFilter, setStepFilter] = useState("all");
  const { data, error, loading } = useSupabaseQuery<JobRunRow[]>(() =>
    supabase.from("fcc_system_status").select("*").limit(500) as unknown as PromiseLike<{
      data: JobRunRow[] | null;
      error: { message: string } | null;
    }>
  );

  const rows = useMemo(() => {
    let r = data ?? [];
    if (stepFilter !== "all") r = r.filter((x) => x.step === stepFilter);
    return r;
  }, [data, stepFilter]);

  const steps = useMemo(() => [...new Set((data ?? []).map((r) => r.step))].sort(), [data]);

  const perStepSummary = useMemo(() => {
    const map = new Map<string, { total: number; success: number; failed: number; lastRun: string; lastSuccess?: string; lastFailed?: string }>();
    for (const r of data ?? []) {
      if (!map.has(r.step)) map.set(r.step, { total: 0, success: 0, failed: 0, lastRun: r.started_at });
      const s = map.get(r.step)!;
      s.total += 1;
      if (r.status === "success") { s.success += 1; if (!s.lastSuccess) s.lastSuccess = r.started_at; }
      if (r.status === "failed" || r.status === "blocked_qc") { s.failed += 1; if (!s.lastFailed) s.lastFailed = r.started_at; }
    }
    return map;
  }, [data]);

  const errorList = useMemo(() => {
    return (data ?? [])
      .filter((r) => r.status === "failed" || r.status === "blocked_qc")
      .slice(0, 30)
      .map((r) => ({ ...r, group: classifyError(r.error_excerpt) }));
  }, [data]);

  return (
    <div className="space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">System Operations</h1>
        <p className="text-sm text-base-muted mt-0.5">Kesehatan n8n workflows, error grouping, dan execution history.</p>
      </div>

      <Card title="Ringkasan per Workflow">
        {loading ? <LoadingState /> : error ? <ErrorState text={error} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-base-muted border-b border-base-border">
                  <th className="py-2 pr-3">Step</th>
                  <th className="py-2 pr-3">Total run (recent)</th>
                  <th className="py-2 pr-3">Success rate</th>
                  <th className="py-2 pr-3">Run terakhir sukses</th>
                  <th className="py-2 pr-3">Run terakhir gagal</th>
                </tr>
              </thead>
              <tbody>
                {[...perStepSummary.entries()].map(([step, s]) => (
                  <tr key={step} className="border-b border-base-border/50">
                    <td className="py-2 pr-3 font-medium">{step}</td>
                    <td className="py-2 pr-3">{s.total}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={s.success / s.total > 0.8 ? "green" : s.success / s.total > 0.5 ? "yellow" : "red"}>
                        {Math.round((s.success / s.total) * 100)}%
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-base-muted">{s.lastSuccess ? fmtDateID(s.lastSuccess) : "-"}</td>
                    <td className="py-2 pr-3 text-status-red">{s.lastFailed ? fmtDateID(s.lastFailed) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Error Center" action={
        <select value={stepFilter} onChange={(e) => setStepFilter(e.target.value)} className="bg-base-panel2 border border-base-border rounded-lg px-2 py-1 text-xs outline-none">
          <option value="all">Semua step</option>
          {steps.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      }>
        {errorList.length === 0 ? (
          <p className="text-sm text-base-muted">Tidak ada error tercatat baru-baru ini.</p>
        ) : (
          <div className="space-y-2">
            {errorList.filter((e) => stepFilter === "all" || e.step === stepFilter).map((e, i) => (
              <div key={i} className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone="red">{e.group}</Badge>
                  <span className="text-xs font-medium">{e.step}</span>
                  <span className="text-[11px] text-base-muted">{fmtDateID(e.started_at)}</span>
                </div>
                <div className="text-xs text-base-muted truncate">{e.error_excerpt}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Execution History (${rows.length})`}>
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-base-panel">
              <tr className="text-left text-[11px] text-base-muted border-b border-base-border">
                <th className="py-2 pr-3">Step</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Mulai</th>
                <th className="py-2 pr-3">Durasi (s)</th>
                <th className="py-2 pr-3">Biaya</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 100).map((r, i) => (
                <tr key={i} className="border-b border-base-border/50">
                  <td className="py-2 pr-3">{r.step}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={r.status === "success" ? "green" : r.status === "partial" ? "yellow" : "red"}>{r.status}</Badge>
                  </td>
                  <td className="py-2 pr-3 text-base-muted">{fmtDateID(r.started_at)}</td>
                  <td className="py-2 pr-3">{r.duration_seconds ?? "-"}</td>
                  <td className="py-2 pr-3">{r.cost_estimate != null ? `$${r.cost_estimate}` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
