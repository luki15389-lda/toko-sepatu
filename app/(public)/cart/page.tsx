import type { Metadata } from "next";
import { CartView } from "@/components/store/cart-view";
import { getStoreSettings } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "Keranjang",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="mb-8 text-3xl font-extrabold sm:text-4xl">Keranjang</h1>
      <CartView dpPercentage={settings.dpPercentage} />
    </div>
  );
}