-- ════════════════════════════════════════════════════════════════
-- 013 — Módulo de Turmas / Educação
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS turmas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            text NOT NULL,
  descricao       text,
  tipo            text NOT NULL DEFAULT 'workshop'
                    CHECK (tipo IN ('workshop','mentoria_grupo','curso','palestra','imersao')),
  modalidade      text NOT NULL DEFAULT 'presencial'
                    CHECK (modalidade IN ('presencial','online','hibrido')),
  data_inicio     date,
  data_fim        date,
  vagas           int NOT NULL DEFAULT 20,
  preco           numeric(12,2),
  status          text NOT NULL DEFAULT 'rascunho'
                    CHECK (status IN ('rascunho','inscricoes_abertas','em_andamento','encerrada','cancelada')),
  local           text,
  link_online     text,
  responsavel_id  uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS turma_alunos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id    uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  email       text NOT NULL,
  empresa     text,
  cargo       text,
  whatsapp    text,
  status      text NOT NULL DEFAULT 'inscrito'
                CHECK (status IN ('inscrito','confirmado','em_andamento','concluido','cancelado','desistente')),
  pago        boolean DEFAULT false,
  valor_pago  numeric(12,2),
  data_inscricao timestamptz DEFAULT now(),
  UNIQUE (turma_id, email)
);

CREATE TABLE IF NOT EXISTS turma_aulas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id        uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  titulo          text NOT NULL,
  descricao       text,
  data            timestamptz NOT NULL,
  duracao_minutos int DEFAULT 90,
  material_url    text,
  notas           text,
  realizada       boolean DEFAULT false,
  criado_em       timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE turmas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE turma_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turma_aulas  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "turmas_leitura"    ON turmas       FOR SELECT USING (get_user_papel() IN ('admin','consultor','cs'));
CREATE POLICY "turmas_escrita"    ON turmas       FOR ALL    USING (get_user_papel() IN ('admin','consultor'));
CREATE POLICY "alunos_leitura"    ON turma_alunos FOR SELECT USING (get_user_papel() IN ('admin','consultor','cs'));
CREATE POLICY "alunos_escrita"    ON turma_alunos FOR ALL    USING (get_user_papel() IN ('admin','consultor'));
CREATE POLICY "aulas_leitura"     ON turma_aulas  FOR SELECT USING (get_user_papel() IN ('admin','consultor','cs'));
CREATE POLICY "aulas_escrita"     ON turma_aulas  FOR ALL    USING (get_user_papel() IN ('admin','consultor'));
