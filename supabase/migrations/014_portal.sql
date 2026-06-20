-- ════════════════════════════════════════════════════════════════
-- 014 — Portal do Cliente
-- ════════════════════════════════════════════════════════════════

-- Documentos compartilhados explicitamente com o cliente
CREATE TABLE IF NOT EXISTS compartilhamentos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id      uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  titulo          text NOT NULL,
  descricao       text,
  arquivo_url     text NOT NULL,
  tipo            text NOT NULL DEFAULT 'documento'
                    CHECK (tipo IN ('relatorio','diagnostico','radar360','pesquisa','canvas','proposta','plano_acao','documento','outro')),
  compartilhado_por uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em       timestamptz DEFAULT now()
);

ALTER TABLE compartilhamentos ENABLE ROW LEVEL SECURITY;

-- Interno: admin e cs podem gerenciar compartilhamentos
CREATE POLICY "compartilhamentos_interno" ON compartilhamentos
  FOR ALL USING (get_user_papel() IN ('admin', 'cs', 'consultor'));

-- Cliente: vê apenas os seus próprios
CREATE POLICY "compartilhamentos_cliente" ON compartilhamentos
  FOR SELECT USING (
    cliente_id IN (
      SELECT cliente_id FROM usuarios_clientes WHERE usuario_id = auth.uid()
    )
  );

-- Tabela que vincula usuários clientes ao seu cliente
CREATE TABLE IF NOT EXISTS usuarios_clientes (
  usuario_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id  uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, cliente_id)
);

ALTER TABLE usuarios_clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios_clientes_admin" ON usuarios_clientes
  FOR ALL USING (get_user_papel() IN ('admin', 'cs'));
CREATE POLICY "usuarios_clientes_self" ON usuarios_clientes
  FOR SELECT USING (usuario_id = auth.uid());

-- RLS portal: cliente vê só seu plano de ação
CREATE POLICY "plano_itens_cliente" ON itens_plano_acao
  FOR SELECT USING (
    get_user_papel() IN ('admin','consultor','cs')
    OR plano_id IN (
      SELECT pa.id FROM planos_acao pa
      JOIN usuarios_clientes uc ON uc.cliente_id = pa.cliente_id
      WHERE uc.usuario_id = auth.uid()
    )
  );

-- RLS portal: cliente vê info básica do seu cliente
CREATE POLICY "clientes_portal" ON clientes
  FOR SELECT USING (
    get_user_papel() IN ('admin','consultor','cs','closer','sdr')
    OR id IN (
      SELECT cliente_id FROM usuarios_clientes WHERE usuario_id = auth.uid()
    )
  );

-- RLS portal: cliente vê suas sessões
CREATE POLICY "sessoes_cliente" ON sessoes
  FOR SELECT USING (
    get_user_papel() IN ('admin','consultor','cs')
    OR cliente_id IN (
      SELECT cliente_id FROM usuarios_clientes WHERE usuario_id = auth.uid()
    )
  );
