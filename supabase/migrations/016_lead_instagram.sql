-- Adiciona instagram aos leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS instagram text;
