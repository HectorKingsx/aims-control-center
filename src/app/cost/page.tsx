"use client";
import { useMemo } from "react";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, Badge, LoadingState, ErrorState, MockBadge, fmtCurrencyIDR } from "@/components/ui";

interface CostRecordRow {
  cost: number;
  step: string | null;
  created_at: string;
  cost_type: string;
  content_item_id: string | null;
}

export default function CostPage() {
  const { data, error, loading } = useSupabaseQuery<CostRecordRow[]>(() =>
    supabase.from("cost_records").select("*").order("created_at", { ascending: false }).limit(3000) as unknown as PromiseLike<{
      data: CostRecordRow[] | null;
      error: { message: string } | null;
    }>
  );

  const rows = data ?? [];

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      const day = new Date(r.created_at).toISOString().slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + Number(r.cost));
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
  }, [rows]);

  const byStep = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (!r.step) continue;
      map.set(r.step, (map.get(r.step) ?? 0) + Number(r.cost));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const totalMonth = byDay.reduce((s, [, v]) => s + v, 0);
  const contentCount = new Set(rows.filter((r) => r.content_item_id).map((r) => r.content_item_id)).size;
  const costPerContent = contentCount > 0 ? totalMonth / contentCount : null;

  return (
    <div className="space-y-5 max-w-[1300px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Cost & Usage</h1>
          <p className="text-sm text-base-muted mt-0.5">Estimasi biaya AI dan penggunaan resource.</p>
        </div>
        <MockBadge label="semua nilai: estimasi dari job_runs" />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState text={error} /> : (
        <>
          <Card title="Ringkasan">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
                <div className="text-[11px] text-base-muted">Total 14 hari terakhir</div>
                <div className="text-lg font-semibold">${totalMonth.toFixed(2)}</div>
                <div className="text-[11px] text-base-muted">{fmtCurrencyIDR(totalMonth)}</div>
              </div>
              <div className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
                <div className="text-[11px] text-base-muted">Biaya per konten (estimasi)</div>
                <div className="text-lg font-semibold">{costPerContent != null ? `$${costPerContent.toFixed(3)}` : "-"}</div>
              </div>
              <div className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
                <div className="text-[11px] text-base-muted">Jumlah record biaya</div>
                <div className="text-lg font-semibold">{rows.length}</div>
              </div>
              <div className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
                <div className="text-[11px] text-base-muted">Tipe data</div>
                <div className="text-sm"><Badge tone="yellow">estimated</Badge></div>
              </div>
            </div>
          </Card>

          <Card title="Biaya per Workflow / Step">
            <div className="space-y-1.5">
              {byStep.map(([step, cost]) => (
                <div key={step} className="flex items-center justify-between text-sm border-b border-base-border/50 py-1.5 last:border-0">
                  <span>{step}</span>
                  <span className="font-medium">${cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Tren 14 Hari Terakhir">
            <div className="space-y-1">
              {byDay.map(([day, cost]) => (
                <div key={day} className="flex items-center gap-3 text-sm">
                  <span className="text-base-muted w-24">{day}</span>
                  <div className="flex-1 bg-base-panel2 rounded h-2 overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${Math.min(100, (cost / (byDay[0]?.[1] || 1)) * 100)}%` }} />
                  </div>
                  <span className="w-16 text-right">${cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>

          <p className="text-[11px] text-base-muted">
            Catatan metodologi: biaya per konten dihitung dari job_runs.cost_estimate (biaya per batch run) dibagi rata,
            bukan token usage aktual per item. Field token_input/token_output per konten belum diisi oleh S3-S8 —
            akan digantikan begitu prompt engineering mencatat usage granular per item.
          </p>
        </>
      )}
    </div>
  );
}
