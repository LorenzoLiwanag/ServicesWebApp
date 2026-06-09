// Positive-path smoke test: confirm the fixes did NOT break passing behavior.
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
const ok = [];
const T = (name, pass, detail) => { ok.push(pass); console.log(`${pass ? "PASS" : "FAIL"} :: ${name} :: ${detail}`); };

const adminId = await idOf("admin@example.com");
const adminTok = mint(adminId, "admin");

// 1) Admin (approved) still reaches admin endpoint
let r = await api("GET", "/api/admin/pending-users", { token: adminTok });
T("Admin reaches protected admin route", r.status === 200, `status ${r.status}`);

// 2) Approved client still reaches profile
const c1 = await idOf("client01@test.local");
r = await api("GET", "/api/auth/profile", { token: mint(c1) });
T("Approved client reaches /profile", r.status === 200, `status ${r.status}`);

// 3) Valid service creation (good title/desc/price) still 201
const p1 = await idOf("provider01@test.local"), tp1 = mint(p1);
r = await api("POST", "/api/provider/services", { token: tp1, body: { title: "Smoke Valid Service", pricingType: "fixed", priceAmount: 1500, categoryId: null, description: "A perfectly valid service description for the smoke test." } });
const newSvcId = r.j?.service?.providerServiceId;
T("Valid service creation accepted", r.status === 201, `status ${r.status}`);

// 4) Valid 'quote' service with null price still 201
r = await api("POST", "/api/provider/services", { token: tp1, body: { title: "Smoke Quote Service", pricingType: "quote", categoryId: null, description: "Quote-based service with no fixed price set here." } });
T("Valid quote service (null price) accepted", r.status === 201, `status ${r.status}`);

// 5) Valid booking against an ACTIVE provider + valid pending->accepted transition
// Use provider01 (active). Approve the new service, then a fresh client books it.
if (newSvcId) {
  await api("PATCH", `/api/admin/services/${newSvcId}/approve`, { token: adminTok });
  // make sure provider01 is active
  await sql(`UPDATE provider_profile SET is_provider_active=1 WHERE provider_id=?`, [p1]);
  // fresh client without active booking on this svc
  let fc = null;
  for (let i = 1; i <= 9; i++) { const id = await idOf(`client0${i}@test.local`); if (!id) continue; const st = (await sql(`SELECT approval_status FROM users WHERE id=?`, [id]))[0]?.approval_status; const d = await sql(`SELECT id FROM booking_request WHERE client_id=? AND provider_service_id=? AND status IN('pending','accepted')`, [id, newSvcId]); if (st === "approved" && d.length === 0) { fc = id; break; } }
  if (fc) {
    r = await api("POST", "/api/bookings", { token: mint(fc), body: { providerServiceId: newSvcId, providerId: p1, requestedDate: "2026-12-01", requestedTime: "10:00" } });
    const bkId = r.j?.booking?.bookingId;
    T("Valid booking against active provider", r.status === 201, `status ${r.status}`);
    if (bkId) {
      r = await api("PATCH", `/api/bookings/${bkId}/respond`, { token: tp1, body: { status: "accepted" } });
      T("Valid transition pending->accepted", r.status === 200 && r.j?.booking?.status === "accepted", `status ${r.status}/${r.j?.booking?.status}`);
      r = await api("PATCH", `/api/bookings/${bkId}/respond`, { token: tp1, body: { status: "completed" } });
      T("Valid transition accepted->completed", r.status === 200 && r.j?.booking?.status === "completed", `status ${r.status}/${r.j?.booking?.status}`);
    }
  } else T("Valid booking against active provider", false, "no fresh approved client found");
}

console.log(`\n${ok.filter(Boolean).length}/${ok.length} smoke checks passed`);
await db.end(); process.exit(ok.every(Boolean) ? 0 : 1);
