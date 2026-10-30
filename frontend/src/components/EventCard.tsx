import { CalendarClock, MapPin, Users } from "lucide-react";
import { catColor, fmtDate, fmtDay, isClosed } from "../utils";

export default function EventCard({ e, registered, onOpen, reason }: { e: any; registered?: boolean; onOpen: (e: any) => void; reason?: string }) {
  const closed = isClosed(e);
  const full = e.seats_left === 0;
  const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100));
  const status = registered ? "Registered" : closed ? "Closed" : full ? "Full" : "Open";
  return (
    <article className="card glass event" style={{ ["--accent" as any]: catColor(e.category) }}>
      <div className="event-top">
        <span className="chip">{e.society}</span>
        <span className={"status " + status.toLowerCase()}>{status}</span>
      </div>
      <h3>{e.title}</h3>
      {reason && <p className="reason">{reason}</p>}
      <ul className="meta">
        <li><CalendarClock size={14} /> {fmtDate(e.start_time)}</li>
        <li><MapPin size={14} /> {e.venue}</li>
        <li><Users size={14} /> {e.seats_left} of {e.capacity} seats left</li>
      </ul>
      <div className="bar" aria-hidden="true"><span style={{ width: pct + "%" }} /></div>
      <small className="muted">Register by {fmtDay(e.registration_deadline)}</small>
      <div className="row">
        <button className="btn ghost" onClick={() => onOpen(e)}>View details</button>
        {!registered && !closed && !full && <button className="btn" onClick={() => onOpen(e)}>Register now</button>}
      </div>
      {e.is_demo && <small className="demo">Demo event</small>}
    </article>
  );
}
