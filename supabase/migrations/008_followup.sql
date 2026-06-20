-- Agendamentos de follow-up automático (30/60/90 dias)
CREATE TABLE IF NOT EXISTS followup_agendados (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referencia_tipo text NOT NULL,   -- disc | q12 | gptw | diagnostico_3d | radar_360 | canvas | rodada_q12 | rodada_gptw
  referencia_id   text NOT NULL,
  nome            text NOT NULL,
  email           text NOT NULL,
  empresa         text,
  dias            int NOT NULL,    -- 30, 60 ou 90
  pdf_url         text,
  enviar_em       date NOT NULL,
  enviado         boolean DEFAULT false,
  enviado_em      timestamptz,
  criado_em       timestamptz DEFAULT now(),
  UNIQUE (referencia_id, dias)
);

ALTER TABLE followup_agendados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_followup" ON followup_agendados USING (get_user_papel() = 'admin');
