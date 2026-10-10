import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Archivo } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const heading = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SOLESPACE | Toko Sepatu Sneakers Premium",
    template: "%s | SOLESPACE",
  },
  description:
    "Belanja sneakers premium di SOLESPACE. Pesan online, konfirmasi via WhatsApp, ambil langsung di toko.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${body.variable} ${heading.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}