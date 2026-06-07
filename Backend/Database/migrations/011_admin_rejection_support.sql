-- Migration 011: Add rejection support for users/services and expand notification types

-- Add rejection_reason to users table
ALTER TABLE users
  ADD COLUMN rejection_reason VARCHAR(500) NULL AFTER approved_by;

-- Add rejection_reason to provider_service table
ALTER TABLE provider_service
  ADD COLUMN rejection_reason VARCHAR(500) NULL AFTER approved_by;

-- Expand notification type ENUM to include admin approval/rejection types
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
    'service_approved',
    'message_received',
    'reply_received',
    'account_approved',
    'account_rejected',
    'service_rejected'
  ) NOT NULL;
