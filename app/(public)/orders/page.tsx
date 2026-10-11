import type { Metadata } from "next";
import { OrderLookup } from "@/components/store/order-lookup";
import { getStoreSettings } from "@/lib/data/store";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Cek Pesanan",
  robots: { index: false, follow: false },
};

export default async function OrdersLookupPage() {
  const settings = await getStoreSettings();

  const whatsappUrl = settings.whatsappNumber
    ? buildWhatsAppUrl(
        settings.whatsappNumber,
        `Halo ${settings.storeName}, saya kehilangan tautan pesanan saya.`
      )
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="mb-8 text-3xl font-extrabold sm:text-4xl">Cek pesanan</h1>
      <OrderLookup whatsappUrl={whatsappUrl} />
    </div>
  );
}