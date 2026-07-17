"use client";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, LoadingState, ErrorState, MockBadge, fmtCurrencyIDR } from "@/components/ui";

interface CostRecordRow {
  cost: number;
  step: string | null;
  created_at: string;
  cost_type: string;
}

export default function CostSummary() {
  const { data, error, loading } = useSupabaseQuery<CostRecordRow[]>(() =>
    supabase.from("cost_records").select("cost, step, created_at, cost_type").limit(2000) as unknown as PromiseLike<{
      data: CostRecordRow[] | null;
      error: { message: string } | null;
    }>
  );

  if (loading) return <Card title="Ringkasan Biaya"><LoadingState /></Card>;
  if (error) return <Card title="Ringkasan Biaya"><ErrorState text={error} /></Card>;

  const rows = data ?? [];
  const now = new Date();
  const todayStr = now.toDateString();
  const monthStr = `${now.getFullYear()}-${now.getMonth()}`;

  const costToday = rows.filter((r) => new Date(r.created_at).toDateString() === todayStr).reduce((s, r) => s + Number(r.cost), 0);
  const costMonth = rows.filter((r) => {
    const d = new Date(r.created_at);
    return `${d.getFullYear()}-${d.getMonth()}` === monthStr;
  }).reduce((s, r) => s + Number(r.cost), 0);

  const byStep = new Map<string, number>();
  for (const r of rows) {
    if (!r.step) continue;
    byStep.set(r.step, (byStep.get(r.step) ?? 0) + Number(r.cost));
  }
  const mostExpensive = [...byStep.entries()].sort((a, b) => b[1] - a[1])[0];

  const budget = 500; // USD monthly budget placeholder — MOCK, no budget field configured in brand_settings yet
  const remaining = budget - costMonth;

  return (
    <Card title="Ringkasan Biaya" action={<MockBadge label="budget: mock" />}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
          <div className="text-[11px] text-base-muted">Biaya hari ini</div>
          <div className="text-lg font-semibold">${costToday.toFixed(2)}</div>
          <div className="text-[11px] text-base-muted">{fmtCurrencyIDR(costToday)}</div>
        </div>
        <div className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
          <div className="text-[11px] text-base-muted">Biaya bulan ini</div>
          <div className="text-lg font-semibold">${costMonth.toFixed(2)}</div>
          <div className="text-[11px] text-base-muted">{fmtCurrencyIDR(costMonth)}</div>
        </div>
        <div className="border border-base-border rounded-lg p-3 bg-base-panel2/40">
          <div className="text-[11px] text-base-muted">Sisa budget bulanan</div>
          <div className={`text-lg font-semibold ${remaining < 50 ? "text-status-red" : ""}`}>${remaining.toFixed(2)}</div>
          <div className="text-[11px] text-base-muted">dari budget ${budget} (mock)</div>
        </div>
        {mostExpensive && (
          <div className="border border-base-border rounded-lg p-3 bg-base-panel2/40 col-span-2 md:col-span-3">
            <div className="text-[11px] text-base-muted">Workflow paling mahal</div>
            <div className="text-sm font-medium">{mostExpensive[0]} — ${mostExpensive[1].toFixed(2)}</div>
          </div>
        )}
      </div>
    </Card>
  );
}
