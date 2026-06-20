-- ════════════════════════════════════════════════════════════════
-- 009 — Equipe interna: novos papéis + responsável em clientes
-- ════════════════════════════════════════════════════════════════

-- Adicionar papéis internos na constraint de papel
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_papel_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_papel_check
  CHECK (papel IN (
    'admin',            -- Guilherme — acesso total
    'consultor',        -- Oscar — vê sua carteira + diagnosticos
    'cs',               -- Natalia — vê todos os clientes + financeiro
    'sdr',              -- SDR — vê apenas leads
    'closer',           -- Closer — vê leads em proposta/negociação
    'cliente_dono',
    'cliente_lider',
    'cliente_funcionario'
  ));

-- Adicionar campos de perfil
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS cargo       text,
  ADD COLUMN IF NOT EXISTS avatar_url  text,
  ADD COLUMN IF NOT EXISTS whatsapp    text;

-- Responsável em clientes (para "minha carteira" do consultor)
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES usuarios(id) ON DELETE SET NULL;

-- Responsável em sessoes (para consultor ver só as suas)
ALTER TABLE sessoes
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES usuarios(id) ON DELETE SET NULL;

-- ── RLS: consultor vê só seus clientes ──────────────────────────
-- (admin e CS continuam vendo tudo)

-- Clientes: admin/cs veem tudo; consultor vê só os seus
DROP POLICY IF EXISTS "clientes_leitura" ON clientes;
CREATE POLICY "clientes_leitura" ON clientes FOR SELECT
  USING (
    get_user_papel() IN ('admin', 'cs', 'closer')
    OR (get_user_papel() = 'consultor' AND responsavel_id = auth.uid())
  );

DROP POLICY IF EXISTS "clientes_escrita" ON clientes;
CREATE POLICY "clientes_escrita" ON clientes FOR ALL
  USING (get_user_papel() IN ('admin', 'cs'));

-- Leads: admin/closer/sdr veem tudo; consultor vê os seus
DROP POLICY IF EXISTS "leads_leitura" ON leads;
CREATE POLICY "leads_leitura" ON leads FOR SELECT
  USING (
    get_user_papel() IN ('admin', 'closer', 'cs')
    OR (get_user_papel() IN ('sdr', 'consultor') AND (responsavel_id = auth.uid() OR responsavel_id IS NULL))
  );

DROP POLICY IF EXISTS "leads_escrita" ON leads;
CREATE POLICY "leads_escrita" ON leads FOR ALL
  USING (get_user_papel() IN ('admin', 'closer', 'sdr', 'consultor'));

-- ── Helper: papel do usuário logado (já existia, garantir) ──────
CREATE OR REPLACE FUNCTION get_user_papel()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT papel FROM usuarios WHERE id = auth.uid();
$$;

-- Helper: é membro interno?
CREATE OR REPLACE FUNCTION is_membro_interno()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT papel IN ('admin','consultor','cs','sdr','closer')
  FROM usuarios WHERE id = auth.uid();
$$;
