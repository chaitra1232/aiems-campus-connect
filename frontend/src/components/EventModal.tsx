import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import { api } from "../api";
import { fmtDate, fmtDay, isClosed } from "../utils";

export default function EventModal({ event, ticket, canRegister, onClose, onChanged }:
  { event: any; ticket?: string; canRegister: boolean; onClose: () => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [code, setCode] = useState(ticket);
  useEffect(() => { setCode(ticket); }, [ticket]);
  useEffect(() => {
    const h = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const act = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true); setErr(""); setMsg("");
    try { const r = await fn(); setMsg(ok); if (r?.ticket_code) setCode(r.ticket_code); else setCode(undefined); onChanged(); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };
  const closed = isClosed(event);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal glass" role="dialog" aria-modal="true" aria-label={event.title} onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <span className="chip">{event.society} · {event.category}</span>
        <h2>{event.title}</h2>
        <p>{event.description || "No description yet."}</p>
        <dl className="facts">
          <div><dt>When</dt><dd>{fmtDate(event.start_time)}</dd></div>
          <div><dt>Where</dt><dd>{event.venue}</dd></div>
          <div><dt>Register by</dt><dd>{fmtDay(event.registration_deadline)}</dd></div>
          <div><dt>Seats</dt><dd>{event.registered} registered of {event.capacity}</dd></div>
        </dl>
        {code && (
          <div className="ticket">
            <div className="qr"><QRCodeSVG value={code} size={120} bgColor="#ffffff" fgColor="#0b0d22" /><i className="scan" /></div>
            <div><small className="muted">Your ticket code</small><div className="code">{code}</div></div>
          </div>
        )}
        {msg && <p className="ok" role="status">{msg}</p>}
        {err && <p className="error" role="alert">{err}</p>}
        {canRegister && (
          <div className="row">
            {code ? (
              <button className="btn danger" disabled={busy} onClick={() => act(() => api.del(`/events/${event.id}/register`), "Registration cancelled")}>Cancel registration</button>
            ) : (
              <button className="btn" disabled={busy || closed || event.seats_left === 0}
                onClick={() => act(() => api.post(`/events/${event.id}/register`), "You're registered. Your ticket is ready.")}>
                {closed ? "Registration closed" : event.seats_left === 0 ? "Event full" : busy ? "Registering…" : "Register now"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
