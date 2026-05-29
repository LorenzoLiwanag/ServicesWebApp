-- Migration 002: Performance indexes

CREATE INDEX idx_users_email
    ON users(email);

CREATE INDEX idx_provider_service_provider_id
    ON provider_service(provider_id);

CREATE INDEX idx_provider_service_category_id
    ON provider_service(category_id);

CREATE INDEX idx_provider_service_visible_deleted
    ON provider_service(is_visible, is_deleted);

CREATE INDEX idx_provider_service_title
    ON provider_service(title);

CREATE INDEX idx_booking_client_id
    ON booking_request(client_id);

CREATE INDEX idx_booking_provider_id
    ON booking_request(provider_id);

CREATE INDEX idx_booking_status
    ON booking_request(status);

CREATE INDEX idx_booking_provider_service_id
    ON booking_request(provider_service_id);

CREATE INDEX idx_notification_user_id
    ON notification(user_id);

CREATE INDEX idx_notification_is_read
    ON notification(is_read);
