import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Toko Cahaya - Sistem Manajemen Toko",
  description: "Sistem Point of Sale untuk Toko Cahaya - Kelola transaksi, produk, dan laporan toko Anda",
  icons: {
    icon: "/images/logo/Logo.png",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={nunito.className}>{children}</body>
    </html>
  );
}
