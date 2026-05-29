-- Migration 006: Add conversation and message tables; extend notification for messaging

CREATE TABLE IF NOT EXISTS conversation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    provider_id INT NOT NULL,
    provider_service_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversation_client
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_provider
        FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_provider_service
        FOREIGN KEY (provider_service_id) REFERENCES provider_service(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_message_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_sender
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

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
    'reply_received'
  ) NOT NULL,
  ADD COLUMN related_entity_type VARCHAR(100) NULL AFTER message,
  ADD COLUMN related_entity_id INT NULL AFTER related_entity_type;

CREATE INDEX idx_conversation_client_id ON conversation(client_id);

CREATE INDEX idx_conversation_provider_id ON conversation(provider_id);

CREATE INDEX idx_message_conversation_id ON message(conversation_id);

CREATE INDEX idx_message_sender_id ON message(sender_id)
