CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES teams (id),
  chat_date DATE NOT NULL,
  sender_id BIGINT NOT NULL REFERENCES users (id),
  message_type TEXT NOT NULL CHECK (message_type IN ('general', 'change_request')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_team_id_chat_date ON chat_messages (team_id, chat_date);
