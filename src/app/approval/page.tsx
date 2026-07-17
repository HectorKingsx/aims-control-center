"use client";
import { useMemo, useState } from "react";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, Badge, EmptyState, LoadingState, ErrorState, fmtRelativeAge } from "@/components/ui";
import type { ContentOverviewRow } from "@/lib/types";
import Link from "next/link";

const STATUS_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "ready_for_review", label: "Menunggu review" },
  { value: "qc_blocked", label: "QC blocked" },
  { value: "approved", label: "Disetujui" },
  { value: "revise", label: "Revisi" },
  { value: "rejected", label: "Ditolak" },
];

export default function ApprovalQueuePage() {
  const [statusFilter, setStatusFilter] = useState("ready_for_review");
  const [riskFilter, setRiskFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data, error, loading } = useSupabaseQuery<ContentOverviewRow[]>(
    () =>
      supabase
        .from("fcc_content_overview")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(500) as unknown as PromiseLike<{ data: ContentOverviewRow[] | null; error: { message: string } | null }>,
    []
  );

  const rows = useMemo(() => {
    let r = data ?? [];
    if (statusFilter !== "all") r = r.filter((x) => x.status === statusFilter);
    if (riskFilter !== "all") r = r.filter((x) => x.risk_level === riskFilter);
    if (search.trim()) r = r.filter((x) => (x.title ?? "").toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [data, statusFilter, riskFilter, search]);

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-xl font-semibold">Founder Approval Center</h1>
        <p className="text-sm text-base-muted mt-0.5">Review konten sebelum diproduksi/dipublish.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul konten..."
            className="bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] outline-none focus:border-accent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm outline-none"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="all">Semua risk</option>
            <option value="LOW">Risk rendah</option>
            <option value="MEDIUM">Risk sedang</option>
            <option value="HIGH">Risk tinggi</option>
          </select>
        </div>
      </Card>

      <Card title={`Antrian (${rows.length})`}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState text={error} />
        ) : rows.length === 0 ? (
          <EmptyState text="Tidak ada konten yang cocok dengan filter." />
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Link
                key={r.content_item_id}
                href={`/approval/detail?id=${r.content_item_id}`}
                className="flex items-center gap-3 border border-base-border rounded-lg p-3 bg-base-panel2/40 hover:border-accent/50 transition-colors"
              >
                <div className="h-12 w-12 rounded-md bg-base-panel border border-base-border shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.title ?? "(tanpa judul)"}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <Badge tone="accent">{r.brand_name ?? "The Daily Economics"}</Badge>
                    <Badge tone="grey">{r.status}</Badge>
                    {r.risk_level && (
                      <Badge tone={r.risk_level === "HIGH" ? "red" : r.risk_level === "MEDIUM" ? "yellow" : "green"}>
                        Risk {r.risk_level}
                      </Badge>
                    )}
                    <span className="text-[11px] text-base-muted">Skor {r.total_score ?? "-"}</span>
                    <span className="text-[11px] text-base-muted">{fmtRelativeAge(r.created_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
