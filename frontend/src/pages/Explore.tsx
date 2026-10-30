import { useMemo, useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import { api } from "../api";
import { useLoad } from "../hooks";
import EventCard from "../components/EventCard";
import EventModal from "../components/EventModal";
import { isClosed } from "../utils";

export default function Explore() {
  const events = useLoad<any[]>(() => api.get("/events"), []);
  const regs = useLoad<any[]>(() => api.get("/my/registrations"), []);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [society, setSociety] = useState("All");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [sort, setSort] = useState("date");
  const [list, setList] = useState(false);
  const [open, setOpen] = useState<any>(null);
  const ticketFor = (id: number) => regs.data.find((r) => r.event.id === id)?.ticket_code;

  const cats = ["All", ...Array.from(new Set(events.data.map((e) => e.category)))];
  const socs = ["All", ...Array.from(new Set(events.data.map((e) => e.society)))];
  const shown = useMemo(() => {
    let r = events.data.filter((e) =>
      (e.title + " " + e.venue + " " + e.society).toLowerCase().includes(q.toLowerCase()) &&
      (cat === "All" || e.category === cat) && (society === "All" || e.society === society) &&
      (!onlyOpen || (!isClosed(e) && e.seats_left > 0)));
    if (sort === "popular") r = [...r].sort((a, b) => b.registered - a.registered);
    return r;
  }, [events.data, q, cat, society, onlyOpen, sort]);

  return (
    <div className="page">
      <header className="page-head"><h1>Explore events</h1>
        <label className="search"><Search size={16} /><input placeholder="Search title, venue or society" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </header>
      <div className="filters">
        <div className="chips" role="group" aria-label="Category">
          {cats.map((c) => <button key={c} className={"chip-btn" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <select aria-label="Society" value={society} onChange={(e) => setSociety(e.target.value)}>{socs.map((s) => <option key={s}>{s}</option>)}</select>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="date">Soonest first</option><option value="popular">Most popular</option></select>
        <label className="check"><input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} /> Open for registration</label>
        <button className="icon-btn" onClick={() => setList(!list)} aria-label={list ? "Grid view" : "List view"}>{list ? <LayoutGrid size={18} /> : <List size={18} />}</button>
      </div>
      {events.error && <p className="error" role="alert">{events.error}</p>}
      {events.loading ? <p className="muted">Loading events…</p> : shown.length === 0 ? <p className="empty glass">No events match these filters.</p> :
        <div className={list ? "cards one" : "cards"}>{shown.map((e) => <EventCard key={e.id} e={e} registered={!!ticketFor(e.id)} onOpen={setOpen} />)}</div>}
      {open && <EventModal event={open} ticket={ticketFor(open.id)} canRegister onClose={() => setOpen(null)} onChanged={() => { events.reload(); regs.reload(); }} />}
    </div>
  );
}
