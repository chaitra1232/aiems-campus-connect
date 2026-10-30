import { NavLink, Outlet } from "react-router-dom";
import { Bell, CalendarDays, Compass, LayoutDashboard, LogOut, QrCode, Ticket, ShieldCheck, PlusSquare } from "lucide-react";
import type { User } from "../App";
import { api } from "../api";
import { useLoad } from "../hooks";

const NAV: Record<string, { to: string; label: string; icon: any }[]> = {
  student: [
    { to: "/", label: "Overview", icon: LayoutDashboard },
    { to: "/explore", label: "Explore Events", icon: Compass },
    { to: "/registrations", label: "My Registrations", icon: Ticket },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  organizer: [
    { to: "/", label: "My Events", icon: PlusSquare },
    { to: "/checkin", label: "Check-in", icon: QrCode },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  admin: [
    { to: "/", label: "Approvals", icon: ShieldCheck },
    { to: "/calendar", label: "Calendar", icon: CalendarDays },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
};

export default function Layout({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { data: notes } = useLoad<any[]>(() => api.get("/notifications"), []);
  const unread = notes.filter((n) => !n.is_read).length;
  return (
    <div className="shell">
      <aside className="sidebar glass">
        <div className="brand">
          <span className="brand-a">AIEMS</span>
          <span className="brand-b">Campus Connect</span>
        </div>
        <nav aria-label="Main">
          {NAV[user.role].map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => "nav" + (isActive ? " active" : "")}>
              <Icon size={18} /> <span>{label}</span>
              {label === "Notifications" && unread > 0 && <b className="badge">{unread}</b>}
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div className="who">
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button className="icon-btn" onClick={onLogout} aria-label="Log out" title="Log out"><LogOut size={18} /></button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
