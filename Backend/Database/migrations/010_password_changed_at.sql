-- Migration 010: Add password_changed_at for JWT session invalidation after password change
ALTER TABLE users ADD COLUMN password_changed_at DATETIME NULL DEFAULT NULL;
