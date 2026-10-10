import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Dashboard Admin", template: "%s | Admin SOLESPACE" },
  robots: { index: false, follow: false },
};

function ShellSkeleton() {
  return (
    <div className="min-h-screen bg-mist" aria-busy="true" aria-label="Memuat">
      <div className="fixed inset-y-0 left-0 hidden w-64 bg-ink lg:block" />
      <div className="lg:pl-64">
        <div className="h-16 border-b border-stone-line bg-white" />
        <div className="space-y-4 p-6">
          <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
          <div className="h-32 animate-pulse rounded-xl bg-stone-200" />
        </div>
      </div>
    </div>
  );
}

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}