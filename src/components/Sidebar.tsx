"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  placeholder?: boolean;
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Command Center", href: "/" }],
  },
  {
    title: "Editorial",
    items: [
      { label: "Founder Approval", href: "/approval" },
      { label: "Content Pipeline", href: "/pipeline" },
      { label: "Content Review", href: "/content-review" },
      { label: "Topics", href: "/topics", placeholder: true },
      { label: "Editorial Quality", href: "/quality" },
    ],
  },
  {
    title: "Delivery",
    items: [
      { label: "Production", href: "/production", placeholder: true },
      { label: "Publishing", href: "/publishing", placeholder: true },
      { label: "Analytics", href: "/analytics", placeholder: true },
      { label: "Learning", href: "/learning", placeholder: true },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "System Operations", href: "/system" },
      { label: "Cost & Usage", href: "/cost" },
    ],
  },
  {
    title: "Settings",
    items: [{ label: "Settings", href: "/settings", placeholder: true }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col border-r border-base-border bg-base-panel">
      <div className="px-5 py-5 border-b border-base-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center font-bold text-black text-sm">
            A
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">AIMS</div>
            <div className="text-[11px] text-base-muted leading-tight">Founder Control Center</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV.map((group) => (
          <div key={group.title}>
            <div className="px-2 mb-1.5 text-[11px] uppercase tracking-wide text-base-muted font-medium">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-accent/15 text-white font-medium"
                        : "text-base-muted hover:bg-base-panel2 hover:text-base-text"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.placeholder && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-base-panel2 text-base-muted">
                        soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-base-border text-[11px] text-base-muted">
        The Daily Economics
        <div className="text-base-muted/70">Multi-brand ready</div>
      </div>
    </aside>
  );
}
