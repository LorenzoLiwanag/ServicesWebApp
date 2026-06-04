-- Migration 009: Add account_approved notification type and password reset tokens table

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
    'account_approved'
  ) NOT NULL;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);
