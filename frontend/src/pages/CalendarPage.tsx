import { useState } from "react";
import { api } from "../api";
import { useLoad } from "../hooks";
import MonthCalendar from "../components/MonthCalendar";
import EventModal from "../components/EventModal";

export default function CalendarPage() {
  const isStudent = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}").role === "student"; } catch { return false; } })();
  const events = useLoad<any[]>(() => api.get("/events"), []);
  const regs = useLoad<any[]>(() => (isStudent ? api.get("/my/registrations") : Promise.resolve([])), []);
  const [open, setOpen] = useState<any>(null);
  return (
    <div className="page">
      <header className="page-head"><h1>Event calendar</h1></header>
      {events.error && <p className="error" role="alert">{events.error}</p>}
      <div className="narrow"><MonthCalendar events={events.data} onPick={setOpen} /></div>
      {open && <EventModal event={open} ticket={regs.data.find((r) => r.event.id === open.id)?.ticket_code} canRegister={isStudent} onClose={() => setOpen(null)} onChanged={() => { events.reload(); regs.reload(); }} />}
    </div>
  );
}
