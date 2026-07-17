"use client";
import { useMemo } from "react";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, Badge, LoadingState, ErrorState, MockBadge } from "@/components/ui";
import type { ContentOverviewRow } from "@/lib/types";

interface IssueRow {
  numeric_issues: { type?: string }[] | null;
  qualifier_issues: { type?: string }[] | null;
  other_issues: { type?: string }[] | null;
  checked_at: string;
  risk_level: string | null;
  validation_status: string | null;
}

const AVG_SCORE_FIELDS: { key: keyof ContentOverviewRow; label: string; mock: boolean }[] = [
  { key: "source_score", label: "Kualitas sumber", mock: false },
  { key: "factual_score", label: "Akurasi faktual", mock: true },
  { key: "communication_score", label: "Gaya komunikasi", mock: true },
  { key: "headline_score", label: "Kualitas headline", mock: true },
  { key: "explanation_score", label: "Kualitas penjelasan", mock: true },
  { key: "practical_relevance_score", label: "Relevansi praktis", mock: true },
  { key: "visual_score", label: "Keterbacaan visual", mock: true },
  { key: "brand_alignment_score", label: "Kesesuaian brand", mock: true },
];

export default function QualityPage() {
  const content = useSupabaseQuery<ContentOverviewRow[]>(() =>
    supabase.from("fcc_content_overview").select("*").limit(500) as unknown as PromiseLike<{
      data: ContentOverviewRow[] | null;
      error: { message: string } | null;
    }>
  );
  const issues = useSupabaseQuery<IssueRow[]>(() =>
    supabase
      .from("qc_content_validations")
      .select("numeric_issues, qualifier_issues, other_issues, checked_at, risk_level, validation_status")
      .order("checked_at", { ascending: false })
      .limit(500) as unknown as PromiseLike<{ data: IssueRow[] | null; error: { message: string } | null }>
  );

  const avgScores = useMemo(() => {
    const rows = content.data ?? [];
    const result: Record<string, number | null> = {};
    for (const f of AVG_SCORE_FIELDS) {
      const vals = rows.map((r) => r[f.key]).filter((v): v is number => typeof v === "number");
      result[String(f.key)] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    }
    return result;
  }, [content.data]);

  const issueCounts = useMemo(() => {
    const rows = issues.data ?? [];
    const now = Date.now();
    const counts = new Map<string, { today: number; last7: number }>();
    for (const r of rows) {
      const all = [...(r.numeric_issues ?? []), ...(r.qualifier_issues ?? []), ...(r.other_issues ?? [])];
      const ageDays = (now - new Date(r.checked_at).getTime()) / 86400000;
      for (const issue of all) {
        const type = issue.type ?? "unknown";
        if (!counts.has(type)) counts.set(type, { today: 0, last7: 0 });
        const c = counts.get(type)!;
        if (ageDays < 1) c.today += 1;
        if (ageDays < 7) c.last7 += 1;
      }
    }
    return [...counts.entries()].sort((a, b) => b[1].last7 - a[1].last7);
  }, [issues.data]);

  const riskBreakdown = useMemo(() => {
    const rows = issues.data ?? [];
    const total = rows.length || 1;
    const high = rows.filter((r) => r.risk_level === "HIGH").length;
    const medium = rows.filter((r) => r.risk_level === "MEDIUM").length;
    const low = rows.filter((r) => r.risk_level === "LOW").length;
    return { high, medium, low, total, highPct: Math.round((high / total) * 100) };
  }, [issues.data]);

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div>
        <h1 className="text-xl font-semibold">Editorial Quality Center</h1>
        <p className="text-sm text-base-muted mt-0.5">Monitoring kualitas editorial lintas konten.</p>
      </div>

      <Card title="Rata-Rata Skor Kualitas">
        {content.loading ? <LoadingState /> : content.error ? <ErrorState text={content.error} /> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AVG_SCORE_FIELDS.map((f) => (
              <div key={String(f.key)} className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
                <div className="text-[11px] text-base-muted mb-1 flex items-center gap-1">
                  {f.label} {f.mock && <MockBadge />}
                </div>
                <div className="text-lg font-semibold">{avgScores[String(f.key)] ?? "-"}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Distribusi Risk Level (QC)">
        {issues.loading ? <LoadingState /> : issues.error ? <ErrorState text={issues.error} /> : (
          <div className="flex items-center gap-4">
            <Badge tone="red">HIGH: {riskBreakdown.high} ({riskBreakdown.highPct}%)</Badge>
            <Badge tone="yellow">MEDIUM: {riskBreakdown.medium}</Badge>
            <Badge tone="green">LOW: {riskBreakdown.low}</Badge>
            <span className="text-xs text-base-muted">dari {riskBreakdown.total} hasil QC tercatat</span>
          </div>
        )}
      </Card>

      <Card title="Masalah Editorial Berulang">
        {issues.loading ? (
          <LoadingState />
        ) : issueCounts.length === 0 ? (
          <p className="text-sm text-base-muted">Belum ada detail tipe isu tercatat di numeric_issues/qualifier_issues/other_issues.</p>
        ) : (
          <div className="space-y-1.5">
            {issueCounts.map(([type, c]) => (
              <div key={type} className="flex items-center justify-between text-sm border-b border-base-border/50 py-1.5 last:border-0">
                <span>{type}</span>
                <div className="flex items-center gap-3 text-xs text-base-muted">
                  <span>Hari ini: {c.today}</span>
                  <span>7 hari: {c.last7}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
