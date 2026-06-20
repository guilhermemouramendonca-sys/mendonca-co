-- Pré-cadastro de membros antes do convite ser enviado
CREATE TABLE IF NOT EXISTS membros_equipe_pendentes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  email       text NOT NULL UNIQUE,
  papel       text NOT NULL,
  cargo       text,
  whatsapp    text,
  convite_enviado boolean DEFAULT false,
  convite_enviado_em timestamptz,
  criado_em   timestamptz DEFAULT now()
);

ALTER TABLE membros_equipe_pendentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_pendentes" ON membros_equipe_pendentes
  USING (get_user_papel() = 'admin');
