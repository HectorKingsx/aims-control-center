"use client";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, LoadingState, ErrorState } from "@/components/ui";
import StatusDot, { statusToColor, type DotColor } from "@/components/StatusDot";
import type { JobRunRow } from "@/lib/types";

// Maps AIMS steps to founder-facing labels per brief section A.
const STEP_LABELS: Record<string, string> = {
  S1: "Topic Discovery",
  S2: "Topic Refinement",
  S3: "Topic Scoring",
  S4: "Content Planning",
  S5: "Content Drafting",
  S6: "Visual Planning",
  S7: "Founder Approval (auto-gate)",
  S8: "Content Production",
  S9: "Publishing",
  S10: "Performance Tracking",
  S11: "System Learning",
  S12: "Weekly System Check",
};

// Platform-level integrations are not in job_runs (no per-run row) —
// shown as static "connected" indicators since we don't have live health-check
// data for these yet. Flagged clearly rather than faked as green.
const PLATFORM_ITEMS = [
  { key: "supabase", label: "Supabase" },
  { key: "n8n", label: "n8n" },
  { key: "claude", label: "Claude API" },
  { key: "visual", label: "Visual generation (Flux)" },
  { key: "publishing", label: "Publishing integration (IG)" },
];

export default function SystemStatusGrid() {
  const { data, error, loading } = useSupabaseQuery<JobRunRow[]>(() =>
    supabase
      .from("fcc_system_status")
      .select("*")
      .limit(300) as unknown as PromiseLike<{ data: JobRunRow[] | null; error: { message: string } | null }>
  );

  if (loading) return <Card title="System Status"><LoadingState /></Card>;
  if (error) return <Card title="System Status"><ErrorState text={error} /></Card>;

  const rows = data ?? [];
  const latestByStep = new Map<string, JobRunRow>();
  const lastFailedByStep = new Map<string, JobRunRow>();
  for (const r of rows) {
    if (!latestByStep.has(r.step)) latestByStep.set(r.step, r);
    if ((r.status === "failed" || r.status === "blocked_qc") && !lastFailedByStep.has(r.step)) {
      lastFailedByStep.set(r.step, r);
    }
  }

  const steps = Object.keys(STEP_LABELS);

  return (
    <Card title="System Status">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {steps.map((step) => {
          const latest = latestByStep.get(step);
          const lastFailed = lastFailedByStep.get(step);
          const color: DotColor = !latest ? "grey" : statusToColor(latest.status);
          return (
            <div key={step} className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">{STEP_LABELS[step]}</div>
                <StatusDot color={color} />
              </div>
              <div className="text-[11px] text-base-muted space-y-0.5">
                <div>Run terakhir: {latest ? new Date(latest.started_at).toLocaleString("id-ID") : "belum pernah"}</div>
                {lastFailed && (
                  <div className="text-status-red">
                    Gagal terakhir: {new Date(lastFailed.started_at).toLocaleString("id-ID")}
                  </div>
                )}
                {latest?.error_excerpt && (
                  <div className="text-status-yellow truncate" title={latest.error_excerpt}>
                    {latest.error_excerpt}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {PLATFORM_ITEMS.map((p) => (
          <div key={p.key} className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-medium">{p.label}</div>
              <StatusDot color="grey" />
            </div>
            <div className="text-[11px] text-base-muted">
              Belum ada health-check langsung — status berdasarkan aktivitas job_runs terkait.
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
