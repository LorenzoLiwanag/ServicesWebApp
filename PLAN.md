# ServicesWebApp — Implementation Plan

A high-level plan for finishing the platform that connects clients to local
service providers. The frontend (`services-web-app/`) already has working
auth, a profile page, and the shells for the client dashboard, provider
dashboard, browse-services page, and landing page. The remaining work is
mostly **replacing mock/hardcoded UI state with real data flows** and
**adding the backend endpoints** that drive bookings, services CRUD,
notifications, reviews, messaging, and the contact form.

## Working assumptions

These can be adjusted — flagged so you can correct any before we start
building:

- **Backend stack.** The login form already POSTs to
  `http://localhost:3000/api/auth/login`, so a backend exists in a sibling
  repo. This plan defines the **API contract and data model** the frontend
  needs; you'll implement those endpoints in your existing backend.
- **Persistence.** Assume a relational store (Postgres or MySQL); the
  schema below is written that way but maps cleanly to MongoDB if you'd
  rather use that.
- **Notifications.** Polling-based in-app alert center for v1 (a bell icon
  in the navbar + an alerts page/dropdown). WebSocket push can come later.
- **Admin.** A lightweight admin role with a single admin dashboard page
  for viewing contact-form submissions (and a hook for moderation tools
  later).
- **Messaging / "Contact" button.** v1 = a simple message thread between
  client and provider, scoped to a booking or a service. Send +
  inbox/list, no read receipts or attachments.

---

## 1. Foundations (do these first — everything else depends on them)

### 1.1 Data model

Suggested core entities (column lists are illustrative, not exhaustive):

- **users** — `id, full_name, email, username, password_hash, role
  ('client' | 'provider' | 'admin'), phone, created_at`. A single user can
  toggle into provider mode if they have a `provider_profile`.
- **provider_profiles** — `id, user_id (FK), display_name, bio,
  is_active, avg_rating, review_count`.
- **services** — `id, provider_id (FK), name, category, description,
  pricing_type ('hourly' | 'fixed' | 'quote'), rate_amount, currency,
  is_active, created_at, updated_at`.
- **bookings** — `id, client_id (FK), provider_id (FK), service_id (FK),
  scheduled_for (datetime), address, notes, status ('pending' |
  'accepted' | 'declined' | 'cancelled' | 'completed'), price_quoted,
  created_at, updated_at`.
- **reviews** — `id, booking_id (FK, unique), client_id, provider_id,
  service_id, rating (1–5), comment, created_at`. One review per
  completed booking.
- **notifications** — `id, user_id (recipient), type
  ('booking_accepted' | 'booking_declined' | 'booking_request' |
  'booking_cancelled' | 'new_review' | 'new_message'), payload (JSON),
  is_read, created_at`.
- **messages** — `id, thread_id, sender_id, recipient_id,
  booking_id (nullable), service_id (nullable), body, created_at, read_at`.
- **contact_submissions** — `id, name, email, message, status ('new' |
  'read' | 'archived'), created_at`.

### 1.2 API contract (REST under `/api`)

Group routes so the frontend can be written against a stable shape:

- `POST /api/auth/login` and `POST /api/auth/register` — already exist.
  Make sure the JWT payload includes `role` and `user_id`.
- `GET /api/services/browse` (already wired) — returns published
  services with provider metadata, ratings, pricing.
- `GET /api/services/:id` — single service detail.
- `POST /api/services`, `PATCH /api/services/:id`, `DELETE
  /api/services/:id` — provider-only CRUD.
- `GET /api/provider/services` — services owned by the current
  authenticated provider.
- `POST /api/bookings` — client creates a booking request.
- `GET /api/bookings/mine?role=client` — bookings for the current
  client (with `?status=upcoming|past|all`).
- `GET /api/bookings/mine?role=provider` — bookings for the current
  provider (`?status=pending|upcoming|past`).
- `PATCH /api/bookings/:id/status` — accept / decline / cancel /
  complete (authorization depends on role + current status).
- `POST /api/reviews` — submit a review for a completed booking.
- `GET /api/notifications` and `PATCH /api/notifications/:id/read` —
  inbox for the alert center; client polls every 30–60s.
- `POST /api/messages` and `GET /api/messages?with=:userId` (or
  `?booking=:id`) — simple thread API for the Contact button.
- `POST /api/contact` — public, no auth; stores into
  `contact_submissions` and optionally emails admins.
- `GET /api/admin/contact-submissions` — admin-only list.

### 1.3 Frontend infrastructure to add

- **API client module** (`src/api/`) — one file per resource (`services.js`,
  `bookings.js`, `notifications.js`, …) that wraps `fetch`, injects the
  JWT from `localStorage`, and centralizes the base URL via an env var
  (`REACT_APP_API_BASE_URL`).
- **AuthContext** — replace the ad-hoc `localStorage.getItem("user")`
  pattern (used in `ClientDashboardPage.jsx`, `ProviderDashboard.jsx`,
  etc.) with a React context that exposes `user`, `token`, `login()`,
  `logout()`, and a `requireRole(role)` helper. This avoids duplicate
  parsing logic and prevents stale reads.
- **Role-based routing** — extend `RequireAuth` in `App.js` to a
  `RequireRole` wrapper so `/provider-mode` only renders when the user
  has a provider profile, and `/admin` is admin-only.
- **Toast/notification UI primitive** — a tiny toast component used for
  "Booking sent", "Service deleted", error states, etc.

---

## 2. Public site — landing page contact form

Files: `src/components/landing-page/Contact.jsx`.

Work:

- Convert the form into a controlled component (`useState` for name,
  email, message) and add a `handleSubmit` that POSTs to `/api/contact`.
- Validate client-side (required, email format, message length).
- Show success/error feedback (inline message or toast). Reset the form
  on success.
- **Backend**: insert into `contact_submissions`. Optionally fire an
  email via Nodemailer/SendGrid to an admin address from env config so
  admins are alerted even before they check the dashboard.
- **Admin dashboard** (new page `/admin/messages`, gated by `role
  === 'admin'`): a table of submissions sortable by date with mark-as-read
  / archive controls. Drive it from `GET /api/admin/contact-submissions`.

---

## 3. Client experience

### 3.1 Featured services on the client dashboard

File: `src/components/dashboard/DashboardServiceSection.jsx` (already
fetches from `/api/services/browse`).

Work:

- Wire the **Contact** button to open a "Send a message" modal that
  POSTs to `/api/messages` (with `service_id` + `recipient_id =
  providerId`). Show success toast.
- Wire **Book Now** to a booking modal — date/time picker, address,
  notes, then `POST /api/bookings`. On success, show a "Booking
  request sent" toast and refresh the bookings widget.
- Click on the card body navigates to `/service/:id` (a service detail
  page — see below).

### 3.2 Browse services page

File: `src/pages/ServicesPage.jsx` (and the sort/search bars in
`src/components/services/`).

Work:

- Replace `mockServices` with `GET /api/services/browse`.
- Wire `ServicesSearchBar` and `ServicesSortBar` to query params
  (`?q=`, `?category=`, `?sort=`) and re-fetch.
- Same Contact / Book Now affordances as the dashboard cards (share
  the modal components — extract to `src/components/booking/BookModal.jsx`
  and `src/components/messaging/ContactModal.jsx` so both surfaces use
  the same UI).
- New `/service/:id` detail page: full description, reviews list,
  larger Book / Contact CTAs.

### 3.3 My Bookings — dashboard widget + full page

Files: `src/components/dashboard/DashboardMyBookings.jsx`, plus a new
`src/pages/MyBookingsPage.jsx` and route in `App.js`.

Work:

- Replace the hardcoded sample booking with a real fetch:
  `GET /api/bookings/mine?role=client&status=upcoming` (limit to next 3
  in the widget; the full page shows all with pagination/filter).
- **View** — clicking a row opens a booking detail drawer/modal with
  scheduled time, address, notes, provider info.
- **Contact** — same `ContactModal`, prefilled with the provider and
  `booking_id`.
- **Cancel** — confirmation modal → `PATCH /api/bookings/:id/status`
  with `{ status: 'cancelled' }`. Optimistically remove from the list,
  trigger a `booking_cancelled` notification for the provider.
- The widget's "View all bookings" button routes to `/my-bookings`.

### 3.4 Recent services — rebook + review

Same `DashboardMyBookings.jsx` file (history widget), and a new
`<ReviewModal>` component.

Work:

- Fetch from `GET /api/bookings/mine?role=client&status=past`.
- **Book Again** — open the same `BookModal` prefilled with the
  previous service + provider; user picks a new date.
- **Leave Review** — opens `ReviewModal` (1–5 star picker + comment).
  POSTs to `/api/reviews`. After success, hide the button on that card
  (so it can't be reviewed twice) and update the provider's avg rating
  on the backend.
- Disable the Review button when a review already exists (return
  `has_review: true` from the bookings endpoint or fetch reviews
  alongside).

---

## 4. Provider experience

### 4.1 Booking requests widget

File: `src/components/provider-mode/ProviderRequestsWidget.jsx`.

Work:

- Replace the hardcoded `useState` array with
  `GET /api/bookings/mine?role=provider&status=pending`.
- **Accept** — `PATCH /api/bookings/:id/status { status: 'accepted' }`.
  On success: remove from the requests list, add to upcoming jobs,
  emit a `booking_accepted` notification for the client.
- **Decline** — `PATCH /api/bookings/:id/status { status: 'declined'
  }` + optional reason. Emit a `booking_declined` notification.

### 4.2 Upcoming jobs widget — only shows accepted bookings

File: `src/components/provider-mode/ProviderUpcomingJobsWidget.jsx`.

Work:

- Fetch `GET /api/bookings/mine?role=provider&status=accepted` (filter
  to future-dated). Refresh when accept/decline happens (lift state up
  to `ProviderDashboard.jsx`, or use a small store like a Zustand
  store/React context for shared booking state — context is fine given
  the scope).
- Show client name, service, scheduled time, address, contact button,
  and a "Mark complete" action that transitions status to `completed`
  (which unlocks the client's ability to leave a review).

### 4.3 Services CRUD

File: `src/components/provider-mode/ProviderServicesWidget.jsx`.

Work:

- **List** — `GET /api/provider/services` for the logged-in provider.
- **Add** — modal/form with name, category, description, pricing type,
  rate; POST to `/api/services`.
- **Edit** — same modal in edit mode; PATCH to `/api/services/:id`.
- **Delete** — confirm + DELETE. Either hard-delete or soft-delete
  (set `is_active = false`) — soft-delete is safer because it preserves
  past bookings/reviews.
- Any create/update/delete invalidates the browse-services cache on
  the frontend so changes appear immediately for clients.

---

## 5. Notifications / alert center (cross-cutting)

A single mechanism that both clients and providers use.

- Backend writes a `notifications` row whenever:
  - A provider accepts/declines a booking (recipient = client).
  - A client cancels a booking (recipient = provider).
  - A client books a new service (recipient = provider — also feeds
    into the Requests widget).
  - A new review is left (recipient = provider).
  - A new message arrives (recipient = the other party).
- Frontend adds a `<NotificationsBell>` component to both
  `DashboardNavbar` and `ProviderNavbar`:
  - Polls `GET /api/notifications?unread=true` on mount + every 45s.
  - Shows an unread count badge.
  - Opens a dropdown listing the most recent N; click marks as read
    via `PATCH /api/notifications/:id/read` and navigates to the
    relevant page (e.g., declined booking → my-bookings page with
    that row highlighted).
- A full `/notifications` page lists everything with filters.

This is what powers the "alert tab" you mentioned for accepted /
declined job notifications on the client side.

---

## 6. Admin

New surface, low priority but needed for the contact form story.

- New page `/admin` (gated by `role === 'admin'`) with a left nav for
  future sections; v1 ships **Contact Submissions** only.
- Table view backed by `GET /api/admin/contact-submissions` with
  filter by status (new / read / archived) and a quick "reply by
  email" link (`mailto:` with prefilled subject).

---

## 7. Suggested execution order

Front-load foundations so every feature after it is just CRUD against a
known shape:

1. **Foundations.** Backend data model + migrations; AuthContext;
   `src/api/` client modules; role-based routing.
2. **Services CRUD (provider).** Establishes the services pipeline that
   feeds Browse and Featured.
3. **Browse + Featured wiring.** Real data on `ServicesPage` and
   `DashboardServiceSection`; extract shared `BookModal` /
   `ContactModal`.
4. **Bookings end-to-end.** `POST /api/bookings`, requests widget for
   provider, accept/decline, upcoming jobs, client My Bookings page.
5. **Notifications.** Bell + polling + alert page. This makes the
   accept/decline UX feel complete.
6. **Reviews + Rebook.** Last mile of the client recent-services
   widget; depends on `completed` bookings existing.
7. **Contact form + admin.** Lowest risk, can be done in parallel by
   another contributor.

---

## 8. Open questions to decide before coding

- Confirm the backend stack and where its repo lives — affects whether
  this plan needs an "implement the API" section or just "consume the
  API".
- Should "Contact" be a real message thread (recommended) or just a
  one-shot email to the provider?
- Is provider mode a **separate user** or a **mode toggle** for an
  existing user? Current code (`ProviderDashboard.jsx`) suggests a
  toggle on the same user; the schema above assumes that.
- Pricing currency: code uses ₱ (PHP) in places and `$` in others —
  pick one and standardize via a formatter helper.
- Cancellation policy / window — do clients lose the right to cancel
  once the provider has accepted, or only within X hours of scheduled
  time?
