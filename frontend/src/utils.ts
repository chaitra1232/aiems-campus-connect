// The server sends UTC times without a "Z"; add it so the browser converts to local time.
export const toDate = (s: string) => new Date(/Z|[+-]\d\d:\d\d$/.test(s) ? s : s + "Z");
export const fmtDate = (s: string) =>
  toDate(s).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
export const fmtDay = (s: string) => toDate(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
export const isClosed = (e: any) => new Date() > toDate(e.registration_deadline);
export const catColor = (c: string) => ({ Technical: "var(--cyan)", Cultural: "var(--purple)", Sports: "var(--green)" } as any)[c] || "var(--blue)";
// datetime-local input -> ISO string in UTC
export const localToIso = (v: string) => new Date(v).toISOString();
