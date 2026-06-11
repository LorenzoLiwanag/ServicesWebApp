// Regression re-run of the ORIGINAL QA report failures only.
import { loadEnv } from "./src/config/loadEnv.js";
loadEnv();
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
const BASE = "http://localhost:3000", SECRET = process.env.JWT_SECRET;
const db = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const sql = async (q, p = []) => (await db.execute(q, p))[0];
const api = async (m, p, { token, body } = {}) => { const h = { "Content-Type": "application/json" }; if (token) h.Authorization = `Bearer ${token}`; const res = await fetch(BASE + p, { method: m, headers: h, body: body ? JSON.stringify(body) : undefined }); let j = null; try { j = await res.json(); } catch {} return { status: res.status, j }; };
const idOf = async (e) => (await sql(`SELECT id FROM users WHERE email=?`, [e]))[0]?.id;
const mint = (id, r = "client") => jwt.sign({ userId: id, role: r }, SECRET, { expiresIn: "1h" });
const admin = mint(await idOf("admin@example.com"), "admin");
const out = [];
const R = (id, title, expectedFixed, actual, verdict) => { out.push({ id, title, expectedFixed, actual, verdict }); console.log(`${id} ${verdict} :: ${actual}`); };

// BUG-001 — admin message logs 500
let r = await api("GET", "/api/admin/message-logs?page=1&limit=5", { token: admin });
R("BUG-001", "Admin message logs endpoint", "200 with messages", `status ${r.status} ${r.j?.message || "(ok, " + (r.j?.messages?.length) + " msgs)"}`, r.status === 200 ? "FIXED" : "STILL FAILING");

// BUG-002 — duplicate booking returns 500 (should be 400)
const c1 = await idOf("client01@test.local"), tc1 = mint(c1);
const existing = (await sql(`SELECT provider_service_id, provider_id FROM booking_request WHERE client_id=? AND status IN('pending','accepted') LIMIT 1`, [c1]))[0];
if (existing) {
  r = await api("POST", "/api/bookings", { token: tc1, body: { providerServiceId: existing.provider_service_id, providerId: existing.provider_id, requestedDate: "2026-11-01", requestedTime: "10:00" } });
  R("BUG-002", "Duplicate booking status code", "400 + clear message", `status ${r.status} "${r.j?.message}"`, r.status === 400 ? "FIXED" : (r.status === 500 ? "STILL FAILING" : "PARTIAL"));
} else R("BUG-002", "Duplicate booking", "400", "no existing active booking to test", "INCONCLUSIVE");

// BUG-003 — booking inactive provider allowed
const p2 = await idOf("provider02@test.local");
const plumb = (await sql(`SELECT id FROM provider_service WHERE provider_id=? AND title='Plumbing Repair'`, [p2]))[0]?.id;
const active2 = (await sql(`SELECT is_provider_active FROM provider_profile WHERE provider_id=?`, [p2]))[0]?.is_provider_active;
// fresh client without active booking on plumb
let fc = null;
for (let i = 1; i <= 9; i++) { const id = await idOf(`client0${i}@test.local`); const d = await sql(`SELECT id FROM booking_request WHERE client_id=? AND provider_service_id=? AND status IN('pending','accepted')`, [id, plumb]); if (d.length === 0) { fc = id; break; } }
if (fc && active2 === 0) {
  r = await api("POST", "/api/bookings", { token: mint(fc), body: { providerServiceId: plumb, providerId: p2, requestedDate: "2026-11-02", requestedTime: "11:00" } });
  R("BUG-003", "Booking inactive provider blocked", "blocked 400/404", `provider_active=${active2}, POST -> ${r.status}`, (r.status === 400 || r.status === 404) ? "FIXED" : "STILL FAILING");
} else R("BUG-003", "Booking inactive provider", "blocked", `could not isolate fresh client (active2=${active2})`, "INCONCLUSIVE");

// BUG-004 — negative price accepted
const p1 = await idOf("provider01@test.local"), tp1 = mint(p1);
r = await api("POST", "/api/provider/services", { token: tp1, body: { title: "Regression NegPrice", pricingType: "fixed", priceAmount: -99, categoryId: null, description: "Regression test for negative price validation here." } });
R("BUG-004", "Negative price validation", "400 rejected", `status ${r.status}`, r.status === 400 ? "FIXED" : (r.status === 201 ? "STILL FAILING" : "PARTIAL"));

// BUG-005 — gibberish/too-short content accepted
r = await api("POST", "/api/provider/services", { token: tp1, body: { title: "x", pricingType: "fixed", priceAmount: 10, description: "asdf" } });
R("BUG-005", "Content length validation", "400 rejected", `status ${r.status}`, r.status === 400 ? "FIXED" : (r.status === 201 ? "STILL FAILING" : "PARTIAL"));

// BUG-006 — true email verification ACCEPTED / out of scope for current launch.
// Signup sends a confirmation-only email; access is gated by manual admin approval.
// Endpoint/column probe kept for informational purposes only.
const vEndpoints = ["/api/auth/verify-email?token=x", "/api/auth/verify", "/api/auth/confirm-email?token=x"];
let anyVerify = false;
for (const ep of vEndpoints) { const rr = await api("GET", ep); if (rr.status !== 404) anyVerify = true; }
// also check users table for a verification column
const cols = await sql(`SHOW COLUMNS FROM users LIKE '%verif%'`);
R("BUG-006", "Email verification (out of scope; admin approval is the gate)", "n/a - re-scoped", `confirmation-only email; verify endpoint found=${anyVerify}, verif column=${cols.length>0}`, "ACCEPTED");

// BUG-007 — requireAuth re-checks approval status
const c10 = await idOf("client10@test.local"); // rejected user
const st = (await sql(`SELECT approval_status FROM users WHERE id=?`, [c10]))[0]?.approval_status;
r = await api("GET", "/api/auth/profile", { token: mint(c10) });
R("BUG-007", "Pre-issued token for rejected user blocked", "401/403", `approval=${st}, GET /profile -> ${r.status}`, (r.status === 401 || r.status === 403) ? "FIXED" : "STILL FAILING");

// BUG-D01 — booking status state-machine guard.
// Find a booking already in a terminal state (cancelled/declined/completed) and
// have its provider try an illegal transition to "accepted" -> expect 400.
const term = (await sql(
  `SELECT id, provider_id, status FROM booking_request
   WHERE status IN ('cancelled','declined','completed') ORDER BY id DESC LIMIT 1`
))[0];
if (term) {
  const provTok = mint(term.provider_id);
  r = await api("PATCH", `/api/bookings/${term.id}/respond`, { token: provTok, body: { status: "accepted" } });
  const after = (await sql(`SELECT status FROM booking_request WHERE id=?`, [term.id]))[0]?.status;
  const unchanged = after === term.status;
  R("BUG-D01", "Invalid booking status transition blocked",
    "400 + DB state unchanged",
    `from=${term.status} -> accepted => ${r.status} "${r.j?.message}", dbStatus now=${after}`,
    (r.status === 400 && unchanged) ? "FIXED" : "STILL FAILING");
} else {
  R("BUG-D01", "Invalid booking status transition", "400", "no terminal-state booking to test", "INCONCLUSIVE");
}

// BUG-008 — currency code vs symbol (data check)
const cur = (await sql(`SELECT DISTINCT currency FROM provider_service WHERE is_deleted=0`)).map(x => x.currency);
R("BUG-008", "Currency code consistency (stored)", "all PHP (matches ₱ shown)", `stored currencies: ${cur.join(",")}`, (cur.every(c => c === "PHP")) ? "FIXED" : "STILL FAILING (UI hardcodes ₱)");

console.log("\n===== REGRESSION TABLE =====");
out.forEach(o => console.log(`${o.id} | ${o.verdict} | ${o.actual}`));
const fs = await import("fs"); fs.writeFileSync("qa_regression_results.json", JSON.stringify(out, null, 2));
await db.end(); process.exit(0);
