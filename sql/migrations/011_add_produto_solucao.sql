ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS produto_maturidade text,
  ADD COLUMN IF NOT EXISTS produto_descricao text;

