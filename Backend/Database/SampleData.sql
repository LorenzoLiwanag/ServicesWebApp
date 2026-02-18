-- =======================================
-- SAMPLE DATA FOR SERVICES WEB APP
-- =======================================

-- ========================================
-- 1. ROLES (Required for user_role)
-- ========================================
INSERT INTO role (code, name, description, is_active) VALUES
('USER', 'Regular User', 'Standard user role for clients and service providers', 1),
('ADMIN', 'Administrator', 'Admin role with full access to system', 1),
('PROVIDER', 'Service Provider', 'Role for users offering services', 1);


-- ========================================
-- 2. USERS (30 users: 15 clients, 15 providers)
-- ========================================
-- Note: These are sample hashes. In production, use proper password hashing!
-- Sample password hash for all: "password123" hashed
INSERT INTO users (first_name, last_name, username, email, phone_number, address_text, password_hash, status, last_login_at) VALUES
-- Clients (1-15)
('Juan', 'Dela Cruz', 'juan_dc', 'juan@example.com', '09101234567', 'Manila, Philippines', '$2b$10$sample_hash_1', 'active', NOW()),
('Maria', 'Santos', 'maria_santos', 'maria@example.com', '09102345678', 'Quezon City, Philippines', '$2b$10$sample_hash_2', 'active', NOW()),
('Carlos', 'Rodriguez', 'carlos_rod', 'carlos@example.com', '09103456789', 'Makati, Philippines', '$2b$10$sample_hash_3', 'active', NOW()),
('Ana', 'Garcia', 'ana_garcia', 'ana@example.com', '09104567890', 'Cebu City, Philippines', '$2b$10$sample_hash_4', 'active', NOW()),
('Miguel', 'Lopez', 'miguel_l', 'miguel@example.com', '09105678901', 'Davao City, Philippines', '$2b$10$sample_hash_5', 'active', NOW()),
('Rosa', 'Fernandez', 'rosa_fern', 'rosa@example.com', '09106789012', 'Caloocan, Philippines', '$2b$10$sample_hash_6', 'active', NOW()),
('Pedro', 'Gutierrez', 'pedro_g', 'pedro@example.com', '09107890123', 'Pasig City, Philippines', '$2b$10$sample_hash_7', 'active', NOW()),
('Sofia', 'Martinez', 'sofia_m', 'sofia@example.com', '09108901234', 'Las Piñas, Philippines', '$2b$10$sample_hash_8', 'active', NOW()),
('Luis', 'Ramirez', 'luis_ram', 'luis@example.com', '09109012345', 'Antipolo, Philippines', '$2b$10$sample_hash_9', 'active', NOW()),
('Isabella', 'Torres', 'isabella_t', 'isabella@example.com', '09110123456', 'San Juan, Philippines', '$2b$10$sample_hash_10', 'active', NOW()),
('Diego', 'Morales', 'diego_m', 'diego@example.com', '09111234567', 'Bacoor, Philippines', '$2b$10$sample_hash_11', 'active', NOW()),
('Elena', 'Ramos', 'elena_ramos', 'elena@example.com', '09112345678', 'Muntinlupa, Philippines', '$2b$10$sample_hash_12', 'active', NOW()),
('Ricardo', 'Jimenez', 'ricardo_j', 'ricardo@example.com', '09113456789', 'Paranaque, Philippines', '$2b$10$sample_hash_13', 'active', NOW()),
('Lucia', 'Flores', 'lucia_f', 'lucia@example.com', '09114567890', 'Cavite City, Philippines', '$2b$10$sample_hash_14', 'active', NOW()),
('Antonio', 'Silva', 'antonio_s', 'antonio@example.com', '09115678901', 'Batangas City, Philippines', '$2b$10$sample_hash_15', 'active', NOW()),

-- Service Providers (16-30)
('John', 'Santos', 'john_santos', 'john.santos@example.com', '09201234567', 'Manila, Philippines', '$2b$10$sample_hash_16', 'active', NOW()),
('Patricia', 'Ng', 'patricia_ng', 'patricia@example.com', '09202345678', 'Quezon City, Philippines', '$2b$10$sample_hash_17', 'active', NOW()),
('Robert', 'Aquino', 'robert_a', 'robert@example.com', '09203456789', 'Makati, Philippines', '$2b$10$sample_hash_18', 'active', NOW()),
('Grace', 'Villanueva', 'grace_v', 'grace@example.com', '09204567890', 'Cebu City, Philippines', '$2b$10$sample_hash_19', 'active', NOW()),
('Michael', 'Ortega', 'michael_o', 'michael@example.com', '09205678901', 'Davao City, Philippines', '$2b$10$sample_hash_20', 'active', NOW()),
('Angela', 'Cabrera', 'angela_c', 'angela@example.com', '09206789012', 'Caloocan, Philippines', '$2b$10$sample_hash_21', 'active', NOW()),
('Vincent', 'Palacio', 'vincent_p', 'vincent@example.com', '09207890123', 'Pasig City, Philippines', '$2b$10$sample_hash_22', 'active', NOW()),
('Beatrice', 'Reyes', 'beatrice_r', 'beatrice@example.com', '09208901234', 'Las Piñas, Philippines', '$2b$10$sample_hash_23', 'active', NOW()),
('Marco', 'Santiago', 'marco_s', 'marco@example.com', '09209012345', 'Antipolo, Philippines', '$2b$10$sample_hash_24', 'active', NOW()),
('Diane', 'Medina', 'diane_m', 'diane@example.com', '09210123456', 'San Juan, Philippines', '$2b$10$sample_hash_25', 'active', NOW()),
('Steven', 'Navarro', 'steven_n', 'steven@example.com', '09211234567', 'Bacoor, Philippines', '$2b$10$sample_hash_26', 'active', NOW()),
('Christine', 'Figueroa', 'christine_f', 'christine@example.com', '09212345678', 'Muntinlupa, Philippines', '$2b$10$sample_hash_27', 'active', NOW()),
('Edward', 'Herrera', 'edward_h', 'edward@example.com', '09213456789', 'Paranaque, Philippines', '$2b$10$sample_hash_28', 'active', NOW()),
('Michelle', 'Mendoza', 'michelle_m', 'michelle@example.com', '09214567890', 'Cavite City, Philippines', '$2b$10$sample_hash_29', 'active', NOW()),
('David', 'Valdez', 'david_v', 'david@example.com', '09215678901', 'Batangas City, Philippines', '$2b$10$sample_hash_30', 'active', NOW());


-- ========================================
-- 3. USER_ROLE (Assign roles to users)
-- ========================================
-- Clients get USER role (user_id 1-15)
INSERT INTO user_role (user_id, role_id) VALUES
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1),
(6, 1), (7, 1), (8, 1), (9, 1), (10, 1),
(11, 1), (12, 1), (13, 1), (14, 1), (15, 1),

-- Providers get USER and PROVIDER roles (user_id 16-30)
(16, 1), (16, 3),
(17, 1), (17, 3),
(18, 1), (18, 3),
(19, 1), (19, 3),
(20, 1), (20, 3),
(21, 1), (21, 3),
(22, 1), (22, 3),
(23, 1), (23, 3),
(24, 1), (24, 3),
(25, 1), (25, 3),
(26, 1), (26, 3),
(27, 1), (27, 3),
(28, 1), (28, 3),
(29, 1), (29, 3),
(30, 1), (30, 3);


-- ========================================
-- 4. PROVIDER_PROFILE (15 providers)
-- ========================================
INSERT INTO provider_profile (provider_id, is_provider_active, display_name, bio, profile_photo_url, verification_status) VALUES
(16, 1, 'John\'s Plumbing Services', 'Professional plumber with 10 years experience', 'https://example.com/photos/john.jpg', 'verified'),
(17, 1, 'Patricia\'s Cleaning', 'Reliable and thorough cleaning services', 'https://example.com/photos/patricia.jpg', 'verified'),
(18, 1, 'Robert\'s Electrical Works', 'Licensed electrician for residential & commercial', 'https://example.com/photos/robert.jpg', 'verified'),
(19, 1, 'Grace Home Services', 'Painting, repair, and maintenance specialist', 'https://example.com/photos/grace.jpg', 'pending'),
(20, 1, 'Michael\'s Carpentry', 'Custom furniture and woodwork services', 'https://example.com/photos/michael.jpg', 'verified'),
(21, 1, 'Angela Personal Training', 'Certified fitness instructor and personal trainer', 'https://example.com/photos/angela.jpg', 'verified'),
(22, 1, 'Vincent Tech Support', 'Computer and gadget repair specialist', 'https://example.com/photos/vincent.jpg', 'verified'),
(23, 1, 'Beatrice Salon Services', 'Professional hair and makeup stylist', 'https://example.com/photos/beatrice.jpg', 'verified'),
(24, 1, 'Marco Landscaping', 'Garden design and maintenance expert', 'https://example.com/photos/marco.jpg', 'pending'),
(25, 1, 'Diane Tutoring Center', 'Math and science tutoring for students', 'https://example.com/photos/diane.jpg', 'verified'),
(26, 1, 'Steven HVAC Expert', 'Air conditioning and heating system specialist', 'https://example.com/photos/steven.jpg', 'verified'),
(27, 1, 'Christine Photography', 'Professional event and portrait photography', 'https://example.com/photos/christine.jpg', 'verified'),
(28, 1, 'Edward Plumbing Plus', 'Plumbing, heating, and water system services', 'https://example.com/photos/edward.jpg', 'verified'),
(29, 1, 'Michelle Pet Care', 'Dog grooming and pet sitting services', 'https://example.com/photos/michelle.jpg', 'pending'),
(30, 1, 'David Locksmith Services', 'Professional locksmith and security services', 'https://example.com/photos/david.jpg', 'verified');


-- ========================================
-- 5. ADDRESS (25 total: 15 client addresses + 10 service addresses)
-- ========================================
-- Client addresses (user_id 1-15)
INSERT INTO address (user_id, label, line1, line2, barangay, city, province_region, postal_code, latitude, longitude, is_default) VALUES
(1, 'Home', '123 Main St', 'Apt 4', 'San Rafael', 'Manila', 'NCR', '1010', 14.5994, 120.9842, 1),
(2, 'Home', '456 Oak Ave', NULL, 'Tatalon', 'Quezon City', 'NCR', '1100', 14.7316, 121.0437, 1),
(3, 'Work', '789 Business Park', 'Unit 500', 'Malinao', 'Makati', 'NCR', '1219', 14.5547, 121.0244, 1),
(4, 'Home', '321 Coral Road', NULL, 'Lahug', 'Cebu City', 'Central Visayas', '6000', 10.3157, 123.8854, 1),
(5, 'Home', '654 Palm Street', 'Unit 2', 'Pampanga', 'Davao City', 'Mindanao', '8000', 7.1108, 125.6423, 1),
(6, 'Home', '987 Pine Lane', NULL, 'Camarin', 'Caloocan', 'NCR', '1400', 14.6297, 121.0514, 1),
(7, 'Home', '147 Birch Ave', 'House 5', 'Santolan', 'Pasig City', 'NCR', '1605', 14.5765, 121.5714, 1),
(8, 'Work', '258 Maple Dr', 'Building A', 'Taguig', 'Las Piñas', 'NCR', '1740', 14.3520, 120.9842, 1),
(9, 'Home', '369 Cedar St', NULL, 'San Luis', 'Antipolo', 'CALABARZON', '1870', 14.5880, 121.1758, 1),
(10, 'Home', '741 Spruce Lane', 'Unit 3', 'Sampalocan', 'San Juan', 'NCR', '1500', 14.5539, 121.1283, 1),
(11, 'Home', '852 Walnut Rd', NULL, 'Kawit', 'Bacoor', 'CALABARZON', '4102', 14.3644, 120.8948, 1),
(12, 'Home', '963 Elm St', 'Block 2', 'Sucat', 'Muntinlupa', 'NCR', '1780', 14.3801, 121.0286, 1),
(13, 'Work', '159 Oak Park', 'Suite 200', 'Barangka', 'Paranaque', 'NCR', '1700', 14.3529, 121.0160, 1),
(14, 'Home', '753 Ash Avenue', NULL, 'Bating', 'Cavite City', 'CALABARZON', '4100', 14.4761, 120.8947, 1),
(15, 'Home', '486 Fir Road', 'House 8', 'Kinalaki', 'Batangas City', 'CALABARZON', '4200', 13.7597, 121.1847, 1);


-- ========================================
-- 6. SERVICE_CATEGORY (6 main categories)
-- ========================================
INSERT INTO service_category (parent_category_id, name, description, sort_order, is_active) VALUES
(NULL, 'Home Services', 'Services related to home maintenance and repair', 1, 1),
(NULL, 'Personal Services', 'Individual personal care and wellness services', 2, 1),
(NULL, 'Technical Services', 'Technology and technical support services', 3, 1),
(NULL, 'Professional Services', 'Business and professional services', 4, 1),
(NULL, 'Beauty & Wellness', 'Hair, makeup, and wellness services', 5, 1),
(NULL, 'Pet Services', 'Pet care and grooming services', 6, 1);


-- ========================================
-- 7. SERVICE (22 services across categories)
-- ========================================
INSERT INTO service (category_id, name, description, is_active) VALUES
-- Home Services (category_id = 1)
(1, 'Plumbing', 'Plumbing repairs, installations, and maintenance', 1),
(1, 'Electrical Work', 'Electrical repairs and installations', 1),
(1, 'Painting', 'Interior and exterior painting services', 1),
(1, 'Carpentry', 'Custom woodwork and carpentry services', 1),
(1, 'HVAC Maintenance', 'Air conditioning and heating system service', 1),
(1, 'Locksmith Services', 'Lock repair, replacement, and installation', 1),

-- Personal Services (category_id = 2)
(2, 'Personal Training', 'Fitness coaching and personal training', 1),
(2, 'Tutoring', 'Academic tutoring and educational support', 1),
(2, 'Home Cleaning', 'Residential cleaning services', 1),

-- Technical Services (category_id = 3)
(3, 'Computer Repair', 'Desktop and laptop repair and maintenance', 1),
(3, 'Gadget Repair', 'Mobile phone and gadget repair services', 1),
(3, 'IT Support', 'Technical support and troubleshooting', 1),

-- Professional Services (category_id = 4)
(4, 'Photography', 'Professional photography for events and portraits', 1),
(4, 'Landscaping', 'Garden design and landscape maintenance', 1),
(4, 'Consulting', 'Professional consulting services', 1),

-- Beauty & Wellness (category_id = 5)
(5, 'Hair Styling', 'Professional hair cutting and styling', 1),
(5, 'Makeup Services', 'Professional makeup application', 1),
(5, 'Massage Therapy', 'Professional massage and therapy services', 1),

-- Pet Services (category_id = 6)
(6, 'Dog Grooming', 'Professional dog grooming and styling', 1),
(6, 'Pet Sitting', 'Pet care and sitting services', 1),
(6, 'Pet Training', 'Dog training and behavioral coaching', 1);


-- ========================================
-- 8. PROVIDER_SERVICE (30 provider-service relationships)
-- ========================================
INSERT INTO provider_service (provider_id, service_id, pricing_type, rate_amount, rate_currency, is_service_visible, provider_notes) VALUES
-- John Santos (provider_id 16) - Plumbing
(16, 1, 'hourly', 500.00, 'PHP', 1, 'Emergency service available 24/7'),

-- Patricia Ng (provider_id 17) - Home Cleaning
(17, 9, 'fixed', 1500.00, 'PHP', 1, 'Eco-friendly cleaning products used'),

-- Robert Aquino (provider_id 18) - Electrical Work
(18, 2, 'hourly', 600.00, 'PHP', 1, 'Licensed and insured electrician'),

-- Grace Villanueva (provider_id 19) - Painting
(19, 3, 'fixed', 3500.00, 'PHP', 1, 'High quality paint and professional finish'),

-- Michael Ortega (provider_id 20) - Carpentry
(20, 4, 'hourly', 700.00, 'PHP', 1, 'Custom designs available'),

-- Angela Cabrera (provider_id 21) - Personal Training
(21, 7, 'hourly', 800.00, 'PHP', 1, 'Certified fitness instructor'),

-- Vincent Palacio (provider_id 22) - Computer Repair
(22, 10, 'fixed', 1000.00, 'PHP', 1, 'Quick turnaround time guaranteed'),

-- Beatrice Reyes (provider_id 23) - Hair Styling
(23, 16, 'fixed', 800.00, 'PHP', 1, 'Latest hair trends and techniques'),

-- Marco Santiago (provider_id 24) - Landscaping
(24, 14, 'quote', NULL, 'PHP', 1, 'Custom landscape design services'),

-- Diane Medina (provider_id 25) - Tutoring
(25, 8, 'hourly', 400.00, 'PHP', 1, 'Math and science specialist'),

-- Steven Navarro (provider_id 26) - HVAC Maintenance
(26, 5, 'hourly', 550.00, 'PHP', 1, 'Regular maintenance packages available'),

-- Christine Figueroa (provider_id 27) - Photography
(27, 13, 'fixed', 5000.00, 'PHP', 1, 'Professional wedding and event photography'),

-- Edward Herrera (provider_id 28) - Plumbing
(28, 1, 'hourly', 520.00, 'PHP', 1, 'Same-day emergency service available'),

-- Michelle Mendoza (provider_id 29) - Pet Sitting & Grooming
(29, 18, 'fixed', 400.00, 'PHP', 1, 'Certified pet care professional'),

-- David Valdez (provider_id 30) - Locksmith Services
(30, 6, 'hourly', 480.00, 'PHP', 1, 'Licensed locksmith with years of experience'),

-- Multiple services per provider
(16, 5, 'hourly', 450.00, 'PHP', 1, 'HVAC and plumbing combo'),
(17, 12, 'hourly', 350.00, 'PHP', 1, 'IT support for small businesses'),
(18, 3, 'hourly', 650.00, 'PHP', 1, 'Electrical and painting package'),
(19, 15, 'fixed', 1200.00, 'PHP', 1, 'Makeup for events'),
(20, 4, 'fixed', 2500.00, 'PHP', 1, 'Small furniture projects'),
(21, 7, 'fixed', 3000.00, 'PHP', 1, 'Monthly training package'),
(22, 11, 'fixed', 1500.00, 'PHP', 1, 'Gadget screen replacement'),
(23, 17, 'fixed', 600.00, 'PHP', 1, 'Makeup application services'),
(24, 14, 'quote', NULL, 'PHP', 1, 'Garden maintenance contracts'),
(25, 8, 'fixed', 1200.00, 'PHP', 1, 'Group tutoring sessions'),
(26, 5, 'fixed', 2000.00, 'PHP', 1, 'Annual HVAC inspection'),
(27, 13, 'hourly', 2000.00, 'PHP', 1, 'Hourly event photography'),
(28, 5, 'hourly', 500.00, 'PHP', 1, 'Heating system maintenance'),
(29, 19, 'fixed', 350.00, 'PHP', 1, 'Dog training sessions'),
(30, 6, 'fixed', 800.00, 'PHP', 1, 'Emergency lockout services');


-- ========================================
-- 9. PAYMENT_METHOD (5 methods)
-- ========================================
INSERT INTO payment_method (code, display_name, is_active) VALUES
('GCASH', 'GCash', 1),
('PAYMAYA', 'PayMaya', 1),
('CARD', 'Credit/Debit Card', 1),
('BANK', 'Bank Transfer', 1),
('COD', 'Cash on Delivery', 1);


-- ========================================
-- 10. BOOKING (20 bookings with various statuses)
-- ========================================
INSERT INTO booking (client_user_id, provider_service_id, service_address_id, scheduled_start_at, scheduled_end_at, status, client_notes, provider_notes) VALUES
-- Recent bookings
(1, 1, 1, '2026-02-20 09:00:00', '2026-02-20 11:00:00', 'accepted', 'Leaking kitchen faucet', 'I can fix this quickly'),
(2, 2, 2, '2026-02-21 10:00:00', '2026-02-21 12:00:00', 'completed', 'Weekly cleaning needed', 'Apartment was clean and organized'),
(3, 3, 3, '2026-02-18 14:00:00', '2026-02-18 16:00:00', 'completed', 'Bathroom painting', 'Color: Light blue'),
(4, 4, 4, '2026-02-22 08:00:00', NULL, 'requested', 'Install shelving unit', NULL),
(5, 5, 5, '2026-02-25 09:00:00', NULL, 'requested', 'AC maintenance check', NULL),
(6, 6, 6, '2026-02-19 15:00:00', '2026-02-19 17:00:00', 'in_progress', 'Home cleaning needed', 'Will bring own supplies'),
(7, 7, 7, '2026-02-23 06:30:00', '2026-02-23 07:30:00', 'accepted', 'Personal training session', 'First time trainer'),
(8, 8, 8, '2026-02-20 14:00:00', '2026-02-20 15:30:00', 'completed', 'Laptop screen repair', 'Very professional service'),
(9, 9, 9, '2026-02-26 10:00:00', NULL, 'requested', 'Hair styling for event', NULL),
(10, 10, 10, '2026-02-24 15:00:00', NULL, 'declined', 'Math tutoring', 'Provider not available'),
(11, 11, 11, '2026-02-22 16:00:00', '2026-02-22 17:00:00', 'completed', 'Photography session', 'Beautiful photos delivered'),
(12, 12, 12, '2026-02-21 09:00:00', NULL, 'requested', 'Lock replacement', NULL),
(13, 13, 13, '2026-02-27 10:00:00', NULL, 'cancelled', 'Landscaping design', 'Client cancelled due to schedule conflict'),
(14, 14, 14, '2026-02-20 14:00:00', '2026-02-20 15:00:00', 'completed', 'Pet grooming', 'Dog looks great!'),
(15, 15, 15, '2026-02-19 11:00:00', '2026-02-19 12:00:00', 'completed', 'Electrical repair', 'Outlet replacement done'),
(1, 2, 1, '2026-03-01 10:00:00', NULL, 'accepted', 'Monthly deep cleaning', 'Please focus on kitchen area'),
(3, 9, 3, '2026-02-28 09:00:00', NULL, 'requested', 'Computer repair needed', 'Won\'t turn on properly'),
(5, 11, 5, '2026-03-05 14:00:00', NULL, 'requested', 'Phone screen cracked', 'Need quick fix'),
(7, 14, 7, '2026-03-03 10:00:00', NULL, 'accepted', 'Pet sitting for weekend', 'Two cats, instructions provided'),
(9, 1, 9, '2026-03-02 08:00:00', '2026-03-02 10:00:00', 'in_progress', 'Pipe installation', 'New bathroom fixture');


-- ========================================
-- 11. PAYMENT (15 payments for bookings)
-- ========================================
INSERT INTO payment (booking_id, payer_user_id, payment_method_id, amount, currency, status, gateway_provider, gateway_reference, paid_at) VALUES
(1, 1, 1, 1000.00, 'PHP', 'paid', 'GCash', 'GCASH_20260220_001', '2026-02-20 09:05:00'),
(2, 2, 2, 1500.00, 'PHP', 'paid', 'PayMaya', 'PAYMAYA_20260221_001', '2026-02-21 10:10:00'),
(3, 3, 3, 3500.00, 'PHP', 'paid', 'Stripe', 'STRIPE_20260218_001', '2026-02-18 14:15:00'),
(4, 4, 4, 2000.00, 'PHP', 'pending', 'BDO', NULL, NULL),
(5, 5, 1, 2250.00, 'PHP', 'created', NULL, NULL, NULL),
(6, 6, 5, 1500.00, 'PHP', 'paid', 'Cash', 'COD_20260219_001', '2026-02-19 17:00:00'),
(7, 7, 2, 800.00, 'PHP', 'paid', 'PayMaya', 'PAYMAYA_20260223_001', '2026-02-23 06:35:00'),
(8, 8, 1, 1000.00, 'PHP', 'paid', 'GCash', 'GCASH_20260220_002', '2026-02-20 14:20:00'),
(9, 9, 3, 800.00, 'PHP', 'pending', 'BDO', NULL, NULL),
(11, 11, 1, 5000.00, 'PHP', 'paid', 'GCash', 'GCASH_20260222_001', '2026-02-22 16:30:00'),
(12, 12, 2, 800.00, 'PHP', 'pending', NULL, NULL, NULL),
(14, 14, 5, 400.00, 'PHP', 'paid', 'Cash', 'COD_20260220_002', '2026-02-20 15:00:00'),
(15, 15, 1, 520.00, 'PHP', 'paid', 'GCash', 'GCASH_20260219_003', '2026-02-19 11:30:00'),
(16, 1, 2, 1500.00, 'PHP', 'paid', 'PayMaya', 'PAYMAYA_20260301_001', '2026-03-01 10:05:00'),
(20, 9, 1, 1000.00, 'PHP', 'paid', 'GCash', 'GCASH_20260302_001', '2026-03-02 08:10:00');


-- ========================================
-- 12. PAYMENT_EVENT (15 events for payments)
-- ========================================
INSERT INTO payment_event (payment_id, event_type, new_status, raw_payload) VALUES
(1, 'payment_created', 'created', '{"booking_id": 1, "amount": 1000}'),
(1, 'payment_confirmed', 'paid', '{"confirmation_id": "GCASH_20260220_001"}'),
(2, 'payment_created', 'created', '{"booking_id": 2, "amount": 1500}'),
(2, 'payment_confirmed', 'paid', '{"confirmation_id": "PAYMAYA_20260221_001"}'),
(3, 'payment_created', 'created', '{"booking_id": 3, "amount": 3500}'),
(3, 'payment_confirmed', 'paid', '{"confirmation_id": "STRIPE_20260218_001"}'),
(4, 'payment_created', 'created', '{"booking_id": 4, "amount": 2000}'),
(4, 'payment_pending', 'pending', '{"status": "awaiting_confirmation"}'),
(6, 'payment_created', 'created', '{"booking_id": 6, "amount": 1500}'),
(6, 'payment_confirmed', 'paid', '{"method": "cash_on_delivery"}'),
(7, 'payment_created', 'created', '{"booking_id": 7, "amount": 800}'),
(7, 'payment_confirmed', 'paid', '{"confirmation_id": "PAYMAYA_20260223_001"}'),
(8, 'payment_created', 'created', '{"booking_id": 8, "amount": 1000}'),
(8, 'payment_confirmed', 'paid', '{"confirmation_id": "GCASH_20260220_002"}'),
(11, 'payment_created', 'created', '{"booking_id": 11, "amount": 5000}');


-- ========================================
-- 13. REVIEW (12 reviews for completed bookings)
-- ========================================
INSERT INTO review (booking_id, reviewer_user_id, provider_user_id, rating, comment) VALUES
(2, 2, 17, 5, 'Patricia did an excellent job cleaning. Very professional and thorough. Highly recommended!'),
(3, 3, 19, 5, 'Great painting work. The finish is perfect and color came out exactly as expected.'),
(8, 8, 22, 4, 'Quick repair service. Vincent was professional and the laptop works perfectly now.'),
(11, 11, 27, 5, 'Christine\'s photography is amazing! All photos came out beautiful and professionally edited.'),
(14, 14, 29, 5, 'Michelle takes great care of pets. My dog looks and feels great after grooming.'),
(15, 15, 18, 4, 'Robert fixed the electrical issue quickly and safely. Professional service.'),
(2, 2, 17, 5, 'Outstanding service as always. Patricia is my go-to cleaning professional.'),
(6, 6, 17, 4, 'Good cleaning service. Apartment is spotless. Will book again.'),
(7, 7, 21, 5, 'Angela is an excellent trainer. I can already feel the improvement in my fitness.'),
(8, 8, 22, 5, 'Very knowledgeable and fixed the issue quickly. Great customer service!'),
(11, 11, 27, 4, 'Professional photographer. Loved the photos and the editing style.'),
(14, 14, 29, 5, 'Best pet grooming service in the area. My dog is always happy after visiting.');

-- ========================================
-- END OF SAMPLE DATA
-- ========================================
-- Total entries: 
-- Users: 30
-- User Roles: 45
-- Roles: 3
-- Provider Profiles: 15
-- Addresses: 15
-- Service Categories: 6
-- Services: 22
-- Provider Services: 30
-- Payment Methods: 5
-- Bookings: 20
-- Payments: 15
-- Payment Events: 15
-- Reviews: 12
-- TOTAL: 233 sample data entries across all tables
