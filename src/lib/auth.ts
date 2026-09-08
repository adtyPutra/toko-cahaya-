"use client";

export interface User {
  id: string;
  username: string;
  nama: string;
  role: "owner" | "kasir";
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("pos_user");
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    const loginTime = parsed.loginTime;
    
    // Cek apakah sudah lebih dari 12 jam (12 * 60 * 60 * 1000 = 43200000 ms)
    if (loginTime && Date.now() - loginTime > 43200000) {
      localStorage.removeItem("pos_user");
      return null;
    }
    
    return parsed as User;
  } catch {
    return null;
  }
}

export function setUser(user: User) {
  const data = { ...user, loginTime: Date.now() };
  localStorage.setItem("pos_user", JSON.stringify(data));
}

export function removeUser() {
  localStorage.removeItem("pos_user");
}
