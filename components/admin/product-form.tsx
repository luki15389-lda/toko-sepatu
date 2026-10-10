"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { ProductImagesField } from "@/components/admin/product-images-field";
import { ProductVariantsField } from "@/components/admin/product-variants-field";
import { saveProduct } from "@/lib/actions/admin/products";
import {
  productSchema,
  type ProductFormValues,
} from "@/lib/validations/product";

type Option = { id: string; name: string };

const inputClass =
  "h-11 w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";
const textareaClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-line bg-white p-6">
      <h2 className="mb-5 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  help,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {help && !error && <p className="text-xs text-neutral-500">{help}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ProductForm({
  productId,
  defaultValues,
  brands,
  categories,
  lockedVariantIds,
}: {
  productId: string | null;
  defaultValues: ProductFormValues;
  brands: Option[];
  categories: Option[];
  lockedVariantIds: string[];
}) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveProduct(productId, values);

    if (result.ok) {
      toast.success(result.message);
      router.push("/admin/products");
      router.refresh();
      return;
    }

    for (const [path, message] of Object.entries(result.fieldErrors ?? {})) {
      if (message) setError(path as Path<ProductFormValues>, { message });
    }
    toast.error(result.message);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <Card title="Informasi produk">
          <div className="space-y-5">
            <Field label="Nama produk" htmlFor="p-name" error={errors.name?.message}>
              <input id="p-name" type="text" className={inputClass} {...register("name")} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Slug"
                htmlFor="p-slug"
                error={errors.slug?.message}
                help="Alamat halaman produk. Kosongkan untuk dibuat otomatis."
              >
                <input id="p-slug" type="text" className={inputClass} {...register("slug")} />
              </Field>
              <Field
                label="Kode SKU"
                htmlFor="p-sku"
                error={errors.sku?.message}
                help="Huruf besar, angka, tanda hubung. Harus unik."
              >
                <input id="p-sku" type="text" className={inputClass} {...register("sku")} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Merek" htmlFor="p-brand" error={errors.brandId?.message}>
                <select id="p-brand" className={inputClass} {...register("brandId")}>
                  <option value="">Pilih merek</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Kategori" htmlFor="p-category" error={errors.categoryId?.message}>
                <select id="p-category" className={inputClass} {...register("categoryId")}>
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Deskripsi" htmlFor="p-desc" error={errors.description?.message}>
              <textarea id="p-desc" rows={5} className={textareaClass} {...register("description")} />
            </Field>

            <Field label="Bahan (opsional)" htmlFor="p-material" error={errors.material?.message}>
              <input id="p-material" type="text" className={inputClass} {...register("material")} />
            </Field>

            <Field
              label="Spesifikasi tambahan (opsional)"
              htmlFor="p-spec"
              error={errors.specifications?.message}
            >
              <textarea id="p-spec" rows={3} className={textareaClass} {...register("specifications")} />
            </Field>
          </div>
        </Card>

        <Card title="Harga">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Harga normal (Rp)" htmlFor="p-price" error={errors.price?.message}>
              <input
                id="p-price"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                className={inputClass}
                {...register("price", { valueAsNumber: true })}
              />
            </Field>
            <Field
              label="Harga diskon (Rp, opsional)"
              htmlFor="p-discount"
              error={errors.discountPrice?.message}
              help="Kosongkan jika tidak ada diskon."
            >
              <input
                id="p-discount"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                className={inputClass}
                {...register("discountPrice", {
                  setValueAs: (v) =>
                    v === "" || v === null || v === undefined ? null : Number(v),
                })}
              />
            </Field>
          </div>
        </Card>

        <Card title="Foto produk">
          <ProductImagesField control={control} register={register} />
          {errors.images?.message && (
            <p className="mt-2 text-sm text-red-600">{errors.images.message}</p>
          )}
        </Card>

        <Card title="Ukuran dan stok">
          <ProductVariantsField
            control={control}
            register={register}
            errors={errors}
            lockedVariantIds={lockedVariantIds}
          />
        </Card>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-stone-line bg-white p-6 lg:sticky lg:top-24">
        <h2 className="text-base font-bold">Publikasi</h2>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-black" {...register("isPublished")} />
          <span>
            <span className="block font-semibold">Terbitkan di toko</span>
            <span className="text-xs text-neutral-500">
              Jika dimatikan, produk tersimpan sebagai draf dan tidak terlihat pelanggan.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-black" {...register("isFeatured")} />
          <span>
            <span className="block font-semibold">Produk unggulan</span>
            <span className="text-xs text-neutral-500">Tampil di bagian unggulan beranda.</span>
          </span>
        </label>

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-paper transition hover:bg-neutral-800 disabled:opacity-70"
          >
            {isSubmitting && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            {isSubmitting ? "Menyimpan..." : productId ? "Simpan perubahan" : "Simpan produk"}
          </button>
          <Link
            href="/admin/products"
            className="flex h-12 items-center justify-center rounded-full border border-stone-300 text-sm font-semibold transition hover:border-ink"
          >
            Batal
          </Link>
        </div>
      </aside>
    </form>
  );
}