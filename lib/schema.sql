-- Run this once against your Neon database to set up the schema.
-- psql $DATABASE_URL -f lib/schema.sql
-- OR paste into the Neon SQL Editor.

CREATE TABLE IF NOT EXISTS elections (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  start_date  TIMESTAMP    NOT NULL,
  end_date    TIMESTAMP    NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'draft', -- draft | active | closed
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
  id          SERIAL PRIMARY KEY,
  election_id INTEGER      NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  max_votes   INTEGER      NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
  id          SERIAL PRIMARY KEY,
  position_id INTEGER      NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  class_name  VARCHAR(50),
  bio         TEXT,
  photo_url   TEXT,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id          SERIAL PRIMARY KEY,
  student_id  VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  class_name  VARCHAR(50),
  pin_hash    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voter_records (
  id          SERIAL PRIMARY KEY,
  election_id INTEGER      NOT NULL REFERENCES elections(id),
  student_id  INTEGER      NOT NULL REFERENCES students(id),
  voted_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  UNIQUE (election_id, student_id)
);

CREATE TABLE IF NOT EXISTS votes (
  id           SERIAL PRIMARY KEY,
  election_id  INTEGER      NOT NULL REFERENCES elections(id),
  position_id  INTEGER      NOT NULL REFERENCES positions(id),
  candidate_id INTEGER      NOT NULL REFERENCES candidates(id),
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
  -- Deliberately NOT linked to student to preserve anonymity.
  -- Voter participation is tracked separately in voter_records.
);
