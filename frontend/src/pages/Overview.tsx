import { useState } from "react";
import { Search } from "lucide-react";
import { api } from "../api";
import { useLoad } from "../hooks";
import EventCard from "../components/EventCard";
import EventModal from "../components/EventModal";
import MonthCalendar from "../components/MonthCalendar";
import { fmtDate, toDate } from "../utils";
import type { User } from "../App";

export default function Overview({ user }: { user: User }) {
  const events = useLoad<any[]>(() => api.get("/events"), []);
  const regs = useLoad<any[]>(() => api.get("/my/registrations"), []);
  const recs = useLoad<any[]>(() => api.get("/recommendations"), []);
  const notes = useLoad<any[]>(() => api.get("/notifications"), []);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<any>(null);

  const reload = () => { events.reload(); regs.reload(); recs.reload(); notes.reload(); };
  const ticketFor = (id: number) => regs.data.find((r) => r.event.id === id)?.ticket_code;
  const upcoming = events.data.filter((e) => toDate(e.start_time) > new Date() && e.title.toLowerCase().includes(q.toLowerCase()));
  const myUpcoming = regs.data.filter((r) => toDate(r.event.start_time) > new Date());
  const err = events.error || regs.error;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="muted">{myUpcoming.length > 0 ? `You have ${myUpcoming.length} upcoming ${myUpcoming.length === 1 ? "event" : "events"}.` : "You have no registered events yet. Pick one below."}</p>
        </div>
        <label className="search"><Search size={16} /><input placeholder="Search events" aria-label="Search events" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </header>
      {err && <p className="error" role="alert">{err}</p>}

      <div className="grid-main">
        <section>
          <h2>Upcoming events</h2>
          {events.loading ? <p className="muted">Loading events…</p> : upcoming.length === 0 ? <p className="empty glass">No events match. Try a different search.</p> : (
            <div className="cards">
              {upcoming.slice(0, 6).map((e) => <EventCard key={e.id} e={e} registered={!!ticketFor(e.id)} onOpen={setOpen} />)}
            </div>
          )}

          {recs.data.length > 0 && (
            <>
              <h2>Recommended for you</h2>
              <p className="muted small">Picked by simple rules (your registrations and open seats), not machine learning.</p>
              <div className="cards">{recs.data.slice(0, 3).map((e) => <EventCard key={e.id} e={e} reason={e.reason} onOpen={setOpen} />)}</div>
            </>
          )}
        </section>

        <aside className="side-col">
          <div className="glass summary">
            <div><b>{regs.data.length}</b><span>registered</span></div>
            <div><b>{regs.data.filter((r) => r.checked_in_at).length}</b><span>attended</span></div>
            <div><b>{myUpcoming.length}</b><span>coming up</span></div>
          </div>
          <MonthCalendar events={events.data} onPick={setOpen} />
          <div className="glass panel">
            <h3>Notifications</h3>
            {notes.data.length === 0 && <p className="muted">Nothing yet. Register for an event to get started.</p>}
            {notes.data.slice(0, 4).map((n) => (
              <div key={n.id} className={"note" + (n.is_read ? "" : " unread")}><strong>{n.title}</strong><span>{n.body}</span><small>{fmtDate(n.created_at)}</small></div>
            ))}
          </div>
        </aside>
      </div>
      {open && <EventModal event={open} ticket={ticketFor(open.id)} canRegister onClose={() => setOpen(null)} onChanged={reload} />}
    </div>
  );
}
