# PRD (Draft): Payment System — 50/50 GCash Split with Admin-Settled Payouts

Status: **Superseded by [PRD_PAYMENT_SYSTEM_V2.md](PRD_PAYMENT_SYSTEM_V2.md).** On 2026-10-06 the client reversed the core assumption below: the deposit now goes to the **platform's** GCash, not the provider's. Sections 2–5 are kept as history; Section 6 maps each question to its V2 decision.
Branch: `PaymentSystem`

Client's stated sequence:

> Customer books service → provider accepts → notify customer of acceptance →
> customer pays 50% via GCash QR → provider performs the service → customer pays
> remaining 50% via GCash QR on site → balance transferred by admin to provider
> less platform fee.

---

## 1. What exists today

### 1.1 Booking lifecycle

`booking_request.status` is an ENUM: `pending | accepted | declined | cancelled | completed`.

Transitions are enforced server-side in [bookingModel.js:161](Backend/src/models/bookingModel.js:161):

| Actor | From | To |
| --- | --- | --- |
| Provider | `pending` | `accepted`, `declined` |
| Provider | `accepted` | `completed` |
| Client | `pending`, `accepted` | `cancelled` |

Each transition stamps a column (`accepted_at`, `declined_at`, `cancelled_at`, `completed_at`, migration 007) and fires notifications via `notifyOnStatusChange` in [bookingController.js:14](Backend/src/controllers/bookingController.js:14).

Notably: **the provider alone drives `accepted → completed`.** There is no client-side confirmation that work was actually done.

### 1.2 Money in the schema today

There is **no payment, invoice, transaction, payout, or ledger table anywhere.** Migrations run 001–012; none touch money beyond service pricing.

The only monetary data is on `provider_service`:

- `pricing_type ENUM('fixed','hourly','quote') DEFAULT 'quote'`
- `price_amount DECIMAL(10,2)` — nullable
- `currency VARCHAR(10) DEFAULT 'PHP'` (normalized to PHP in migration 012)

`booking_request` stores **no amount at all.** Price is read live through a JOIN in `BOOKING_SELECT` ([bookingModel.js:3](Backend/src/models/bookingModel.js:3)). If a provider edits their price after a booking is accepted, every historical booking silently re-prices.

### 1.3 Admin capabilities

[adminRoutes.js](Backend/src/routes/adminRoutes.js) covers user approval, service approval, categories, and message logs. **No financial surface at all** — no payout queue, no fee configuration, no reconciliation view.

### 1.4 Infrastructure gaps relevant here

- **No file upload anywhere.** Backend deps are express, mysql2, bcrypt, jsonwebtoken, cors, express-rate-limit, nodemailer. No multer, no S3/Cloudinary SDK. If clients upload GCash receipt screenshots, this is net-new infrastructure.
- **No GCash/payment-gateway integration**, and no provider payout details — `provider_profile` has no GCash number or account name field.
- **No money-formatting utility** on the frontend; `₱${amount}` is inlined ad hoc (e.g. [BookModal.jsx:66](services-web-app/src/components/booking/BookModal.jsx:66)).
- Notification `type` is a **hard ENUM** (migration 006) — every new payment notification needs a migration.

---

## 2. The central architectural question

**Confirmed by client (2026-07-21):**

> "The QR code in the website is just an access point for payment of services, the payments are done outside of the website."

This is a static GCash QR, not a payment-gateway integration. The site does not move money at any point. Both the deposit and the balance are paid directly between the customer's own GCash app/account and the provider's own GCash app/account. The site's role is purely to *display* the QR / facilitate the exchange — not to hold, process, or route funds. This resolves the manual-vs-gateway fork in Section 2 (old): we are building for **manual, human-attested payments**, not webhook-confirmed ones. A payment record needs a `verification_status`, proof storage, a human approval queue, and a dispute path.

**This also flips the fee model.** The client further confirmed: the platform's fee is intended to already be **baked into the price displayed on the site** — i.e., what the customer sees and pays (split 50/50) is provider's price *plus* platform fee, not the provider's raw price. Since both halves land directly in the **provider's own GCash account**, the provider ends up holding the platform's fee too. The platform never "transfers a balance to the provider" — there is no balance to transfer, because the provider was already paid in full by the customer.

What "balance transferred by admin to provider less platform fee" in the client's original description actually seems to mean, then, is closer to the reverse: **admin needs to recover the platform's fee from the provider after the fact.** This is a **collections/remittance problem**, not a payout problem. That reframing needs to be confirmed with the client (see Q3 below) — critically, we still don't know the *mechanism*: does the provider proactively send the fee back, does admin request/invoice it, is it netted against a future booking, and what happens if a provider simply doesn't pay it back?

---

## 3. Proposed shape (pending answers below)

New tables, roughly:

- `booking_payment` — one row per booking, holding the **snapshotted** agreed total, currency, deposit amount, balance amount, platform fee rate and computed fee, plus overall payment state.
- `payment_transaction` — one row per actual payment attempt (deposit, balance), with method, reference number, proof URL, `verification_status`, who verified, and when. Both transactions are between customer and provider directly — the platform is never a party to them.
- `platform_fee_remittance` (replaces the payout table) — one row per booking's owed platform fee: amount owed, how/whether the provider remitted it back, reference, status (`owed` / `remitted` / `overdue` / `waived`), timestamps. This tracks money flowing **provider → platform**, not platform → provider.
- `platform_settings` or similar — fee rate, platform's own GCash receiving details (for fee remittance), configurable rather than hardcoded.

New booking statuses would slot between `accepted` and `completed` — e.g. `awaiting_deposit`, `deposit_paid`/`in_progress`, `awaiting_balance`, then `completed`. **This is an ENUM change and a transition-table rewrite**, and every existing booking row plus the frontend badge component ([BookingStatusBadge.jsx](services-web-app/src/components/booking/BookingStatusBadge.jsx)) and filter logic must be migrated coherently.

---

## 4. Open questions for client review

Grouped by how much they block implementation. **Q1–Q6 are blocking** — the schema cannot be written without them.

### A. Payment mechanism (blocking)

**Q1. ✅ Answered (2026-07-21).** Static GCash QR, manual, no gateway. The site does not touch the money — customer and provider's own GCash apps/accounts handle it directly. **Still open:** how does the system *learn* a payment occurred — client uploads a screenshot, client types a GCash reference number, provider confirms receipt, or some combination?

**Q2. ✅ Answered (2026-07-21).** Both the deposit and the on-site balance go to the **provider's own** GCash account. The platform never holds any of the money at any point.

**Q3. Partially answered — mechanism still open (blocking).** Client confirmed the platform's fee is meant to already be **included in the price shown on the site**, so the provider ends up holding it after being paid in full. This means admin's job is to **recover the fee from the provider afterward**, not disburse anything to them. What we still need:
- **How does the provider send the fee back?** Do they initiate a transfer to a platform GCash account themselves, or does admin request/invoice it per booking?
- **On what schedule?** Per booking immediately after completion, or batched (e.g., weekly)?
- **What if a provider doesn't remit it?** Is there an enforcement mechanism — e.g., their account is flagged, future bookings are blocked, it's deducted from a security deposit? Or is this purely trust-based for v1?
- Is this **the provider's obligation to initiate**, or does admin actively chase it down (collections)?

### B. Amounts and fees (blocking)

**Q4.** `pricing_type` allows `quote` and `hourly`, neither of which has a knowable total at booking time — yet the flow requires charging exactly 50% up front. How is the total agreed for these? Does the provider enter a firm quote as part of accepting the booking (which the client then approves)? For `hourly`, is there an estimated-hours input?

**Q5.** What is the platform fee — a flat percentage, a fixed peso amount, or tiered? Is it configurable by admin at runtime, or fixed at launch? Is it charged on the service total or on the provider's payout? Does the customer see it broken out, or only the provider?

**Q6.** Rounding: 50% of ₱1,505 is ₱752.50. Do we round the deposit, and which direction? (Deposit floor / balance takes the remainder is the usual safe answer — it guarantees the two halves always sum to the total.)

### C. State machine and edge cases

**Q7.** What happens if the customer never pays the deposit? Auto-expire the accepted booking after N hours? Provider can cancel? What N?

**Q8.** Cancellation and refunds after the deposit is paid — customer cancels, provider cancels, or provider no-shows. Is the deposit refundable, partially refundable, or forfeit? Who executes a refund, and is it tracked in-app or handled off-platform? **Refunds via manual GCash are entirely a human process** — we can only record that one happened.

**Q9.** Should `accepted → completed` still be provider-only? Right now a provider can mark a job complete unilaterally. Once money is involved, that's the trigger for the balance being owed. Should completion require the customer to confirm, or a customer-confirmation window that auto-completes after N days?

**Q10.** What if the customer disputes — pays the deposit but says the work was never done, or the provider claims payment that the customer denies? Is there a dispute state that freezes the payout and escalates to admin?

**Q11.** Can the agreed total change *after* the deposit is paid (scope grows on site)? If yes, is the balance simply recalculated, and does that need customer approval?

### D. Admin fee collection operations

*(Reframed from "payout" — per Q3, admin is collecting the platform's fee from providers, not disbursing money to them.)*

**Q12.** Is fee collection tracked per-booking, or batched per-provider on a schedule (e.g. weekly statement of everything owed)? Batching is much less admin work but needs a statement/ledger view.

**Q13.** When a provider remits the fee, what does admin record as proof — reference number, screenshot, both? Can a remittance be marked "collected" without proof?

**Q14.** Do we need to store the **provider's** GCash details at all, now that they're receiving money directly rather than being paid out by the platform? (Possibly not — see updated Q3. If a security-deposit or auto-deduction enforcement mechanism is wanted, this may resurface.)

**Q15.** Does the provider need a visible dashboard showing what they owe the platform (pending / remitted / overdue), or is a notification enough for v1?

### E. Compliance, records, scope

**Q16.** Are receipts or invoices required — for the customer, the provider, or BIR purposes? Emailed, downloadable, or neither in v1?

**Q17.** If clients upload payment screenshots, that's new file-upload infrastructure. Local disk, S3, or Cloudinary? These images contain financial data — what's the retention policy and who can view them?

**Q18.** Does the 50/50 split apply to *every* service, or should providers be able to opt out (full payment up front, or full payment on completion) for low-value jobs? Is there a minimum booking value below which splitting is pointless?

**Q19.** What happens to bookings already in the system when this ships? Are there live bookings needing backfill, or can we assume the payment flow applies only to bookings created after launch?

---

## 5. My recommendations, for what they're worth

- **Snapshot the agreed amount onto the booking** regardless of anything else. Reading price live through a JOIN is already a latent bug — a provider editing their price today silently rewrites booking history. The payment work should fix this.
- **Model payments as an append-only transaction log**, not mutable status fields on the booking. Money records should never be updated in place; you'll want the audit trail the first time a payment is disputed.
- **Store money as `DECIMAL`, never float**, and compute the balance as `total − deposit` rather than a second percentage calculation, so the halves always reconcile exactly.
- **Manual verification is confirmed for v1.** Still design the payment table so a gateway can be added later without a rewrite — keep `method` and `provider_reference` columns from day one.
- **Get the Q3 mechanism nailed down before building the fee-collection table.** "The fee is baked into the price" answers *where the money is*, but not *how the platform actually gets it back*. Without an enforcement mechanism, this is effectively an honor system — worth flagging to the client explicitly, since it's a real business-risk decision, not just a technical one.

---

## 6. Answers

_Updated 2026-10-06 against [PRD_PAYMENT_SYSTEM_V2.md](PRD_PAYMENT_SYSTEM_V2.md). D-numbers refer to its §2 decisions table. "Client" = Eric's answer; "Ours" = our call where he was silent. ⚠️ = changed from the earlier recommendation because of the model reversal._

| # | Question | Why it's a question / blocker | V2 answer | Status |
| --- | --- | --- | --- | --- |
| Q1 | Static QR or gateway? How is a manual payment confirmed? | Determines whether payments are human-attested (needs proof storage, approval queue, dispute path) or auto-confirmed via webhook. Changes the whole architecture. | Static GCash QR, manual. Customer uploads a screenshot plus GCash reference number and the number they paid from; admin verifies against the platform's GCash app (D5, §5.3–5.4). | ✅ Client (ref no. is ours) |
| Q2 | Whose GCash account receives each payment? | Determines whether the platform ever holds the money, which determines whether "admin pays the provider" or "admin collects from the provider" is the correct model. | ⚠️ **Reversed.** Deposit (50%) goes to the **platform's** GCash QR (D1). The other 50% is paid directly to the provider on site and the platform doesn't track it (D10). | ✅ Client (D10 ours) |
| Q3 | How does the platform actually get its fee, and what if it doesn't? | Was blocking under the old model: the platform never held money, so the fee had to be clawed back from providers. | ⚠️ **Moot.** The platform holds the deposit and keeps its fee from it before paying the provider (D2, §3). No remittance or enforcement needed. | ✅ Client |
| Q4 | How is a firm total locked in for `quote`/`hourly` services? | These pricing types have no knowable total at booking time, but the flow requires charging exactly 50% up front. | Locked on accept. Fixed = listed price; hourly = provider's estimated hours × rate; quote = provider enters a firm total. Paying the deposit = agreeing to the total (D17, §5.2). | ✅ Client (hourly), Ours (quote) |
| Q5 | What exactly is the platform fee, and is it visible to the customer? | Fee shape and configurability affect the schema; visibility affects UI copy. | 10% of the agreed total, taken from the deposit. Rate is tentative: env var `PLATFORM_FEE_RATE`, snapshotted per booking (D2). No admin UI for the rate in v1. | ✅ Client (final rate still open, V2 §14) |
| Q6 | Which half absorbs rounding when the total doesn't split evenly? | Without a fixed rule, deposit + balance can silently fail to sum to the total. | ⚠️ Deposit = **ceil**(total ÷ 2), so the odd centavo goes up front; balance = total − deposit. All math in integer centavos in `money.js` (§3). | Ours |
| Q7 | What happens if the customer never pays the deposit? | Without an expiry rule, an accepted booking with an unpaid deposit blocks the provider's calendar indefinitely. | Auto-expires at the earlier of 24h after acceptance or the scheduled start. Never expires while a deposit is under review (D12, §4). | Ours (Eric: "not valid until paid") |
| Q8 | What's the refund/cancellation policy once a deposit is paid? | The policy needs defining so support has a consistent rule to apply. | ⚠️ Platform holds the deposit, so **admin sends refunds** from the platform GCash via a refund queue (§5.7). Client cancels early: refund minus 5% of the deposit (D13). Client cancels late: no refund, provider gets the normal payout (D14). Provider cancels: full refund (D15), plus a penalty if late (D16). No-shows go through disputes (D18). | Client + Ours. **D14 still needs Eric's OK.** |
| Q9 | Should the provider alone still be able to mark a job "completed"? | Once completion triggers money being owed, a one-sided claim is a dispute risk. | Provider marks done → `work_done`; customer confirms → `completed`. Auto-confirms 2 days after the provider marks it done (D7, §5.5). | ✅ Client |
| Q10 | What happens when the two sides disagree about payment or work done? | No dispute path exists today. | Either side can report a problem → `on_hold` flag that freezes the booking (no auto-confirm, payout or cancellation). Admin resolves with one of four outcomes (D8, §7). | ✅ Client |
| Q11 | Can the price change after the deposit is paid (scope grows on site)? | A provider could inflate the amount owed after the customer committed. | The agreed total doesn't change. Extra work agreed on site goes into the on-site payment, fee-free (V2 §1). | Ours |
| Q12 | Is fee collection tracked per-booking or batched per-provider? | Determines the admin UI and how much manual admin work v1 requires. | ⚠️ **Reframed as payouts.** Per-booking "Payouts to send" queue in Admin → Payments; any provider penalty is deducted from the payout (§5.6). | Ours |
| Q13 | What proof does admin need before marking a fee "collected"? | Without a standard, "collected" is an unverifiable claim. | ⚠️ **Reframed.** Admin enters the GCash reference when marking a payout or refund sent. Each send is a `booking_payment` row and can only happen once (§5.6–5.7, §8). | Ours |
| Q14 | Do we still need to store the provider's GCash details? | Under the old model the platform never paid providers. | ⚠️ **Yes.** `gcash_name`, `gcash_number` on `provider_profile`. A provider can't accept bookings without them (§5.2, §8). | Ours |
| Q15 | Does the provider need a full earnings/dues dashboard for v1? | A notification-only approach is much cheaper to ship first. | No dashboard. Each booking shows its payout amount and whether it's been sent (with reference), plus a `payout_sent` notification (§11). | Ours |
| Q16 | Are receipts/invoices required, and for whom? | PDF generation, email delivery and BIR invoicing are a much larger feature than a simple receipt. | The "Payment received" notification is the only receipt. No invoices or BIR in v1 (D6). | ✅ Client |
| Q17 | Where are payment screenshots stored, and for how long? | Financial data, no upload infrastructure today. | ⚠️ Local disk via `multer` under `Backend/uploads/payment-proofs/`, outside any public directory. Only admin and the booking's client can view it (§9–10). Retention is undecided. | Ours. **Retention + hosting persistence still open (V2 §14).** |
| Q18 | Does the 50/50 split apply to every booking? | Opt-outs or minimums would be conditional logic in the schema from day one. | Every booking, no minimum (D3). | ✅ Client |
| Q19 | What happens to bookings already in the system at launch? | Determines whether a migration/backfill is needed. | New bookings only, no backfill (D9). | ✅ Client |
