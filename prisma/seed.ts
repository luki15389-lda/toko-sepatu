import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL belum diatur di .env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const PLACEHOLDER = "/placeholder-shoe.svg";
const SIZES = ["39", "40", "41", "42", "43", "44"];
const BASE_STOCK = [8, 12, 10, 6, 3, 0]; // dirotasi per produk agar variatif

// ---------------------------------------------------------------
// Admin awal
// ---------------------------------------------------------------
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim() || "Admin";
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!email) {
    throw new Error("ADMIN_EMAIL belum diatur di .env");
  }
  if (password.length < 12) {
    throw new Error(
      "ADMIN_PASSWORD wajib diisi di .env dan minimal 12 karakter."
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`• Admin ${email} sudah ada (password tidak diubah)`);
    return;
  }

  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN" },
  });
  console.log(`✅ Admin dibuat: ${email}`);
}

// ---------------------------------------------------------------
// Pengaturan toko & halaman informasi
// ---------------------------------------------------------------
async function seedSettings() {
  await prisma.storeSetting.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      tagline: "Sneakers premium, ambil langsung di toko.",
      description:
        "SOLESPACE menyediakan sneakers pilihan dengan pelayanan personal. Pesan online, konfirmasi lewat WhatsApp, lalu ambil di toko.",
      address: "Jl. Contoh Raya No. 12, Pati, Jawa Tengah",
      openingHours: "Senin - Sabtu, 10.00 - 20.00 WIB\nMinggu, 12.00 - 18.00 WIB",
      pickupInstructions:
        "Tunjukkan nomor pesanan kepada kasir. Pesanan diserahkan setelah transaksi terkonfirmasi.",
      announcementText: "Pesan online, ambil di toko. Konfirmasi cepat via WhatsApp.",
      promoBannerTitle: "Koleksi Terbaru Telah Tiba",
      promoBannerText: "Temukan sneakers pilihan dengan stok terbatas.",
      footerText: "© SOLESPACE. Seluruh hak dilindungi.",
      paymentInstructions: "Isi informasi rekening di menu Pengaturan Toko.",
    },
  });
  console.log("✅ Pengaturan toko siap");

  const pages = [
    {
      slug: "about",
      title: "Tentang Kami",
      content:
        "SOLESPACE adalah toko sepatu yang berfokus pada sneakers berkualitas. Kami percaya sepatu yang tepat dimulai dari pelayanan yang tepat.",
    },
    {
      slug: "contact",
      title: "Kontak",
      content:
        "Hubungi kami lewat WhatsApp atau datang langsung ke toko pada jam operasional.",
    },
    {
      slug: "faq",
      title: "Pertanyaan yang Sering Diajukan",
      content:
        "**Bagaimana cara memesan?**\nPilih produk, isi data checkout, lalu kirim pesan konfirmasi ke WhatsApp penjual.\n\n**Apakah pesanan bisa dikirim?**\nSaat ini pesanan hanya dapat diambil langsung di toko.\n\n**Apakah harus bayar DP?**\nPenjual akan menyampaikan ketentuan DP saat konfirmasi. Pembayaran penuh juga dapat disetujui penjual.",
    },
    {
      slug: "kebijakan-pemesanan",
      title: "Kebijakan Pemesanan",
      content:
        "Pesanan dianggap sah setelah dikonfirmasi penjual. Stok ditahan selama pesanan aktif. Pembayaran hanya dianggap diterima setelah diverifikasi admin.",
    },
    {
      slug: "kebijakan-pembatalan",
      title: "Kebijakan Pembatalan",
      content:
        "Pesanan dapat dibatalkan sebelum diserahkan. Ketentuan pengembalian DP mengikuti kesepakatan dengan penjual.",
    },
    {
      slug: "kebijakan-pengembalian",
      title: "Kebijakan Pengembalian Barang",
      content:
        "Pengembalian barang mengikuti ketentuan toko. Hubungi penjual melalui WhatsApp sebelum membawa barang ke toko.",
    },
  ];

  for (const page of pages) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }
  console.log("✅ Halaman informasi siap");
}

// ---------------------------------------------------------------
// Merek, kategori, produk
// ---------------------------------------------------------------
async function seedCatalog() {
  const brands = await Promise.all(
    [
      { name: "Stride Lab", slug: "stride-lab", description: "Sneakers performa harian." },
      { name: "Northpace", slug: "northpace", description: "Sepatu lari dan outdoor ringan." },
      { name: "Urban Sole Co", slug: "urban-sole-co", description: "Gaya kasual urban." },
    ].map((b) =>
      prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: b })
    )
  );
  const brand = Object.fromEntries(brands.map((b) => [b.slug, b.id]));

  const categories = await Promise.all(
    [
      { name: "Sneakers", slug: "sneakers", description: "Sneakers gaya hidup." },
      { name: "Running", slug: "running", description: "Sepatu lari." },
      { name: "Basket", slug: "basket", description: "Sepatu basket." },
      { name: "Kasual", slug: "kasual", description: "Sepatu santai harian." },
    ].map((c) =>
      prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
    )
  );
  const category = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const products = [
    {
      name: "Stride Court Low",
      slug: "stride-court-low",
      sku: "SLS-SCL-001",
      brand: "stride-lab",
      category: "sneakers",
      price: 899000,
      discountPrice: null,
      featured: true,
      description:
        "Sneakers low-top bersih dengan upper kulit sintetis dan sol karet empuk. Mudah dipadukan untuk kegiatan sehari-hari.",
      material: "Kulit sintetis, sol karet",
    },
    {
      name: "Stride Court High",
      slug: "stride-court-high",
      sku: "SLS-SCH-002",
      brand: "stride-lab",
      category: "basket",
      price: 1199000,
      discountPrice: 999000,
      featured: true,
      description:
        "Siluet high-top dengan penyangga pergelangan kaki dan bantalan responsif untuk permainan maupun gaya santai.",
      material: "Kulit sintetis, mesh, sol karet",
    },
    {
      name: "Northpace Aero Run",
      slug: "northpace-aero-run",
      sku: "SLS-NAR-003",
      brand: "northpace",
      category: "running",
      price: 1349000,
      discountPrice: null,
      featured: true,
      description:
        "Sepatu lari ringan dengan midsole responsif dan upper mesh bernapas untuk latihan harian.",
      material: "Mesh engineered, midsole EVA",
    },
    {
      name: "Northpace Trail Lite",
      slug: "northpace-trail-lite",
      sku: "SLS-NTL-004",
      brand: "northpace",
      category: "running",
      price: 1499000,
      discountPrice: 1299000,
      featured: false,
      description:
        "Cengkeraman kuat untuk jalur tanah dan aspal. Ringan, stabil, dan nyaman untuk jarak menengah.",
      material: "Mesh, outsole karet bergerigi",
    },
    {
      name: "Urban Sole Classic",
      slug: "urban-sole-classic",
      sku: "SLS-USC-005",
      brand: "urban-sole-co",
      category: "kasual",
      price: 699000,
      discountPrice: null,
      featured: false,
      description:
        "Sepatu kasual klasik berbahan kanvas tebal dengan sol vulkanisir yang awet.",
      material: "Kanvas, sol karet vulkanisir",
    },
    {
      name: "Urban Sole Walker",
      slug: "urban-sole-walker",
      sku: "SLS-USW-006",
      brand: "urban-sole-co",
      category: "kasual",
      price: 799000,
      discountPrice: 699000,
      featured: false,
      description:
        "Nyaman dipakai berjam-jam dengan insole empuk dan siluet minimalis.",
      material: "Suede sintetis, insole foam",
    },
    {
      name: "Stride Daily Runner",
      slug: "stride-daily-runner",
      sku: "SLS-SDR-007",
      brand: "stride-lab",
      category: "running",
      price: 999000,
      discountPrice: null,
      featured: true,
      description:
        "Pilihan harian untuk lari santai dan aktivitas luar ruangan dengan bantalan seimbang.",
      material: "Mesh, midsole EVA",
    },
    {
      name: "Northpace Street Mid",
      slug: "northpace-street-mid",
      sku: "SLS-NSM-008",
      brand: "northpace",
      category: "sneakers",
      price: 1099000,
      discountPrice: null,
      featured: false,
      description:
        "Sneakers mid-top bergaya street dengan detail reflektif dan sol tebal.",
      material: "Kulit sintetis, detail reflektif",
    },
  ];

  for (const [index, p] of products.entries()) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        brandId: brand[p.brand],
        categoryId: category[p.category],
        description: p.description,
        material: p.material,
        price: p.price,
        discountPrice: p.discountPrice,
        isPublished: true,
        isFeatured: p.featured,
        images: {
          create: [
            { url: PLACEHOLDER, alt: p.name, sortOrder: 0, isPrimary: true },
          ],
        },
      },
    });

    for (const [i, size] of SIZES.entries()) {
      const sku = `${p.sku}-${size}`;
      const exists = await prisma.productVariant.findUnique({ where: { sku } });
      if (exists) continue;

      const stock = BASE_STOCK[(i + index) % BASE_STOCK.length];

      await prisma.$transaction(async (tx) => {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            size,
            sku,
            stock,
            isAvailable: stock > 0,
          },
        });
        if (stock > 0) {
          await tx.inventoryMovement.create({
            data: {
              variantId: variant.id,
              type: "INITIAL",
              quantityChange: stock,
              stockBefore: 0,
              stockAfter: stock,
              note: "Stok awal (seed data demo)",
            },
          });
        }
      });
    }
  }
  console.log(`✅ Katalog demo siap (${products.length} produk)`);
}

async function seedDemo() {
  const email = process.env.DEMO_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_PASSWORD ?? "";

  if (!email || !password) {
    console.log("• Akun demo dilewati (DEMO_EMAIL / DEMO_PASSWORD kosong)");
    return;
  }
  if (password.length < 8) {
    throw new Error("DEMO_PASSWORD minimal 8 karakter.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`• Akun demo ${email} sudah ada`);
    return;
  }

  await prisma.user.create({
    data: {
      name: "Admin Demo",
      email,
      passwordHash: await hash(password, 12),
      role: "DEMO",
    },
  });
  console.log(`✅ Akun demo dibuat: ${email}`);
}

// ---------------------------------------------------------------
async function main() {
  await seedAdmin();
  await seedDemo();
  await seedSettings();
  await seedCatalog();
}

main()
  .catch((err) => {
    console.error("❌ Seed gagal:");
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });