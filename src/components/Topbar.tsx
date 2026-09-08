"use client";
import { CalendarIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { getUser } from "@/lib/auth";
import { useState, useEffect } from "react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export default function Topbar({ title, subtitle, onMenuClick }: TopbarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const user = getUser();
  const nama = user?.nama || "";
  const words = nama.trim().split(" ");
  const initials = words.length > 1
    ? (words[0][0] + words[1][0]).toUpperCase()
    : nama.slice(0, 2).toUpperCase() || "--";

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <header className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {onMenuClick && (
          <button className="mobile-menu-btn" onClick={onMenuClick}>
            <Bars3Icon style={{ width: 28, color: "var(--text)" }} />
          </button>
        )}
        <div className="header-title">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="header-actions" style={{ gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#64748b", fontWeight: 600, fontSize: "0.95rem" }}>
          <CalendarIcon style={{ width: 22 }} />
          <span>{mounted ? today : ""}</span>
        </div>
        <div style={{ 
          width: 46, height: 46, 
          borderRadius: "50%", 
          background: "#1e293b", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          color: "white", fontWeight: 800, fontSize: "1.1rem", 
          flexShrink: 0,
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}>
          {mounted ? initials : "--"}
        </div>
      </div>
    </header>
  );
}