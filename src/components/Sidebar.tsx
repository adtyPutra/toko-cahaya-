"use client";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { getUser, removeUser } from "@/lib/auth";
import {
  HomeIcon, ShoppingCartIcon, ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon, UserCircleIcon, ChartBarIcon, UsersIcon
} from "@heroicons/react/24/outline";

import { useEffect, useState } from "react";

const ownerNav = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon, section: "MENU UTAMA" },
  { href: "/produk", label: "Manajemen Produk", icon: ClipboardDocumentListIcon, section: "MANAJEMEN" },
  { href: "/laporan", label: "Laporan", icon: ChartBarIcon, section: null },
  { href: "/kasir-management", label: "Manajemen Kasir", icon: UsersIcon, section: "AKUN" },
];

const kasirNav = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon, section: "MENU UTAMA" },
  { href: "/kasir", label: "Transaksi", icon: ShoppingCartIcon, section: null },
  { href: "/riwayat", label: "Riwayat Transaksi", icon: ClipboardDocumentListIcon, section: "TRANSAKSI" },
  { href: "/profil", label: "Profil", icon: UserCircleIcon, section: "AKUN" },
];

export default function Sidebar({ isOpen }: { isOpen?: boolean }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUserState] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    setUserState(getUser());
  }, []);

  const handleLogout = () => {
    removeUser();
    window.location.href = "/";
  };

  const isKasir = user?.role === "kasir";
  const navItems = isKasir ? kasirNav : ownerNav;
  let prevSection = "";

  return (
    <aside className={`app-sidebar ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo" style={{ borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "white", width: 44, height: 44 }}>
          <Image src="/images/logo/Logo.png" alt="Logo" width={40} height={40} style={{ objectFit: "contain", borderRadius: "50%" }} />
        </div>
        <div className="sidebar-brand">
          <h1>Toko Cahaya</h1>
          <p>{mounted ? (isKasir ? "Panel Kasir" : "Panel Owner") : "Sistem POS"}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {mounted && navItems.map((item) => {
          const showSection = item.section && item.section !== prevSection;
          if (item.section) prevSection = item.section;
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <div key={item.href}>
              {showSection && <div className="nav-section-label">{item.section}</div>}
              <a href={item.href} className={`nav-item${isActive ? " active" : ""}`}>
                <Icon className="nav-icon" />
                {item.label}
              </a>
            </div>
          );
        })}
      </nav>

      {mounted && (
        <div className="sidebar-footer" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="sidebar-user" style={{ marginBottom: 0 }}>
            <div className="user-avatar">{user?.nama?.slice(0, 1).toUpperCase() || "A"}</div>
            <div className="user-info">
              <strong>{user?.nama || "Pengguna"}</strong>
              <span>{user?.role === "owner" ? "Pemilik Toko" : "Kasir"}</span>
            </div>
          </div>
          <button 
            title="Keluar"
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", color: "rgba(255,255,255,0.7)", background: "transparent", border: "none", cursor: "pointer", borderRadius: "8px", transition: "0.2s" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "white")}
            onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          >
            <ArrowRightOnRectangleIcon style={{ width: 22 }} />
          </button>
        </div>
      )}
    </aside>
  );
}