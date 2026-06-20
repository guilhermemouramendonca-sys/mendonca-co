-- ════════════════════════════════════════════════════════════════
-- 010 — SDR View: origens estruturadas + cadência + meta semanal
-- ════════════════════════════════════════════════════════════════

-- Canal de origem padronizado nos leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS canal text CHECK (canal IN (
    'linkedin', 'indicacao', 'evento', 'organico',
    'instagram', 'google', 'whatsapp_ativo', 'email_frio', 'outro'
  ));

-- Meta semanal de prospecção (configurável pelo admin)
CREATE TABLE IF NOT EXISTS sdr_metas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semana_iso  text NOT NULL UNIQUE, -- ex: "2025-W25"
  meta_leads  int NOT NULL DEFAULT 10,
  responsavel_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em   timestamptz DEFAULT now()
);

ALTER TABLE sdr_metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_sdr_metas" ON sdr_metas USING (get_user_papel() IN ('admin', 'sdr', 'closer'));

-- Cadência por lead (registro de tentativas de contato)
CREATE TABLE IF NOT EXISTS lead_cadencia (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  dia         int NOT NULL, -- 0, 3, 7 (dias da cadência)
  canal       text NOT NULL CHECK (canal IN ('whatsapp', 'email', 'ligacao', 'linkedin')),
  status      text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'feito', 'sem_resposta', 'pulado')),
  feito_em    timestamptz,
  nota        text,
  criado_em   timestamptz DEFAULT now(),
  UNIQUE (lead_id, dia)
);

ALTER TABLE lead_cadencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "membro_cadencia" ON lead_cadencia
  USING (get_user_papel() IN ('admin', 'sdr', 'closer', 'consultor'));
