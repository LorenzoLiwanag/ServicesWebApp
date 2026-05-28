-- Migration 004: Add approval status fields to users table

ALTER TABLE users
  ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER role,
  ADD COLUMN approved_at TIMESTAMP NULL AFTER approval_status,
  ADD COLUMN approved_by INT NULL AFTER approved_at,
  ADD CONSTRAINT fk_users_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- Approve all users that existed before this approval system was introduced
UPDATE users SET approval_status = 'approved' WHERE approval_status = 'pending';
