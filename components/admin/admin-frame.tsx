"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  ChevronRight as Crumb,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  ready: boolean; // false = halaman belum dibuat
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, ready: true },
  { label: "Produk", href: "/admin/products", icon: Package, ready: true },
  { label: "Kategori", href: "/admin/categories", icon: Tag, ready: true },
  { label: "Merek", href: "/admin/brands", icon: Tag, ready: true },
  { label: "Pesanan", href: "/admin/orders", icon: ShoppingBag, ready: false },
  { label: "Pembayaran", href: "/admin/payments", icon: Wallet, ready: false },
  { label: "Pelanggan", href: "/admin/customers", icon: Users, ready: false },
  { label: "Stok", href: "/admin/inventory", icon: Boxes, ready: false },
  { label: "Laporan", href: "/admin/reports", icon: ChartColumn, ready: false },
  { label: "Pengaturan", href: "/admin/settings", icon: Settings, ready: false },
  { label: "Riwayat Aktivitas", href: "/admin/activity-logs", icon: History, ready: false },
];

const CRUMB_LABELS: Record<string, string> = Object.fromEntries(
  NAV.map((n) => [n.href.split("/")[2], n.label])
);

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean).slice(1); // buang "admin"

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
      <span className="text-neutral-500">Admin</span>
      {segments.map((seg, i) => (
        <span key={seg + i} className="flex items-center gap-1.5">
          <Crumb className="size-3.5 text-neutral-400" aria-hidden />
          <span
            className={cn(
              i === segments.length - 1
                ? "font-semibold text-ink"
                : "text-neutral-500"
            )}
          >
            {CRUMB_LABELS[seg] ?? seg}
          </span>
        </span>
      ))}
    </nav>
  );
}

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");

        const content = (
          <>
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && !item.ready && (
              <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
                Segera
              </span>
            )}
          </>
        );

        const base =
          "flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition";

        return (
          <li key={item.href}>
            {item.ready ? (
              <Link
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={cn(
                  base,
                  active
                    ? "bg-white text-ink font-semibold"
                    : "text-neutral-300 hover:bg-white/10 hover:text-white"
                )}
              >
                {content}
              </Link>
            ) : (
              <span
                aria-disabled="true"
                title={collapsed ? `${item.label} (segera hadir)` : undefined}
                className={cn(base, "cursor-not-allowed text-neutral-500")}
              >
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function AdminFrame({
  adminName,
  adminEmail,
  children,
}: {
  adminName: string;
  adminEmail: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-mist">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col bg-ink text-white transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <span className="font-display text-lg font-extrabold tracking-tight">
              SOLESPACE
            </span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/10",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <ChevronLeft className="size-4" aria-hidden />
            )}
          </button>
        </div>
        <nav aria-label="Menu admin" className="flex-1 overflow-y-auto px-3 py-2">
          <SidebarNav collapsed={collapsed} />
        </nav>
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink text-white">
            <div className="flex h-16 items-center justify-between px-4">
              <span className="font-display text-lg font-extrabold">
                SOLESPACE
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu"
                className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <nav aria-label="Menu admin" className="flex-1 overflow-y-auto px-3 py-2">
              <SidebarNav
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </nav>
          </aside>
        </div>
      )}

      {/* Konten */}
      <div
        className={cn(
          "transition-[padding] duration-200",
          collapsed ? "lg:pl-[72px]" : "lg:pl-64"
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu"
              className="flex size-9 items-center justify-center rounded-lg border border-stone-line lg:hidden"
            >
              <Menu className="size-4" aria-hidden />
            </button>
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{adminName}</p>
              <p className="text-xs text-neutral-500">{adminEmail}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-9 items-center gap-2 rounded-lg border border-stone-line px-3 text-sm font-medium transition hover:bg-mist"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}