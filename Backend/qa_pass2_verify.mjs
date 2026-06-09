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

const p3 = await idOf("provider03@test.local"), tP3 = mint(p3);
const elec = (await sql(`SELECT id FROM provider_service WHERE provider_id=? AND title='Electrical Repair'`, [p3]))[0].id;
// pick a client with NO active booking for elec
let cId = null, cTok = null;
for (let i = 1; i <= 9; i++) {
  const id = await idOf(`client0${i}@test.local`); if (!id) continue;
  const dup = await sql(`SELECT id FROM booking_request WHERE client_id=? AND provider_service_id=? AND status IN('pending','accepted')`, [id, elec]);
  if (dup.length === 0) { cId = id; cTok = mint(id); break; }
}
console.log("Using client", cId, "service", elec);

// --- V1: cancel already-cancelled (clean) ---
let bk = await api("POST", "/api/bookings", { token: cTok, body: { providerServiceId: elec, providerId: p3, requestedDate: "2026-10-01", requestedTime: "10:00" } });
let id1 = bk.j?.booking?.bookingId;
await api("PATCH", `/api/bookings/${id1}/cancel`, { token: cTok });
let r = await api("PATCH", `/api/bookings/${id1}/cancel`, { token: cTok });
console.log(`V1 cancel-already-cancelled (id=${id1}) -> ${r.status} ${r.j?.message} | verdict: ${r.status === 400 ? "PASS (400 Cannot cancel)" : "FAIL"}`);

// --- V2: provider accepts a CANCELLED booking (resurrection) ---
r = await api("PATCH", `/api/bookings/${id1}/respond`, { token: tP3, body: { status: "accepted" } });
const after = (await sql(`SELECT status FROM booking_request WHERE id=?`, [id1]))[0]?.status;
console.log(`V2 provider-accepts-cancelled -> ${r.status} status-now=${after} | verdict: ${r.status === 400 ? "PASS (blocked)" : `FAIL/BUG (resurrected to '${after}')`}`);

// --- V3: provider flips accepted->declined (state machine) ---
bk = await api("POST", "/api/bookings", { token: cTok, body: { providerServiceId: elec, providerId: p3, requestedDate: "2026-10-02", requestedTime: "11:00" } });
let id2 = bk.j?.booking?.bookingId;
await api("PATCH", `/api/bookings/${id2}/respond`, { token: tP3, body: { status: "accepted" } });
r = await api("PATCH", `/api/bookings/${id2}/respond`, { token: tP3, body: { status: "declined" } });
const after2 = (await sql(`SELECT status FROM booking_request WHERE id=?`, [id2]))[0]?.status;
console.log(`V3 provider-flips-accepted->declined -> ${r.status} status-now=${after2} | verdict: ${r.status === 400 ? "PASS (blocked)" : `FAIL/BUG (flipped to '${after2}')`}`);
// also: provider completes then re-declines
await api("PATCH", `/api/bookings/${id2}/respond`, { token: tP3, body: { status: "completed" } });
r = await api("PATCH", `/api/bookings/${id2}/respond`, { token: tP3, body: { status: "declined" } });
const after3 = (await sql(`SELECT status FROM booking_request WHERE id=?`, [id2]))[0]?.status;
console.log(`V3b provider-flips-completed->declined -> ${r.status} status-now=${after3} | verdict: ${r.status === 400 ? "PASS (blocked)" : `FAIL/BUG (flipped to '${after3}')`}`);

// --- V4: mark-all-read zeroes unreadCount (correct field) ---
const u1 = (await api("GET", "/api/notifications/unread-count", { token: cTok })).j?.unreadCount;
await api("PATCH", "/api/notifications/read-all", { token: cTok });
const u2 = (await api("GET", "/api/notifications/unread-count", { token: cTok })).j?.unreadCount;
console.log(`V4 mark-all-read unreadCount ${u1} -> ${u2} | verdict: ${u2 === 0 ? "PASS" : "FAIL"}`);

await db.end(); process.exit(0);
