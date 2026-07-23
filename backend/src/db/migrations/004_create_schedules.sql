CREATE TABLE schedules (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES teams (id),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100 AND btrim(title) <> ''),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL CHECK (end_at > start_at),
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'member')),
  target_member_id BIGINT REFERENCES users (id),
  created_by BIGINT NOT NULL REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (target_type = 'member' AND target_member_id IS NOT NULL) OR
    (target_type = 'all' AND target_member_id IS NULL)
  )
);

CREATE INDEX idx_schedules_team_id ON schedules (team_id);
