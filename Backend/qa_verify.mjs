import { loadEnv } from "./src/config/loadEnv.js";
loadEnv();
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
const BASE = "http://localhost:3000";
const db = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const api = async (m, p, { token, body } = {}) => {
  const h = { "Content-Type": "application/json" }; if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + p, { method: m, headers: h, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await res.json(); } catch {} return { status: res.status, j };
};

// --- (A) JWT-after-password-change timezone check ---
const [[u]] = await db.execute(`SELECT id, password_changed_at FROM users WHERE email = ? `, ["client03@test.local"]);
const changedAt = u.password_changed_at;
const changedSec = new Date(changedAt).getTime() / 1000;
const nowSec = Date.now() / 1000;
// Mint a token with iat = 1 hour in the PAST (clearly before any password change)
const pastToken = jwt.sign({ userId: u.id, role: "client", iat: Math.floor(nowSec) - 3600 }, process.env.JWT_SECRET);
const r1 = await api("GET", "/api/auth/profile", { token: pastToken });
console.log("JWT-TZ: password_changed_at(raw) =", changedAt, "| changedSec =", changedSec, "| nowSec =", Math.floor(nowSec), "| diff(now-changed)s =", Math.floor(nowSec - changedSec));
console.log("JWT-TZ: token iat = now-3600; GET /profile ->", r1.status, r1.j?.message || "(ok)");
console.log("JWT-TZ verdict:", r1.status === 401 ? "INVALIDATED (correct)" : "STILL VALID (BUG) — past-dated token accepted after password change");

// --- (B) Clean inactive-provider booking test ---
// provider08 was rejected; use provider02 (inactive). Find its approved+visible service.
const [[p2]] = await db.execute(`SELECT id FROM users WHERE email='provider02@test.local'`);
const [[active]] = await db.execute(`SELECT is_provider_active FROM provider_profile WHERE provider_id=?`, [p2.id]);
const [svc] = await db.execute(`SELECT id,title,approval_status,is_visible FROM provider_service WHERE provider_id=? AND approval_status='approved' AND is_visible=1 AND is_deleted=0 LIMIT 1`, [p2.id]);
// pick a client who has NOT booked this service
let freshClient = null;
for (let i = 4; i <= 9; i++) {
  const e = `client0${i}@test.local`;
  const [[cu]] = await db.execute(`SELECT id FROM users WHERE email=?`, [e]);
  if (!cu) continue;
  const [dup] = await db.execute(`SELECT id FROM booking_request WHERE client_id=? AND provider_service_id=? AND status IN('pending','accepted')`, [cu.id, svc[0]?.id]);
  if (dup.length === 0) { freshClient = cu; break; }
}
console.log("\nINACTIVE-BOOK: provider02 is_provider_active =", active.is_provider_active, "| service =", svc[0]?.title, "approved/visible");
if (svc[0] && freshClient) {
  const tok = jwt.sign({ userId: freshClient.id, role: "client" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const r2 = await api("POST", "/api/bookings", { token: tok, body: { providerServiceId: svc[0].id, providerId: p2.id, requestedDate: "2026-08-01", requestedTime: "10:00:00" } });
  console.log("INACTIVE-BOOK: POST /bookings (fresh client, inactive provider) ->", r2.status, r2.j?.message || "(created)");
  console.log("INACTIVE-BOOK verdict:", r2.status === 201 ? "ALLOWED (BUG) — booking endpoint ignores provider availability" : "BLOCKED (ok)");
} else { console.log("INACTIVE-BOOK: could not find fresh client/service"); }

// --- (C) Duplicate booking status code confirm ---
const [[c1]] = await db.execute(`SELECT id FROM users WHERE email='client01@test.local'`);
const [[firstSvc]] = await db.execute(`SELECT provider_service_id FROM booking_request WHERE client_id=? AND status IN('pending','accepted') LIMIT 1`, [c1.id]);
if (firstSvc) {
  const [[psrow]] = await db.execute(`SELECT provider_id FROM provider_service WHERE id=?`, [firstSvc.provider_service_id]);
  const tok = jwt.sign({ userId: c1.id, role: "client" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const r3 = await api("POST", "/api/bookings", { token: tok, body: { providerServiceId: firstSvc.provider_service_id, providerId: psrow.provider_id, requestedDate: "2026-08-02", requestedTime: "10:00:00" } });
  console.log("\nDUP-BOOK: duplicate POST -> status", r3.status, "| message:", r3.j?.message);
  console.log("DUP-BOOK verdict:", r3.status === 500 ? "500 (BUG) — duplicate IS prevented but returns generic 500 instead of 400 with clear message" : `${r3.status}`);
}

// --- (D) MySQL session timezone ---
const [[tz]] = await db.execute(`SELECT @@global.time_zone gtz, @@session.time_zone stz, NOW() dbnow`);
console.log("\nDB TZ: global", tz.gtz, "| session", tz.stz, "| NOW()", tz.dbnow, "| JS now", new Date().toString());
await db.end(); process.exit(0);
