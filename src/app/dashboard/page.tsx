"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { ArrowRightIcon, ExclamationTriangleIcon as ExclamationTriangleSolid } from "@heroicons/react/24/solid";
import { CurrencyDollarIcon, ShoppingBagIcon, CubeIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrxItem {
  id: number;
  nomor_transaksi: string;
  tgl_transaksi: string;
  total_bayar: number;
  metode_bayar: string;
  nama_kasir: string;
}

interface ChartData {
  tanggal: string;
  omzet: number;
}

interface TopProduct {
  nama: string;
  terjual: number;
}

function formatRupiah(v: number) { return "Rp " + v.toLocaleString("id-ID"); }
function formatTgl(s: string) { return new Date(s).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const user = getUser();
  const isOwner = mounted ? user?.role === "owner" : false;

  const [stats, setStats] = useState({ penjualan: 0, jumlahTrx: 0, barangTerjual: 0, stokMenipis: 0 });
  const [recentTrx, setRecentTrx] = useState<TrxItem[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      // 1. Fetch Today's Stats
      const { data: trxToday } = await supabase.from("transaksi")
        .select("*").gte("tgl_transaksi", todayStr).order("tgl_transaksi", { ascending: false });

      const { data: detailToday } = await supabase.from("detail_transaksi")
        .select("jumlah, id_transaksi, transaksi!inner(tgl_transaksi)")
        .gte("transaksi.tgl_transaksi", todayStr);

      const penjualan = (trxToday || []).reduce((s, t) => s + Number(t.total_bayar), 0);
      const jumlahTrx = (trxToday || []).length;
      const barangTerjual = (detailToday || []).reduce((s: number, d: { jumlah: number }) => s + d.jumlah, 0);
      
      let stokMenipis = 0;
      let chartRes: ChartData[] = [];
      let topProdRes: TopProduct[] = [];

      if (isOwner) {
        // Fetch Stok Menipis
        const { count } = await supabase.from("produk").select("*", { count: "exact", head: true }).lte("stok", 10);
        stokMenipis = count || 0;

        // Fetch Last 7 Days Omzet
        const d7 = new Date();
        d7.setDate(d7.getDate() - 6);
        d7.setHours(0,0,0,0);
        
        const { data: trx7 } = await supabase.from("transaksi")
          .select("tgl_transaksi, total_bayar")
          .gte("tgl_transaksi", d7.toISOString());

        // Group by Date for Chart
        const groupedChart: Record<string, number> = {};
        for(let i=0; i<7; i++) {
          const d = new Date(d7);
          d.setDate(d.getDate() + i);
          const lbl = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
          groupedChart[lbl] = 0;
        }

        trx7?.forEach(t => {
          const lbl = new Date(t.tgl_transaksi).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
          if(groupedChart[lbl] !== undefined) groupedChart[lbl] += Number(t.total_bayar);
        });

        chartRes = Object.keys(groupedChart).map(k => ({ tanggal: k, omzet: groupedChart[k] }));

        // Fetch Top Products (lifetime or last 7 days? Let's do lifetime for simplicity as it represents overall top sellers)
        const { data: allDetails } = await supabase.from("detail_transaksi").select("nama_produk, jumlah");
        const prodCount: Record<string, number> = {};
        allDetails?.forEach(d => {
          prodCount[d.nama_produk] = (prodCount[d.nama_produk] || 0) + d.jumlah;
        });
        
        topProdRes = Object.keys(prodCount)
          .map(k => ({ nama: k, terjual: prodCount[k] }))
          .sort((a, b) => b.terjual - a.terjual)
          .slice(0, 5);
      }

      const { data: recent } = await supabase.from("transaksi")
        .select("*").order("tgl_transaksi", { ascending: false }).limit(isOwner ? 8 : 5);

      setStats({ penjualan, jumlahTrx, barangTerjual, stokMenipis });
      setRecentTrx(recent || []);
      setChartData(chartRes);
      setTopProducts(topProdRes);
      setLoading(false);
    }
    load();
  }, [isOwner]);

  return (
    <AppLayout title="Dashboard" subtitle={`Ringkasan penjualan toko`}>
      <div className="stat-grid" style={{ gridTemplateColumns: isOwner ? "repeat(4, 1fr)" : "repeat(3, 1fr)", gap: "16px" }}>
        <div className="stat-card blue">
          <div className="stat-icon-box"><CurrencyDollarIcon /></div>
          <div className="stat-text">
            <div className="stat-label">OMZET HARI INI</div>
            <div className="stat-value">{loading ? "" : formatRupiah(stats.penjualan)}</div>
            <div className="stat-desc">Total semua penjualan</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon-box"><ShoppingBagIcon /></div>
          <div className="stat-text">
            <div className="stat-label">TRANSAKSI HARI INI</div>
            <div className="stat-value">{loading ? "" : stats.jumlahTrx}</div>
            <div className="stat-desc">Jumlah transaksi</div>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon-box"><CubeIcon /></div>
          <div className="stat-text">
            <div className="stat-label">BARANG TERJUAL</div>
            <div className="stat-value">{loading ? "" : stats.barangTerjual}</div>
            <div className="stat-desc">Total barang keluar</div>
          </div>
        </div>

        {isOwner && (
          <div className="stat-card orange">
            <div className="stat-icon-box" style={{ background: "rgba(255,255,255,0.2)" }}><ExclamationTriangleSolid /></div>
            <div className="stat-text">
              <div className="stat-label">STOK MENIPIS</div>
              <div className="stat-value">{loading ? "" : stats.stokMenipis}</div>
              <div className="stat-desc">Produk perlu diisi ulang</div>
            </div>
          </div>
        )}
      </div>

      {isOwner && (
        <div className="dashboard-chart-grid">
          {/* Chart Section */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">GRAFIK PENJUALAN (7 HARI)</div>
            </div>
            <div style={{ height: "300px", padding: "16px 24px 24px 0" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `Rp ${v.toLocaleString("id-ID")}`} dx={-10} />
                  <Tooltip 
                    formatter={(value: any) => [formatRupiah(Number(value) || 0), "Omzet"]}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  />
                  <Line type="monotone" dataKey="omzet" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Products Section */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">PRODUK TERLARIS</div>
            </div>
            <div style={{ padding: "0", display: "flex", flexDirection: "column", gap: "16px", alignItems: "stretch" }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Memuat...</div>
              ) : topProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Belum ada data</div>
              ) : topProducts.map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "4px 0", width: "100%" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", flex: 1, minWidth: 0, textAlign: "left" }}>{p.nama}</span>
                  <span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap", flexShrink: 0, textAlign: "right" }}>{p.terjual} terjual</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">TRANSAKSI {isOwner ? "HARI INI" : "TERBARU"}</div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "24%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>No. Transaksi</th>
                <th style={{ textAlign: "center" }}>Waktu</th>
                <th style={{ textAlign: "center" }}>Kasir</th>
                <th style={{ textAlign: "center" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Memuat data...</td></tr>
              ) : recentTrx.length === 0 ? (
                <tr><td colSpan={4}>
                  <div className="empty-state" style={{ padding: "3rem" }}>
                    <ClockIcon style={{ width: 40 }} />
                    <h3>Belum ada transaksi</h3>
                  </div>
                </td></tr>
              ) : recentTrx.map(t => (
                <tr key={t.id}>
                  <td style={{ textAlign: "center" }}><span style={{ fontWeight: 700, color: "var(--text)", fontFamily: "monospace", fontSize: "0.85rem" }}>{t.nomor_transaksi}</span></td>
                  <td style={{ fontSize: "0.88rem", color: "var(--text-muted)", textAlign: "center" }}>{formatTgl(t.tgl_transaksi)}</td>
                  <td style={{ fontWeight: 600, textAlign: "center" }}>{t.nama_kasir || "-"}</td>
                  <td style={{ fontWeight: 700, color: "var(--success)", textAlign: "center" }}>+{formatRupiah(Number(t.total_bayar))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}