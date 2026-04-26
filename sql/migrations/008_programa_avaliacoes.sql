-- Prazo do programa, N avaliadores por proposta e limite de ordem ampliado (inclui avaliador extra por CV).

ALTER TABLE public.app_config
  ADD COLUMN IF NOT EXISTS programa_nome text,
  ADD COLUMN IF NOT EXISTS avaliacoes_inicio timestamptz,
  ADD COLUMN IF NOT EXISTS avaliacoes_fim timestamptz,
  ADD COLUMN IF NOT EXISTS prorrogacao_fim timestamptz,
  ADD COLUMN IF NOT EXISTS prorrogacao_utilizada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS avaliadores_por_projeto int NOT NULL DEFAULT 2;

ALTER TABLE public.app_config
  DROP CONSTRAINT IF EXISTS app_config_avaliadores_por_projeto_check;

ALTER TABLE public.app_config
  ADD CONSTRAINT app_config_avaliadores_por_projeto_check
  CHECK (avaliadores_por_projeto >= 1 AND avaliadores_por_projeto <= 15);

ALTER TABLE public.atribuicoes
  DROP CONSTRAINT IF EXISTS atribuicoes_ordem_check;

ALTER TABLE public.atribuicoes
  ADD CONSTRAINT atribuicoes_ordem_check
  CHECK (ordem >= 1 AND ordem <= 50);
