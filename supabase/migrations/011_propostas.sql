-- ════════════════════════════════════════════════════════════════
-- 011 — Propostas comerciais
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS propostas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid REFERENCES leads(id) ON DELETE SET NULL,
  cliente_id      uuid REFERENCES clientes(id) ON DELETE SET NULL,
  numero          serial,                          -- ex: 001/2025
  nome_prospect   text NOT NULL,
  empresa         text,
  email           text,
  servico         text NOT NULL,                   -- mentoria_3d | diagnostico_board | etc
  descricao       text,                            -- escopo personalizado
  valor           numeric(12,2),
  condicao_pagamento text,                         -- à vista | 3x | mensal
  validade_dias   int NOT NULL DEFAULT 15,
  status          text NOT NULL DEFAULT 'rascunho'
                    CHECK (status IN ('rascunho','enviada','aceita','recusada','expirada')),
  pdf_url         text,
  observacoes     text,
  criado_por      uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now()
);

ALTER TABLE propostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "propostas_leitura" ON propostas FOR SELECT
  USING (get_user_papel() IN ('admin','consultor','cs','closer'));
CREATE POLICY "propostas_escrita" ON propostas FOR ALL
  USING (get_user_papel() IN ('admin','consultor','closer'));
