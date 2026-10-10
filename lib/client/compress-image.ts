const MAX_DIMENSION = 1600;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export async function compressImage(file: File): Promise<File> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Format tidak didukung. Gunakan JPG, PNG, atau WebP.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Gambar rusak atau tidak bisa dibaca.");
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Browser tidak mendukung pemrosesan gambar.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.82)
  );
  if (!blob) throw new Error("Gagal memproses gambar.");

  const ext =
    blob.type === "image/webp" ? "webp" : blob.type === "image/png" ? "png" : "jpg";
  const base = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}