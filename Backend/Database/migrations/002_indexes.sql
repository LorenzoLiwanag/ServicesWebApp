-- Migration 002: Performance indexes

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users(email);

CREATE INDEX IF NOT EXISTS idx_provider_service_provider_id
    ON provider_service(provider_id);

CREATE INDEX IF NOT EXISTS idx_provider_service_category_id
    ON provider_service(category_id);

CREATE INDEX IF NOT EXISTS idx_provider_service_visible_deleted
    ON provider_service(is_visible, is_deleted);

CREATE INDEX IF NOT EXISTS idx_provider_service_title
    ON provider_service(title);

CREATE INDEX IF NOT EXISTS idx_booking_client_id
    ON booking_request(client_id);

CREATE INDEX IF NOT EXISTS idx_booking_provider_id
    ON booking_request(provider_id);

CREATE INDEX IF NOT EXISTS idx_booking_status
    ON booking_request(status);

CREATE INDEX IF NOT EXISTS idx_booking_provider_service_id
    ON booking_request(provider_service_id);

CREATE INDEX IF NOT EXISTS idx_notification_user_id
    ON notification(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_is_read
    ON notification(is_read);
