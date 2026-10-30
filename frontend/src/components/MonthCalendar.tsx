import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { catColor, toDate } from "../utils";

export default function MonthCalendar({ events, onPick }: { events: any[]; onPick: (e: any) => void }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<string>("");
  const byDay = useMemo(() => {
    const m: Record<string, any[]> = {};
    events.forEach((e) => { const k = toDate(e.start_time).toDateString(); (m[k] ||= []).push(e); });
    return m;
  }, [events]);
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))];
  const move = (n: number) => setCursor(new Date(year, month + n, 1));
  const list = selected ? byDay[selected] || [] : events.filter((e) => { const d = toDate(e.start_time); return d.getMonth() === month && d.getFullYear() === year; });

  return (
    <div className="cal glass">
      <div className="cal-head">
        <button className="icon-btn" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <strong>{cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
        <button className="icon-btn" onClick={() => move(1)} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>
      <div key={year + "-" + month} className="cal-grid fade">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i} className="dow">{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const k = d.toDateString();
          const evs = byDay[k] || [];
          return (
            <button key={i} className={"day" + (evs.length ? " has" : "") + (selected === k ? " sel" : "") + (k === new Date().toDateString() ? " today" : "")}
              onClick={() => setSelected(selected === k ? "" : k)} aria-label={`${d.toDateString()}, ${evs.length} events`}>
              {d.getDate()}
              {evs.length > 0 && <i style={{ background: catColor(evs[0].category) }} />}
            </button>
          );
        })}
      </div>
      <ul className="cal-list">
        {list.length === 0 && <li className="muted">No events {selected ? "on this day" : "this month"}.</li>}
        {list.map((e) => (
          <li key={e.id}><button onClick={() => onPick(e)}><i style={{ background: catColor(e.category) }} />{e.title}<small>{toDate(e.start_time).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</small></button></li>
        ))}
      </ul>
    </div>
  );
}
