# Admin Service Category Management PRD
## Services Web App
### Admin CRUD for Service Categories with Legacy Data Handling

---

## 1. Purpose

This PRD defines the functionality allowing admins to create, update, deactivate, and delete service categories — the taxonomy that providers use when listing services and clients use when browsing. It also specifies how the system handles existing services and bookings when categories are modified or removed.

---

## 2. Background & Context

Service categories (`service_category` table) currently exist in the database and are seeded manually. There is no UI or API for admins to manage them. Categories are referenced by `provider_service.category_id` (nullable, `ON DELETE SET NULL`), meaning the DB already handles hard-deletes gracefully by nullifying the FK on affected services.

The existing browse query already accounts for this: it shows services where `sc.is_active = TRUE OR ps.category_id IS NULL`, so hidden or unlinked services are silently excluded from client-facing browse.

---

## 3. Goals

- Give admins full CRUD control over service categories via the admin panel UI
- Protect data integrity for services and bookings that reference existing categories
- Make the impact of any category change visible to admins before they act
- Require no breaking schema changes (all needed columns already exist)

---

## 4. Non-Goals

- Bulk migration of services between categories (out of scope for v1; admin can reassign individually)
- Category icons or image uploads
- Client-facing category landing pages
- Provider ability to request new categories (admin-only in this version)

---

## 5. User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|------------|
| 1 | Admin | Create a new service category | Providers can list services under it |
| 2 | Admin | Rename or update a category's description/sort order | The marketplace taxonomy stays current |
| 3 | Admin | Deactivate a category | It stops appearing in browse and provider forms without losing historical service data |
| 4 | Admin | Reactivate a previously deactivated category | Services under it become visible again without any re-linking |
| 5 | Admin | Hard-delete a category | I can clean up categories that were never used |
| 6 | Admin | See how many services reference a category before acting | I understand the impact before deactivating or deleting |
| 7 | Admin | See services that have lost their category | I can review and reassign uncategorized services |

---

## 6. Functional Requirements

### 6.1 Category List View (Admin Panel)

- Display all categories in a table: Name, Description, Status (Active/Inactive), Sort Order, Parent Category, Service Count, Actions
- **Service Count** = number of non-deleted `provider_service` rows referencing this category (active + pending + rejected, so admin understands total exposure)
- Show both active and inactive categories (toggle or always-show)
- Support sorting by name, sort_order, or service count
- "Add Category" button opens a creation form/modal

### 6.2 Create Category

Fields:
- **Name** (required, max 150 chars, must be unique among active categories)
- **Description** (optional, text)
- **Parent Category** (optional, dropdown of active categories — for subcategory structure)
- **Sort Order** (integer, default 0 — lower numbers appear first)

Behaviour:
- New categories are `is_active = TRUE` by default
- Validate uniqueness of name before saving
- On success: category appears in provider service form and browse filter immediately

### 6.3 Update Category

Editable fields: Name, Description, Parent Category, Sort Order.

Behaviour:
- Changes take effect immediately — existing services reflect the updated name/description on next page load (they join by ID)
- No migration or re-linking required
- Name uniqueness validated on save (excluding current record)
- `is_active` is not editable inline — use the explicit Deactivate/Reactivate action

### 6.4 Deactivate Category (Soft Delete)

Trigger: "Deactivate" button in the category row actions.

Pre-action confirmation modal must display:
> "Deactivating **[Category Name]** will hide **[N] services** from client browse until they are reassigned or this category is reactivated. Providers will no longer see this category when adding new services. Are you sure?"

Behaviour:
- Sets `is_active = FALSE` on the category
- **Does not modify any `provider_service` rows** — services retain their `category_id`
- Services under a deactivated category are hidden from client browse (existing query already filters `sc.is_active = TRUE`)
- Providers whose services are in this category will see their services as hidden with a status note: "Category unavailable — contact support to reassign"
- Category no longer appears in the provider "add/edit service" category dropdown
- Category no longer appears in client browse filters

### 6.5 Reactivate Category

Trigger: "Reactivate" button (visible only on inactive categories).

Behaviour:
- Sets `is_active = TRUE`
- All previously linked services immediately reappear in browse (no re-linking needed)
- No confirmation required

### 6.6 Hard Delete Category

Trigger: "Delete" button, only visible when `service_count = 0`.

- If `service_count > 0`: button is disabled with tooltip "Cannot delete — N services reference this category. Deactivate it instead."
- If `service_count = 0`: confirmation modal → "Permanently delete **[Category Name]**? This cannot be undone."
- On confirm: hard deletes the row. MySQL `ON DELETE SET NULL` handles any edge-case FK references automatically.

### 6.7 Uncategorized Services View

A separate tab or section in the admin panel showing all non-deleted services where `category_id IS NULL`. These are services that either:
- Were posted before categories existed
- Had their category hard-deleted (edge case, guarded by 6.6)
- Were manually unlinked

Columns: Service Title, Provider Name, Approval Status, Created At, Actions (including "Assign Category" inline).

"Assign Category" opens a dropdown of active categories; saving updates `provider_service.category_id`.

---

## 7. API Endpoints

All endpoints require `requireAuth` + `requireAdmin` middleware.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/admin/categories` | List all categories with service counts |
| `POST` | `/api/admin/categories` | Create a new category |
| `PATCH` | `/api/admin/categories/:id` | Update name/description/sort_order/parent |
| `PATCH` | `/api/admin/categories/:id/deactivate` | Soft delete (set is_active = false) |
| `PATCH` | `/api/admin/categories/:id/reactivate` | Restore (set is_active = true) |
| `DELETE` | `/api/admin/categories/:id` | Hard delete (blocked if service_count > 0) |
| `GET` | `/api/admin/services/uncategorized` | List non-deleted services with no category |
| `PATCH` | `/api/admin/services/:id/assign-category` | Assign a category to an uncategorized service |

### GET /api/admin/categories — Response Shape

```json
{
  "categories": [
    {
      "id": 3,
      "name": "Home Cleaning",
      "description": "...",
      "parentCategoryId": null,
      "sortOrder": 1,
      "isActive": true,
      "serviceCount": 12,
      "createdAt": "2024-01-15T00:00:00Z",
      "updatedAt": "2024-06-01T00:00:00Z"
    }
  ]
}
```

### POST/PATCH — Request Body

```json
{
  "name": "Home Cleaning",
  "description": "Residential cleaning services",
  "parentCategoryId": null,
  "sortOrder": 1
}
```

---

## 8. Data & Schema

No schema migrations are required. All needed columns already exist:

| Column | Table | Purpose |
|--------|-------|---------|
| `is_active` | `service_category` | Soft delete flag |
| `parent_category_id` | `service_category` | Subcategory support |
| `sort_order` | `service_category` | Display ordering |
| `category_id` (nullable) | `provider_service` | FK with `ON DELETE SET NULL` |

The only DB work is the query changes and new queries in `categoryModel.js`.

---

## 9. Legacy Data Handling — Decision Table

| Admin Action | Effect on Existing Services | Client Browse | Provider Service Form |
|---|---|---|---|
| **Rename category** | Immediately reflects new name (JOIN by ID) | Updated name shown | Updated name shown |
| **Update sort/description** | No effect | Updated filter order | No visible change |
| **Deactivate category** | Services retain `category_id`; hidden from browse | Services hidden | Category removed from dropdown |
| **Reactivate category** | No changes needed | Services reappear | Category reappears in dropdown |
| **Hard delete** (0 services) | No services affected | No change | Category removed |
| **Hard delete** (blocked, >0 services) | Prevented at API layer | No change | No change |

---

## 10. UI/UX Requirements

- Category management lives under an "Admin Panel → Categories" tab (alongside existing Users, Services tabs)
- Deactivated categories shown with a muted style (greyed out row) but still visible to admin
- Service count displayed as a clickable number that deep-links to a filtered services list
- All destructive actions (deactivate, delete) require a confirmation modal with explicit impact statement
- "Delete" button rendered as disabled (not hidden) with tooltip when blocked — so admin understands why

---

## 11. Edge Cases

| Scenario | Handling |
|---|---|
| Admin deactivates a category with pending-approval services | Services stay pending; just hidden from browse until approved AND category reactivated |
| Admin creates a category with the same name as an inactive one | API returns 409; admin must reactivate existing or choose a different name |
| Parent category is deactivated while children are active | Children remain active and visible; only the parent is soft-deleted (children are independent rows) |
| Provider edits a service whose category is now inactive | Backend returns the category with a warning flag; frontend shows "Category unavailable" with prompt to reassign |
| Two admins simultaneously deactivate the same category | Idempotent — second request is a no-op (already inactive), returns 200 |

---

## 12. Success Metrics

- Admin can create, update, and deactivate a category with zero developer involvement
- Zero unintended service data loss on any category operation
- Uncategorized service count stays at 0 under normal operations (no hard deletes while services exist)
- Deactivated category services are correctly hidden within one page refresh

---

## 13. Implementation Order

1. **`categoryModel.js`** — all DB queries (list with counts, create, update, deactivate, reactivate, hard delete, uncategorized services, assign category)
2. **`adminController.js`** — add category handler functions
3. **`adminRoutes.js`** — wire up new routes
4. **Admin Panel UI** — Categories tab with table, modals, and Uncategorized section
5. **Provider service form** — verify category dropdown already filters `is_active = TRUE` (it does via `GET /api/services/categories`)
