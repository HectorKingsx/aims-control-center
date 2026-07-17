"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, Badge, EmptyState, LoadingState, ErrorState, fmtRelativeAge } from "@/components/ui";
import type { ContentOverviewRow } from "@/lib/types";
import Link from "next/link";

const STATUS_TO_STAGE: Record<string, string> = {
  planned: "S4 Content Planning",
  drafted: "S5 Content Drafting",
  visual_ready: "S6 Visual Planning",
  ready_for_review: "S7 Founder Approval",
  qc_blocked: "S7 Founder Approval",
  approved: "S7 Founder Approval",
  revise: "S7 Founder Approval",
  rejected: "S7 Founder Approval",
  archived: "S7 Founder Approval",
  produced: "S8 Content Production",
  published: "S9 Publishing",
  tracked: "S10 Performance Tracking",
  not_recommended: "S3 Topic Scoring (auto-filtered)",
  revision_requested: "S7 Founder Approval",
};

function PipelineContent() {
  const searchParams = useSearchParams();
  const stageParam = searchParams.get("stage");
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [riskFilter, setRiskFilter] = useState("all");

  const { data, error, loading } = useSupabaseQuery<ContentOverviewRow[]>(
    () =>
      supabase.from("fcc_content_overview").select("*").order("updated_at", { ascending: false }).limit(500) as unknown as PromiseLike<{
        data: ContentOverviewRow[] | null;
        error: { message: string } | null;
      }>,
    []
  );

  const rows = useMemo(() => {
    let r = data ?? [];
    if (riskFilter !== "all") r = r.filter((x) => x.risk_level === riskFilter);
    return r;
  }, [data, riskFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ContentOverviewRow[]>();
    for (const r of rows) {
      const stage = STATUS_TO_STAGE[r.status ?? ""] ?? "Lainnya";
      if (!map.has(stage)) map.set(stage, []);
      map.get(stage)!.push(r);
    }
    return map;
  }, [rows]);

  const stageOrder = [
    "S4 Content Planning", "S5 Content Drafting", "S6 Visual Planning",
    "S7 Founder Approval", "S8 Content Production", "S9 Publishing",
    "S10 Performance Tracking", "S3 Topic Scoring (auto-filtered)", "Lainnya",
  ];

  return (
    <div className="space-y-4 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Content Pipeline</h1>
          <p className="text-sm text-base-muted mt-0.5">
            {stageParam ? `Difilter dari Command Center: ${stageParam}` : "Lihat semua konten di seluruh tahap AIMS."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm outline-none">
            <option value="all">Semua risk</option>
            <option value="LOW">Risk rendah</option>
            <option value="MEDIUM">Risk sedang</option>
            <option value="HIGH">Risk tinggi</option>
          </select>
          <div className="flex border border-base-border rounded-lg overflow-hidden">
            <button onClick={() => setView("kanban")} className={`px-3 py-2 text-sm ${view === "kanban" ? "bg-accent text-black" : "bg-base-panel2"}`}>Kanban</button>
            <button onClick={() => setView("table")} className={`px-3 py-2 text-sm ${view === "table" ? "bg-accent text-black" : "bg-base-panel2"}`}>Table</button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState text={error} />
      ) : rows.length === 0 ? (
        <EmptyState text="Tidak ada konten." />
      ) : view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stageOrder.filter((s) => grouped.has(s)).map((stage) => (
            <div key={stage} className="min-w-[280px] w-[280px] shrink-0">
              <div className="text-xs font-medium text-base-muted mb-2 flex items-center justify-between">
                <span>{stage}</span>
                <Badge tone="grey">{grouped.get(stage)!.length}</Badge>
              </div>
              <div className="space-y-2">
                {grouped.get(stage)!.map((r) => (
                  <Link key={r.content_item_id} href={`/approval/detail?id=${r.content_item_id}`} className="block border border-base-border rounded-lg p-3 bg-base-panel hover:border-accent/50">
                    <div className="text-xs font-medium line-clamp-2 mb-1.5">{r.title ?? "(tanpa judul)"}</div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {r.risk_level && <Badge tone={r.risk_level === "HIGH" ? "red" : r.risk_level === "MEDIUM" ? "yellow" : "green"}>{r.risk_level}</Badge>}
                      <span className="text-[10px] text-base-muted">Skor {r.total_score ?? "-"}</span>
                    </div>
                    <div className="text-[10px] text-base-muted mt-1">{fmtRelativeAge(r.updated_at)}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-base-muted border-b border-base-border">
                  <th className="py-2 pr-3">Judul</th>
                  <th className="py-2 pr-3">Stage</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Skor</th>
                  <th className="py-2 pr-3">Risk</th>
                  <th className="py-2 pr-3">Revisi</th>
                  <th className="py-2 pr-3">Update terakhir</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.content_item_id} className="border-b border-base-border/50 hover:bg-base-panel2/40">
                    <td className="py-2 pr-3">
                      <Link href={`/approval/detail?id=${r.content_item_id}`} className="hover:text-accent">{r.title ?? "(tanpa judul)"}</Link>
                    </td>
                    <td className="py-2 pr-3 text-base-muted">{STATUS_TO_STAGE[r.status ?? ""] ?? "-"}</td>
                    <td className="py-2 pr-3"><Badge tone="grey">{r.status}</Badge></td>
                    <td className="py-2 pr-3">{r.total_score ?? "-"}</td>
                    <td className="py-2 pr-3">{r.risk_level && <Badge tone={r.risk_level === "HIGH" ? "red" : r.risk_level === "MEDIUM" ? "yellow" : "green"}>{r.risk_level}</Badge>}</td>
                    <td className="py-2 pr-3">{r.revision_count}</td>
                    <td className="py-2 pr-3 text-base-muted">{fmtRelativeAge(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PipelineContent />
    </Suspense>
  );
}
