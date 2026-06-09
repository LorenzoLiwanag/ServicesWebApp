// PRD 7 — End-to-End QA harness. API-driven, with direct-DB seeding for bulk
// accounts (to avoid IP rate limiters) and direct JWT minting (to avoid the
// 5/15min login limiter). All ASSERTIONS go through the real HTTP API.
import { loadEnv } from "./src/config/loadEnv.js";
loadEnv();
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const BASE = "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET;
const PW = "TestPassword123!";
const results = [];
let bugSeq = 0;

const rec = (area, name, expected, actual, pass, severity = "") => {
  results.push({ area, name, expected, actual, status: pass ? "PASS" : "FAIL", severity: pass ? "" : severity });
  const tag = pass ? "PASS" : `FAIL${severity ? "/" + severity : ""}`;
  console.log(`[${tag}] (${area}) ${name} :: exp=${expected} act=${actual}`);
};

const db = await mysql.createConnection({
  host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, database: process.env.DB_NAME, multipleStatements: true,
});

const api = async (method, path, { token, body, headers } = {}) => {
  const h = { "Content-Type": "application/json", ...(headers || {}) };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json };
};

const mint = (id, role = "client", firstName = "Test") =>
  jwt.sign({ userId: id, firstName, role }, JWT_SECRET, { expiresIn: "24h" });

const sql = async (q, p = []) => { const [r] = await db.execute(q, p); return r; };

// ───────────────────────────────────────────────────────────────────────────
// SECTION A: Bulk account creation (direct DB) — clients + providers
// ───────────────────────────────────────────────────────────────────────────
const hash = await bcrypt.hash(PW, 10);
const accounts = {}; // email -> {id, role, approval, providerToken?}
const mkAccount = async (email, first, last, phone, approval = "pending") => {
  const r = await sql(
    `INSERT INTO users (first_name,last_name,email,phone_number,password_hash,approval_status) VALUES (?,?,?,?,?,?)`,
    [first, last, email, phone, hash, approval]);
  accounts[email] = { id: r.insertId, role: "client", approval, email, first, last };
  return r.insertId;
};

const clients = [];
for (let i = 1; i <= 10; i++) {
  const e = `client${String(i).padStart(2, "0")}@test.local`;
  await mkAccount(e, "Client", `No${i}`, `0905555${String(1000 + i)}`);
  clients.push(e);
}
const providers = [];
for (let i = 1; i <= 8; i++) {
  const e = `provider${String(i).padStart(2, "0")}@test.local`;
  await mkAccount(e, "Provider", `No${i}`, `0906555${String(2000 + i)}`);
  providers.push(e);
}
console.log(`Created ${clients.length} clients + ${providers.length} providers (pending).`);

// admin token (admin@example.com from seed)
const adminRow = (await sql(`SELECT id, role FROM users WHERE email='admin@example.com'`))[0];
const adminToken = mint(adminRow.id, "admin", "Admin");

// ───────────────────────────────────────────────────────────────────────────
// SECTION B: Signup flow + validation (real API) + register rate-limit
// ───────────────────────────────────────────────────────────────────────────
const validSignup = {
  firstName: "Signup", lastName: "Tester", email: "signup_valid@test.local",
  phoneNumber: "09171234567", password: PW, confirmPassword: PW,
};
let r;
r = await api("POST", "/api/auth/register", { body: validSignup });
rec("Signup", "Valid client registration", "201 pending-approval", r.status, r.status === 201, "High");

r = await api("POST", "/api/auth/register", { body: {} });
rec("Signup", "Empty form submission", "400", r.status, r.status === 400, "Medium");

r = await api("POST", "/api/auth/register", { body: { ...validSignup, email: "not-an-email", confirmPassword: PW } });
rec("Signup", "Invalid email format", "400", r.status, r.status === 400, "Medium");

r = await api("POST", "/api/auth/register", { body: { ...validSignup, email: "weakpw@test.local", password: "123", confirmPassword: "123" } });
rec("Signup", "Weak password rejected", "400", r.status, r.status === 400, "High");

r = await api("POST", "/api/auth/register", { body: { ...validSignup, email: "mismatch@test.local", confirmPassword: "Different123" } });
rec("Signup", "Password mismatch rejected", "400", r.status, r.status === 400, "Medium");

r = await api("POST", "/api/auth/register", { body: validSignup }); // duplicate of valid
rec("Signup", "Duplicate email rejected", "400 already registered", `${r.status}:${r.json?.message}`,
  r.status === 400 && /registered/i.test(r.json?.message || ""), "High");

// login before approval (valid signup is pending)
r = await api("POST", "/api/auth/login", { body: { email: validSignup.email, password: PW } });
rec("Signup", "Login before admin approval blocked", "400 pending", `${r.status}:${r.json?.message?.slice(0,30)}`,
  r.status === 400 && /review|approval/i.test(r.json?.message || ""), "High");

// Email verification token flow
rec("Signup", "Email verification token flow", "verification link/token endpoint exists",
  "NOT IMPLEMENTED — gating is admin-approval only (no token)", false, "Medium");

// Register rate-limit (10/hour). Fire enough to trip.
let got429 = false, code = 0;
for (let i = 0; i < 14; i++) {
  const rr = await api("POST", "/api/auth/register", { body: { ...validSignup, email: `rl_${i}_${Date.now()}@test.local` } });
  code = rr.status;
  if (rr.status === 429) { got429 = true; break; }
}
rec("Security", "Register rate limit triggers (10/hr)", "429 after limit", got429 ? "429" : `no-429(last ${code})`, got429, "Low");

// ───────────────────────────────────────────────────────────────────────────
// SECTION C: Admin approval workflow
// ───────────────────────────────────────────────────────────────────────────
// non-admin cannot list pending users
const c1tok = mint(accounts["client01@test.local"].id, "client", "Client");
r = await api("GET", "/api/admin/pending-users", { token: c1tok });
rec("Admin", "Non-admin blocked from /admin/pending-users", "403", r.status, r.status === 403, "Critical");
r = await api("GET", "/api/admin/pending-users", {});
rec("Admin", "Unauthenticated blocked from admin API", "401", r.status, r.status === 401, "Critical");

r = await api("GET", "/api/admin/pending-users", { token: adminToken });
const pendingBefore = r.json?.users?.length ?? 0;
rec("Admin", "Admin views pending users", ">=18 pending", pendingBefore, pendingBefore >= 18, "High");

// approve all clients + providers except reject client10 & provider08
const toReject = new Set(["client10@test.local", "provider08@test.local"]);
const approved = [], rejected = [];
for (const email of [...clients, ...providers]) {
  const u = accounts[email];
  if (toReject.has(email)) {
    const rr = await api("PATCH", `/api/admin/users/${u.id}/reject`, { token: adminToken, body: { reason: "QA rejection test" } });
    if (rr.status === 200) { u.approval = "rejected"; rejected.push(email); }
  } else {
    const rr = await api("PATCH", `/api/admin/users/${u.id}/approve`, { token: adminToken });
    if (rr.status === 200) { u.approval = "approved"; approved.push(email); }
  }
}
rec("Admin", "Approve users", "16 approved", approved.length, approved.length === 16, "High");
rec("Admin", "Reject users", "2 rejected", rejected.length, rejected.length === 2, "High");

// pending list updates after actions
r = await api("GET", "/api/admin/pending-users", { token: adminToken });
const pendingAfter = r.json?.users?.length ?? -1;
rec("Admin", "Pending list shrinks after approve/reject", "< before", `${pendingAfter} (was ${pendingBefore})`, pendingAfter < pendingBefore, "Medium");

// approved user can log in (real login, costs login-limiter budget — do ONE)
r = await api("POST", "/api/auth/login", { body: { email: "client01@test.local", password: PW } });
const c1LoginToken = r.json?.token;
rec("Admin", "Approved user can log in", "200 + token", `${r.status}/${c1LoginToken ? "token" : "none"}`, r.status === 200 && !!c1LoginToken, "High");

// rejected user cannot log in
r = await api("POST", "/api/auth/login", { body: { email: "client10@test.local", password: PW } });
rec("Admin", "Rejected user blocked at login", "400 not approved", `${r.status}:${r.json?.message?.slice(0,25)}`,
  r.status === 400 && /not approved|rejected/i.test(r.json?.message || ""), "High");

// approval notification delivered
const apprNotif = (await sql(`SELECT COUNT(*) n FROM notification WHERE user_id=? AND type='account_approved'`, [accounts["client01@test.local"].id]))[0].n;
rec("Notification", "Account-approved notification created", ">=1", apprNotif, apprNotif >= 1, "Medium");
const rejNotif = (await sql(`SELECT COUNT(*) n FROM notification WHERE user_id=? AND type='account_rejected'`, [accounts["client10@test.local"].id]))[0].n;
rec("Notification", "Account-rejected notification created", ">=1", rejNotif, rejNotif >= 1, "Low");

// ───────────────────────────────────────────────────────────────────────────
// SECTION D: Provider mode + profile + availability + isolation
// ───────────────────────────────────────────────────────────────────────────
const provTokens = {};
for (const email of providers) {
  if (accounts[email].approval !== "approved") continue;
  provTokens[email] = mint(accounts[email].id, "client", "Provider");
}
const p1 = "provider01@test.local", p2 = "provider02@test.local";
// create/update provider profile
r = await api("PUT", "/api/provider/profile", { token: provTokens[p1], body: { displayName: "Provider One Services", bio: "Trusted home services in Subic Bay.", isProviderActive: true } });
rec("Provider", "Update provider display name + bio", "200", r.status, r.status === 200, "High");
// persistence
r = await api("GET", "/api/provider/profile", { token: provTokens[p1] });
rec("Provider", "Provider bio persists (not hardcoded)", "bio matches", r.json?.profile?.bio?.slice(0,10),
  r.json?.profile?.bio === "Trusted home services in Subic Bay.", "Medium");
// toggle availability off then back, check persistence
await api("PUT", "/api/provider/profile", { token: provTokens[p2], body: { displayName: "Provider Two Services", bio: "Quality work.", isProviderActive: false } });
r = await api("GET", "/api/provider/profile", { token: provTokens[p2] });
rec("Provider", "Availability toggle persists", "isProviderActive=0", r.json?.profile?.isProviderActive, Number(r.json?.profile?.isProviderActive) === 0, "Medium");
// set rest of providers active with profiles + display names
for (const email of providers) {
  if (!provTokens[email] || email === p1 || email === p2) continue;
  await api("PUT", "/api/provider/profile", { token: provTokens[email], body: { displayName: `${email.split("@")[0]} Services`, bio: `Bio for ${email}`, isProviderActive: true } });
}
// data isolation: provider1 services should not include provider2's
// (after services created below we re-verify; here check empty/own only)
r = await api("GET", "/api/provider/services", { token: provTokens[p1] });
rec("Provider", "Provider services endpoint returns own list", "array", Array.isArray(r.json?.services) ? "array" : typeof r.json?.services, Array.isArray(r.json?.services), "Medium");

// ───────────────────────────────────────────────────────────────────────────
// SECTION E: Service creation + admin approval
// ───────────────────────────────────────────────────────────────────────────
const cats = (await sql(`SELECT id,name FROM service_category`));
const catId = (n) => cats.find((c) => c.name === n)?.id || null;
const svcDefs = [
  [p1, "House Cleaning", "Cleaning", "fixed", 1500, "Full home cleaning including kitchen, bathrooms and bedrooms."],
  [p1, "Deep Cleaning", "Cleaning", "hourly", 400, "Detailed top to bottom deep cleaning service for homes."],
  [p2, "Plumbing Repair", "Plumbing", "quote", null, "Leak repairs, pipe fitting and fixture installation."],
  ["provider03@test.local", "Electrical Repair", "Electrical", "fixed", 1200, "Outlet, switch and light fixture repair and installation."],
  ["provider04@test.local", "Lawn Care", "Landscaping", "fixed", 800, "Lawn mowing, edging and yard cleanup services."],
  ["provider05@test.local", "Appliance Repair", "Handyman", "quote", null, "Repair for common household appliances and units."],
  ["provider06@test.local", "Moving Help", "Moving Help", "hourly", 500, "Loading, unloading and careful moving assistance."],
  ["provider07@test.local", "Pest Control", "Personal Services", "fixed", 2000, "Safe pest control treatment for homes and offices."],
];
const createdServices = []; // {id, provider, title}
for (const [email, title, cat, pricingType, priceAmount, description] of svcDefs) {
  if (!provTokens[email]) continue;
  const rr = await api("POST", "/api/provider/services", { token: provTokens[email],
    body: { title, categoryId: catId(cat), description, pricingType, priceAmount, currency: "PHP", serviceLocationType: "client_home" } });
  if (rr.status === 201) createdServices.push({ id: rr.json.service.providerServiceId, email, title });
}
rec("Service", "Providers create services", `${svcDefs.length} created`, createdServices.length, createdServices.length === svcDefs.length, "High");

// negative service cases
r = await api("POST", "/api/provider/services", { token: provTokens[p1], body: { description: "no title", pricingType: "fixed", priceAmount: 100 } });
rec("Service", "Service missing title rejected", "400", r.status, r.status === 400, "Medium");
r = await api("POST", "/api/provider/services", { token: provTokens[p1], body: { title: "Bad Price", pricingType: "fixed", priceAmount: -50, categoryId: catId("Cleaning"), description: "Negative price test description here." } });
rec("Service", "Service negative price handling", "400 or rejected", `${r.status}`, r.status === 400, "Medium");
r = await api("POST", "/api/provider/services", { token: provTokens[p1], body: { title: "x", pricingType: "fixed", priceAmount: 10, description: "asdf" } });
rec("Service", "Service gibberish/too-short content handling", "400 validation", `${r.status}`, r.status === 400, "Low");

// new services are pending — not in browse yet
let browse = (await api("GET", "/api/services/browse", {})).json?.services || [];
const firstSvc = createdServices[0];
let inBrowsePending = browse.some((s) => s.providerServiceId === firstSvc.id);
rec("Service", "Pending service NOT in Browse", "absent", inBrowsePending ? "present" : "absent", !inBrowsePending, "High");

// admin views pending services
r = await api("GET", "/api/admin/pending-services", { token: adminToken });
const pendingSvcCount = r.json?.services?.length ?? 0;
rec("Service", "Admin views pending services", `>=${createdServices.length}`, pendingSvcCount, pendingSvcCount >= createdServices.length, "Medium");

// approve all but reject pest control (provider07)
const svcReject = createdServices.find((s) => s.title === "Pest Control");
const approvedSvc = [], rejectedSvc = [];
for (const s of createdServices) {
  if (s.title === "Pest Control") {
    const rr = await api("PATCH", `/api/admin/services/${s.id}/reject`, { token: adminToken, body: { reason: "QA reject" } });
    if (rr.status === 200) rejectedSvc.push(s);
  } else {
    const rr = await api("PATCH", `/api/admin/services/${s.id}/approve`, { token: adminToken });
    if (rr.status === 200) approvedSvc.push(s);
  }
}
rec("Service", "Admin approves services", `${createdServices.length - 1}`, approvedSvc.length, approvedSvc.length === createdServices.length - 1, "High");
rec("Service", "Admin rejects service", "1", rejectedSvc.length, rejectedSvc.length === 1, "Medium");

// approved appears in browse, rejected does not
browse = (await api("GET", "/api/services/browse", {})).json?.services || [];
const approvedInBrowse = browse.some((s) => s.providerServiceId === firstSvc.id);
rec("Service", "Approved service appears in Browse", "present", approvedInBrowse ? "present" : "absent", approvedInBrowse, "High");
const rejectedInBrowse = browse.some((s) => s.providerServiceId === svcReject.id);
rec("Service", "Rejected service NOT in Browse", "absent", rejectedInBrowse ? "present" : "absent", !rejectedInBrowse, "High");
// detail of rejected -> 404
r = await api("GET", `/api/services/${svcReject.id}`, {});
rec("Service", "Rejected service detail returns 404 (public)", "404", r.status, r.status === 404, "High");
// detail of approved -> 200 with fields + currency
r = await api("GET", `/api/services/${firstSvc.id}`, {});
const det = r.json?.service;
rec("Service", "Approved service detail loads with fields", "title+provider+currency", `${det?.title}/${det?.providerName}/${det?.currency}`,
  !!(det?.title && det?.providerName && det?.currency), "Medium");
// service approval notification
const svcApprNotif = (await sql(`SELECT COUNT(*) n FROM notification WHERE user_id=? AND type='service_approved'`, [accounts[firstSvc.email].id]))[0].n;
rec("Notification", "Service-approved notification to provider", ">=1", svcApprNotif, svcApprNotif >= 1, "Medium");
const svcRejNotif = (await sql(`SELECT COUNT(*) n FROM notification WHERE user_id=? AND type='service_rejected'`, [accounts[svcReject.email].id]))[0].n;
rec("Notification", "Service-rejected notification to provider", ">=1", svcRejNotif, svcRejNotif >= 1, "Low");

// nonexistent detail
r = await api("GET", `/api/services/99999999`, {});
rec("Service", "Nonexistent service detail 404", "404", r.status, r.status === 404, "Low");

// ───────────────────────────────────────────────────────────────────────────
// SECTION F: Booking simulation (>=20 attempts)
// ───────────────────────────────────────────────────────────────────────────
const clientToks = {};
for (const e of clients) if (accounts[e].approval === "approved") clientToks[e] = mint(accounts[e].id, "client", "Client");
const approvedClients = Object.keys(clientToks);
const bookableSvcs = approvedSvc.filter((s) => s.title !== "Deep Cleaning"); // keep variety
const bookingMatrix = [];
let attempts = 0, created = 0;
// many clients booking many providers' services (one each, unique pairs)
for (let i = 0; i < approvedClients.length; i++) {
  const ce = approvedClients[i];
  const svc = bookableSvcs[i % bookableSvcs.length];
  const provId = accounts[svc.email].id;
  attempts++;
  const rr = await api("POST", "/api/bookings", { token: clientToks[ce],
    body: { providerServiceId: svc.id, providerId: provId, requestedDate: "2026-07-01", requestedTime: "10:00:00", clientMessage: "QA booking" } });
  if (rr.status === 201) created++;
  bookingMatrix.push({ client: ce, provider: svc.email, service: svc.title, action: "book", expected: "201", actual: rr.status, status: rr.status === 201 ? "PASS" : "FAIL", bookingId: rr.json?.booking?.bookingId });
}
// extra bookings to exceed 20 attempts: a few clients book a 2nd different service
for (let i = 0; i < 6; i++) {
  const ce = approvedClients[i];
  const svc = bookableSvcs[(i + 2) % bookableSvcs.length];
  const provId = accounts[svc.email].id;
  attempts++;
  const rr = await api("POST", "/api/bookings", { token: clientToks[ce],
    body: { providerServiceId: svc.id, providerId: provId, requestedDate: "2026-07-05", requestedTime: "14:00:00", clientMessage: "QA booking 2" } });
  if (rr.status === 201) created++;
  bookingMatrix.push({ client: ce, provider: svc.email, service: svc.title, action: "book2", expected: "201", actual: rr.status, status: rr.status === 201 ? "PASS" : "FAIL", bookingId: rr.json?.booking?.bookingId });
}
rec("Booking", "Booking attempts performed", ">=20", attempts, attempts >= 20, "High");
rec("Booking", "Valid bookings created", ">=15", created, created >= 15, "High");

// duplicate booking: client01 books same service again
const dupClient = approvedClients[0];
const dupSvc = bookableSvcs[0];
r = await api("POST", "/api/bookings", { token: clientToks[dupClient],
  body: { providerServiceId: dupSvc.id, providerId: accounts[dupSvc.email].id, requestedDate: "2026-07-09", requestedTime: "09:00:00" } });
attempts++;
rec("Booking", "Duplicate active booking blocked", "400 already active", `${r.status}:${r.json?.message?.slice(0,25)}`,
  r.status === 400 && /active booking/i.test(r.json?.message || ""), "High");
bookingMatrix.push({ client: dupClient, provider: dupSvc.email, service: dupSvc.title, action: "duplicate", expected: "400 blocked", actual: r.status, status: r.status === 400 ? "PASS" : "FAIL" });

// self-booking: provider01 tries to book own service
r = await api("POST", "/api/bookings", { token: provTokens[p1],
  body: { providerServiceId: firstSvc.id, providerId: accounts[p1].id } });
rec("Booking", "Self-booking blocked", "400 own service", `${r.status}:${r.json?.message?.slice(0,20)}`,
  r.status === 400 && /own service/i.test(r.json?.message || ""), "Medium");

// booking unavailable provider (provider02 set inactive earlier; approve its service first if pending)
// provider02's "Plumbing Repair" — ensure approved
const plumb = createdServices.find((s) => s.title === "Plumbing Repair");
await api("PATCH", `/api/admin/services/${plumb.id}/approve`, { token: adminToken }); // may already be approved
// provider02 inactive -> service should NOT be in browse
browse = (await api("GET", "/api/services/browse", {})).json?.services || [];
const inactiveInBrowse = browse.some((s) => s.providerServiceId === plumb.id);
rec("Booking", "Inactive-provider service hidden from Browse", "absent", inactiveInBrowse ? "present" : "absent", !inactiveInBrowse, "Medium");
// but direct booking API against inactive provider's approved+visible service:
r = await api("POST", "/api/bookings", { token: clientToks[approvedClients[1]],
  body: { providerServiceId: plumb.id, providerId: accounts[p2].id, requestedDate: "2026-07-10", requestedTime: "11:00:00" } });
rec("Booking", "Booking inactive provider via API blocked", "should block (400/404)", `${r.status}`,
  r.status === 400 || r.status === 404, "Medium");

// provider accept / decline / complete + notifications
const acceptBk = bookingMatrix.find((b) => b.status === "PASS" && b.bookingId && b.action === "book");
const declineBk = bookingMatrix.filter((b) => b.status === "PASS" && b.bookingId && b.action === "book")[1];
const completeBk = bookingMatrix.filter((b) => b.status === "PASS" && b.bookingId && b.action === "book")[2];
if (acceptBk) {
  const provTok = provTokens[acceptBk.provider];
  r = await api("PATCH", `/api/bookings/${acceptBk.bookingId}/respond`, { token: provTok, body: { status: "accepted", responseMessage: "See you then" } });
  rec("Booking", "Provider accepts booking", "200 accepted", `${r.status}/${r.json?.booking?.status}`, r.status === 200 && r.json?.booking?.status === "accepted", "High");
}
if (declineBk) {
  const provTok = provTokens[declineBk.provider];
  r = await api("PATCH", `/api/bookings/${declineBk.bookingId}/respond`, { token: provTok, body: { status: "declined" } });
  rec("Booking", "Provider declines booking", "200 declined", `${r.status}/${r.json?.booking?.status}`, r.status === 200 && r.json?.booking?.status === "declined", "Medium");
}
if (completeBk) {
  const provTok = provTokens[completeBk.provider];
  await api("PATCH", `/api/bookings/${completeBk.bookingId}/respond`, { token: provTok, body: { status: "accepted" } });
  r = await api("PATCH", `/api/bookings/${completeBk.bookingId}/respond`, { token: provTok, body: { status: "completed" } });
  rec("Booking", "Provider completes booking", "200 completed", `${r.status}/${r.json?.booking?.status}`, r.status === 200 && r.json?.booking?.status === "completed", "Medium");
}
// client cancels a pending booking
const cancelBk = bookingMatrix.filter((b) => b.status === "PASS" && b.bookingId && b.action === "book2")[0];
if (cancelBk) {
  r = await api("PATCH", `/api/bookings/${cancelBk.bookingId}/cancel`, { token: clientToks[cancelBk.client] });
  rec("Booking", "Client cancels booking", "200 cancelled", `${r.status}/${r.json?.booking?.status}`, r.status === 200 && r.json?.booking?.status === "cancelled", "Medium");
}
// cross-user: client tries to cancel someone else's booking
if (acceptBk) {
  const otherClient = clientToks[approvedClients[approvedClients.length - 1]];
  r = await api("PATCH", `/api/bookings/${acceptBk.bookingId}/cancel`, { token: otherClient });
  rec("Security", "Client cannot cancel another user's booking", "403/Not authorized", `${r.status}:${r.json?.message?.slice(0,20)}`, r.status === 403, "Critical");
}
// My Bookings filters
r = await api("GET", "/api/bookings/client?status=pending", { token: clientToks[approvedClients[3]] });
rec("Booking", "Client bookings status filter works", "all pending", (r.json?.bookings || []).every((b) => b.status === "pending") ? "ok" : "mixed", (r.json?.bookings || []).every((b) => b.status === "pending"), "Low");
r = await api("GET", "/api/bookings/provider", { token: provTokens[acceptBk?.provider || p1] });
rec("Booking", "Provider bookings list loads", "array", Array.isArray(r.json?.bookings) ? "array" : "?", Array.isArray(r.json?.bookings), "Medium");
// booking notifications: provider got booking_created
const bkCreatedNotif = (await sql(`SELECT COUNT(*) n FROM notification WHERE type='booking_created'`))[0].n;
rec("Notification", "Booking-created notifications generated", ">=1", bkCreatedNotif, bkCreatedNotif >= 1, "Medium");
const bkAcceptNotif = acceptBk ? (await sql(`SELECT COUNT(*) n FROM notification WHERE user_id=? AND type='booking_accepted'`, [accounts[acceptBk.client].id]))[0].n : 0;
rec("Notification", "Booking-accepted notification to client", ">=1", bkAcceptNotif, bkAcceptNotif >= 1, "Medium");

// ───────────────────────────────────────────────────────────────────────────
// SECTION G: Messaging / conversations
// ───────────────────────────────────────────────────────────────────────────
const msgClient = approvedClients[0];
const msgSvc = approvedSvc.find((s) => s.title === "House Cleaning") || approvedSvc[0];
r = await api("POST", "/api/conversations", { token: clientToks[msgClient], body: { provider_service_id: msgSvc.id, message: "Hi, are you available next week?" } });
const convoId = r.json?.conversationId;
rec("Messaging", "Client starts conversation", "201 + conversationId", `${r.status}/${convoId ? "id" : "none"}`, r.status === 201 && !!convoId, "High");
// provider replies
const msgProvTok = provTokens[msgSvc.email];
r = await api("POST", `/api/conversations/${convoId}/messages`, { token: msgProvTok, body: { message: "Yes, I have openings Tuesday." } });
rec("Messaging", "Provider replies", "201", r.status, r.status === 201, "High");
// client sends another
await api("POST", `/api/conversations/${convoId}/messages`, { token: clientToks[msgClient], body: { message: "Tuesday 10am works." } });
// message order
r = await api("GET", `/api/conversations/${convoId}/messages`, { token: clientToks[msgClient] });
const msgs = r.json?.messages || [];
const ordered = msgs.length === 3 && msgs[0].body.startsWith("Hi") && msgs[2].body.startsWith("Tuesday");
rec("Messaging", "Message order correct (3 msgs)", "ordered ascending", `${msgs.length} msgs`, ordered, "Medium");
// permission: third user cannot read
const intruder = clientToks[approvedClients[approvedClients.length - 1]];
r = await api("GET", `/api/conversations/${convoId}/messages`, { token: intruder });
rec("Security", "Non-participant cannot read conversation", "403", r.status, r.status === 403, "Critical");
// conversation list updates
r = await api("GET", "/api/conversations", { token: clientToks[msgClient] });
rec("Messaging", "Conversation list shows convo", ">=1", (r.json?.conversations || []).length, (r.json?.conversations || []).length >= 1, "Low");
// admin message logs + pagination
r = await api("GET", "/api/admin/message-logs?page=1&limit=2", { token: adminToken });
rec("Messaging", "Admin message logs load w/ pagination", "messages+pagination", `${(r.json?.messages||[]).length} / total ${r.json?.pagination?.total}`,
  Array.isArray(r.json?.messages) && !!r.json?.pagination, "Low");
// non-admin cannot view logs
r = await api("GET", "/api/admin/message-logs", { token: c1tok });
rec("Security", "Non-admin blocked from message logs", "403", r.status, r.status === 403, "High");

// ───────────────────────────────────────────────────────────────────────────
// SECTION H: Notifications behavior
// ───────────────────────────────────────────────────────────────────────────
r = await api("GET", "/api/notifications", { token: clientToks[msgClient] });
const myNotifs = r.json?.notifications || r.json || [];
const list = Array.isArray(myNotifs) ? myNotifs : (myNotifs.notifications || []);
rec("Notification", "User notification list loads", "array", Array.isArray(list) ? "array" : typeof list, Array.isArray(list), "Medium");
// isolation: all belong to user
const myId = accounts[msgClient].id;
const allMine = list.every((n) => n.userId === myId);
rec("Notification", "Notifications isolated to owner", "all userId match", allMine ? "ok" : "leak", allMine, "Critical");
// unread count
r = await api("GET", "/api/notifications/unread-count", { token: clientToks[msgClient] });
const unread = r.json?.count ?? r.json?.unreadCount ?? r.json;
rec("Notification", "Unread count endpoint", "number", typeof unread === "number" ? unread : JSON.stringify(unread), typeof unread === "number", "Low");
// mark one read
if (list[0]) {
  r = await api("PATCH", `/api/notifications/${list[0].id}/read`, { token: clientToks[msgClient] });
  rec("Notification", "Mark notification read", "200", r.status, r.status === 200, "Low");
  // refresh preserves
  const after = (await api("GET", "/api/notifications", { token: clientToks[msgClient] })).json;
  const al = Array.isArray(after) ? after : (after.notifications || []);
  const stillRead = al.find((n) => n.id === list[0].id)?.isRead === true;
  rec("Notification", "Read state persists after refresh", "isRead true", stillRead, stillRead, "Low");
}
// cannot mark another user's notification (ownership enforced -> affectedRows 0 => still 200 but no change). Check no cross effect:
const otherNotif = (await sql(`SELECT id,user_id FROM notification WHERE user_id<>? LIMIT 1`, [myId]))[0];
if (otherNotif) {
  r = await api("PATCH", `/api/notifications/${otherNotif.id}/read`, { token: clientToks[msgClient] });
  const changed = (await sql(`SELECT is_read FROM notification WHERE id=?`, [otherNotif.id]))[0].is_read;
  rec("Security", "Cannot mark another user's notification read", "unchanged (0)", `is_read=${changed}`, Number(changed) === 0, "High");
}

// ───────────────────────────────────────────────────────────────────────────
// SECTION I: Profile + password
// ───────────────────────────────────────────────────────────────────────────
const ppEmail = approvedClients[2];
const ppId = accounts[ppEmail].id;
const ppTok = mint(ppId, "client", "Client");
r = await api("PATCH", "/api/auth/profile", { token: ppTok, body: { firstName: "Updated", lastName: "Name", phoneNumber: "09170001111" } });
rec("Profile", "Update profile", "200", r.status, r.status === 200, "Medium");
r = await api("GET", "/api/auth/profile", { token: ppTok });
rec("Profile", "Profile role badge shows role", "role present", r.json?.user?.role, !!r.json?.user?.role, "Low");
// verify password (correct + wrong)
r = await api("POST", "/api/auth/password/verify", { token: ppTok, body: { currentPassword: PW } });
rec("Profile", "Password verify (correct)", "200", r.status, r.status === 200, "Medium");
r = await api("POST", "/api/auth/password/verify", { token: ppTok, body: { currentPassword: "wrongpass1" } });
rec("Profile", "Password verify (wrong) rejected", "400", r.status, r.status === 400, "Medium");
// weak new password rejected
r = await api("PATCH", "/api/auth/password", { token: ppTok, body: { currentPassword: PW, newPassword: "weak", confirmPassword: "weak" } });
rec("Profile", "Weak new password rejected", "400", r.status, r.status === 400, "High");
// change password
const NEWPW = "NewPass1234!";
r = await api("PATCH", "/api/auth/password", { token: ppTok, body: { currentPassword: PW, newPassword: NEWPW, confirmPassword: NEWPW } });
rec("Profile", "Change password", "200", r.status, r.status === 200, "High");
// old password no longer works
r = await api("POST", "/api/auth/login", { body: { email: ppEmail, password: PW } });
rec("Profile", "Old password rejected after change", "400 invalid", `${r.status}`, r.status === 400, "High");
// old token invalidated (iat < password_changed_at)
r = await api("GET", "/api/auth/profile", { token: ppTok });
rec("Security", "Old JWT invalidated after password change", "401 session expired", `${r.status}:${r.json?.message?.slice(0,20)}`, r.status === 401, "High");

// ───────────────────────────────────────────────────────────────────────────
// SECTION J: Security / access control
// ───────────────────────────────────────────────────────────────────────────
r = await api("GET", "/api/provider/profile", {});
rec("Security", "Provider API requires auth", "401", r.status, r.status === 401, "Critical");
r = await api("GET", "/api/provider/profile", { token: "garbage.token.value" });
rec("Security", "Invalid token rejected", "401", r.status, r.status === 401, "Critical");
// spoofed x-user-id without token
r = await api("GET", "/api/provider/profile", { headers: { "x-user-id": String(adminRow.id) } });
rec("Security", "Spoofed x-user-id header ignored (no token)", "401", r.status, r.status === 401, "Critical");
// non-admin cannot approve users
r = await api("PATCH", `/api/admin/users/${accounts["client02@test.local"].id}/approve`, { token: c1tok });
rec("Security", "Non-admin cannot approve users", "403", r.status, r.status === 403, "Critical");
// rejected user token cannot access protected? (rejected users never get a valid login token; minted token would still pass auth since approval not checked in middleware)
const rejTok = mint(accounts["client10@test.local"].id, "client", "Client");
r = await api("GET", "/api/auth/profile", { token: rejTok });
rec("Security", "Rejected user with minted token reaches protected route", "ideally blocked", `${r.status} (approval not re-checked in requireAuth)`, r.status === 401 || r.status === 403, "Medium");
// login rate limit (5/15min) — fire wrong-password logins
let login429 = false;
for (let i = 0; i < 8; i++) {
  const rr = await api("POST", "/api/auth/login", { body: { email: "nobody@test.local", password: "x" } });
  if (rr.status === 429) { login429 = true; break; }
}
rec("Security", "Login rate limit triggers (5/15min)", "429", login429 ? "429" : "no-429", login429, "Low");

// ───────────────────────────────────────────────────────────────────────────
// Summary + account/booking matrices
// ───────────────────────────────────────────────────────────────────────────
const fail = results.filter((x) => x.status === "FAIL");
const bySev = (s) => fail.filter((x) => x.severity === s).length;
const summary = {
  total: results.length, passed: results.filter((x) => x.status === "PASS").length, failed: fail.length,
  critical: bySev("Critical"), high: bySev("High"), medium: bySev("Medium"), low: bySev("Low"),
  accounts: { clients: clients.length, providers: providers.length, approved: approved.length, rejected: rejected.length },
  bookings: { attempts, created },
};
const out = { summary, results, bookingMatrix, failures: fail };
const fs = await import("fs");
fs.writeFileSync("qa_results.json", JSON.stringify(out, null, 2));
console.log("\n==================== SUMMARY ====================");
console.log(JSON.stringify(summary, null, 2));
console.log("\n==================== FAILURES ====================");
fail.forEach((f) => console.log(`  [${f.severity}] (${f.area}) ${f.name} — exp:${f.expected} act:${f.actual}`));
await db.end();
process.exit(0);
