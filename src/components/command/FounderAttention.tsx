"use client";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, Badge, EmptyState, LoadingState, ErrorState, fmtRelativeAge } from "@/components/ui";
import type { ContentOverviewRow, JobRunRow } from "@/lib/types";
import Link from "next/link";

interface Alert {
  id: string;
  type: string;
  severity: "critical" | "warning";
  related: string;
  reason: string;
  age: string;
  action: string;
  href: string;
}

export default function FounderAttention() {
  const content = useSupabaseQuery<ContentOverviewRow[]>(() =>
    supabase.from("fcc_content_overview").select("*").limit(500) as unknown as PromiseLike<{
      data: ContentOverviewRow[] | null;
      error: { message: string } | null;
    }>
  );
  const runs = useSupabaseQuery<JobRunRow[]>(() =>
    supabase.from("fcc_system_status").select("*").limit(50) as unknown as PromiseLike<{
      data: JobRunRow[] | null;
      error: { message: string } | null;
    }>
  );

  if (content.loading || runs.loading) return <Card title="Perlu Perhatian Founder"><LoadingState /></Card>;
  if (content.error) return <Card title="Perlu Perhatian Founder"><ErrorState text={content.error} /></Card>;

  const rows = content.data ?? [];
  const alerts: Alert[] = [];

  for (const r of rows) {
    if (r.status === "ready_for_review" || r.status === "qc_blocked") {
      alerts.push({
        id: r.content_item_id,
        type: "Menunggu approval",
        severity: r.risk_level === "HIGH" ? "critical" : "warning",
        related: r.title ?? "(tanpa judul)",
        reason: r.risk_level === "HIGH" ? "Risk level HIGH, butuh review manual" : "Menunggu keputusan founder",
        age: fmtRelativeAge(r.created_at),
        action: "Review sekarang",
        href: "/approval",
      });
    }
    if (r.risk_level === "HIGH" && r.validation_status === "BLOCKED") {
      alerts.push({
        id: r.content_item_id + "-blocked",
        type: "Risiko faktual kritis",
        severity: "critical",
        related: r.title ?? "(tanpa judul)",
        reason: "QC BLOCKED — klaim tidak didukung sumber atau isu numerik kritis",
        age: fmtRelativeAge(r.qc_checked_at),
        action: "Lihat detail QC",
        href: "/quality",
      });
    }
    if (r.revision_count >= 2) {
      alerts.push({
        id: r.content_item_id + "-revision",
        type: "Revisi berulang",
        severity: "warning",
        related: r.title ?? "(tanpa judul)",
        reason: `Sudah ${r.revision_count}x direvisi`,
        age: fmtRelativeAge(r.updated_at),
        action: "Cek riwayat revisi",
        href: "/pipeline",
      });
    }
    if (r.publish_deadline && new Date(r.publish_deadline).getTime() - Date.now() < 6 * 3600 * 1000 && r.status !== "published") {
      alerts.push({
        id: r.content_item_id + "-deadline",
        type: "Mendekati deadline publish",
        severity: "warning",
        related: r.title ?? "(tanpa judul)",
        reason: "Kurang dari 6 jam menuju deadline",
        age: fmtRelativeAge(r.publish_deadline),
        action: "Prioritaskan",
        href: "/pipeline",
      });
    }
  }

  for (const j of runs.data ?? []) {
    if (j.status === "failed") {
      alerts.push({
        id: j.step + j.started_at,
        type: "Workflow gagal",
        severity: "critical",
        related: j.step,
        reason: j.error_excerpt ?? "Gagal tanpa detail error",
        age: fmtRelativeAge(j.started_at),
        action: "Buka System Operations",
        href: "/system",
      });
    }
  }

  alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1));
  const shown = alerts.slice(0, 8);

  return (
    <Card
      title="Perlu Perhatian Founder"
      className="ring-1 ring-accent/20"
      action={<Badge tone={shown.some((a) => a.severity === "critical") ? "red" : "yellow"}>{alerts.length} item</Badge>}
    >
      {shown.length === 0 ? (
        <EmptyState text="Tidak ada yang butuh perhatian saat ini." />
      ) : (
        <div className="space-y-2">
          {shown.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 border border-base-border rounded-lg p-3 bg-base-panel2/40">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge tone={a.severity === "critical" ? "red" : "yellow"}>{a.type}</Badge>
                  <span className="text-[11px] text-base-muted">{a.age}</span>
                </div>
                <div className="text-sm font-medium truncate">{a.related}</div>
                <div className="text-xs text-base-muted truncate">{a.reason}</div>
              </div>
              <Link href={a.href} className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-accent text-white font-medium hover:bg-accent/90">
                {a.action}
              </Link>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
