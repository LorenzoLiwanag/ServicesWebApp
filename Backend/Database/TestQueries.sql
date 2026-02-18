-- =======================================
-- COMPREHENSIVE TEST QUERIES
-- Services Web App Database Testing Suite
-- =======================================
-- This file contains sample queries to test all aspects of the database
-- covering all tables, relationships, and common business scenarios


-- ========================================
-- 1. USER & AUTHENTICATION TESTS
-- ========================================

-- 1.1 Get all active users with their roles
SELECT 
    u.user_id,
    u.first_name,
    u.last_name,
    u.username,
    u.email,
    u.status,
    GROUP_CONCAT(r.name SEPARATOR ', ') AS roles,
    u.created_at,
    u.last_login_at
FROM users u
LEFT JOIN user_role ur ON u.user_id = ur.user_id
LEFT JOIN role r ON ur.role_id = r.role_id
WHERE u.status = 'active'
GROUP BY u.user_id
ORDER BY u.created_at DESC;

-- 1.2 Find all admins
SELECT 
    u.user_id,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(ur.role_id) AS total_roles
FROM users u
INNER JOIN user_role ur ON u.user_id = ur.user_id
INNER JOIN role r ON ur.role_id = r.role_id
WHERE r.code = 'ADMIN'
GROUP BY u.user_id;

-- 1.3 Find users who haven't logged in (potential inactive accounts)
SELECT 
    user_id,
    first_name,
    last_name,
    email,
    created_at,
    last_login_at,
    DATEDIFF(NOW(), created_at) AS days_since_creation
FROM users
WHERE last_login_at IS NULL
ORDER BY created_at DESC;

-- 1.4 Get all users with suspended or banned status
SELECT 
    user_id,
    CONCAT(first_name, ' ', last_name) AS full_name,
    email,
    status,
    created_at,
    updated_at
FROM users
WHERE status IN ('suspended', 'banned', 'deleted')
ORDER BY updated_at DESC;


-- ========================================
-- 2. PROVIDER PROFILE TESTS
-- ========================================

-- 2.1 Get all active verified providers with their user info
SELECT 
    pp.provider_id,
    u.first_name,
    u.last_name,
    pp.display_name,
    pp.bio,
    pp.verification_status,
    u.email,
    u.phone_number,
    pp.profile_photo_url,
    pp.is_provider_active,
    pp.created_at
FROM provider_profile pp
INNER JOIN users u ON pp.provider_id = u.user_id
WHERE pp.is_provider_active = 1
AND pp.verification_status = 'verified'
ORDER BY pp.created_at DESC;

-- 2.2 Find providers pending verification
SELECT 
    pp.provider_id,
    u.first_name,
    u.last_name,
    pp.display_name,
    pp.verification_status,
    u.email,
    DATEDIFF(NOW(), pp.created_at) AS days_pending
FROM provider_profile pp
INNER JOIN users u ON pp.provider_id = u.user_id
WHERE pp.verification_status = 'pending'
ORDER BY pp.created_at ASC;

-- 2.3 Count active vs inactive providers
SELECT 
    is_provider_active,
    COUNT(*) AS count,
    SUM(CASE WHEN verification_status = 'verified' THEN 1 ELSE 0 END) AS verified_count
FROM provider_profile
GROUP BY is_provider_active;

-- 2.4 Get provider details with service count
SELECT 
    pp.provider_id,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    pp.display_name,
    pp.verification_status,
    COUNT(ps.provider_service_id) AS services_offered
FROM provider_profile pp
INNER JOIN users u ON pp.provider_id = u.user_id
LEFT JOIN provider_service ps ON pp.provider_id = ps.provider_id
WHERE pp.is_provider_active = 1
GROUP BY pp.provider_id
ORDER BY services_offered DESC;


-- ========================================
-- 3. ADDRESS TESTS
-- ========================================

-- 3.1 Get all addresses with city breakdown
SELECT 
    city,
    COUNT(*) AS address_count
FROM address
WHERE user_id IS NOT NULL
GROUP BY city
ORDER BY address_count DESC;

-- 3.2 Get all default addresses for active users
SELECT 
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    a.label,
    a.line1,
    a.line2,
    a.barangay,
    a.city,
    a.province_region,
    a.postal_code,
    a.latitude,
    a.longitude
FROM address a
INNER JOIN users u ON a.user_id = u.user_id
WHERE a.is_default = 1
AND u.status = 'active'
ORDER BY u.user_id;

-- 3.3 Find users with multiple addresses
SELECT 
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    u.email,
    COUNT(a.address_id) AS address_count
FROM users u
LEFT JOIN address a ON u.user_id = a.user_id
GROUP BY u.user_id
HAVING COUNT(a.address_id) > 1
ORDER BY address_count DESC;

-- 3.4 Get addresses by proximity (example: within Manila)
SELECT 
    a.address_id,
    a.label,
    a.line1,
    a.city,
    a.latitude,
    a.longitude,
    CONCAT(u.first_name, ' ', u.last_name) AS user_name
FROM address a
LEFT JOIN users u ON a.user_id = u.user_id
WHERE a.city = 'Manila'
AND a.latitude IS NOT NULL
AND a.longitude IS NOT NULL
ORDER BY a.latitude, a.longitude;


-- ========================================
-- 4. SERVICE CATEGORY & SERVICE TESTS
-- ========================================

-- 4.1 Get service hierarchy (parent categories with child services)
SELECT 
    sc.category_id,
    sc.name AS category_name,
    sc.parent_category_id,
    COUNT(s.service_id) AS service_count
FROM service_category sc
LEFT JOIN service s ON sc.category_id = s.category_id
WHERE sc.is_active = 1
GROUP BY sc.category_id
ORDER BY sc.sort_order, sc.name;

-- 4.2 Get all services with their categories
SELECT 
    s.service_id,
    s.name AS service_name,
    sc.name AS category_name,
    s.description,
    COUNT(ps.provider_service_id) AS provider_count,
    s.is_active,
    s.created_at
FROM service s
INNER JOIN service_category sc ON s.category_id = sc.category_id
LEFT JOIN provider_service ps ON s.service_id = ps.service_id
WHERE s.is_active = 1
GROUP BY s.service_id
ORDER BY sc.name, s.name;

-- 4.3 Find services with no providers yet
SELECT 
    s.service_id,
    s.name,
    sc.name AS category_name,
    COUNT(ps.provider_service_id) AS provider_count
FROM service s
INNER JOIN service_category sc ON s.category_id = sc.category_id
LEFT JOIN provider_service ps ON s.service_id = ps.service_id
GROUP BY s.service_id
HAVING provider_count = 0
ORDER BY sc.name, s.name;

-- 4.4 Get most popular services by provider count
SELECT 
    s.service_id,
    s.name,
    sc.name AS category_name,
    COUNT(DISTINCT ps.provider_id) AS provider_count,
    AVG(ps.rate_amount) AS avg_rate,
    MIN(ps.rate_amount) AS min_rate,
    MAX(ps.rate_amount) AS max_rate
FROM service s
INNER JOIN service_category sc ON s.category_id = sc.category_id
LEFT JOIN provider_service ps ON s.service_id = ps.service_id
WHERE s.is_active = 1
GROUP BY s.service_id
ORDER BY provider_count DESC
LIMIT 10;


-- ========================================
-- 5. PROVIDER SERVICE TESTS
-- ========================================

-- 5.1 Get all provider services with provider and service details
SELECT 
    ps.provider_service_id,
    CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
    s.name AS service_name,
    sc.name AS category_name,
    ps.pricing_type,
    ps.rate_amount,
    ps.rate_currency,
    ps.is_service_visible,
    ps.provider_notes,
    ps.created_at
FROM provider_service ps
INNER JOIN provider_profile pp ON ps.provider_id = pp.provider_id
INNER JOIN users u ON pp.provider_id = u.user_id
INNER JOIN service s ON ps.service_id = s.service_id
INNER JOIN service_category sc ON s.category_id = sc.category_id
WHERE ps.is_service_visible = 1
ORDER BY u.last_name, s.name;

-- 5.2 Get pricing analysis by service type
SELECT 
    s.name AS service_name,
    ps.pricing_type,
    COUNT(ps.provider_service_id) AS provider_count,
    AVG(ps.rate_amount) AS avg_rate,
    MIN(ps.rate_amount) AS min_rate,
    MAX(ps.rate_amount) AS max_rate,
    STDDEV_POP(ps.rate_amount) AS rate_stddev
FROM provider_service ps
INNER JOIN service s ON ps.service_id = s.service_id
WHERE ps.rate_amount IS NOT NULL
GROUP BY s.service_id, ps.pricing_type
ORDER BY s.name, ps.pricing_type;

-- 5.3 Find providers offering multiple services
SELECT 
    pp.provider_id,
    CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
    pp.display_name,
    COUNT(ps.provider_service_id) AS service_count,
    GROUP_CONCAT(s.name SEPARATOR ', ') AS services
FROM provider_profile pp
INNER JOIN users u ON pp.provider_id = u.user_id
INNER JOIN provider_service ps ON pp.provider_id = ps.provider_id
INNER JOIN service s ON ps.service_id = s.service_id
WHERE ps.is_service_visible = 1
GROUP BY pp.provider_id
ORDER BY service_count DESC;

-- 5.4 Find hidden services (inactive)
SELECT 
    ps.provider_service_id,
    CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
    s.name AS service_name,
    ps.is_service_visible,
    ps.updated_at
FROM provider_service ps
INNER JOIN provider_profile pp ON ps.provider_id = pp.provider_id
INNER JOIN users u ON pp.provider_id = u.user_id
INNER JOIN service s ON ps.service_id = s.service_id
WHERE ps.is_service_visible = 0
ORDER BY ps.updated_at DESC;


-- ========================================
-- 6. BOOKING TESTS
-- ========================================

-- 6.1 Get all bookings with full details
SELECT 
    b.booking_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
    CONCAT(pu.first_name, ' ', pu.last_name) AS provider_name,
    s.name AS service_name,
    b.status,
    b.scheduled_start_at,
    b.scheduled_end_at,
    DATEDIFF(b.scheduled_end_at, b.scheduled_start_at) AS days_duration,
    a.city AS service_location,
    b.client_notes,
    b.provider_notes,
    b.created_at
FROM booking b
INNER JOIN users cu ON b.client_user_id = cu.user_id
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN provider_profile pp ON ps.provider_id = pp.provider_id
INNER JOIN users pu ON pp.provider_id = pu.user_id
INNER JOIN service s ON ps.service_id = s.service_id
INNER JOIN address a ON b.service_address_id = a.address_id
ORDER BY b.created_at DESC;

-- 6.2 Get booking count by status
SELECT 
    status,
    COUNT(*) AS booking_count,
    COUNT(DISTINCT client_user_id) AS unique_clients,
    COUNT(DISTINCT provider_service_id) AS unique_providers
FROM booking
GROUP BY status
ORDER BY booking_count DESC;

-- 6.3 Get active/upcoming bookings (not cancelled/completed)
SELECT 
    b.booking_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
    CONCAT(pu.first_name, ' ', pu.last_name) AS provider_name,
    s.name AS service_name,
    b.status,
    b.scheduled_start_at,
    CASE 
        WHEN b.scheduled_start_at > NOW() THEN 'Upcoming'
        WHEN b.scheduled_end_at >= NOW() THEN 'In Progress'
        ELSE 'Overdue'
    END AS timing,
    DATEDIFF(b.scheduled_start_at, NOW()) AS days_until_start
FROM booking b
INNER JOIN users cu ON b.client_user_id = cu.user_id
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN provider_profile pp ON ps.provider_id = pp.provider_id
INNER JOIN users pu ON pp.provider_id = pu.user_id
INNER JOIN service s ON ps.service_id = s.service_id
WHERE b.status NOT IN ('cancelled', 'completed', 'declined')
ORDER BY b.scheduled_start_at ASC;

-- 6.4 Get completed bookings for performance review
SELECT 
    b.booking_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
    CONCAT(pu.first_name, ' ', pu.last_name) AS provider_name,
    s.name AS service_name,
    b.scheduled_start_at,
    b.scheduled_end_at,
    DATE(b.completed_at) AS completion_date,
    TIMESTAMPDIFF(HOUR, b.scheduled_start_at, b.scheduled_end_at) AS scheduled_hours,
    b.client_notes,
    b.provider_notes
FROM booking b
INNER JOIN users cu ON b.client_user_id = cu.user_id
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN provider_profile pp ON ps.provider_id = pp.provider_id
INNER JOIN users pu ON pp.provider_id = pu.user_id
INNER JOIN service s ON ps.service_id = s.service_id
WHERE b.status = 'completed'
ORDER BY b.completed_at DESC;

-- 6.5 Client booking history (example: for user_id = 1)
SELECT 
    b.booking_id,
    CONCAT(pu.first_name, ' ', pu.last_name) AS provider_name,
    s.name AS service_name,
    b.status,
    b.scheduled_start_at,
    b.created_at,
    CASE WHEN rev.review_id IS NOT NULL THEN 'Reviewed' ELSE 'Not Reviewed' END AS review_status
FROM booking b
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN provider_profile pp ON ps.provider_id = pp.provider_id
INNER JOIN users pu ON pp.provider_id = pu.user_id
INNER JOIN service s ON ps.service_id = s.service_id
LEFT JOIN review rev ON b.booking_id = rev.booking_id
WHERE b.client_user_id = 1
ORDER BY b.created_at DESC;

-- 6.6 Provider booking calendar (example: for provider_id = 16)
SELECT 
    b.booking_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
    s.name AS service_name,
    b.status,
    DATE(b.scheduled_start_at) AS booking_date,
    TIME(b.scheduled_start_at) AS start_time,
    TIME(b.scheduled_end_at) AS end_time,
    a.city AS location
FROM booking b
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN users cu ON b.client_user_id = cu.user_id
INNER JOIN service s ON ps.service_id = s.service_id
INNER JOIN address a ON b.service_address_id = a.address_id
WHERE ps.provider_id = 16
AND b.scheduled_start_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
AND b.scheduled_start_at <= DATE_ADD(NOW(), INTERVAL 30 DAY)
ORDER BY b.scheduled_start_at ASC;

-- 6.7 Find cancelled bookings and reasons
SELECT 
    b.booking_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
    CONCAT(pu.first_name, ' ', pu.last_name) AS provider_name,
    s.name AS service_name,
    b.status,
    b.scheduled_start_at,
    b.cancelled_at,
    DATEDIFF(b.cancelled_at, b.created_at) AS days_before_cancellation,
    b.cancellation_reason
FROM booking b
INNER JOIN users cu ON b.client_user_id = cu.user_id
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN provider_profile pp ON ps.provider_id = pp.provider_id
INNER JOIN users pu ON pp.provider_id = pu.user_id
INNER JOIN service s ON ps.service_id = s.service_id
WHERE b.status = 'cancelled'
ORDER BY b.cancelled_at DESC;


-- ========================================
-- 7. PAYMENT TESTS
-- ========================================

-- 7.1 Get all payments with status breakdown
SELECT 
    p.payment_id,
    b.booking_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS payer_name,
    s.name AS service_name,
    p.amount,
    p.currency,
    p.status,
    pm.display_name AS payment_method,
    p.paid_at,
    p.created_at,
    TIMESTAMPDIFF(HOUR, p.created_at, p.paid_at) AS hours_to_payment
FROM payment p
INNER JOIN booking b ON p.booking_id = b.booking_id
INNER JOIN users cu ON p.payer_user_id = cu.user_id
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN service s ON ps.service_id = s.service_id
INNER JOIN payment_method pm ON p.payment_method_id = pm.payment_method_id
ORDER BY p.created_at DESC;

-- 7.2 Payment summary by status
SELECT 
    status,
    COUNT(*) AS payment_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount
FROM payment
GROUP BY status
ORDER BY payment_count DESC;

-- 7.3 Payment method analysis
SELECT 
    pm.display_name,
    COUNT(p.payment_id) AS transaction_count,
    SUM(p.amount) AS total_amount,
    AVG(p.amount) AS avg_amount,
    SUM(CASE WHEN p.status = 'paid' THEN 1 ELSE 0 END) AS successful_payments,
    ROUND(100 * SUM(CASE WHEN p.status = 'paid' THEN 1 ELSE 0 END) / COUNT(p.payment_id), 2) AS success_rate
FROM payment p
INNER JOIN payment_method pm ON p.payment_method_id = pm.payment_method_id
GROUP BY pm.payment_method_id
ORDER BY total_amount DESC;

-- 7.4 Failed and pending payments
SELECT 
    p.payment_id,
    b.booking_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS payer_name,
    s.name AS service_name,
    p.amount,
    p.status,
    pm.display_name AS payment_method,
    DATEDIFF(NOW(), p.created_at) AS days_pending,
    p.created_at
FROM payment p
INNER JOIN booking b ON p.booking_id = b.booking_id
INNER JOIN users cu ON p.payer_user_id = cu.user_id
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN service s ON ps.service_id = s.service_id
INNER JOIN payment_method pm ON p.payment_method_id = pm.payment_method_id
WHERE p.status IN ('failed', 'pending', 'created')
ORDER BY p.created_at ASC;

-- 7.5 Daily revenue
SELECT 
    DATE(p.paid_at) AS payment_date,
    COUNT(p.payment_id) AS transaction_count,
    SUM(p.amount) AS daily_revenue,
    AVG(p.amount) AS avg_transaction
FROM payment p
WHERE p.status = 'paid'
AND p.paid_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(p.paid_at)
ORDER BY payment_date DESC;

-- 7.6 Revenue by payment method
SELECT 
    pm.display_name AS payment_method,
    SUM(p.amount) AS total_revenue,
    COUNT(p.payment_id) AS transaction_count,
    ROUND(100 * SUM(p.amount) / (SELECT SUM(amount) FROM payment WHERE status = 'paid'), 2) AS revenue_percentage
FROM payment p
INNER JOIN payment_method pm ON p.payment_method_id = pm.payment_method_id
WHERE p.status = 'paid'
GROUP BY pm.payment_method_id
ORDER BY total_revenue DESC;


-- ========================================
-- 8. PAYMENT EVENT TESTS
-- ========================================

-- 8.1 Get all payment events
SELECT 
    pe.payment_event_id,
    p.payment_id,
    b.booking_id,
    pe.event_type,
    pe.new_status,
    pe.received_at,
    pe.raw_payload
FROM payment_event pe
INNER JOIN payment p ON pe.payment_id = p.payment_id
INNER JOIN booking b ON p.booking_id = b.booking_id
ORDER BY pe.received_at DESC;

-- 8.2 Get event history for a specific payment
SELECT 
    pe.payment_event_id,
    pe.event_type,
    pe.new_status,
    pe.received_at
FROM payment_event pe
WHERE pe.payment_id = 1
ORDER BY pe.received_at ASC;

-- 8.3 Event frequency analysis
SELECT 
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT payment_id) AS unique_payments,
    MAX(received_at) AS last_event
FROM payment_event
GROUP BY event_type
ORDER BY event_count DESC;


-- ========================================
-- 9. REVIEW & RATINGS TESTS
-- ========================================

-- 9.1 Get all reviews with full details
SELECT 
    r.review_id,
    b.booking_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
    CONCAT(pu.first_name, ' ', pu.last_name) AS provider_name,
    s.name AS service_name,
    r.rating,
    r.comment,
    r.created_at,
    DATEDIFF(NOW(), r.created_at) AS days_since_review
FROM review r
INNER JOIN booking b ON r.booking_id = b.booking_id
INNER JOIN users cu ON r.reviewer_user_id = cu.user_id
INNER JOIN users pu ON r.provider_user_id = pu.user_id
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN service s ON ps.service_id = s.service_id
ORDER BY r.created_at DESC;

-- 9.2 Provider rating summary
SELECT 
    r.provider_user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
    pp.display_name,
    COUNT(r.review_id) AS review_count,
    AVG(r.rating) AS avg_rating,
    MIN(r.rating) AS min_rating,
    MAX(r.rating) AS max_rating,
    SUM(CASE WHEN r.rating >= 4 THEN 1 ELSE 0 END) AS positive_reviews,
    SUM(CASE WHEN r.rating <= 2 THEN 1 ELSE 0 END) AS negative_reviews
FROM review r
INNER JOIN users u ON r.provider_user_id = u.user_id
INNER JOIN provider_profile pp ON r.provider_user_id = pp.provider_id
GROUP BY r.provider_user_id
ORDER BY avg_rating DESC;

-- 9.3 Get providers with low ratings
SELECT 
    r.provider_user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
    pp.display_name,
    COUNT(r.review_id) AS review_count,
    AVG(r.rating) AS avg_rating
FROM review r
INNER JOIN users u ON r.provider_user_id = u.user_id
INNER JOIN provider_profile pp ON r.provider_user_id = pp.provider_id
GROUP BY r.provider_user_id
HAVING avg_rating < 3 AND review_count >= 5
ORDER BY avg_rating ASC;

-- 9.4 Rating distribution
SELECT 
    rating,
    COUNT(*) AS review_count,
    ROUND(100 * COUNT(*) / (SELECT COUNT(*) FROM review), 2) AS percentage
FROM review
GROUP BY rating
ORDER BY rating DESC;

-- 9.5 Reviews without comments
SELECT 
    r.review_id,
    b.booking_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
    CONCAT(pu.first_name, ' ', pu.last_name) AS provider_name,
    r.rating,
    r.created_at
FROM review r
INNER JOIN booking b ON r.booking_id = b.booking_id
INNER JOIN users cu ON r.reviewer_user_id = cu.user_id
INNER JOIN users pu ON r.provider_user_id = pu.user_id
WHERE r.comment IS NULL OR r.comment = ''
ORDER BY r.created_at DESC;


-- ========================================
-- 10. BUSINESS ANALYTICS & INSIGHTS
-- ========================================

-- 10.1 Top performing providers by revenue
SELECT 
    pp.provider_id,
    CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
    pp.display_name,
    COUNT(DISTINCT b.booking_id) AS total_bookings,
    SUM(p.amount) AS total_revenue,
    AVG(r.rating) AS avg_rating,
    COUNT(r.review_id) AS review_count
FROM provider_profile pp
INNER JOIN users u ON pp.provider_id = u.user_id
LEFT JOIN provider_service ps ON pp.provider_id = ps.provider_id
LEFT JOIN booking b ON ps.provider_service_id = b.provider_service_id
LEFT JOIN payment p ON b.booking_id = p.booking_id AND p.status = 'paid'
LEFT JOIN review r ON b.booking_id = r.booking_id
WHERE pp.is_provider_active = 1
GROUP BY pp.provider_id
ORDER BY total_revenue DESC
LIMIT 10;

-- 10.2 Top booking cities
SELECT 
    a.city,
    COUNT(DISTINCT b.booking_id) AS booking_count,
    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count,
    ROUND(100 * SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) / COUNT(DISTINCT b.booking_id), 2) AS completion_rate
FROM booking b
INNER JOIN address a ON b.service_address_id = a.address_id
GROUP BY a.city
ORDER BY booking_count DESC;

-- 10.3 Most booked services
SELECT 
    s.service_id,
    s.name AS service_name,
    sc.name AS category_name,
    COUNT(b.booking_id) AS booking_count,
    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_bookings,
    AVG(r.rating) AS avg_rating,
    SUM(p.amount) AS total_revenue
FROM service s
INNER JOIN service_category sc ON s.category_id = sc.category_id
LEFT JOIN provider_service ps ON s.service_id = ps.service_id
LEFT JOIN booking b ON ps.provider_service_id = b.provider_service_id
LEFT JOIN review r ON b.booking_id = r.booking_id
LEFT JOIN payment p ON b.booking_id = p.booking_id AND p.status = 'paid'
GROUP BY s.service_id
ORDER BY booking_count DESC;

-- 10.4 Client booking patterns
SELECT 
    b.client_user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS client_name,
    COUNT(b.booking_id) AS total_bookings,
    COUNT(DISTINCT ps.provider_id) AS unique_providers,
    COUNT(DISTINCT s.service_id) AS unique_services,
    SUM(p.amount) AS total_spent,
    AVG(r.rating) AS avg_rating_given,
    MAX(b.created_at) AS last_booking_date
FROM booking b
INNER JOIN users u ON b.client_user_id = u.user_id
LEFT JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
LEFT JOIN service s ON ps.service_id = s.service_id
LEFT JOIN payment p ON b.booking_id = p.booking_id AND p.status = 'paid'
LEFT JOIN review r ON b.booking_id = r.booking_id
GROUP BY b.client_user_id
ORDER BY total_spent DESC
LIMIT 20;

-- 10.5 Monthly booking and revenue trends
SELECT 
    DATE_FORMAT(b.created_at, '%Y-%m') AS month,
    COUNT(DISTINCT b.booking_id) AS bookings,
    COUNT(DISTINCT b.client_user_id) AS unique_clients,
    COUNT(DISTINCT ps.provider_id) AS unique_providers,
    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_bookings,
    SUM(p.amount) AS monthly_revenue
FROM booking b
LEFT JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
LEFT JOIN payment p ON b.booking_id = p.booking_id AND p.status = 'paid'
GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
ORDER BY month DESC;

-- 10.6 Key performance indicators (KPIs)
SELECT 
    'Total Users' AS metric,
    COUNT(*) AS value
FROM users
UNION ALL
SELECT 'Active Providers', COUNT(*) FROM provider_profile WHERE is_provider_active = 1
UNION ALL
SELECT 'Total Bookings', COUNT(*) FROM booking
UNION ALL
SELECT 'Completed Bookings', COUNT(*) FROM booking WHERE status = 'completed'
UNION ALL
SELECT 'Total Revenue', SUM(amount) FROM payment WHERE status = 'paid'
UNION ALL
SELECT 'Avg Review Rating', AVG(rating) FROM review
UNION ALL
SELECT 'Total Services', COUNT(*) FROM service WHERE is_active = 1
UNION ALL
SELECT 'Services with Providers', COUNT(DISTINCT service_id) FROM provider_service;

-- 10.7 Weekly booking activity
SELECT 
    WEEK(b.created_at) AS week_number,
    DATE_FORMAT(b.created_at, '%Y-%m-%d') AS week_starting,
    COUNT(b.booking_id) AS bookings,
    COUNT(DISTINCT b.client_user_id) AS unique_clients,
    SUM(CASE WHEN b.status IN ('completed', 'in_progress', 'accepted') THEN 1 ELSE 0 END) AS active_bookings
FROM booking b
WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
GROUP BY WEEK(b.created_at)
ORDER BY week_number DESC;


-- ========================================
-- 11. DATA QUALITY & INTEGRITY TESTS
-- ========================================

-- 11.1 Orphaned records check (bookings without valid provider services)
SELECT 
    b.booking_id,
    b.provider_service_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name
FROM booking b
INNER JOIN users cu ON b.client_user_id = cu.user_id
LEFT JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
WHERE ps.provider_service_id IS NULL;

-- 11.2 Users with no addresses
SELECT 
    u.user_id,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    u.email,
    u.created_at
FROM users u
LEFT JOIN address a ON u.user_id = a.user_id
WHERE a.address_id IS NULL
AND u.status = 'active';

-- 11.3 Providers with no services
SELECT 
    pp.provider_id,
    CONCAT(u.first_name, ' ', u.last_name) AS full_name,
    pp.display_name,
    pp.is_provider_active,
    pp.verification_status,
    COUNT(ps.provider_service_id) AS service_count
FROM provider_profile pp
INNER JOIN users u ON pp.provider_id = u.user_id
LEFT JOIN provider_service ps ON pp.provider_id = ps.provider_id
WHERE pp.is_provider_active = 1
GROUP BY pp.provider_id
HAVING service_count = 0;

-- 11.4 Bookings with invalid dates (end before start)
SELECT 
    b.booking_id,
    b.client_user_id,
    b.provider_service_id,
    b.scheduled_start_at,
    b.scheduled_end_at,
    TIMESTAMPDIFF(HOUR, b.scheduled_start_at, b.scheduled_end_at) AS invalid_duration
FROM booking b
WHERE b.scheduled_end_at IS NOT NULL
AND b.scheduled_end_at < b.scheduled_start_at;

-- 11.5 Payments without associated bookings
SELECT 
    p.payment_id,
    p.booking_id,
    p.amount,
    p.status,
    p.created_at
FROM payment p
LEFT JOIN booking b ON p.booking_id = b.booking_id
WHERE b.booking_id IS NULL;

-- 11.6 Duplicate users (same email)
SELECT 
    email,
    COUNT(*) AS user_count,
    GROUP_CONCAT(user_id SEPARATOR ', ') AS user_ids
FROM users
WHERE email IS NOT NULL
GROUP BY email
HAVING user_count > 1;

-- 11.7 Reviews for non-completed bookings
SELECT 
    r.review_id,
    b.booking_id,
    b.status,
    r.rating,
    r.created_at
FROM review r
INNER JOIN booking b ON r.booking_id = b.booking_id
WHERE b.status != 'completed';


-- ========================================
-- 12. TESTING AGGREGATE FUNCTIONS
-- ========================================

-- 12.1 Test COUNT with different conditions
SELECT 
    COUNT(*) AS total_services,
    COUNT(DISTINCT category_id) AS categories_used,
    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_services,
    SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_services
FROM service;

-- 12.2 Test MIN/MAX/AVG functions
SELECT 
    MIN(rate_amount) AS min_rate,
    MAX(rate_amount) AS max_rate,
    AVG(rate_amount) AS avg_rate,
    STDDEV_POP(rate_amount) AS rate_std_dev,
    COUNT(*) AS service_count
FROM provider_service
WHERE rate_amount IS NOT NULL;

-- 12.3 Test STRING_AGG equivalent (GROUP_CONCAT)
SELECT 
    pp.provider_id,
    CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
    GROUP_CONCAT(DISTINCT sc.name ORDER BY sc.name SEPARATOR ', ') AS categories_served
FROM provider_profile pp
INNER JOIN users u ON pp.provider_id = u.user_id
INNER JOIN provider_service ps ON pp.provider_id = ps.provider_id
INNER JOIN service s ON ps.service_id = s.service_id
INNER JOIN service_category sc ON s.category_id = sc.category_id
GROUP BY pp.provider_id
ORDER BY pp.provider_id;


-- ========================================
-- 13. TESTING FILTERS & CONDITIONS
-- ========================================

-- 13.1 Complex WHERE clause
SELECT 
    b.booking_id,
    CONCAT(cu.first_name, ' ', cu.last_name) AS client_name,
    CONCAT(pu.first_name, ' ', pu.last_name) AS provider_name,
    b.status,
    b.scheduled_start_at
FROM booking b
INNER JOIN users cu ON b.client_user_id = cu.user_id
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN provider_profile pp ON ps.provider_id = pp.provider_id
INNER JOIN users pu ON pp.provider_id = pu.user_id
WHERE b.scheduled_start_at >= '2026-01-01'
AND b.scheduled_start_at <= '2026-12-31'
AND b.status IN ('completed', 'accepted', 'in_progress')
AND cu.status = 'active'
AND pu.status = 'active'
AND pp.is_provider_active = 1;

-- 13.2 Test IN clause with subquery
SELECT 
    s.service_id,
    s.name
FROM service s
WHERE s.category_id IN (
    SELECT category_id 
    FROM service_category 
    WHERE parent_category_id IS NULL
)
ORDER BY s.name;


-- ========================================
-- 14. TEST JOINING CAPABILITIES
-- ========================================

-- 14.1 Multiple joins (stress test)
SELECT 
    b.booking_id,
    b.status,
    cu.first_name AS client_first,
    pu.first_name AS provider_first,
    s.name AS service_name,
    a.city,
    p.amount,
    p.status AS payment_status,
    r.rating
FROM booking b
INNER JOIN users cu ON b.client_user_id = cu.user_id
INNER JOIN provider_service ps ON b.provider_service_id = ps.provider_service_id
INNER JOIN provider_profile pp ON ps.provider_id = pp.provider_id
INNER JOIN users pu ON pp.provider_id = pu.user_id
INNER JOIN service s ON ps.service_id = s.service_id
INNER JOIN address a ON b.service_address_id = a.address_id
LEFT JOIN payment p ON b.booking_id = p.booking_id
LEFT JOIN review r ON b.booking_id = r.booking_id
WHERE b.booking_id = 1;

-- 14.2 Self-join test (service category hierarchy)
SELECT 
    parent.category_id AS parent_id,
    parent.name AS parent_name,
    child.category_id AS child_id,
    child.name AS child_name
FROM service_category parent
LEFT JOIN service_category child ON parent.category_id = child.parent_category_id
WHERE parent.parent_category_id IS NULL
ORDER BY parent.name, child.name;
