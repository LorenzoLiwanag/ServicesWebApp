# PRD: Payment System v2 — Platform-Held Deposit

Status: **Ready to build.** Supersedes the analysis in [PRD_PAYMENT_SYSTEM.md](PRD_PAYMENT_SYSTEM.md), whose core assumption (money goes straight to the provider) the client reversed.
Branch: `PaymentSystem` (rebase on `main` first — it is 3 commits behind).

---

## 1. The model in one paragraph

The customer pays a **50% deposit to the platform's own GCash QR** after the provider accepts, and uploads a screenshot as proof. Admin verifies it. The platform keeps its **fee (10% of the total)** out of the deposit and **holds the rest until the job is confirmed done**, then admin sends it to the provider's GCash. The **other 50% is paid by the customer directly to the provider on site** — the platform never touches it. Any extra work agreed on site goes into that on-site payment, fee-free.

Worked example, ₱2,000 job:

| | Amount | Who receives |
| --- | --- | --- |
| Deposit (50%) | ₱1,000 | Platform GCash |
| Platform fee (10% of total) | ₱200 | Platform keeps |
| Payout after completion | ₱800 | Provider, from platform |
| Balance on site (50%) | ₱1,000 | Provider, directly |
| **Provider total** | **₱1,800** | |

---

## 2. Decisions

"Client" = Eric's answer. "Ours" = our call where Eric was silent or ambiguous; revisit if he objects.

| # | Decision | Source |
| --- | --- | --- |
| D1 | Deposit goes to the platform's GCash QR, not the provider's. | Client |
| D2 | Platform fee = 10% of the agreed total, taken from the deposit. Rate is tentative → env var, snapshotted per booking. | Client |
| D3 | 50/50 split on every booking, no minimum. | Client |
| D4 | Provider receives everything except the fee, to the centavo. | Client |
| D5 | Customer proves the deposit with a screenshot + GCash reference number; admin verifies manually. | Client (ref no. is ours) |
| D6 | "Payment received" notification is the only receipt. No invoices/BIR in v1. | Client |
| D7 | Customer must confirm the job is done; auto-confirms 2 days after the provider marks it done. | Client |
| D8 | Disagreements → flag, freeze the booking, admin investigates. | Client |
| D9 | New bookings only; no backfill. | Client |
| D10 | The other 50% is paid directly to the provider on site. Platform does not track it. | Ours (Eric: "balance is between provider and requester") |
| D11 | Deposit is paid **after** the provider accepts, not at booking. | Ours |
| D12 | Unpaid deposit auto-expires the booking at the earlier of 24h after acceptance or the scheduled start. | Ours (Eric: "not valid until paid") |
| D13 | Customer cancels ≥24h before start: refund deposit minus 5% of the deposit; no 10% fee. | Client (5% base is ours) |
| D14 | Customer cancels <24h before start: no refund. Platform keeps its fee; **provider gets the normal payout.** | Client said platform keeps it all — **ours: pass the payout to the provider.** Revisit. |
| D15 | Provider cancels any time: full refund to customer. | Client |
| D16 | Provider cancels <24h before start: penalty = the booking's platform fee, deducted from their next payout. Provider cannot accept new bookings while they owe a penalty. | Client wants a charge; amount + mechanism ours |
| D17 | Hourly: provider sets estimated hours on accept, total = hours × rate. Quote: provider sets a firm total on accept. Fixed: total = listed price. Paying the deposit = agreeing to the total. | Client (hourly), ours (quote) |
| D18 | No-shows go through the dispute flag; admin resolves as a late cancellation by whoever didn't show. | Ours |
| D19 | A service date and time are required on every booking. | Ours (the 24h rules need it) |
| D20 | No rescheduling flow in v1. If both sides agree in messages, admin edits the date. | Ours |

---

## 3. Money math

All math in **integer centavos**, stored as `DECIMAL(10,2)`. One function, one place: `Backend/src/utils/money.js`.

```
total     = agreed total
deposit   = ceil(total / 2)                 // customer's half up front; odd centavo goes here
balance   = total - deposit                 // paid on site, never stored as owed to us
fee       = round_half_up(total * feeRate)  // platform's cut
payout    = deposit - fee                   // what we send the provider on completion
```

`feeRate ≤ 0.5` is guaranteed by config validation, so `payout` is never negative.

| Total | Deposit | Fee | Payout | On-site balance |
| --- | --- | --- | --- | --- |
| ₱2,000.00 | ₱1,000.00 | ₱200.00 | ₱800.00 | ₱1,000.00 |
| ₱1,505.00 | ₱752.50 | ₱150.50 | ₱602.00 | ₱752.50 |
| ₱1,505.05 | ₱752.53 | ₱150.51 | ₱602.02 | ₱752.52 |

`money.js` ships with an assert-based self-check covering these rows plus every settlement in §6 (run with `node src/utils/money.js`).

**Known leak:** for hourly jobs, a provider can underestimate hours to lower the fee and push the real cost into the fee-free on-site balance. Accept for v1; watch for providers whose jobs routinely get disputed.

---

## 4. Booking lifecycle

```
pending ──accept (total locked)──▶ accepted ──admin verifies deposit──▶ confirmed
   │                                  │                                     │
   ├─decline──▶ declined              ├─deadline passes, no deposit──▶ expired
   └─cancel───▶ cancelled             └─cancel──▶ cancelled                  │
                                                                provider marks done
                                                                             ▼
                                         completed ◀──client confirms / 2 days── work_done
```

| Status | Meaning | Who moves it out |
| --- | --- | --- |
| `pending` | Request sent | Provider accepts/declines; client cancels |
| `accepted` | Total locked, deposit due by `deposit_due_at` | Admin verifies deposit; system expires; either side cancels |
| `confirmed` | Deposit verified, job is on | Provider marks done; either side cancels |
| `work_done` | Provider says done, waiting on client | Client confirms; system auto-confirms after 48h |
| `completed` | Closed; payout due | — |
| `declined`, `cancelled`, `expired` | Terminal | — |

**Hold** is a flag (`on_hold`), not a status. Either party can raise it from `confirmed` or `work_done`. While on hold, nothing moves: no auto-confirm, no payout, no cancellation. Only admin clears it (§7).

A deposit **under review** (submitted, not yet verified/rejected) is derived from the latest deposit row, not a booking status. While under review:
- the booking does **not** expire (the customer did their part);
- neither side can cancel ("Your payment is being verified — try again once it's confirmed"). Admin should verify within hours, so this window is short.

**Implementation rule:** every transition is a conditional update — `UPDATE booking_request SET status = ? ... WHERE id = ? AND status = ?` — and checks `affectedRows`. Today's [updateBookingStatus](Backend/src/models/bookingModel.js:143) reads then writes, which races once a background job and a user can touch the same booking. Payouts and refunds additionally guard on `payout_sent_at IS NULL` / `refund_sent_at IS NULL`.

The duplicate-booking check in [createBooking](Backend/src/models/bookingModel.js:112) must widen from `('pending','accepted')` to include `confirmed` and `work_done`.

---

## 5. Flows

### 5.1 Booking
- [BookModal.jsx](services-web-app/src/components/booking/BookModal.jsx) already sends `requestedDate` + `requestedTime`. Make both required; server rejects past dates and sets `scheduled_start` from them. All 24h rules use `scheduled_start`.
- Modal shows a one-paragraph policy summary: 50% deposit after acceptance, cancellation terms.

### 5.2 Provider accepts
- **Fixed:** total = `price_amount`, shown read-only.
- **Hourly:** provider enters estimated hours; UI shows hours × rate.
- **Quote:** provider enters the total.
- Server computes and snapshots `agreed_total`, `estimated_hours`, `fee_rate`, `platform_fee`, `deposit_amount`, `deposit_due_at`. From here on, the booking never reads the live service price.
- Accept is refused if the provider has no GCash payout details on file or owes a penalty (`penalty_balance > 0`).

### 5.3 Customer pays the deposit
- Booking card in `accepted` shows: deposit amount, the platform QR, platform GCash name/number, deadline, and an upload form.
- Form: screenshot (required, jpg/png/webp, ≤5 MB), GCash reference number (required), the GCash number they paid from (required — this is also where any refund goes).
- Server rejects a reference number already used on a different booking's submitted/verified deposit.
- Customer can resubmit only after a rejection.

### 5.4 Admin verifies
- Admin → Payments → **Deposits to verify**: screenshot, reference, expected amount, booking summary.
- Admin checks the platform's GCash app for a matching incoming transfer, then **Verify** (booking → `confirmed`, client gets "Payment received", provider gets "Job confirmed") or **Reject** with a reason (booking stays `accepted`, client notified to resubmit).
- Amount mismatch → reject with reason. No partial-deposit handling in v1.

### 5.5 Job done
- Provider: **Mark as done** (from `confirmed`, on or after the scheduled date) → `work_done`. Client is notified to confirm.
- Client: **Confirm job done** → `completed`; or **Report a problem** → hold.
- Background job: `work_done` and not on hold for 48h → `completed`.
- On `completed`: `payout_due = payout`, `platform_earned = fee`.

### 5.6 Payout
- Admin → Payments → **Payouts to send**: completed bookings with `payout_due > 0` and no payout sent; shows the provider's GCash name/number and any `penalty_balance`.
- Amount to send = `payout_due − min(penalty_balance, payout_due)`. The deducted part reduces `penalty_balance` in the same transaction.
- Admin sends via GCash, enters the reference → **Mark sent**. Provider notified.

### 5.7 Refund
- Admin → Payments → **Refunds to send**: bookings with `refund_due > 0` and no refund sent; shows the customer's paying GCash number.
- Admin sends, enters the reference → **Mark sent**. Client notified.

---

## 6. Cancellation settlement

Applies only when a verified deposit exists. With no verified deposit, cancelling has no money effect. "Late" = less than 24h before `scheduled_start`.

| Who cancels | When | `refund_due` | `payout_due` | `platform_earned` | Penalty |
| --- | --- | --- | --- | --- | --- |
| Client | Early | deposit − 5% of deposit | 0 | 5% of deposit | — |
| Client | Late | 0 | deposit − fee | fee | — |
| Provider | Early | deposit | 0 | 0 | — |
| Provider | Late | deposit | 0 | 0 | +fee to `penalty_balance` |

₱2,000 job: client early → ₱950 back, platform ₱50. Client late → provider ₱800, platform ₱200. Provider late → client ₱1,000 back, provider owes ₱200.

Both cancel buttons first call a preview endpoint and show the exact outcome ("You'll get ₱950 back") before confirming. The preview and the real cancel use the same `money.js` function.

Providers can now cancel `accepted` and `confirmed` bookings (today they can only decline `pending`).

---

## 7. Disputes and no-shows

- **Report a problem** (client or provider; from `confirmed` or `work_done`) with a required reason → `on_hold = true`. The other party and admin see it.
- Admin → Payments → **On hold**: booking, both parties, reason, message history link (admin already has message logs).
- Admin resolves with an outcome and a note:
  - **Complete normally** → `completed`, normal payout.
  - **Provider no-show** → settle as provider late cancel.
  - **Customer no-show** → settle as client late cancel.
  - **Custom** → admin enters `refund_due`, `payout_due`, `platform_earned`; must sum to the deposit.
- Resolution clears the hold, writes `hold_resolution`, and notifies both parties.

---

## 8. Data model (one migration: `013_payment_system.sql`)

### `booking_request` — add
| Column | Type | Notes |
| --- | --- | --- |
| `status` | add `confirmed`, `work_done`, `expired` to ENUM | |
| `estimated_hours` | DECIMAL(5,2) NULL | hourly only |
| `agreed_total` | DECIMAL(10,2) NULL | set on accept |
| `fee_rate` | DECIMAL(4,3) NULL | snapshot |
| `platform_fee` | DECIMAL(10,2) NULL | |
| `deposit_amount` | DECIMAL(10,2) NULL | |
| `deposit_due_at` | DATETIME NULL | |
| `confirmed_at`, `work_done_at`, `expired_at` | TIMESTAMP NULL | matches migration 007's pattern |
| `cancelled_by` | ENUM('client','provider','admin') NULL | |
| `refund_due`, `payout_due`, `platform_earned` | DECIMAL(10,2) NULL | set at settlement |
| `refund_sent_at`, `payout_sent_at` | TIMESTAMP NULL | double-send guard |
| `on_hold` | BOOLEAN DEFAULT FALSE | |
| `hold_reason`, `hold_resolution` | TEXT NULL | |
| `held_by` | INT NULL | user id |
| `held_at` | TIMESTAMP NULL | |

`scheduled_start` stays nullable in the DB (dev seed data has nulls); required at the API.

### `provider_profile` — add
`gcash_name VARCHAR(150) NULL`, `gcash_number VARCHAR(20) NULL`, `penalty_balance DECIMAL(10,2) NOT NULL DEFAULT 0`.

### `booking_payment` — new (audit trail of every peso)
| Column | Type | Notes |
| --- | --- | --- |
| `id` | INT PK | |
| `booking_request_id` | INT FK | |
| `kind` | ENUM('deposit','refund','payout','penalty') | `penalty` = provider paid a penalty directly |
| `status` | ENUM('submitted','verified','rejected','sent') | deposits: submitted→verified/rejected; others: sent |
| `amount` | DECIMAL(10,2) | |
| `gcash_reference` | VARCHAR(64) | |
| `gcash_number` | VARCHAR(20) NULL | payer (deposit) or payee (refund/payout) |
| `proof_path` | VARCHAR(255) NULL | deposits only |
| `note` | TEXT NULL | rejection reason, penalty deduction, etc. |
| `created_by`, `reviewed_by` | INT NULL | |
| `created_at`, `reviewed_at` | TIMESTAMP | |

Index on `(kind, status)` for admin queues and on `gcash_reference` for the reuse check.

### `notification.type`
Change from ENUM to `VARCHAR(50)`. Every feature so far has needed a migration just to add a notification type (006, 009, 011); this ends that. New types: `deposit_due`, `deposit_verified`, `deposit_rejected`, `booking_expired`, `work_done`, `booking_on_hold`, `hold_resolved`, `refund_sent`, `payout_sent`, `penalty_applied`.

---

## 9. API

### Client
| Method | Path | |
| --- | --- | --- |
| POST | `/api/bookings/:id/deposit` | multipart: `screenshot`, `gcashReference`, `gcashNumber` |
| PATCH | `/api/bookings/:id/confirm-done` | `work_done` → `completed` |
| GET | `/api/bookings/:id/cancel-preview` | client or provider; returns the §6 row |
| PATCH | `/api/bookings/:id/cancel` | extended to providers + settlement |
| PATCH | `/api/bookings/:id/report` | `{ reason }` → hold; client or provider |

### Provider
| Method | Path | |
| --- | --- | --- |
| PATCH | `/api/bookings/:id/respond` | `accepted` now takes `estimatedHours` (hourly) or `agreedTotal` (quote); `completed` removed |
| PATCH | `/api/bookings/:id/work-done` | `confirmed` → `work_done` |
| PUT | `/api/provider/payout-details` | `{ gcashName, gcashNumber }` |

### Admin (all `requireAuth, requireAdmin`)
| Method | Path | |
| --- | --- | --- |
| GET | `/api/admin/payments/deposits` | submitted deposits |
| PATCH | `/api/admin/payments/:id/verify` | |
| PATCH | `/api/admin/payments/:id/reject` | `{ reason }` |
| GET | `/api/admin/payments/payouts` | due payouts |
| POST | `/api/admin/bookings/:id/payout` | `{ gcashReference }` |
| GET | `/api/admin/payments/refunds` | due refunds |
| POST | `/api/admin/bookings/:id/refund` | `{ gcashReference }` |
| GET | `/api/admin/holds` | |
| POST | `/api/admin/bookings/:id/resolve` | `{ outcome, refundDue?, payoutDue?, platformEarned?, note }` |

### Proof files
`GET /api/payments/:id/proof` — streams the screenshot to an admin or the booking's client only. Files live on disk **outside** any static/public directory.

---

## 10. Infrastructure

- **Uploads:** add `multer` (Express has no multipart parser). Disk storage under `Backend/uploads/payment-proofs/`, random filenames, MIME + extension check, 5 MB limit, git-ignored. If the host's disk is ephemeral, swap to object storage — check before deploying.
- **Background job:** `setInterval` every 5 minutes in [server.js](Backend/server.js), two conditional UPDATEs (expire overdue deposits, auto-confirm stale `work_done`) plus their notifications. Conditional updates keep it safe to run more than once; no scheduler dependency.
- **Config (env):** `PLATFORM_FEE_RATE=0.10`, `CANCEL_FEE_RATE=0.05`. Frontend: `REACT_APP_GCASH_NAME`, `REACT_APP_GCASH_NUMBER`, QR image at `services-web-app/public/gcash-qr.png`.
- **Time zone:** set the MySQL pool `timezone: '+08:00'` in [Database.js](Backend/src/config/Database.js) so 24h comparisons are in Manila time.
- **Money display:** add one `formatPeso()` helper on the frontend; the deposit, payout and refund screens are where wrong formatting would actually hurt.

---

## 11. Screens

**Client dashboard — booking card, by status**
- `accepted`: amount due, QR, deadline, upload form → after upload, "Payment under review".
- `confirmed`: "Deposit received. Pay the provider ₱X on site."
- `work_done`: **Confirm job done** / **Report a problem**.
- `completed` / cancelled: what was refunded, if anything.
- Cancel button opens the preview first.

**Provider dashboard**
- Accept dialog with total/hours input and a live breakdown (deposit, fee, payout, on-site balance).
- Payout details form in profile; banner if missing.
- `confirmed`: **Mark as done**, **Cancel** (with penalty warning when late), **Report a problem**.
- Per booking: payout amount and whether it's been sent (with reference). No earnings dashboard.

**Admin → new Payments tab**
Four lists: Deposits to verify, Payouts to send, Refunds to send, On hold. Each row has its single action.

[BookingStatusBadge.jsx](services-web-app/src/components/booking/BookingStatusBadge.jsx) gains `confirmed`, `work_done`, `expired`, plus an "On hold" variant.

---

## 12. Build order

Each phase is shippable and testable on its own.

1. **Foundation** — rebase on `main`; migration 013; `money.js` + self-check; conditional transitions; required date/time; accept-with-total; payout details; notification type → VARCHAR.
   *Done when:* a provider accepts an hourly booking and the booking shows the correct locked deposit/fee/payout.
2. **Deposits** — multer upload, proof endpoint, admin verify/reject, expiry job, platform QR on the client card.
   *Done when:* a client uploads proof, admin verifies, booking is `confirmed`; an unpaid one expires on its own.
3. **Completion + payouts** — mark done, client confirm, auto-confirm job, payout queue.
   *Done when:* a booking goes `confirmed → work_done → completed` (both by click and by timeout) and admin marks the payout sent exactly once.
4. **Cancellations + disputes** — cancel preview, settlement, provider cancel, penalties, refund queue, hold/resolve.
   *Done when:* all four §6 rows and all four §7 outcomes produce the right amounts end to end.

---

## 13. Out of scope for v1

Payment gateway / dynamic QR / webhooks · receipts, invoices, BIR · rescheduling flow · fee-rate admin UI · provider earnings dashboard · automatic deletion of proof screenshots · partial deposits · tracking the on-site balance.

---

## 14. Still open

Not blocking the build, but must be settled before launch:

- **From Eric:** the platform QR image, GCash account name and number, and the final fee rate.
- **D14:** Eric said the platform keeps a late-cancelled deposit; we pay the provider their share instead. Confirm he's fine with that.
- **Holding customer money:** the platform now holds funds between deposit and completion. Eric should check with whoever handles their legal/regulatory side whether this needs anything (e.g. BSP rules). Not an engineering call.
- **Proof retention:** how long screenshots are kept; they contain customer financial info.
- **Hosting:** confirm uploads persist across deploys (§10).
