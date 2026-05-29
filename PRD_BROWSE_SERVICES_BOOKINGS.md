# Browse Services and Bookings Flow PRD
## Services Web App
### Service Discovery, Service Detail, Booking Request, Booking Management, and Provider Response Flow

---

## 1. Purpose

The Browse Services and Bookings flow is the core marketplace experience of the Services Web App. Its purpose is to help clients discover available service providers, compare services, contact providers, submit booking requests, and manage the lifecycle of those bookings.

This PRD focuses on the client-facing browse and booking journey, plus the provider-side booking response flow required to make booking requests actionable. It should not redefine registration, login, landing page content, admin contact inquiries, or the full provider service-management experience except where those areas feed the browse and booking flow.

---

## 2. Current Progress

The app currently includes:

- A protected Browse Services page at `/services`
- A client dashboard Featured Services section
- Service search, filter, sort, and load-more UI
- Contact buttons that open the messaging modal
- Book Now buttons that currently navigate to a service detail route
- Backend routes for:
  - `GET /api/services/browse`
  - `GET /api/services/categories`
  - `GET /api/services/:serviceId`
  - `POST /api/bookings`
  - `GET /api/bookings/client`
  - `GET /api/bookings/provider`
  - `PATCH /api/bookings/:bookingId/respond`
  - `PATCH /api/bookings/:bookingId/cancel`
- Database tables for provider services, booking requests, notifications, users, and provider profiles
- A client dashboard My Bookings widget with hardcoded sample booking data
- Provider dashboard widgets that are intended to show booking requests and upcoming jobs

---

## 3. Current Gaps

The flow is partially implemented, but it is not yet end-to-end from the user's perspective.

### Browse Services Gaps

- The Browse Services frontend expects fields such as `serviceName`, `bio`, `rateAmount`, `avgRating`, and `reviewCount`.
- The backend currently returns fields such as `title`, `description`, `priceAmount`, `averageRating`, and `totalReviews`.
- Filtering and sorting are handled client-side after fetching all services.
- URL query params are not yet used for search, filters, or sort state.
- Service detail navigation points to `/service/:providerServiceId`, but no route exists in `App.js`.
- Quote-based service handling is present in UI filters but needs clearer product behavior.

### Booking Gaps

- Book Now does not yet open a booking form.
- There is no shared booking modal component.
- The client dashboard My Bookings widget uses hardcoded booking rows.
- There is no full My Bookings page.
- Booking cancellation is not wired from the frontend.
- Provider accept, decline, and complete actions are not fully wired into the dashboard widgets.
- Notifications exist on the backend but are not fully connected to the booking UI.

---

## 4. Target User Journey

### Client Happy Path

1. Client logs in.
2. Client opens the dashboard or Browse Services page.
3. Client searches, filters, or sorts available services.
4. Client opens a service detail page or clicks Book Now from a service card.
5. Client enters preferred date, preferred time, optional notes, and any required booking details.
6. Client submits the booking request.
7. System creates a pending booking request.
8. System notifies the provider.
9. Client sees the booking under My Bookings with a pending status.
10. Provider accepts or declines the request.
11. System notifies the client.
12. Accepted bookings appear as upcoming bookings.
13. Completed bookings move into recent services/history.

### Provider Happy Path

1. Provider logs in and opens Provider Mode.
2. Provider sees incoming pending booking requests.
3. Provider reviews booking details.
4. Provider accepts, declines, or completes a booking.
5. System updates the booking status.
6. System notifies the client.
7. Accepted jobs appear in the provider's upcoming jobs area.

---

## 5. Browse Services Requirements

### 5.1 Browse Services Page

Route:

```text
/services
```

The Browse Services page must show all visible, active, non-deleted provider services where the provider and user account are active.

The page must include:

- Page title: Browse Services
- Page subtitle focused on finding trusted providers
- Search input
- Filter controls
- Sort control
- Result count
- Service cards
- Empty state
- Loading state
- Error state
- Load More or pagination behavior

### 5.2 Service Card Content

Each service card should show:

- Service title
- Service category
- Provider display name
- Service description
- Provider rating
- Review count
- Pricing type
- Price amount when applicable
- Currency
- Availability status when unavailable
- Contact button
- Book Now button

### 5.3 Search

Search should match:

- Service title
- Provider display name
- Category
- Service description

For MVP, search may be client-side after the browse endpoint returns data. For production readiness, search should move into the backend with query params.

Recommended endpoint shape:

```text
GET /api/services/browse?q=cleaning&category=1&pricingType=hourly&minRating=4&sort=recommended&page=1&pageSize=12
```

### 5.4 Filters

Filters should include:

- Category
- Minimum rating
- Price range
- Pricing type
- Include quote-based services
- Provider availability

Filter state should be reflected in URL query params so users can refresh, share, and navigate back without losing their current browse state.

### 5.5 Sorting

Sort options should include:

- Recommended
- Top Rated
- Lowest Price
- Highest Price
- Most Reviewed

Recommended sorting should prioritize services with stronger rating and review signals. New services should still be discoverable and should not be permanently buried.

### 5.6 Empty State

When no services match the selected filters, the page should show:

- A clear "No services found" message
- A short suggestion to adjust filters
- Reset filters action

---

## 6. Service Detail Requirements

### 6.1 Route

Add a protected service detail route:

```text
/service/:serviceId
```

### 6.2 Content

The service detail page should show:

- Service title
- Category
- Full description
- Provider display name
- Provider bio
- Provider rating
- Review count
- Pricing type and amount
- Service location type
- Contact button
- Book Now button

### 6.3 Detail Loading

The frontend should fetch:

```text
GET /api/services/:serviceId
```

The page must support loading, error, and not-found states.

---

## 7. Booking Request Requirements

### 7.1 Booking Entry Points

The booking modal should be available from:

- Browse Services cards
- Featured Services cards on the client dashboard
- Service detail page
- Book Again action from recent services

### 7.2 Booking Modal

Create a shared component:

```text
src/components/booking/BookModal.jsx
```

The booking modal should include:

- Service title
- Provider name
- Preferred date
- Preferred time
- Optional notes/message to provider
- Pricing summary
- Submit button
- Cancel/close button

Future optional fields:

- Service address
- Address notes
- Preferred time window
- Attachments/photos
- Quote-specific details

### 7.3 Booking Validation

Frontend validation:

- Service ID is required
- Provider ID is required
- Date is required
- Time is required
- Date cannot be in the past
- Notes should have a reasonable maximum length

Backend validation:

- Authenticated client is required
- Service must exist
- Service must be visible and not deleted
- Provider must be active
- Client cannot book their own service
- Booking status starts as `pending`

### 7.4 Booking Submission

The frontend should submit:

```text
POST /api/bookings
```

Request body:

```json
{
  "providerServiceId": 123,
  "providerId": 45,
  "requestedDate": "2026-06-01",
  "requestedTime": "14:00",
  "clientMessage": "Please bring supplies for a deep clean."
}
```

Successful response should:

- Close the modal
- Show a success toast
- Refresh the client bookings widget when visible
- Add the booking to My Bookings as pending

Failure response should:

- Keep the modal open
- Preserve user-entered values
- Show a clear error message

---

## 8. Booking Status Lifecycle

Booking statuses:

- `pending`
- `accepted`
- `declined`
- `cancelled`
- `completed`

### Status Rules

Pending:

- Created when a client submits a booking request.
- Provider can accept or decline.
- Client can cancel.

Accepted:

- Created when provider accepts.
- Client can cancel.
- Provider can mark completed.

Declined:

- Created when provider declines.
- No further action for MVP.

Cancelled:

- Created when client cancels pending or accepted booking.
- No further action for MVP.

Completed:

- Created when provider marks an accepted booking complete.
- Enables review flow in a future milestone.

---

## 9. Client My Bookings Requirements

### 9.1 Dashboard Widget

The current hardcoded My Bookings widget should be replaced with live data.

Upcoming schedule should fetch:

```text
GET /api/bookings/client?status=accepted
```

Pending bookings may also be shown in the widget or summarized separately.

Recent services should fetch:

```text
GET /api/bookings/client?status=completed
```

The widget should show:

- Booking date/time
- Service title
- Provider name
- Status badge
- Contact button
- View all bookings button

### 9.2 Full My Bookings Page

Add a protected route:

```text
/my-bookings
```

The page should include:

- Tabs or filters for All, Pending, Accepted, Completed, Declined, Cancelled
- Booking list
- Booking detail drawer or modal
- Cancel action where allowed
- Contact provider action
- Book Again action for completed services
- Leave Review action for completed services in a later milestone

### 9.3 Cancel Booking

Client cancellation should call:

```text
PATCH /api/bookings/:bookingId/cancel
```

Allowed only for:

- Pending bookings
- Accepted bookings

The UI must show a confirmation dialog before cancelling.

---

## 10. Provider Booking Requirements

### 10.1 Incoming Requests

Provider booking requests should fetch:

```text
GET /api/bookings/provider?status=pending
```

Each request should show:

- Client name
- Service title
- Requested date/time
- Client message
- Submitted date
- Accept button
- Decline button
- Contact client button

### 10.2 Accept or Decline

Provider response should call:

```text
PATCH /api/bookings/:bookingId/respond
```

Accept request body:

```json
{
  "status": "accepted",
  "responseMessage": "Confirmed, see you then."
}
```

Decline request body:

```json
{
  "status": "declined",
  "responseMessage": "Sorry, I am not available at that time."
}
```

### 10.3 Upcoming Jobs

Provider upcoming jobs should fetch:

```text
GET /api/bookings/provider?status=accepted
```

Each job should show:

- Client name
- Service title
- Scheduled/requested date and time
- Client message
- Contact client button
- Mark Completed button

### 10.4 Complete Booking

Provider completion should call:

```text
PATCH /api/bookings/:bookingId/respond
```

Request body:

```json
{
  "status": "completed"
}
```

Completion should notify both client and provider.

---

## 11. Messaging Requirements

Contact actions should use the existing messaging modal.

Contact from a service card should send:

- Recipient provider ID
- Service ID
- Message body

Contact from a booking should send:

- Recipient user ID
- Booking ID
- Message body

The Contact button should be disabled or show a helpful message if the recipient ID is missing.

---

## 12. Notification Requirements

The system should create notifications when:

- Client creates a booking request: notify provider
- Booking request is sent: notify client
- Provider accepts: notify client
- Provider declines: notify client
- Client cancels: notify provider
- Provider marks complete: notify client and provider
- User receives a new message: notify recipient

Notifications should eventually feed a dashboard notification bell and a full notifications page.

---

## 13. Data Contract

### 13.1 Browse Service Response

The frontend and backend should standardize on one response shape.

Recommended shape:

```json
{
  "providerServiceId": 123,
  "serviceName": "Deep Cleaning",
  "description": "Full home deep cleaning service.",
  "pricingType": "fixed",
  "rateAmount": 1800,
  "currency": "PHP",
  "serviceLocationType": "client_home",
  "categoryId": 7,
  "categoryName": "Cleaning",
  "providerId": 45,
  "providerName": "CleanPro Team",
  "providerBio": "Experienced home service provider.",
  "avgRating": 4.8,
  "reviewCount": 126,
  "isProviderActive": true,
  "isServiceVisible": true
}
```

### 13.2 Current Contract Mismatch To Resolve

Current backend names:

- `title`
- `description`
- `priceAmount`
- `averageRating`
- `totalReviews`

Current frontend expectations:

- `serviceName`
- `bio`
- `rateAmount`
- `avgRating`
- `reviewCount`

Before final QA, either the backend must map to the frontend contract or the frontend must be updated to consume the backend contract consistently. The preferred MVP approach is to map backend responses into the frontend's service-card view model inside an API client module.

---

## 14. Frontend Implementation Requirements

Add API client modules:

```text
src/api/services.js
src/api/bookings.js
src/api/notifications.js
```

These modules should:

- Use a shared base API URL from environment config
- Inject the stored auth token
- Normalize backend response data
- Provide consistent error handling

Shared components to add:

```text
src/components/booking/BookModal.jsx
src/components/booking/BookingStatusBadge.jsx
src/components/booking/BookingDetailDrawer.jsx
```

Routes to add:

```text
/service/:serviceId
/my-bookings
```

---

## 15. Backend Implementation Requirements

The backend already has most required routes. Refinements needed:

- Ensure booking routes use auth middleware consistently instead of relying on `x-user-id`
- Validate date and time fields
- Verify provider ID matches the selected provider service
- Ensure inactive providers cannot receive new bookings
- Return consistent field names for service browse and detail
- Add pagination and query filters to `GET /api/services/browse`
- Add optional limit/status support for booking dashboard widgets
- Fix cancellation notification recipient logic where needed
- Return enough booking data for client and provider widgets without extra requests

---

## 16. Non-Functional Requirements

### Responsiveness

The browse, service detail, booking modal, and bookings pages must work on:

- Desktop
- Tablet
- Mobile

### Accessibility

Required:

- Keyboard accessible modal controls
- Visible focus states
- Proper labels for inputs
- Status badges with readable text, not color alone
- Error messages associated with form fields where possible

### Performance

For MVP:

- Initial browse load should be acceptable with the current dataset size.

For production:

- Move search, filter, sorting, and pagination into the backend.
- Avoid loading all services at once.
- Add database indexes for common filtering fields.

---

## 17. Out of Scope For MVP

The following are not required for the first complete browse and booking flow:

- Online payments
- Deposits
- Calendar sync
- Provider availability calendars
- Automatic price quoting
- Promo codes
- File attachments
- Real-time chat
- SMS/email reminders
- Dispute handling
- Multi-provider comparison checkout

---

## 18. Success Criteria

The flow is considered complete when:

1. A logged-in client can browse real provider services.
2. Search, filters, and sort work predictably.
3. A client can open service detail from a service card.
4. A client can submit a booking request from browse, featured services, or service detail.
5. The booking appears in the client's My Bookings UI.
6. The provider sees the pending request.
7. The provider can accept or decline the booking.
8. The client sees the updated booking status.
9. The client can cancel an allowed booking.
10. The provider can mark an accepted booking as completed.
11. Relevant notifications are created for each booking status transition.
12. Contact buttons work from service and booking contexts.
13. Loading, empty, success, and error states are handled across the flow.

---

## 19. Recommended Build Order

1. Standardize service browse/detail data contract.
2. Add frontend API client modules for services and bookings.
3. Add service detail page and route.
4. Add shared booking modal.
5. Wire Book Now from Browse Services and Featured Services.
6. Replace client My Bookings hardcoded data with API data.
7. Add full My Bookings page.
8. Wire provider request accept/decline actions.
9. Wire provider upcoming jobs and completion.
10. Add notification bell/page integration.
11. Polish responsive, loading, empty, and error states.

