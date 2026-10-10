import { getAdmin } from "@/lib/auth/session";
import { storeImage } from "@/lib/storage";
import { detectImageType, MAX_UPLOAD_BYTES } from "@/lib/storage/image-type";

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  // Tolak permintaan dari situs lain
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return error("Permintaan ditolak.", 403);
  }

  const admin = await getAdmin();
  if (!admin) return error("Tidak diizinkan.", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("Data unggahan tidak valid.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) return error("Berkas tidak ditemukan.", 400);
  if (file.size === 0) return error("Berkas kosong.", 400);
  if (file.size > MAX_UPLOAD_BYTES) {
    return error("Ukuran foto maksimal 4 MB.", 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) {
    return error("Format tidak didukung. Gunakan JPG, PNG, atau WebP.", 415);
  }

  try {
    const url = await storeImage(bytes, type);
    return Response.json({ url });
  } catch (err) {
    console.error("Upload gagal:", err);
    return error("Foto gagal disimpan. Coba lagi.", 500);
  }
}