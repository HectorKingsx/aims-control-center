"use client";
import { useMemo, useState } from "react";
import { useSupabaseQuery, supabase } from "@/hooks/useSupabaseQuery";
import { Card, Badge, EmptyState, LoadingState, ErrorState, fmtRelativeAge } from "@/components/ui";
import Link from "next/link";

interface ReviewRow {
  content_item_id: string;
  title: string | null;
  status: string | null;
  founder_decision: string | null;
  created_at: string;
  updated_at: string;
  image_urls: string[] | null;
  slide_count: number | null;
}

export default function ContentReviewPage() {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localApproved, setLocalApproved] = useState<Set<string>>(new Set());

  interface ContentItemRow {
    id: string; title: string | null; status: string | null; founder_decision: string | null;
    created_at: string; updated_at: string; slide_count: number | null;
  }
  interface ProductionRow {
    content_item_id: string; image_urls: string[] | null;
  }

  const { data, error, loading } = useSupabaseQuery<ReviewRow[]>(async () => {
    const itemsRes = await supabase
      .schema("s4")
      .from("content_items")
      .select("id, title, status, founder_decision, created_at, updated_at, slide_count")
      .eq("status", "produced")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (itemsRes.error) return { data: null, error: itemsRes.error };

    const items = itemsRes.data as ContentItemRow[];
    const ids = items.map((i) => i.id);

    const prodRes = await supabase
      .schema("s8")
      .from("content_production")
      .select("content_item_id, image_urls")
      .in("content_item_id", ids);
    if (prodRes.error) return { data: null, error: prodRes.error };

    const prodMap = new Map<string, string[] | null>();
    for (const p of prodRes.data as ProductionRow[]) prodMap.set(p.content_item_id, p.image_urls);

    const rows: ReviewRow[] = items.map((r) => ({
      content_item_id: r.id,
      title: r.title,
      status: r.status,
      founder_decision: r.founder_decision,
      created_at: r.created_at,
      updated_at: r.updated_at,
      slide_count: r.slide_count,
      image_urls: prodMap.get(r.id) ?? null,
    }));

    return { data: rows, error: null };
  });

  const rows = useMemo(() => {
    let r = data ?? [];
    if (search.trim()) r = r.filter((x) => (x.title ?? "").toLowerCase().includes(search.toLowerCase()));
    return r;
  }, [data, search]);

  async function handleApproveForManualPublish(id: string) {
    setBusyId(id);
    try {
      const { error: updateErr } = await supabase
        .schema("s4")
        .from("content_items")
        .update({ founder_decision: "approved_for_manual_publish", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (updateErr) throw new Error(updateErr.message);

      await supabase.schema("s7").from("review_actions").insert({
        content_item_id: id,
        action: "approve",
        note: "Disetujui untuk upload manual ke Instagram (bukan auto-publish)",
        reason_category: "manual_publish_ready",
        actor_type: "founder",
      });

      setLocalApproved((prev) => new Set(prev).add(id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal menyimpan approval");
    } finally {
      setBusyId(null);
    }
  }

  const approvedCount = rows.filter(
    (r) => r.founder_decision === "approved_for_manual_publish" || localApproved.has(r.content_item_id)
  ).length;

  return (
    <div className="space-y-4 max-w-[1500px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Content Review</h1>
          <p className="text-sm text-base-muted mt-0.5">
            Konten yang sudah selesai diproduksi (S8) dan siap ditinjau sebelum upload manual ke Instagram.
          </p>
        </div>
        <Badge tone="accent">{approvedCount} / {rows.length} sudah disetujui</Badge>
      </div>

      <Card>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari judul konten..."
          className="bg-base-panel2 border border-base-border rounded-lg px-3 py-2 text-sm w-full outline-none focus:border-accent"
        />
      </Card>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState text={error} />
      ) : rows.length === 0 ? (
        <EmptyState text="Belum ada konten yang selesai diproduksi." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((r) => {
            const cover = r.image_urls?.[0];
            const isApproved = r.founder_decision === "approved_for_manual_publish" || localApproved.has(r.content_item_id);
            return (
              <div key={r.content_item_id} className="border border-base-border rounded-xl overflow-hidden bg-base-panel">
                <Link href={`/approval/detail?id=${r.content_item_id}`} className="block">
                  <div className="aspect-square bg-base-panel2 relative">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt={r.title ?? ""} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-base-muted">
                        Gambar belum tersedia
                      </div>
                    )}
                    {isApproved && (
                      <div className="absolute top-2 right-2">
                        <Badge tone="green">Siap upload</Badge>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/approval/detail?id=${r.content_item_id}`}>
                    <div className="text-sm font-medium line-clamp-2 mb-1 hover:text-accent">{r.title ?? "(tanpa judul)"}</div>
                  </Link>
                  <div className="flex items-center justify-between text-[11px] text-base-muted mb-2">
                    <span>{r.slide_count ?? r.image_urls?.length ?? "-"} slide</span>
                    <span>{fmtRelativeAge(r.updated_at)}</span>
                  </div>
                  <button
                    disabled={busyId === r.content_item_id || isApproved}
                    onClick={() => handleApproveForManualPublish(r.content_item_id)}
                    className={`w-full text-xs px-3 py-2 rounded-lg font-medium disabled:opacity-50 ${
                      isApproved ? "bg-status-green/20 text-status-green" : "bg-accent text-white hover:bg-accent/90"
                    }`}
                  >
                    {isApproved ? "Disetujui untuk upload" : "Approve untuk upload"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-base-muted">
        Tombol ini menandai konten sebagai sudah ditinjau dan siap diupload manual oleh Vincent ke Instagram —
        tidak memicu publish otomatis apa pun (S9 belum aktif). Keputusan tercatat di s7.review_actions.
      </p>
    </div>
  );
}
