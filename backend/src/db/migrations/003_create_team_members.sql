CREATE TABLE team_members (
  id BIGSERIAL PRIMARY KEY,
  team_id BIGINT NOT NULL REFERENCES teams (id),
  user_id BIGINT NOT NULL REFERENCES users (id),
  role TEXT NOT NULL CHECK (role IN ('leader', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE INDEX idx_team_members_team_id ON team_members (team_id);
