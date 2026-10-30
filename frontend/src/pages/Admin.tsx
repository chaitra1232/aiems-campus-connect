import { useState } from "react";
import { Check, X } from "lucide-react";
import { api } from "../api";
import { useLoad } from "../hooks";
import { fmtDate } from "../utils";

export default function Admin() {
  const pending = useLoad<any[]>(() => api.get("/admin/events/pending"), []);
  const stats = useLoad<any>(() => api.get("/admin/stats"), null);
  const [err, setErr] = useState("");
  const decide = async (id: number, d: "approve" | "reject") => {
    setErr("");
    try { await api.post(`/admin/events/${id}/${d}`); pending.reload(); stats.reload(); } catch (e: any) { setErr(e.message); }
  };
  const s = stats.data;
  return (
    <div className="page">
      <header className="page-head"><h1>Admin overview</h1></header>
      {s && (
        <div className="glass summary wide">
          <div><b>{s.students}</b><span>students</span></div>
          <div><b>{s.societies}</b><span>societies</span></div>
          <div><b>{s.approved_events}</b><span>published events</span></div>
          <div><b>{s.pending_events}</b><span>awaiting approval</span></div>
          <div><b>{s.registrations}</b><span>registrations</span></div>
          <div><b>{s.checked_in}</b><span>check-ins</span></div>
        </div>
      )}
      <h2>Approval queue</h2>
      {(err || pending.error) && <p className="error" role="alert">{err || pending.error}</p>}
      {!pending.loading && pending.data.length === 0 && <p className="empty glass">Nothing waiting. New submissions will show up here.</p>}
      {pending.data.map((e) => (
        <article key={e.id} className="glass row-card">
          <div className="grow"><h3>{e.title}</h3><p className="muted">{e.society} · {fmtDate(e.start_time)} · {e.venue} · capacity {e.capacity}</p><p>{e.description}</p></div>
          <div className="col">
            <button className="btn small" onClick={() => decide(e.id, "approve")}><Check size={14} /> Approve</button>
            <button className="btn danger small" onClick={() => decide(e.id, "reject")}><X size={14} /> Reject</button>
          </div>
        </article>
      ))}
    </div>
  );
}
