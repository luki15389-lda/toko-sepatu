import "server-only";

import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import type { ImageMime } from "@/lib/storage/image-type";

const EXTENSION: Record<ImageMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const LOCAL_PREFIX = "/uploads/";
const LOCAL_NAME_RE = /^[0-9]+-[0-9a-f]{12}\.(jpg|png|webp)$/;
export const PLACEHOLDER_IMAGE = "/placeholder-shoe.svg";

const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/** Menyimpan gambar dan mengembalikan alamat publiknya. */
export async function storeImage(
  bytes: Uint8Array,
  type: ImageMime
): Promise<string> {
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${EXTENSION[type]}`;

  if (blobEnabled()) {
    const blob = await put(`products/${name}`, Buffer.from(bytes), {
      access: "public",
      contentType: type,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Penyimpanan gambar belum dikonfigurasi (BLOB_READ_WRITE_TOKEN kosong)."
    );
  }

  // Hanya untuk pengembangan lokal
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return `${LOCAL_PREFIX}${name}`;
}

function isBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

function isLocalUrl(url: string): boolean {
  return (
    url.startsWith(LOCAL_PREFIX) &&
    LOCAL_NAME_RE.test(url.slice(LOCAL_PREFIX.length))
  );
}

/** Hanya alamat dari penyimpanan kita (atau placeholder) yang boleh dipakai produk. */
export function isAllowedImageUrl(url: string): boolean {
  return url === PLACEHOLDER_IMAGE || isBlobUrl(url) || isLocalUrl(url);
}

/** Menghapus file foto (dibiarkan jika gagal, tidak menghentikan proses utama). */
export async function deleteImages(urls: string[]): Promise<void> {
  const blobs = urls.filter(isBlobUrl);
  const locals = urls.filter(isLocalUrl);

  if (blobs.length > 0 && blobEnabled()) {
    try {
      await del(blobs);
    } catch (error) {
      console.error("Gagal menghapus foto dari Blob:", error);
    }
  }

  for (const url of locals) {
    try {
      await unlink(path.join(process.cwd(), "public", url));
    } catch {
      // file sudah tidak ada: abaikan
    }
  }
}