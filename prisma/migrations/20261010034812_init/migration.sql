-- CreateTable
CREATE TABLE "store_settings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "storeName" TEXT NOT NULL DEFAULT 'SOLESPACE',
    "description" TEXT,
    "whatsappNumber" TEXT NOT NULL DEFAULT '6281234567890',
    "address" TEXT,
    "openingHours" TEXT,
    "dpPercentage" INTEGER NOT NULL DEFAULT 50,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);
