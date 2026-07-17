"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { LoadingState, ErrorState } from "@/components/ui";

interface Bullet {
  icon?: string;
  text?: string;
  highlight?: string | null;
}
interface Slide {
  title?: string;
  text?: string;
  bullets?: Bullet[];
  stat_highlight?: { label?: string; value?: string } | null;
  slide_number?: number;
}
interface CarouselDraft {
  slides: Slide[] | null;
  caption: string | null;
  cta: string | null;
  source_note: string | null;
}
interface ProductionRow {
  image_urls: string[] | null;
}

const ICON_MAP: Record<string, string> = {
  clipboard: "\u{1F4CB}", lightbulb: "\u{1F4A1}", trend_up: "\u{1F4C8}", trend_down: "\u{1F4C9}",
  warning: "⚠️", target: "\u{1F3AF}", people: "\u{1F465}", quote: "\u{1F4AC}",
  calendar: "\u{1F4C5}", search: "\u{1F50D}", money: "\u{1F4B0}", co2: "\u{1F32B}️",
  leaf: "\u{1F343}", droplet: "\u{1F4A7}", positive: "✅",
};

export default function ContentPreviewModal({
  contentItemId,
  title,
  onClose,
}: {
  contentItemId: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const draft = useSupabaseQuery<CarouselDraft[]>(
    () =>
      supabase
        .schema("s5")
        .from("carousel_drafts")
        .select("slides, caption, cta, source_note")
        .eq("content_item_id", contentItemId) as unknown as PromiseLike<{ data: CarouselDraft[] | null; error: { message: string } | null }>,
    [contentItemId]
  );
  const production = useSupabaseQuery<ProductionRow[]>(
    () =>
      supabase
        .schema("s8")
        .from("content_production")
        .select("image_urls")
        .eq("content_item_id", contentItemId) as unknown as PromiseLike<{ data: ProductionRow[] | null; error: { message: string } | null }>,
    [contentItemId]
  );

  const cd = draft.data?.[0];
  const images = production.data?.[0]?.image_urls ?? [];
  const slides = cd?.slides ?? [];
  const loading = draft.loading || production.loading;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 md:p-8" onClick={onClose}>
      <div
        className="bg-base-bg border border-base-border rounded-xl max-w-5xl w-full my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-base-border">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-xs text-base-muted mt-1">
              {slides.length || images.length} slide
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-base-border flex items-center justify-center text-base-muted hover:text-base-text hover:border-accent/50"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <LoadingState />
          ) : draft.error ? (
            <ErrorState text={draft.error} />
          ) : (
            <>
              <div className="flex gap-3 overflow-x-auto pb-3">
                {images[0] && (
                  <div className="shrink-0 w-[220px] rounded-lg overflow-hidden border border-base-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={images[0]} alt="Cover" className="w-full aspect-[4/5] object-cover" />
                  </div>
                )}
                {slides.slice(1).map((s, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-[220px] rounded-lg bg-[#F7F7F7] text-black p-4 flex flex-col aspect-[4/5] overflow-y-auto"
                  >
                    <div className="text-sm font-bold uppercase leading-snug mb-1">{s.title ?? ""}</div>
                    <div className="w-8 h-1 bg-accent mb-3" />
                    {s.stat_highlight?.value && (
                      <div className="text-lg font-bold text-accent mb-2">{s.stat_highlight.value}</div>
                    )}
                    <div className="space-y-2 flex-1">
                      {(s.bullets ?? []).map((b, bi) => (
                        <div key={bi} className="flex gap-2 text-[11px] leading-snug">
                          <span>{b.icon ? ICON_MAP[b.icon] ?? "•" : "•"}</span>
                          <span
                            className={
                              b.highlight === "positive"
                                ? "text-green-700 font-medium"
                                : b.highlight === "negative"
                                ? "text-red-700 font-medium"
                                : ""
                            }
                          >
                            {b.text ?? ""}
                          </span>
                        </div>
                      ))}
                    </div>
                    {cd?.source_note && (
                      <div className="text-[9px] text-gray-500 mt-2 pt-2 border-t border-gray-300">
                        Sumber: {cd.source_note.split(" - ")[0] ?? cd.source_note}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="text-[11px] uppercase tracking-wide text-base-muted mb-2">Caption &amp; CTA</div>
                <div className="border border-base-border rounded-lg p-4 bg-base-panel space-y-3 text-sm">
                  <p className="whitespace-pre-wrap">{cd?.caption ?? "-"}</p>
                  {cd?.cta && <p className="text-accent font-medium">{cd.cta}</p>}
                  {cd?.source_note && <p className="text-xs text-base-muted">Sumber: {cd.source_note}</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
