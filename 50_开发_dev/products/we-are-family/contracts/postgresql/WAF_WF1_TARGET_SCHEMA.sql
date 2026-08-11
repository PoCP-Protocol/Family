-- WAF WF1 target schema contract only.
-- Do not apply as a production migration until M3 runtime gate approves WF1-C.

CREATE TABLE waf_topics (
  topic_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE waf_content_items (
  content_item_id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES waf_topics(topic_id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  editorial_status TEXT NOT NULL CHECK (editorial_status IN ('DRAFT', 'REVIEWED', 'PUBLISHED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE waf_challenges (
  challenge_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE waf_challenge_days (
  challenge_day_id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES waf_challenges(challenge_id),
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  avoid_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (challenge_id, day_number)
);

CREATE TABLE waf_participations (
  participation_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL REFERENCES waf_challenges(challenge_id),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'COMPLETED', 'PAUSED')),
  current_day INTEGER NOT NULL CHECK (current_day BETWEEN 1 AND 7),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE waf_action_acceptances (
  acceptance_id TEXT PRIMARY KEY,
  participation_id TEXT NOT NULL REFERENCES waf_participations(participation_id),
  challenge_day_id TEXT NOT NULL REFERENCES waf_challenge_days(challenge_day_id),
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participation_id, challenge_day_id)
);

CREATE TABLE waf_checkins (
  checkin_id TEXT PRIMARY KEY,
  participation_id TEXT NOT NULL REFERENCES waf_participations(participation_id),
  challenge_day_id TEXT NOT NULL REFERENCES waf_challenge_days(challenge_day_id),
  result TEXT NOT NULL CHECK (result IN ('COMPLETED', 'PARTIAL', 'NOT_DONE')),
  note TEXT,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (participation_id, challenge_day_id)
);

CREATE TABLE waf_story_publications (
  story_publication_id TEXT PRIMARY KEY,
  source_family_id TEXT NOT NULL,
  title TEXT NOT NULL,
  anonymized_body TEXT NOT NULL,
  review_status TEXT NOT NULL CHECK (review_status IN ('DRAFT', 'REVIEWED', 'PUBLISHED', 'REJECTED')),
  consent_purpose TEXT NOT NULL CHECK (consent_purpose = 'CONTENT_PUBLICATION'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ProductEvent is shared analytics state, not GrowthEvent.
-- No FK in this contract may target growth_profiles, growth_priorities, growth_actions, or outcomes.
