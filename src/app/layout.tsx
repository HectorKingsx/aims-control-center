import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AIMS Founder Control Center",
  description: "Altera Intelligent Media System — Founder Control Center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
