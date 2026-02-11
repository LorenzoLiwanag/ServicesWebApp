-- MySQL 8+ (InnoDB)
-- Recommended default charset/collation
-- (You can also set these at the database level.)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- -------------------------
-- USERS
-- -------------------------
CREATE TABLE users (
  user_id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  username          VARCHAR(50)  NOT NULL,
  email             VARCHAR(255) NOT NULL,
  phone_number      VARCHAR(30)  NULL,
  address_text      VARCHAR(255) NULL,
  password_hash     VARCHAR(255) NOT NULL,
  status            ENUM('active','suspended','banned','deleted') NOT NULL DEFAULT 'active',
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at     DATETIME NULL,

  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- ROLE
-- -------------------------
CREATE TABLE role (
  role_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code        VARCHAR(30)  NOT NULL,   -- USER, ADMIN
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,

  PRIMARY KEY (role_id),
  UNIQUE KEY uq_role_code (code),
  KEY idx_role_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- USER_ROLE (M:N)
-- -------------------------
CREATE TABLE user_role (
  user_id     BIGINT UNSIGNED NOT NULL,
  role_id     INT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, role_id),
  KEY idx_user_role_role_id (role_id),

  CONSTRAINT fk_user_role_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_user_role_role
    FOREIGN KEY (role_id) REFERENCES role(role_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- PROVIDER_PROFILE (1:0..1 from users)
-- provider_id is also the user_id
-- -------------------------
CREATE TABLE provider_profile (
  provider_id           BIGINT UNSIGNED NOT NULL,
  is_provider_active    TINYINT(1) NOT NULL DEFAULT 0,
  display_name          VARCHAR(150) NOT NULL,
  bio                   TEXT NULL,
  profile_photo_url     VARCHAR(2048) NULL,
  verification_status   VARCHAR(50) NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (provider_id),

  CONSTRAINT fk_provider_profile_user
    FOREIGN KEY (provider_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  KEY idx_provider_profile_active (is_provider_active),
  KEY idx_provider_profile_verification (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- ADDRESS
-- user_id nullable (guest/one-off)
-- -------------------------
CREATE TABLE address (
  address_id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           BIGINT UNSIGNED NULL,
  label             VARCHAR(20) NOT NULL, -- Home/Work/Other
  line1             VARCHAR(255) NOT NULL,
  line2             VARCHAR(255) NULL,
  barangay          VARCHAR(120) NULL,
  city              VARCHAR(120) NOT NULL,
  province_region   VARCHAR(120) NULL,
  postal_code       VARCHAR(20) NULL,
  latitude          DECIMAL(10,7) NULL,
  longitude         DECIMAL(10,7) NULL,
  is_default        TINYINT(1) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (address_id),
  KEY idx_address_user_id (user_id),
  KEY idx_address_city (city),

  CONSTRAINT fk_address_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- SERVICE_CATEGORY (self-reference)
-- -------------------------
CREATE TABLE service_category (
  category_id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_category_id  BIGINT UNSIGNED NULL,
  name                VARCHAR(150) NOT NULL,
  description         TEXT NULL,
  sort_order          INT NULL,
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (category_id),
  KEY idx_service_category_parent (parent_category_id),
  KEY idx_service_category_active (is_active),
  KEY idx_service_category_sort (sort_order),

  CONSTRAINT fk_service_category_parent
    FOREIGN KEY (parent_category_id) REFERENCES service_category(category_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- SERVICE
-- -------------------------
CREATE TABLE service (
  service_id     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id    BIGINT UNSIGNED NOT NULL,
  name           VARCHAR(150) NOT NULL,
  description    TEXT NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (service_id),
  KEY idx_service_category_id (category_id),
  KEY idx_service_active (is_active),

  CONSTRAINT fk_service_category
    FOREIGN KEY (category_id) REFERENCES service_category(category_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- PROVIDER_SERVICE
-- -------------------------
CREATE TABLE provider_service (
  provider_service_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_id           BIGINT UNSIGNED NOT NULL,
  service_id            BIGINT UNSIGNED NOT NULL,
  pricing_type          ENUM('fixed','hourly','quote') NOT NULL,
  rate_amount           DECIMAL(12,2) NULL,
  rate_currency         CHAR(3) NOT NULL DEFAULT 'PHP',
  is_service_visible    TINYINT(1) NOT NULL DEFAULT 1,
  provider_notes        TEXT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (provider_service_id),
  UNIQUE KEY uq_provider_service_pair (provider_id, service_id),
  KEY idx_provider_service_provider (provider_id),
  KEY idx_provider_service_service (service_id),
  KEY idx_provider_service_visible (is_service_visible),

  CONSTRAINT fk_provider_service_provider
    FOREIGN KEY (provider_id) REFERENCES provider_profile(provider_id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_provider_service_service
    FOREIGN KEY (service_id) REFERENCES service(service_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- BOOKING
-- -------------------------
CREATE TABLE booking (
  booking_id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_user_id        BIGINT UNSIGNED NOT NULL,
  provider_service_id   BIGINT UNSIGNED NOT NULL,
  service_address_id    BIGINT UNSIGNED NOT NULL,
  scheduled_start_at    DATETIME NOT NULL,
  scheduled_end_at      DATETIME NULL,
  status                ENUM('requested','accepted','declined','cancelled','in_progress','completed')
                        NOT NULL DEFAULT 'requested',
  client_notes          TEXT NULL,
  provider_notes        TEXT NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (booking_id),
  KEY idx_booking_client_user (client_user_id),
  KEY idx_booking_provider_service (provider_service_id),
  KEY idx_booking_address (service_address_id),
  KEY idx_booking_status (status),
  KEY idx_booking_scheduled_start (scheduled_start_at),

  CONSTRAINT fk_booking_client_user
    FOREIGN KEY (client_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_booking_provider_service
    FOREIGN KEY (provider_service_id) REFERENCES provider_service(provider_service_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_booking_address
    FOREIGN KEY (service_address_id) REFERENCES address(address_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- PAYMENT_METHOD
-- -------------------------
CREATE TABLE payment_method (
  payment_method_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code               VARCHAR(30) NOT NULL,  -- GCASH, PAYMAYA, CARD, BANK, COD
  display_name       VARCHAR(100) NOT NULL,
  is_active          TINYINT(1) NOT NULL DEFAULT 1,

  PRIMARY KEY (payment_method_id),
  UNIQUE KEY uq_payment_method_code (code),
  KEY idx_payment_method_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- PAYMENT
-- -------------------------
CREATE TABLE payment (
  payment_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id          BIGINT UNSIGNED NOT NULL,
  payer_user_id       BIGINT UNSIGNED NOT NULL,
  payment_method_id   INT UNSIGNED NOT NULL,
  amount              DECIMAL(12,2) NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'PHP',
  status              ENUM('created','pending','paid','failed','cancelled','refunded')
                      NOT NULL DEFAULT 'created',
  gateway_provider    VARCHAR(80) NULL,
  gateway_reference   VARCHAR(120) NULL,
  checkout_url        VARCHAR(2048) NULL,
  paid_at             DATETIME NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (payment_id),
  KEY idx_payment_booking (booking_id),
  KEY idx_payment_payer (payer_user_id),
  KEY idx_payment_method (payment_method_id),
  KEY idx_payment_status (status),
  KEY idx_payment_paid_at (paid_at),

  CONSTRAINT fk_payment_booking
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_payment_payer
    FOREIGN KEY (payer_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_payment_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(payment_method_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- PAYMENT_EVENT
-- -------------------------
CREATE TABLE payment_event (
  payment_event_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id         BIGINT UNSIGNED NOT NULL,
  event_type         VARCHAR(60) NOT NULL,
  new_status         VARCHAR(30) NULL,
  raw_payload        TEXT NULL,
  received_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (payment_event_id),
  KEY idx_payment_event_payment (payment_id),
  KEY idx_payment_event_received (received_at),

  CONSTRAINT fk_payment_event_payment
    FOREIGN KEY (payment_id) REFERENCES payment(payment_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- -------------------------
-- REVIEW (1:0..1 per booking)
-- -------------------------
CREATE TABLE review (
  review_id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id         BIGINT UNSIGNED NOT NULL,
  reviewer_user_id   BIGINT UNSIGNED NOT NULL,  -- client
  provider_user_id   BIGINT UNSIGNED NOT NULL,  -- provider (user_id)
  rating             TINYINT UNSIGNED NOT NULL,
  comment            TEXT NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (review_id),
  UNIQUE KEY uq_review_booking (booking_id),
  KEY idx_review_reviewer (reviewer_user_id),
  KEY idx_review_provider (provider_user_id),
  KEY idx_review_rating (rating),

  CONSTRAINT fk_review_booking
    FOREIGN KEY (booking_id) REFERENCES booking(booking_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_review_reviewer
    FOREIGN KEY (reviewer_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_review_provider_user
    FOREIGN KEY (provider_user_id) REFERENCES users(user_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT chk_review_rating
    CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
