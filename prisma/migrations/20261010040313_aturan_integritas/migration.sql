-- Stok tidak boleh negatif
ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_stock_non_negative" CHECK ("stock" >= 0);

-- Harga produk valid, harga diskon harus lebih murah dari harga normal
ALTER TABLE "products"
  ADD CONSTRAINT "products_price_non_negative" CHECK ("price" >= 0);

ALTER TABLE "products"
  ADD CONSTRAINT "products_discount_valid"
  CHECK ("discountPrice" IS NULL OR ("discountPrice" >= 0 AND "discountPrice" < "price"));

-- Item pesanan valid
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_price_non_negative" CHECK ("unitPrice" >= 0 AND "lineTotal" >= 0);

-- Nilai pesanan valid dan pembayaran terverifikasi tidak boleh melebihi total
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_amounts_valid"
  CHECK ("subtotal" >= 0 AND "total" >= 0 AND "paidAmount" >= 0 AND "paidAmount" <= "total");

-- Nominal pembayaran selalu positif
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);

-- Persentase DP 0-100
ALTER TABLE "store_settings"
  ADD CONSTRAINT "store_settings_dp_range" CHECK ("dpPercentage" BETWEEN 0 AND 100);