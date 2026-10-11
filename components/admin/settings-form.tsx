"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { saveSettings } from "@/lib/actions/admin/settings";
import { settingsSchema, type SettingsFormValues } from "@/lib/validations/settings";

type FieldDef = {
  name: keyof SettingsFormValues;
  label: string;
  kind?: "text" | "textarea" | "number";
  help?: string;
};

const SECTIONS: { title: string; fields: FieldDef[] }[] = [
  {
    title: "Identitas toko",
    fields: [
      { name: "storeName", label: "Nama toko" },
      { name: "tagline", label: "Tagline", help: "Kalimat singkat di beranda dan footer." },
      { name: "description", label: "Deskripsi", kind: "textarea" },
    ],
  },
  {
    title: "Kontak dan lokasi",
    fields: [
      { name: "whatsappNumber", label: "Nomor WhatsApp penjual", help: "Contoh 081234567890. Disimpan dalam format internasional (62...)." },
      { name: "email", label: "Email (opsional)" },
      { name: "address", label: "Alamat toko", kind: "textarea" },
      { name: "mapUrl", label: "Tautan Google Maps (opsional)", help: "Diawali https://. Kosongkan untuk memakai pencarian alamat." },
      { name: "openingHours", label: "Jam operasional", kind: "textarea", help: "Satu baris per hari atau rentang hari." },
      { name: "pickupInstructions", label: "Petunjuk pengambilan", kind: "textarea" },
    ],
  },
  {
    title: "Pemesanan dan pembayaran",
    fields: [
      { name: "dpPercentage", label: "Persentase DP (%)", kind: "number", help: "Berlaku untuk pesanan baru. Pesanan lama tidak berubah." },
      { name: "lowStockThreshold", label: "Batas stok rendah", kind: "number" },
      { name: "paymentInstructions", label: "Info rekening / pembayaran (privat)", kind: "textarea", help: "Hanya terlihat admin. Tidak pernah ditampilkan di website publik." },
    ],
  },
  {
    title: "Beranda dan footer",
    fields: [
      { name: "announcementText", label: "Teks pengumuman (bar hitam di atas)" },
      { name: "promoBannerTitle", label: "Judul banner promosi" },
      { name: "promoBannerText", label: "Teks banner promosi", kind: "textarea" },
      { name: "footerText", label: "Teks footer" },
    ],
  },
  {
    title: "Media sosial",
    fields: [
      { name: "instagramUrl", label: "Instagram (https://...)" },
      { name: "facebookUrl", label: "Facebook (https://...)" },
      { name: "tiktokUrl", label: "TikTok (https://...)" },
    ],
  },
];

const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

export function SettingsForm({ defaultValues }: { defaultValues: SettingsFormValues }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveSettings(values);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {SECTIONS.map((section) => (
        <section key={section.title} className="rounded-2xl border border-stone-line bg-white p-6">
          <h2 className="mb-5 text-base font-bold">{section.title}</h2>
          <div className="space-y-5">
            {section.fields.map((f) => {
              const id = `set-${f.name}`;
              const error = errors[f.name]?.message;
              return (
                <div key={f.name} className="space-y-1.5">
                  <label htmlFor={id} className="text-sm font-semibold">
                    {f.label}
                  </label>
                  {f.kind === "textarea" ? (
                    <textarea
                      id={id}
                      rows={3}
                      aria-invalid={!!error}
                      className={`${inputClass} py-2.5`}
                      {...register(f.name)}
                    />
                  ) : (
                    <input
                      id={id}
                      type={f.kind === "number" ? "number" : "text"}
                      aria-invalid={!!error}
                      className={`${inputClass} h-11`}
                      {...register(f.name, f.kind === "number" ? { valueAsNumber: true } : undefined)}
                    />
                  )}
                  {f.help && !error && <p className="text-xs text-neutral-500">{f.help}</p>}
                  {error && <p className="text-xs text-red-600">{error}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 items-center gap-2 rounded-full bg-ink px-8 text-sm font-semibold text-paper shadow-lg hover:bg-neutral-800 disabled:opacity-70"
        >
          {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          Simpan pengaturan
        </button>
      </div>
    </form>
  );
}