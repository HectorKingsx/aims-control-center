// Shared types for Founder Control Center.
// Fields marked MOCK below are not yet emitted by the pipeline (S3/S5/etc).
// They render with a visible "estimasi/mock" badge in the UI instead of being
// silently presented as real data. Replace the mock source once the
// corresponding stage starts writing real values — no UI rewrite needed.

export type SystemStepStatus = "success" | "partial" | "failed" | "blocked_qc";

export interface JobRunRow {
  step: string;
  status: SystemStepStatus;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  cost_estimate: number | null;
  tokens_used: number | null;
  error_excerpt: string | null;
}

export interface ContentOverviewRow {
  content_item_id: string;
  brand_id: string | null;
  brand_name: string | null;
  title: string | null;
  angle: string | null;
  status: string | null;
  priority: string | null;
  founder_decision: string | null;
  founder_feedback: string | null;
  revision_count: number;
  publish_deadline: string | null;
  created_at: string;
  updated_at: string;
  prompt_version: string | null;
  ai_model: string | null;
  estimated_cost: number | null;
  total_score: number | null;
  llm_total_score: number | null;
  factual_score: number | null; // MOCK — not yet emitted by S3
  source_score: number | null; // real, backfilled from credibility_tier
  communication_score: number | null; // MOCK
  headline_score: number | null; // MOCK
  explanation_score: number | null; // MOCK
  practical_relevance_score: number | null; // MOCK
  visual_score: number | null; // MOCK
  brand_alignment_score: number | null; // MOCK
  validation_status: "PASS" | "PASS_WITH_WARNING" | "NEEDS_REVISION" | "BLOCKED" | null;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | null;
  numeric_issues: unknown[] | null;
  qualifier_issues: unknown[] | null;
  other_issues: unknown[] | null;
  qc_checked_at: string | null;
  draft_qc_status: string | null;
  needs_revision_note: string | null;
  bundle_url: string | null;
  production_status: string | null;
  publish_status: string | null;
  permalink: string | null;
  published_at: string | null;
}

export interface DailyKpiRow {
  report_date: string;
  topics_discovered_today: number;
  topics_passed_scoring_today: number;
  content_generated_today: number;
  content_waiting_approval: number;
  content_approved_today: number;
  content_revision_today: number;
  content_rejected_today: number;
  content_ready_to_publish: number;
  content_published_today: number;
  failed_processes_today: number;
  avg_quality_score_today: number | null;
  estimated_cost_today: number | null;
}
