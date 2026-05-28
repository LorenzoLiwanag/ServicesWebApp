# Landing Page PRD
## Services Web App
### Public Homepage, Navigation, CTA Routing, and Contact Inquiry Flow

---

## 1. Purpose

The Landing Page is the public-facing homepage of the Services Web App. Its purpose is to introduce the platform, explain what it does, guide new users toward registration, allow returning users to log in, and allow visitors to submit contact inquiries.

This page should act as the first impression of the application and clearly communicate the app's value: helping users browse, offer, and book local home services through one platform.

The Landing Page PRD should focus only on the public homepage experience. It should not handle the internal login/registration logic, dashboard logic, provider mode logic, booking system, or full messaging system.

---

## 2. Current Progress

The Landing Page currently includes:

- A navigation bar
- Navigation links for:
  - Home
  - About
  - Services
  - Contact
- Section-based navigation/scrolling
- Get Started buttons
- Login button
- Dashboard button for demo access
- Contact section with a contact form

---

## 3. Current UI

The Landing Page is structured as a single-page public marketing page with multiple sections.

### Existing Sections

#### Home Section
The top section introduces the platform and includes a main call-to-action.

#### About Section
The About section explains the purpose of the platform.

#### Services Section
The Services section previews the types of services users may browse or book.

#### Contact Section
The Contact section includes a form where visitors can submit an inquiry or message.

---

## 4. Current Navigation Behavior

The navbar currently includes:

- Home
- About
- Services
- Contact

Each navbar link directs or scrolls the user to the matching section on the Landing Page.

Expected behavior:

- Home takes the user to the top of the Landing Page.
- About takes the user to the About section.
- Services takes the user to the Services section.
- Contact takes the user to the Contact section.

This behavior should remain and be refined where needed.

---

## 5. Current Button Behavior

### Get Started Buttons
The Get Started buttons currently direct users to the registration page. This behavior should remain.

Expected route:
```
/register
```

### Login Button
The Login button currently directs users to the login page. This behavior should remain.

Expected route:
```
/login
```

### Dashboard Button
The Dashboard button currently exists only for demo purposes so the developer can quickly access the dashboard and view mock logged-in functionality.

This button should be removed from the public Landing Page before production.

Dashboard access should only be available after a user successfully logs in.

---

## 6. Main Refinement Goals

The Landing Page should be refined from a demo/public mock page into a production-ready public homepage.

### Required Refinements

1. Remove the demo Dashboard button.
2. Keep navbar section links working properly.
3. Keep all Get Started buttons routing to the registration page.
4. Keep the Login button routing to the login page.
5. Implement contact form submission.
6. Store contact form submissions inside the database.
7. Create an in-app admin notification when a contact inquiry is submitted.
8. Do not send contact inquiries through email for MVP.
9. Add contact form loading, success, error, and validation states.
10. Ensure the page is responsive on desktop, tablet, and mobile.
11. Ensure the page clearly communicates the platform's purpose.

---

## 7. Contact Form Direction

For this app, contact form submissions should be handled inside the web app instead of through email.

### MVP Contact Flow

```
Visitor fills out contact form
→ frontend sends form data to backend
→ backend validates the form data
→ backend saves the inquiry in the contact_inquiry table
→ backend creates an admin notification
→ admin can later view the inquiry from an admin dashboard/inbox
```

No email or SMS sending is required for the MVP.

### Why This Approach Is Recommended

This approach is useful because:

- It avoids needing external email/SMS services for MVP.
- Contact inquiries are stored permanently in the database.
- Admin users can view inquiries from inside the app.
- It supports a future admin dashboard.
- It keeps all app communication centralized.
- It fits the future plan for in-app messaging between clients and providers.

---

## 8. Contact Form Requirements

### Contact Form Fields

The contact form should include:

- Name
- Email
- Subject
- Message

Optional future fields:

- Phone number
- Inquiry type
- Preferred contact method

---

## 9. Contact Form Functional Requirements

When the contact form is submitted:

1. The frontend validates required fields.
2. The frontend validates email format.
3. The frontend sends the form data to the backend.
4. The backend validates the data again.
5. The backend sanitizes the input.
6. The backend saves the inquiry in the `contact_inquiry` table.
7. The backend creates a notification for admin users.
8. The frontend displays a success message.
9. The form resets after successful submission.

If submission fails:

1. The frontend displays an error message.
2. The user's typed message should not be erased unless the submission succeeds.

---

## 10. Frontend Requirements

### Navbar

The navbar must include:

- Home
- About
- Services
- Contact
- Login button

The navbar must not include:

- Demo Dashboard button

### Section Navigation

Navbar links should scroll or navigate to the correct Landing Page sections.

Expected behavior:
```
Home      → top of page
About     → About section
Services  → Services section
Contact   → Contact section
```

### Call-to-Action Buttons

All Get Started buttons should route users to:
```
/register
```

The Login button should route users to:
```
/login
```

### Contact Form UI

The contact form should include:

- Name input
- Email input
- Subject input
- Message textarea
- Submit button
- Loading state while submitting
- Success message after successful submission
- Error message if submission fails
- Field-level validation messages

### Contact Form States

#### Default State
The form is empty and ready for input.

#### Loading State
The submit button should indicate that the inquiry is being submitted.

Example:
```
Sending...
```

The submit button should be disabled while the request is processing.

#### Success State
After successful submission, show:
```
Your message has been submitted successfully. An admin will review your inquiry.
```

#### Error State
If submission fails, show:
```
Something went wrong. Please try again.
```

#### Validation State
If required fields are missing or invalid, show clear field-level errors.

Example:
```
Please enter a valid email address.
```

---

## 11. Backend Requirements

The backend must support contact inquiry submission from the Landing Page.

### Required Endpoint

**POST /api/contact**

Creates a new contact inquiry.

#### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Question about services",
  "message": "I would like to know more about booking a service."
}
```

### Backend Responsibilities

The backend should:

- Validate required fields.
- Validate email format.
- Sanitize input.
- Save inquiry to the database.
- Create an admin notification.
- Return success response to frontend.
- Return clear error responses if validation or submission fails.

---

## 12. Database Requirements

The Landing Page contact form requires the following database support:

1. `contact_inquiry`
2. `notification`
3. Admin user record in `users`

---

## 13. Table: contact_inquiry

### Purpose
Stores contact messages submitted from the public Landing Page.

### Suggested Fields

```sql
CREATE TABLE contact_inquiry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'resolved', 'archived') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Status Values

| Status     | Description                                                  |
|------------|--------------------------------------------------------------|
| `new`      | The inquiry has been submitted but not reviewed.             |
| `read`     | An admin has opened or reviewed the inquiry.                 |
| `resolved` | The inquiry has been handled.                                |
| `archived` | The inquiry is no longer active but should remain stored.    |

---

## 14. Table: notification

### Purpose
Stores in-app notifications for users. For the Landing Page contact form, the notification table is used to alert admin users that a new contact inquiry has been submitted.

### Suggested Flexible Notification Fields

```sql
CREATE TABLE notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(100),
    related_entity_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);
```

### Example Admin Notification

When a contact inquiry is submitted, create a notification like:

```
type:                  contact_inquiry_created
title:                 New contact inquiry
message:               A visitor submitted a contact inquiry.
related_entity_type:   contact_inquiry
related_entity_id:     7
```

This allows the admin dashboard to open the related contact inquiry later.

---

## 15. Admin Notification Rules

When a contact inquiry is submitted:

1. Save the inquiry in `contact_inquiry`.
2. Find admin user/users in the `users` table.
3. Create a notification for each admin user.
4. Notification should reference the created contact inquiry using:
   - `related_entity_type = contact_inquiry`
   - `related_entity_id = contact_inquiry.id`

If no admin user exists yet, the contact inquiry should still be saved successfully. Admin notification creation can fail gracefully or be skipped until admin users exist.

---

## 16. User Stories

**User Story 1**
As a visitor, I want to navigate to different sections of the Landing Page so that I can quickly learn about the platform.

**User Story 2**
As a visitor, I want to click Get Started so that I can create an account.

**User Story 3**
As a returning user, I want to click Login so that I can access my account.

**User Story 4**
As a visitor, I want to submit a contact inquiry so that I can ask questions or send feedback.

**User Story 5**
As an admin, I want to receive an in-app notification when a contact inquiry is submitted so that I know a visitor has contacted the platform.

**User Story 6**
As an admin, I want contact inquiries saved in the database so that I can review, resolve, and archive them later from an admin dashboard.

---

## 17. Functional Requirements

The Landing Page must:

- Display a navbar with Home, About, Services, Contact, and Login.
- Scroll to the correct section when navbar links are clicked.
- Route Get Started buttons to the registration page.
- Route Login button to the login page.
- Remove the demo Dashboard button.
- Display a contact form.
- Validate contact form inputs.
- Submit contact form data to the backend.
- Save contact inquiry in the database.
- Create an in-app notification for admin users.
- Show success message after successful submission.
- Show error message if submission fails.
- Work responsively across desktop, tablet, and mobile.

---

## 18. Non-Functional Requirements

### Usability

- Navigation should be simple and clear.
- The main call-to-action should be easy to find.
- Form fields should be clearly labeled.
- Error messages should be easy to understand.
- Success message should clearly tell the visitor their inquiry was submitted.

### Performance

- Landing Page should load quickly.
- Contact form submission should provide immediate feedback.
- Images and icons should be optimized.

### Security

- Form input must be validated on frontend and backend.
- Backend must sanitize user input.
- Contact form endpoint should prevent extremely large submissions.
- Contact form endpoint should be prepared for basic spam/rate-limiting protections.

### Responsiveness

The page must work properly on:

- Desktop
- Tablet
- Mobile

---

## 19. Acceptance Criteria

The Landing Page is complete when:

- [ ] The navbar displays Home, About, Services, Contact, and Login.
- [ ] The Dashboard demo button is removed.
- [ ] Home link navigates to the top section.
- [ ] About link navigates to the About section.
- [ ] Services link navigates to the Services section.
- [ ] Contact link navigates to the Contact section.
- [ ] Get Started buttons route to the registration page.
- [ ] Login button routes to the login page.
- [ ] Contact form displays name, email, subject, and message fields.
- [ ] Contact form validates required fields.
- [ ] Contact form prevents invalid email submissions.
- [ ] Contact form sends data to the backend.
- [ ] Backend saves the inquiry in the `contact_inquiry` table.
- [ ] Backend creates an admin notification in the `notification` table.
- [ ] The user sees a success message after submitting the form.
- [ ] The user sees an error message if submission fails.
- [ ] The page works on mobile, tablet, and desktop.
- [ ] No mock/demo dashboard access is available from the public Landing Page.
- [ ] No email or SMS service is required for contact form submission.

---

## 20. Priority

### Must Have

- Working navbar section navigation
- Get Started routing to registration
- Login routing to login
- Remove Dashboard demo button
- Contact form UI
- Contact form frontend validation
- Contact form backend submission
- Contact inquiry database storage
- Admin in-app notification creation

### Should Have

- Loading state on contact form
- Success/error messages
- Mobile responsiveness polish
- Smooth scrolling
- Basic spam/rate-limit protection

### Nice to Have

- Admin dashboard inquiry inbox
- Contact inquiry status management
- Auto-generated admin task list
- Inquiry categories
- CAPTCHA or advanced spam filtering
- Visitor-to-admin conversation thread

---

## 21. Out of Scope for This PRD

The following features are not part of the Landing Page PRD:

- Login/register internal authentication logic
- Client dashboard
- Provider dashboard
- Booking system
- Provider profile management
- Provider service management
- Full admin dashboard
- Full in-app chat/messaging system
- Client-provider Contact Now messaging flow
- Email/SMS notifications

These should each have their own separate PRDs.

---

## 22. Final Landing Page MVP Definition

The Landing Page MVP is complete when a visitor can:

1. Learn what the platform does.
2. Navigate between Home, About, Services, and Contact sections.
3. Click Get Started to register.
4. Click Login to log in.
5. Submit a contact inquiry.
6. See confirmation that their inquiry was submitted.
7. Have that inquiry saved in the database.
8. Trigger an in-app admin notification for review.

The page should no longer include demo-only dashboard access and should not require email or SMS notification services for MVP.
