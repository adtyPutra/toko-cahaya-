"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, CubeIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon as ExclamationTriangleSolid, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/solid";

interface Produk {
  id: number;
  nama_produk: string;
  kategori: string;
  stok: number;
  harga_beli: number;
  harga_jual: number;
  foto: string;
}

const EMPTY: Partial<Produk> = { nama_produk: "", kategori: "", stok: 0, harga_beli: 0, harga_jual: 0 };

function formatRupiah(val: number) {
  return "Rp " + val.toLocaleString("id-ID");
}

export default function ProdukPage() {
  const [list, setList] = useState<Produk[]>([]);
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("Semua");
  const [modal, setModal] = useState<"add" | "edit" | "delete" | "kategori" | null>(null);
  const [form, setForm] = useState<Partial<Produk>>(EMPTY);
  const [newKategori, setNewKategori] = useState("");
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(prev => ({ ...prev, foto: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const [selected, setSelected] = useState<Produk | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("produk").select("*").order("nama_produk");
    setList(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const [customKategori, setCustomKategori] = useState<string[]>([]);
  
  const kategoriList = ["Semua", ...Array.from(new Set([...list.map(p => p.kategori), ...customKategori]))];
  const filtered = list.filter(p => {
    const mS = p.nama_produk.toLowerCase().includes(search.toLowerCase());
    const mK = kategoriFilter === "Semua" || p.kategori === kategoriFilter;
    return mS && mK;
  });

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const openAdd = () => { setForm(EMPTY); setModal("add"); };
  const openEdit = (p: Produk) => { setSelected(p); setForm({ ...p }); setModal("edit"); };
  const openDelete = (p: Produk) => { setSelected(p); setModal("delete"); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { 
        ...form, 
        stok: Number(form.stok) || 0, 
        harga_jual: Number(form.harga_jual) || 0,
        harga_beli: Number(form.harga_beli) || 0,
      };
      
      if (modal === "add") {
        const { error } = await supabase.from("produk").insert({ ...payload, foto: payload.foto || "default.jpg" });
        if (error) throw error;
        showMsg("success", "Produk berhasil ditambahkan!");
      } else if (modal === "edit" && selected) {
        const { error } = await supabase.from("produk").update(payload).eq("id", selected.id);
        if (error) throw error;
        showMsg("success", "Produk berhasil diperbarui!");
      }
      setModal(null);
      load();
    } catch {
      showMsg("error", "Terjadi kesalahan, coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("produk").delete().eq("id", selected.id);
      if (error) throw error;
      showMsg("success", "Produk berhasil dihapus!");
      setModal(null);
      load();
    } catch {
      showMsg("error", "Gagal menghapus produk.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Manajemen Produk" subtitle="Kelola stok dan data produk toko">
      {msg && (
        <div style={{
          position: "fixed", top: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 9999,
          background: msg.type === "success" ? "#10b981" : "#ef4444",
          color: "white", padding: "16px 24px", borderRadius: "12px",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)", fontWeight: 700,
          display: "flex", alignItems: "center", gap: "12px",
          transition: "all 0.3s ease",
          fontSize: "1rem"
        }}>
          {msg.type === "success" ? <CheckCircleIcon style={{ width: 24 }} /> : <ExclamationCircleIcon style={{ width: 24 }} />}
          {msg.text}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "0.875rem", flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <MagnifyingGlassIcon style={{ width: 18, height: 18 }} />
            <input className="form-input" style={{ paddingLeft: "2.5rem" }} placeholder="Cari nama produk..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" style={{ minWidth: "150px" }} value={kategoriFilter} onChange={e => setKategoriFilter(e.target.value)}>
            {kategoriList.map(k => <option key={k}>{k}</option>)}
          </select>
          <div style={{ display: "flex", gap: "8px", flex: 1, minWidth: "250px" }}>
            <button className="btn btn-primary" onClick={() => { setNewKategori(""); setModal("kategori"); }} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 8px", fontSize: "0.85rem" }}>
              <PlusIcon style={{ width: 16 }} /> Kategori
            </button>
            <button className="btn btn-primary" onClick={openAdd} style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 8px", fontSize: "0.85rem" }}>
              <PlusIcon style={{ width: 16 }} /> Produk
            </button>
          </div>
        </div>

        <div className="table-wrap" style={{ margin: 0 }}>
          <table className="data-table">
            <colgroup>
              <col style={{ width: "80px" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "25%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>Foto</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th style={{ textAlign: "center" }}>Stok</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><MagnifyingGlassIcon style={{ width: 36 }} /><h3>Produk tidak ditemukan</h3></div></td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id}>
                  <td style={{ textAlign: "center", padding: "12px 16px" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {p.foto && p.foto !== "default.jpg" ? (
                        <img src={p.foto.startsWith("http") || p.foto.startsWith("/images") || p.foto.startsWith("data:image") ? p.foto : `/images/products/${p.foto}`} alt={p.nama_produk} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <CubeIcon style={{ width: 24, color: "var(--text-muted)" }} />
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.nama_produk}</td>
                  <td style={{ whiteSpace: "nowrap" }}><span className="badge badge-blue">{p.kategori}</span></td>
                  <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>{formatRupiah(Number(p.harga_jual))}</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ 
                      fontWeight: 700, 
                      color: p.stok <= 0 ? "var(--danger)" : p.stok <= 10 ? "var(--warning)" : "var(--text)",
                      display: "inline-flex", alignItems: "center", gap: "4px"
                    }}>
                      {p.stok <= 10 && p.stok > 0 && <ExclamationTriangleSolid style={{ width: 14, color: "var(--warning)" }} />}
                      {p.stok}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      <button className="btn btn-sm" style={{ background: "var(--primary)", color: "white", padding: "6px 14px" }} onClick={() => openEdit(p)}>
                        Edit
                      </button>
                      <button className="btn btn-sm" style={{ background: "var(--danger)", color: "white", padding: "6px 14px" }} onClick={() => openDelete(p)}>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal === "add" ? "Tambah Produk" : "Edit Produk"}</div>
              <button className="modal-close" onClick={() => setModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nama Produk *</label>
                  <input className="form-input" placeholder="Contoh: Minyak Goreng Bimoli 2L" value={form.nama_produk || ""} onChange={e => setForm({ ...form, nama_produk: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori *</label>
                  <input className="form-input" list="kategori-options" placeholder="Pilih atau Ketik Kategori Baru..." value={form.kategori || ""} onChange={e => setForm({ ...form, kategori: e.target.value })} />
                  <datalist id="kategori-options">
                    {kategoriList.filter(k => k !== "Semua").map(k => <option key={k} value={k} />)}
                  </datalist>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Harga (Rp) *</label>
                  <input className="form-input" type="number" placeholder="0" value={form.harga_jual ?? ""} onChange={e => setForm({ ...form, harga_jual: e.target.value === "" ? "" as any : Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stok *</label>
                  <input className="form-input" type="number" placeholder="0" value={form.stok ?? ""} onChange={e => setForm({ ...form, stok: e.target.value === "" ? "" as any : Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Foto Produk *</label>
                <label className="file-upload-box">
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
                  {form.foto && form.foto.startsWith("data:image") ? (
                    <img src={form.foto} alt="Preview" />
                  ) : form.foto && form.foto !== "default.jpg" ? (
                    <img src={form.foto.startsWith("http") || form.foto.startsWith("/images") ? form.foto : `/images/products/${form.foto}`} alt="Preview" />
                  ) : (
                    <>
                      <PhotoIcon style={{ width: 40, color: "var(--text-muted)", marginBottom: 4 }} />
                      <span style={{ fontSize: "0.9rem", color: "var(--text)", fontWeight: 600 }}>Klik untuk unggah foto</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Format yang didukung: JPG, PNG</span>
                    </>
                  )}
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.nama_produk || !form.kategori || !form.foto || form.foto === "default.jpg"}>
                {saving ? "Menyimpan..." : modal === "add" ? "Tambah Produk" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {modal === "delete" && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 420, background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "white", textAlign: "center", border: "none", padding: "12px" }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ padding: "40px 24px 24px" }}>
              <div style={{ background: "rgba(255,255,255,0.2)", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <ExclamationTriangleIcon style={{ width: 40, color: "white" }} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "12px", color: "white" }}>Hapus Produk?</h2>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                Anda yakin ingin menghapus <strong style={{ color: "white", fontWeight: 800 }}>{selected.nama_produk}</strong>?<br/>
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="modal-footer" style={{ background: "transparent", borderTop: "none", justifyContent: "center", gap: "16px", paddingBottom: "32px" }}>
              <button className="btn" style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "none", flex: 1 }} onClick={() => setModal(null)}>Batal</button>
              <button className="btn" style={{ background: "white", color: "#dc2626", border: "none", flex: 1, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} onClick={handleDelete} disabled={saving}>{saving ? "Menghapus..." : "Ya, Hapus"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Kategori Modal */}
      {modal === "kategori" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Tambah Kategori Baru</div>
              <button className="modal-close" onClick={() => setModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Kategori</label>
                <input className="form-input" placeholder="Contoh: Sembako, Minuman, Snack" value={newKategori} onChange={e => setNewKategori(e.target.value)} autoFocus />
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>
                Kategori ini akan tersedia di opsi saat Anda menambahkan produk baru.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={() => {
                if (newKategori.trim()) {
                  setCustomKategori(prev => [...prev, newKategori.trim()]);
                  showMsg("success", "Kategori berhasil ditambahkan ke daftar opsi!");
                  setModal(null);
                }
              }} disabled={!newKategori.trim()}>Simpan Kategori</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
