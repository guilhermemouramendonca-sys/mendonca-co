-- ════════════════════════════════════════════════════════════════
-- 012 — Financeiro: alinhamento de schema + melhorias
-- ════════════════════════════════════════════════════════════════

-- Contratos: adiciona colunas que o frontend usa
ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS tipo         text CHECK (tipo IN ('retainer','projeto','avulso')) DEFAULT 'retainer',
  ADD COLUMN IF NOT EXISTS valor_mensal numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacoes  text;

-- Preenche tipo a partir de recorrencia existente (best-effort)
UPDATE contratos SET tipo =
  CASE
    WHEN recorrencia = 'mensal' THEN 'retainer'
    WHEN recorrencia IN ('trimestral','semestral') THEN 'projeto'
    ELSE 'avulso'
  END
WHERE tipo IS NULL OR tipo = 'retainer';

-- Preenche valor_mensal a partir de valor_total para retainers
UPDATE contratos SET valor_mensal = valor_total
WHERE valor_mensal = 0 AND valor_total IS NOT NULL;

-- Cobranças: adiciona colunas que o frontend usa
ALTER TABLE cobrancas
  ADD COLUMN IF NOT EXISTS vencimento  date,
  ADD COLUMN IF NOT EXISTS descricao   text;

-- Preenche vencimento a partir de data_vencimento existente
UPDATE cobrancas SET vencimento = data_vencimento WHERE vencimento IS NULL AND data_vencimento IS NOT NULL;

-- RLS para propostas (caso não exista ainda)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'propostas'
  ) THEN
    ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
