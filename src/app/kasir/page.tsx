"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import {
  ShoppingCartIcon, TrashIcon, MagnifyingGlassIcon,
  CheckCircleIcon, PrinterIcon, BanknotesIcon, ArrowPathIcon, BackspaceIcon,
  ChevronLeftIcon, ChevronRightIcon
} from "@heroicons/react/24/outline";

interface Produk { id: number; nama_produk: string; kategori: string; stok: number; harga_jual: number; foto?: string; }
interface CartItem { produk: Produk; qty: number; }
interface TrxSukses { nomorTrx: string; cart: CartItem[]; total: number; bayar: number; kembalian: number; waktu: string; kasir: string; }

const EMOJI: Record<string, string> = { Sembako: "🌾", Makanan: "🍜", Minuman: "🥤", Kebersihan: "🧼", Snack: "🍪", Lainnya: "📦" };
const fmt = (v: number) => "Rp " + v.toLocaleString("id-ID");
const genNomor = () => { const d = new Date(); return `TRX${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}${String(d.getSeconds()).padStart(2,"0")}`; };

const printStruk = (trx: { nomorTrx: string; cart: Array<{produk: {nama_produk: string; harga_jual: number}; qty: number}>; total: number; bayar: number; kembalian: number; waktu: string; kasir: string }) => {
  const itemRows = trx.cart.map(c => {
    const totalItem = (c.produk.harga_jual * c.qty).toLocaleString("id-ID");
    return `
      <tr>
        <td style="padding:5px 8px 5px 0;word-break:break-word">${c.produk.nama_produk}</td>
        <td style="padding:5px 8px;text-align:right">${c.qty}</td>
        <td style="padding:5px 0 5px 8px;text-align:right">${totalItem}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Struk - ${trx.nomorTrx}</title>
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
  <tr><td class="meta-label">Tanggal</td><td>: ${trx.waktu.replace(" pukul ", " ")}</td></tr>
  <tr><td class="meta-label">No.</td><td>: ${trx.nomorTrx}</td></tr>
  <tr><td class="meta-label">Kasir</td><td>: ${trx.kasir}</td></tr>
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
  <tr class="total-row"><td class="total-bold">TOTAL</td><td class="total-bold" style="text-align:right">${trx.total.toLocaleString("id-ID")}</td></tr>
  <tr class="total-row"><td>Tunai</td><td style="text-align:right">${trx.bayar.toLocaleString("id-ID")}</td></tr>
  <tr class="total-row"><td>Kembali</td><td style="text-align:right">${trx.kembalian.toLocaleString("id-ID")}</td></tr>
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

const getProductImage = (p: Produk) => {
  if (p.foto && p.foto !== "default.jpg") {
    if (p.foto.startsWith("http") || p.foto.startsWith("data:image")) return p.foto;
    // foto already contains full path like /images/products/Aqua.png
    if (p.foto.startsWith("/")) return p.foto;
    return `/images/products/${p.foto}`;
  }
  return null;
};

export default function KasirPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [katFilter, setKatFilter] = useState("Semua");
  const [katList, setKatList] = useState<string[]>(["Semua"]);
  const [inputBayar, setInputBayar] = useState("");
  const [loading, setLoading] = useState(false);
  const [trxSukses, setTrxSukses] = useState<TrxSukses | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const loadProduk = useCallback(async () => {
    const { data } = await supabase.from("produk").select("*").order("nama_produk");
    if (data) {
      setProdukList(data);
      const cats = Array.from(new Set(data.map((p: Produk) => p.kategori)));
      setKatList(["Semua", ...cats]);
    }
  }, []);

  useEffect(() => { loadProduk(); }, [loadProduk]);

  useEffect(() => { setCurrentPage(1); }, [search, katFilter]);

  const filtered = produkList.filter(p => {
    const m = p.nama_produk.toLowerCase().includes(search.toLowerCase());
    const k = katFilter === "Semua" || p.kategori === katFilter;
    return m && k;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentProduk = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const addToCart = (p: Produk) => {
    if (p.stok <= 0) return;
    setCart(prev => {
      const ex = prev.find(c => c.produk.id === p.id);
      if (ex) { if (ex.qty >= p.stok) return prev; return prev.map(c => c.produk.id === p.id ? { ...c, qty: c.qty + 1 } : c); }
      return [...prev, { produk: p, qty: 1 }];
    });
  };
  const updQty = (id: number, d: number) => setCart(prev => prev.map(c => {
    if (c.produk.id !== id) return c;
    const nq = c.qty + d;
    if (nq <= 0 || nq > c.produk.stok) return c;
    return { ...c, qty: nq };
  }));
  const remFromCart = (id: number) => setCart(prev => prev.filter(c => c.produk.id !== id));
  const clearCart = () => { setCart([]); setInputBayar(""); };

  const subtotal = cart.reduce((s, c) => s + c.produk.harga_jual * c.qty, 0);
  const totalItem = cart.reduce((s, c) => s + c.qty, 0);
  const bayarNum = parseInt(inputBayar || "0");
  const kembalian = bayarNum - subtotal;

  const keypadPress = (k: string) => {
    if (k === "DEL") { setInputBayar(p => p.slice(0, -1)); return; }
    if (k === "C") { setInputBayar(""); return; }
    if (k === "000") { setInputBayar(p => p === "" ? "" : p + "000"); return; }
    setInputBayar(p => p + k);
  };

  const handleBayar = async () => {
    if (kembalian < 0 || cart.length === 0) return;
    setLoading(true);
    const user = getUser();
    const nomorTrx = genNomor();
    const waktu = new Date().toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    try {
      const { data: trxData, error } = await supabase.from("transaksi").insert({
        nomor_transaksi: nomorTrx,
        total_bayar: subtotal,
        jumlah_bayar: bayarNum,
        kembalian: kembalian,
        metode_bayar: "tunai",
        nama_kasir: user?.nama || "Kasir",
        id_user: user?.id || null,
      }).select().single();
      if (error) throw error;

      await supabase.from("detail_transaksi").insert(
        cart.map(c => ({
          id_transaksi: trxData.id,
          id_produk: c.produk.id,
          nama_produk: c.produk.nama_produk,
          jumlah: c.qty,
          harga_satuan: c.produk.harga_jual,
          subtotal: c.produk.harga_jual * c.qty,
        }))
      );
      await Promise.all(cart.map(c =>
        supabase.from("produk").update({ stok: c.produk.stok - c.qty }).eq("id", c.produk.id)
      ));
      setTrxSukses({ nomorTrx, cart: [...cart], total: subtotal, bayar: bayarNum, kembalian, waktu, kasir: user?.nama || "Kasir" });
      clearCart();
      loadProduk();
    } catch (e) {
      alert("Gagal menyimpan transaksi. Coba lagi.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const canPay = cart.length > 0 && bayarNum >= subtotal;

  return (
    <AppLayout title="Transaksi" subtitle="Proses transaksi penjualan">

      {/* SUKSES MODAL & PRINT AREA */}
      {trxSukses && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420, overflow: "hidden", background: "#f8fafc" }}>
            <div className="modal-header no-print" style={{ background: "#10b981", color: "white", padding: "16px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, fontSize: "1.15rem" }}>
                <CheckCircleIcon style={{ width: 24 }} />
                Transaksi Berhasil
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
                <div style={{ display: "flex" }}><span style={{ width: "60px" }}>Tanggal</span><span>: {trxSukses.waktu.replace(" pukul ", " ")}</span></div>
                <div style={{ display: "flex" }}><span style={{ width: "60px" }}>No.</span><span>: {trxSukses.nomorTrx}</span></div>
                <div style={{ display: "flex" }}><span style={{ width: "60px" }}>Kasir</span><span>: {trxSukses.kasir}</span></div>
                <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }}></div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 28px 60px", gap: "2px", fontWeight: "bold", marginBottom: "4px", minWidth: 0 }}>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>Produk</div><div style={{ textAlign: "right" }}>Qty</div><div style={{ textAlign: "right" }}>Harga</div>
                </div>
                <div style={{ borderBottom: "1px dashed #000", margin: "0 0 6px 0" }}></div>
                
                {trxSukses.cart.map((c, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 28px 60px", gap: "2px", marginBottom: "4px", minWidth: 0 }}>
                    <div style={{ minWidth: 0, wordBreak: "break-word", overflowWrap: "break-word", paddingRight: "4px" }}>{c.produk.nama_produk}</div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>{c.qty}</div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>{(c.produk.harga_jual * c.qty).toLocaleString("id-ID")}</div>
                  </div>
                ))}
                
                <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }}></div>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", fontWeight: "bold" }}><span>TOTAL</span><span>{trxSukses.total.toLocaleString("id-ID")}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span>Tunai</span><span>{trxSukses.bayar.toLocaleString("id-ID")}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}><span>Kembali</span><span>{trxSukses.kembalian.toLocaleString("id-ID")}</span></div>
                
                <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }}></div>
                <div style={{ textAlign: "center", marginTop: "6px" }}>
                  <div>Terima kasih! Selamat berbelanja</div>
                </div>
              </div>
            </div>

            <div className="modal-footer no-print" style={{ justifyContent: "center", gap: "12px", background: "#fff", borderTop: "1px solid #e2e8f0", flexShrink: 0 }}>
              <button
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#64748b", color: "white", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}
                onClick={() => setTrxSukses(null)}
              >
                Tutup
              </button>
              <button
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px 20px", borderRadius: "10px", border: "none", background: "#2563eb", color: "white", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" }}
                onClick={() => trxSukses && printStruk(trxSukses)}
              >
                <PrinterIcon style={{ width: 18 }} />Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="toolbar no-print">
        <div className="search-wrap" style={{ flex: 1 }}>
          <MagnifyingGlassIcon />
          <input className="form-input" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={katFilter} onChange={e => setKatFilter(e.target.value)}>
          {katList.map(k => <option key={k}>{k}</option>)}
        </select>
      </div>

      <div className="pos-layout no-print">

        {/* KIRI — PRODUK & KERANJANG */}
        <div className="pos-left-panel">


          {/* Produk Grid */}
          <div className="product-grid-area">
            <div className="product-grid">
              {currentProduk.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: "1/-1" }}>
                  <MagnifyingGlassIcon style={{ width: 40 }} /><h3>Produk tidak ditemukan</h3>
                </div>
              ) : currentProduk.map(p => {
                const imgUrl = getProductImage(p);
                return (
                  <div key={p.id} className={`product-card ${p.stok <= 0 ? "out-of-stock" : ""}`} onClick={() => addToCart(p)}>
                    {p.stok <= 5 && p.stok > 0 && <span className="product-stock-badge badge-yellow">Sisa {p.stok}</span>}
                    {p.stok <= 0 && <span className="product-stock-badge badge-red">Habis</span>}
                    <div className="product-img">
                      {imgUrl ? (
                        <img src={imgUrl} alt={p.nama_produk} style={{ width: "100%", height: "100%", objectFit: "contain", mixBlendMode: "multiply" }} />
                      ) : (
                        <span>{EMOJI[p.kategori] || "📦"}</span>
                      )}
                    </div>
                    <div className="product-name">{p.nama_produk}</div>
                    <div className="product-price">{fmt(p.harga_jual)}</div>
                    <div className="product-stock">Stok: {p.stok}</div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 24, paddingBottom: 8 }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ width: 42, height: 42, borderRadius: "50%", border: "2px solid #e2e8f0", background: currentPage === 1 ? "#f8fafc" : "#fff", color: currentPage === 1 ? "#cbd5e1" : "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", cursor: currentPage === 1 ? "not-allowed" : "pointer", transition: "0.2s" }}
                >
                  <ChevronLeftIcon style={{ width: 20 }} strokeWidth={2.5} />
                </button>
                <div style={{ fontWeight: 700, color: "#64748b", fontSize: "0.9rem" }}>
                  Halaman {currentPage} dari {totalPages}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ width: 42, height: 42, borderRadius: "50%", border: "2px solid #e2e8f0", background: currentPage === totalPages ? "#f8fafc" : "#fff", color: currentPage === totalPages ? "#cbd5e1" : "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", cursor: currentPage === totalPages ? "not-allowed" : "pointer", transition: "0.2s" }}
                >
                  <ChevronRightIcon style={{ width: 20 }} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          {/* Tabel Keranjang di Kiri Bawah */}
          <div className="cart-table-area">
            <div className="cart-table-header">
              <div style={{ flex: 1 }}>PRODUK</div>
              <div style={{ width: 140, textAlign: "center" }}>QTY</div>
              <div style={{ width: 140, textAlign: "right" }}>SUBTOTAL</div>
              <div style={{ width: 60 }}></div>
            </div>
            <div className="cart-table-body">
              {cart.length === 0 ? (
                <div className="empty-state" style={{ padding: "40px 20px" }}>
                  <ShoppingCartIcon style={{ width: 48, opacity: 0.15 }} />
                  <span style={{ fontSize: "0.95rem", color: "#94a3b8", fontWeight: 600 }}>Belum ada produk terpilih</span>
                </div>
              ) : cart.map(c => (
                <div key={c.produk.id} className="cart-table-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.produk.nama_produk}</div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>{fmt(c.produk.harga_jual)} / pcs</div>
                  </div>
                  <div style={{ width: 140, display: "flex", justifyContent: "center" }}>
                    <div className="cart-qty-pill">
                      <button onClick={() => updQty(c.produk.id, -1)}>−</button>
                      <span>{c.qty}</span>
                      <button onClick={() => updQty(c.produk.id, 1)}>+</button>
                    </div>
                  </div>
                  <div style={{ width: 140, textAlign: "right", fontWeight: 800, color: "#0284c7", fontSize: "1rem" }}>
                    {fmt(c.produk.harga_jual * c.qty)}
                  </div>
                  <div style={{ width: 60, display: "flex", justifyContent: "flex-end" }}>
                    <button className="cart-btn-del" onClick={() => remFromCart(c.produk.id)}>
                      <TrashIcon style={{ width: 16 }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KANAN — PAYMENT PANEL (KALKULATOR) */}
        <div className="calc-panel">
          <div className="calc-header">
            <div className="calc-total-label">Total Tagihan</div>
            <div className="calc-total-val">{fmt(subtotal)}</div>
          </div>

          <div className="calc-body">
            <div className="calc-input-label">Uang Tunai Pelanggan (Rp)</div>
            <input 
              type="text"
              className="calc-input-box"
              placeholder="0"
              value={inputBayar ? fmt(parseInt(inputBayar)) : ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setInputBayar(val);
              }}
            />

            <div className="calc-kembali-row">
              <span>Kembalian</span>
              <span className={kembalian < 0 ? "text-red" : "text-green"}>
                {inputBayar ? fmt(Math.max(0, kembalian)) : "–"}
              </span>
            </div>

            <div className="calc-numpad">
              {["7","8","9","4","5","6","1","2","3","C","0","DEL"].map(k => (
                <button
                  key={k}
                  className={`calc-num-btn ${k === "DEL" ? "btn-del" : ""} ${k === "C" ? "btn-clear" : ""}`}
                  onClick={() => keypadPress(k)}
                >
                  {k === "DEL" ? <BackspaceIcon style={{ width: 22, margin: "0 auto" }} /> : k}
                </button>
              ))}
              <button className="calc-num-btn btn-000" onClick={() => keypadPress("000")}>000</button>
              <button className="calc-num-btn btn-uang-pas" onClick={() => setInputBayar(String(subtotal))}>UANG PAS</button>
            </div>

            <button
              className={`calc-bayar-btn ${!canPay || loading ? "disabled" : ""}`}
              onClick={handleBayar}
              disabled={!canPay || loading}
            >
              {loading ? "Memproses..." : <><BanknotesIcon style={{ width: 22 }} /> Konfirmasi Pembayaran</>}
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}