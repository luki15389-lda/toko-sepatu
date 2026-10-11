"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { LoaderCircle, Pencil } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { savePage } from "@/lib/actions/admin/pages";
import { cn, formatTanggalWaktu } from "@/lib/utils";

export type PageItem = {
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
  publicHref: string;
};

const fieldClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3.5 text-sm outline-none transition focus:border-ink focus:ring-2 focus:ring-ink/10";

function PageForm({ item, onDone }: { item: PageItem; onDone: () => void }) {
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [isPublished, setIsPublished] = useState(item.isPublished);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await savePage(item.slug, { title, content, isPublished });
      if (result.ok) {
        toast.success(result.message);
        onDone();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="space-y-1.5">
        <label htmlFor="pg-title" className="text-sm font-semibold">Judul</label>
        <input id="pg-title" type="text" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className={`${fieldClass} h-11`} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="pg-content" className="text-sm font-semibold">Isi halaman</label>
        <textarea id="pg-content" rows={12} value={content} onChange={(e) => setContent(e.target.value)} className={`${fieldClass} py-2.5 font-mono`} />
        <p className="text-xs leading-relaxed text-neutral-500">
          Pisahkan paragraf dengan baris kosong. Tebal: <code>**teks**</code>.
          Daftar: awali baris dengan <code>- </code>. Subjudul: awali dengan{" "}
          <code>## </code>. Untuk FAQ, tulis pertanyaan sebagai{" "}
          <code>**Pertanyaan?**</code> diikuti jawaban di baris berikutnya.
        </p>
      </div>
      <label className="flex items-center gap-2.5 text-sm">
        <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="size-4 accent-black" />
        Tampilkan di website
      </label>
      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onDone} className="h-11 rounded-full border border-stone-300 px-5 text-sm font-semibold hover:border-ink">
          Batal
        </button>
        <button type="submit" disabled={pending} className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-paper hover:bg-neutral-800 disabled:opacity-70">
          {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          Simpan
        </button>
      </div>
    </form>
  );
}

export function PagesManager({ items }: { items: PageItem[] }) {
  const [editing, setEditing] = useState<PageItem | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-stone-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-line bg-mist text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th scope="col" className="px-5 py-3 font-semibold">Halaman</th>
              <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              <th scope="col" className="px-5 py-3 font-semibold">Diperbarui</th>
              <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-line">
            {items.map((item) => (
              <tr key={item.slug}>
                <td className="px-5 py-4">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-neutral-500">{item.slug}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", item.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600")}>
                    {item.isPublished ? "Tampil" : "Disembunyikan"}
                  </span>
                </td>
                <td className="px-5 py-4 text-neutral-600">{formatTanggalWaktu(item.updatedAt)}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={item.publicHref} target="_blank" className="text-xs font-semibold underline underline-offset-2">
                      Lihat
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      aria-label={`Edit ${item.title}`}
                      className="flex h-9 items-center gap-1.5 rounded-full border border-stone-300 px-4 text-xs font-semibold hover:border-ink"
                    >
                      <Pencil className="size-3.5" aria-hidden />
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing ? `Edit: ${editing.title}` : ""}>
        {editing && <PageForm item={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  );
}