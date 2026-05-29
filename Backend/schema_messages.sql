-- Run this against the Services_Web_App database to enable messaging.

CREATE TABLE IF NOT EXISTS message_thread (
  thread_id     INT          AUTO_INCREMENT PRIMARY KEY,
  participant_a INT          NOT NULL,
  participant_b INT          NOT NULL,
  service_id    INT          NULL,
  booking_id    INT          NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_thread (participant_a, participant_b, service_id, booking_id),
  FOREIGN KEY (participant_a) REFERENCES users (id),
  FOREIGN KEY (participant_b) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS message (
  message_id  INT          AUTO_INCREMENT PRIMARY KEY,
  thread_id   INT          NOT NULL,
  sender_id   INT          NOT NULL,
  body        TEXT         NOT NULL,
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES message_thread (thread_id),
  FOREIGN KEY (sender_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS notification (
  notification_id INT        AUTO_INCREMENT PRIMARY KEY,
  user_id         INT        NOT NULL,
  type            VARCHAR(50) NOT NULL,
  payload         JSON       NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  created_at      DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
