"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { MagnifyingGlassIcon, BanknotesIcon, ShoppingCartIcon, ArrowTrendingUpIcon, CheckCircleIcon, PrinterIcon } from "@heroicons/react/24/outline";

interface Trx { id: number; nomor_transaksi: string; tgl_transaksi: string; total_bayar: number; jumlah_bayar: number; kembalian: number; metode_bayar: string; nama_kasir: string; }
interface DetailItem { id: number; nama_produk: string; jumlah: number; harga_satuan: number; subtotal: number; }

const fmt = (v: number) => "Rp " + v.toLocaleString("id-ID");
const fmtTgl = (s: string) => new Date(s).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const printStruk = (trx: Trx, det: DetailItem[]) => {
  const itemRows = det.map(d => {
    const totalItem = Number(d.subtotal).toLocaleString("id-ID");
    return `
      <tr>
        <td style="padding:5px 8px 5px 0;word-break:break-word">${d.nama_produk}</td>
        <td style="padding:5px 8px;text-align:right">${d.jumlah}</td>
        <td style="padding:5px 0 5px 8px;text-align:right">${totalItem}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Struk - ${trx.nomor_transaksi}</title>
<style>
  @page { size: A4; margin: 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 16px; color: #000; max-width: 500px; margin: 0 auto; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .store-name { font-size: 22px; font-weight: bold; margin-bottom: 4px; }
  .divider { border: none; border-top: 1.5px dashed #000; margin: 12px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { font-weight: bold; padding-bottom: 8px; }
  .meta-table td { padding: 3px 0; }
  .meta-label { width: 80px; }
  .total-row td { padding: 5px 0; }
  .total-bold { font-weight: bold; font-size: 18px; }
  .footer { margin-top: 20px; font-size: 15px; }
</style>
</head><body>
<div class="center">
  <div class="store-name">TOKO CAHAYA</div>
  <div>Perumahan Harapan Baru 1, Jalan Salak Raya No. 8</div>
  <div>Bekasi Barat, Kota Bekasi</div>
  <div>Telp. 0812-3456-7890</div>
</div>
<hr class="divider">
<table class="meta-table"><tbody>
  <tr><td class="meta-label">Tanggal</td><td>: ${fmtTgl(trx.tgl_transaksi).replace(" pukul ", " ")}</td></tr>
  <tr><td class="meta-label">No.</td><td>: ${trx.nomor_transaksi}</td></tr>
  <tr><td class="meta-label">Kasir</td><td>: ${trx.nama_kasir}</td></tr>
</tbody></table>
<hr class="divider">
<table><thead>
  <tr>
    <th style="text-align:left">Produk</th>
    <th style="text-align:right">Qty</th>
    <th style="text-align:right">Harga</th>
  </tr>
</thead><tbody>
  ${itemRows}
</tbody></table>
<hr class="divider">
<table><tbody>
  <tr class="total-row"><td class="total-bold">TOTAL</td><td class="total-bold" style="text-align:right">${Number(trx.total_bayar).toLocaleString("id-ID")}</td></tr>
  <tr class="total-row"><td>Tunai</td><td style="text-align:right">${Number(trx.jumlah_bayar).toLocaleString("id-ID")}</td></tr>
  <tr class="total-row"><td>Kembali</td><td style="text-align:right">${Number(trx.kembalian).toLocaleString("id-ID")}</td></tr>
</tbody></table>
<hr class="divider">
<div class="center footer">
  <div>Terima kasih! Selamat berbelanja</div>
  <div style="margin-top:4px;font-size:13px;color:#555">Barang yang sudah dibeli tidak dapat ditukar.</div>
</div>
</body></html>`;

  const w = window.open("", "_blank", "width=700,height=800");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  }
};

export default function RiwayatPage() {
  const [list, setList] = useState<Trx[]>([]);
  const [search, setSearch] = useState("");
  const [filterTgl, setFilterTgl] = useState("");
  const [details, setDetails] = useState<Record<number, DetailItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState<{ trx: Trx; det: DetailItem[] } | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("transaksi").select("*").order("tgl_transaksi", { ascending: false });
      setList(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = list.filter(t => {
    const matchSearch = t.nomor_transaksi?.toLowerCase().includes(search.toLowerCase()) || t.nama_kasir?.toLowerCase().includes(search.toLowerCase());
    const matchTgl = !filterTgl || t.tgl_transaksi.startsWith(filterTgl);
    return matchSearch && matchTgl;
  });

  const handleShowDetail = async (trx: Trx) => {
    if (!details[trx.id]) {
      const { data } = await supabase.from("detail_transaksi").select("*").eq("id_transaksi", trx.id);
      setDetails(prev => ({ ...prev, [trx.id]: data || [] }));
      setSelectedTrx({ trx, det: data || [] });
    } else {
      setSelectedTrx({ trx, det: details[trx.id] });
    }
  };

  const totalOmzet = filtered.reduce((s, t) => s + Number(t.total_bayar), 0);

  return (
    <AppLayout title="Riwayat Transaksi" subtitle="Daftar semua transaksi penjualan">
      {/* SUKSES MODAL & PRINT AREA (Shared design) */}
      {selectedTrx && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420, overflow: "hidden", background: "#f8fafc" }}>
            <div className="modal-header no-print" style={{ background: "#10b981", color: "white", padding: "16px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, fontSize: "1.15rem" }}>
                <CheckCircleIcon style={{ width: 24 }} />
                Detail Transaksi
              </div>
            </div>
            
            <div className="modal-body" style={{ maxHeight: "calc(85vh - 140px)", overflowY: "auto" }}>
              {/* Receipt Preview Card */}
              <div className="print-area" style={{ background: "#fff", padding: "14px 16px", borderRadius: "10px", width: "100%", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontFamily: "'Courier New', Courier, monospace", fontSize: "11px", color: "#000", lineHeight: 1.35, boxSizing: "border-box" }}>
                <div style={{ textAlign: "center", marginBottom: "6px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "bold" }}>TOKO CAHAYA</div>
                  <div>Perumahan Harapan Baru 1</div>
                  <div>Jalan Salak Raya No. 8</div>
                  <div>Bekasi Barat, Kota Bekasi</div>
                  <div>Telp. 0812-3456-7890</div>
                </div>
                <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }}></div>
                <div style={{ display: "flex" }}><span style={{ width: "60px" }}>Tanggal</span><span>: {fmtTgl(selectedTrx.trx.tgl_transaksi).replace(" pukul ", " ")}</span></div>
                <div style={{ display: "flex" }}><span style={{ width: "60px" }}>No.</span><span>: {selectedTrx.trx.nomor_transaksi}</span></div>
                <div style={{ display: "flex" }}><span style={{ width: "60px" }}>Kasir</span><span>: {selectedTrx.trx.nama_kasir}</span></div>
                <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }}></div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 28px 60px", gap: "2px", fontWeight: "bold", marginBottom: "4px", minWidth: 0 }}>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>Produk</div><div style={{ textAlign: "right" }}>Qty</div><div style={{ textAlign: "right" }}>Harga</div>
                </div>
                <div style={{ borderBottom: "1px dashed #000", margin: "0 0 6px 0" }}></div>
                
                {selectedTrx.det.map((d, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 28px 60px", gap: "2px", marginBottom: "4px", minWidth: 0 }}>
                    <div style={{ minWidth: 0, wordBreak: "break-word", overflowWrap: "break-word", paddingRight: "4px" }}>{d.nama_produk}</div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>{d.jumlah}</div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>{Number(d.subtotal).toLocaleString("id-ID")}</div>
                  </div>
                ))}
                
                <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }}></div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", fontWeight: "bold" }}><span>TOTAL</span><span>{Number(selectedTrx.trx.total_bayar).toLocaleString("id-ID")}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span>Tunai</span><span>{Number(selectedTrx.trx.jumlah_bayar).toLocaleString("id-ID")}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span>Kembali</span><span>{Number(selectedTrx.trx.kembalian).toLocaleString("id-ID")}</span></div>
                
                <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }}></div>
                <div style={{ textAlign: "center", marginTop: "6px" }}>
                  <div>Terima kasih! Selamat berbelanja</div>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print" style={{ justifyContent: "center", gap: "12px", background: "#fff", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
              <button
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#64748b", color: "white", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}
                onClick={() => setSelectedTrx(null)}
              >
                Tutup
              </button>
              <button
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px", borderRadius: "10px", border: "none", background: "#2563eb", color: "white", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}
                onClick={() => printStruk(selectedTrx.trx, selectedTrx.det)}
              >
                <PrinterIcon style={{ width: 18 }} />Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-icon-box"><BanknotesIcon /></div>
          <div className="stat-text">
            <div className="stat-label">TOTAL OMZET</div>
            <div className="stat-value" style={{ fontSize: "1.4rem" }}>{fmt(totalOmzet)}</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon-box"><ShoppingCartIcon /></div>
          <div className="stat-text">
            <div className="stat-label">JUMLAH TRANSAKSI</div>
            <div className="stat-value">{filtered.length}</div>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon-box"><ArrowTrendingUpIcon /></div>
          <div className="stat-text">
            <div className="stat-label">RATA-RATA PENJUALAN</div>
            <div className="stat-value" style={{ fontSize: "1.4rem" }}>{filtered.length > 0 ? fmt(Math.round(totalOmzet / filtered.length)) : "Rp 0"}</div>
          </div>
        </div>
      </div>

      <div className="card no-print" style={{ padding: 0, overflow: "hidden" }}>
        {/* Filter bar */}
        <div className="toolbar" style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)", marginBottom: 0 }}>
          <div className="search-wrap">
            <MagnifyingGlassIcon style={{ width: 20, height: 20 }} />
            <input className="form-input" style={{ paddingLeft: 42 }} placeholder="Cari no. transaksi atau kasir..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input 
            type="date" 
            className="form-input" 
            style={{ color: filterTgl ? "var(--text)" : "#94a3b8", cursor: "pointer", fontFamily: "inherit" }} 
            value={filterTgl} 
            onChange={e => setFilterTgl(e.target.value)} 
          />
          {filterTgl && (
            <button 
              className="btn btn-primary"
              style={{ padding: "12px 16px" }}
              onClick={() => setFilterTgl("")}
            >
              Reset Tanggal
            </button>
          )}
        </div>

        <div className="table-wrap" style={{ margin: 0, overflowX: "auto" }}>
          <table className="data-table">
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>No. Transaksi</th>
                <th style={{ textAlign: "center" }}>Tanggal &amp; Waktu</th>
                <th style={{ textAlign: "center" }}>Kasir</th>
                <th style={{ textAlign: "center" }}>Total</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><MagnifyingGlassIcon style={{ width: 40 }} /><h3>Tidak ada transaksi ditemukan</h3></div></td></tr>
              ) : filtered.map(t => (
                  <tr key={t.id}>
                    <td style={{ textAlign: "center" }}><span style={{ fontWeight: 700, color: "var(--text)", fontFamily: "monospace", fontSize: "0.85rem" }}>{t.nomor_transaksi}</span></td>
                    <td style={{ fontSize: "0.88rem", color: "var(--text-muted)", textAlign: "center" }}>{fmtTgl(t.tgl_transaksi)}</td>
                    <td style={{ fontWeight: 600, textAlign: "center" }}>{t.nama_kasir}</td>
                    <td style={{ fontWeight: 700, color: "var(--success)", textAlign: "center" }}>+{fmt(Number(t.total_bayar))}</td>
                    <td style={{ textAlign: "center" }}>
                      <button 
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "6px", background: "#2563eb", color: "white", border: "none", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }} 
                        onClick={() => handleShowDetail(t)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}