import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Explore from "./pages/Explore";
import Registrations from "./pages/Registrations";
import CalendarPage from "./pages/CalendarPage";
import Notifications from "./pages/Notifications";
import OrganizerEvents from "./pages/OrganizerEvents";
import CheckIn from "./pages/CheckIn";
import Admin from "./pages/Admin";

export type User = { id: number; name: string; email: string; role: "student" | "organizer" | "admin" };

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });
  const [booting, setBooting] = useState(true);
  useEffect(() => { const t = setTimeout(() => setBooting(false), 900); return () => clearTimeout(t); }, []);

  const login = (token: string, u: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (booting)
    return (
      <div className="boot">
        <div className="boot-mark">AIEMS</div>
        <div className="boot-sub">Campus Connect</div>
        <div className="boot-bar"><span /></div>
      </div>
    );

  return (
    <>
      <div className="bg" aria-hidden="true">
        <i className="orb o1" /><i className="orb o2" /><i className="orb o3" />
      </div>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={login} />} />
        <Route element={user ? <Layout user={user} onLogout={logout} /> : <Navigate to="/login" />}>
          <Route index element={user?.role === "admin" ? <Admin /> : user?.role === "organizer" ? <OrganizerEvents /> : <Overview user={user!} />} />
          {user?.role === "student" && (
            <>
              <Route path="explore" element={<Explore />} />
              <Route path="registrations" element={<Registrations />} />
              <Route path="calendar" element={<CalendarPage />} />
            </>
          )}
          {user?.role === "organizer" && <Route path="checkin" element={<CheckIn />} />}
          {user?.role === "admin" && <Route path="calendar" element={<CalendarPage />} />}
          <Route path="notifications" element={<Notifications />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
