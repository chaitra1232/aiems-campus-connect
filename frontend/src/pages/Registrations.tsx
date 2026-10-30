import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer } from "lucide-react";
import { api } from "../api";
import { useLoad } from "../hooks";
import EventModal from "../components/EventModal";
import { fmtDate, toDate } from "../utils";

export default function Registrations() {
  const regs = useLoad<any[]>(() => api.get("/my/registrations"), []);
  const [open, setOpen] = useState<any>(null);
  const upcoming = regs.data.filter((r) => toDate(r.event.start_time) > new Date());
  const past = regs.data.filter((r) => toDate(r.event.start_time) <= new Date());

  const Ticket = ({ r }: { r: any }) => (
    <article className="glass ticket-card">
      <div className="qr"><QRCodeSVG value={r.ticket_code} size={96} bgColor="#ffffff" fgColor="#0b0d22" /><i className="scan" /></div>
      <div className="grow">
        <h3>{r.event.title}</h3>
        <p className="muted">{r.event.society} · {fmtDate(r.event.start_time)} · {r.event.venue}</p>
        <div className="code">{r.ticket_code}</div>
        <span className={"status " + (r.checked_in_at ? "registered" : "open")}>{r.checked_in_at ? "Attended" : "Confirmed"}</span>
      </div>
      <div className="col">
        <button className="btn ghost small" onClick={() => setOpen(r.event)}>Details</button>
        <button className="btn ghost small" onClick={() => window.print()}><Printer size={14} /> Print</button>
      </div>
    </article>
  );

  return (
    <div className="page">
      <header className="page-head"><h1>My registrations</h1></header>
      {regs.error && <p className="error" role="alert">{regs.error}</p>}
      <h2>Upcoming</h2>
      {regs.loading ? <p className="muted">Loading…</p> : upcoming.length === 0 ? <p className="empty glass">No upcoming registrations. Head to Explore Events to find one.</p> : upcoming.map((r) => <Ticket key={r.ticket_code} r={r} />)}
      {past.length > 0 && <><h2>Past</h2>{past.map((r) => <Ticket key={r.ticket_code} r={r} />)}</>}
      {open && <EventModal event={open} ticket={regs.data.find((r) => r.event.id === open.id)?.ticket_code} canRegister onClose={() => setOpen(null)} onChanged={regs.reload} />}
    </div>
  );
}
