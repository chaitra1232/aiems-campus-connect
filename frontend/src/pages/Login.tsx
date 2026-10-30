import { FormEvent, useState } from "react";
import { api } from "../api";
import { useLoad } from "../hooks";
import type { User } from "../App";

const DEMO = [
  { label: "Student", email: "student@aiems.demo" },
  { label: "Coding Club organizer", email: "organizer.coding@aiems.demo" },
  { label: "Admin", email: "admin@aiems.demo" },
];

export default function Login({ onLogin }: { onLogin: (token: string, u: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: stats } = useLoad<any>(() => api.get("/stats/public"), null);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "register") await api.post("/auth/register", { name, email, password, department });
      const r = await api.login(email, password);
      onLogin(r.access_token, r.user);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="login">
      <section className="hero">
        <div className="brand big"><span className="brand-a">AIEMS</span><span className="brand-b">Campus Connect</span></div>
        <h1>Never miss a campus moment.</h1>
        <p>Every club event at AIEMS in one place. Find what's on, register in a click, and carry your ticket in your pocket.</p>
        {stats && (
          <div className="stats">
            <div><b>{stats.approved_events}</b><span>events open</span></div>
            <div><b>{stats.societies}</b><span>societies</span></div>
            <div><b>{stats.students}</b><span>student accounts</span></div>
            <div><b>{stats.registrations}</b><span>registrations</span></div>
          </div>
        )}
        {stats && stats.demo_events > 0 && <small className="muted">Numbers come from the database and include {stats.demo_events} demo events.</small>}
      </section>
      <form className="glass auth" onSubmit={submit} noValidate>
        <h2>{mode === "login" ? "Log in" : "Create student account"}</h2>
        {mode === "register" && (
          <>
            <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>
            <label>Department<input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. CSE" /></label>
          </>
        )}
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        {err && <p className="error" role="alert">{err}</p>}
        <button className="btn wide" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr(""); }}>
          {mode === "login" ? "New student? Create an account" : "Already have an account? Log in"}
        </button>
        <div className="demo-box">
          <small>Demo accounts (password <code>Demo@1234</code>)</small>
          <div className="row wrap">
            {DEMO.map((d) => (
              <button type="button" key={d.email} className="btn ghost small" onClick={() => { setMode("login"); setEmail(d.email); setPassword("Demo@1234"); }}>{d.label}</button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
