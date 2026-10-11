import "server-only";

import { prisma } from "@/lib/db/prisma";
import { todayWib } from "@/lib/utils";

export type Period = { from: string; to: string }; // YYYY-MM-DD (WIB)

const DAY = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const utcMs = (d: string) => Date.parse(`${d}T00:00:00Z`);

export function shiftDate(date: string, days: number): string {
  return new Date(utcMs(date) + days * DAY).toISOString().slice(0, 10);
}

function validDate(v: string | undefined): string | null {
  return v && DATE_RE.test(v) && !Number.isNaN(utcMs(v)) ? v : null;
}

export function parsePeriod(
  rawFrom: string | undefined,
  rawTo: string | undefined,
  defaultDays = 30
): Period {
  let to = validDate(rawTo) ?? todayWib();
  let from = validDate(rawFrom) ?? shiftDate(to, -(defaultDays - 1));
  if (from > to) [from, to] = [to, from];
  if ((utcMs(to) - utcMs(from)) / DAY > 365) from = shiftDate(to, -365);
  return { from, to };
}

export function periodRange(p: Period) {
  return {
    gte: new Date(`${p.from}T00:00:00+07:00`),
    lte: new Date(`${p.to}T23:59:59.999+07:00`),
  };
}

const WIB_MS = 7 * 60 * 60 * 1000;
const wibDate = (d: Date) => new Date(d.getTime() + WIB_MS).toISOString().slice(0, 10);

/** "2026-10-11 14:30" menurut WIB. */
export function wibDateTime(d: Date): string {
  return new Date(d.getTime() + WIB_MS).toISOString().replace("T", " ").slice(0, 16);
}

export async function getPeriodStats(period: Period) {
  const range = periodRange(period);

  const [orders, queueGroups, completed, paymentGroups, outstanding, topItems] =
    await Promise.all([
      prisma.order.findMany({
        where: { createdAt: range },
        select: { createdAt: true, total: true, status: true },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({
        where: { status: "COMPLETED", completedAt: range },
        _sum: { total: true },
        _count: { _all: true },
      }),
      prisma.payment.groupBy({
        by: ["kind"],
        where: { status: "VERIFIED", paidAt: range },
        _sum: { amount: true },
      }),
      prisma.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true, paidAmount: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId", "productName"],
        where: { order: { status: { not: "CANCELLED" }, createdAt: range } },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
    ]);

  // Deret harian
  const daily: { date: string; orders: number; value: number }[] = [];
  const indexByDate = new Map<string, number>();
  for (let d = period.from; d <= period.to; d = shiftDate(d, 1)) {
    indexByDate.set(d, daily.length);
    daily.push({ date: d, orders: 0, value: 0 });
  }

  let orderValue = 0;
  let cancelledCount = 0;
  const periodStatus: Record<string, number> = {};

  for (const o of orders) {
    periodStatus[o.status] = (periodStatus[o.status] ?? 0) + 1;
    if (o.status === "CANCELLED") {
      cancelledCount++;
      continue;
    }
    orderValue += o.total;
    const i = indexByDate.get(wibDate(o.createdAt));
    if (i !== undefined) {
      daily[i].orders++;
      daily[i].value += o.total;
    }
  }

  const receivedNet = paymentGroups.reduce(
    (sum, g) => sum + (g.kind === "REFUND" ? -1 : 1) * (g._sum.amount ?? 0),
    0
  );

  return {
    period,
    totalOrders: orders.length,
    cancelledCount,
    orderValue,
    completedCount: completed._count._all,
    completedRevenue: completed._sum.total ?? 0,
    receivedNet,
    outstanding: (outstanding._sum.total ?? 0) - (outstanding._sum.paidAmount ?? 0),
    queue: Object.fromEntries(
      queueGroups.map((g) => [g.status, g._count._all])
    ) as Record<string, number>,
    periodStatus,
    daily,
    topProducts: topItems.map((t) => ({
      name: t.productName,
      quantity: t._sum.quantity ?? 0,
      revenue: t._sum.lineTotal ?? 0,
    })),
  };
}

export async function getLowStock(limit = 5) {
  const setting = await prisma.storeSetting.findUnique({
    where: { id: "main" },
    select: { lowStockThreshold: true },
  });
  const threshold = setting?.lowStockThreshold ?? 5;
  const where = { product: { archivedAt: null }, stock: { lte: threshold } };

  const [count, rows] = await Promise.all([
    prisma.productVariant.count({ where }),
    prisma.productVariant.findMany({
      where,
      orderBy: { stock: "asc" },
      take: limit,
      select: {
        id: true,
        size: true,
        stock: true,
        product: { select: { name: true } },
      },
    }),
  ]);

  return { threshold, count, rows };
}