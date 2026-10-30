const BASE: string = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

export const getToken = () => localStorage.getItem("token");

async function request(path: string, init: RequestInit = {}, json?: unknown) {
  const headers: Record<string, string> = { ...((init.headers as Record<string, string>) || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    init = { ...init, body: JSON.stringify(json) };
  }
  let res: Response;
  try {
    res = await fetch(BASE + path, { ...init, headers });
  } catch {
    throw new Error("Cannot reach the server. Make sure the backend is running on port 8000.");
  }
  if (res.status === 401 && token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const d = data?.detail;
    throw new Error(typeof d === "string" ? d : Array.isArray(d) ? d.map((x: any) => x.msg).join(", ") : "Something went wrong");
  }
  return data;
}

export const api = {
  get: (p: string) => request(p),
  post: (p: string, body?: unknown) => request(p, { method: "POST" }, body ?? {}),
  del: (p: string) => request(p, { method: "DELETE" }),
  login: async (email: string, password: string) => {
    const form = new URLSearchParams({ username: email, password });
    return request("/auth/login", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  },
  download: async (p: string, filename: string) => {
    const res = await fetch(BASE + p, { headers: { Authorization: `Bearer ${getToken()}` } });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },
};
