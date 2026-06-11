-- Migration 001: Initial PRD schema
-- Creates all core tables for the Services Web App marketplace.

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(30),
    profile_photo_url VARCHAR(500),
    role ENUM('client', 'admin') DEFAULT 'client',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_profile (
    provider_id INT PRIMARY KEY,
    display_name VARCHAR(150) NOT NULL,
    bio TEXT,
    profile_photo_url VARCHAR(500),
    is_provider_active BOOLEAN DEFAULT TRUE,
    verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified',
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_provider_profile_user
        FOREIGN KEY (provider_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS service_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_category_id INT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_service_category_parent
        FOREIGN KEY (parent_category_id) REFERENCES service_category(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS provider_service (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider_id INT NOT NULL,
    category_id INT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    pricing_type ENUM('fixed', 'hourly', 'quote') DEFAULT 'quote',
    price_amount DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'PHP',
    service_location_type ENUM('client_home', 'provider_location', 'remote', 'flexible') DEFAULT 'client_home',
    is_visible BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_provider_service_provider
        FOREIGN KEY (provider_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_provider_service_category
        FOREIGN KEY (category_id) REFERENCES service_category(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS booking_request (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    provider_id INT NOT NULL,
    provider_service_id INT NOT NULL,
    requested_date DATE,
    requested_time TIME,
    scheduled_start DATETIME,
    scheduled_end DATETIME,
    client_message TEXT,
    provider_response_message TEXT,
    status ENUM('pending', 'accepted', 'declined', 'cancelled', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_client
        FOREIGN KEY (client_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_booking_provider
        FOREIGN KEY (provider_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_booking_provider_service
        FOREIGN KEY (provider_service_id) REFERENCES provider_service(id)
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    booking_request_id INT NULL,
    type ENUM(
        'booking_created',
        'booking_accepted',
        'booking_declined',
        'booking_cancelled',
        'booking_completed',
        'provider_job_pending',
        'provider_job_upcoming',
        'system_message'
    ) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_notification_booking
        FOREIGN KEY (booking_request_id) REFERENCES booking_request(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS contact_inquiry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('new', 'read', 'resolved', 'archived') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
