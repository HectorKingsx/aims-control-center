"use client";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, Badge, EmptyState, LoadingState, ErrorState, MockBadge, fmtRelativeAge } from "@/components/ui";
import type { ContentOverviewRow } from "@/lib/types";
import Link from "next/link";

export default function ApprovalQueuePreview() {
  const { data, error, loading } = useSupabaseQuery<ContentOverviewRow[]>(() =>
    supabase
      .from("fcc_content_overview")
      .select("*")
      .in("status", ["ready_for_review", "qc_blocked"])
      .order("created_at", { ascending: true })
      .limit(6) as unknown as PromiseLike<{ data: ContentOverviewRow[] | null; error: { message: string } | null }>
  );

  if (loading) return <Card title="Antrian Approval (Preview)"><LoadingState /></Card>;
  if (error) return <Card title="Antrian Approval (Preview)"><ErrorState text={error} /></Card>;

  const rows = data ?? [];

  return (
    <Card
      title="Antrian Approval (Preview)"
      action={
        <Link href="/approval" className="text-xs text-accent hover:underline">
          Lihat semua →
        </Link>
      }
    >
      {rows.length === 0 ? (
        <EmptyState text="Tidak ada konten menunggu approval saat ini." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.content_item_id} className="flex items-center gap-3 border border-base-border rounded-lg p-3 bg-base-panel2/40">
              <div className="h-10 w-10 rounded-md bg-base-panel border border-base-border shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{r.title ?? "(tanpa judul)"}</div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge tone="accent">{r.brand_name ?? "The Daily Economics"}</Badge>
                  {r.risk_level && <Badge tone={r.risk_level === "HIGH" ? "red" : r.risk_level === "MEDIUM" ? "yellow" : "green"}>Risk {r.risk_level}</Badge>}
                  <span className="text-[11px] text-base-muted">Skor total {r.total_score ?? "-"}</span>
                  {r.factual_score == null && <MockBadge label="factual: mock" />}
                  <span className="text-[11px] text-base-muted">{fmtRelativeAge(r.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
