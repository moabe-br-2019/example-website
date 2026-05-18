-- Submissões do formulário de contato (Fase 4).
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  phone       TEXT,
  subject     TEXT,
  message     TEXT    NOT NULL,
  source      TEXT,                                   -- página/origem (ex: "home", "contato")
  ip          TEXT,                                   -- CF-Connecting-IP
  user_agent  TEXT,
  created_at  INTEGER NOT NULL                        -- unix ms
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
  ON contact_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email
  ON contact_submissions (email);

-- Aprovação de projeto pelo cliente (Fase 5).
-- 1 linha = 1 link de aprovação enviado para 1 cliente para 1 projeto.
CREATE TABLE IF NOT EXISTS project_approvals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_slug  TEXT    NOT NULL,                     -- referencia content/projects/<slug>
  client_name   TEXT    NOT NULL,
  client_email  TEXT    NOT NULL,
  token_hash    TEXT    NOT NULL UNIQUE,              -- SHA-256(token) — token cru só vive no link
  status        TEXT    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  comment       TEXT,                                 -- feedback opcional do cliente
  expires_at    INTEGER,                              -- unix ms (NULL = sem expiração)
  decided_at    INTEGER,                              -- unix ms quando aprovou/rejeitou
  created_at    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_approvals_status
  ON project_approvals (status);

CREATE INDEX IF NOT EXISTS idx_project_approvals_project_slug
  ON project_approvals (project_slug);
