import { api } from "../api";
import { useLoad } from "../hooks";
import { fmtDate } from "../utils";

export default function Notifications() {
  const notes = useLoad<any[]>(() => api.get("/notifications"), []);
  const unread = notes.data.filter((n) => !n.is_read).length;
  const readAll = async () => { await api.post("/notifications/read-all"); notes.reload(); };
  return (
    <div className="page">
      <header className="page-head"><h1>Notifications {unread > 0 && <span className="badge">{unread} new</span>}</h1>
        {unread > 0 && <button className="btn ghost" onClick={readAll}>Mark all as read</button>}
      </header>
      {notes.error && <p className="error" role="alert">{notes.error}</p>}
      {!notes.loading && notes.data.length === 0 && <p className="empty glass">You're all caught up.</p>}
      {notes.data.map((n) => (
        <div key={n.id} className={"glass note wide" + (n.is_read ? "" : " unread")}><strong>{n.title}</strong><span>{n.body}</span><small>{fmtDate(n.created_at)}</small></div>
      ))}
    </div>
  );
}
