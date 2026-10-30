import { FormEvent, useState } from "react";
import { Download, Users, X } from "lucide-react";
import { api } from "../api";
import { useLoad } from "../hooks";
import { fmtDate, localToIso } from "../utils";

const EMPTY = { title: "", description: "", category: "Technical", venue: "", start: "", deadline: "", capacity: "50" };

export default function OrganizerEvents() {
  const events = useLoad<any[]>(() => api.get("/organizer/events"), []);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);
  const [people, setPeople] = useState<{ event: any; rows: any[] } | null>(null);
  const [status, setStatus] = useState("all");
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const submit = async (ev: FormEvent) => {
    ev.preventDefault(); setErr(""); setOk("");
    if (!f.start || !f.deadline) return setErr("Choose both a start time and a registration deadline.");
    if (new Date(f.deadline) > new Date(f.start)) return setErr("The registration deadline must be before the event starts.");
    setBusy(true);
    try {
      await api.post("/events", { title: f.title, description: f.description, category: f.category, venue: f.venue,
        start_time: localToIso(f.start), registration_deadline: localToIso(f.deadline), capacity: Number(f.capacity) });
      setOk("Event submitted. It will appear to students once an admin approves it.");
      setF(EMPTY); events.reload();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  const showPeople = async (event: any) => {
    try { setPeople({ event, rows: await api.get(`/organizer/events/${event.id}/registrations`) }); } catch (e: any) { setErr(e.message); }
  };
  const rows = events.data.filter((e) => status === "all" || e.status === status);
  const total = events.data.reduce((a, e) => a + e.registered, 0);
  const attended = events.data.reduce((a, e) => a + e.checked_in, 0);

  return (
    <div className="page">
      <header className="page-head"><h1>My society's events</h1></header>
      <div className="glass summary wide">
        <div><b>{events.data.length}</b><span>events created</span></div>
        <div><b>{events.data.filter((e) => e.status === "pending").length}</b><span>awaiting approval</span></div>
        <div><b>{total}</b><span>registrations</span></div>
        <div><b>{attended}</b><span>checked in</span></div>
      </div>

      <div className="grid-two">
        <form className="glass form" onSubmit={submit} noValidate>
          <h2>Create an event</h2>
          <label>Title<input value={f.title} onChange={set("title")} required minLength={3} /></label>
          <label>Description<textarea rows={3} value={f.description} onChange={set("description")} /></label>
          <div className="two">
            <label>Category<select value={f.category} onChange={set("category")}><option>Technical</option><option>Cultural</option><option>Sports</option></select></label>
            <label>Capacity<input type="number" min={1} value={f.capacity} onChange={set("capacity")} /></label>
          </div>
          <label>Venue<input value={f.venue} onChange={set("venue")} required /></label>
          <div className="two">
            <label>Starts<input type="datetime-local" value={f.start} onChange={set("start")} required /></label>
            <label>Register by<input type="datetime-local" value={f.deadline} onChange={set("deadline")} required /></label>
          </div>
          {err && <p className="error" role="alert">{err}</p>}
          {ok && <p className="ok" role="status">{ok}</p>}
          <button className="btn" disabled={busy}>{busy ? "Submitting…" : "Submit for approval"}</button>
        </form>

        <section>
          <div className="row between"><h2>Your events</h2>
            <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
          </div>
          {events.error && <p className="error" role="alert">{events.error}</p>}
          {!events.loading && rows.length === 0 && <p className="empty glass">No events yet. Create your first one.</p>}
          {rows.map((e) => (
            <article key={e.id} className="glass row-card">
              <div className="grow"><h3>{e.title}</h3><p className="muted">{fmtDate(e.start_time)} · {e.venue}</p>
                <div className="bar"><span style={{ width: Math.min(100, (e.registered / e.capacity) * 100) + "%" }} /></div>
                <small className="muted">{e.registered}/{e.capacity} registered · {e.checked_in} checked in</small></div>
              <div className="col"><span className={"status " + e.status}>{e.status}</span>
                <button className="btn ghost small" onClick={() => showPeople(e)}><Users size={14} /> People</button>
                <button className="btn ghost small" onClick={() => api.download(`/organizer/events/${e.id}/registrations.csv`, `${e.title}.csv`).catch((x) => setErr(x.message))}><Download size={14} /> CSV</button></div>
            </article>
          ))}
        </section>
      </div>

      {people && (
        <div className="overlay" onClick={() => setPeople(null)}>
          <div className="modal glass" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="icon-btn close" onClick={() => setPeople(null)} aria-label="Close"><X size={18} /></button>
            <h2>{people.event.title}</h2>
            {people.rows.length === 0 ? <p className="muted">Nobody has registered yet.</p> : (
              <div className="table-wrap"><table><thead><tr><th>Name</th><th>Dept</th><th>Ticket</th><th>Status</th></tr></thead>
                <tbody>{people.rows.map((r) => <tr key={r.ticket_code}><td>{r.name}</td><td>{r.department || "-"}</td><td>{r.ticket_code}</td><td>{r.checked_in_at ? "Checked in" : "Registered"}</td></tr>)}</tbody></table></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
