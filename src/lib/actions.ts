"use client";
import { supabase } from "@/lib/supabase";

export type FounderAction = "approve" | "approve_with_edits" | "revise" | "reject" | "hold" | "archive";

const ACTION_TO_STATUS: Record<FounderAction, string> = {
  approve: "approved",
  approve_with_edits: "approved",
  revise: "revise",
  reject: "rejected",
  hold: "planned",
  archive: "archived",
};

const ACTION_TO_DECISION: Record<FounderAction, string> = {
  approve: "approved",
  approve_with_edits: "approved_with_edits",
  revise: "revision_requested",
  reject: "rejected",
  hold: "hold",
  archive: "archived",
};

const ACTION_TO_REVIEW_ACTION: Record<FounderAction, string> = {
  approve: "approve",
  approve_with_edits: "approve",
  revise: "revise",
  reject: "reject",
  hold: "revise",
  archive: "archive",
};

export async function recordFounderDecision(params: {
  contentItemId: string;
  action: FounderAction;
  note?: string;
  revisionInstruction?: string;
  revisionCategory?: string;
}) {
  const { contentItemId, action, note, revisionInstruction, revisionCategory } = params;

  // 1. Log to s7.review_actions (existing audit table — do not bypass)
  const { error: reviewErr } = await supabase.schema("s7").from("review_actions").insert({
    content_item_id: contentItemId,
    action: ACTION_TO_REVIEW_ACTION[action],
    note: note ?? null,
    actor_type: "founder",
  });
  if (reviewErr) throw new Error(`Gagal mencatat review_actions: ${reviewErr.message}`);

  // 2. Update s4.content_items status + new founder fields
  const { error: updateErr } = await supabase
    .schema("s4")
    .from("content_items")
    .update({
      status: ACTION_TO_STATUS[action],
      founder_decision: ACTION_TO_DECISION[action],
      founder_feedback: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contentItemId);
  if (updateErr) throw new Error(`Gagal update content_items: ${updateErr.message}`);

  // 3. If revision requested, log to s7.revision_requests + increment revision_count
  if (action === "revise" && revisionInstruction) {
    const { error: revErr } = await supabase.schema("s7").from("revision_requests").insert({
      content_item_id: contentItemId,
      category: revisionCategory ?? "general",
      instruction: revisionInstruction,
      requested_by: "founder",
    });
    if (revErr) throw new Error(`Gagal mencatat revision_requests: ${revErr.message}`);

    const { data: current } = await supabase.schema("s4").from("content_items").select("revision_count").eq("id", contentItemId).single();
    const nextCount = (current?.revision_count ?? 0) + 1;
    await supabase.schema("s4").from("content_items").update({ revision_count: nextCount }).eq("id", contentItemId);
  }
}
