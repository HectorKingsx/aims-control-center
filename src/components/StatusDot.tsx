export type DotColor = "green" | "yellow" | "red" | "grey";

const COLOR_MAP: Record<DotColor, string> = {
  green: "bg-status-green",
  yellow: "bg-status-yellow",
  red: "bg-status-red",
  grey: "bg-status-grey",
};

export function statusToColor(status: string | null | undefined): DotColor {
  if (!status) return "grey";
  const s = status.toLowerCase();
  if (["success", "pass", "approved", "published", "normal"].includes(s)) return "green";
  if (["partial", "pass_with_warning", "needs_revision", "warning", "medium"].includes(s)) return "yellow";
  if (["failed", "blocked", "blocked_qc", "rejected", "high", "error"].includes(s)) return "red";
  return "grey";
}

export default function StatusDot({ color, label }: { color: DotColor; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`h-2 w-2 rounded-full ${COLOR_MAP[color]}`} />
      {label && <span className="text-base-muted">{label}</span>}
    </span>
  );
}
