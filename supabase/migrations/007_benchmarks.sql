-- ════════════════════════════════════════════════════════
-- 007 — Benchmark System
-- ════════════════════════════════════════════════════════

-- Referências de mercado (dados estáticos, seed manual)
CREATE TABLE IF NOT EXISTS benchmark_referencias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        text NOT NULL,           -- q12 | gptw | diagnostico_3d | radar_360
  categoria   text,                    -- varejo | ecommerce | industria | …
  segmento    text,                    -- moda | suplementos | cosmeticos | …
  porte       text,                    -- micro | pequena | media | grande
  metrica     text NOT NULL,           -- percentual_geral | trust_index | score_geral | dimensao_*
  valor       numeric(5,1) NOT NULL,
  fonte       text NOT NULL,
  ano         int NOT NULL,
  notas       text,
  criado_em   timestamptz DEFAULT now()
);

-- Snapshots calculados automaticamente (quinzenal)
CREATE TABLE IF NOT EXISTS benchmark_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo             text NOT NULL,
  categoria        text,
  segmento         text,
  porte            text,
  metrica          text NOT NULL,
  valor            numeric(5,1) NOT NULL,
  total_amostras   int NOT NULL DEFAULT 0,
  calculado_em     timestamptz NOT NULL
);

-- Campos de setor nas tabelas de diagnóstico
ALTER TABLE diagnosticos
  ADD COLUMN IF NOT EXISTS categoria       text,
  ADD COLUMN IF NOT EXISTS segmento        text,
  ADD COLUMN IF NOT EXISTS faturamento_faixa text;

ALTER TABLE radar360
  ADD COLUMN IF NOT EXISTS categoria       text,
  ADD COLUMN IF NOT EXISTS segmento        text,
  ADD COLUMN IF NOT EXISTS faturamento_faixa text;

ALTER TABLE pesquisas
  ADD COLUMN IF NOT EXISTS categoria       text,
  ADD COLUMN IF NOT EXISTS segmento        text,
  ADD COLUMN IF NOT EXISTS faturamento_faixa text;

ALTER TABLE canvas_estrategico
  ADD COLUMN IF NOT EXISTS categoria       text,
  ADD COLUMN IF NOT EXISTS segmento        text,
  ADD COLUMN IF NOT EXISTS faturamento_faixa text;

-- RLS: leitura pública (dados agregados, sem PII)
ALTER TABLE benchmark_referencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_snapshots   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura_publica_referencias" ON benchmark_referencias FOR SELECT USING (true);
CREATE POLICY "leitura_publica_snapshots"   ON benchmark_snapshots   FOR SELECT USING (true);

-- ════════════════════════════════════════════════════════
-- SEED — Referências de mercado consolidadas
-- Fontes: Gallup (2023-2024), GPTW Brasil (2024),
--         Engaja S/A (2023), Sebrae (2022)
-- ════════════════════════════════════════════════════════

INSERT INTO benchmark_referencias (tipo, categoria, segmento, porte, metrica, valor, fonte, ano, notas) VALUES

-- ── Q12 — ENGAJAMENTO BRASIL ─────────────────────────────────────────────────

-- Brasil geral
('q12', NULL, NULL, NULL, 'percentual_geral', 44,
 'Gallup State of the Global Workplace', 2024,
 'Brasil: 44% dos trabalhadores engajados — média global 23%'),

-- Por categoria
('q12', 'tecnologia',   NULL, NULL, 'percentual_geral', 52,
 'Gallup / Engaja S/A', 2023,
 'Setor de TI tende a maior engajamento no Brasil'),
('q12', 'saude',        NULL, NULL, 'percentual_geral', 41,
 'Engaja S/A', 2023,
 'Saúde inclui hospitais, clínicas e planos'),
('q12', 'educacao',     NULL, NULL, 'percentual_geral', 38,
 'Engaja S/A', 2023,
 'Educação formal e cursos livres'),
('q12', 'varejo',       NULL, NULL, 'percentual_geral', 39,
 'Engaja S/A / Gallup', 2023,
 'Varejo físico brasileiro'),
('q12', 'ecommerce',    NULL, NULL, 'percentual_geral', 46,
 'Engaja S/A', 2023,
 'E-commerce e marketplace'),
('q12', 'industria',    NULL, NULL, 'percentual_geral', 40,
 'Gallup', 2023,
 'Indústria de transformação'),
('q12', 'financeiro',   NULL, NULL, 'percentual_geral', 48,
 'Engaja S/A', 2023,
 'Bancos, fintechs e seguradoras'),
('q12', 'agronegocio',  NULL, NULL, 'percentual_geral', 43,
 'Sebrae / Engaja S/A', 2022,
 'Agronegócio e agroindústria'),
('q12', 'logistica',    NULL, NULL, 'percentual_geral', 36,
 'Gallup', 2023,
 'Transporte, armazenagem e logística'),
('q12', 'servicos',     NULL, NULL, 'percentual_geral', 42,
 'Engaja S/A', 2023,
 'Serviços em geral (B2B e B2C)'),
('q12', 'construcao',   NULL, NULL, 'percentual_geral', 35,
 'Gallup', 2023,
 'Construção civil'),
('q12', 'consultoria',  NULL, NULL, 'percentual_geral', 50,
 'Engaja S/A', 2023,
 'Consultorias e serviços profissionais'),

-- Por porte (Sebrae + Gallup Brasil)
('q12', NULL, NULL, 'micro',    'percentual_geral', 47,
 'Sebrae', 2022,
 'Microempresas (até 9 funcionários) — maior proximidade com dono'),
('q12', NULL, NULL, 'pequena',  'percentual_geral', 44,
 'Sebrae', 2022,
 'Pequenas empresas (10-49 funcionários)'),
('q12', NULL, NULL, 'media',    'percentual_geral', 42,
 'Sebrae / Gallup', 2022,
 'Médias empresas (50-299 funcionários)'),
('q12', NULL, NULL, 'grande',   'percentual_geral', 40,
 'Gallup', 2023,
 'Grandes empresas (300+ funcionários) — mais burocracia'),

-- ── GPTW — TRUST INDEX BRASIL ────────────────────────────────────────────────

-- Brasil geral (certificadas GPTW vs mercado aberto)
('gptw', NULL, NULL, NULL, 'trust_index', 70,
 'GPTW Brasil — Ranking 2024', 2024,
 'Média das empresas certificadas GPTW Brasil'),
('gptw', NULL, NULL, NULL, 'trust_index', 55,
 'GPTW Brasil — Pesquisa Mercado', 2024,
 'Estimativa mercado não-certificado Brasil'),

-- Por categoria (GPTW Melhores Empresas 2024)
('gptw', 'tecnologia',  NULL, NULL, 'trust_index', 76,
 'GPTW Brasil', 2024,
 'TI lidera rankings GPTW no Brasil'),
('gptw', 'financeiro',  NULL, NULL, 'trust_index', 74,
 'GPTW Brasil', 2024,
 'Fintechs e bancos digitais puxam média'),
('gptw', 'saude',       NULL, NULL, 'trust_index', 68,
 'GPTW Brasil', 2024, NULL),
('gptw', 'educacao',    NULL, NULL, 'trust_index', 65,
 'GPTW Brasil', 2024, NULL),
('gptw', 'varejo',      NULL, NULL, 'trust_index', 62,
 'GPTW Brasil', 2024, NULL),
('gptw', 'ecommerce',   NULL, NULL, 'trust_index', 64,
 'GPTW Brasil', 2024, NULL),
('gptw', 'industria',   NULL, NULL, 'trust_index', 61,
 'GPTW Brasil', 2024, NULL),
('gptw', 'logistica',   NULL, NULL, 'trust_index', 59,
 'GPTW Brasil', 2024, NULL),
('gptw', 'agronegocio', NULL, NULL, 'trust_index', 60,
 'GPTW Brasil', 2024, NULL),
('gptw', 'construcao',  NULL, NULL, 'trust_index', 57,
 'GPTW Brasil', 2024, NULL),
('gptw', 'servicos',    NULL, NULL, 'trust_index', 63,
 'GPTW Brasil', 2024, NULL),
('gptw', 'consultoria', NULL, NULL, 'trust_index', 72,
 'GPTW Brasil', 2024, NULL),

-- Dimensões GPTW (médias das certificadas)
('gptw', NULL, NULL, NULL, 'dimensao_credibilidade',   71, 'GPTW Brasil', 2024, NULL),
('gptw', NULL, NULL, NULL, 'dimensao_respeito',        68, 'GPTW Brasil', 2024, NULL),
('gptw', NULL, NULL, NULL, 'dimensao_imparcialidade',  65, 'GPTW Brasil', 2024, NULL),
('gptw', NULL, NULL, NULL, 'dimensao_orgulho',         75, 'GPTW Brasil', 2024, NULL),
('gptw', NULL, NULL, NULL, 'dimensao_camaradagem',     72, 'GPTW Brasil', 2024, NULL),

-- Por porte (GPTW publica rankings por porte)
('gptw', NULL, NULL, 'micro',   'trust_index', 66,
 'GPTW Brasil — Melhores PMEs', 2024, NULL),
('gptw', NULL, NULL, 'pequena', 'trust_index', 68,
 'GPTW Brasil — Melhores PMEs', 2024, NULL),
('gptw', NULL, NULL, 'media',   'trust_index', 70,
 'GPTW Brasil', 2024, NULL),
('gptw', NULL, NULL, 'grande',  'trust_index', 73,
 'GPTW Brasil — Top 100', 2024,
 'Grandes empresas com programas estruturados'),

-- ── E-COMMERCE ESPECÍFICO (Fórum E-commerce Brasil 2024) ─────────────────────

('q12',   'ecommerce', 'moda',       NULL, 'percentual_geral', 48,
 'Fórum E-commerce Brasil / Engaja S/A', 2024,
 'Moda & vestuário no e-commerce'),
('q12',   'ecommerce', 'cosmeticos', NULL, 'percentual_geral', 49,
 'Fórum E-commerce Brasil', 2024, NULL),
('q12',   'ecommerce', 'suplementos',NULL, 'percentual_geral', 45,
 'Fórum E-commerce Brasil', 2024, NULL),
('gptw',  'ecommerce', 'moda',       NULL, 'trust_index', 63,
 'GPTW Brasil / setor varejo online', 2024, NULL),

-- ── VAREJO FÍSICO ─────────────────────────────────────────────────────────────

('q12',  'varejo', 'farmacia',   NULL, 'percentual_geral', 41,
 'Engaja S/A', 2023, NULL),
('q12',  'varejo', 'alimentacao',NULL, 'percentual_geral', 37,
 'Engaja S/A', 2023,
 'Supermercados e alimentação'),
('gptw', 'varejo', 'farmacia',   NULL, 'trust_index', 64,
 'GPTW Brasil', 2024, NULL)

ON CONFLICT DO NOTHING;
