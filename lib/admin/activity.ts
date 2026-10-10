import "server-only";

import type { Prisma } from "@/generated/prisma/client";

export async function logActivity(
  db: Prisma.TransactionClient,
  entry: {
    adminId: string;
    action: string; // contoh: "category.create"
    entityType: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
  }
) {
  await db.activityLog.create({
    data: {
      adminId: entry.adminId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata,
    },
  });
}