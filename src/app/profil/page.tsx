"use client";
import React from "react";
import AppLayout from "@/components/AppLayout";
import { getUser } from "@/lib/auth";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export default function ProfilPage() {
  const [mounted, setMounted] = React.useState(false);
  const user = getUser();
  const initial = user?.nama?.slice(0, 1).toUpperCase() || "K";
  const roleName = user?.role === "owner" ? "Pemilik Toko" : "Kasir";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <AppLayout title="Profil Saya" subtitle="Informasi akun Anda">
        <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          Memuat profil...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profil Saya" subtitle="Informasi akun Anda">
      <div className="profile-layout">
        
        {/* Left: Profile Summary Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 24px" }}>
          <div style={{ 
            width: 100, 
            height: 100, 
            borderRadius: "50%", 
            background: "var(--primary-glow)", 
            color: "var(--primary)", 
            fontSize: "2.8rem", 
            fontWeight: 800, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            marginBottom: 20,
            boxShadow: "0 0 0 4px rgba(37,99,235,0.1)"
          }}>
            {initial}
          </div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "1.3rem", fontWeight: 700, color: "var(--text)" }}>
            {user?.nama || "Kasir"}
          </h2>
          <div style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: 24 }}>
            {roleName} · Toko Cahaya
          </div>
          
          <div style={{ 
            padding: "8px 16px", 
            borderRadius: "100px", 
            background: "rgba(16, 185, 129, 0.1)", 
            color: "#10b981", 
            fontSize: "0.85rem", 
            fontWeight: 600, 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 8 
          }}>
             <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }}></span> 
             Akun Aktif
          </div>
        </div>

        {/* Right: Detailed Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Info Personal */}
          <div className="card" style={{ padding: "0", overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", fontWeight: 700, fontSize: "1.05rem", background: "var(--surface-2)" }}>
              Informasi Personal
            </div>
            
            <div style={{ padding: "0 24px" }}>
              <div className="profile-info-row">
                <div className="profile-info-label">Nama Lengkap</div>
                <div className="profile-info-value">{user?.nama || "-"}</div>
              </div>
              
              <div className="profile-info-row">
                <div className="profile-info-label">Username</div>
                <div className="profile-info-value">{user?.username || "-"}</div>
              </div>
              
              <div className="profile-info-row">
                <div className="profile-info-label">Role / Jabatan</div>
                <div className="profile-info-value">{roleName}</div>
              </div>
              
              <div className="profile-info-row">
                <div className="profile-info-label">Lokasi</div>
                <div className="profile-info-value">Toko Cahaya (Pusat)</div>
              </div>
            </div>
          </div>
          
          {/* Keamanan Akun */}
          <div className="card" style={{ display: "flex", gap: "20px", alignItems: "flex-start", background: "var(--surface)" }}>
             <div style={{ 
               width: 52, 
               height: 52, 
               borderRadius: "14px", 
               background: "var(--primary-glow)", 
               color: "var(--primary)", 
               display: "flex", 
               alignItems: "center", 
               justifyContent: "center",
               flexShrink: 0
             }}>
                <ShieldCheckIcon style={{ width: 28 }} />
             </div>
             <div style={{ paddingTop: 4 }}>
               <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: 6, fontSize: "1.05rem" }}>Keamanan & Pengaturan</div>
               <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                 Saat ini Anda login sebagai Kasir. Untuk mengubah password, username, atau data profil lainnya, silakan hubungi Pemilik Toko (Owner) untuk melakukan pembaruan di sistem pusat.
               </div>
             </div>
          </div>
          
        </div>
      </div>
    </AppLayout>
  );
}