-- Migration 008: Add soft-delete support for notifications.

ALTER TABLE notification
  ADD COLUMN deleted_at DATETIME NULL AFTER is_read;

CREATE INDEX idx_notification_deleted_at
  ON notification(deleted_at);
