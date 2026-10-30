import { FormEvent, useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { api } from "../api";
import { useLoad } from "../hooks";

export default function CheckIn() {
  const events = useLoad<any[]>(() => api.get("/organizer/events"), []);
  const approved = events.data.filter((e) => e.status === "approved");
  const [eventId, setEventId] = useState("");
  const [code, setCode] = useState("");
  const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!eventId && approved[0]) setEventId(String(approved[0].id)); }, [approved.length]);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!eventId || !code.trim()) return setRes({ ok: false, text: "Choose an event and enter a ticket code." });
    setBusy(true);
    try {
      const r = await api.post("/checkin", { event_id: Number(eventId), ticket_code: code });
      setRes({ ok: true, text: `Checked in: ${r.student} (${r.ticket_code})` });
      setCode(""); events.reload();
    } catch (e: any) { setRes({ ok: false, text: e.message }); }
    finally { setBusy(false); input.current?.focus(); }
  };
  const cur = approved.find((e) => String(e.id) === eventId);

  return (
    <div className="page">
      <header className="page-head"><h1>Attendance check-in</h1></header>
      <form className="glass form narrow" onSubmit={submit}>
        <label>Event<select value={eventId} onChange={(e) => setEventId(e.target.value)}>
          {approved.length === 0 && <option value="">No approved events yet</option>}
          {approved.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
        <label>Ticket code<input ref={input} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. 3F9A1C2B7D40" autoFocus autoComplete="off" /></label>
        <p className="muted small">Type the code under the student's QR ticket, or use a hardware QR scanner, which types the code for you. Camera scanning is not built yet.</p>
        <button className="btn" disabled={busy}><ScanLine size={16} /> {busy ? "Checking…" : "Check in"}</button>
        {res && <p className={res.ok ? "ok big" : "error big"} role="status">{res.text}</p>}
        {cur && <p className="muted">{cur.checked_in} of {cur.registered} registered students checked in.</p>}
      </form>
    </div>
  );
}
