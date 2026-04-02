-- VoteSecure — Full Database Schema
-- Paste this entire file into your Neon SQL Editor and Run it once.
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT).

CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS elections (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  description TEXT,
  start_date  TIMESTAMP     NOT NULL,
  end_date    TIMESTAMP     NOT NULL,
  status      VARCHAR(20)   NOT NULL DEFAULT 'draft',
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS positions (
  id          SERIAL PRIMARY KEY,
  election_id INTEGER       NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  title       VARCHAR(255)  NOT NULL,
  max_votes   INTEGER       NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
  id          SERIAL PRIMARY KEY,
  position_id INTEGER       NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  name        VARCHAR(255)  NOT NULL,
  class_name  VARCHAR(50),
  bio         TEXT,
  photo_url   TEXT,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id          SERIAL PRIMARY KEY,
  student_id  VARCHAR(50)   NOT NULL UNIQUE,
  name        VARCHAR(255)  NOT NULL,
  class_name  VARCHAR(50),
  pin_hash    VARCHAR(255)  NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Tracks WHO voted (not what they chose) — prevents double voting
CREATE TABLE IF NOT EXISTS voter_records (
  id          SERIAL PRIMARY KEY,
  election_id INTEGER       NOT NULL REFERENCES elections(id),
  student_id  INTEGER       NOT NULL REFERENCES students(id),
  voted_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE (election_id, student_id)
);

-- Anonymous votes — deliberately NOT linked to a student
CREATE TABLE IF NOT EXISTS votes (
  id           SERIAL PRIMARY KEY,
  election_id  INTEGER      NOT NULL REFERENCES elections(id),
  position_id  INTEGER      NOT NULL REFERENCES positions(id),
  candidate_id INTEGER      NOT NULL REFERENCES candidates(id),
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Default admin: username=admin  password=admin123
-- Hash generated with bcrypt rounds=10
INSERT INTO admins (username, password_hash)
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON CONFLICT (username) DO NOTHING;
