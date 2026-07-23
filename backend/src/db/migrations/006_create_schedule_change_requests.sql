CREATE TABLE schedule_change_requests (
  id BIGSERIAL PRIMARY KEY,
  chat_message_id BIGINT NOT NULL REFERENCES chat_messages (id) UNIQUE,
  requested_by BIGINT NOT NULL REFERENCES users (id),
  request_type TEXT NOT NULL CHECK (request_type IN ('create', 'update', 'cancel')),
  target_schedule_id BIGINT REFERENCES schedules (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
