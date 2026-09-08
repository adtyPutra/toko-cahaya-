"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { ExclamationTriangleIcon as ExclamationTriangleSolid, CheckCircleIcon as CheckCircleSolid, ExclamationCircleIcon as ExclamationCircleSolid } from "@heroicons/react/24/solid";

interface Kasir {
  id: string;
  username: string;
  nama: string;
}

const EMPTY: Partial<Kasir> & { password?: string } = { username: "", nama: "", password: "" };

export default function KasirManagementPage() {
  const [list, setList] = useState<Kasir[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [selected, setSelected] = useState<Kasir | null>(null);
  const [form, setForm] = useState<Partial<Kasir> & { password?: string }>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("users").select("id, username, nama").eq("role", "kasir");
    setList(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = list.filter(k => 
    k.nama.toLowerCase().includes(search.toLowerCase()) || 
    k.username.toLowerCase().includes(search.toLowerCase())
  );

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const openAdd = () => { setForm(EMPTY); setModal("add"); };
  const openEdit = (k: Kasir) => { setForm({ ...k, password: "" }); setModal("edit"); };
  const openDelete = (k: Kasir) => { setSelected(k); setModal("delete"); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "add") {
        if (!form.password) throw new Error("Password wajib diisi untuk akun baru");
        
        // Simpan langsung password (sesuai sistem sederhana yang ada)
        const { error } = await supabase.from("users").insert({ 
          username: form.username,
          nama: form.nama,
          password: form.password,
          role: "kasir"
        });
        if (error) {
          if (error.code === '23505') throw new Error("Username sudah digunakan");
          throw error;
        }
        showMsg("success", "Akun kasir berhasil ditambahkan!");
      } else if (modal === "edit" && form.id) {
        const updateData: any = {
          nama: form.nama,
          username: form.username
        };
        // Update password jika diisi
        if (form.password) {
          updateData.password = form.password;
        }

        const { error } = await supabase.from("users").update(updateData).eq("id", form.id);
        if (error) {
          if (error.code === '23505') throw new Error("Username sudah digunakan");
          throw error;
        }
        showMsg("success", "Akun kasir berhasil diperbarui!");
      }
      setModal(null);
      load();
    } catch (e: any) {
      showMsg("error", e.message || "Terjadi kesalahan, coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("users").delete().eq("id", selected.id);
      if (error) throw error;
      showMsg("success", `Akun kasir ${selected.nama} berhasil dihapus.`);
      setModal(null);
      load();
    } catch {
      showMsg("error", "Gagal menghapus kasir. Pastikan kasir tidak terikat dengan data transaksi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Manajemen Kasir" subtitle="Kelola akun dan akses kasir">
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
          {msg.type === "success" ? <CheckCircleSolid style={{ width: 24 }} /> : <ExclamationCircleSolid style={{ width: 24 }} />}
          {msg.text}
        </div>
      )}

      <div className="toolbar" style={{ background: "white", padding: "20px 24px", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
        <div>
          <div className="page-title" style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px" }}>Manajemen Kasir</div>
          <div className="page-subtitle" style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "4px", fontWeight: 500 }}>Total {list.length} akun terdaftar</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ padding: "12px 20px", borderRadius: "12px", fontSize: "0.95rem", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)", justifyContent: "center" }}><PlusIcon style={{ width: 20 }} strokeWidth={2.5} /> Tambah Kasir Baru</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: "16px", background: "#f8fafc" }}>
          <div className="search-wrap" style={{ flex: 1, maxWidth: 400 }}>
            <MagnifyingGlassIcon style={{ width: 20, height: 20 }} />
            <input className="form-input" style={{ paddingLeft: "42px", borderRadius: "10px", border: "1px solid #e2e8f0" }} placeholder="Cari nama atau username..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="table-wrap" style={{ margin: 0 }}>
          <table className="data-table">
            <colgroup>
              <col style={{ width: "40%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>Nama Kasir</th>
                <th style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>Username</th>
                <th style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", fontWeight: 600 }}>Memuat data kasir...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: "center", padding: "3rem" }}><div className="empty-state" style={{ padding: 0 }}><MagnifyingGlassIcon style={{ width: 48, opacity: 0.3 }} /><h3 style={{ marginTop: "12px" }}>Kasir tidak ditemukan</h3></div></td></tr>
              ) : filtered.map((k) => (
                <tr key={k.id} style={{ transition: "0.2s" }}>
                  <td style={{ fontWeight: 700, color: "#1e293b", textAlign: "center" }}>{k.nama}</td>
                  <td style={{ fontFamily: "monospace", color: "#64748b", fontWeight: 600, textAlign: "center", fontSize: "0.95rem" }}>{k.username}</td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button className="btn btn-primary btn-sm" onClick={() => openEdit(k)} style={{ padding: "8px 16px" }}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => openDelete(k)} disabled={saving} style={{ padding: "8px 16px" }}>
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
          <div className="modal-box" style={{ maxWidth: 450 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{modal === "add" ? "Tambah Kasir Baru" : "Edit Akun Kasir"}</div>
              <button className="modal-close" onClick={() => setModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input className="form-input" placeholder="Masukkan nama kasir" value={form.nama || ""} onChange={e => setForm({ ...form, nama: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input className="form-input" placeholder="Untuk login" value={form.username || ""} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Password {modal === "edit" && <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: "0.8rem" }}>(Kosongkan jika tidak ingin mengubah)</span>} {modal === "add" && "*"}</label>
                <div style={{ position: "relative" }}>
                  <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Password akun" value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} style={{ paddingRight: "40px" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                    {showPassword ? <EyeSlashIcon style={{ width: 20 }} /> : <EyeIcon style={{ width: 20 }} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.nama || !form.username}>
                {saving ? "Menyimpan..." : modal === "add" ? "Tambah Kasir" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {modal === "delete" && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 420, background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "white", textAlign: "center", border: "none", padding: "12px" }} onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ padding: "40px 24px 24px" }}>
              <div style={{ background: "rgba(255,255,255,0.2)", width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                <ExclamationTriangleIcon style={{ width: 40, color: "white" }} />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "12px", color: "white" }}>Hapus Kasir?</h2>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                Anda yakin ingin menghapus akun <strong style={{ color: "white", fontWeight: 800 }}>{selected.nama}</strong>?<br/>
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

    </AppLayout>
  );
}
