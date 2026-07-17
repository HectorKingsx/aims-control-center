import { Card } from "@/components/ui";

export default function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="space-y-4 max-w-[1000px]">
      <h1 className="text-xl font-semibold">{title}</h1>
      <Card>
        <div className="py-10 text-center">
          <div className="text-sm text-base-muted mb-1">Halaman ini belum diimplementasikan penuh.</div>
          <div className="text-xs text-base-muted/70">{note}</div>
        </div>
      </Card>
    </div>
  );
}
