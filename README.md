# Toko Cahaya — Sistem Point of Sale (POS) Warung

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

---

## Deskripsi

Toko Cahaya adalah aplikasi web Point of Sale (POS) yang dirancang untuk memudahkan pengelolaan transaksi penjualan, manajemen produk dan stok, serta pemantauan laporan keuangan warung atau toko kelontong secara real-time. Aplikasi ini mendukung dua peran pengguna: **Owner** dan **Kasir**, dengan kontrol akses yang berbeda untuk setiap peran.

---

## Fitur Aplikasi

| Fitur | Akses | Deskripsi |
|---|---|---|
| Login | Semua | Autentikasi pengguna berbasis username dan password dengan sesi yang kedaluwarsa otomatis setelah 12 jam |
| Dashboard | Semua | Ringkasan penjualan harian, total transaksi, jumlah produk, serta grafik tren penjualan mingguan |
| Kasir (POS) | Semua | Antarmuka transaksi penjualan: cari produk, tambah ke keranjang, proses pembayaran, hitung kembalian, dan cetak struk |
| Manajemen Produk | Owner | Tambah, edit, hapus produk beserta foto, kategori, stok, harga beli, dan harga jual |
| Riwayat Transaksi | Semua | Daftar seluruh transaksi dengan detail item, filter tanggal, dan fitur cetak ulang struk |
| Laporan Keuangan | Owner | Laporan rekap penjualan, total pendapatan, grafik tren, dan produk terlaris |
| Manajemen Kasir | Owner | Tambah, edit, hapus akun kasir yang dapat mengakses sistem |
| Profil | Semua | Informasi akun pengguna yang sedang aktif |

---

## Teknologi yang Digunakan

| Kategori | Teknologi | Versi |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.4 |
| UI Library | React | 19 |
| Bahasa Pemrograman | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| Database & Backend | Supabase (PostgreSQL) | 2.x |
| Visualisasi Data | Recharts | 3 |
| Ikon | Heroicons (React) | 2 |

---

## Struktur Direktori

```
Toko-Cahaya/
├── public/
│   └── images/
│       ├── logo/
│       │   └── Logo.png                  # Logo Toko Cahaya
│       └── products/                     # Gambar produk yang tersimpan lokal
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Halaman login
│   │   ├── layout.tsx                    # Root layout aplikasi
│   │   ├── globals.css                   # Global stylesheet dan design system
│   │   ├── api/                          # API Routes Next.js (server-side)
│   │   ├── dashboard/
│   │   │   └── page.tsx                  # Dashboard: statistik dan grafik penjualan
│   │   ├── kasir/
│   │   │   └── page.tsx                  # Antarmuka Point of Sale (POS)
│   │   ├── kasir-management/
│   │   │   └── page.tsx                  # Manajemen akun kasir (Owner only)
│   │   ├── laporan/
│   │   │   └── page.tsx                  # Laporan keuangan dan rekap penjualan
│   │   ├── produk/
│   │   │   └── page.tsx                  # Manajemen produk dan stok (Owner only)
│   │   ├── profil/
│   │   │   └── page.tsx                  # Halaman profil pengguna aktif
│   │   └── riwayat/
│   │       └── page.tsx                  # Riwayat seluruh transaksi penjualan
│   ├── components/
│   │   ├── AppLayout.tsx                 # Layout wrapper dengan sidebar dan topbar
│   │   ├── Sidebar.tsx                   # Navigasi sidebar dengan role-based menu
│   │   └── Topbar.tsx                    # Header dengan info pengguna aktif
│   └── lib/
│       ├── auth.ts                       # Manajemen sesi pengguna via localStorage
│       └── supabase.ts                   # Inisialisasi Supabase client
├── .env.local                            # Environment variables (tidak di-commit)
├── package.json
├── next.config.ts
└── tsconfig.json
```

---

## Sistem Autentikasi dan Role

Autentikasi tidak menggunakan Supabase Auth secara langsung. Data pengguna diverifikasi dari tabel database, lalu sesi disimpan di `localStorage` dengan masa berlaku **12 jam**. Setelah 12 jam, sesi kedaluwarsa secara otomatis dan pengguna diarahkan kembali ke halaman login.

Setiap pengguna memiliki satu dari dua role berikut:

| Role | Akses |
|---|---|
| `owner` | Seluruh fitur: Dashboard, Kasir, Produk, Riwayat, Laporan, Manajemen Kasir, Profil |
| `kasir` | Dashboard, Kasir (POS), Riwayat Transaksi, Profil |

---

## Skema Database

Aplikasi terhubung ke **Supabase** (PostgreSQL) dengan tabel-tabel utama sebagai berikut:

```sql
-- Data produk yang dijual di toko
CREATE TABLE produk (
    id            SERIAL PRIMARY KEY,
    nama_produk   TEXT NOT NULL,
    kategori      TEXT,
    stok          INTEGER NOT NULL DEFAULT 0,
    harga_beli    NUMERIC NOT NULL DEFAULT 0,
    harga_jual    NUMERIC NOT NULL DEFAULT 0,
    foto          TEXT    -- URL atau path gambar produk
);

-- Data akun pengguna (owner dan kasir)
CREATE TABLE users (
    id        SERIAL PRIMARY KEY,
    username  TEXT UNIQUE NOT NULL,
    password  TEXT NOT NULL,
    nama      TEXT NOT NULL,
    role      TEXT NOT NULL  -- 'owner' atau 'kasir'
);

-- Header transaksi penjualan
CREATE TABLE transaksi (
    id                SERIAL PRIMARY KEY,
    nomor_transaksi   TEXT UNIQUE NOT NULL,
    tgl_transaksi     TIMESTAMPTZ DEFAULT now(),
    total_bayar       NUMERIC NOT NULL,
    jumlah_bayar      NUMERIC NOT NULL,
    kembalian         NUMERIC NOT NULL DEFAULT 0,
    metode_bayar      TEXT NOT NULL,  -- 'tunai' atau 'non-tunai'
    nama_kasir        TEXT NOT NULL
);

-- Detail item pada setiap transaksi
CREATE TABLE detail_transaksi (
    id            SERIAL PRIMARY KEY,
    transaksi_id  INTEGER REFERENCES transaksi(id) ON DELETE CASCADE,
    nama_produk   TEXT NOT NULL,
    jumlah        INTEGER NOT NULL,
    harga_satuan  NUMERIC NOT NULL,
    subtotal      NUMERIC NOT NULL
);
```

---

## Instalasi dan Menjalankan Secara Lokal

### Prasyarat

- Node.js versi 18 atau lebih baru
- npm (disertakan dalam instalasi Node.js)
- Akun Supabase aktif (tersedia gratis di [supabase.com](https://supabase.com))

### Langkah-langkah

**1. Clone repository**

```bash
git clone https://github.com/adtyPutra/toko-cahaya-.git
cd toko-cahaya-
```

**2. Install dependensi**

```bash
npm install
```

**3. Konfigurasi environment variables**

Buat file `.env.local` di root direktori proyek dengan isi berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Nilai tersebut dapat diperoleh dari: **Supabase Dashboard > Project Settings > API**

**4. Setup database**

Jalankan skrip SQL skema di atas melalui Supabase SQL Editor, kemudian tambahkan data akun owner pertama secara manual ke tabel `users`.

**5. Jalankan server development**

```bash
npm run dev
```

Aplikasi dapat diakses di `http://localhost:3000`.

---

## Perintah yang Tersedia

| Perintah | Keterangan |
|---|---|
| `npm run dev` | Menjalankan server development dengan hot-reload |
| `npm run build` | Mem-build aplikasi untuk lingkungan production |
| `npm run start` | Menjalankan server production (wajib build terlebih dahulu) |
| `npm run lint` | Menjalankan ESLint untuk pemeriksaan kualitas kode |

---

## Alur Penggunaan Aplikasi

```
Halaman Login
  └── Masukkan username dan password
        └── Verifikasi dari tabel users (Supabase)
              └── Simpan sesi ke localStorage (berlaku 12 jam)
                    └── Redirect ke Dashboard

Dashboard
  ├── Kasir / POS
  │     └── Cari produk → Tambah ke keranjang → Proses pembayaran
  │                                                    └── Simpan ke tabel transaksi & detail_transaksi
  │                                                    └── Update stok produk
  │                                                    └── Tampilkan struk
  ├── Produk                 (Owner only)
  │     └── Tambah / edit / hapus produk dan stok
  ├── Riwayat Transaksi
  │     └── Filter berdasarkan tanggal → Lihat detail → Cetak ulang struk
  ├── Laporan Keuangan       (Owner only)
  │     └── Rekap penjualan harian / mingguan / bulanan
  ├── Manajemen Kasir        (Owner only)
  │     └── Tambah / edit / hapus akun kasir
  └── Profil
        └── Informasi akun pengguna aktif
```

---

## Informasi Pengembang

| Keterangan | Detail |
|---|---|
| Nama | Putra Aditya Hartanto |
| GitHub | [adtyPutra](https://github.com/adtyPutra) |

---

*Seluruh hak cipta dimiliki oleh pengembang. Dilarang menggunakan, menyalin, atau mendistribusikan ulang tanpa izin tertulis dari pemilik.*
