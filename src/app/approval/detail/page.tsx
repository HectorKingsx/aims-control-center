"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, Badge, LoadingState, ErrorState, MockBadge, fmtDateID } from "@/components/ui";
import type { ContentOverviewRow } from "@/lib/types";
import { recordFounderDecision, type FounderAction } from "@/lib/actions";
import QcChecklist from "./QcChecklist";

interface CarouselDraft {
  hooks: unknown;
  slides: {
    title?: string;
    text?: string;
    bullets?: { icon?: string; text?: string; highlight?: string | null }[];
    stat_highlight?: { label?: string; value?: string } | null;
  }[] | null;
  caption: string | null;
  cta: string | null;
  source_note: string | null;
  needs_revision_note: string | null;
}

interface ProductionRow {
  image_urls: string[] | null;
  bundle_url: string | null;
  status: string | null;
}

const SCORE_FIELDS: { key: keyof ContentOverviewRow; label: string; mock: boolean }[] = [
  { key: "total_score", label: "Skor topik keseluruhan", mock: false },
  { key: "factual_score", label: "Akurasi faktual", mock: true },
  { key: "source_score", label: "Kualitas sumber", mock: false },
  { key: "communication_score", label: "Gaya komunikasi", mock: true },
  { key: "headline_score", label: "Kualitas headline", mock: true },
  { key: "explanation_score", label: "Kualitas penjelasan", mock: true },
  { key: "practical_relevance_score", label: "Relevansi praktis", mock: true },
  { key: "visual_score", label: "Keterbacaan visual", mock: true },
  { key: "brand_alignment_score", label: "Kesesuaian brand", mock: true },
];

function ApprovalDetailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") ?? "";
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [revisionInstruction, setRevisionInstruction] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  const { data, error, loading } = useSupabaseQuery<ContentOverviewRow[]>(
    () =>
      supabase.from("fcc_content_overview").select("*").eq("content_item_id", id) as unknown as PromiseLike<{
        data: ContentOverviewRow[] | null;
        error: { message: string } | null;
      }>,
    [id]
  );

  const draft = useSupabaseQuery<CarouselDraft[]>(
    () =>
      supabase
        .schema("s5")
        .from("carousel_drafts")
        .select("hooks, slides, caption, cta, source_note, needs_revision_note")
        .eq("content_item_id", id) as unknown as PromiseLike<{ data: CarouselDraft[] | null; error: { message: string } | null }>,
    [id]
  );

  const production = useSupabaseQuery<ProductionRow[]>(
    () =>
      supabase
        .schema("s8")
        .from("content_production")
        .select("image_urls, bundle_url, status")
        .eq("content_item_id", id) as unknown as PromiseLike<{ data: ProductionRow[] | null; error: { message: string } | null }>,
    [id]
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState text={error} />;
  const row = data?.[0];
  if (!row) return <ErrorState text="Konten tidak ditemukan" />;
  const cd = draft.data?.[0];
  const prod = production.data?.[0];
  const renderedImages = prod?.image_urls ?? [];

  async function handleAction(action: FounderAction) {
    if (action === "revise" && !showRevisionForm) {
      setShowRevisionForm(true);
      return;
    }
    setBusy(true);
    try {
      await recordFounderDecision({
        contentItemId: id,
        action,
        note: note || undefined,
        revisionInstruction: action === "revise" ? revisionInstruction : undefined,
      });
      router.push("/approval");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menyimpan keputusan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 max-w-[1200px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{row.title ?? "(tanpa judul)"}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge tone="accent">{row.brand_name ?? "The Daily Economics"}</Badge>
            <Badge tone="grey">{row.status}</Badge>
            {row.risk_level && (
              <Badge tone={row.risk_level === "HIGH" ? "red" : row.risk_level === "MEDIUM" ? "yellow" : "green"}>
                Risk {row.risk_level}
              </Badge>
            )}
            <span className="text-xs text-base-muted">Dibuat {fmtDateID(row.created_at)}</span>
          </div>
        </div>
      </div>

      <Card title="Ikhtisar Konten">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><div className="text-[11px] text-base-muted">Angle</div><div>{row.angle ?? "-"}</div></div>
          <div><div className="text-[11px] text-base-muted">Skor topik</div><div>{row.total_score ?? "-"}</div></div>
          <div><div className="text-[11px] text-base-muted">Revisi ke-</div><div>{row.revision_count}</div></div>
          <div><div className="text-[11px] text-base-muted">Prompt version</div><div>{row.prompt_version ?? <MockBadge label="belum tercatat" />}</div></div>
          <div><div className="text-[11px] text-base-muted">AI model</div><div>{row.ai_model ?? <MockBadge label="belum tercatat" />}</div></div>
          <div><div className="text-[11px] text-base-muted">Estimasi biaya</div><div>{row.estimated_cost != null ? `$${row.estimated_cost}` : <MockBadge label="belum tercatat" />}</div></div>
        </div>
      </Card>

      <Card title="Preview Konten Lengkap">
        {draft.loading ? (
          <LoadingState />
        ) : !cd ? (
          <p className="text-sm text-base-muted">Draft carousel belum tersedia untuk item ini.</p>
        ) : (
          <div className="space-y-4">
            {renderedImages.length > 0 ? (
              <div>
                <div className="text-[11px] text-base-muted mb-2">
                  Gambar hasil render S8 ({renderedImages.length} slide)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {renderedImages.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block border border-base-border rounded-lg overflow-hidden bg-base-panel2/40 hover:border-accent/50">
                      <img src={url} alt={`Slide ${i + 1}`} className="w-full aspect-[4/5] object-cover" loading="lazy" />
                      <div className="text-[10px] text-base-muted text-center py-1">Slide {i + 1}</div>
                    </a>
                  ))}
                </div>
              </div>
            ) : production.loading ? (
              <LoadingState />
            ) : (
              <p className="text-sm text-status-yellow">
                Gambar hasil render belum tersedia (S8 belum selesai atau gagal untuk item ini). Preview teks di bawah dari draft S5:
              </p>
            )}
            {renderedImages.length === 0 && cd.slides && cd.slides.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {cd.slides.map((s, i) => (
                  <div key={i} className="border border-base-border rounded-lg p-3 bg-base-panel2/40 aspect-[4/5] flex flex-col overflow-y-auto">
                    <div className="text-[10px] text-base-muted mb-1">Slide {i + 1}</div>
                    <div className="text-xs font-semibold mb-1">{s.title ?? ""}</div>
                    {s.stat_highlight?.value && (
                      <div className="text-sm font-bold text-accent mb-1">{s.stat_highlight.value}</div>
                    )}
                    {s.text && <div className="text-[11px] text-base-muted mb-1">{s.text}</div>}
                    {(s.bullets ?? []).map((b, bi) => (
                      <div key={bi} className="text-[10px] text-base-muted mb-1">
                        • {b.text ?? ""}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[11px] text-base-muted mb-1">Caption</div>
                <p className="whitespace-pre-wrap">{cd.caption ?? "-"}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] text-base-muted mb-1">CTA</div>
                  <p>{cd.cta ?? "-"}</p>
                </div>
                <div>
                  <div className="text-[11px] text-base-muted mb-1">Sumber</div>
                  <p className="text-xs text-base-muted">{cd.source_note ?? "-"}</p>
                </div>
                {row.bundle_url && (
                  <a href={row.bundle_url} target="_blank" rel="noreferrer" className="inline-block text-xs px-3 py-1.5 rounded-lg bg-accent text-black">
                    Download file final
                  </a>
                )}
              </div>
            </div>
            {cd.needs_revision_note && (
              <div className="text-xs text-status-yellow border border-status-yellow/30 rounded-lg p-2">
                Catatan revisi sebelumnya: {cd.needs_revision_note}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Skor Editorial">
          <div className="space-y-1.5">
            {SCORE_FIELDS.map((f) => {
              const val = row[f.key];
              return (
                <div key={String(f.key)} className="flex items-center justify-between text-sm border-b border-base-border/50 py-1.5 last:border-0">
                  <span>{f.label}</span>
                  <span className="flex items-center gap-1.5">
                    {val != null ? <span className="font-medium">{String(val)}</span> : <MockBadge label="belum ada" />}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="QC Checklist">
          <QcChecklist row={row} />
        </Card>
      </div>

      <Card title="Keputusan Founder">
        {showRevisionForm ? (
          <div className="space-y-2">
            <textarea
              value={revisionInstruction}
              onChange={(e) => setRevisionInstruction(e.target.value)}
              placeholder="Instruksi revisi (wajib diisi)..."
              className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent min-h-[80px]"
            />
            <div className="flex gap-2">
              <button
                disabled={busy || !revisionInstruction.trim()}
                onClick={() => handleAction("revise")}
                className="px-4 py-2 rounded-lg bg-status-yellow text-black text-sm font-medium disabled:opacity-50"
              >
                Kirim permintaan revisi
              </button>
              <button onClick={() => setShowRevisionForm(false)} className="px-4 py-2 rounded-lg border border-base-border text-sm">
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan (opsional)..."
              className="w-full bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <div className="flex flex-wrap gap-2">
              <button disabled={busy} onClick={() => handleAction("approve")} className="px-4 py-2 rounded-lg bg-status-green text-black text-sm font-medium disabled:opacity-50">Approve</button>
              <button disabled={busy} onClick={() => handleAction("approve_with_edits")} className="px-4 py-2 rounded-lg bg-status-green/70 text-black text-sm font-medium disabled:opacity-50">Approve dgn edit minor</button>
              <button disabled={busy} onClick={() => handleAction("revise")} className="px-4 py-2 rounded-lg bg-status-yellow text-black text-sm font-medium disabled:opacity-50">Minta revisi</button>
              <button disabled={busy} onClick={() => handleAction("reject")} className="px-4 py-2 rounded-lg bg-status-red text-white text-sm font-medium disabled:opacity-50">Reject</button>
              <button disabled={busy} onClick={() => handleAction("hold")} className="px-4 py-2 rounded-lg border border-base-border text-sm disabled:opacity-50">Hold</button>
              <button disabled={busy} onClick={() => handleAction("archive")} className="px-4 py-2 rounded-lg border border-base-border text-sm disabled:opacity-50">Archive</button>
            </div>
          </div>
        )}
        <p className="text-[11px] text-base-muted mt-3">
          Semua keputusan tercatat ke s7.review_actions (audit trail) dan mengubah status resmi di s4.content_items.
        </p>
      </Card>
    </div>
  );
}

export default function ApprovalDetailPage() {
  return (
    <Suspense fallback={<div className="text-sm text-base-muted p-6">Memuat...</div>}>
      <ApprovalDetailInner />
    </Suspense>
  );
}
