import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL belum diatur di .env");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const [row] = await prisma.$queryRaw<{ ok: number; version: string }[]>`
      SELECT 1 AS ok, version() AS version
    `;
    console.log("✅ Koneksi PostgreSQL berhasil");
    console.log("   ", row.version);

    const setting = await prisma.storeSetting.upsert({
      where: { id: "main" },
      update: {},
      create: { id: "main" },
    });
    console.log("✅ Tabel store_settings dapat dibaca/ditulis");
    console.log(`    Toko: ${setting.storeName} | DP default: ${setting.dpPercentage}%`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Pengecekan database gagal:");
  console.error(err);
  process.exit(1);
});