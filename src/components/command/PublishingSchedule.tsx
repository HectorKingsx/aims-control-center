"use client";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, Badge, EmptyState, LoadingState, ErrorState, fmtDateID } from "@/components/ui";
import type { ContentOverviewRow } from "@/lib/types";

export default function PublishingSchedule() {
  const { data, error, loading } = useSupabaseQuery<ContentOverviewRow[]>(() =>
    supabase
      .from("fcc_content_overview")
      .select("*")
      .not("publish_deadline", "is", null)
      .order("publish_deadline", { ascending: true })
      .limit(20) as unknown as PromiseLike<{ data: ContentOverviewRow[] | null; error: { message: string } | null }>
  );

  if (loading) return <Card title="Jadwal Publish"><LoadingState /></Card>;
  if (error) return <Card title="Jadwal Publish"><ErrorState text={error} /></Card>;

  const rows = data ?? [];
  const now = Date.now();
  const today = rows.filter((r) => r.publish_deadline && new Date(r.publish_deadline).toDateString() === new Date().toDateString());
  const missed = rows.filter((r) => r.publish_deadline && new Date(r.publish_deadline).getTime() < now && r.status !== "published");
  const noFile = rows.filter((r) => !r.bundle_url && r.status === "produced");

  return (
    <Card title="Jadwal Publish">
      {rows.length === 0 ? (
        <EmptyState text="Belum ada deadline publish yang diset (publish_deadline masih kosong untuk semua item — field baru, belum diisi pipeline)." />
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-[11px] text-base-muted mb-1">Hari ini ({today.length})</div>
            {today.map((r) => (
              <div key={r.content_item_id} className="flex justify-between text-xs py-1">
                <span className="truncate">{r.title}</span>
                <span className="text-base-muted">{fmtDateID(r.publish_deadline)}</span>
              </div>
            ))}
          </div>
          {missed.length > 0 && (
            <div>
              <Badge tone="red">Terlewat ({missed.length})</Badge>
              {missed.map((r) => (
                <div key={r.content_item_id} className="flex justify-between text-xs py-1">
                  <span className="truncate">{r.title}</span>
                  <span className="text-status-red">{fmtDateID(r.publish_deadline)}</span>
                </div>
              ))}
            </div>
          )}
          {noFile.length > 0 && (
            <div className="text-xs text-status-yellow">{noFile.length} konten "produced" belum punya file final (bundle_url kosong).</div>
          )}
        </div>
      )}
    </Card>
  );
}
