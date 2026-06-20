-- Adiciona setor na tabela rodadas para propagar para as pesquisas dos respondentes
ALTER TABLE rodadas
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS segmento  text;
