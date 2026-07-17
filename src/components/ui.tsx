export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-base-panel border border-base-border rounded-xl p-4 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-base-text">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "grey",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "grey" | "accent";
}) {
  const toneMap: Record<string, string> = {
    green: "bg-status-green/15 text-status-green",
    yellow: "bg-status-yellow/15 text-status-yellow",
    red: "bg-status-red/15 text-status-red",
    grey: "bg-base-panel2 text-base-muted",
    accent: "bg-accent/15 text-accent",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${toneMap[tone]}`}>
      {children}
    </span>
  );
}

export function MockBadge({ label = "estimasi" }: { label?: string }) {
  return (
    <span
      title="Belum ada data real dari pipeline untuk field ini — nilai ditampilkan sebagai estimasi/mock sampai stage terkait diperbarui."
      className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 cursor-help"
    >
      {label}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-sm text-base-muted py-8 text-center">{text}</div>
  );
}

export function ErrorState({ text }: { text: string }) {
  return (
    <div className="text-sm text-status-red py-8 text-center">{text}</div>
  );
}

export function LoadingState() {
  return (
    <div className="text-sm text-base-muted py-8 text-center animate-pulse">
      Memuat data...
    </div>
  );
}

export function fmtDateID(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtCurrencyIDR(n: number | null | undefined) {
  if (n == null) return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n * 15800);
}

export function fmtRelativeAge(iso: string | null | undefined) {
  if (!iso) return "-";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 36e5);
  if (hours < 1) return "<1 jam";
  if (hours < 24) return `${hours} jam`;
  return `${Math.floor(hours / 24)} hari`;
}
