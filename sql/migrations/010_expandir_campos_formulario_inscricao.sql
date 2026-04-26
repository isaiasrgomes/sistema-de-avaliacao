ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS equipe_descricao text,
  ADD COLUMN IF NOT EXISTS equipe_quantidade_membros int,
  ADD COLUMN IF NOT EXISTS equipe_tempo_dedicacao text,
  ADD COLUMN IF NOT EXISTS equipe_participa_encontros text,
  ADD COLUMN IF NOT EXISTS mercado_problema text,
  ADD COLUMN IF NOT EXISTS mercado_conversou_clientes text,
  ADD COLUMN IF NOT EXISTS mercado_perfil_clientes text,
  ADD COLUMN IF NOT EXISTS mercado_estimativa_publico text,
  ADD COLUMN IF NOT EXISTS tecnologia_diferencial text,
  ADD COLUMN IF NOT EXISTS setor_aplicacao_lista text,
  ADD COLUMN IF NOT EXISTS setor_aplicacao_outro text;
