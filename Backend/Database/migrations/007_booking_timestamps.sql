-- Migration 007: Add status timestamp columns to booking_request
-- Tracks when each status transition occurred, as specified in the Booking Services PRD.

ALTER TABLE booking_request
  ADD COLUMN accepted_at  TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN declined_at  TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL;
