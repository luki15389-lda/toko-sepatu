import type { Metadata } from "next";
import Link from "next/link";
import { Pager } from "@/components/admin/pager";
import {
  ACTIVITY_GROUPS,
  ACTIVITY_LABEL,
  summarizeMetadata,
} from "@/lib/admin/activity-labels";
import { requireAdmin } from "@/lib/auth/session";
import type { RawSearchParams } from "@/lib/catalog";
import { prisma } from "@/lib/db/prisma";
import { formatTanggalWaktu } from "@/lib/utils";

export const metadata: Metadata = { title: "Riwayat Aktivitas" };

const PAGE_SIZE = 30;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  await requireAdmin();
  const raw = await searchParams;

  const group = ACTIVITY_GROUPS.find((g) => g.value === first(raw.group))?.value ?? "";
  const pageRaw = first(raw.page);
  const pageWanted = pageRaw && /^\d{1,4}$/.test(pageRaw) ? Math.max(1, Number(pageRaw)) : 1;

  const where = group ? { action: { startsWith: `${group}.` } } : {};

  const total = await prisma.activityLog.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageWanted, totalPages);

  const rows = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { admin: { select: { name: true } } },
  });

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (group) params.set("group", group);
    if (p > 1) params.set("page", String(p));
    const s = params.toString();
    return `/admin/activity-logs${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Riwayat aktivitas</h1>
        <p className="mt-1 text-sm text-neutral-500">{total} catatan aktivitas admin.</p>
      </div>

      <form action="/admin/activity-logs" method="get" className="flex gap-3 rounded-2xl border border-stone-line bg-white p-4">
        <label htmlFor="a-group" className="sr-only">Jenis aktivitas</label>
        <select id="a-group" name="group" defaultValue={group} className="h-10 w-full max-w-xs rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-ink">
          {ACTIVITY_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-paper hover:bg-neutral-800">Terapkan</button>
        <Link href="/admin/activity-logs" className="flex h-10 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold hover:border-ink">Reset</Link>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center text-sm text-neutral-600">
          Belum ada aktivitas yang tercatat.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Waktu</th>
                <th scope="col" className="px-5 py-3 font-semibold">Admin</th>
                <th scope="col" className="px-5 py-3 font-semibold">Aktivitas</th>
                <th scope="col" className="px-5 py-3 font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-line">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-neutral-600">{formatTanggalWaktu(a.createdAt)}</td>
                  <td className="px-5 py-3">{a.admin?.name ?? "Sistem"}</td>
                  <td className="px-5 py-3 font-semibold">{ACTIVITY_LABEL[a.action] ?? a.action}</td>
                  <td className="px-5 py-3 text-xs text-neutral-600">{summarizeMetadata(a.metadata)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} totalPages={totalPages} hrefFor={hrefFor} />
    </div>
  );
}