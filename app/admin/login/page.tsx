import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/shared/logo";

export const metadata: Metadata = {
  title: "Masuk Admin",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo name="SOLESPACE" className="justify-center" />
          <p className="mt-1 text-sm text-neutral-500">Panel Admin</p>
        </div>

        <div className="rounded-2xl border border-stone-line bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold">Masuk ke dashboard</h1>
          <p className="mb-6 mt-1 text-sm text-neutral-500">
            Halaman ini khusus admin toko.
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}