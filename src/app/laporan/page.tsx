"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartBarIcon, CubeIcon, CurrencyDollarIcon, ShoppingBagIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

function formatRupiah(val: number) { return "Rp " + val.toLocaleString("id-ID"); }
function formatTgl(s: string) { return new Date(s).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<"penjualan" | "stok">("penjualan");

  // State Penjualan
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth());
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [penjualanStats, setPenjualanStats] = useState({ omzet: 0, trx: 0, terjual: 0 });
  const [penjualanChart, setPenjualanChart] = useState<any[]>([]);
  const [penjualanTrx, setPenjualanTrx] = useState<any[]>([]);

  // State Stok
  const [stokStats, setStokStats] = useState({ total: 0, menipis: 0, habis: 0 });
  const [stokData, setStokData] = useState<any[]>([]);
  const [stokCatFilter, setStokCatFilter] = useState("Semua");
  const [stokCondFilter, setStokCondFilter] = useState("Semua");
  const [kategoriList, setKategoriList] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);

  // Load Penjualan Data
  useEffect(() => {
    if (activeTab !== "penjualan") return;
    async function loadPenjualan() {
      setLoading(true);

      const startDateStr = new Date(filterTahun, filterBulan, 1).toISOString();
      const endDateStr = new Date(filterTahun, filterBulan + 1, 0, 23, 59, 59, 999).toISOString();

      const { data: trxData } = await supabase.from("transaksi")
        .select("*")
        .gte("tgl_transaksi", startDateStr)
        .lte("tgl_transaksi", endDateStr)
        .order("tgl_transaksi", { ascending: false });

      const { data: detailData } = await supabase.from("detail_transaksi")
        .select("jumlah, transaksi!inner(tgl_transaksi)")
        .gte("transaksi.tgl_transaksi", startDateStr)
        .lte("transaksi.tgl_transaksi", endDateStr);

      const omzet = (trxData || []).reduce((s, t) => s + Number(t.total_bayar), 0);
      const trxCount = (trxData || []).length;
      const terjual = (detailData || []).reduce((s, d) => s + d.jumlah, 0);

      setPenjualanStats({ omzet, trx: trxCount, terjual });
      setPenjualanTrx(trxData || []);

      // Chart Data Grouping
      const grouped: Record<string, number> = {};

      // We know it's always grouping by day within the selected month
      const daysInMonth = new Date(filterTahun, filterBulan + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(filterTahun, filterBulan, i);
        const lbl = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        grouped[lbl] = 0;
      }

      trxData?.forEach(t => {
        const lbl = new Date(t.tgl_transaksi).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        if (grouped[lbl] !== undefined) grouped[lbl] += Number(t.total_bayar);
      });

      const chartArr = Object.keys(grouped).map(k => ({ tanggal: k, omzet: grouped[k] }));
      setPenjualanChart(chartArr);

      setLoading(false);
    }
    loadPenjualan();
  }, [activeTab, filterBulan, filterTahun]);

  // Load Stok Data
  useEffect(() => {
    if (activeTab !== "stok") return;
    async function loadStok() {
      setLoading(true);
      const { data } = await supabase.from("produk").select("*").order("nama_produk");
      const list = data || [];

      const total = list.length;
      const menipis = list.filter(p => p.stok > 0 && p.stok <= 10).length;
      const habis = list.filter(p => p.stok <= 0).length;

      setStokStats({ total, menipis, habis });
      setStokData(list);
      setKategoriList(["Semua", ...Array.from(new Set(list.map(p => p.kategori)))]);
      setLoading(false);
    }
    loadStok();
  }, [activeTab]);

  const filteredStok = stokData.filter(p => {
    const mk = stokCatFilter === "Semua" || p.kategori === stokCatFilter;
    let ms = true;
    if (stokCondFilter === "Menipis") ms = p.stok > 0 && p.stok <= 10;
    if (stokCondFilter === "Habis") ms = p.stok <= 0;
    if (stokCondFilter === "Tersedia") ms = p.stok > 10;
    return mk && ms;
  });

  const handleExportPenjualan = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "No. Transaksi,Tanggal,Kasir,Total\n" +
      penjualanTrx.map(t => `${t.nomor_transaksi},"${formatTgl(t.tgl_transaksi)}",${t.nama_kasir || '-'},${t.total_bayar}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_penjualan_${filterTahun}_${filterBulan + 1}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handleExportStok = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Nama Produk,Kategori,Harga,Stok\n" +
      filteredStok.map(p => `"${p.nama_produk}","${p.kategori}",${p.harga_jual},${p.stok}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_stok.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <AppLayout title="Laporan" subtitle="Analisis performa penjualan dan stok">

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", padding: "6px", background: "var(--surface-2)", borderRadius: "12px", width: "fit-content", border: "1px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
        <button 
          onClick={() => setActiveTab("penjualan")}
          style={{ padding: "10px 28px", borderRadius: "8px", fontWeight: 700, border: "none", cursor: "pointer", background: activeTab === "penjualan" ? "var(--primary)" : "transparent", color: activeTab === "penjualan" ? "white" : "var(--text-muted)", transition: "all 0.2s", boxShadow: activeTab === "penjualan" ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none" }}
        >
          Penjualan
        </button>
        <button 
          onClick={() => setActiveTab("stok")}
          style={{ padding: "10px 28px", borderRadius: "8px", fontWeight: 700, border: "none", cursor: "pointer", background: activeTab === "stok" ? "var(--primary)" : "transparent", color: activeTab === "stok" ? "white" : "var(--text-muted)", transition: "all 0.2s", boxShadow: activeTab === "stok" ? "0 4px 12px rgba(59, 130, 246, 0.3)" : "none" }}
        >
          Stok
        </button>
      </div>

      {activeTab === "penjualan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          <div className="toolbar" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", flex: 1 }}>
              <span style={{ fontWeight: 800, color: "#94a3b8", fontSize: "0.85rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>Periode</span>
              <div style={{ display: "flex", gap: "8px", flex: 1, minWidth: "200px" }}>
                <select className="filter-select" style={{ flex: 1, fontWeight: 600 }} value={filterBulan} onChange={e => setFilterBulan(Number(e.target.value))}>
                  {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <select className="filter-select" style={{ width: "100px", fontWeight: 600 }} value={filterTahun} onChange={e => setFilterTahun(Number(e.target.value))}>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn" style={{ background: "#10b981", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: 600, border: "none", padding: "10px 18px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)" }} onClick={handleExportPenjualan}>
              <ArrowDownTrayIcon style={{ width: 18 }} strokeWidth={2.5} /> Export CSV
            </button>
          </div>

          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="stat-card blue">
              <div className="stat-icon-box"><CurrencyDollarIcon /></div>
              <div className="stat-text">
                <div className="stat-label">TOTAL OMZET</div>
                <div className="stat-value">{loading ? "..." : formatRupiah(penjualanStats.omzet)}</div>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon-box"><ShoppingBagIcon /></div>
              <div className="stat-text">
                <div className="stat-label">TOTAL TRANSAKSI</div>
                <div className="stat-value">{loading ? "..." : penjualanStats.trx}</div>
              </div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon-box"><CubeIcon /></div>
              <div className="stat-text">
                <div className="stat-label">PRODUK TERJUAL</div>
                <div className="stat-value">{loading ? "..." : penjualanStats.terjual}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header"><div className="card-title">GRAFIK OMZET</div></div>
            <div style={{ height: "300px", padding: "16px 24px 24px 0" }}>
              {loading ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px" }}>Memuat grafik...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={penjualanChart}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => v >= 1000 ? `Rp${v/1000}k` : `Rp${v}`} width={60} dx={-5} />
                    <Tooltip formatter={(value: any) => [formatRupiah(Number(value) || 0), "Omzet"]} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }} />
                    <Line type="monotone" dataKey="omzet" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">DETAIL TRANSAKSI</div></div>
            <div className="table-wrap">
              <table className="data-table">
                <colgroup>
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "25%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>No. Transaksi</th>
                    <th style={{ textAlign: "center" }}>Tanggal &amp; Waktu</th>
                    <th style={{ textAlign: "center" }}>Kasir</th>
                    <th style={{ textAlign: "center" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>Memuat...</td></tr>
                  ) : penjualanTrx.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>Belum ada data transaksi.</td></tr>
                  ) : penjualanTrx.map(t => (
                    <tr key={t.id}>
                      <td style={{ textAlign: "center" }}><span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.85rem" }}>{t.nomor_transaksi}</span></td>
                      <td style={{ textAlign: "center", fontSize: "0.88rem", color: "var(--text-muted)" }}>{formatTgl(t.tgl_transaksi)}</td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>{t.nama_kasir || "-"}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "var(--success)" }}>+{formatRupiah(Number(t.total_bayar))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {activeTab === "stok" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="btn" style={{ background: "#10b981", color: "white", display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600, border: "none", padding: "10px 18px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)" }} onClick={handleExportStok}>
              <ArrowDownTrayIcon style={{ width: 18 }} strokeWidth={2.5} /> Export CSV
            </button>
          </div>

          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="stat-card blue">
              <div className="stat-icon-box"><CubeIcon /></div>
              <div className="stat-text">
                <div className="stat-label">TOTAL PRODUK</div>
                <div className="stat-value">{loading ? "..." : stokStats.total}</div>
              </div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon-box"><ExclamationTriangleIcon /></div>
              <div className="stat-text">
                <div className="stat-label">PRODUK MENIPIS</div>
                <div className="stat-value">{loading ? "..." : stokStats.menipis}</div>
              </div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon-box" style={{ background: "rgba(255,255,255,0.2)" }}><ExclamationTriangleIcon /></div>
              <div className="stat-text">
                <div className="stat-label">PRODUK HABIS</div>
                <div className="stat-value">{loading ? "..." : stokStats.habis}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
              <select className="filter-select" value={stokCatFilter} onChange={e => setStokCatFilter(e.target.value)}>
                {kategoriList.map(k => <option key={k}>{k}</option>)}
              </select>
              <select className="filter-select" value={stokCondFilter} onChange={e => setStokCondFilter(e.target.value)}>
                <option value="Semua">Semua Kondisi</option>
                <option value="Tersedia">Tersedia (&gt; 10)</option>
                <option value="Menipis">Menipis (1 - 10)</option>
                <option value="Habis">Habis (0)</option>
              </select>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <colgroup>
                  <col style={{ width: "40%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "20%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>Produk</th>
                    <th style={{ textAlign: "center" }}>Kategori</th>
                    <th style={{ textAlign: "center" }}>Harga</th>
                    <th style={{ textAlign: "center" }}>Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>Memuat...</td></tr>
                  ) : filteredStok.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>Tidak ada produk.</td></tr>
                  ) : filteredStok.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, textAlign: "center" }}>{p.nama_produk}</td>
                      <td style={{ whiteSpace: "nowrap", textAlign: "center" }}><span className="badge badge-blue">{p.kategori}</span></td>
                      <td style={{ fontWeight: 700, color: "var(--color-primary)", textAlign: "center" }}>{formatRupiah(Number(p.harga_jual))}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ 
                          fontWeight: 700, 
                          color: p.stok <= 0 ? "var(--danger)" : p.stok <= 10 ? "var(--warning)" : "var(--text)",
                          display: "inline-flex", alignItems: "center", gap: "4px", justifyContent: "center"
                        }}>
                          {p.stok <= 10 && p.stok > 0 && <ExclamationTriangleIcon style={{ width: 14 }} />}
                          {p.stok}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </AppLayout>
  );
}
