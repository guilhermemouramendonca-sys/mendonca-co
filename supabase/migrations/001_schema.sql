-- ============================================================
-- SISTEMA MENDONÇA & CO — Schema completo
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CLIENTES (tenants)
-- ============================================================
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  razao_social VARCHAR,
  cnpj VARCHAR,
  setor VARCHAR,
  porte VARCHAR CHECK (porte IN ('micro', 'pequena', 'media', 'grande')),
  num_funcionarios INTEGER,
  faturamento_estimado VARCHAR,
  modelo_trabalho VARCHAR CHECK (modelo_trabalho IN ('presencial', 'remoto', 'hibrido')),
  data_inicio_contrato DATE,
  status VARCHAR DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'encerrado')),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- USUÁRIOS
-- ============================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  papel VARCHAR NOT NULL CHECK (papel IN ('admin', 'cliente_dono', 'cliente_lider', 'cliente_funcionario')),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LEADS
-- ============================================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  whatsapp VARCHAR,
  cargo VARCHAR,
  empresa VARCHAR,
  como_encontrou VARCHAR,
  origem VARCHAR NOT NULL,
  dados_extras JSONB,
  etapa VARCHAR DEFAULT 'novo' CHECK (etapa IN ('novo','contato','diagnostico','proposta','negociacao','fechado','perdido')),
  tipo_servico VARCHAR CHECK (tipo_servico IN ('mentoria_3d','palestra','diagnostico_board','mentoria_expressa')),
  valor_estimado DECIMAL,
  motivo_perda TEXT,
  proxima_acao TEXT,
  data_proxima_acao DATE,
  responsavel_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  convertido_em UUID REFERENCES clientes(id) ON DELETE SET NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INTERAÇÕES (leads e clientes)
-- ============================================================
CREATE TABLE interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('email','whatsapp','reuniao','ligacao','nota')),
  descricao TEXT NOT NULL,
  data TIMESTAMP DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ============================================================
-- CONTATOS DO CLIENTE
-- ============================================================
CREATE TABLE contatos_cliente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR NOT NULL,
  cargo VARCHAR,
  email VARCHAR,
  whatsapp VARCHAR,
  papel VARCHAR CHECK (papel IN ('socio','diretor','lider','outro')),
  principal BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- CONTRATOS
-- ============================================================
CREATE TABLE contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  tipo_servico VARCHAR NOT NULL,
  descricao TEXT,
  valor_total DECIMAL NOT NULL,
  recorrencia VARCHAR CHECK (recorrencia IN ('mensal','trimestral','semestral','avulso')),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status VARCHAR DEFAULT 'ativo' CHECK (status IN ('ativo','pausado','encerrado')),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- COBRANÇAS
-- ============================================================
CREATE TABLE cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  valor DECIMAL NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR DEFAULT 'pendente' CHECK (status IN ('pendente','pago','atrasado','cancelado')),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SESSÕES
-- ============================================================
CREATE TABLE sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('mentoria','board','diagnostico','workshop')),
  data TIMESTAMP NOT NULL,
  duracao_minutos INTEGER,
  anotacoes TEXT,
  proximos_passos TEXT,
  criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- FUNCIONÁRIOS
-- ============================================================
CREATE TABLE funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  nome VARCHAR NOT NULL,
  cargo VARCHAR NOT NULL,
  area VARCHAR,
  nivel VARCHAR CHECK (nivel IN ('operacional','tatico','estrategico')),
  data_admissao DATE,
  lider_id UUID REFERENCES funcionarios(id) ON DELETE SET NULL,
  ativo BOOLEAN DEFAULT TRUE,
  foto_url VARCHAR,
  email VARCHAR,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Vínculo líder → funcionários
CREATE TABLE lider_funcionarios (
  lider_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  PRIMARY KEY (lider_id, funcionario_id)
);

-- ============================================================
-- METAS (OKR / BSC)
-- ============================================================
CREATE TABLE metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo VARCHAR DEFAULT 'okr' CHECK (tipo IN ('okr','bsc')),
  objetivo TEXT NOT NULL,
  indicador TEXT,
  meta_valor DECIMAL,
  resultado_atual DECIMAL,
  unidade VARCHAR,
  periodo VARCHAR,
  status VARCHAR DEFAULT 'no_prazo' CHECK (status IN ('no_prazo','atencao','critico','atingido')),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PESQUISAS
-- ============================================================
CREATE TABLE pesquisa_convites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('disc','q12','gptw')),
  token VARCHAR UNIQUE NOT NULL DEFAULT gen_random_uuid()::VARCHAR,
  enviado_em TIMESTAMP DEFAULT NOW(),
  respondido_em TIMESTAMP,
  status VARCHAR DEFAULT 'pendente' CHECK (status IN ('pendente','respondido','expirado'))
);

CREATE TABLE pesquisa_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convite_id UUID REFERENCES pesquisa_convites(id) ON DELETE CASCADE NOT NULL,
  funcionario_id UUID REFERENCES funcionarios(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR NOT NULL CHECK (tipo IN ('disc','q12','gptw')),
  respostas JSONB NOT NULL,
  resultado JSONB,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- DIAGNÓSTICOS 3D
-- ============================================================
CREATE TABLE diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR NOT NULL CHECK (tipo IN ('captacao','interno')),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  respondente_nome VARCHAR,
  respondente_email VARCHAR,
  respostas JSONB NOT NULL,
  resultado JSONB,
  pdf_url VARCHAR,
  token VARCHAR UNIQUE DEFAULT gen_random_uuid()::VARCHAR,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- BASE DE CONHECIMENTO
-- ============================================================
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR NOT NULL,
  categoria VARCHAR NOT NULL CHECK (categoria IN ('ferramenta','metodologia','template','roteiro','referencia')),
  tipo VARCHAR NOT NULL CHECK (tipo IN ('texto','video','arquivo')),
  conteudo TEXT,
  video_url VARCHAR,
  arquivo_url VARCHAR,
  publico BOOLEAN DEFAULT FALSE,
  tags VARCHAR[],
  criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_leads_etapa ON leads(etapa);
CREATE INDEX idx_leads_criado_em ON leads(criado_em DESC);
CREATE INDEX idx_interacoes_lead ON interacoes(lead_id);
CREATE INDEX idx_interacoes_cliente ON interacoes(cliente_id);
CREATE INDEX idx_funcionarios_cliente ON funcionarios(cliente_id);
CREATE INDEX idx_funcionarios_lider ON funcionarios(lider_id);
CREATE INDEX idx_metas_cliente ON metas(cliente_id);
CREATE INDEX idx_cobrancas_vencimento ON cobrancas(data_vencimento);
CREATE INDEX idx_cobrancas_status ON cobrancas(status);
CREATE INDEX idx_pesquisa_convites_token ON pesquisa_convites(token);
CREATE INDEX idx_diagnosticos_token ON diagnosticos(token);

-- ============================================================
-- RLS — Row Level Security
-- ============================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesquisa_convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pesquisa_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- Helper: papel do usuário logado
CREATE OR REPLACE FUNCTION get_user_papel()
RETURNS VARCHAR AS $$
  SELECT papel FROM usuarios WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper: cliente_id do usuário logado
CREATE OR REPLACE FUNCTION get_user_cliente_id()
RETURNS UUID AS $$
  SELECT cliente_id FROM usuarios WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- CLIENTES: admin vê tudo; outros veem só o próprio
CREATE POLICY "clientes_select" ON clientes FOR SELECT
  USING (
    get_user_papel() = 'admin'
    OR id = get_user_cliente_id()
  );

CREATE POLICY "clientes_all_admin" ON clientes FOR ALL
  USING (get_user_papel() = 'admin');

-- LEADS: somente admin
CREATE POLICY "leads_admin" ON leads FOR ALL
  USING (get_user_papel() = 'admin');

-- FUNCIONÁRIOS: admin tudo; cliente_dono vê os do seu tenant
CREATE POLICY "funcionarios_select" ON funcionarios FOR SELECT
  USING (
    get_user_papel() = 'admin'
    OR cliente_id = get_user_cliente_id()
  );

CREATE POLICY "funcionarios_write_admin" ON funcionarios FOR ALL
  USING (get_user_papel() = 'admin');

-- METAS
CREATE POLICY "metas_select" ON metas FOR SELECT
  USING (
    get_user_papel() = 'admin'
    OR cliente_id = get_user_cliente_id()
  );

CREATE POLICY "metas_write_admin" ON metas FOR ALL
  USING (get_user_papel() = 'admin');

-- CONTRATOS / COBRANÇAS
CREATE POLICY "contratos_select" ON contratos FOR SELECT
  USING (
    get_user_papel() = 'admin'
    OR cliente_id = get_user_cliente_id()
  );

CREATE POLICY "contratos_write_admin" ON contratos FOR ALL
  USING (get_user_papel() = 'admin');

CREATE POLICY "cobrancas_select" ON cobrancas FOR SELECT
  USING (
    get_user_papel() = 'admin'
    OR cliente_id = get_user_cliente_id()
  );

CREATE POLICY "cobrancas_write_admin" ON cobrancas FOR ALL
  USING (get_user_papel() = 'admin');

-- DOCUMENTOS
CREATE POLICY "documentos_admin" ON documentos FOR ALL
  USING (get_user_papel() = 'admin');

CREATE POLICY "documentos_clientes_select" ON documentos FOR SELECT
  USING (publico = TRUE AND get_user_papel() != 'admin');

-- PESQUISAS — leitura pública via service role (rotas públicas usam service role)
CREATE POLICY "pesquisa_convites_admin" ON pesquisa_convites FOR ALL
  USING (get_user_papel() = 'admin');

CREATE POLICY "pesquisa_respostas_admin" ON pesquisa_respostas FOR ALL
  USING (get_user_papel() = 'admin');

-- DIAGNÓSTICOS — admin + inserção pública via service role
CREATE POLICY "diagnosticos_admin" ON diagnosticos FOR ALL
  USING (get_user_papel() = 'admin');

-- USUÁRIOS
CREATE POLICY "usuarios_select_own" ON usuarios FOR SELECT
  USING (id = auth.uid() OR get_user_papel() = 'admin');

CREATE POLICY "usuarios_write_admin" ON usuarios FOR ALL
  USING (get_user_papel() = 'admin');
