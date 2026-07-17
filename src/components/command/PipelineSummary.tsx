"use client";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, LoadingState, ErrorState } from "@/components/ui";
import Link from "next/link";

interface StageCountRow {
  stage: string;
  status: string;
  item_count: number;
}

const STAGE_ORDER = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"];
const STAGE_LABELS: Record<string, string> = {
  S1: "Discovered", S2: "Refined", S3: "Scored", S4: "Planned",
  S5: "Drafted", S6: "Visual planned", S7: "Menunggu founder",
  S8: "Produksi", S9: "Siap/Terjadwal publish", S10: "Published",
};

export default function PipelineSummary() {
  const { data, error, loading } = useSupabaseQuery<StageCountRow[]>(() =>
    supabase.from("pipeline_stage_counts").select("*") as unknown as PromiseLike<{
      data: StageCountRow[] | null;
      error: { message: string } | null;
    }>
  );

  if (loading) return <Card title="Ringkasan Pipeline Konten"><LoadingState /></Card>;
  if (error) return <Card title="Ringkasan Pipeline Konten"><ErrorState text={error} /></Card>;

  const rows = data ?? [];
  const totals = new Map<string, number>();
  for (const r of rows) {
    totals.set(r.stage, (totals.get(r.stage) ?? 0) + r.item_count);
  }

  return (
    <Card title="Ringkasan Pipeline Konten (klik untuk filter)">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {STAGE_ORDER.map((stage) => (
          <Link
            key={stage}
            href={`/pipeline?stage=${stage}`}
            className="border border-base-border rounded-lg p-3 bg-base-panel2/40 hover:border-accent/50 transition-colors"
          >
            <div className="text-[11px] text-base-muted">{STAGE_LABELS[stage]}</div>
            <div className="text-xl font-semibold">{totals.get(stage) ?? 0}</div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
