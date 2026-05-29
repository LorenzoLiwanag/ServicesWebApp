# Claude Code Prompts

Drop-in prompts for each section of [`PLAN.md`](./PLAN.md). Each one is
self-contained — paste it into a fresh Claude Code session (run from the
repo root, `C:\Users\liwan\source\repos\ServicesWebApp`). Bigger sections
of the plan are split into multiple prompts because Claude Code does its
best work when the task is focused.

**Conventions used in every prompt below:**

- The frontend lives in `services-web-app/` (Create React App, JSX).
- The backend is in a sibling repo and exposes a JSON REST API under
  `/api`. The frontend reads the base URL from
  `process.env.REACT_APP_API_BASE_URL` (default `http://localhost:3000`).
- Auth uses a JWT stored in `localStorage` under the key `token`, and the
  user object under `user`. See `services-web-app/src/utils/auth.js`.
- Routes are declared in `services-web-app/src/App.js`.
- Always read `PLAN.md` first for the full data model and API contract.

---

## Prompt 1 — Foundations: AuthContext + API client + role-based routing

```
Read PLAN.md (sections 1.1, 1.2, 1.3) and the following files before you
write any code: services-web-app/src/App.js,
services-web-app/src/utils/auth.js, services-web-app/src/pages/LoginPage.jsx,
services-web-app/src/components/login/LoginForm.jsx,
services-web-app/src/pages/ClientDashboardPage.jsx,
services-web-app/src/pages/ProviderDashboard.jsx.

Goal: lay the frontend foundations so feature work that follows is just
CRUD against a stable shape. Do NOT touch backend code; do NOT implement
features yet. Scope:

1. Create services-web-app/src/context/AuthContext.jsx exposing
   { user, token, isAuthenticated, login(user, token), logout(),
   hasRole(role) }. Source of truth: localStorage keys "user" and "token"
   (same keys as today). Hydrate from localStorage on mount. Provide a
   useAuth() hook.

2. Wrap <App /> in <AuthProvider> in services-web-app/src/index.js.

3. Replace direct localStorage reads in ClientDashboardPage.jsx and
   ProviderDashboard.jsx with useAuth(). Replace the login success block
   in LoginForm.jsx with auth.login(user, token).

4. Create services-web-app/src/api/client.js exporting an apiFetch(path,
   options) helper that:
   - Prefixes process.env.REACT_APP_API_BASE_URL (default
     "http://localhost:3000").
   - Adds Authorization: Bearer <token> from localStorage when present.
   - Sets Content-Type: application/json and JSON.stringifies the body if
     options.body is an object.
   - Throws an Error with the server's `message` on non-2xx responses.

5. Create one file per resource in services-web-app/src/api/: auth.js,
   services.js, bookings.js, reviews.js, notifications.js, messages.js,
   contact.js, admin.js. Each exports thin functions matching the routes
   listed in PLAN.md section 1.2 (e.g., bookings.listMine({ role, status
   }), services.create(payload), notifications.markRead(id)). Implement
   them as one-liners that call apiFetch — DO NOT add request/response
   shaping logic yet.

6. Update App.js: rename RequireAuth → RequireAuth/RequireRole. Add a
   <RequireRole role="provider"> wrapper around /provider-mode, and add a
   placeholder /admin route guarded by <RequireRole role="admin"> that
   renders a stub "Admin (coming soon)" component.

Acceptance:
- App still builds (`npm start` in services-web-app/ has no new errors).
- Logging in still navigates to /client-dashboard.
- Dashboards still render the welcome name (now via useAuth).
- A user without role "provider" is redirected to /login (or /
  client-dashboard — your choice, document it) when hitting
  /provider-mode.
```

---

## Prompt 2 — Foundations: backend data model + migrations

```
Read PLAN.md sections 1.1 and 1.2. This task is for the BACKEND repo
(separate from services-web-app/). Confirm the backend path with me
before writing files.

Goal: add database schema + migrations for the entities the frontend
needs. Do NOT implement route handlers yet.

Scope:
1. Add migrations creating tables: users (extend existing if present —
   need columns role enum('client','provider','admin'), phone),
   provider_profiles, services, bookings, reviews, notifications,
   messages, contact_submissions. Use the columns in PLAN.md section 1.1
   as the source of truth.

2. Add foreign keys with sensible ON DELETE behavior (CASCADE for
   provider_profiles → users; RESTRICT for bookings.service_id so
   services can't be hard-deleted while bookings exist).

3. Add indexes on the columns the frontend filters on:
   bookings(client_id, status), bookings(provider_id, status),
   services(provider_id, is_active), notifications(user_id, is_read),
   messages(thread_id).

4. Seed a few rows: 2 clients, 2 providers (with provider_profiles), 1
   admin, 4–6 services across the two providers. This lets us exercise
   the UI without re-typing fixtures every session.

Acceptance: migrations run cleanly up and down; seed runs cleanly.
Output a short summary of the created tables and any deviations from
PLAN.md.
```

---

## Prompt 3 — Landing page contact form + admin submissions

```
Read PLAN.md section 2. Read services-web-app/src/components/landing-page/
Contact.jsx and services-web-app/src/App.js.

Frontend scope:
1. Convert Contact.jsx into a controlled component (name, email, message
   in useState). Validate: all required, email format, message ≥ 10
   chars. Show inline field errors.
2. On submit, call api/contact.js → POST /api/contact. Show a success
   message and reset the form; show an error message on failure.
3. Disable the submit button while in flight.

4. Create services-web-app/src/pages/AdminMessagesPage.jsx wired to GET
   /api/admin/contact-submissions. Render a table with columns Date,
   Name, Email, Message preview, Status. Each row has actions: "Mark as
   read" and "Archive" (PATCH /api/admin/contact-submissions/:id). Add a
   filter dropdown for status (new / read / archived / all).

5. Add a route /admin/messages in App.js guarded by <RequireRole
   role="admin">. Link to it from the placeholder /admin page.

Backend scope (in the backend repo):
1. POST /api/contact (public, no auth): validate body, insert row with
   status='new'. Optionally email an admin address (env var
   ADMIN_NOTIFICATION_EMAIL) — wrap in try/catch and don't fail the
   request if email sending fails.
2. GET /api/admin/contact-submissions and PATCH .../:id (admin-only).

Acceptance: filling the landing form persists a row and shows success;
the admin page lists it; marking as read updates the badge/filter.
```

---

## Prompt 4 — Services: provider CRUD + browse wiring

```
Read PLAN.md sections 3.1, 3.2, 4.3. Read these files: services-web-app/
src/pages/ServicesPage.jsx, services-web-app/src/components/services/
ServicesSearchBar.jsx, services-web-app/src/components/services/
ServicesSortBar.jsx, services-web-app/src/components/dashboard/
DashboardServiceSection.jsx, services-web-app/src/components/
provider-mode/ProviderServicesWidget.jsx, services-web-app/src/data/
mockServices.js.

Frontend scope:
1. Replace mockServices usage in ServicesPage.jsx with api/services.js
   → GET /api/services/browse. Wire ServicesSearchBar (text query) and
   ServicesSortBar (sort key, e.g., price_asc, rating_desc) to query
   params and re-fetch on change. Debounce text input 300ms.

2. Build a new service detail page at services-web-app/src/pages/
   ServiceDetailPage.jsx (route /service/:id). Fetch GET /api/services/
   :id. Show full description, provider info, reviews list, and the
   Book Now + Contact CTAs.

3. ProviderServicesWidget.jsx:
   - List the current provider's services via GET /api/provider/services.
   - Add buttons: New service, Edit, Delete (soft-delete: PATCH with
     is_active=false).
   - Build a ServiceFormModal (name, category, description, pricing_type,
     rate_amount, currency) shared by New and Edit.
   - After any create/update/delete, invalidate cached browse data so
     the next visit to /services and the dashboard featured section
     re-fetches.

4. Delete services-web-app/src/data/mockServices.js once nothing
   imports it.

Backend scope:
- GET /api/services/browse (already exists — confirm shape matches
  PLAN.md: providerServiceId, serviceName, providerName, bio, avgRating,
  reviewCount, pricingType, rateAmount, currency).
- GET /api/services/:id
- GET /api/provider/services (auth, role=provider, scoped to current
  user's provider_id)
- POST /api/services, PATCH /api/services/:id, DELETE /api/services/:id
  (auth, role=provider, ownership check)

Acceptance: a provider can add a service in the widget and see it
appear in /services and in DashboardServiceSection's featured grid.
```

---

## Prompt 5 — Bookings end-to-end

```
Read PLAN.md sections 3.1, 3.3, 4.1, 4.2. Read these files: services-web-
app/src/components/dashboard/DashboardServiceSection.jsx, services-web-
app/src/components/dashboard/DashboardMyBookings.jsx, services-web-app/
src/components/provider-mode/ProviderRequestsWidget.jsx, services-web-
app/src/components/provider-mode/ProviderUpcomingJobsWidget.jsx,
services-web-app/src/App.js.

Frontend scope:
1. Build shared modals in services-web-app/src/components/booking/:
   - BookModal.jsx (props: service, defaultDate?). Fields: scheduled_for
     (datetime), address, notes. Submits via api/bookings.js → POST
     /api/bookings.
   - BookingDetailModal.jsx (props: bookingId). Read-only summary +
     action buttons appropriate to status and role.
   - CancelConfirmModal.jsx — confirmation before PATCH status=cancelled.

2. Wire DashboardServiceSection.jsx and ServicesPage.jsx Book Now
   buttons to open BookModal. On success: toast + invalidate bookings
   queries.

3. DashboardMyBookings.jsx (upcoming widget):
   - Replace hardcoded sample with GET /api/bookings/mine?role=client
     &status=upcoming (limit 3).
   - Each row → opens BookingDetailModal with View / Contact / Cancel
     actions. View All button routes to /my-bookings.

4. Create services-web-app/src/pages/MyBookingsPage.jsx (route
   /my-bookings) listing all the client's bookings with status filter
   tabs (Upcoming / Past / Cancelled). Same actions per row.

5. ProviderRequestsWidget.jsx: replace the useState mock array with
   GET /api/bookings/mine?role=provider&status=pending. Accept and
   Decline buttons call PATCH /api/bookings/:id/status. On success,
   remove from this widget and let ProviderUpcomingJobsWidget refetch.

6. ProviderUpcomingJobsWidget.jsx: fetch GET /api/bookings/mine?role=
   provider&status=accepted (future-dated). Show client name, service,
   datetime, address. Add Contact button and a "Mark complete" action.

7. Lift bookings state into a small context (services-web-app/src/
   context/BookingsContext.jsx) so the provider widgets refetch together
   when the status of any booking changes. Or use a tiny event bus —
   pick whichever feels lighter and document the choice.

Backend scope:
- POST /api/bookings (auth, role=client; default status='pending').
- GET /api/bookings/mine?role=client|provider&status=... (auth,
  scoped to current user).
- PATCH /api/bookings/:id/status (auth; allowed transitions:
  pending→accepted/declined by provider, pending|accepted→cancelled by
  client, accepted→completed by provider). Emit notifications on each
  transition (Prompt 6 wires the UI for them).

Acceptance: client books from /services → provider sees the request →
accepts → client's upcoming widget shows it → client cancels → provider
sees it disappear from upcoming.
```

---

## Prompt 6 — Notifications / alert center

```
Read PLAN.md section 5. Confirm bookings transitions (Prompt 5) are
already writing notifications rows on the backend before starting this
prompt — if not, do that first.

Frontend scope:
1. Create services-web-app/src/components/notifications/
   NotificationsBell.jsx:
   - On mount and every 45s, GET /api/notifications?unread=true.
   - Show a bell icon + unread count badge.
   - Click opens a dropdown with the latest 10 notifications. Clicking
     one marks it read (PATCH /api/notifications/:id/read) and
     navigates: booking_accepted/declined/cancelled → /my-bookings (or
     /provider-mode for provider notifications); new_message → message
     thread; new_review → provider services.

2. Add <NotificationsBell /> to services-web-app/src/components/dashboard/
   DashboardNavbar.jsx and services-web-app/src/components/provider-mode/
   ProviderNavbar.jsx.

3. Build services-web-app/src/pages/NotificationsPage.jsx (route
   /notifications) listing all notifications with filter (All / Unread)
   and a "Mark all as read" action.

4. Pause polling when document.visibilityState === 'hidden' to save
   requests; resume on visibilitychange.

Backend scope:
- GET /api/notifications?unread=true|false (auth, scoped to current
  user).
- PATCH /api/notifications/:id/read.
- POST /api/notifications/mark-all-read.
- Confirm rows are inserted by the booking-status transitions, by new
  reviews, and by new messages.

Acceptance: a provider accepting a request causes the client's bell to
show an unread count within ~45 seconds; clicking it routes to
/my-bookings.
```

---

## Prompt 7 — Reviews + Book Again

```
Read PLAN.md section 3.4. Read services-web-app/src/components/
dashboard/DashboardMyBookings.jsx and confirm Prompt 5 is merged so
bookings can reach status='completed'.

Frontend scope:
1. The "Recent Services" history widget in DashboardMyBookings.jsx now
   fetches GET /api/bookings/mine?role=client&status=past. Each row
   shows: service name, provider, date, plus actions.

2. Book Again button reuses the BookModal from Prompt 5, prefilled with
   the prior service + provider; user picks a new date.

3. Leave Review button opens a new ReviewModal (services-web-app/src/
   components/booking/ReviewModal.jsx) with a 1–5 star picker and a
   textarea (max 500 chars). POSTs to /api/reviews.

4. Hide the Leave Review button when the booking already has a review.
   Get this either from a has_review flag returned by the past-bookings
   endpoint or by fetching reviews for the current user.

5. Build a small <StarRating> presentational component reused on the
   service detail page (Prompt 4) and the review modal.

Backend scope:
- POST /api/reviews (auth, role=client). Validates that booking_id
  belongs to caller and status='completed' and that no review exists
  for it yet. Recomputes provider_profile.avg_rating and review_count
  in the same transaction.
- Include has_review in GET /api/bookings/mine?role=client&status=past
  responses.

Acceptance: after a provider marks a booking complete, the client sees
Leave Review on the row; submitting it updates the provider's rating on
the service detail page; the button disappears for that booking.
```

---

## Prompt 8 — Contact / messaging (the Contact button)

```
Read PLAN.md section 1.1 (messages table) and section 3.1.

Frontend scope:
1. services-web-app/src/components/messaging/ContactModal.jsx
   (props: recipientId, serviceId? bookingId?). Single textarea +
   Send. Submits to POST /api/messages with the supplied context ids.
   After success, show a toast and offer "View conversation" linking to
   the thread page.

2. services-web-app/src/pages/MessagesPage.jsx (route /messages): list
   of threads on the left (most-recent first), open thread on the right.
   GET /api/messages/threads and GET /api/messages?thread=:id.

3. Wire every existing "Contact" button to open ContactModal with the
   right ids:
   - DashboardServiceSection / ServicesPage: { recipientId:
     providerId, serviceId }
   - DashboardMyBookings rows: { recipientId: providerId, bookingId }
   - Provider upcoming jobs rows: { recipientId: clientId, bookingId }

Backend scope:
- POST /api/messages — derives or creates a thread_id; inserts a
  notifications row of type=new_message for the recipient.
- GET /api/messages/threads — distinct threads for current user with
  last message preview.
- GET /api/messages?thread=:id — full thread, newest last.
- PATCH /api/messages/:id/read (optional v1).

Acceptance: clicking Contact anywhere in the app opens the modal;
sending a message creates a notification for the recipient and a thread
visible from /messages on both sides.
```

---

## Notes on running these

- **Order matters.** Run prompts 1 → 2 → 3 in any order, then 4, then 5,
  then 6/7/8. Reviews (7) require completed bookings, which require
  bookings (5).
- **Branching.** Run each prompt on its own git branch and merge once
  the acceptance criteria are met — Claude Code is much easier to
  recover from when changes are scoped.
- **Iterate.** If Claude Code starts drifting (touching files outside
  the scope listed), interrupt and reply with "scope this to <list>";
  these prompts are written to be that list.
- **Backend prompts.** Prompts 2, 4, 5, 6, 7, 8 each contain a backend
  scope section — run those in your backend repo's Claude Code session,
  not in `services-web-app/`.
