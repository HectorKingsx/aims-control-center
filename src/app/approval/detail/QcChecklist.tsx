"use client";
import { Badge } from "@/components/ui";
import type { ContentOverviewRow } from "@/lib/types";

interface CheckItem {
  label: string;
  result: "pass" | "warning" | "fail" | "unknown";
}

// Maps available QC data (numeric_issues / qualifier_issues / other_issues jsonb arrays
// from public.qc_content_validations) onto the checklist the brief specifies.
// Items with no corresponding signal in qc_content_validations show as "unknown"
// rather than a fabricated pass — this is intentional per the mock-data rule.
function buildChecklist(row: ContentOverviewRow): CheckItem[] {
  const numericIssues = (row.numeric_issues as { type?: string }[] | null) ?? [];
  const qualifierIssues = (row.qualifier_issues as { type?: string }[] | null) ?? [];
  const otherIssues = (row.other_issues as { type?: string }[] | null) ?? [];
  const allIssues = [...numericIssues, ...qualifierIssues, ...otherIssues];

  const hasIssueType = (needle: string) =>
    allIssues.some((i) => (i.type ?? "").toLowerCase().includes(needle));

  const overallFromStatus: CheckItem["result"] =
    row.validation_status === "PASS" ? "pass" :
    row.validation_status === "PASS_WITH_WARNING" ? "warning" :
    row.validation_status === "BLOCKED" ? "fail" :
    row.validation_status === "NEEDS_REVISION" ? "warning" : "unknown";

  return [
    { label: "Angka penting punya konteks & tanggal", result: hasIssueType("numeric") ? "fail" : row.numeric_issues ? "pass" : "unknown" },
    { label: "Klaim didukung sumber", result: hasIssueType("unsupported") || hasIssueType("qualifier") ? "fail" : row.qualifier_issues ? "pass" : "unknown" },
    { label: "Fakta dan analisis terpisah jelas", result: hasIssueType("analysis") ? "warning" : "unknown" },
    { label: "Konten tidak duplikat", result: hasIssueType("duplicate") ? "fail" : "unknown" },
    { label: "Hasil keseluruhan QC engine", result: overallFromStatus },
    { label: "Kalimat lengkap (tidak terpotong)", result: "unknown" },
    { label: "Tidak ada text overflow", result: "unknown" },
    { label: "Caption tidak sekadar mengulang carousel", result: "unknown" },
    { label: "CTA relevan", result: "unknown" },
    { label: "Visual relevan & berlabel jika AI-generated", result: "unknown" },
  ];
}

const RESULT_STYLE: Record<CheckItem["result"], { tone: "green" | "yellow" | "red" | "grey"; text: string }> = {
  pass: { tone: "green", text: "Pass" },
  warning: { tone: "yellow", text: "Warning" },
  fail: { tone: "red", text: "Fail" },
  unknown: { tone: "grey", text: "Belum ada data" },
};

export default function QcChecklist({ row }: { row: ContentOverviewRow }) {
  const items = buildChecklist(row);
  return (
    <div className="space-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between text-sm border-b border-base-border/50 py-1.5 last:border-0">
          <span className="text-base-text">{item.label}</span>
          <Badge tone={RESULT_STYLE[item.result].tone}>{RESULT_STYLE[item.result].text}</Badge>
        </div>
      ))}
      <p className="text-[11px] text-base-muted pt-2">
        Item bertanda &quot;Belum ada data&quot; belum punya sinyal otomatis dari QC engine saat ini — ditampilkan apa adanya, bukan diasumsikan pass.
      </p>
    </div>
  );
}
