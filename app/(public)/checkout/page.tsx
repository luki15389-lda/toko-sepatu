import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getStoreSettings } from "@/lib/data/store";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="mb-8 text-3xl font-extrabold sm:text-4xl">Checkout</h1>
      <CheckoutForm
        dpPercentage={settings.dpPercentage}
        pickup={{
          address: settings.address,
          openingHours: settings.openingHours,
          instructions: settings.pickupInstructions,
        }}
      />
    </div>
  );
}