"use client";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, LoadingState, ErrorState, fmtCurrencyIDR } from "@/components/ui";
import type { DailyKpiRow } from "@/lib/types";

const ITEMS: { key: keyof DailyKpiRow; label: string; fmt?: (v: number) => string }[] = [
  { key: "topics_discovered_today", label: "Topik ditemukan" },
  { key: "topics_passed_scoring_today", label: "Lolos scoring" },
  { key: "content_generated_today", label: "Konten dibuat" },
  { key: "content_waiting_approval", label: "Menunggu approval" },
  { key: "content_approved_today", label: "Disetujui hari ini" },
  { key: "content_revision_today", label: "Diminta revisi" },
  { key: "content_rejected_today", label: "Ditolak" },
  { key: "content_ready_to_publish", label: "Siap publish" },
  { key: "content_published_today", label: "Dipublish hari ini" },
  { key: "failed_processes_today", label: "Proses gagal" },
  { key: "avg_quality_score_today", label: "Rata-rata skor kualitas" },
  { key: "estimated_cost_today", label: "Estimasi biaya AI hari ini", fmt: fmtCurrencyIDR },
];

export default function DailyKpi() {
  const { data, error, loading } = useSupabaseQuery<DailyKpiRow[]>(() =>
    supabase.from("fcc_daily_kpi").select("*") as unknown as PromiseLike<{
      data: DailyKpiRow[] | null;
      error: { message: string } | null;
    }>
  );

  if (loading) return <Card title="Ringkasan KPI Harian"><LoadingState /></Card>;
  if (error) return <Card title="Ringkasan KPI Harian"><ErrorState text={error} /></Card>;

  const kpi = data?.[0];
  if (!kpi) return <Card title="Ringkasan KPI Harian"><ErrorState text="Data KPI tidak tersedia" /></Card>;

  return (
    <Card title="Ringkasan KPI Harian">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {ITEMS.map((item) => {
          const raw = kpi[item.key];
          const val = raw == null ? "-" : item.fmt ? item.fmt(Number(raw)) : String(raw);
          return (
            <div key={String(item.key)} className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
              <div className="text-[11px] text-base-muted mb-1">{item.label}</div>
              <div className="text-lg font-semibold">{val}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
