"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { setUser } from "@/lib/auth";
import {
  EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon,
} from "@heroicons/react/24/outline";
import { BuildingStorefrontIcon, ArrowRightIcon } from "@heroicons/react/24/solid";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();
      if (dbError || !data) throw new Error("Username tidak ditemukan");
      if (data.password && data.password !== password) throw new Error("Password salah");
      setUser({ id: data.id, username: data.username, nama: data.nama, role: data.role });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        html, body { margin: 0; padding: 0; height: 100%; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        *, *::before, *::after { box-sizing: border-box; }

        /* Abu-abu terang sebagai background halaman */
        .lp-page {
          min-height: 100vh;
          background: #f4f7f6;
          display: flex;
          padding: 40px 16px;
          overflow-y: auto;
        }

        /* Kotak card besar mengambang di tengah */
        .lp-card {
          margin: auto;
          display: flex;
          width: 100%;
          max-width: 860px;
          min-height: 0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
        }

        /* Panel KIRI — biru bertema POS */
        .lp-left {
          flex: 1;
          background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 48px;
          position: relative;
          overflow: hidden;
        }
        .lp-deco {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          pointer-events: none;
        }
        .lp-deco-1 { width: 350px; height: 350px; bottom: -120px; right: -100px; }
        .lp-deco-2 { width: 200px; height: 200px; top: -80px; right: 40px; }

        .lp-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 40px;
          position: relative;
          z-index: 1;
        }
        .lp-brand-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.5px;
        }

        .lp-hero { position: relative; z-index: 1; }
        .lp-hero-title {
          font-size: 1.625rem;
          font-weight: 800;
          color: white;
          line-height: 1.25;
          letter-spacing: -0.5px;
          margin-bottom: 14px;
        }
        .lp-hero-desc {
          font-size: 0.95rem;
          color: rgba(255,255,255,0.9);
          line-height: 1.6;
          margin-bottom: 24px;
          max-width: 95%;
        }
        .lp-features {
          list-style: none;
          padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 10px;
          position: relative; z-index: 1;
        }
        .lp-feature-item {
          display: flex; align-items: flex-start; gap: 12px;
          color: white;
          font-size: 0.95rem; font-weight: 500;
          line-height: 1.4;
        }
        .lp-bullet {
          width: 8px; height: 8px; border-radius: 50%;
          background: white; flex-shrink: 0;
          margin-top: 6px;
        }

        /* Panel KANAN — putih bersih */
        .lp-right {
          width: 400px;
          min-width: 380px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 44px;
        }

        .lp-logo {
          margin-bottom: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .lp-logo img {
          border-radius: 50% !important;
        }

        .lp-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.5px;
          text-align: center;
          margin-bottom: 4px;
        }
        .lp-sub {
          font-size: 0.85rem;
          color: #6b7280;
          text-align: center;
          margin-bottom: 20px;
        }

        .lp-form { width: 100%; display: flex; flex-direction: column; gap: 14px; }

        .lp-error {
          display: flex; align-items: center; gap: 8px;
          background: #fef2f2; border: 1px solid #fecaca;
          color: #dc2626; padding: 12px 16px;
          border-radius: 8px; font-size: 0.875rem; font-weight: 600;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25%      { transform: translateX(-5px); }
          75%      { transform: translateX(5px); }
        }

        .lp-field { display: flex; flex-direction: column; gap: 8px; }
        .lp-label { font-size: 0.85rem; font-weight: 700; color: #374151; }
        .lp-input-wrap { position: relative; display: flex; align-items: center; }
        .lp-input-icon {
          position: absolute; left: 16px;
          width: 18px; height: 18px;
          color: #9ca3af; pointer-events: none;
        }
        .lp-input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.95rem; font-weight: 500;
          color: #111827; background: #ffffff;
          outline: none; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .lp-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
        }
        .lp-input::placeholder { color: #9ca3af; font-weight: 400; }
        .lp-input-pr { padding-right: 44px; }
        .lp-eye {
          position: absolute; right: 12px;
          color: #9ca3af; background: none; border: none;
          cursor: pointer; padding: 6px; border-radius: 6px;
          display: flex; transition: color 0.2s;
        }
        .lp-eye:hover { color: #2563eb; }

        .lp-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 14px;
          border-radius: 8px; border: none;
          background: #2563eb;
          color: white; font-size: 1rem; font-weight: 700;
          cursor: pointer; font-family: inherit;
          transition: background-color 0.2s, transform 0.1s;
          margin-top: 8px;
        }
        .lp-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }
        .lp-btn:active:not(:disabled) { transform: scale(0.98); }
        .lp-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .lp-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white; border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .lp-copy { margin-top: 18px; font-size: 0.72rem; color: #9ca3af; text-align: center; }

        @media (max-width: 768px) {
          .lp-left { display: none; }
          .lp-right { width: 100%; min-width: 0; border-radius: 20px; }
          .lp-card { border-radius: 20px; }
        }
      `}</style>

      {/* Abu-abu terang sebagai background */}
      <div className="lp-page">

        {/* Card mengambang di tengah */}
        <div className="lp-card">

          {/* KIRI — biru */}
          <div className="lp-left">
            <div className="lp-deco lp-deco-1" />
            <div className="lp-deco lp-deco-2" />

            <div className="lp-brand">
              <BuildingStorefrontIcon style={{ width: 32, height: 32, color: "white" }} />
              <span className="lp-brand-name">Toko Cahaya</span>
            </div>

            <div className="lp-hero">
              <h2 className="lp-hero-title">Kelola toko<br />dengan lebih mudah</h2>
              <p className="lp-hero-desc">
                Sistem manajemen toko pintar untuk mencatat transaksi, mengelola stok, dan memantau laporan penjualan secara real-time.
              </p>
              <ul className="lp-features">
                {[
                  "Transaksi lebih cepat dan praktis",
                  "Pantau penjualan dengan mudah",
                  "Kelola produk dan stok dengan mudah",
                ].map((f, i) => (
                  <li key={i} className="lp-feature-item">
                    <span className="lp-bullet" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* KANAN — putih */}
          <div className="lp-right">
            <div className="lp-logo">
              <Image src="/images/logo/Logo.png" alt="Logo Toko Cahaya" width={72} height={72} style={{ objectFit: "contain" }} />
            </div>
            <h1 className="lp-title">Selamat Datang</h1>
            <p className="lp-sub">Masuk untuk melanjutkan</p>

            <form onSubmit={handleLogin} className="lp-form">
              {error && (
                <div className="lp-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-username">Username</label>
                <div className="lp-input-wrap">
                  <UserIcon className="lp-input-icon" />
                  <input
                    id="lp-username"
                    type="text"
                    className="lp-input"
                    placeholder="Masukkan username Anda"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-password">Password</label>
                <div className="lp-input-wrap">
                  <LockClosedIcon className="lp-input-icon" />
                  <input
                    id="lp-password"
                    type={showPw ? "text" : "password"}
                    className="lp-input lp-input-pr"
                    placeholder="Masukkan password Anda"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    suppressHydrationWarning
                  />
                  <button type="button" className="lp-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? <EyeSlashIcon style={{ width: 18 }} /> : <EyeIcon style={{ width: 18 }} />}
                  </button>
                </div>
              </div>

              <button id="login-submit" type="submit" className="lp-btn" disabled={loading} suppressHydrationWarning>
                {loading
                  ? <><span className="lp-spinner" /><span>Memeriksa...</span></>
                  : <><span>Masuk</span><ArrowRightIcon style={{ width: 18 }} /></>
                }
              </button>
            </form>

            <p className="lp-copy">© 2025 Toko Cahaya. All rights reserved.</p>
          </div>

        </div>
      </div>
    </>
  );
}