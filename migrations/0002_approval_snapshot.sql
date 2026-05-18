-- Snapshot do projeto no momento que o link de aprovação é gerado.
-- Garante que o cliente aprova/rejeita a versão exata enviada,
-- não a versão atual do Keystatic (que pode ter mudado).
ALTER TABLE project_approvals ADD COLUMN project_title    TEXT;
ALTER TABLE project_approvals ADD COLUMN project_summary  TEXT;
ALTER TABLE project_approvals ADD COLUMN project_html     TEXT;
