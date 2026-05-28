-- Migration 005: Add approval status to provider_service and expand notification types

ALTER TABLE provider_service
  ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' AFTER is_deleted,
  ADD COLUMN approved_at TIMESTAMP NULL AFTER approval_status,
  ADD COLUMN approved_by INT NULL AFTER approved_at,
  ADD CONSTRAINT fk_provider_service_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

UPDATE provider_service SET approval_status = 'approved' WHERE approval_status = 'pending';

ALTER TABLE notification
  MODIFY COLUMN type ENUM(
    'booking_created',
    'booking_accepted',
    'booking_declined',
    'booking_cancelled',
    'booking_completed',
    'provider_job_pending',
    'provider_job_upcoming',
    'system_message',
    'service_pending_approval',
    'service_approved'
  ) NOT NULL;
