-- Migration 013: Payment system (PRD_PAYMENT_SYSTEM_V2.md §8)
-- 50% deposit to the platform's GCash, platform fee kept, rest paid out to the
-- provider after the client confirms the job. Applies to new bookings only.

ALTER TABLE booking_request
  MODIFY COLUMN status ENUM('pending', 'accepted', 'confirmed', 'work_done', 'completed', 'declined', 'cancelled', 'expired') DEFAULT 'pending',
  ADD COLUMN estimated_hours DECIMAL(5,2) NULL,
  ADD COLUMN agreed_total DECIMAL(10,2) NULL,
  ADD COLUMN fee_rate DECIMAL(4,3) NULL,
  ADD COLUMN platform_fee DECIMAL(10,2) NULL,
  ADD COLUMN deposit_amount DECIMAL(10,2) NULL,
  ADD COLUMN deposit_due_at DATETIME NULL,
  ADD COLUMN confirmed_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN work_done_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN expired_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN cancelled_by ENUM('client', 'provider', 'admin') NULL,
  ADD COLUMN refund_due DECIMAL(10,2) NULL,
  ADD COLUMN payout_due DECIMAL(10,2) NULL,
  ADD COLUMN platform_earned DECIMAL(10,2) NULL,
  ADD COLUMN refund_sent_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN payout_sent_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN on_hold BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN hold_reason TEXT NULL,
  ADD COLUMN hold_resolution TEXT NULL,
  ADD COLUMN held_by INT NULL,
  ADD COLUMN held_at TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE provider_profile
  ADD COLUMN gcash_name VARCHAR(150) NULL,
  ADD COLUMN gcash_number VARCHAR(20) NULL,
  ADD COLUMN penalty_balance DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS booking_payment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_request_id INT NOT NULL,
    kind ENUM('deposit', 'refund', 'payout', 'penalty') NOT NULL,
    status ENUM('submitted', 'verified', 'rejected', 'sent') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    gcash_reference VARCHAR(64) NULL,
    gcash_number VARCHAR(20) NULL,
    proof_path VARCHAR(255) NULL,
    note TEXT NULL,
    created_by INT NULL,
    reviewed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT fk_booking_payment_booking
        FOREIGN KEY (booking_request_id) REFERENCES booking_request(id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_payment_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_booking_payment_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_booking_payment_kind_status ON booking_payment(kind, status);

CREATE INDEX idx_booking_payment_reference ON booking_payment(gcash_reference);

CREATE INDEX idx_booking_payment_booking ON booking_payment(booking_request_id);

-- Every feature so far needed a migration just to add a notification type.
ALTER TABLE notification MODIFY COLUMN type VARCHAR(50) NOT NULL;
