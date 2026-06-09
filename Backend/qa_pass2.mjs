// PRD 7 — DEEP second-pass QA. Edge cases, permission boundaries, refresh
// persistence, duplicate actions, notification correctness. No happy-path repeats.
import { loadEnv } from "./src/config/loadEnv.js";
loadEnv();
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

const BASE = "http://localhost:3000";
const SECRET = process.env.JWT_SECRET;
const results = [];
const rec = (area, name, expected, actual, pass, severity = "") => {
  results.push({ area, name, expected, actual, status: pass ? "PASS" : "FAIL", severity: pass ? "" : severity });
  console.log(`[${pass ? "PASS" : "FAIL/" + severity}] (${area}) ${name} :: exp=${expected} act=${actual}`);
};
const db = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME });
const sql = async (q, p = []) => { const [r] = await db.execute(q, p); return r; };
const api = async (m, p, { token, body, headers } = {}) => {
  const h = { "Content-Type": "application/json", ...(headers || {}) };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + p, { method: m, headers: h, body: body ? JSON.stringify(body) : undefined });
  let j = null; try { j = await res.json(); } catch {}
  return { status: res.status, j };
};
const idOf = async (email) => (await sql(`SELECT id FROM users WHERE email=?`, [email]))[0]?.id;
const mint = (id, role = "client") => jwt.sign({ userId: id, role }, SECRET, { expiresIn: "2h" });

// resolve accounts
const E = {};
for (const e of [...Array(10)].map((_, i) => `client${String(i + 1).padStart(2, "0")}@test.local`)
  .concat([...Array(8)].map((_, i) => `provider${String(i + 1).padStart(2, "0")}@test.local`))
  .concat(["admin@example.com"])) E[e] = await idOf(e);
const T = {}; for (const e in E) T[e] = mint(E[e], e.startsWith("admin") ? "admin" : "client");
const admin = T["admin@example.com"];
const c1 = T["client01@test.local"], c2 = T["client02@test.local"], c9 = T["client09@test.local"];
const p1 = "provider01@test.local", p2 = "provider02@test.local", p3 = "provider03@test.local";

// useful service ids
const svc = async (providerEmail, title) => (await sql(`SELECT id FROM provider_service WHERE provider_id=? AND title=? AND is_deleted=0`, [E[providerEmail], title]))[0]?.id;
const houseId = await svc(p1, "House Cleaning");          // approved, active provider
const plumbId = await svc(p2, "Plumbing Repair");        // approved, INACTIVE provider02
const pestId = (await sql(`SELECT id FROM provider_service WHERE provider_id=? AND title='Pest Control'`, [E["provider07@test.local"]]))[0]?.id; // rejected
const elecId = await svc(p3, "Electrical Repair");

console.log("ids:", { houseId, plumbId, pestId, elecId });

// ════════ EDGE CASES ════════
let r;
r = await api("POST", "/api/bookings", { token: c1, body: { providerServiceId: houseId } });
rec("Edge", "Booking missing providerId", "400", r.status, r.status === 400, "Low");
r = await api("POST", "/api/bookings", { token: c1, body: { providerServiceId: 9999999, providerId: 999 } });
rec("Edge", "Booking nonexistent service", "404", r.status, r.status === 404, "Low");
r = await api("POST", "/api/bookings", { token: c1, body: { providerServiceId: pestId, providerId: E["provider07@test.local"] } });
rec("Edge", "Booking rejected service", "404 unavailable", `${r.status}`, r.status === 404, "Medium");

// soft-deleted service booking: create+approve+delete a temp service for provider03
const tmp = await api("POST", "/api/provider/services", { token: T[p3], body: { title: "Temp Delete Me", pricingType: "fixed", priceAmount: 100, categoryId: null, description: "temp service for delete test edge case" } });
const tmpId = tmp.j?.service?.providerServiceId;
await api("PATCH", `/api/admin/services/${tmpId}/approve`, { token: admin });
await api("DELETE", `/api/provider/services/${tmpId}`, { token: T[p3] });
r = await api("POST", "/api/bookings", { token: c1, body: { providerServiceId: tmpId, providerId: E[p3] } });
rec("Edge", "Booking soft-deleted service", "404 unavailable", `${r.status}`, r.status === 404, "Medium");

// create a fresh booking to use for state-machine edge tests
const sb = await api("POST", "/api/bookings", { token: c9, body: { providerServiceId: elecId, providerId: E[p3], requestedDate: "2026-09-01", requestedTime: "10:00:00" } });
const sbId = sb.j?.booking?.bookingId;
r = await api("PATCH", `/api/bookings/${sbId}/respond`, { token: T[p3], body: { status: "foobar" } });
rec("Edge", "Respond with invalid status", "400", r.status, r.status === 400, "Low");

// cancel then cancel again
await api("PATCH", `/api/bookings/${sbId}/cancel`, { token: c9 });
r = await api("PATCH", `/api/bookings/${sbId}/cancel`, { token: c9 });
rec("Edge", "Cancel already-cancelled booking", "400 Cannot cancel", `${r.status}:${r.j?.message?.slice(0,18)}`, r.status === 400, "Low");

// provider responds to an ALREADY-cancelled booking (state machine on provider side)
r = await api("PATCH", `/api/bookings/${sbId}/respond`, { token: T[p3], body: { status: "accepted" } });
rec("Edge", "Provider accepts a CANCELLED booking (state machine)", "should block (400)", `${r.status}/${r.j?.booking?.status}`, r.status === 400, "Medium");

// conversation edge
r = await api("POST", "/api/conversations", { token: c1, body: { provider_service_id: houseId, message: "   " } });
rec("Edge", "Start conversation empty message", "400", r.status, r.status === 400, "Low");
r = await api("POST", "/api/conversations", { token: c1, body: { provider_service_id: pestId, message: "hello" } });
rec("Edge", "Start conversation about rejected service", "400 not approved", `${r.status}`, r.status === 400, "Medium");
r = await api("POST", "/api/conversations/9999999/messages", { token: c1, body: { message: "hi" } });
rec("Edge", "Reply to nonexistent conversation", "404", r.status, r.status === 404, "Low");

// profile/password edge
r = await api("PATCH", "/api/auth/profile", { token: c2, body: { firstName: "OnlyFirst" } });
rec("Edge", "Profile update missing fields", "400", r.status, r.status === 400, "Low");
r = await api("PATCH", "/api/auth/password", { token: c2, body: { currentPassword: "TestPassword123!", newPassword: "NewPass123!", confirmPassword: "Different123!" } });
rec("Edge", "Password change mismatched confirm", "400", r.status, r.status === 400, "Medium");

// category admin edge
r = await api("POST", "/api/admin/categories", { token: admin, body: { name: "Cleaning" } });
rec("Edge", "Create duplicate category", "409", r.status, r.status === 409, "Low");
const cleaningCat = (await sql(`SELECT id FROM service_category WHERE name='Cleaning'`))[0]?.id;
r = await api("DELETE", `/api/admin/categories/${cleaningCat}`, { token: admin });
rec("Edge", "Delete category with services", "409", r.status, r.status === 409, "Medium");
r = await api("PATCH", "/api/admin/categories/9999999", { token: admin, body: { name: "Ghost" } });
rec("Edge", "Update nonexistent category", "404", r.status, r.status === 404, "Low");

// service/user approval duplicate/invalid
r = await api("PATCH", `/api/admin/services/${houseId}/approve`, { token: admin });
rec("Dup", "Approve already-approved service", "400", r.status, r.status === 400, "Low");
r = await api("PATCH", `/api/admin/services/${houseId}/reject`, { token: admin, body: { reason: "x" } });
rec("Edge", "Reject already-approved service", "400 only pending", `${r.status}`, r.status === 400, "Low");
r = await api("PATCH", `/api/admin/services/9999999/approve`, { token: admin });
rec("Edge", "Approve nonexistent service", "404", r.status, r.status === 404, "Low");
r = await api("PATCH", `/api/admin/users/${E[p1]}/approve`, { token: admin });
rec("Dup", "Approve already-approved user", "400", r.status, r.status === 400, "Low");
r = await api("PATCH", `/api/admin/users/${E[p1]}/reject`, { token: admin, body: { reason: "x" } });
rec("Edge", "Reject already-approved user", "400 only pending", `${r.status}`, r.status === 400, "Low");

// ════════ PERMISSION BOUNDARIES ════════
// provider01 tries to mutate provider03's electrical service
r = await api("PUT", `/api/provider/services/${elecId}`, { token: T[p1], body: { title: "Hijacked", pricingType: "fixed", priceAmount: 1 } });
rec("Perm", "Provider updates another provider's service", "404 not found", `${r.status}`, r.status === 404, "High");
r = await api("PATCH", `/api/provider/services/${elecId}/visibility`, { token: T[p1], body: { isVisible: false } });
rec("Perm", "Provider toggles another provider's service visibility", "404", `${r.status}`, r.status === 404, "High");
r = await api("DELETE", `/api/provider/services/${elecId}`, { token: T[p1] });
rec("Perm", "Provider deletes another provider's service", "404", `${r.status}`, r.status === 404, "High");
// verify electrical still exists & visible (not hijacked)
const elecStill = (await sql(`SELECT title,is_deleted,is_visible FROM provider_service WHERE id=?`, [elecId]))[0];
rec("Perm", "Victim service intact after cross-provider attempts", "Electrical Repair/not deleted", `${elecStill?.title}/${elecStill?.is_deleted}`, elecStill?.title === "Electrical Repair" && Number(elecStill?.is_deleted) === 0, "High");

// client (the booking's client) tries to use provider respond endpoint
const freshBk = await api("POST", "/api/bookings", { token: c1, body: { providerServiceId: elecId, providerId: E[p3], requestedDate: "2026-09-02", requestedTime: "09:00" } });
const freshBkId = freshBk.j?.booking?.bookingId;
r = await api("PATCH", `/api/bookings/${freshBkId}/respond`, { token: c1, body: { status: "accepted" } });
rec("Perm", "Client uses provider respond endpoint on own booking", "403 not authorized", `${r.status}:${r.j?.message?.slice(0,18)}`, r.status === 403, "High");
// unrelated user responds to a booking they're not in
r = await api("PATCH", `/api/bookings/${freshBkId}/respond`, { token: c2, body: { status: "declined" } });
rec("Perm", "Unrelated user responds to booking", "403", r.status, r.status === 403, "Critical");
// unrelated user replies to a conversation
const conv = (await sql(`SELECT id FROM conversation LIMIT 1`))[0]?.id;
if (conv) {
  r = await api("POST", `/api/conversations/${conv}/messages`, { token: c9, body: { message: "intruder reply" } });
  rec("Perm", "Non-participant replies to conversation", "403", r.status, r.status === 403, "Critical");
}
// non-admin to admin sub-endpoints
r = await api("GET", "/api/admin/categories", { token: c1 });
rec("Perm", "Non-admin GET admin categories", "403", r.status, r.status === 403, "High");
r = await api("GET", "/api/admin/contact-submissions", { token: c1 });
rec("Perm", "Non-admin GET contact submissions", "403", r.status, r.status === 403, "High");
// client marks another user's notification deleted -> no effect
const otherN = (await sql(`SELECT id FROM notification WHERE user_id<>? AND deleted_at IS NULL LIMIT 1`, [E["client01@test.local"]]))[0]?.id;
if (otherN) {
  await api("PATCH", `/api/notifications/${otherN}/delete`, { token: c1 });
  const del = (await sql(`SELECT deleted_at FROM notification WHERE id=?`, [otherN]))[0]?.deleted_at;
  rec("Perm", "Cannot soft-delete another user's notification", "unchanged (null)", `deleted_at=${del}`, del === null, "High");
}
// provider booking isolation
const pbk = await api("GET", "/api/bookings/provider", { token: T[p1] });
const leak = (pbk.j?.bookings || []).some((b) => b.providerId !== E[p1]);
rec("Perm", "Provider bookings list isolated to self", "no other provider rows", leak ? "LEAK" : "ok", !leak, "Critical");

// ════════ REFRESH PERSISTENCE ════════
// service visibility toggle persists
await api("PATCH", `/api/provider/services/${houseId}/visibility`, { token: T[p1], body: { isVisible: false } });
let chk = (await api("GET", "/api/provider/services", { token: T[p1] })).j?.services?.find((s) => s.providerServiceId === houseId);
rec("Persist", "Service visibility toggle persists", "isVisible=false", chk?.isVisible, chk?.isVisible === false, "Medium");
// hidden service drops from public browse
let inBrowse = ((await api("GET", "/api/services/browse", {})).j?.services || []).some((s) => s.providerServiceId === houseId);
rec("Persist", "Hidden service removed from Browse", "absent", inBrowse ? "present" : "absent", !inBrowse, "Medium");
// restore visibility
await api("PATCH", `/api/provider/services/${houseId}/visibility`, { token: T[p1], body: { isVisible: true } });
chk = (await api("GET", "/api/provider/services", { token: T[p1] })).j?.services?.find((s) => s.providerServiceId === houseId);
rec("Persist", "Service visibility restore persists", "isVisible=true", chk?.isVisible, chk?.isVisible === true, "Low");
// profile update persists
await api("PATCH", "/api/auth/profile", { token: c9, body: { firstName: "Persisted", lastName: "User", phoneNumber: "09170002222" } });
chk = (await api("GET", "/api/auth/profile", { token: c9 })).j?.user;
rec("Persist", "Profile update persists across re-fetch", "firstName=Persisted", chk?.firstName, chk?.firstName === "Persisted", "Medium");
// booking status persists
if (freshBkId) {
  await api("PATCH", `/api/bookings/${freshBkId}/respond`, { token: T[p3], body: { status: "accepted" } });
  const bs = (await api("GET", "/api/bookings/client?status=accepted", { token: c1 })).j?.bookings?.find((b) => b.bookingId === freshBkId);
  rec("Persist", "Booking status persists across re-fetch", "accepted", bs?.status, bs?.status === "accepted", "Medium");
}

// ════════ DUPLICATE ACTIONS ════════
// double-accept (no state guard on provider side?)
r = await api("PATCH", `/api/bookings/${freshBkId}/respond`, { token: T[p3], body: { status: "accepted" } });
rec("Dup", "Double-accept same booking", "idempotent/blocked (200 or 400)", `${r.status}/${r.j?.booking?.status}`, r.status === 200 || r.status === 400, "Low");
// accept then decline an already-accepted booking (provider can flip state freely?)
r = await api("PATCH", `/api/bookings/${freshBkId}/respond`, { token: T[p3], body: { status: "declined" } });
rec("Dup", "Provider flips accepted→declined (state machine)", "should block (400)", `${r.status}/${r.j?.booking?.status}`, r.status === 400, "Medium");
// idempotent conversation: start twice about same service => same conversation
const cv1 = await api("POST", "/api/conversations", { token: c2, body: { provider_service_id: elecId, message: "first" } });
const cv2 = await api("POST", "/api/conversations", { token: c2, body: { provider_service_id: elecId, message: "second" } });
rec("Dup", "Re-start conversation reuses same thread", "same conversationId", `${cv1.j?.conversationId}==${cv2.j?.conversationId}`, cv1.j?.conversationId === cv2.j?.conversationId, "Low");
// mark-all-read twice
await api("PATCH", "/api/notifications/read-all", { token: c2 });
r = await api("PATCH", "/api/notifications/read-all", { token: c2 });
rec("Dup", "Mark-all-read twice (idempotent)", "200", r.status, r.status === 200, "Low");

// ════════ NOTIFICATION CORRECTNESS ════════
// build a clean booking lifecycle to check notifications precisely
const nbk = await api("POST", "/api/bookings", { token: c1, body: { providerServiceId: plumbId, providerId: E[p2], requestedDate: "2026-09-10", requestedTime: "10:00" } });
// note: plumbId provider inactive — if BUG-003 still open this succeeds. Use elec instead if it failed.
let nbkId = nbk.j?.booking?.bookingId;
let nClient = E["client01@test.local"], nProvider = E[p2];
if (!nbkId) {
  const alt = await api("POST", "/api/bookings", { token: T["client05@test.local"], body: { providerServiceId: elecId, providerId: E[p3], requestedDate: "2026-09-11", requestedTime: "11:00" } });
  nbkId = alt.j?.booking?.bookingId; nClient = E["client05@test.local"]; nProvider = E[p3];
}
const countN = async (uid, type, bkId) => (await sql(`SELECT COUNT(*) n FROM notification WHERE user_id=? AND type=? AND booking_request_id=?`, [uid, type, bkId]))[0].n;
rec("Notif", "Booking created → provider notified", ">=1", await countN(nProvider, "booking_created", nbkId), (await countN(nProvider, "booking_created", nbkId)) >= 1, "Medium");
// decline -> client gets booking_declined
const provTokForN = nProvider === E[p2] ? T[p2] : T[p3];
await api("PATCH", `/api/bookings/${nbkId}/respond`, { token: provTokForN, body: { status: "declined" } });
rec("Notif", "Booking declined → client notified", ">=1", await countN(nClient, "booking_declined", nbkId), (await countN(nClient, "booking_declined", nbkId)) >= 1, "Medium");

// cancelled -> provider notified (new booking, then cancel)
const cbk = await api("POST", "/api/bookings", { token: T["client06@test.local"], body: { providerServiceId: elecId, providerId: E[p3], requestedDate: "2026-09-12", requestedTime: "12:00" } });
const cbkId = cbk.j?.booking?.bookingId;
await api("PATCH", `/api/bookings/${cbkId}/cancel`, { token: T["client06@test.local"] });
rec("Notif", "Booking cancelled → provider notified", ">=1", await countN(E[p3], "booking_cancelled", cbkId), (await countN(E[p3], "booking_cancelled", cbkId)) >= 1, "Medium");

// completed -> BOTH notified
const fbk = await api("POST", "/api/bookings", { token: T["client07@test.local"], body: { providerServiceId: elecId, providerId: E[p3], requestedDate: "2026-09-13", requestedTime: "13:00" } });
const fbkId = fbk.j?.booking?.bookingId;
await api("PATCH", `/api/bookings/${fbkId}/respond`, { token: T[p3], body: { status: "accepted" } });
await api("PATCH", `/api/bookings/${fbkId}/respond`, { token: T[p3], body: { status: "completed" } });
const compClient = await countN(E["client07@test.local"], "booking_completed", fbkId);
const compProv = await countN(E[p3], "booking_completed", fbkId);
rec("Notif", "Booking completed → BOTH parties notified", "client>=1 & provider>=1", `c:${compClient} p:${compProv}`, compClient >= 1 && compProv >= 1, "Medium");

// message reply type correctness
const mc = await api("POST", "/api/conversations", { token: T["client08@test.local"], body: { provider_service_id: elecId, message: "type test" } });
const mcId = mc.j?.conversationId;
await api("POST", `/api/conversations/${mcId}/messages`, { token: T[p3], body: { message: "provider reply" } });
const replyType = (await sql(`SELECT type FROM notification WHERE user_id=? AND related_entity_id=? ORDER BY id DESC LIMIT 1`, [E["client08@test.local"], mcId]))[0]?.type;
rec("Notif", "Provider reply → client gets reply_received", "reply_received", replyType, replyType === "reply_received", "Low");
const msgType = (await sql(`SELECT type FROM notification WHERE user_id=? AND related_entity_id=? ORDER BY id ASC LIMIT 1`, [E[p3], mcId]))[0]?.type;
rec("Notif", "Client message → provider gets message_received", "message_received", msgType, msgType === "message_received", "Low");

// unread count excludes read+deleted; mark-all zeros it
const u1 = (await api("GET", "/api/notifications/unread-count", { token: T["client07@test.local"] })).j?.count;
await api("PATCH", "/api/notifications/read-all", { token: T["client07@test.local"] });
const u2 = (await api("GET", "/api/notifications/unread-count", { token: T["client07@test.local"] })).j?.count;
rec("Notif", "Mark-all-read zeroes unread count", "0", `${u1}→${u2}`, u2 === 0, "Medium");
// soft delete: appears in /deleted, not in main, count unchanged (already 0)
const main = (await api("GET", "/api/notifications", { token: T["client07@test.local"] })).j?.notifications || [];
if (main[0]) {
  const did = main[0].id;
  await api("PATCH", `/api/notifications/${did}/delete`, { token: T["client07@test.local"] });
  const inMain = ((await api("GET", "/api/notifications", { token: T["client07@test.local"] })).j?.notifications || []).some((n) => n.id === did);
  const inDeleted = ((await api("GET", "/api/notifications/deleted", { token: T["client07@test.local"] })).j?.notifications || []).some((n) => n.id === did);
  rec("Notif", "Soft-deleted notification leaves main list", "absent in main", inMain ? "present" : "absent", !inMain, "Low");
  rec("Notif", "Soft-deleted notification appears in /deleted", "present", inDeleted ? "present" : "absent", inDeleted, "Low");
}
// ordering: unread first
const ord = (await api("GET", "/api/notifications", { token: c1 })).j?.notifications || [];
let orderOk = true; let seenRead = false;
for (const n of ord) { if (n.isRead) seenRead = true; else if (seenRead) { orderOk = false; break; } }
rec("Notif", "Notifications ordered unread-first", "unread before read", orderOk ? "ok" : "violated", orderOk, "Low");

// summary
const fail = results.filter((x) => x.status === "FAIL");
const bySev = (s) => fail.filter((x) => x.severity === s).length;
console.log("\n===== PASS2 SUMMARY =====");
console.log(JSON.stringify({ total: results.length, passed: results.length - fail.length, failed: fail.length, critical: bySev("Critical"), high: bySev("High"), medium: bySev("Medium"), low: bySev("Low") }, null, 2));
console.log("\n===== PASS2 FAILURES =====");
fail.forEach((f) => console.log(`  [${f.severity}] (${f.area}) ${f.name} — exp:${f.expected} act:${f.actual}`));
const fs = await import("fs"); fs.writeFileSync("qa_pass2_results.json", JSON.stringify({ results, fail }, null, 2));
await db.end(); process.exit(0);
